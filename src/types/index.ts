// ═══════════════════════════════════════════
// INNOVATIONS MODULE TYPES
// ═══════════════════════════════════════════

export type InnovationStage = 'research' | 'concept' | 'prototype' | 'testing' | 'production' | 'deployed';

export const INNOVATION_STAGES: InnovationStage[] = [
  'research', 'concept', 'prototype', 'testing', 'production', 'deployed',
];

export const INNOVATION_STAGE_LABELS: Record<InnovationStage, string> = {
  research: 'Research',
  concept: 'Concept',
  prototype: 'Prototype',
  testing: 'Testing',
  production: 'Production',
  deployed: 'Deployed',
};

export interface InnovationMilestone {
  id: string;
  title: string;
  dueDate: string;
  assigneeName: string;
  completed: boolean;
}

export interface InnovationActivityEntry {
  id: string;
  timestamp: string;
  actorName: string;
  /** Auto-generated for stage transitions; manual for comments/updates */
  type: 'stage_transition' | 'comment' | 'milestone_update' | 'document_linked' | 'flag';
  description: string;
  /** Previous stage (only for stage_transition type) */
  fromStage?: InnovationStage;
  /** New stage (only for stage_transition type) */
  toStage?: InnovationStage;
}

export interface InnovationDocument {
  id: string;
  title: string;
  /** 'upload' = file uploaded directly; 'link' = reference to Documents hub */
  source: 'upload' | 'link';
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  fileType?: string;
}

export interface InnovationComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  content: string;
  createdAt: string;
  /** If this is a flag raised by CD */
  isFlag?: boolean;
  flagType?: 'concern' | 'review' | 'urgent' | 'clarification';
}

export interface InnovationProject {
  id: string;
  title: string;
  description: string;
  stage: InnovationStage;
  leadName: string;
  contributorNames: string[];
  progressPercent: number;
  daysInStage: number;
  milestones: InnovationMilestone[];
  activityLog: InnovationActivityEntry[];
  comments: InnovationComment[];
  documents: InnovationDocument[];
  createdAt: string;
  updatedAt: string;
}