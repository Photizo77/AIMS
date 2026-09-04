// src/services/flagService.ts
// ============================================================
// AIMS — Flag-for-ED system (CD's signature capability)
// The CD flags any record (grants, approvals, finance, innovations,
// attendance, HR, inventory) with a priority (Critical/High/Medium)
// and optional reference. Flags persist and route to the TOP of the
// ED's Approvals Queue as red priority interrupts. The ED can Approve
// (resolve) or Request More Info. Resolved flags stay on record as
// the flag audit trail.
// ============================================================

import { loadJSON, saveJSON, STORAGE_KEYS, notifyDataChanged } from '@/lib/storage';

export type FlagPriority = 'critical' | 'high' | 'medium';
export type FlagStatus = 'open' | 'resolved';
export type FlagDecision = 'approved' | 'rejected' | 'info_requested';

export interface CdFlag {
  id: string;
  /** What the flag is attached to, e.g. "Grant g1 — Community Land Rights" */
  recordLabel: string;
  /** Source module, e.g. 'grants' | 'approvals' | 'finance' | 'attendance' | 'hr' | 'innovations' | 'inventory' */
  sourceModule: string;
  note: string;
  /** Optional reference / attached document label */
  reference?: string;
  raisedBy: string;
  raisedAt: string;
  priority: FlagPriority;
  status: FlagStatus;
  decision?: FlagDecision;
  infoRequested?: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

const SEED: CdFlag[] = [
  {
    id: 'flag-1',
    recordLabel: 'General Program Review — Expansion into Northern Zone',
    sourceModule: 'grants',
    note: 'Please review strategy alignment with new donor opportunities before proceeding.',
    raisedBy: 'Nassir Mwanje (CD)',
    raisedAt: new Date(Date.now() - 3600000).toISOString(),
    priority: 'critical',
    status: 'open',
  },
];

const persisted = loadJSON<CdFlag[] | null>(STORAGE_KEYS.flags, null);
let flags: CdFlag[] = (persisted && persisted.length > 0 ? persisted : SEED).map((f) => ({ ...f }));

function persist(): void {
  saveJSON(STORAGE_KEYS.flags, flags);
}

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `flag-${Date.now()}-${idCounter}`;
}

const listeners = new Set<() => void>();
export function subscribeFlags(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
function emit(): void {
  listeners.forEach((l) => l());
  notifyDataChanged('flags');
}

/** Open flags, sorted so critical interrupts sit on top */
export function getOpenFlagsSorted(): CdFlag[] {
  const rank = { critical: 0, high: 1, medium: 2 };
  return flags
    .filter((f) => f.status === 'open')
    .sort((a, b) => rank[a.priority] - rank[b.priority] || new Date(b.raisedAt).getTime() - new Date(a.raisedAt).getTime());
}

export const flagService = {
  getFlags: (): CdFlag[] => flags,
  getOpenFlags: (): CdFlag[] => flags.filter((f) => f.status === 'open'),

  raiseFlag: (
    recordLabel: string,
    sourceModule: string,
    note: string,
    raisedBy: string,
    priority: FlagPriority = 'medium',
    reference?: string
  ): CdFlag => {
    const flag: CdFlag = {
      id: nextId(),
      recordLabel,
      sourceModule,
      note,
      reference,
      raisedBy,
      raisedAt: new Date().toISOString(),
      priority,
      status: 'open',
    };
    flags = [flag, ...flags];
    persist();
    emit();
    return flag;
  },

  /** ED resolves a flag (approve/reject = resolved; request-info keeps it actionable) */
  resolveFlag: (id: string, resolvedBy: string, decision: FlagDecision = 'approved', resolutionNote?: string): CdFlag | undefined => {
    const flag = flags.find((f) => f.id === id);
    if (!flag || flag.status !== 'open') return undefined;
    flag.status = 'resolved';
    flag.decision = decision;
    flag.infoRequested = false;
    flag.resolvedBy = resolvedBy;
    flag.resolvedAt = new Date().toISOString();
    flag.resolutionNote = resolutionNote;
    persist();
    emit();
    return flag;
  },

  /** ED asks the CD for more information (flag stays open on the queue) */
  requestMoreInfo: (id: string, by: string, note?: string): CdFlag | undefined => {
    const flag = flags.find((f) => f.id === id);
    if (!flag || flag.status !== 'open') return undefined;
    flag.infoRequested = true;
    flag.resolutionNote = note;
    flag.resolvedBy = by;
    flag.resolvedAt = new Date().toISOString();
    persist();
    emit();
    return flag;
  },

  /** Resolution history — the flag audit trail */
  history: (): CdFlag[] => flags.filter((f) => f.status === 'resolved'),
};
