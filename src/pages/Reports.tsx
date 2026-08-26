// src/pages/Reports.tsx
// ============================================================
// AIMS — Org-wide Report Generator (printable)
// Pulls grant pipeline, finance, HR and innovation metrics into one
// board/donor-ready summary.
// ============================================================

import { cn } from '@/lib/utils';
import { grantService } from '@/services/grantService';
import { innovationService } from '@/services/innovationService';
import { financeService } from '@/services/financeService';
import { cashFlowForecast } from '@/lib/aiEngine';
import { formatCurrency } from '@/data/grants';


export function Reports() {
  const grants = grantService.getAllGrants();
  const projects = innovationService.getAllProjects();
  const budgets = financeService.getBudgets();
  const forecast = cashFlowForecast();

  const awarded = grants.filter((g) => g.stage === 'awarded');
  const active = grants.filter((g) => !['awarded', 'declined'].includes(g.stage));
  const dueSoon = grants.filter((g) => new Date(g.deadline).getTime() - Date.now() < 7 * 86400000 && !['awarded', 'declined'].includes(g.stage));
  const stalled = projects.filter((p) => p.daysInStage > 14);
  const deployed = projects.filter((p) => p.stage === 'deployed');

  return (
    <div className="space-y-6">
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Organisation Report</h1>
          <p className="text-base font-medium text-white">Board & donor summary · generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <button onClick={() => window.print()} className="px-4 py-2 bg-white text-aims-navy text-xs font-bold rounded-lg hover:bg-slate-100 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">print</span>Print / Save PDF
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-green p-4 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase">Grants Awarded</p><p className="text-2xl font-extrabold text-slate-900 mt-1">{awarded.length}</p><p className="text-[10px] text-slate-400 mt-0.5">{formatCurrency(awarded.reduce((s, g) => s + (g.amountAwarded ?? 0), 0))} secured</p></div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-navy p-4 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase">Active Proposals</p><p className="text-2xl font-extrabold text-slate-900 mt-1">{active.length}</p><p className="text-[10px] text-slate-400 mt-0.5">{dueSoon.length} due within 7 days</p></div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-orange p-4 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase">Innovations</p><p className="text-2xl font-extrabold text-slate-900 mt-1">{projects.length}</p><p className="text-[10px] text-slate-400 mt-0.5">{deployed.length} deployed · {stalled.length} stalled</p></div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-mint p-4 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase">Cash Runway</p><p className="text-2xl font-extrabold text-slate-900 mt-1">{forecast.monthsOfRunway} mo</p><p className="text-[10px] text-slate-400 mt-0.5">{forecast.gapWarning ? '⚠ gap warning' : 'healthy'}</p></div>
      </div>

      {/* Grant portfolio */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-3">Grant Portfolio</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-slate-200"><th className="pb-2 font-bold text-slate-500 text-xs uppercase">Grant</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase">Funder</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase">Stage</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase">Requested</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase">Deadline</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {grants.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50">
                  <td className="py-2 font-bold text-slate-900">{g.title}</td>
                  <td className="py-2 text-slate-600 text-xs">{g.funder}</td>
                  <td className="py-2"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">{g.stage.replace('_', ' ')}</span></td>
                  <td className="py-2 text-slate-700 text-xs">{formatCurrency(g.amountRequested)}</td>
                  <td className="py-2 text-slate-600 text-xs">{g.deadline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget util */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-3">Budget Utilization by Department</h3>
          <div className="space-y-3">
            {budgets.map((b) => {
              const pct = Math.round((b.actual / b.budget) * 100);
              return (
                <div key={b.id}>
                  <div className="flex justify-between text-xs mb-1"><span className="font-bold text-slate-800">{b.dept}</span><span className={cn('font-bold', pct >= 90 ? 'text-red-500' : pct >= 75 ? 'text-aims-orange' : 'text-aims-green')}>{pct}%</span></div>
                  <div className="w-full bg-slate-100 rounded-full h-2"><div className={cn('h-2 rounded-full', pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-aims-orange' : 'bg-aims-green')} style={{ width: `${Math.min(100, pct)}%` }} /></div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400 italic mt-3">Cash flow: {forecast.detail}</p>
        </div>

        {/* Innovation portfolio */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-3">Innovation Portfolio</h3>
          <div className="space-y-2">
            {projects.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{p.title}</p>
                  <p className="text-[10px] text-slate-500">{p.stage} · {p.leadName} · {p.daysInStage}d in stage</p>
                </div>
                <span className="text-xs font-extrabold text-aims-navy shrink-0">{p.progressPercent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-slate-400">ARDHI Law and Policy Initiative · Internal Management System (AIMS) · Generated {new Date().toISOString()}</p>
    </div>
  );
}
