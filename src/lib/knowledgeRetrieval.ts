// src/lib/knowledgeRetrieval.ts
// ============================================================
// Retrieval layer for the ARDHI Grants Assistant.
// 1. Scores knowledge chunks against the user's question.
// 2. Builds a "fine-tuned" system prompt (org context + retrieved evidence).
// 3. Provides a formal, professional local answer engine used when the
//    AI API is unavailable.
// Grant briefings always cover: pillar/thematic alignment, eligibility
// criteria, and similar grants ARDHI has applied for before.
// ============================================================

import { ORG_KNOWLEDGE, ORG_FAST_FACTS, type KnowledgeChunk } from '@/data/orgKnowledge';
import { LIVE_OPPORTUNITIES, MISSED_GRANTS, APPLIED_HISTORY, FUNDER_PORTALS, getSimilarApplied, type TrackerGrant } from '@/data/grantTracker';

// ─────────────────────────────────────────────
// TEXT UTILITIES
// ─────────────────────────────────────────────
function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s\-']/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(text: string): string[] {
  return normalize(text).split(' ').filter((t) => t.length > 2);
}

const STOPWORDS = new Set(['the', 'and', 'for', 'are', 'you', 'our', 'with', 'that', 'this', 'have', 'has', 'was', 'were', 'what', 'which', 'about', 'tell', 'give', 'list', 'show', 'know', 'can', 'any', 'all', 'not', 'but', 'from', 'into']);

function significantTokens(text: string): string[] {
  return tokenize(text).filter((t) => !STOPWORDS.has(t));
}

// ─────────────────────────────────────────────
// RETRIEVAL
// ─────────────────────────────────────────────
export interface RetrievalResult {
  chunks: KnowledgeChunk[];
  opportunities: TrackerGrant[];
  question: string;
}

function scoreChunk(chunk: KnowledgeChunk, tokens: string[]): number {
  let score = 0;
  const keywordText = chunk.keywords.join(' ').toLowerCase();
  const contentText = normalize(chunk.content);
  for (const t of tokens) {
    if (keywordText.includes(t)) score += 3;
    if (contentText.includes(t)) score += 1;
  }
  return score;
}

/** Retrieve the best-matching knowledge chunks and tracker grants for a question */
export function retrieve(question: string, maxChunks = 3): RetrievalResult {
  const tokens = significantTokens(question);
  const ranked = ORG_KNOWLEDGE
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, tokens) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  const chunks = ranked.slice(0, maxChunks).map((r) => r.chunk);

  const grantTokens = tokens;
  const opportunities = LIVE_OPPORTUNITIES.filter((g) => {
    const hay = `${g.id} ${g.title} ${g.funder} ${g.funderType} ${g.programme} ${g.eligibilityStatus}`.toLowerCase();
    return grantTokens.some((t) => hay.includes(t));
  });

  return { chunks, opportunities, question };
}

/** Find a specific tracker grant referenced in the question (by id or title keywords) */
export function findGrantInQuestion(question: string): TrackerGrant | undefined {
  const q = normalize(question);
  const idMatch = q.match(/g[- ]?00(\d)/);
  if (idMatch) {
    const target = `G-00${idMatch[1]}`;
    const byId = LIVE_OPPORTUNITIES.find((g) => g.id === target);
    if (byId) return byId;
  }
  const tokens = significantTokens(question);
  let best: TrackerGrant | undefined;
  let bestScore = 0;
  for (const g of LIVE_OPPORTUNITIES) {
    const hay = normalize(`${g.id} ${g.title} ${g.funder} ${g.programme}`);
    let score = 0;
    for (const t of tokens) {
      if (hay.includes(t)) score += 2;
    }
    // boost on distinctive tokens
    if (/(e[- ]?waste|circular)/.test(q) && /waste/.test(normalize(g.title))) score += 4;
    if (/(e[- ]?booster|booster)/.test(q) && /booster/.test(normalize(g.title))) score += 4;
    if (/(sgci|stisa)/.test(q) && /stisa/.test(normalize(g.title))) score += 4;
    if (/(elderly|older)/.test(q) && /elderly/.test(normalize(g.title))) score += 4;
    if (/(women|female|gender)/.test(q) && /women/.test(normalize(g.title))) score += 4;
    if (/(youth|multimedia)/.test(q) && /youth/.test(normalize(g.title))) score += 4;
    if (/(msme)/.test(q) && /msme/.test(normalize(g.title))) score += 4;
    if (/(ieee|innovation summit)/.test(q) && /ieee/.test(normalize(g.title))) score += 4;
    if (/(constellations|fellowship)/.test(q) && /constellations/.test(normalize(g.title))) score += 4;
    if (/(larson|theatre)/.test(q) && /larson/.test(normalize(g.title))) score += 4;
    if (score > bestScore) {
      bestScore = score;
      best = g;
    }
  }
  return bestScore >= 2 ? best : undefined;
}

// ─────────────────────────────────────────────
// GRANT BRIEFING (alignment + eligibility + similar applied)
// ─────────────────────────────────────────────
function similarAppliedText(grant: TrackerGrant): string {
  const similar = getSimilarApplied(grant.id);
  if (similar.length === 0) {
    return 'Prior applications: none directly comparable have been submitted for this grant; the gap is documented in the tracker.';
  }
  const lines = similar.map((a) => `• ${a.title} — ${a.funder} (${a.stage}; requested ${a.amountRequested}${a.amountAwarded ? `; awarded ${a.amountAwarded}` : ''})`);
  return `Prior applications of a similar nature:\n${lines.join('\n')}`;
}

export function formatGrantBriefing(g: TrackerGrant): string {
  return [
    `${g.id} — ${g.title}`,
    `Funder: ${g.funder} (${g.funderType})`,
    `Deadline: ${g.deadline} | Priority: ${g.priority} | Fit score: ${g.fitScore}/5 | Eligibility status: ${g.eligibilityStatus}`,
    `Award: ${g.award}`,
    '',
    'Alignment with ARDHI pillars and thematic areas:',
    g.alignment,
    '',
    'Eligibility criteria:',
    g.eligibility,
    '',
    similarAppliedText(g),
    '',
    `Next action: ${g.nextAction}`,
    `Source: ${g.sourceLink}`,
  ].join('\n');
}

// ─────────────────────────────────────────────
// SYSTEM PROMPT ("fine-tuned" with org context)
// ─────────────────────────────────────────────
export function buildGrantsSystemPrompt(question: string): string {
  const { chunks, opportunities } = retrieve(question, 4);
  const contextBlock = chunks.length > 0
    ? chunks.map((c) => `[${c.title}]\n${c.content}`).join('\n\n')
    : 'No specific organisational context matched this question.';

  const grantBlock = opportunities.length > 0
    ? opportunities.map(formatGrantBriefing).join('\n\n')
    : 'No specific tracker grant matched this question.';

  return [
    'You are the ARDHI Grants Assistant — a specialist assistant for the ARDHI Law and Policy Initiative, a Ugandan NGO working in advocacy, research and innovation across agriculture and food security, waste management, disaster preparedness, health and land governance.',
    '',
    'You are "fine-tuned" on ARDHI\'s own documents: the Organisational Profile (Annex 5), the Sustainability and Resource Mobilisation Plan (Annex 20), the 5-Year Strategic Plan 2026-2031, internal briefings, and the Grants Tracker (August 2026).',
    '',
    'TONE AND STYLE:',
    'Respond in a formal, professional and courteous register at all times. Use complete sentences and structured, clearly organised answers (short headings and bullet points are appropriate). Avoid slang, emojis, exclamation marks and overly casual phrasing. Address the user formally. If you do not know something, state it plainly and suggest the appropriate person to ask.',
    '',
    'GROUND RULES:',
    '1. Answer from the organisational context and grant details below plus your general knowledge. When a fact comes from an ARDHI document, cite it briefly (e.g. "per the 5-Year Strategic Plan" or "per the Grants Tracker").',
    '2. Whenever the user asks about a specific grant or funding opportunity, structure the answer to cover, in order: (a) how the grant aligns with ARDHI\'s pillars (Advocacy, Research, Innovation) and thematic areas; (b) the eligibility criteria clearly and completely; (c) whether ARDHI has applied for similar grants before, referencing the relevant prior applications; and (d) the deadline, priority and next action.',
    '3. For questions about "grants on the internet", point the user to the funder portals (UCC e-Services, IDRC, EU Funding & Tenders, USAID, UN Women, AfDB) and note that live web search is not enabled — direct them to open the portals.',
    '4. For missed grants, list the UCC/UCUSAF cluster (G-003 to G-009, deadlines 21-24 Aug 2026) that was identified 17 Aug but not applied for due to the tight deadline window, unassembled document packs and eligibility gates (not-for-profit lead, experience requirements).',
    '5. For application history, use: awarded — Women-Led Agri-Business Accelerator (UN Women); under review — Community Land Rights Documentation (USAID); submitted — Youth Digital Literacy (Mastercard Foundation); plus drafting and identified pipeline entries.',
    '6. You may answer company-detail questions (identity, mission, vision, pillars, thematic areas, governance, policies, strategy, contact details) directly from context.',
    '',
    `USER QUESTION: ${question}`,
    '',
    'ORGANISATIONAL CONTEXT:',
    contextBlock,
    '',
    'MATCHED GRANT BRIEFINGS:',
    grantBlock,
  ].join('\n');
}

// ─────────────────────────────────────────────
// LOCAL FALLBACK ANSWER ENGINE (formal register)
// ─────────────────────────────────────────────
function formatOpportunity(g: TrackerGrant): string {
  return [
    `• ${g.id} — ${g.title}`,
    `  Funder: ${g.funder} | Deadline: ${g.deadline}`,
    `  Priority: ${g.priority} | Fit: ${g.fitScore}/5 | Eligibility: ${g.eligibilityStatus}`,
    `  Alignment: ${g.alignment.split('.').slice(0, 1)[0]}.`,
  ].join('\n');
}

export function generateLocalAnswer(question: string): string {
  const q = normalize(question);
  const qFull = question.trim().toLowerCase();

  // 1) specific grant briefing (alignment + eligibility + similar applied)
  const grant = findGrantInQuestion(question);
  if (grant) {
    return formatGrantBriefing(grant);
  }

  // 2) capability / help
  if (/(what can you|help|who are you|what do you do as|capabilit)/.test(qFull)) {
    return [
      'I am the ARDHI Grants Assistant, an internal knowledge resource trained on ARDHI\'s own documents (Organisational Profile, 5-Year Strategic Plan 2026-2031, resource mobilisation plan, internal briefings) and the Grants Tracker (August 2026). I can provide the following:',
      '',
      '• Organisational information — identity, mission, vision, pillars, thematic areas, governance, policies and contact details;',
      '• Grant application history — awarded, under review, submitted and pipeline entries;',
      '• Opportunities identified but not pursued — in particular the UCC/UCUSAF calls missed on deadline and eligibility grounds;',
      '• Live opportunities in the tracker (G-001 to G-011) — for each, I state the alignment with our pillars, the eligibility criteria, and any similar grants we have applied for before;',
      '• Guidance on where to find further opportunities online — the funder portals we monitor.',
      '',
      'You may ask, for example: "Which grants did we miss due to deadlines?", "Tell me about the UCC e-waste grant", or "How does the SGCI call align with our pillars?"',
    ].join('\n');
  }

  // 3) missed / deadline / did not apply
  if (/(missed|deadline|didn'?t|did not|not applied|planned|drop|why didn|fell through|not pursue)/.test(qFull)) {
    const missed = MISSED_GRANTS.map((m) => `• ${m.id} — ${m.title} (${m.funder})\n  Deadline: ${m.deadline}\n  Reason: ${m.reason}`).join('\n');
    return [
      `The tracker records ${MISSED_GRANTS.length} calls that ARDHI identified but did not apply for. The majority are the UCC/UCUSAF cluster logged on 17 August 2026 with submission windows of only four to seven days; the application stage remained "Not started", no owner was allocated, and the required document pack was not assembled in time. Binding eligibility gates (a not-for-profit lead and specific experience requirements) compounded the deadline pressure.`,
      '',
      missed,
      '',
      'The tracker itself records the lesson: "Six deadlines land on 21 August... expect congestion and submit early." Earlier logging of opportunities and a standing compliance document pack would materially improve the outcome in future rounds.',
    ].join('\n');
  }

  // 4) applied before / history / awarded
  if (/(applied|awarded|history|previous|before|won|secured|pipeline|submitted)/.test(qFull)) {
    const applied = APPLIED_HISTORY.map((g) => `• ${g.title} — ${g.funder}\n  Stage: ${g.stage} | Requested: ${g.amountRequested}${g.amountAwarded ? ` | Awarded: ${g.amountAwarded}` : ''} | Handler: ${g.handler}\n  ${g.note}`).join('\n');
    return [
      'The grant application history, from the AIMS grants module, is as follows:',
      '',
      applied,
      '',
      'Should you require details of opportunities identified but not pursued, please ask "which grants did we miss?".',
    ].join('\n');
  }

  // 5) live / open opportunities / internet / find grants
  if (/(open|live|opportunit|available|new grant|internet|online|web|find|explore|current)/.test(qFull)) {
    const opps = LIVE_OPPORTUNITIES.slice(0, 8).map(formatOpportunity).join('\n');
    const portals = FUNDER_PORTALS.slice(0, 5).map((p) => `• ${p.name} — ${p.url}`).join('\n');
    return [
      'The live opportunities in the Grants Tracker (compiled 17 August 2026) are as follows:',
      '',
      opps,
      '',
      'For any individual opportunity, I can provide a full briefing covering alignment with our pillars, eligibility criteria and similar prior applications — for example "Tell me about the UCC e-waste grant" or "How does G-002 align with our pillars?".',
      '',
      'To explore opportunities beyond the tracker, the funder portals we monitor are:',
      '',
      portals,
      '',
      'Please note that live web search is not enabled in this build; the portals above should be consulted directly for the most current calls.',
    ].join('\n');
  }

  // 6) fast facts (organisational)
  for (const fact of ORG_FAST_FACTS) {
    const fq = normalize(fact.question);
    if (q.includes(fq) || fq.includes(q) || significantTokens(question).every((t) => fact.answer.toLowerCase().includes(t))) {
      return fact.answer;
    }
  }

  // 7) general retrieval over org knowledge
  const { chunks } = retrieve(question, 2);
  if (chunks.length > 0) {
    return chunks.map((c) => `${c.title}:\n${c.content}`).join('\n\n');
  }

  // 8) default
  return [
    'I was unable to match that query against ARDHI\'s documents or grants tracker. You may wish to ask:',
    '',
    '• "Tell me about ARDHI" — identity, mission, vision, pillars and thematic areas;',
    '• "Which grants did we miss due to deadlines?";',
    '• "What grants have we applied for before?";',
    '• "What opportunities are currently open?";',
    '• "Tell me about the UCC e-waste grant" — or any G-00X identifier, for a full briefing with alignment, eligibility and prior applications.',
  ].join('\n');
}

// ─────────────────────────────────────────────
// CHAT HELPERS
// ─────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const ASSISTANT_IDENTITY = 'ARDHI Grants Assistant';

export const QUICK_PROMPTS = [
  'Tell me about ARDHI',
  'Which grants did we miss due to deadlines?',
  'What grants have we applied for before?',
  'What opportunities are currently open?',
  'Tell me about the UCC e-waste grant',
  'Where can I find more grants online?',
];
