// src/pages/ProjectDetail.tsx
// ============================================================
// AIMS — Innovation Project Detail (Innovator persona workflow)
// View info · milestones · resources · timeline · updates
// Lead actions: push to next phase (with notification), manage team
// ============================================================

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { exportRecordSheet } from '@/lib/export';
import { useNotifications } from '@/context/NotificationContext';
import { INNOVATION_STAGES, INNOVATION_STAGE_LABELS, type InnovationProject } from '@/types';
import { cn } from '@/lib/utils';
import { innovationService } from '@/services/innovationService';
import { addRequisition } from '@/services/requisitionService';

// Known team members available for handoff / team management
const STAFF_ROSTER = ['Pius Odong', 'Florence Adong', 'Isaac Tumusiime', 'Janet Apio', 'Grace Nakamya', 'Sarah Aciro', 'Amos Ojok', 'Okello Komakech'];

type TabKey = 'overview' | 'milestones' | 'resources' | 'timeline' | 'updates';

const STAGE_ORDER = INNOVATION_STAGES;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast, addNotification } = useNotifications();

  const [project, setProject] = useState<InnovationProject | null>(() => {
    const found = innovationService.getProjectById(id || '');
    return found ? { ...found } : null;
  });
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [newComment, setNewComment] = useState('');
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [handoffMessage, setHandoffMessage] = useState('');
  const [selectedHandler, setSelectedHandler] = useState('');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamMember, setTeamMember] = useState('');
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  if (!user) return <div className="p-8 text-center text-slate-500">Loading…</div>;
  if (!project) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Project Not Found</h2>
        <button onClick={() => navigate('/tasks')} className="px-4 py-2 bg-aims-navy text-white rounded-lg text-sm font-bold">Go to Tasks</button>
      </div>
    );
  }

  const isLead = user.name === project.leadName;
  const isContributor = project.contributorNames.includes(user.name);
  // ED has full control on every project; CD remains view-only
  const canEdit = isLead || isContributor || user.role === 'ED';

  const currentStageIndex = STAGE_ORDER.indexOf(project.stage);
  const nextStage = currentStageIndex >= 0 && currentStageIndex < STAGE_ORDER.length - 1 ? STAGE_ORDER[currentStageIndex + 1] : null;
  const completedMilestones = project.milestones.filter((m) => m.completed).length;
  const progress = project.progressPercent;

  const handlePostUpdate = () => {
    if (!newComment.trim()) return;
    const updated = innovationService.addComment(project.id, {
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      content: newComment.trim(),
    });
    if (updated) setProject({ ...updated });
    showToast({ title: 'Update Posted', message: 'Your team has been notified.', type: 'success' });
    setNewComment('');
  };

  const handleToggleMilestone = (milestoneId: string) => {
    if (!canEdit) {
      showToast({ title: 'Read Only', message: 'Only the lead or contributors can update milestones.', type: 'error' });
      return;
    }
    const updated = innovationService.toggleMilestone(project.id, milestoneId);
    if (updated) setProject({ ...updated });
    showToast({ title: 'Milestone Updated', message: 'Progress recalculated.', type: 'success' });
  };

  const handleResourceUpload = () => {
    if (!canEdit) {
      showToast({ title: 'Read Only', message: 'Only the lead or contributors can upload resources.', type: 'error' });
      return;
    }
    const updated = innovationService.addDocument(project.id, {
      title: `Resource ${project.documents.length + 1} — ${new Date().toLocaleDateString('en-GB')}`,
      source: 'upload',
      url: '#',
      uploadedBy: user.name,
      fileType: 'PDF',
    });
    if (updated) setProject({ ...updated });
    showToast({ title: 'Resource Uploaded', message: 'Document added to project resources.', type: 'success' });
  };

  const handleAddMilestone = () => {
    if (!newMilestoneTitle.trim() || !canEdit) return;
    const updated = innovationService.addMilestone(project.id, {
      title: newMilestoneTitle.trim(),
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      assigneeName: user.name,
      completed: false,
    });
    if (updated) setProject({ ...updated });
    showToast({ title: 'Milestone Added', message: 'New milestone added to the checklist.', type: 'success' });
    setNewMilestoneTitle('');
    setShowMilestoneModal(false);
  };

  const handleHandoff = () => {
    if (!selectedHandler || !nextStage) return;
    const updated = innovationService.moveToNextStage(project.id, nextStage, selectedHandler, handoffMessage.trim());
    if (updated) setProject({ ...updated });
    addNotification({
      title: 'Project Handed Off',
      message: `${user.name} moved "${project.title}" to the ${INNOVATION_STAGE_LABELS[nextStage]} phase. You are now the project lead.${handoffMessage.trim() ? ` — "${handoffMessage.trim()}"` : ''}`,
      type: 'approval',
      link: `/innovations/${project.id}`,
      recipientName: selectedHandler,
    });
    showToast({ title: 'Project Handed Off', message: `Notification sent to ${selectedHandler}.`, type: 'success' });
    setShowHandoffModal(false);
    setSelectedHandler('');
    setHandoffMessage('');
  };

  const handleRequestFunding = () => {
    const amount = project.budget ?? 0;
    if (amount <= 0) {
      showToast({ title: 'No Budget Set', message: 'Set a project budget before requesting funding.', type: 'warning' });
      return;
    }
    const req = addRequisition({
      title: `Funding — ${project.title}`,
      dept: 'Innovation',
      requester: user.name,
      amount,
      purpose: `Project funding for "${project.title}" (${INNOVATION_STAGE_LABELS[project.stage]} stage).`,
      budgetLine: 'GL-5421 R&D Equipment',
    });
    addNotification({
      userId: 'user-finance-001',
      title: 'Project Funding Request',
      message: `${user.name} raised requisition ${req.id} for "${project.title}" (UGX ${amount.toLocaleString()}).`,
      type: 'approval',
      link: '/approvals',
      actionUrl: '/approvals',
    });
    showToast({ title: 'Funding Request Raised', message: `Requisition ${req.id} drafted — Finance has been notified.`, type: 'success' });
  };

  const handleAddContributor = () => {
    if (!teamMember.trim()) return;
    const updated = innovationService.addContributor(project.id, teamMember.trim());
    if (updated) setProject({ ...updated });
    showToast({ title: 'Team Updated', message: `${teamMember.trim()} added as contributor.`, type: 'success' });
    setTeamMember('');
  };

  const handleRemoveContributor = (name: string) => {
    const updated = innovationService.removeContributor(project.id, name);
    if (updated) setProject({ ...updated });
    showToast({ title: 'Team Updated', message: `${name} removed from contributors.`, type: 'info' });
  };

  const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: 'info' },
    { key: 'milestones', label: 'Milestones', icon: 'checklist' },
    { key: 'resources', label: 'Resources', icon: 'folder' },
    { key: 'timeline', label: 'Timeline', icon: 'history' },
    { key: 'updates', label: 'Updates', icon: 'chat_bubble' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <button onClick={() => navigate(-1)} className="text-xs font-bold text-white/80 hover:text-white mb-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">arrow_back</span> Back to Pipeline
        </button>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">{project.title}</h1>
            <div className="flex items-center gap-4 text-sm font-medium text-white/90 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-white/20 text-white text-xs font-bold uppercase">{INNOVATION_STAGE_LABELS[project.stage]}</span>
              <span>Lead: {project.leadName}</span>
              <span>Progress: {progress}%</span>
              <span>{project.daysInStage}d in stage</span>
              {project.budget != null && <span>Budget: UGX {(project.budget / 1000000).toFixed(1)}M</span>}
            </div>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <button onClick={handleRequestFunding} className="px-5 py-2.5 bg-aims-orange text-white rounded-xl text-xs font-bold hover:bg-aims-orange/90 transition-colors flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">request_quote</span>Request Funding
              </button>
            )}
            {isLead && nextStage && (
              <button onClick={() => setShowHandoffModal(true)} className="px-5 py-2.5 bg-aims-green text-white rounded-xl text-xs font-bold hover:bg-aims-green/90 transition-colors flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">send</span>Push to {INNOVATION_STAGE_LABELS[nextStage]}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Team + Progress row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-slate-900">Project Team</h3>
            {isLead && (
              <button onClick={() => setShowTeamModal(true)} className="text-xs font-bold text-aims-navy hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">group_add</span>Manage Team
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-aims-navy/5 rounded-lg border border-aims-navy/15">
              <div className="w-7 h-7 rounded-full bg-aims-navy text-white flex items-center justify-center text-[10px] font-bold">{project.leadName.split(' ').map((n) => n[0]).join('')}</div>
              <div><p className="text-xs font-bold text-slate-900">{project.leadName}</p><p className="text-[9px] font-bold uppercase text-aims-navy">Lead</p></div>
            </div>
            {project.contributorNames.map((c) => (
              <div key={c} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-7 h-7 rounded-full bg-aims-green text-white flex items-center justify-center text-[10px] font-bold">{c.split(' ').map((n) => n[0]).join('')}</div>
                <div><p className="text-xs font-bold text-slate-900">{c}</p><p className="text-[9px] font-bold uppercase text-slate-400">Contributor</p></div>
              </div>
            ))}
            {project.contributorNames.length === 0 && <p className="text-xs text-slate-400 italic">No contributors yet — add team members to collaborate.</p>}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-3">Progress</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">{completedMilestones}/{project.milestones.length} milestones</span>
            <span className="text-2xl font-extrabold text-aims-green">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 mb-3"><div className="h-3 rounded-full bg-aims-green transition-all duration-500" style={{ width: `${progress}%` }} /></div>
          <p className="text-xs text-slate-500">Progress is driven by milestone completion. Keep the checklist updated as work moves forward.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={cn('px-5 py-3 text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 border-b-2', activeTab === tab.key ? 'border-aims-navy text-aims-navy bg-aims-navy/5' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50')}>
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 min-h-[360px]">
          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900">Description</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Created</p><p className="text-sm font-bold text-slate-900 mt-0.5">{formatDate(project.createdAt)}</p></div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Last Updated</p><p className="text-sm font-bold text-slate-900 mt-0.5">{formatDate(project.updatedAt)}</p></div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Stage</p><p className="text-sm font-bold text-slate-900 mt-0.5 capitalize">{INNOVATION_STAGE_LABELS[project.stage]}</p></div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Days in Stage</p><p className="text-sm font-bold text-slate-900 mt-0.5">{project.daysInStage}d</p></div>
              </div>
              {!canEdit && <p className="text-[10px] text-slate-400 italic">You have read-only access. Contact the project lead to contribute.</p>}
            </div>
          )}

          {/* Milestones */}
          {activeTab === 'milestones' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Check off milestones as they are completed. Progress recalculates automatically.</p>
                {canEdit && (
                  <button onClick={() => setShowMilestoneModal(true)} className="px-3 py-1.5 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">add</span>Add Milestone
                  </button>
                )}
              </div>
              {project.milestones.map((m) => (
                <div key={m.id} className={cn('flex items-start gap-3 p-3 rounded-lg border transition-colors', m.completed ? 'bg-aims-green/5 border-aims-green/20' : 'bg-slate-50 border-slate-100')}>
                  <input type="checkbox" checked={m.completed} onChange={() => handleToggleMilestone(m.id)} disabled={!canEdit} className={cn('mt-0.5 w-4 h-4 rounded border-slate-300 accent-aims-green', !canEdit && 'cursor-not-allowed opacity-50')} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-bold', m.completed ? 'text-slate-500 line-through' : 'text-slate-900')}>{m.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">person</span>{m.assigneeName} • Due {formatDate(m.dueDate)}</p>
                  </div>
                  {m.completed && <span className="material-symbols-outlined text-aims-green text-[20px]">check_circle</span>}
                </div>
              ))}
            </div>
          )}

          {/* Resources */}
          {activeTab === 'resources' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900">Project Documents</h3>
                <button onClick={handleResourceUpload} className="px-3 py-1.5 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">upload</span> Upload Resource
                </button>
              </div>
              {project.documents.length === 0 && <p className="text-xs text-slate-400 italic">No resources yet.</p>}
              {project.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400">description</span>
                    <div><p className="text-sm font-bold text-slate-900">{doc.title}</p><p className="text-xs text-slate-500">Uploaded by {doc.uploadedBy} • {formatDate(doc.uploadedAt)}</p></div>
                  </div>
                  <button onClick={() => exportRecordSheet(doc.title, 'Project Resource', [['Resource', doc.title], ['Uploaded By', doc.uploadedBy], ['Uploaded On', formatDate(doc.uploadedAt)], ['Project', `${project.id} — ${project.title}`]])} className="text-xs font-bold text-aims-navy hover:underline">Download</button>
                </div>
              ))}
            </div>
          )}

          {/* Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-0 relative">
              {project.activityLog.length === 0 && <p className="text-xs text-slate-400 italic">No activity recorded yet.</p>}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200" />
              {project.activityLog.map((entry) => (
                <div key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
                  <div className={cn('relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white', entry.type === 'stage_transition' ? 'bg-aims-navy' : entry.type === 'comment' ? 'bg-aims-green' : 'bg-aims-orange')}>
                    <span className="material-symbols-outlined text-white text-[12px]">{entry.type === 'stage_transition' ? 'swap_horiz' : entry.type === 'comment' ? 'chat' : 'attach_file'}</span>
                  </div>
                  <div className="pt-0.5">
                    <p className="text-sm text-slate-900"><span className="font-bold">{entry.actorName}</span> {entry.description}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{new Date(entry.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Updates / Comments */}
          {activeTab === 'updates' && (
            <div className="space-y-6">
              <div className="space-y-4">
                {project.comments.length === 0 && <p className="text-xs text-slate-400 italic">No updates yet — share the first update with your team.</p>}
                {project.comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-aims-navy text-white flex items-center justify-center text-xs font-bold">{c.authorName[0]}</div>
                    <div><div className="flex items-center gap-2"><p className="text-sm font-bold text-slate-900">{c.authorName}</p><p className="text-xs text-slate-400">{c.createdAt}</p></div><p className="text-sm text-slate-600 mt-1">{c.content}</p></div>
                  </div>
                ))}
              </div>
              {canEdit && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add an update or comment..." className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-aims-navy/30 focus:outline-none" rows={3} />
                  <div className="flex justify-end mt-2"><button onClick={handlePostUpdate} className="px-4 py-2 bg-aims-navy text-white rounded-lg text-sm font-bold hover:opacity-90">Post Update</button></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Push to Next Phase Modal ── */}
      {showHandoffModal && nextStage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Push to {INNOVATION_STAGE_LABELS[nextStage]}</h3>
              <button onClick={() => setShowHandoffModal(false)} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Current stage: <strong className="capitalize">{INNOVATION_STAGE_LABELS[project.stage]}</strong> → Next stage: <strong>{INNOVATION_STAGE_LABELS[nextStage]}</strong>. The selected handler becomes the new project lead and receives a notification.</p>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Next Handler</label>
            <select value={selectedHandler} onChange={(e) => setSelectedHandler(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm mb-4">
              <option value="">Select Handler...</option>
              {[...new Set([...project.contributorNames, ...STAFF_ROSTER])].filter((n) => n !== user.name).map((name) => (
                <option key={name} value={name}>{name}{project.contributorNames.includes(name) ? ' (current contributor)' : ''}</option>
              ))}
            </select>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Transition Message</label>
            <textarea value={handoffMessage} onChange={(e) => setHandoffMessage(e.target.value)} placeholder="e.g. Prototype phase complete. All tests passed. Ready for formal testing…" className="w-full border border-slate-200 rounded-lg p-2 text-sm mb-4" rows={3} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowHandoffModal(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancel</button>
              <button onClick={handleHandoff} disabled={!selectedHandler} className={cn('px-4 py-2 rounded-lg text-sm font-bold', selectedHandler ? 'bg-aims-green text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}>Send to Handler</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage Team Modal ── */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Manage Team</h3>
              <button onClick={() => setShowTeamModal(false)} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Current Contributors</p>
            <div className="space-y-2 mb-4">
              {project.contributorNames.map((c) => (
                <div key={c} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm font-bold text-slate-900">{c}</span>
                  <button onClick={() => handleRemoveContributor(c)} className="text-xs font-bold text-red-500 hover:underline">Remove</button>
                </div>
              ))}
              {project.contributorNames.length === 0 && <p className="text-xs text-slate-400 italic">No contributors.</p>}
            </div>
            <div className="flex gap-2">
              <select value={teamMember} onChange={(e) => setTeamMember(e.target.value)} className="flex-1 border border-slate-200 rounded-lg p-2 text-sm">
                <option value="">Select staff member…</option>
                {STAFF_ROSTER.filter((n) => n !== project.leadName && !project.contributorNames.includes(n)).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <button onClick={handleAddContributor} disabled={!teamMember} className={cn('px-4 py-2 rounded-lg text-sm font-bold', teamMember ? 'bg-aims-navy text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Milestone Modal ── */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Milestone</h3>
            <input type="text" value={newMilestoneTitle} onChange={(e) => setNewMilestoneTitle(e.target.value)} placeholder="e.g. Field Validation Complete" className="w-full border border-slate-200 rounded-lg p-2 text-sm mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowMilestoneModal(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancel</button>
              <button onClick={handleAddMilestone} disabled={!newMilestoneTitle.trim()} className={cn('px-4 py-2 rounded-lg text-sm font-bold', newMilestoneTitle.trim() ? 'bg-aims-green text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}>Add Milestone</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
