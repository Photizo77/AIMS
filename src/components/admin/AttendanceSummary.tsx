// src/components/admin/AttendanceSummary.tsx
// ============================================================
// AIMS — CD Attendance (aggregate summary only)
// No export, no absence marking, no individual check-in timestamps.
// View aggregate trends + flag concerns for ED.
// ============================================================

import { openFlagForED } from '@/components/grants/FlagForEDModal';
import { attendanceGet } from '@/services/attendanceService';
import { useLiveData } from '@/lib/useLiveData';

export function AttendanceSummary() {
  useLiveData();
  const c = attendanceGet.counts();
  const history = attendanceGet.history();

  // Weekly presence trend — real history only (last 5 recorded days)
  const perDay = new Map<string, number>();
  history.forEach((h) => {
    if (h.status === 'present' || h.status === 'late') perDay.set(h.date, (perDay.get(h.date) ?? 0) + 1);
  });
  const trendDates = [...perDay.keys()].sort().slice(-5);
  const trend = trendDates.map((d) => ({
    label: new Date(d).toLocaleDateString('en-GB', { weekday: 'short' }),
    present: perDay.get(d) ?? 0,
  }));
  const maxTrend = trend.length > 0 ? Math.max(...trend.map((t) => t.present)) : 0;

  // Department punctuality — computed from today's real records
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRows = history.filter((h) => h.date === todayStr);
  const deptCounts = new Map<string, { present: number; late: number }>();
  todayRows.forEach((h) => {
    const cur = deptCounts.get(h.dept) ?? { present: 0, late: 0 };
    if (h.status === 'late') cur.late += 1; else cur.present += 1;
    deptCounts.set(h.dept, cur);
  });
  const livePunct = [...deptCounts.entries()].map(([dept, v]) => ({
    dept,
    pct: v.present + v.late > 0 ? Math.round((v.present / (v.present + v.late)) * 100) : 0,
  })).sort((a, b) => b.pct - a.pct);

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
          {trend.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400 italic bg-slate-50 rounded-xl border border-slate-100">No check-in history recorded yet — the trend appears automatically as staff check in.</div>
          ) : (
            <div className="flex items-end justify-between gap-3 h-40">
              {trend.map((t) => (
                <div key={t.label} className="flex-1 flex flex-col items-center justify-end h-full">
                  <span className="text-[10px] font-bold text-slate-600 mb-1">{t.present}</span>
                  <div className="w-full bg-aims-green/80 rounded-t-lg" style={{ height: `${(t.present / maxTrend) * 100}%` }} />
                  <span className="text-[10px] text-slate-400 mt-1">{t.label}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-slate-400 italic mt-2">Aggregate only — individual check-in timestamps are not shown at CD access level.</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">Department Punctuality (Summary)</h3>
          {livePunct.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400 italic bg-slate-50 rounded-xl border border-slate-100">No check-ins recorded today yet — punctuality appears here once staff check in.</div>
          ) : (
            <div className="space-y-3">
              {livePunct.map((d) => (
                <div key={d.dept}>
                  <div className="flex justify-between text-xs mb-1"><span className="font-bold text-slate-800">{d.dept}</span><span className="font-bold text-slate-900">{d.pct}%</span></div>
                  <div className="w-full bg-slate-100 rounded-full h-2"><div className={d.pct < 85 ? 'bg-aims-orange h-2 rounded-full' : 'bg-aims-green h-2 rounded-full'} style={{ width: `${d.pct}%` }} /></div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => openFlagForED({ recordLabel: 'Attendance — Finance department punctuality trend', sourceModule: 'attendance' })} className="mt-4 w-full py-2 border border-aims-orange/30 text-aims-orange text-xs font-bold rounded-lg hover:bg-aims-orange/10 flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">flag</span>Flag for ED
          </button>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 italic">CD attendance access: aggregate trends only. No export, no absence marking, no individual records.</p>
    </div>
  );
}
