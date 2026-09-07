// src/lib/complianceChecker.ts
// ============================================================
// AIMS — Automated Donor Compliance Checker.
// Cross-references the donor's stated eligibility requirements
// against ARDHI's internal knowledge base (orgKnowledge). Rule
// based + literal only — ZERO hallucination: a requirement that
// cannot be checked against a real fact is NEVER reported as a gap.
// A semantic LLM pass can be plugged in later without changing the
// return shape (async signature ready).
// ============================================================

import { ORG_CAPABILITIES, type OrgCapability } from '@/data/orgKnowledge';
import type { ComplianceGap } from './grantEnrichment';

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
}

function hasAny(requirement: string, words: string[]): boolean {
  const r = norm(requirement);
  return words.some((w) => r.includes(norm(w)));
}

function yearNumber(requirement: string): number | null {
  const m = requirement.match(/(\d+)\s*(?:years?|yrs?)/i);
  return m ? Number(m[1]) : null;
}

function moneyNumber(requirement: string): number | null {
  const m = requirement.match(/(?:USD|US\$|\$|EUR|€)\s?([\d,.]+)\s?(m|k|million|thousand)?/i);
  if (!m) return null;
  const num = parseFloat(m[1].replace(/,/g, ''));
  const mult = m[2]?.toLowerCase() ?? '';
  if (mult === 'm' || mult === 'million') return num * 1000000;
  if (mult === 'k' || mult === 'thousand') return num * 1000;
  return num;
}

function factValue(fact: OrgCapability): string | number | boolean {
  return fact.value;
}

function findFact(requirement: string, hintKey?: string): OrgCapability | undefined {
  if (hintKey) {
    const byKey = ORG_CAPABILITIES.find((c) => c.key === hintKey);
    if (byKey && hasAny(requirement, byKey.keywords)) return byKey;
  }
  const ranked = ORG_CAPABILITIES
    .map((c) => ({ c, hits: c.keywords.filter((k) => norm(requirement).includes(norm(k))).length }))
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits);
  return ranked[0]?.c;
}

/** Rule that maps a requirement to a fact; returns gap message or null if requirement is met/unknown */
function ruleCheck(requirement: string): ComplianceGap | null {

  // ISO / certification style requirements
  if (hasAny(requirement, ['iso', '27001', 'information security', 'cyber security certification'])) {
    const iso = ORG_CAPABILITIES.find((c) => c.key === 'iso_27001');
    if (iso) {
      if (iso.value === true) return { requirement, status: 'ok', message: 'ARDHI holds the required ISO 27001 certification.', matchedFactKey: iso.key };
      return {
        requirement,
        status: 'gap',
        message: `Warning: Donor requires ISO 27001 certification, but orgKnowledge indicates this is missing (a Data Protection & Privacy Procedure exists but is not ISO-certified).`,
        matchedFactKey: iso.key,
      };
    }
  }

  // Audited-accounts / years of accounts
  if (hasAny(requirement, ['audit', 'audited', 'accounts', 'financial statements'])) {
    const auditFact = ORG_CAPABILITIES.find((c) => c.key === 'audited_accounts_years');
    if (auditFact) {
      const orgYears = typeof auditFact.value === 'number' ? auditFact.value : 0;
      const requiredYears = yearNumber(requirement);
      if (requiredYears === null) {
        return { requirement, status: 'ok', message: 'ARDHI maintains annual external audited accounts.', matchedFactKey: auditFact.key };
      }
      if (requiredYears <= orgYears) {
        return { requirement, status: 'ok', message: `Donor requires ${requiredYears} year(s) of audited accounts — orgKnowledge confirms ${orgYears} year(s).`, matchedFactKey: auditFact.key };
      }
      return {
        requirement,
        status: 'gap',
        message: `Warning: Donor requires ${requiredYears} years of audited accounts, orgKnowledge only confirms ${orgYears} year(s).`,
        matchedFactKey: auditFact.key,
      };
    }
  }

  // Registration / legal status
  if (hasAny(requirement, ['registered', 'registration', 'non-governmental', 'non government', 'legal status', 'ngo permit'])) {
    const reg = ORG_CAPABILITIES.find((c) => c.key === 'registration');
    if (reg && typeof reg.value === 'string' && reg.value.toLowerCase().includes('registered')) {
      return { requirement, status: 'ok', message: `ARDHI meets the registration requirement: ${reg.value}.`, matchedFactKey: reg.key };
    }
  }

  // Financial capacity / turnover ceilings
  if (hasAny(requirement, ['budget', 'capacity', 'turnover', 'operating cost'])) {
    const budgetFact = ORG_CAPABILITIES.find((c) => c.key === 'annual_budget_usd');
    if (budgetFact && typeof budgetFact.value === 'number') {
      const ceiling = moneyNumber(requirement);
      if (ceiling !== null && ceiling > budgetFact.value) {
        return {
          requirement,
          status: 'gap',
          message: `Warning: Donor requires financial capacity near $${(ceiling / 1000000).toFixed(1)}M, while orgKnowledge indicates an approximate capacity of $${(budgetFact.value / 1000000).toFixed(1)}M per year.`,
          matchedFactKey: budgetFact.key,
        };
      }
    }
  }

  // Consortium / lead-entity requirements
  if (hasAny(requirement, ['consortium', 'lead applicant', 'lead partner', 'co-applicant'])) {
    const lead = ORG_CAPABILITIES.find((c) => c.key === 'consortium_lead_eligible');
    if (lead) {
      return { requirement, status: 'ok', message: 'ARDHI is eligible to act as lead applicant or consortium member.', matchedFactKey: lead.key };
    }
  }

  // Safeguarding (PSEAH / child protection)
  if (hasAny(requirement, ['safeguarding', 'psea', 'child protection'])) {
    const safe = ORG_CAPABILITIES.find((c) => c.key === 'safeguarding_policy');
    if (safe) {
      return { requirement, status: 'ok', message: 'ARDHI has a documented Safeguarding Policy covering PSEAH and child protection.', matchedFactKey: safe.key };
    }
  }

  // In-country / Africa / local-presence
  if (hasAny(requirement, ['uganda', 'east africa', 'african', 'in-country', 'local organisation', 'national ngo'])) {
    const local = ORG_CAPABILITIES.find((c) => c.key === 'municipal_local_presence');
    if (local) {
      return { requirement, status: 'ok', message: `ARDHI has the required in-country presence: ${typeof local.value === 'string' ? local.value : local.detail}`, matchedFactKey: local.key };
    }
  }

  // Fallback to generic keyword-overlap: only positive matches become 'ok';
  // anything unverifiable is intentionally ignored (never guessed as a gap).
  const matched = findFact(requirement);
  if (matched) {
    const v = factValue(matched);
    const matchedAsString = v === true ? 'in place' : typeof v === 'number' ? `${v}` : String(v);
    return { requirement, status: 'ok', message: `ARDHI capability on file: ${matched.label} — ${matchedAsString}.`, matchedFactKey: matched.key };
  }

  return null;
}

/**
 * Run the donor-compliance check for a list of extracted eligibility
 * requirements. Returns gaps only — requirements that are met, or that
 * cannot be verified against orgKnowledge, are not reported.
 */
export function runComplianceCheck(requirements: string[]): ComplianceGap[] {
  if (!Array.isArray(requirements)) return [];
  const out: ComplianceGap[] = [];
  requirements.forEach((req) => {
    const t = typeof req === 'string' ? req.trim() : '';
    if (!t) return;
    const result = ruleCheck(t);
    if (result && result.status === 'gap') out.push(result);
  });
  return out;
}

/**
 * Convenience wrapper that returns both gaps and all evaluated lines.
 * (Kept async so a semantic LLM pass can be added without breaking callers.)
 */
export async function evaluateCompliance(requirements: string[]): Promise<{ gaps: ComplianceGap[]; okLines: ComplianceGap[] }> {
  const gaps: ComplianceGap[] = [];
  const okLines: ComplianceGap[] = [];
  (requirements ?? []).forEach((req) => {
    const t = typeof req === 'string' ? req.trim() : '';
    if (!t) return;
    const result = ruleCheck(t);
    if (!result) return; // unverifiable → deliberately omitted (no hallucination)
    if (result.status === 'gap') gaps.push(result); else okLines.push(result);
  });
  return { gaps, okLines };
}
