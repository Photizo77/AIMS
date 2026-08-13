// src/components/grants/GrantPipeline.tsx
import { cn } from '@/lib/utils';

type PipelineStage = 'discovery' | 'qualified' | 'assigned' | 'drafting' | 'review' | 'submitted' | 'awarded' | 'rejected';

interface PipelineGrant {
  id: string;
  title: string;
  uniqueId: string;
  pillar: string;
  amount: number;
  deadline: string;
  stage: PipelineStage;
  assignee?: string;
  riskLevel?: 'high' | 'medium' | 'low';
}

const STAGE_CONFIG: Record<PipelineStage, { label: string; color: string; bg: string }> = {
  discovery: { label: 'Discovery', color: 'text-gray-600', bg: 'bg-gray-100' },
  qualified: { label: 'Qualified', color: 'text-blue-600', bg: 'bg-blue-100' },
  assigned: { label: 'Assigned', color: 'text-indigo-600', bg: 'bg-indigo-100' },
  drafting: { label: 'Drafting', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  review: { label: 'Review', color: 'text-orange-700', bg: 'bg-orange-100' },
  submitted: { label: 'Submitted', color: 'text-blue-700', bg: 'bg-blue-100' },
  awarded: { label: 'Awarded', color: 'text-green-700', bg: 'bg-green-100' },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-100' },
};

const MOCK_PIPELINE: PipelineGrant[] = [
  { id: 'p1', title: 'Climate Innovation Fund', uniqueId: 'GRANT-AGRIC-2026-003', pillar: 'ArdhiAgric', amount: 500000000, deadline: '2026-09-18', stage: 'drafting', assignee: 'Janet Apio', riskLevel: 'high' },
  { id: 'p2', title: 'Land Rights Documentation', uniqueId: 'GRANT-LAND-2026-001', pillar: 'ArdhiLand', amount: 220000000, deadline: '2026-08-12', stage: 'review', assignee: 'Sarah Aciro', riskLevel: 'high' },
  { id: 'p3', title: 'Resilience Fund Phase II', uniqueId: 'GRANT-DISASTERS-2026-003', pillar: 'ArdhiDisasters', amount: 750000000, deadline: '2026-10-03', stage: 'qualified', riskLevel: 'low' },
  { id: 'p4', title: 'Maternal Health Expansion', uniqueId: 'GRANT-HEALTH-2026-003', pillar: 'ArdhiHealth', amount: 380000000, deadline: '2026-09-24', stage: 'assigned', assignee: 'Janet Apio', riskLevel: 'medium' },
  { id: 'p5', title: 'E-Waste Circular Economy', uniqueId: 'GRANT-WASTE-2026-002', pillar: 'ArdhiWaste', amount: 420000000, deadline: '2026-11-15', stage: 'discovery', riskLevel: 'low' },
  { id: 'p6', title: 'Smallholder Irrigation', uniqueId: 'GRANT-AGRIC-2026-001', pillar: 'ArdhiAgric', amount: 250000000, deadline: '2026-08-20', stage: 'submitted', assignee: 'Janet Apio', riskLevel: 'medium' },
  { id: 'p7', title: 'Community Recycling Hubs', uniqueId: 'GRANT-WASTE-2026-001', pillar: 'ArdhiWaste', amount: 620000000, deadline: '2026-07-30', stage: 'awarded', assignee: 'Sarah Aciro', riskLevel: 'low' },
];

const STAGES: PipelineStage[] = ['discovery', 'qualified', 'assigned', 'drafting', 'review', 'submitted', 'awarded'];

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.now();
const daysUntil = (d: string) => Math.max(0, Math.ceil((new Date(d).getTime() - NOW) / DAY_MS));

export function GrantPipeline() {
  const highRisk = MOCK_PIPELINE.filter(g => g.riskLevel === 'high').length;
  const medRisk = MOCK_PIPELINE.filter(g => g.riskLevel === 'medium').length;
  const totalValue = MOCK_PIPELINE.filter(g => g.stage !== 'awarded' && g.stage !== 'rejected').reduce((s, g) => s + g.amount, 0);

  return (
    <div className="space-y-6">
      {/* RISK SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-red-500 text-[24px]">error</span>
          <div>
            <p className="text-2xl font-extrabold text-red-700">{highRisk}</p>
            <p className="text-xs font-bold text-red-600">Due within 7 days</p>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-orange-500 text-[24px]">warning</span>
          <div>
            <p className="text-2xl font-extrabold text-orange-700">{medRisk}</p>
            <p className="text-xs font-bold text-orange-600">Due within 14 days</p>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-green-600 text-[24px]">account_balance_wallet</span>
          <div>
            <p className="text-2xl font-extrabold text-green-700">UGX {(totalValue / 1000000000).toFixed(1)}B</p>
            <p className="text-xs font-bold text-green-600">Active pipeline value</p>
          </div>
        </div>
      </div>

      {/* KANBAN BOARD */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1200px]">
          {STAGES.map(stage => {
            const cfg = STAGE_CONFIG[stage];
            const grants = MOCK_PIPELINE.filter(g => g.stage === stage);
            return (
              <div key={stage} className="flex-1 min-w-[160px]">
                <div className={cn('px-3 py-2 rounded-t-xl text-xs font-bold uppercase tracking-wider flex items-center justify-between', cfg.bg, cfg.color)}>
                  <span>{cfg.label}</span>
                  <span className="bg-white/60 px-1.5 py-0.5 rounded text-[10px]">{grants.length}</span>
                </div>
                <div className="bg-slate-50 border-x border-b border-slate-200 rounded-b-xl p-2 space-y-2 min-h-[200px]">
                  {grants.map(g => {
                    const days = daysUntil(g.deadline);
                    const isUrgent = days <= 7;
                    return (
                      <div key={g.id} className={cn('bg-white rounded-lg p-3 border shadow-sm hover:shadow-md transition-shadow cursor-pointer', isUrgent ? 'border-red-300' : 'border-slate-200')}>
                        <p className="text-xs font-bold text-slate-900 line-clamp-2 mb-1">{g.title}</p>
                        <p className="text-[10px] font-mono text-slate-400 mb-2">{g.uniqueId}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-600">UGX {(g.amount / 1000000).toFixed(0)}M</span>
                          <span className={cn('text-[10px] font-bold', isUrgent ? 'text-red-500' : 'text-slate-400')}>{days}d</span>
                        </div>
                        {g.assignee && <p className="text-[10px] text-slate-500 mt-1 truncate">👤 {g.assignee}</p>}
                      </div>
                    );
                  })}
                  {grants.length === 0 && (
                    <div className="text-center py-8 text-slate-300 text-xs">No grants</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}