// src/types/index.ts
// ============================================================
// AIMS — Central Type Definitions
// Aligned with AIMS Specification v1.0
// ============================================================

// ─────────────────────────────────────────────
// ROLES (6 personas per spec)
// ─────────────────────────────────────────────
export type Role =
  | 'CD'
  | 'ED'
  | 'SYS_ADMIN'
  | 'COMPANY_ADMIN'
  | 'FINANCE'
  | 'GRANT_WRITER'
  | 'INNOVATOR';

// ─────────────────────────────────────────────
// DEPARTMENTS
// ─────────────────────────────────────────────
export type Department =
  | 'Executive'
  | 'Administration'
  | 'Finance'
  | 'HR'
  | 'Grants'
  | 'Research'
  | 'Innovation'
  | 'Procurement'
  | 'IT';

// ─────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: Department;
  avatarUrl?: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  lastLogin?: string;
}

// ─────────────────────────────────────────────
// APPROVAL WORKFLOW STATUS
// ─────────────────────────────────────────────
export type ApprovalStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'edited';

// ─────────────────────────────────────────────
// REQUISITIONS (Finance)
// ─────────────────────────────────────────────
export interface Requisition {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  department: Department;
  requestedBy: string;
  status: ApprovalStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

// ─────────────────────────────────────────────
// PAYSLIPS (HR / Company Admin)
// ─────────────────────────────────────────────
export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: ApprovalStatus;
  generatedBy: string;
  approvedBy?: string;
  generatedAt: string;
  approvedAt?: string;
}

// ─────────────────────────────────────────────
// CONTRACTS (HR / Company Admin)
// ─────────────────────────────────────────────
export type ContractType = 'permanent' | 'contract' | 'intern' | 'consultant';

export interface Contract {
  id: string;
  employeeId: string;
  employeeName: string;
  type: ContractType;
  startDate: string;
  endDate?: string;
  salary: number;
  status: 'active' | 'expiring' | 'expired' | 'terminated';
  terms?: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// PERFORMANCE / APPRAISALS
// ─────────────────────────────────────────────
export interface KPI {
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
  kpis: KPI[];
  overallRating: number;
  reviewerComments?: string;
  status: 'draft' | 'submitted' | 'acknowledged';
  reviewerId: string;
  submittedAt?: string;
}

// ─────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave' | 'remote';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  notes?: string;
}

// ─────────────────────────────────────────────
// GRANTS
// ─────────────────────────────────────────────
export type GrantPillar = string;

export type GrantStatus = 'idea' | 'drafting' | 'submitted' | 'awarded' | 'rejected';

export interface Grant {
  id: string;
  uniqueId: string;
  title: string;
  pillar: GrantPillar;
  description: string;
  amount: number;
  assignedWriterId: string;
  status: GrantStatus;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// INNOVATIONS (Developers & Innovators)
// ─────────────────────────────────────────────
export type InnovationStatus = 'concept' | 'research' | 'prototype' | 'testing' | 'deployed';

export interface Innovation {
  id: string;
  title: string;
  description: string;
  assignedTo: string[];
  status: InnovationStatus;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// FEED (replaces Chat)
// ─────────────────────────────────────────────
export interface FeedComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  department: Department;
  content: string;
  createdAt: string;
  likes: number;
  comments: FeedComment[];
}

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'approval';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

// ─────────────────────────────────────────────
// NAVIGATION (used by sidebar)
// ─────────────────────────────────────────────
export interface NavItem {
  title: string;
  href: string;
  icon: string;
  roles: Role[] | 'ALL';
}