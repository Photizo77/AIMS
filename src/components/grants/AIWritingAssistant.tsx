// src/components/grants/AIWritingAssistant.tsx
// ============================================================
// AIMS — Embedded AI Grant Assistant (ChatGPT-style)
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import type { Grant } from '@/types';

type ModelId = 'claude-sonnet-4-20250514' | 'gpt-4o-mini' | 'deepseek-chat' | 'qwen-plus';

interface Model {
  id: ModelId;
  name: string;
  badge: string;
  strength: string;
}

const MODELS: Model[] = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet', badge: 'bg-aims-orange', strength: 'Best for structured proposals' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', badge: 'bg-aims-green', strength: 'Fast & versatile' },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', badge: 'bg-aims-navy', strength: 'Cost-effective reasoning' },
  { id: 'qwen-plus', name: 'Qwen Plus', badge: 'bg-purple-600', strength: 'Strong multilingual' },
];

interface Message { role: 'user' | 'assistant'; content: string; }

export function AIWritingAssistant({ grant }: { grant: Grant }) {
  const { showToast } = useNotifications();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelId>('claude-sonnet-4-20250514');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentModel = MODELS.find(m => m.id === selectedModel)!;

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const systemPrompt = `You are an expert grant writing assistant for Ardhi. The user is working on: "${grant.title}" (${grant.pillar}). Amount: UGX ${grant.amount.toLocaleString()}. Write professionally and persuasively for institutional funders.`;

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    const userMessage: Message = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, model: selectedModel, systemPrompt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed');
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      showToast({ title: 'AI Error', message: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-aims-green text-[20px]">smart_toy</span>
          <h3 className="text-sm font-bold text-slate-900">AI Assistant</h3>
        </div>
        <div className="relative">
          <button onClick={() => setIsModelMenuOpen(!isModelMenuOpen)} className="flex items-center gap-2 px-2 py-1 rounded-lg border border-slate-200 hover:bg-white text-xs font-semibold text-slate-700 bg-white">
            <span className={cn('w-2 h-2 rounded-full', currentModel.badge)} />
            {currentModel.name}
            <span className="material-symbols-outlined text-[14px]">expand_more</span>
          </button>
          {isModelMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsModelMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg border border-slate-200 shadow-lg z-20 overflow-hidden">
                {MODELS.map((model) => (
                  <button key={model.id} onClick={() => { setSelectedModel(model.id); setIsModelMenuOpen(false); }} className={cn('w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0', selectedModel === model.id && 'bg-slate-50')}>
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', model.badge)} />
                      <span className="text-xs font-bold text-slate-900">{model.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center mb-3', currentModel.badge)}>
              <span className="material-symbols-outlined text-white text-[24px]">auto_awesome</span>
            </div>
            <p className="text-xs text-slate-500 max-w-[200px]">Ask me to draft sections, refine text, or suggest metrics for this grant.</p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center shrink-0', currentModel.badge)}>
                    <span className="material-symbols-outlined text-white text-[12px]">auto_awesome</span>
                  </div>
                )}
                <div className={cn('max-w-[85%] rounded-2xl px-3 py-2 text-xs', msg.role === 'user' ? 'bg-aims-navy text-white rounded-br-sm' : 'bg-slate-100 text-slate-900 rounded-bl-sm')}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center shrink-0', currentModel.badge)}>
                  <span className="material-symbols-outlined text-white text-[12px]">auto_awesome</span>
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-200 bg-white rounded-b-xl">
        <div className="flex items-end gap-2 bg-slate-50 rounded-lg border border-slate-200 p-1.5 focus-within:border-aims-green">
          <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask AI..." rows={1} className="flex-1 bg-transparent px-2 py-1 text-xs text-slate-900 placeholder-slate-400 resize-none focus:outline-none max-h-24" />
          <button onClick={handleSend} disabled={!input.trim() || isLoading} className={cn('w-7 h-7 rounded-md flex items-center justify-center shrink-0', input.trim() && !isLoading ? 'bg-aims-green text-white' : 'bg-slate-200 text-slate-400')}>
            <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
          </button>
        </div>
      </div>
    </div>
  );
}