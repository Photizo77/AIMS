// src/components/inventory/InventoryHub.tsx
// ============================================================
// AIMS — Inventory & Asset Management (Company Admin / ED)
// Asset Register · Stock & Consumables · Reorders ·
// Assignment & Handover · Maintenance · Stock-Take
// Every action mutates the persisted inventory store (inventoryService)
// and the UI auto-updates. No placeholder toasts.
// ============================================================

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { useLiveData } from '@/lib/useLiveData';
import { exportCsv, exportTableAsPdf } from '@/lib/export';
import {
  inventoryGet, addAsset, reassignAsset, retireAsset,
  adjustStock, addStockItem, addReorder, routeReorderToED, decideReorder,
  selectReorderVendor, requestReorderRevisions, advanceAssignment, markAssignmentReceived,
  addMaintRecord, planStockTake,
  type Asset, type Reorder, type ReorderStatus,
} from '@/services/inventoryService';

type TabKey = 'assets' | 'stock' | 'reorders' | 'assignment' | 'maintenance' | 'stocktake';

const TABS: { id: TabKey; label: string; icon: string }[] = [
  { id: 'assets', label: 'Asset Register', icon: 'inventory_2' },
  { id: 'stock', label: 'Stock & Consumables', icon: 'inventory' },
  { id: 'reorders', label: 'Reorders', icon: 'shopping_cart' },
  { id: 'assignment', label: 'Assignment & Handover', icon: 'swap_horiz' },
  { id: 'maintenance', label: 'Maintenance', icon: 'build' },
  { id: 'stocktake', label: 'Stock-Take', icon: 'fact_check' },
];

const INPUT = 'w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30';

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 bg-aims-navy rounded-t-xl flex items-center justify-between sticky top-0">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white"><span className="material-symbols-outlined text-[20px]">close</span></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function InventoryHub() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [activeTab, setActiveTab] = useState<TabKey>('assets');
  const [assetSearch, setAssetSearch] = useState('');
  useLiveData();

  const isED = user?.role === 'ED';

  const assets = inventoryGet.assets().filter((a) => a.status === 'active' || a.status === 'retired');
  const visibleAssets = assets.filter((a) => !assetSearch || a.name.toLowerCase().includes(assetSearch.toLowerCase()) || a.tag.toLowerCase().includes(assetSearch.toLowerCase()) || a.custodian.toLowerCase().includes(assetSearch.toLowerCase()));
  const stock = inventoryGet.stock();
  const reorders = inventoryGet.reorders();
  const assignments = inventoryGet.assignments();
  const maintenance = inventoryGet.maintenance();
  const latestTake = inventoryGet.latestStockTake();

  // ── Modals ──
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [reassignAssetId, setReassignAssetId] = useState<string | null>(null);
  const [showMaintAsset, setShowMaintAsset] = useState<string | null>(null);
  const [showIssue, setShowIssue] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showReorder, setShowReorder] = useState(false);
  const [showPlanTake, setShowPlanTake] = useState(false);
  const [assetDetail, setAssetDetail] = useState<Asset | null>(null);

  const reassignTarget = reassignAssetId ? assets.find((a) => a.id === reassignAssetId) : null;
  const maintTarget = showMaintAsset ? assets.find((a) => a.id === showMaintAsset) : null;

  // ── Real exports ──
  const exportAssets = (fmt: 'csv' | 'pdf') => {
    if (visibleAssets.length === 0) { showToast({ title: 'Nothing to Export', message: 'No assets match the current search.', type: 'error' }); return; }
    const rows = visibleAssets.map((a) => ({ tag: a.tag, name: a.name, category: a.category, custodian: a.custodian, condition: a.condition, value: a.value, acquired: a.acquired, vendor: a.vendor }));
    if (fmt === 'csv') { exportCsv('aims-asset-register', rows); showToast({ title: 'CSV Exported', message: `${rows.length} asset(s).`, type: 'success' }); }
    else {
      exportTableAsPdf('Asset Register', ['Tag', 'Asset', 'Category', 'Custodian', 'Condition', 'Value', 'Acquired', 'Vendor'], rows.map((r) => Object.values(r) as string[]));
      showToast({ title: 'Print Layout Ready', message: 'Choose "Save as PDF" in the print dialog.', type: 'success' });
    }
  };

  const exportStock = (fmt: 'csv' | 'pdf') => {
    const rows = stock.map((s) => ({ item: s.name, quantity: `${s.qty} ${s.unit}`, threshold: `${s.threshold} ${s.unit}`, status: s.qty < s.threshold ? 'Low Stock' : 'In Stock' }));
    if (fmt === 'csv') { exportCsv('aims-stock-report', rows); showToast({ title: 'CSV Exported', message: `${rows.length} stock item(s).`, type: 'success' }); }
    else { exportTableAsPdf('Stock & Consumables Report', ['Item', 'Quantity', 'Threshold', 'Status'], rows.map((r) => Object.values(r) as string[])); showToast({ title: 'Print Layout Ready', message: 'Choose "Save as PDF" in the print dialog.', type: 'success' }); }
  };

  const printAuditSheets = () => {
    const take = latestTake;
    if (!take) { showToast({ title: 'Nothing to Print', message: 'Plan a stock-take first.', type: 'error' }); return; }
    exportTableAsPdf('Stock-Take Audit Sheets', ['Item', 'Expected', 'Found', 'Delta', 'Status'], take.rows.map((r) => [r.item, String(r.expected), String(r.found), String(r.delta), r.status]));
    showToast({ title: 'Audit Sheets Ready', message: 'Choose "Save as PDF" in the print dialog.', type: 'success' });
  };

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
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setShowAddAsset(true)} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90">+ Add New Asset</button>
              <button onClick={() => exportAssets('csv')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50">Export CSV</button>
              <button onClick={() => exportAssets('pdf')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50">Export PDF</button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Asset</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Tag</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Category</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Custodian</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Condition</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Value</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {visibleAssets.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-bold text-slate-900">{a.name}{a.status === 'retired' && <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 uppercase">Retired</span>}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs font-mono">{a.tag}</td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs">{a.category}</td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs">{a.custodian}</td>
                    <td className="px-4 py-2.5"><span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', a.condition === 'Excellent' ? 'bg-aims-green/15 text-aims-green' : a.condition === 'Good' ? 'bg-aims-navy/10 text-aims-navy' : a.condition === 'Fair' ? 'bg-aims-orange/15 text-aims-orange' : 'bg-red-50 text-red-500')}>{a.condition}</span></td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs font-bold">{a.value}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-1.5 flex-wrap">
                        <button onClick={() => setAssetDetail(a)} className="text-[10px] font-bold text-aims-navy hover:underline">View</button>
                        {a.status === 'active' && <button onClick={() => setReassignAssetId(a.id)} className="text-[10px] font-bold text-aims-navy hover:underline">Reassign</button>}
                        <button onClick={() => setShowMaintAsset(a.id)} className="text-[10px] font-bold text-aims-navy hover:underline">Schedule Maint.</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleAssets.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400 italic">No assets match your search.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── STOCK & CONSUMABLES ── */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          {inventoryGet.lowStock().length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-bold text-red-700 mb-2">⚠️ Low Stock Alerts</p>
              <div className="space-y-1">{inventoryGet.lowStock().map((s) => <p key={s.id} className="text-xs text-red-600">• {s.name}: {s.qty} {s.unit} (threshold: {s.threshold})</p>)}</div>
            </div>
          )}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Item</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Quantity</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Threshold</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Status</th><th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Adjust</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {stock.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-bold text-slate-900">{s.name}</td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs">{s.qty} {s.unit}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{s.threshold} {s.unit}</td>
                    <td className="px-4 py-2.5"><span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', s.qty < s.threshold ? 'bg-red-50 text-red-500' : 'bg-aims-green/15 text-aims-green')}>{s.qty < s.threshold ? 'Low Stock' : 'In Stock'}</span></td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => { adjustStock(s.id, +1); }} className="text-[10px] font-bold px-2 py-1 rounded bg-aims-green/10 text-aims-green hover:bg-aims-green/20" title="Increase by 1">+1</button>
                        <button onClick={() => { const r = adjustStock(s.id, -1); if (r) showToast({ title: 'Stock Updated', message: `${r.name} now ${r.qty} ${r.unit}.`, type: 'success' }); }} className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200" title="Decrease by 1">−1</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowIssue(true)} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90">+ Issue Stock</button>
            <button onClick={() => setShowReceive(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50">+ Receive Stock</button>
            <button onClick={() => exportStock('csv')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50">CSV Stock Report</button>
            <button onClick={() => exportStock('pdf')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50">PDF Stock Report</button>
          </div>
        </div>
      )}

      {/* ── REORDERS ── */}
      {activeTab === 'reorders' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowReorder(true)} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90">+ Draft New Reorder</button>
          </div>
          {reorders.map((r) => (
            <ReorderCard key={r.id} r={r} isED={isED} onRoute={() => { routeReorderToED(r.id); }} onDecide={(d) => decideReorder(r.id, d)} onVendor={(v) => { selectReorderVendor(r.id, v.name); showToast({ title: 'Vendor Selected', message: `${v.name} selected for ${r.item}.`, type: 'success' }); }} onRevise={() => requestReorderRevisions(r.id)} onAdvance={(s) => decideReorder(r.id, s)} />
          ))}
        </div>
      )}

      {/* ── ASSIGNMENT & HANDOVER ── */}
      {activeTab === 'assignment' && (
        <div className="space-y-4">
          {assignments.map((as) => (
            <div key={as.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{as.person}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{as.due} · {as.done}/{as.total} handled</p>
                </div>
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', as.status === 'Completed' ? 'bg-aims-green/15 text-aims-green' : as.status === 'In Progress' ? 'bg-aims-navy/10 text-aims-navy' : 'bg-aims-orange/15 text-aims-orange')}>{as.status}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {as.items.map((item, i) => (
                  <span key={item} className={cn('text-[10px] font-bold px-2.5 py-1 rounded-lg border', i < as.done ? 'bg-aims-green/10 border-aims-green/30 text-aims-green line-through' : 'bg-slate-50 border-slate-200 text-slate-700')}>{item}{i < as.done ? ' ✓' : ''}</span>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2 flex-wrap">
                {as.status !== 'Completed' && (
                  <>
                    <button onClick={() => { advanceAssignment(as.id); showToast({ title: 'Progress Updated', message: `Next asset handed over for ${as.person}.`, type: 'success' }); }} className="px-4 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90">Assign Next Asset</button>
                    <button onClick={() => { markAssignmentReceived(as.id); showToast({ title: 'Completed', message: `All assets for ${as.person} marked as received.`, type: 'success' }); }} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90">Mark Received</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MAINTENANCE ── */}
      {activeTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Maintenance & Service Records</h3>
              <button onClick={() => setShowMaintAsset(assets[0]?.id ?? null)} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90">+ Add Service Record</button>
            </div>
            <div className="space-y-3">
              {maintenance.map((m) => (
                <div key={m.id} className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{m.asset} — {m.type} — {m.date}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{m.detail}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Provider: {m.provider} · Days down: {m.daysDown} · Work order: {m.wo}</p>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">{m.cost}</span>
                </div>
              ))}
              {maintenance.length === 0 && <p className="text-xs text-slate-400 italic py-6 text-center">No service records yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── STOCK-TAKE ── */}
      {activeTab === 'stocktake' && (
        <div className="space-y-4">
          {latestTake ? (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Stock-Take: {latestTake.date}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Conducted by {latestTake.conductedBy} · Auditors: {latestTake.auditors.join(', ') || '—'} · Accuracy: <strong className="text-aims-green">{latestTake.accuracyPct}%</strong></p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-aims-orange/15 text-aims-orange uppercase">{latestTake.rows.filter((r) => r.delta !== 0).length} discrepancy/ies</span>
              </div>
              <div className="space-y-2">
                {latestTake.rows.map((row) => (
                  <div key={row.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className={cn('w-6 h-6 rounded-full flex items-center justify-center', row.status === 'Reconciled' ? 'bg-aims-green/15 text-aims-green' : 'bg-red-50 text-red-500')}>
                        <span className="material-symbols-outlined text-[14px]">{row.status === 'Reconciled' ? 'check' : 'priority_high'}</span>
                      </span>
                      <div><p className="text-sm font-bold text-slate-900">{row.item}</p><p className="text-[10px] text-slate-500">Expected {row.expected} · Found {row.found} {row.delta !== 0 ? `(${row.delta > 0 ? '+' : ''}${row.delta})` : ''}</p></div>
                    </div>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', row.status === 'Reconciled' ? 'bg-aims-green/15 text-aims-green' : 'bg-red-50 text-red-500')}>{row.status}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic bg-white border border-slate-200 rounded-xl p-6 text-center">No stock-take planned yet.</p>
          )}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowPlanTake(true)} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90">Plan Stock-Take</button>
            <button onClick={printAuditSheets} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50">Print Audit Sheets</button>
          </div>
        </div>
      )}

      {/* ── Add Asset Modal ── */}
      {showAddAsset && (
        <Modal title="Register New Asset" onClose={() => setShowAddAsset(false)}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            addAsset({
              tag: (f.get('tag') as string).trim().toUpperCase(), name: f.get('name') as string, category: f.get('category') as string,
              custodian: f.get('custodian') as string, condition: f.get('condition') as Asset['condition'], value: f.get('value') as string,
              acquired: f.get('acquired') as string, vendor: f.get('vendor') as string,
            });
            setShowAddAsset(false);
            showToast({ title: 'Asset Registered', message: `${f.get('name')} added to the register.`, type: 'success' });
          }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tag / Code</label><input name="tag" required placeholder="e.g. LAP003" className={INPUT} /></div>
              <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Asset Name</label><input name="name" required placeholder="e.g. Lenovo ThinkPad" className={INPUT} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label><select name="category" className={INPUT}><option>IT Hardware</option><option>Mobile Device</option><option>Furniture</option><option>Equipment</option><option>Vehicle</option><option>Other</option></select></div>
              <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Custodian</label><input name="custodian" required placeholder="Name or Available" className={INPUT} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Condition</label><select name="condition" className={INPUT}><option>Excellent</option><option>Good</option><option>Fair</option><option>Needs Repair</option></select></div>
              <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Value (UGX)</label><input name="value" required placeholder="e.g. UGX 1.5M" className={INPUT} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Acquired</label><input name="acquired" required placeholder="e.g. Sep 2026" className={INPUT} /></div>
              <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Vendor / Supplier</label><input name="vendor" placeholder="e.g. Kampala IT Hub" className={INPUT} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowAddAsset(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90">Register Asset</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Reassign Modal ── */}
      {reassignTarget && (
        <Modal title={`Reassign ${reassignTarget.name}`} onClose={() => setReassignAssetId(null)}>
          <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); reassignAsset(reassignTarget.id, (f.get('custodian') as string).trim()); setReassignAssetId(null); showToast({ title: 'Asset Reassigned', message: `${reassignTarget.name} → ${f.get('custodian')}.`, type: 'success' }); }} className="space-y-3">
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">New Custodian</label><input name="custodian" required placeholder="Employee name or department" className={INPUT} /></div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600">Current: <strong className="text-slate-900">{reassignTarget.custodian}</strong></div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setReassignAssetId(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg">Reassign</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Maintenance Modal ── */}
      {maintTarget && (
        <Modal title={`Schedule Maintenance — ${maintTarget.name}`} onClose={() => setShowMaintAsset(null)}>
          <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); addMaintRecord({ asset: `${maintTarget.name} (${maintTarget.tag})`, assetId: maintTarget.id, type: f.get('type') as 'Service', detail: f.get('detail') as string, cost: f.get('cost') as string, provider: f.get('provider') as string, daysDown: Number(f.get('daysDown')) || 0 }); setShowMaintAsset(null); showToast({ title: 'Service Record Added', message: `Work order logged for ${maintTarget.name}.`, type: 'success' }); }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Type</label><select name="type" className={INPUT}><option>Service</option><option>Inspection</option><option>Repair</option></select></div>
              <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cost (UGX)</label><input name="cost" placeholder="e.g. UGX 120K" className={INPUT} /></div>
            </div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Detail</label><textarea name="detail" required rows={2} placeholder="What was done / needs to be done…" className={INPUT} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Provider</label><input name="provider" placeholder="e.g. Internal / FurnitureCare" className={INPUT} /></div>
              <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Days Out of Service</label><input name="daysDown" type="number" min="0" defaultValue="0" className={INPUT} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowMaintAsset(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg">Log Service Record</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Issue / Receive Stock Modals ── */}
      {showIssue && (
        <Modal title="Issue Stock" onClose={() => setShowIssue(false)}>
          <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const id = f.get('item') as string; const qty = Number(f.get('qty')) || 1; const item = stock.find((s) => s.id === id); const r = adjustStock(id, -qty); setShowIssue(false); showToast({ title: 'Stock Issued', message: `${qty} × ${item?.name ?? 'item'} issued (remaining: ${r?.qty}).`, type: 'success' }); }} className="space-y-3">
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Item</label><select name="item" required className={INPUT}>{stock.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.qty} {s.unit})</option>)}</select></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Quantity</label><input name="qty" type="number" min="1" defaultValue="1" className={INPUT} /></div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowIssue(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg">Issue</button>
            </div>
          </form>
        </Modal>
      )}
      {showReceive && (
        <Modal title="Receive Stock" onClose={() => setShowReceive(false)}>
          <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const mode = f.get('mode') as string; const qty = Number(f.get('qty')) || 1;
            if (mode === 'existing') { const id = f.get('item') as string; const item = stock.find((s) => s.id === id); adjustStock(id, +qty); showToast({ title: 'Stock Received', message: `${qty} × ${item?.name} added (now ${item ? item.qty + qty : qty}).`, type: 'success' }); }
            else { addStockItem({ name: f.get('name') as string, qty, threshold: Number(f.get('threshold')) || 0, unit: (f.get('unit') as string) || 'units' }); showToast({ title: 'New Stock Item Added', message: `${f.get('name')} (${qty} units) added to inventory.`, type: 'success' }); }
            setShowReceive(false); }} className="space-y-3">
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Receive into</label><select name="mode" className={INPUT}><option value="existing">Existing item</option><option value="new">New stock item</option></select></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Item</label><select name="item" className={INPUT}>{stock.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">New item name (if new)</label><input name="name" placeholder="e.g. Staplers" className={INPUT} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Quantity</label><input name="qty" type="number" min="1" defaultValue="1" className={INPUT} /></div>
              <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Unit</label><input name="unit" placeholder="units / reams / boxes" className={INPUT} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowReceive(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg">Receive</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Draft Reorder Modal ── */}
      {showReorder && (
        <Modal title="Draft New Reorder" onClose={() => setShowReorder(false)}>
          <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const id = f.get('item') as string; const item = stock.find((s) => s.id === id); addReorder({ item: item?.name ?? '', current: item?.qty ?? 0, qty: Number(f.get('qty')) || 1, unitCost: (f.get('unitCost') as string) || 'UGX 0', vendors: [{ name: 'Vendor A', unit: (f.get('unitCost') as string) || 'UGX 0', lead: '3 days' }, { name: 'Vendor B', unit: (f.get('unitCost') as string) || 'UGX 0', lead: '1 day' }] }); setShowReorder(false); showToast({ title: 'Reorder Drafted', message: `Reorder for ${item?.name} created (Draft).`, type: 'success' }); }} className="space-y-3">
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Item (low stock suggested)</label><select name="item" required className={INPUT}>{stock.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.qty} {s.unit}{s.qty < s.threshold ? ' (LOW)' : ''}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Quantity</label><input name="qty" type="number" min="1" defaultValue="10" className={INPUT} /></div>
              <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Est. Unit Cost</label><input name="unitCost" placeholder="e.g. UGX 80K" className={INPUT} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowReorder(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg">Create Draft</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Plan Stock-Take Modal ── */}
      {showPlanTake && (
        <Modal title="Plan Stock-Take" onClose={() => setShowPlanTake(false)}>
          <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); planStockTake((f.get('conductedBy') as string) || 'Inventory Team', (f.get('auditors') as string).split(',').map((s) => s.trim()).filter(Boolean), f.get('date') as string || undefined); setShowPlanTake(false); showToast({ title: 'Stock-Take Planned', message: 'Count sheets created for all stock items.', type: 'success' }); }} className="space-y-3">
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label><input name="date" type="date" required className={INPUT} /></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Conducted By</label><input name="conductedBy" placeholder="e.g. Grace Aceng" className={INPUT} /></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Auditors (comma separated)</label><input name="auditors" placeholder="e.g. Grace Aceng, Isaac Tumusiime" className={INPUT} /></div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowPlanTake(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg">Plan Stock-Take</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Asset detail modal (full record + real actions) ── */}
      {assetDetail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setAssetDetail(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 bg-aims-navy text-white flex items-center justify-between sticky top-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-white/70 font-mono">{assetDetail.tag}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/15 uppercase">{assetDetail.category}</span>
                </div>
                <h3 className="text-lg font-extrabold">{assetDetail.name}</h3>
              </div>
              <button onClick={() => setAssetDetail(null)} className="text-white/80 hover:text-white"><span className="material-symbols-outlined text-[22px]">close</span></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Custodian</p><p className="text-sm font-bold text-slate-900 mt-0.5">{assetDetail.custodian}</p></div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Condition</p><p className="text-sm font-bold text-slate-900 mt-0.5">{assetDetail.condition}</p></div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Acquisition</p><p className="text-sm font-bold text-slate-900 mt-0.5">{assetDetail.acquired} · {assetDetail.vendor}</p></div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Value</p><p className="text-sm font-extrabold text-aims-navy mt-0.5">{assetDetail.value}</p></div>
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-slate-100">
                <button onClick={() => { setReassignAssetId(assetDetail.id); }} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg">Reassign</button>
                <button onClick={() => { setShowMaintAsset(assetDetail.id); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg">Schedule Maint.</button>
                {assetDetail.status === 'active' && (
                  <button onClick={() => { retireAsset(assetDetail.id); setAssetDetail(null); showToast({ title: 'Asset Retired', message: `${assetDetail.name} marked retired/disposed.`, type: 'info' }); }} className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg">Retire / Dispose</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReorderCard({ r, isED, onRoute, onDecide, onVendor, onRevise, onAdvance }: { r: Reorder; isED: boolean; onRoute: () => void; onDecide: (d: 'Approved' | 'Rejected') => void; onVendor: (v: Reorder['vendors'][number]) => void; onRevise: () => void; onAdvance: (s: ReorderStatus) => void }) {
  const { showToast } = useNotifications();
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{r.item}</p>
          <p className="text-xs text-slate-500 mt-0.5">Current: {r.current} units | Reorder qty: {r.qty} | Est. cost: {r.est}{r.selectedVendor ? ` | Vendor: ${r.selectedVendor}` : ''}</p>
        </div>
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', r.status === 'Draft' ? 'bg-slate-100 text-slate-600' : r.status === 'Rejected' ? 'bg-red-50 text-red-600' : r.status === 'Received' ? 'bg-aims-green/15 text-aims-green' : 'bg-aims-navy/10 text-aims-navy')}>{r.status}</span>
      </div>
      {(r.status === 'Draft' || r.status === 'ED Pending') && r.vendors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {r.vendors.map((v) => (
            <button key={v.name} onClick={() => { onVendor(v); }} className={cn('px-3 py-2 border rounded-lg text-xs transition-colors', r.selectedVendor === v.name ? 'border-aims-navy bg-aims-navy/5 text-aims-navy font-bold' : 'bg-slate-50 border-slate-200 hover:border-aims-navy/40')}>
              <span className="font-bold text-slate-800">{v.name}:</span> <span className="text-slate-500">{v.unit}/unit · lead {v.lead}</span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-3 pt-3 border-t border-slate-100">
        {r.status === 'Draft' && !isED && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { onRoute(); showToast({ title: 'Routed to ED', message: `${r.item} reorder sent for authorization.`, type: 'success' }); }} className="px-4 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90">Route to ED for Authorization</button>
            <button onClick={onRevise} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50">Edit Draft</button>
          </div>
        )}
        {r.status === 'ED Pending' && isED && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { onDecide('Approved'); showToast({ title: 'Reorder Approved', message: `${r.item} approved.`, type: 'success' }); }} className="px-4 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90">✓ Approve</button>
            <button onClick={() => { onDecide('Rejected'); showToast({ title: 'Reorder Rejected', message: `${r.item} rejected.`, type: 'warning' }); }} className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100">✗ Reject</button>
            <button onClick={onRevise} className="px-4 py-2 bg-aims-orange text-white text-xs font-bold rounded-lg hover:bg-aims-orange/90">◄ Request Revisions</button>
          </div>
        )}
        {(r.status === 'Approved' || r.status === 'Ordered') && !isED && (
          <div className="flex gap-2 flex-wrap">
            {r.status === 'Approved' && <button onClick={() => { onAdvance('Ordered'); showToast({ title: 'Marked Ordered', message: `${r.item} order placed with ${r.selectedVendor ?? 'vendor'}.`, type: 'success' }); }} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90">Mark Ordered</button>}
            {r.status === 'Ordered' && <button onClick={() => { onAdvance('Received'); showToast({ title: 'Marked Received', message: `${r.item} received into stock.`, type: 'success' }); }} className="px-4 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90">Mark Received</button>}
            <span className="text-[10px] text-slate-400 italic self-center">ED approved — awaiting delivery.</span>
          </div>
        )}
        {r.status === 'Received' && <p className="text-[10px] font-bold text-aims-green">✓ Order received into inventory.</p>}
        {r.status === 'Rejected' && <p className="text-[10px] font-bold text-red-500">Reorder rejected — no order placed.</p>}
      </div>
    </div>
  );
}
