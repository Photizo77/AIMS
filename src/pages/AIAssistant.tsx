// src/pages/AIAssistant.tsx
import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';

type ModelId = 'claude' | 'kimi3' | 'qwen';
type ModeId = 'grant_writing' | 'general' | 'research';
type ContextType = 'grant' | 'document' | 'requisition' | 'research' | 'innovation';

interface Model { id: ModelId; name: string; vendor: string; description: string; icon: string; }
interface Mode { id: ModeId; name: string; description: string; icon: string; tone: string; }

const MODELS: Model[] = [
  { id: 'claude', name: 'Claude 3.5 Sonnet', vendor: 'Anthropic', description: 'Best for long-form narratives & compliance', icon: 'auto_awesome' },
  { id: 'kimi3', name: 'Kimi-3', vendor: 'Moonshot', description: 'Strong at multilingual content & synthesis', icon: 'translate' },
  { id: 'qwen', name: 'Qwen 2.5', vendor: 'Alibaba', description: 'Fast responses for quick research', icon: 'bolt' },
];

const MODES: Mode[] = [
  { id: 'grant_writing', name: 'Grant Writing', description: 'Institutional tone, pulls grant context, funder-aligned', icon: 'volunteer_activism', tone: 'formal' },
  { id: 'general', name: 'General', description: 'Versatile assistant for any task', icon: 'chat', tone: 'neutral' },
  { id: 'research', name: 'Research Assistant', description: 'Deep analysis, citations, literature review', icon: 'science', tone: 'academic' },
];

interface Attachment {
  type: 'file' | 'url' | 'context';
  name: string;
  content?: string;
  module?: ContextType;
  size?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: Attachment[];
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  mode: ModeId;
}

const MOCK_CONTEXT_ITEMS = [
  { type: 'grant' as ContextType, id: 'g1', name: 'Community Land Rights Documentation', module: 'Grants', description: 'USAID proposal • 450M UGX' },
  { type: 'grant' as ContextType, id: 'g2', name: 'Climate-Smart Farming Initiative', module: 'Grants', description: 'EU Delegation • 820M UGX' },
  { type: 'document' as ContextType, id: 'd1', name: 'Leave Request Form', module: 'Documents', description: 'Shared Reference Library' },
  { type: 'document' as ContextType, id: 'd2', name: 'Q2 Board Meeting Minutes', module: 'Documents', description: 'Governance' },
  { type: 'requisition' as ContextType, id: 'req-041', name: 'Q3 Field Equipment Procurement', module: 'Approvals', description: '12.4M UGX • Pending' },
  { type: 'research' as ContextType, id: 'r1', name: 'Solar Grain Dryer Feasibility', module: 'Research', description: 'Innovation pipeline' },
  { type: 'innovation' as ContextType, id: 'inv-001', name: 'Solar-Powered Grain Dryer', module: 'Innovations', description: 'Prototype stage' },
];

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-GB', { weekday: 'short' });
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function AIAssistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  // State with localStorage persistence
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem(`ai_conversations_${user?.email ?? 'guest'}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [activeConvId, setActiveConvId] = useState<string | null>(() => {
    const saved = localStorage.getItem(`ai_active_conversation_${user?.email ?? 'guest'}`);
    return saved || null;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelId>('claude');
  const [selectedMode, setSelectedMode] = useState<ModeId>('grant_writing');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showContextPicker, setShowContextPicker] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist to localStorage
  useEffect(() => {
    const key = user?.email ?? 'guest';
    localStorage.setItem(`ai_conversations_${key}`, JSON.stringify(conversations));
  }, [conversations, user?.email]);

  useEffect(() => {
    const key = user?.email ?? 'guest';
    if (activeConvId) {
      localStorage.setItem(`ai_active_conversation_${key}`, activeConvId);
    }
  }, [activeConvId, user?.email]);

  const activeConv = conversations.find((c) => c.id === activeConvId) ?? null;
  const currentModel = MODELS.find((m) => m.id === selectedModel) ?? MODELS[0];
  const currentMode = MODES.find((m) => m.id === selectedMode) ?? MODES[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  useEffect(() => {
    if (renamingId && renameInputRef.current) renameInputRef.current.focus();
  }, [renamingId]);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = q
      ? conversations.filter((c) =>
          c.title.toLowerCase().includes(q) ||
          c.messages.some((m) => m.content.toLowerCase().includes(q))
        )
      : conversations;
    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [conversations, searchQuery]);

  const pinnedConvs = filteredConversations.filter((c) => c.pinned);
  const otherConvs = filteredConversations.filter((c) => !c.pinned);

  const handleNewChat = () => {
    const newConv: Conversation = {
      id: `c-${Date.now()}`,
      title: 'New conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false,
      mode: selectedMode,
    };
    setConversations([newConv, ...conversations]);
    setActiveConvId(newConv.id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const attachment: Attachment = {
        type: 'file',
        name: file.name,
        size: file.size < 1024 * 1024
          ? `${(file.size / 1024).toFixed(0)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      };
      setAttachments((prev) => [...prev, attachment]);
      showToast({ title: 'File attached', message: file.name, type: 'success' });
    });

    e.target.value = '';
  };

  const handleUrlAttach = () => {
    if (!urlInput.trim()) return;
    const attachment: Attachment = {
      type: 'url',
      name: urlInput.trim(),
      content: urlInput.trim(),
    };
    setAttachments((prev) => [...prev, attachment]);
    setUrlInput('');
    setShowUrlInput(false);
    showToast({ title: 'URL attached', message: urlInput.trim(), type: 'success' });
  };

  const handleContextAttach = (item: typeof MOCK_CONTEXT_ITEMS[0]) => {
    const attachment: Attachment = {
      type: 'context',
      name: item.name,
      module: item.type,
      content: `${item.module}: ${item.description}`,
    };
    setAttachments((prev) => [...prev, attachment]);
    setShowContextPicker(false);
    showToast({ title: 'Context attached', message: item.name, type: 'success' });
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (!inputText.trim() && attachments.length === 0) return;

    let targetConvId = activeConvId;
    if (!targetConvId) {
      const newConv: Conversation = {
        id: `c-${Date.now()}`,
        title: inputText.trim().slice(0, 50) || 'New conversation',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pinned: false,
        mode: selectedMode,
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      targetConvId = newConv.id;
    }

    const userMsg: Message = {
      id: `m-${Date.now()}`,
      role: 'user',
      content: inputText.trim() || '(attachment only)',
      timestamp: new Date().toISOString(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    const sendTargetId = targetConvId;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === sendTargetId
          ? {
              ...c,
              messages: [...c.messages, userMsg],
              updatedAt: new Date().toISOString(),
              title: c.messages.length === 0 && inputText.trim() ? inputText.trim().slice(0, 50) : c.title,
            }
          : c
      )
    );
    setInputText('');
    setAttachments([]);
    setIsTyping(true);

    // Mock AI response
    setTimeout(() => {
      const aiMsg: Message = {
        id: `m-${Date.now() + 1}`,
        role: 'assistant',
        content: generateMockResponse(inputText.trim(), selectedModel, selectedMode, userMsg.attachments ?? []),
        timestamp: new Date().toISOString(),
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === sendTargetId
            ? { ...c, messages: [...c.messages, aiMsg], updatedAt: new Date().toISOString() }
            : c
        )
      );
      setIsTyping(false);
    }, 1500);
  };

  const togglePin = (id: string) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)));
  };

  const deleteConversation = (id: string) => {
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);
    if (activeConvId === id) setActiveConvId(remaining[0]?.id ?? null);
  };

  const startRename = (conv: Conversation) => {
    setRenamingId(conv.id);
    setRenameValue(conv.title);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      setConversations((prev) => prev.map((c) => (c.id === renamingId ? { ...c, title: renameValue.trim() } : c)));
    }
    setRenamingId(null);
    setRenameValue('');
  };

  if (!user) return <div className="p-8 text-center text-slate-500">Loading…</div>;

  return (
    <div className="h-[calc(100vh-7rem)] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex">
      {/* ── LEFT SIDEBAR ── */}
      <div
        className={cn(
          'flex-shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col transition-all duration-200',
          sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'
        )}
      >
        <div className="p-3 border-b border-slate-200">
          <button
            onClick={handleNewChat}
            className="w-full py-2.5 bg-[#286b25] text-white text-sm font-bold rounded-lg hover:bg-[#1e5019] transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>New Chat
          </button>
          <div className="relative mt-2">
            <span className="material-symbols-outlined text-slate-400 text-[16px] absolute left-2.5 top-1/2 -translate-y-1/2">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations…"
              className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#286b25]/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
          {pinnedConvs.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">push_pin</span>Pinned
              </p>
              <div className="space-y-0.5">
                {pinnedConvs.map((c) => (
                  <ConversationItem
                    key={c.id}
                    conv={c}
                    isActive={c.id === activeConvId}
                    isRenaming={renamingId === c.id}
                    renameValue={renameValue}
                    renameInputRef={renameInputRef}
                    onSelect={() => setActiveConvId(c.id)}
                    onRenameChange={setRenameValue}
                    onRenameCommit={commitRename}
                    onRenameStart={() => startRename(c)}
                    onTogglePin={() => togglePin(c.id)}
                    onDelete={() => deleteConversation(c.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">Recent</p>
            <div className="space-y-0.5">
              {otherConvs.length === 0 && <p className="text-xs text-slate-400 italic px-2 py-4 text-center">No conversations</p>}
              {otherConvs.map((c) => (
                <ConversationItem
                  key={c.id}
                  conv={c}
                  isActive={c.id === activeConvId}
                  isRenaming={renamingId === c.id}
                  renameValue={renameValue}
                  renameInputRef={renameInputRef}
                  onSelect={() => setActiveConvId(c.id)}
                  onRenameChange={setRenameValue}
                  onRenameCommit={commitRename}
                  onRenameStart={() => startRename(c)}
                  onTogglePin={() => togglePin(c.id)}
                  onDelete={() => deleteConversation(c.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-slate-200">
          <p className="text-[10px] text-slate-400 text-center mb-2">💡 History persisted across sessions</p>
          <button
            onClick={() => navigate('/grants')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>Back to Grants
          </button>
        </div>
      </div>

      {/* ── MAIN CHAT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
              <span className="material-symbols-outlined text-[20px]">
                {sidebarOpen ? 'left_panel_close' : 'left_panel_open'}
              </span>
            </button>

            {/* Mode selector */}
            <div className="relative">
              <button
                onClick={() => setShowModePicker(!showModePicker)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[#286b25] text-[18px]">{currentMode.icon}</span>
                <span className="text-sm font-bold text-slate-900">{currentMode.name}</span>
                <span className="material-symbols-outlined text-slate-400 text-[16px]">expand_more</span>
              </button>
              {showModePicker && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-30 overflow-hidden">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedMode(m.id);
                        setShowModePicker(false);
                      }}
                      className={cn(
                        'w-full flex items-start gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left',
                        selectedMode === m.id && 'bg-[#286b25]/5'
                      )}
                    >
                      <span
                        className={cn(
                          'material-symbols-outlined text-[20px] mt-0.5',
                          selectedMode === m.id ? 'text-[#286b25]' : 'text-slate-400'
                        )}
                      >
                        {m.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900">{m.name}</p>
                        <p className="text-[10px] text-slate-500">{m.description}</p>
                      </div>
                      {selectedMode === m.id && <span className="material-symbols-outlined text-[#286b25] text-[18px]">check</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Model selector */}
            <div className="relative">
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[#286b25] text-[18px]">{currentModel.icon}</span>
                <span className="text-sm font-semibold text-slate-700">{currentModel.name}</span>
                <span className="material-symbols-outlined text-slate-400 text-[16px]">expand_more</span>
              </button>
              {showModelPicker && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-30 overflow-hidden">
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedModel(m.id);
                        setShowModelPicker(false);
                      }}
                      className={cn(
                        'w-full flex items-start gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left',
                        selectedModel === m.id && 'bg-[#286b25]/5'
                      )}
                    >
                      <span
                        className={cn(
                          'material-symbols-outlined text-[20px] mt-0.5',
                          selectedModel === m.id ? 'text-[#286b25]' : 'text-slate-400'
                        )}
                      >
                        {m.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900">{m.name}</p>
                        <p className="text-[10px] text-slate-500">{m.vendor} — {m.description}</p>
                      </div>
                      {selectedModel === m.id && <span className="material-symbols-outlined text-[#286b25] text-[18px]">check</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {!activeConv || activeConv.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#286b25]/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[#286b25] text-[40px]">smart_toy</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Grant Assistant</h2>
              <p className="text-sm text-slate-500 mb-6 max-w-md">
                AI-powered drafting, research, and analysis. Attach files, URLs, or context from any module.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full">
                {[
                  'Draft a theory of change for my latest proposal',
                  'Review this budget narrative for inconsistencies',
                  'Summarize the funder priorities from this URL',
                  'Generate M&E indicators for this outcome',
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInputText(suggestion)}
                    className="text-left text-xs p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {activeConv.messages.map((msg) => (
                <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0',
                      msg.role === 'user' ? 'bg-slate-700' : 'bg-[#286b25]'
                    )}
                  >
                    {msg.role === 'user' ? (
                      user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                    )}
                  </div>
                  <div className={cn('flex-1 min-w-0', msg.role === 'user' ? 'flex justify-end' : '')}>
                    <div
                      className={cn(
                        'max-w-[85%] inline-block rounded-2xl px-4 py-2.5 text-sm',
                        msg.role === 'user' ? 'bg-[#286b25] text-white rounded-tr-sm' : 'bg-slate-100 text-slate-900 rounded-tl-sm'
                      )}
                    >
                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-2 space-y-1">
                          {msg.attachments.map((att, i) => (
                            <div
                              key={i}
                              className={cn(
                                'flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs',
                                msg.role === 'user' ? 'bg-white/20' : 'bg-white border border-slate-200'
                              )}
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {att.type === 'file' ? 'attach_file' : att.type === 'url' ? 'link' : 'description'}
                              </span>
                              <span className="font-semibold truncate">{att.name}</span>
                              {att.size && <span className="text-[10px] opacity-70">({att.size})</span>}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    </div>
                    <p className={cn('text-[10px] text-slate-400 mt-1', msg.role === 'user' ? 'text-right mr-1' : 'ml-1')}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#286b25] flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white text-[16px]">smart_toy</span>
                  </div>
                  <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 inline-flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex-shrink-0">
          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#286b25]/10 border border-[#286b25]/20 rounded-lg group"
                >
                  <span className="material-symbols-outlined text-[#286b25] text-[14px]">
                    {att.type === 'file' ? 'attach_file' : att.type === 'url' ? 'link' : 'description'}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 truncate max-w-[200px]">{att.name}</span>
                  {att.size && <span className="text-[10px] text-slate-500">({att.size})</span>}
                  <button onClick={() => removeAttachment(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* URL input */}
          {showUrlInput && (
            <div className="mb-2 flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUrlAttach();
                  if (e.key === 'Escape') {
                    setShowUrlInput(false);
                    setUrlInput('');
                  }
                }}
                placeholder="Paste URL here…"
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#286b25]/30"
                autoFocus
              />
              <button
                onClick={handleUrlAttach}
                className="px-4 py-2 bg-[#286b25] text-white text-sm font-bold rounded-lg hover:bg-[#1e5019] transition-colors"
              >
                Attach
              </button>
              <button
                onClick={() => {
                  setShowUrlInput(false);
                  setUrlInput('');
                }}
                className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Context picker */}
          {showContextPicker && (
            <div className="mb-2 bg-white border border-slate-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
              <div className="px-3 py-2 border-b border-slate-100 sticky top-0 bg-white">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Attach context from any module
                </p>
              </div>
              {MOCK_CONTEXT_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleContextAttach(item)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[16px] text-slate-400 mt-0.5">
                    {item.type === 'grant' ? 'volunteer_activism' : item.type === 'document' ? 'description' : item.type === 'requisition' ? 'request_quote' : item.type === 'research' ? 'science' : 'lightbulb'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {item.module} • {item.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-[#286b25] focus-within:ring-2 focus-within:ring-[#286b25]/20 transition-all">
            {/* Attachment buttons */}
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                title="Upload file"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.docx,.xlsx,.txt,.png,.jpg,.jpeg"
              />
              <button
                onClick={() => setShowUrlInput(!showUrlInput)}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  showUrlInput ? 'bg-[#286b25]/10 text-[#286b25]' : 'hover:bg-slate-200 text-slate-500'
                )}
                title="Attach URL"
              >
                <span className="material-symbols-outlined text-[18px]">link</span>
              </button>
              <button
                onClick={() => setShowContextPicker(!showContextPicker)}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  showContextPicker ? 'bg-[#286b25]/10 text-[#286b25]' : 'hover:bg-slate-200 text-slate-500'
                )}
                title="Attach context from modules"
              >
                <span className="material-symbols-outlined text-[18px]">attach_file</span>
              </button>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything, upload files, or attach context…"
              rows={1}
              className="flex-1 bg-transparent text-sm text-slate-900 px-2 py-1.5 focus:outline-none resize-none max-h-32"
              style={{ minHeight: '36px' }}
            />
            <button
              onClick={handleSend}
              disabled={(!inputText.trim() && attachments.length === 0) || isTyping}
              className={cn(
                'p-2 rounded-full transition-all flex-shrink-0',
                (inputText.trim() || attachments.length > 0) && !isTyping
                  ? 'bg-[#286b25] text-white hover:bg-[#1e5019]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              )}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 text-center">
            💡 Fine-tuned for grant writing • Humanized responses • Persistent history
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Conversation sidebar item ──
function ConversationItem({
  conv,
  isActive,
  isRenaming,
  renameValue,
  renameInputRef,
  onSelect,
  onRenameChange,
  onRenameCommit,
  onRenameStart,
  onTogglePin,
  onDelete,
}: {
  conv: Conversation;
  isActive: boolean;
  isRenaming: boolean;
  renameValue: string;
  renameInputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: () => void;
  onRenameChange: (v: string) => void;
  onRenameCommit: () => void;
  onRenameStart: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        'group relative flex items-center gap-1 px-2 py-2 rounded-lg cursor-pointer transition-colors',
        isActive ? 'bg-white border border-slate-200 shadow-sm' : 'hover:bg-white/50'
      )}
    >
      {conv.pinned && <span className="material-symbols-outlined text-[#286b25] text-[12px] flex-shrink-0">push_pin</span>}
      <div className="flex-1 min-w-0" onClick={onSelect}>
        {isRenaming ? (
          <input
            ref={renameInputRef}
            type="text"
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onBlur={onRenameCommit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRenameCommit();
              if (e.key === 'Escape') onRenameCommit();
            }}
            className="w-full text-xs bg-white border border-[#286b25] rounded px-1 py-0.5 focus:outline-none"
            autoFocus
          />
        ) : (
          <>
            <p className="text-xs font-semibold text-slate-900 truncate">{conv.title}</p>
            <p className="text-[10px] text-slate-400 truncate">
              {formatDate(conv.updatedAt)} • {conv.messages.length} msg{conv.messages.length !== 1 ? 's' : ''}
            </p>
          </>
        )}
      </div>
      <div
        className={cn(
          'flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity',
          isActive && 'opacity-100'
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className={cn('p-0.5 rounded hover:bg-slate-200/60 transition-colors', conv.pinned && 'text-[#286b25]')}
          title={conv.pinned ? 'Unpin' : 'Pin'}
        >
          <span className="material-symbols-outlined text-[14px]">push_pin</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRenameStart();
          }}
          className="p-0.5 rounded hover:bg-slate-200/60 text-slate-500 transition-colors"
          title="Rename"
        >
          <span className="material-symbols-outlined text-[14px]">edit</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Delete this conversation?')) onDelete();
          }}
          className="p-0.5 rounded hover:bg-red-100 text-slate-500 hover:text-red-500 transition-colors"
          title="Delete"
        >
          <span className="material-symbols-outlined text-[14px]">delete</span>
        </button>
      </div>
    </div>
  );
}

// ── Enhanced mock AI response generator with mode awareness ──
function generateMockResponse(userInput: string, model: ModelId, mode: ModeId, attachments: Attachment[]): string {
  const q = userInput.toLowerCase();
  const modelLabel = MODELS.find((m) => m.id === model)?.name ?? 'AI';
  const modeLabel = MODES.find((m) => m.id === mode)?.name ?? 'General';
  const hasContext = attachments.some((a) => a.type === 'context');
  const hasFiles = attachments.some((a) => a.type === 'file');
  const hasUrls = attachments.some((a) => a.type === 'url');

  const modePrefix = mode === 'grant_writing'
    ? `[${modeLabel} mode: Formal institutional tone, funder-aligned language]`
    : mode === 'research'
    ? `[${modeLabel} mode: Academic tone, evidence-based, citations preferred]`
    : `[${modeLabel} mode]`;

  const contextAwareness = hasContext ? '• I have loaded the attached context to inform this response\n' : '';
  const fileAwareness = hasFiles ? '• I have reviewed the uploaded files\n' : '';
  const urlAwareness = hasUrls ? '• I have analyzed the provided URLs\n' : '';
  const awarenessBlock = contextAwareness + fileAwareness + urlAwareness;

  if (hasFiles && (q.includes('review') || q.includes('analyze') || q.includes('summarize'))) {
    const fileCount = attachments.filter((a) => a.type === 'file').length;
    const fileWord = fileCount > 1 ? 'files' : 'file';
    return `${modePrefix}\n\nI have analyzed the attached ${fileWord}. Here is my assessment:\n\n**Key Findings:**\n• Structure is well-organized with clear sections\n• Language is appropriate for institutional context\n• Some areas could benefit from a stronger evidence base\n\n**Recommendations:**\n1. Strengthen the problem statement with recent data\n2. Add more specific outcome indicators\n3. Ensure the budget narrative aligns with activities\n\n**Next Steps:**\nWant me to draft specific sections or provide more detailed feedback on any part?`;
  }

  if (hasUrls && (q.includes('summarize') || q.includes('extract') || q.includes('what'))) {
    const urlCount = attachments.filter((a) => a.type === 'url').length;
    const urlWord = urlCount > 1 ? 'URLs' : 'URL';
    return `${modePrefix}\n\nI have reviewed the ${urlWord} you attached. Here is a summary:\n\n**Main Points:**\n• The content covers key strategic priorities\n• Relevant to your current work in grants\n• Contains actionable insights\n\n**Relevance to Your Work:**\nThis aligns well with typical funder expectations. The language and structure could serve as a reference for your proposals.\n\n**Recommendation:**\nConsider incorporating similar framing in your theory of change section.\n\nShall I extract specific quotes or help you adapt this language?`;
  }

  if (hasContext && (q.includes('use') || q.includes('based on') || q.includes('with'))) {
    return `${modePrefix}\n\nI have loaded the context you attached. Here is how it informs your request:\n\n**Context Analysis:**\n• The attached record provides relevant background\n• I can see the current status and key stakeholders\n• This helps me tailor my response appropriately\n\n**Response:**\nBased on the context provided, here is my recommendation:\n\n1. **Approach:** Align with the existing framework\n2. **Language:** Match the institutional tone\n3. **Stakeholders:** Consider the mentioned parties\n\n**Next Steps:**\nWould you like me to draft a specific section, or shall I help you refine an existing part?`;
  }

  if (q.includes('theory of change') || q.includes('toc')) {
    return `${modePrefix}\n\n**Theory of Change Draft** (${modelLabel})\n\n**Long-term Impact:** [Define the ultimate change you seek]\n\n**Outcomes (3–5 year):**\n1. Outcome 1: [Direct result of your activities]\n2. Outcome 2: [Secondary effect]\n3. Outcome 3: [Systemic shift]\n\n**Outputs:**\n- Output 1.1: [Tangible deliverable]\n- Output 1.2: [Tangible deliverable]\n\n**Activities:**\n- Activity 1: [What you will do]\n- Activity 2: [What you will do]\n\n**Key Assumptions:**\n- Assumption 1: [Critical external factor]\n- Assumption 2: [Critical external factor]\n\n**Risks:**\n- Risk 1 → Mitigation: [Action]\n\n**Context Awareness:**\n${awarenessBlock || '• No attachments provided\n'}\nWant me to expand any section or refine this against the funder strategic framework?`;
  }

  if (q.includes('budget') || q.includes('cost') || q.includes('financial')) {
    return `${modePrefix}\n\n**Budget Narrative Review** (${modelLabel})\n\n**Recommended Budget Structure:**\n\n| Category | % of Total | Notes |\n|---|---|---|\n| Personnel (staff + consultants) | 35–45% | Core team + technical expertise |\n| Program activities | 30–40% | Direct implementation |\n| M&E | 7–10% | Data collection, evaluation |\n| Equipment & supplies | 5–15% | Project-specific |\n| Indirect costs | 10–15% | Overhead (funder caps apply) |\n\n**Red flags to watch:**\n- Indirect costs exceeding funder ceiling (USAID: 10%, EU: 7%)\n- Unallocated contingency (budget should show explicit 5–10%)\n- Personnel above 50% for implementation grants\n\n**Context Awareness:**\n${awarenessBlock || '• No attachments provided\n'}\n**Next Steps:**\nShall I draft specific line items or help you justify a particular cost category?`;
  }

  if (q.includes('m&e') || q.includes('monitoring') || q.includes('indicator') || q.includes('evaluation')) {
    return `${modePrefix}\n\n**M&E Framework Suggestion** (${modelLabel})\n\n**Results Chain:**\n- Impact → Outcomes → Outputs → Activities\n\n**Sample SMART Indicators:**\n\n| Level | Indicator | Baseline | Target | Frequency |\n|---|---|---|---|---|\n| Impact | % target population reporting improved outcomes | TBD | TBD | Annual |\n| Outcome 1 | # of beneficiaries demonstrating behavior change | 0 | TBD | Bi-annual |\n| Output 1.1 | # of training sessions delivered | 0 | TBD | Quarterly |\n| Output 1.2 | # of materials distributed | 0 | TBD | Monthly |\n\n**Data Sources:**\n- Household surveys (baseline + endline)\n- Routine monitoring (monthly)\n- Focus group discussions (quarterly)\n\n**Disaggregation:** Gender, age, location, disability status\n\nWant indicator reference sheets for any specific outcome?`;
  }

  if (q.includes('funder') || q.includes('priorities') || q.includes('eligibility') || q.includes('requirements')) {
    return `${modePrefix}\n\n**Funder Research Brief** (${modelLabel})\n\n**Strategic Alignment:**\n- Primary portfolio area\n- Secondary thematic fit\n- Geographic priority\n\n**Recent Awards Pattern:**\n- Typical grant size: [range]\n- Duration: 2–5 years typical\n- Co-financing requirement: varies\n\n**Evaluation Criteria (typical):**\n1. Technical approach (35–45%)\n2. Organizational capacity (20–25%)\n3. Past performance (15–20%)\n4. Cost realism (15–20%)\n\n**Key Differentiators to Emphasize:**\n- Community-led approach\n- Proven track record in region\n- Scalable model\n\n**Risks to Mitigate:**\n- Political sensitivity of topic\n- Sustainability beyond project period\n\nNeed the full funder strategy document cross-reference?`;
  }

  if (q.includes('hello') || q.includes('hi') || q.length < 15) {
    const statusBlock = awarenessBlock || '• No attachments yet — try uploading a file, pasting a URL, or attaching module context\n';
    return `${modePrefix}\n\nHello! I am your Grant Assistant powered by ${modelLabel} in ${modeLabel} mode.\n\nI can help you with:\n\n• **Drafting** proposals, concept notes, and narratives\n• **Reviewing** budget narratives and M&E frameworks\n• **Researching** funder priorities and eligibility\n• **Analyzing** RFP requirements\n• **Structuring** theory of change and logic models\n• **Processing** files, URLs, and context from any module\n\n**Current Mode:** ${modeLabel}\n${statusBlock}\nWhat would you like to work on?`;
  }

  return `${modePrefix}\n\nI have reviewed your request and here is my analysis (${modelLabel}):\n\n**Summary:**\nYour query touches on a key aspect of grant development. Let me break this down:\n\n**Key Considerations:**\n1. Strategic fit with funder priorities\n2. Evidence base for your approach\n3. Implementation feasibility\n4. Risk mitigation strategy\n\n**Recommendation:**\nBased on best practices in the sector, I would suggest structuring your response around the problem-solution-impact framework.\n\n**Context Awareness:**\n${awarenessBlock || '• No attachments provided\n'}\n**Next Steps:**\n- Clarify the specific outcome you are targeting\n- Identify your theory of change\n- Build the results chain\n\nWant me to go deeper on any particular aspect? I can also draft a specific section if you tell me which one.`;
}