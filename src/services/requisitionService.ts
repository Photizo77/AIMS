// src/services/requisitionService.ts
// ============================================================
// AIMS — Requisition store (shared, persisted)
// Finance drafts/pushes, the ED approves/rejects/pushes back, and
// innovation projects can raise funding requests into this same queue.
// ============================================================

import { useEffect, useState } from 'react';
import { loadJSON, saveJSON, STORAGE_KEYS, demoMode } from '@/lib/storage';

export type RequisitionStatus = 'draft' | 'pushed' | 'returned' | 'approved' | 'disbursed' | 'rejected';

export interface LineItem { item: string; qty: number; unit: string; total: number; }
export interface Attachment { id: string; name: string; fileType: string; size: string; }
export interface Requisition {
  id: string; title: string; dept: string; requester: string; amount: number;
  purpose: string; budgetLine: string; status: RequisitionStatus;
  createdAt: string; updatedAt: string; daysInStatus: number;
  lineItems: LineItem[]; attachments: Attachment[];
  edDecision?: { action: string; comment: string; date: string };
  disbursementRef?: string;
}

const MOCK_REQUISITIONS: Requisition[] = [
  { id: 'req-046', title: 'Q4 Office Supplies', dept: 'Finance', requester: 'David Okello', amount: 1850000, purpose: 'Quarterly office consumables restock', budgetLine: 'GL-5210 Office Supplies', status: 'draft', createdAt: '2026-08-22T10:00:00Z', updatedAt: '2026-08-22T14:00:00Z', daysInStatus: 0,
    lineItems: [{ item: 'A4 Paper (5 boxes)', qty: 5, unit: 'UGX 80K', total: 400000 }, { item: 'Toner Cartridges', qty: 4, unit: 'UGX 220K', total: 880000 }, { item: 'Filing Folders', qty: 20, unit: 'UGX 28K', total: 570000 }],
    attachments: [{ id: 'a1', name: 'Supplier_Quote_StationeryMart.pdf', fileType: 'PDF', size: '245 KB' }] },
  { id: 'req-047', title: 'Innovation Prototype Components', dept: 'Innovation', requester: 'David Okello', amount: 4200000, purpose: 'Electronic components for grain dryer iteration 3', budgetLine: 'GL-5421 R&D Equipment', status: 'draft', createdAt: '2026-08-21T09:00:00Z', updatedAt: '2026-08-21T16:00:00Z', daysInStatus: 1,
    lineItems: [{ item: 'Arduino Mega Boards', qty: 10, unit: 'UGX 180K', total: 1800000 }, { item: 'Temperature Sensors', qty: 20, unit: 'UGX 85K', total: 1700000 }], attachments: [] },
  { id: 'req-043', title: 'Land Rights Field Tablets', dept: 'Grants', requester: 'David Okello', amount: 6800000, purpose: 'Data collection devices for customary land mapping', budgetLine: 'GL-5315 Field Equipment', status: 'pushed', createdAt: '2026-08-18T09:00:00Z', updatedAt: '2026-08-20T11:00:00Z', daysInStatus: 2,
    lineItems: [{ item: 'Samsung Galaxy Tab A9', qty: 10, unit: 'UGX 680K', total: 6800000 }],
    attachments: [{ id: 'a2', name: 'Vendor_Invoice_SamsungUG.pdf', fileType: 'PDF', size: '412 KB' }] },
  { id: 'req-044', title: 'Community Sensitization Materials', dept: 'Grants', requester: 'David Okello', amount: 3200000, purpose: 'Posters, leaflets and banners for rollout', budgetLine: 'GL-5220 Communications', status: 'pushed', createdAt: '2026-08-15T09:00:00Z', updatedAt: '2026-08-19T14:00:00Z', daysInStatus: 4,
    lineItems: [{ item: 'A1 Posters', qty: 500, unit: 'UGX 3K', total: 1500000 }, { item: 'Leaflets', qty: 2000, unit: 'UGX 600', total: 1200000 }],
    attachments: [{ id: 'a4', name: 'Design_Drafts.zip', fileType: 'ZIP', size: '8.2 MB' }] },
  { id: 'req-039', title: 'Q2 Training Materials', dept: 'HR', requester: 'David Okello', amount: 2100000, purpose: 'Printed training modules for onboarding', budgetLine: 'GL-5230 Training', status: 'returned', createdAt: '2026-08-10T09:00:00Z', updatedAt: '2026-08-20T14:00:00Z', daysInStatus: 3,
    lineItems: [{ item: 'Training Manuals', qty: 100, unit: 'UGX 18K', total: 1800000 }],
    attachments: [{ id: 'a6', name: 'Outdated_Vendor_Quote.pdf', fileType: 'PDF', size: '180 KB' }],
    edDecision: { action: 'returned', comment: 'Vendor quote is from March 2026. Please refresh with current pricing.', date: '2026-08-20T14:00:00Z' } },
  { id: 'req-040', title: 'Workshop Venue Deposit', dept: 'Grants', requester: 'David Okello', amount: 1500000, purpose: 'Deposit for Gulu Conference Centre', budgetLine: 'GL-5218 Venue Rental', status: 'returned', createdAt: '2026-08-12T09:00:00Z', updatedAt: '2026-08-22T10:00:00Z', daysInStatus: 1,
    lineItems: [{ item: 'Venue Deposit (5 days)', qty: 1, unit: 'UGX 1.5M', total: 1500000 }],
    attachments: [{ id: 'a7', name: 'Venue_Contract_Draft.pdf', fileType: 'PDF', size: '520 KB' }],
    edDecision: { action: 'returned', comment: 'Budget line mismatch. Use GL-5421, not GL-5418.', date: '2026-08-22T10:00:00Z' } },
  { id: 'req-035', title: 'August Payroll Batch', dept: 'Finance', requester: 'David Okello', amount: 186000000, purpose: 'Monthly payroll for 142 employees', budgetLine: 'GL-5100 Salaries', status: 'approved', createdAt: '2026-08-01T09:00:00Z', updatedAt: '2026-08-25T11:00:00Z', daysInStatus: 0,
    lineItems: [{ item: 'Base Salaries', qty: 142, unit: 'UGX 1.18M', total: 168000000 }, { item: 'Allowances', qty: 142, unit: 'UGX 127K', total: 18000000 }],
    attachments: [],
    edDecision: { action: 'approved', comment: 'Approved. Finance to process disbursement.', date: '2026-08-25T11:00:00Z' } },
  { id: 'req-036', title: 'Q2 NSSF Contribution', dept: 'Finance', requester: 'David Okello', amount: 42000000, purpose: 'Statutory NSSF payment', budgetLine: 'GL-5115 NSSF', status: 'disbursed', createdAt: '2026-08-05T09:00:00Z', updatedAt: '2026-08-28T10:00:00Z', daysInStatus: 0,
    lineItems: [{ item: 'NSSF Q2 2026', qty: 142, unit: 'UGX 296K', total: 42000000 }], attachments: [], disbursementRef: 'DISB-2026-090' },
  { id: 'req-030', title: 'Obsolete Hardware Purchase', dept: 'IT', requester: 'David Okello', amount: 8500000, purpose: 'Legacy hardware acquisition', budgetLine: 'GL-5410 Equipment', status: 'rejected', createdAt: '2026-07-15T09:00:00Z', updatedAt: '2026-07-18T14:00:00Z', daysInStatus: 0,
    lineItems: [{ item: 'Legacy Servers (5)', qty: 5, unit: 'UGX 1.7M', total: 8500000 }], attachments: [],
    edDecision: { action: 'rejected', comment: 'Hardware obsolete, no vendor support. Explore cloud alternatives.', date: '2026-07-18T14:00:00Z' } },
];

const persisted = loadJSON<Requisition[] | null>(STORAGE_KEYS.requisitions, null);
export let requisitions: Requisition[] = (persisted && persisted.length > 0 ? persisted : demoMode() ? MOCK_REQUISITIONS : []).map((r) => ({
  ...r,
  lineItems: r.lineItems.map((l) => ({ ...l })),
  attachments: r.attachments.map((a) => ({ ...a })),
}));

/** Reseed the requisition store with the demo catalogue (Settings → Load demo dataset) */
export function loadDemoRequisitions(): void {
  requisitions = MOCK_REQUISITIONS.map((r) => ({
    ...r,
    lineItems: r.lineItems.map((l) => ({ ...l })),
    attachments: r.attachments.map((a) => ({ ...a })),
  }));
  persist();
}

const reqListeners = new Set<() => void>();

function persist(): void {
  saveJSON(STORAGE_KEYS.requisitions, requisitions);
  reqListeners.forEach((l) => l());
}

export function mutateRequisitions(fn: (list: Requisition[]) => void): void {
  fn(requisitions);
  persist();
}

export function useRequisitions(): Requisition[] {
  const [, setV] = useState(0);
  useEffect(() => {
    const listener = () => setV((v) => v + 1);
    reqListeners.add(listener);
    return () => { reqListeners.delete(listener); };
  }, []);
  return requisitions;
}

export function getAllRequisitions(): Requisition[] {
  return requisitions;
}

let reqCounter = 0;
/** Create a new draft requisition (used by Finance and by project funding requests) */
export function addRequisition(input: {
  title: string; dept: string; requester: string; amount: number;
  purpose: string; budgetLine: string; lineItems?: LineItem[];
}): Requisition {
  reqCounter += 1;
  const req: Requisition = {
    id: `req-${Date.now().toString().slice(-3)}${reqCounter}`,
    title: input.title,
    dept: input.dept,
    requester: input.requester,
    amount: input.amount,
    purpose: input.purpose,
    budgetLine: input.budgetLine,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    daysInStatus: 0,
    lineItems: input.lineItems ?? [{ item: input.title, qty: 1, unit: `UGX ${input.amount.toLocaleString()}`, total: input.amount }],
    attachments: [],
  };
  requisitions = [req, ...requisitions];
  persist();
  return req;
}
