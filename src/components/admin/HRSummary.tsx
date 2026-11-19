// src/components/admin/HRSummary.tsx
// ============================================================
// AIMS — CD HR & Admin Summary (consolidated, aggregate only)
// Headcount, contracts due, leave and onboarding flow. No individual
// employee records, no payslip generation or access.
// Every figure is derived from the live stores — zero when nothing is
// on file (the organisation starts empty).
// ============================================================

import { openFlagForED } from '@/components/grants/FlagForEDModal';
import { useLiveData } from '@/lib/useLiveData';
import { ACTIVE_STAFF } from '@/data/roster';
import { getDirectoryEntries } from '@/services/employeeService';
import { contractGet } from '@/services/contractService';
import { leaveGet } from '@/services/leaveService';
import { attendanceGet } from '@/services/attendanceService';
import { userOpsGet } from '@/services/userOpsService';

export function HRSummary() {
  useLiveData();

  const directory = getDirectoryEntries();
  const headcount = ACTIVE_STAFF.length + directory.length;
  const departments = Array.from(new Set([
    ...ACTIVE_STAFF.map((s) => s.department),
    ...directory.map((d) => d.department),
  ]));
  const contracts = contractGet();
  const renewing = contracts.filter((c) => c.status === 'expiring' || c.status === 'expired');
  const leavePending = leaveGet.pending();
  const presence = attendanceGet.presence();
  const presentToday = presence.filter((p) => p.mode === 'physical' || p.mode === 'remote').length;
  const pipeline = userOpsGet.onboardees();
  const onboarding = pipeline.filter((o) => o.steps.some((s) => !s.done)).length;
  const onboardingDone = userOpsGet.onboardees().filter((o) => o.completedAt).length;

  const byDept = departments.map((dept) => {
    const people = [...ACTIVE_STAFF.filter((s) => s.department === dept), ...directory.filter((d) => d.department === dept)];
    return { dept, count: people.length };
  }).sort((a, b) => b.count - a.count);
  const maxDept = Math.max(...byDept.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-navy p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Headcount</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{headcount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{headcount === 0 ? 'no employees on file yet' : `across ${departments.length} department(s)`}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-orange p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contracts Renewing</p>
          <p className="text-2xl font-extrabold text-aims-orange mt-1">{renewing.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{contracts.length === 0 ? 'no contracts on file' : `${contracts.length} contract(s) tracked`}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-green p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Leave Pending</p>
          <p className="text-2xl font-extrabold text-aims-green mt-1">{leavePending.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{leavePending.length === 0 ? 'nothing awaiting a decision' : 'awaiting approval'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-mint p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">People Movements</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{onboarding + onboardingDone}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{onboarding} onboarding · {onboardingDone} completed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-3">Headcount by Department</h3>
          <div className="space-y-3">
            {byDept.length === 0 && <p className="text-xs text-slate-400 italic py-6 text-center">No departments yet — they appear as employees are onboarded.</p>}
            {byDept.map((d) => (
              <div key={d.dept}>
                <div className="flex justify-between text-xs mb-1"><span className="font-bold text-slate-800">{d.dept}</span><span className="font-bold text-slate-900">{d.count}</span></div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-aims-green h-2 rounded-full" style={{ width: `${(d.count / maxDept) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-3">Workforce Indicators</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"><span className="text-xs font-bold text-slate-700">Present Today</span><span className="text-lg font-extrabold text-aims-navy">{presence.length === 0 ? '—' : `${presentToday}/${headcount}`}</span></div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"><span className="text-xs font-bold text-slate-700">New Hires In Pipeline</span><span className="text-lg font-extrabold text-aims-green">{onboarding}</span></div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"><span className="text-xs font-bold text-slate-700">Accounts With 2FA</span><span className="text-lg font-extrabold text-aims-orange">{userOpsGet.users().filter((u) => u.mfaEnabled).length}/{userOpsGet.users().length}</span></div>
          </div>
          <button onClick={() => openFlagForED({ recordLabel: 'HR & Admin — workforce indicators review', sourceModule: 'hr' })} className="mt-4 w-full py-2 border border-aims-orange/30 text-aims-orange text-xs font-bold rounded-lg hover:bg-aims-orange/10 flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">flag</span>Flag HR Concern for ED
          </button>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 italic">CD HR access: consolidated summary only. No individual employee profiles, no payroll access.</p>
    </div>
  );
}
