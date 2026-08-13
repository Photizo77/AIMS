// src/components/grants/GrantsHistory.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Grant, GrantStatus } from '@/types';

const USER_NAMES: Record<string, string> = {
  'user-grant-001': 'Sarah Aciro',
  'user-ed-001': 'Peter Byamugisha',
  'user-cd-001': 'Nassir Mwanje',
  'user-innov-001': 'Pius Odong',
  'user-admin-001': 'Grace Aceng',
  'u1': 'Sarah Aciro' // Fallback for older mock data
};

const MOCK_HISTORY: Grant[] = [
  { id: 'h1', uniqueId: 'GRANT-AGRIC-2025-014', title: 'Smallholder Irrigation Network', pillar: 'ArdhiAgric', description: 'Solar-powered drip irrigation.', amount: 450000000, assignedWriterId: 'user-grant-001', status: 'awarded', deadline: '2025-06-30', createdAt: '2025-03-10', updatedAt: '2025-07-15' },
  { id: 'h2', uniqueId: 'GRANT-HEALTH-2025-009', title: 'Rural Vaccination Drive', pillar: 'ArdhiHealth', description: 'Mobile vaccination units.', amount: 280000000, assignedWriterId: 'user-grant-001', status: 'rejected', deadline: '2025-05-15', createdAt: '2025-02-20', updatedAt: '2025-05-20' },
  { id: 'h3', uniqueId: 'GRANT-WASTE-2025-007', title: 'Kampala E-Waste Recycling Hub', pillar: 'ArdhiWaste', description: 'E-waste collection facility.', amount: 620000000, assignedWriterId: 'user-ed-001', status: 'awarded', deadline: '2025-04-30', createdAt: '2025-01-15', updatedAt: '2025-06-01' },
  { id: 'h4', uniqueId: 'GRANT-LAND-2024-022', title: 'Wetland Restoration Initiative', pillar: 'ArdhiLand', description: 'Community-led restoration.', amount: 380000000, assignedWriterId: 'user-admin-001', status: 'awarded', deadline: '2024-11-30', createdAt: '2024-08-10', updatedAt: '2025-01-20' },
];

const STATUS_STYLES: Record<GrantStatus, string> = {
  idea: 'bg-gray-100 text-gray-600', drafting: 'bg-yellow-100 text-yellow-700', submitted: 'bg-blue-100 text-blue-700', awarded: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
};

export function GrantsHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const filtered = MOCK_HISTORY.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.uniqueId.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalValue = filtered.reduce((sum, g) => sum + g.amount, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input type="text" placeholder="Search history..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aims-green/50" />
        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">download</span> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-xs text-slate-500">Total Records</p>
          <p className="text-xl font-extrabold text-slate-900">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-3">
          <p className="text-xs text-green-600">Awarded</p>
          <p className="text-xl font-extrabold text-green-600">{filtered.filter(g => g.status === 'awarded').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-xs text-slate-500">Total Value</p>
          <p className="text-xl font-extrabold text-slate-900">UGX {(totalValue / 1000000000).toFixed(1)}B</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Grant ID</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Title</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Handler</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((grant) => (
              <tr key={grant.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{grant.uniqueId}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">{grant.title}</td>
                <td className="px-4 py-3 text-slate-700 font-medium">{USER_NAMES[grant.assignedWriterId] || 'Unassigned'}</td>
                <td className="px-4 py-3 text-slate-700 font-bold">UGX {(grant.amount / 1000000).toFixed(0)}M</td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', STATUS_STYLES[grant.status])}>{grant.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}