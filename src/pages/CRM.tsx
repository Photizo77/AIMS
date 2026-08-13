// src/pages/CRM.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import type { CRMContact } from '@/types';

const MOCK_CONTACTS: CRMContact[] = [
  { id: 'c1', name: 'Dr. James Mukasa', organization: 'USAID Uganda', email: 'jmukasa@usaid.gov', phone: '+256 772 123 456', type: 'donor', lastContact: '2026-08-01', notes: 'Interested in climate resilience proposals' },
  { id: 'c2', name: 'Ms. Florence Nakamya', organization: 'EU Delegation', email: 'f.nakamya@eu.eu', phone: '+256 701 234 567', type: 'donor', lastContact: '2026-07-28', notes: 'Follow up on waste management grant' },
  { id: 'c3', name: 'Mr. David Okot', organization: 'Ministry of Agriculture', email: 'dokot@mag.go.ug', phone: '+256 752 345 678', type: 'government', lastContact: '2026-07-20', notes: 'MOU renewal pending' },
  { id: 'c4', name: 'Ms. Rose Atim', organization: 'Gulu University', email: 'ratim@gu.ac.ug', phone: '+256 771 456 789', type: 'partner', lastContact: '2026-08-03', notes: 'Research collaboration on soil health' },
  { id: 'c5', name: 'Mr. Charles Opio', organization: 'TechSupply Ltd', email: 'copio@techsupply.ug', phone: '+256 703 567 890', type: 'vendor', lastContact: '2026-07-15', notes: 'Solar equipment supplier, reliable' },
];

const TYPE_COLORS: Record<string, string> = { donor: 'bg-green-100 text-green-700', government: 'bg-blue-100 text-blue-700', partner: 'bg-purple-100 text-purple-700', vendor: 'bg-amber-100 text-amber-700' };

export function CRM() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterOrg, setFilterOrg] = useState('');

  // Access restriction
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

  const filtered = MOCK_CONTACTS.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || c.type === filterType;
    const matchesOrg = !filterOrg || c.organization.toLowerCase().includes(filterOrg.toLowerCase());
    return matchesSearch && matchesType && matchesOrg;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Contact Relationship Manager</h1>
        <p className="text-sm text-slate-500 mt-1">Donors, partners, government contacts, and vendors</p>
      </div>

      {/* ADVANCED FILTERS */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aims-green/50" />
          <input type="text" placeholder="Filter by organization..." value={filterOrg} onChange={(e) => setFilterOrg(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aims-green/50" />
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'donor', 'government', 'partner', 'vendor'].map(t => (
            <button key={t} onClick={() => setFilterType(t)} className={cn('px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors', filterType === t ? 'bg-aims-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>{t}</button>
          ))}
        </div>
      </div>

      {/* CONTACTS LIST */}
      <div className="space-y-3">
        {filtered.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-aims-mint flex items-center justify-center text-aims-green font-bold text-sm">{c.name.charAt(0)}</div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                  <p className="text-xs text-slate-500">{c.organization}</p>
                </div>
              </div>
              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold capitalize w-fit', TYPE_COLORS[c.type])}>{c.type}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px] text-slate-400">mail</span><span className="text-xs text-slate-600 truncate">{c.email}</span></div>
              <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px] text-slate-400">phone</span><span className="text-xs text-slate-600">{c.phone}</span></div>
              <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px] text-slate-400">schedule</span><span className="text-xs text-slate-500">Last: {c.lastContact}</span></div>
            </div>
            {c.notes && <p className="mt-2 text-xs text-slate-500 italic bg-slate-50 rounded-lg p-2">📝 {c.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}