// src/services/leaveService.ts
// ============================================================
// AIMS — Leave workflows store (persisted).
// Pending requests, approvals/denials/routing and employee leave
// balances are kept here so HR/Company Admin decisions are real,
// balances update after approvals, and data survives reloads.
// ============================================================

import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';
import { ACTIVE_STAFF } from '@/data/roster';

export interface LeaveRequest {
  id: string;
  name: string;
  type: string;
  days: number;
  period: string;
  balance: number;
  status: 'pending' | 'approved' | 'denied' | 'routed';
  exceedsThreshold?: boolean;
  infoRequested?: boolean;
  decidedBy?: string;
  decidedAt?: string;
}

export interface LeaveBalance { name: string; annual: number; sick: number; study: number; }

interface LeaveState { requests: LeaveRequest[]; balances: LeaveBalance[]; }

const STAFF_BALANCES: LeaveBalance[] = ACTIVE_STAFF.map((s, i) => {
  const pick = i % 3;
  return {
    name: s.name,
    annual: pick === 0 ? 12 : pick === 1 ? 8 : 6,
    sick: pick === 0 ? 7 : pick === 1 ? 5 : 4,
    study: pick === 0 ? 3 : pick === 1 ? 2 : 1,
  };
});

function seedState(): LeaveState {
  return {
    requests: [
      { id: 'l1', name: 'Sarah Aciro', type: 'Annual Leave', days: 2, period: 'Sep 25-26', balance: 12, status: 'pending' },
      { id: 'l2', name: 'Florence Adong', type: 'Sick Leave', days: 1, period: 'Sep 30', balance: 8, status: 'pending' },
      { id: 'l3', name: 'Janet Apio', type: 'Unpaid Leave', days: 3, period: 'Oct 1-3', balance: 0, status: 'pending', exceedsThreshold: true },
      { id: 'l4', name: 'Peter Byamugisha', type: 'Annual Leave', days: 10, period: 'Sep 10-20', balance: 4, status: 'approved', decidedBy: 'Grace Aceng', decidedAt: '2026-09-01' },
      { id: 'l5', name: 'Isaac Tumusiime', type: 'Study Leave', days: 1, period: 'Sep 15', balance: 2, status: 'approved', decidedBy: 'Grace Aceng', decidedAt: '2026-09-01' },
    ],
    balances: STAFF_BALANCES,
  };
}

const persisted = loadJSON<LeaveState | null>(STORAGE_KEYS.leave, null);
let state: LeaveState = persisted && persisted.requests ? persisted : seedState();

function persist(): void { saveJSON(STORAGE_KEYS.leave, state); }
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export const leaveGet = {
  pending: (): LeaveRequest[] => clone(state.requests.filter((r) => r.status === 'pending' || r.status === 'routed')),
  approved: (): LeaveRequest[] => clone(state.requests.filter((r) => r.status === 'approved')),
  balances: (): LeaveBalance[] => clone(state.balances),
  byName: (name: string): LeaveBalance | undefined => clone(state.balances.find((b) => b.name === name)),
};

function setReq(id: string, patch: Partial<LeaveRequest>): void {
  state = { ...state, requests: state.requests.map((r) => (r.id === id ? { ...r, ...patch } : r)) };
  persist();
}

export function decideLeave(id: string, status: 'approved' | 'denied', actor: string): LeaveRequest | undefined {
  const req = state.requests.find((r) => r.id === id);
  if (!req) return undefined;
  setReq(id, { status, decidedBy: actor, decidedAt: new Date().toISOString() });
  if (status === 'approved' && !req.exceedsThreshold) {
    // reduce the employee's leave balance by the approved days
    const bucket = req.type.toLowerCase().includes('sick') ? 'sick' : req.type.toLowerCase().includes('study') ? 'study' : 'annual';
    state = {
      ...state,
      balances: state.balances.map((b) => (b.name === req.name ? { ...b, [bucket]: Math.max(0, b[bucket] - req.days) } : b)),
    };
    persist();
  }
  return { ...req, status, decidedBy: actor, decidedAt: new Date().toISOString() };
}

export function requestMoreInfo(id: string): void {
  setReq(id, { infoRequested: true, status: 'pending' });
}

export function routeLeaveToED(id: string): void {
  setReq(id, { status: 'routed' });
}

export function fileLeaveRequest(input: { name: string; type: string; days: number; period: string }): LeaveRequest {
  const bal = state.balances.find((b) => b.name === input.name);
  const unpaid = input.type.toLowerCase().includes('unpaid');
  const overBalance = input.days > (bal?.annual ?? 0);
  const exceeds = overBalance || unpaid || input.days > 2;
  const autoApproved = !exceeds && input.days < 2;
  const req: LeaveRequest = {
    id: `l-${Date.now()}`,
    name: input.name, type: input.type, days: input.days, period: input.period,
    balance: bal?.annual ?? 0,
    status: autoApproved ? 'approved' : 'pending',
    exceedsThreshold: exceeds,
    decidedBy: autoApproved ? 'Auto (HR policy)' : undefined,
    decidedAt: autoApproved ? new Date().toISOString() : undefined,
  };
  state = { ...state, requests: [...state.requests, req] };
  if (autoApproved && bal) {
    const bucket = unpaid ? 'annual' : 'annual';
    state = { ...state, balances: state.balances.map((b) => (b.name === input.name ? { ...b, [bucket]: Math.max(0, b[bucket] - input.days) } : b)) };
  }
  persist();
  return req;
}
