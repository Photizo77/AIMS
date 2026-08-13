// src/components/layout/EmailBell.tsx
import { useState } from 'react';

const MOCK_EMAILS = [
  { id: 'e1', from: 'Peter Byamugisha', subject: 'Q3 Budget Approval Required', time: '10m ago', read: false },
  { id: 'e2', from: 'USAID Grants Portal', subject: 'New Funding Opportunity: Climate Resilience', time: '2h ago', read: false },
  { id: 'e3', from: 'Grace Aceng', subject: 'August Payslips Ready for Review', time: '5h ago', read: true },
];

export function EmailBell() {
  const [open, setOpen] = useState(false);
  const unread = MOCK_EMAILS.filter(e => !e.read).length;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
        <span className="material-symbols-outlined text-[22px]">mail</span>
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-aims-orange text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unread}</span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-20 overflow-hidden">
            <div className="p-3 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">Inbox</h3>
              <span className="text-[10px] font-bold text-aims-navy cursor-pointer">Mark all read</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {MOCK_EMAILS.map(email => (
                <div key={email.id} className={`p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer ${!email.read ? 'bg-blue-50/30' : ''}`}>
                  <div className="flex justify-between items-start mb-0.5">
                    <p className={`text-xs font-bold truncate ${!email.read ? 'text-slate-900' : 'text-slate-600'}`}>{email.from}</p>
                    <span className="text-[10px] text-slate-400 shrink-0">{email.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 truncate">{email.subject}</p>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-slate-100 text-center">
              <button className="text-xs font-bold text-aims-navy hover:underline">View All Emails</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}