// src/components/admin/OffboardingTab.tsx
// ============================================================
// AIMS — Exit Management / Offboarding checklist (Company Admin)
// Used by HR & People Management and User Management.
// ============================================================

import { useState } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';

interface OffboardStep { id: string; label: string; done: boolean; detail?: string; blockedBy?: string }
interface Offboardee { id: string; name: string; exitDate: string; steps: OffboardStep[] }

const MOCK_OFFBOARDING: Offboardee[] = [
  {
    id: 'of1', name: 'Okello Komakech', exitDate: 'Sep 30',
    steps: [
      { id: 's1', label: 'Exit Interview', done: true, detail: 'Conducted by Grace Aceng · notes: positive departure' },
      { id: 's2', label: 'Department Clearance', done: true, detail: 'IT cleared (data removal confirmed) · HR cleared · Finance cleared' },
      { id: 's3', label: 'Final Settlement', done: true, detail: 'Final payslip UGX 1.2M · benefits UGX 0.5M (approved by ED Sep 29)' },
      { id: 's4', label: 'Asset Return', done: false, detail: 'Laptop LAP001 · Phone PHN002 · Access Card ARDI-12345 · Desk & Chair' },
      { id: 's5', label: 'Access Revocation', done: false, blockedBy: 'Asset Return', detail: 'Executes automatically once inventory confirms return' },
      { id: 's6', label: 'Final Deactivation', done: false, blockedBy: 'Access Revocation', detail: 'Account archived — never deleted' },
    ],
  },
];

function stepCount(steps: { done: boolean }[]): { done: number; total: number; pct: number } {
  const done = steps.filter((s) => s.done).length;
  return { done, total: steps.length, pct: Math.round((done / steps.length) * 100) };
}

export function OffboardingTab() {
  const { showToast } = useNotifications();
  const [offboardees, setOffboardees] = useState(MOCK_OFFBOARDING);

  const notify = (title: string, message: string, type: 'success' | 'info' | 'warning' = 'success') =>
    showToast({ title, message, type });

  const advanceStep = (ofId: string, stepId: string) => {
    const ob = offboardees.find((o) => o.id === ofId);
    if (!ob) return;
    const step = ob.steps.find((s) => s.id === stepId);
    if (!step || step.done) return;
    if (step.blockedBy) {
      const blocker = ob.steps.find((s) => s.label === step.blockedBy);
      if (blocker && !blocker.done) {
        notify('Step Blocked', `"${step.label}" awaits "${step.blockedBy}".`, 'warning');
        return;
      }
    }
    setOffboardees((prev) => prev.map((o) => (o.id === ofId ? { ...o, steps: o.steps.map((s) => (s.id === stepId ? { ...s, done: true } : s)) } : o)));
    const remaining = ob.steps.filter((s) => !s.done && s.id !== stepId).length;
    notify('Checklist Updated', `Step completed. ${remaining} step(s) remaining.`, 'success');
  };

  const completeAssetReturn = (ofId: string) => {
    advanceStep(ofId, 's4');
    notify('Assets Received', 'Assets confirmed returned — access revocation queued.', 'success');
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-slate-700">Employees Exiting: <span className="text-aims-orange">{offboardees.length}</span></p>
      {offboardees.map((ob) => {
        const { done, total, pct } = stepCount(ob.steps);
        return (
          <div key={ob.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-aims-orange text-white flex items-center justify-center font-bold text-sm">{ob.name[0]}</div>
                <div><p className="text-base font-extrabold text-slate-900">{ob.name}</p><p className="text-xs text-slate-500">Exit Date: {ob.exitDate} · System Administrator (IT)</p></div>
              </div>
              <div className="w-32"><div className="flex justify-between text-[10px] mb-0.5"><span className="font-semibold text-slate-500">Timeline</span><span className="font-bold text-slate-900">{done}/{total} steps ({pct}%)</span></div><div className="w-full bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-aims-orange" style={{ width: `${pct}%` }} /></div></div>
            </div>
            <div className="space-y-2">
              {ob.steps.map((s) => (
                <div key={s.id} className={cn('flex items-start gap-3 p-3 rounded-lg border', s.done ? 'bg-aims-green/5 border-aims-green/20' : 'bg-slate-50 border-slate-100')}>
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0', s.done ? 'bg-aims-green text-white' : 'bg-slate-200 text-slate-500')}>
                    <span className="material-symbols-outlined text-[14px]">{s.done ? 'check' : s.blockedBy ? 'lock' : 'circle'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-bold', s.done ? 'text-slate-500 line-through' : 'text-slate-900')}>{s.label}</p>
                    {s.detail && <p className="text-[10px] text-slate-500 mt-0.5">{s.detail}</p>}
                    {!s.done && s.blockedBy && <p className="text-[10px] font-bold text-aims-orange mt-0.5">Blocked — awaits "{s.blockedBy}"</p>}
                  </div>
                  {!s.done && (
                    <button onClick={() => advanceStep(ob.id, s.id)} className="text-[10px] font-bold text-aims-navy hover:underline shrink-0">{s.blockedBy ? 'Force Complete' : 'Mark Complete'}</button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2 flex-wrap">
              <button onClick={() => completeAssetReturn(ob.id)} className="px-3 py-1.5 bg-aims-green text-white text-[10px] font-bold rounded-lg hover:bg-aims-green/90">Confirm Asset Return</button>
              <button onClick={() => advanceStep(ob.id, 's5')} className="px-3 py-1.5 bg-aims-navy text-white text-[10px] font-bold rounded-lg hover:bg-aims-navy/90">Revoke Access</button>
              <button onClick={() => advanceStep(ob.id, 's6')} className="px-3 py-1.5 bg-slate-700 text-white text-[10px] font-bold rounded-lg hover:bg-slate-800">Archive Account</button>
              <button onClick={() => notify('Reminder Sent', 'Asset-return reminder re-sent to ' + ob.name + '.', 'info')} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-50">Resend Asset Return Reminder</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
