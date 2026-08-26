// src/components/admin/HRSummary.tsx
// ============================================================
// AIMS — CD HR & Admin Summary (consolidated, aggregate only)
// Headcount, contracts due, appraisal completion. No individual
// employee records, no payslip generation or access.
// ============================================================

import { openFlagForED } from '@/components/grants/FlagForEDModal';

const MOCK = {
  headcount: 142,
  departments: 8,
  contractsRenewing30d: 5,
  contractsExpiring90d: 3,
  appraisalsCompletion: 87,
  pendingAppraisals: 31,
  presentToday: 128,
  onboarding: 3,
  offboarding: 1,
};

export function HRSummary() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-navy p-4 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Headcount</p><p className="text-2xl font-extrabold text-slate-900 mt-1">{MOCK.headcount}</p><p className="text-[10px] text-slate-400 mt-0.5">across {MOCK.departments} departments</p></div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-orange p-4 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contracts Renewing (30d)</p><p className="text-2xl font-extrabold text-aims-orange mt-1">{MOCK.contractsRenewing30d}</p><p className="text-[10px] text-slate-400 mt-0.5">{MOCK.contractsExpiring90d} expiring within 90 days</p></div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-green p-4 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Appraisals Complete</p><p className="text-2xl font-extrabold text-aims-green mt-1">{MOCK.appraisalsCompletion}%</p><p className="text-[10px] text-slate-400 mt-0.5">{MOCK.pendingAppraisals} pending (Q3)</p></div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-mint p-4 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">People Movements</p><p className="text-2xl font-extrabold text-slate-900 mt-1">{MOCK.onboarding + MOCK.offboarding}</p><p className="text-[10px] text-slate-400 mt-0.5">{MOCK.onboarding} onboarding · {MOCK.offboarding} offboarding</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-3">Appraisal Completion by Department</h3>
          <div className="space-y-3">
            {[
              { dept: 'Development', pct: 95 },
              { dept: 'Operations', pct: 82 },
              { dept: 'Finance', pct: 65 },
              { dept: 'HR', pct: 100 },
              { dept: 'Grants', pct: 90 },
            ].map((d) => (
              <div key={d.dept}>
                <div className="flex justify-between text-xs mb-1"><span className="font-bold text-slate-800">{d.dept}</span><span className="font-bold text-slate-900">{d.pct}%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className={d.pct < 75 ? 'bg-aims-orange h-2 rounded-full' : 'bg-aims-green h-2 rounded-full'} style={{ width: `${d.pct}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-3">Workforce Indicators</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"><span className="text-xs font-bold text-slate-700">Present Today</span><span className="text-lg font-extrabold text-aims-navy">{MOCK.presentToday}</span></div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"><span className="text-xs font-bold text-slate-700">New Hires In Pipeline</span><span className="text-lg font-extrabold text-aims-green">{MOCK.onboarding}</span></div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"><span className="text-xs font-bold text-slate-700">Exits In Progress</span><span className="text-lg font-extrabold text-aims-orange">{MOCK.offboarding}</span></div>
          </div>
          <button onClick={() => openFlagForED({ recordLabel: 'HR & Admin — appraisal completion in Finance dept', sourceModule: 'hr' })} className="mt-4 w-full py-2 border border-aims-orange/30 text-aims-orange text-xs font-bold rounded-lg hover:bg-aims-orange/10 flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">flag</span>Flag HR Concern for ED
          </button>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 italic">CD HR access: consolidated summary only. No individual employee profiles, no payroll access.</p>
    </div>
  );
}
