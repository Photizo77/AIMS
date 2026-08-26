// src/components/grants/ProposalWorkspace.tsx
// ============================================================
// AIMS — Grant Proposal Workspace
// Sectioned proposal editor with autosave, versioning, AI assist per
// section, and the reusable compliance pack — the seamless grant-writing
// surface used inside GrantDetail.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { PROPOSAL_SECTION_DEFS, proposalService } from '@/services/proposalService';
import { complianceService } from '@/services/complianceService';
import { generateSectionText } from '@/lib/aiEngine';

export function ProposalWorkspace({ grantId }: { grantId: string }) {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [activeKey, setActiveKey] = useState(PROPOSAL_SECTION_DEFS[0].key);
  const [proposal, setProposal] = useState(() => proposalService.getProposal(grantId));
  const [draft, setDraft] = useState('');
  const [generating, setGenerating] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const activeDef = PROPOSAL_SECTION_DEFS.find((d) => d.key === activeKey)!;
  const section = proposal.sections.find((s) => s.key === activeKey);
  const compliance = complianceService.getAll();
  const vaultStatus = complianceService.checklistStatus();

  useEffect(() => {
    setDraft(section?.content ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, grantId]);

  const autosave = (content: string) => {
    setDraft(content);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const updated = proposalService.updateSection(grantId, activeKey, content);
      setProposal({ ...updated });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    }, 600);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    const text = await generateSectionText(activeKey, grantId);
    setDraft(text);
    const updated = proposalService.updateSection(grantId, activeKey, text);
    setProposal({ ...updated });
    setGenerating(false);
    showToast({ title: 'AI Draft Ready', message: `"${activeDef.title}" drafted — review and tailor it.`, type: 'success' });
  };

  const handleSaveVersion = () => {
    const v = proposalService.saveVersion(grantId);
    setProposal({ ...proposalService.getProposal(grantId) });
    showToast({ title: 'Version Saved', message: `Proposal snapshot v${v.v} saved.`, type: 'success' });
  };

  const handleRestore = (v: number) => {
    const updated = proposalService.restoreVersion(grantId, v);
    setProposal({ ...updated });
    setDraft(updated.sections.find((s) => s.key === activeKey)?.content ?? '');
    showToast({ title: 'Version Restored', message: `Restored v${v}.`, type: 'info' });
  };

  const handleUpload = (category: string) => {
    const fileName = prompt(`File name for "${category}" (e.g. ARDHI_NGO_Reg.pdf):`, 'document.pdf');
    if (!fileName?.trim()) return;
    complianceService.upload(category, fileName.trim(), user?.name ?? 'Admin');
    showToast({ title: 'Document Filed', message: `"${category}" added to the compliance vault.`, type: 'success' });
  };

  return (
    <div className="space-y-4">
      {/* Autosave status */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-slate-500">
          <span className={cn('font-bold', savedFlash ? 'text-aims-green' : 'text-slate-400')}>{savedFlash ? '✓ Saved' : 'Autosave on'}</span> · v{proposal.versions.length} snapshots
        </p>
        <div className="flex gap-2">
          <button onClick={handleSaveVersion} className="px-3 py-1.5 bg-aims-navy text-white text-[10px] font-bold rounded-lg hover:bg-aims-navy/90">Save Version</button>
          <button onClick={handleGenerate} disabled={generating} className={cn('px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1', generating ? 'bg-slate-100 text-slate-400' : 'bg-aims-green text-white hover:bg-aims-green/90')}>
            <span className="material-symbols-outlined text-[13px]">auto_awesome</span>{generating ? 'Drafting…' : 'AI Draft this section'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sections */}
        <div className="space-y-1">
          {PROPOSAL_SECTION_DEFS.map((d) => (
            <button
              key={d.key}
              onClick={() => setActiveKey(d.key)}
              className={cn('w-full text-left px-3 py-2 rounded-lg border text-xs font-bold transition-colors', activeKey === d.key ? 'bg-aims-navy text-white border-aims-navy' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')}
            >
              {d.title}
              {(proposal.sections.find((s) => s.key === d.key)?.content.length ?? 0) > 40 && (
                <span className={cn('block text-[9px] font-semibold mt-0.5', activeKey === d.key ? 'text-white/70' : 'text-aims-green')}>✓ drafted</span>
              )}
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="lg:col-span-2 space-y-3">
          <div>
            <p className="text-sm font-bold text-slate-900">{activeDef.title}</p>
            <p className="text-[10px] text-slate-500">{activeDef.hint}</p>
          </div>
          <textarea
            value={draft}
            onChange={(e) => autosave(e.target.value)}
            rows={14}
            placeholder="Write this section here — autosaves automatically. Use 'AI Draft this section' to start from a draft."
            className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30 resize-y leading-relaxed"
          />
          {proposal.versions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Versions:</span>
              {proposal.versions.map((v) => (
                <button key={v.v} onClick={() => handleRestore(v.v)} className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-aims-navy/10 hover:text-aims-navy" title={new Date(v.savedAt).toLocaleString()}>
                  v{v.v}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compliance pack */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div>
            <p className="text-sm font-bold text-slate-900">Compliance Pack — reusable across every grant</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Upload once; proposals auto-check against this vault.</p>
          </div>
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', vaultStatus.present >= vaultStatus.total * 0.7 ? 'bg-aims-green/15 text-aims-green' : 'bg-aims-orange/15 text-aims-orange')}>
            {vaultStatus.present}/{vaultStatus.total} uploaded
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {compliance.map((d) => (
            <div key={d.category} className={cn('flex items-center justify-between gap-2 p-2 rounded-lg border text-xs', d.fileName ? 'bg-aims-green/5 border-aims-green/20' : 'bg-slate-50 border-slate-100')}>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 truncate">{d.category}</p>
                {d.fileName && <p className="text-[9px] text-aims-green truncate">{d.fileName}</p>}
              </div>
              {d.fileName ? (
                <button onClick={() => { complianceService.remove(d.category); showToast({ title: 'Removed', message: d.category, type: 'info' }); }} className="text-[9px] font-bold text-red-500 hover:underline shrink-0">Remove</button>
              ) : (
                <button onClick={() => handleUpload(d.category)} className="text-[9px] font-bold text-aims-navy hover:underline shrink-0">Upload</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
