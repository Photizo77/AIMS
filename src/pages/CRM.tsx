// src/pages/CRM.tsx
// ============================================================
// AIMS — Contact Relationship Manager (CD / ED / Company Admin)
// Donors, partners, government contacts, media and vendors — with
// real add/edit/delete backed by the persisted CRM store. The
// "Add Contact" button opens a full structured form.
// ============================================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useLiveData } from '@/lib/useLiveData';
import { exportCsv } from '@/lib/export';
import { crmGet, addContact, updateContact, removeContact, type NewContactInput } from '@/services/crmService';
import type { CRMContact, CRMContactType } from '@/types';

const TYPE_COLORS: Record<string, string> = { donor: 'bg-green-100 text-green-700', government: 'bg-blue-100 text-blue-700', partner: 'bg-purple-100 text-purple-700', vendor: 'bg-amber-100 text-amber-700', media: 'bg-pink-100 text-pink-700', other: 'bg-slate-100 text-slate-600' };

const INPUT = 'w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30';
const LABEL = 'block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1';

const EMPTY_FORM: NewContactInput = { name: '', organization: '', email: '', phone: '', type: 'donor', lastContact: new Date().toISOString().slice(0, 10), notes: '' };

export function CRM() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterOrg, setFilterOrg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NewContactInput>(EMPTY_FORM);
  useLiveData();

  const canAccess = user?.role === 'CD' || user?.role === 'ED' || user?.role === 'COMPANY_ADMIN';

  if (!canAccess) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
        <span className="material-symbols-outlined text-[48px] text-slate-300 block mb-3">lock</span>
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-1">CRM is available to CD, ED, and Company Admin only.</p>
      </div>
    );
  }

  const contacts = crmGet();

  const filtered = contacts.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || c.type === filterType;
    const matchesOrg = !filterOrg || c.organization.toLowerCase().includes(filterOrg.toLowerCase());
    return matchesSearch && matchesType && matchesOrg;
  });

  const openNew = () => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (c: CRMContact) => { setEditingId(c.id); setForm({ name: c.name, organization: c.organization, email: c.email, phone: c.phone, type: c.type, lastContact: c.lastContact, notes: c.notes }); setShowForm(true); };

  const save = () => {
    if (!form.name.trim() || !form.organization.trim()) {
      showToast({ title: 'Missing Details', message: 'Name and organization are required.', type: 'error' });
      return;
    }
    if (editingId) { updateContact(editingId, { ...form }); showToast({ title: 'Contact Updated', message: `${form.name} saved.`, type: 'success' }); }
    else { addContact({ ...form }); showToast({ title: 'Contact Added', message: `${form.name} added to your relationships.`, type: 'success' }); }
    setShowForm(false);
  };

  const exportCsvList = () => {
    if (filtered.length === 0) { showToast({ title: 'Nothing to Export', message: 'No contacts match your filters.', type: 'error' }); return; }
    exportCsv('aims-crm-contacts', filtered.map((c) => ({ name: c.name, organization: c.organization, type: c.type, email: c.email, phone: c.phone, lastContact: c.lastContact, notes: c.notes })));
    showToast({ title: 'CSV Exported', message: `${filtered.length} contact(s).`, type: 'success' });
  };

  const set = <K extends keyof NewContactInput>(k: K, v: NewContactInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Contact Relationship Manager</h1>
          <p className="text-sm text-slate-500 mt-1">Donors, partners, government contacts, media and vendors</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportCsvList} className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 flex items-center gap-1.5"><span className="material-symbols-outlined text-[15px]">download</span>Export CSV</button>
          <button onClick={openNew} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1.5"><span className="material-symbols-outlined text-[15px]">person_add</span>Add Contact</button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aims-green/50" />
          <input type="text" placeholder="Filter by organization..." value={filterOrg} onChange={(e) => setFilterOrg(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aims-green/50" />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {['all', 'donor', 'government', 'partner', 'vendor', 'media', 'other'].map((t) => (
            <button key={t} onClick={() => setFilterType(t)} className={cn('px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors', filterType === t ? 'bg-aims-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>{t}</button>
          ))}
          <span className="ml-auto text-[10px] text-slate-400">{filtered.length} contact(s)</span>
        </div>
      </div>

      {/* Contacts */}
      <div className="space-y-3">
        {filtered.length === 0 && <p className="text-sm text-slate-400 italic text-center py-10">No contacts match your filters — add one above.</p>}
        {filtered.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-aims-mint flex items-center justify-center text-aims-green font-bold text-sm">{c.name.charAt(0)}</div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                  <p className="text-xs text-slate-500">{c.organization}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold capitalize w-fit', TYPE_COLORS[c.type] ?? TYPE_COLORS.other)}>{c.type}</span>
                <button onClick={() => openEdit(c)} className="text-[10px] font-bold text-aims-navy hover:underline">Edit</button>
                <button onClick={() => { if (window.confirm(`Delete ${c.name}?`)) { removeContact(c.id); showToast({ title: 'Contact Removed', message: c.name, type: 'info' }); } }} className="text-[10px] font-bold text-red-500 hover:underline">Delete</button>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px] text-slate-400">mail</span><span className="text-xs text-slate-600 truncate">{c.email || '—'}</span></div>
              <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px] text-slate-400">phone</span><span className="text-xs text-slate-600">{c.phone || '—'}</span></div>
              <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px] text-slate-400">schedule</span><span className="text-xs text-slate-500">Last: {c.lastContact}</span></div>
            </div>
            {c.notes && <p className="mt-2 text-xs text-slate-500 italic bg-slate-50 rounded-lg p-2">📝 {c.notes}</p>}
          </div>
        ))}
      </div>

      {/* Structured form modal (Add / Edit) */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[88vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 bg-aims-navy rounded-t-xl flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white">{editingId ? 'Edit Contact' : 'Add New Contact'}</h3>
                <p className="text-[11px] text-white/70">{editingId ? 'Update the relationship record.' : 'Register a donor, partner, government contact, media or vendor.'}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-white/80 hover:text-white"><span className="material-symbols-outlined text-[20px]">close</span></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Section A — type & identification */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-aims-navy px-4 py-2"><p className="text-[10px] font-bold text-white uppercase tracking-wider">1 · Type & Identification</p></div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-1">
                    <label className={LABEL}>Contact Type *</label>
                    <select value={form.type} onChange={(e) => set('type', e.target.value as CRMContactType)} className={INPUT}>
                      {['donor', 'partner', 'government', 'vendor', 'media', 'other'].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Full Name *</label>
                    <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Dr. Jane Achieng" className={INPUT} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL}>Organization / Institution *</label>
                    <input value={form.organization} onChange={(e) => set('organization', e.target.value)} placeholder="e.g. Global Fund" className={INPUT} />
                  </div>
                </div>
              </div>

              {/* Section B — contact details */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-aims-navy px-4 py-2"><p className="text-[10px] font-bold text-white uppercase tracking-wider">2 · Contact Details</p></div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL}>Email Address</label>
                    <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="name@org.org" className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Phone</label>
                    <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+256 7XX XXX XXX" className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Last Contact Date</label>
                    <input type="date" value={form.lastContact} onChange={(e) => set('lastContact', e.target.value)} className={INPUT} />
                  </div>
                </div>
              </div>

              {/* Section C — relationship notes */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-aims-navy px-4 py-2"><p className="text-[10px] font-bold text-white uppercase tracking-wider">3 · Relationship & Notes</p></div>
                <div className="p-4">
                  <label className={LABEL}>Notes (interests, pipeline, follow-ups)</label>
                  <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={4} placeholder="Opportunity pipeline, interests, agreed follow-ups…" className={INPUT} />
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
              <p className="text-[10px] text-slate-400 italic">Saved locally until the enterprise backend is connected.</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={save} className="px-5 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90 flex items-center gap-1.5"><span className="material-symbols-outlined text-[15px]">save</span>{editingId ? 'Save Changes' : 'Add Contact'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
