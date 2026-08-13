// src/types/index.ts
export type Role = 'CD' | 'ED' | 'SYS_ADMIN' | 'COMPANY_ADMIN' | 'FINANCE' | 'GRANTS_MANAGER' | 'GRANT_WRITER' | 'INNOVATOR';
export type Department = 'Executive' | 'Administration' | 'Finance' | 'HR' | 'Grants' | 'Research' | 'Innovation' | 'Procurement' | 'IT';

export interface User {
  id: string; name: string; email: string; role: Role; department: Department;
  avatarUrl?: string; status: 'active' | 'inactive' | 'pending';
  createdAt: string; lastLogin?: string;
}

export type GrantReviewStatus = 'draft' | 'team_review' | 'ed_review' | 'approved' | 'rejected';
export interface Grant {
  id: string; uniqueId: string; title: string; pillar: string; description: string;
  amount: number; assignedWriterId: string; status: GrantReviewStatus; deadline: string;
  rfpDocumentUrl?: string; externalLink?: string; teamLeadNotes?: string; edNotes?: string;
  reminderSent?: boolean; createdAt: string; updatedAt: string;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'approval' | 'deadline' | 'email';
export interface Notification {
  id: string; userId: string; title: string; message: string;
  type: NotificationType; read: boolean; createdAt: string; actionUrl?: string;
}

export type BudgetStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'withheld';
export interface BudgetSubmission {
  id: string; department: Department; submittedBy: string; submittedByName: string;
  period: string; totalAmount: number; status: BudgetStatus;
  edNotes?: string; createdAt: string; updatedAt: string; lineItems: { category: string; amount: number }[];
}

export interface ExpenseRecord {
  id: string; date: string; category: string; description: string;
  amount: number; department: Department; approvedBy?: string; status: 'pending' | 'approved' | 'flagged';
}

export interface MeetingMinute {
  id: string; title: string; date: string; attendees: string[];
  status: 'draft' | 'approved'; summary: string; fullContent: string;
}

export interface Policy {
  id: string; title: string; category: 'internal' | 'external';
  department: string; lastUpdated: string; downloadUrl: string; content: string;
}

export interface CRMContact {
  id: string; name: string; organization: string; email: string; phone: string;
  type: 'donor' | 'partner' | 'government' | 'vendor'; lastContact: string; notes: string;
}

export interface KnowledgeResource {
  id: string; title: string; type: 'document' | 'video' | 'audio' | 'photo';
  category: string; uploadedBy: string; uploadedAt: string; url: string; description: string;
}

// Preserved types
export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'edited';
export interface Requisition {
  id: string; title: string; description: string; amount: number; category: string;
  department: Department; requestedBy: string; status: ApprovalStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent'; createdAt: string; updatedAt: string;
  approvedBy?: string; approvedAt?: string; notes?: string;
}
export interface Payslip {
  id: string; employeeId: string; employeeName: string; period: string;
  baseSalary: number; allowances: number; deductions: number; netPay: number;
  status: ApprovalStatus; generatedBy: string; approvedBy?: string; generatedAt: string; approvedAt?: string;
}
export interface Contract {
  id: string; employeeId: string; employeeName: string; type: 'permanent' | 'contract' | 'intern' | 'consultant';
  startDate: string; endDate?: string; salary: number;
  status: 'active' | 'expiring' | 'expired' | 'terminated';
  scannedUrl?: string; createdAt: string; updatedAt: string;
}
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave' | 'remote';
export interface AttendanceRecord {
  id: string; employeeId: string; employeeName: string; date: string;
  checkIn?: string; checkOut?: string; status: AttendanceStatus;
  locationType?: 'onsite' | 'remote'; coordinates?: string; hoursWorked?: number;
  position?: string; department?: Department;
}
export interface FeedComment { id: string; authorId: string; authorName: string; content: string; createdAt: string; }
export interface FeedPost {
  id: string; authorId: string; authorName: string; department: Department;
  content: string; createdAt: string; likes: number; comments: FeedComment[];
}
export interface NavItem { title: string; href: string; icon: string; roles: Role[] | 'ALL'; }