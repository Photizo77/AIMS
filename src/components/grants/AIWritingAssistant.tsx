import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';

type AIModel = 'claude' | 'kimi' | 'qwen';
type AIAction = 'improve' | 'humanize' | 'expand' | 'summarize';

const MODELS: { id: AIModel; name: string; description: string }[] = [
  { id: 'claude', name: 'Claude', description: 'Best for structured, formal proposals' },
  { id: 'kimi', name: 'Kimi-3', description: 'Excellent for research-heavy content' },
  { id: 'qwen', name: 'Qwen', description: 'Great for creative, human-toned writing' },
];

const ACTIONS: { id: AIAction; label: string; icon: string }[] = [
  { id: 'improve', label: 'Improve Writing', icon: 'edit_note' },
  { id: 'humanize', label: 'Make More Human', icon: 'favorite' },
  { id: 'expand', label: 'Expand Section', icon: 'expand' },
  { id: 'summarize', label: 'Summarize', icon: 'summarize' },
];

export function AIWritingAssistant() {
  const { showToast } = useNotifications();
  const [selectedModel, setSelectedModel] = useState<AIModel>('qwen');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = (action: AIAction) => {
    if (!inputText.trim()) {
      showToast({ title: 'No Input', message: 'Please paste or write some text first.', type: 'warning' });
      return;
    }

    setIsGenerating(true);
    setOutputText('');

    setTimeout(() => {
      const modelName = MODELS.find((m) => m.id === selectedModel)?.name || 'AI';
      const actionLabel = ACTIONS.find((a) => a.id === action)?.label || 'Process';

      setOutputText(`[${modelName} — ${actionLabel}]\n\nHere's your refined text with a natural, human touch:\n\n"${inputText.slice(0, 100)}..." has been enhanced to sound more authentic and compelling while maintaining professional grant-writing standards.\n\n(Note: Connect to your backend API proxy to get real ${modelName} responses. This is a UI preview.)`);
      setIsGenerating(false);

      showToast({ title: 'AI Response Ready', message: `${modelName} has processed your text.`, type: 'success' });
    }, 1500);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-aims-mint">smart_toy</span>
        <h3 className="text-sm font-semibold text-gray-800">AI Writing Assistant</h3>
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-gray-600 mb-2">Select Model</p>
        <div className="grid grid-cols-3 gap-2">
          {MODELS.map((model) => (
            <button key={model.id} onClick={() => setSelectedModel(model.id)} className={cn('p-2 rounded-lg border text-left transition-colors', selectedModel === model.id ? 'border-aims-mint bg-aims-mint/5' : 'border-gray-200 hover:border-gray-300')}>
              <p className="text-xs font-semibold text-gray-800">{model.name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{model.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-gray-600 mb-2">Your Text</p>
        <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Paste your grant section here, or write a draft..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-aims-mint/50" />
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium text-gray-600 mb-2">Actions</p>
        <div className="grid grid-cols-2 gap-2">
          {ACTIONS.map((action) => (
            <button key={action.id} onClick={() => handleGenerate(action.id)} disabled={isGenerating} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors', isGenerating ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400' : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-aims-mint')}>
              <span className="material-symbols-outlined text-[16px]">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {(isGenerating || outputText) && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-medium text-gray-600 mb-2">AI Output</p>
          {isGenerating ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
              Generating...
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">{outputText}</div>
          )}
        </div>
      )}

      <p className="text-[10px] text-gray-400 mt-4">
        Note: In production, connect to your backend API proxy for real AI model responses. API keys should never be exposed in frontend code.
      </p>
    </div>
  );
}