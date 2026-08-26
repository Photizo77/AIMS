// src/config/roles.ts
import type { Role } from '@/types';

export const ROLE_LABELS: Record<Role, string> = {
  CD: 'Country Director',
  ED: 'Executive Director',
  SYS_ADMIN: 'System Administrator',
  COMPANY_ADMIN: 'Company Administrator',
  FINANCE: 'Finance Officer',
  GRANTS_MANAGER: 'Grants Manager (Team Lead)',
  GRANT_WRITER: 'Grant Writer',
  INNOVATOR: 'Innovator / Developer',
};

export const ROLE_HIERARCHY: Record<Role, number> = {
  CD: 100,
  ED: 95,
  SYS_ADMIN: 90,
  COMPANY_ADMIN: 80,
  FINANCE: 70,
  GRANTS_MANAGER: 65,
  GRANT_WRITER: 50,
  INNOVATOR: 40,
};

// Module access map: which roles can access which modules
const MODULE_ACCESS: Record<string, Role[]> = {
  dashboard: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN', 'FINANCE', 'GRANTS_MANAGER', 'GRANT_WRITER', 'INNOVATOR'],
  feed: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN', 'FINANCE', 'GRANTS_MANAGER', 'GRANT_WRITER', 'INNOVATOR'],
  attendance: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN', 'FINANCE', 'GRANTS_MANAGER', 'GRANT_WRITER', 'INNOVATOR'],
  hr_admin: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN'],
  grants: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN', 'GRANTS_MANAGER', 'GRANT_WRITER'],
  innovations: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN', 'INNOVATOR'],
  finance: ['CD', 'ED', 'SYS_ADMIN', 'FINANCE'],
  procurement: ['CD', 'ED', 'SYS_ADMIN', 'FINANCE'],
  approvals: ['CD', 'ED', 'FINANCE'],
  documents: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN', 'FINANCE', 'GRANTS_MANAGER', 'GRANT_WRITER', 'INNOVATOR'],
  knowledge: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN', 'FINANCE', 'GRANTS_MANAGER', 'GRANT_WRITER', 'INNOVATOR'],
  research: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN', 'FINANCE', 'GRANTS_MANAGER', 'GRANT_WRITER', 'INNOVATOR'],
  forms: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN', 'FINANCE', 'GRANTS_MANAGER', 'GRANT_WRITER', 'INNOVATOR'],
  inventory: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN'],
  calendar: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN', 'FINANCE', 'GRANTS_MANAGER', 'GRANT_WRITER', 'INNOVATOR'],
  reports: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN', 'FINANCE'],
  crm: ['CD', 'ED', 'COMPANY_ADMIN'],
  analytics: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN', 'FINANCE', 'GRANTS_MANAGER', 'GRANT_WRITER', 'INNOVATOR'],
  rbac: ['SYS_ADMIN'],
  settings: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN', 'FINANCE', 'GRANTS_MANAGER', 'GRANT_WRITER', 'INNOVATOR'],
};

/** Union of all module keys used for route protection */
export type ModuleKey = keyof typeof MODULE_ACCESS;

/**
 * Check if a role has access to a specific module
 */
export function hasModuleAccess(role: Role, module: string): boolean {
  const allowedRoles = MODULE_ACCESS[module];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}