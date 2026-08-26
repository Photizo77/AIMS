// src/lib/knowledgeRetrieval.ts
// ============================================================
// Lightweight retrieval layer for the ARDHI Grants Assistant.
// 1. Scores knowledge chunks against the user's question.
// 2. Builds a "fine-tuned" system prompt (org context + retrieved evidence).
// 3. Provides a rule-based local answer engine when the AI API is
//    unavailable (local dev / no API keys configured).
// ============================================================

import { ORG_KNOWLEDGE, ORG_FAST_FACTS, type KnowledgeChunk } from '@/data/orgKnowledge';
import { LIVE_OPPORTUNITIES, MISSED_GRANTS, APPLIED_HISTORY, FUNDER_PORTALS, type TrackerGrant } from '@/data/grantTracker';

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

/** Score a chunk by how many significant query tokens appear in its keywords/content */
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

  // match tracker grants by title/funder tokens
  const grantTokens = tokens;
  const opportunities = LIVE_OPPORTUNITIES.filter((g) => {
    const hay = `${g.title} ${g.funder} ${g.funderType} ${g.programme} ${g.eligibilityStatus}`.toLowerCase();
    return grantTokens.some((t) => hay.includes(t));
  });

  return { chunks, opportunities, question };
}

// ─────────────────────────────────────────────
// SYSTEM PROMPT ("fine-tuned" with org context)
// ─────────────────────────────────────────────
export function buildGrantsSystemPrompt(question: string): string {
  const { chunks } = retrieve(question, 4);
  const contextBlock = chunks.length > 0
    ? chunks.map((c) => `[${c.title}]\n${c.content}`).join('\n\n')
    : 'No specific organisational context matched this question.';

  return [
    'You are the ARDHI Grants Assistant — a specialist assistant for the ARDHI Law and Policy Initiative, a Ugandan NGO working in advocacy, research and innovation across agriculture and food security, waste management, disaster preparedness, health and land governance.',
    '',
    'You are "fine-tuned" on ARDHI\'s own documents: the Organisational Profile (Annex 5), the Sustainability and Resource Mobilisation Plan (Annex 20), the 5-Year Strategic Plan 2026-2031, internal briefings, and the Grants Tracker (August 2026).',
    '',
    'GROUND RULES:',
    '1. Answer from the organisational context below plus your general knowledge. When a fact comes from an ARDHI document, say so briefly (e.g. "per the 5-Year Strategic Plan").',
    '2. For questions about grant opportunities, cite the tracker: grants have IDs G-001 to G-011 with deadlines, eligibility status and fit scores. If the user asks about "grants on the internet", point them to the funder portals (UCC e-Services, IDRC, EU Funding & Tenders, USAID, UN Women) and note that live web search is not enabled — direct them to open the portals.',
    '3. For application history, use: awarded — Women-Led Agri-Business Accelerator (UN Women); under review — Community Land Rights Documentation (USAID); submitted — Youth Digital Literacy (Mastercard Foundation); plus drafting and identified pipeline entries.',
    '4. For missed grants, list the UCC/UCUSAF cluster (G-003 to G-009, deadlines 21-24 Aug 2026) that was identified 17 Aug but not applied for due to the tight deadline window, unassembled document packs and eligibility gates (not-for-profit lead, experience requirements).',
    '5. Be concise, structured (short bullets are fine), and honest. If you do not know, say so and suggest who to ask.',
    '6. You may answer company-detail questions (identity, mission, vision, pillars, thematic areas, governance, policies, strategy, contact details) directly from context.',
    '',
    `USER QUESTION: ${question}`,
    '',
    'ORGANISATIONAL CONTEXT:',
    contextBlock,
  ].join('\n');
}

// ─────────────────────────────────────────────
// LOCAL FALLBACK ANSWER ENGINE (no API needed)
// ─────────────────────────────────────────────
function formatOpportunity(g: TrackerGrant): string {
  return `• ${g.id} — ${g.title}\n  Funder: ${g.funder}\n  Deadline: ${g.deadline} | Priority: ${g.priority} | Fit: ${g.fitScore}/5 | Eligibility: ${g.eligibilityStatus}\n  Award: ${g.award}\n  Next action: ${g.nextAction}`;
}

export function generateLocalAnswer(question: string): string {
  const q = normalize(question);
  const qFull = question.trim().toLowerCase();

  // capability / help
  if (/(what can you|help|who are you|what do you do as)/.test(qFull)) {
    return [
      'I\'m the ARDHI Grants Assistant — trained on ARDHI\'s own documents (Organisational Profile, 5-Year Strategic Plan 2026-2031, resource mobilisation plan, internal briefings) and the Grants Tracker (Aug 2026). I can answer:',
      '• About ARDHI — identity, mission, vision, pillars, thematic areas, governance, policies, contact details',
      '• Grants we have applied for before — awarded, under review, submitted and pipeline entries',
      '• Grants we planned but did not apply for — especially the UCC/UCUSAF calls missed on deadline issues',
      '• Live opportunities in the tracker (G-001 to G-011) with deadlines, eligibility and fit scores',
      '• Where to find more grants online — funder portals to check',
      '',
      'Try: "Which grants did we miss due to deadlines?", "Tell me about ARDHI", or "What opportunities are open?"',
    ].join('\n');
  }

  // missed / deadline / did not apply
  if (/(missed|deadline|didn'?t|did not|not applied|planned|drop|why didn|fell through|not pursue)/.test(qFull)) {
    const missed = MISSED_GRANTS.map((m) => `• ${m.id} — ${m.title} (${m.funder})\n  Deadline: ${m.deadline}\n  Reason: ${m.reason}`).join('\n');
    return [
      `Yes — the tracker recorded ${MISSED_GRANTS.length} calls we identified but did not apply for. Most are the UCC/UCUSAF cluster logged on 17 Aug 2026 with 4-7 day submission windows; the application stage was "Not started", no owner was allocated and the document pack was not assembled in time.`,
      '',
      missed,
      '',
      'Lesson recorded in the tracker: "Six deadlines land on 21 August... expect congestion and submit early" — earlier logging and a standing document pack would have changed several outcomes.',
    ].join('\n');
  }

  // applied before / history / awarded
  if (/(applied|awarded|history|previous|before|won|secured|pipeline|submitted)/.test(qFull)) {
    const applied = APPLIED_HISTORY.map((g) => `• ${g.title} — ${g.funder}\n  Stage: ${g.stage} | Requested: ${g.amountRequested}${g.amountAwarded ? ` | Awarded: ${g.amountAwarded}` : ''} | Handler: ${g.handler}\n  ${g.note}`).join('\n');
    return [
      'Here is our grant application history from the AIMS grants module:',
      '',
      applied,
      '',
      'Ask me "which grants did we miss?" for the opportunities we identified but did not apply for.',
    ].join('\n');
  }

  // live / open opportunities / internet / find grants
  if (/(open|live|opportunit|available|new grant|internet|online|web|find|explore|current)/.test(qFull)) {
    const opps = LIVE_OPPORTUNITIES.slice(0, 8).map(formatOpportunity).join('\n');
    const portals = FUNDER_PORTALS.slice(0, 5).map((p) => `• ${p.name} — ${p.url}`).join('\n');
    return [
      'Live opportunities in the Grants Tracker (compiled 17 Aug 2026):',
      '',
      opps,
      '',
      'To explore grants beyond the tracker ("grants on the internet"), check these funder portals:',
      '',
      portals,
      '',
      'Note: I can\'t search the live web from this build — open the portals above to see current calls. With a web-search API key wired into the chat backend, I could do this directly.',
    ].join('\n');
  }

  // fast facts
  for (const fact of ORG_FAST_FACTS) {
    const fq = normalize(fact.question);
    if (q.includes(fq) || fq.includes(q) || significantTokens(question).every((t) => fact.answer.toLowerCase().includes(t))) {
      return fact.answer;
    }
  }

  // general retrieval over org knowledge
  const { chunks } = retrieve(question, 2);
  if (chunks.length > 0) {
    return chunks.map((c) => `${c.title}:\n${c.content}`).join('\n\n');
  }

  // default
  return [
    'I\'m not sure about that one — I\'m tuned to ARDHI\'s documents and grants tracker. Try asking:',
    '• "Tell me about ARDHI" (identity, mission, vision, thematic areas)',
    '• "Which grants did we miss due to deadlines?"',
    '• "What grants have we applied for before?"',
    '• "What opportunities are currently open?"',
    '• "What policies does ARDHI have?" or "Where is ARDHI located?"',
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
  'What policies does ARDHI have?',
  'Where can I find more grants online?',
];
