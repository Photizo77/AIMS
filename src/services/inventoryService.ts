// src/services/inventoryService.ts
// ============================================================
// AIMS — Inventory store (persisted, single composite record).
// The real source of truth for the Inventory hub: assets, stock &
// consumables, reorders, assignments, maintenance and stock-takes.
// Every mutation saves through the unified storage layer, so the
// UI auto-updates via useLiveData and data survives page reloads.
// ============================================================

import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';

export type AssetCondition = 'Excellent' | 'Good' | 'Fair' | 'Needs Repair';

export interface Asset {
  id: string; tag: string; name: string; category: string;
  custodian: string; condition: AssetCondition; value: string;
  acquired: string; vendor: string; status: 'active' | 'retired';
}

export interface StockItem {
  id: string; name: string; qty: number; threshold: number; unit: string;
  category?: string; reorderQty?: number; location?: string; supplier?: string;
}

export type ReorderStatus = 'Draft' | 'ED Pending' | 'Approved' | 'Ordered' | 'Received' | 'Rejected';

export interface ReorderVendor { name: string; unit: string; lead: string; }

export interface Reorder {
  id: string; item: string; current: number; qty: number; unitCost: string;
  est: string; status: ReorderStatus; vendors: ReorderVendor[]; selectedVendor?: string;
}

export interface Assignment {
  id: string; person: string; due: string; items: string[];
  done: number; total: number; status: 'In Progress' | 'Awaiting Return' | 'Completed';
}

export interface MaintRecord {
  id: string; asset: string; assetId?: string; date: string;
  type: 'Service' | 'Inspection' | 'Repair'; detail: string; cost: string;
  provider: string; daysDown: number; wo: string;
}

export interface StockTakeRow { id: string; item: string; expected: number; found: number; delta: number; status: 'Reconciled' | 'Discrepancy'; }

export interface StockTakeSession {
  id: string; date: string; conductedBy: string; accuracyPct: number;
  rows: StockTakeRow[]; auditors: string[];
}

interface InventoryState {
  assets: Asset[]; stock: StockItem[]; reorders: Reorder[];
  assignments: Assignment[]; maintenance: MaintRecord[]; stockTakes: StockTakeSession[];
}

function seedState(): InventoryState {
  return {
    assets: [
      { id: 'a1', tag: 'LAP001', name: 'MacBook Pro 14"', category: 'IT Hardware', custodian: 'Sarah Aciro', condition: 'Excellent', value: 'UGX 3.2M', acquired: 'Aug 2025', vendor: 'Apple', status: 'active' },
      { id: 'a2', tag: 'PHN002', name: 'iPhone 13', category: 'Mobile Device', custodian: 'Florence Adong', condition: 'Good', value: 'UGX 1.8M', acquired: 'Aug 2025', vendor: 'Apple', status: 'active' },
      { id: 'a3', tag: 'FUR001', name: 'Desk Chair (Ergonomic)', category: 'Furniture', custodian: 'Grace Nakamya', condition: 'Fair', value: 'UGX 450K', acquired: 'Mar 2025', vendor: 'FurnitureCare', status: 'active' },
      { id: 'a4', tag: 'PRT001', name: 'Canon i7 Printer', category: 'Equipment', custodian: 'Warehouse (shared)', condition: 'Good', value: 'UGX 2.1M', acquired: 'Jun 2024', vendor: 'PrintSupply', status: 'active' },
      { id: 'a5', tag: 'LAP002', name: 'MacBook Pro 14"', category: 'IT Hardware', custodian: 'Available', condition: 'Good', value: 'UGX 3.2M', acquired: 'Aug 2025', vendor: 'Apple', status: 'active' },
    ],
    stock: [
      { id: 's1', name: 'Printer Paper A4', qty: 15, threshold: 20, unit: 'reams' },
      { id: 's2', name: 'Printer Paper A3', qty: 8, threshold: 5, unit: 'reams' },
      { id: 's3', name: 'Ink Cartridges (Epson)', qty: 12, threshold: 10, unit: 'boxes' },
      { id: 's4', name: 'Toner Cartridges (Canon)', qty: 2, threshold: 5, unit: 'units' },
      { id: 's5', name: 'USB Dongles', qty: 3, threshold: 10, unit: 'units' },
      { id: 's6', name: 'USB Cables (Micro)', qty: 25, threshold: 20, unit: 'units' },
    ],
    reorders: [
      { id: 'r1', item: 'Toner Cartridges (Canon)', current: 2, qty: 10, unitCost: 'UGX 80K', est: 'UGX 800K', status: 'Draft', vendors: [{ name: 'Vendor A', unit: 'UGX 75K', lead: '3 days' }, { name: 'Vendor B', unit: 'UGX 85K', lead: '1 day' }] },
      { id: 'r2', item: 'USB Dongles', current: 3, qty: 12, unitCost: 'UGX 25K', est: 'UGX 300K', status: 'ED Pending', vendors: [{ name: 'Vendor A', unit: 'UGX 24K', lead: '2 days' }] },
    ],
    assignments: [
      { id: 'as1', person: 'Pius Odong (New Hire)', due: 'Aug 20, 2026', items: ['Laptop (IT Equipment)', 'Phone (Mobile Device)', 'Access Card', 'Desk & Chair'], done: 2, total: 4, status: 'In Progress' },
      { id: 'as2', person: 'Okello Komakech (Exit Sep 30)', due: 'Sep 30, 2026', items: ['Laptop LAP001', 'Phone PHN002', 'Access Card ARDI-12345', 'Desk & Chair'], done: 0, total: 4, status: 'Awaiting Return' },
    ],
    maintenance: [
      { id: 'm1', asset: 'Desk Chair (FUR001)', assetId: 'a3', date: 'Sep 15, 2026', type: 'Service', detail: 'Cushion replacement', cost: 'UGX 45K', provider: 'FurnitureCare Co.', daysDown: 2, wo: 'WO-2026-089' },
      { id: 'm2', asset: 'Desk Chair (FUR001)', assetId: 'a3', date: 'Jun 20, 2026', type: 'Inspection', detail: 'Routine — minor wear noted', cost: 'UGX 0', provider: 'Internal', daysDown: 0, wo: '—' },
    ],
    stockTakes: [
      {
        id: 'st1', date: '2026-08-30', conductedBy: 'Grace Aceng & Isaac Tumusiime', accuracyPct: 98,
        rows: [
          { id: 'st1-1', item: 'Printer Paper A4', expected: 35, found: 32, delta: -3, status: 'Discrepancy' },
          { id: 'st1-2', item: 'USB Cables (Micro)', expected: 30, found: 28, delta: -2, status: 'Discrepancy' },
          { id: 'st1-3', item: 'Toner Cartridges (Canon)', expected: 8, found: 8, delta: 0, status: 'Reconciled' },
        ],
        auditors: ['Grace Aceng', 'Isaac Tumusiime'],
      },
    ],
  };
}

const persisted = loadJSON<InventoryState | null>(STORAGE_KEYS.inventory, null);
let state: InventoryState = persisted && persisted.assets ? persisted : seedState();

function persist(): void {
  saveJSON(STORAGE_KEYS.inventory, state);
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

// ── Getters ──
export const inventoryGet = {
  assets: (): Asset[] => clone(state.assets),
  stock: (): StockItem[] => clone(state.stock),
  reorders: (): Reorder[] => clone(state.reorders),
  assignments: (): Assignment[] => clone(state.assignments),
  maintenance: (): MaintRecord[] => clone(state.maintenance),
  stockTakes: (): StockTakeSession[] => clone(state.stockTakes),
  lowStock: (): StockItem[] => state.stock.filter((s) => s.qty < s.threshold),
  latestStockTake: (): StockTakeSession | null => (state.stockTakes.length > 0 ? clone(state.stockTakes[0]) : null),
  totalAssetValue: (): number => state.assets.reduce((s, a) => s + parseValue(a.value), 0),
};

function parseValue(v: string): number {
  const n = parseFloat(v.replace(/[^0-9.]/g, ''));
  if (v.includes('M')) return n * 1000000;
  if (v.includes('K')) return n * 1000;
  return n || 0;
}

// ── Assets ──
export function addAsset(input: Omit<Asset, 'id' | 'status'>): Asset {
  const asset: Asset = { ...input, id: `a-${Date.now()}`, status: 'active' };
  state = { ...state, assets: [asset, ...state.assets] };
  persist();
  return asset;
}
export function updateAsset(id: string, patch: Partial<Asset>): void {
  state = { ...state, assets: state.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) };
  persist();
}
export function reassignAsset(id: string, custodian: string): void {
  updateAsset(id, { custodian });
}
export function retireAsset(id: string): void {
  updateAsset(id, { status: 'retired', custodian: 'Retired' });
}
export function removeAsset(id: string): void {
  state = { ...state, assets: state.assets.filter((a) => a.id !== id) };
  persist();
}

// ── Stock ──
export function adjustStock(id: string, delta: number): StockItem | undefined {
  const item = state.stock.find((s) => s.id === id);
  if (!item) return undefined;
  const qty = Math.max(0, item.qty + delta);
  state = { ...state, stock: state.stock.map((s) => (s.id === id ? { ...s, qty } : s)) };
  persist();
  return { ...item, qty };
}
export function addStockItem(input: { name: string; qty: number; threshold: number; unit: string; category?: string; reorderQty?: number; location?: string; supplier?: string; }): StockItem {
  const item: StockItem = { id: `s-${Date.now()}`, ...input };
  state = { ...state, stock: [...state.stock, item] };
  persist();
  return item;
}
export function setStockThreshold(id: string, threshold: number): void {
  state = { ...state, stock: state.stock.map((s) => (s.id === id ? { ...s, threshold } : s)) };
  persist();
}

// ── Reorders ──
export function addReorder(input: { item: string; current: number; qty: number; unitCost: string; vendors?: ReorderVendor[] }): Reorder {
  const numeric = parseFloat(input.unitCost.replace(/[^0-9.]/g, ''));
  const total = input.qty * (numeric || 0);
  const reorder: Reorder = {
    id: `r-${Date.now()}`,
    item: input.item, current: input.current, qty: input.qty,
    unitCost: input.unitCost,
    est: total >= 1000000 ? `UGX ${(total / 1000000).toFixed(1)}M` : total >= 1000 ? `UGX ${Math.round(total / 1000)}K` : `UGX ${total}`,
    status: 'Draft',
    vendors: input.vendors ?? [],
  };
  state = { ...state, reorders: [reorder, ...state.reorders] };
  persist();
  return reorder;
}
export function routeReorderToED(id: string): void {
  state = { ...state, reorders: state.reorders.map((r) => (r.id === id ? { ...r, status: 'ED Pending' } : r)) };
  persist();
}
export function decideReorder(id: string, status: ReorderStatus): void {
  state = { ...state, reorders: state.reorders.map((r) => (r.id === id ? { ...r, status } : r)) };
  persist();
}
export function selectReorderVendor(id: string, vendor: string): void {
  state = { ...state, reorders: state.reorders.map((r) => (r.id === id ? { ...r, selectedVendor: vendor, status: r.status === 'ED Pending' ? r.status : r.status } : r)) };
  persist();
}
export function requestReorderRevisions(id: string): void {
  state = { ...state, reorders: state.reorders.map((r) => (r.id === id ? { ...r, status: 'Draft' } : r)) };
  persist();
}

// ── Assignments ──
export function addAssignment(input: { person: string; due: string; items: string[] }): Assignment {
  const assignment: Assignment = { id: `as-${Date.now()}`, done: 0, total: input.items.length, status: input.items.length > 0 ? 'In Progress' : 'Completed', ...input };
  state = { ...state, assignments: [...state.assignments, assignment] };
  persist();
  return assignment;
}
export function advanceAssignment(id: string, n = 1): void {
  state = {
    ...state,
    assignments: state.assignments.map((a) => {
      if (a.id !== id) return a;
      const done = Math.min(a.total, a.done + n);
      return { ...a, done, status: done >= a.total ? 'Completed' : 'In Progress' };
    }),
  };
  persist();
}
export function markAssignmentReceived(id: string): void {
  state = { ...state, assignments: state.assignments.map((a) => (a.id === id ? { ...a, done: a.total, status: 'Completed' } : a)) };
  persist();
}
export function addAssignmentItem(id: string, item: string): void {
  state = {
    ...state,
    assignments: state.assignments.map((a) => (a.id === id && !a.items.includes(item) ? { ...a, items: [...a.items, item], total: a.total + 1 } : a)),
  };
  persist();
}

// ── Maintenance ──
export function addMaintRecord(input: { asset: string; assetId?: string; type: MaintRecord['type']; detail: string; cost: string; provider: string; daysDown: number; date?: string }): MaintRecord {
  const record: MaintRecord = {
    id: `m-${Date.now()}`,
    asset: input.asset, assetId: input.assetId, type: input.type, detail: input.detail,
    cost: input.cost, provider: input.provider, daysDown: input.daysDown,
    date: input.date ?? new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    wo: `WO-${new Date().getFullYear()}-${String(state.maintenance.length + 90).padStart(3, '0')}`,
  };
  state = { ...state, maintenance: [record, ...state.maintenance] };
  persist();
  return record;
}

// ── Stock-take ──
export function planStockTake(conductedBy: string, auditors: string[], date?: string): StockTakeSession {
  const rows: StockTakeRow[] = state.stock.map((s, i) => ({
    id: `row-${Date.now()}-${i}`,
    item: s.name,
    expected: s.qty,
    found: s.qty,
    delta: 0,
    status: 'Reconciled',
  }));
  const session: StockTakeSession = {
    id: `st-${Date.now()}`,
    date: date ?? new Date().toISOString().split('T')[0],
    conductedBy,
    accuracyPct: 100,
    rows,
    auditors,
  };
  state = { ...state, stockTakes: [session, ...state.stockTakes] };
  persist();
  return session;
}
export function updateStockTakeAuditors(id: string, auditors: string[]): void {
  state = { ...state, stockTakes: state.stockTakes.map((t) => (t.id === id ? { ...t, auditors } : t)) };
  persist();
}
export function recordFound(id: string, rowId: string, found: number): void {
  state = {
    ...state,
    stockTakes: state.stockTakes.map((t) => (t.id !== id ? t : {
      ...t,
      accuracyPct: Math.max(0, Math.round(100 - (t.rows.filter((r) => r.id !== rowId && r.delta !== 0).length + (t.rows.find((r) => r.id === rowId && found !== r.expected) ? 1 : 0)) / t.rows.length * 100)),
      rows: t.rows.map((r) => (r.id === rowId ? { ...r, found, delta: found - r.expected, status: found === r.expected ? 'Reconciled' : 'Discrepancy' } : r)),
    })),
  };
  persist();
}

// Reset demo history (used by the hub's "start fresh stock-take" flows)
export function resetInventory(): void {
  state = seedState();
  persist();
}
