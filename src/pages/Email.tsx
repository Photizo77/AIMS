// src/pages/Email.tsx
import { useState, useRef, useEffect, useMemo } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { sendEmail } from '@/lib/email';
import { cn } from '@/lib/utils';

type Folder = 'inbox' | 'starred' | 'snoozed' | 'sent' | 'drafts' | 'important' | 'spam' | 'trash' | 'archive' | 'all';

const FOLDERS: { key: Folder; label: string; icon: string }[] = [
  { key: 'inbox', label: 'Inbox', icon: 'inbox' },
  { key: 'starred', label: 'Starred', icon: 'star' },
  { key: 'snoozed', label: 'Snoozed', icon: 'schedule' },
  { key: 'sent', label: 'Sent', icon: 'send' },
  { key: 'drafts', label: 'Drafts', icon: 'drafts' },
  { key: 'important', label: 'Important', icon: 'label_important' },
  { key: 'spam', label: 'Spam', icon: 'report' },
  { key: 'trash', label: 'Trash', icon: 'delete' },
  { key: 'all', label: 'All Mail', icon: 'all_inbox' },
];

interface EmailMessage {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
  starred: boolean;
  folder: Folder;
  labels: string[];
  hasAttachment: boolean;
  threadId: string;
}

const MOCK_EMAILS: EmailMessage[] = [
  { id: 'e1', from: 'Sarah Aciro', fromEmail: 'sarah@ardhi.org.ug', to: 'info@ardhi.org.ug', subject: 'Q3 Grant Pipeline Update', body: 'Attached is the updated Q3 grant pipeline with revised timelines for the USAID and EU submissions. Please review before Friday.\n\nKey changes:\n- Land Rights doc deadline moved to Sep 5\n- Climate-Smart Farming budget revised upward by 12%\n- New Mastercard Foundation opportunity identified', timestamp: '2026-08-22T09:15:00Z', read: false, starred: true, folder: 'inbox', labels: ['grants', 'urgent'], hasAttachment: true, threadId: 't1' },
  { id: 'e2', from: 'HR Department', fromEmail: 'hr@ardhi.org.ug', to: 'info@ardhi.org.ug', subject: 'August Payroll Confirmation', body: 'Payroll batch PAY-089 has been processed. Total disbursement: UGX 186M for 142 employees. Payslips have been generated and are awaiting ED authorization.', timestamp: '2026-08-22T08:30:00Z', read: false, starred: false, folder: 'inbox', labels: ['hr', 'payroll'], hasAttachment: false, threadId: 't2' },
  { id: 'e3', from: 'Pius Odong', fromEmail: 'pius@ardhi.org.ug', to: 'info@ardhi.org.ug', subject: 'Solar Grain Dryer Prototype Photos', body: 'Hi team,\n\nFirst prototype assembly is complete. Attaching photos of the thermal collector unit and airflow chamber. Field testing begins next week with 5 farmer groups in Gulu.\n\nRegards,\nPius', timestamp: '2026-08-21T16:45:00Z', read: true, starred: false, folder: 'inbox', labels: ['innovations'], hasAttachment: true, threadId: 't3' },
  { id: 'e4', from: 'Dr. Sarah Namukasa', fromEmail: 'chairman@ardhi.org.ug', to: 'info@ardhi.org.ug', subject: 'Board Meeting Minutes — Q2 Approved', body: 'The Q2 board meeting minutes have been reviewed and approved. Key action items:\n\n1. ED to finalize Q3 budget consolidation by Aug 25\n2. Grants team to submit Land Rights proposal by Sep 5\n3. Innovation pipeline review scheduled for Sep 10\n\nPlease ensure all department heads acknowledge receipt.', timestamp: '2026-08-21T11:00:00Z', read: true, starred: true, folder: 'inbox', labels: ['governance', 'board'], hasAttachment: true, threadId: 't4' },
  { id: 'e5', from: 'Florence Adong', fromEmail: 'florence@ardhi.org.ug', to: 'info@ardhi.org.ug', subject: 'Weather Station Sensor Procurement', body: 'Budget allocation for sensor procurement phase needs clarification. Current estimate is UGX 8.5M for 15 units. Can we schedule a brief call to align on specs?', timestamp: '2026-08-20T14:20:00Z', read: true, starred: false, folder: 'inbox', labels: ['innovations', 'procurement'], hasAttachment: false, threadId: 't5' },
  { id: 'e6', from: 'info@ardhi.org.ug', fromEmail: 'info@ardhi.org.ug', to: 'sarah@ardhi.org.ug', subject: 'Re: Q3 Grant Pipeline Update', body: 'Thanks Sarah. Reviewed and noted. The revised timelines look feasible. Please proceed with the USAID submission prep.\n\nBest regards', timestamp: '2026-08-22T10:00:00Z', read: true, starred: false, folder: 'sent', labels: ['grants'], hasAttachment: false, threadId: 't1' },
  { id: 'e7', from: 'info@ardhi.org.ug', fromEmail: 'info@ardhi.org.ug', to: 'hr@ardhi.org.ug', subject: 'Draft: Q3 Staffing Plan', body: 'Draft staffing plan for Q3 attached. Includes 3 new positions:\n- Research Assistant (Land Rights)\n- Field Coordinator (Gulu)\n- Data Entry Clerk\n\nPending budget approval.', timestamp: '2026-08-19T09:00:00Z', read: true, starred: false, folder: 'drafts', labels: ['hr'], hasAttachment: true, threadId: 't6' },
];

const KNOWN_CONTACTS = Array.from(new Set(MOCK_EMAILS.flatMap((e) => [e.fromEmail, e.to]))).filter(Boolean);

const EMOJI_LIST = ['😀','😊','👍','🎉','✅','⚠️','🔥','💡','📎','📧','🙏','👋','✨','🚀','💪','❤️','😢','🤔','👀','📌'];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (msgDate.getTime() === today.getTime()) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (msgDate.getTime() === yesterday.getTime()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' at ' + new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function AutocompleteEmailInput({ label, value, onChange, contacts }: { label: React.ReactNode; value: string; onChange: (val: string) => void; contacts: string[] }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const filtered = useMemo(() => {
    if (!value.trim()) return contacts.slice(0, 8);
    const q = value.toLowerCase();
    return contacts.filter((c) => c.toLowerCase().includes(q)).slice(0, 8);
  }, [value, contacts]);

  useEffect(() => { setHighlightIndex(0); }, [filtered]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && filtered.length > 0) { e.preventDefault(); onChange(filtered[highlightIndex]); setShowSuggestions(false); }
    else if (e.key === 'Escape') { setShowSuggestions(false); }
  };

  return (
    <div className="relative">
      <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setShowSuggestions(true); }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        onKeyDown={handleKeyDown}
        placeholder="Type email address…"
        className="w-full text-sm border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
      />
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
          {filtered.map((contact, i) => (
            <button
              key={contact}
              onMouseDown={(e) => { e.preventDefault(); onChange(contact); setShowSuggestions(false); }}
              className={cn('w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors', i === highlightIndex ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50')}
            >
              <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
              <span className="font-semibold">{contact}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function EmailPage() {
  const { showToast } = useNotifications();
  const [activeFolder, setActiveFolder] = useState<Folder>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [emails, setEmails] = useState<EmailMessage[]>(MOCK_EMAILS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [undoSendVisible, setUndoSendVisible] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; size: string }[]>([]);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focus editor when composer opens
  useEffect(() => {
    if (showComposer && editorRef.current) {
      editorRef.current.focus();
    }
  }, [showComposer]);

  const filteredEmails = emails.filter((e) => {
    const matchesFolder = activeFolder === 'all' || e.folder === activeFolder || (activeFolder === 'starred' && e.starred) || (activeFolder === 'important' && e.labels.includes('urgent'));
    if (!matchesFolder) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (q.startsWith('from:')) return e.from.toLowerCase().includes(q.replace('from:', '').trim());
    if (q.startsWith('to:')) return e.to.toLowerCase().includes(q.replace('to:', '').trim());
    if (q.startsWith('subject:')) return e.subject.toLowerCase().includes(q.replace('subject:', '').trim());
    if (q.startsWith('has:attachment')) return e.hasAttachment;
    if (q.startsWith('is:unread')) return !e.read;
    if (q.startsWith('before:')) return new Date(e.timestamp) < new Date(q.replace('before:', '').trim());
    if (q.startsWith('after:')) return new Date(e.timestamp) > new Date(q.replace('after:', '').trim());
    if (q.startsWith('label:')) return e.labels.some((l) => l.toLowerCase().includes(q.replace('label:', '').trim()));
    return e.subject.toLowerCase().includes(q) || e.body.toLowerCase().includes(q) || e.from.toLowerCase().includes(q);
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const unreadCount = emails.filter((e) => e.folder === 'inbox' && !e.read).length;

  // ── Real mail actions ──
  const updateEmail = (id: string, patch: Partial<EmailMessage>) => {
    setEmails((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    setSelectedEmail((s) => (s && s.id === id ? { ...s, ...patch } : s));
  };
  const removeEmail = (id: string) => {
    setEmails((prev) => prev.filter((m) => m.id !== id));
    setSelectedEmail(null);
  };

  // ── Rich Text Commands ──
  const execFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments = Array.from(files).map((f) => ({
      name: f.name,
      size: f.size < 1024 * 1024 ? `${(f.size / 1024).toFixed(0)} KB` : `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
    showToast({ title: 'File Attached', message: `${newAttachments.length} file(s) added`, type: 'success' });
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const insertEmoji = (emoji: string) => {
    editorRef.current?.focus();
    document.execCommand('insertText', false, emoji);
    setShowEmojiPicker(false);
  };

  const handleSend = async () => {
    if (!composeTo.trim() || !composeSubject.trim()) {
      showToast({ title: 'Missing Fields', message: 'Recipient and subject are required.', type: 'error' });
      return;
    }
    const savedTo = composeTo;
    const savedSubject = composeSubject;
    const savedBody = editorRef.current?.innerText?.trim() ?? '';
    setShowComposer(false);
    setComposeTo('');
    setComposeSubject('');
    setAttachments([]);
    setShowEmojiPicker(false);
    if (editorRef.current) editorRef.current.innerHTML = '';
    setUndoSendVisible(true);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => { setUndoSendVisible(false); undoTimerRef.current = null; }, 50000);

    // Send through the Ardhi email system (SMTP via Netlify; local fallback when not configured)
    const result = await sendEmail({ to: savedTo, subject: savedSubject, body: savedBody });
    showToast({
      title: result.mode === 'smtp' ? 'Email Sent' : 'Email Queued (Local Mode)',
      message: `To: ${savedTo} • ${result.message}`,
      type: result.mode === 'smtp' ? 'success' : 'info',
    });
  };

  const handleUndoSend = () => {
    if (undoTimerRef.current) { clearTimeout(undoTimerRef.current); undoTimerRef.current = null; }
    setUndoSendVisible(false);
    setShowComposer(true);
    showToast({ title: 'Send Undone', message: 'Message recalled and restored to composer.', type: 'info' });
  };

  const handleQuickReply = () => {
    if (!selectedEmail) return;
    setComposeTo(selectedEmail.fromEmail);
    setComposeSubject(`Re: ${selectedEmail.subject}`);
    setShowComposer(true);
    // Set editor content after render
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = `<br><br><blockquote style="border-left:3px solid #cbd5e1;padding-left:12px;color:#64748b;margin:8px 0;">On ${formatFullDate(selectedEmail.timestamp)}, ${selectedEmail.from} wrote:<br>${selectedEmail.body.split('\n')[0]}</blockquote>`;
      }
    }, 50);
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* ── Folder Sidebar ── */}
      <div className="w-56 flex-shrink-0 border-r border-slate-200 bg-slate-50 p-3 space-y-0.5 overflow-y-auto">
        <button onClick={() => setShowComposer(true)} className="w-full py-2.5 mb-3 bg-aims-navy text-white text-sm font-bold rounded-full hover:bg-aims-navy/90 transition-colors flex items-center justify-center gap-2 shadow-md">
          <span className="material-symbols-outlined text-[18px] text-white">edit</span><span className="text-white">Compose</span>
        </button>
        {FOLDERS.map((f) => (
          <button key={f.key} onClick={() => { setActiveFolder(f.key); setSelectedEmail(null); }} className={cn('w-full flex items-center gap-3 px-4 py-2 rounded-r-full text-sm font-medium transition-colors', activeFolder === f.key ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-200/50')}>
            <span className="material-symbols-outlined text-[20px]">{f.icon}</span>
            <span className="flex-1 text-left">{f.label}</span>
            {f.key === 'inbox' && unreadCount > 0 && <span className="text-xs font-bold text-blue-700">{unreadCount}</span>}
          </button>
        ))}
        <div className="pt-3 mt-3 border-t border-slate-200">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 mb-2">Labels</p>
          {['grants', 'hr', 'innovations', 'governance', 'procurement', 'payroll'].map((label) => (
            <button key={label} onClick={() => setSearchQuery(`label:${label}`)} className="w-full flex items-center gap-3 px-4 py-1.5 rounded-r-full text-xs font-medium text-slate-500 hover:bg-slate-200/50 capitalize transition-colors">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Message List ── */}
      <div className={cn('flex-shrink-0 border-r border-slate-200 flex flex-col', selectedEmail ? 'w-96' : 'flex-1')}>
        <div className="p-3 border-b border-slate-200">
          <div className="relative">
            <span className="material-symbols-outlined text-slate-400 text-[18px] absolute left-3 top-1/2 -translate-y-1/2">search</span>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search mail (from:, subject:, label:, has:attachment)…" className="w-full text-sm border border-slate-200 rounded-lg pl-10 pr-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredEmails.length === 0 && <p className="text-sm text-slate-400 text-center py-12 italic">No messages found</p>}
          {filteredEmails.map((e) => (
            <div key={e.id} onClick={() => setSelectedEmail(e)} className={cn('px-4 py-3 border-b border-slate-100 cursor-pointer transition-colors', selectedEmail?.id === e.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : !e.read ? 'bg-white' : 'bg-slate-50/30', 'hover:bg-slate-50')}>
              <div className="flex items-center justify-between mb-1">
                <span className={cn('text-sm truncate max-w-[220px]', !e.read ? 'font-bold text-slate-900' : 'font-medium text-slate-600')}>{e.from}</span>
                <span className="text-[11px] text-slate-400 flex-shrink-0">{formatDate(e.timestamp)}</span>
              </div>
              <p className={cn('text-sm truncate mb-1', !e.read ? 'font-bold text-slate-800' : 'text-slate-600')}>{e.subject}</p>
              <p className="text-xs text-slate-400 truncate">{e.body.split('\n')[0]}</p>
              <div className="flex items-center gap-2 mt-1.5">
                {e.hasAttachment && <span className="material-symbols-outlined text-[14px] text-slate-400">attach_file</span>}
                {e.starred && <span className="material-symbols-outlined text-[14px] text-yellow-500">star</span>}
                {e.labels.slice(0, 2).map((l) => <span key={l} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 uppercase">{l}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Reading Pane ── */}
      {selectedEmail && (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-200">
            <button onClick={() => setSelectedEmail(null)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500"><span className="material-symbols-outlined text-[20px]">arrow_back</span></button>
            <button onClick={() => { updateEmail(selectedEmail.id, { folder: 'archive' }); setSelectedEmail(null); showToast({ title: 'Archived', message: selectedEmail.subject, type: 'success' }); }} className="p-2 rounded-full hover:bg-slate-100 text-slate-500" title="Archive"><span className="material-symbols-outlined text-[20px]">archive</span></button>
            <button onClick={() => { updateEmail(selectedEmail.id, { folder: 'spam' }); setSelectedEmail(null); showToast({ title: 'Moved to Spam', message: selectedEmail.subject, type: 'success' }); }} className="p-2 rounded-full hover:bg-slate-100 text-slate-500" title="Spam"><span className="material-symbols-outlined text-[20px]">report</span></button>
            <button onClick={() => { removeEmail(selectedEmail.id); showToast({ title: 'Deleted', message: 'Message moved out of your mailbox.', type: 'success' }); }} className="p-2 rounded-full hover:bg-slate-100 text-slate-500" title="Delete"><span className="material-symbols-outlined text-[20px]">delete</span></button>
            <div className="ml-auto flex items-center gap-1">
              <button onClick={() => updateEmail(selectedEmail.id, { read: false })} className="p-2 rounded-full hover:bg-slate-100 text-slate-500" title="Mark Unread"><span className="material-symbols-outlined text-[20px]">mark_email_unread</span></button>
              <button onClick={() => updateEmail(selectedEmail.id, { starred: !selectedEmail.starred })} className={cn('p-2 rounded-full hover:bg-slate-100', selectedEmail.starred ? 'text-yellow-500' : 'text-slate-500')} title="Star"><span className="material-symbols-outlined text-[20px]">{selectedEmail.starred ? 'star' : 'star_outline'}</span></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{selectedEmail.subject}</h2>
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-aims-navy text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{selectedEmail.from.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
              <div>
                <p className="text-sm font-bold text-slate-900">{selectedEmail.from} <span className="font-normal text-slate-500">&lt;{selectedEmail.fromEmail}&gt;</span></p>
                <p className="text-xs text-slate-500">to {selectedEmail.to}</p>
                <p className="text-xs text-slate-400 mt-0.5">{formatFullDate(selectedEmail.timestamp)}</p>
              </div>
            </div>
            {selectedEmail.labels.length > 0 && <div className="flex gap-1.5 mb-4">{selectedEmail.labels.map((l) => <span key={l} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 uppercase">{l}</span>)}</div>}
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-6">{selectedEmail.body}</div>
            {selectedEmail.hasAttachment && (
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Attachments</p>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                    <span className="material-symbols-outlined text-[20px] text-slate-400">description</span>
                    <div><p className="text-xs font-bold text-slate-900">document.pdf</p><p className="text-[10px] text-slate-400">245 KB</p></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="px-6 py-3 border-t border-slate-200 flex gap-2">
            <button onClick={handleQuickReply} className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-bold rounded-full hover:bg-slate-50 transition-colors flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">reply</span>Reply</button>
            <button onClick={() => { setComposeTo(selectedEmail.fromEmail); setComposeSubject(`Re: ${selectedEmail.subject}`); setShowComposer(true); }} className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-bold rounded-full hover:bg-slate-50 transition-colors flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">forward</span>Forward</button>
          </div>
        </div>
      )}

      {/* ── FULL-WINDOW COMPOSE OVERLAY ── */}
      {showComposer && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px] flex items-end justify-center sm:items-center">
          <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-2xl sm:mx-4 flex flex-col max-h-[90vh] sm:max-h-[80vh] animate-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-aims-navy rounded-t-xl">
              <h3 className="text-sm font-bold text-white">New Message</h3>
              <button onClick={() => setShowComposer(false)} className="p-1 rounded hover:bg-white/20 text-white/80 hover:text-white"><span className="material-symbols-outlined text-[18px]">close</span></button>
            </div>

            {/* Fields */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AutocompleteEmailInput label={<span className="font-bold text-slate-700">To</span>} value={composeTo} onChange={setComposeTo} contacts={KNOWN_CONTACTS} />
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input type="text" value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="Subject" className="w-full text-sm border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold" />
              </div>

              {/* ── Formatting Toolbar (FUNCTIONAL) ── */}
              <div className="flex items-center gap-0.5 border border-slate-200 rounded-lg px-1.5 py-1 bg-slate-50 flex-wrap">
                <button onMouseDown={(e) => { e.preventDefault(); execFormat('bold'); }} className="p-1.5 rounded hover:bg-slate-200 text-slate-700 font-bold text-sm min-w-[28px]" title="Bold (Ctrl+B)">B</button>
                <button onMouseDown={(e) => { e.preventDefault(); execFormat('italic'); }} className="p-1.5 rounded hover:bg-slate-200 text-slate-700 italic text-sm min-w-[28px]" title="Italic (Ctrl+I)">I</button>
                <button onMouseDown={(e) => { e.preventDefault(); execFormat('underline'); }} className="p-1.5 rounded hover:bg-slate-200 text-slate-700 underline text-sm min-w-[28px]" title="Underline (Ctrl+U)">U</button>
                <button onMouseDown={(e) => { e.preventDefault(); execFormat('strikeThrough'); }} className="p-1.5 rounded hover:bg-slate-200 text-slate-700 line-through text-sm min-w-[28px]" title="Strikethrough">S</button>
                <div className="w-px h-5 bg-slate-300 mx-1" />
                <button onMouseDown={(e) => { e.preventDefault(); execFormat('insertUnorderedList'); }} className="p-1.5 rounded hover:bg-slate-200 text-slate-600" title="Bullet List"><span className="material-symbols-outlined text-[18px]">format_list_bulleted</span></button>
                <button onMouseDown={(e) => { e.preventDefault(); execFormat('insertOrderedList'); }} className="p-1.5 rounded hover:bg-slate-200 text-slate-600" title="Numbered List"><span className="material-symbols-outlined text-[18px]">format_list_numbered</span></button>
                <div className="w-px h-5 bg-slate-300 mx-1" />
                <button onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }} className="p-1.5 rounded hover:bg-slate-200 text-slate-600" title="Attach File"><span className="material-symbols-outlined text-[18px]">attach_file</span></button>
                <button onMouseDown={(e) => { e.preventDefault(); execFormat('createLink', prompt('Enter URL:') || ''); }} className="p-1.5 rounded hover:bg-slate-200 text-slate-600" title="Insert Link"><span className="material-symbols-outlined text-[18px]">link</span></button>
                <div className="relative">
                  <button onMouseDown={(e) => { e.preventDefault(); setShowEmojiPicker(!showEmojiPicker); }} className={cn('p-1.5 rounded hover:bg-slate-200 text-slate-600', showEmojiPicker && 'bg-slate-200')} title="Emoji"><span className="material-symbols-outlined text-[18px]">emoji_emotions</span></button>
                  {showEmojiPicker && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl p-2 z-50 w-56 grid grid-cols-5 gap-1">
                      {EMOJI_LIST.map((emoji) => (
                        <button key={emoji} onMouseDown={(e) => { e.preventDefault(); insertEmoji(emoji); }} className="w-9 h-9 rounded hover:bg-slate-100 text-lg flex items-center justify-center transition-colors">{emoji}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-px h-5 bg-slate-300 mx-1" />
                <button onMouseDown={(e) => { e.preventDefault(); execFormat('removeFormat'); }} className="p-1.5 rounded hover:bg-slate-200 text-slate-600" title="Clear Formatting"><span className="material-symbols-outlined text-[18px]">format_clear</span></button>
              </div>

              {/* Hidden file input for attachments */}
              <input ref={fileInputRef} type="file" multiple onChange={handleFileAttach} className="hidden" />

              {/* ── Rich Text Editor (contentEditable) ── */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="w-full min-h-[200px] max-h-[400px] overflow-y-auto text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ lineHeight: '1.6' }}
                data-placeholder="Write your message…"
              />

              {/* Attachment Chips */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="material-symbols-outlined text-[16px] text-blue-500">attach_file</span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{att.name}</p>
                        <p className="text-[10px] text-slate-500">{att.size}</p>
                      </div>
                      <button onClick={() => removeAttachment(i)} className="ml-1 text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-[14px]">close</span></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-xl">
              <span className="text-[10px] text-slate-400">Sending as info@ardhi.org.ug</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowComposer(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Discard</button>
                <button onClick={handleSend} className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-full hover:bg-blue-700 transition-colors shadow-md flex items-center gap-1.5">Send<span className="material-symbols-outlined text-[16px]">send</span></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── UNDO SEND TOAST (50 seconds) ── */}
      {undoSendVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="text-sm font-medium">Message sent</span>
          <button onClick={handleUndoSend} className="text-sm font-bold text-blue-400 hover:text-blue-300 underline">Undo</button>
          <button onClick={() => { setUndoSendVisible(false); if (undoTimerRef.current) clearTimeout(undoTimerRef.current); }} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined text-[18px]">close</span></button>
        </div>
      )}
    </div>
  );
}