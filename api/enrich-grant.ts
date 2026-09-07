// api/enrich-grant.ts
// ============================================================
// VERCEL FUNCTION — Grant URL Enrichment (Reader + Strict Extractor).
// 1) Fetches the grant page through the Jina Reader (r.jina.ai/<url>),
//    which returns clean markdown instead of raw HTML.
// 2) Sends that text to a STRICT extraction LLM (OpenAI or Anthropic,
//    whichever key is configured) with an anti-hallucination system
//    prompt and a fixed JSON schema.
// 3) Validates/normalises the returned JSON (no hallucinated fields —
//    anything missing becomes null / "Not specified in source") and
//    returns the structured grant object.
// Env keys (Vercel): OPENAI_API_KEY or ANTHROPIC_API_KEY.
// ============================================================

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const MAX_TEXT_CHARS = 120000;
const FETCH_TIMEOUT_MS = 45000;

/** Strict JSON schema (plain object; mirrored in the system prompt) */
const SCHEMA_HINT = `{
  "grant_id": "string|null", "grant_title": "string|null", "funder_donor": "string|null", "funder_type": "string|null", "programme_window": "string|null",
  "thematic_focus": "string|null", "geographic_scope": "string|null", "what_it_funds_abstract": "string|null",
  "date_posted": "string|null (prefer ISO yyyy-mm-dd when the page states it)", "call_opened": "string|null", "submission_deadline": "string|null (prefer ISO yyyy-mm-dd or 'dd Month yyyy')", "deadline_time_zone": "string|null", "days_to_deadline": "number|null (only if you can compute it from the text; else null)", "deadline_status": "string|null (Open | Closing soon | Closed | Not specified in source)",
  "award_value_ceiling": "string|null (exact figure as stated, e.g. '€1,500,000')", "currency": "string|null (EUR|USD|UGX|GBP|Other as stated)", "project_duration": "string|null", "co_funding_or_in_kind": "string|null",
  "eligible_applicant_type": "string|null (e.g. 'non-profit organisations; universities; SMEs')", "consortium_allowed": "string|null (Yes | No | Conditional | Not specified in source)", "key_eligibility_requirements": ["string (one literal requirement per entry)"], "required_documents": ["string (one literal document per entry)"],
  "how_to_submit": "string|null", "contact_for_queries": "string|null", "source_link": "string|null",
  "our_eligibility_status": "null (internal field — leave null)", "eligibility_gap_or_condition": "null (internal field — leave null)",
  "proposed_lead_entity": "null (internal field — leave null)", "person_allocated_to": "null (internal field — leave null)",
  "application_stage": "null (internal field — leave null)", "priority": "null (internal field — leave null)", "fit_score_1_to_5": "null (internal field — leave null)"
}`;

const STRICT_SYSTEM_PROMPT = `You are a strict, literal data extraction engine. Extract the requested fields from the provided text.
RULES:
1. ONLY use information explicitly stated in the text.
2. If a field is not found, you MUST return null or "Not specified in source".
3. DO NOT guess, infer, calculate, or use outside knowledge.
4. Return ONLY valid JSON matching the provided schema (no markdown fences, no commentary).

Schema:
${SCHEMA_HINT}`;

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function cleanJson(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  const stripped = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('The model did not return a JSON object.');
  return JSON.parse(stripped.slice(start, end + 1)) as Record<string, unknown>;
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() && v.trim().toLowerCase() !== 'not specified in source' ? v.trim() : null);
const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean).slice(0, 40) : [];

function normalizeGrant(raw: Record<string, unknown>, url: string) {
  const now = Date.now();
  let days: number | null = null;
  let status: string | null = null;
  const deadline = str(raw.submission_deadline);
  if (deadline) {
    const t = new Date(deadline).getTime();
    if (!Number.isNaN(t)) {
      days = Math.max(0, Math.ceil((t - now) / 86400000));
      status = days === 0 ? 'Closing today' : days <= 14 ? 'Closing soon' : 'Open';
    }
  }
  const fit = raw.fit_score_1_to_5;
  const fitNum = typeof fit === 'number' && Number.isFinite(fit) ? Math.min(5, Math.max(1, Math.round(fit))) : null;
  const stage = str(raw.application_stage);
  const okStage = ['Identified', 'Scoping', 'Drafting', 'Internal review', 'Submitted'].includes(stage ?? '') ? stage : null;
  const elig = str(raw.our_eligibility_status);
  const okElig = ['Eligible', 'Conditional', 'Not eligible', 'Not assessed'].includes(elig ?? '') ? elig : null;
  const prio = str(raw.priority);
  const okPrio = ['High', 'Medium', 'Low'].includes(prio ?? '') ? prio : null;

  return {
    grant_id: str(raw.grant_id),
    grant_title: str(raw.grant_title),
    funder_donor: str(raw.funder_donor),
    funder_type: str(raw.funder_type),
    programme_window: str(raw.programme_window),
    thematic_focus: str(raw.thematic_focus),
    geographic_scope: str(raw.geographic_scope),
    what_it_funds_abstract: str(raw.what_it_funds_abstract),
    date_posted: str(raw.date_posted),
    call_opened: str(raw.call_opened),
    submission_deadline: deadline,
    deadline_time_zone: str(raw.deadline_time_zone),
    days_to_deadline: days,
    deadline_status: str(raw.deadline_status) ?? status,
    award_value_ceiling: str(raw.award_value_ceiling),
    currency: str(raw.currency),
    project_duration: str(raw.project_duration),
    co_funding_or_in_kind: str(raw.co_funding_or_in_kind),
    eligible_applicant_type: str(raw.eligible_applicant_type),
    consortium_allowed: str(raw.consortium_allowed),
    key_eligibility_requirements: strList(raw.key_eligibility_requirements),
    required_documents: strList(raw.required_documents),
    how_to_submit: str(raw.how_to_submit),
    contact_for_queries: str(raw.contact_for_queries),
    source_link: str(raw.source_link) ?? url,
    our_eligibility_status: okElig,
    eligibility_gap_or_condition: str(raw.eligibility_gap_or_condition),
    proposed_lead_entity: str(raw.proposed_lead_entity),
    person_allocated_to: str(raw.person_allocated_to),
    application_stage: okStage,
    priority: okPrio,
    fit_score_1_to_5: fitNum,
  };
}

async function fetchCleanMarkdown(url: string): Promise<{ text: string } | { error: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, {
      headers: { Accept: 'text/markdown', 'X-Return-Format': 'markdown', 'X-No-Cache': 'true' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      return { error: `Could not read the page (HTTP ${res.status}). The site may be unreachable or blocked.` };
    }
    const text = await res.text();
    if (!text || text.trim().length < 40) return { error: 'The page returned no readable content.' };
    return { text: text.slice(0, MAX_TEXT_CHARS) };
  } catch (err) {
    return { error: err instanceof Error && err.name === 'AbortError' ? 'Fetch timed out reading the page.' : 'Failed to reach the page reader.' };
  }
}

async function runExtraction(text: string): Promise<{ grant: Record<string, unknown>; provider: string }> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (anthropicKey) {
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: STRICT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Grant page text (markdown):\n\n${text}` }],
    });
    const content = response.content.map((c) => ('text' in c ? c.text : '')).join('');
    return { grant: cleanJson(content), provider: 'claude-sonnet-4-20250514' };
  }

  if (openaiKey) {
    const openai = new OpenAI({ apiKey: openaiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: STRICT_SYSTEM_PROMPT },
        { role: 'user', content: `Grant page text (markdown):\n\n${text}` },
      ],
    });
    const reply = completion.choices[0]?.message?.content ?? '';
    if (!reply) throw new Error('The model returned an empty response.');
    return { grant: cleanJson(reply), provider: 'gpt-4o-mini' };
  }

  throw new Error('No LLM provider key configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in Vercel to use grant enrichment.');
}

export default async function handler(req: unknown, res: unknown) {
  const response = res as { setHeader: (k: string, v: string) => void; status: (n: number) => { json: (b: unknown) => void } };
  const request = req as { method?: string; body?: unknown };
  Object.entries(corsHeaders()).forEach(([k, v]) => response.setHeader(k, v));

  if (request.method === 'OPTIONS') {
    response.status(200).json({ ok: true });
    return;
  }
  if (request.method !== 'POST') {
    response.status(405).json({ ok: false, error: 'Method Not Allowed — send a POST with a JSON body { "url": "https://…" }.' });
    return;
  }

  try {
    const body = (request.body ?? {}) as { url?: unknown };
    const rawUrl = typeof body.url === 'string' ? body.url.trim() : '';
    let url: string;
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('bad protocol');
      url = parsed.href;
    } catch {
      response.status(400).json({ ok: false, error: 'Invalid URL — provide a valid http(s) grant page link.' });
      return;
    }

    const fetched = await fetchCleanMarkdown(url);
    if ('error' in fetched) {
      response.status(502).json({ ok: false, error: fetched.error });
      return;
    }

    const { grant, provider } = await runExtraction(fetched.text);
    const normalized = normalizeGrant(grant, url);
    response.status(200).json({
      ok: true,
      grant: normalized,
      meta: { url, fetched_chars: fetched.text.length, provider, source: 'llm', fetched_at: new Date().toISOString() },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error during enrichment.';
    response.status(err instanceof Error && message.startsWith('No LLM provider') ? 501 : 500).json({ ok: false, error: message });
  }
}
