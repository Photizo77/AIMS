// src/pages/Feed.tsx
// ============================================================
// AIMS — Company Feed (interconnected across personas)
// Each role only sees the channels applicable to them:
//   ED            : every channel, full moderation
//   CD            : General (post-only) + Governance (full moderation)
//   COMPANY_ADMIN : General (post-only) + HR & Admin (full moderation)
//   FINANCE       : General (post-only) + Finance (full moderation)
//   GRANTS_*      : General (post-only) + Grants (full moderation)
//   INNOVATOR     : General (post-only) + Innovations (full moderation)
//   SYS_ADMIN     : General (post-only) + System (full moderation)
// Messages live in a shared store (persisted), so a post made by one
// persona appears for every other persona with access to that channel.
// @mentions notify the tagged person (bell + email).
// ============================================================

import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { ExecutiveBrief } from '@/components/ai/ExecutiveBrief';
import { ACTIVE_STAFF } from '@/data/roster';

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
  pinned?: boolean;
  edited?: boolean;
  attachment?: { name: string; type: string; size: string; url?: string };
  isImage?: boolean;
}

interface ChannelDef {
  id: string;
  label: string;
  icon: string;
  owner: string;
  description: string;
}

const CHANNELS: ChannelDef[] = [
  { id: 'general', label: '# General', icon: 'tag', owner: 'ED', description: 'Company-wide announcements — ED owns and moderates' },
  { id: 'governance', label: '# Governance', icon: 'account_balance', owner: 'CD', description: 'Governance & board matters — CD\'s channel' },
  { id: 'hr-admin', label: '# HR & Admin', icon: 'people', owner: 'COMPANY_ADMIN', description: 'People, HR and administration' },
  { id: 'finance', label: '# Finance', icon: 'account_balance', owner: 'FINANCE', description: 'Finance, budgets and disbursements' },
  { id: 'grants', label: '# Grants', icon: 'volunteer_activism', owner: 'GRANTS', description: 'Grants pipeline and proposals' },
  { id: 'innovations', label: '# Innovations', icon: 'lightbulb', owner: 'INNOVATIONS', description: 'Innovation projects and prototypes' },
  { id: 'system', label: '# System', icon: 'settings', owner: 'SYS_ADMIN', description: 'System operations and security' },
];

interface Person { id: string; name: string; role: string; dept: string }

// Unified staff roster — single source of truth for mentions and typing
const ALL_USERS: Person[] = ACTIVE_STAFF.map((s) => ({ id: s.id, name: s.name, role: s.role, dept: s.department }));

// ── Channel access rules ──
interface ChannelAccess { id: string; canPost: boolean; canModerate: boolean }

function channelAccessFor(role: string): ChannelAccess[] {
  const rules: Record<string, { canPost: boolean; canModerate: boolean }[]> = {
    ED: CHANNELS.map(() => ({ canPost: true, canModerate: true })),
    CD: [
      { canPost: true, canModerate: false }, // general — post only
      { canPost: true, canModerate: true },  // governance — CD's channel
    ],
    COMPANY_ADMIN: [
      { canPost: true, canModerate: false }, // general
      { canPost: true, canModerate: true },  // hr-admin
    ],
    FINANCE: [
      { canPost: true, canModerate: false }, // general
      { canPost: true, canModerate: true },  // finance
    ],
    GRANTS_MANAGER: [
      { canPost: true, canModerate: false }, // general
      { canPost: true, canModerate: true },  // grants
    ],
    GRANT_WRITER: [
      { canPost: true, canModerate: false }, // general
      { canPost: true, canModerate: true },  // grants
    ],
    INNOVATOR: [
      { canPost: true, canModerate: false }, // general
      { canPost: true, canModerate: true },  // innovations
    ],
    SYS_ADMIN: [
      { canPost: true, canModerate: false }, // general
      { canPost: true, canModerate: true },  // system
    ],
  };
  const access = rules[role] ?? [{ canPost: true, canModerate: false }];
  return access.map((a, i) => ({ ...a, id: CHANNELS[i].id }));
}

// ── Shared feed store (persisted, interconnected across personas) ──
const STORAGE_KEY = 'aims_feed_messages';

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ChatMessage[];
  } catch { /* ignore */ }
  return [];
}

const SEED: ChatMessage[] = [
  { id: 'm9', authorId: 'user-ed-001', authorName: 'Peter Byamugisha', authorRole: 'ED', authorDepartment: 'Executive', content: 'All department Q3 budget proposals received. Consolidated review underway. Final approval expected by Aug 28.', timestamp: '2026-08-25T09:00:00Z', channel: 'general', mentions: [] },
  { id: 'm5', authorId: 'user-cd-001', authorName: 'Nassir Mwanje', authorRole: 'CD', authorDepartment: 'Executive', content: 'Q2 Board minutes approved. Key action: all department heads submit Q3 budget revisions by Aug 25.', timestamp: '2026-08-25T11:30:00Z', channel: 'governance', mentions: ['Peter Byamugisha'] },
  { id: 'm10', authorId: 'user-admin-001', authorName: 'Grace Aceng', authorRole: 'COMPANY_ADMIN', authorDepartment: 'HR & Admin', content: 'New hire onboarding: Mercy Atim (Research Assistant) starts Monday. Credentials being provisioned. Welcome her!', timestamp: '2026-08-24T14:45:00Z', channel: 'hr-admin', mentions: [] },
  { id: 'm2', authorId: 'user-grace-n', authorName: 'Grace Nakamya', authorRole: 'COMPANY_ADMIN', authorDepartment: 'HR & Admin', content: 'Reminder: All staff must complete the updated leave policy acknowledgment by Friday. Link in Documents hub.', timestamp: '2026-08-24T08:45:00Z', channel: 'hr-admin', mentions: [] },
  { id: 'm4', authorId: 'user-finance-001', authorName: 'Amos Ojok', authorRole: 'FINANCE', authorDepartment: 'Finance', content: 'August expenditure report finalized. Net surplus UGX 350M. Full breakdown available in Finance module.', timestamp: '2026-08-24T15:20:00Z', channel: 'finance', mentions: [] },
  { id: 'm1', authorId: 'user-gm-001', authorName: 'Sarah Aciro', authorRole: 'GRANTS_MANAGER', authorDepartment: 'Grants', content: 'Q3 grant pipeline updated. USAID Land Rights deadline confirmed for Sep 5. All compliance docs attached in Documents hub.', timestamp: '2026-08-24T09:30:00Z', channel: 'grants', mentions: [] },
  { id: 'm8', authorId: 'user-gw-001', authorName: 'Janet Apio', authorRole: 'GRANT_WRITER', authorDepartment: 'Grants', content: 'Youth Digital Literacy proposal draft ready for TL review. Sustainability section needs strengthening.', timestamp: '2026-08-23T16:30:00Z', channel: 'grants', mentions: ['Sarah Aciro'] },
  { id: 'm3', authorId: 'user-innov-001', authorName: 'Pius Odong', authorRole: 'INNOVATOR', authorDepartment: 'Innovation', content: 'Solar grain dryer prototype assembly complete! Field testing starts next week with 5 farmer groups in Gulu.', timestamp: '2026-08-23T17:00:00Z', channel: 'innovations', mentions: [], attachment: { name: 'prototype-photos.zip', type: 'ZIP', size: '4.2 MB' } },
  { id: 'm6', authorId: 'u-florence', authorName: 'Florence Adong', authorRole: 'GRANT_WRITER', authorDepartment: 'Grants', content: 'Weather station sensor specs finalized. Procurement request submitted for 15 units. Budget: UGX 8.5M.', timestamp: '2026-08-22T14:00:00Z', channel: 'innovations', mentions: [], attachment: { name: 'sensor-specs-v2.pdf', type: 'PDF', size: '890 KB' } },
];

let feedMessages: ChatMessage[] = (() => {
  const loaded = loadMessages();
  return loaded.length > 0 ? loaded : SEED;
})();

const feedListeners = new Set<() => void>();
function persist(): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(feedMessages.slice(-200))); } catch { /* ignore */ }
  feedListeners.forEach((l) => l());
}
function useFeedMessages(): ChatMessage[] {
  const [, setV] = useState(0);
  useEffect(() => {
    const l = () => setV((v) => v + 1);
    feedListeners.add(l);
    return () => { feedListeners.delete(l); };
  }, []);
  return feedMessages;
}
function postFeedMessage(msg: ChatMessage): void {
  feedMessages = [...feedMessages, msg];
  persist();
}
function deleteFeedMessage(id: string): void {
  feedMessages = feedMessages.filter((m) => m.id !== id);
  persist();
}
function editFeedMessage(id: string, content: string): void {
  feedMessages = feedMessages.map((m) => (m.id === id ? { ...m, content, edited: true } : m));
  persist();
}
function togglePin(id: string): void {
  feedMessages = feedMessages.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m));
  persist();
}

let msgCounter = 0;
function nextMsgId(): string {
  msgCounter += 1;
  return `fm-${Date.now()}-${msgCounter}`;
}

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
  const { showToast, addNotification } = useNotifications();
  const messages = useFeedMessages();
  const [activeChannel, setActiveChannel] = useState<string>('general');
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const access = channelAccessFor(user.role);
  const accessibleChannels = CHANNELS.map((ch, i) => ({ ...ch, access: access[i] })).filter((c) => c.access);
  const activeDef = accessibleChannels.find((c) => c.id === activeChannel) ?? accessibleChannels[0];
  const activeAccess = activeDef?.access ?? { canPost: true, canModerate: false };
  const canPost = activeAccess.canPost;
  const canModerate = activeAccess.canModerate;

  const filteredMessages = useMemo(() => {
    return messages
      .filter((m) => {
        if (m.channel !== activeChannel) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return m.content.toLowerCase().includes(q) || m.authorName.toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, activeChannel, searchQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages, typingUser]);

  // Simulated typing indicator among users who can see this channel
  useEffect(() => {
    const interval = setInterval(() => {
      const eligible = ALL_USERS.filter((u) => u.id !== user.id && channelAccessFor(u.role).some((a) => a.id === activeChannel && a.canPost));
      if (eligible.length === 0) return;
      const randomUser = eligible[Math.floor(Math.random() * eligible.length)];
      setTypingUser(randomUser.name);
      setTimeout(() => setTypingUser(null), 3000);
    }, 15000);
    return () => clearInterval(interval);
  }, [user, activeChannel]);

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

  const mentionUsers = useMemo(() => {
    const q = mentionFilter.toLowerCase();
    return ALL_USERS.filter((u) => u.id !== user.id && u.name.toLowerCase().includes(q));
  }, [mentionFilter, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessageText(val);
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

  const extractMentions = (text: string): string[] => {
    const matches = text.match(/@([\w\s]+?)(?=\s@|\s$|$)/g) ?? [];
    return matches
      .map((m) => m.replace('@', '').trim())
      .filter((n) => ALL_USERS.some((u) => u.name.toLowerCase() === n.toLowerCase()));
  };

  const handleSend = () => {
    if (!messageText.trim() || !canPost) return;
    const mentioned = extractMentions(messageText);
    const msg: ChatMessage = {
      id: nextMsgId(),
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      authorDepartment: user.department,
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
      channel: activeChannel,
      mentions: mentioned,
    };
    postFeedMessage(msg);

    // Notify (bell + email) anyone mentioned
    mentioned.forEach((name) => {
      addNotification({
        title: `@${name} — mentioned in #${activeChannel}`,
        message: `${user.name}: "${msg.content.slice(0, 140)}"`,
        type: 'info',
        link: '/feed',
        actionUrl: '/feed',
        recipientName: name,
      });
    });

    showToast({ title: 'Message Posted', message: `Posted to ${activeDef.label}`, type: 'success' });
    setMessageText('');
    setShowMentionPicker(false);
  };

  const handleEditSave = () => {
    if (!editingMsg || !editText.trim()) return;
    editFeedMessage(editingMsg.id, editText.trim());
    showToast({ title: 'Message Edited', message: 'Your message was updated.', type: 'success' });
    setEditingMsg(null);
    setEditText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editingMsg) {
      if (e.key === 'Escape') { setEditingMsg(null); return; }
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave(); return; }
    }
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
    <div className="space-y-4">
      {/* AI Executive Brief — contextual summary of the whole system */}
      <ExecutiveBrief />

      <div className="flex h-[calc(100vh-19rem)] gap-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* ── Channel Sidebar (role-scoped) ── */}
      <div className="w-56 flex-shrink-0 border-r border-slate-200 bg-slate-50 p-3 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Channels</p>
        {accessibleChannels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => { setActiveChannel(ch.id); setSearchQuery(''); setEditingMsg(null); }}
            className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors', activeChannel === ch.id ? 'bg-aims-navy text-white' : 'text-slate-600 hover:bg-slate-200/50')}
          >
            <span className="material-symbols-outlined text-[16px]">{ch.icon}</span>
            <span className="truncate">{ch.label}</span>
            {ch.access.canModerate && <span className="ml-auto text-[8px] font-bold uppercase opacity-70">mod</span>}
          </button>
        ))}
        <div className="mt-4 px-3">
          <p className="text-[10px] text-slate-400 italic leading-relaxed">You can see {accessibleChannels.length} channel(s). General is post-only — {CHANNELS[0].owner} moderates it.</p>
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0 bg-white">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-slate-400">{activeDef.icon}</span>{activeDef.label}
            </h2>
            <p className="text-[10px] text-slate-500">{activeDef.description} • {filteredMessages.length} messages{canModerate ? ' • you moderate' : ''}</p>
          </div>
          <div className="relative w-56">
            <span className="material-symbols-outlined text-slate-400 text-[16px] absolute left-2.5 top-1/2 -translate-y-1/2">search</span>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search in channel…" className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 bg-slate-50/30">
          {filteredMessages.filter((m) => m.pinned).length > 0 && (
            <div className="mb-3 p-2.5 bg-aims-navy/5 border border-aims-navy/15 rounded-lg">
              <p className="text-[9px] font-bold text-aims-navy uppercase tracking-wider mb-1">📌 Pinned</p>
              {filteredMessages.filter((m) => m.pinned).map((m) => (
                <p key={m.id} className="text-xs text-slate-700"><strong>{m.authorName}:</strong> {m.content.slice(0, 120)}</p>
              ))}
            </div>
          )}

          {groupedMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <span className="material-symbols-outlined text-[48px] mb-3 text-slate-300">chat_bubble</span>
              <p className="text-sm italic">No messages yet. Start the conversation!</p>
            </div>
          )}
          {groupedMessages.map((group) => (
            <div key={group.date}>
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
                    <div className="w-8 flex-shrink-0">
                      {showAvatar && !isMe && (
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white', roleColor(msg.authorRole))}>
                          {msg.authorName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                      )}
                    </div>

                    <div className={cn('max-w-[70%] min-w-[120px]', isMe ? 'items-end' : 'items-start')}>
                      {showAvatar && !isMe && (
                        <div className="flex items-baseline gap-2 mb-0.5 ml-1">
                          <span className="text-[11px] font-bold text-slate-900">{msg.authorName}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{msg.authorRole.replace('_', ' ')}</span>
                          {msg.pinned && <span className="text-[9px] text-aims-navy">📌</span>}
                        </div>
                      )}
                      <div className={cn('px-3 py-2 rounded-2xl text-sm leading-relaxed', isMe ? 'bg-[#286b25] text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm')}>
                        {editingMsg?.id === msg.id ? (
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="w-full text-sm bg-slate-50 border border-aims-navy/40 rounded px-2 py-1 focus:outline-none"
                          />
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}{msg.edited && <span className="text-[9px] opacity-60 ml-1">(edited)</span>}</p>
                        )}
                        {msg.mentions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {msg.mentions.map((m) => (
                              <span key={m} className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', isMe ? 'bg-white/20 text-white' : 'bg-aims-navy/10 text-aims-navy')}>@{m}</span>
                            ))}
                          </div>
                        )}
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

                      {/* Moderation actions (channel moderators only) */}
                      {canModerate && (
                        <div className={cn('flex items-center gap-2 mt-0.5', isMe ? 'justify-end mr-1' : 'justify-start ml-1')}>
                          <span className="text-[9px] text-slate-400">{formatTime(msg.timestamp)}</span>
                          <button onClick={() => { setEditingMsg(msg); setEditText(msg.content); }} className="text-[9px] font-bold text-aims-navy hover:underline">Edit</button>
                          <button onClick={() => { togglePin(msg.id); showToast({ title: msg.pinned ? 'Unpinned' : 'Pinned', message: msg.pinned ? 'Message unpinned.' : 'Message pinned to channel.', type: 'info' }); }} className="text-[9px] font-bold text-aims-navy hover:underline">Pin</button>
                          <button onClick={() => { deleteFeedMessage(msg.id); showToast({ title: 'Message Deleted', message: 'Removed from the channel.', type: 'info' }); }} className="text-[9px] font-bold text-red-500 hover:underline">Delete</button>
                        </div>
                      )}
                      {!canModerate && <p className={cn('text-[9px] text-slate-400 mt-0.5', isMe ? 'text-right mr-1' : 'ml-1')}>{formatTime(msg.timestamp)}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

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
                value={editingMsg ? editText : messageText}
                onChange={editingMsg ? (e) => setEditText(e.target.value) : handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={canPost ? `Message ${activeDef.label}… (type @ to mention)` : `Read-only in this channel`}
                readOnly={!canPost}
                disabled={!canPost}
                className="w-full text-sm border border-slate-200 rounded-full px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-aims-navy/30 focus:bg-white transition-colors"
              />
            </div>
            {editingMsg ? (
              <>
                <button onClick={handleEditSave} className="p-2.5 rounded-full bg-aims-green text-white hover:bg-aims-green/90 shadow-md"><span className="material-symbols-outlined text-[22px]">check</span></button>
                <button onClick={() => setEditingMsg(null)} className="p-2.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"><span className="material-symbols-outlined text-[22px]">close</span></button>
              </>
            ) : (
              <button
                onClick={handleSend}
                disabled={!messageText.trim() || !canPost}
                className={cn('p-2.5 rounded-full transition-colors flex-shrink-0', messageText.trim() && canPost ? 'bg-aims-navy text-white hover:bg-aims-navy/90 shadow-md' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}
              >
                <span className="material-symbols-outlined text-[22px]">send</span>
              </button>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
