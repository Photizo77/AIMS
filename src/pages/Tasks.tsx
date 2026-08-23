// src/pages/Tasks.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';

type ColorKey = 'green' | 'navy' | 'orange' | 'mint';

const ACCENT: Record<ColorKey, string> = { green: 'border-t-aims-green', navy: 'border-t-aims-navy', orange: 'border-t-aims-orange', mint: 'border-t-aims-mint' };
const CHIP: Record<ColorKey, string> = { green: 'bg-aims-green text-white', navy: 'bg-aims-navy text-white', orange: 'bg-aims-orange text-white', mint: 'bg-aims-mint text-aims-green' };

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (<div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><div className="mb-4"><h3 className="text-base font-bold text-slate-900">{title}</h3>{subtitle && <p className="text-xs font-semibold text-slate-500 mt-0.5">{subtitle}</p>}</div>{children}</div>);
}

interface FilterPreset { id: string; name: string }
function AdvancedFilterBar({ dateLabel = 'Date', statusOptions, ownerOptions, presets = [], onExport, onSavePreset }: { dateLabel?: string; statusOptions: string[]; ownerOptions: string[]; presets?: FilterPreset[]; onExport?: (f: 'csv' | 'pdf') => void; onSavePreset?: (n: string) => void }) {
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState('');
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[180px]"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search</label><input type="text" placeholder="Title, description, ID…" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30" /></div>
        <div className="min-w-[140px]"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{dateLabel}</label><select className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30"><option value="">All time</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option></select></div>
        <div className="min-w-[130px]"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label><select className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30"><option value="">All statuses</option>{statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {presets.length > 0 && (<div className="relative"><button onClick={() => setShowPresets(!showPresets)} className="text-[10px] font-bold text-aims-navy hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">bookmark</span>Presets ({presets.length})</button>{showPresets && (<div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-10 min-w-[180px]">{presets.map((p) => <button key={p.id} className="block w-full text-left text-xs px-2 py-1.5 hover:bg-slate-50 rounded text-slate-700">{p.name}</button>)}</div>)}</div>)}
        <div className="flex items-center gap-1"><input type="text" placeholder="Save filter as…" value={presetName} onChange={(e) => setPresetName(e.target.value)} className="text-[10px] border border-slate-200 rounded px-2 py-1 w-32 focus:outline-none focus:ring-1 focus:ring-aims-navy/30" /><button onClick={() => { if (presetName.trim()) { onSavePreset?.(presetName); setPresetName(''); } }} className="text-[10px] font-bold text-aims-green hover:underline">Save</button></div>
        <div className="ml-auto flex items-center gap-2"><span className="text-[10px] text-slate-400 italic">Filters combine with AND</span><button onClick={() => onExport?.('csv')} className="text-[10px] font-bold text-aims-navy hover:underline flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">download</span>CSV</button><button onClick={() => onExport?.('pdf')} className="text-[10px] font-bold text-aims-navy hover:underline flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">picture_as_pdf</span>PDF</button></div>
      </div>
    </div>
  );
}

const ALL_PROJECTS = [
  { id: 'inv-001', title: 'Solar-Powered Grain Dryer', stage: 'prototype', lead: 'Pius Odong', contributors: ['Florence Adong', 'Isaac Tumusiime'], progress: 62, daysInStage: 9, milestoneCount: 5, milestoneDone: 3 },
  { id: 'inv-002', title: 'Community Land Mapping Drone', stage: 'testing', lead: 'Florence Adong', contributors: ['Pius Odong'], progress: 78, daysInStage: 4, milestoneCount: 4, milestoneDone: 3 },
  { id: 'inv-003', title: 'Mobile USSD Farmer Advisory', stage: 'concept', lead: 'Pius Odong', contributors: ['Janet Apio', 'Grace Nakamya', 'David Okello'], progress: 35, daysInStage: 18, milestoneCount: 6, milestoneDone: 2 },
  { id: 'inv-004', title: 'Biogas Digester Pilot', stage: 'research', lead: 'Florence Adong', contributors: ['Pius Odong'], progress: 15, daysInStage: 3, milestoneCount: 3, milestoneDone: 0 },
  { id: 'inv-005', title: 'Post-Harvest Loss Tracker App', stage: 'production', lead: 'Pius Odong', contributors: ['Florence Adong', 'Isaac Tumusiime', 'Grace Nakamya'], progress: 91, daysInStage: 22, milestoneCount: 8, milestoneDone: 7 },
  { id: 'inv-006', title: 'Soil Moisture IoT Sensor', stage: 'deployed', lead: 'Florence Adong', contributors: ['Pius Odong', 'Isaac Tumusiime'], progress: 100, daysInStage: 5, milestoneCount: 6, milestoneDone: 6 },
  { id: 'inv-007', title: 'Seed Bank Management System', stage: 'concept', lead: 'Grace Nakamya', contributors: ['Pius Odong'], progress: 20, daysInStage: 6, milestoneCount: 4, milestoneDone: 1 },
  { id: 'inv-008', title: 'Weather Station Network', stage: 'research', lead: 'Isaac Tumusiime', contributors: ['Florence Adong'], progress: 8, daysInStage: 12, milestoneCount: 3, milestoneDone: 0 },
];

const STAGES = [
  { key: 'research', label: 'Research', color: 'mint' as ColorKey },
  { key: 'concept', label: 'Concept', color: 'orange' as ColorKey },
  { key: 'prototype', label: 'Prototype', color: 'navy' as ColorKey },
  { key: 'testing', label: 'Testing', color: 'mint' as ColorKey },
  { key: 'production', label: 'Production', color: 'green' as ColorKey },
  { key: 'deployed', label: 'Deployed', color: 'navy' as ColorKey },
];

export function Tasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [scope, setScope] = useState<'all' | 'mine'>('all');

  const handleAction = (msg: string) => showToast({ title: 'Action Logged', message: msg, type: 'success' });

  if (!user) return <div className="p-8 text-center text-slate-500">Loading…</div>;

  const canSeeAll = ['CD', 'ED', 'COMPANY_ADMIN', 'SYS_ADMIN'].includes(user.role);
  const userName = user.name;

  // Filter projects based on scope
  const projects = scope === 'mine'
    ? ALL_PROJECTS.filter((p) => p.lead === userName || p.contributors.includes(userName))
    : canSeeAll ? ALL_PROJECTS : ALL_PROJECTS.filter((p) => p.lead === userName || p.contributors.includes(userName));

  const getAgingColor = (days: number) => days > 14 ? 'text-red-500 bg-red-50 border-red-200' : days >= 7 ? 'text-aims-orange bg-aims-orange/10 border-aims-orange/20' : 'text-aims-green bg-aims-green/10 border-aims-green/20';
  const getAgingDot = (days: number) => days > 14 ? 'bg-red-500' : days >= 7 ? 'bg-aims-orange' : 'bg-aims-green';

  return (
    <div className="space-y-6">
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Innovations & Tasks</h1>
        <p className="text-base font-medium text-white">{canSeeAll ? 'Organization-wide innovation pipeline oversight' : 'Your assigned innovation projects and tasks'}</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {STAGES.map((s) => {
          const count = projects.filter((p) => p.stage === s.key).length;
          return (<div key={s.key} className={cn('bg-white rounded-xl border border-slate-200 border-t-4 p-4 shadow-sm text-center', ACCENT[s.color])}><p className="text-2xl font-extrabold text-slate-900">{count}</p><p className="text-xs font-semibold text-slate-500 mt-1">{s.label}</p></div>);
        })}
      </div>

      {/* Scope Toggle + View Toggle + Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {/* Scope Toggle */}
          {canSeeAll && (
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button onClick={() => setScope('all')} className={cn('px-4 py-1.5 rounded-md text-xs font-bold transition-all', scope === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>All Projects</button>
              <button onClick={() => setScope('mine')} className={cn('px-4 py-1.5 rounded-md text-xs font-bold transition-all', scope === 'mine' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>My Tasks</button>
            </div>
          )}
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button onClick={() => setViewMode('kanban')} className={cn('px-4 py-1.5 rounded-md text-xs font-bold transition-all', viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}><span className="material-symbols-outlined text-[14px] align-middle mr-1">view_kanban</span>Kanban</button>
            <button onClick={() => setViewMode('list')} className={cn('px-4 py-1.5 rounded-md text-xs font-bold transition-all', viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}><span className="material-symbols-outlined text-[14px] align-middle mr-1">view_list</span>List</button>
          </div>
        </div>
        <AdvancedFilterBar dateLabel="Created" statusOptions={['Research', 'Concept', 'Prototype', 'Testing', 'Production', 'Deployed']} ownerOptions={['Pius Odong', 'Florence Adong', 'Isaac Tumusiime', 'Grace Nakamya']} presets={[{ id: 'tp1', name: 'Stalled (>14d)' }, { id: 'tp2', name: 'Near completion' }]} onExport={(fmt) => handleAction(`Exporting ${fmt.toUpperCase()}`)} onSavePreset={(name) => handleAction(`Saved preset: ${name}`)} />
      </div>

      {/* Kanban */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {STAGES.map((stage) => {
            const stageProjects = projects.filter((p) => p.stage === stage.key);
            return (
              <div key={stage.key} className="flex flex-col">
                <div className={cn('rounded-t-xl px-3 py-2.5 flex items-center justify-between', CHIP[stage.color])}><span className="text-xs font-bold uppercase tracking-wider text-white">{stage.label}</span><span className="text-xs font-extrabold text-white bg-white/20 px-2 py-0.5 rounded-full">{stageProjects.length}</span></div>
                <div className="bg-slate-50 rounded-b-xl border border-slate-200 border-t-0 p-2 space-y-2 min-h-[200px]">
                  {stageProjects.length === 0 && <p className="text-xs text-slate-400 text-center py-8 italic">No projects</p>}
                  {stageProjects.map((p) => (
                    <div key={p.id} onClick={() => navigate(`/innovations/${p.id}`)} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                      <p className="text-sm font-bold text-slate-900 mb-1 group-hover:text-aims-navy transition-colors">{p.title}</p>
                      <p className="text-[10px] text-slate-500 mb-2">Lead: {p.lead}</p>
                      <div className="mb-2"><div className="flex justify-between text-[10px] mb-0.5"><span className="font-semibold text-slate-500">Progress</span><span className="font-bold text-slate-900">{p.progress}%</span></div><div className="w-full bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-aims-green" style={{ width: `${p.progress}%` }} /></div></div>
                      <p className="text-[10px] text-slate-500 mb-2">{p.milestoneDone}/{p.milestoneCount} milestones</p>
                      <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-bold', getAgingColor(p.daysInStage))}><span className={cn('w-1.5 h-1.5 rounded-full', getAgingDot(p.daysInStage))} />{p.daysInStage}d in stage</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List */}
      {viewMode === 'list' && (
        <Section title={scope === 'mine' ? 'My Projects' : 'All Projects'} subtitle={scope === 'mine' ? 'Projects and tasks assigned to you' : 'Organization-wide innovation pipeline'}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-slate-200"><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Project</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Stage</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Lead</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Progress</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Milestones</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Days in Stage</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 font-bold text-slate-900">{p.title}</td>
                    <td className="py-2.5"><span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-aims-navy/10 text-aims-navy capitalize">{p.stage}</span></td>
                    <td className="py-2.5 text-slate-600">{p.lead}</td>
                    <td className="py-2.5"><div className="flex items-center gap-2"><div className="w-16 bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-aims-green" style={{ width: `${p.progress}%` }} /></div><span className="text-xs font-bold text-slate-900">{p.progress}%</span></div></td>
                    <td className="py-2.5 text-xs text-slate-600">{p.milestoneDone}/{p.milestoneCount}</td>
                    <td className="py-2.5"><span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border', getAgingColor(p.daysInStage))}><span className={cn('w-1.5 h-1.5 rounded-full', getAgingDot(p.daysInStage))} />{p.daysInStage}d</span></td>
                    <td className="py-2.5 text-right"><button onClick={() => navigate(`/innovations/${p.id}`)} className="text-xs font-bold text-aims-navy hover:underline">Open</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
}