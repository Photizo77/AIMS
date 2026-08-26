// src/services/flagService.ts
// ============================================================
// AIMS — Flag-for-ED system (CD's signature capability)
// The CD can raise a flag on any record they can view (grants, approvals,
// finance, innovations, attendance, HR summary, inventory). Flags route
// directly to the ED's Approvals Queue as a priority interrupt, tagged
// with the CD's name and timestamp. The ED resolves them.
// ============================================================

export interface CdFlag {
  id: string;
  /** What the flag is attached to, e.g. "Grant g1 — Community Land Rights" */
  recordLabel: string;
  /** Source module, e.g. 'grants' | 'approvals' | 'finance' | 'attendance' | 'hr' | 'innovations' | 'inventory' */
  sourceModule: string;
  note: string;
  raisedBy: string;
  raisedAt: string;
  priority: 'urgent' | 'normal';
  status: 'open' | 'resolved';
  resolvedBy?: string;
  resolvedAt?: string;
}

let flags: CdFlag[] = [
  {
    id: 'flag-1',
    recordLabel: 'General Program Review — Expansion into Northern Zone',
    sourceModule: 'grants',
    note: 'Please review strategy alignment with new donor opportunities. Recommend discussing with the Country Director before proceeding.',
    raisedBy: 'Nassir Mwanje (CD)',
    raisedAt: new Date(Date.now() - 3600000).toISOString(),
    priority: 'urgent',
    status: 'open',
  },
];

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
}

export const flagService = {
  getFlags: (): CdFlag[] => flags,
  getOpenFlags: (): CdFlag[] => flags.filter((f) => f.status === 'open'),

  raiseFlag: (recordLabel: string, sourceModule: string, note: string, raisedBy: string, priority: 'urgent' | 'normal' = 'normal'): CdFlag => {
    const flag: CdFlag = {
      id: nextId(),
      recordLabel,
      sourceModule,
      note,
      raisedBy,
      raisedAt: new Date().toISOString(),
      priority,
      status: 'open',
    };
    flags = [flag, ...flags];
    emit();
    return flag;
  },

  resolveFlag: (id: string, resolvedBy: string): CdFlag | undefined => {
    const flag = flags.find((f) => f.id === id);
    if (!flag || flag.status !== 'open') return undefined;
    flag.status = 'resolved';
    flag.resolvedBy = resolvedBy;
    flag.resolvedAt = new Date().toISOString();
    emit();
    return flag;
  },
};
