// src/pages/Procurement.tsx
import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';

interface Vendor {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  rating: number;
  totalTransactions: number;
  totalSpend: number;
  lastOrder: string;
  status: 'active' | 'on-hold' | 'blacklisted';
  contractExpiry?: string;
}

interface PurchaseOrder {
  id: string;
  vendorId: string;
  vendorName: string;
  requisitionId: string;
  amount: number;
  issuedDate: string;
  deliveryDate: string;
  status: 'pending' | 'delivered' | 'partial' | 'cancelled';
  items: { name: string; qty: number; unit: string }[];
}

const MOCK_VENDORS: Vendor[] = [
  { id: 'v1', name: 'Samsung Uganda Ltd', category: 'Electronics', contactPerson: 'Robert Kato', email: 'sales@samsung.ug', phone: '+256 701 123 456', rating: 4.8, totalTransactions: 24, totalSpend: 89000000, lastOrder: '2026-08-18', status: 'active', contractExpiry: '2027-06-30' },
  { id: 'v2', name: 'StationeryMart Kampala', category: 'Office Supplies', contactPerson: 'Grace Akello', email: 'orders@stationerymart.co.ug', phone: '+256 772 234 567', rating: 4.5, totalTransactions: 48, totalSpend: 18500000, lastOrder: '2026-08-22', status: 'active' },
  { id: 'v3', name: 'AgroTech Uganda', category: 'Agricultural Equipment', contactPerson: 'Peter Okot', email: 'info@agrotech.ug', phone: '+256 752 345 678', rating: 4.7, totalTransactions: 12, totalSpend: 67000000, lastOrder: '2026-08-19', status: 'active', contractExpiry: '2026-12-31' },
  { id: 'v4', name: 'Gulu Conference Centre', category: 'Venue Rental', contactPerson: 'Mary Laker', email: 'bookings@guluconf.co.ug', phone: '+256 782 456 789', rating: 4.3, totalTransactions: 8, totalSpend: 12500000, lastOrder: '2026-08-03', status: 'active' },
  { id: 'v5', name: 'PrintHouse Uganda', category: 'Printing & Communications', contactPerson: 'John Olanya', email: 'hello@printhouse.ug', phone: '+256 712 567 890', rating: 4.6, totalTransactions: 18, totalSpend: 9800000, lastOrder: '2026-08-12', status: 'active', contractExpiry: '2026-10-15' },
  { id: 'v6', name: 'Legacy Tech Ltd', category: 'IT Hardware', contactPerson: 'James Omara', email: 'sales@legacytech.ug', phone: '+256 701 678 901', rating: 2.1, totalTransactions: 3, totalSpend: 4200000, lastOrder: '2026-03-10', status: 'blacklisted' },
  { id: 'v7', name: 'North Uganda Transport', category: 'Logistics', contactPerson: 'Sarah Adong', email: 'ops@northtransport.ug', phone: '+256 772 789 012', rating: 4.4, totalTransactions: 31, totalSpend: 14200000, lastOrder: '2026-08-18', status: 'active' },
  { id: 'v8', name: 'Makerere Press', category: 'Printing & Communications', contactPerson: 'David Okello', email: 'orders@makererepress.ug', phone: '+256 752 890 123', rating: 4.2, totalTransactions: 6, totalSpend: 3100000, lastOrder: '2026-05-20', status: 'on-hold' },
];

const MOCK_POs: PurchaseOrder[] = [
  { id: 'PO-2026-112', vendorId: 'v1', vendorName: 'Samsung Uganda Ltd', requisitionId: 'req-043', amount: 6800000, issuedDate: '2026-08-18', deliveryDate: '2026-08-25', status: 'delivered', items: [{ name: 'Galaxy Tab A9', qty: 10, unit: 'UGX 680K' }] },
  { id: 'PO-2026-113', vendorId: 'v3', vendorName: 'AgroTech Uganda', requisitionId: 'req-045', amount: 11500000, issuedDate: '2026-08-19', deliveryDate: '2026-09-05', status: 'pending', items: [{ name: 'Soil Moisture Sensors', qty: 50, unit: 'UGX 120K' }, { name: 'Flow Meters', qty: 20, unit: 'UGX 220K' }] },
  { id: 'PO-2026-114', vendorId: 'v2', vendorName: 'StationeryMart Kampala', requisitionId: 'req-046', amount: 1850000, issuedDate: '2026-08-22', deliveryDate: '2026-08-29', status: 'pending', items: [{ name: 'A4 Paper', qty: 5, unit: 'box' }] },
  { id: 'PO-2026-110', vendorId: 'v5', vendorName: 'PrintHouse Uganda', requisitionId: 'req-044', amount: 3200000, issuedDate: '2026-08-12', deliveryDate: '2026-08-20', status: 'delivered', items: [{ name: 'Posters', qty: 500, unit: 'pcs' }, { name: 'Leaflets', qty: 2000, unit: 'pcs' }] },
  { id: 'PO-2026-108', vendorId: 'v7', vendorName: 'North Uganda Transport', requisitionId: 'req-042', amount: 4200000, issuedDate: '2026-08-10', deliveryDate: '2026-08-18', status: 'delivered', items: [{ name: 'Transport services', qty: 1, unit: 'contract' }] },
];

function fmtMoney(n: number): string {
  if (n >= 1000000000) return `UGX ${(n / 1000000000).toFixed(1)}B`;
  if (n >= 1000000) return `UGX ${(n / 1000000).toFixed(0)}M`;
  return `UGX ${(n / 1000).toFixed(0)}K`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const PO_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'bg-aims-orange/15 text-aims-orange' },
  delivered: { label: 'Delivered', cls: 'bg-aims-green/15 text-aims-green' },
  partial: { label: 'Partial', cls: 'bg-aims-navy/10 text-aims-navy' },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-500' },
};

const VENDOR_STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: 'Active', cls: 'bg-aims-green/15 text-aims-green' },
  'on-hold': { label: 'On Hold', cls: 'bg-aims-orange/15 text-aims-orange' },
  blacklisted: { label: 'Blacklisted', cls: 'bg-red-100 text-red-600' },
};

export function Procurement() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [view, setView] = useState<'vendors' | 'pos'>('vendors');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [expandedPO, setExpandedPO] = useState<string | null>(null);

  const filteredVendors = useMemo(() => {
    return MOCK_VENDORS.filter((v) => {
      if (filterCategory && v.category !== filterCategory) return false;
      if (filterStatus && v.status !== filterStatus) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return v.name.toLowerCase().includes(q) || v.contactPerson.toLowerCase().includes(q) || v.email.toLowerCase().includes(q);
    }).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [searchQuery, filterCategory, filterStatus]);

  const filteredPOs = useMemo(() => {
    return MOCK_POs.filter((po) => {
      if (filterStatus && po.status !== filterStatus) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return po.id.toLowerCase().includes(q) || po.vendorName.toLowerCase().includes(q) || po.requisitionId.toLowerCase().includes(q);
    }).sort((a, b) => new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime());
  }, [searchQuery, filterStatus]);

  const categories = Array.from(new Set(MOCK_VENDORS.map((v) => v.category))).sort();

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={cn('material-symbols-outlined text-[14px]', i <= full ? 'text-aims-orange' : 'text-slate-300')}>star</span>
        ))}
        <span className="text-[10px] font-bold text-slate-600 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (!user) return <div className="p-8 text-center text-slate-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Procurement & Vendors</h1>
        <p className="text-base font-medium text-white">Manage suppliers, purchase orders & procurement records</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-navy p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Vendors</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{MOCK_VENDORS.filter((v) => v.status === 'active').length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{MOCK_VENDORS.length} total in registry</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-orange p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Open POs</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{MOCK_POs.filter((p) => p.status === 'pending').length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">awaiting delivery</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-green p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Delivered (MTD)</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{MOCK_POs.filter((p) => p.status === 'delivered').length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{fmtMoney(MOCK_POs.filter((p) => p.status === 'delivered').reduce((s, p) => s + p.amount, 0))}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-mint p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Spend (YTD)</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{fmtMoney(MOCK_VENDORS.reduce((s, v) => s + v.totalSpend, 0))}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">across all vendors</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button onClick={() => setView('vendors')} className={cn('px-4 py-1.5 rounded-md text-xs font-bold transition-all', view === 'vendors' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>Vendors</button>
            <button onClick={() => setView('pos')} className={cn('px-4 py-1.5 rounded-md text-xs font-bold transition-all', view === 'pos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>Purchase Orders</button>
          </div>
          <button onClick={() => showToast({ title: 'New record', message: view === 'vendors' ? 'Add vendor form would open.' : 'New PO form would open.', type: 'info' })} className="ml-auto px-3 py-1.5 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 transition-colors flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">add</span>{view === 'vendors' ? 'Add Vendor' : 'New PO'}</button>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search</label>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={view === 'vendors' ? 'Vendor name, contact, email…' : 'PO ID, vendor, requisition…'} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
          </div>
          {view === 'vendors' ? (
            <>
              <div className="min-w-[150px]">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30">
                  <option value="">All categories</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="min-w-[130px]">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30">
                  <option value="">All</option><option value="active">Active</option><option value="on-hold">On Hold</option><option value="blacklisted">Blacklisted</option>
                </select>
              </div>
            </>
          ) : (
            <div className="min-w-[130px]">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30">
                <option value="">All</option><option value="pending">Pending</option><option value="delivered">Delivered</option><option value="partial">Partial</option><option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {view === 'vendors' && (
        <div className="space-y-2">
          {filteredVendors.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <span className="material-symbols-outlined text-slate-300 text-[48px]">store</span>
              <p className="text-sm font-bold text-slate-700 mt-2">No vendors match filters</p>
            </div>
          )}
          {filteredVendors.map((v) => {
            const isExpanded = expandedVendor === v.id;
            const vs = VENDOR_STATUS[v.status];
            const vendorPOs = MOCK_POs.filter((po) => po.vendorId === v.id);
            return (
              <div key={v.id} className={cn('bg-white rounded-xl border shadow-sm transition-all', isExpanded ? 'border-aims-navy shadow-md' : 'border-slate-200')}>
                <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpandedVendor(isExpanded ? null : v.id)}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                    <div className="w-10 h-10 rounded-lg bg-aims-navy text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {v.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm font-bold text-slate-900 truncate">{v.name}</p>
                        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase', vs.cls)}>{vs.label}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{v.category}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{v.contactPerson} • {v.email}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3 hidden sm:block">
                    <p className="text-xs font-bold text-slate-900">{fmtMoney(v.totalSpend)}</p>
                    <p className="text-[10px] text-slate-500">{v.totalTransactions} orders</p>
                    {renderStars(v.rating)}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div><p className="text-[10px] font-bold text-slate-500 uppercase">Contact</p><p className="font-semibold text-slate-900">{v.contactPerson}</p></div>
                      <div><p className="text-[10px] font-bold text-slate-500 uppercase">Email</p><p className="font-semibold text-slate-900 truncate">{v.email}</p></div>
                      <div><p className="text-[10px] font-bold text-slate-500 uppercase">Phone</p><p className="font-semibold text-slate-900">{v.phone}</p></div>
                      <div><p className="text-[10px] font-bold text-slate-500 uppercase">Last Order</p><p className="font-semibold text-slate-900">{formatDate(v.lastOrder)}</p></div>
                      {v.contractExpiry && (
                        <div><p className="text-[10px] font-bold text-slate-500 uppercase">Contract Expiry</p><p className="font-semibold text-slate-900">{formatDate(v.contractExpiry)}</p></div>
                      )}
                    </div>

                    {vendorPOs.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Recent Purchase Orders ({vendorPOs.length})</p>
                        <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                          <thead className="bg-slate-50"><tr><th className="px-3 py-1.5 text-left text-slate-500 font-bold">PO</th><th className="px-3 py-1.5 text-left text-slate-500 font-bold">Req</th><th className="px-3 py-1.5 text-left text-slate-500 font-bold">Issued</th><th className="px-3 py-1.5 text-left text-slate-500 font-bold">Status</th><th className="px-3 py-1.5 text-right text-slate-500 font-bold">Amount</th></tr></thead>
                          <tbody className="divide-y divide-slate-100">
                            {vendorPOs.map((po) => (
                              <tr key={po.id} className="hover:bg-slate-50">
                                <td className="px-3 py-1.5 font-mono font-semibold text-slate-900">{po.id}</td>
                                <td className="px-3 py-1.5 font-mono text-slate-600">{po.requisitionId}</td>
                                <td className="px-3 py-1.5 text-slate-600">{formatDate(po.issuedDate)}</td>
                                <td className="px-3 py-1.5"><span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase', PO_STATUS[po.status].cls)}>{PO_STATUS[po.status].label}</span></td>
                                <td className="px-3 py-1.5 text-right font-bold text-slate-900">{fmtMoney(po.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                      <button onClick={() => showToast({ title: 'Viewing profile', message: v.name, type: 'info' })} className="px-3 py-1.5 text-xs font-bold text-aims-navy border border-aims-navy/20 rounded-lg hover:bg-aims-navy/5 transition-colors">View Full Profile</button>
                      <button onClick={() => showToast({ title: 'Issuing PO', message: `To ${v.name}`, type: 'info' })} className="px-3 py-1.5 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 transition-colors flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">add</span>Issue PO</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === 'pos' && (
        <div className="space-y-2">
          {filteredPOs.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <span className="material-symbols-outlined text-slate-300 text-[48px]">receipt_long</span>
              <p className="text-sm font-bold text-slate-700 mt-2">No purchase orders match filters</p>
            </div>
          )}
          {filteredPOs.map((po) => {
            const isExpanded = expandedPO === po.id;
            const pos = PO_STATUS[po.status];
            return (
              <div key={po.id} className={cn('bg-white rounded-xl border shadow-sm transition-all', isExpanded ? 'border-aims-navy shadow-md' : 'border-slate-200')}>
                <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpandedPO(isExpanded ? null : po.id)}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                    <span className="material-symbols-outlined text-aims-navy text-[20px]">receipt_long</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm font-bold text-slate-900 font-mono">{po.id}</p>
                        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase', pos.cls)}>{pos.label}</span>
                      </div>
                      <p className="text-xs text-slate-700 truncate">{po.vendorName}</p>
                      <p className="text-[10px] text-slate-500 truncate">Linked to {po.requisitionId} • Issued {formatDate(po.issuedDate)}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-extrabold text-slate-900">{fmtMoney(po.amount)}</p>
                    <p className={cn('text-[10px] mt-0.5', po.status === 'delivered' ? 'text-aims-green' : 'text-slate-500')}>
                      {po.status === 'delivered' ? `Delivered ${formatDate(po.deliveryDate)}` : `Expected ${formatDate(po.deliveryDate)}`}
                    </p>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                    <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden mb-3">
                      <thead className="bg-slate-50"><tr><th className="px-3 py-1.5 text-left text-slate-500 font-bold">Item</th><th className="px-3 py-1.5 text-right text-slate-500 font-bold">Qty</th><th className="px-3 py-1.5 text-right text-slate-500 font-bold">Unit</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {po.items.map((item, i) => (
                          <tr key={i}><td className="px-3 py-1.5 text-slate-900 font-semibold">{item.name}</td><td className="px-3 py-1.5 text-right text-slate-600">{item.qty}</td><td className="px-3 py-1.5 text-right text-slate-600">{item.unit}</td></tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => showToast({ title: 'Downloading', message: po.id, type: 'success' })} className="px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">download</span>Download PO</button>
                      {po.status === 'pending' && <button onClick={() => showToast({ title: 'Marked delivered', message: po.id, type: 'success' })} className="px-3 py-1.5 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90 transition-colors flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span>Mark Delivered</button>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}