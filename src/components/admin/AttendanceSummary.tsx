// src/components/admin/AttendanceSummary.tsx
// ============================================================
// AIMS — CD Attendance (aggregate summary only)
// No export, no absence marking, no individual check-in timestamps.
// View aggregate trends + flag concerns for ED.
// ============================================================

import { openFlagForED } from '@/components/grants/FlagForEDModal';
import { attendanceGet } from '@/services/attendanceService';
import { useLiveData } from '@/lib/useLiveData';

const MOCK_TREND = [
  { label: 'Mon', present: 131 },
  { label: 'Tue', present: 129 },
  { label: 'Wed', present: 128 },
  { label: 'Thu', present: 126 },
  { label: 'Fri', present: 125 },
];
const MOCK_PUNCT = [
  { dept: 'Development', pct: 94 },
  { dept: 'Operations', pct: 87 },
  { dept: 'Finance', pct: 81 },
  { dept: 'Grants', pct: 90 },
  { dept: 'Innovation', pct: 92 },
];

export function AttendanceSummary() {
  useLiveData();
  const c = attendanceGet.counts();
  const trend = MOCK_TREND.map((t) => ({ ...t, present: t.present + (c.physical + c.remote - 12) }));
  const maxTrend = Math.max(...trend.map((t) => t.present));
  const livePunct = MOCK_PUNCT.map((d) => ({ ...d, pct: Math.min(100, Math.max(60, d.pct)) }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-green p-4 shadow-sm text-center"><p className="text-2xl font-extrabold text-slate-900">{c.physical + c.remote}</p><p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Present Today</p></div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-navy p-4 shadow-sm text-center"><p className="text-2xl font-extrabold text-slate-900">{c.remote}</p><p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Remote</p></div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-orange p-4 shadow-sm text-center"><p className="text-2xl font-extrabold text-aims-orange mt-0">{c.lateToday}</p><p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Late Arrivals</p></div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-mint p-4 shadow-sm text-center"><p className="text-2xl font-extrabold text-slate-900">{c.leave}</p><p className="text-[10px] font-bold text-slate-500 uppercase mt-1">On Leave</p></div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-red-500 p-4 shadow-sm text-center"><p className="text-2xl font-extrabold text-red-500">{c.absent}</p><p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Absent</p></div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-orange p-4 shadow-sm text-center"><p className="text-2xl font-extrabold text-aims-orange">{attendanceGet.violations().filter((v) => !v.resolved).length}</p><p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Geofence Failures</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">Weekly Presence Trend (Aggregate)</h3>
          <div className="flex items-end justify-between gap-3 h-40">
            {trend.map((t) => (
              <div key={t.label} className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="text-[10px] font-bold text-slate-600 mb-1">{t.present}</span>
                <div className="w-full bg-aims-green/80 rounded-t-lg" style={{ height: `${(t.present / maxTrend) * 100}%` }} />
                <span className="text-[10px] text-slate-400 mt-1">{t.label}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 italic mt-2">Aggregate only — individual check-in timestamps are not shown at CD access level.</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">Department Punctuality (Summary)</h3>
          <div className="space-y-3">
            {livePunct.map((d) => (
              <div key={d.dept}>
                <div className="flex justify-between text-xs mb-1"><span className="font-bold text-slate-800">{d.dept}</span><span className="font-bold text-slate-900">{d.pct}%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className={d.pct < 85 ? 'bg-aims-orange h-2 rounded-full' : 'bg-aims-green h-2 rounded-full'} style={{ width: `${d.pct}%` }} /></div>
              </div>
            ))}
          </div>
          <button onClick={() => openFlagForED({ recordLabel: 'Attendance — Finance department punctuality trend', sourceModule: 'attendance' })} className="mt-4 w-full py-2 border border-aims-orange/30 text-aims-orange text-xs font-bold rounded-lg hover:bg-aims-orange/10 flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">flag</span>Flag for ED
          </button>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 italic">CD attendance access: aggregate trends only. No export, no absence marking, no individual records.</p>
    </div>
  );
}
