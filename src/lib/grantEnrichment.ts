// src/lib/grantEnrichment.ts
// ============================================================
// AIMS — Grant URL enrichment types (shared client-side).
// The server function (api/enrich-grant) returns this shape. Every
// field is filled strictly from the source page text; unspecified
// values are null / "Not specified in source" — never invented.
// ============================================================

/** Missing/unstated sentinel used across extraction fields */
export const NOT_SPECIFIED = 'Not specified in source';

export interface GrantEnrichmentData {
  // Basic info
  grant_id: string | null;
  grant_title: string | null;
  funder_donor: string | null;
  funder_type: string | null;
  programme_window: string | null;
  // Scope
  thematic_focus: string | null;
  geographic_scope: string | null;
  what_it_funds_abstract: string | null;
  // Dates
  date_posted: string | null;
  call_opened: string | null;
  submission_deadline: string | null;
  deadline_time_zone: string | null;
  days_to_deadline: number | null;
  deadline_status: string | null;
  // Financials
  award_value_ceiling: string | null;
  currency: string | null;
  project_duration: string | null;
  co_funding_or_in_kind: string | null;
  // Eligibility
  eligible_applicant_type: string | null;
  consortium_allowed: string | null;
  key_eligibility_requirements: string[];
  required_documents: string[];
  // Submission
  how_to_submit: string | null;
  contact_for_queries: string | null;
  source_link: string | null;
  // Internal tracking (values suggested by the reviewer, not extracted from the page)
  our_eligibility_status: 'Eligible' | 'Conditional' | 'Not eligible' | 'Not assessed' | null;
  eligibility_gap_or_condition: string | null;
  proposed_lead_entity: string | null;
  person_allocated_to: string | null;
  application_stage: 'Identified' | 'Scoping' | 'Drafting' | 'Internal review' | 'Submitted' | null;
  priority: 'High' | 'Medium' | 'Low' | null;
  fit_score_1_to_5: number | null;
}

export interface ComplianceGap {
  /** The donor requirement that triggered the check */
  requirement: string;
  /** gap | ok — only 'gap' entries should be surfaced as warnings */
  status: 'gap' | 'ok';
  /** Human message shown in the UI (example in spec) */
  message: string;
  /** orgKnowledge fact key used for the comparison, when matched */
  matchedFactKey?: string;
}

export interface EnrichGrantResponse {
  ok: boolean;
  grant?: GrantEnrichmentData;
  compliance_gaps?: ComplianceGap[];
  meta?: {
    url: string;
    fetched_chars: number;
    provider: string | null;
    source: 'llm' | 'error';
    fetched_at: string;
  };
  error?: string;
}

export const EMPTY_ENRICHMENT: GrantEnrichmentData = {
  grant_id: null,
  grant_title: null,
  funder_donor: null,
  funder_type: null,
  programme_window: null,
  thematic_focus: null,
  geographic_scope: null,
  what_it_funds_abstract: null,
  date_posted: null,
  call_opened: null,
  submission_deadline: null,
  deadline_time_zone: null,
  days_to_deadline: null,
  deadline_status: null,
  award_value_ceiling: null,
  currency: null,
  project_duration: null,
  co_funding_or_in_kind: null,
  eligible_applicant_type: null,
  consortium_allowed: null,
  key_eligibility_requirements: [],
  required_documents: [],
  how_to_submit: null,
  contact_for_queries: null,
  source_link: null,
  our_eligibility_status: null,
  eligibility_gap_or_condition: null,
  proposed_lead_entity: null,
  person_allocated_to: null,
  application_stage: null,
  priority: null,
  fit_score_1_to_5: null,
};
