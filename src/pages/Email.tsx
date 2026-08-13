// src/pages/Email.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface EmailMessage {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  starred: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash';
  attachments?: { name: string; size: string; type: string }[];
}

const MOCK_EMAILS: EmailMessage[] = [
  { id: 'e1', from: 'Peter Byamugisha', fromEmail: 'ed@aims.org', to: 'grantsmanager@aims.org', subject: 'Q3 Budget Approval Required', body: 'Dear Sarah,\n\nPlease review and approve the Q3 budget submissions from all departments. The Board meeting is scheduled for September 5th and we need finalized figures by August 28th.\n\nKey priorities:\n1. ArdhiAgric expansion budget\n2. New staff onboarding costs\n3. SEFAA application fees\n\nRegards,\nPeter Byamugisha\nExecutive Director', date: '2026-08-13 09:15', read: false, starred: true, folder: 'inbox', attachments: [{ name: 'Q3_Budget_Summary.xlsx', size: '245 KB', type: 'spreadsheet' }] },
  { id: 'e2', from: 'USAID Uganda', fromEmail: 'grants@usaid.gov', to: 'grantsmanager@aims.org', subject: 'New Funding Opportunity: Climate Resilience Innovation', body: 'Dear ARDHI Team,\n\nWe are pleased to announce a new funding opportunity under the Climate Resilience Innovation Fund. Applications are due by September 30, 2026.\n\nEligible organizations must demonstrate:\n- 3+ years in climate adaptation programming\n- Annual operating budget exceeding UGX 500M\n- Active registration with NGO Bureau\n\nPlease find the full RFP attached.\n\nBest regards,\nDr. James Mukasa\nProgram Officer, USAID Uganda', date: '2026-08-13 07:30', read: false, starred: false, folder: 'inbox', attachments: [{ name: 'Climate_Resilience_RFP_2026.pdf', size: '1.2 MB', type: 'pdf' }] },
  { id: 'e3', from: 'Grace Aceng', fromEmail: 'admin@aims.org', to: 'ed@aims.org', subject: 'August Payslips Ready for Review', body: 'Good morning Peter,\n\nAll August 2026 payslips have been generated and are ready for your review and approval. Total payroll: UGX 28,450,000 for 14 active staff.\n\nPlease review in the AIMS Approvals module.\n\nThank you,\nGrace Aceng\nCompany Administrator', date: '2026-08-12 16:45', read: true, starred: false, folder: 'inbox' },
  { id: 'e4', from: 'Sarah Aciro', fromEmail: 'grantsmanager@aims.org', to: 'ed@aims.org', subject: 'RE: Land Rights Grant - Team Lead Review Complete', body: 'Peter,\n\nI have completed the team lead review for GRANT-LAND-2026-001 (Community Land Rights Documentation). The proposal passes all eligibility criteria. Detailed notes have been added in AIMS.\n\nForwarding to you for final ED approval.\n\nBest,\nSarah', date: '2026-08-12 14:20', read: true, starred: false, folder: 'inbox' },
  { id: 'e5', from: 'Nassir Mwanje', fromEmail: 'cd@aims.org', to: 'admin@aims.org', subject: 'Board Meeting Agenda - September 5', body: 'Grace,\n\nPlease circulate the following agenda for the September 5 Board meeting:\n\n1. FY2025-26 Financial Report\n2. Strategic Plan 2027-2031 Draft\n3. Institutional Identity Recommendations (Karule)\n4. SEFAA Application Status\n5. New Staff Approvals\n6. AOB\n\nPlease prepare board packs by August 30.\n\nNassir', date: '2026-08-11 11:00', read: true, starred: true, folder: 'inbox', attachments: [{ name: 'Board_Agenda_Sept2026.docx', size: '89 KB', type: 'document' }] },
];

type Folder = 'inbox' | 'sent' | 'drafts' | 'trash';

export function Email() {
  const { user } = useAuth();
  const [activeFolder, setActiveFolder] = useState<Folder>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = MOCK_EMAILS.filter(e => {
    const matchesFolder = e.folder === activeFolder;
    const matchesSearch = !searchQuery || e.subject.toLowerCase().includes(searchQuery.toLowerCase()) || e.from.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const unreadCount = MOCK_EMAILS.filter(e => e.folder === 'inbox' && !e.read).length;

  const FOLDERS: { id: Folder; label: string; icon: string }[] = [
    { id: 'inbox', label: 'Inbox', icon: 'inbox' },
    { id: 'sent', label: 'Sent', icon: 'send' },
    { id: 'drafts', label: 'Drafts', icon: 'draft' },
    { id: 'trash', label: 'Trash', icon: 'delete' },
  ];

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* TOOLBAR */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-aims-navy text-[24px]">mail</span>
          <h1 className="text-base font-bold text-slate-900">AIMS Mail</h1>
          {unreadCount > 0 && <span className="bg-aims-orange text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} new</span>}
        </div>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Search emails..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-aims-green/50 w-48" />
          <button onClick={() => setComposeOpen(true)} className="px-4 py-1.5 bg-aims-navy text-white rounded-lg text-xs font-bold hover:opacity-90 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">edit</span>Compose
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-48 border-r border-slate-200 bg-slate-50 shrink-0 overflow-y-auto hidden sm:block">
          <div className="p-2 space-y-0.5">
            {FOLDERS.map(f => (
              <button key={f.id} onClick={() => { setActiveFolder(f.id); setSelectedEmail(null); }} className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors', activeFolder === f.id ? 'bg-white text-aims-navy shadow-sm' : 'text-slate-600 hover:bg-slate-100')}>
                <span className="material-symbols-outlined text-[18px]">{f.icon}</span>
                {f.label}
                {f.id === 'inbox' && unreadCount > 0 && <span className="ml-auto bg-aims-orange text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Labels</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-600"><span className="w-2 h-2 rounded-full bg-red-500"></span>Urgent</div>
              <div className="flex items-center gap-2 text-xs text-slate-600"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Grants</div>
              <div className="flex items-center gap-2 text-xs text-slate-600"><span className="w-2 h-2 rounded-full bg-green-500"></span>Finance</div>
              <div className="flex items-center gap-2 text-xs text-slate-600"><span className="w-2 h-2 rounded-full bg-purple-500"></span>Board</div>
            </div>
          </div>
        </div>

        {/* EMAIL LIST */}
        <div className={cn('flex-1 overflow-y-auto border-r border-slate-200', selectedEmail ? 'hidden md:block md:w-80 md:flex-none' : '')}>
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <span className="material-symbols-outlined text-[48px] block mb-2">mail_lock</span>
              <p className="text-sm">No emails in this folder.</p>
            </div>
          ) : (
            <div>
              {filtered.map(email => (
                <button key={email.id} onClick={() => setSelectedEmail(email)} className={cn('w-full text-left p-3 border-b border-slate-100 hover:bg-slate-50 transition-colors', selectedEmail?.id === email.id ? 'bg-blue-50/50 border-l-2 border-l-aims-navy' : !email.read ? 'bg-white' : 'bg-slate-50/30')}>
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={cn('text-xs truncate max-w-[180px]', !email.read ? 'font-bold text-slate-900' : 'font-medium text-slate-600')}>{email.from}</p>
                    <span className="text-[10px] text-slate-400 shrink-0">{email.date.split(' ')[0]}</span>
                  </div>
                  <p className={cn('text-xs truncate mb-0.5', !email.read ? 'font-semibold text-slate-800' : 'text-slate-600')}>{email.subject}</p>
                  <p className="text-[10px] text-slate-400 truncate">{email.body.substring(0, 80)}...</p>
                  {email.attachments && <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400"><span className="material-symbols-outlined text-[12px]">attach_file</span>{email.attachments.length} attachment(s)</div>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* READING PANE */}
        {selectedEmail ? (
          <div className="flex-1 overflow-y-auto bg-white hidden md:block">
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-1">{selectedEmail.subject}</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-aims-mint flex items-center justify-center text-aims-green text-xs font-bold">{selectedEmail.from.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{selectedEmail.from}</p>
                      <p className="text-xs text-slate-500">{selectedEmail.fromEmail} • {selectedEmail.date}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 text-slate-400 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg"><span className="material-symbols-outlined text-[18px]">star</span></button>
                  <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><span className="material-symbols-outlined text-[18px]">reply</span></button>
                  <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                </div>
              </div>
              <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed mb-6">{selectedEmail.body}</div>
              {selectedEmail.attachments && (
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Attachments ({selectedEmail.attachments.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmail.attachments.map((att, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer">
                        <span className="material-symbols-outlined text-[18px] text-slate-400">{att.type === 'pdf' ? 'picture_as_pdf' : att.type === 'spreadsheet' ? 'table_chart' : 'description'}</span>
                        <div>
                          <p className="text-xs font-bold text-slate-700">{att.name}</p>
                          <p className="text-[10px] text-slate-400">{att.size}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-50 hidden md:flex">
            <div className="text-center text-slate-400">
              <span className="material-symbols-outlined text-[64px] block mb-3">mark_email_unread</span>
              <p className="text-sm font-semibold">Select an email to read</p>
            </div>
          </div>
        )}
      </div>

      {/* COMPOSE MODAL */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setComposeOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">New Message</h3>
              <button onClick={() => setComposeOpen(false)} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="To" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aims-green/50" />
              <input type="text" placeholder="Subject" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aims-green/50" />
              <textarea placeholder="Write your message..." rows={8} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aims-green/50 resize-none" />
              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><span className="material-symbols-outlined text-[18px]">attach_file</span></button>
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><span className="material-symbols-outlined text-[18px]">image</span></button>
                </div>
                <button className="px-6 py-2 bg-aims-navy text-white rounded-lg text-sm font-bold hover:opacity-90 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">send</span>Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}