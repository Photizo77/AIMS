// src/components/grants/GrantsHistory.tsx
// ============================================================
// AIMS — Grants History Archive
// ============================================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Grant, GrantStatus } from '@/types';

const MOCK_HISTORY: Grant[] = [
  { id: 'grant-hist-1', uniqueId: 'GRANT-AGRIC-2025-014', title: 'Smallholder Irrigation Network', pillar: 'ArdhiAgric', description: 'Solar-powered drip irrigation for 300 farms in Karamoja.', amount: 450000000, assignedWriterId: 'user-grant-001', status: 'awarded', deadline: '2025-06-30', createdAt: '2025-03-10', updatedAt: '2025-07-15' },
  { id: 'grant-hist-2', uniqueId: 'GRANT-HEALTH-2025-009', title: 'Rural Vaccination Drive', pillar: 'ArdhiHealth', description: 'Mobile vaccination units targeting 10,000 children under 5.', amount: 280000000, assignedWriterId: 'user-grant-001', status: 'rejected', deadline: '2025-05-15', createdAt: '2025-02-20', updatedAt: '2025-05-20' },
  { id: 'grant-hist-3', uniqueId: 'GRANT-WASTE-2025-007', title: 'Kampala E-Waste Recycling Hub', pillar: 'ArdhiWaste', description: 'Establishing formal e-waste collection and processing facility.', amount: 620000000, assignedWriterId: 'user-grant-001', status: 'awarded', deadline: '2025-04-30', createdAt: '2025-01-15', updatedAt: '2025-06-01' },
  { id: 'grant-hist-4', uniqueId: 'GRANT-LAND-2024-022', title: 'Wetland Restoration Initiative', pillar: 'ArdhiLand', description: 'Community-led restoration of 200 hectares of degraded wetlands.', amount: 380000000, assignedWriterId: 'user-grant-001', status: 'awarded', deadline: '2024-11-30', createdAt: '2024-08-10', updatedAt: '2025-01-20' },
  { id: 'grant-hist-5', uniqueId: 'GRANT-DISASTERS-2024-018', title: 'Flood Resilience Infrastructure', pillar: 'ArdhiDisasters', description: 'Reinforcing riverbanks and early warning systems in Bududa.', amount: 550000000, assignedWriterId: 'user-grant-001', status: 'submitted', deadline: '2024-10-15', createdAt: '2024-07-01', updatedAt: '2024-10-10' },
  { id: 'grant-hist-6', uniqueId: 'GRANT-AGRIC-2024-011', title: 'Post-Harvest Loss Reduction', pillar: 'ArdhiAgric', description: 'Hermetic storage bags distribution to 5,000 farming households.', amount: 190000000, assignedWriterId: 'user-grant-001', status: 'awarded', deadline: '2024-08-30', createdAt: '2024-05-15', updatedAt: '2024-09-05' },
];

const STATUS_STYLES: Record<GrantStatus, string> = {
  idea: 'bg-gray-100 text-gray-600',
  drafting: 'bg-yellow-100 text-yellow-700',
  submitted: 'bg-blue-100 text-blue-700',
  awarded: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export function GrantsHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPillar, setFilterPillar] = useState<string>('all');

  const pillars = ['all', ...Array.from(new Set(MOCK_HISTORY.map((g) => g.pillar)))];

  const filtered = MOCK_HISTORY.filter((grant) => {
    const matchesSearch = grant.title.toLowerCase().includes(searchQuery.toLowerCase()) || grant.uniqueId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || grant.status === filterStatus;
    const matchesPillar = filterPillar === 'all' || grant.pillar === filterPillar;
    return matchesSearch && matchesStatus && matchesPillar;
  });

  const totalValue = filtered.reduce((sum, g) => sum + g.amount, 0);
  const awardedCount = filtered.filter((g) => g.status === 'awarded').length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Grants History</h2>
          <p className="text-sm text-slate-500">Complete archive of all grant applications and outcomes</p>
        </div>
        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export CSV
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-xs text-slate-500">Total Records</p>
          <p className="text-xl font-bold text-slate-900">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-3">
          <p className="text-xs text-green-600">Awarded</p>
          <p className="text-xl font-bold text-green-600">{awardedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-xs text-slate-500">Success Rate</p>
          <p className="text-xl font-bold text-slate-900">{filtered.length > 0 ? Math.round((awardedCount / filtered.length) * 100) : 0}%</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <p className="text-xs text-slate-500">Total Value</p>
          <p className="text-xl font-bold text-slate-900">UGX {(totalValue / 1000000000).toFixed(1)}B</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by title or Grant ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aims-green/50"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aims-green/50"
        >
          <option value="all">All Statuses</option>
          <option value="idea">Idea</option>
          <option value="drafting">Drafting</option>
          <option value="submitted">Submitted</option>
          <option value="awarded">Awarded</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={filterPillar}
          onChange={(e) => setFilterPillar(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aims-green/50"
        >
          {pillars.map((pillar) => (
            <option key={pillar} value={pillar}>{pillar === 'all' ? 'All Pillars' : pillar}</option>
          ))}
        </select>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Grant ID</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Title</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Pillar</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Deadline</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((grant) => (
              <tr key={grant.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{grant.uniqueId}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{grant.title}</td>
                <td className="px-4 py-3 text-slate-600">{grant.pillar}</td>
                <td className="px-4 py-3 text-slate-700 font-semibold">UGX {(grant.amount / 1000000).toFixed(0)}M</td>
                <td className="px-4 py-3 text-slate-600">{grant.deadline}</td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', STATUS_STYLES[grant.status])}>
                    {grant.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{grant.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <span className="material-symbols-outlined text-[48px] block mb-2">history</span>
            <p>No grants match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}