// src/pages/Dashboard.tsx
import { type ReactNode, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { useLiveData } from '@/lib/useLiveData';
import { loadJSON, saveJSON, STORAGE_KEYS, demoMode } from '@/lib/storage';
import { exportCsv, exportTableAsPdf } from '@/lib/export';
import { useRequisitions, mutateRequisitions, getAllRequisitions } from '@/services/requisitionService';
import { attendanceGet } from '@/services/attendanceService';
import { leaveGet } from '@/services/leaveService';
import { contractGet } from '@/services/contractService';
import { getDirectoryEntries } from '@/services/employeeService';
import { CHIP, ACCENT, FILL, type ColorKey } from '@/lib/uiTheme';
import { ExecutiveBrief } from '@/components/ai/ExecutiveBrief';
import { useNotifications } from '@/context/NotificationContext';
import { CheckInCard } from '@/components/dashboard/CheckInCard';
import { PayslipReviewPanel } from '@/components/admin/PayslipReviewPanel';
import { GrantsPipelineBoard } from '@/components/grants/GrantsPipelineBoard';
import { GrantReviewQueue } from '@/components/grants/GrantReviewQueue';
import { FinanceEditApprovals } from '@/components/finance/FinanceEditApprovals';
import { openGrantsAssistant } from '@/components/grants/GrantsAssistant';
import { openFlagForED } from '@/components/grants/FlagForEDModal';
import { flagService } from '@/services/flagService';
import { SharedLibraryWidget } from '@/components/dashboard/SharedLibraryWidget';
import { innovationService, isExecutingProject } from '@/services/innovationService'; // Importing our centralized service
import { grantService } from '@/services/grantService';
import { financeService } from '@/services/financeService';
import { userOpsGet } from '@/services/userOpsService';
import { ACTIVE_STAFF } from '@/data/roster';
import { DATA_VAULT_VERSION, DATA_VAULT_BASELINE } from '@/lib/storage';
import { GRANT_STAGES, daysUntil } from '@/data/grants';


// ── Company feed (persisted) ──
interface FeedPost { id: string; author: string; content: string; time: string; }

function readFeedPosts(): FeedPost[] {
  // No dummy feed content by default — only real posts.
  const stored = loadJSON<FeedPost[] | null>(STORAGE_KEYS.feed, null);
  if (stored && stored.length > 0) return stored;
  if (!demoMode()) return [];
  return [
    { id: 'f1', author: 'Executive Director', content: 'Reminder: All department Q3 budget revisions due by Friday COB.', time: new Date(Date.now() - 3600000).toISOString() },
    { id: 'f2', author: 'HR Admin', content: 'New leave policy updated in the Documents hub. Please review.', time: new Date(Date.now() - 10800000).toISOString() },
    { id: 'f3', author: 'Grants Manager', content: 'USAID submission confirmed. Tracking number: AID-2026-UG-0441.', time: new Date(Date.now() - 21600000).toISOString() },
  ];
}

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

interface SavedPreset { id: string; name: string; filters: Record<string, string>; }

const PRESETS_KEY = 'aims_filter_presets';

function loadSavedPresets(): SavedPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedPreset[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

interface AdvancedFilterBarProps {
  dateLabel?: string; statusOptions: string[]; ownerOptions: string[];
  showAmountRange?: boolean;
  onFilterChange?: (filters: Record<string, string>) => void;
  exportRows?: Record<string, unknown>[];
  exportFileName?: string;
}

function AdvancedFilterBar({ dateLabel = 'Date', statusOptions, ownerOptions, showAmountRange = false, onFilterChange, exportRows, exportFileName = 'aims-export' }: AdvancedFilterBarProps) {
  const { showToast } = useNotifications();
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>(() => loadSavedPresets());
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [activeCount, setActiveCount] = useState(0);

  const update = (key: string, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    setActiveCount(Object.values(next).filter(Boolean).length);
    onFilterChange?.(next);
  };

  const clearAll = () => {
    setFilters({});
    setActiveCount(0);
    onFilterChange?.({});
  };

  const runExport = (format: 'csv' | 'pdf') => {
    const rows = exportRows ?? [];
    if (rows.length === 0) {
      showToast({ title: 'Nothing to Export', message: 'There are no records in this view to export.', type: 'error' });
      return;
    }
    const cols = Object.keys(rows[0] ?? {});
    const head = cols.map((c) => c.replace(/([A-Z])/g, ' $1').replace(/^./, (m) => m.toUpperCase()));
    const body = rows.map((r) => cols.map((c) => {
      const v = r[c];
      if (v === null || v === undefined) return '';
      return typeof v === 'object' ? JSON.stringify(v) : String(v);
    }));
    if (format === 'csv') {
      exportCsv(exportFileName, rows);
      showToast({ title: 'CSV Exported', message: `${rows.length} record(s) exported to ${exportFileName}.csv`, type: 'success' });
    } else {
      exportTableAsPdf(exportFileName.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()), head, body);
      showToast({ title: 'Print Layout Ready', message: 'Choose "Save as PDF" in the print dialog.', type: 'success' });
    }
  };

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) { showToast({ title: 'Name Required', message: 'Enter a name for this preset.', type: 'error' }); return; }
    if (activeCount === 0) { showToast({ title: 'No Filters Set', message: 'Set at least one filter before saving.', type: 'error' }); return; }
    const preset: SavedPreset = { id: `p-${Date.now()}`, name, filters: { ...filters } };
    const next = [...savedPresets, preset];
    setSavedPresets(next);
    try { localStorage.setItem(PRESETS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    setPresetName('');
    showToast({ title: 'Preset Saved', message: `"${name}" will re-apply your filters anytime.`, type: 'success' });
  };

  const applyPreset = (p: SavedPreset) => {
    setFilters({ ...p.filters });
    setActiveCount(Object.values(p.filters).filter(Boolean).length);
    onFilterChange?.({ ...p.filters });
    setShowPresets(false);
    showToast({ title: 'Preset Applied', message: p.name, type: 'success' });
  };

  const deletePreset = (id: string) => {
    const next = savedPresets.filter((p) => p.id !== id);
    setSavedPresets(next);
    try { localStorage.setItem(PRESETS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const inputCls = 'w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30';

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[180px]"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search</label><input type="text" placeholder="Title, description, ID…" value={filters.keyword ?? ''} onChange={(e) => update('keyword', e.target.value)} className={inputCls} /></div>
        <div className="min-w-[140px]"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{dateLabel}</label><select value={filters.date ?? ''} onChange={(e) => update('date', e.target.value)} className={inputCls}><option value="">All time</option><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="custom">Custom range…</option></select></div>
        <div className="min-w-[130px]"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label><select value={filters.status ?? ''} onChange={(e) => update('status', e.target.value)} className={inputCls}><option value="">All statuses</option>{statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
        <div className="min-w-[130px]"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Owner / Dept</label><select value={filters.owner ?? ''} onChange={(e) => update('owner', e.target.value)} className={inputCls}><option value="">All</option>{ownerOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
        {showAmountRange && (<div className="min-w-[120px]"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount</label><select value={filters.amount ?? ''} onChange={(e) => update('amount', e.target.value)} className={inputCls}><option value="">Any amount</option><option value="lt-1m">&lt; UGX 1M</option><option value="1m-5m">UGX 1M – 5M</option><option value="5m-20m">UGX 5M – 20M</option><option value="gt-20m">&gt; UGX 20M</option></select></div>)}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {activeCount > 0 && <button onClick={clearAll} className="text-[10px] font-bold text-red-500 hover:underline flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">filter_alt_off</span>Clear ({activeCount})</button>}
        <div className="relative">
          <button onClick={() => setShowPresets(!showPresets)} className="text-[10px] font-bold text-aims-navy hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">bookmark</span>Presets ({savedPresets.length})</button>
          {showPresets && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-10 min-w-[220px] max-h-64 overflow-y-auto">
              {savedPresets.length === 0 && <p className="text-[10px] text-slate-400 px-2 py-1 italic">No saved presets — set filters, then press Save.</p>}
              {savedPresets.map((p) => (
                <div key={p.id} className="flex items-center gap-1">
                  <button onClick={() => applyPreset(p)} className="flex-1 text-left text-xs px-2 py-1.5 hover:bg-slate-50 rounded text-slate-700">{p.name}</button>
                  <button onClick={() => deletePreset(p.id)} className="text-slate-300 hover:text-red-500 p-1" title="Delete preset"><span className="material-symbols-outlined text-[13px]">close</span></button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <input type="text" placeholder="Save filter as…" value={presetName} onChange={(e) => setPresetName(e.target.value)} className="text-[10px] border border-slate-200 rounded px-2 py-1 w-32 focus:outline-none focus:ring-1 focus:ring-aims-navy/30" />
          <button onClick={savePreset} className="text-[10px] font-bold text-aims-green hover:underline">Save</button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-slate-400 italic">Filters combine with AND</span>
          <button onClick={() => runExport('csv')} className="text-[10px] font-bold text-aims-navy hover:underline flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">download</span>CSV</button>
          <button onClick={() => runExport('pdf')} className="text-[10px] font-bold text-aims-navy hover:underline flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">picture_as_pdf</span>PDF</button>
        </div>
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


export function Dashboard() {
  const { user } = useAuth();
  const location = useLocation(); 
  // Live auto-update: any data write (same tab or another tab) re-renders
  // the active dashboard so every card reflects the freshest values.
  useLiveData();
  
  if (!user) return null;
  const role = user.role;

  const searchParams = new URLSearchParams(location.search);
  const view = searchParams.get('view');

  // 1. QUERY PARAM OVERRIDES
  if (view === 'grants') return <GrantDashboard />;
  if (view === 'finance') return <FinanceDashboard />;
  if (view === 'innovations') return <InnovatorDashboard />;
  if (view === 'hr') return <HRDashboard />;
  if (view === 'inventory') return <InventoryDashboard />;

  // 2. DEFAULT ROLE-BASED ROUTING
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
  useLiveData(); // every stored value below re-renders on any AIMS write
  const navigate = useNavigate();
  const [approvalFilters, setApprovalFilters] = useState<Record<string, string>>({});

  // ── LIVE aggregates — real stores only, zero until you enter data ──
  const usd = (n: number) => (n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`);
  const ugx = (n: number) => (n >= 1000000000 ? `UGX ${(n / 1000000000).toFixed(1)}B` : n >= 1000000 ? `UGX ${(n / 1000000).toFixed(0)}M` : n >= 1000 ? `UGX ${(n / 1000).toFixed(0)}K` : `UGX ${n}`);
  const rosterCount = ACTIVE_STAFF.length;
  const directoryEntries = getDirectoryEntries();
  const activeHires = directoryEntries.filter((d) => d.status === 'active').length;
  const onboardingCount = directoryEntries.filter((d) => d.status === 'onboarding').length;
  const headcount = rosterCount + activeHires;
  const presence = attendanceGet.presence();
  const presentToday = presence.filter((p) => p.mode === 'physical' || p.mode === 'remote').length;
  const remoteToday = presence.filter((p) => p.mode === 'remote').length;
  const onLeaveToday = presence.filter((p) => p.mode === 'leave').length;
  const absentToday = presence.filter((p) => p.mode === 'absent').length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const lateToday = attendanceGet.history().filter((h) => h.date === todayStr && h.status === 'late').length;
  const leavePendingCount = leaveGet.pending().length;
  const renewalsDueCount = contractGet().filter((c) => c.status === 'expiring' || c.status === 'expired').length;
  const finIncome = financeService.totalIncome();
  const finExpense = financeService.totalExpense();
  const finNet = finIncome - finExpense;
  const allGrants = grantService.getAllGrants();
  const openGrants = allGrants.filter((g) => g.stage !== 'declined');
  const securedValue = openGrants.filter((g) => g.stage === 'awarded').reduce((s, g) => s + (g.amountAwarded ?? g.amountRequested ?? 0), 0);
  const pipelineValue = openGrants.filter((g) => g.stage !== 'awarded').reduce((s, g) => s + (g.amountRequested ?? 0), 0);
  const grantsDue7d = openGrants.filter((g) => g.stage !== 'awarded' && daysUntil(g.deadline) <= 7 && daysUntil(g.deadline) >= 0).length;
  const awardedCount = openGrants.filter((g) => g.stage === 'awarded').length;
  const winRate = awardedCount > 0 ? Math.round((awardedCount / Math.max(1, openGrants.length)) * 100) : null;
  const queueReqs = getAllRequisitions().filter((r) => r.status === 'pushed' || r.status === 'approved' || r.status === 'returned');
  const execProjects = innovationService.getAllProjects().filter(isExecutingProject);
  const stalledCount = execProjects.filter((p) => p.daysInStage > 14).length;
  const feedPostsLive = readFeedPosts();

  const cdApprovals = queueReqs.map((r) => ({
    id: r.id,
    title: r.title,
    type: 'Requisition',
    amount: ugx(r.amount ?? 0),
    status: r.status === 'pushed' ? 'ED Review' : r.status === 'approved' ? 'Awaiting Finance' : r.status,
    daysInQueue: r.daysInStatus ?? 0,
  }));
  const filteredCdApprovals = cdApprovals.filter((item) => {
    const q = (approvalFilters.keyword ?? '').toLowerCase();
    if (q && !item.title.toLowerCase().includes(q) && !item.id.toLowerCase().includes(q)) return false;
    if (approvalFilters.status && item.status !== approvalFilters.status) return false;
    return true;
  });
  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="Country Director Dashboard" subtitle="Strategic oversight, governance & organizational leadership — view everything, flag for ED, approve nothing" />
      <SharedLibraryWidget />

      {/* At a Glance strip — live values from attendance & finance stores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => navigate('/attendance')} className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-green p-4 shadow-sm text-left hover:shadow-md transition-shadow group">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attendance Today</p>
          <p className="text-2xl font-extrabold text-aims-green mt-1">{presentToday}/{headcount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{remoteToday} remote · {lateToday} late · {onLeaveToday} leave · {absentToday} absent · <span className="text-aims-green font-bold group-hover:underline">oversight</span></p>
        </button>
        <button onClick={() => navigate('/finance/analytics')} className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-mint p-4 shadow-sm text-left hover:shadow-md transition-shadow group">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Income (YTD)</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{usd(finIncome)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">aims_finance · USD · <span className="text-aims-navy font-bold group-hover:underline">analytics</span></p>
        </button>
        <button onClick={() => openFlagForED({ recordLabel: 'General — Country Director Review', sourceModule: 'dashboard' })} className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-orange p-4 shadow-sm text-left hover:shadow-md transition-shadow group">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unresolved Flags</p>
          <p className="text-2xl font-extrabold text-aims-orange mt-1">{flagService.getOpenFlags().length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">priority interrupts · <span className="text-aims-orange font-bold group-hover:underline">Raise new</span></p>
        </button>
        <button onClick={() => navigate('/approvals?view=readonly')} className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-navy p-4 shadow-sm text-left hover:shadow-md transition-shadow group">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Requisitions In Flight</p>
          <p className="text-2xl font-extrabold text-aims-navy mt-1">{queueReqs.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">{queueReqs.length === 0 ? 'none awaiting decision' : 'with ED / awaiting finance'} · <span className="text-aims-navy font-bold group-hover:underline">track</span></p>
        </button>
      </div>

      {/* AI Insight block */}
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-aims-navy p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-8 h-8 rounded-lg bg-aims-navy/10 flex items-center justify-center"><span className="material-symbols-outlined text-aims-navy text-[20px]">auto_awesome</span></span>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">System Summary (AI-Generated)</h3>
            <p className="text-[10px] font-bold text-aims-navy uppercase tracking-wider">Powered by Tier 1 AI — Insights</p>
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-100 p-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            {finIncome === 0 && finExpense === 0
              ? 'The system is clean — no cash-flow records have been entered yet. Income and expenditure appear here automatically (USD) once Finance records them in aims_finance.'
              : `Live cash position: income ${usd(finIncome)} vs expenditure ${usd(finExpense)} (net ${usd(finNet)}). ${flagService.getOpenFlags().length} open CD flag(s) · ${queueReqs.length} requisition(s) in the pipeline · ${stalledCount} stalled project(s) · ${grantsDue7d} grant(s) due within 7 days.`}
          </p>
        </div>
      </div>
      <ExecutiveBrief />

      <Section title="Approvals in Progress" subtitle="Visibility into ED's review pipeline — read only">
        <AdvancedFilterBar dateLabel="Submitted" statusOptions={['ED Review', 'Awaiting Finance', 'Awaiting HR', 'Disbursed']} onFilterChange={setApprovalFilters} ownerOptions={['Finance Dept', 'HR Admin', 'Grants Team', 'Procurement']} showAmountRange exportRows={filteredCdApprovals} exportFileName="cd-approvals-in-progress" />
        {filteredCdApprovals.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 italic bg-slate-50 rounded-xl border border-slate-100">No requisitions in the approval pipeline yet — they appear here live as Finance pushes them to the ED.</div>
        ) : (
          <div className="space-y-2">
            {filteredCdApprovals.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div><p className="text-sm font-bold text-slate-900">{item.title}</p><p className="text-xs text-slate-500">{item.type} • {item.amount} • {item.id}</p></div>
                <div className="text-right">
                  <span className={cn('inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide', item.daysInQueue >= 3 ? 'bg-aims-orange/15 text-aims-orange' : 'bg-aims-navy/10 text-aims-navy')}>{item.status}</span>
                  <p className="text-[10px] text-slate-400 mt-1">{item.daysInQueue}d in queue</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Grant Portfolio" subtitle={`Secured funding vs. pipeline opportunities — live from aims_grants${grantsDue7d > 0 ? ` · ${grantsDue7d} due within 7 days` : ''}`}>
          <div className="space-y-5"><Bar label="Secured Funding" value={securedValue} max={Math.max(securedValue, pipelineValue, 1)} display={securedValue > 0 ? ugx(securedValue) : 'UGX 0 — none yet'} color="navy" /><Bar label="Pipeline Opportunities" value={pipelineValue} max={Math.max(securedValue, pipelineValue, 1)} display={pipelineValue > 0 ? ugx(pipelineValue) : 'UGX 0 — none yet'} color="mint" /></div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between"><span className="text-sm font-semibold text-slate-600">Win Rate (YTD)</span><span className="text-xl font-extrabold text-aims-green">{winRate === null ? '—' : `${winRate}%`}</span></div>
          {openGrants.length === 0 && <p className="text-[10px] text-slate-400 italic mt-2">No grants recorded yet — they appear here once the team enters grant data.</p>}
        </Section>
        <Section title="Financial Health" subtitle="Consolidated income vs. expenditure — live from aims_finance (USD)">
          <div className="space-y-5"><Bar label="Total Income" value={finIncome} max={Math.max(finIncome, finExpense, 1)} display={finIncome > 0 ? usd(finIncome) : '$0 — none yet'} color="green" /><Bar label="Total Expenditure" value={finExpense} max={Math.max(finIncome, finExpense, 1)} display={finExpense > 0 ? usd(finExpense) : '$0 — none yet'} color="orange" /></div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between"><span className="text-sm font-semibold text-slate-600">Net Surplus</span><span className={cn('text-xl font-extrabold', finNet >= 0 ? 'text-aims-green' : 'text-red-500')}>{finIncome === 0 && finExpense === 0 ? '—' : usd(finNet)}</span></div>
        </Section>
      </div>
      <Section title="HR & Admin Summary" subtitle="Workforce indicators — no individual record access">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100"><p className="text-xs text-slate-500 mb-1">Total Headcount</p><p className="text-2xl font-extrabold text-slate-900">{headcount}</p>{onboardingCount > 0 && <p className="text-[10px] text-aims-orange mt-0.5">{onboardingCount} new hire(s) in onboarding</p>}</div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100"><p className="text-xs text-slate-500 mb-1">Contracts Renewing</p><p className="text-2xl font-extrabold text-aims-orange">{renewalsDueCount}</p></div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100"><p className="text-xs text-slate-500 mb-1">Leave Requests Pending</p><p className="text-2xl font-extrabold text-aims-green">{leavePendingCount}</p></div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100"><p className="text-xs text-slate-500 mb-1">Present Today</p><p className="text-2xl font-extrabold text-aims-navy">{presentToday}/{headcount}</p></div>
        </div>
      </Section>
      <Section title="Innovations & Tasks" subtitle="View-only access to innovation pipeline — live from aims_projects">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-slate-200"><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Project</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Stage</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Lead</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Progress</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {execProjects.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 font-bold text-slate-900">{p.title}</td>
                  <td className="py-2.5"><span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-aims-navy/10 text-aims-navy">{p.stage}</span></td>
                  <td className="py-2.5 text-slate-600">{p.leadName}</td>
                  <td className="py-2.5"><div className="flex items-center gap-2"><div className="w-16 bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-aims-green" style={{ width: `${p.progressPercent}%` }} /></div><span className="text-xs font-bold text-slate-900">{p.progressPercent}%</span></div></td>
                  <td className="py-2.5 text-right"><button onClick={() => navigate(`/innovations/${p.id}`)} className="text-xs font-bold text-aims-navy hover:underline flex items-center gap-1 justify-end"><span className="material-symbols-outlined text-[14px]">open_in_new</span>View</button></td>
                </tr>
              ))}
              {execProjects.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-xs text-slate-400 italic">No innovation projects yet — approved proposals appear here once entered.</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>
      <Section title="Executive Feed" subtitle="Institutional announcements & governance communication">
        <div className="space-y-3">
          {feedPostsLive.length === 0 && <p className="text-xs text-slate-400 italic">No announcements posted yet — company feed posts appear here.</p>}
          {feedPostsLive.map((post, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100"><div className="flex items-center justify-between mb-1"><p className="text-sm font-bold text-slate-900">{post.author}</p><p className="text-[10px] text-slate-400">{new Date(post.time).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p></div><p className="text-sm text-slate-600">{post.content}</p></div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function EDDashboard() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const [expandedApproval, setExpandedApproval] = useState<string | null>(null);

  // Live requisition queue — decisions below really update the store.
  useLiveData(); // every value below re-renders on any AIMS write
  const liveReqs = useRequisitions();
  const edQueue = liveReqs.filter((r) => r.status === 'pushed' || r.status === 'returned');

  // ── LIVE aggregates (finance, attendance, grants, projects) ──
  const usd = (n: number) => (n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`);
  const edRoster = ACTIVE_STAFF.length;
  const edPresence = attendanceGet.presence();
  const edAttRows = edPresence.map((p) => ({
    name: p.name,
    dept: p.dept,
    checkIn: p.checkIn && p.checkIn !== '—' ? p.checkIn : '—',
    checkOut: '—',
    status: (p.mode === 'physical' ? 'present' : p.mode === 'remote' ? 'remote' : p.mode === 'leave' ? 'leave' : 'absent') as 'present' | 'late' | 'absent' | 'leave' | 'remote',
    location: p.location && p.location !== '—' ? p.location : '—',
  }));
  const edHistoryToday = attendanceGet.history().filter((h) => h.date === new Date().toISOString().slice(0, 10));
  const attPresentCount = edAttRows.filter((a) => a.status === 'present' || a.status === 'remote').length;
  const attLateCount = edHistoryToday.filter((h) => h.status === 'late').length;
  const attLeaveCount = edAttRows.filter((a) => a.status === 'leave').length;
  const attAbsentCount = edAttRows.filter((a) => a.status === 'absent').length;
  const edFinIncome = financeService.totalIncome();
  const edFinExpense = financeService.totalExpense();
  const edFinNet = edFinIncome - edFinExpense;
  const edCommitted = liveReqs.filter((r) => r.status === 'pushed' || r.status === 'approved').reduce((s, r) => s + (r.amount ?? 0), 0);
  const edGrantsOpen = grantService.getAllGrants().filter((g) => g.stage !== 'declined' && g.stage !== 'awarded');
  const edGrantsDue7 = edGrantsOpen.filter((g) => daysUntil(g.deadline) <= 7 && daysUntil(g.deadline) >= 0).length;
  const edExecProjects = innovationService.getAllProjects().filter(isExecutingProject);
  const edFlaggedProjects = edExecProjects.filter((p) => p.daysInStage > 14);

  const decide = (id: string, action: 'approved' | 'rejected', comment: string) => {
    mutateRequisitions((list) => {
      const target = list.find((x) => x.id === id);
      if (!target) return;
      target.status = action;
      target.updatedAt = new Date().toISOString();
      target.daysInStatus = 0;
      target.edDecision = { action, comment, date: new Date().toISOString() };
    });
    setExpandedApproval(null);
    showToast({ title: action === 'approved' ? 'Requisition Approved' : 'Requisition Rejected', message: `${id} ${action} with your comment recorded.`, type: action === 'approved' ? 'success' : 'info' });
  };

  const attendanceToday = edAttRows; // live rows from aims_attendance (today's register)

  // Company feed — persisted, real posts
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>(() => readFeedPosts());
  const [feedDraft, setFeedDraft] = useState('');
  const postFeed = () => {
    const content = feedDraft.trim();
    if (!content) { showToast({ title: 'Empty Post', message: 'Write an update before posting.', type: 'error' }); return; }
    const post: FeedPost = { id: `fp-${Date.now()}`, author: user?.name ?? 'ED', content, time: new Date().toISOString() };
    const next = [post, ...feedPosts];
    setFeedPosts(next);
    setFeedDraft('');
    saveJSON(STORAGE_KEYS.feed, next);
    showToast({ title: 'Posted', message: 'Your update is now visible on the company feed.', type: 'success' });
  };

  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="Executive Director Dashboard" subtitle="Operational execution, team leadership & daily management — sole approval authority" />
      <CheckInCard />

      {/* At a Glance strip — live counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => navigate('/approvals')} className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-orange p-4 shadow-sm text-left hover:shadow-md transition-shadow group">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Approvals Pending</p>
          <p className="text-2xl font-extrabold text-aims-orange mt-1">{edQueue.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{edQueue.filter((r) => r.daysInStatus >= 5).length} overdue (SLA aging) · <span className="text-aims-orange font-bold group-hover:underline">open queue</span></p>
        </button>
        <button onClick={() => navigate('/attendance')} className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-green p-4 shadow-sm text-left hover:shadow-md transition-shadow group">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attendance Today</p>
          <p className="text-2xl font-extrabold text-aims-green mt-1">{attPresentCount}/{edRoster}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{attLateCount} late · {attLeaveCount} leave · {attAbsentCount} absent · <span className="text-aims-green font-bold group-hover:underline">oversight</span></p>
        </button>
        <button onClick={() => navigate('/grants')} className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-navy p-4 shadow-sm text-left hover:shadow-md transition-shadow group">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Grants Due (7d)</p>
          <p className="text-2xl font-extrabold text-aims-navy mt-1">{edGrantsDue7}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">approaching deadline · <span className="text-aims-navy font-bold group-hover:underline">portfolio</span></p>
        </button>
        <button onClick={() => navigate('/approvals')} className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-red-500 p-4 shadow-sm text-left hover:shadow-md transition-shadow group">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CD Flags Awaiting</p>
          <p className="text-2xl font-extrabold text-red-500 mt-1">{flagService.getOpenFlags().length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">priority interrupts · <span className="text-red-500 font-bold group-hover:underline">resolve in queue</span></p>
        </button>
      </div>

      <ExecutiveBrief />

      {/* CD Flags — priority interrupts */}
      {flagService.getOpenFlags().length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 border-l-4 border-l-red-500 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">flag</span>CD Flags — Priority Interrupts ({flagService.getOpenFlags().length})</p>
            <button onClick={() => navigate('/approvals')} className="text-[11px] font-bold text-aims-navy hover:underline">Open Approvals Queue</button>
          </div>
          <div className="space-y-2">
            {flagService.getOpenFlags().map((f) => (
              <div key={f.id} className="flex items-start justify-between gap-3 p-3 bg-red-50/50 rounded-lg border border-red-100">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase', f.priority === 'critical' ? 'bg-red-500 text-white' : f.priority === 'high' ? 'bg-aims-orange text-white' : 'bg-slate-500 text-white')}>{f.priority === 'critical' ? '🚩 Critical' : f.priority === 'high' ? '🔶 High' : 'Medium'}</span>
                    {f.infoRequested && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-aims-navy text-white uppercase">Info requested</span>}
                    <span className="text-[10px] font-bold text-slate-500">{f.raisedBy}</span>
                    <span className="text-[10px] text-slate-400">{new Date(f.raisedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 mt-1">{f.recordLabel}</p>
                  <p className="text-xs text-slate-600 italic">"{f.note}"</p>
                </div>
                <button onClick={() => flagService.resolveFlag(f.id, user?.name ?? 'ED')} className="px-3 py-1.5 bg-aims-navy text-white text-[10px] font-bold rounded-lg hover:bg-aims-navy/90 shrink-0">Resolve</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Section title="Grant Approvals & Deadlines" subtitle="Grants awaiting your final decision — approve or request changes">
        <GrantReviewQueue />
      </Section>

      <Section title="Finance Record Changes - Pending Approval" subtitle="Finance edits to income, expenditure and budgets - nothing applies until you approve">
        <FinanceEditApprovals />
      </Section>

      <Section title="Your Pending Approvals" subtitle="Requisitions awaiting your decision — approve or reject straight from the live queue">
        <AdvancedFilterBar dateLabel="Submitted" statusOptions={['Awaiting Your Decision', 'Overdue', 'You Approved', 'You Rejected', 'Disbursed']} ownerOptions={['Finance Dept', 'HR Admin', 'Grants Team', 'Procurement', 'Innovation']} showAmountRange exportRows={edQueue.map((r) => ({ id: r.id, title: r.title, department: r.dept, requester: r.requester, amount: `UGX ${r.amount.toLocaleString()}`, status: r.status, daysInStatus: r.daysInStatus }))} exportFileName="ed-pending-approvals" />
        {edQueue.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-400 italic bg-slate-50 rounded-xl border border-slate-100">No requisitions are currently awaiting your decision.</div>
        )}
        <div className="space-y-3">
          {edQueue.map((item) => (
            <div key={item.id} className={cn('rounded-lg border transition-all', expandedApproval === item.id ? 'border-aims-navy shadow-md bg-white' : 'border-slate-200 bg-slate-50')}>
              <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setExpandedApproval(expandedApproval === item.id ? null : item.id)}>
                <div className="flex items-center gap-3"><span className="material-symbols-outlined text-slate-400 text-[18px]">{expandedApproval === item.id ? 'expand_less' : 'expand_more'}</span><div><p className="text-sm font-bold text-slate-900">{item.title}</p><p className="text-xs text-slate-500">Requisition • UGX {item.amount.toLocaleString()} • {item.id} • {item.requester} • {item.dept}</p></div></div>
                <div className="text-right flex items-center gap-3"><span className={cn('inline-block px-2 py-0.5 rounded text-[10px] font-bold', item.daysInStatus >= 5 ? 'bg-red-50 text-red-600' : item.daysInStatus >= 3 ? 'bg-aims-orange/15 text-aims-orange' : 'bg-slate-100 text-slate-600')}>{item.daysInStatus}d in {item.status}</span><span className="text-xs font-bold text-aims-navy">{expandedApproval === item.id ? 'Close' : 'Review'}</span></div>
              </div>
              {expandedApproval === item.id && (
                <div className="px-3 pb-3 space-y-3">
                  <div id={`req-detail-${item.id}`} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Purpose</p><p className="text-xs text-slate-700 mb-3">{item.purpose}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Budget Line</p><p className="text-xs text-slate-700 mb-3">{item.budgetLine}</p>
                    {item.edDecision && (
                      <div className="mb-3 p-2 bg-aims-orange/10 border border-aims-orange/20 rounded-lg"><p className="text-[10px] font-bold text-aims-orange uppercase tracking-wider">Previously returned: "{item.edDecision.comment}"</p></div>
                    )}
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Line Items</p>
                    <table className="w-full text-xs"><thead><tr className="border-b border-slate-200"><th className="pb-1 text-left text-slate-500">Item</th><th className="pb-1 text-right text-slate-500">Qty</th><th className="pb-1 text-right text-slate-500">Unit</th><th className="pb-1 text-right text-slate-500">Total</th></tr></thead><tbody className="divide-y divide-slate-100">{item.lineItems.map((li, idx) => <tr key={idx}><td className="py-1 text-slate-700">{li.item}</td><td className="py-1 text-right text-slate-600">{li.qty}</td><td className="py-1 text-right text-slate-600">{li.unit}</td><td className="py-1 text-right font-semibold text-slate-900">UGX {li.total.toLocaleString()}</td></tr>)}</tbody></table>
                  </div>
                  <ApprovalActionPanel itemName={item.title} itemType="Requisition" onViewFull={() => { const el = document.getElementById(`req-detail-${item.id}`); el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }} onApprove={(c) => decide(item.id, 'approved', c)} onReject={(c) => decide(item.id, 'rejected', c)} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Payslip Authorization" subtitle="Generate, review, and authorize payroll batches"><PayslipReviewPanel /></Section>
      <Section title="Monthly Cash Flow" subtitle="Income vs. expenditure — live from aims_finance (USD), updates as Finance records cash">
        <div className="space-y-5"><Bar label="Total Income" value={edFinIncome} max={Math.max(edFinIncome, edFinExpense, 1)} display={edFinIncome > 0 ? usd(edFinIncome) : '$0 — none entered yet'} color="green" /><Bar label="Total Expenditure" value={edFinExpense} max={Math.max(edFinIncome, edFinExpense, 1)} display={edFinExpense > 0 ? usd(edFinExpense) : '$0 — none entered yet'} color="orange" /></div>
        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center"><div><span className="text-sm font-semibold text-slate-600">Net Surplus</span><p className="text-[10px] text-slate-400">{edCommitted > 0 ? `Committed requisitions in flight: UGX ${(edCommitted / 1000000).toFixed(0)}M` : 'No requisitions committed yet'}</p></div><span className={cn('text-xl font-extrabold', edFinNet >= 0 ? 'text-aims-green' : 'text-red-500')}>{edFinIncome === 0 && edFinExpense === 0 ? '—' : usd(edFinNet)}</span></div>
      </Section>

      <Section title="Attendance Oversight" subtitle="Real-time presence — live from the attendance register">
        <AdvancedFilterBar dateLabel="Date" statusOptions={['Present', 'Late', 'Absent', 'Leave', 'Remote']} ownerOptions={['Grants', 'Finance', 'HR', 'Innovation', 'Research', 'Procurement']} exportRows={attendanceToday} exportFileName="ed-attendance-oversight" />
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-aims-green/10 rounded-lg border border-aims-green/20"><span className="material-symbols-outlined text-aims-green text-[18px]">check_circle</span><span className="text-sm font-bold text-aims-green">{attPresentCount} Present</span></div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-aims-orange/10 rounded-lg border border-aims-orange/20"><span className="material-symbols-outlined text-aims-orange text-[18px]">schedule</span><span className="text-sm font-bold text-aims-orange">{attLateCount} Late</span></div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-aims-mint/30 rounded-lg border border-aims-mint/60"><span className="material-symbols-outlined text-aims-navy text-[18px]">event_available</span><span className="text-sm font-bold text-aims-navy">{attLeaveCount} On Leave</span></div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-100"><span className="material-symbols-outlined text-red-500 text-[18px]">cancel</span><span className="text-sm font-bold text-red-500">{attAbsentCount} Absent</span></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200"><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Employee</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Department</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Check In</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Check Out</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Status</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Location</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {attendanceToday.map((emp, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors"><td className="py-2.5 font-bold text-slate-900">{emp.name}</td><td className="py-2.5 text-slate-600">{emp.dept}</td><td className="py-2.5 text-slate-600 font-mono text-xs">{emp.checkIn}</td><td className="py-2.5 text-slate-600 font-mono text-xs">{emp.checkOut}</td><td className="py-2.5"><span className={cn('inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide', emp.status === 'present' ? 'bg-aims-green/15 text-aims-green' : emp.status === 'late' ? 'bg-aims-orange/15 text-aims-orange' : emp.status === 'leave' ? 'bg-aims-mint/30 text-aims-navy' : emp.status === 'remote' ? 'bg-aims-navy/10 text-aims-navy' : 'bg-red-50 text-red-500')}>{emp.status}</span></td><td className="py-2.5 text-slate-500 text-xs">{emp.location}</td></tr>
              ))}
              {attendanceToday.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-sm text-slate-400 italic">No attendance records today — check-ins appear here live as staff check in.</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="HR & People Management" subtitle="Full workforce administration — the same module available to Company Administration">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { tab: 'directory', label: 'People Directory', icon: 'people' },
            { tab: 'payslips', label: 'Payslips', icon: 'payments' },
            { tab: 'leave', label: 'Leave', icon: 'event_available' },
            { tab: 'contracts', label: 'Contracts', icon: 'description' },
            { tab: 'appraisals', label: 'Appraisals', icon: 'assessment' },
            { tab: 'offboarding', label: 'Offboarding', icon: 'person_remove' },
          ].map((item) => (
            <button key={item.tab} onClick={() => navigate('/hr', { state: { tab: item.tab } })} className="p-4 bg-aims-navy/5 hover:bg-aims-navy/10 rounded-xl border border-aims-navy/20 transition-colors text-left group">
              <span className="material-symbols-outlined text-aims-navy text-[22px] group-hover:scale-110 transition-transform">{item.icon}</span>
              <p className="text-xs font-bold text-slate-900 mt-2">{item.label}</p>
              <p className="text-[10px] text-aims-navy font-bold mt-0.5 group-hover:underline">Open module</p>
            </button>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center flex-wrap gap-2">
          <p className="text-xs text-slate-500">Workforce administration, contracts, leave, appraisals &amp; offboarding — same access as Company Administration.</p>
          <button onClick={() => navigate('/hr')} className="text-xs font-bold text-aims-navy hover:underline flex items-center gap-1 shrink-0">
            Open full HR module <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
      </Section>

      <Section title="Innovation Pipeline Flags" subtitle="Projects needing attention — stalled in stage or flagged — live from aims_projects">
        <div className="space-y-3">
          {edFlaggedProjects.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-400 italic bg-slate-50 rounded-xl border border-slate-100">No flagged or stalled innovation projects right now — they appear here automatically once projects stall or are flagged.</div>
          )}
          {edFlaggedProjects.map((p) => (
            <div key={p.id} className="rounded-lg border p-4 bg-red-50/50 border-red-200">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">{p.title}</p>
                  <p className="text-xs text-slate-500">{p.stage} • Lead: {p.leadName} • <span className="font-bold text-red-500">{p.daysInStage}d in stage</span></p>
                </div>
                <button onClick={() => navigate(`/innovations/${p.id}`)} className="text-xs font-bold text-aims-navy hover:underline flex items-center gap-1 flex-shrink-0"><span className="material-symbols-outlined text-[14px]">open_in_new</span>Open</button>
              </div>
              <div className="flex items-center gap-1.5 mt-2"><span className="material-symbols-outlined text-red-500 text-[14px]">warning</span><span className="text-xs font-bold text-red-500">Stalled: No activity for {p.daysInStage} days — may need intervention</span></div>
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
          <div className="flex gap-2 mb-2"><input type="text" placeholder="Share an update with all departments…" value={feedDraft} onChange={(e) => setFeedDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') postFeed(); }} className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30" /><button onClick={postFeed} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 transition-colors">Post</button></div>
          {feedPosts.map((post) => (
            <div key={post.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100"><div className="flex items-center justify-between mb-1"><p className="text-sm font-bold text-slate-900">{post.author}</p><p className="text-[10px] text-slate-400">{new Date(post.time).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p></div><p className="text-sm text-slate-600">{post.content}</p></div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  if (!user) return null;

  const go = (path: string, tab?: string) => navigate(path, { state: tab ? { tab } : undefined });

  const atAGlance = [
    { key: 'onboarding', label: 'Pending Onboarding', value: '3', icon: 'person_add', color: 'orange' as ColorKey, onClick: () => go('/user-management', 'onboarding') },
    { key: 'contracts', label: 'Contracts Expiring', value: '2', icon: 'description', color: 'navy' as ColorKey, onClick: () => go('/hr', 'contracts') },
    { key: 'appraisals', label: 'Appraisals Complete', value: '78%', icon: 'fact_check', color: 'green' as ColorKey, onClick: () => go('/hr', 'performance') },
    { key: 'anomalies', label: 'Attendance Anomalies', value: '5', icon: 'warning', color: 'red' as ColorKey, onClick: () => go('/attendance', 'anomalies') },
  ];

  const summaryStats = [
    { label: 'Total Staff', value: '142', icon: 'group', sub: 'across 8 departments' },
    { label: 'Departments', value: '8', icon: 'apartment', sub: 'fully staffed' },
    { label: 'Open Tickets', value: '12', icon: 'support_agent', sub: 'HR & admin requests' },
    { label: 'Compliance', value: '94%', icon: 'verified_user', sub: 'policy adherence' },
  ];

  const quickActions = [
    { label: 'View Pending Onboarding', icon: 'person_add', onClick: () => go('/user-management', 'onboarding') },
    { label: 'Review Expiring Contracts', icon: 'description', onClick: () => go('/hr', 'contracts') },
    { label: 'Check Attendance Anomalies', icon: 'warning', onClick: () => go('/attendance', 'anomalies') },
    { label: 'Manage Open Tickets', icon: 'support_agent', onClick: () => showToast({ title: 'Ticket System', message: 'The ticketing module is planned as a future module.', type: 'info' }) },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Admin Dashboard</h1>
        <p className="text-base font-medium text-white">Welcome back, {user.name} | Last login: Today 9:15 AM</p>
      </div>

      {/* At a Glance strip — clickable, deep-links to source module */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {atAGlance.map((s) => (
          <button key={s.key} onClick={s.onClick} className={cn('bg-white rounded-xl border border-slate-200 border-t-4 p-4 shadow-sm text-left hover:shadow-md transition-shadow group', s.color === 'red' ? 'border-t-red-500' : s.color === 'orange' ? 'border-t-aims-orange' : s.color === 'green' ? 'border-t-aims-green' : 'border-t-aims-navy')}>
            <div className="flex items-center justify-between mb-2">
              <span className={cn('w-9 h-9 rounded-lg flex items-center justify-center', s.color === 'red' ? 'bg-red-50 text-red-500' : s.color === 'orange' ? 'bg-aims-orange/10 text-aims-orange' : s.color === 'green' ? 'bg-aims-green/10 text-aims-green' : 'bg-aims-navy/10 text-aims-navy')}>
                <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
              </span>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-aims-navy transition-colors text-[18px]">open_in_new</span>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{s.value}</p>
            <p className="text-xs font-bold text-slate-600 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Summary statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-aims-green text-[20px]">{s.icon}</span>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{s.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* AI Insight block */}
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-aims-navy p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-8 h-8 rounded-lg bg-aims-navy/10 flex items-center justify-center"><span className="material-symbols-outlined text-aims-navy text-[20px]">auto_awesome</span></span>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">System Summary (AI-Generated)</h3>
            <p className="text-[10px] font-bold text-aims-navy uppercase tracking-wider">Powered by Tier 1 AI — Insights</p>
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-100 p-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            "3 employment contracts expire this month with no renewal documentation drafted yet. Recommend immediate engagement with affected employees. Additionally, attendance anomalies are up 40% week-on-week, with 5 geofence failures recorded today. Consider a comms reminder on check-in procedures."
          </p>
        </div>
      </div>

      {/* Quick action links */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <button key={a.label} onClick={a.onClick} className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-aims-navy/30 hover:bg-aims-navy/5 transition-colors text-left">
              <span className="w-9 h-9 rounded-lg bg-aims-navy/10 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-aims-navy text-[20px]">{a.icon}</span></span>
              <span className="text-xs font-bold text-slate-700">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FinanceDashboard() {
  const { user } = useAuth();
  const showCheckIn = user?.role === 'FINANCE';
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const pendingEdits = financeService.getPendingEdits();
  const budgets = financeService.getBudgets();

  const fmtUSD = (n: number) => (n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : `${n}`);

  // Requisition pipeline (mirrors the Requisition Queue workspace)
  const awaitingED = [
    { id: 'req-047', title: 'Proc Req #47 — Office Equipment (DELL Laptops × 15)', amount: 85000, days: 2, dept: 'Ops' },
    { id: 'req-045', title: 'Cap Req #5 — IT Infrastructure (Server & Storage)', amount: 340000, days: 0, dept: 'IT' },
  ];
  const returnedToMe = [
    { id: 'req-043', title: 'Proc Req #43 — Travel Budget (Conference)', amount: 52000, days: 1, edNote: 'Requires quote from alternative vendor. Current quote is 12% above market rate. Resubmit by Aug 30 with competitive bid. -Ed' },
  ];
  const draftCount = 4;
  const pendingCount = awaitingED.length;
  const returnedCount = returnedToMe.length;

  const totalIncome = financeService.totalIncome();
  const totalExpense = financeService.totalExpense();
  const net = totalIncome - totalExpense;

  const getAgingColor = (days: number) => (days >= 3 ? 'bg-red-50 text-red-600 border-red-200' : days >= 1 ? 'bg-aims-orange/15 text-aims-orange border-aims-orange/30' : 'bg-aims-green/15 text-aims-green border-aims-green/30');

  const headline = [
    { label: 'Pending Requisitions (Mine)', value: String(draftCount + pendingCount + returnedCount), sub: `${returnedCount} need your revision`, icon: 'request_quote', color: 'orange' as ColorKey, onClick: () => navigate('/approvals') },
    { label: 'Disbursed This Month', value: '$2.4M', sub: 'across 47 requisitions', icon: 'payments', color: 'green' as ColorKey, onClick: () => navigate('/finance') },
    { label: 'Budget Utilization', value: '68%', sub: 'quarterly · 1 dept over 90%', icon: 'monitoring', color: 'navy' as ColorKey, onClick: () => navigate('/finance') },
    { label: 'Cash Position', value: '$5.2M', sub: 'liquid · ▲ 8% vs. last month', icon: 'account_balance', color: 'mint' as ColorKey, onClick: () => navigate('/finance') },
  ];

  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="Finance Operational Center" subtitle={`Department: Finance | Reports to: ED — ${user?.name ?? ''}`} />
      {showCheckIn && <CheckInCard />}

      {/* Headline stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {headline.map((s) => (
          <button key={s.label} onClick={s.onClick} className={cn('bg-white rounded-xl border border-slate-200 border-t-4 p-4 shadow-sm text-left hover:shadow-md transition-shadow group', s.color === 'red' ? 'border-t-red-500' : s.color === 'orange' ? 'border-t-aims-orange' : s.color === 'green' ? 'border-t-aims-green' : s.color === 'mint' ? 'border-t-aims-mint' : 'border-t-aims-navy')}>
            <div className="flex items-center justify-between mb-2">
              <span className={cn('w-9 h-9 rounded-lg flex items-center justify-center', s.color === 'red' ? 'bg-red-50 text-red-500' : s.color === 'orange' ? 'bg-aims-orange/10 text-aims-orange' : s.color === 'green' ? 'bg-aims-green/10 text-aims-green' : s.color === 'mint' ? 'bg-aims-mint/30 text-aims-green' : 'bg-aims-navy/10 text-aims-navy')}>
                <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
              </span>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-aims-navy transition-colors text-[18px]">open_in_new</span>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{s.value}</p>
            <p className="text-xs font-bold text-slate-600 mt-0.5">{s.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
          </button>
        ))}
      </div>

      {/* At a Glance strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5"><span className="material-symbols-outlined text-aims-navy text-[16px]">hourglass_top</span>Requisitions to ED (aging)</p>
            <span className="text-[10px] font-extrabold text-aims-navy">{pendingCount}</span>
          </div>
          {awaitingED.map((r) => (
            <div key={r.id} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-50 last:border-0">
              <span className="text-slate-600 truncate max-w-[200px]">{r.title}</span>
              <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold border', getAgingColor(r.days))}>{r.days === 0 ? '<1d' : `${r.days}d`}</span>
            </div>
          ))}
          <button onClick={() => navigate('/approvals')} className="mt-2 text-[11px] font-bold text-aims-navy hover:underline flex items-center gap-0.5">Open Requisition Queue <span className="material-symbols-outlined text-[12px]">arrow_forward</span></button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5"><span className="material-symbols-outlined text-red-500 text-[16px]">assignment_return</span>Returned / Needs Revision</p>
            <span className="text-[10px] font-extrabold text-red-600">{returnedCount}</span>
          </div>
          {returnedToMe.map((r) => (
            <div key={r.id} className="py-1 border-b border-slate-50 last:border-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600 truncate max-w-[200px]">{r.title}</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-600">{r.days}d ago</span>
              </div>
              <p className="text-[10px] text-slate-400 italic mt-0.5 line-clamp-2">"{r.edNote}"</p>
            </div>
          ))}
          <button onClick={() => navigate('/approvals')} className="mt-2 text-[11px] font-bold text-red-600 hover:underline flex items-center gap-0.5">Revise now <span className="material-symbols-outlined text-[12px]">arrow_forward</span></button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5"><span className="material-symbols-outlined text-aims-orange text-[16px]">warning</span>Budget Utilization Warning</p>
          </div>
          <p className="text-[11px] text-slate-600">HR & Admin pacing <strong className="text-aims-orange">4% ahead</strong> of quarterly schedule (77% used, 95% year-end forecast).</p>
          <p className="text-[10px] text-slate-400 mt-1">Recommend contingency review by month-end.</p>
          <button onClick={() => navigate('/finance')} className="mt-2 text-[11px] font-bold text-aims-navy hover:underline flex items-center gap-0.5">Review budgets <span className="material-symbols-outlined text-[12px]">arrow_forward</span></button>
        </div>
      </div>

      {/* Pending finance edits banner */}
      {pendingEdits.length > 0 && (
        <div className="bg-aims-orange/10 border border-aims-orange/30 rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-aims-orange text-[22px] mt-0.5">approval</span>
          <div className="flex-1">
            <p className="text-xs font-bold text-aims-orange">Finance Record Changes — {pendingEdits.length} awaiting ED approval</p>
            <p className="text-sm text-slate-700 mt-1">Changes you submitted are pending executive approval and are not yet applied.</p>
          </div>
          <button onClick={() => navigate('/finance')} className="text-[11px] font-bold text-aims-navy hover:underline shrink-0">View pending</button>
        </div>
      )}

      {/* Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="My Requisitions" subtitle="Drafts, pushed and returned — one glance">
          <div className="space-y-2">
            <button onClick={() => navigate('/approvals')} className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-aims-navy/5 transition-colors">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-2"><span className="material-symbols-outlined text-slate-500 text-[16px]">edit_note</span>My Drafts</span>
              <span className="text-lg font-extrabold text-aims-navy">{draftCount}</span>
            </button>
            <button onClick={() => navigate('/approvals')} className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-aims-navy/5 transition-colors">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-2"><span className="material-symbols-outlined text-aims-orange text-[16px]">hourglass_top</span>Pushed to ED (awaiting)</span>
              <span className="text-lg font-extrabold text-aims-orange">{pendingCount}</span>
            </button>
            <button onClick={() => navigate('/approvals')} className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-aims-navy/5 transition-colors">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-2"><span className="material-symbols-outlined text-red-500 text-[16px]">assignment_return</span>Returned / Revise</span>
              <span className="text-lg font-extrabold text-red-500">{returnedCount}</span>
            </button>
          </div>
          <button onClick={() => navigate('/approvals')} className="w-full mt-3 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">request_quote</span>New Requisition
          </button>
        </Section>

        <Section title="Cash Flow Snapshot" subtitle="Income vs. expenditure — drill to analytics">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-aims-green/5 rounded-lg border border-aims-green/20"><p className="text-[10px] font-bold text-slate-500 uppercase">Monthly Income</p><p className="text-xl font-extrabold text-aims-green mt-1">{fmtUSD(totalIncome)}</p></div>
            <div className="p-3 bg-aims-orange/5 rounded-lg border border-aims-orange/20"><p className="text-[10px] font-bold text-slate-500 uppercase">Monthly Expenses</p><p className="text-xl font-extrabold text-aims-orange mt-1">{fmtUSD(totalExpense)}</p></div>
            <div className="p-3 bg-aims-navy/5 rounded-lg border border-aims-navy/20"><p className="text-[10px] font-bold text-slate-500 uppercase">Net Position</p><p className={cn('text-xl font-extrabold mt-1', net >= 0 ? 'text-aims-green' : 'text-red-500')}>{net >= 0 ? '+' : ''}{fmtUSD(net)}</p></div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Forecast (12/31)</p><p className="text-xl font-extrabold text-aims-navy mt-1">+$3.1M</p></div>
          </div>
          <button onClick={() => navigate('/finance')} className="w-full mt-3 py-2 border border-aims-navy/20 text-aims-navy text-xs font-bold rounded-lg hover:bg-aims-navy/5 flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">analytics</span>Drill to Full Analytics
          </button>
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Budget Utilization by Department" subtitle="Year-end forecast vs. healthy range 75-90%">
          <div className="space-y-3">
            {budgets.map((b) => {
              const pct = Math.round((b.actual / b.budget) * 100);
              const warn = b.forecastPct >= 90;
              return (
                <div key={b.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">{b.dept}</span>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border', warn ? 'text-red-600 bg-red-50 border-red-200' : pct >= 75 ? 'text-aims-orange bg-aims-orange/10 border-aims-orange/20' : 'text-aims-green bg-aims-green/10 border-aims-green/20')}>{pct}% used{warn ? ' ⚠️' : ''}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2"><div className={cn('h-2 rounded-full', warn ? 'bg-red-500' : pct >= 75 ? 'bg-aims-orange' : 'bg-aims-green')} style={{ width: `${Math.min(100, pct)}%` }} /></div>
                </div>
              );
            })}
          </div>
          <button onClick={() => navigate('/finance')} className="w-full mt-3 py-2 border border-aims-navy/20 text-aims-navy text-xs font-bold rounded-lg hover:bg-aims-navy/5 flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">monitoring</span>Drill to Full Analytics
          </button>
        </Section>

        <Section title="AI Insight" subtitle="Auto-generated anomaly flags — updated daily">
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-700"><span className="font-extrabold text-aims-navy">① Waste pillar procurement</span> is pacing 15% above quarterly phasing. Recommend review of the Q4 spending plan to maintain budget alignment.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-700"><span className="font-extrabold text-aims-navy">② HR & Admin</span> trending toward 95% budget utilization by year-end — current pace suggests a $180K overage. Recommend review of the contingency staffing plan by month-end.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-700"><span className="font-extrabold text-aims-navy">③ 3 requisitions returned from ED</span> for revision in the past week. Consider reviewing feedback patterns to improve first-pass approval rate.</p>
            </div>
            <button onClick={() => navigate('/finance')} className="text-[11px] font-bold text-aims-navy hover:underline flex items-center gap-0.5">Open cash flow analytics <span className="material-symbols-outlined text-[12px]">arrow_forward</span></button>
          </div>
        </Section>
      </div>

      {/* Quick actions */}
      <Section title="Quick Actions" subtitle="Start a workflow">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button onClick={() => navigate('/approvals', { state: { new: true } })} className="p-4 bg-aims-navy/5 hover:bg-aims-navy/10 rounded-xl border border-aims-navy/20 transition-colors text-left">
            <span className="material-symbols-outlined text-aims-navy text-[24px] mb-2">request_quote</span>
            <p className="text-sm font-bold text-slate-900">New Requisition</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Draft & push to ED</p>
          </button>
          <button onClick={() => showToast({ title: 'Template Loaded', message: 'Standard requisition template loaded from Shared Reference Library.', type: 'success' })} className="p-4 bg-aims-green/5 hover:bg-aims-green/10 rounded-xl border border-aims-green/20 transition-colors text-left">
            <span className="material-symbols-outlined text-aims-green text-[24px] mb-2">description</span>
            <p className="text-sm font-bold text-slate-900">Use Template</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Requisition form template</p>
          </button>
          <button onClick={() => navigate('/finance')} className="p-4 bg-aims-orange/5 hover:bg-aims-orange/10 rounded-xl border border-aims-orange/20 transition-colors text-left">
            <span className="material-symbols-outlined text-aims-orange text-[24px] mb-2">analytics</span>
            <p className="text-sm font-bold text-slate-900">Cash Flow & Reports</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Analytics + CSV/PDF export</p>
          </button>
          <button onClick={() => navigate('/approvals')} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors text-left">
            <span className="material-symbols-outlined text-slate-600 text-[24px] mb-2">fact_check</span>
            <p className="text-sm font-bold text-slate-900">Approvals Queue</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Track ED decisions</p>
          </button>
        </div>
      </Section>
    </div>
  );
}

function GrantDashboard() {
  const { user } = useAuth();
  const grants = grantService.getAllGrants();
  const showCheckIn = user?.role === 'GRANT_WRITER' || user?.role === 'GRANTS_MANAGER';
  const unassigned = grants.filter((g) => !g.handler || g.handler === 'Unassigned').length;
  const active = grants.filter((g) => !['awarded', 'declined'].includes(g.stage)).length;
  const pipelineTotal = grants.filter((g) => !['awarded', 'declined'].includes(g.stage)).reduce((s, g) => s + g.amountRequested, 0);
  const pipelineLabel = pipelineTotal >= 1000000000 ? `UGX ${(pipelineTotal / 1000000000).toFixed(1)}B` : `UGX ${(pipelineTotal / 1000000).toFixed(0)}M`;
  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="Grants & Proposals" subtitle="Discover, claim and track grants — AI-assisted drafting & deadline tracking" />
      {showCheckIn && <CheckInCard />}
      {/* Stage counts — whole organizational pipeline */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {GRANT_STAGES.map((s) => {
          const count = grants.filter((g) => g.stage === s.key).length;
          return (
            <div key={s.key} className={cn('bg-white rounded-xl border border-slate-200 border-t-4 p-4 shadow-sm text-center', s.color === 'red' ? 'border-t-red-500' : s.color === 'green' ? 'border-t-aims-green' : s.color === 'orange' ? 'border-t-aims-orange' : s.color === 'mint' ? 'border-t-aims-mint' : 'border-t-aims-navy')}>
              <p className="text-2xl font-extrabold text-slate-900">{count}</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <StatCard title="Active Proposals" value={String(active)} icon="edit_note" color="navy" />
        <StatCard title="Unassigned — Claimable" value={String(unassigned)} icon="handshake" color="orange" />
        <StatCard title="Pipeline (Active)" value={pipelineLabel} icon="workspace_premium" color="green" />
        <StatCard title="AI Assists" value="28" icon="smart_toy" color="mint" />
      </div>
      <SharedLibraryWidget />
      <Section title="Grants Assistant" subtitle="Fine-tuned on ARDHI's documents & the grants tracker — ask about history, missed deadlines and live opportunities">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-xl bg-aims-green/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-aims-green text-[26px]">smart_toy</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Chat with the grants knowledge base</p>
              <p className="text-xs text-slate-500 mt-0.5">Trained on the Organisational Profile, 5-Year Strategic Plan, policies and the August 2026 Grants Tracker.</p>
            </div>
          </div>
          <button onClick={openGrantsAssistant} className="px-5 py-2.5 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 transition-colors flex items-center justify-center gap-1.5 shrink-0">
            <span className="material-symbols-outlined text-[16px]">forum</span>Open Grants Assistant
          </button>
        </div>
      </Section>
      <Section title="Grants Pipeline" subtitle="Full organizational pipeline — express interest on unassigned grants, open any grant to work on it">
        <GrantsPipelineBoard />
      </Section>
    </div>
  );
}

// REFACTORED INNOVATOR DASHBOARD - Shows ALL projects for strategic overview
function InnovatorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const showCheckIn = user?.role === 'INNOVATOR';
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('list');

  // FIX: Use getAllProjects to show the ENTIRE organizational pipeline (drafts/reviews excluded)
  const projects = innovationService.getAllProjects().filter(isExecutingProject);
  const STAGES = innovationService.getStages();

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

  // Per-persona workload (used by strategic roles for oversight)
  const byLead = useMemo(() => {
    const map = new Map<string, typeof projects[number][]>();
    projects.forEach((p) => {
      const list = map.get(p.leadName) ?? [];
      list.push(p);
      map.set(p.leadName, list);
    });
    return Array.from(map.entries()).map(([lead, ps]) => ({
      lead,
      count: ps.length,
      avg: Math.round(ps.reduce((s, p) => s + p.progressPercent, 0) / ps.length),
      stages: Array.from(new Set(ps.map((p) => p.stage))),
    }));
  }, [projects]);

  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="Innovation Pipeline" subtitle="Research execution, prototyping & production tracking" />
      {showCheckIn && <CheckInCard />}
      <SharedLibraryWidget />
      
      {/* Stats for ALL projects */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {STAGES.map((s) => {
          const count = projects.filter((p) => p.stage === s.key).length;
          return (<div key={s.key} className={cn('bg-white rounded-xl border border-slate-200 border-t-4 p-4 shadow-sm text-center', ACCENT[s.color])}><p className="text-2xl font-extrabold text-slate-900">{count}</p><p className="text-xs font-semibold text-slate-500 mt-1">{s.label}</p></div>);
        })}
      </div>

      {user && (user.role === 'CD' || user.role === 'ED') && (
        <Section title="Oversight by Persona" subtitle="Strategic view — workload and stage distribution across every innovation team">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {byLead.map(({ lead, count, avg, stages }) => (
              <div key={lead} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-slate-900">{lead}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-aims-navy/10 text-aims-navy">{count} project{count !== 1 ? 's' : ''}</span>
                </div>
                <div className="mb-2"><div className="w-full bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-aims-green" style={{ width: `${avg}%` }} /></div></div>
                <p className="text-[10px] text-slate-500 mb-2">Avg progress {avg}%</p>
                <div className="flex flex-wrap gap-1">{stages.map((s) => <span key={s} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 capitalize">{s}</span>)}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center bg-slate-100 rounded-lg p-1">
          <button onClick={() => setViewMode('kanban')} className={cn('px-4 py-1.5 rounded-md text-xs font-bold transition-all', viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}><span className="material-symbols-outlined text-[14px] align-middle mr-1">view_kanban</span>Kanban</button>
          <button onClick={() => setViewMode('list')} className={cn('px-4 py-1.5 rounded-md text-xs font-bold transition-all', viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}><span className="material-symbols-outlined text-[14px] align-middle mr-1">view_list</span>List</button>
        </div>
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
                      <p className="text-[10px] text-slate-500 mb-1">Lead: {p.leadName} • {p.contributorNames.length > 0 ? `${p.contributorNames.join(', ')}` : 'no contributors'}</p>
                      <div className="mb-2"><div className="w-full bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-aims-green" style={{ width: `${p.progressPercent}%` }} /></div></div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold text-slate-500">{p.milestones?.filter(m => m.completed).length || 0}/{p.milestones?.length || 0} milestones</span>
                        <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-bold', getAgingColor(p.daysInStage))}><span className={cn('w-1.5 h-1.5 rounded-full', getAgingDot(p.daysInStage))} />{p.daysInStage}d</div>
                      </div>
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
                    <td className="py-2.5 text-slate-600">{p.leadName}</td>
                    <td className="py-2.5 text-slate-500 text-xs">{p.contributorNames.join(', ')}</td>
                    <td className="py-2.5"><div className="flex items-center gap-2"><div className="w-16 bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-aims-green" style={{ width: `${p.progressPercent}%` }} /></div><span className="text-xs font-bold text-slate-900">{p.progressPercent}%</span></div></td>
                    <td className="py-2.5 text-xs text-slate-600">{p.milestones?.filter(m => m.completed).length || 0}/{p.milestones?.length || 0}</td>
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
  const navigate = useNavigate();
  const [showAuditLog, setShowAuditLog] = useState(false);
  const managedUsers = userOpsGet.users();
  const auditTrail = userOpsGet.audit();
  const auditEntries = [
    { time: '2026-08-22 07:42:18', user: 'Janet Apio', role: 'GRANT_WRITER', action: 'check_in', distance: '342m', coords: '0.3034°N, 32.5897°E', ip: '41.220.138.44' },
    { time: '2026-08-22 08:15:03', user: 'David Okello', role: 'FINANCE', action: 'check_in', distance: '1.2km', coords: '0.3112°N, 32.5845°E', ip: '102.82.91.12' },
    { time: '2026-08-21 17:31:45', user: 'Isaac Tumusiime', role: 'COMPANY_ADMIN', action: 'check_out', distance: '890m', coords: '0.2921°N, 32.5998°E', ip: '41.220.138.67' },
  ];
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

      {/* System status — all systems operational */}
      <div className="rounded-xl border border-aims-green/30 bg-aims-green/5 p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="relative flex w-3 h-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aims-green opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-aims-green" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-slate-900">System Status: <span className="text-aims-green">Active — all systems operational</span></p>
            <p className="text-[11px] text-slate-500 mt-0.5">Core modules, attendance, AI proxy and email endpoints reporting healthy.</p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-aims-navy/10 text-aims-navy font-mono">AIMS v{DATA_VAULT_VERSION} · baseline {DATA_VAULT_BASELINE}</span>
      </div>

      {/* Live administration widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => navigate('/user-management')} className="text-left bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-navy p-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">Total Users<span className="material-symbols-outlined text-aims-navy text-[15px]">group</span></p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{managedUsers.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">managed accounts · ARD-EMP codes</p>
        </button>
        <button onClick={() => navigate('/rbac?tab=audit')} className="text-left bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-orange p-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">Audit Events<span className="material-symbols-outlined text-aims-orange text-[15px]">shield</span></p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{auditTrail.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">role changes, resets & security actions</p>
        </button>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-green p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">Active Roster<span className="material-symbols-outlined text-aims-green text-[15px]">badge</span></p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{ACTIVE_STAFF.length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">active staff in the personnel roster</p>
        </div>
        <button onClick={() => navigate('/settings')} className="text-left bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-mint p-4 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">Data Vault Exports<span className="material-symbols-outlined text-aims-navy text-[15px]">database</span></p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{financeService.getExportLog().length}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">backups & exports recorded this session</p>
        </button>
      </div>

      {/* Server services & environment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-aims-navy text-[18px]">dns</span>Server Services</h3>
          <div className="space-y-2">
            {[
              { name: '/api/chat.js — AI proxy', detail: 'Routes to Claude / GPT / DeepSeek / Qwen', ok: true },
              { name: '/api/email.js — SMTP relay', detail: 'Credentials delivery & notifications', ok: true },
              { name: 'Data Vault persistence', detail: 'localStorage via unified storage layer', ok: true },
              { name: 'Netlify function hosting', detail: 'api/chat + api/email endpoints', ok: true },
            ].map((s) => (
              <div key={s.name} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <div><p className="text-xs font-bold text-slate-900 font-mono">{s.name}</p><p className="text-[10px] text-slate-500">{s.detail}</p></div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-aims-green/15 text-aims-green uppercase shrink-0">Online</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-aims-navy text-[18px]">settings_suggest</span>Environment Configuration</h3>
          <div className="space-y-2">
            {[
              { env: 'SMTP_HOST / SMTP_KEY', note: 'Email sending configured at deploy time' },
              { env: 'DEEPSEEK_API_KEY', note: 'DeepSeek provider' },
              { env: 'ANTHROPIC_API_KEY', note: 'Claude provider' },
              { env: 'OPENAI_API_KEY', note: 'GPT-4o Mini provider' },
              { env: 'QWEN_API_KEY', note: 'Qwen Plus provider' },
            ].map((v) => (
              <div key={v.env} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-xs font-mono font-bold text-slate-900">{v.env}</p>
                <p className="text-[10px] text-slate-500 text-right">{v.note}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 italic mt-2">Keys are read server-side by the Netlify functions — the built-in engine answers locally when none are set.</p>
        </div>
      </div>

      {/* Recent audit summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2"><span className="material-symbols-outlined text-aims-navy text-[18px]">verified_user</span>Audit Logs Summary — Latest Security & Role Events</h3>
          <button onClick={() => navigate('/rbac?tab=audit')} className="text-[10px] font-bold text-aims-navy hover:underline flex items-center gap-1">Open full audit log<span className="material-symbols-outlined text-[12px]">open_in_new</span></button>
        </div>
        {auditTrail.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No audit events recorded yet (clean system). Role changes, resets and security actions appear here automatically.</p>
        ) : (
          <div className="space-y-1.5">
            {auditTrail.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-aims-navy text-[14px] shrink-0">history</span>
                  <p className="truncate text-slate-700"><span className="font-bold">{a.user}</span> — {a.action} <span className="text-slate-400">by {a.by}</span></p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">{new Date(a.ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        )}
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
          <AdvancedFilterBar dateLabel="Attempt Time" statusOptions={['Blocked', 'Flagged']} ownerOptions={['CD', 'ED', 'COMPANY_ADMIN', 'FINANCE', 'GRANTS_MANAGER', 'GRANT_WRITER', 'INNOVATOR']} exportRows={auditEntries} exportFileName="geofence-violation-audit-log" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-slate-200"><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Timestamp</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">User</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Role</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Action</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Distance</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Coordinates</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">IP Address</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {auditEntries.map((entry, i) => (
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
  const navigate = useNavigate();
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
                    <button onClick={() => navigate('/hr', { state: { tab: 'contracts' } })} className="text-[10px] font-bold text-aims-navy hover:underline">Renew in HR module</button>
                    <button onClick={() => navigate('/hr', { state: { tab: 'contracts' } })} className="text-[10px] font-bold text-slate-500 hover:underline">View</button>
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
                  <div className="bg-white rounded-lg p-3 border border-aims-navy/20 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-xs text-slate-600"><span className="material-symbols-outlined text-aims-navy text-[18px]">description</span>Contract decisions are completed in the HR &amp; Contracts module.</div>
                    <button onClick={() => navigate('/hr', { state: { tab: 'contracts' } })} className="px-3 py-1.5 bg-aims-navy text-white text-[10px] font-bold rounded-lg hover:bg-aims-navy/90 shrink-0">Open HR &amp; Contracts</button>
                  </div>
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
  const navigate = useNavigate();

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
                <button onClick={() => navigate('/inventory')} className="text-xs font-bold text-aims-navy hover:underline">View in Inventory</button>
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