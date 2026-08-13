// src/components/grants/GrantDiscovery.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';

interface FundingOpportunity {
  id: string;
  title: string;
  funder: string;
  amount: number;
  deadline: string;
  fitScore: number;
  pillar: string;
  category: string;
  description: string;
}

const MOCK_OPPORTUNITIES: FundingOpportunity[] = [
  { id: 'o1', title: 'Climate Resilience Innovation Fund', funder: 'USAID', amount: 500000000, deadline: '2026-09-30', fitScore: 92, pillar: 'ArdhiAgric', category: 'Climate Adaptation', description: 'Supporting innovative climate-resilient agriculture solutions in East Africa.' },
  { id: 'o2', title: 'Community Land Governance Program', funder: 'EU Delegation', amount: 350000000, deadline: '2026-10-15', fitScore: 87, pillar: 'ArdhiLand', category: 'Land Rights', description: 'Strengthening community-based land governance and documentation.' },
  { id: 'o3', title: 'Maternal & Child Health Initiative', funder: 'FCDO', amount: 420000000, deadline: '2026-11-01', fitScore: 78, pillar: 'ArdhiHealth', category: 'Public Health', description: 'Improving maternal and child health outcomes in underserved regions.' },
  { id: 'o4', title: 'Circular Economy Waste Solutions', funder: 'World Bank', amount: 600000000, deadline: '2026-12-15', fitScore: 95, pillar: 'ArdhiWaste', category: 'Waste Management', description: 'Scaling circular economy models for urban waste management.' },
  { id: 'o5', title: 'Disaster Preparedness & Response', funder: 'UN OCHA', amount: 280000000, deadline: '2026-09-20', fitScore: 71, pillar: 'ArdhiDisasters', category: 'Emergency Response', description: 'Building community resilience to natural disasters.' },
  { id: 'o6', title: 'Youth Agripreneurship Accelerator', funder: 'Gates Foundation', amount: 180000000, deadline: '2026-10-30', fitScore: 64, pillar: 'ArdhiAgric', category: 'Youth Employment', description: 'Supporting young entrepreneurs in agricultural value chains.' },
];

export function GrantDiscovery() {
  const { showToast } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPillar, setFilterPillar] = useState('all');

  const filtered = MOCK_OPPORTUNITIES.filter(o => {
    const matchesSearch = o.title.toLowerCase().includes(searchQuery.toLowerCase()) || o.funder.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPillar = filterPillar === 'all' || o.pillar === filterPillar;
    return matchesSearch && matchesPillar;
  });

  const handleQualify = (title: string) => {
    showToast({ title: 'Opportunity Qualified', message: `"${title}" added to pipeline for evaluation.`, type: 'success' });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input type="text" placeholder="Search funders, opportunities..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-aims-green/50" />
        <select value={filterPillar} onChange={(e) => setFilterPillar(e.target.value)} className="px-4 py-3 border border-slate-200 rounded-xl text-sm">
          <option value="all">All Pillars</option>
          <option>ArdhiAgric</option>
          <option>ArdhiHealth</option>
          <option>ArdhiLand</option>
          <option>ArdhiWaste</option>
          <option>ArdhiDisasters</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map(opp => (
          <div key={opp.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">{opp.funder}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600">{opp.category}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{opp.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{opp.description}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className={cn('px-3 py-1 rounded-full text-sm font-extrabold', opp.fitScore >= 85 ? 'bg-green-100 text-green-700' : opp.fitScore >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600')}>
                  {opp.fitScore}% Fit
                </div>
                <span className="text-xs font-bold text-slate-900">UGX {(opp.amount / 1000000).toFixed(0)}M</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">terrain</span>{opp.pillar}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span>Due: {opp.deadline}</span>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-aims-navy hover:bg-slate-50 rounded-lg transition-colors">View Details</button>
                <button onClick={() => handleQualify(opp.title)} className="px-3 py-1.5 bg-aims-green text-white text-xs font-bold rounded-lg hover:opacity-90 transition-colors">Qualify & Add to Pipeline</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}