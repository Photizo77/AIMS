// src/components/grants/GrantsManager.tsx
// ============================================================
// AIMS — Grants Manager (3-Tier Review Workflow)
// Writer → Team Lead → ED
// ============================================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { AIWritingAssistant } from './AIWritingAssistant';
import type { Grant, GrantReviewStatus } from '@/types';

const USER_NAMES: Record<string, string> = {
  'user-cd-001': 'Nassir Mwanje', 'user-ed-001': 'Peter Byamugisha',
  'user-gm-001': 'Sarah Aciro', 'user-gw-001': 'Janet Apio',
  'user-innov-001': 'Pius Odong', 'user-admin-001': 'Grace Aceng',
};

const MOCK_GRANTS: Grant[] = [
  { id: 'g1', uniqueId: 'GRANT-AGRIC-2026-001', title: 'Climate-Smart Farming Initiative', pillar: 'ArdhiAgric', description: 'Training 200 smallholder farmers in drought-resistant crop varieties and water-efficient irrigation.', amount: 250000000, assignedWriterId: 'user-gw-001', status: 'team_review', deadline: '2026-08-20', rfpDocumentUrl: '#', externalLink: 'https://grants.gov/opportunity/12345', teamLeadNotes: 'Eligibility confirmed: Ardhi has 3+ years in agricultural training. Budget aligns with funder caps. All required sections present.', createdAt: '2026-06-01', updatedAt: '2026-08-05' },
  { id: 'g2', uniqueId: 'GRANT-HEALTH-2026-002', title: 'Mobile Maternal Health Clinics', pillar: 'ArdhiHealth', description: 'Operating 3 mobile clinics providing prenatal care to 5,000 women annually.', amount: 420000000, assignedWriterId: 'user-gw-001', status: 'draft', deadline: '2026-09-15', createdAt: '2026-07-10', updatedAt: '2026-08-02' },
  { id: 'g3', uniqueId: 'GRANT-LAND-2026-001', title: 'Community Land Rights Documentation', pillar: 'ArdhiLand', description: 'Supporting 8 indigenous communities in securing ancestral land rights.', amount: 220000000, assignedWriterId: 'user-gw-001', status: 'ed_review', deadline: '2026-08-12', rfpDocumentUrl: '#', teamLeadNotes: 'Passes all eligibility criteria. Organization has documented 12 communities previously. Methodology is sound and budget justified.', edNotes: '', createdAt: '2026-05-15', updatedAt: '2026-08-04' },
  { id: 'g4', uniqueId: 'GRANT-WASTE-2026-001', title: 'Kampala E-Waste Recycling Hub', pillar: 'ArdhiWaste', description: 'Establishing formal e-waste collection and processing facility.', amount: 620000000, assignedWriterId: 'user-gw-001', status: 'approved', deadline: '2026-07-30', rfpDocumentUrl: '#', teamLeadNotes: 'Fully compliant. Strong track record in waste management.', edNotes: 'Approved. Excellent alignment with EU circular economy priorities. Budget is reasonable.', createdAt: '2026-03-10', updatedAt: '2026-07-28' },
];

const STATUS_CONFIG: Record<GrantReviewStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-gray-600', bg: 'bg-gray-100' },
  team_review: { label: 'Team Lead Review', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  ed_review: { label: 'ED Review', color: 'text-blue-700', bg: 'bg-blue-100' },
  approved: { label: 'Approved', color: 'text-green-700', bg: 'bg-green-100' },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-100' },
};

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.now();
const daysUntil = (d: string) => Math.max(0, Math.ceil((new Date(d).getTime() - NOW) / DAY_MS));

export function GrantsManager() {
  const { user } = useAuth();
  const { showToast, addNotification } = useNotifications();
  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
  const [filterStatus, setFilterStatus] = useState<GrantReviewStatus | 'all'>('all');

  // Deadline reminders for dashboard banner
  const urgentGrants = MOCK_GRANTS.filter(g => {
    const days = daysUntil(g.deadline);
    return days <= 7 && days > 0 && g.status !== 'approved' && g.status !== 'rejected';
  });

  const filtered = filterStatus === 'all' ? MOCK_GRANTS : MOCK_GRANTS.filter(g => g.status === filterStatus);

  if (selectedGrant) {
    return <GrantDetailView grant={selectedGrant} onBack={() => setSelectedGrant(null)} onUpdate={(updated) => { setSelectedGrant(updated); showToast({ title: 'Grant Updated', message: `"${updated.title}" status changed.`, type: 'success' }); }} />;
  }

  return (
    <div>
      {/* DEADLINE REMINDER BANNER */}
      {urgentGrants.length > 0 && (
        <div className="mb-6 bg-aims-orange/10 border border-aims-orange/30 rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-aims-orange text-[24px] mt-0.5">alarm</span>
          <div>
            <h3 className="text-sm font-bold text-aims-orange">⏰ {urgentGrants.length} Grant(s) Closing Soon</h3>
            <div className="mt-2 space-y-1">
              {urgentGrants.map(g => (
                <button key={g.id} onClick={() => setSelectedGrant(g)} className="block text-xs text-slate-700 hover:text-aims-navy hover:underline">
                  <strong>{daysUntil(g.deadline)} days left</strong> — {g.title} ({g.uniqueId})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FILTERS */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'draft', 'team_review', 'ed_review', 'approved', 'rejected'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={cn('px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors', filterStatus === s ? 'bg-aims-navy text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50')}>
            {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* GRANTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(grant => {
          const sc = STATUS_CONFIG[grant.status];
          const days = daysUntil(grant.deadline);
          const isUrgent = days <= 7 && days > 0 && grant.status !== 'approved' && grant.status !== 'rejected';
          return (
            <button key={grant.id} onClick={() => setSelectedGrant(grant)} className="bg-white rounded-xl border border-slate-200 p-4 text-left hover:shadow-md transition-shadow relative overflow-hidden">
              {isUrgent && <div className="absolute top-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] border-t-aims-orange" />}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-400">{grant.uniqueId}</span>
                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', sc.bg, sc.color)}>{sc.label}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">{grant.title}</h3>
              <p className="text-xs text-slate-500 mb-3 line-clamp-2">{grant.description}</p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-sm font-extrabold text-slate-900">UGX {(grant.amount / 1000000).toFixed(0)}M</span>
                <span className={cn('text-xs font-bold', isUrgent ? 'text-aims-orange' : 'text-slate-500')}>
                  {days === 0 ? 'TODAY' : `${days}d left`}
                </span>
              </div>
              {grant.rfpDocumentUrl && <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400"><span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>RFP Attached</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// GRANT DETAIL VIEW (3-Panel Layout)
// ─────────────────────────────────────────────
function GrantDetailView({ grant, onBack, onUpdate }: { grant: Grant; onBack: () => void; onUpdate: (g: Grant) => void }) {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [notes, setNotes] = useState('');
  const sc = STATUS_CONFIG[grant.status];
  const days = daysUntil(grant.deadline);
  const isWriter = user?.role === 'GRANT_WRITER';
  const isTeamLead = user?.role === 'GRANTS_MANAGER';
  const isED = user?.role === 'ED' || user?.role === 'CD';

  const handleSubmitToTeamLead = () => {
    onUpdate({ ...grant, status: 'team_review', updatedAt: new Date().toISOString().split('T')[0] });
    addNotification({ userId: 'user-gm-001', title: 'Grant Ready for Review', message: `"${grant.title}" submitted by ${user?.name}.`, type: 'approval', actionUrl: '/grants' });
  };

  const handleTeamLeadReview = (action: 'forward' | 'return') => {
    if (!notes.trim() || notes.trim().length < 10) return;
    const newStatus = action === 'forward' ? 'ed_review' : 'draft';
    onUpdate({ ...grant, status: newStatus, teamLeadNotes: notes.trim(), updatedAt: new Date().toISOString().split('T')[0] });
    if (action === 'forward') {
      addNotification({ userId: 'user-ed-001', title: 'Grant Ready for ED Approval', message: `"${grant.title}" passed team lead review.`, type: 'approval', actionUrl: '/approvals' });
    } else {
      addNotification({ userId: grant.assignedWriterId, title: 'Grant Returned for Revision', message: `"${grant.title}" returned by Team Lead. Check notes.`, type: 'warning', actionUrl: '/grants' });
    }
    setNotes('');
  };

  const handleEDDecision = (action: 'approve' | 'reject') => {
    if (!notes.trim() || notes.trim().length < 10) return;
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    onUpdate({ ...grant, status: newStatus, edNotes: notes.trim(), updatedAt: new Date().toISOString().split('T')[0] });
    addNotification({ userId: grant.assignedWriterId, title: `Grant ${action === 'approve' ? 'Approved' : 'Rejected'}`, message: `"${grant.title}" — ${action === 'approve' ? 'Approved by ED.' : 'Rejected. Check ED notes.'}`, type: action === 'approve' ? 'success' : 'error', actionUrl: '/grants' });
    setNotes('');
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-700">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>Back to Grants
      </button>

      {/* HEADER */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
          <div>
            <span className="text-[10px] font-mono text-slate-400">{grant.uniqueId}</span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">{grant.title}</h2>
            <p className="text-sm text-slate-600 mt-1">{grant.pillar} • UGX {(grant.amount / 1000000).toFixed(0)}M</p>
          </div>
          <span className={cn('px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap', sc.bg, sc.color)}>{sc.label}</span>
        </div>

        {/* RFP DOCUMENT + EXTERNAL LINK */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100">
          {grant.rfpDocumentUrl ? (
            <a href={grant.rfpDocumentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-700 hover:bg-red-100 transition-colors">
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>View RFP Document
            </a>
          ) : (
            <button className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 cursor-not-allowed">
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>No RFP Uploaded
            </button>
          )}
          {grant.externalLink && (
            <a href={grant.externalLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors">
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>Funder Portal
            </a>
          )}
          <div className="flex items-center gap-2 px-3 py-2 ml-auto">
            <span className="material-symbols-outlined text-[18px] text-slate-400">schedule</span>
            <span className={cn('text-xs font-bold', days <= 7 ? 'text-aims-orange' : 'text-slate-600')}>Deadline: {grant.deadline} ({days} days)</span>
          </div>
        </div>
      </div>

      {/* 3-PANEL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT: Proposal Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">edit_note</span>Grant Proposal
            </h3>
            <textarea
              defaultValue={grant.description}
              disabled={!isWriter || grant.status !== 'draft'}
              placeholder="Write your grant proposal here..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm min-h-[300px] resize-none focus:outline-none focus:ring-2 focus:ring-aims-green/50 disabled:bg-slate-50 disabled:text-slate-500"
            />
            {isWriter && grant.status === 'draft' && (
              <div className="flex justify-end mt-3">
                <button onClick={handleSubmitToTeamLead} className="px-4 py-2 bg-aims-navy text-white rounded-lg text-sm font-bold hover:opacity-90">Submit to Team Lead</button>
              </div>
            )}
          </div>

          {/* REVIEW TIMELINE */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Review Timeline</h3>
            <div className="space-y-4">
              <TimelineStep label="Grant Writer" name={USER_NAMES[grant.assignedWriterId] || 'Unknown'} date={grant.createdAt} done status="Submitted draft" />
              <TimelineStep label="Team Lead Review" name={USER_NAMES['user-gm-001']} date={grant.teamLeadNotes ? grant.updatedAt : undefined} done={!!grant.teamLeadNotes} status={grant.teamLeadNotes ? 'Reviewed & forwarded' : 'Awaiting review'} notes={grant.teamLeadNotes} />
              <TimelineStep label="ED Approval" name={USER_NAMES['user-ed-001']} date={grant.edNotes ? grant.updatedAt : undefined} done={!!grant.edNotes} status={grant.edNotes ? (grant.status === 'approved' ? 'Approved' : 'Rejected') : 'Awaiting ED decision'} notes={grant.edNotes} />
            </div>
          </div>
        </div>

        {/* RIGHT: AI Assistant + Actions */}
        <div className="space-y-4">
          <AIWritingAssistant grant={grant} />

          {/* TEAM LEAD ACTIONS */}
          {isTeamLead && grant.status === 'team_review' && (
            <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
              <h3 className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">rate_review</span>Team Lead Review
              </h3>
              <p className="text-xs text-yellow-700 mb-3">Confirm eligibility against RFP criteria. Notes are mandatory.</p>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Explain why this grant passes eligibility criteria (min 10 chars)..." className="w-full px-3 py-2 border border-yellow-300 rounded-lg text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500/50 mb-3" />
              <div className="flex gap-2">
                <button onClick={() => handleTeamLeadReview('return')} disabled={notes.trim().length < 10} className="flex-1 py-2 bg-white border border-yellow-300 text-yellow-700 rounded-lg text-xs font-bold hover:bg-yellow-50 disabled:opacity-50">Return to Writer</button>
                <button onClick={() => handleTeamLeadReview('forward')} disabled={notes.trim().length < 10} className="flex-1 py-2 bg-aims-green text-white rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50">Forward to ED</button>
              </div>
            </div>
          )}

          {/* ED ACTIONS */}
          {isED && grant.status === 'ed_review' && (
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
              <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>ED Final Decision
              </h3>
              {grant.teamLeadNotes && (
                <div className="bg-white rounded-lg p-3 mb-3 border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Team Lead Notes</p>
                  <p className="text-xs text-slate-700">{grant.teamLeadNotes}</p>
                </div>
              )}
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Provide approval/rejection justification (min 10 chars)..." className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-3" />
              <div className="flex gap-2">
                <button onClick={() => handleEDDecision('reject')} disabled={notes.trim().length < 10} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 disabled:opacity-50">Reject</button>
                <button onClick={() => handleEDDecision('approve')} disabled={notes.trim().length < 10} className="flex-1 py-2 bg-aims-green text-white rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50">Approve</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineStep({ label, name, date, done, status, notes }: { label: string; name: string; date?: string; done: boolean; status: string; notes?: string }) {
  return (
    <div className="flex gap-3">
      <div className={cn('w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5', done ? 'bg-aims-green text-white' : 'bg-slate-200 text-slate-400')}>
        <span className="material-symbols-outlined text-[14px]">{done ? 'check' : 'more_horiz'}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{name} {date && `• ${date}`}</p>
        <p className={cn('text-xs font-semibold mt-0.5', done ? 'text-aims-green' : 'text-slate-400')}>{status}</p>
        {notes && <div className="mt-2 bg-slate-50 rounded-lg p-2 border border-slate-100"><p className="text-xs text-slate-600 italic">"{notes}"</p></div>}
      </div>
    </div>
  );
}