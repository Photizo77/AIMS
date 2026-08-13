// src/components/layout/NotificationBell.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';

const MOCK_NOTIFICATIONS = [
  { id: 'n1', title: 'Grant Deadline Alert', message: 'Community Land Rights closes in 7 days', type: 'deadline', read: false, time: '1h ago' },
  { id: 'n2', title: 'Payslip Approved', message: 'Your August payslip has been approved by ED', type: 'success', read: false, time: '3h ago' },
  { id: 'n3', title: 'New Feed Post', message: 'Grace Aceng posted in Administration', type: 'info', read: false, time: '5h ago' },
  { id: 'n4', title: 'Requisition Rejected', message: 'Office Supplies restock rejected by ED', type: 'error', read: true, time: '1d ago' },
];

const TYPE_ICONS: Record<string, string> = { deadline: 'alarm', success: 'check_circle', info: 'info', error: 'error', approval: 'approval', warning: 'warning' };
const TYPE_COLORS: Record<string, string> = { deadline: 'text-aims-orange', success: 'text-aims-green', info: 'text-aims-navy', error: 'text-red-500', approval: 'text-blue-600', warning: 'text-yellow-600' };

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const unread = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
        <span className="material-symbols-outlined text-[22px]">notifications</span>
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-aims-orange text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unread}</span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl border border-slate-200 shadow-xl z-20 overflow-hidden">
            <div className="p-3 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              <span className="text-[10px] font-bold text-aims-navy cursor-pointer">Mark all read</span>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {MOCK_NOTIFICATIONS.map(n => (
                <div key={n.id} className={`p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex gap-3 ${!n.read ? 'bg-blue-50/30' : ''}`}>
                  <span className={cn('material-symbols-outlined text-[20px] mt-0.5 shrink-0', TYPE_COLORS[n.type] || 'text-slate-400')}>{TYPE_ICONS[n.type] || 'info'}</span>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</p>
                    <p className="text-xs text-slate-500 truncate">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}