// src/components/ai/ExecutiveBrief.tsx
// ============================================================
// AIMS — Daily AI Executive Brief + "Ask the AI" natural-language box.
// Used on the Feed and the ED/CD dashboards.
// ============================================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { executiveBrief, answerQuery } from '@/lib/aiEngine';

export function ExecutiveBrief() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  const brief = executiveBrief();
  const severity = brief.severity;

  const ask = () => {
    if (!query.trim()) return;
    setAsking(true);
    // Deterministic engine answers instantly; an LLM could enhance later.
    setAnswer(answerQuery(query));
    setAsking(false);
  };

  const sampleQuestions = [
    'Show me all innovations led by Pius',
    'Which grants are due this week?',
    'What is our cash runway?',
    'Which projects are stalled?',
  ];

  return (
    <div className={cn('bg-white rounded-xl border p-5 shadow-sm', severity === 'warning' ? 'border-l-4 border-l-aims-orange border-slate-200' : 'border-l-4 border-l-aims-navy border-slate-200')}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-lg bg-aims-navy/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-aims-navy text-[20px]">auto_awesome</span>
        </span>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">AI Executive Brief</h3>
          <p className="text-[10px] font-bold text-aims-navy uppercase tracking-wider">{brief.date} · auto-generated from live data</p>
        </div>
      </div>

      <ul className="space-y-1.5">
        {brief.lines.map((l, i) => (
          <li key={i} className="text-sm text-slate-700 flex gap-2">
            <span className={cn('mt-0.5', severity === 'warning' ? 'text-aims-orange' : 'text-aims-navy')}>•</span>
            {l}
          </li>
        ))}
      </ul>

      {/* Ask the AI */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') ask(); }}
            placeholder="Ask the AI — e.g. 'Show me all innovations led by Pius'"
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-aims-navy/30"
          />
          <button onClick={ask} disabled={!query.trim() || asking} className={cn('px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5', query.trim() && !asking ? 'bg-aims-navy text-white hover:bg-aims-navy/90' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}>
            <span className="material-symbols-outlined text-[15px]">smart_toy</span>Ask
          </button>
        </div>
        <div className="flex gap-1.5 flex-wrap mt-2">
          {sampleQuestions.map((q) => (
            <button key={q} onClick={() => { setQuery(q); setAnswer(answerQuery(q)); }} className="text-[10px] font-bold text-aims-navy bg-aims-navy/5 border border-aims-navy/15 rounded-full px-2.5 py-1 hover:bg-aims-navy/10 transition-colors">
              {q}
            </button>
          ))}
        </div>
        {answer && (
          <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 whitespace-pre-wrap text-sm text-slate-700">
            {answer}
          </div>
        )}
      </div>
    </div>
  );
}
