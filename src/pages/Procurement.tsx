// src/pages/Procurement.tsx
import { useState } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';

interface Vendor {
  id: string;
  name: string;
  category: string;
  contact: string;
  email: string;
  status: 'active' | 'pending' | 'blacklisted';
  rating: number;
}

interface PurchaseOrder {
  id: string;
  vendor: string;
  amount: number;
  date: string;
  status: 'draft' | 'sent' | 'received' | 'paid';
  items: string;
}

function fmtMoney(n: number): string {
  if (n >= 1000000) return `UGX ${(n / 1000000).toFixed(1)}M`;
  return `UGX ${(n / 1000).toFixed(0)}K`;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 bg-aims-navy rounded-t-xl flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Procurement() {
  const { showToast } = useNotifications();
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [showPOForm, setShowPOForm] = useState(false);
  const [tab, setTab] = useState<'vendors' | 'pos'>('vendors');

  const [vendors, setVendors] = useState<Vendor[]>([
    { id: 'v1', name: 'AgroTech Solutions Ltd', category: 'Agricultural Equipment', contact: 'John Mwangi', email: 'john@agrotech.ug', status: 'active', rating: 4.8 },
    { id: 'v2', name: 'Gulu Office Supplies', category: 'Office Supplies', contact: 'Mary Akello', email: 'mary@guluoffice.ug', status: 'active', rating: 4.5 },
    { id: 'v3', name: 'Kampala IT Hub', category: 'IT Equipment', contact: 'Peter Okello', email: 'peter@kampalait.ug', status: 'active', rating: 4.9 },
    { id: 'v4', name: 'Field Gear Uganda', category: 'Field Equipment', contact: 'Sarah Namukasa', email: 'sarah@fieldgear.ug', status: 'pending', rating: 0 },
  ]);

  const [pos, setPOs] = useState<PurchaseOrder[]>([
    { id: 'PO-2026-045', vendor: 'AgroTech Solutions Ltd', amount: 11500000, date: '2026-08-22', status: 'sent', items: 'Solar Irrigation Sensors (50x), Flow Meters (20x)' },
    { id: 'PO-2026-044', vendor: 'Kampala IT Hub', amount: 6800000, date: '2026-08-20', status: 'received', items: 'Samsung Galaxy Tab A9 (10x)' },
    { id: 'PO-2026-043', vendor: 'Gulu Office Supplies', amount: 2100000, date: '2026-08-18', status: 'paid', items: 'Workshop Printing & Stationery' },
    { id: 'PO-2026-042', vendor: 'Field Gear Uganda', amount: 4100000, date: '2026-08-15', status: 'draft', items: 'Garmin GPSMAP 67i (5x)' },
  ]);

  const handleAction = (msg: string) => showToast({ title: 'Action Logged', message: msg, type: 'success' });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-aims-green/15 text-aims-green',
      pending: 'bg-aims-orange/15 text-aims-orange',
      blacklisted: 'bg-red-50 text-red-600',
      draft: 'bg-slate-100 text-slate-600',
      sent: 'bg-aims-navy/10 text-aims-navy',
      received: 'bg-aims-green/15 text-aims-green',
      paid: 'bg-aims-mint text-aims-green',
    };
    return styles[status] || 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="space-y-6">
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Procurement & Vendors</h1>
        <p className="text-base font-medium text-white">Manage suppliers, purchase orders, and procurement workflows</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-navy p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Vendors</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{vendors.filter(v => v.status === 'active').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-green p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Open POs</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{pos.filter(p => p.status === 'sent').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-orange p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Approval</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{pos.filter(p => p.status === 'draft').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-mint p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total PO Value (MTD)</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{fmtMoney(pos.reduce((s, p) => s + p.amount, 0))}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('vendors')}
              className={cn('px-4 py-1.5 rounded-lg text-xs font-bold transition-colors', tab === 'vendors' ? 'bg-aims-navy text-white' : 'text-slate-600 hover:bg-slate-100')}
            >
              Vendors
            </button>
            <button
              onClick={() => setTab('pos')}
              className={cn('px-4 py-1.5 rounded-lg text-xs font-bold transition-colors', tab === 'pos' ? 'bg-aims-navy text-white' : 'text-slate-600 hover:bg-slate-100')}
            >
              Purchase Orders
            </button>
          </div>
          <button
            onClick={() => tab === 'vendors' ? setShowVendorForm(true) : setShowPOForm(true)}
            className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            {tab === 'vendors' ? 'Add Vendor' : 'Create PO'}
          </button>
        </div>

        <div className="p-4">
          {tab === 'vendors' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Vendor</th>
                    <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Category</th>
                    <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Contact</th>
                    <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Rating</th>
                    <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                    <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 font-bold text-slate-900">{v.name}</td>
                      <td className="py-2.5 text-slate-600 text-xs">{v.category}</td>
                      <td className="py-2.5 text-slate-600 text-xs">
                        <div>{v.contact}</div>
                        <div className="text-slate-400">{v.email}</div>
                      </td>
                      <td className="py-2.5 text-xs">
                        {v.rating > 0 ? (
                          <span className="font-bold text-aims-orange">★ {v.rating}</span>
                        ) : (
                          <span className="text-slate-400">New</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', getStatusBadge(v.status))}>
                          {v.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button onClick={() => handleAction(`Editing ${v.name}`)} className="text-xs font-bold text-aims-navy hover:underline">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">PO #</th>
                    <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Vendor</th>
                    <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Items</th>
                    <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Amount</th>
                    <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Date</th>
                    <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                    <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pos.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 font-bold text-slate-900 font-mono text-xs">{po.id}</td>
                      <td className="py-2.5 text-slate-600 text-xs">{po.vendor}</td>
                      <td className="py-2.5 text-slate-600 text-xs max-w-[200px] truncate">{po.items}</td>
                      <td className="py-2.5 font-bold text-slate-900 text-xs">{fmtMoney(po.amount)}</td>
                      <td className="py-2.5 text-slate-600 text-xs font-mono">{po.date}</td>
                      <td className="py-2.5">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', getStatusBadge(po.status))}>
                          {po.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button onClick={() => handleAction(`Viewing ${po.id}`)} className="text-xs font-bold text-aims-navy hover:underline">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Vendor Form Modal */}
      {showVendorForm && (
        <Modal title="Add New Vendor" onClose={() => setShowVendorForm(false)}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const newVendor: Vendor = {
              id: `v${Date.now()}`,
              name: formData.get('name') as string,
              category: formData.get('category') as string,
              contact: formData.get('contact') as string,
              email: formData.get('email') as string,
              status: 'pending',
              rating: 0,
            };
            setVendors([...vendors, newVendor]);
            setShowVendorForm(false);
            showToast({ title: 'Vendor Added', message: `${newVendor.name} added to vendor list.`, type: 'success' });
          }} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Vendor Name</label>
              <input name="name" type="text" required placeholder="e.g., AgroTech Solutions Ltd" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
              <select name="category" required className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30">
                <option value="">Select category…</option>
                <option>Agricultural Equipment</option>
                <option>IT Equipment</option>
                <option>Office Supplies</option>
                <option>Field Equipment</option>
                <option>Consulting Services</option>
                <option>Construction</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contact Person</label>
                <input name="contact" type="text" required placeholder="Full name" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                <input name="email" type="email" required placeholder="vendor@email.com" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone</label>
              <input name="phone" type="tel" placeholder="+256 7XX XXX XXX" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Address</label>
              <textarea name="address" rows={2} placeholder="Physical address" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30 resize-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tax ID / TIN</label>
              <input name="tin" type="text" placeholder="e.g., 1234567890" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowVendorForm(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">save</span>Save Vendor
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Purchase Order Form Modal */}
      {showPOForm && (
        <Modal title="Create Purchase Order" onClose={() => setShowPOForm(false)}>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const newPO: PurchaseOrder = {
              id: `PO-2026-${String(pos.length + 46).padStart(3, '0')}`,
              vendor: formData.get('vendor') as string,
              amount: parseFloat(formData.get('amount') as string),
              date: new Date().toISOString().split('T')[0],
              status: 'draft',
              items: formData.get('items') as string,
            };
            setPOs([newPO, ...pos]);
            setShowPOForm(false);
            showToast({ title: 'PO Created', message: `${newPO.id} saved as draft.`, type: 'success' });
          }} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Vendor</label>
              <select name="vendor" required className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30">
                <option value="">Select vendor…</option>
                {vendors.filter(v => v.status === 'active').map(v => (
                  <option key={v.id} value={v.name}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Items / Description</label>
              <textarea name="items" rows={3} required placeholder="Describe items being ordered…" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Amount (UGX)</label>
                <input name="amount" type="number" required min="0" placeholder="e.g., 5000000" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Delivery Date</label>
                <input name="deliveryDate" type="date" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Budget Line</label>
              <select name="budgetLine" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30">
                <option>GL-5210 Office Supplies</option>
                <option>GL-5315 Field Equipment</option>
                <option>GL-5421 R&D Equipment</option>
                <option>GL-5220 Communications</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Notes</label>
              <textarea name="notes" rows={2} placeholder="Additional notes or special instructions…" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30 resize-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Attachments</label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-3 text-center hover:border-aims-navy/50 cursor-pointer transition-colors">
                <span className="material-symbols-outlined text-slate-400 text-[22px]">upload_file</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Click or drag files • Quotes, specs, contracts</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowPOForm(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">save</span>Save as Draft
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}