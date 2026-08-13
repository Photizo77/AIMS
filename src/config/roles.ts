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