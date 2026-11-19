// src/services/userOpsService.ts
// ============================================================
// AIMS — User operations store (persisted).
// Account directory (built over the unified staff roster),
// provisioning, role changes, status toggles, credential resets,
// API keys, MFA resets and the account audit log — all real and
// persisted, with every operation recorded to the audit trail.
//
// ONBOARDING PIPELINE
// The 4-step checklist is fully executable — each step writes real
// state instead of only ticking a box:
//   1 Provision Account  → creates the login (email + temp password)
//   2 Assign Role        → sets the persona role on that account
//   3 Issue Credentials  → enables 2FA/MFA and issues an API key
//   4 Asset Issuance     → hands over assets (Inventory assignment)
// Completing all four activates the employee record & closes the hire.
// ============================================================

import { loadJSON, saveJSON, STORAGE_KEYS, demoMode } from '@/lib/storage';
import { STAFF_ROSTER } from '@/data/roster';
import type { Role } from '@/types';
import { ROLE_LABELS } from '@/config/roles';
import { addAssignment } from '@/services/inventoryService';
import { updateOnboarding, listOnboarding } from '@/services/employeeService';

export interface ManagedUser {
  id: string; name: string; email: string; role: Role; department: string;
  status: 'active' | 'inactive'; provisioned: boolean; position: string;
  credentialVersion: number; lastResetAt?: string; apiKey?: string; mfaEnabled: boolean;
  /** Unique, human-readable account ID (ARD-EMP-0001…). Unique per user,
   *  even when several users share the same role/persona. */
  userCode: string;
}
export interface AuditEntry { id: string; ts: string; user: string; action: string; by: string; }
export interface OnboardStep {
  id: string; label: string; done: boolean; detail?: string;
  completedAt?: string; completedBy?: string;
}
/** The login provisioned for a new hire in onboarding step 1 */
export interface OnboardAccount {
  loginEmail: string;
  temporaryPassword: string;
  /** Managed directory account created/linked by provisioning */
  userRecordId: string;
  createdAt: string;
  credentialsSentAt?: string;
  mfaEnabled: boolean;
  apiKey?: string;
}
export interface Onboardee {
  id: string; name: string; hired: string; steps: OnboardStep[];
  email?: string; role?: string; startDate?: string;
  position?: string; department?: string;
  /** Links to the Employee Information Form record (employees store) */
  employeeId?: string;
  account?: OnboardAccount;
  assets?: string[];
  completedAt?: string;
  /** How the hire entered the pipeline — admin-added or employee self-service */
  source?: 'admin' | 'employee-form';
}

interface UserOpsState { users: ManagedUser[]; audit: AuditEntry[]; onboardees: Onboardee[]; }

export const ONBOARD_STEP_IDS = ['s1', 's2', 's3', 's4'] as const;

const ONBOARD_STEP_TEMPLATE: { id: string; label: string }[] = [
  { id: 's1', label: 'Provision Account' },
  { id: 's2', label: 'Assign Role' },
  { id: 's3', label: 'Issue Credentials (2FA)' },
  { id: 's4', label: 'Asset Issuance' },
];

/** Standard equipment handed over at onboarding — ticked in step 4 */
export const ONBOARD_ASSETS = ['Laptop', 'Mobile phone', 'Access card', 'Desk & chair', 'Email & system access'] as const;

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
      { id: 's3', label: 'Issue Credentials (2FA)', done: true, detail: 'MFA enabled · API key generated' },
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

function nextUserCode(): string {
  const seq = state.users.reduce((m, u) => {
    const n = Number.parseInt((u.userCode ?? '').split('-').pop() ?? '0', 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0) + 1;
  return `ARD-EMP-${String(seq).padStart(4, '0')}`;
}

/** Turn "Rita Auma" into rita.auma@ardhi.org.ug */
export function suggestLoginEmail(name: string, email?: string): string {
  if (email && /@/.test(email)) return email;
  const parts = name.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const slug = parts.slice(0, 2).map((p) => p.replace(/[^a-z0-9]+/g, '')).filter(Boolean).join('.');
  return `${slug || 'new.hire'}@ardhi.org.ug`;
}

/** One-time password generated for a new login */
export function generateTempPassword(): string {
  return `ARDHI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export const userOpsGet = {
  users: (): ManagedUser[] => clone(state.users),
  audit: (): AuditEntry[] => clone(state.audit),
  onboardees: (): Onboardee[] => clone(state.onboardees),
  onboardee: (id: string): Onboardee | undefined => {
    const found = state.onboardees.find((o) => o.id === id);
    return found ? clone(found) : undefined;
  },
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

/** Enable two-factor authentication on an account (used by onboarding step 3) */
export function enableMfa(id: string, by: string): ManagedUser | undefined {
  const u = state.users.find((x) => x.id === id);
  if (!u) return undefined;
  const next: ManagedUser = { ...u, mfaEnabled: true };
  state = { ...state, users: state.users.map((x) => (x.id === id ? next : x)) };
  log(u.name, 'Two-factor authentication enabled', by);
  persist();
  return clone(next);
}

// ── Onboarding pipeline ──

/** Mark a step done (manual override — steps normally complete via their action) */
export function advanceOnboard(id: string, stepId: string, by: string): void {
  state = {
    ...state,
    onboardees: state.onboardees.map((ob) => (ob.id === id ? { ...ob, steps: ob.steps.map((s) => (s.id === stepId && !s.done ? { ...s, done: true } : s)) } : ob)),
  };
  const ob = state.onboardees.find((x) => x.id === id);
  log(ob?.name ?? 'New hire', `Onboarding step completed (${ob?.steps.find((s) => s.id === stepId)?.label ?? stepId})`, by);
  persist();
}

export function addOnboardee(input: {
  name: string; email?: string; role?: string; startDate?: string;
  position?: string; department?: string; employeeId?: string;
  source?: Onboardee['source'];
}): Onboardee {
  const hire: Onboardee = {
    id: `ob-${Date.now()}`, name: input.name,
    hired: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    steps: ONBOARD_STEP_TEMPLATE.map((s) => ({ ...s, done: false })),
    email: input.email, role: input.role, startDate: input.startDate,
    position: input.position, department: input.department,
    employeeId: input.employeeId, source: input.source ?? 'admin',
    assets: [],
  };
  state = { ...state, onboardees: [hire, ...state.onboardees] };
  log(hire.name, `Added to the onboarding pipeline${input.source === 'employee-form' ? ' (employee-submitted form)' : ''}`, 'HR Admin');
  persist();
  return clone(hire);
}

export function removeOnboardee(id: string, by: string): void {
  const ob = state.onboardees.find((x) => x.id === id);
  state = { ...state, onboardees: state.onboardees.filter((x) => x.id !== id) };
  if (ob) log(ob.name, 'Removed from the onboarding pipeline', by);
  persist();
}

/** Patch one onboarding step + read back the hire */
function patchStep(
  id: string,
  stepId: string,
  patch: (ob: Onboardee) => Partial<Onboardee>,
  detail: string,
  by: string,
  logAction: string,
): Onboardee | undefined {
  const target = state.onboardees.find((o) => o.id === id);
  if (!target) return undefined;
  const updated: Onboardee = {
    ...target,
    ...patch(target),
    steps: target.steps.map((s) => (s.id === stepId ? { ...s, done: true, detail, completedAt: new Date().toISOString(), completedBy: by } : s)),
  };
  // Close the hire once every step is complete
  const allDone = updated.steps.every((s) => s.done);
  state = {
    ...state,
    onboardees: state.onboardees.map((o) => (o.id === id ? { ...updated, completedAt: allDone ? new Date().toISOString() : updated.completedAt } : o)),
  };
  // Activate the linked employee record when the cycle closes
  if (allDone && updated.employeeId) {
    const rec = listOnboarding().find((r) => r.id === updated.employeeId);
    if (rec && rec.status !== 'Active') updateOnboarding(rec.id, { status: 'Active' });
  }
  log(updated.name, logAction, by);
  persist();
  const fresh = state.onboardees.find((o) => o.id === id);
  return fresh ? clone(fresh) : undefined;
}

/**
 * STEP 1 — Provision the login. Creates (or reuses) a real account in the
 * user directory with the supplied email, a temporary password and a unique
 * ARD-EMP code. Returns the onboardee with its `account` record attached.
 */
export function provisionOnboardAccount(
  id: string,
  input: { loginEmail: string; temporaryPassword: string; position?: string; department?: string; role?: Role },
  by: string,
): Onboardee | undefined {
  const ob = state.onboardees.find((o) => o.id === id);
  if (!ob) return undefined;
  const email = input.loginEmail.trim().toLowerCase();
  const role = (input.role ?? (ob.role as Role | undefined) ?? 'GRANT_WRITER') as Role;
  const userRecordId = ob.account?.userRecordId ?? `u-onboard-${ob.id}`;
  const existing = state.users.find((u) => u.id === userRecordId);
  const account: OnboardAccount = {
    loginEmail: email,
    temporaryPassword: input.temporaryPassword,
    userRecordId,
    createdAt: new Date().toISOString(),
    mfaEnabled: false,
  };

  const record: ManagedUser = existing
    ? { ...existing, email, role, provisioned: true, status: 'active', position: input.position || existing.position, department: input.department || existing.department }
    : {
      id: userRecordId,
      name: ob.name,
      email,
      role,
      department: input.department || ob.department || 'Unassigned',
      status: 'active',
      provisioned: true,
      position: input.position || ob.position || 'New Hire',
      credentialVersion: 0,
      mfaEnabled: false,
      userCode: nextUserCode(),
    };

  state = {
    ...state,
    users: existing ? state.users.map((u) => (u.id === userRecordId ? record : u)) : [record, ...state.users],
  };

  // Reflect the issued login on the Employee Information Form record
  if (ob.employeeId) {
    const formRecord = listOnboarding().find((r) => r.id === ob.employeeId);
    if (formRecord) {
      updateOnboarding(formRecord.id, {
        account: { loginEmail: email, defaultPassword: input.temporaryPassword, createdAt: account.createdAt },
        employeeId: formRecord.employeeId || record.userCode,
        status: formRecord.status === 'Submitted' ? 'Onboarding' : formRecord.status,
      });
    }
  }

  return patchStep(
    id, 's1',
    () => ({
      account,
      email,
      position: input.position || ob.position,
      department: input.department || ob.department,
      role,
    }),
    `${email} · temp password set · ${record.userCode}`,
    by,
    `Login provisioned (${email}, ${record.userCode})`,
  );
}

/**
 * STEP 2 — Assign the persona role. Writes the role to the provisioned
 * account so module access is real, not just a checklist note.
 */
export function assignOnboardRole(id: string, role: Role, by: string): Onboardee | undefined {
  const ob = state.onboardees.find((o) => o.id === id);
  if (!ob) return undefined;
  const userRecordId = ob.account?.userRecordId;
  if (userRecordId && state.users.some((u) => u.id === userRecordId)) {
    state = { ...state, users: state.users.map((u) => (u.id === userRecordId ? { ...u, role } : u)) };
  }
  return patchStep(
    id, 's2',
    () => ({ role }),
    `${ROLE_LABELS[role]}${ob.account ? '' : ' (no login yet)'}`,
    by,
    `Onboarding role assigned — ${ROLE_LABELS[role]}`,
  );
}

/**
 * STEP 3 — Issue credentials: enable 2FA/MFA on the account and optionally
 * issue an API key. Records that the credential pack was delivered.
 */
export function issueOnboardCredentials(
  id: string,
  opts: { enableMfa: boolean; issueApiKey: boolean },
  by: string,
): Onboardee | undefined {
  const ob = state.onboardees.find((o) => o.id === id);
  if (!ob) return undefined;
  const userRecordId = ob.account?.userRecordId;
  const apiKey = opts.issueApiKey ? (state.users.find((u) => u.id === userRecordId)?.apiKey ?? `ak_live_${rand(24).toLowerCase()}`) : undefined;
  if (userRecordId) {
    state = {
      ...state,
      users: state.users.map((u) => (u.id === userRecordId
        ? { ...u, mfaEnabled: opts.enableMfa ? true : u.mfaEnabled, apiKey: apiKey ?? u.apiKey }
        : u)),
    };
  }
  const parts = [opts.enableMfa ? '2FA enabled' : '2FA skipped'];
  if (apiKey) parts.push('API key issued');
  parts.push(`credentials sent to ${ob.account?.loginEmail ?? ob.email ?? 'the new hire'}`);
  return patchStep(
    id, 's3',
    () => ({
      account: ob.account
        ? { ...ob.account, mfaEnabled: opts.enableMfa, apiKey: apiKey ?? ob.account.apiKey, credentialsSentAt: new Date().toISOString() }
        : undefined,
    }),
    parts.join(' · '),
    by,
    `Credentials issued — ${parts.join(', ')}`,
  );
}

/**
 * STEP 4 — Asset issuance. Creates a real Inventory assignment for the new
 * hire so equipment hand-over is tracked outside the checklist.
 */
export function issueOnboardAssets(id: string, items: string[], by: string): Onboardee | undefined {
  const ob = state.onboardees.find((o) => o.id === id);
  if (!ob) return undefined;
  const due = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  if (items.length > 0) {
    addAssignment({ person: `${ob.name} (New Hire)`, due, items });
  }
  return patchStep(
    id, 's4',
    () => ({ assets: items }),
    items.length > 0 ? `${items.join(', ')} → Inventory` : 'No equipment required',
    by,
    `Assets issued — ${items.length > 0 ? items.join(', ') : 'none'}`,
  );
}
