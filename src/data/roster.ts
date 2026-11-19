// src/data/roster.ts
// ============================================================
// AIMS — UNIFIED STAFF ROSTER (single source of truth)
// Login accounts, HR directory, feed mentions, notification
// addressing and handoffs all resolve against this one list.
//
// FRESH START: the organisation is empty apart from Maya Namutebi
// (Company Administrator). Every other hire is added through the
// onboarding pipeline — Employee Information Form → provision login,
// role, 2FA and assets.
// ============================================================

import type { Role } from '@/types';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  position: string;
  status: 'active' | 'inactive';
  /** Emails that can sign in to AIMS */
  loginEmail?: string;
  phone?: string;
}

export const STAFF_ROSTER: StaffMember[] = [
  {
    id: 'user-admin-001',
    name: 'Maya Namutebi',
    email: 'maya.namutebi@ardhi.org.ug',
    loginEmail: 'admin@aims.org',
    role: 'COMPANY_ADMIN',
    department: 'HR & Admin',
    position: 'Company Administrator',
    status: 'active',
  },
];

export const ACTIVE_STAFF = STAFF_ROSTER.filter((s) => s.status === 'active');

/** Accounts that can sign in (persona logins) */
export const LOGIN_STAFF = STAFF_ROSTER.filter((s) => s.loginEmail);

export const staffByName = (name: string): StaffMember | undefined =>
  STAFF_ROSTER.find((s) => s.name.toLowerCase() === name.trim().toLowerCase());

export const staffByEmail = (email: string): StaffMember | undefined =>
  STAFF_ROSTER.find((s) => (s.loginEmail ?? s.email).toLowerCase() === email.trim().toLowerCase());

export const staffById = (id: string): StaffMember | undefined => STAFF_ROSTER.find((s) => s.id === id);

/** Map any person's name to their ARDHI email (used by notifications/email) */
export function personEmail(nameOrId: string): string {
  const byName = staffByName(nameOrId);
  if (byName) return byName.email;
  const byId = staffById(nameOrId);
  if (byId) return byId.email;
  return `${nameOrId.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@ardhi.org.ug`;
}
