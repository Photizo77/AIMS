// src/components/admin/HROverview.tsx
// ============================================================
// AIMS — HR & People Management · Dashboard landing (HR Admin /
// Company Admin / ED). Live workforce widgets (total employees,
// active today from attendance, leave requests pending, contract
// renewals due) plus the primary HR actions. Every count reads the
// real persisted services and re-renders on any data change.
// ============================================================

import { useNavigate } from 'react-router-dom';
import { useLiveData } from '@/lib/useLiveData';
import { cn } from '@/lib/utils';
import { ACTIVE_STAFF } from '@/data/roster';
import { getDirectoryEntries } from '@/services/employeeService';
import { attendanceGet } from '@/services/attendanceService';
import { leaveGet } from '@/services/leaveService';
import { contractGet } from '@/services/contractService';
import { openEmployeeOnboarding } from '@/components/hr/EmployeeOnboardingForm';

const TONE: Record<string, { chip: string; border: string; icon: string }> = {
  navy: { chip: 'bg-aims-navy/10 text-aims-navy', border: 'border-t-aims-navy', icon: 'text-aims-navy' },
  green: { chip: 'bg-aims-green/10 text-aims-green', border: 'border-t-aims-green', icon: 'text-aims-green' },
  orange: { chip: 'bg-aims-orange/10 text-aims-orange', border: 'border-t-aims-orange', icon: 'text-aims-orange' },
  mint: { chip: 'bg-aims-mint/30 text-aims-navy', border: 'border-t-aims-mint', icon: 'text-aims-navy' },
};

export function HROverview({ onGo }: { onGo: (tab: string) => void }) {
  const navigate = useNavigate();
  useLiveData(); // re-read all counts when any AIMS store writes

  const entries = getDirectoryEntries();
  const onboardingCount = entries.filter((e) => e.status === 'onboarding').length;
  const activeExtra = entries.filter((e) => e.status === 'active').length;
  const totalEmployees = ACTIVE_STAFF.length + activeExtra;

  const activeToday = attendanceGet.presence().filter((p) => p.mode === 'physical' || p.mode === 'remote').length;
  const pendingLeave = leaveGet.pending().length;
  const renewalsDue = contractGet().filter((c) => c.status === 'expiring' || c.status === 'expired').length;

  const widgets = [
    {
      key: 'employees', label: 'Total Employees', value: totalEmployees,
      sub: onboardingCount > 0 ? `${onboardingCount} new hire(s) in onboarding` : 'across all departments',
      icon: 'groups', tone: 'navy', action: () => onGo('directory'),
    },
    {
      key: 'today', label: 'Active Today', value: activeToday,
      sub: 'checked in now · attendance register', icon: 'schedule', tone: 'green',
      action: () => navigate('/attendance'),
    },
    {
      key: 'leave', label: 'Leave Requests Pending', value: pendingLeave,
      sub: 'awaiting review & decision', icon: 'event_available', tone: 'orange',
      action: () => onGo('leave'),
    },
    {
      key: 'renewals', label: 'Contract Renewals Due', value: renewalsDue,
      sub: 'expiring / expired on file · AI advice on Contracts', icon: 'description', tone: 'mint',
      action: () => onGo('contracts'),
    },
  ];

  const actions = [
    { key: 'add', title: 'Add New Employee', desc: 'Full employee form · documents · user account & credentials', icon: 'person_add', tone: 'navy', run: () => openEmployeeOnboarding() },
    { key: 'attendance', title: 'Manage Attendance', desc: 'Daily register · filters by department, role, person · CSV/PDF export', icon: 'fact_check', tone: 'green', run: () => navigate('/attendance') },
    { key: 'leave', title: 'Process Leave', desc: 'Review requests · check balance · approve / reject · notify employee', icon: 'event_available', tone: 'orange', run: () => onGo('leave') },
    { key: 'contracts', title: 'Contract Renewal', desc: 'AI renewal advice · HR review · generate contract · send for signature', icon: 'description', tone: 'mint', run: () => onGo('contracts') },
    { key: 'offboarding', title: 'Offboarding', desc: 'Exit checklist · equipment return · final payslip · access revocation', icon: 'person_remove', tone: 'navy', run: () => onGo('offboarding') },
  ];

  return (
    <div className="space-y-6">
      {/* Live workforce widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {widgets.map((w) => (
          <button key={w.key} onClick={w.action} className="text-left bg-white rounded-xl border border-slate-200 border-t-4 shadow-sm p-4 hover:shadow-md transition-shadow">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between gap-1">
              {w.label}
              <span className={cn('material-symbols-outlined text-[15px]', TONE[w.tone].icon)}>{w.icon}</span>
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{w.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{w.sub}</p>
          </button>
        ))}
      </div>

      {/* Select an action */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Select an Action</h3>
            <p className="text-xs text-slate-500 mt-0.5">Common HR workflows — each opens the matching panel or module</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((a) => (
            <button key={a.key} onClick={a.run} className="bg-white rounded-xl border border-slate-200 p-4 text-left hover:shadow-md hover:border-aims-navy/30 transition-all group">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', TONE[a.tone].chip)}>
                <span className={cn('material-symbols-outlined text-[20px]', TONE[a.tone].icon)}>{a.icon}</span>
              </div>
              <p className="text-sm font-extrabold text-slate-900 group-hover:text-aims-navy transition-colors">{a.title}</p>
              <p className="text-[11px] text-slate-500 mt-1">{a.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-slate-400 italic">
        Counts are live: roster + onboarding directory (employees) · aims_attendance presence (active today) · leave register (pending) · employment contracts (renewals). Load the demo dataset in Settings → Data Vault to populate sample records.
      </p>
    </div>
  );
}
