// src/pages/Inventory.tsx
// ============================================================
// AIMS — Inventory Management (role-scoped)
// Company Admin / ED: full hub. CD: read-only + flag. Others: legacy view.
// ============================================================

import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { InventoryManager } from '@/components/inventory/InventoryManager';
import { InventoryHub } from '@/components/inventory/InventoryHub';
import { openFlagForED } from '@/components/grants/FlagForEDModal';
import { FormsShortcut } from '@/components/forms/FormsShortcut';

const READ_ONLY_ASSETS = [
  { tag: 'LAP001', name: 'MacBook Pro 14"', category: 'IT Hardware', custodian: 'Sarah Aciro', condition: 'Excellent' },
  { tag: 'PHN002', name: 'iPhone 13', category: 'Mobile Device', custodian: 'Florence Adong', condition: 'Good' },
  { tag: 'FUR001', name: 'Desk Chair (Ergonomic)', category: 'Furniture', custodian: 'Grace Nakamya', condition: 'Fair' },
  { tag: 'PRT001', name: 'Canon i7 Printer', category: 'Equipment', custodian: 'Warehouse (shared)', condition: 'Good' },
];

const LOW_STOCK = [
  { name: 'Printer Paper A4', qty: 15, threshold: 20 },
  { name: 'Toner Cartridges (Canon)', qty: 2, threshold: 5 },
  { name: 'USB Dongles', qty: 3, threshold: 10 },
];

function InventoryReadOnly() {
  return (
    <div className="space-y-6">
      <div className="bg-aims-orange/10 border border-aims-orange/30 rounded-xl p-4">
        <p className="text-sm font-bold text-aims-orange mb-2">⚠️ Low-Stock Alerts</p>
        <div className="space-y-1">
          {LOW_STOCK.map((s) => (
            <p key={s.name} className="text-xs text-aims-orange">• {s.name}: {s.qty} (threshold: {s.threshold})</p>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Asset</th>
            <th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Tag</th>
            <th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Category</th>
            <th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Custodian</th>
            <th className="px-4 py-2.5 font-bold text-slate-500 text-xs uppercase tracking-wider">Condition</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {READ_ONLY_ASSETS.map((a) => (
              <tr key={a.tag} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-bold text-slate-900">{a.name}</td>
                <td className="px-4 py-2.5 text-slate-500 text-xs font-mono">{a.tag}</td>
                <td className="px-4 py-2.5 text-slate-600 text-xs">{a.category}</td>
                <td className="px-4 py-2.5 text-slate-600 text-xs">{a.custodian}</td>
                <td className="px-4 py-2.5"><span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', a.condition === 'Excellent' ? 'bg-aims-green/15 text-aims-green' : a.condition === 'Good' ? 'bg-aims-navy/10 text-aims-navy' : 'bg-aims-orange/15 text-aims-orange')}>{a.condition}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={() => openFlagForED({ recordLabel: 'Inventory — low stock on toner, paper & USB dongles', sourceModule: 'inventory' })} className="px-4 py-2 border border-aims-orange/30 text-aims-orange text-xs font-bold rounded-lg hover:bg-aims-orange/10 flex items-center gap-1.5 w-fit">
        <span className="material-symbols-outlined text-[15px]">flag</span>Flag Inventory Concern for ED
      </button>
      <p className="text-[10px] text-slate-400 italic">CD inventory access: view-only. Cannot reorder, adjust thresholds or approve disposal.</p>
    </div>
  );
}

export function Inventory() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Inventory & Asset Management</h1>
        <p className="text-base font-medium text-white">Assets, stock & consumables, reorders, assignment, maintenance and stock-take</p>
      </div>
      <FormsShortcut module="inventory" title="Inventory Forms — Reorder Request · Asset Register Entry" />
      {user?.role === 'CD' ? <InventoryReadOnly /> : user?.role === 'COMPANY_ADMIN' || user?.role === 'ED' ? <InventoryHub /> : <InventoryManager />}
    </div>
  );
}
