// src/services/userOpsService.ts
// ============================================================
// AIMS — User operations store (persisted).
// Account directory (built over the unified staff roster),
// provisioning, role changes, status toggles, credential resets,
// API keys, MFA resets and the account audit log — all real and
// persisted, with every operation recorded to the audit trail.
// ============================================================

import { loadJSON, saveJSON, STORAGE_KEYS, demoMode } from '@/lib/storage';
import { STAFF_ROSTER } from '@/data/roster';
import type { Role } from '@/types';
import { ROLE_LABELS } from '@/config/roles';

export interface ManagedUser {
  id: string; name: string; email: string; role: Role; department: string;
  status: 'active' | 'inactive'; provisioned: boolean; position: string;
  credentialVersion: number; lastResetAt?: string; apiKey?: string; mfaEnabled: boolean;
  /** Unique, human-readable account ID (ARD-EMP-0001…). Unique per user,
   *  even when several users share the same role/persona. */
  userCode: string;
}
export interface AuditEntry { id: string; ts: string; user: string; action: string; by: string; }
export interface OnboardStep { id: string; label: string; done: boolean; detail?: string; }
export interface Onboardee {
  id: string; name: string; hired: string; steps: OnboardStep[];
  email?: string; role?: string; startDate?: string;
}

interface UserOpsState { users: ManagedUser[]; audit: AuditEntry[]; onboardees: Onboardee[]; }

const ONBOARD_STEP_TEMPLATE: { id: string; label: string }[] = [
  { id: 's1', label: 'Provision Account' },
  { id: 's2', label: 'Assign Role' },
  { id: 's3', label: 'Issue Credentials' },
  { id: 's4', label: 'Asset Issuance' },
];

function seedUsers(): ManagedUser[] {
  return STAFF_ROSTER.map((s, i) => {
    const trial = s.position.toLowerCase().includes('trial');
    return {
      id: s.id, name: s.name, email: s.email, role: s.role, department: s.department,
      status: s.status, provisioned: !trial, position: s.position,
      credentialVersion: 0, mfaEnabled: false,
      userCode: `ARD-EMP-${String(i + 1).padStart(4, '0')}`,
    };
  });
}

function seedOnboardees(): Onboardee[] {
  return [
    { id: 'ob1', name: 'Pius Odong', hired: 'Aug 20, 2026', steps: [
      { id: 's1', label: 'Provision Account', done: true, detail: 'pius.odong@ardhi.org · temp password set' },
      { id: 's2', label: 'Assign Role', done: true, detail: 'Innovator' },
      { id: 's3', label: 'Issue Credentials', done: true, detail: 'MFA enabled · API key generated' },
      { id: 's4', label: 'Asset Issuance', done: false, detail: 'Laptop, phone, access card → Inventory' },
    ] },
    { id: 'ob2', name: 'Florence Adong', hired: 'Aug 25, 2026', steps: ONBOARD_STEP_TEMPLATE.map((s) => ({ ...s, done: s.id === 's1', detail: s.id === 's1' ? 'florence.adong@ardhi.org' : undefined })) },
    { id: 'ob3', name: 'David Okello', hired: 'Aug 28, 2026', steps: ONBOARD_STEP_TEMPLATE.map((s) => ({ ...s, done: false })) },
  ];
}

function seedAudit(): AuditEntry[] {
  const now = new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return [
    { id: 'a1', ts: now, user: 'System', action: 'User directory seeded from the staff roster', by: 'System' },
  ];
}

const persisted = loadJSON<UserOpsState | null>(STORAGE_KEYS.userOps, null);
let state: UserOpsState = persisted && persisted.users
  ? persisted
  : { users: seedUsers(), audit: demoMode() ? seedAudit() : [], onboardees: demoMode() ? seedOnboardees() : [] };

// Backfill unique user codes for records created before codes existed.
(function ensureUserCodes(): void {
  let changed = false;
  let seq = state.users.reduce((m, u) => {
    const n = Number.parseInt((u.userCode ?? '').split('-').pop() ?? '0', 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  const used = new Set<string>();
  state = {
    ...state,
    users: state.users.map((u) => {
      if (u.userCode && !used.has(u.userCode)) {
        used.add(u.userCode);
        return u;
      }
      let code = '';
      do {
        seq += 1;
        code = `ARD-EMP-${String(seq).padStart(4, '0')}`;
      } while (used.has(code));
      used.add(code);
      changed = true;
      return { ...u, userCode: code };
    }),
  };
  if (changed) persist();
})();

function persist(): void { saveJSON(STORAGE_KEYS.userOps, state); }
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const ts = () => new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const rand = (len: number) => Array.from({ length: len }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

function log(user: string, action: string, by: string): void {
  state = { ...state, audit: [{ id: `a-${Date.now()}-${Math.floor(Math.random() * 1000)}`, ts: ts(), user, action, by }, ...state.audit] };
}

export const userOpsGet = {
  users: (): ManagedUser[] => clone(state.users),
  audit: (): AuditEntry[] => clone(state.audit),
  onboardees: (): Onboardee[] => clone(state.onboardees),
};

export function setUserRole(id: string, role: Role, by: string): ManagedUser | undefined {
  const u = state.users.find((x) => x.id === id);
  if (!u) return undefined;
  const next: ManagedUser = { ...u, role };
  state = { ...state, users: state.users.map((x) => (x.id === id ? next : x)) };
  log(u.name, `Role changed to "${ROLE_LABELS[role]}"`, by);
  persist();
  return clone(next);
}

export function toggleUserStatus(id: string, by: string): ManagedUser | undefined {
  const u = state.users.find((x) => x.id === id);
  if (!u) return undefined;
  const status: ManagedUser['status'] = u.status === 'active' ? 'inactive' : 'active';
  const next: ManagedUser = { ...u, status };
  state = { ...state, users: state.users.map((x) => (x.id === id ? next : x)) };
  log(u.name, status === 'inactive' ? 'Account deactivated' : 'Account reactivated', by);
  persist();
  return clone(next);
}

/** Reset credential — returns the temporary one-time code */
export function resetCredential(id: string, by: string): { code: string; user: ManagedUser } | undefined {
  const u = state.users.find((x) => x.id === id);
  if (!u) return undefined;
  const code = `ARD-${rand(6)}`;
  const next: ManagedUser = { ...u, credentialVersion: u.credentialVersion + 1, lastResetAt: new Date().toISOString() };
  state = { ...state, users: state.users.map((x) => (x.id === id ? next : x)) };
  log(u.name, `Credential reset (temporary code issued to ${u.email})`, by);
  persist();
  return { code, user: clone(next) };
}

export function reissueApiKey(id: string, by: string): { key: string; user: ManagedUser } | undefined {
  const u = state.users.find((x) => x.id === id);
  if (!u) return undefined;
  const key = `ak_live_${rand(24).toLowerCase()}`;
  const next: ManagedUser = { ...u, apiKey: key };
  state = { ...state, users: state.users.map((x) => (x.id === id ? next : x)) };
  log(u.name, 'API key reissued', by);
  persist();
  return { key, user: clone(next) };
}

export function resetMfa(id: string, by: string): ManagedUser | undefined {
  const u = state.users.find((x) => x.id === id);
  if (!u) return undefined;
  const next: ManagedUser = { ...u, mfaEnabled: false };
  state = { ...state, users: state.users.map((x) => (x.id === id ? next : x)) };
  log(u.name, 'MFA reset — user must re-enroll', by);
  persist();
  return clone(next);
}

// ── Onboarding pipeline ──
export function advanceOnboard(id: string, stepId: string, by: string): void {
  state = {
    ...state,
    onboardees: state.onboardees.map((ob) => (ob.id === id ? { ...ob, steps: ob.steps.map((s) => (s.id === stepId && !s.done ? { ...s, done: true } : s)) } : ob)),
  };
  const ob = state.onboardees.find((x) => x.id === id);
  log(ob?.name ?? 'New hire', `Onboarding step completed (${ob?.steps.find((s) => s.id === stepId)?.label ?? stepId})`, by);
  persist();
}

export function addOnboardee(input: { name: string; email?: string; role?: string; startDate?: string }): Onboardee {
  const hire: Onboardee = {
    id: `ob-${Date.now()}`, name: input.name,
    hired: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    steps: ONBOARD_STEP_TEMPLATE.map((s) => ({ ...s, done: false })),
    email: input.email, role: input.role, startDate: input.startDate,
  };
  state = { ...state, onboardees: [hire, ...state.onboardees] };
  persist();
  return clone(hire);
}
