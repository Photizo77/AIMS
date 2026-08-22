// src/pages/InnovationDetail.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import type { InnovationStage, InnovationMilestone, InnovationActivityEntry, InnovationComment, InnovationDocument } from '@/types';

const STAGES: { key: InnovationStage; label: string }[] = [
  { key: 'research', label: 'Research' },
  { key: 'concept', label: 'Concept' },
  { key: 'prototype', label: 'Prototype' },
  { key: 'testing', label: 'Testing' },
  { key: 'production', label: 'Production' },
  { key: 'deployed', label: 'Deployed' },
];

const STAGE_COLORS: Record<InnovationStage, string> = {
  research: 'bg-aims-mint text-aims-green',
  concept: 'bg-aims-orange text-white',
  prototype: 'bg-aims-navy text-white',
  testing: 'bg-aims-mint text-aims-green',
  production: 'bg-aims-green text-white',
  deployed: 'bg-aims-navy text-white',
};

// ═══════════════════════════════════════════
// MOCK DATA (replace with API calls)
// ═══════════════════════════════════════════

const MOCK_PROJECT = {
  id: 'inv-001',
  title: 'Solar-Powered Grain Dryer',
  description: 'A low-cost, solar-thermal grain drying system designed for smallholder farmers in post-harvest loss reduction. Targets 60% moisture reduction within 8 hours using passive solar collection and natural convection airflow. Pilot deployment planned for Gulu and Lira districts.',
  stage: 'prototype' as InnovationStage,
  leadName: 'Pius Odong',
  contributorNames: ['Florence Adong', 'Isaac Tumusiime'],
  daysInStage: 9,
  createdAt: '2026-05-12T09:00:00Z',
  updatedAt: '2026-08-20T14:30:00Z',
  milestones: [
    { id: 'm1', title: 'Thermal efficiency simulation', dueDate: '2026-06-01', assigneeName: 'Pius Odong', completed: true },
    { id: 'm2', title: 'Material sourcing & cost analysis', dueDate: '2026-06-15', assigneeName: 'Isaac Tumusiime', completed: true },
    { id: 'm3', title: 'First prototype assembly', dueDate: '2026-07-15', assigneeName: 'Pius Odong', completed: true },
    { id: 'm4', title: 'Field testing with 5 farmer groups', dueDate: '2026-08-30', assigneeName: 'Florence Adong', completed: false },
    { id: 'm5', title: 'Iterate design based on field feedback', dueDate: '2026-09-15', assigneeName: 'Pius Odong', completed: false },
  ] as InnovationMilestone[],
  activityLog: [
    { id: 'a1', timestamp: '2026-05-12T09:00:00Z', actorName: 'Pius Odong', type: 'stage_transition', description: 'Project created in Research stage', fromStage: undefined, toStage: 'research' },
    { id: 'a2', timestamp: '2026-06-02T11:20:00Z', actorName: 'Pius Odong', type: 'milestone_update', description: 'Completed: Thermal efficiency simulation' },
    { id: 'a3', timestamp: '2026-06-18T16:45:00Z', actorName: 'Pius Odong', type: 'stage_transition', description: 'Moved project from Research → Concept', fromStage: 'research', toStage: 'concept' },
    { id: 'a4', timestamp: '2026-06-20T10:00:00Z', actorName: 'Isaac Tumusiime', type: 'document_linked', description: 'Linked: Material Cost Analysis v2.pdf' },
    { id: 'a5', timestamp: '2026-07-16T09:30:00Z', actorName: 'Pius Odong', type: 'stage_transition', description: 'Moved project from Concept → Prototype', fromStage: 'concept', toStage: 'prototype' },
    { id: 'a6', timestamp: '2026-07-20T14:00:00Z', actorName: 'Florence Adong', type: 'comment', description: 'Farmer group selection criteria finalized for field testing phase.' },
    { id: 'a7', timestamp: '2026-08-10T08:15:00Z', actorName: 'Pius Odong', type: 'milestone_update', description: 'Completed: First prototype assembly' },
  ] as InnovationActivityEntry[],
  comments: [
    { id: 'c1', authorId: 'u-florence', authorName: 'Florence Adong', authorRole: 'INNOVATOR', content: 'Farmer group selection criteria finalized for field testing phase.', createdAt: '2026-07-20T14:00:00Z' },
    { id: 'c2', authorId: 'u-ed', authorName: 'Nassir Mukiibi', authorRole: 'ED', content: 'Ensure the prototype meets NBS quality standards before field deployment. Budget approved for 5 units.', createdAt: '2026-07-22T09:10:00Z' },
    { id: 'c3', authorId: 'u-cd', authorName: 'Dr. Sarah Namukasa', authorRole: 'CD', content: 'This aligns well with our post-harvest loss reduction pillar. Please document lessons learned for the Q3 board report.', createdAt: '2026-08-01T11:30:00Z', isFlag: false },
    { id: 'c4', authorId: 'u-cd', authorName: 'Dr. Sarah Namukasa', authorRole: 'CD', content: 'Concern: Field testing timeline overlaps with harvest season. Confirm farmer availability before proceeding.', createdAt: '2026-08-15T16:00:00Z', isFlag: true, flagType: 'concern' },
  ] as InnovationComment[],
  documents: [
    { id: 'd1', title: 'Thermal Simulation Report v3.pdf', source: 'upload' as const, url: '/docs/thermal-sim-v3.pdf', uploadedBy: 'Pius Odong', uploadedAt: '2026-06-01T10:00:00Z', fileType: 'PDF' },
    { id: 'd2', title: 'Material Cost Analysis v2.pdf', source: 'link' as const, url: '/documents/doc-cost-analysis-2026', uploadedBy: 'Isaac Tumusiime', uploadedAt: '2026-06-20T10:00:00Z', fileType: 'PDF' },
    { id: 'd3', title: 'Prototype Assembly Photos', source: 'upload' as const, url: '/docs/proto-photos.zip', uploadedBy: 'Pius Odong', uploadedAt: '2026-07-15T17:00:00Z', fileType: 'ZIP' },
    { id: 'd4', title: 'Post-Harvest Loss Reduction Strategy 2026', source: 'link' as const, url: '/documents/doc-phl-strategy-2026', uploadedBy: 'Florence Adong', uploadedAt: '2026-08-05T09:00:00Z', fileType: 'DOCX' },
  ] as InnovationDocument[],
};

// ═══════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════

function DetailSection({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 p-5 shadow-sm', className)}>
      <h3 className="text-base font-bold text-slate-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function StageBadge({ stage }: { stage: InnovationStage }) {
  const label = STAGES.find((s) => s.key === stage)?.label ?? stage;
  return (
    <span className={cn('inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide', STAGE_COLORS[stage])}>
      {label}
    </span>
  );
}

function AgingIndicator({ days }: { days: number }) {
  const color = days > 14 ? 'text-red-500 bg-red-50 border-red-200' : days >= 7 ? 'text-aims-orange bg-aims-orange/10 border-aims-orange/20' : 'text-aims-green bg-aims-green/10 border-aims-green/20';
  const dot = days > 14 ? 'bg-red-500' : days >= 7 ? 'bg-aims-orange' : 'bg-aims-green';
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-bold', color)}>
      <span className={cn('w-2 h-2 rounded-full', dot)} />
      {days}d in stage
    </span>
  );
}

// ═══════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════

export function InnovationDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const role = user?.role;

  // Local state for interactive elements
  const [commentText, setCommentText] = useState('');
  const [flagType, setFlagType] = useState<'concern' | 'review' | 'urgent' | 'clarification'>('concern');
  const [milestones, setMilestones] = useState(MOCK_PROJECT.milestones);
  const [currentStage, setCurrentStage] = useState<InnovationStage>(MOCK_PROJECT.stage);

  const isInnovator = role === 'INNOVATOR';
  const isED = role === 'ED';
  const isCD = role === 'CD';
  const canEdit = isInnovator;
  const canComment = isInnovator || isED || isCD;
  const canFlag = isCD;

  // Calculate progress from milestones
  const completedCount = milestones.filter((m) => m.completed).length;
  const progressPercent = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  const handleToggleMilestone = (id: string) => {
    if (!canEdit) return;
    setMilestones((prev) => prev.map((m) => m.id === id ? { ...m, completed: !m.completed } : m));
    showToast({ title: 'Milestone Updated', message: 'Progress recalculated automatically.', type: 'success' });
  };

  const handleStageChange = (newStage: InnovationStage) => {
    if (!canEdit) return;
    const oldStage = currentStage;
    setCurrentStage(newStage);
    showToast({
      title: 'Stage Updated',
      message: `Moved from ${STAGES.find((s) => s.key === oldStage)?.label} → ${STAGES.find((s) => s.key === newStage)?.label}`,
      type: 'success',
    });
  };

  const handleSubmitComment = () => {
    if (commentText.trim().length < 3) {
      showToast({ title: 'Comment Too Short', message: 'Please enter at least 3 characters.', type: 'error' });
      return;
    }
    const action = canFlag ? `Flag (${flagType}) submitted` : 'Comment posted';
    showToast({ title: action, message: commentText.trim().substring(0, 60) + '…', type: 'success' });
    setCommentText('');
  };

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* ── Back Navigation ── */}
      <button onClick={() => navigate('/dashboard')} className="text-xs font-bold text-aims-navy hover:underline flex items-center gap-1">
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>Back to Dashboard
      </button>

      {/* ── Header ── */}
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <StageBadge stage={currentStage} />
              <AgingIndicator days={MOCK_PROJECT.daysInStage} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">{MOCK_PROJECT.title}</h1>
            <p className="text-sm text-white/80">Project ID: {projectId} • Created {formatTimestamp(MOCK_PROJECT.createdAt)}</p>
          </div>
          {/* Stage Mover — Innovator only */}
          {canEdit && (
            <div className="flex flex-col items-end gap-1">
              <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Move Stage</label>
              <select
                value={currentStage}
                onChange={(e) => handleStageChange(e.target.value as InnovationStage)}
                className="text-xs font-bold border border-white/30 rounded-lg px-3 py-2 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key} className="text-slate-900">{s.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── Description ── */}
      <DetailSection title="Description">
        {canEdit ? (
          <textarea
            defaultValue={MOCK_PROJECT.description}
            rows={4}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30 resize-y"
          />
        ) : (
          <p className="text-sm text-slate-700 leading-relaxed">{MOCK_PROJECT.description}</p>
        )}
      </DetailSection>

      {/* ── Team + Progress Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailSection title="Team">
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Project Lead</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-aims-navy text-white flex items-center justify-center text-xs font-bold">{MOCK_PROJECT.leadName.split(' ').map((n) => n[0]).join('')}</div>
                <span className="text-sm font-bold text-slate-900">{MOCK_PROJECT.leadName}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contributors ({MOCK_PROJECT.contributorNames.length})</p>
              <div className="flex flex-wrap gap-2">
                {MOCK_PROJECT.contributorNames.map((name) => (
                  <div key={name} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="w-6 h-6 rounded-full bg-aims-green text-white flex items-center justify-center text-[9px] font-bold">{name.split(' ').map((n) => n[0]).join('')}</div>
                    <span className="text-xs font-semibold text-slate-700">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DetailSection>

        <DetailSection title="Overall Progress">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">{completedCount} of {milestones.length} milestones completed</span>
            <span className="text-2xl font-extrabold text-aims-green">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 mb-4">
            <div className="h-3 rounded-full bg-aims-green transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="text-xs text-slate-500">Progress is calculated automatically from milestone completion.</p>
        </DetailSection>
      </div>

      {/* ── Milestone Checklist ── */}
      <DetailSection title="Milestone Checklist">
        <div className="space-y-2">
          {milestones.map((m) => (
            <div key={m.id} className={cn('flex items-start gap-3 p-3 rounded-lg border transition-colors', m.completed ? 'bg-aims-green/5 border-aims-green/20' : 'bg-slate-50 border-slate-100')}>
              <input
                type="checkbox"
                checked={m.completed}
                onChange={() => handleToggleMilestone(m.id)}
                disabled={!canEdit}
                className={cn('mt-0.5 w-4 h-4 rounded border-slate-300 accent-aims-green', !canEdit && 'cursor-not-allowed opacity-50')}
              />
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-bold', m.completed ? 'text-slate-500 line-through' : 'text-slate-900')}>{m.title}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">person</span>{m.assigneeName}
                  </span>
                  <span className={cn('text-[10px] font-bold flex items-center gap-1', new Date(m.dueDate) < new Date() && !m.completed ? 'text-red-500' : 'text-slate-500')}>
                    <span className="material-symbols-outlined text-[12px]">event</span>
                    Due: {new Date(m.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {new Date(m.dueDate) < new Date() && !m.completed && ' (Overdue)'}
                  </span>
                </div>
              </div>
              {m.completed && <span className="material-symbols-outlined text-aims-green text-[20px]">check_circle</span>}
            </div>
          ))}
        </div>
      </DetailSection>

      {/* ── Activity Log ── */}
      <DetailSection title="Activity Log">
        <div className="space-y-0 relative">
          {/* Timeline line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200" />
          {MOCK_PROJECT.activityLog.map((entry) => (
            <div key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
              <div className={cn('relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white',
                entry.type === 'stage_transition' ? 'bg-aims-navy' :
                entry.type === 'milestone_update' ? 'bg-aims-green' :
                entry.type === 'document_linked' ? 'bg-aims-orange' :
                'bg-slate-400'
              )}>
                <span className="material-symbols-outlined text-white text-[12px]">
                  {entry.type === 'stage_transition' ? 'swap_horiz' :
                   entry.type === 'milestone_update' ? 'check' :
                   entry.type === 'document_linked' ? 'attach_file' :
                   'chat_bubble'}
                </span>
              </div>
              <div className="pt-0.5">
                <p className="text-sm text-slate-900">
                  <span className="font-bold">{entry.actorName}</span>{' '}
                  {entry.type === 'stage_transition' ? (
                    <span>moved project from <span className="font-bold capitalize">{entry.fromStage}</span> → <span className="font-bold capitalize">{entry.toStage}</span></span>
                  ) : (
                    <span>{entry.description}</span>
                  )}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{formatTimestamp(entry.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </DetailSection>

      {/* ── Comments Thread ── */}
      <DetailSection title="Comments & Flags">
        <div className="space-y-3 mb-4">
          {MOCK_PROJECT.comments.map((c) => (
            <div key={c.id} className={cn('p-3 rounded-lg border', c.isFlag ? 'bg-aims-orange/5 border-aims-orange/20' : 'bg-slate-50 border-slate-100')}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white', c.authorRole === 'CD' ? 'bg-aims-orange' : c.authorRole === 'ED' ? 'bg-aims-navy' : 'bg-aims-green')}>
                    {c.authorName.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <span className="text-sm font-bold text-slate-900">{c.authorName}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{c.authorRole.replace('_', ' ')}</span>
                  {c.isFlag && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-aims-orange/15 text-aims-orange uppercase tracking-wide">
                      <span className="material-symbols-outlined text-[10px]">flag</span>{c.flagType}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">{formatTimestamp(c.createdAt)}</span>
              </div>
              <p className={cn('text-sm', c.isFlag ? 'text-aims-orange font-medium italic' : 'text-slate-700')}>{c.content}</p>
            </div>
          ))}
        </div>

        {/* Comment Input */}
        {canComment && (
          <div className="border-t border-slate-100 pt-4 space-y-3">
            {canFlag && (
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Flag Type:</label>
                <select value={flagType} onChange={(e) => setFlagType(e.target.value as typeof flagType)} className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-aims-orange/30">
                  <option value="concern">Concern</option>
                  <option value="review">Needs Review</option>
                  <option value="urgent">Urgent</option>
                  <option value="clarification">Clarification</option>
                </select>
                <span className="text-[10px] text-slate-400 italic">Your comment will be flagged for ED attention</span>
              </div>
            )}
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={canFlag ? 'Add a comment or flag a concern for the ED…' : 'Add a comment…'}
              rows={2}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30 resize-none"
            />
            <div className="flex justify-end">
              <button onClick={handleSubmitComment} className={cn('px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5', canFlag ? 'bg-aims-orange text-white hover:bg-aims-orange/90' : 'bg-aims-navy text-white hover:bg-aims-navy/90')}>
                <span className="material-symbols-outlined text-[16px]">{canFlag ? 'flag' : 'send'}</span>
                {canFlag ? 'Submit Flag / Comment' : 'Post Comment'}
              </button>
            </div>
          </div>
        )}
      </DetailSection>

      {/* ── Linked Documents ── */}
      <DetailSection title="Linked Documents">
        <div className="space-y-2 mb-4">
          {MOCK_PROJECT.documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-slate-400">
                  {doc.fileType === 'PDF' ? 'picture_as_pdf' : doc.fileType === 'ZIP' ? 'folder_zip' : 'description'}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{doc.title}</p>
                  <p className="text-[10px] text-slate-500">
                    {doc.source === 'upload' ? 'Uploaded' : 'Linked from Docs Hub'} • {doc.uploadedBy} • {formatTimestamp(doc.uploadedAt)}
                  </p>
                </div>
              </div>
              <button onClick={() => showToast({ title: 'Opening Document', message: doc.title, type: 'info' })} className="text-xs font-bold text-aims-navy hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>Open
              </button>
            </div>
          ))}
        </div>
        {canEdit && (
          <div className="flex gap-2 border-t border-slate-100 pt-4">
            <button onClick={() => showToast({ title: 'Upload Dialog', message: 'File picker would open here', type: 'info' })} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 transition-colors flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">upload_file</span>Upload File
            </button>
            <button onClick={() => showToast({ title: 'Link Dialog', message: 'Documents hub search would open here', type: 'info' })} className="px-4 py-2 bg-white text-aims-navy text-xs font-bold rounded-lg border border-aims-navy hover:bg-aims-navy/5 transition-colors flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">link</span>Link from Docs Hub
            </button>
          </div>
        )}
      </DetailSection>
    </div>
  );
}