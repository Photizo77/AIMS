// src/pages/AIAssistant.tsx
// ============================================================
// AIMS — Full-Page AI Writing Assistant (ChatGPT-style)
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';

type ModelId = 'claude-sonnet-4-20250514' | 'gpt-4o-mini' | 'deepseek-chat' | 'qwen-plus';

interface Model {
  id: ModelId;
  name: string;
  provider: string;
  badge: string;
  strength: string;
}

const MODELS: Model[] = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet', provider: 'Anthropic', badge: 'bg-aims-orange', strength: 'Best for structured proposals' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', badge: 'bg-aims-green', strength: 'Fast & versatile' },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek', badge: 'bg-aims-navy', strength: 'Cost-effective reasoning' },
  { id: 'qwen-plus', name: 'Qwen Plus', provider: 'Alibaba', badge: 'bg-purple-600', strength: 'Strong multilingual' },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const GRANT_CONTEXTS = [
  { id: 'general', label: 'General Assistance' },
  { id: 'GRANT-AGRIC-2026-001', label: 'Climate-Smart Farming (ArdhiAgric)' },
  { id: 'GRANT-HEALTH-2026-002', label: 'Mobile Maternal Clinics (ArdhiHealth)' },
  { id: 'GRANT-LAND-2026-001', label: 'Land Rights Documentation (ArdhiLand)' },
  { id: 'GRANT-WASTE-2026-001', label: 'Community Recycling Centers (ArdhiWaste)' },
];

export function AIAssistant() {
  const { showToast } = useNotifications();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelId>('claude-sonnet-4-20250514');
  const [selectedContext, setSelectedContext] = useState('general');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentModel = MODELS.find(m => m.id === selectedModel)!;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

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
        body: JSON.stringify({
          messages: newMessages,
          model: selectedModel,
          systemPrompt: `You are an expert grant writing assistant for Ardhi. ${selectedContext !== 'general' ? `The user is working on grant ${selectedContext}.` : ''} Write professionally and persuasively for institutional funders.`,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get response');
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      showToast({ title: 'AI Error', message: err.message || 'Could not reach AI service.', type: 'error' });
      setMessages([...newMessages, { role: 'assistant', content: `⚠️ ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast({ title: 'Copied', message: 'Response copied to clipboard.', type: 'success' });
  };

  const suggestedPrompts = [
    'Help me write a compelling project summary',
    'Draft a problem statement for an Ardhi grant',
    'Suggest measurable impact indicators',
    'Refine this paragraph for a donor audience',
    'Outline a methodology section',
    'Write a budget justification narrative',
  ];

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-aims-green text-[24px]">smart_toy</span>
          <h1 className="text-base font-bold text-slate-900">AI Grant Assistant</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Grant Context Selector */}
          <select
            value={selectedContext}
            onChange={(e) => setSelectedContext(e.target.value)}
            className="hidden sm:block px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white max-w-[220px]"
          >
            {GRANT_CONTEXTS.map((ctx) => (
              <option key={ctx.id} value={ctx.id}>{ctx.label}</option>
            ))}
          </select>

          {/* Model Selector */}
          <div className="relative">
            <button
              onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-xs font-semibold text-slate-700 bg-white"
            >
              <span className={cn('w-2 h-2 rounded-full', currentModel.badge)} />
              {currentModel.name}
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>

            {isModelMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsModelMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg border border-slate-200 shadow-lg z-20 overflow-hidden">
                  {MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => { setSelectedModel(model.id); setIsModelMenuOpen(false); }}
                      className={cn('w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0', selectedModel === model.id && 'bg-slate-50')}
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full', model.badge)} />
                        <span className="text-sm font-bold text-slate-900">{model.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 ml-4">{model.strength}</p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
            <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mb-5', currentModel.badge)}>
              <span className="material-symbols-outlined text-white text-[32px]">auto_awesome</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">How can I help you today?</h2>
            <p className="text-sm text-slate-500 mb-8">Select a grant context above, then ask me to draft, refine, or brainstorm any section of your proposal.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-aims-green hover:bg-green-50/30 text-xs font-medium text-slate-700 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5', currentModel.badge)}>
                    <span className="material-symbols-outlined text-white text-[16px]">auto_awesome</span>
                  </div>
                )}
                <div className={cn('max-w-[75%] rounded-2xl px-4 py-3 text-sm relative group', msg.role === 'user' ? 'bg-aims-navy text-white rounded-br-sm' : 'bg-slate-100 text-slate-900 rounded-bl-sm')}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  {msg.role === 'assistant' && (
                    <button onClick={() => handleCopy(msg.content)} className="absolute -bottom-7 left-0 text-[10px] font-semibold text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">content_copy</span> Copy
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', currentModel.badge)}>
                  <span className="material-symbols-outlined text-white text-[16px]">auto_awesome</span>
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200 bg-white shrink-0">
        <div className="max-w-3xl mx-auto flex items-end gap-2 bg-slate-50 rounded-xl border border-slate-200 p-2 focus-within:border-aims-green transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${currentModel.name}...`}
            rows={1}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none max-h-48"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors', input.trim() && !isLoading ? 'bg-aims-green text-white hover:opacity-90' : 'bg-slate-200 text-slate-400 cursor-not-allowed')}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-2">AI may produce inaccurate information. Always review before submission.</p>
      </div>
    </div>
  );
}