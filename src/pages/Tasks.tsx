// src/pages/Tasks.tsx
// ============================================================
// AIMS — Innovation & Tasks workspace (Innovator landing, /innovations)
// Dashboard (My Projects · Active Tasks · Funding Pending) · New Innovation
// proposal lifecycle (draft → review → CD/ED decision → In Progress) ·
// executing pipeline (kanban/list) with stage-confidence AI insights.
// ============================================================

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { CHIP, ACCENT, type ColorKey } from '@/lib/uiTheme';
import { INNOVATION_STAGES, INNOVATION_STAGE_LABELS, type InnovationProject } from '@/types';
import { innovationService, isExecutingProject, LIFECYCLE_LABELS } from '@/services/innovationService';
import { getAllRequisitions } from '@/services/requisitionService';
import { stageTransitionConfidence, type AiInsight } from '@/lib/aiEngine';
import { AIPanel } from '@/components/ai/AIPanel';
import { FormsShortcut } from '@/components/forms/FormsShortcut';
import { ProposalModal } from '@/components/innovations/ProposalModal';

const STATUS_CHIP: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  review: 'bg-aims-orange/15 text-aims-orange border-aims-orange/25',
  changes: 'bg-red-50 text-red-600 border-red-200',
  active: 'bg-aims-green/15 text-aims-green border-aims-green/25',
  complete: 'bg-aims-mint/30 text-aims-navy border-aims-mint',
  archived: 'bg-slate-100 text-slate-400 border-slate-200',
};

function fmtUGX(n: number): string {
  if (n >= 1000000000) return `UGX ${(n / 1000000000).toFixed(1)}B`;
  if (n >= 1000000) return `UGX ${(n / 1000000).toFixed(0)}M`;
  if (n >= 1000) return `UGX ${(n / 1000).toFixed(0)}K`;
  return `UGX ${n}`;
}

export function Tasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast, addNotification } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [scope, setScope] = useState<'all' | 'mine'>('mine');
  const [, setTick] = useState(0);
  const refresh = () => setTick((v) => v + 1);
  const [showProposal, setShowProposal] = useState(false);
  const [editingProposal, setEditingProposal] = useState<InnovationProject | null>(null);
  const [feedbackById, setFeedbackById] = useState<Record<string, string>>({});
  const [expandedReview, setExpandedReview] = useState<Record<string, boolean>>({});
  const [highlightReview, setHighlightReview] = useState(searchParams.get('review') === '1');

  useEffect(() => {
    if (highlightReview) {
      // CD/ED reviewing from a notification must see every pending proposal
      if (user && ['CD', 'ED', 'COMPANY_ADMIN', 'SYS_ADMIN'].includes(user.role)) setScope('all');
      const el = document.getElementById('proposal-section');
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightReview]);

  if (!user) return <div className="p-8 text-center text-slate-500">Loading…</div>;

  const canSeeAll = ['CD', 'ED', 'COMPANY_ADMIN', 'SYS_ADMIN'].includes(user.role);

  const allProjects = innovationService.getAllProjects();
  const myProjectsAll = innovationService.getMyProjects(user.name);

  const proposals = allProjects.filter((p) => p.lifecycle && ['draft', 'review', 'changes'].includes(p.lifecycle.status ?? ''));
  const myProposals = proposals.filter((p) => p.leadName === user.name);
  const visibleProposals = canSeeAll && scope === 'all' ? proposals : myProposals;

  const pendingReview = proposals.filter((p) => p.lifecycle?.status === 'review');
  const myPendingReview = pendingReview.filter((p) => p.leadName === user.name);

  // Executing pipeline (drafts/reviews/archives excluded from stage boards)
  const projects = (scope === 'mine' ? myProjectsAll : canSeeAll ? allProjects : myProjectsAll).filter(isExecutingProject);
  const visibleProjects = searchQuery.trim()
    ? projects.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.leadName.toLowerCase().includes(searchQuery.toLowerCase()) || p.contributorNames.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())))
    : projects;

  // Dashboard widgets
  const myExecuting = myProjectsAll.filter(isExecutingProject);
  const myActiveTasks = myExecuting.reduce((s, p) => s + p.milestones.filter((m) => !m.completed).length, 0);
  const fundingPending = getAllRequisitions().filter((r) => r.requester === user.name && (r.status === 'pushed' || r.status === 'approved')).length;
  const myProposalCount = myProposals.length;

  const getAgingColor = (days: number) => days > 14 ? 'text-red-500 bg-red-50 border-red-200' : days >= 7 ? 'text-aims-orange bg-aims-orange/10 border-aims-orange/20' : 'text-aims-green bg-aims-green/10 border-aims-green/20';
  const getAgingDot = (days: number) => days > 14 ? 'bg-red-500' : days >= 7 ? 'bg-aims-orange' : 'bg-aims-green';

  const openNewProposal = () => { setEditingProposal(null); setShowProposal(true); };
  const openEditProposal = (p: InnovationProject) => { setEditingProposal(p); setShowProposal(true); };

  const submitProposal = (p: InnovationProject) => {
    const updated = innovationService.submitForReview(p.id, user.name);
    if (!updated) return;
    const who = ['Nassir Mwanje', 'Peter Byamugisha']; // CD + ED review queue
    who.forEach((name) => addNotification({
      recipientName: name,
      title: 'Innovation Proposal — Awaiting Your Review',
      message: `${user.name} submitted "${p.title}" (${updated.lifecycle?.category ?? 'Innovation'}) for CD/ED review. Impact: ${updated.lifecycle?.expectedImpact ?? 'see proposal'}`,
      type: 'approval',
      link: '/innovations?review=1',
      actionUrl: '/innovations?review=1',
    }));
    refresh();
    setHighlightReview(false);
    showToast({ title: 'Submitted for Review', message: `"${p.title}" is now Pending CD/ED Approval. The CD and ED have been notified.`, type: 'success' });
  };

  const decide = (p: InnovationProject, decision: 'approved' | 'changes') => {
    const feedback = (feedbackById[p.id] ?? '').trim();
    if (decision === 'changes' && !feedback) {
      showToast({ title: 'Feedback Required', message: 'Provide feedback so the innovator knows what to revise.', type: 'error' });
      return;
    }
    const updated = innovationService.decideProposal(p.id, decision, user.name, feedback);
    if (!updated) return;
    addNotification({
      recipientName: updated.leadName,
      title: decision === 'approved' ? 'Innovation Proposal Approved' : 'Innovation Proposal — Changes Requested',
      message: decision === 'approved'
        ? `"${updated.title}" was approved by ${user.name} — it is now In Progress. Add milestones and execute.`
        : `${user.name} requested changes on "${updated.title}". Feedback: ${feedback}`,
      type: decision === 'approved' ? 'success' : 'warning',
      link: `/innovations/${updated.id}`,
    });
    refresh();
    showToast({ title: decision === 'approved' ? 'Proposal Approved' : 'Changes Requested', message: decision === 'approved' ? `"${p.title}" is now In Progress — the innovator was notified.` : `Feedback sent back to ${p.leadName}.`, type: decision === 'approved' ? 'success' : 'warning' });
  };

  const resetProposalView = () => {
    if (searchParams.get('review') === '1') setSearchParams({});
    setHighlightReview(false);
  };

  const onProposalSaved = (p: InnovationProject) => {
    refresh();
    setShowProposal(false);
    setEditingProposal(null);
    showToast({ title: editingProposal ? 'Revision Saved' : 'Draft Saved', message: `"${p.title}" saved to aims_projects${editingProposal ? ' — resubmit when revised.' : ' — submit for CD/ED review when ready.'}`, type: 'success' });
  };

  const statTiles = [
    { label: 'My Projects', value: myExecuting.length, sub: 'executing in the pipeline', icon: 'lightbulb', tone: 'bg-aims-navy/10 text-aims-navy', onClick: () => setScope('mine') },
    { label: 'Active Tasks', value: myActiveTasks, sub: 'open milestones across your projects', icon: 'checklist', tone: 'bg-aims-green/10 text-aims-green', onClick: () => setScope('mine') },
    { label: 'Funding Requests Pending', value: fundingPending, sub: 'raised requisitions in the queue', icon: 'request_quote', tone: 'bg-aims-orange/10 text-aims-orange', onClick: () => navigate('/approvals') },
    { label: 'My Proposals', value: myProposalCount, sub: `${myPendingReview.length} awaiting decision`, icon: 'task', tone: 'bg-aims-mint/30 text-aims-navy', onClick: () => document.getElementById('proposal-section')?.scrollIntoView({ behavior: 'smooth' }) },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Innovations & Tasks</h1>
            <p className="text-base font-medium text-white">{scope === 'mine' ? 'Your innovation projects, proposals and tasks' : 'Organization-wide innovation pipeline oversight'}</p>
          </div>
          <button onClick={openNewProposal} className="px-5 py-2.5 bg-white text-aims-navy rounded-xl text-xs font-extrabold hover:bg-aims-mint/90 transition-colors flex items-center gap-1.5 shadow-sm">
            <span className="material-symbols-outlined text-[16px]">add_circle</span>New Innovation
          </button>
        </div>
      </div>

      {/* Dashboard widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statTiles.map((t) => (
          <button key={t.label} onClick={t.onClick} className="text-left bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-navy p-4 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between gap-1">{t.label}<span className={cn('material-symbols-outlined text-[15px] rounded p-0.5', t.tone)}>{t.icon}</span></p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{t.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{t.sub}</p>
          </button>
        ))}
      </div>

      <FormsShortcut module="innovations" title="Innovation Forms — Project Proposal · Feasibility Study" />

      {/* Proposal workspace — drafts, review queue, decisions */}
      {(visibleProposals.length > 0 || highlightReview || canSeeAll) && (
        <div id="proposal-section" className={cn('scroll-mt-24 rounded-xl border p-5', highlightReview && pendingReview.length > 0 ? 'border-aims-orange/40 bg-aims-orange/5' : 'border-slate-200 bg-white shadow-sm')}>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-aims-navy text-[20px]">description</span>Innovation Proposals
                {highlightReview && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-aims-orange/15 text-aims-orange uppercase animate-pulse">Awaiting your review</span>}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{canSeeAll && scope === 'all' ? 'Every proposal across the organisation — review & decide' : 'Your proposals — drafts, pending approval and revisions'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={openNewProposal} className="px-3 py-1.5 bg-aims-navy text-white text-[10px] font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">add</span>New Proposal</button>
              {highlightReview && <button onClick={resetProposalView} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-50">Dismiss highlight</button>}
            </div>
          </div>

          {visibleProposals.length === 0 ? (
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6 text-center">
              <p className="text-xs text-slate-400 italic">No proposals {canSeeAll && scope === 'all' ? 'in flight' : 'yet — click "New Innovation" to draft one'}.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleProposals.map((p) => {
                const lc = p.lifecycle;
                const status = lc?.status ?? 'draft';
                const isReviewer = canSeeAll && status === 'review';
                const isOwner = p.leadName === user.name || user.role === 'ED';
                const expanded = expandedReview[p.id] || (highlightReview && status === 'review');
                const total = (lc?.budgetLines ?? []).reduce((s, l) => s + l.amount, 0);
                return (
                  <div key={p.id} className={cn('rounded-xl border p-4', isReviewer && highlightReview ? 'border-aims-orange/40 bg-aims-orange/5' : 'border-slate-200 bg-white')}>
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-extrabold text-slate-900">{p.title}</p>
                          <span className={cn('px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase', STATUS_CHIP[status])}>{LIFECYCLE_LABELS[status]}</span>
                          {lc?.category && <span className="text-[10px] font-bold text-slate-400 uppercase">{lc.category}</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {lc?.timeline && <span className="text-[10px] text-slate-500 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">schedule</span>{lc.timeline}</span>}
                        <span className="text-[10px] font-bold text-aims-navy flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">payments</span>{total > 0 ? fmtUGX(total) : 'No budget yet'}</span>
                      </div>
                    </div>

                    <button onClick={() => setExpandedReview((m) => ({ ...m, [p.id]: !m[p.id] }))} className="mt-2 text-[10px] font-bold text-aims-navy hover:underline flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[12px]">{expanded ? 'expand_less' : 'expand_more'}</span>{expanded ? 'Hide details' : 'View details'}
                    </button>

                    {expanded && (
                      <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <div className="p-3 bg-aims-green/5 rounded-lg border border-aims-green/20">
                            <p className="text-[10px] font-bold text-aims-green uppercase tracking-wider flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">track_changes</span>Expected Impact</p>
                            <p className="text-xs text-slate-700 mt-1">{lc?.expectedImpact || 'Not stated — add an impact statement.'}</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Budget Line Items</p>
                            {(lc?.budgetLines?.length ?? 0) === 0 && <p className="text-[11px] text-slate-400 italic">No line items yet — add equipment, software, personnel or other.</p>}
                            {(lc?.budgetLines ?? []).map((l, i) => (
                              <div key={i} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0 text-xs">
                                <span className="capitalize text-slate-600">{l.kind}: <span className="text-slate-900">{l.item || '—'}</span></span>
                                <span className="font-bold text-slate-900">{fmtUGX(l.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Review Status</p>
                            <p className="text-xs text-slate-600">Lead: {p.leadName}</p>
                            {lc?.submittedAt && <p className="text-xs text-slate-500 mt-0.5">Submitted {new Date(lc.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>}
                            {lc?.decision && (
                              <div className={cn('mt-2 p-2.5 rounded-lg border text-[11px]', lc.decision.decision === 'approved' ? 'bg-aims-green/10 border-aims-green/25' : 'bg-red-50 border-red-200')}>
                                <p className="font-bold text-slate-900">{lc.decision.decision === 'approved' ? '✓ Approved' : 'Changes requested'} by {lc.decision.reviewer}</p>
                                {lc.decision.feedback && <p className="text-slate-600 mt-0.5">"{lc.decision.feedback}"</p>}
                              </div>
                            )}
                            {status === 'changes' && !lc?.decision?.feedback && <p className="text-[11px] text-slate-500 mt-1 italic">Returned for revision — update and resubmit.</p>}
                          </div>
                          {isReviewer && (
                            <div className="p-3 bg-aims-orange/5 rounded-lg border border-aims-orange/20">
                              <p className="text-[10px] font-bold text-aims-orange uppercase tracking-wider mb-2">Your Decision</p>
                              <textarea value={feedbackById[p.id] ?? ''} onChange={(e) => setFeedbackById((m) => ({ ...m, [p.id]: e.target.value }))} rows={2} placeholder={status === 'review' ? 'Decision note (required when requesting changes)…' : 'Feedback from your last decision…'} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-orange/40" />
                              <div className="flex gap-2 mt-2">
                                <button onClick={() => decide(p, 'approved')} className="px-3 py-1.5 bg-aims-green text-white text-[10px] font-bold rounded-lg hover:bg-aims-green/90 flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">check_circle</span>Approve → In Progress</button>
                                <button onClick={() => decide(p, 'changes')} className="px-3 py-1.5 bg-aims-orange text-white text-[10px] font-bold rounded-lg hover:bg-aims-orange/90 flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">assignment_return</span>Request Changes</button>
                              </div>
                            </div>
                          )}
                          {isOwner && !isReviewer && status !== 'review' && (status === 'draft' || status === 'changes') && (
                            <div className="flex gap-2">
                              <button onClick={() => openEditProposal(p)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-50 flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">edit</span>{status === 'changes' ? 'Revise Proposal' : 'Edit Draft'}</button>
                              <button onClick={() => submitProposal(p)} className="px-3 py-1.5 bg-aims-navy text-white text-[10px] font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">send</span>{status === 'changes' ? 'Resubmit for Review' : 'Submit for Review'}</button>
                            </div>
                          )}
                          {isOwner && status === 'review' && <p className="text-[10px] text-aims-orange italic flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">hourglass_top</span>Awaiting the CD/ED decision…</p>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* AI Insights — predictive pipeline analysis (executing projects only) */}
      {(() => {
        const insights: AiInsight[] = [];
        const stalled = visibleProjects.filter((p) => p.daysInStage > 14);
        if (stalled.length > 0) insights.push({ id: 't-stall', module: 'innovations', severity: 'warning', title: `${stalled.length} project(s) stalled in stage`, detail: stalled.map((p) => `${p.title} (${p.daysInStage}d in ${p.stage})`).join('; ') + ' - consider unblocking.' });
        const low = visibleProjects.filter((p) => stageTransitionConfidence(p.id).confidence === 'low');
        low.forEach((p) => {
          const conf = stageTransitionConfidence(p.id);
          insights.push({ id: `t-${p.id}`, module: 'innovations', severity: 'warning', title: `Low confidence: ${p.title}`, detail: conf.missing[0] ?? conf.reason });
        });
        const ready = visibleProjects.filter((p) => stageTransitionConfidence(p.id).confidence === 'high' && p.stage !== 'deployed');
        if (ready.length > 0) insights.push({ id: 't-ready', module: 'innovations', severity: 'success', title: `${ready.length} project(s) ready to advance`, detail: ready.map((p) => `${p.title} -> next stage`).join('; ') });
        return <AIPanel title="AI Insights — Pipeline & Stage Transition Readiness" insights={insights.slice(0, 5)} />;
      })()}

      {/* Stage counts (executing pipeline) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {INNOVATION_STAGES.map((s) => {
          const count = visibleProjects.filter((p) => p.stage === s).length;
          const colorMap: Record<string, ColorKey> = { research: 'mint', concept: 'orange', prototype: 'navy', testing: 'mint', production: 'green', deployed: 'navy' };
          return (<div key={s} className={cn('bg-white rounded-xl border border-slate-200 border-t-4 p-4 shadow-sm text-center', ACCENT[colorMap[s] || 'navy'])}><p className="text-2xl font-extrabold text-slate-900">{count}</p><p className="text-xs font-semibold text-slate-500 mt-1">{INNOVATION_STAGE_LABELS[s]}</p></div>);
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {canSeeAll && (
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button onClick={() => setScope('all')} className={cn('px-4 py-1.5 rounded-md text-xs font-bold transition-all', scope === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>All Projects</button>
              <button onClick={() => setScope('mine')} className={cn('px-4 py-1.5 rounded-md text-xs font-bold transition-all', scope === 'mine' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>My Tasks</button>
            </div>
          )}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button onClick={() => setViewMode('kanban')} className={cn('px-4 py-1.5 rounded-md text-xs font-bold transition-all', viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>Kanban</button>
            <button onClick={() => setViewMode('list')} className={cn('px-4 py-1.5 rounded-md text-xs font-bold transition-all', viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>List</button>
          </div>
        </div>
        <div className="relative w-56">
          <span className="material-symbols-outlined text-slate-400 text-[16px] absolute left-2.5 top-1/2 -translate-y-1/2">search</span>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search projects, leads…" className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {INNOVATION_STAGES.map((stage) => {
            const stageProjects = visibleProjects.filter((p) => p.stage === stage);
            const colorMap: Record<string, ColorKey> = { research: 'mint', concept: 'orange', prototype: 'navy', testing: 'mint', production: 'green', deployed: 'navy' };
            const color = colorMap[stage] || 'navy';

            return (
              <div key={stage} className="flex flex-col">
                <div className={cn('rounded-t-xl px-3 py-2.5 flex items-center justify-between', CHIP[color])}><span className="text-xs font-bold uppercase tracking-wider text-white">{INNOVATION_STAGE_LABELS[stage]}</span><span className="text-xs font-extrabold text-white bg-white/20 px-2 py-0.5 rounded-full">{stageProjects.length}</span></div>
                <div className="bg-slate-50 rounded-b-xl border border-slate-200 border-t-0 p-2 space-y-2 min-h-[200px]">
                  {stageProjects.length === 0 && <p className="text-xs text-slate-400 text-center py-8 italic">No projects</p>}
                  {stageProjects.map((p) => (
                    <div key={p.id} onClick={() => navigate(`/innovations/${p.id}`)} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                      <p className="text-sm font-bold text-slate-900 mb-1 group-hover:text-aims-navy transition-colors">{p.title}</p>
                      <p className="text-[10px] text-slate-500 mb-2">Lead: {p.leadName}</p>
                      <div className="mb-2"><div className="w-full bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-aims-green" style={{ width: `${p.progressPercent}%` }} /></div></div>
                      <p className="text-[10px] text-slate-500 mb-2">{p.milestones?.filter(m => m.completed).length || 0}/{p.milestones?.length || 0} milestones</p>
                      <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-bold', getAgingColor(p.daysInStage))}><span className={cn('w-1.5 h-1.5 rounded-full', getAgingDot(p.daysInStage))} />{p.daysInStage}d in stage</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-slate-200"><th className="pb-2 font-bold text-slate-500 text-xs uppercase">Project</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase">Stage</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase">Lead</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase">Progress</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {visibleProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 font-bold text-slate-900">{p.title}</td>
                    <td className="py-2.5"><span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-aims-navy/10 text-aims-navy capitalize">{p.stage}</span></td>
                    <td className="py-2.5 text-slate-600">{p.leadName}</td>
                    <td className="py-2.5"><div className="w-16 bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-aims-green" style={{ width: `${p.progressPercent}%` }} /></div></td>
                    <td className="py-2.5 text-right"><button onClick={() => navigate(`/innovations/${p.id}`)} className="text-xs font-bold text-aims-navy hover:underline">Open</button></td>
                  </tr>
                ))}
                {visibleProjects.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-xs text-slate-400 italic">No executing projects in this view — approved proposals appear here under Research.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New / revise proposal modal */}
      <ProposalModal open={showProposal} editing={editingProposal} creatorName={user.name} onClose={() => { setShowProposal(false); setEditingProposal(null); }} onSaved={onProposalSaved} />
    </div>
  );
}
