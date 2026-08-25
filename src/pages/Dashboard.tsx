// src/pages/Dashboard.tsx
import { type ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import { CheckInCard } from '@/components/dashboard/CheckInCard';
import { PayslipReviewPanel } from '@/components/admin/PayslipReviewPanel';
import { GrantsPipelineBoard } from '@/components/grants/GrantsPipelineBoard';
import { SharedLibraryWidget } from '@/components/dashboard/SharedLibraryWidget';

type ColorKey = 'green' | 'navy' | 'orange' | 'mint';

const CHIP: Record<ColorKey, string> = { green: 'bg-aims-green text-white', navy: 'bg-aims-navy text-white', orange: 'bg-aims-orange text-white', mint: 'bg-aims-mint text-aims-green' };
const ACCENT: Record<ColorKey, string> = { green: 'border-t-aims-green', navy: 'border-t-aims-navy', orange: 'border-t-aims-orange', mint: 'border-t-aims-mint' };
const FILL: Record<ColorKey, string> = { green: 'bg-aims-green', navy: 'bg-aims-navy', orange: 'bg-aims-orange', mint: 'bg-aims-green' };

function DashHeader({ gradient, title, subtitle }: { gradient: string; title: string; subtitle: string }) {
  return (<div className={cn('rounded-2xl p-7 text-white shadow-lg', gradient)}><h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">{title}</h1><p className="text-base font-medium text-white">{subtitle}</p></div>);
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: string; color: ColorKey }) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 border-t-4 p-5 shadow-sm hover:shadow-md transition-shadow', ACCENT[color])}>
      <div className={cn('w-11 h-11 rounded-lg flex items-center justify-center mb-4', CHIP[color])}><span className="material-symbols-outlined text-[24px]">{icon}</span></div>
      <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</p>
      <p className="text-sm font-semibold text-slate-600 mt-1">{title}</p>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (<div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"><div className="mb-4"><h3 className="text-base font-bold text-slate-900">{title}</h3>{subtitle && <p className="text-xs font-semibold text-slate-500 mt-0.5">{subtitle}</p>}</div>{children}</div>);
}

function Bar({ label, value, max, display, color }: { label: string; value: number; max: number; display: string; color: ColorKey }) {
  const pct = Math.max(3, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5"><span className="text-sm font-semibold text-slate-700">{label}</span><span className="text-sm font-extrabold text-slate-900">{display}</span></div>
      <div className="w-full bg-slate-100 rounded-full h-2.5"><div className={cn('h-2.5 rounded-full', FILL[color])} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

interface FilterPreset { id: string; name: string }
interface AdvancedFilterBarProps { dateLabel?: string; statusOptions: string[]; ownerOptions: string[]; showAmountRange?: boolean; presets?: FilterPreset[]; onFilterChange?: (filters: Record<string, string>) => void; onExport?: (format: 'csv' | 'pdf') => void; onSavePreset?: (name: string) => void; }

function AdvancedFilterBar({ dateLabel = 'Date', statusOptions, ownerOptions, showAmountRange = false, presets = [], onFilterChange, onExport, onSavePreset }: AdvancedFilterBarProps) {
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState('');
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[180px]"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search</label><input type="text" placeholder="Title, description, ID…" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30" onChange={(e) => onFilterChange?.({ keyword: e.target.value })} /></div>
        <div className="min-w-[140px]"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{dateLabel}</label><select className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30"><option value="">All time</option><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="custom">Custom range…</option></select></div>
        <div className="min-w-[130px]"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label><select className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30"><option value="">All statuses</option>{statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
        <div className="min-w-[130px]"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Owner / Dept</label><select className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30"><option value="">All</option>{ownerOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
        {showAmountRange && (<div className="min-w-[120px]"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount</label><select className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30"><option value="">Any amount</option><option value="lt-1m">&lt; UGX 1M</option><option value="1m-5m">UGX 1M – 5M</option><option value="5m-20m">UGX 5M – 20M</option><option value="gt-20m">&gt; UGX 20M</option></select></div>)}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {presets.length > 0 && (<div className="relative"><button onClick={() => setShowPresets(!showPresets)} className="text-[10px] font-bold text-aims-navy hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">bookmark</span>Presets ({presets.length})</button>{showPresets && (<div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-10 min-w-[180px]">{presets.map((p) => <button key={p.id} className="block w-full text-left text-xs px-2 py-1.5 hover:bg-slate-50 rounded text-slate-700">{p.name}</button>)}</div>)}</div>)}
        <div className="flex items-center gap-1"><input type="text" placeholder="Save filter as…" value={presetName} onChange={(e) => setPresetName(e.target.value)} className="text-[10px] border border-slate-200 rounded px-2 py-1 w-32 focus:outline-none focus:ring-1 focus:ring-aims-navy/30" /><button onClick={() => { if (presetName.trim()) { onSavePreset?.(presetName); setPresetName(''); } }} className="text-[10px] font-bold text-aims-green hover:underline">Save</button></div>
        <div className="ml-auto flex items-center gap-2"><span className="text-[10px] text-slate-400 italic">Filters combine with AND</span><button onClick={() => onExport?.('csv')} className="text-[10px] font-bold text-aims-navy hover:underline flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">download</span>CSV</button><button onClick={() => onExport?.('pdf')} className="text-[10px] font-bold text-aims-navy hover:underline flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">picture_as_pdf</span>PDF</button></div>
      </div>
    </div>
  );
}

function ApprovalActionPanel({ itemName, itemType, onViewFull, onApprove, onReject }: { itemName: string; itemType: string; onViewFull: () => void; onApprove: (comment: string) => void; onReject: (comment: string) => void }) {
  const [comment, setComment] = useState('');
  const [hasViewedDetails, setHasViewedDetails] = useState(false);
  const canAct = hasViewedDetails && comment.trim().length >= 5;
  return (
    <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
      <div className="flex items-center gap-2 text-[10px]">
        <span className={cn('font-bold', hasViewedDetails ? 'text-aims-green' : 'text-slate-400')}>✓ View Details</span><span className="text-slate-300">→</span>
        <span className={cn('font-bold', comment.trim().length >= 5 ? 'text-aims-green' : 'text-slate-400')}>✓ Add Comment (min 5 chars)</span><span className="text-slate-300">→</span>
        <span className={cn('font-bold', canAct ? 'text-aims-navy' : 'text-slate-400')}>Approve / Reject</span>
      </div>
      {!hasViewedDetails && (<button onClick={() => { setHasViewedDetails(true); onViewFull(); }} className="w-full py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 transition-colors flex items-center justify-center gap-1.5"><span className="material-symbols-outlined text-[16px]">visibility</span>View Full {itemType} Details</button>)}
      {hasViewedDetails && (
        <>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Your Decision Comment (Required)</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={`Explain your decision on ${itemName}…`} rows={2} className={cn('w-full text-xs border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 resize-none', comment.trim().length < 5 ? 'border-slate-200 focus:ring-aims-orange/30' : 'border-aims-green/40 focus:ring-aims-green/30')} />
            {comment.trim().length > 0 && comment.trim().length < 5 && <p className="text-[10px] text-aims-orange mt-1">Comment must be at least 5 characters.</p>}
          </div>
          <div className="flex gap-2 justify-end">
            <button disabled={!canAct} onClick={() => onReject(comment)} className={cn('px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5', canAct ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}><span className="material-symbols-outlined text-[16px]">close</span>Reject</button>
            <button disabled={!canAct} onClick={() => onApprove(comment)} className={cn('px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5', canAct ? 'bg-aims-green text-white hover:bg-aims-green/90' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}><span className="material-symbols-outlined text-[16px]">check</span>Approve</button>
          </div>
        </>
      )}
    </div>
  );
}

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 bg-aims-navy rounded-t-xl flex items-center justify-between">
          <div><h3 className="text-sm font-bold text-white">{title}</h3>{subtitle && <p className="text-[11px] text-white/70">{subtitle}</p>}</div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><span className="material-symbols-outlined text-[20px]">close</span></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function NewRequisitionModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  return (
    <Modal title="Create New Requisition" subtitle="Draft first, then push to ED for approval" onClose={onClose}>
      <div className="space-y-3">
        <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Title</label><input type="text" placeholder="e.g., Q4 Training Materials" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label><select className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30"><option>Finance</option><option>Grants</option><option>Innovation</option><option>HR</option><option>IT</option></select></div>
          <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount (UGX)</label><input type="number" placeholder="e.g., 2500000" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" /></div>
        </div>
        <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Budget Line</label><select className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30"><option>GL-5210 Office Supplies</option><option>GL-5220 Communications</option><option>GL-5230 Training</option><option>GL-5315 Field Equipment</option><option>GL-5421 R&D Equipment</option></select></div>
        <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Purpose</label><textarea rows={2} placeholder="Why is this purchase needed?" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30 resize-none" /></div>
        <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Attachments</label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-3 text-center hover:border-aims-navy/50 cursor-pointer transition-colors">
            <span className="material-symbols-outlined text-slate-400 text-[22px]">upload_file</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Click or drag files • PDF, DOCX, XLSX, images</p>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
        <button onClick={onSubmit} className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Save Draft</button>
        <button onClick={onSubmit} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">send</span>Push to ED</button>
      </div>
    </Modal>
  );
}

function PreparePayrollModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  return (
    <Modal title="Prepare Payroll Batch" subtitle="Finance prepares — ED authorizes before disbursement" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pay Period</label><input type="month" defaultValue="2026-08" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" /></div>
          <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Employees</label><input type="text" defaultValue="142 active staff" readOnly className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-500" /></div>
        </div>
        <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Estimated Total (UGX)</label><input type="number" defaultValue="186000000" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" /></div>
        <div className="p-3 bg-aims-orange/5 rounded-lg border border-aims-orange/20">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-aims-orange text-[16px] mt-0.5">info</span>
            <p className="text-[11px] text-slate-600">This batch will be routed to the <strong>ED for authorization</strong>. You can process disbursement only after ED approval.</p>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
        <button onClick={onSubmit} className="px-4 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90 flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">send</span>Submit to ED</button>
      </div>
    </Modal>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const location = useLocation(); 
  
  if (!user) return null;
  const role = user.role;

  const searchParams = new URLSearchParams(location.search);
  const view = searchParams.get('view');

  // 1. QUERY PARAM OVERRIDES (For sidebar links that want to show dashboard views)
  if (view === 'grants') return <GrantDashboard />;
  if (view === 'finance') return <FinanceDashboard />;
  if (view === 'innovations') return <InnovatorDashboard />;
  if (view === 'hr') return <HRDashboard />;
  if (view === 'inventory') return <InventoryDashboard />;

  // 2. DEFAULT ROLE-BASED ROUTING (Handles the base /dashboard route)
  if (role === 'CD') return <CDDashboard />;
  if (role === 'ED') return <EDDashboard />;
  if (role === 'COMPANY_ADMIN') return <AdminDashboard />;
  if (role === 'FINANCE') return <FinanceDashboard />;
  if (role === 'GRANT_WRITER' || role === 'GRANTS_MANAGER') return <GrantDashboard />;
  if (role === 'INNOVATOR') return <InnovatorDashboard />;
  if (role === 'SYS_ADMIN') return <SysAdminDashboard />;
  
  return <DefaultDashboard />;
}

function CDDashboard() {
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const handleAction = (msg: string) => showToast({ title: 'Action Logged', message: msg, type: 'success' });
  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="Country Director Dashboard" subtitle="Strategic oversight, governance & organizational leadership" />
      <CheckInCard />
      <SharedLibraryWidget />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Income (MTD)" value="UGX 1.2B" icon="trending_up" color="green" />
        <StatCard title="Total Expenditure (MTD)" value="UGX 850M" icon="trending_down" color="orange" />
        <StatCard title="Active Grants" value="10" icon="volunteer_activism" color="navy" />
        <StatCard title="Org Health" value="94%" icon="monitor_heart" color="mint" />
      </div>
      <Section title="Approvals in Progress" subtitle="Visibility into ED's review pipeline — read only">
        <AdvancedFilterBar dateLabel="Submitted" statusOptions={['ED Review', 'Awaiting Finance', 'Awaiting HR', 'Disbursed']} ownerOptions={['Finance Dept', 'HR Admin', 'Grants Team', 'Procurement']} showAmountRange presets={[{ id: 'p1', name: 'Over 3 days' }, { id: 'p2', name: 'High value (>10M)' }]} onExport={(fmt) => handleAction(`Exporting approvals ${fmt.toUpperCase()}`)} onSavePreset={(name) => handleAction(`Saved preset: ${name}`)} />
        <div className="space-y-2">
          {[
            { id: 'req-041', title: 'Q3 Field Equipment Procurement', type: 'Requisition', amount: 'UGX 12.4M', status: 'ED Review', daysInQueue: 2 },
            { id: 'pay-089', title: 'August Payroll Batch', type: 'Payslip Batch', amount: 'UGX 186M', status: 'ED Review', daysInQueue: 1 },
            { id: 'req-038', title: 'Community Workshop Venue Rental', type: 'Requisition', amount: 'UGX 3.2M', status: 'Awaiting Finance', daysInQueue: 4 },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div><p className="text-sm font-bold text-slate-900">{item.title}</p><p className="text-xs text-slate-500">{item.type} • {item.amount} • {item.id}</p></div>
              <div className="text-right">
                <span className={cn('inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide', item.daysInQueue >= 3 ? 'bg-aims-orange/15 text-aims-orange' : 'bg-aims-navy/10 text-aims-navy')}>{item.status}</span>
                <p className="text-[10px] text-slate-400 mt-1">{item.daysInQueue}d in queue</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Grant Portfolio" subtitle="Secured funding vs. pipeline opportunities">
          <div className="space-y-5"><Bar label="Secured Funding" value={850} max={1200} display="UGX 850M" color="navy" /><Bar label="Pipeline Opportunities" value={350} max={1200} display="UGX 350M" color="mint" /></div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between"><span className="text-sm font-semibold text-slate-600">Win Rate (YTD)</span><span className="text-xl font-extrabold text-aims-green">68%</span></div>
        </Section>
        <Section title="Financial Health" subtitle="Consolidated income vs. expenditure">
          <div className="space-y-5"><Bar label="Total Income" value={1200} max={1400} display="UGX 1.2B" color="green" /><Bar label="Total Expenditure" value={850} max={1400} display="UGX 850M" color="orange" /></div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between"><span className="text-sm font-semibold text-slate-600">Net Surplus</span><span className="text-xl font-extrabold text-aims-green">UGX 350M</span></div>
        </Section>
      </div>
      <Section title="HR & Admin Summary" subtitle="Workforce indicators — no individual record access">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100"><p className="text-xs text-slate-500 mb-1">Total Headcount</p><p className="text-2xl font-extrabold text-slate-900">142</p></div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100"><p className="text-xs text-slate-500 mb-1">Contracts Renewing (30d)</p><p className="text-2xl font-extrabold text-aims-orange">5</p></div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100"><p className="text-xs text-slate-500 mb-1">Appraisals Completed (Q2)</p><p className="text-2xl font-extrabold text-aims-green">87%</p></div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100"><p className="text-xs text-slate-500 mb-1">Present Today</p><p className="text-2xl font-extrabold text-aims-navy">128</p></div>
        </div>
      </Section>
      <Section title="Innovations & Tasks" subtitle="View-only access to innovation pipeline">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-slate-200"><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Project</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Stage</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Lead</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Progress</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { id: 'inv-001', title: 'Solar-Powered Grain Dryer', stage: 'Prototype', lead: 'Pius Odong', progress: 62 },
                { id: 'inv-002', title: 'Community Land Mapping Drone', stage: 'Testing', lead: 'Florence Adong', progress: 78 },
                { id: 'inv-003', title: 'Mobile USSD Farmer Advisory', stage: 'Concept', lead: 'Pius Odong', progress: 35 },
                { id: 'inv-004', title: 'Biogas Digester Pilot', stage: 'Research', lead: 'Florence Adong', progress: 15 },
                { id: 'inv-005', title: 'Post-Harvest Loss Tracker App', stage: 'Production', lead: 'Pius Odong', progress: 91 },
                { id: 'inv-006', title: 'Soil Moisture IoT Sensor', stage: 'Deployed', lead: 'Florence Adong', progress: 100 },
              ].map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 font-bold text-slate-900">{p.title}</td>
                  <td className="py-2.5"><span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-aims-navy/10 text-aims-navy">{p.stage}</span></td>
                  <td className="py-2.5 text-slate-600">{p.lead}</td>
                  <td className="py-2.5"><div className="flex items-center gap-2"><div className="w-16 bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-aims-green" style={{ width: `${p.progress}%` }} /></div><span className="text-xs font-bold text-slate-900">{p.progress}%</span></div></td>
                  <td className="py-2.5 text-right"><button onClick={() => navigate(`/innovations/${p.id}`)} className="text-xs font-bold text-aims-navy hover:underline flex items-center gap-1 justify-end"><span className="material-symbols-outlined text-[14px]">open_in_new</span>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="Executive Feed" subtitle="Institutional announcements & governance communication">
        <div className="space-y-3">
          {[
            { author: 'Board Secretariat', time: '2h ago', content: 'Q2 Board Meeting minutes approved and filed. Next session scheduled for September 15.' },
            { author: 'Executive Director', time: '5h ago', content: 'All department heads have submitted Q3 budget proposals. Consolidated review underway.' },
            { author: 'Grants Manager', time: '1d ago', content: 'Climate-Smart Farming grant proposal submitted to USAID. Decision expected within 30 days.' },
          ].map((post, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100"><div className="flex items-center justify-between mb-1"><p className="text-sm font-bold text-slate-900">{post.author}</p><p className="text-[10px] text-slate-400">{post.time}</p></div><p className="text-sm text-slate-600">{post.content}</p></div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function EDDashboard() {
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const handleAction = (msg: string) => showToast({ title: 'Action Logged', message: msg, type: 'success' });
  const [expandedApproval, setExpandedApproval] = useState<string | null>(null);
  const [expandedGrant, setExpandedGrant] = useState<string | null>(null);
  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="Executive Director Dashboard" subtitle="Operational execution, team leadership & daily management" />
      <CheckInCard />

      <Section title="Grant Approvals & Deadlines" subtitle="Grants reviewed by Team Lead — awaiting your final approval before external submission">
        <AdvancedFilterBar dateLabel="Deadline" statusOptions={['Awaiting Your Review', 'You Approved', 'Submitted', 'You Returned to TL', 'You Rejected']} ownerOptions={['Sarah Aciro', 'Janet Apio', 'Grants Team']} showAmountRange presets={[{ id: 'gd1', name: 'Due within 7 days' }, { id: 'gd2', name: 'Awaiting my review' }]} onExport={(fmt) => handleAction(`Exporting grants ${fmt.toUpperCase()}`)} onSavePreset={(name) => handleAction(`Saved preset: ${name}`)} />
        <div className="space-y-3">
          {[
            { id: 'g3', title: 'Community Land Rights Documentation', uniqueId: 'GRANT-LAND-2026-001', funder: 'USAID', amount: 'UGX 450M', status: 'Awaiting Your Review', tlName: 'Sarah Aciro', tlDate: 'Aug 20', tlComment: 'Budget aligned with RFP requirements. Recommend approval.', deadline: 'Aug 29', days: 7 },
            { id: 'g1', title: 'Climate-Smart Farming Initiative', uniqueId: 'GRANT-AGRIC-2026-001', funder: 'EU Delegation', amount: 'UGX 820M', status: 'Awaiting Your Review', tlName: 'Sarah Aciro', tlDate: 'Aug 19', tlComment: 'Technical proposal strengthened. M&E framework complete.', deadline: 'Sep 6', days: 15 },
            { id: 'g5', title: 'Youth Digital Literacy Program', uniqueId: 'GRANT-EDU-2026-003', funder: 'Mastercard Foundation', amount: 'UGX 310M', status: 'You Returned to TL', tlName: 'Janet Apio', tlDate: 'Aug 18', tlComment: 'Initial draft submitted.', deadline: 'Sep 19', days: 28, edReturnComment: 'Budget narrative too vague on sustainability plan.', edReturnDate: 'Aug 19' },
          ].map((g) => (
            <div key={g.id} className={cn('rounded-lg border transition-all', expandedGrant === g.id ? 'border-aims-navy shadow-md bg-white' : 'border-slate-200 bg-slate-50')}>
              <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpandedGrant(expandedGrant === g.id ? null : g.id)}>
                <div className="flex items-center gap-3"><span className="material-symbols-outlined text-slate-400 text-[18px]">{expandedGrant === g.id ? 'expand_less' : 'expand_more'}</span><div><p className="text-sm font-bold text-slate-900">{g.title}</p><p className="text-xs text-slate-500">{g.uniqueId} • {g.funder} • {g.amount}</p></div></div>
                <div className="text-right flex items-center gap-3"><span className={cn('inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide', g.status.includes('Awaiting Your') ? 'bg-aims-orange/15 text-aims-orange' : g.status.includes('You Returned') ? 'bg-red-50 text-red-500' : 'bg-aims-navy/10 text-aims-navy')}>{g.status}</span><span className={cn('text-xs font-extrabold', g.days <= 7 ? 'text-aims-orange' : 'text-slate-600')}>{g.days}d</span></div>
              </div>
              {expandedGrant === g.id && (
                <div className="px-3 pb-3 space-y-3">
                  <div className="bg-aims-navy/5 rounded-lg p-3 border border-aims-navy/10"><div className="flex items-center gap-2 mb-1"><span className="material-symbols-outlined text-aims-navy text-[16px]">verified_user</span><p className="text-xs font-bold text-aims-navy">Team Lead Review — {g.tlName} ({g.tlDate})</p></div><p className="text-xs text-slate-700 italic">"{g.tlComment}"</p></div>
                  {g.edReturnComment && <div className="bg-red-50 rounded-lg p-3 border border-red-100"><div className="flex items-center gap-2 mb-1"><span className="material-symbols-outlined text-red-500 text-[16px]">assignment_return</span><p className="text-xs font-bold text-red-600">You Returned This ({g.edReturnDate})</p></div><p className="text-xs text-slate-700 italic">"{g.edReturnComment}"</p></div>}
                  <div className="flex items-center gap-2 text-xs"><span className="material-symbols-outlined text-[16px] text-slate-400">event</span><span className="text-slate-600">Funder deadline: <strong className={cn(g.days <= 7 ? 'text-aims-orange' : 'text-slate-900')}>{g.deadline}</strong> ({g.days} days remaining)</span></div>
                  {g.status.includes('Awaiting Your') && <ApprovalActionPanel itemName={g.title} itemType="Grant Proposal" onViewFull={() => handleAction(`Opened full grant proposal for ${g.uniqueId}`)} onApprove={(c) => handleAction(`YOU APPROVED GRANT ${g.uniqueId}: ${c}`)} onReject={(c) => handleAction(`YOU RETURNED GRANT ${g.uniqueId} to TL: ${c}`)} />}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Your Pending Approvals" subtitle="Requisitions and payslips awaiting your decision — you are the sole approval authority">
        <AdvancedFilterBar dateLabel="Submitted" statusOptions={['Awaiting Your Decision', 'Overdue', 'You Approved', 'You Rejected', 'Disbursed']} ownerOptions={['Finance Dept', 'HR Admin', 'Grants Team', 'Procurement', 'Innovation']} showAmountRange presets={[{ id: 'aq1', name: 'My overdue items' }, { id: 'aq2', name: 'Payslips only' }, { id: 'aq3', name: 'High value (>10M)' }]} onExport={(fmt) => handleAction(`Exporting approvals ${fmt.toUpperCase()}`)} onSavePreset={(name) => handleAction(`Saved preset: ${name}`)} />
        <div className="space-y-3">
          {[
            { id: 'req-041', title: 'Q3 Field Equipment Procurement', type: 'Requisition', amount: 'UGX 12.4M', submittedBy: 'Finance Dept', submittedDate: 'Aug 18', days: 4, description: 'Field tablets (10x), GPS units (5x), solar chargers (10x) for land documentation fieldwork.', lineItems: [{ item: 'Samsung Galaxy Tab A9', qty: 10, unit: 'UGX 680K', total: 'UGX 6.8M' }, { item: 'Garmin GPSMAP 67i', qty: 5, unit: 'UGX 820K', total: 'UGX 4.1M' }, { item: 'Anker Solar Charger 24W', qty: 10, unit: 'UGX 150K', total: 'UGX 1.5M' }] },
            { id: 'pay-089', title: 'August Payroll Batch', type: 'Payslip Batch', amount: 'UGX 186M', submittedBy: 'HR Admin', submittedDate: 'Aug 19', days: 3, description: 'Monthly payroll for 142 employees.', lineItems: [{ item: 'Base Salaries', qty: 142, unit: '—', total: 'UGX 168M' }, { item: 'Transport Allowances', qty: 142, unit: '—', total: 'UGX 14.2M' }, { item: 'NSSF Contributions', qty: 142, unit: '—', total: 'UGX 3.8M' }] },
            { id: 'req-042', title: 'Community Workshop Materials', type: 'Requisition', amount: 'UGX 4.8M', submittedBy: 'Grants Team', submittedDate: 'Aug 20', days: 2, description: 'Printing, stationery, and venue setup for 3-day workshop.', lineItems: [{ item: 'Workshop Printing', qty: 1, unit: '—', total: 'UGX 2.1M' }, { item: 'Venue Setup & Catering', qty: 3, unit: 'UGX 900K', total: 'UGX 2.7M' }] },
            { id: 'req-038', title: 'Venue Rental — Land Rights Workshop', type: 'Requisition', amount: 'UGX 3.2M', submittedBy: 'Grants Team', submittedDate: 'Aug 15', days: 7, description: 'Gulu Conference Centre rental for 5 days.', lineItems: [{ item: 'Hall Rental (5 days)', qty: 5, unit: 'UGX 500K', total: 'UGX 2.5M' }, { item: 'AV Equipment Package', qty: 1, unit: '—', total: 'UGX 700K' }] },
            { id: 'pay-090', title: 'Contractor Payment — Pius Odong', type: 'Payslip', amount: 'UGX 1.5M', submittedBy: 'HR Admin', submittedDate: 'Aug 21', days: 1, description: 'Monthly contractor payment for innovation prototyping.', lineItems: [{ item: 'Prototyping Services', qty: 1, unit: '—', total: 'UGX 1.5M' }] },
          ].map((item) => (
            <div key={item.id} className={cn('rounded-lg border transition-all', expandedApproval === item.id ? 'border-aims-navy shadow-md bg-white' : 'border-slate-200 bg-slate-50')}>
              <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpandedApproval(expandedApproval === item.id ? null : item.id)}>
                <div className="flex items-center gap-3"><span className="material-symbols-outlined text-slate-400 text-[18px]">{expandedApproval === item.id ? 'expand_less' : 'expand_more'}</span><div><p className="text-sm font-bold text-slate-900">{item.title}</p><p className="text-xs text-slate-500">{item.type} • {item.amount} • {item.id} • {item.submittedBy}</p></div></div>
                <div className="text-right flex items-center gap-3"><span className={cn('inline-block px-2 py-0.5 rounded text-[10px] font-bold', item.days >= 5 ? 'bg-red-50 text-red-600' : item.days >= 3 ? 'bg-aims-orange/15 text-aims-orange' : 'bg-slate-100 text-slate-600')}>{item.days}d</span><span className="text-xs font-bold text-aims-navy">{expandedApproval === item.id ? 'Close' : 'Review'}</span></div>
              </div>
              {expandedApproval === item.id && (
                <div className="px-3 pb-3 space-y-3">
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</p><p className="text-xs text-slate-700 mb-3">{item.description}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Line Items</p>
                    <table className="w-full text-xs"><thead><tr className="border-b border-slate-200"><th className="pb-1 text-left text-slate-500">Item</th><th className="pb-1 text-right text-slate-500">Qty</th><th className="pb-1 text-right text-slate-500">Unit</th><th className="pb-1 text-right text-slate-500">Total</th></tr></thead><tbody className="divide-y divide-slate-100">{item.lineItems.map((li, idx) => <tr key={idx}><td className="py-1 text-slate-700">{li.item}</td><td className="py-1 text-right text-slate-600">{li.qty}</td><td className="py-1 text-right text-slate-600">{li.unit}</td><td className="py-1 text-right font-semibold text-slate-900">{li.total}</td></tr>)}</tbody></table>
                  </div>
                  <ApprovalActionPanel itemName={item.title} itemType={item.type} onViewFull={() => handleAction(`Opened full ${item.type.toLowerCase()} record for ${item.id}`)} onApprove={(c) => handleAction(`YOU APPROVED ${item.id}: ${c}`)} onReject={(c) => handleAction(`YOU REJECTED ${item.id}: ${c}`)} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Payslip Authorization" subtitle="Generate, review, and authorize payroll batches"><PayslipReviewPanel /></Section>
      <Section title="Monthly Cash Flow" subtitle="Income vs. expenditure with pending requisitions">
        <div className="space-y-5"><Bar label="Total Income" value={1200} max={1400} display="UGX 1.2B" color="green" /><Bar label="Total Expenditure" value={850} max={1400} display="UGX 850M" color="orange" /></div>
        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center"><div><span className="text-sm font-semibold text-slate-600">Net Surplus</span><p className="text-[10px] text-slate-400">Pending requisitions: UGX 20.4M</p></div><span className="text-xl font-extrabold text-aims-green">UGX 350M</span></div>
      </Section>

      <Section title="Attendance Oversight" subtitle="Real-time presence and historical records">
        <AdvancedFilterBar dateLabel="Date" statusOptions={['Present', 'Late', 'Absent', 'Leave', 'Remote']} ownerOptions={['Grants', 'Finance', 'HR', 'Innovation', 'Research', 'Procurement']} presets={[{ id: 'att1', name: 'Unexpected absences' }, { id: 'att2', name: 'Late arrivals this week' }]} onExport={(fmt) => handleAction(`Exporting attendance ${fmt.toUpperCase()}`)} onSavePreset={(name) => handleAction(`Saved preset: ${name}`)} />
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-aims-green/10 rounded-lg border border-aims-green/20"><span className="material-symbols-outlined text-aims-green text-[18px]">check_circle</span><span className="text-sm font-bold text-aims-green">128 Present</span></div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-aims-orange/10 rounded-lg border border-aims-orange/20"><span className="material-symbols-outlined text-aims-orange text-[18px]">schedule</span><span className="text-sm font-bold text-aims-orange">9 Late</span></div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-100"><span className="material-symbols-outlined text-red-500 text-[18px]">cancel</span><span className="text-sm font-bold text-red-500">5 Absent</span></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200"><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Employee</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Department</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Check In</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Check Out</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Status</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Location</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {[{ name: 'Sarah Aciro', dept: 'Grants', checkIn: '07:58', checkOut: '—', status: 'present' as const, location: 'Onsite' },{ name: 'Janet Apio', dept: 'Grants', checkIn: '08:32', checkOut: '—', status: 'late' as const, location: 'Onsite' },{ name: 'Pius Odong', dept: 'Innovation', checkIn: '07:45', checkOut: '—', status: 'present' as const, location: 'Remote' },{ name: 'David Okello', dept: 'Finance', checkIn: '—', checkOut: '—', status: 'absent' as const, location: '—' },{ name: 'Grace Nakamya', dept: 'HR', checkIn: '07:50', checkOut: '—', status: 'present' as const, location: 'Onsite' },{ name: 'Isaac Tumusiime', dept: 'Procurement', checkIn: '08:15', checkOut: '—', status: 'late' as const, location: 'Onsite' },{ name: 'Florence Adong', dept: 'Research', checkIn: '07:55', checkOut: '—', status: 'present' as const, location: 'Onsite' }].map((emp, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors"><td className="py-2.5 font-bold text-slate-900">{emp.name}</td><td className="py-2.5 text-slate-600">{emp.dept}</td><td className="py-2.5 text-slate-600 font-mono text-xs">{emp.checkIn}</td><td className="py-2.5 text-slate-600 font-mono text-xs">{emp.checkOut}</td><td className="py-2.5"><span className={cn('inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide', emp.status === 'present' ? 'bg-aims-green/15 text-aims-green' : emp.status === 'late' ? 'bg-aims-orange/15 text-aims-orange' : 'bg-red-50 text-red-500')}>{emp.status}</span></td><td className="py-2.5 text-slate-500 text-xs">{emp.location}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Innovation Pipeline Flags" subtitle="Projects requiring your attention — flagged by CD or stalled in stage">
        <div className="space-y-3">
          {[
            { id: 'inv-003', title: 'Mobile USSD Farmer Advisory', stage: 'Concept', lead: 'Pius Odong', daysInStage: 18, flagFrom: 'Dr. Sarah Namukasa', flagType: 'concern', flagComment: 'Timeline overlaps with harvest season. Confirm farmer availability.', flagDate: 'Aug 15' },
            { id: 'inv-005', title: 'Post-Harvest Loss Tracker App', stage: 'Production', lead: 'Pius Odong', daysInStage: 22, flagFrom: null, flagType: null, flagComment: null, flagDate: null },
            { id: 'inv-008', title: 'Weather Station Network', stage: 'Research', lead: 'Isaac Tumusiime', daysInStage: 12, flagFrom: 'Dr. Sarah Namukasa', flagType: 'review', flagComment: 'Budget allocation unclear for sensor procurement phase.', flagDate: 'Aug 18' },
          ].map((p) => (
            <div key={p.id} className={cn('rounded-lg border p-4', p.flagFrom ? 'bg-aims-orange/5 border-aims-orange/20' : 'bg-red-50/50 border-red-200')}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">{p.title}</p>
                  <p className="text-xs text-slate-500">{p.stage} • Lead: {p.lead} • <span className={cn('font-bold', p.daysInStage > 14 ? 'text-red-500' : p.daysInStage >= 7 ? 'text-aims-orange' : 'text-slate-600')}>{p.daysInStage}d in stage</span></p>
                </div>
                <button onClick={() => navigate(`/innovations/${p.id}`)} className="text-xs font-bold text-aims-navy hover:underline flex items-center gap-1 flex-shrink-0"><span className="material-symbols-outlined text-[14px]">open_in_new</span>Open</button>
              </div>
              {p.flagFrom && (
                <div className="bg-white rounded p-2.5 border border-aims-orange/10 mt-2">
                  <div className="flex items-center gap-1.5 mb-1"><span className="material-symbols-outlined text-aims-orange text-[14px]">flag</span><span className="text-[10px] font-bold text-aims-orange uppercase tracking-wide">{p.flagType} Flag from {p.flagFrom} ({p.flagDate})</span></div>
                  <p className="text-xs text-slate-700 italic">"{p.flagComment}"</p>
                </div>
              )}
              {!p.flagFrom && (
                <div className="flex items-center gap-1.5 mt-2"><span className="material-symbols-outlined text-red-500 text-[14px]">warning</span><span className="text-xs font-bold text-red-500">Stalled: No activity for {p.daysInStage} days — may need intervention</span></div>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Documents & Shared Library" subtitle="Access organizational documents, policies, and shared resources">
        <SharedLibraryWidget />
        <div className="mt-4 pt-4 border-t border-slate-100">
          <button onClick={() => navigate('/documents')} className="w-full py-2.5 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 transition-colors flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">folder_open</span>Open Full Documents Hub
          </button>
        </div>
      </Section>

      <Section title="Company Feed" subtitle="Post institutional updates across departments">
        <div className="space-y-3">
          <div className="flex gap-2 mb-2"><input type="text" placeholder="Share an update with all departments…" className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30" /><button onClick={() => handleAction('Update posted to company feed')} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 transition-colors">Post</button></div>
          {[{ author: 'Executive Director', time: '1h ago', content: 'Reminder: All department Q3 budget revisions due by Friday COB.' },{ author: 'HR Admin', time: '3h ago', content: 'New leave policy updated in Documents hub. Please review.' },{ author: 'Grants Manager', time: '6h ago', content: 'USAID submission confirmed. Tracking number: AID-2026-UG-0441.' }].map((post, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100"><div className="flex items-center justify-between mb-1"><p className="text-sm font-bold text-slate-900">{post.author}</p><p className="text-[10px] text-slate-400">{post.time}</p></div><p className="text-sm text-slate-600">{post.content}</p></div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function AdminDashboard() {
  return (<div className="space-y-6"><DashHeader gradient="bg-grad-navy" title="Operations & HR Hub" subtitle="Workforce administration and resource oversight" /><CheckInCard /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"><StatCard title="Active Staff" value="142" icon="people" color="navy" /><StatCard title="Present Today" value="128" icon="check_circle" color="green" /><StatCard title="Pending Payslips" value="15" icon="payments" color="orange" /><StatCard title="Expiring Contracts" value="3" icon="description" color="mint" /></div><SharedLibraryWidget /></div>);
}

function FinanceDashboard() {
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const [showNewReq, setShowNewReq] = useState(false);
  const [showPayroll, setShowPayroll] = useState(false);
  const [expandedApproval, setExpandedApproval] = useState<string | null>(null);
  const [edSearch, setEdSearch] = useState('');
  const [edDept, setEdDept] = useState('');

  const edApprovals = [
    { id: 'req-035', title: 'August Payroll Batch', dept: 'Finance', amount: 186000000, approvedBy: 'Nassir Mukiibi (ED)', approvedDate: 'Aug 25', daysSince: 1, comment: 'Approved. Finance to process disbursement.', lineItems: [{ item: 'Base Salaries', qty: 142, total: 'UGX 168M' }, { item: 'Allowances', qty: 142, total: 'UGX 18M' }] },
    { id: 'req-041', title: 'Q3 Field Equipment Procurement', dept: 'Grants', amount: 12400000, approvedBy: 'Nassir Mukiibi (ED)', approvedDate: 'Aug 24', daysSince: 2, comment: 'Approved. Verify vendor invoice matches PO.', lineItems: [{ item: 'Samsung Galaxy Tab A9', qty: 10, total: 'UGX 6.8M' }, { item: 'GPS Units', qty: 5, total: 'UGX 4.1M' }, { item: 'Solar Chargers', qty: 10, total: 'UGX 1.5M' }] },
    { id: 'req-045', title: 'Solar Irrigation Sensor Kits', dept: 'Innovation', amount: 11500000, approvedBy: 'Nassir Mukiibi (ED)', approvedDate: 'Aug 26', daysSince: 0, comment: 'Approved. Confirm AgroTech quote is current.', lineItems: [{ item: 'Soil Moisture Sensors', qty: 50, total: 'UGX 6.0M' }, { item: 'Flow Meters', qty: 20, total: 'UGX 4.4M' }] },
  ];

  const filteredEdApprovals = edApprovals.filter((a) => {
    if (edDept && a.dept !== edDept) return false;
    if (edSearch.trim()) {
      const q = edSearch.toLowerCase();
      if (!a.title.toLowerCase().includes(q) && !a.id.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const awaitingED = [
    { id: 'req-043', title: 'Land Rights Field Tablets', days: 2 },
    { id: 'req-044', title: 'Community Sensitization Materials', days: 4 },
  ];
  const returnedToMe = [
    { id: 'req-039', title: 'Q2 Training Materials', days: 3 },
    { id: 'req-040', title: 'Workshop Venue Deposit', days: 1 },
  ];
  const budgetAlerts = [
    { dept: 'Innovation', pct: 92 },
    { dept: 'Procurement', pct: 96 },
    { dept: 'Grants', pct: 69 },
    { dept: 'HR', pct: 65 },
  ];

  const fmtMoney = (n: number) => {
    if (n >= 1000000000) return `UGX ${(n / 1000000000).toFixed(1)}B`;
    if (n >= 1000000) return `UGX ${(n / 1000000).toFixed(0)}M`;
    return `UGX ${(n / 1000).toFixed(0)}K`;
  };
  const getBudgetColor = (pct: number) => pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-aims-orange' : 'bg-aims-green';
  const getBudgetBadge = (pct: number) => pct >= 90 ? 'text-red-600 bg-red-50 border-red-200' : pct >= 75 ? 'text-aims-orange bg-aims-orange/10 border-aims-orange/20' : 'text-aims-green bg-aims-green/10 border-aims-green/20';
  const getAging = (days: number) => days >= 3 ? 'bg-red-50 text-red-600' : 'bg-aims-orange/15 text-aims-orange';
  const handleDisburse = (id: string) => {
    showToast({ title: 'Disbursement Processed', message: `${id} disbursed. Ref: DISB-2026-${Math.floor(Math.random() * 900 + 100)}`, type: 'success' });
  };

  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="Finance Command Center" subtitle="Disbursements, requisitions, cash flow & budget health" />
      <CheckInCard />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-orange p-4 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Requisitions</p><p className="text-2xl font-extrabold text-slate-900 mt-1">{awaitingED.length + returnedToMe.length}</p><p className="text-[10px] text-slate-400 mt-0.5">{returnedToMe.length} need your revision</p></div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-green p-4 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Disbursed This Month</p><p className="text-2xl font-extrabold text-slate-900 mt-1">UGX 285M</p><p className="text-[10px] text-slate-400 mt-0.5">across 38 transactions</p></div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-navy p-4 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Budget Utilization</p><p className="text-2xl font-extrabold text-aims-orange mt-1">78%</p><p className="text-[10px] text-red-500 mt-0.5">2 depts over 90%</p></div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-mint p-4 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cash Position</p><p className="text-2xl font-extrabold text-slate-900 mt-1">UGX 350M</p><p className="text-[10px] text-aims-green mt-0.5">▲ 8% vs. last month</p></div>
      </div>
      <Section title="Approvals from ED — Ready to Disburse" subtitle="ED has approved these. You process the disbursement.">
        <div className="flex flex-wrap gap-2 items-end mb-3">
          <div className="flex-1 min-w-[180px]"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search</label><input type="text" value={edSearch} onChange={(e) => setEdSearch(e.target.value)} placeholder="Title or requisition ID…" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" /></div>
          <div className="min-w-[140px]"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label><select value={edDept} onChange={(e) => setEdDept(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30"><option value="">All depts</option><option>Finance</option><option>Grants</option><option>Innovation</option><option>HR</option></select></div>
        </div>
        <div className="space-y-2">
          {filteredEdApprovals.length === 0 && <p className="text-xs text-slate-400 italic text-center py-6">No ED-approved requisitions match your filters.</p>}
          {filteredEdApprovals.map((a) => {
            const isExp = expandedApproval === a.id;
            return (
              <div key={a.id} className={cn('rounded-lg border transition-all', isExp ? 'border-aims-navy shadow-md bg-white' : 'border-slate-200 bg-slate-50')}>
                <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpandedApproval(isExp ? null : a.id)}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">{isExp ? 'expand_less' : 'expand_more'}</span>
                    <span className="material-symbols-outlined text-aims-green text-[20px]">verified_user</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap"><span className="text-[10px] font-bold text-slate-400 font-mono">{a.id}</span><span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-aims-green/15 text-aims-green">ED Approved</span><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{a.dept}</span></div>
                      <p className="text-sm font-bold text-slate-900 truncate">{a.title}</p>
                      <p className="text-[10px] text-slate-500 truncate">Approved by {a.approvedBy} • {a.approvedDate}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3"><p className="text-sm font-extrabold text-slate-900">{fmtMoney(a.amount)}</p><span className={cn('text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block', getAging(a.daysSince))}>{a.daysSince}d since approval</span></div>
                </div>
                {isExp && (
                  <div className="px-3 pb-3 border-t border-slate-100 pt-3 space-y-3">
                    <div className="p-3 bg-aims-green/5 rounded-lg border border-aims-green/20"><p className="text-[10px] font-bold text-aims-green uppercase tracking-wider mb-1">ED Decision</p><p className="text-xs text-slate-700 italic">"{a.comment}"</p></div>
                    <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden"><thead className="bg-slate-50"><tr><th className="px-3 py-1.5 text-left text-slate-500 font-bold">Item</th><th className="px-3 py-1.5 text-right text-slate-500 font-bold">Qty</th><th className="px-3 py-1.5 text-right text-slate-500 font-bold">Total</th></tr></thead><tbody className="divide-y divide-slate-100">{a.lineItems.map((li, i) => <tr key={i}><td className="px-3 py-1.5 text-slate-700">{li.item}</td><td className="px-3 py-1.5 text-right text-slate-600">{li.qty}</td><td className="px-3 py-1.5 text-right font-semibold text-slate-900">{li.total}</td></tr>)}</tbody></table>
                    <div className="flex justify-end gap-2 pt-1">
                      <button onClick={() => showToast({ title: 'Viewing record', message: a.id, type: 'info' })} className="px-3 py-1.5 text-xs font-bold text-aims-navy border border-aims-navy/20 rounded-lg hover:bg-aims-navy/5 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">visibility</span>View Details</button>
                      <button onClick={() => handleDisburse(a.id)} className="px-3 py-1.5 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">payments</span>Process Disbursement</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>
      <Section title="Quick Actions" subtitle="Start a workflow">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button onClick={() => setShowNewReq(true)} className="p-4 bg-aims-navy/5 hover:bg-aims-navy/10 rounded-xl border border-aims-navy/20 transition-colors text-left"><span className="material-symbols-outlined text-aims-navy text-[24px] mb-2">request_quote</span><p className="text-sm font-bold text-slate-900">New Requisition</p><p className="text-[10px] text-slate-500 mt-0.5">Draft & push to ED</p></button>
          <button onClick={() => setShowPayroll(true)} className="p-4 bg-aims-green/5 hover:bg-aims-green/10 rounded-xl border border-aims-green/20 transition-colors text-left"><span className="material-symbols-outlined text-aims-green text-[24px] mb-2">payments</span><p className="text-sm font-bold text-slate-900">Prepare Payroll</p><p className="text-[10px] text-slate-500 mt-0.5">Generate batch → ED</p></button>
          <button onClick={() => navigate('/finance')} className="p-4 bg-aims-orange/5 hover:bg-aims-orange/10 rounded-xl border border-aims-orange/20 transition-colors text-left"><span className="material-symbols-outlined text-aims-orange text-[24px] mb-2">analytics</span><p className="text-sm font-bold text-slate-900">Cash Flow & Reports</p><p className="text-[10px] text-slate-500 mt-0.5">Analytics + CSV/PDF</p></button>
          <button onClick={() => navigate('/procurement')} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors text-left"><span className="material-symbols-outlined text-slate-600 text-[24px] mb-2">local_shipping</span><p className="text-sm font-bold text-slate-900">Vendors & POs</p><p className="text-[10px] text-slate-500 mt-0.5">Manage suppliers</p></button>
        </div>
      </Section>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="At a Glance" subtitle="Items needing your attention">
          <div className="space-y-3">
            <div className="p-3 bg-aims-navy/5 rounded-lg border border-aims-navy/20">
              <div className="flex items-center justify-between mb-1.5"><p className="text-xs font-bold text-slate-900 flex items-center gap-1.5"><span className="material-symbols-outlined text-aims-navy text-[16px]">hourglass_top</span>Awaiting ED decision</p><span className="text-[10px] font-extrabold text-aims-navy">{awaitingED.length}</span></div>
              {awaitingED.map((r) => (<div key={r.id} className="flex items-center justify-between text-[11px] py-0.5"><span className="text-slate-600 truncate max-w-[180px]">{r.title}</span><span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold', getAging(r.days))}>{r.days}d</span></div>))}
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center justify-between mb-1.5"><p className="text-xs font-bold text-slate-900 flex items-center gap-1.5"><span className="material-symbols-outlined text-red-500 text-[16px]">assignment_return</span>Returned — needs revision</p><span className="text-[10px] font-extrabold text-red-600">{returnedToMe.length}</span></div>
              {returnedToMe.map((r) => (<div key={r.id} className="flex items-center justify-between text-[11px] py-0.5"><span className="text-slate-600 truncate max-w-[180px]">{r.title}</span><span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-600">{r.days}d</span></div>))}
              <button onClick={() => navigate('/approvals')} className="mt-2 text-[11px] font-bold text-red-600 hover:underline flex items-center gap-0.5">Revise now <span className="material-symbols-outlined text-[12px]">arrow_forward</span></button>
            </div>
          </div>
        </Section>
        <Section title="Budget Alerts" subtitle="Utilization trending over threshold">
          <div className="space-y-3">
            {budgetAlerts.map((b) => (
              <div key={b.dept}>
                <div className="flex items-center justify-between mb-1"><span className="text-xs font-bold text-slate-900">{b.dept}</span><span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border', getBudgetBadge(b.pct))}>{b.pct}%</span></div>
                <div className="w-full bg-slate-100 rounded-full h-2"><div className={cn('h-2 rounded-full', getBudgetColor(b.pct))} style={{ width: `${Math.min(100, b.pct)}%` }} /></div>
              </div>
            ))}
            <button onClick={() => navigate('/finance')} className="w-full mt-1 text-[11px] font-bold text-aims-navy border border-aims-navy/20 rounded-lg py-1.5 hover:bg-aims-navy/5 flex items-center justify-center gap-0.5">Open Cash Flow Analytics <span className="material-symbols-outlined text-[12px]">arrow_forward</span></button>
          </div>
        </Section>
      </div>
      {showNewReq && <NewRequisitionModal onClose={() => setShowNewReq(false)} onSubmit={() => { setShowNewReq(false); showToast({ title: 'Requisition submitted', message: 'Pushed to ED for approval.', type: 'success' }); }} />}
      {showPayroll && <PreparePayrollModal onClose={() => setShowPayroll(false)} onSubmit={() => { setShowPayroll(false); showToast({ title: 'Payroll batch submitted', message: 'Routed to ED for authorization.', type: 'success' }); }} />}
    </div>
  );
}

function GrantDashboard() {
  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="Grants & Proposals" subtitle="AI-assisted drafting & deadline tracking" />
      <CheckInCard />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Active Grants" value="4" icon="edit_note" color="navy" />
        <StatCard title="Deadlines < 30d" value="2" icon="event_busy" color="orange" />
        <StatCard title="Awarded (YTD)" value="UGX 890M" icon="workspace_premium" color="green" />
        <StatCard title="AI Assists" value="28" icon="smart_toy" color="mint" />
      </div>
      <SharedLibraryWidget />
      <Section title="Grants Pipeline" subtitle="Full organizational pipeline — open any grant to work on it">
        <GrantsPipelineBoard />
      </Section>
    </div>
  );
}

function InnovatorDashboard() {
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const handleAction = (msg: string) => showToast({ title: 'Action Logged', message: msg, type: 'success' });
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const STAGES = [
    { key: 'research', label: 'Research', color: 'mint' as ColorKey },
    { key: 'concept', label: 'Concept', color: 'orange' as ColorKey },
    { key: 'prototype', label: 'Prototype', color: 'navy' as ColorKey },
    { key: 'testing', label: 'Testing', color: 'mint' as ColorKey },
    { key: 'production', label: 'Production', color: 'green' as ColorKey },
    { key: 'deployed', label: 'Deployed', color: 'navy' as ColorKey },
  ];
  const projects = [
    { id: 'inv-001', title: 'Solar-Powered Grain Dryer', stage: 'prototype', lead: 'Pius Odong', contributors: ['Florence Adong', 'Isaac Tumusiime'], progress: 62, daysInStage: 9, milestoneCount: 5, milestoneDone: 3 },
    { id: 'inv-002', title: 'Community Land Mapping Drone', stage: 'testing', lead: 'Florence Adong', contributors: ['Pius Odong'], progress: 78, daysInStage: 4, milestoneCount: 4, milestoneDone: 3 },
    { id: 'inv-003', title: 'Mobile USSD Farmer Advisory', stage: 'concept', lead: 'Pius Odong', contributors: ['Janet Apio', 'Grace Nakamya', 'David Okello'], progress: 35, daysInStage: 18, milestoneCount: 6, milestoneDone: 2 },
    { id: 'inv-004', title: 'Biogas Digester Pilot', stage: 'research', lead: 'Florence Adong', contributors: ['Pius Odong'], progress: 15, daysInStage: 3, milestoneCount: 3, milestoneDone: 0 },
    { id: 'inv-005', title: 'Post-Harvest Loss Tracker App', stage: 'production', lead: 'Pius Odong', contributors: ['Florence Adong', 'Isaac Tumusiime', 'Grace Nakamya'], progress: 91, daysInStage: 22, milestoneCount: 8, milestoneDone: 7 },
    { id: 'inv-006', title: 'Soil Moisture IoT Sensor', stage: 'deployed', lead: 'Florence Adong', contributors: ['Pius Odong', 'Isaac Tumusiime'], progress: 100, daysInStage: 5, milestoneCount: 6, milestoneDone: 6 },
    { id: 'inv-007', title: 'Seed Bank Management System', stage: 'concept', lead: 'Grace Nakamya', contributors: ['Pius Odong'], progress: 20, daysInStage: 6, milestoneCount: 4, milestoneDone: 1 },
    { id: 'inv-008', title: 'Weather Station Network', stage: 'research', lead: 'Isaac Tumusiime', contributors: ['Florence Adong'], progress: 8, daysInStage: 12, milestoneCount: 3, milestoneDone: 0 },
  ];
  const getAgingColor = (days: number) => {
    if (days > 14) return 'text-red-500 bg-red-50 border-red-200';
    if (days >= 7) return 'text-aims-orange bg-aims-orange/10 border-aims-orange/20';
    return 'text-aims-green bg-aims-green/10 border-aims-green/20';
  };
  const getAgingDot = (days: number) => {
    if (days > 14) return 'bg-red-500';
    if (days >= 7) return 'bg-aims-orange';
    return 'bg-aims-green';
  };
  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="Innovation Pipeline" subtitle="Research execution, prototyping & production tracking" />
      <CheckInCard />
      <SharedLibraryWidget />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {STAGES.map((s) => {
          const count = projects.filter((p) => p.stage === s.key).length;
          return (<div key={s.key} className={cn('bg-white rounded-xl border border-slate-200 border-t-4 p-4 shadow-sm text-center', ACCENT[s.color])}><p className="text-2xl font-extrabold text-slate-900">{count}</p><p className="text-xs font-semibold text-slate-500 mt-1">{s.label}</p></div>);
        })}
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center bg-slate-100 rounded-lg p-1">
          <button onClick={() => setViewMode('kanban')} className={cn('px-4 py-1.5 rounded-md text-xs font-bold transition-all', viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}><span className="material-symbols-outlined text-[14px] align-middle mr-1">view_kanban</span>Kanban</button>
          <button onClick={() => setViewMode('list')} className={cn('px-4 py-1.5 rounded-md text-xs font-bold transition-all', viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}><span className="material-symbols-outlined text-[14px] align-middle mr-1">view_list</span>List</button>
        </div>
        <AdvancedFilterBar dateLabel="Created" statusOptions={['Research', 'Concept', 'Prototype', 'Testing', 'Production', 'Deployed']} ownerOptions={['Pius Odong', 'Florence Adong', 'Isaac Tumusiime', 'Grace Nakamya']} presets={[{ id: 'inv-p1', name: 'My projects' }, { id: 'inv-p2', name: 'Stalled (>14d)' }]} onExport={(fmt) => handleAction(`Exporting innovations ${fmt.toUpperCase()}`)} onSavePreset={(name) => handleAction(`Saved preset: ${name}`)} />
      </div>
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {STAGES.map((stage) => {
            const stageProjects = projects.filter((p) => p.stage === stage.key);
            return (
              <div key={stage.key} className="flex flex-col">
                <div className={cn('rounded-t-xl px-3 py-2.5 flex items-center justify-between', CHIP[stage.color])}><span className="text-xs font-bold uppercase tracking-wider text-white">{stage.label}</span><span className="text-xs font-extrabold text-white bg-white/20 px-2 py-0.5 rounded-full">{stageProjects.length}</span></div>
                <div className="bg-slate-50 rounded-b-xl border border-slate-200 border-t-0 p-2 space-y-2 min-h-[200px]">
                  {stageProjects.length === 0 && <p className="text-xs text-slate-400 text-center py-8 italic">No projects</p>}
                  {stageProjects.map((p) => (
                    <div key={p.id} onClick={() => navigate(`/innovations/${p.id}`)} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                      <p className="text-sm font-bold text-slate-900 mb-1 group-hover:text-aims-navy transition-colors">{p.title}</p>
                      <p className="text-[10px] text-slate-500 mb-2">Lead: {p.lead}</p>
                      <p className="text-[10px] text-slate-400 mb-2">{p.contributors.length} contributor{p.contributors.length !== 1 ? 's' : ''}</p>
                      <div className="mb-2"><div className="flex justify-between text-[10px] mb-0.5"><span className="font-semibold text-slate-500">Progress</span><span className="font-bold text-slate-900">{p.progress}%</span></div><div className="w-full bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-aims-green" style={{ width: `${p.progress}%` }} /></div></div>
                      <p className="text-[10px] text-slate-500 mb-2">{p.milestoneDone}/{p.milestoneCount} milestones</p>
                      <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-bold', getAgingColor(p.daysInStage))}><span className={cn('w-1.5 h-1.5 rounded-full', getAgingDot(p.daysInStage))} />{p.daysInStage}d in stage</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {viewMode === 'list' && (
        <Section title="All Projects" subtitle="Sortable table view of innovation pipeline">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-slate-200"><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Project</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Stage</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Lead</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Contributors</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Progress</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Milestones</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Days in Stage</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 font-bold text-slate-900">{p.title}</td>
                    <td className="py-2.5"><span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-aims-navy/10 text-aims-navy capitalize">{p.stage}</span></td>
                    <td className="py-2.5 text-slate-600">{p.lead}</td>
                    <td className="py-2.5 text-slate-500 text-xs">{p.contributors.join(', ')}</td>
                    <td className="py-2.5"><div className="flex items-center gap-2"><div className="w-16 bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-aims-green" style={{ width: `${p.progress}%` }} /></div><span className="text-xs font-bold text-slate-900">{p.progress}%</span></div></td>
                    <td className="py-2.5 text-xs text-slate-600">{p.milestoneDone}/{p.milestoneCount}</td>
                    <td className="py-2.5"><span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border', getAgingColor(p.daysInStage))}><span className={cn('w-1.5 h-1.5 rounded-full', getAgingDot(p.daysInStage))} />{p.daysInStage}d</span></td>
                    <td className="py-2.5 text-right"><button onClick={() => navigate(`/innovations/${p.id}`)} className="text-xs font-bold text-aims-navy hover:underline">Open</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
}

function SysAdminDashboard() {
  const [showAuditLog, setShowAuditLog] = useState(false);
  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="System Telemetry" subtitle="Platform stability, security & configuration" />
      <CheckInCard />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Uptime" value="99.9%" icon="check_circle" color="green" />
        <StatCard title="Error Rate" value="0.4%" icon="bug_report" color="orange" />
        <StatCard title="API Latency" value="182ms" icon="speed" color="navy" />
        <StatCard title="Sessions" value="47" icon="group" color="mint" />
      </div>
      <SharedLibraryWidget />
      <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-red-500 p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-lg flex items-center justify-center bg-red-500 text-white"><span className="material-symbols-outlined text-[24px]">shield_alert</span></div><div><p className="text-2xl font-extrabold text-slate-900 tracking-tight">3</p><p className="text-sm font-semibold text-slate-600 mt-1">Geofence Violations (24h)</p></div></div>
          <button onClick={() => setShowAuditLog(!showAuditLog)} className="text-xs font-bold text-aims-navy hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">{showAuditLog ? 'expand_less' : 'expand_more'}</span>{showAuditLog ? 'Collapse' : 'View Log'}</button>
        </div>
        <p className="text-[10px] text-slate-400">Failed physical check-in attempts outside office perimeter</p>
      </div>
      {showAuditLog && (
        <Section title="Geofence Violation Audit Log" subtitle="Failed physical check-in attempts — blocked and logged automatically">
          <AdvancedFilterBar dateLabel="Attempt Time" statusOptions={['Blocked', 'Flagged']} ownerOptions={['CD', 'ED', 'COMPANY_ADMIN', 'FINANCE', 'GRANTS_MANAGER', 'GRANT_WRITER', 'INNOVATOR']} presets={[{ id: 'gv1', name: 'Last 24 hours' }, { id: 'gv2', name: 'Repeat offenders' }]} onExport={(fmt) => console.log(`Exporting audit log ${fmt}`)} onSavePreset={(name) => console.log(`Saved preset: ${name}`)} />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-slate-200"><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Timestamp</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">User</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Role</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Action</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Distance</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Coordinates</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">IP Address</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {[{ time: '2026-08-22 07:42:18', user: 'Janet Apio', role: 'GRANT_WRITER', action: 'check_in', distance: '342m', coords: '0.3034°N, 32.5897°E', ip: '41.220.138.44' },{ time: '2026-08-22 08:15:03', user: 'David Okello', role: 'FINANCE', action: 'check_in', distance: '1.2km', coords: '0.3112°N, 32.5845°E', ip: '102.82.91.12' },{ time: '2026-08-21 17:31:45', user: 'Isaac Tumusiime', role: 'COMPANY_ADMIN', action: 'check_out', distance: '890m', coords: '0.2921°N, 32.5998°E', ip: '41.220.138.67' }].map((entry, i) => (
                  <tr key={i} className="hover:bg-red-50/50 transition-colors"><td className="py-2.5 text-slate-600 font-mono text-xs">{entry.time}</td><td className="py-2.5 font-bold text-slate-900">{entry.user}</td><td className="py-2.5"><span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600">{entry.role.replace('_', ' ')}</span></td><td className="py-2.5 text-slate-600 capitalize">{entry.action.replace('_', ' ')}</td><td className="py-2.5"><span className="text-xs font-bold text-red-500">{entry.distance}</span></td><td className="py-2.5 text-slate-500 font-mono text-[10px]">{entry.coords}</td><td className="py-2.5 text-slate-500 font-mono text-xs">{entry.ip}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
}

function HRDashboard() {
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const handleAction = (msg: string) => showToast({ title: 'Action Logged', message: msg, type: 'success' });
  const [expandedContract, setExpandedContract] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="HR & People Management" subtitle="Workforce administration, contracts, and performance" />
      <CheckInCard />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Headcount" value="142" icon="people" color="navy" />
        <StatCard title="Present Today" value="128" icon="check_circle" color="green" />
        <StatCard title="Expiring Contracts (30d)" value="3" icon="description" color="orange" />
        <StatCard title="Pending Appraisals" value="12" icon="fact_check" color="mint" />
      </div>

      <Section title="Quick Actions" subtitle="Manage workforce operations">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button onClick={() => navigate('/hr?tab=users')} className="p-4 bg-aims-navy/5 hover:bg-aims-navy/10 rounded-xl border border-aims-navy/20 transition-colors text-left">
            <span className="material-symbols-outlined text-aims-navy text-[24px] mb-2">manage_accounts</span>
            <p className="text-sm font-bold text-slate-900">User Management</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Add/edit employees</p>
          </button>
          <button onClick={() => navigate('/attendance')} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors text-left">
            <span className="material-symbols-outlined text-slate-600 text-[24px] mb-2">schedule</span>
            <p className="text-sm font-bold text-slate-900">Attendance</p>
            <p className="text-[10px] text-slate-500 mt-0.5">View records</p>
          </button>
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Expiring Contracts" subtitle="Contracts approaching renewal deadline">
          <div className="space-y-2">
            {[
              { id: 'c1', name: 'Janet Apio', role: 'Grant Writer', type: '1-Year', salary: 'UGX 1.8M', expiry: 'Sep 15, 2026', daysLeft: 24 },
              { id: 'c2', name: 'Pius Odong', role: 'Innovator', type: 'Contract', salary: 'UGX 1.5M', expiry: 'Sep 30, 2026', daysLeft: 39 },
              { id: 'c3', name: 'Isaac Tumusiime', role: 'Procurement Officer', type: 'Contract', salary: 'UGX 1.6M', expiry: 'Oct 10, 2026', daysLeft: 49 },
            ].map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-aims-orange/5 rounded-lg border border-aims-orange/20">
                <div>
                  <p className="text-sm font-bold text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.role} • {c.type} • {c.salary}</p>
                </div>
                <div className="text-right">
                  <span className={cn('text-xs font-bold px-2 py-0.5 rounded', c.daysLeft <= 30 ? 'bg-aims-orange/15 text-aims-orange' : 'bg-slate-100 text-slate-600')}>
                    Expires {c.expiry} ({c.daysLeft}d)
                  </span>
                  <div className="flex gap-2 mt-1 justify-end">
                    <button onClick={() => handleAction(`Renewing ${c.name}'s contract`)} className="text-[10px] font-bold text-aims-navy hover:underline">Renew</button>
                    <button onClick={() => handleAction(`Viewing ${c.name}'s contract`)} className="text-[10px] font-bold text-slate-500 hover:underline">View</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Pending Appraisals" subtitle="Employees awaiting performance review">
          <div className="space-y-3">
            {[
              { id: 'a1', name: 'Florence Adong', dept: 'Research', role: 'Research Lead', lastReview: 'Feb 2026', dueDate: 'Sep 10, 2026', status: 'pending' },
              { id: 'a2', name: 'Grace Nakamya', dept: 'HR', role: 'HR Officer', lastReview: 'Mar 2026', dueDate: 'Sep 15, 2026', status: 'pending' },
              { id: 'a3', name: 'Isaac Tumusiime', dept: 'Procurement', role: 'Procurement Officer', lastReview: 'Jan 2026', dueDate: 'Sep 20, 2026', status: 'overdue' },
            ].map((emp) => (
              <div key={emp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-900">{emp.name}</p>
                  <p className="text-xs text-slate-500">{emp.role} • {emp.dept}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Last review: {emp.lastReview}</p>
                </div>
                <div className="text-right">
                  <span className={cn('text-xs font-bold px-2 py-0.5 rounded', 
                    emp.status === 'overdue' ? 'bg-red-50 text-red-600' : 'bg-aims-orange/15 text-aims-orange'
                  )}>
                    Due: {emp.dueDate}
                  </span>
                  <button onClick={() => navigate(`/appraisals/${emp.id}`)} className="block mt-1 text-[10px] font-bold text-aims-navy hover:underline">Start Review</button>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section title="Contract Actions Queue" subtitle="Contracts awaiting your approval or rejection">
        <div className="space-y-3">
          {[
            { id: 'ctr-david', name: 'David Okello', role: 'Finance Officer', type: 'Permanent', salary: 'UGX 2.0M', submittedBy: 'HR Admin', submittedDate: 'Aug 20', status: 'Awaiting Your Approval', comment: 'Salary adjustment per Q2 appraisal. Approved by Dept Head.' },
            { id: 'ctr-mercy', name: 'Mercy Atim', role: 'Research Assistant', type: 'Intern', salary: 'UGX 800K', submittedBy: 'Grants Team', submittedDate: 'Aug 19', status: 'Awaiting Your Approval', comment: 'New hire for Land Rights project. Budget line confirmed.' },
          ].map((item) => (
            <div key={item.id} className={cn('rounded-lg border transition-all', expandedContract === item.id ? 'border-aims-navy shadow-md bg-white' : 'border-slate-200 bg-slate-50')}>
              <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpandedContract(expandedContract === item.id ? null : item.id)}>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">{expandedContract === item.id ? 'expand_less' : 'expand_more'}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.role} • {item.type} • {item.salary} • {item.submittedBy}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-aims-orange/15 text-aims-orange">{item.status}</span>
              </div>
              {expandedContract === item.id && (
                <div className="px-3 pb-3 space-y-3">
                  <div className="bg-white rounded-lg p-2.5 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Comment from {item.submittedBy} ({item.submittedDate})</p>
                    <p className="text-xs text-slate-700 italic">"{item.comment}"</p>
                  </div>
                  <ApprovalActionPanel 
                    itemName={`${item.name}'s contract`} 
                    itemType="Contract" 
                    onViewFull={() => handleAction(`Opened full contract record for ${item.name}`)} 
                    onApprove={(c) => handleAction(`YOU APPROVED contract for ${item.name}: ${c}`)} 
                    onReject={(c) => handleAction(`YOU REJECTED contract for ${item.name}: ${c}`)} 
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Recent Activity" subtitle="Latest HR operations">
        <div className="space-y-3">
          {[
            { action: 'Contract Renewed', user: 'Janet Apio', time: '2h ago', icon: 'description', color: 'green' as ColorKey },
            { action: 'Appraisal Completed', user: 'Pius Odong', time: '5h ago', icon: 'fact_check', color: 'navy' as ColorKey },
            { action: 'New Employee Added', user: 'Mercy Atim', time: '1d ago', icon: 'person_add', color: 'orange' as ColorKey },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', CHIP[item.color])}>
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">{item.action}</p>
                <p className="text-xs text-slate-500">{item.user}</p>
              </div>
              <p className="text-[10px] text-slate-400">{item.time}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function InventoryDashboard() {
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const handleAction = (msg: string) => showToast({ title: 'Action Logged', message: msg, type: 'success' });

  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="Inventory Management" subtitle="Track assets, equipment, and supplies" />
      <CheckInCard />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Assets" value="284" icon="inventory_2" color="navy" />
        <StatCard title="In Use" value="241" icon="check_circle" color="green" />
        <StatCard title="Under Maintenance" value="12" icon="build" color="orange" />
        <StatCard title="Low Stock Items" value="8" icon="warning" color="mint" />
      </div>

      <Section title="Inventory Overview" subtitle="Current asset status and alerts">
        <div className="space-y-3">
          {[
            { item: 'Laptops (Dell Latitude)', total: 45, inUse: 42, available: 3, status: 'healthy' },
            { item: 'Field Tablets (Samsung Tab A9)', total: 20, inUse: 18, available: 2, status: 'low' },
            { item: 'GPS Units (Garmin GPSMAP 67i)', total: 15, inUse: 12, available: 3, status: 'healthy' },
            { item: 'Solar Chargers (Anker 24W)', total: 30, inUse: 25, available: 5, status: 'healthy' },
            { item: 'Office Chairs', total: 50, inUse: 48, available: 2, status: 'low' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">{item.item}</p>
                <p className="text-xs text-slate-500">Total: {item.total} • In Use: {item.inUse} • Available: {item.available}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', 
                  item.status === 'healthy' ? 'bg-aims-green/15 text-aims-green' : 'bg-aims-orange/15 text-aims-orange'
                )}>
                  {item.status === 'healthy' ? 'Healthy' : 'Low Stock'}
                </span>
                <button onClick={() => handleAction(`Viewing details for ${item.item}`)} className="text-xs font-bold text-aims-navy hover:underline">View</button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Quick Actions" subtitle="Manage inventory operations">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <button onClick={() => navigate('/inventory?tab=add')} className="p-4 bg-aims-navy/5 hover:bg-aims-navy/10 rounded-xl border border-aims-navy/20 transition-colors text-left">
            <span className="material-symbols-outlined text-aims-navy text-[24px] mb-2">add_box</span>
            <p className="text-sm font-bold text-slate-900">Add New Asset</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Register equipment</p>
          </button>
          <button onClick={() => navigate('/inventory?tab=transfer')} className="p-4 bg-aims-green/5 hover:bg-aims-green/10 rounded-xl border border-aims-green/20 transition-colors text-left">
            <span className="material-symbols-outlined text-aims-green text-[24px] mb-2">swap_horiz</span>
            <p className="text-sm font-bold text-slate-900">Transfer Asset</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Move between users</p>
          </button>
          <button onClick={() => navigate('/inventory?tab=maintenance')} className="p-4 bg-aims-orange/5 hover:bg-aims-orange/10 rounded-xl border border-aims-orange/20 transition-colors text-left">
            <span className="material-symbols-outlined text-aims-orange text-[24px] mb-2">build</span>
            <p className="text-sm font-bold text-slate-900">Schedule Maintenance</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Service equipment</p>
          </button>
        </div>
      </Section>
    </div>
  );
}

function DefaultDashboard() {
  return (<div className="space-y-6"><CheckInCard /><SharedLibraryWidget /><div className="p-8 text-center text-slate-500">Welcome to Ardhi.</div></div>);
}