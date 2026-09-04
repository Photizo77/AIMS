// src/pages/Approvals.tsx
import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { exportRecordSheet } from '@/lib/export';
import { flagService, subscribeFlags } from '@/services/flagService';
import { type Requisition, type RequisitionStatus, requisitions, useRequisitions, mutateRequisitions } from '@/services/requisitionService';
import { openFlagForED } from '@/components/grants/FlagForEDModal';

type FinanceTab = 'drafts' | 'pushed' | 'returned' | 'history';

function fmtMoney(n: number): string {
  if (n >= 1000000000) return `UGX ${(n / 1000000000).toFixed(1)}B`;
  if (n >= 1000000) return `UGX ${(n / 1000000).toFixed(0)}M`;
  return `UGX ${(n / 1000).toFixed(0)}K`;
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function getAgingColor(days: number): string {
  if (days >= 3) return 'text-red-600 bg-red-50 border-red-200';
  if (days >= 1) return 'text-aims-orange bg-aims-orange/10 border-aims-orange/20';
  return 'text-aims-green bg-aims-green/10 border-aims-green/20';
}

const STATUS_BADGE: Record<RequisitionStatus, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-slate-100 text-slate-600' },
  pushed: { label: 'Awaiting ED', cls: 'bg-aims-navy/10 text-aims-navy' },
  returned: { label: 'Returned', cls: 'bg-red-100 text-red-600' },
  approved: { label: 'Approved', cls: 'bg-aims-green/15 text-aims-green' },
  disbursed: { label: 'Disbursed', cls: 'bg-aims-green/15 text-aims-green' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-600' },
};

// ── FULL REQUISITION DETAIL MODAL (ED / CD / Finance) ──
function RequisitionDetailModal({ req, onClose }: { req: Requisition; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 bg-aims-navy text-white flex items-center justify-between sticky top-0">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-bold text-white/70 font-mono">{req.id}</span>
              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase', STATUS_BADGE[req.status].cls)}>{STATUS_BADGE[req.status].label}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/15">{req.dept}</span>
            </div>
            <h3 className="text-lg font-extrabold">{req.title}</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><span className="material-symbols-outlined text-[22px]">close</span></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Parties & financial */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Requester</p><p className="text-sm font-bold text-slate-900 mt-0.5">{req.requester}</p></div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Department</p><p className="text-sm font-bold text-slate-900 mt-0.5">{req.dept}</p></div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Amount</p><p className="text-sm font-extrabold text-aims-navy mt-0.5">{fmtMoney(req.amount)}</p></div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Budget Line</p><p className="text-xs font-bold text-slate-900 mt-0.5 font-mono">{req.budgetLine}</p></div>
          </div>

          {/* Purpose */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Purpose / Justification</p>
            <p className="text-sm text-slate-700">{req.purpose}</p>
          </div>

          {/* Line items */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Line Items</p>
            <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50"><tr><th className="px-3 py-1.5 text-left text-slate-500 font-bold">Item</th><th className="px-3 py-1.5 text-right text-slate-500 font-bold">Qty</th><th className="px-3 py-1.5 text-right text-slate-500 font-bold">Unit</th><th className="px-3 py-1.5 text-right text-slate-500 font-bold">Total</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {req.lineItems.map((li, i) => <tr key={i}><td className="px-3 py-1.5 text-slate-700">{li.item}</td><td className="px-3 py-1.5 text-right text-slate-600">{li.qty}</td><td className="px-3 py-1.5 text-right text-slate-600">{li.unit}</td><td className="px-3 py-1.5 text-right font-semibold text-slate-900">{fmtMoney(li.total)}</td></tr>)}
                <tr className="bg-slate-50 font-bold"><td colSpan={3} className="px-3 py-1.5 text-slate-700">Total</td><td className="px-3 py-1.5 text-right text-aims-navy">{fmtMoney(req.amount)}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Attachments */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Attachments ({req.attachments.length})</p>
            {req.attachments.length === 0 && <p className="text-xs text-slate-400 italic">No attachments.</p>}
            {req.attachments.map((att) => (
              <div key={att.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[16px] text-slate-400">{att.fileType === 'PDF' ? 'picture_as_pdf' : att.fileType === 'ZIP' ? 'folder_zip' : 'description'}</span>
                  <span className="text-xs font-semibold text-slate-900 truncate">{att.name}</span>
                  <span className="text-[10px] text-slate-400">({att.size})</span>
                </div>
                <button className="text-aims-navy text-xs font-bold hover:underline">Download</button>
              </div>
            ))}
          </div>

          {/* ED decision + disbursement */}
          {req.edDecision && (
            <div className={cn('p-3 rounded-lg border', req.edDecision.action === 'approved' ? 'bg-aims-green/5 border-aims-green/20' : 'bg-red-50 border-red-200')}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-500">ED {req.edDecision.action} • {formatDate(req.edDecision.date)}</p>
              <p className="text-xs text-slate-700 italic">"{req.edDecision.comment}"</p>
            </div>
          )}
          {req.disbursementRef && (
            <div className="p-2 bg-aims-green/5 rounded-lg border border-aims-green/20 text-xs"><span className="font-bold text-aims-green">Disbursement Ref:</span> <span className="font-mono text-slate-900">{req.disbursementRef}</span></div>
          )}

          {/* Audit trail */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Audit Trail</p>
            <div className="space-y-1 text-xs text-slate-600">
              <p>Created: {formatDate(req.createdAt)}</p>
              <p>Last updated: {formatDate(req.updatedAt)}</p>
              <p>Days in current status: {req.daysInStatus}</p>
              <p>{req.edDecision ? `Decision by ED on ${formatDate(req.edDecision.date)}` : 'Awaiting ED decision'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ROUTER: renders the right view per role ──
export function Approvals() {
  const { user } = useAuth();
  const location = useLocation();
  const readonly = new URLSearchParams(location.search).get('view') === 'readonly';

  if (!user) return <div className="p-8 text-center text-slate-500">Loading…</div>;
  if (readonly || user.role === 'CD') return <ReadonlyApprovals />;
  if (user.role === 'FINANCE') return <FinanceRequisitionWorkspace userName={user.name} />;
  return <EDApprovalQueue />;
}

// ── FINANCE REQUISITION WORKSPACE ──
function FinanceRequisitionWorkspace({ userName }: { userName: string }) {
  const { showToast, addNotification } = useNotifications();
  const location = useLocation();
  const requisitions = useRequisitions();
  const [activeTab, setActiveTab] = useState<FinanceTab>('drafts');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterAmount, setFilterAmount] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(() => Boolean((location.state as { new?: boolean } | null)?.new));
  const [detail, setDetail] = useState<Requisition | null>(null);

  const visibleReqs = useMemo(() => requisitions.filter((r) => {
    if (activeTab === 'drafts' && !(r.status === 'draft' && r.requester === userName)) return false;
    if (activeTab === 'pushed' && r.status !== 'pushed') return false;
    if (activeTab === 'returned' && r.status !== 'returned') return false;
    if (activeTab === 'history' && !['approved', 'disbursed', 'rejected'].includes(r.status)) return false;
    if (filterDept && r.dept !== filterDept) return false;
    if (filterAmount === 'lt-5m' && r.amount >= 5000000) return false;
    if (filterAmount === '5m-20m' && (r.amount < 5000000 || r.amount > 20000000)) return false;
    if (filterAmount === 'gt-20m' && r.amount <= 20000000) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!r.title.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q) && !r.purpose.toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
  [activeTab, searchQuery, filterDept, filterAmount, userName, requisitions]);

  const tabCounts = useMemo(() => ({
    drafts: requisitions.filter((r) => r.status === 'draft' && r.requester === userName).length,
    pushed: requisitions.filter((r) => r.status === 'pushed').length,
    returned: requisitions.filter((r) => r.status === 'returned').length,
    history: requisitions.filter((r) => ['approved', 'disbursed', 'rejected'].includes(r.status)).length,
  }), [userName, requisitions]);

  const tabs: { key: FinanceTab; label: string; icon: string }[] = [
    { key: 'drafts', label: 'My Drafts', icon: 'edit_note' },
    { key: 'pushed', label: 'Pushed to ED', icon: 'hourglass_top' },
    { key: 'returned', label: 'Returned / Needs Revision', icon: 'assignment_return' },
    { key: 'history', label: 'Approved & Disbursed', icon: 'check_circle' },
  ];

  const handlePush = (id: string) => {
    mutateRequisitions((list) => {
      const r = list.find((x) => x.id === id);
      if (r && r.status === 'draft') {
        r.status = 'pushed';
        r.daysInStatus = 0;
        r.updatedAt = new Date().toISOString();
      }
    });
    addNotification({ userId: 'user-ed-001', title: 'Requisition Pushed to ED', message: `${id} is awaiting your approval.`, type: 'approval', actionUrl: '/approvals' });
    showToast({ title: 'Pushed to ED', message: `${id} is now awaiting ED approval.`, type: 'success' });
  };
  const handleRecall = (id: string) => {
    mutateRequisitions((list) => {
      const r = list.find((x) => x.id === id);
      if (r && r.status === 'pushed') { r.status = 'draft'; r.updatedAt = new Date().toISOString(); }
    });
    showToast({ title: 'Recalled', message: `${id} returned to My Drafts for editing.`, type: 'info' });
  };
  const handleRevise = (id: string) => {
    mutateRequisitions((list) => {
      const r = list.find((x) => x.id === id);
      if (r && r.status === 'returned') { r.status = 'pushed'; r.daysInStatus = 0; r.updatedAt = new Date().toISOString(); }
    });
    addNotification({ userId: 'user-ed-001', title: 'Requisition Re-Submitted', message: `${id} revised and re-pushed for your review.`, type: 'approval', actionUrl: '/approvals' });
    showToast({ title: 'Re-Pushed to ED', message: `${id} revised and sent back to ED.`, type: 'success' });
  };
  const handleDisburse = (id: string) => {
    const ref = `DISB-2026-${Math.floor(Math.random() * 900 + 100)}`;
    mutateRequisitions((list) => {
      const r = list.find((x) => x.id === id);
      if (r && r.status === 'approved') { r.status = 'disbursed'; r.disbursementRef = ref; r.updatedAt = new Date().toISOString(); }
    });
    showToast({ title: 'Disbursement Processed', message: `${id} disbursed. Ref: ${ref}`, type: 'success' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Requisition Queue</h1>
        <p className="text-base font-medium text-white">Draft, push to ED, and process disbursements — ED holds approval authority</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setExpandedId(null); }}
            className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all border',
              activeTab === tab.key ? 'bg-aims-navy text-white border-aims-navy shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')}>
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
            <span className={cn('text-[10px] font-extrabold px-1.5 py-0.5 rounded-full', activeTab === tab.key ? 'bg-white/20' : 'bg-slate-100 text-slate-600')}>{tabCounts[tab.key]}</span>
          </button>
        ))}
      </div>

      {/* Advanced Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search</label>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Title, ID, purpose…" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
          </div>
          <div className="min-w-[140px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30">
              <option value="">All depts</option><option>Finance</option><option>Grants</option><option>Innovation</option><option>HR</option><option>IT</option>
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount Range</label>
            <select value={filterAmount} onChange={(e) => setFilterAmount(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30">
              <option value="">Any amount</option><option value="lt-5m">&lt; UGX 5M</option><option value="5m-20m">UGX 5M – 20M</option><option value="gt-20m">&gt; UGX 20M</option>
            </select>
          </div>
          {(activeTab === 'drafts' || activeTab === 'returned') && (
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => showToast({ title: 'Template Loaded', message: 'Standard requisition template loaded from Shared Reference Library.', type: 'success' })} className="px-4 py-2 bg-aims-green/10 text-aims-green border border-aims-green/30 text-xs font-bold rounded-lg hover:bg-aims-green/20 transition-colors flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">description</span>Use Template
              </button>
              <button onClick={() => setShowCreateForm(!showCreateForm)} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 transition-colors flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">add</span>New Requisition
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl border border-aims-navy/30 shadow-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Create New Requisition</h3>
            <button onClick={() => setShowCreateForm(false)} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined text-[20px]">close</span></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Title</label><input type="text" placeholder="e.g., Q4 Training Materials" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" /></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label><select className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30"><option>Finance</option><option>Grants</option><option>Innovation</option><option>HR</option><option>IT</option></select></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount (UGX)</label><input type="number" placeholder="e.g., 2500000" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" /></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Budget Line</label><select className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30"><option>GL-5210 Office Supplies</option><option>GL-5220 Communications</option><option>GL-5230 Training</option><option>GL-5315 Field Equipment</option><option>GL-5421 R&D Equipment</option></select></div>
            <div className="md:col-span-2"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Purpose</label><textarea rows={2} placeholder="Why is this purchase needed?" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30 resize-none" /></div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Attachments (quotes, receipts, invoices)</label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-aims-navy/50 cursor-pointer transition-colors">
                <span className="material-symbols-outlined text-slate-400 text-[24px]">upload_file</span>
                <p className="text-xs text-slate-500 mt-1">Click or drag files here • PDF, DOCX, XLSX, images</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
            <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button onClick={() => { showToast({ title: 'Draft saved', message: 'Saved to My Drafts.', type: 'success' }); setShowCreateForm(false); }} className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Save Draft</button>
            <button onClick={() => { showToast({ title: 'Pushed to ED', message: 'Sent to ED for approval.', type: 'success' }); setShowCreateForm(false); }} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">send</span>Push to ED</button>
          </div>
        </div>
      )}

      {/* Requisition list */}
      <div className="space-y-3">
        {visibleReqs.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <span className="material-symbols-outlined text-slate-300 text-[48px]">inbox</span>
            <p className="text-sm font-bold text-slate-700 mt-2">No requisitions in this view</p>
            <p className="text-xs text-slate-400 mt-1">Adjust filters or switch tabs.</p>
          </div>
        )}
        {visibleReqs.map((r) => {
          const isExpanded = expandedId === r.id;
          const badge = STATUS_BADGE[r.status];
          return (
            <div key={r.id} className={cn('bg-white rounded-xl border shadow-sm transition-all', isExpanded ? 'border-aims-navy shadow-md' : 'border-slate-200')}>
              <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">{isExpanded ? 'expand_less' : 'expand_more'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 font-mono">{r.id}</span>
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase', badge.cls)}>{badge.label}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{r.dept}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 truncate">{r.title}</p>
                    <p className="text-[10px] text-slate-500 truncate">{r.purpose}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-sm font-extrabold text-slate-900">{fmtMoney(r.amount)}</p>
                  {r.status === 'pushed' && <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border mt-1 inline-block', getAgingColor(r.daysInStatus))}>{r.daysInStatus}d waiting</span>}
                  {r.status === 'returned' && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 mt-1 inline-block">{r.daysInStatus}d ago</span>}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase">Requester</p><p className="font-semibold text-slate-900">{r.requester}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase">Budget Line</p><p className="font-semibold text-slate-900 font-mono text-[11px]">{r.budgetLine}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase">Created</p><p className="font-semibold text-slate-900">{formatDate(r.createdAt)}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase">Updated</p><p className="font-semibold text-slate-900">{formatDate(r.updatedAt)}</p></div>
                  </div>

                  <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-50"><tr><th className="px-3 py-1.5 text-left text-slate-500 font-bold">Item</th><th className="px-3 py-1.5 text-right text-slate-500 font-bold">Qty</th><th className="px-3 py-1.5 text-right text-slate-500 font-bold">Unit</th><th className="px-3 py-1.5 text-right text-slate-500 font-bold">Total</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {r.lineItems.map((li, i) => <tr key={i}><td className="px-3 py-1.5 text-slate-700">{li.item}</td><td className="px-3 py-1.5 text-right text-slate-600">{li.qty}</td><td className="px-3 py-1.5 text-right text-slate-600">{li.unit}</td><td className="px-3 py-1.5 text-right font-semibold text-slate-900">{fmtMoney(li.total)}</td></tr>)}
                      <tr className="bg-slate-50 font-bold"><td colSpan={3} className="px-3 py-1.5 text-slate-700">Total</td><td className="px-3 py-1.5 text-right text-aims-navy">{fmtMoney(r.amount)}</td></tr>
                    </tbody>
                  </table>

                  {r.attachments.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attachments ({r.attachments.length})</p>
                      {r.attachments.map((att) => (
                        <div key={att.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="material-symbols-outlined text-[16px] text-slate-400">{att.fileType === 'PDF' ? 'picture_as_pdf' : att.fileType === 'ZIP' ? 'folder_zip' : 'description'}</span>
                            <span className="text-xs font-semibold text-slate-900 truncate">{att.name}</span>
                            <span className="text-[10px] text-slate-400">({att.size})</span>
                          </div>
                          <button onClick={() => exportRecordSheet(att.name.replace(/\.[^.]+$/, ''), 'Requisition Attachment', [['Attachment', att.name], ['Type', att.fileType], ['Size', att.size], ['Requisition', `${r.id} — ${r.title}`]])} className="text-aims-navy text-xs font-bold hover:underline">Download</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {r.edDecision && (
                    <div className={cn('p-3 rounded-lg border', r.edDecision.action === 'approved' ? 'bg-aims-green/5 border-aims-green/20' : 'bg-red-50 border-red-200')}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-500">ED {r.edDecision.action} • {formatDate(r.edDecision.date)}</p>
                      <p className="text-xs text-slate-700 italic">"{r.edDecision.comment}"</p>
                    </div>
                  )}

                  {r.disbursementRef && (
                    <div className="p-2 bg-aims-green/5 rounded-lg border border-aims-green/20 text-xs"><span className="font-bold text-aims-green">Disbursement Ref:</span> <span className="font-mono text-slate-900">{r.disbursementRef}</span></div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 flex-wrap">
                    <button onClick={() => setDetail(r)} className="px-3 py-1.5 text-xs font-bold text-aims-navy border border-aims-navy/20 rounded-lg hover:bg-aims-navy/5 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">visibility</span>View Full Details</button>
                    {r.status === 'draft' && <button onClick={() => handlePush(r.id)} className="px-3 py-1.5 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">send</span>Push to ED</button>}
                    {r.status === 'pushed' && (
                      <>
                        <button onClick={() => handleRecall(r.id)} className="px-3 py-1.5 text-xs font-bold text-aims-navy border border-aims-navy/20 rounded-lg hover:bg-aims-navy/5 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">undo</span>Recall</button>
                        <p className="text-[10px] text-slate-400 italic flex items-center">Awaiting ED decision</p>
                      </>
                    )}
                    {r.status === 'returned' && (
                      <>
                        <button onClick={() => showToast({ title: 'ED Notes', message: r.edDecision?.comment ?? 'No notes', type: 'info' })} className="px-3 py-1.5 text-xs font-bold text-aims-navy border border-aims-navy/20 rounded-lg hover:bg-aims-navy/5 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">rate_review</span>View ED Notes</button>
                        <button onClick={() => handleRevise(r.id)} className="px-3 py-1.5 bg-aims-orange text-white text-xs font-bold rounded-lg hover:bg-aims-orange/90 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">edit</span>Revise & Re-Push</button>
                      </>
                    )}
                    {r.status === 'approved' && <button onClick={() => handleDisburse(r.id)} className="px-3 py-1.5 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">payments</span>Process Disbursement</button>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {detail && <RequisitionDetailModal req={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

// ── ED APPROVAL QUEUE (approve / reject / pushback + CD flag interrupts) ──
function EDApprovalQueue() {
  const { user } = useAuth();
  const { showToast, addNotification } = useNotifications();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Requisition | null>(null);
  const [, setFlagVersion] = useState(0);
  useEffect(() => subscribeFlags(() => setFlagVersion((v) => v + 1)), []);
  const requisitions = useRequisitions();
  const pending = requisitions.filter((r) => r.status === 'pushed');
  const openFlags = flagService.getOpenFlags();

  const resolveFlag = (id: string) => {
    const flag = flagService.resolveFlag(id, user?.name ?? 'ED', 'approved');
    if (!flag) return;
    addNotification({ userId: 'user-cd-001', title: 'Flag Resolved by ED', message: `"${flag.recordLabel}" approved/resolved by ${user?.name}.`, type: 'success', link: '/approvals', actionUrl: '/approvals' });
    showToast({ title: 'Flag Resolved', message: 'Approved — removed from the queue.', type: 'success' });
  };

  const askMoreInfo = (id: string) => {
    const flag = flagService.requestMoreInfo(id, user?.name ?? 'ED', 'The ED needs more information before deciding.');
    if (!flag) return;
    addNotification({ userId: 'user-cd-001', title: 'Flag: More Info Requested', message: `ED requested more information on "${flag.recordLabel}".`, type: 'info', link: '/approvals', actionUrl: '/approvals' });
    showToast({ title: 'More Info Requested', message: 'The CD has been notified — the flag stays on the queue.', type: 'info' });
  };

  const decide = (id: string, action: 'approved' | 'rejected' | 'returned') => {
    mutateRequisitions((list) => {
      const r = list.find((x) => x.id === id);
      if (r && r.status === 'pushed') {
        r.status = action;
        r.edDecision = {
          action,
          comment: action === 'approved' ? 'Approved. Finance to process disbursement.' : action === 'returned' ? 'Returned for revision. Please review the ED notes.' : 'Rejected. See ED notes.',
          date: new Date().toISOString(),
        };
        r.updatedAt = new Date().toISOString();
      }
    });
    if (action === 'approved') {
      addNotification({ title: 'Requisition Approved', message: `${id} approved → routed to Finance for disbursement.`, type: 'success', link: '/approvals', actionUrl: '/approvals' });
      showToast({ title: 'Approved', message: `${id} approved → routed to Finance for disbursement.`, type: 'success' });
    } else if (action === 'returned') {
      addNotification({ title: 'Requisition Pushed Back', message: `${id} pushed back to Finance for revision.`, type: 'warning', link: '/approvals', actionUrl: '/approvals' });
      showToast({ title: 'Pushed Back', message: `${id} returned to Finance for revision.`, type: 'warning' });
    } else {
      addNotification({ title: 'Requisition Rejected', message: `${id} rejected. See ED notes.`, type: 'error', link: '/approvals', actionUrl: '/approvals' });
      showToast({ title: 'Rejected', message: `${id} rejected.`, type: 'warning' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Approvals Queue</h1>
        <p className="text-base font-medium text-white">Exclusive to ED — requisitions, payslips and CD flags · sole approval authority</p>
      </div>

      {/* CD Flag interrupts — priority at top of queue */}
      {openFlags.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-aims-orange uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">flag</span>CD Flags — Priority Interrupts ({openFlags.length})
          </p>
          {openFlags.map((f) => (
            <div key={f.id} className={cn('rounded-lg border p-4 shadow-sm', f.priority === 'critical' ? 'bg-red-50 border-red-200' : f.priority === 'high' ? 'bg-aims-orange/5 border-aims-orange/30' : 'bg-slate-50 border-slate-200')}>
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1', f.priority === 'critical' ? 'bg-red-500 text-white' : f.priority === 'high' ? 'bg-aims-orange text-white' : 'bg-slate-500 text-white')}>
                      {f.priority === 'critical' ? '🚩' : f.priority === 'high' ? '🔶' : ''} {f.priority}
                    </span>
                    {f.infoRequested && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-aims-navy text-white uppercase">ℹ️ Info requested</span>}
                    <span className="text-[10px] font-bold text-slate-500">{f.raisedBy} · {new Date(f.raisedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-[10px] font-bold text-aims-navy bg-aims-navy/5 px-1.5 py-0.5 rounded uppercase">{f.sourceModule}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{f.recordLabel}</p>
                  <p className="text-xs text-slate-600 mt-1 italic">"{f.note}"</p>
                  {f.reference && <p className="text-[10px] text-slate-400 mt-1">📎 Reference: {f.reference}</p>}
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                  <button onClick={() => askMoreInfo(f.id)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-50">Request More Info</button>
                  <button onClick={() => resolveFlag(f.id)} className="px-3 py-1.5 bg-aims-navy text-white text-[10px] font-bold rounded-lg hover:bg-aims-navy/90">✓ Approve & Resolve</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Requisitions & Payslips Awaiting Decision</p>
        {pending.length === 0 && <div className="bg-white rounded-xl border border-slate-200 p-12 text-center"><p className="text-sm text-slate-400 italic">No requisitions awaiting approval.</p></div>}
        {pending.map((r) => {
          const isExp = expandedId === r.id;
          return (
            <div key={r.id} className={cn('bg-white rounded-xl border shadow-sm transition-all', isExp ? 'border-aims-navy shadow-md' : 'border-slate-200')}>
              <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpandedId(isExp ? null : r.id)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">{isExp ? 'expand_less' : 'expand_more'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{r.title}</p>
                    <p className="text-[10px] text-slate-500">{r.id} • {r.dept} • {r.requester}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-sm font-extrabold text-slate-900">{fmtMoney(r.amount)}</p>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border mt-1 inline-block', getAgingColor(r.daysInStatus))}>{r.daysInStatus}d waiting</span>
                </div>
              </div>
              {isExp && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                  <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden mb-3">
                    <thead className="bg-slate-50"><tr><th className="px-3 py-1.5 text-left text-slate-500 font-bold">Item</th><th className="px-3 py-1.5 text-right text-slate-500 font-bold">Qty</th><th className="px-3 py-1.5 text-right text-slate-500 font-bold">Unit</th><th className="px-3 py-1.5 text-right text-slate-500 font-bold">Total</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {r.lineItems.map((li, i) => <tr key={i}><td className="px-3 py-1.5 text-slate-700">{li.item}</td><td className="px-3 py-1.5 text-right text-slate-600">{li.qty}</td><td className="px-3 py-1.5 text-right text-slate-600">{li.unit}</td><td className="px-3 py-1.5 text-right font-semibold text-slate-900">{fmtMoney(li.total)}</td></tr>)}
                      <tr className="bg-slate-50 font-bold"><td colSpan={3} className="px-3 py-1.5 text-slate-700">Total</td><td className="px-3 py-1.5 text-right text-aims-navy">{fmtMoney(r.amount)}</td></tr>
                    </tbody>
                  </table>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setDetail(r)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">visibility</span>View Full Details</button>
                    <button onClick={() => decide(r.id, 'rejected')} className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">close</span>Reject</button>
                    <button onClick={() => decide(r.id, 'returned')} className="px-4 py-2 bg-aims-orange text-white text-xs font-bold rounded-lg hover:bg-aims-orange/90 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">undo</span>Push Back</button>
                    <button onClick={() => decide(r.id, 'approved')} className="px-4 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check</span>Approve</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {detail && <RequisitionDetailModal req={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

// ── READ-ONLY VIEW (CD — Approvals in Progress) ──
function ReadonlyApprovals() {
  const all = requisitions;
  const [detail, setDetail] = useState<Requisition | null>(null);
  return (
    <div className="space-y-6">
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Approvals in Progress</h1>
        <p className="text-base font-medium text-white">Read-only status tracker — where requisitions and payslips sit in ED's pipeline</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase">ID</th>
            <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase">Title</th>
            <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase">Dept</th>
            <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase">Amount</th>
            <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase">Status</th>
            <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase text-right">Action</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {all.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.id}</td>
                <td className="px-4 py-3 font-bold text-slate-900">{r.title}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{r.dept}</td>
                <td className="px-4 py-3 font-bold text-slate-900 text-xs">{fmtMoney(r.amount)}</td>
                <td className="px-4 py-3"><span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase', STATUS_BADGE[r.status].cls)}>{STATUS_BADGE[r.status].label}</span></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setDetail(r)} className="text-[10px] font-bold text-aims-navy hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">visibility</span>View
                    </button>
                    <button onClick={() => openFlagForED({ recordLabel: `${r.id} — ${r.title}`, sourceModule: 'approvals' })} className="text-[10px] font-bold text-aims-orange hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">flag</span>Flag for ED
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && <RequisitionDetailModal req={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}