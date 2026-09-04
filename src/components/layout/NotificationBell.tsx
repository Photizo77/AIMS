// src/components/layout/NotificationBell.tsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import type { NotificationType, NotificationPriority } from '@/types';

const TYPE_ICONS: Record<string, string> = { deadline: 'alarm', success: 'check_circle', info: 'info', error: 'error', approval: 'approval', warning: 'warning' };
const TYPE_COLORS: Record<string, string> = { deadline: 'text-aims-orange', success: 'text-aims-green', info: 'text-aims-navy', error: 'text-red-500', approval: 'text-blue-600', warning: 'text-yellow-600' };

const PRIORITY_CHIP: Record<NotificationPriority, { label: string; cls: string }> = {
  critical: { label: 'Critical', cls: 'bg-red-600 text-white' },
  high: { label: 'High', cls: 'bg-aims-orange text-white' },
  medium: { label: 'Medium', cls: 'bg-aims-navy/10 text-aims-navy' },
  low: { label: 'Low', cls: 'bg-slate-100 text-slate-400' },
};

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Notifications targeted at the current user (userId match, name match, or org-wide)
  const myNotifications = useMemo(
    () => notifications.filter((n) => !n.userId || n.userId === user?.id || n.recipientName === user?.name),
    [notifications, user?.id, user?.name]
  );

  // Grouped by date, preserving newest-first order
  const groups = useMemo(() => {
    const map = new Map<string, typeof myNotifications>();
    myNotifications.forEach((n) => {
      const label = dayLabel(n.createdAt);
      const list = map.get(label);
      if (list) list.push(n); else map.set(label, [n]);
    });
    return [...map.entries()];
  }, [myNotifications]);

  const handleOpen = (id: string, link?: string) => {
    markAsRead(id);
    setOpen(false);
    if (link) navigate(link);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors" aria-label={`Notifications (${unreadCount} unread)`}>
        <span className="material-symbols-outlined text-[22px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-aims-orange text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl border border-slate-200 shadow-xl z-20 overflow-hidden">
            <div className="p-3 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">Notifications{unreadCount > 0 && <span className="ml-1.5 text-[9px] font-bold text-aims-orange uppercase">({unreadCount} unread)</span>}</h3>
              <button onClick={markAllAsRead} className="text-[10px] font-bold text-aims-navy hover:underline">Mark all read</button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {myNotifications.length === 0 && (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-[36px] text-slate-300">notifications_none</span>
                  <p className="text-xs text-slate-400 mt-2">No notifications yet. Project handoffs, grant decisions and approvals will appear here.</p>
                </div>
              )}
              {groups.map(([label, items]) => (
                <div key={label}>
                  <p className="px-3 pt-2.5 pb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 sticky top-0 bg-slate-50/95 backdrop-blur-sm">{label}</p>
                  {items.map((n) => {
                    const chip = n.priority ? PRIORITY_CHIP[n.priority] : null;
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleOpen(n.id, n.link || n.actionUrl)}
                        className={cn('p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex gap-3', !n.read && 'bg-blue-50/40')}
                      >
                        <span className={cn('material-symbols-outlined text-[20px] mt-0.5 shrink-0', TYPE_COLORS[n.type as NotificationType] || 'text-slate-400')}>{TYPE_ICONS[n.type as NotificationType] || 'info'}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-aims-orange shrink-0" />}
                            <p className={cn('text-xs font-bold truncate', !n.read ? 'text-slate-900' : 'text-slate-600')}>{n.title}</p>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] text-slate-400">{formatTime(n.createdAt)}</span>
                            {chip && <span className={cn('text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase', chip.cls)}>{chip.label}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
