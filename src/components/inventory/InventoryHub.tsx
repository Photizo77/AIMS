// src/components/inventory/InventoryHub.tsx
// ============================================================
// AIMS — Inventory & Asset Management (Company Admin)
// Asset Register · Stock & Consumables · Reorders ·
// Assignment & Handover · Maintenance · Stock-Take
// ============================================================

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';

type TabKey = 'assets' | 'stock' | 'reorders' | 'assignment' | 'maintenance' | 'stocktake';

const TABS: { id: TabKey; label: string; icon: string }[] = [
  { id: 'assets', label: 'Asset Register', icon: 'inventory_2' },
  { id: 'stock', label: 'Stock & Consumables', icon: 'inventory' },
  { id: 'reorders', label: 'Reorders', icon: 'shopping_cart' },
  { id: 'assignment', label: 'Assignment & Handover', icon: 'swap_horiz' },
  { id: 'maintenance', label: 'Maintenance', icon: 'build' },
  { id: 'stocktake', label: 'Stock-Take', icon: 'fact_check' },
];

interface Asset {
  id: string; tag: string; name: string; category: string; custodian: string; condition: 'Excellent' | 'Good' | 'Fair' | 'Needs Repair'; value: string; acquired: string; vendor: string;
}
const MOCK_ASSETS: Asset[] = [
  { id: 'a1', tag: 'LAP001', name: 'MacBook Pro 14"', category: 'IT Hardware', custodian: 'Sarah Aciro', condition: 'Excellent', value: 'UGX 3.2M', acquired: 'Aug 2025', vendor: 'Apple' },
  { id: 'a2', tag: 'PHN002', name: 'iPhone 13', category: 'Mobile Device', custodian: 'Florence Adong', condition: 'Good', value: 'UGX 1.8M', acquired: 'Aug 2025', vendor: 'Apple' },
  { id: 'a3', tag: 'FUR001', name: 'Desk Chair (Ergonomic)', category: 'Furniture', custodian: 'Grace Nakamya', condition: 'Fair', value: 'UGX 450K', acquired: 'Mar 2025', vendor: 'FurnitureCare' },
  { id: 'a4', tag: 'PRT001', name: 'Canon i7 Printer', category: 'Equipment', custodian: 'Warehouse (shared)', condition: 'Good', value: 'UGX 2.1M', acquired: 'Jun 2024', vendor: 'PrintSupply' },
  { id: 'a5', tag: 'LAP002', name: 'MacBook Pro 14"', category: 'IT Hardware', custodian: 'Available', condition: 'Good', value: 'UGX 3.2M', acquired: 'Aug 2025', vendor: 'Apple' },
];

interface StockItem { id: string; name: string; qty: number; threshold: number; unit: string }
const MOCK_STOCK: StockItem[] = [
  { id: 's1', name: 'Printer Paper A4', qty: 15, threshold: 20, unit: 'reams' },
  { id: 's2', name: 'Printer Paper A3', qty: 8, threshold: 5, unit: 'reams' },
  { id: 's3', name: 'Ink Cartridges (Epson)', qty: 12, threshold: 10, unit: 'boxes' },
  { id: 's4', name: 'Toner Cartridges (Canon)', qty: 2, threshold: 5, unit: 'units' },
  { id: 's5', name: 'USB Dongles', qty: 3, threshold: 10, unit: 'units' },
  { id: 's6', name: 'USB Cables (Micro)', qty: 25, threshold: 20, unit: 'units' },
];

const MOCK_REORDERS = [
  { id: 'r1', item: 'Toner Cartridges (Canon)', current: 2, qty: 10, unitCost: 'UGX 80K', est: 'UGX 800K', status: 'Draft' as ReorderStatus, vendors: [{ name: 'Vendor A', unit: 'UGX 75K', lead: '3 days' }, { name: 'Vendor B', unit: 'UGX 85K', lead: '1 day' }] },
  { id: 'r2', item: 'USB Dongles', current: 3, qty: 12, unitCost: 'UGX 25K', est: 'UGX 300K', status: 'ED Pending' as ReorderStatus, vendors: [{ name: 'Vendor A', unit: 'UGX 24K', lead: '2 days' }] },
];

type ReorderStatus = 'Draft' | 'ED Pending' | 'Approved' | 'Ordered' | 'Received' | 'Rejected';

const MOCK_ASSIGNMENTS = [
  { id: 'as1', person: 'Pius Odong (New Hire)', due: 'Aug 20', items: ['Laptop (IT Equipment)', 'Phone (Mobile Device)', 'Access Card', 'Desk & Chair'], done: 2, total: 4, status: 'In Progress' },
  { id: 'as2', person: 'Okello Komakech (Exit Sep 30)', due: 'Sep 30', items: ['Laptop LAP001', 'Phone PHN002', 'Access Card ARDI-12345', 'Desk & Chair'], done: 0, total: 4, status: 'Awaiting Return' },
];

const MOCK_MAINTENANCE = [
  { id: 'm1', asset: 'Desk Chair (FUR001)', date: 'Sep 15, 2026', type: 'Service', detail: 'Cushion replacement', cost: 'UGX 45K', provider: 'FurnitureCare Co.', daysDown: 2, wo: 'WO-2026-089' },
  { id: 'm2', asset: 'Desk Chair (FUR001)', date: 'Jun 20, 2026', type: 'Inspection', detail: 'Routine — minor wear noted', cost: 'UGX 0', provider: 'Internal', daysDown: 0, wo: '—' },
];

const MOCK_STOCKTAKE = [
  { id: 'st1', item: 'Printer Paper A4', expected: 35, found: 32, delta: -3, status: 'Discrepancy' },
  { id: 'st2', item: 'USB Cables', expected: 30, found: 28, delta: -2, status: 'Discrepancy' },
  { id: 'st3', item: 'Canon Toner', expected: 8, found: 8, delta: 0, status: 'Reconciled' },
];

export function InventoryHub() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [activeTab, setActiveTab] = useState<TabKey>('assets');
  const [assetSearch, setAssetSearch] = useState('');
  const [reorders, setReorders] = useState(MOCK_REORDERS);

  const notify = (title: string, message: string, type: 'success' | 'info' | 'warning' = 'success') => showToast({ title, message, type });

  const isED = user?.role === 'ED';

  const reorderDecision = (id: string, decision: ReorderStatus, msg: string) => {
    setReorders((prev) => prev.map((r) => (r.id === id ? { ...r, status: decision } : r)));
    notify(decision === 'Approved' ? 'Reorder Approved' : decision === 'Rejected' ? 'Reorder Rejected' : 'Status Updated', msg, decision === 'Rejected' ? 'warning' : 'success');
  };

  const lowStock = MOCK_STOCK.filter((s) => s.qty < s.threshold);
  const filteredAssets = MOCK_ASSETS.filter((a) => !assetSearch || a.name.toLowerCase().includes(assetSearch.toLowerCase()) || a.tag.toLowerCase().includes(assetSearch.toLowerCase()) || a.custodian.toLowerCase().includes(assetSearch.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors', activeTab === tab.id ? 'bg-white text-aims-navy shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* ── ASSET REGISTER ── */}
      {activeTab === 'assets' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <input type="text" value={assetSearch} onChange={(e) => setAssetSearch(e.target.value)} placeholder="Search asset, tag or custodian…" className="flex-1 min-w-[200px] text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
            <div className="flex gap-2">
              <button onClick={() => notify('Asset Added', 'New asset registered in the register.')} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90">+ Add New Asset</button>
              <button onClick={() => notify('Register Exported', 'Asset register exported.')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50">Export Register</button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Asset</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Tag</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Category</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Custodian</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Condition</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Value</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-bold text-slate-900">{a.name}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs font-mono">{a.tag}</td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs">{a.category}</td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs">{a.custodian}</td>
                    <td className="px-4 py-2.5"><span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', a.condition === 'Excellent' ? 'bg-aims-green/15 text-aims-green' : a.condition === 'Good' ? 'bg-aims-navy/10 text-aims-navy' : a.condition === 'Fair' ? 'bg-aims-orange/15 text-aims-orange' : 'bg-red-50 text-red-500')}>{a.condition}</span></td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs font-bold">{a.value}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => notify('Asset Detail', `${a.name} (${a.tag}) · acquired ${a.acquired} from ${a.vendor} · custodian history on file.`)} className="text-[10px] font-bold text-aims-navy hover:underline">View</button>
                        <button onClick={() => notify('Asset Reassigned', `${a.name} reassigned to a new custodian.`)} className="text-[10px] font-bold text-aims-navy hover:underline">Reassign</button>
                        <button onClick={() => notify('Maintenance Scheduled', `Maintenance scheduled for ${a.name}.`)} className="text-[10px] font-bold text-aims-navy hover:underline">Schedule Maint.</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── STOCK & CONSUMABLES ── */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-bold text-red-700 mb-2">⚠️ Low Stock Alerts</p>
            <div className="space-y-1">
              {lowStock.map((s) => <p key={s.id} className="text-xs text-red-600">• {s.name}: {s.qty} {s.unit} (threshold: {s.threshold})</p>)}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Item</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Quantity</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Threshold</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_STOCK.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-bold text-slate-900">{s.name}</td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs">{s.qty} {s.unit}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{s.threshold} {s.unit}</td>
                    <td className="px-4 py-2.5"><span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', s.qty < s.threshold ? 'bg-red-50 text-red-500' : 'bg-aims-green/15 text-aims-green')}>{s.qty < s.threshold ? 'Low Stock' : 'In Stock'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <button onClick={() => notify('Stock Issued', 'Stock issue recorded to employee.')} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90">+ Issue Stock</button>
            <button onClick={() => notify('Stock Received', 'New purchase received into inventory.')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50">+ Receive Stock</button>
            <button onClick={() => notify('Report Exported', 'Stock report exported (CSV/PDF).')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50">CSV/PDF Stock Report</button>
          </div>
        </div>
      )}

      {/* ── REORDERS ── */}
      {activeTab === 'reorders' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => notify('Reorder Drafted', 'Manual reorder request created.')} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90">+ Draft New Reorder</button>
          </div>
          {reorders.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{r.item}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Current: {r.current} units | Reorder qty: {r.qty} | Est. cost: {r.est}</p>
                </div>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', r.status === 'Draft' ? 'bg-slate-100 text-slate-600' : 'bg-aims-navy/10 text-aims-navy')}>{r.status}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {r.vendors.map((v) => (
                  <button key={v.name} onClick={() => notify('Vendor Selected', `${v.name} selected — total ${r.est} (lead: ${v.lead}).`)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs hover:border-aims-navy/40 hover:bg-aims-navy/5">
                    <span className="font-bold text-slate-800">{v.name}:</span> <span className="text-slate-500">{v.unit}/unit · lead {v.lead}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                {isED ? (
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => reorderDecision(r.id, 'Approved', `${r.item} approved — order placed with vendor.`)} className="px-4 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90">✓ Approve & Order</button>
                    <button onClick={() => reorderDecision(r.id, 'Rejected', `${r.item} rejected.`)} className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100">✗ Reject</button>
                    <button onClick={() => notify('Revisions Requested', `${r.item} returned to Company Admin for revisions.`, 'warning')} className="px-4 py-2 bg-aims-orange text-white text-xs font-bold rounded-lg hover:bg-aims-orange/90">◄ Request Revisions</button>
                  </div>
                ) : (
                  <button onClick={() => reorderDecision(r.id, 'ED Pending', `${r.item} reorder routed to ED for authorization.`)} className="px-4 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90">Route to ED for Authorization</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ASSIGNMENT & HANDOVER ── */}
      {activeTab === 'assignment' && (
        <div className="space-y-4">
          {MOCK_ASSIGNMENTS.map((as) => (
            <div key={as.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{as.person}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{as.due} · {as.done}/{as.total} handled</p>
                </div>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', as.status === 'In Progress' ? 'bg-aims-navy/10 text-aims-navy' : 'bg-aims-orange/15 text-aims-orange')}>{as.status}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {as.items.map((item) => (
                  <span key={item} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">{item}</span>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                <button onClick={() => notify('Assets Assigned', `Assets assigned to ${as.person}.`)} className="px-4 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90">Assign Assets</button>
                <button onClick={() => notify('Receipt Confirmed', `Asset receipt confirmed for ${as.person}.`)} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90">Mark Received</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MAINTENANCE & REPAIR ── */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">Desk Chair (FUR001) — Service History</h3>
            <p className="text-xs text-slate-500 mb-3">Total maintenance cost: <strong className="text-aims-navy">UGX 45K</strong></p>
            <div className="space-y-3">
              {MOCK_MAINTENANCE.map((m) => (
                <div key={m.id} className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{m.type} — {m.date}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{m.detail}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Provider: {m.provider} · Days down: {m.daysDown} · Work order: {m.wo}</p>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">{m.cost}</span>
                </div>
              ))}
            </div>
            <button onClick={() => notify('Service Record Added', 'New maintenance/service record logged.')} className="mt-4 px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90">+ Add Service Record</button>
          </div>
        </div>
      )}

      {/* ── STOCK-TAKE ── */}
      {activeTab === 'stocktake' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Last Stock-Take: Aug 30, 2026</h3>
                <p className="text-xs text-slate-500 mt-0.5">Conducted by Grace Aceng & Isaac Tumusiime · Physical count vs system: <strong className="text-aims-green">98% accuracy</strong></p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-aims-orange/15 text-aims-orange uppercase">Next: Nov 30, 2026</span>
            </div>
            <div className="space-y-2">
              {MOCK_STOCKTAKE.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className={cn('w-6 h-6 rounded-full flex items-center justify-center', s.status === 'Reconciled' ? 'bg-aims-green/15 text-aims-green' : 'bg-red-50 text-red-500')}>
                      <span className="material-symbols-outlined text-[14px]">{s.status === 'Reconciled' ? 'check' : 'priority_high'}</span>
                    </span>
                    <div><p className="text-sm font-bold text-slate-900">{s.item}</p><p className="text-[10px] text-slate-500">Expected {s.expected} · Found {s.found} {s.delta !== 0 ? `(${s.delta > 0 ? '+' : ''}${s.delta})` : ''}</p></div>
                  </div>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', s.status === 'Reconciled' ? 'bg-aims-green/15 text-aims-green' : 'bg-red-50 text-red-500')}>{s.status}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 italic mt-3">Investigation: likely usage not logged. Resolution: system inventory updated + reminder to staff.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => notify('Stock-Take Planned', 'Next stock-take scheduled (Nov 30).')} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90">Plan Stock-Take</button>
            <button onClick={() => notify('Auditors Assigned', 'Stock-take auditors assigned.')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50">Assign Auditors</button>
            <button onClick={() => notify('Sheets Printed', 'Audit count sheets printed.')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50">Print Audit Sheets</button>
          </div>
        </div>
      )}
    </div>
  );
}
