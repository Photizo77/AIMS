// ═══════════════════════════════════════════
// AIMS — SHARED DOMAIN TYPES
// ═══════════════════════════════════════════

// ─────────────────────────────────────────────
// AUTH & ROLES
// ─────────────────────────────────────────────

export type Role =
  | 'CD'
  | 'ED'
  | 'SYS_ADMIN'
  | 'COMPANY_ADMIN'
  | 'FINANCE'
  | 'GRANTS_MANAGER'
  | 'GRANT_WRITER'
  | 'INNOVATOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  avatarUrl?: string;
}

// ─────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  roles: Role[];
}

// ─────────────────────────────────────────────
// NOTIFICATIONS & TOASTS
// ─────────────────────────────────────────────

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'approval';

export interface Notification {
  id: string;
  /** Target user id (empty = org-wide); falls back to recipientName matching */
  userId?: string;
  title: string;
  message: string;
  type: NotificationType;
  /** Optional deep link navigated to when the notification is clicked */
  link?: string;
  actionUrl?: string;
  /** Name-based targeting fallback (e.g. handoffs by person name) */
  recipientName?: string;
  createdAt: string;
  read: boolean;
}

// ─────────────────────────────────────────────
// GEOFENCE / ATTENDANCE
// ─────────────────────────────────────────────

export interface GeofenceConfig {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  label: string;
}

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave' | 'remote';

// ─────────────────────────────────────────────
// HR / ADMIN
// ─────────────────────────────────────────────

export type ContractType = 'permanent' | 'contract' | 'intern' | 'fixed-term';
export type ContractStatus = 'active' | 'expiring' | 'expired' | 'terminated';

export interface Contract {
  id: string;
  employeeId: string;
  employeeName: string;
  type: ContractType;
  startDate: string;
  endDate?: string;
  salary: number;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AppraisalKpi {
  id: string;
  name: string;
  target: number;
  achieved: number;
  weight: number;
}

export interface Appraisal {
  id: string;
  employeeId: string;
  employeeName: string;
  reviewPeriod: string;
  kpis: AppraisalKpi[];
  overallRating: number;
  status: 'draft' | 'submitted' | 'acknowledged';
  reviewerId: string;
  submittedAt: string;
}

// ─────────────────────────────────────────────
// FINANCE
// ─────────────────────────────────────────────

export type BudgetStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'withheld';

export interface BudgetLineItem {
  category: string;
  amount: number;
}

export interface BudgetSubmission {
  id: string;
  department: string;
  submittedBy: string;
  submittedByName: string;
  period: string;
  totalAmount: number;
  status: BudgetStatus;
  edNotes?: string;
  createdAt: string;
  updatedAt: string;
  lineItems: BudgetLineItem[];
}

export type ExpenseStatus = 'approved' | 'pending' | 'flagged';

export interface ExpenseRecord {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  department: string;
  status: ExpenseStatus;
  approvedBy?: string;
}

export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'edited';
export type RequisitionPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Requisition {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  department: string;
  requestedBy: string;
  status: ApprovalStatus;
  priority: RequisitionPriority;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

// ─────────────────────────────────────────────
// GRANTS (review-workflow flavor used by GrantsHistory / GrantsManager)
// ─────────────────────────────────────────────

export type GrantStatus = 'idea' | 'drafting' | 'submitted' | 'awarded' | 'rejected';
export type GrantReviewStatus = 'draft' | 'team_review' | 'ed_review' | 'approved' | 'rejected';

export interface Grant {
  id: string;
  uniqueId: string;
  title: string;
  pillar: string;
  description: string;
  amount: number;
  assignedWriterId: string;
  status: GrantStatus | GrantReviewStatus;
  deadline: string;
  rfpDocumentUrl?: string;
  externalLink?: string;
  teamLeadNotes?: string;
  edNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// CRM & KNOWLEDGE
// ─────────────────────────────────────────────

export type CRMContactType = 'donor' | 'government' | 'partner' | 'vendor' | 'media' | 'other';

export interface CRMContact {
  id: string;
  name: string;
  organization: string;
  email: string;
  phone: string;
  type: CRMContactType;
  lastContact: string;
  notes: string;
}

export type KnowledgeResourceType = 'document' | 'video' | 'audio' | 'photo';

export interface KnowledgeResource {
  id: string;
  title: string;
  type: KnowledgeResourceType;
  category: string;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
  description: string;
}

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
