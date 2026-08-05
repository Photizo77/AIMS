// src/config/roles.ts
// ============================================================
// AIMS — Role Definitions & Access Control
// Aligned with AIMS Specification v1.0
// ============================================================

import type { Role } from '@/types';

// ─────────────────────────────────────────────
// ROLE LABELS (for display in UI)
// ─────────────────────────────────────────────
export const ROLE_LABELS: Record<Role, string> = {
  CD: 'Country Director',
  ED: 'Executive Director',
  SYS_ADMIN: 'System Administrator',
  COMPANY_ADMIN: 'Company Administrator',
  FINANCE: 'Finance Officer',
  GRANT_WRITER: 'Grant Writer',
  INNOVATOR: 'Innovator / Developer',
};

// ─────────────────────────────────────────────
// ROLE HIERARCHY (higher number = more authority)
// ─────────────────────────────────────────────
export const ROLE_HIERARCHY: Record<Role, number> = {
  CD: 100,
  ED: 90,
  SYS_ADMIN: 80,
  COMPANY_ADMIN: 60,
  FINANCE: 50,
  GRANT_WRITER: 40,
  INNOVATOR: 40,
};

// ─────────────────────────────────────────────
// MODULE ACCESS CONTROL
// Strictly aligned with RBAC Matrix from spec
// ─────────────────────────────────────────────
export type ModuleKey =
  | 'dashboard'
  | 'feed'
  | 'attendance'
  | 'hr_admin'
  | 'finance'
  | 'procurement'
  | 'grants'
  | 'innovations'
  | 'documents'
  | 'inventory'
  | 'approvals'
  | 'analytics'
  | 'crm'
  | 'research'
  | 'knowledge'
  | 'rbac'
  | 'settings';

export const MODULE_ACCESS: Record<ModuleKey, Role[] | 'ALL'> = {
  // Everyone gets these
  dashboard: 'ALL',
  feed: 'ALL',
  attendance: 'ALL',
  settings: 'ALL',

  // HR & Admin — CD/ED, Company Admin, System Admin
  hr_admin: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN'],

  // Finance & Procurement — CD/ED, System Admin, Finance ONLY
  finance: ['CD', 'ED', 'SYS_ADMIN', 'FINANCE'],
  procurement: ['CD', 'ED', 'SYS_ADMIN', 'FINANCE'],

  // Approvals — CD/ED approve, Finance creates/pushes, SysAdmin views
  approvals: ['CD', 'ED', 'SYS_ADMIN', 'FINANCE'],

  // Grants — CD/ED, SysAdmin, Company Admin, Grant Writer
  grants: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN', 'GRANT_WRITER'],

  // Innovations — CD/ED, SysAdmin, Company Admin, Innovator
  innovations: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN', 'INNOVATOR'],

  // Documents (Meeting Minutes) — CD/ED, SysAdmin, Company Admin
  documents: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN'],

  // Inventory — CD/ED, SysAdmin, Company Admin
  inventory: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN'],

  // Analytics — CD/ED, SysAdmin, Company Admin, Finance
  analytics: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN', 'FINANCE'],

  // CRM — CD/ED, SysAdmin, Company Admin
  crm: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN'],

  // Research — CD/ED, SysAdmin, Innovator
  research: ['CD', 'ED', 'SYS_ADMIN', 'INNOVATOR'],

  // Knowledge — CD/ED, SysAdmin, Company Admin
  knowledge: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN'],

  // RBAC — CD/ED, SysAdmin only
  rbac: ['CD', 'ED', 'SYS_ADMIN'],
};

// ─────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────
export function hasModuleAccess(role: Role, module: ModuleKey): boolean {
  const access = MODULE_ACCESS[module];
  if (access === 'ALL') return true;
  return access.includes(role);
}

export function isApprover(role: Role): boolean {
  return role === 'ED' || role === 'CD';
}

export function isAdmin(role: Role): boolean {
  return role === 'SYS_ADMIN' || role === 'COMPANY_ADMIN' || role === 'CD' || role === 'ED';
}

export function hasFullNavigation(role: Role): boolean {
  return role === 'SYS_ADMIN' || role === 'CD' || role === 'ED';
}