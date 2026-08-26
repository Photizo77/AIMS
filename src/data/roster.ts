// src/data/roster.ts
// ============================================================
// AIMS — UNIFIED STAFF ROSTER (single source of truth)
// Login accounts, HR directory, feed mentions, notification
// addressing and handoffs all resolve against this one list.
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
  { id: 'user-cd-001', name: 'Nassir Mwanje', email: 'nassir.mwanje@ardhi.org.ug', loginEmail: 'cd@aims.org', role: 'CD', department: 'Executive', position: 'Country Director', status: 'active' },
  { id: 'user-ed-001', name: 'Peter Byamugisha', email: 'peter.byamugisha@ardhi.org.ug', loginEmail: 'ed@aims.org', role: 'ED', department: 'Executive', position: 'Executive Director', status: 'active' },
  { id: 'user-sysadmin-001', name: 'Okello Komakech', email: 'okello.komakech@ardhi.org.ug', loginEmail: 'sysadmin@aims.org', role: 'SYS_ADMIN', department: 'IT', position: 'System Administrator', status: 'active' },
  { id: 'user-admin-001', name: 'Grace Aceng', email: 'grace.aceng@ardhi.org.ug', loginEmail: 'admin@aims.org', role: 'COMPANY_ADMIN', department: 'HR & Admin', position: 'Company Administrator', status: 'active' },
  { id: 'user-finance-001', name: 'Amos Ojok', email: 'amos.ojok@ardhi.org.ug', loginEmail: 'finance@aims.org', role: 'FINANCE', department: 'Finance', position: 'Finance Officer', status: 'active' },
  { id: 'user-gm-001', name: 'Sarah Aciro', email: 'sarah.aciro@ardhi.org.ug', loginEmail: 'grantsmanager@aims.org', role: 'GRANTS_MANAGER', department: 'Grants', position: 'Grants Manager', status: 'active' },
  { id: 'user-gw-001', name: 'Janet Apio', email: 'janet.apio@ardhi.org.ug', loginEmail: 'grants@aims.org', role: 'GRANT_WRITER', department: 'Grants', position: 'Grant Writer', status: 'active' },
  { id: 'user-innov-001', name: 'Pius Odong', email: 'pius.odong@ardhi.org.ug', loginEmail: 'innovation@aims.org', role: 'INNOVATOR', department: 'Innovation', position: 'Lead Innovator', status: 'active' },
  { id: 'u-florence', name: 'Florence Adong', email: 'florence.adong@ardhi.org.ug', role: 'GRANT_WRITER', department: 'Grants', position: 'Research Officer', status: 'active' },
  { id: 'u-isaac', name: 'Isaac Tumusiime', email: 'isaac.tumusiime@ardhi.org.ug', role: 'FINANCE', department: 'Finance', position: 'Procurement & Finance Officer', status: 'active' },
  { id: 'u-grace-n', name: 'Grace Nakamya', email: 'grace.nakamya@ardhi.org.ug', role: 'COMPANY_ADMIN', department: 'HR & Admin', position: 'HR & Admin Officer', status: 'active' },
  { id: 'u-david', name: 'David Okello', email: 'david.okello@ardhi.org.ug', role: 'GRANT_WRITER', department: 'Grants', position: 'Grant Writer (trial)', status: 'active' },
  { id: 'u-mercy', name: 'Mercy Atim', email: 'mercy.atim@ardhi.org.ug', role: 'GRANT_WRITER', department: 'Grants', position: 'Research Assistant', status: 'inactive' },
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
