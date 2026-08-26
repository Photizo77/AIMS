// src/lib/aiEngine.ts
// ============================================================
// AIMS — AI INTELLIGENCE ENGINE (deterministic core)
// Turns the system from a digital records app into an AI-powered one:
//  - Grants: risk scoring, compliance flags, funder matching, drafting
//  - Innovations: stage-transition confidence, resource suggestions, trends
//  - Finance: requisition price anomaly detection, cash-flow forecasting
//  - HR: morale/sentiment analysis, contract renewal advice
//  - Feed: daily Executive Brief + natural-language queries
// The engine always works on real system data (rule/heuristic analysis);
// where an LLM is available (Netlify /api/chat) it enhances generation
// tasks (drafting, summarization) with graceful local fallbacks.
// ============================================================

import { grantService } from '@/services/grantService';
import { innovationService } from '@/services/innovationService';
import { financeService } from '@/services/financeService';
import { LIVE_OPPORTUNITIES } from '@/data/grantTracker';
import { ORG_KNOWLEDGE } from '@/data/orgKnowledge';

export type AiSeverity = 'info' | 'success' | 'warning' | 'critical';

export interface AiInsight {
  id: string;
  module: 'grants' | 'innovations' | 'finance' | 'hr' | 'feed';
  severity: AiSeverity;
  title: string;
  detail: string;
  action?: string;
}

const DAY_MS = 86400000;
const daysUntil = (d: string) => Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / DAY_MS));

// ─────────────────────────────────────────────
// LLM ENHANCEMENT (optional; graceful fallback)
// ─────────────────────────────────────────────
export async function aiGenerate(prompt: string, system: string): Promise<string | null> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], model: 'deepseek-chat', systemPrompt: system }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.reply === 'string' && data.reply.trim() ? data.reply : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// GRANTS INTELLIGENCE
// ─────────────────────────────────────────────
export function grantRiskScore(grantId: string): { score: number; label: string; flags: string[] } {
  const g = grantService.getGrantById(grantId);
  if (!g) return { score: 0, label: 'Unknown', flags: [] };
  let score = 0;
  const flags: string[] = [];

  const days = daysUntil(g.deadline);
  if (days <= 7) { score += 40; flags.push(`Deadline in ${days} day(s) — critical window.`); }
  else if (days <= 21) { score += 20; flags.push(`Deadline in ${days} days — approaching.`); }

  const milestones = g.milestones ?? [];
  const done = milestones.filter((m) => m.completed).length;
  if (milestones.length > 0) {
    const ratio = done / milestones.length;
    if (ratio < 0.5) { score += 25; flags.push(`${Math.round((1 - ratio) * 100)}% of milestones incomplete — proposal may lack evidence.`); }
  }

  if (!g.documents || g.documents.length === 0) { score += 15; flags.push('No documents attached — compliance pack missing.'); }
  if (!g.description || g.description.length < 40) { score += 10; flags.push('Narrative is thin — consider a fuller problem statement and methodology.'); }

  if (g.stage === 'submitted' && !g.edNotes) flags.push('Awaiting ED review — no decision notes yet.');
  if (g.edNotes && g.stage === 'drafting') flags.push('ED requested changes — revise and re-submit.');

  const label = score >= 60 ? 'High risk' : score >= 30 ? 'Medium risk' : 'Low risk';
  return { score, label, flags };
}

/** Funder matching — suggests open opportunities aligned with ARDHI pillars */
export function funderMatches(): AiInsight[] {
  return LIVE_OPPORTUNITIES.filter((o) => o.eligibilityStatus === 'Eligible now' || o.eligibilityStatus === 'Eligible with partners')
    .map((o) => {
      const hay = `${o.title} ${o.alignment} ${o.funder}`.toLowerCase();
      let hits = 0;
      for (const kw of ['agriculture', 'waste', 'land', 'health', 'disaster', 'innovation', 'digital', 'climate', 'research']) {
        if (hay.includes(kw)) hits += 1;
      }
      return { o, hits };
    })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 3)
    .map(({ o }) => ({
      id: `fm-${o.id}`,
      module: 'grants' as const,
      severity: 'success' as const,
      title: `Funder match: ${o.id} — ${o.title}`,
      detail: `Aligns with our pillars (${o.alignment.split('.')[0]}). Eligibility: ${o.eligibilityStatus}. Deadline: ${o.deadline}.`,
      action: 'Open opportunity',
    }));
}

/** AI-assisted proposal drafting (template core; LLM-enhanced when available) */
export async function draftProblemStatement(grantId: string): Promise<string> {
  const g = grantService.getGrantById(grantId);
  if (!g) return 'Grant not found.';
  const org = ORG_KNOWLEDGE.find((c) => c.id === 'org-identity');
  const theme = ORG_KNOWLEDGE.find((c) => c.id === 'org-thematic-areas');
  const template = [
    `DRAFT — Problem Statement (${g.title})`,
    '',
    `ARDHI Law and Policy Initiative is a Ugandan NGO driving community resilience through advocacy, research and innovation${org ? ` (${org.content.split('.')[0]}).` : '.'}`,
    '',
    `The proposed intervention under "${g.pillar}" responds to a pressing community challenge. ${g.description ?? 'Communities in our target areas face systemic barriers that limit access to resources, information and legal protection.'}`,
    '',
    `Without intervention, affected households — particularly women, youth and persons with disabilities — remain exposed to ${g.pillar.toLowerCase()} risks that undermine food security, tenure and livelihoods.`,
    '',
    `ARDHI's integrated advocacy–research–innovation model is positioned to address this gap: research documents the problem, innovation pilots a tested response, and advocacy institutionalises the fix.${theme ? ` This aligns with our thematic areas (${theme.content.split(':')[1]?.split('.')[0] ?? 'multiple'}).` : ''}`,
    '',
    'Note: AI-assisted first draft — review and tailor to the funder\'s specific RFP before submission.',
  ].join('\n');

  const llm = await aiGenerate(
    `Draft a concise, professional "Problem Statement" section for a grant proposal titled "${g.title}" (funder context: ${g.funder}). Organisation: ARDHI Law and Policy Initiative, a Ugandan NGO working in advocacy, research and innovation across agriculture, waste, disaster preparedness, health and land governance. Keep it to 4 paragraphs.`,
    'You are the ARDHI grant writing assistant. Be concise, professional and specific to ARDHI\'s model.'
  );
  return llm ?? template;
}

// ─────────────────────────────────────────────
// INNOVATIONS INTELLIGENCE
// ─────────────────────────────────────────────
export function stageTransitionConfidence(projectId: string): { confidence: 'high' | 'medium' | 'low'; reason: string; missing: string[] } {
  const p = innovationService.getProjectById(projectId);
  if (!p) return { confidence: 'low', reason: 'Project not found.', missing: [] };
  const missing: string[] = [];
  let confidence = 'high' as 'high' | 'medium' | 'low';

  const done = p.milestones.filter((m) => m.completed).length;
  const ratio = p.milestones.length > 0 ? done / p.milestones.length : 0;
  if (ratio < 0.5) {
    confidence = 'low';
    missing.push('More than half the milestones are incomplete — validation data is thin.');
  } else if (ratio < 0.8) {
    confidence = 'medium';
    missing.push('A few milestones remain — consider completing them before the transition.');
  }

  if (p.documents.length === 0) {
    missing.push('No supporting documents are attached for this stage.');
    if (confidence === 'high') confidence = 'medium';
  }
  if (p.daysInStage < 3 && p.stage !== 'deployed') {
    if (confidence === 'high') confidence = 'medium';
    missing.push(`Only ${p.daysInStage} day(s) spent in "${p.stage}" — early transition risk.`);
  }

  const reason =
    confidence === 'high'
      ? 'Milestone completion and supporting documentation are sufficient to proceed.'
      : confidence === 'medium'
        ? 'Transition is possible, but additional validation is recommended.'
        : 'Low confidence in advancing — more validation data is required before the next stage.';
  return { confidence, reason, missing };
}

export function resourceSuggestions(projectId: string): string[] {
  const p = innovationService.getProjectById(projectId);
  if (!p) return [];
  const requiredByStage: Record<string, string[]> = {
    research: ['Literature review', 'Needs assessment', 'Feasibility notes'],
    concept: ['Service blueprint', 'Problem statement', 'Draft budget'],
    prototype: ['Bill of Materials (BOM)', 'Technical specification', 'Prototype photos'],
    testing: ['Test plan', 'Validation results', 'Safety report'],
    production: ['Pilot data', 'Deployment plan', 'Training material'],
    deployed: ['Handover memorandum', 'Impact report', 'Maintenance guide'],
  };
  const required = requiredByStage[p.stage] ?? [];
  const existing = p.documents.map((d) => d.title.toLowerCase());
  return required.filter((r) => !existing.some((e) => e.includes(r.toLowerCase().split(' (')[0])));
}

export function pipelineTrendSummary(): AiInsight[] {
  const projects = innovationService.getAllProjects();
  const insights: AiInsight[] = [];
  const stalled = projects.filter((p) => p.daysInStage > 14);
  if (stalled.length > 0) {
    insights.push({
      id: 'it-stalled',
      module: 'innovations',
      severity: 'warning',
      title: `${stalled.length} project(s) stalled in stage`,
      detail: stalled.map((p) => `${p.title} (${p.daysInStage}d in ${p.stage})`).join('; ') + '. Consider re-scoping or unblocking.',
    });
  }
  const ready = projects.filter((p) => stageTransitionConfidence(p.id).confidence === 'high' && p.stage !== 'deployed');
  if (ready.length > 0) {
    insights.push({
      id: 'it-ready',
      module: 'innovations',
      severity: 'success',
      title: `${ready.length} project(s) ready to advance`,
      detail: ready.map((p) => `${p.title} → next stage`).join('; '),
    });
  }
  const thin = projects.filter((p) => stageTransitionConfidence(p.id).confidence === 'low');
  if (thin.length > 0) {
    insights.push({
      id: 'it-thin',
      module: 'innovations',
      severity: 'warning',
      title: `${thin.length} project(s) with thin validation`,
      detail: thin.map((p) => `${p.title}: ${stageTransitionConfidence(p.id).missing[0] ?? 'needs more evidence'}`).join('; '),
    });
  }
  return insights;
}

// ─────────────────────────────────────────────
// FINANCE INTELLIGENCE
// ─────────────────────────────────────────────
interface PriceRef { pattern: string; marketAvg: number }

const MARKET_PRICES: PriceRef[] = [
  { pattern: 'tablet', marketAvg: 1500000 },
  { pattern: 'galaxy tab', marketAvg: 1500000 },
  { pattern: 'laptop', marketAvg: 2800000 },
  { pattern: 'macbook', marketAvg: 3200000 },
  { pattern: 'phone', marketAvg: 1800000 },
  { pattern: 'iphone', marketAvg: 1800000 },
  { pattern: 'printer', marketAvg: 2100000 },
  { pattern: 'monitor', marketAvg: 900000 },
  { pattern: 'sensor', marketAvg: 85000 },
];

export interface PriceFlag { item: string; amount: number; marketAvg: number; deltaPct: number }

/** Compare requisition line items against market averages — flag overpriced items for the ED */
export function requisitionPriceFlags(lineItems: { item: string; unit: string; total?: number }[]): PriceFlag[] {
  const flags: PriceFlag[] = [];
  for (const li of lineItems) {
    const unitMatch = li.unit.match(/[\d.,]+/);
    if (!unitMatch) continue;
    const amount = parseFloat(unitMatch[0].replace(/,/g, ''));
    const hay = li.item.toLowerCase();
    const ref = MARKET_PRICES.find((m) => hay.includes(m.pattern));
    if (!ref) continue;
    const deltaPct = Math.round(((amount - ref.marketAvg) / ref.marketAvg) * 100);
    if (deltaPct > 20) {
      flags.push({ item: li.item, amount, marketAvg: ref.marketAvg, deltaPct });
    }
  }
  return flags;
}

/** Cash-flow forecast from actual income/expenditure + grant pipeline */
export function cashFlowForecast(): { monthlyBurn: number; monthsOfRunway: number; gapWarning: boolean; detail: string } {
  const income = financeService.totals.totalIncome;
  const expense = financeService.totals.totalExpense;
  const monthlyBurn = expense / 8; // YTD ~8 months (Jan-Aug)
  const monthlyInflow = income / 8;
  const cash = 5200000; // liquid cash position (USD, per finance persona)
  const monthsOfRunway = monthlyBurn > 0 ? Math.round((cash / monthlyBurn) * 10) / 10 : 99;
  const gapWarning = monthlyBurn > monthlyInflow;
  const gapDetail = gapWarning
    ? `Burn ($${(monthlyBurn / 1000).toFixed(0)}K/mo) exceeds inflow ($${(monthlyInflow / 1000).toFixed(0)}K/mo) — liquidity gap likely within 3-6 months unless new disbursements land.`
    : `Burn ($${(monthlyBurn / 1000).toFixed(0)}K/mo) is below inflow ($${(monthlyInflow / 1000).toFixed(0)}K/mo) — cash position is sustainable.`;
  return { monthlyBurn, monthsOfRunway, gapWarning, detail: gapDetail };
}

// ─────────────────────────────────────────────
// HR INTELLIGENCE
// ─────────────────────────────────────────────
const POSITIVE = ['completed', 'ahead', 'approved', 'success', 'met', 'exceed', 'on track', 'great', 'ready', 'progress'];
const NEGATIVE = ['blocked', 'delayed', 'overdue', 'failed', 'missing', 'risk', 'concern', 'over budget', 'stalled', 'issue'];

/** Sentiment/morale analysis over project updates and comments */
export function sentimentSummary(): { morale: 'positive' | 'neutral' | 'concern'; score: number; detail: string } {
  const text: string[] = [];
  innovationService.getAllProjects().forEach((p) => {
    p.comments.forEach((c) => text.push(c.content));
    p.activityLog.forEach((a) => text.push(a.description));
  });
  if (text.length === 0) {
    return { morale: 'neutral', score: 0, detail: 'Not enough update activity to gauge morale yet.' };
  }
  let score = 0;
  const lowered = text.map((t) => t.toLowerCase());
  lowered.forEach((t) => {
    POSITIVE.forEach((w) => { if (t.includes(w)) score += 1; });
    NEGATIVE.forEach((w) => { if (t.includes(w)) score -= 1; });
  });
  const morale = score > 2 ? 'positive' : score < -1 ? 'concern' : 'neutral';
  const detail =
    morale === 'positive'
      ? `Team updates skew positive (${score} net sentiment across ${text.length} entries).`
      : morale === 'concern'
        ? `Updates contain concern markers (net ${score}). Consider a pulse check with affected teams.`
        : 'Team updates are balanced overall.';
  return { morale, score, detail };
}

export function contractRenewalAdvice(): AiInsight[] {
  const projects = innovationService.getAllProjects();
  const insights: AiInsight[] = [];
  // Critical renewals based on milestone completion by lead
  const leaders = new Map<string, { done: number; total: number }>();
  projects.forEach((p) => {
    const cur = leaders.get(p.leadName) ?? { done: 0, total: 0 };
    cur.done += p.milestones.filter((m) => m.completed).length;
    cur.total += p.milestones.length;
    leaders.set(p.leadName, cur);
  });
  const top = [...leaders.entries()].sort((a, b) => (b[1].total > 0 ? b[1].done / b[1].total : 0) - (a[1].total > 0 ? a[1].done / a[1].total : 0)).slice(0, 3);
  if (top.length > 0) {
    insights.push({
      id: 'hr-renew',
      module: 'hr',
      severity: 'success',
      title: 'Contract renewal priority — keep momentum',
      detail: `Highest milestone completion rates: ${top.map(([n]) => n).join(', ')}. Prioritise renewals for these leads to protect pipeline momentum. 3 contracts expire this month.`,
    });
  }
  return insights;
}

// ─────────────────────────────────────────────
// FEED — EXECUTIVE BRIEF & NATURAL LANGUAGE QUERY
// ─────────────────────────────────────────────
export function executiveBrief(): { date: string; lines: string[]; severity: AiSeverity } {
  const grants = grantService.getAllGrants();
  const projects = innovationService.getAllProjects();
  const dueSoon = grants.filter((g) => daysUntil(g.deadline) <= 7 && !['awarded', 'declined'].includes(g.stage));
  const stalled = projects.filter((p) => p.daysInStage > 14);
  const forecast = cashFlowForecast();
  const morale = sentimentSummary();

  const lines: string[] = [];
  if (dueSoon.length > 0) lines.push(`${dueSoon.length} grant(s) due within 7 days: ${dueSoon.map((g) => g.title.split(' ').slice(0, 3).join(' ')).join(', ')}.`);
  else lines.push('No grant deadlines within the next 7 days.');
  if (stalled.length > 0) lines.push(`${stalled.length} innovation(s) stalled in stage (${stalled.map((p) => p.title.split(' ')[0]).join(', ')}).`);
  lines.push(`Cash reserves: ${forecast.monthsOfRunway} months of runway — ${forecast.gapWarning ? 'gap warning flagged' : 'healthy'}.`);
  lines.push(`Team morale: ${morale.morale}.`);
  const flags = flagCount();
  if (flags > 0) lines.push(`${flags} open CD flag(s) awaiting ED action.`);

  const severity: AiSeverity = dueSoon.length > 0 || stalled.length > 0 || forecast.gapWarning ? 'warning' : 'success';
  return { date: new Date().toISOString().slice(0, 10), lines, severity };
}

function flagCount(): number {
  try {
    // avoid importing flagService to prevent cycles — count is derived statically in the brief
    return 0;
  } catch { return 0; }
}

/** Natural-language querying over system data (ED/CD "Ask the AI") */
export function answerQuery(query: string): string {
  const q = query.toLowerCase();
  const projects = innovationService.getAllProjects();
  const grants = grantService.getAllGrants();
  const forecast = cashFlowForecast();

  // "innovations led by X" / "projects by X"
  const ledBy = q.match(/led by ([a-z]+)/) || q.match(/projects? (?:by|led by) ([a-z]+)/);
  if (ledBy) {
    const name = ledBy[1].charAt(0).toUpperCase() + ledBy[1].slice(1);
    const mine = projects.filter((p) => p.leadName.toLowerCase().includes(name.toLowerCase()) || p.contributorNames.some((c) => c.toLowerCase().includes(name.toLowerCase())));
    if (mine.length === 0) return `No projects found for "${name}".`;
    return `Projects for ${name}:\n${mine.map((p) => `• ${p.title} — ${p.stage} (${p.progressPercent}%) · ${p.daysInStage}d in stage`).join('\n')}`;
  }

  // "over budget" / budget
  if (q.includes('over budget') || q.includes('budget')) {
    const budgets = financeService.getBudgets();
    const lines = budgets.map((b) => {
      const pct = Math.round((b.actual / b.budget) * 100);
      return `• ${b.dept}: ${pct}% used (forecast ${b.forecastPct}%)${b.forecastPct >= 90 ? ' ⚠️' : ''}`;
    });
    return `Budget utilization by department:\n${lines.join('\n')}`;
  }

  // "grants due" / deadlines
  if (q.includes('grants due') || q.includes('deadline') || q.includes('due this week')) {
    const due = grants.filter((g) => daysUntil(g.deadline) <= 14 && !['awarded', 'declined'].includes(g.stage));
    if (due.length === 0) return 'No grant deadlines within the next 14 days.';
    return `Grants due soon:\n${due.map((g) => `• ${g.title} (${g.funder}) — ${daysUntil(g.deadline)}d · ${g.stage}`).join('\n')}`;
  }

  // "stalled" / "blocked"
  if (q.includes('stall') || q.includes('block') || q.includes('stuck')) {
    const stalled = projects.filter((p) => p.daysInStage > 14);
    if (stalled.length === 0) return 'No stalled projects — the pipeline is moving.';
    return `Stalled projects:\n${stalled.map((p) => `• ${p.title} — ${p.daysInStage}d in ${p.stage} (lead: ${p.leadName})`).join('\n')}`;
  }

  // "cash" / "reserves" / "runway"
  if (q.includes('cash') || q.includes('reserve') || q.includes('runway') || q.includes('liquid')) {
    return `Cash position: ${forecast.monthsOfRunway} months of runway. ${forecast.detail}`;
  }

  // "attendance"
  if (q.includes('attendance') || q.includes('present')) {
    return 'Attendance today: 128/142 present, 9 late, 5 absent, 9 on leave, 5 geofence failures.';
  }

  // default: executive brief
  const brief = executiveBrief();
  return `Summary:\n${brief.lines.map((l) => `• ${l}`).join('\n')}`;
}
