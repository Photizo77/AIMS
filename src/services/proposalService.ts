// src/services/proposalService.ts
// ============================================================
// AIMS — Grant Proposal Workspace (persisted)
// Sectioned proposal editor with autosave and versioning, one per grant.
// ============================================================

import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';
import { grantService } from './grantService';

export interface ProposalSection { key: string; title: string; content: string; }
export interface ProposalVersion { v: number; savedAt: string; sections: ProposalSection[]; }
export interface GrantProposal { grantId: string; sections: ProposalSection[]; versions: ProposalVersion[]; updatedAt: string; }

export const PROPOSAL_SECTION_DEFS: { key: string; title: string; hint: string }[] = [
  { key: 'problem', title: 'Problem Statement', hint: 'The challenge, who it affects, and why it matters.' },
  { key: 'objectives', title: 'Objectives', hint: 'Overall goal and specific, measurable objectives.' },
  { key: 'methodology', title: 'Methodology', hint: 'Approach, activities, partners and delivery model.' },
  { key: 'budget_narrative', title: 'Budget Narrative', hint: 'Justify each budget line and how costs were estimated.' },
  { key: 'me', title: 'Monitoring & Evaluation', hint: 'Indicators, targets, data collection and learning.' },
  { key: 'sustainability', title: 'Sustainability', hint: 'How results continue after the grant ends (5 dimensions).' },
];

const persisted = loadJSON<Record<string, GrantProposal> | null>(STORAGE_KEYS.proposals, null);
let proposals: Record<string, GrantProposal> = persisted ?? {};

function persist(): void {
  saveJSON(STORAGE_KEYS.proposals, proposals);
}

function seedFromGrant(grantId: string): GrantProposal {
  const g = grantService.getGrantById(grantId);
  const intro = g?.description ?? '';
  const proposal: GrantProposal = {
    grantId,
    sections: PROPOSAL_SECTION_DEFS.map((d) => ({
      key: d.key,
      title: d.title,
      content: d.key === 'problem' && intro ? intro : '',
    })),
    versions: [],
    updatedAt: new Date().toISOString(),
  };
  proposals[grantId] = proposal;
  persist();
  return proposal;
}

export const proposalService = {
  getProposal(grantId: string): GrantProposal {
    return proposals[grantId] ?? seedFromGrant(grantId);
  },
  getSection(grantId: string, key: string): ProposalSection | undefined {
    return this.getProposal(grantId).sections.find((s) => s.key === key);
  },
  updateSection(grantId: string, key: string, content: string): GrantProposal {
    const proposal = this.getProposal(grantId);
    proposal.sections = proposal.sections.map((s) => (s.key === key ? { ...s, content } : s));
    proposal.updatedAt = new Date().toISOString();
    persist();
    return proposal;
  },
  saveVersion(grantId: string): ProposalVersion {
    const proposal = this.getProposal(grantId);
    const v = (proposal.versions[proposal.versions.length - 1]?.v ?? 0) + 1;
    const version: ProposalVersion = { v, savedAt: new Date().toISOString(), sections: proposal.sections.map((s) => ({ ...s })) };
    proposal.versions = [...proposal.versions, version];
    persist();
    return version;
  },
  restoreVersion(grantId: string, v: number): GrantProposal {
    const proposal = this.getProposal(grantId);
    const version = proposal.versions.find((x) => x.v === v);
    if (version) {
      proposal.sections = version.sections.map((s) => ({ ...s }));
      proposal.updatedAt = new Date().toISOString();
      persist();
    }
    return proposal;
  },
  latestVersion(grantId: string): ProposalVersion | undefined {
    const proposal = this.getProposal(grantId);
    return proposal.versions[proposal.versions.length - 1];
  },
};
