// src/services/financeService.ts
// ============================================================
// AIMS — Finance service (in-memory)
// Finance can EDIT income/expense/budget records, but every change is
// submitted for ED approval before it takes effect. Submitting a change
// immediately notifies the ED (via the notification context).
// ============================================================

export type FinanceRecordType = 'income' | 'expense' | 'budget';

import { loadJSON, saveJSON, STORAGE_KEYS, demoMode } from '@/lib/storage';

export interface FinanceRecord {
  id: string;
  type: FinanceRecordType;
  label: string;
  amount: number;
  detail: string;
}

export interface BudgetRecord {
  id: string;
  dept: string;
  budget: number;
  actual: number;
  forecastPct: number;
}

export interface PendingFinanceEdit {
  id: string;
  recordType: FinanceRecordType;
  recordId: string;
  label: string;
  field: string;
  oldValue: string;
  newValue: string;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  edNote?: string;
}

export interface FinanceExportLog { id: string; ts: string; fmt: 'csv' | 'pdf' | 'json'; count: number; }

export interface PersistedFinance { income?: FinanceRecord[]; expenses?: FinanceRecord[]; budgets?: BudgetRecord[]; pendingEdits?: PendingFinanceEdit[]; exports?: FinanceExportLog[]; }

// ── Seed data (USD, per finance architecture) ──
const SEED_INCOME: FinanceRecord[] = [
  { id: 'inc-1', type: 'income', label: 'Donor A (Grant cycles)', amount: 8200000, detail: 'YTD Aug 2026 · 45% of total income · stable vs last quarter' },
  { id: 'inc-2', type: 'income', label: 'Donor B (Project-based)', amount: 5100000, detail: 'YTD Aug 2026 · 28% · +12% (new programme)' },
  { id: 'inc-3', type: 'income', label: 'Government Contracts', amount: 2400000, detail: 'YTD Aug 2026 · 13% · stable' },
  { id: 'inc-4', type: 'income', label: 'Earned Income', amount: 1800000, detail: 'YTD Aug 2026 · 10% · +8% (workshop revenue)' },
  { id: 'inc-5', type: 'income', label: 'Other (misc grants)', amount: 500000, detail: 'YTD Aug 2026 · 3% · -5% (one-time only)' },
];

const SEED_EXPENSES: FinanceRecord[] = [
  { id: 'exp-1', type: 'expense', label: 'Personnel (salaries)', amount: 8400000, detail: 'YTD Aug 2026 · 47% of income · stable (headcount)' },
  { id: 'exp-2', type: 'expense', label: 'Programs & Delivery', amount: 4200000, detail: 'YTD Aug 2026 · 23% · +6% (scaling)' },
  { id: 'exp-3', type: 'expense', label: 'Operations & Admin', amount: 2800000, detail: 'YTD Aug 2026 · 15% · stable' },
  { id: 'exp-4', type: 'expense', label: 'Finance & Compliance', amount: 1100000, detail: 'YTD Aug 2026 · 6% · stable' },
  { id: 'exp-5', type: 'expense', label: 'Capital & Equipment', amount: 1500000, detail: 'YTD Aug 2026 · 8% · +22% (IT refresh)' },
  { id: 'exp-6', type: 'expense', label: 'Other (contingency)', amount: 200000, detail: 'YTD Aug 2026 · 1% · stable' },
];

const SEED_BUDGETS: BudgetRecord[] = [
  { id: 'b1', dept: 'Programs', budget: 3500000, actual: 2400000, forecastPct: 82 },
  { id: 'b2', dept: 'Grants', budget: 1800000, actual: 1300000, forecastPct: 88 },
  { id: 'b3', dept: 'Operations', budget: 1200000, actual: 875000, forecastPct: 91 },
  { id: 'b4', dept: 'HR & Admin', budget: 1000000, actual: 770000, forecastPct: 95 },
  { id: 'b5', dept: 'IT', budget: 650000, actual: 390000, forecastPct: 72 },
  { id: 'b6', dept: 'Finance', budget: 280000, actual: 180000, forecastPct: 78 },
];

const persistedFinance = loadJSON<PersistedFinance | null>(STORAGE_KEYS.finance, null);
let income: FinanceRecord[] = (persistedFinance?.income ?? (demoMode() ? SEED_INCOME : [])).map((r) => ({ ...r }));
let expenses: FinanceRecord[] = (persistedFinance?.expenses ?? (demoMode() ? SEED_EXPENSES : [])).map((r) => ({ ...r }));
let budgets: BudgetRecord[] = (persistedFinance?.budgets ?? (demoMode() ? SEED_BUDGETS : [])).map((r) => ({ ...r }));
let pendingEdits: PendingFinanceEdit[] = persistedFinance?.pendingEdits ?? [];
let exportLogs: FinanceExportLog[] = persistedFinance?.exports ?? [];

/** Reseed the finance store with the demo ledger (Settings → Load demo dataset) */
export function loadDemoFinance(): void {
  income = SEED_INCOME.map((r) => ({ ...r }));
  expenses = SEED_EXPENSES.map((r) => ({ ...r }));
  budgets = SEED_BUDGETS.map((r) => ({ ...r }));
  pendingEdits = [];
  saveFinance();
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

function saveFinance(): void {
  saveJSON(STORAGE_KEYS.finance, { income, expenses, budgets, pendingEdits, exports: exportLogs });
}

function fmt(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

export const financeService = {
  getIncome: (): FinanceRecord[] => income,
  getExpenses: (): FinanceRecord[] => expenses,
  getBudgets: (): BudgetRecord[] => budgets,
  getPendingEdits: (): PendingFinanceEdit[] => pendingEdits,

  totalIncome: () => income.reduce((s, r) => s + r.amount, 0),
  totalExpense: () => expenses.reduce((s, r) => s + r.amount, 0),

  /**
   * Finance submits a change to a record. The change is queued as PENDING ED
   * APPROVAL and the caller notifies the ED immediately. Nothing is applied
   * until the ED approves.
   */
  submitEdit: (
    recordType: FinanceRecordType,
    recordId: string,
    field: string,
    newValue: string,
    submittedBy: string
  ): PendingFinanceEdit | undefined => {
    const record =
      recordType === 'income' ? income.find((r) => r.id === recordId)
      : recordType === 'expense' ? expenses.find((r) => r.id === recordId)
      : budgets.find((r) => r.id === recordId);
    if (!record) return undefined;

    const oldValue =
      recordType === 'budget'
        ? String((record as BudgetRecord).budget)
        : String((record as FinanceRecord).amount);

    const edit: PendingFinanceEdit = {
      id: nextId('edit'),
      recordType,
      recordId,
      label: recordType === 'budget' ? `Budget — ${(record as BudgetRecord).dept}` : (record as FinanceRecord).label,
      field,
      oldValue: field === 'amount' ? fmt(Number(oldValue)) : oldValue,
      newValue: field === 'amount' ? fmt(Number(newValue)) : newValue,
      submittedBy,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };
    pendingEdits = [edit, ...pendingEdits];
    saveFinance();
    return edit;
  },

  /** ED approves a pending edit → the change is applied to the record */
  approveEdit: (editId: string, edNote?: string): PendingFinanceEdit | undefined => {
    const edit = pendingEdits.find((e) => e.id === editId);
    if (!edit || edit.status !== 'pending') return undefined;
    const num = Number(edit.newValue.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(num)) return edit;
    if (edit.recordType === 'income') {
      const rec = income.find((r) => r.id === edit.recordId);
      if (rec) rec.amount = num;
    } else if (edit.recordType === 'expense') {
      const rec = expenses.find((r) => r.id === edit.recordId);
      if (rec) rec.amount = num;
    } else {
      const rec = budgets.find((r) => r.id === edit.recordId);
      if (rec) rec.budget = num;
    }
    edit.status = 'approved';
    edit.edNote = edNote;
    saveFinance();
    return edit;
  },

  rejectEdit: (editId: string, edNote?: string): PendingFinanceEdit | undefined => {
    const edit = pendingEdits.find((e) => e.id === editId);
    if (!edit || edit.status !== 'pending') return undefined;
    edit.status = 'rejected';
    edit.edNote = edNote;
    saveFinance();
    return edit;
  },

  /**
   * Record an approved requisition as an expense and charge it to the
   * matching department budget (actuals increase). Called by the ED on
   * approval so the finance ledger and budgets reflect the commitment.
   */
  recordRequisitionExpense: (input: { amount: number; dept: string; description: string; ref: string }): FinanceRecord => {
    const rec: FinanceRecord = {
      id: nextId('exp'),
      type: 'expense',
      label: `Requisition — ${input.description}`,
      amount: input.amount,
      detail: `Disbursed against ${input.ref} · ${input.dept}`,
    };
    expenses = [rec, ...expenses];
    const match = budgets.find((b) => input.dept.toLowerCase().includes(b.dept.toLowerCase()) || b.dept.toLowerCase().includes(input.dept.toLowerCase()));
    if (match) {
      budgets = budgets.map((b) => (b.id === match.id ? { ...b, actual: Math.min(b.budget, b.actual + input.amount), forecastPct: Math.min(100, Math.round(((b.actual + input.amount) / b.budget) * 100)) } : b));
    }
    saveFinance();
    return rec;
  },

  /** Remaining (unspent) budget for a department, when a match exists */
  budgetRemainingFor: (dept: string): { dept: string; budget: number; actual: number; remaining: number } | null => {
    const match = budgets.find((b) => dept.toLowerCase().includes(b.dept.toLowerCase()) || b.dept.toLowerCase().includes(dept.toLowerCase()));
    return match ? { dept: match.dept, budget: match.budget, actual: match.actual, remaining: Math.max(0, match.budget - match.actual) } : null;
  },

  /** Record an export in the Data Vault export log (aims_finance) */
  recordExport: (fmt: FinanceExportLog['fmt'], count: number): FinanceExportLog => {
    const entry: FinanceExportLog = { id: nextId('exp-log'), ts: new Date().toISOString(), fmt, count };
    exportLogs = [entry, ...exportLogs];
    saveFinance();
    return entry;
  },

  getExportLog: (): FinanceExportLog[] => exportLogs,
};
