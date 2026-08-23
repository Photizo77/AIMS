// src/data/grants.ts
export type GrantStage = 'identified' | 'drafting' | 'submitted' | 'under_review' | 'awarded' | 'declined';

export interface GrantMilestone { id: string; title: string; dueDate: string; completed: boolean; assignee: string; }
export interface GrantActivity { id: string; actor: string; action: string; timestamp: string; }

export interface GrantRecord {
  id: string; title: string; funder: string; pillar: string; handler: string; contributors: string[];
  stage: GrantStage; deadline: string; amountRequested: number; amountAwarded?: number;
  milestones: GrantMilestone[];
  activity: GrantActivity[];
}

export const GRANT_STAGES: { key: GrantStage; label: string; color: 'green' | 'navy' | 'orange' | 'mint' }[] = [
  { key: 'identified', label: 'Identified', color: 'mint' },
  { key: 'drafting', label: 'Drafting', color: 'orange' },
  { key: 'submitted', label: 'Submitted', color: 'navy' },
  { key: 'under_review', label: 'Under Review', color: 'navy' },
  { key: 'awarded', label: 'Awarded', color: 'green' },
  { key: 'declined', label: 'Declined', color: 'orange' },
];

export function formatCurrency(amount: number): string {
  if (amount >= 1000000000) return `UGX ${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `UGX ${(amount / 1000000).toFixed(0)}M`;
  return `UGX ${(amount / 1000).toFixed(0)}K`;
}

export function daysUntil(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000));
}

export function grantProgress(g: GrantRecord): number {
  if (g.milestones.length === 0) return 0;
  return Math.round((g.milestones.filter((m) => m.completed).length / g.milestones.length) * 100);
}

export const MOCK_GRANTS: GrantRecord[] = [
  {
    id: 'g1', title: 'Community Land Rights Documentation', funder: 'USAID', pillar: 'Land Governance',
    handler: 'Sarah Aciro', contributors: ['Janet Apio'], stage: 'under_review', deadline: '2026-09-05', amountRequested: 450000000,
    milestones: [
      { id: 'g1m1', title: 'Concept note drafted', dueDate: '2026-06-20', completed: true, assignee: 'Sarah Aciro' },
      { id: 'g1m2', title: 'Internal concept review', dueDate: '2026-07-01', completed: true, assignee: 'Janet Apio' },
      { id: 'g1m3', title: 'Full proposal + budget drafted', dueDate: '2026-07-25', completed: true, assignee: 'Sarah Aciro' },
      { id: 'g1m4', title: 'Submitted to funder', dueDate: '2026-08-10', completed: true, assignee: 'Sarah Aciro' },
      { id: 'g1m5', title: 'Funder feedback revisions', dueDate: '2026-08-28', completed: false, assignee: 'Janet Apio' },
      { id: 'g1m6', title: 'Final decision received', dueDate: '2026-09-05', completed: false, assignee: 'Sarah Aciro' },
    ],
    activity: [
      { id: 'g1a1', actor: 'Sarah Aciro', action: 'Created grant in Identified stage', timestamp: '2026-06-15T09:00:00Z' },
      { id: 'g1a2', actor: 'Sarah Aciro', action: 'Moved to Drafting', timestamp: '2026-06-25T10:00:00Z' },
      { id: 'g1a3', actor: 'Sarah Aciro', action: 'Moved to Submitted', timestamp: '2026-08-10T10:00:00Z' },
      { id: 'g1a4', actor: 'Sarah Aciro', action: 'Moved to Under Review after funder feedback', timestamp: '2026-08-19T09:00:00Z' },
    ],
  },
  {
    id: 'g2', title: 'Climate-Smart Farming Initiative', funder: 'EU Delegation', pillar: 'Agriculture',
    handler: 'Sarah Aciro', contributors: ['Janet Apio', 'Florence Adong'], stage: 'drafting', deadline: '2026-09-20', amountRequested: 820000000,
    milestones: [
      { id: 'g2m1', title: 'Concept note drafted', dueDate: '2026-07-15', completed: true, assignee: 'Sarah Aciro' },
      { id: 'g2m2', title: 'Theory of change workshop', dueDate: '2026-08-01', completed: true, assignee: 'Florence Adong' },
      { id: 'g2m3', title: 'Full proposal draft', dueDate: '2026-08-30', completed: false, assignee: 'Sarah Aciro' },
      { id: 'g2m4', title: 'Budget validated by Finance', dueDate: '2026-09-08', completed: false, assignee: 'Janet Apio' },
      { id: 'g2m5', title: 'ED approval + submission', dueDate: '2026-09-20', completed: false, assignee: 'Sarah Aciro' },
    ],
    activity: [
      { id: 'g2a1', actor: 'Sarah Aciro', action: 'Created grant in Identified stage', timestamp: '2026-07-01T09:00:00Z' },
      { id: 'g2a2', actor: 'Sarah Aciro', action: 'Moved to Drafting', timestamp: '2026-07-16T10:00:00Z' },
      { id: 'g2a3', actor: 'Florence Adong', action: 'Completed theory of change workshop', timestamp: '2026-08-01T15:00:00Z' },
    ],
  },
  {
    id: 'g3', title: 'Youth Digital Literacy Program', funder: 'Mastercard Foundation', pillar: 'Education',
    handler: 'Janet Apio', contributors: ['Grace Nakamya'], stage: 'submitted', deadline: '2026-10-01', amountRequested: 310000000,
    milestones: [
      { id: 'g3m1', title: 'Concept note drafted', dueDate: '2026-07-05', completed: true, assignee: 'Janet Apio' },
      { id: 'g3m2', title: 'Full proposal drafted', dueDate: '2026-07-28', completed: true, assignee: 'Janet Apio' },
      { id: 'g3m3', title: 'Budget attached', dueDate: '2026-08-05', completed: true, assignee: 'Grace Nakamya' },
      { id: 'g3m4', title: 'Submitted to funder', dueDate: '2026-08-15', completed: true, assignee: 'Janet Apio' },
      { id: 'g3m5', title: 'Funder decision', dueDate: '2026-10-01', completed: false, assignee: 'Janet Apio' },
    ],
    activity: [
      { id: 'g3a1', actor: 'Janet Apio', action: 'Created grant in Identified stage', timestamp: '2026-06-28T09:00:00Z' },
      { id: 'g3a2', actor: 'Janet Apio', action: 'Moved to Drafting', timestamp: '2026-07-06T10:00:00Z' },
      { id: 'g3a3', actor: 'Janet Apio', action: 'Moved to Submitted', timestamp: '2026-08-15T11:00:00Z' },
    ],
  },
  {
    id: 'g4', title: 'Post-Harvest Loss Reduction Pilot', funder: 'WFP', pillar: 'Food Security',
    handler: 'Florence Adong', contributors: ['Pius Odong'], stage: 'identified', deadline: '2026-11-15', amountRequested: 560000000,
    milestones: [
      { id: 'g4m1', title: 'Funder RFP analyzed', dueDate: '2026-08-20', completed: true, assignee: 'Florence Adong' },
      { id: 'g4m2', title: 'Concept note drafted', dueDate: '2026-09-10', completed: false, assignee: 'Florence Adong' },
      { id: 'g4m3', title: 'Internal concept review', dueDate: '2026-09-25', completed: false, assignee: 'Pius Odong' },
      { id: 'g4m4', title: 'Move to Drafting', dueDate: '2026-10-05', completed: false, assignee: 'Florence Adong' },
    ],
    activity: [
      { id: 'g4a1', actor: 'Florence Adong', action: 'Created grant in Identified stage', timestamp: '2026-08-10T09:00:00Z' },
      { id: 'g4a2', actor: 'Florence Adong', action: 'Completed RFP analysis', timestamp: '2026-08-20T14:00:00Z' },
    ],
  },
  {
    id: 'g5', title: 'Women-Led Agri-Business Accelerator', funder: 'UN Women', pillar: 'Gender & Livelihoods',
    handler: 'Janet Apio', contributors: ['Sarah Aciro'], stage: 'awarded', deadline: '2026-08-01', amountRequested: 380000000, amountAwarded: 350000000,
    milestones: [
      { id: 'g5m1', title: 'Full proposal submitted', dueDate: '2026-06-10', completed: true, assignee: 'Janet Apio' },
      { id: 'g5m2', title: 'Award notification received', dueDate: '2026-07-20', completed: true, assignee: 'Janet Apio' },
      { id: 'g5m3', title: 'Agreement signed', dueDate: '2026-08-01', completed: true, assignee: 'Sarah Aciro' },
      { id: 'g5m4', title: 'Onboarded to Finance', dueDate: '2026-08-10', completed: true, assignee: 'Sarah Aciro' },
    ],
    activity: [
      { id: 'g5a1', actor: 'Janet Apio', action: 'Moved to Awarded', timestamp: '2026-07-20T09:00:00Z' },
      { id: 'g5a2', actor: 'Sarah Aciro', action: 'Agreement signed and filed', timestamp: '2026-08-01T10:00:00Z' },
      { id: 'g5a3', actor: 'Sarah Aciro', action: 'Handed over to Finance for onboarding', timestamp: '2026-08-10T11:00:00Z' },
    ],
  },
  {
    id: 'g6', title: 'Rural Water Infrastructure Assessment', funder: 'World Bank', pillar: 'Infrastructure',
    handler: 'Sarah Aciro', contributors: [], stage: 'declined', deadline: '2026-07-15', amountRequested: 920000000,
    milestones: [
      { id: 'g6m1', title: 'Full proposal submitted', dueDate: '2026-06-01', completed: true, assignee: 'Sarah Aciro' },
      { id: 'g6m2', title: 'Funder decision received', dueDate: '2026-07-15', completed: true, assignee: 'Sarah Aciro' },
    ],
    activity: [
      { id: 'g6a1', actor: 'Sarah Aciro', action: 'Moved to Declined — funder cited strategic misalignment', timestamp: '2026-07-15T09:00:00Z' },
    ],
  },
  {
    id: 'g7', title: 'Indigenous Knowledge Preservation', funder: 'Ford Foundation', pillar: 'Culture & Heritage',
    handler: 'Janet Apio', contributors: ['Florence Adong'], stage: 'drafting', deadline: '2026-10-30', amountRequested: 270000000,
    milestones: [
      { id: 'g7m1', title: 'Concept note drafted', dueDate: '2026-08-10', completed: true, assignee: 'Janet Apio' },
      { id: 'g7m2', title: 'Community consultation summary', dueDate: '2026-08-25', completed: true, assignee: 'Florence Adong' },
      { id: 'g7m3', title: 'Full proposal draft', dueDate: '2026-09-20', completed: false, assignee: 'Janet Apio' },
      { id: 'g7m4', title: 'Budget validated', dueDate: '2026-10-10', completed: false, assignee: 'Janet Apio' },
      { id: 'g7m5', title: 'ED approval + submission', dueDate: '2026-10-30', completed: false, assignee: 'Janet Apio' },
    ],
    activity: [
      { id: 'g7a1', actor: 'Janet Apio', action: 'Created grant in Identified stage', timestamp: '2026-07-25T09:00:00Z' },
      { id: 'g7a2', actor: 'Janet Apio', action: 'Moved to Drafting', timestamp: '2026-08-11T10:00:00Z' },
    ],
  },
  {
    id: 'g8', title: 'Solar Irrigation for Smallholders', funder: 'GCF', pillar: 'Agriculture',
    handler: 'Florence Adong', contributors: ['Pius Odong', 'Isaac Tumusiime'], stage: 'identified', deadline: '2026-12-01', amountRequested: 680000000,
    milestones: [
      { id: 'g8m1', title: 'Funder criteria assessment', dueDate: '2026-09-05', completed: false, assignee: 'Florence Adong' },
      { id: 'g8m2', title: 'Concept note drafted', dueDate: '2026-09-30', completed: false, assignee: 'Pius Odong' },
      { id: 'g8m3', title: 'Internal concept review', dueDate: '2026-10-15', completed: false, assignee: 'Isaac Tumusiime' },
    ],
    activity: [
      { id: 'g8a1', actor: 'Florence Adong', action: 'Created grant in Identified stage', timestamp: '2026-08-18T09:00:00Z' },
    ],
  },
];