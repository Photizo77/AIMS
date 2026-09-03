// src/pages/Tasks.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { CHIP, ACCENT, type ColorKey } from '@/lib/uiTheme';
import { INNOVATION_STAGES, INNOVATION_STAGE_LABELS } from '@/types';
import { innovationService } from '@/services/innovationService';
import { AIPanel } from '@/components/ai/AIPanel';
import { stageTransitionConfidence, type AiInsight } from '@/lib/aiEngine';
import { FormsShortcut } from '@/components/forms/FormsShortcut';


export function Tasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  // For Innovators, we default to 'mine'. Admins can toggle.
  const [scope, setScope] = useState<'all' | 'mine'>('mine');

  if (!user) return <div className="p-8 text-center text-slate-500">Loading…</div>;

  const canSeeAll = ['CD', 'ED', 'COMPANY_ADMIN', 'SYS_ADMIN'].includes(user.role);
  
  // LOGIC: If scope is 'mine', filter by user name. If 'all', show everything (if allowed).
  const projects = scope === 'mine' 
    ? innovationService.getMyProjects(user.name) 
    : canSeeAll 
      ? innovationService.getAllProjects() 
      : innovationService.getMyProjects(user.name);

  const visibleProjects = searchQuery.trim()
    ? projects.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.leadName.toLowerCase().includes(searchQuery.toLowerCase()) || p.contributorNames.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())))
    : projects;

  const getAgingColor = (days: number) => days > 14 ? 'text-red-500 bg-red-50 border-red-200' : days >= 7 ? 'text-aims-orange bg-aims-orange/10 border-aims-orange/20' : 'text-aims-green bg-aims-green/10 border-aims-green/20';
  const getAgingDot = (days: number) => days > 14 ? 'bg-red-500' : days >= 7 ? 'bg-aims-orange' : 'bg-aims-green';

  return (
    <div className="space-y-6">
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Innovations & Tasks</h1>
        <p className="text-base font-medium text-white">{scope === 'mine' ? 'Your assigned innovation projects and tasks' : 'Organization-wide innovation pipeline oversight'}</p>
      </div>

      <FormsShortcut module="innovations" title="Innovation Forms — Project Proposal · Feasibility Study" />

      {/* AI Insights — predictive pipeline analysis */}
      {(() => {
        const insights: AiInsight[] = [];
        const stalled = visibleProjects.filter((p) => p.daysInStage > 14);
        if (stalled.length > 0) insights.push({ id: 't-stall', module: 'innovations', severity: 'warning', title: `${stalled.length} project(s) stalled in stage`, detail: stalled.map((p) => `${p.title} (${p.daysInStage}d in ${p.stage})`).join('; ') + ' - consider unblocking.' });
        const low = visibleProjects.filter((p) => stageTransitionConfidence(p.id).confidence === 'low');
        low.forEach((p) => {
          const conf = stageTransitionConfidence(p.id);
          insights.push({ id: `t-${p.id}`, module: 'innovations', severity: 'warning', title: `Low confidence: ${p.title}`, detail: conf.missing[0] ?? conf.reason });
        });
        const ready = visibleProjects.filter((p) => stageTransitionConfidence(p.id).confidence === 'high' && p.stage !== 'deployed');
        if (ready.length > 0) insights.push({ id: 't-ready', module: 'innovations', severity: 'success', title: `${ready.length} project(s) ready to advance`, detail: ready.map((p) => `${p.title} -> next stage`).join('; ') });
        return <AIPanel title="AI Insights - Pipeline Prediction" insights={insights.slice(0, 5)} />;
      })()}

      {/* Stats Row - Dynamically updates based on filtered projects */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {INNOVATION_STAGES.map((s) => {
          const count = visibleProjects.filter((p) => p.stage === s).length;
          const colorMap: Record<string, ColorKey> = { research: 'mint', concept: 'orange', prototype: 'navy', testing: 'mint', production: 'green', deployed: 'navy' };
          return (<div key={s} className={cn('bg-white rounded-xl border border-slate-200 border-t-4 p-4 shadow-sm text-center', ACCENT[colorMap[s] || 'navy'])}><p className="text-2xl font-extrabold text-slate-900">{count}</p><p className="text-xs font-semibold text-slate-500 mt-1">{INNOVATION_STAGE_LABELS[s]}</p></div>);
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {canSeeAll && (
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button onClick={() => setScope('all')} className={cn('px-4 py-1.5 rounded-md text-xs font-bold transition-all', scope === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>All Projects</button>
              <button onClick={() => setScope('mine')} className={cn('px-4 py-1.5 rounded-md text-xs font-bold transition-all', scope === 'mine' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>My Tasks</button>
            </div>
          )}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button onClick={() => setViewMode('kanban')} className={cn('px-4 py-1.5 rounded-md text-xs font-bold transition-all', viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>Kanban</button>
            <button onClick={() => setViewMode('list')} className={cn('px-4 py-1.5 rounded-md text-xs font-bold transition-all', viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>List</button>
          </div>
        </div>
        <div className="relative w-56">
          <span className="material-symbols-outlined text-slate-400 text-[16px] absolute left-2.5 top-1/2 -translate-y-1/2">search</span>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search projects, leads…" className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {INNOVATION_STAGES.map((stage) => {
            const stageProjects = visibleProjects.filter((p) => p.stage === stage);
            const colorMap: Record<string, ColorKey> = { research: 'mint', concept: 'orange', prototype: 'navy', testing: 'mint', production: 'green', deployed: 'navy' };
            const color = colorMap[stage] || 'navy';
            
            return (
              <div key={stage} className="flex flex-col">
                <div className={cn('rounded-t-xl px-3 py-2.5 flex items-center justify-between', CHIP[color])}><span className="text-xs font-bold uppercase tracking-wider text-white">{INNOVATION_STAGE_LABELS[stage]}</span><span className="text-xs font-extrabold text-white bg-white/20 px-2 py-0.5 rounded-full">{stageProjects.length}</span></div>
                <div className="bg-slate-50 rounded-b-xl border border-slate-200 border-t-0 p-2 space-y-2 min-h-[200px]">
                  {stageProjects.length === 0 && <p className="text-xs text-slate-400 text-center py-8 italic">No projects</p>}
                  {stageProjects.map((p) => (
                    <div key={p.id} onClick={() => navigate(`/innovations/${p.id}`)} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                      <p className="text-sm font-bold text-slate-900 mb-1 group-hover:text-aims-navy transition-colors">{p.title}</p>
                      <p className="text-[10px] text-slate-500 mb-2">Lead: {p.leadName}</p>
                      <div className="mb-2"><div className="w-full bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-aims-green" style={{ width: `${p.progressPercent}%` }} /></div></div>
                      <p className="text-[10px] text-slate-500 mb-2">{p.milestones?.filter(m => m.completed).length || 0}/{p.milestones?.length || 0} milestones</p>
                      <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-bold', getAgingColor(p.daysInStage))}><span className={cn('w-1.5 h-1.5 rounded-full', getAgingDot(p.daysInStage))} />{p.daysInStage}d in stage</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-slate-200"><th className="pb-2 font-bold text-slate-500 text-xs uppercase">Project</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase">Stage</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase">Lead</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase">Progress</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {visibleProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 font-bold text-slate-900">{p.title}</td>
                    <td className="py-2.5"><span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-aims-navy/10 text-aims-navy capitalize">{p.stage}</span></td>
                    <td className="py-2.5 text-slate-600">{p.leadName}</td>
                    <td className="py-2.5"><div className="w-16 bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-aims-green" style={{ width: `${p.progressPercent}%` }} /></div></td>
                    <td className="py-2.5 text-right"><button onClick={() => navigate(`/innovations/${p.id}`)} className="text-xs font-bold text-aims-navy hover:underline">Open</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}