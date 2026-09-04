// src/services/contractService.ts
// ============================================================
// AIMS — Employment contracts store (persisted).
// One source of truth for contracts across HR & People Management
// and the People Directory. Each contract can carry a scanned copy
// (image data-URL, size-capped) so staff records show real scans.
// Demo content is opt-in (Settings → Load demo dataset); otherwise
// the store starts clean.
// ============================================================

import { loadJSON, saveJSON, STORAGE_KEYS, demoMode } from '@/lib/storage';
import { STAFF_ROSTER } from '@/data/roster';

export type ContractKind = 'permanent' | 'contract' | 'intern' | 'consultant';
export type ContractStatus = 'active' | 'expiring' | 'expired' | 'terminated' | 'draft';

export interface ContractRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  type: ContractKind;
  startDate: string;
  endDate?: string;
  salary: number;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
  signedBy?: string;
  /** Base64 image of the scanned contract (max ~1.5MB) */
  scanDataUrl?: string | null;
  scanName?: string;
}

interface ContractState { contracts: ContractRecord[]; }

function demoSeed(): ContractRecord[] {
  const now = '2025-01-15';
  const mk = (id: string, idx: number): ContractRecord => {
    const person = STAFF_ROSTER.find((s) => s.id === id) ?? STAFF_ROSTER[idx % STAFF_ROSTER.length];
    return {
      id: `con-${id}`,
      employeeId: person.id,
      employeeName: person.name,
      type: 'permanent',
      startDate: '2025-06-01',
      salary: 2500000,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
  };
  return [
    mk('user-gm-001', 0),
    mk('user-gw-001', 1),
    mk('u-florence', 2),
    mk('user-innov-001', 3),
    mk('user-finance-001', 4),
    mk('u-grace-n', 5),
    mk('user-admin-001', 6),
    mk('user-sysadmin-001', 7),
  ].map((c, i) => ({
    ...c,
    id: `con-${i + 1}`,
    type: (['permanent', 'contract', 'permanent', 'contract', 'permanent', 'permanent', 'contract', 'permanent'] as ContractKind[])[i],
    startDate: `${2024 + (i % 3)}-0${(i % 9) + 1}-10`,
    endDate: i % 2 === 0 ? undefined : '2026-12-31',
    salary: 1800000 + i * 250000,
    status: (['active', 'active', 'expiring', 'active', 'active', 'expiring', 'active', 'expired'] as ContractStatus[])[i],
  }));
}

const persisted = loadJSON<ContractState | null>(STORAGE_KEYS.contracts, null);
let state: ContractState = persisted && persisted.contracts
  ? persisted
  : { contracts: demoMode() ? demoSeed() : [] };

function persist(): void { saveJSON(STORAGE_KEYS.contracts, state); }
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export function contractGet(): ContractRecord[] { return clone(state.contracts); }

/** Contracts for one employee (by roster/account id) */
export function contractsFor(employeeId: string): ContractRecord[] {
  return clone(state.contracts.filter((c) => c.employeeId === employeeId));
}

/** Contracts for one employee matched by name (onboarding entries without roster ids) */
export function contractsByName(name: string): ContractRecord[] {
  return clone(state.contracts.filter((c) => c.employeeName.toLowerCase() === name.trim().toLowerCase()));
}

export function addContract(input: { employeeId: string; employeeName: string; type: ContractKind; startDate: string; endDate?: string; salary: number }): ContractRecord {
  const now = new Date().toISOString().slice(0, 10);
  const rec: ContractRecord = { id: `con-${Date.now()}`, status: 'active', createdAt: now, updatedAt: now, ...input };
  state = { ...state, contracts: [rec, ...state.contracts] };
  persist();
  return clone(rec);
}

export function updateContract(id: string, patch: Partial<ContractRecord>): ContractRecord | undefined {
  const cur = state.contracts.find((c) => c.id === id);
  if (!cur) return undefined;
  const next: ContractRecord = { ...cur, ...patch, updatedAt: new Date().toISOString().slice(0, 10) };
  state = { ...state, contracts: state.contracts.map((c) => (c.id === id ? next : c)) };
  persist();
  return clone(next);
}

export function removeContract(id: string): boolean {
  const before = state.contracts.length;
  state = { ...state, contracts: state.contracts.filter((c) => c.id !== id) };
  persist();
  return state.contracts.length < before;
}

/** Attach a scanned copy (image data URL). Returns null when too large. */
export function attachContractScan(id: string, dataUrl: string, name: string): { ok: boolean; reason?: string } {
  if (dataUrl.length > 2 * 1024 * 1024) return { ok: false, reason: 'Scan too large — please use an image under ~1.5MB.' };
  updateContract(id, { scanDataUrl: dataUrl, scanName: name });
  return { ok: true };
}

/** Demo loader used by Settings → Load demo dataset */
export function loadDemoContracts(): void {
  state = { contracts: demoSeed() };
  persist();
}
