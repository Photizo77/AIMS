// src/pages/GrantDetail.tsx
// ============================================================
// AIMS — Grant Detail (data-driven, full lifecycle workflow)
// Writer: start drafting, checklist, documents, comments, PUSH TO ED
// ED/CD:  approve → Awarded, request changes → back to Drafting
// ============================================================

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { GRANT_STAGES, formatCurrency, daysUntil, grantProgress, type GrantRecord } from '@/data/grants';
import { grantService } from '@/services/grantService';
import { openFlagForED } from '@/components/grants/FlagForEDModal';
import { grantRiskScore, draftProblemStatement } from '@/lib/aiEngine';
import { ProposalWorkspace } from '@/components/grants/ProposalWorkspace';

type TabKey = 'overview' | 'proposal' | 'checklist' | 'documents' | 'comments' | 'activity';

const STAGE_LABELS = GRANT_STAGES.reduce((acc, s) => ({ ...acc, [s.key]: s.label }), {} as Record<string, string>);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(iso: string): string {
  return formatDate(iso) + ' at ' + new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function GrantDetail() {
  const { grantId } = useParams<{ grantId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast, addNotification } = useNotifications();

  const [grant, setGrant] = useState<GrantRecord | null>(() => {
    const found = grantService.getGrantById(grantId || '');
    return found ? { ...found } : null;
  });
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [commentText, setCommentText] = useState('');
  const [edNote, setEdNote] = useState('');
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);

  const handleAiDraft = async () => {
    setDrafting(true);
    const draft = await draftProblemStatement(grant?.id ?? '');
    setAiDraft(draft);
    setDrafting(false);
  };

  if (!user) return <div className="p-8 text-center text-slate-500">Loading…</div>;

  if (!grant) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Grant Not Found</h2>
        <button onClick={() => navigate('/grants')} className="px-4 py-2 bg-aims-navy text-white rounded-lg text-sm font-bold">Back to Grants</button>
      </div>
    );
  }

  const isHandler = grant.handler === user.name;
  const isContributor = grant.contributors.includes(user.name);
  const isGrantTeam = isHandler || isContributor;
  const isED = user.role === 'ED' || user.role === 'CD';
  const isUnassigned = !grant.handler || grant.handler === 'Unassigned';
  const awaitingED = grant.stage === 'submitted' || grant.stage === 'under_review';
  const writerLocked = !isED && (grant.stage === 'submitted' || grant.stage === 'under_review' || grant.stage === 'awarded');

  const days = daysUntil(grant.deadline);
  const progress = grantProgress(grant);
  const completedMilestones = grant.milestones.filter((m) => m.completed).length;
  const stageInfo = GRANT_STAGES.find((s) => s.key === grant.stage);

  const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: 'info' },
    { key: 'proposal', label: 'Proposal', icon: 'edit_document' },
    { key: 'checklist', label: 'Checklist', icon: 'checklist' },
    { key: 'documents', label: 'Documents', icon: 'folder' },
    { key: 'comments', label: 'Comments', icon: 'chat_bubble' },
    { key: 'activity', label: 'Activity', icon: 'history' },
  ];

  const apply = (updated: GrantRecord | undefined) => {
    if (updated) setGrant({ ...updated });
  };

  const handleExpressInterest = () => {
    const updated = grantService.expressInterest(grant.id, user.name);
    apply(updated);
    addNotification({ title: 'Grant Assigned', message: `You are now assigned to "${grant.title}".`, type: 'success', link: `/grants/${grant.id}` });
    showToast({ title: 'Assigned', message: 'You are now the handler for this grant.', type: 'success' });
  };

  const handleStartDrafting = () => {
    const updated = grantService.startDrafting(grant.id, user.name);
    apply(updated);
    showToast({ title: 'Drafting Started', message: 'Grant moved to Drafting.', type: 'success' });
  };

  const handlePushToED = () => {
    const updated = grantService.submitToED(grant.id, user.name);
    apply(updated);
    addNotification({ userId: 'user-ed-001', title: 'Grant Submitted for Review', message: `${user.name} submitted "${grant.title}" — awaiting your review.`, type: 'approval', link: '/dashboard', actionUrl: '/dashboard' });
    showToast({ title: 'Pushed to ED', message: 'Grant is now awaiting ED review (read-only for you).', type: 'success' });
  };

  const handleEDDecision = (decision: 'approve' | 'changes') => {
    if (edNote.trim().length < 5) {
      showToast({ title: 'Note Required', message: 'Please add a note (min 5 characters) explaining your decision.', type: 'error' });
      return;
    }
    const updated = grantService.edDecision(grant.id, decision, edNote.trim(), user.name);
    apply(updated);
    if (decision === 'approve') {
      addNotification({ title: 'Grant Approved', message: `"${grant.title}" was APPROVED. Ready for distribution.`, type: 'success', link: `/grants/${grant.id}` });
    } else {
      addNotification({ title: 'Changes Requested', message: `ED requested changes on "${grant.title}". Please revise and resubmit.`, type: 'warning', link: `/grants/${grant.id}` });
    }
    showToast({ title: decision === 'approve' ? 'Grant Approved' : 'Changes Requested', message: 'Writer has been notified.', type: 'success' });
    setEdNote('');
  };

  const handleToggleMilestone = (id: string) => {
    if (writerLocked || (!isGrantTeam && !isED)) {
      showToast({ title: 'Read Only', message: 'This grant is read-only at this stage.', type: 'error' });
      return;
    }
    apply(grantService.toggleMilestone(grant.id, id, user.name));
  };

  const handleAddMilestone = () => {
    if (!newMilestoneTitle.trim()) return;
    apply(grantService.addMilestone(grant.id, newMilestoneTitle.trim(), user.name));
    showToast({ title: 'Milestone Added', message: 'Added to the checklist.', type: 'success' });
    setNewMilestoneTitle('');
    setShowAddMilestone(false);
  };

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    apply(grantService.addComment(grant.id, commentText.trim(), user.name, user.role));
    showToast({ title: 'Comment Posted', message: 'Added to grant discussion.', type: 'success' });
    setCommentText('');
  };

  const handleUploadDoc = () => {
    if (!newDocTitle.trim()) return;
    apply(grantService.addDocument(grant.id, newDocTitle.trim(), user.name));
    showToast({ title: 'Document Uploaded', message: 'Added to grant documents.', type: 'success' });
    setNewDocTitle('');
    setShowAddDoc(false);
  };

  const canEditChecklist = isGrantTeam && !writerLocked;
  const canComment = isGrantTeam && !writerLocked;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/grants')} className="text-xs font-bold text-aims-navy hover:underline flex items-center gap-1">
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>Back to Grants
      </button>

      {/* Header */}
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className={cn('inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide', stageInfo && stageInfo.color === 'red' ? 'bg-red-500 text-white' : 'bg-white/20 text-white')}>{STAGE_LABELS[grant.stage]}</span>
              <span className={cn('text-xs font-bold px-2 py-0.5 rounded border', days <= 7 ? 'bg-red-500/20 text-white border-red-400' : days <= 30 ? 'bg-aims-orange/20 text-white border-aims-orange' : 'bg-white/10 text-white border-white/20')}>{days}d until deadline</span>
              {isUnassigned && <span className="text-xs font-bold px-2 py-0.5 rounded bg-aims-orange text-white">Unassigned</span>}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">{grant.title}</h1>
            <p className="text-sm text-white/80">{grant.funder} • {grant.pillar} • ID: {grant.id}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Requested</p>
            <p className="text-xl font-extrabold text-white">{formatCurrency(grant.amountRequested)}</p>
            {grant.amountAwarded && <p className="text-xs text-aims-green font-bold mt-0.5">Awarded: {formatCurrency(grant.amountAwarded)}</p>}
          </div>
        </div>

        {/* Context-sensitive action bar */}
        <div className="mt-5 pt-4 border-t border-white/15 flex items-center gap-2 flex-wrap">
          {isUnassigned && user.role === 'GRANT_WRITER' && (
            <button onClick={handleExpressInterest} className="px-4 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">handshake</span>Express Interest — Auto-Assign Me
            </button>
          )}
          {user.role === 'CD' && (
            <button onClick={() => openFlagForED({ recordLabel: `${grant.id} — ${grant.title}`, sourceModule: 'grants' })} className="px-4 py-2 bg-aims-orange text-white text-xs font-bold rounded-lg hover:bg-aims-orange/90 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">flag</span>Flag for ED
            </button>
          )}
          {isHandler && grant.stage === 'identified' && (
            <button onClick={handleStartDrafting} className="px-4 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">edit_note</span>Start Drafting
            </button>
          )}
          {isHandler && grant.stage === 'drafting' && (
            <button onClick={handlePushToED} className="px-4 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">send</span>Push to ED
            </button>
          )}
          {isED && awaitingED && (
            <>
              <textarea
                value={edNote}
                onChange={(e) => setEdNote(e.target.value)}
                placeholder="Decision note (required, min 5 chars)…"
                rows={1}
                className="flex-1 min-w-[220px] text-xs bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
              />
              <button onClick={() => handleEDDecision('approve')} className="px-4 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>Approve → Awarded
              </button>
              <button onClick={() => handleEDDecision('changes')} className="px-4 py-2 bg-aims-orange text-white text-xs font-bold rounded-lg hover:bg-aims-orange/90 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">assignment_return</span>Request Changes
              </button>
            </>
          )}
          {writerLocked && (
            <span className="text-[11px] text-white/70 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">lock</span>Read-only — awaiting ED decision
            </span>
          )}
        </div>
      </div>

      {/* Team + Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-2">
          <h3 className="text-base font-bold text-slate-900 mb-3">Team</h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-aims-navy/5 rounded-lg border border-aims-navy/15">
              <div className="w-7 h-7 rounded-full bg-aims-navy text-white flex items-center justify-center text-[10px] font-bold">{grant.handler !== 'Unassigned' ? grant.handler.split(' ').map((n) => n[0]).join('') : '?'}</div>
              <div><p className="text-xs font-bold text-slate-900">{grant.handler}</p><p className="text-[9px] font-bold uppercase text-aims-navy">Handler</p></div>
            </div>
            {grant.contributors.map((c) => (
              <div key={c} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-7 h-7 rounded-full bg-aims-green text-white flex items-center justify-center text-[10px] font-bold">{c.split(' ').map((n) => n[0]).join('')}</div>
                <div><p className="text-xs font-bold text-slate-900">{c}</p><p className="text-[9px] font-bold uppercase text-slate-400">Contributor</p></div>
              </div>
            ))}
            {grant.contributors.length === 0 && <p className="text-xs text-slate-400 italic">No contributors yet.</p>}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-3">Progress</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">{completedMilestones}/{grant.milestones.length} milestones</span>
            <span className="text-2xl font-extrabold text-aims-green">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 mb-3"><div className="h-3 rounded-full bg-aims-green transition-all duration-500" style={{ width: `${progress}%` }} /></div>
          <p className="text-xs text-slate-500">Progress driven by milestone completion.</p>
        </div>
      </div>

      {/* AI Insights — risk scoring, compliance flags, drafting */}
      {(() => {
        const risk = grantRiskScore(grant.id);
        const riskColor = risk.score >= 60 ? 'text-red-600 bg-red-50 border-red-200' : risk.score >= 30 ? 'text-aims-orange bg-aims-orange/10 border-aims-orange/20' : 'text-aims-green bg-aims-green/10 border-aims-green/20';
        return (
          <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-aims-navy p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-aims-navy/10 flex items-center justify-center"><span className="material-symbols-outlined text-aims-navy text-[20px]">auto_awesome</span></span>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">AI Insights — Grant Risk & Compliance</h3>
                <p className="text-[10px] font-bold text-aims-navy uppercase tracking-wider">Auto-generated · review before submission</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className={cn('text-xs font-extrabold px-3 py-1 rounded-full border', riskColor)}>Risk score: {risk.score}/100 — {risk.label}</span>
              <button onClick={handleAiDraft} disabled={drafting} className={cn('px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5', drafting ? 'bg-slate-100 text-slate-400' : 'bg-aims-navy text-white hover:bg-aims-navy/90')}>
                <span className="material-symbols-outlined text-[15px]">auto_awesome</span>{drafting ? 'Drafting…' : 'AI Draft Problem Statement'}
              </button>
            </div>
            {risk.flags.length > 0 && (
              <ul className="space-y-1">
                {risk.flags.map((f, i) => (
                  <li key={i} className="text-xs text-slate-600 flex gap-2"><span className={cn('mt-0.5', risk.score >= 60 ? 'text-red-500' : 'text-aims-orange')}>•</span>{f}</li>
                ))}
              </ul>
            )}
            {risk.flags.length === 0 && <p className="text-xs text-slate-500 italic">No compliance risks detected — this grant looks submission-ready.</p>}
            {aiDraft && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">AI Draft — Problem Statement</p>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 whitespace-pre-wrap text-sm text-slate-700 max-h-80 overflow-y-auto">{aiDraft}</div>
                <button onClick={() => setAiDraft(null)} className="mt-2 text-[10px] font-bold text-aims-navy hover:underline">Dismiss</button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={cn('px-5 py-3 text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 border-b-2', activeTab === tab.key ? 'border-aims-navy text-aims-navy bg-aims-navy/5' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50')}>
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        <div className="p-5 min-h-[320px]">
          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed">{grant.description || 'No description provided for this grant yet.'}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Deadline</p><p className="text-sm font-bold text-slate-900 mt-0.5">{formatDate(grant.deadline)}</p></div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Stage</p><p className="text-sm font-bold text-slate-900 mt-0.5 capitalize">{STAGE_LABELS[grant.stage]}</p></div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Milestones</p><p className="text-sm font-bold text-slate-900 mt-0.5">{completedMilestones}/{grant.milestones.length} done</p></div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Handler</p><p className="text-sm font-bold text-slate-900 mt-0.5">{grant.handler}</p></div>
              </div>
              {grant.edNotes && (
                <div className="p-3 bg-aims-navy/5 rounded-lg border border-aims-navy/15">
                  <p className="text-[10px] font-bold text-aims-navy uppercase tracking-wider mb-1">ED Notes</p>
                  <p className="text-xs text-slate-700 italic">"{grant.edNotes}"</p>
                </div>
              )}
            </div>
          )}

          {/* Proposal — sectioned workspace with AI + compliance pack */}
          {activeTab === 'proposal' && <ProposalWorkspace grantId={grant.id} />}

          {/* Checklist */}
          {activeTab === 'checklist' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">{writerLocked ? 'Read-only at this stage.' : 'Check off milestones as they are completed.'}</p>
                {canEditChecklist && (
                  <button onClick={() => setShowAddMilestone(true)} className="px-3 py-1.5 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">add</span>Add Milestone
                  </button>
                )}
              </div>
              {grant.milestones.map((m) => (
                <div key={m.id} className={cn('flex items-start gap-3 p-3 rounded-lg border transition-colors', m.completed ? 'bg-aims-green/5 border-aims-green/20' : 'bg-slate-50 border-slate-100')}>
                  <input type="checkbox" checked={m.completed} onChange={() => handleToggleMilestone(m.id)} disabled={!canEditChecklist} className={cn('mt-0.5 w-4 h-4 rounded border-slate-300 accent-aims-green', !canEditChecklist && 'cursor-not-allowed opacity-50')} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-bold', m.completed ? 'text-slate-500 line-through' : 'text-slate-900')}>{m.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">person</span>{m.assignee} • Due {formatDate(m.dueDate)}</p>
                  </div>
                  {m.completed && <span className="material-symbols-outlined text-aims-green text-[20px]">check_circle</span>}
                </div>
              ))}
            </div>
          )}

          {/* Documents */}
          {activeTab === 'documents' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">{writerLocked ? 'Read-only at this stage.' : 'Upload proposal drafts, budgets and supporting files.'}</p>
                {canEditChecklist && (
                  <button onClick={() => setShowAddDoc(true)} className="px-3 py-1.5 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">upload_file</span>Upload Document
                  </button>
                )}
              </div>
              {(grant.documents ?? []).length === 0 && <p className="text-xs text-slate-400 italic">No documents uploaded yet.</p>}
              {(grant.documents ?? []).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className={cn('material-symbols-outlined text-[20px]', doc.fileType === 'PDF' ? 'text-red-500' : doc.fileType === 'DOCX' ? 'text-blue-600' : 'text-green-600')}>{doc.fileType === 'PDF' ? 'picture_as_pdf' : doc.fileType === 'DOCX' ? 'description' : 'table_chart'}</span>
                    <div><p className="text-sm font-bold text-slate-900">{doc.title}</p><p className="text-[10px] text-slate-500">v{doc.version} • {doc.uploadedBy} • {doc.uploadedAt} • {doc.size}</p></div>
                  </div>
                  <button onClick={() => showToast({ title: 'Downloading', message: doc.title, type: 'success' })} className="text-xs font-bold text-aims-navy hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">download</span>Download</button>
                </div>
              ))}
            </div>
          )}

          {/* Comments */}
          {activeTab === 'comments' && (
            <div className="space-y-3">
              {(grant.comments ?? []).length === 0 && <p className="text-xs text-slate-400 italic">No comments yet.</p>}
              {(grant.comments ?? []).map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white', c.role === 'ED' ? 'bg-aims-navy' : c.role === 'GRANTS_MANAGER' ? 'bg-aims-orange' : 'bg-aims-green')}>{c.author.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
                      <span className="text-sm font-bold text-slate-900">{c.author}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{c.role.replace('_', ' ')}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{formatDateTime(c.timestamp)}</span>
                  </div>
                  <p className="text-sm text-slate-700">{c.content}</p>
                </div>
              ))}
              {canComment && (
                <div className="pt-3 border-t border-slate-100">
                  <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment about this grant…" rows={2} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30 resize-none mb-2" />
                  <div className="flex justify-end"><button onClick={handlePostComment} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 transition-colors flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">send</span>Post Comment</button></div>
                </div>
              )}
            </div>
          )}

          {/* Activity */}
          {activeTab === 'activity' && (
            <div className="space-y-0 relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200" />
              {grant.activity.map((entry) => (
                <div key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
                  <div className="relative z-10 w-6 h-6 rounded-full bg-aims-navy flex items-center justify-center flex-shrink-0 border-2 border-white"><span className="material-symbols-outlined text-white text-[12px]">circle</span></div>
                  <div className="pt-0.5"><p className="text-sm text-slate-900"><span className="font-bold">{entry.actor}</span> {entry.action}</p><p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(entry.timestamp)}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Milestone Modal */}
      {showAddMilestone && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Milestone</h3>
            <input type="text" value={newMilestoneTitle} onChange={(e) => setNewMilestoneTitle(e.target.value)} placeholder="e.g. Methodology section complete" className="w-full border border-slate-200 rounded-lg p-2 text-sm mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddMilestone(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancel</button>
              <button onClick={handleAddMilestone} disabled={!newMilestoneTitle.trim()} className={cn('px-4 py-2 rounded-lg text-sm font-bold', newMilestoneTitle.trim() ? 'bg-aims-green text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {showAddDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Upload Document</h3>
            <input type="text" value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} placeholder="e.g. Proposal Draft v4.docx" className="w-full border border-slate-200 rounded-lg p-2 text-sm mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddDoc(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancel</button>
              <button onClick={handleUploadDoc} disabled={!newDocTitle.trim()} className={cn('px-4 py-2 rounded-lg text-sm font-bold', newDocTitle.trim() ? 'bg-aims-navy text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}>Upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
