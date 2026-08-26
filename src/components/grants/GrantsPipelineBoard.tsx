// src/components/grants/GrantsPipelineBoard.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { GRANT_STAGES, formatCurrency, daysUntil, grantProgress, type GrantRecord } from '@/data/grants';
import { grantService } from '@/services/grantService';
import { openFlagForED } from '@/components/grants/FlagForEDModal';

type ColorKey = 'green' | 'navy' | 'orange' | 'mint' | 'red';
const CHIP: Record<ColorKey, string> = { green: 'bg-aims-green text-white', navy: 'bg-aims-navy text-white', orange: 'bg-aims-orange text-white', mint: 'bg-aims-mint text-aims-green', red: 'bg-red-500 text-white' };
const ACCENT: Record<ColorKey, string> = { green: 'border-t-aims-green', navy: 'border-t-aims-navy', orange: 'border-t-aims-orange', mint: 'border-t-aims-mint', red: 'border-t-red-500' };

export function GrantsPipelineBoard() {
  const { user } = useAuth();
  const { showToast, addNotification } = useNotifications();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [summaryGrant, setSummaryGrant] = useState<GrantRecord | null>(null);
  const [grants, setGrants] = useState<GrantRecord[]>(() => grantService.getAllGrants());

  if (!user) return null;
  const isCD = user.role === 'CD';
  const canExpressInterest = user.role === 'GRANT_WRITER' || user.role === 'GRANTS_MANAGER';

  const filtered = grants.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return g.title.toLowerCase().includes(q) || g.funder.toLowerCase().includes(q) || g.pillar.toLowerCase().includes(q) || g.handler.toLowerCase().includes(q);
  });

  const totalSecured = grants.filter((g) => g.stage === 'awarded').reduce((s, g) => s + (g.amountAwarded ?? 0), 0);
  const activeGrants = grants.filter((g) => !['awarded', 'declined'].includes(g.stage));
  const totalPipeline = activeGrants.reduce((s, g) => s + g.amountRequested, 0);
  const awardedCount = grants.filter((g) => g.stage === 'awarded').length;
  const decidedCount = grants.filter((g) => ['awarded', 'declined'].includes(g.stage)).length;
  const winRate = decidedCount > 0 ? Math.round((awardedCount / decidedCount) * 100) : 0;
  const unassignedCount = grants.filter((g) => !g.handler || g.handler === 'Unassigned').length;

  const getDeadlineColor = (days: number) => days <= 7 ? 'text-red-500 bg-red-50 border-red-200' : days <= 30 ? 'text-aims-orange bg-aims-orange/10 border-aims-orange/20' : 'text-slate-500 bg-slate-50 border-slate-200';

  const handleCardClick = (g: GrantRecord) => {
    if (isCD) { setSummaryGrant(g); return; }
    navigate(`/grants/${g.id}`);
  };

  const handleExpressInterest = (g: GrantRecord) => {
    const updated = grantService.expressInterest(g.id, user.name);
    if (updated && updated.handler === user.name) {
      setGrants([...grantService.getAllGrants()]);
      addNotification({ title: 'Grant Assigned', message: `You are now assigned to "${g.title}".`, type: 'success', link: `/grants/${g.id}` });
      showToast({ title: 'Assigned', message: `You are now the handler for "${g.title}".`, type: 'success' });
    } else {
      showToast({ title: 'Already Assigned', message: 'Another writer already took this grant.', type: 'warning' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Aggregate KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={cn('bg-white rounded-xl border border-slate-200 border-t-4 p-4 shadow-sm', ACCENT.green)}><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Secured</p><p className="text-xl font-extrabold text-slate-900 mt-1">{formatCurrency(totalSecured)}</p><p className="text-[10px] text-slate-400 mt-0.5">{awardedCount} awarded</p></div>
        <div className={cn('bg-white rounded-xl border border-slate-200 border-t-4 p-4 shadow-sm', ACCENT.navy)}><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pipeline Value</p><p className="text-xl font-extrabold text-slate-900 mt-1">{formatCurrency(totalPipeline)}</p><p className="text-[10px] text-slate-400 mt-0.5">{activeGrants.length} active proposals</p></div>
        <div className={cn('bg-white rounded-xl border border-slate-200 border-t-4 p-4 shadow-sm', ACCENT.orange)}><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Win Rate</p><p className="text-xl font-extrabold text-slate-900 mt-1">{winRate}%</p><p className="text-[10px] text-slate-400 mt-0.5">{decidedCount} decided</p></div>
        <div className={cn('bg-white rounded-xl border border-slate-200 border-t-4 p-4 shadow-sm', ACCENT.red)}><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unassigned</p><p className="text-xl font-extrabold text-slate-900 mt-1">{unassignedCount}</p><p className="text-[10px] text-slate-400 mt-0.5">awaiting a handler</p></div>
      </div>

      {/* Toggle + Search */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center bg-slate-100 rounded-lg p-1">
          <button onClick={() => setViewMode('kanban')} className={cn('px-4 py-1.5 rounded-md text-xs font-bold transition-all', viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}><span className="material-symbols-outlined text-[14px] align-middle mr-1">view_kanban</span>Kanban</button>
          <button onClick={() => setViewMode('list')} className={cn('px-4 py-1.5 rounded-md text-xs font-bold transition-all', viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}><span className="material-symbols-outlined text-[14px] align-middle mr-1">view_list</span>List</button>
        </div>
        <div className="relative w-64">
          <span className="material-symbols-outlined text-slate-400 text-[16px] absolute left-2.5 top-1/2 -translate-y-1/2">search</span>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search grants, funders, pillars…" className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
        </div>
      </div>

      {/* Kanban */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {GRANT_STAGES.map((stage) => {
            const stageGrants = filtered.filter((g) => g.stage === stage.key);
            return (
              <div key={stage.key} className="flex flex-col">
                <div className={cn('rounded-t-xl px-3 py-2.5 flex items-center justify-between', CHIP[stage.color])}><span className="text-xs font-bold uppercase tracking-wider text-white">{stage.label}</span><span className="text-xs font-extrabold text-white bg-white/20 px-2 py-0.5 rounded-full">{stageGrants.length}</span></div>
                <div className="bg-slate-50 rounded-b-xl border border-slate-200 border-t-0 p-2 space-y-2 min-h-[160px]">
                  {stageGrants.length === 0 && <p className="text-xs text-slate-400 text-center py-8 italic">No grants</p>}
                  {stageGrants.map((g) => {
                    const days = daysUntil(g.deadline);
                    const progress = grantProgress(g);
                    const unassigned = !g.handler || g.handler === 'Unassigned';
                    return (
                      <div key={g.id} onClick={() => handleCardClick(g)} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                        <p className="text-sm font-bold text-slate-900 mb-1 group-hover:text-aims-navy transition-colors">{g.title}</p>
                        <div className="flex items-center gap-1 mb-2 flex-wrap"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-aims-navy/10 text-aims-navy uppercase">{g.pillar}</span><span className="text-[9px] text-slate-400">{g.funder}</span></div>
                        <p className="text-[10px] text-slate-500 mb-2">Handler: {g.handler}</p>
                        <div className="mb-2"><div className="flex justify-between text-[10px] mb-0.5"><span className="font-semibold text-slate-500">Progress</span><span className="font-bold text-slate-900">{progress}%</span></div><div className="w-full bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-aims-green" style={{ width: `${progress}%` }} /></div></div>
                        <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-700">{formatCurrency(g.amountRequested)}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border', getDeadlineColor(days))}>{days}d left</span>
                            {unassigned && canExpressInterest && (
                              <button onClick={(e) => { e.stopPropagation(); handleExpressInterest(g); }} className="text-[10px] font-bold px-2 py-1 rounded bg-aims-green text-white hover:bg-aims-green/90 flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[12px]">handshake</span>Express Interest
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List */}
      {viewMode === 'list' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-slate-200"><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Grant</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Funder</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Pillar</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Handler</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Stage</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Amount</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Progress</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Deadline</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((g) => {
                const days = daysUntil(g.deadline);
                const progress = grantProgress(g);
                const stageColor = GRANT_STAGES.find((s) => s.key === g.stage)?.color ?? 'navy';
                const unassigned = !g.handler || g.handler === 'Unassigned';
                return (
                  <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 font-bold text-slate-900">{g.title}</td>
                    <td className="py-2.5 text-slate-600 text-xs">{g.funder}</td>
                    <td className="py-2.5"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-aims-navy/10 text-aims-navy uppercase">{g.pillar}</span></td>
                    <td className="py-2.5 text-slate-600 text-xs">{g.handler}</td>
                    <td className="py-2.5"><span className={cn('inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide', CHIP[stageColor])}>{g.stage.replace('_', ' ')}</span></td>
                    <td className="py-2.5 text-xs font-bold text-slate-900">{formatCurrency(g.amountRequested)}</td>
                    <td className="py-2.5"><div className="flex items-center gap-2"><div className="w-14 bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-aims-green" style={{ width: `${progress}%` }} /></div><span className="text-[10px] font-bold text-slate-700">{progress}%</span></div></td>
                    <td className="py-2.5"><span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border', getDeadlineColor(days))}>{days}d</span></td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {unassigned && canExpressInterest && (
                          <button onClick={() => handleExpressInterest(g)} className="text-[10px] font-bold px-2 py-1 rounded bg-aims-green text-white hover:bg-aims-green/90">Express Interest</button>
                        )}
                        <button onClick={() => handleCardClick(g)} className="text-xs font-bold text-aims-navy hover:underline">{isCD ? 'Summary' : 'Open'}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CD Summary Popover (read-only, no detail page access) */}
      {summaryGrant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setSummaryGrant(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 bg-aims-navy text-white flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Grant Summary (Read-Only)</h3>
              <button onClick={() => setSummaryGrant(null)} className="text-white/80 hover:text-white"><span className="material-symbols-outlined text-[20px]">close</span></button>
            </div>
            <div className="p-5 space-y-3">
              <div><p className="text-base font-extrabold text-slate-900">{summaryGrant.title}</p><p className="text-xs text-slate-500 mt-0.5">{summaryGrant.funder} • {summaryGrant.pillar}</p></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Stage</p><p className="text-sm font-bold text-slate-900 capitalize mt-0.5">{summaryGrant.stage.replace('_', ' ')}</p></div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Deadline</p><p className="text-sm font-bold text-slate-900 mt-0.5">{daysUntil(summaryGrant.deadline)}d remaining</p></div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Requested</p><p className="text-sm font-bold text-slate-900 mt-0.5">{formatCurrency(summaryGrant.amountRequested)}</p></div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Handler</p><p className="text-sm font-bold text-slate-900 mt-0.5">{summaryGrant.handler}</p></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="font-semibold text-slate-600">Checklist Progress</span><span className="font-bold text-slate-900">{grantProgress(summaryGrant)}%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className="h-2 rounded-full bg-aims-green" style={{ width: `${grantProgress(summaryGrant)}%` }} /></div>
              </div>
              <p className="text-[10px] text-slate-400 italic">CD access level: summary view only. Contact the ED or grant handler for full details.</p>
              {isCD && (
                <button onClick={() => openFlagForED({ recordLabel: `${summaryGrant.id} — ${summaryGrant.title}`, sourceModule: 'grants' })} className="w-full mt-3 py-2 bg-aims-orange/10 border border-aims-orange/30 text-aims-orange text-xs font-bold rounded-lg hover:bg-aims-orange/20 flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">flag</span>Flag for ED
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
