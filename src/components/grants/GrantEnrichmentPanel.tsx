// src/components/grants/GrantEnrichmentPanel.tsx
// ============================================================
// AIMS — Grant URL Enrichment + automated donor compliance check.
// Paste a grant page link → POST to /api/enrich-grant (Jina Reader +
// strict, anti-hallucination LLM extraction) → show extracted fields
// and compliance gaps vs ARDHI's orgKnowledge → "Apply to Form".
// ============================================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import { runComplianceCheck } from '@/lib/complianceChecker';
import type { EnrichGrantResponse, GrantEnrichmentData } from '@/lib/grantEnrichment';

interface GrantEnrichmentPanelProps {
  /** Fired with the extracted grant data when the user clicks "Apply to Form" */
  onApply: (data: GrantEnrichmentData) => void;
  /** Render as a compact card inside an existing form container */
  compact?: boolean;
}

export function GrantEnrichmentPanel({ onApply, compact }: GrantEnrichmentPanelProps) {
  const { showToast } = useNotifications();
  const [link, setLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enriched, setEnriched] = useState<GrantEnrichmentData | null>(null);

  const gaps = enriched ? runComplianceCheck(enriched.key_eligibility_requirements) : [];

  const enrich = async () => {
    const trimmed = link.trim();
    if (!trimmed) {
      showToast({ title: 'Link Required', message: 'Paste a grant page URL first (e.g. a Horizon Europe or donor call page).', type: 'error' });
      return;
    }
    setIsLoading(true);
    setError(null);
    setEnriched(null);
    try {
      const res = await fetch('/api/enrich-grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = (await res.json()) as EnrichGrantResponse;
      if (!res.ok || !data.ok || !data.grant) {
        setError(data.error ?? 'Enrichment failed — the page could not be read.');
        return;
      }
      setEnriched(data.grant);
    } catch {
      setError('Could not reach the enrichment service. The /api/enrich-grant function must be deployed (Vercel) with an OPENAI_API_KEY or ANTHROPIC_API_KEY.');
    } finally {
      setIsLoading(false);
    }
  };

  const fieldCount = enriched ? Object.values(enriched).filter((v) => Array.isArray(v) ? v.length > 0 : Boolean(v)).length : 0;
  const deadlineLabel = enriched?.submission_deadline ?? 'Not specified in source';

  return (
    <div className={cn('rounded-xl border border-slate-200 overflow-hidden', compact ? '' : 'shadow-sm')}>
      {/* Header / input */}
      <div className="bg-grad-navy px-4 py-3 flex items-center justify-between gap-2">
        <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-aims-mint">auto_awesome</span>Grant URL Enrichment
        </p>
        <span className="text-[9px] font-bold uppercase tracking-wide text-white/70">Strict extraction · no guessing</span>
      </div>
      <div className="p-3 space-y-2 bg-white">
        <div className="flex gap-2">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void enrich(); } }}
            placeholder="Source link — e.g. https://ec.europa.eu/info/funding/…"
            className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30"
          />
          <button
            onClick={() => void enrich()}
            disabled={isLoading}
            className={cn('shrink-0 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors', isLoading ? 'bg-slate-100 text-slate-400 cursor-wait' : 'bg-aims-green text-white hover:bg-aims-green/90')}
          >
            <span className={cn('material-symbols-outlined text-[15px]', isLoading && 'animate-spin')}>{isLoading ? 'progress_activity' : 'auto_awesome'}</span>
            {isLoading ? 'Analyzing document…' : '✨ Enrich from Link'}
          </button>
        </div>

        {isLoading && (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
            <div className="h-3 bg-slate-200 rounded w-2/3" />
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg border text-xs text-red-700 bg-red-50 border-red-200 flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Extracted result */}
        {enriched && (
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Extracted ({fieldCount} fields)</p>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-aims-navy/10 text-aims-navy uppercase">Strict — only from the source page</span>
              </div>
              <p className="text-sm font-extrabold text-slate-900">{enriched.grant_title ?? 'Untitled grant'}</p>
              {enriched.funder_donor && <p className="text-xs text-slate-500 mt-0.5">Funder: {enriched.funder_donor}{enriched.funder_type ? ` · ${enriched.funder_type}` : ''}</p>}
              {enriched.grant_id && <p className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {enriched.grant_id}</p>}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-aims-green/10 text-aims-green capitalize">{enriched.deadline_status ?? 'No deadline'}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">Deadline: {deadlineLabel}</span>
                {enriched.days_to_deadline !== null && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-aims-orange/10 text-aims-orange">{enriched.days_to_deadline} day(s)</span>}
                {enriched.award_value_ceiling && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-aims-navy/10 text-aims-navy">{enriched.award_value_ceiling}{enriched.currency ? ` ${enriched.currency}` : ''}</span>}
                {enriched.consortium_allowed && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">Consortium: {enriched.consortium_allowed}</span>}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">{enriched.key_eligibility_requirements.length} eligibility requirement(s) · {enriched.required_documents.length} required document(s) extracted</p>
            </div>

            {/* Compliance gaps — AIMS alert orange #eb3b14 */}
            <div className={cn('rounded-lg border p-3', gaps.length > 0 ? 'bg-aims-orange/10 border-aims-orange/40' : 'bg-aims-green/5 border-aims-green/25')}>
              <p className={cn('text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5', gaps.length > 0 ? 'text-[#eb3b14]' : 'text-aims-green')}>
                <span className="material-symbols-outlined text-[14px]">{gaps.length > 0 ? 'rule' : 'verified'}</span>Donor Compliance Check — {gaps.length === 0 ? 'No capability gaps flagged' : `${gaps.length} capability gap(s)`}
              </p>
              {gaps.length === 0 ? (
                <p className="text-xs text-slate-600">Requirements that could be verified against ARDHI's orgKnowledge all match. Unverifiable items are intentionally not reported.</p>
              ) : (
                <ul className="space-y-1.5">
                  {gaps.map((g, i) => (
                    <li key={i} className="text-xs text-slate-800 flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#eb3b14] text-[15px] shrink-0 mt-0.5">warning</span>
                      <span>{g.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => { setEnriched(null); setLink(''); }} className="px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Reset</button>
              <button onClick={() => onApply(enriched)} className="px-4 py-1.5 bg-aims-navy text-white text-[10px] font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px]">playlist_add_check</span>Apply to Form
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
