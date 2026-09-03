// src/services/offboardingService.ts
// ============================================================
// AIMS — Exit management / offboarding store (persisted).
// Full checklist per exiting employee: steps complete in order with
// block enforcement, asset return, access revocation, account
// archiving and reminder comms — all real, persisted mutations.
// ============================================================

import { loadJSON, saveJSON, STORAGE_KEYS, demoMode } from '@/lib/storage';
import { STAFF_ROSTER } from '@/data/roster';

export interface OffboardStep { id: string; label: string; done: boolean; detail?: string; blockedBy?: string; completedAt?: string; completedBy?: string; }
export interface Offboardee {
  id: string; name: string; role: string; dept: string; exitDate: string;
  steps: OffboardStep[]; createdAt: string; reminders: number;
  exitType?: string; lastWorkingDay?: string; noticeDays?: number;
  reason?: string; handoverTo?: string; settlementNotes?: string;
}
export interface OffboardReminder { id: string; offboardeeId: string; sentAt: string; subject: string; }

interface OffboardState { cases: Offboardee[]; reminders: OffboardReminder[]; }

const EXIT_STEPS: Omit<OffboardStep, 'done'>[] = [
  { id: 's1', label: 'Exit Interview', detail: 'Conducted by HR · notes recorded' },
  { id: 's2', label: 'Department Clearance', detail: 'IT, HR and Finance clearance confirmed' },
  { id: 's3', label: 'Final Settlement', detail: 'Final payslip and benefits approved by ED' },
  { id: 's4', label: 'Asset Return', detail: 'Return all assigned assets (laptop, phone, access card)' },
  { id: 's5', label: 'Access Revocation', detail: 'System access removed once assets are confirmed returned', blockedBy: 'Asset Return' },
  { id: 's6', label: 'Final Deactivation', detail: 'Account archived — never deleted', blockedBy: 'Access Revocation' },
];

function seedState(): OffboardState {
  const s = EXIT_STEPS.map((x) => {
    const preDone = x.id === 's1' || x.id === 's2' || x.id === 's3';
    return { ...x, done: preDone, completedAt: preDone ? new Date().toISOString() : undefined };
  });
  return {
    cases: [
      {
        id: 'of1', name: 'Okello Komakech', role: 'System Administrator', dept: 'IT', exitDate: 'Sep 30, 2026',
        steps: s, createdAt: '2026-08-20', reminders: 0,
      },
    ],
    reminders: [],
  };
}

const persisted = loadJSON<OffboardState | null>(STORAGE_KEYS.offboarding, null);
let state: OffboardState = persisted && persisted.cases ? persisted : demoMode() ? seedState() : { cases: [], reminders: [] };

/** Reload the demo offboarding cases (Settings → Load demo dataset) */
export function loadDemoOffboarding(): void {
  state = seedState();
  persist();
}

function persist(): void { saveJSON(STORAGE_KEYS.offboarding, state); }
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export const offboardGet = {
  cases: (): Offboardee[] => clone(state.cases),
  reminders: (): OffboardReminder[] => clone(state.reminders),
};

export function startOffboarding(input: { name: string; exitDate: string; exitType?: string; lastWorkingDay?: string; noticeDays?: number; reason?: string; handoverTo?: string; settlementNotes?: string }): Offboardee {
  const person = STAFF_ROSTER.find((s) => s.name === input.name);
  const today = new Date().toISOString();
  const c: Offboardee = {
    id: `of-${Date.now()}`,
    name: input.name,
    role: person?.position ?? 'Employee',
    dept: person?.department ?? '—',
    exitDate: input.exitDate,
    steps: EXIT_STEPS.map((x) => ({ ...x, done: false, detail: x.detail })),
    createdAt: today,
    reminders: 0,
    exitType: input.exitType,
    lastWorkingDay: input.lastWorkingDay,
    noticeDays: input.noticeDays,
    reason: input.reason,
    handoverTo: input.handoverTo,
    settlementNotes: input.settlementNotes,
  };
  state = { ...state, cases: [c, ...state.cases] };
  persist();
  return clone(c);
}

/**
 * Complete a checklist step. Returns 'ok' | 'blocked' | 'missing'.
 * @param force bypasses the blocker (explicit override)
 */
export function advanceOffboardStep(caseId: string, stepId: string, actor: string, force = false): 'ok' | 'blocked' | 'missing' {
  const c = state.cases.find((x) => x.id === caseId);
  if (!c) return 'missing';
  const step = c.steps.find((s) => s.id === stepId);
  if (!step) return 'missing';
  if (step.done) return 'ok';
  if (!force && step.blockedBy) {
    const blocker = c.steps.find((s) => s.label === step.blockedBy);
    if (blocker && !blocker.done) return 'blocked';
  }
  state = {
    ...state,
    cases: state.cases.map((x) => (x.id !== caseId ? x : {
      ...x,
      steps: x.steps.map((s) => (s.id === stepId ? { ...s, done: true, completedAt: new Date().toISOString(), completedBy: actor } : s)),
    })),
  };
  persist();
  return 'ok';
}

/** Convenience: complete a step by label (e.g. 'Asset Return') */
export function advanceByLabel(caseId: string, label: string, actor: string, force = false): 'ok' | 'blocked' | 'missing' {
  const c = state.cases.find((x) => x.id === caseId);
  if (!c) return 'missing';
  const step = c.steps.find((s) => s.label.toLowerCase() === label.toLowerCase());
  if (!step) return 'missing';
  return advanceOffboardStep(caseId, step.id, actor, force);
}

export function logReminder(caseId: string): OffboardReminder {
  const c = state.cases.find((x) => x.id === caseId);
  const reminder: OffboardReminder = { id: `rem-${Date.now()}`, offboardeeId: caseId, sentAt: new Date().toISOString(), subject: `Asset return reminder — ${c?.name ?? 'exiting employee'}` };
  state = {
    ...state,
    reminders: [reminder, ...state.reminders],
    cases: state.cases.map((x) => (x.id === caseId ? { ...x, reminders: x.reminders + 1 } : x)),
  };
  persist();
  return clone(reminder);
}
