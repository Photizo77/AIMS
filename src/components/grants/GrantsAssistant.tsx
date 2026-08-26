// src/components/grants/GrantsAssistant.tsx
// ============================================================
// ARDHI GRANTS ASSISTANT — floating chat widget (bottom-right)
// Fine-tuned on ARDHI's documents + grants tracker:
//  - calls the Netlify /api/chat function with retrieved org context,
//  - falls back to a local knowledge answer engine when the API is
//    unavailable (dev / no API keys), so it always answers.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  buildGrantsSystemPrompt,
  generateLocalAnswer,
  QUICK_PROMPTS,
  type ChatMessage,
} from '@/lib/knowledgeRetrieval';

/** Providers supported by the Netlify /api/chat function (keys set in Netlify env vars) */
export const ASSISTANT_MODELS: { id: string; label: string; hint: string }[] = [
  { id: 'deepseek-chat', label: 'DeepSeek', hint: 'DEEPSEEK_API_KEY' },
  { id: 'claude-sonnet-4-20250514', label: 'Claude', hint: 'ANTHROPIC_API_KEY' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', hint: 'OPENAI_API_KEY' },
  { id: 'qwen-plus', label: 'Qwen Plus', hint: 'QWEN_API_KEY' },
];

/** Programmatically open the assistant (used by dashboard quick-access buttons) */
export function openGrantsAssistant(): void {
  window.dispatchEvent(new CustomEvent('aims:open-grants-assistant'));
}

interface AssistantMessage extends ChatMessage {
  id: string;
  source: 'ai' | 'local' | 'user';
  /** Which provider answered (ai replies only) */
  modelLabel?: string;
}

let msgId = 0;
function nextMsgId(): string {
  msgId += 1;
  return `gm-${Date.now()}-${msgId}`;
}

const WELCOME: AssistantMessage = {
  id: 'welcome',
  role: 'assistant',
  source: 'local',
  content:
    'Good day. I am the ARDHI Grants Assistant, an internal knowledge resource trained on ARDHI\'s documents (Organisational Profile, 5-Year Strategic Plan 2026-2031, resource mobilisation plan) and the Grants Tracker (August 2026).\n\nI can provide details on our grant history, opportunities identified but not pursued, live funding calls, and organisational information. For any specific grant, I will outline our alignment with the ARDHI pillars, the eligibility criteria, and any similar applications we have made previously.',
};

async function callAiChat(history: ChatMessage[], userText: string, model: string): Promise<{ reply: string; modelLabel: string } | null> {
  const systemPrompt = buildGrantsSystemPrompt(userText);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history, model, systemPrompt }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.reply === 'string' && data.reply.trim()) {
      const label = ASSISTANT_MODELS.find((m) => m.id === model)?.label ?? model;
      return { reply: data.reply, modelLabel: label };
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function GrantsAssistant() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelId, setModelId] = useState('deepseek-chat');
  const listRef = useRef<HTMLDivElement>(null);

  // ── Draggable floating button — position is user-controlled & persisted ──
  const FAB_STORAGE = 'aims_fab_pos';
  const [fabPos, setFabPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      const raw = localStorage.getItem(FAB_STORAGE);
      if (raw) return JSON.parse(raw) as { x: number; y: number };
    } catch { /* ignore */ }
    return null;
  });
  const fabRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const movedRef = useRef(false);

  const handleFabPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rect = fabRef.current?.getBoundingClientRect();
    dragRef.current = { dx: e.clientX - (rect?.left ?? 0), dy: e.clientY - (rect?.top ?? 0) };
    movedRef.current = false;
    (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
  };
  const handleFabPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;
    const next = { x: e.clientX - dragRef.current.dx, y: e.clientY - dragRef.current.dy };
    if (Math.abs(next.x - (fabPos?.x ?? 0)) > 3 || Math.abs(next.y - (fabPos?.y ?? 0)) > 3) movedRef.current = true;
    setFabPos(next);
  };
  const handleFabPointerUp = () => {
    dragRef.current = null;
    try {
      if (fabPos) localStorage.setItem(FAB_STORAGE, JSON.stringify(fabPos));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  // Open on demand from dashboard quick-access buttons
  useEffect(() => {
    const handler = () => { setOpen(true); };
    window.addEventListener('aims:open-grants-assistant', handler);
    return () => window.removeEventListener('aims:open-grants-assistant', handler);
  }, []);

  // Reset on navigation: close the panel (the button stays where the user put it)
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: AssistantMessage = { id: nextMsgId(), role: 'user', content: trimmed, source: 'user' };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    const history: ChatMessage[] = next.map((m) => ({ role: m.role, content: m.content }));

    const aiResult = await callAiChat(history, trimmed, modelId);

    const assistantMsg: AssistantMessage = {
      id: nextMsgId(),
      role: 'assistant',
      source: aiResult ? 'ai' : 'local',
      content: aiResult?.reply ?? generateLocalAnswer(trimmed) ?? "Sorry — I couldn't find an answer for that. Try rephrasing.",
      modelLabel: aiResult?.modelLabel,
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setLoading(false);
  };

  return (
    <>
      {/* Floating assistant button — always present while logged in, draggable anywhere */}
      <button
        ref={fabRef}
        onClick={() => { if (movedRef.current) { movedRef.current = false; return; } setOpen(!open); }}
        onPointerDown={handleFabPointerDown}
        onPointerMove={handleFabPointerMove}
        onPointerUp={handleFabPointerUp}
        onPointerCancel={handleFabPointerUp}
        title="ARDHI Grants Assistant — drag to move"
        aria-label="Open grants assistant chat"
        style={fabPos ? { left: fabPos.x, top: fabPos.y } : undefined}
        className={cn(
          'fixed z-50 w-14 h-14 rounded-full bg-[#286b25] text-white shadow-xl hover:scale-105 hover:bg-[#1f5520] transition-all duration-150 flex items-center justify-center touch-none select-none cursor-grab active:cursor-grabbing',
          fabPos ? '' : 'bottom-6 right-6'
        )}
      >
        <span className="material-symbols-outlined text-[26px]">{open ? 'close' : 'smart_toy'}</span>
        {!open && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-aims-orange border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] max-w-[400px] h-[min(560px,calc(100vh-8rem))] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-[#286b25] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              </div>
              <div>
                <p className="text-sm font-extrabold leading-tight">ARDHI Grants Assistant</p>
                <p className="text-[10px] text-white/80 leading-tight flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-aims-green inline-block" />
                  Tuned on ARDHI docs & grants tracker
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                title="AI provider — use the one whose API key is set in Netlify (falls back to local knowledge if unavailable)"
                className="text-[10px] font-bold bg-white/15 text-white border border-white/25 rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-white/40 [&>option]:text-slate-800"
              >
                {ASSISTANT_MODELS.map((m) => (
                  <option key={m.id} value={m.id} title={`${m.hint}`}>{m.label}</option>
                ))}
              </select>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((m) => (
              <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm', m.role === 'user' ? 'bg-[#286b25] text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm')}>
                  {m.content}
                  {m.role === 'assistant' && (
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mt-1.5 flex items-center gap-1">
                      {m.source === 'ai' ? (
                        <>
                          <span className="material-symbols-outlined text-[11px]">auto_awesome</span>Answered by {m.modelLabel ?? 'AI'}
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[11px]">menu_book</span>Local knowledge base
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>

          {/* Quick prompts */}
          <div className="px-3 pt-2 flex gap-1.5 overflow-x-auto bg-white border-t border-slate-100">
            {QUICK_PROMPTS.slice(0, 4).map((p) => (
              <button
                key={p}
                onClick={() => handleSend(p)}
                disabled={loading}
                className="shrink-0 text-[10px] font-bold text-aims-navy bg-aims-navy/5 border border-aims-navy/15 rounded-full px-2.5 py-1 hover:bg-aims-navy/10 transition-colors disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 bg-white flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              placeholder="Type your question regarding grants, deadlines or ARDHI…"
              rows={1}
              className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-aims-navy/30 resize-none max-h-28"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-[#286b25] text-white flex items-center justify-center hover:bg-[#1f5520] transition-colors disabled:opacity-40 shrink-0"
              aria-label="Send message"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
