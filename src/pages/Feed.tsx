// src/pages/Feed.tsx
import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorDepartment: string;
  content: string;
  timestamp: string;
  channel: string;
  mentions: string[];
  attachment?: { name: string; type: string; size: string; url?: string };
  isImage?: boolean;
}

const CHANNELS = [
  { id: 'general', label: '# General', icon: 'tag' },
  { id: 'grants', label: '# Grants', icon: 'volunteer_activism' },
  { id: 'finance', label: '# Finance', icon: 'account_balance' },
  { id: 'hr', label: '# HR & Admin', icon: 'people' },
  { id: 'innovations', label: '# Innovations', icon: 'lightbulb' },
  { id: 'procurement', label: '# Procurement', icon: 'shopping_cart' },
  { id: 'research', label: '# Research', icon: 'science' },
];

const ALL_USERS = [
  { id: 'u-sarah', name: 'Sarah Aciro', role: 'GRANTS_MANAGER', dept: 'Grants' },
  { id: 'u-nassir', name: 'Nassir Mukiibi', role: 'ED', dept: 'Executive' },
  { id: 'u-chairman', name: 'Dr. Sarah Namukasa', role: 'CD', dept: 'Executive' },
  { id: 'u-pius', name: 'Pius Odong', role: 'INNOVATOR', dept: 'Innovation' },
  { id: 'u-florence', name: 'Florence Adong', role: 'INNOVATOR', dept: 'Research' },
  { id: 'u-david', name: 'David Okello', role: 'FINANCE', dept: 'Finance' },
  { id: 'u-grace', name: 'Grace Nakamya', role: 'COMPANY_ADMIN', dept: 'HR' },
  { id: 'u-isaac', name: 'Isaac Tumusiime', role: 'COMPANY_ADMIN', dept: 'Procurement' },
  { id: 'u-janet', name: 'Janet Apio', role: 'GRANT_WRITER', dept: 'Grants' },
];

const MOCK_MESSAGES: ChatMessage[] = [
  { id: 'm1', authorId: 'u-sarah', authorName: 'Sarah Aciro', authorRole: 'GRANTS_MANAGER', authorDepartment: 'Grants', content: 'Q3 grant pipeline updated. USAID Land Rights deadline confirmed for Sep 5. All compliance docs attached in Documents hub.', timestamp: '2026-08-22T09:30:00Z', channel: 'grants', mentions: [] },
  { id: 'm2', authorId: 'u-grace', authorName: 'Grace Nakamya', authorRole: 'COMPANY_ADMIN', authorDepartment: 'HR', content: 'Reminder: All staff must complete the updated leave policy acknowledgment by Friday. Link in Documents hub.', timestamp: '2026-08-22T08:45:00Z', channel: 'hr', mentions: [] },
  { id: 'm3', authorId: 'u-pius', authorName: 'Pius Odong', authorRole: 'INNOVATOR', authorDepartment: 'Innovation', content: 'Solar grain dryer prototype assembly complete! 🎉 Field testing starts next week with 5 farmer groups in Gulu.', timestamp: '2026-08-21T17:00:00Z', channel: 'innovations', mentions: [], attachment: { name: 'prototype-photos.zip', type: 'ZIP', size: '4.2 MB' } },
  { id: 'm4', authorId: 'u-david', authorName: 'David Okello', authorRole: 'FINANCE', authorDepartment: 'Finance', content: 'August expenditure report finalized. Net surplus UGX 350M. Full breakdown available in Finance module.', timestamp: '2026-08-21T15:20:00Z', channel: 'finance', mentions: [] },
  { id: 'm5', authorId: 'u-chairman', authorName: 'Dr. Sarah Namukasa', authorRole: 'CD', authorDepartment: 'Executive', content: 'Q2 Board minutes approved. Key action: all department heads submit Q3 budget revisions by Aug 25.', timestamp: '2026-08-21T11:30:00Z', channel: 'general', mentions: ['Nassir Mukiibi'] },
  { id: 'm6', authorId: 'u-florence', authorName: 'Florence Adong', authorRole: 'INNOVATOR', authorDepartment: 'Research', content: 'Weather station sensor specs finalized. Procurement request submitted for 15 units. Budget: UGX 8.5M.', timestamp: '2026-08-20T14:00:00Z', channel: 'innovations', mentions: [], attachment: { name: 'sensor-specs-v2.pdf', type: 'PDF', size: '890 KB' } },
  { id: 'm7', authorId: 'u-isaac', authorName: 'Isaac Tumusiime', authorRole: 'COMPANY_ADMIN', authorDepartment: 'Procurement', content: 'Vendor shortlist for field equipment procurement completed. 3 quotes received. Evaluation matrix shared with Finance.', timestamp: '2026-08-20T10:15:00Z', channel: 'procurement', mentions: [] },
  { id: 'm8', authorId: 'u-janet', authorName: 'Janet Apio', authorRole: 'GRANT_WRITER', authorDepartment: 'Grants', content: 'Youth Digital Literacy proposal draft ready for TL review. Sustainability section needs strengthening.', timestamp: '2026-08-19T16:30:00Z', channel: 'grants', mentions: ['Sarah Aciro'] },
  { id: 'm9', authorId: 'u-nassir', authorName: 'Nassir Mukiibi', authorRole: 'ED', authorDepartment: 'Executive', content: 'All department Q3 budget proposals received. Consolidated review underway. Final approval expected by Aug 28.', timestamp: '2026-08-19T09:00:00Z', channel: 'general', mentions: [] },
  { id: 'm10', authorId: 'u-grace', authorName: 'Grace Nakamya', authorRole: 'COMPANY_ADMIN', authorDepartment: 'HR', content: 'New hire onboarding: Mercy Atim (Research Assistant) starts Monday. Credentials being provisioned. Welcome her! 👋', timestamp: '2026-08-18T14:45:00Z', channel: 'hr', mentions: [] },
];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function getDateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (msgDate.getTime() === today.getTime()) return 'Today';
  if (msgDate.getTime() === yesterday.getTime()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function roleColor(role: string): string {
  if (role === 'CD') return 'bg-aims-orange';
  if (role === 'ED') return 'bg-aims-navy';
  if (role === 'COMPANY_ADMIN' || role === 'SYS_ADMIN') return 'bg-slate-600';
  return 'bg-aims-green';
}

export function Feed() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [activeChannel, setActiveChannel] = useState('general');
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const canSeeAll = ['CD', 'ED', 'COMPANY_ADMIN'].includes(user.role);
  const userDept = user.department.toLowerCase();

  const accessibleChannels = CHANNELS.filter((ch) => {
    if (ch.id === 'general') return true;
    if (canSeeAll) return true;
    return ch.id === userDept;
  });

  const filteredMessages = useMemo(() => {
    return MOCK_MESSAGES
      .filter((m) => {
        if (m.channel !== activeChannel) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return m.content.toLowerCase().includes(q) || m.authorName.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [activeChannel, searchQuery]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);

  // Simulate typing indicator
  useEffect(() => {
    const interval = setInterval(() => {
      const otherUsers = ALL_USERS.filter((u) => u.id !== user.id);
      const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
      setTypingUser(randomUser.name);
      setTimeout(() => setTypingUser(null), 3000);
    }, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Group messages by date
  const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
  let currentDate = '';
  for (const msg of filteredMessages) {
    const label = getDateLabel(msg.timestamp);
    if (label !== currentDate) {
      currentDate = label;
      groupedMessages.push({ date: label, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  }

  // Mention picker users
  const mentionUsers = useMemo(() => {
    const q = mentionFilter.toLowerCase();
    return ALL_USERS.filter((u) => u.id !== user.id && u.name.toLowerCase().includes(q));
  }, [mentionFilter, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessageText(val);
    // Detect @ trigger
    const lastAt = val.lastIndexOf('@');
    if (lastAt >= 0 && (lastAt === 0 || val[lastAt - 1] === ' ')) {
      const afterAt = val.slice(lastAt + 1);
      if (!afterAt.includes(' ')) {
        setMentionFilter(afterAt);
        setShowMentionPicker(true);
        return;
      }
    }
    setShowMentionPicker(false);
  };

  const insertMention = (name: string) => {
    const lastAt = messageText.lastIndexOf('@');
    const before = messageText.slice(0, lastAt);
    setMessageText(`${before}@${name} `);
    setShowMentionPicker(false);
    setMentionFilter('');
    inputRef.current?.focus();
  };

  const handleSend = () => {
    if (!messageText.trim()) return;
    showToast({ title: 'Message Sent', message: `Posted to #${activeChannel}`, type: 'success' });
    setMessageText('');
    setShowMentionPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentionPicker) {
      if (e.key === 'Escape') { setShowMentionPicker(false); return; }
      if (e.key === 'Enter' && mentionUsers.length > 0) { e.preventDefault(); insertMention(mentionUsers[0].name); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey && messageText.trim()) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* ── Channel Sidebar ── */}
      <div className="w-52 flex-shrink-0 border-r border-slate-200 bg-slate-50 p-3 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Channels</p>
        {accessibleChannels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => { setActiveChannel(ch.id); setSearchQuery(''); }}
            className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors', activeChannel === ch.id ? 'bg-aims-navy text-white' : 'text-slate-600 hover:bg-slate-200/50')}
          >
            <span className="material-symbols-outlined text-[16px]">{ch.icon}</span>
            <span className="truncate">{ch.label}</span>
          </button>
        ))}
        {!canSeeAll && (
          <div className="mt-4 px-3">
            <p className="text-[10px] text-slate-400 italic leading-relaxed">Showing your department + general channels only.</p>
          </div>
        )}
      </div>

      {/* ── Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0 bg-white">
          <div>
            <h2 className="text-sm font-bold text-slate-900 capitalize flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-slate-400">tag</span>{activeChannel}
            </h2>
            <p className="text-[10px] text-slate-500">{filteredMessages.length} messages • {accessibleChannels.find((c) => c.id === activeChannel)?.label}</p>
          </div>
          <div className="relative w-56">
            <span className="material-symbols-outlined text-slate-400 text-[16px] absolute left-2.5 top-1/2 -translate-y-1/2">search</span>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search in channel…" className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 bg-slate-50/30">
          {groupedMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <span className="material-symbols-outlined text-[48px] mb-3 text-slate-300">chat_bubble</span>
              <p className="text-sm italic">No messages yet. Start the conversation!</p>
            </div>
          )}
          {groupedMessages.map((group) => (
            <div key={group.date}>
              {/* Date Separator */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">{group.date}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {group.messages.map((msg, idx) => {
                const isMe = msg.authorId === user.id;
                const prevMsg = idx > 0 ? group.messages[idx - 1] : null;
                const showAvatar = !prevMsg || prevMsg.authorId !== msg.authorId || (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() > 300000);

                return (
                  <div key={msg.id} className={cn('flex gap-2 mb-1', isMe ? 'flex-row-reverse' : 'flex-row', !showAvatar && 'mt-0.5')}>
                    {/* Avatar */}
                    <div className="w-8 flex-shrink-0">
                      {showAvatar && !isMe && (
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white', roleColor(msg.authorRole))}>
                          {msg.authorName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                      )}
                    </div>

                    {/* Bubble */}
                    <div className={cn('max-w-[70%] min-w-[120px]', isMe ? 'items-end' : 'items-start')}>
                      {showAvatar && !isMe && (
                        <div className="flex items-baseline gap-2 mb-0.5 ml-1">
                          <span className="text-[11px] font-bold text-slate-900">{msg.authorName}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{msg.authorRole.replace('_', ' ')}</span>
                        </div>
                      )}
                      <div className={cn('px-3 py-2 rounded-2xl text-sm leading-relaxed', isMe ? 'bg-aims-navy text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm')}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {/* Mentions */}
                        {msg.mentions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {msg.mentions.map((m) => (
                              <span key={m} className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', isMe ? 'bg-white/20 text-white' : 'bg-aims-navy/10 text-aims-navy')}>@{m}</span>
                            ))}
                          </div>
                        )}
                        {/* Attachment */}
                        {msg.attachment && (
                          <div className={cn('mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors', isMe ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-slate-50 border-slate-200 hover:bg-slate-100')}>
                            <span className={cn('material-symbols-outlined text-[16px]', isMe ? 'text-white/80' : 'text-slate-400')}>
                              {msg.attachment.type === 'PDF' ? 'picture_as_pdf' : msg.attachment.type === 'ZIP' ? 'folder_zip' : 'image'}
                            </span>
                            <div>
                              <p className={cn('text-xs font-bold', isMe ? 'text-white' : 'text-slate-900')}>{msg.attachment.name}</p>
                              <p className={cn('text-[10px]', isMe ? 'text-white/60' : 'text-slate-400')}>{msg.attachment.size}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className={cn('text-[9px] text-slate-400 mt-0.5', isMe ? 'text-right mr-1' : 'ml-1')}>{formatTime(msg.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Typing Indicator */}
          {typingUser && (
            <div className="flex gap-2 mb-2 mt-2">
              <div className="w-8 flex-shrink-0" />
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500 font-medium">{typingUser} is typing</span>
                  <span className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-4 py-3 border-t border-slate-200 bg-white flex-shrink-0 relative">
          {/* Mention Picker */}
          {showMentionPicker && mentionUsers.length > 0 && (
            <div className="absolute bottom-full left-4 right-4 mb-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 border-b border-slate-100">Mention someone</p>
              {mentionUsers.map((u) => (
                <button key={u.id} onClick={() => insertMention(u.name)} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-blue-50 transition-colors text-left">
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white', roleColor(u.role))}>{u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
                  <div>
                    <span className="font-bold text-slate-900">{u.name}</span>
                    <span className="text-slate-400 ml-1.5">{u.dept}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <button className="p-2.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors flex-shrink-0" title="Attach file">
              <span className="material-symbols-outlined text-[22px]">attach_file</span>
            </button>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={messageText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={`Message #${activeChannel}… (type @ to mention)`}
                className="w-full text-sm border border-slate-200 rounded-full px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-aims-navy/30 focus:bg-white transition-colors"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!messageText.trim()}
              className={cn('p-2.5 rounded-full transition-colors flex-shrink-0', messageText.trim() ? 'bg-aims-navy text-white hover:bg-aims-navy/90 shadow-md' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}
            >
              <span className="material-symbols-outlined text-[22px]">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}