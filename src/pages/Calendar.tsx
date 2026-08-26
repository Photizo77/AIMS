// src/pages/Calendar.tsx
// ============================================================
// AIMS — Org-wide Calendar
// Aggregates grant deadlines, project milestones, leave and reorders
// into one view so the whole team plans from a single calendar.
// ============================================================

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { grantService } from '@/services/grantService';
import { innovationService } from '@/services/innovationService';

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  kind: 'grant' | 'milestone' | 'leave' | 'reorder';
  link?: string;
}

const STATIC_EVENTS: CalendarEvent[] = [
  { id: 'lv1', date: '2026-09-10', title: 'Annual Leave — Peter Byamugisha (10 days)', kind: 'leave' },
  { id: 'ro1', date: '2026-09-05', title: 'Reorder due — Toner Cartridges', kind: 'reorder' },
  { id: 'ro2', date: '2026-09-12', title: 'Reorder due — USB Dongles', kind: 'reorder' },
];

const KIND_STYLE: Record<CalendarEvent['kind'], { dot: string; label: string; cls: string }> = {
  grant: { dot: 'bg-aims-green', label: 'Grant deadline', cls: 'bg-aims-green/10 text-aims-green border-aims-green/20' },
  milestone: { dot: 'bg-aims-navy', label: 'Milestone', cls: 'bg-aims-navy/10 text-aims-navy border-aims-navy/20' },
  leave: { dot: 'bg-aims-orange', label: 'Leave', cls: 'bg-aims-orange/10 text-aims-orange border-aims-orange/20' },
  reorder: { dot: 'bg-purple-500', label: 'Reorder', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export function Calendar() {
  const navigate = useNavigate();
  const now = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);

  const events = useMemo<CalendarEvent[]>(() => {
    const list: CalendarEvent[] = [];
    grantService.getAllGrants().forEach((g) => {
      if (!['awarded', 'declined'].includes(g.stage)) {
        list.push({ id: `g-${g.id}`, date: g.deadline, title: `Deadline: ${g.title}`, kind: 'grant', link: `/grants/${g.id}` });
      }
    });
    innovationService.getAllProjects().forEach((p) => {
      p.milestones.forEach((m) => {
        list.push({ id: `m-${p.id}-${m.id}`, date: m.dueDate, title: `${m.title} — ${p.title}`, kind: 'milestone', link: `/innovations/${p.id}` });
      });
    });
    return [...list, ...STATIC_EVENTS].sort((a, b) => a.date.localeCompare(b.date));
  }, []);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const byDate = (d: string) => d.slice(0, 10);

  const eventsByDay: Record<string, CalendarEvent[]> = {};
  events.forEach((e) => {
    const key = byDate(e.date);
    (eventsByDay[key] = eventsByDay[key] ?? []).push(e);
  });

  const upcoming = events.filter((e) => e.date >= now.toISOString().slice(0, 10)).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Org Calendar</h1>
            <p className="text-base font-medium text-white">Grant deadlines, project milestones, leave & reorders — one view</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMonthOffset((o) => o - 1)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-bold">‹ Prev</button>
            <span className="text-sm font-bold text-white px-2">{viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => setMonthOffset((o) => o + 1)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-bold">Next ›</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month grid */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekday }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = eventsByDay[dateStr] ?? [];
              const isToday = dateStr === now.toISOString().slice(0, 10);
              return (
                <div key={day} className={cn('min-h-[84px] rounded-lg border p-1', isToday ? 'border-aims-navy bg-aims-navy/5' : 'border-slate-100')}>
                  <p className={cn('text-[10px] font-bold mb-1', isToday ? 'text-aims-navy' : 'text-slate-500')}>{day}</p>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <button key={e.id} onClick={() => e.link && navigate(e.link)} title={`${KIND_STYLE[e.kind].label}: ${e.title}`} className={cn('block w-full text-left text-[8px] font-bold truncate rounded px-1 py-0.5 border', KIND_STYLE[e.kind].cls)}>
                        {e.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && <p className="text-[8px] text-slate-400 pl-1">+{dayEvents.length - 3} more</p>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100">
            {Object.entries(KIND_STYLE).map(([k, s]) => (
              <span key={k} className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className={cn('w-2 h-2 rounded-full', s.dot)} />{s.label}</span>
            ))}
          </div>
        </div>

        {/* Upcoming list */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Upcoming</h3>
          <div className="space-y-2">
            {upcoming.map((e) => (
              <button key={e.id} onClick={() => e.link && navigate(e.link)} className="w-full flex items-start gap-2 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-left">
                <span className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', KIND_STYLE[e.kind].dot)} />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{e.title}</p>
                  <p className="text-[10px] text-slate-400">{e.date}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
