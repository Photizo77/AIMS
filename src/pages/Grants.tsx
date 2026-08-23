// src/pages/Grants.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { MOCK_GRANTS, GRANT_STAGES, formatCurrency, daysUntil, grantProgress, type GrantRecord } from '@/data/grants';
import { GrantsPipelineBoard } from '@/components/grants/GrantsPipelineBoard';

type ColorKey = 'green' | 'navy' | 'orange' | 'mint';
const CHIP: Record<ColorKey, string> = { green: 'bg-aims-green text-white', navy: 'bg-aims-navy text-white', orange: 'bg-aims-orange text-white', mint: 'bg-aims-mint text-aims-green' };

// Roles that see the FULL org-wide pipeline on this page
const FULL_VIEW_ROLES = ['CD', 'ED', 'COMPANY_ADMIN', 'SYS_ADMIN'];

interface TimelineEvent { date: string; kind: 'milestone' | 'activity'; title: string; sub?: string; done?: boolean; overdue?: boolean; }

function buildTimeline(g: GrantRecord): TimelineEvent[] {
  const milestoneEvents: TimelineEvent[] = g.milestones.map((m) => ({
    date: m.dueDate, kind: 'milestone', title: m.title, sub: `Assigned to ${m.assignee}`,
    done: m.completed, overdue: !m.completed && new Date(m.dueDate).getTime() < Date.now(),
  }));
  const activityEvents: TimelineEvent[] = g.activity.map((a) => ({
    date: a.timestamp.slice(0, 10), kind: 'activity', title: a.action, sub: a.actor,
  }));
  return [...milestoneEvents, ...activityEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function Grants() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);
  const [stageFilter, setStageFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) return <div className="p-8 text-center text-slate-500">Loading…</div>;

  // ── CD / ED / Admins: FULL org-wide pipeline board ──
  if (FULL_VIEW_ROLES.includes(user.role)) {
    return (
      <div className="space-y-6">
        <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Grants Pipeline</h1>
          <p className="text-base font-medium text-white">Organization-wide grant tracking from identification to award</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <GrantsPipelineBoard />
        </div>
      </div>
    );
  }

  // ── Grant Writers / everyone else: MY GRANTS personal workspace ──
  const userName = user.name;
  const myGrants = MOCK_GRANTS.filter((g) => g.handler === userName || g.contributors.includes(userName));

  const visible = myGrants.filter((g) => {
    const isClosed = g.stage === 'awarded' || g.stage === 'declined';
    if (!showClosed && isClosed) return false;
    if (stageFilter && g.stage !== stageFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!g.title.toLowerCase().includes(q) && !g.funder.toLowerCase().includes(q) && !g.pillar.toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const activeMine = myGrants.filter((g) => !['awarded', 'declined'].includes(g.stage));
  const nextDeadline = activeMine.length > 0 ? activeMine.reduce((min, g) => daysUntil(g.deadline) < daysUntil(min.deadline) ? g : min) : null;
  const myPendingTasks = myGrants.reduce((count, g) => count + g.milestones.filter((m) => !m.completed && m.assignee === userName).length, 0);
  const mySecured = myGrants.filter((g) => g.stage === 'awarded').reduce((s, g) => s + (g.amountAwarded ?? 0), 0);

  const getDeadlineColor = (days: number) => days <= 7 ? 'text-red-500 bg-red-50 border-red-200' : days <= 30 ? 'text-aims-orange bg-aims-orange/10 border-aims-orange/20' : 'text-slate-500 bg-slate-50 border-slate-200';

  return (
    <div className="space-y-6">
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">My Grants</h1>
        <p className="text-base font-medium text-white">Grants you are actively working on — deadlines, milestones & timelines</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-navy p-4 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">My Active Grants</p><p className="text-xl font-extrabold text-slate-900 mt-1">{activeMine.length}</p><p className="text-[10px] text-slate-400 mt-0.5">as handler or contributor</p></div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-orange p-4 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Next Deadline</p><p className="text-xl font-extrabold text-slate-900 mt-1">{nextDeadline ? `${daysUntil(nextDeadline.deadline)}d` : '—'}</p><p className="text-[10px] text-slate-400 mt-0.5 truncate">{nextDeadline ? nextDeadline.title : 'No active grants'}</p></div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-green p-4 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">My Pending Tasks</p><p className="text-xl font-extrabold text-slate-900 mt-1">{myPendingTasks}</p><p className="text-[10px] text-slate-400 mt-0.5">milestones assigned to you</p></div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-mint p-4 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">My Secured Value</p><p className="text-xl font-extrabold text-slate-900 mt-1">{formatCurrency(mySecured)}</p><p className="text-[10px] text-slate-400 mt-0.5">awarded grants you worked on</p></div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search My Grants</label>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Title, funder, pillar…" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
          </div>
          <div className="min-w-[150px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Stage</label>
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30">
              <option value="">All stages</option>
              {GRANT_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Scope</label>
            <select value={showClosed ? 'all' : 'active'} onChange={(e) => setShowClosed(e.target.value === 'all')} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30">
              <option value="active">Active only</option>
              <option value="all">Include closed</option>
            </select>
          </div>
        </div>
      </div>

      {visible.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-[48px] text-slate-300 mb-3">volunteer_activism</span>
          <p className="text-sm font-bold text-slate-700 mb-1">No grants match your filters</p>
          <p className="text-xs text-slate-400">You are not currently assigned as Handler or Contributor on any grants in this view.</p>
        </div>
      )}

      <div className="space-y-4">
        {visible.map((g) => {
          const days = daysUntil(g.deadline);
          const progress = grantProgress(g);
          const isExpanded = expandedId === g.id;
          const isHandler = g.handler === userName;
          const stageColor = GRANT_STAGES.find((s) => s.key === g.stage)?.color ?? 'navy';
          const timeline = buildTimeline(g);
          const nextMilestone = g.milestones.find((m) => !m.completed);

          return (
            <div key={g.id} className={cn('bg-white rounded-xl border shadow-sm transition-all', isExpanded ? 'border-aims-navy shadow-md' : 'border-slate-200')}>
              <div className="p-5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : g.id)}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={cn('inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide', CHIP[stageColor])}>{g.stage.replace('_', ' ')}</span>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border', isHandler ? 'bg-aims-green/10 text-aims-green border-aims-green/20' : 'bg-slate-100 text-slate-500 border-slate-200')}>{isHandler ? 'You are Handler' : 'You are Contributor'}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-aims-navy/10 text-aims-navy uppercase">{g.pillar}</span>
                    </div>
                    <p className="text-base font-extrabold text-slate-900">{g.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{g.funder} • Requested: {formatCurrency(g.amountRequested)}{g.amountAwarded ? ` • Awarded: ${formatCurrency(g.amountAwarded)}` : ''}</p>
                    {nextMilestone && <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">flag</span>Next up: {nextMilestone.title} (due {formatDate(nextMilestone.dueDate)})</p>}
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className={cn('text-xs font-bold px-2.5 py-1 rounded border', getDeadlineColor(days))}><span className="material-symbols-outlined text-[12px] align-middle mr-1">event</span>{days}d until deadline</span>
                    <div className="w-36">
                      <div className="flex justify-between text-[10px] mb-0.5"><span className="font-semibold text-slate-500">Progress</span><span className="font-bold text-slate-900">{progress}%</span></div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-aims-green" style={{ width: `${progress}%` }} /></div>
                    </div>
                    <span className="text-xs font-bold text-aims-navy flex items-center gap-1">{isExpanded ? 'Hide Timeline' : 'View Timeline'}<span className="material-symbols-outlined text-[16px]">{isExpanded ? 'expand_less' : 'expand_more'}</span></span>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Grant Timeline — Milestones & Activity</p>
                  <div className="relative">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200" />
                    <div className="space-y-3">
                      {timeline.map((ev, idx) => (
                        <div key={idx} className="relative flex gap-3">
                          <div className={cn('relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white',
                            ev.kind === 'activity' ? 'bg-slate-300' : ev.done ? 'bg-aims-green' : ev.overdue ? 'bg-red-500' : 'bg-slate-200')}>
                            <span className={cn('material-symbols-outlined text-[12px]', ev.kind === 'activity' ? 'text-white' : ev.done ? 'text-white' : ev.overdue ? 'text-white' : 'text-slate-500')}>
                              {ev.kind === 'activity' ? 'radio_button_checked' : ev.done ? 'check' : ev.overdue ? 'warning' : 'circle'}
                            </span>
                          </div>
                          <div className={cn('flex-1 pb-1 rounded-lg px-3 py-2 border', ev.kind === 'milestone' ? (ev.done ? 'bg-aims-green/5 border-aims-green/20' : ev.overdue ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200') : 'bg-white border-slate-100')}>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p className={cn('text-sm font-bold', ev.done ? 'text-slate-500 line-through' : ev.overdue ? 'text-red-600' : 'text-slate-900')}>{ev.title}</p>
                              <div className="flex items-center gap-2">
                                {ev.kind === 'milestone' && <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase', ev.done ? 'bg-aims-green/15 text-aims-green' : ev.overdue ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500')}>{ev.done ? 'Done' : ev.overdue ? 'Overdue' : 'Pending'}</span>}
                                {ev.kind === 'activity' && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-aims-navy/10 text-aims-navy">Activity</span>}
                                <span className="text-[10px] text-slate-400 font-mono">{formatDate(ev.date)}</span>
                              </div>
                            </div>
                            {ev.sub && <p className="text-[10px] text-slate-500 mt-0.5">{ev.sub}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <p className="text-[10px] text-slate-400">Deadline: {formatDate(g.deadline)} • Handler: {g.handler}{g.contributors.length > 0 ? ` • Contributors: ${g.contributors.join(', ')}` : ''}</p>
                    <button onClick={() => navigate(`/grants/${g.id}`)} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 transition-colors flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>Open Full Detail
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}