// src/pages/Reports.tsx
// ============================================================
// AIMS — Org-wide Report Generator (printable, visual).
// Pulls grant pipeline, finance, HR and innovation metrics into one
// board/donor-ready summary. Every headline number is paired with a
// graphic: donut composition, column charts, stat bars and KPI rings,
// so the report reads at a glance and prints cleanly to PDF.
// ============================================================

import { useLiveData } from '@/lib/useLiveData';
import { grantService } from '@/services/grantService';
import { innovationService, isExecutingProject } from '@/services/innovationService';
import { financeService } from '@/services/financeService';
import { cashFlowForecast } from '@/lib/aiEngine';
import { formatCurrency, GRANT_STAGES, daysUntil } from '@/data/grants';
import { ACTIVE_STAFF } from '@/data/roster';
import { getDirectoryEntries } from '@/services/employeeService';
import { inventoryGet } from '@/services/inventoryService';
import { contractGet } from '@/services/contractService';
import { userOpsGet } from '@/services/userOpsService';
import {
  ChartLegend, ColumnChart, DonutChart, ProgressRing, ReportPanel, StatBar,
  type ChartDatum,
} from '@/components/ui/Charts';

const STAGE_COLOR: Record<string, ChartDatum['color']> = {
  identified: 'mint', drafting: 'orange', submitted: 'navy',
  under_review: 'red', awarded: 'green', declined: 'slate',
};

export function Reports() {
  useLiveData(); // live — the report re-derives whenever any store changes

  const grants = grantService.getAllGrants();
  const projects = innovationService.getAllProjects().filter(isExecutingProject);
  const budgets = financeService.getBudgets();
  const income = financeService.getIncome();
  const expenses = financeService.getExpenses();
  const forecast = cashFlowForecast();
  const roster = [...ACTIVE_STAFF, ...getDirectoryEntries()];
  const contracts = contractGet();
  const hires = userOpsGet.onboardees();
  const assets = inventoryGet.assets();

  const awarded = grants.filter((g) => g.stage === 'awarded');
  const declined = grants.filter((g) => g.stage === 'declined');
  const active = grants.filter((g) => !['awarded', 'declined'].includes(g.stage));
  const dueSoon = active.filter((g) => daysUntil(g.deadline) <= 7);
  const stalled = projects.filter((p) => p.daysInStage > 14);
  const deployed = projects.filter((p) => p.stage === 'deployed');
  const securedValue = awarded.reduce((s, g) => s + (g.amountAwarded ?? 0), 0);
  const pipelineValue = active.reduce((s, g) => s + g.amountRequested, 0);
  const totalIncome = financeService.totalIncome();
  const totalExpense = financeService.totalExpense();
  const net = totalIncome - totalExpense;
  const decided = awarded.length + declined.length;
  const winRate = decided > 0 ? Math.round((awarded.length / decided) * 100) : 0;
  const utilPct = budgets.length > 0
    ? Math.round(budgets.reduce((s, b) => s + (b.budget > 0 ? Math.min(100, (b.actual / b.budget) * 100) : 0), 0) / budgets.length)
    : 0;
  const onboardingOpen = hires.filter((h) => h.steps.some((s) => !s.done)).length;
  const renewalsDue = contracts.filter((c) => c.status === 'expiring' || c.status === 'expired').length;

  // ── Chart datasets ──
  const compositionAll: ChartDatum[] = [
    { label: 'Awarded', value: awarded.length, color: 'green' },
    { label: 'Active pipeline', value: active.length, color: 'navy' },
    { label: 'Declined', value: declined.length, color: 'slate' },
  ];
  const grantComposition = compositionAll.filter((d) => d.value > 0);

  const stageBars: ChartDatum[] = GRANT_STAGES.map((s) => ({
    label: s.label.split(' ')[0],
    value: grants.filter((g) => g.stage === s.key).length,
    color: STAGE_COLOR[s.key] ?? 'navy',
  }));

  const deptCounts = Array.from(
    roster.reduce((map, person) => map.set(person.department, (map.get(person.department) ?? 0) + 1), new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1]);
  const maxDept = Math.max(...deptCounts.map(([, n]) => n), 1);

  const innovationStages = innovationService.getStages();
  const innovationColumns: ChartDatum[] = innovationStages.map((s) => ({
    label: s.label.split(' ')[0],
    value: projects.filter((p) => p.stage === s.key).length,
    color: (s.color === 'mint' ? 'green' : s.color === 'navy' ? 'navy' : s.color === 'orange' ? 'orange' : s.color === 'green' ? 'green' : 'red') as ChartDatum['color'],
  }));

  const money = (n: number) => (n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`);

  const kpis = [
    { label: 'Grants Awarded', value: String(awarded.length), sub: `${formatCurrency(securedValue)} secured`, pct: winRate, ring: 'green' as const, icon: 'workspace_premium' },
    { label: 'Active Proposals', value: String(active.length), sub: `${dueSoon.length} due within 7 days`, pct: grants.length > 0 ? Math.round((active.length / grants.length) * 100) : 0, ring: 'navy' as const, icon: 'edit_note' },
    { label: 'Innovations', value: String(projects.length), sub: `${deployed.length} deployed · ${stalled.length} stalled`, pct: projects.length > 0 ? Math.round((deployed.length / projects.length) * 100) : 0, ring: 'orange' as const, icon: 'lightbulb' },
    { label: 'Cash Runway', value: `${forecast.monthsOfRunway} mo`, sub: forecast.gapWarning ? 'gap warning' : 'healthy', pct: Math.min(100, Math.round((forecast.monthsOfRunway / 12) * 100)), ring: forecast.gapWarning ? ('orange' as const) : ('green' as const), icon: 'account_balance' },
  ];

  return (
    <div className="space-y-6">
      {/* Header — slim, no hero banner */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Organisation Report</h1>
          <p className="text-xs text-slate-500 mt-0.5">Board &amp; donor summary · generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <button onClick={() => window.print()} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">print</span>Print / Save PDF
        </button>
      </div>

      {/* KPI cards with progress rings */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><span className="material-symbols-outlined text-[13px] text-slate-400">{k.icon}</span>{k.label}</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">{k.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{k.sub}</p>
            </div>
            <ProgressRing pct={k.pct} color={k.ring} />
          </div>
        ))}
      </div>

      {/* Grant portfolio composition + stage funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportPanel title="Grant Portfolio Composition" subtitle="Where every opportunity currently sits">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <DonutChart data={grantComposition} centerValue={String(grants.length)} centerLabel="Grants" />
            <div className="flex-1 w-full">
              <ChartLegend data={grantComposition} total={grants.length} />
              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                <div className="p-2 bg-aims-green/5 rounded-lg border border-aims-green/20">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Secured</p>
                  <p className="text-sm font-extrabold text-aims-green">{formatCurrency(securedValue)}</p>
                </div>
                <div className="p-2 bg-aims-navy/5 rounded-lg border border-aims-navy/20">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Pipeline</p>
                  <p className="text-sm font-extrabold text-aims-navy">{formatCurrency(pipelineValue)}</p>
                </div>
              </div>
            </div>
          </div>
        </ReportPanel>

        <ReportPanel title="Pipeline by Stage" subtitle={`Count of proposals in each stage · win rate ${winRate}%`}>
          <ColumnChart data={stageBars} height={150} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span className="material-symbols-outlined text-red-500 text-[16px]">event</span>
              <div><p className="text-[9px] font-bold text-slate-500 uppercase">Due in 7 days</p><p className="text-sm font-extrabold text-slate-900">{dueSoon.length}</p></div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span className="material-symbols-outlined text-aims-green text-[16px]">check_circle</span>
              <div><p className="text-[9px] font-bold text-slate-500 uppercase">Decided</p><p className="text-sm font-extrabold text-slate-900">{decided}</p></div>
            </div>
          </div>
        </ReportPanel>
      </div>

      {/* Finance visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportPanel title="Income vs Expenditure" subtitle={`YTD · net ${net >= 0 ? '+' : '−'}${money(Math.abs(net))} · runway ${forecast.monthsOfRunway} months`}>
          <div className="space-y-2.5">
            <StatBar label="Total income" value={totalIncome} max={Math.max(totalIncome, totalExpense, 1)} display={money(totalIncome)} color="green" />
            <StatBar label="Total expenditure" value={totalExpense} max={Math.max(totalIncome, totalExpense, 1)} display={money(totalExpense)} color="orange" />
            <StatBar
              label="Net position"
              value={Math.abs(net)}
              max={Math.max(totalIncome, totalExpense, 1)}
              display={`${net >= 0 ? '+' : '−'}${money(Math.abs(net))}`}
              color={net >= 0 ? 'green' : 'red'}
              sub={forecast.gapWarning ? 'Burn exceeds inflow — new disbursements needed.' : 'Inflow covers current burn.'}
            />
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Income sources</p>
            <ColumnChart
              data={income.slice(0, 5).map((r, i) => ({ label: r.label.split(' ')[0], value: r.amount, color: (['green', 'navy', 'mint', 'orange', 'slate'] as ChartDatum['color'][])[i % 5], display: money(r.amount) }))}
              height={90}
            />
          </div>
          <div className="mt-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Expenditure lines</p>
            <ColumnChart
              data={expenses.slice(0, 6).map((r, i) => ({ label: r.label.split(' ')[0], value: r.amount, color: (['orange', 'navy', 'slate', 'green', 'red', 'mint'] as ChartDatum['color'][])[i % 6], display: money(r.amount) }))}
              height={90}
            />
          </div>
        </ReportPanel>

        <ReportPanel title="Budget Utilization by Department" subtitle={`Average ${utilPct}% used · orange marker = year-end forecast`}>
          {budgets.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-10 text-center">No department budgets recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {budgets.map((b) => {
                const pct = b.budget > 0 ? Math.round((b.actual / b.budget) * 100) : 0;
                const color: ChartDatum['color'] = pct >= 90 ? 'red' : pct >= 75 ? 'orange' : 'green';
                return (
                  <StatBar
                    key={b.id}
                    label={b.dept}
                    value={b.actual}
                    max={b.budget}
                    display={`${pct}%`}
                    color={color}
                    markerPct={b.forecastPct}
                    sub={`${money(b.actual)} of ${money(b.budget)} · forecast ${b.forecastPct}%`}
                  />
                );
              })}
            </div>
          )}
          <p className="text-[10px] text-slate-400 italic mt-3">{forecast.detail}</p>
        </ReportPanel>
      </div>

      {/* Innovation + people visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportPanel title="Innovation Pipeline" subtitle={`${projects.length} executing project(s) · ${stalled.length} stalled`}>
          <ColumnChart data={innovationColumns} height={120} />
          <div className="mt-4 space-y-2">
            {projects.slice(0, 5).map((p) => (
              <StatBar
                key={p.id}
                label={p.title}
                value={p.progressPercent}
                max={100}
                display={`${p.progressPercent}%`}
                color={p.daysInStage > 14 ? 'red' : p.daysInStage >= 7 ? 'orange' : 'green'}
                sub={`${p.stage} · ${p.leadName} · ${p.daysInStage}d in stage`}
              />
            ))}
            {projects.length === 0 && <p className="text-xs text-slate-400 italic py-6 text-center">No innovation projects recorded yet.</p>}
          </div>
        </ReportPanel>

        <ReportPanel title="People & Workforce" subtitle={`${roster.length} active staff · ${contracts.length} contracts · ${assets.length} assets`}>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase">Headcount</p><p className="text-lg font-extrabold text-slate-900">{roster.length}</p></div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase">Renewals due</p><p className="text-lg font-extrabold text-aims-orange">{renewalsDue}</p></div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase">Mid-onboarding</p><p className="text-lg font-extrabold text-aims-navy">{onboardingOpen}</p></div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[9px] font-bold text-slate-500 uppercase">Assets registered</p><p className="text-lg font-extrabold text-aims-green">{assets.length}</p></div>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Headcount by department</p>
          <div className="space-y-2">
            {deptCounts.map(([dept, count], i) => (
              <StatBar
                key={dept}
                label={dept}
                value={count}
                max={maxDept}
                display={`${count}`}
                color={(['navy', 'green', 'mint', 'orange', 'slate'] as ChartDatum['color'][])[i % 5]}
              />
            ))}
          </div>
        </ReportPanel>
      </div>

      {/* Grant portfolio table (print-friendly detail) */}
      <ReportPanel title="Grant Portfolio" subtitle="Full record set — prints with the report">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-slate-200"><th className="pb-2 font-bold text-slate-500 text-xs uppercase">Grant</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase">Funder</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase">Stage</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase">Requested</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase">Progress</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase">Deadline</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {grants.map((g) => {
                const total = g.milestones.length;
                const done = g.milestones.filter((m) => m.completed).length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <tr key={g.id} className="hover:bg-slate-50">
                    <td className="py-2 font-bold text-slate-900">{g.title}</td>
                    <td className="py-2 text-slate-600 text-xs">{g.funder}</td>
                    <td className="py-2"><span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">{g.stage.replace('_', ' ')}</span></td>
                    <td className="py-2 text-slate-700 text-xs">{formatCurrency(g.amountRequested)}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-aims-green" style={{ width: `${pct}%` }} /></div>
                        <span className="text-[10px] font-bold text-slate-700">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-2 text-slate-600 text-xs">{g.deadline}</td>
                  </tr>
                );
              })}
              {grants.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-xs text-slate-400 italic">No grants recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </ReportPanel>

      <p className="text-center text-[10px] text-slate-400">ARDHI Law and Policy Initiative · Internal Management System (AIMS) · Generated {new Date().toISOString()}</p>
    </div>
  );
}
