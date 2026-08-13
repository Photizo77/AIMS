// src/components/grants/GrantsManager.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import { AIWritingAssistant } from './AIWritingAssistant';
import type { Grant, GrantStatus } from '@/types';

interface Pillar { id: string; name: string; icon: string; color: string; bgColor: string; borderColor: string; }

const ARDHI_PILLARS: Pillar[] = [
  { id: 'ArdhiAgric', name: 'ArdhiAgric', icon: 'agriculture', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  { id: 'ArdhiWaste', name: 'ArdhiWaste', icon: 'delete', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { id: 'ArdhiDisasters', name: 'ArdhiDisasters', icon: 'warning', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  { id: 'ArdhiHealth', name: 'ArdhiHealth', icon: 'local_hospital', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { id: 'ArdhiLand', name: 'ArdhiLand', icon: 'terrain', color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
];

const MOCK_GRANTS: Grant[] = [
  { id: 'grant-1', uniqueId: 'GRANT-AGRIC-2026-001', title: 'Climate-Smart Farming Initiative', pillar: 'ArdhiAgric', description: 'Training 200 smallholder farmers in drought-resistant crop varieties.', amount: 250000000, assignedWriterId: 'user-grant-001', status: 'submitted', deadline: '2026-09-15', createdAt: '2026-06-01', updatedAt: '2026-07-20' },
  { id: 'grant-2', uniqueId: 'GRANT-HEALTH-2026-002', title: 'Community Health Worker Training', pillar: 'ArdhiHealth', description: 'Training 150 community health workers in disease prevention.', amount: 180000000, assignedWriterId: 'user-grant-001', status: 'drafting', deadline: '2026-10-01', createdAt: '2026-07-05', updatedAt: '2026-07-30' },
  { id: 'grant-3', uniqueId: 'GRANT-LAND-2026-001', title: 'Community Land Rights Documentation', pillar: 'ArdhiLand', description: 'Supporting 8 indigenous communities in securing ancestral land rights.', amount: 220000000, assignedWriterId: 'user-grant-001', status: 'awarded', deadline: '2026-11-30', createdAt: '2026-07-20', updatedAt: '2026-08-04' },
];

const STATUS_STYLES: Record<GrantStatus, string> = {
  idea: 'bg-gray-100 text-gray-600', drafting: 'bg-yellow-100 text-yellow-700', submitted: 'bg-blue-100 text-blue-700', awarded: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
};

export function GrantsManager() {
  const { showToast } = useNotifications();
  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
  const [filterPillar, setFilterPillar] = useState<string>('all');

  const filtered = filterPillar === 'all' ? MOCK_GRANTS : MOCK_GRANTS.filter((g) => g.pillar === filterPillar);

  if (selectedGrant) {
    return <GrantDetailView grant={selectedGrant} onBack={() => setSelectedGrant(null)} />;
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {ARDHI_PILLARS.map((pillar) => {
          const isActive = filterPillar === pillar.id;
          return (
            <button key={pillar.id} onClick={() => setFilterPillar(isActive ? 'all' : pillar.id)} className={cn('p-3 rounded-xl border-2 transition-all text-left', isActive ? `${pillar.bgColor} ${pillar.borderColor} shadow-md` : 'bg-white border-slate-200 hover:border-slate-300')}>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('material-symbols-outlined text-[20px]', pillar.color)}>{pillar.icon}</span>
                <span className="text-xs font-bold text-slate-900">{pillar.name}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((grant) => {
          const pillar = ARDHI_PILLARS.find((p) => p.id === grant.pillar);
          return (
            <button key={grant.id} onClick={() => setSelectedGrant(grant)} className="bg-white rounded-xl border border-slate-200 p-4 text-left hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-400">{grant.uniqueId}</span>
                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium capitalize', STATUS_STYLES[grant.status])}>{grant.status}</span>
              </div>
              <div className={cn('flex items-center gap-2 mb-2 px-2 py-1 rounded-md w-fit', pillar?.bgColor)}>
                <span className={cn('material-symbols-outlined text-[16px]', pillar?.color)}>{pillar?.icon}</span>
                <span className={cn('text-xs font-medium', pillar?.color)}>{grant.pillar}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">{grant.title}</h3>
              <p className="text-xs text-slate-500 mb-3 line-clamp-2">{grant.description}</p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-sm font-extrabold text-slate-900">UGX {(grant.amount / 1000000).toFixed(0)}M</span>
                <span className="text-xs font-semibold text-slate-500">Due: {grant.deadline}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GrantDetailView({ grant, onBack }: { grant: Grant; onBack: () => void }) {
  const pillar = ARDHI_PILLARS.find((p) => p.id === grant.pillar);
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-700 mb-4">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back to Grants
      </button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className={cn('rounded-xl border-2 p-5', pillar?.borderColor, pillar?.bgColor)}>
            <span className="text-[10px] font-mono text-slate-500">{grant.uniqueId}</span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">{grant.title}</h2>
            <p className="text-sm text-slate-700 mt-3 leading-relaxed">{grant.description}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Grant Proposal Draft</h3>
            <textarea placeholder="Write your grant proposal here..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm min-h-[300px] resize-none focus:outline-none focus:ring-2 focus:ring-aims-green/50" />
          </div>
        </div>
        <div className="lg:col-span-1">
          <AIWritingAssistant grant={grant} />
        </div>
      </div>
    </div>
  );
}