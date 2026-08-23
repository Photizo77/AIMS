// src/pages/GrantDetail.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';

type GrantStage = 'identified' | 'drafting' | 'submitted' | 'under_review' | 'awarded' | 'declined';

const STAGE_LABELS: Record<GrantStage, string> = { identified: 'Identified', drafting: 'Drafting', submitted: 'Submitted', under_review: 'Under Review', awarded: 'Awarded', declined: 'Declined' };
const STAGE_COLORS: Record<GrantStage, string> = { identified: 'bg-aims-mint text-aims-green', drafting: 'bg-aims-orange text-white', submitted: 'bg-aims-navy text-white', under_review: 'bg-aims-navy text-white', awarded: 'bg-aims-green text-white', declined: 'bg-red-500 text-white' };

interface Milestone { id: string; title: string; completed: boolean; assignee: string }
interface DocItem { id: string; title: string; fileType: string; size: string; uploadedBy: string; uploadedAt: string; version: number }
interface ActivityEntry { id: string; actor: string; action: string; timestamp: string }
interface Comment { id: string; author: string; role: string; content: string; timestamp: string }

const MOCK_GRANT = {
  id: 'g1', title: 'Community Land Rights Documentation', funder: 'USAID', pillar: 'Land Governance',
  handler: 'Sarah Aciro', contributors: ['Janet Apio'], stage: 'under_review' as GrantStage,
  deadline: '2026-09-05', amountRequested: 450000000, amountAwarded: undefined as number | undefined,
  description: 'Comprehensive documentation of customary land rights across 12 sub-counties in Northern Uganda. Includes community mapping, legal validation, and issuance of certificates of customary ownership. Aligns with USAID\'s Land Governance Activity strategic objective 2.1.',
  milestones: [
    { id: 'm1', title: 'Concept note drafted', completed: true, assignee: 'Sarah Aciro' },
    { id: 'm2', title: 'Internal concept review', completed: true, assignee: 'Janet Apio' },
    { id: 'm3', title: 'Full proposal drafted', completed: true, assignee: 'Sarah Aciro' },
    { id: 'm4', title: 'Budget attached & validated', completed: true, assignee: 'Janet Apio' },
    { id: 'm5', title: 'Internal review completed', completed: true, assignee: 'Nassir Mukiibi' },
    { id: 'm6', title: 'Submitted to funder', completed: true, assignee: 'Sarah Aciro' },
    { id: 'm7', title: 'Funder feedback received', completed: true, assignee: 'Sarah Aciro' },
    { id: 'm8', title: 'Revisions incorporated', completed: false, assignee: 'Janet Apio' },
    { id: 'm9', title: 'Award notification', completed: false, assignee: 'Sarah Aciro' },
    { id: 'm10', title: 'Agreement signed & onboarded to Finance', completed: false, assignee: 'David Okello' },
  ] as Milestone[],
  documents: [
    { id: 'gd1', title: 'Concept Note v2.pdf', fileType: 'PDF', size: '420 KB', uploadedBy: 'Sarah Aciro', uploadedAt: '2026-07-10', version: 2 },
    { id: 'gd2', title: 'Full Proposal v3.docx', fileType: 'DOCX', size: '1.8 MB', uploadedBy: 'Sarah Aciro', uploadedAt: '2026-08-01', version: 3 },
    { id: 'gd3', title: 'Budget Sheet v3.xlsx', fileType: 'XLSX', size: '340 KB', uploadedBy: 'Janet Apio', uploadedAt: '2026-08-05', version: 3 },
    { id: 'gd4', title: 'Funder Feedback Letter.pdf', fileType: 'PDF', size: '180 KB', uploadedBy: 'Sarah Aciro', uploadedAt: '2026-08-18', version: 1 },
  ] as DocItem[],
  resources: [
    { id: 'r1', title: 'USAID Proposal Template 2026.docx', fileType: 'DOCX', size: '520 KB' },
    { id: 'r2', title: 'ARDHI Standard Budget Template.xlsx', fileType: 'XLSX', size: '280 KB' },
    { id: 'r3', title: 'Organizational Profile & Theory of Change.pdf', fileType: 'PDF', size: '1.2 MB' },
    { id: 'r4', title: 'Audited Financials FY2025.pdf', fileType: 'PDF', size: '3.4 MB' },
  ],
  activityLog: [
    { id: 'a1', actor: 'Sarah Aciro', action: 'Created grant in Identified stage', timestamp: '2026-06-15T09:00:00Z' },
    { id: 'a2', actor: 'Sarah Aciro', action: 'Uploaded Concept Note v1.pdf', timestamp: '2026-06-20T14:00:00Z' },
    { id: 'a3', actor: 'Sarah Aciro', action: 'Moved to Drafting', timestamp: '2026-06-25T10:00:00Z' },
    { id: 'a4', actor: 'Janet Apio', action: 'Completed internal concept review', timestamp: '2026-07-01T11:00:00Z' },
    { id: 'a5', actor: 'Sarah Aciro', action: 'Uploaded Full Proposal v1.docx', timestamp: '2026-07-15T16:00:00Z' },
    { id: 'a6', actor: 'Janet Apio', action: 'Uploaded Budget Sheet v1.xlsx', timestamp: '2026-07-20T09:00:00Z' },
    { id: 'a7', actor: 'Nassir Mukiibi', action: 'Completed internal review', timestamp: '2026-07-28T15:00:00Z' },
    { id: 'a8', actor: 'Sarah Aciro', action: 'Moved to Submitted', timestamp: '2026-08-01T10:00:00Z' },
    { id: 'a9', actor: 'Sarah Aciro', action: 'Uploaded Funder Feedback Letter.pdf', timestamp: '2026-08-18T14:00:00Z' },
    { id: 'a10', actor: 'Sarah Aciro', action: 'Moved to Under Review', timestamp: '2026-08-19T09:00:00Z' },
  ] as ActivityEntry[],
  comments: [
    { id: 'c1', author: 'Janet Apio', role: 'GRANT_WRITER', content: 'Budget narrative for M&E section needs strengthening. Suggest adding specific indicators per output.', timestamp: '2026-07-22T10:00:00Z' },
    { id: 'c2', author: 'Nassir Mukiibi', role: 'ED', content: 'Approved for submission. Ensure sustainability plan addresses post-project handover to local government.', timestamp: '2026-07-28T15:30:00Z' },
    { id: 'c3', author: 'Sarah Aciro', role: 'GRANTS_MANAGER', content: 'Funder requested clarification on partner co-financing. Working with Finance to confirm matching funds.', timestamp: '2026-08-20T09:00:00Z' },
  ] as Comment[],
};

function formatCurrency(amount: number): string {
  if (amount >= 1000000000) return `UGX ${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `UGX ${(amount / 1000000).toFixed(0)}M`;
  return `UGX ${(amount / 1000).toFixed(0)}K`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(iso: string): string {
  return formatDate(iso) + ' at ' + new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function daysUntil(dateStr: string): number {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000));
}

export function GrantDetail() {
  const { grantId } = useParams<{ grantId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [activeTab, setActiveTab] = useState<'checklist' | 'documents' | 'resources' | 'comments' | 'activity'>('checklist');
  const [commentText, setCommentText] = useState('');

  if (!user) return <div className="p-8 text-center text-slate-500">Loading…</div>;

  const g = MOCK_GRANT;
  const days = daysUntil(g.deadline);
  const isHandler = g.handler === user.name;
  const isContributor = g.contributors.includes(user.name);
  const canEdit = isHandler || isContributor;
  const isGrantWriter = ['GRANT_WRITER', 'GRANTS_MANAGER'].includes(user.role);
  const completedMilestones = g.milestones.filter((m) => m.completed).length;
  const progressPercent = Math.round((completedMilestones / g.milestones.length) * 100);

  const TABS = [
    { key: 'checklist' as const, label: 'Milestone Checklist', icon: 'checklist' },
    { key: 'documents' as const, label: 'Documents', icon: 'folder' },
    { key: 'resources' as const, label: 'Resource Library', icon: 'menu_book' },
    { key: 'comments' as const, label: 'Comments', icon: 'chat_bubble' },
    { key: 'activity' as const, label: 'Activity Log', icon: 'history' },
  ];

  const handleToggleMilestone = (id: string) => {
    if (!canEdit) { showToast({ title: 'Access Denied', message: 'Only Handler or Contributors can edit milestones.', type: 'error' }); return; }
    showToast({ title: 'Milestone Updated', message: 'Progress recalculated.', type: 'success' });
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    showToast({ title: 'Comment Posted', message: 'Added to grant discussion.', type: 'success' });
    setCommentText('');
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => navigate('/grants')} className="text-xs font-bold text-aims-navy hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">arrow_back</span>Back to Grants Pipeline</button>

      {/* Header */}
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={cn('inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide', STAGE_COLORS[g.stage])}>{STAGE_LABELS[g.stage]}</span>
              <span className={cn('text-xs font-bold px-2 py-0.5 rounded border', days <= 7 ? 'bg-red-500/20 text-white border-red-400' : days <= 30 ? 'bg-aims-orange/20 text-white border-aims-orange' : 'bg-white/10 text-white border-white/20')}>{days}d until deadline</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">{g.title}</h1>
            <p className="text-sm text-white/80">{g.funder} • {g.pillar} • ID: {grantId}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Requested</p>
            <p className="text-xl font-extrabold text-white">{formatCurrency(g.amountRequested)}</p>
            {g.amountAwarded && <p className="text-xs text-aims-green font-bold mt-0.5">Awarded: {formatCurrency(g.amountAwarded)}</p>}
          </div>
        </div>
      </div>

      {/* Team + Progress Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-2">
          <h3 className="text-base font-bold text-slate-900 mb-3">Description</h3>
          <p className="text-sm text-slate-700 leading-relaxed">{g.description}</p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4">
            <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Handler</p><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-aims-navy text-white flex items-center justify-center text-[10px] font-bold">{g.handler.split(' ').map((n) => n[0]).join('')}</div><span className="text-sm font-bold text-slate-900">{g.handler}</span></div></div>
            {g.contributors.length > 0 && <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contributors</p><div className="flex items-center gap-2">{g.contributors.map((c) => (<div key={c} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100"><div className="w-5 h-5 rounded-full bg-aims-green text-white flex items-center justify-center text-[8px] font-bold">{c.split(' ').map((n) => n[0]).join('')}</div><span className="text-xs font-semibold text-slate-700">{c}</span></div>))}</div></div>}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-3">Progress</h3>
          <div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold text-slate-700">{completedMilestones}/{g.milestones.length} milestones</span><span className="text-2xl font-extrabold text-aims-green">{progressPercent}%</span></div>
          <div className="w-full bg-slate-100 rounded-full h-3 mb-3"><div className="h-3 rounded-full bg-aims-green transition-all duration-500" style={{ width: `${progressPercent}%` }} /></div>
          <p className="text-xs text-slate-500">Progress driven by milestone completion, not stage alone.</p>
          {isGrantWriter && (
            <button onClick={() => navigate(`/ai-assistant?grant=${g.id}`)} className="mt-4 w-full py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 transition-colors flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">smart_toy</span>AI Assistant
            </button>
          )}
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

        <div className="p-5">
          {/* Checklist Tab */}
          {activeTab === 'checklist' && (
            <div className="space-y-2">
              {g.milestones.map((m) => (
                <div key={m.id} className={cn('flex items-start gap-3 p-3 rounded-lg border transition-colors', m.completed ? 'bg-aims-green/5 border-aims-green/20' : 'bg-slate-50 border-slate-100')}>
                  <input type="checkbox" checked={m.completed} onChange={() => handleToggleMilestone(m.id)} disabled={!canEdit} className={cn('mt-0.5 w-4 h-4 rounded border-slate-300 accent-aims-green', !canEdit && 'cursor-not-allowed opacity-50')} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-bold', m.completed ? 'text-slate-500 line-through' : 'text-slate-900')}>{m.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">person</span>{m.assignee}</p>
                  </div>
                  {m.completed && <span className="material-symbols-outlined text-aims-green text-[20px]">check_circle</span>}
                </div>
              ))}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-2">
              {g.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className={cn('material-symbols-outlined text-[20px]', doc.fileType === 'PDF' ? 'text-red-500' : doc.fileType === 'DOCX' ? 'text-blue-600' : 'text-green-600')}>{doc.fileType === 'PDF' ? 'picture_as_pdf' : doc.fileType === 'DOCX' ? 'description' : 'table_chart'}</span>
                    <div><p className="text-sm font-bold text-slate-900">{doc.title}</p><p className="text-[10px] text-slate-500">v{doc.version} • {doc.uploadedBy} • {doc.uploadedAt} • {doc.size}</p></div>
                  </div>
                  <button onClick={() => showToast({ title: 'Downloading', message: doc.title, type: 'success' })} className="text-xs font-bold text-aims-navy hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">download</span>Download</button>
                </div>
              ))}
              {canEdit && (
                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <button onClick={() => showToast({ title: 'Upload Dialog', message: 'File picker would open here', type: 'info' })} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 transition-colors flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">upload_file</span>Upload Document</button>
                </div>
              )}
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 mb-3 italic">Shared organizational templates and boilerplate available for all grants.</p>
              {g.resources.map((res) => (
                <div key={res.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className={cn('material-symbols-outlined text-[20px]', res.fileType === 'PDF' ? 'text-red-500' : res.fileType === 'DOCX' ? 'text-blue-600' : 'text-green-600')}>{res.fileType === 'PDF' ? 'picture_as_pdf' : res.fileType === 'DOCX' ? 'description' : 'table_chart'}</span>
                    <div><p className="text-sm font-bold text-slate-900">{res.title}</p><p className="text-[10px] text-slate-500">{res.fileType} • {res.size}</p></div>
                  </div>
                  <button onClick={() => showToast({ title: 'Downloading', message: res.title, type: 'success' })} className="text-xs font-bold text-aims-navy hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">download</span>Download</button>
                </div>
              ))}
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-3">
              {g.comments.map((c) => (
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
              <div className="pt-3 border-t border-slate-100">
                <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment about this grant…" rows={2} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30 resize-none mb-2" />
                <div className="flex justify-end"><button onClick={handleSubmitComment} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 transition-colors flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">send</span>Post Comment</button></div>
              </div>
            </div>
          )}

          {/* Activity Log Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-0 relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200" />
              {g.activityLog.map((entry) => (
                <div key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
                  <div className="relative z-10 w-6 h-6 rounded-full bg-aims-navy flex items-center justify-center flex-shrink-0 border-2 border-white"><span className="material-symbols-outlined text-white text-[12px]">circle</span></div>
                  <div className="pt-0.5"><p className="text-sm text-slate-900"><span className="font-bold">{entry.actor}</span> {entry.action}</p><p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(entry.timestamp)}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}