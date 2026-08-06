// src/components/grants/AIWritingAssistant.tsx
// ChatGPT-style AI assistant with 4 models
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import type { Grant } from '@/types';

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

interface AIWritingAssistantProps {
  grant: Grant;
}

export function AIWritingAssistant({ grant }: AIWritingAssistantProps) {
  const { showToast } = useNotifications();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelId>('claude-sonnet-4-20250514');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentModel = MODELS.find(m => m.id === selectedModel)!;

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const systemPrompt = `You are an expert grant writing assistant for Ardhi, an organization focused on sustainable development in Uganda. 

The user is working on this grant:
- Title: ${grant.title}
- Pillar: ${grant.pillar}
- Description: ${grant.description}
- Amount: UGX ${grant.amount.toLocaleString()}

Write in a professional, persuasive, and human tone suitable for institutional funders. Avoid corporate jargon. Be specific, evidence-based, and impact-focused. When the user asks for help, provide refined, publication-ready text they can use directly.`;

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
          systemPrompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      showToast({
        title: 'AI Error',
        message: err.message || 'Could not reach the AI service.',
        type: 'error',
      });
      setMessages([...newMessages, {
        role: 'assistant',
        content: `⚠️ Could not reach the AI. Please check your API keys in Netlify settings.\n\nError: ${err.message}`,
      }]);
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

  const handleClear = () => {
    setMessages([]);
    showToast({ title: 'Chat cleared', message: 'Starting a fresh conversation.', type: 'info' });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast({ title: 'Copied', message: 'Response copied to clipboard.', type: 'success' });
  };

  const suggestedPrompts = [
    'Help me write a compelling project summary',
    'Draft the problem statement for this grant',
    'Outline the methodology section',
    'Suggest measurable impact indicators',
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[700px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-aims-green text-[20px]">smart_toy</span>
          <h3 className="text-sm font-bold text-slate-900">AI Grant Assistant</h3>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
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
                    onClick={() => {
                      setSelectedModel(model.id);
                      setIsModelMenuOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0',
                      selectedModel === model.id && 'bg-slate-50'
                    )}
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

      {/* Grant context bar */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-[16px] text-slate-400">description</span>
          <span className="text-xs font-mono text-slate-500 truncate">{grant.uniqueId}</span>
          <span className="text-xs font-semibold text-slate-700 truncate">• {grant.title}</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs font-semibold text-slate-500 hover:text-red-500 shrink-0 ml-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={cn('w-14 h-14 rounded-full flex items-center justify-center mb-4', currentModel.badge)}>
              <span className="material-symbols-outlined text-white text-[28px]">auto_awesome</span>
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-1">How can I help with this grant?</h4>
            <p className="text-xs text-slate-500 mb-6 max-w-xs">
              Ask me to draft sections, refine your writing, or suggest impact metrics — tuned for {currentModel.name}.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-aims-green hover:bg-green-50/30 text-xs font-medium text-slate-700 transition-colors"
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
                  <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0', currentModel.badge)}>
                    <span className="material-symbols-outlined text-white text-[14px]">auto_awesome</span>
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm relative group',
                    msg.role === 'user'
                      ? 'bg-aims-navy text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                  )}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => handleCopy(msg.content)}
                      className="absolute -bottom-7 left-0 text-[10px] font-semibold text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[12px]">content_copy</span>
                      Copy
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0', currentModel.badge)}>
                  <span className="material-symbols-outlined text-white text-[14px]">auto_awesome</span>
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

      {/* Input area */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex items-end gap-2 bg-slate-50 rounded-xl border border-slate-200 p-2 focus-within:border-aims-green transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${currentModel.name}...`}
            rows={1}
            className="flex-1 bg-transparent px-2 py-1.5 text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none max-h-40"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors',
              input.trim() && !isLoading
                ? 'bg-aims-green text-white hover:opacity-90'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            )}
          >
            <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center">
          AI may produce inaccurate information. Always review before submission.
        </p>
      </div>
    </div>
  );
}