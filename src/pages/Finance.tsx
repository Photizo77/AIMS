// src/pages/Finance.tsx
import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { financeService, type FinanceRecordType } from '@/services/financeService';
import { FormsShortcut } from '@/components/forms/FormsShortcut';
import { AIPanel } from '@/components/ai/AIPanel';
import { requisitionPriceFlags, cashFlowForecast, type AiInsight } from '@/lib/aiEngine';

interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expenditure';
  category: string;
  department: string;
  channel: string;
  amount: number;
  description: string;
  ref: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: '2026-08-22', type: 'income', category: 'Grant Disbursement', department: 'Grants', channel: 'Bank Wire', amount: 350000000, description: 'USAID Land Rights - tranche 2', ref: 'INC-2026-045' },
  { id: 't2', date: '2026-08-21', type: 'expenditure', category: 'Salaries', department: 'Finance', channel: 'Bank Transfer', amount: 186000000, description: 'August payroll batch', ref: 'DISB-2026-089' },
  { id: 't3', date: '2026-08-20', type: 'expenditure', category: 'Field Equipment', department: 'Grants', channel: 'Mobile Money', amount: 6800000, description: 'Field tablets for land mapping', ref: 'DISB-2026-088' },
  { id: 't4', date: '2026-08-19', type: 'income', category: 'Consulting Fees', department: 'Innovation', channel: 'Bank Wire', amount: 45000000, description: 'Grain dryer prototype consultancy', ref: 'INC-2026-044' },
  { id: 't5', date: '2026-08-18', type: 'expenditure', category: 'Travel', department: 'Grants', channel: 'Mobile Money', amount: 4200000, description: 'Field team transport - Gulu', ref: 'DISB-2026-087' },
  { id: 't6', date: '2026-08-17', type: 'expenditure', category: 'Office Supplies', department: 'Finance', channel: 'Petty Cash', amount: 380000, description: 'Monthly stationery restock', ref: 'DISB-2026-086' },
  { id: 't7', date: '2026-08-16', type: 'expenditure', category: 'Statutory', department: 'Finance', channel: 'Bank Transfer', amount: 42000000, description: 'NSSF Q2 contribution', ref: 'DISB-2026-090' },
  { id: 't8', date: '2026-08-15', type: 'income', category: 'Grant Disbursement', department: 'Grants', channel: 'Bank Wire', amount: 175000000, description: 'EU Climate-Smart Farming - initial', ref: 'INC-2026-043' },
  { id: 't9', date: '2026-08-14', type: 'expenditure', category: 'R&D Equipment', department: 'Innovation', channel: 'Bank Transfer', amount: 11500000, description: 'Solar irrigation sensors', ref: 'DISB-2026-085' },
  { id: 't10', date: '2026-08-12', type: 'expenditure', category: 'Communications', department: 'Grants', channel: 'Mobile Money', amount: 3200000, description: 'Community sensitization materials', ref: 'DISB-2026-084' },
  { id: 't11', date: '2026-08-10', type: 'income', category: 'Consulting Fees', department: 'Finance', channel: 'Bank Wire', amount: 12000000, description: 'Financial advisory services', ref: 'INC-2026-042' },
  { id: 't12', date: '2026-08-08', type: 'expenditure', category: 'Utilities', department: 'Finance', channel: 'Bank Transfer', amount: 2100000, description: 'August electricity & water', ref: 'DISB-2026-083' },
  { id: 't13', date: '2026-08-05', type: 'income', category: 'Grant Disbursement', department: 'Grants', channel: 'Bank Wire', amount: 105000000, description: 'Mastercard Foundation - youth literacy', ref: 'INC-2026-041' },
  { id: 't14', date: '2026-08-03', type: 'expenditure', category: 'Venue Rental', department: 'Grants', channel: 'Bank Transfer', amount: 2500000, description: 'Workshop venue Gulu - 5 days', ref: 'DISB-2026-082' },
  { id: 't15', date: '2026-08-01', type: 'expenditure', category: 'Training', department: 'HR', channel: 'Mobile Money', amount: 2800000, description: 'Onboarding materials Q3 cohort', ref: 'DISB-2026-081' },
];

function fmtMoney(n: number): string {
  if (n >= 1000000000) return `UGX ${(n / 1000000000).toFixed(1)}B`;
  if (n >= 1000000) return `UGX ${(n / 1000000).toFixed(0)}M`;
  return `UGX ${(n / 1000).toFixed(0)}K`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function Finance() {
  const { user } = useAuth();
  const { showToast, addNotification } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterAmount, setFilterAmount] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('30d');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expenditure'>('all');

  // ── Editable records (ED-approval gated) ──
  const [recordTab, setRecordTab] = useState<'income' | 'expense' | 'budget'>('income');
  const [editTarget, setEditTarget] = useState<{ type: FinanceRecordType; id: string; label: string; amount: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [, setVersion] = useState(0);
  const pendingEdits = financeService.getPendingEdits();
  const refresh = () => setVersion((v) => v + 1);

  const fmtUSD = (n: number) => (n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`);

  const canEditRecords = user?.role === 'FINANCE';

  const openEdit = (type: FinanceRecordType, id: string, label: string, amount: number) => {
    setEditTarget({ type, id, label, amount });
    setEditValue(String(amount));
  };

  const submitEdit = () => {
    if (!editTarget) return;
    const newValue = Number(editValue);
    if (!Number.isFinite(newValue) || newValue <= 0) {
      showToast({ title: 'Invalid Amount', message: 'Enter a valid positive amount.', type: 'error' });
      return;
    }
    const edit = financeService.submitEdit(editTarget.type, editTarget.id, 'amount', String(newValue), user?.name ?? 'Finance');
    if (edit) {
      addNotification({
        userId: 'user-ed-001',
        title: 'Finance Record Change — Pending Your Approval',
        message: `${edit.label}: ${edit.oldValue} → ${edit.newValue} (submitted by ${edit.submittedBy}). Approve or reject.`,
        type: 'approval',
        link: '/dashboard',
        actionUrl: '/dashboard',
      });
      showToast({ title: 'Change Submitted', message: `ED has been notified. The change applies after ED approval.`, type: 'success' });
    }
    setEditTarget(null);
    refresh();
  };

  const filteredTransactions = useMemo(() => {
    return MOCK_TRANSACTIONS.filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterDept && t.department !== filterDept) return false;
      if (filterChannel && t.channel !== filterChannel) return false;
      if (filterAmount) {
        if (filterAmount === 'lt-5m' && t.amount >= 5000000) return false;
        if (filterAmount === '5m-20m' && (t.amount < 5000000 || t.amount > 20000000)) return false;
        if (filterAmount === 'gt-20m' && t.amount <= 20000000) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return t.description.toLowerCase().includes(q) || t.ref.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [searchQuery, filterDept, filterChannel, filterAmount, filterDateRange, filterType]);

  const totalIncome = filteredTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenditure = filteredTransactions.filter((t) => t.type === 'expenditure').reduce((s, t) => s + t.amount, 0);
  const netSurplus = totalIncome - totalExpenditure;

  const budgetVsActual = useMemo(() => {
    const depts: Record<string, { budget: number; actual: number }> = {
      Grants: { budget: 450000000, actual: 0 },
      Innovation: { budget: 180000000, actual: 0 },
      Finance: { budget: 85000000, actual: 0 },
      HR: { budget: 120000000, actual: 0 },
      Procurement: { budget: 95000000, actual: 0 },
    };
    filteredTransactions.filter((t) => t.type === 'expenditure').forEach((t) => {
      if (depts[t.department]) depts[t.department].actual += t.amount;
    });
    return Object.entries(depts).map(([dept, v]) => ({
      dept,
      budget: v.budget,
      actual: v.actual,
      pct: Math.round((v.actual / v.budget) * 100),
      variance: v.budget - v.actual,
    }));
  }, [filteredTransactions]);

  const incomeByChannel = useMemo(() => {
    const byChannel: Record<string, number> = {};
    filteredTransactions.filter((t) => t.type === 'income').forEach((t) => {
      byChannel[t.channel] = (byChannel[t.channel] ?? 0) + t.amount;
    });
    return Object.entries(byChannel).map(([channel, amount]) => ({ channel, amount })).sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions]);

  const getBudgetColor = (pct: number) =>
    pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-aims-orange' : 'bg-aims-green';

  const getBudgetBadge = (pct: number) =>
    pct >= 90 ? 'text-red-500 bg-red-50 border-red-200' :
    pct >= 75 ? 'text-aims-orange bg-aims-orange/10 border-aims-orange/20' :
    'text-aims-green bg-aims-green/10 border-aims-green/20';

  if (!user) return <div className="p-8 text-center text-slate-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Cash Flow Analytics</h1>
        <p className="text-base font-medium text-white">Income, expenditure, budget health & disbursement ledger — records are editable, changes require ED approval</p>
      </div>

      <FormsShortcut module={['finance', 'procurement']} title="Finance & Procurement Forms — Requisition · Procurement Request · Expense Reimbursement" />

      {/* AI Insights — anomaly detection & forecasting */}
      {(() => {
        const insights: AiInsight[] = [];
        // Price anomaly check on recent requisition line items
        const sample = [
          { item: 'Samsung Galaxy Tab A9 (10 units)', unit: 'UGX 680,000' },
          { item: 'Tablet — field data collection', unit: 'UGX 2,000,000' },
          { item: 'MacBook Pro 14"', unit: 'UGX 3,400,000' },
          { item: 'Canon Toner Cartridges', unit: 'UGX 85,000' },
        ];
        const flags = requisitionPriceFlags(sample);
        if (flags.length > 0) {
          insights.push({
            id: 'fin-price',
            module: 'finance',
            severity: 'critical',
            title: `${flags.length} requisition line item(s) priced above market average`,
            detail: flags.map((f) => `${f.item}: UGX ${f.amount.toLocaleString()} vs market avg UGX ${f.marketAvg.toLocaleString()} (+${f.deltaPct}%)`).join('; ') + '. Flag for ED review before approval.',
          });
        } else {
          insights.push({ id: 'fin-price-ok', module: 'finance', severity: 'success', title: 'No price anomalies detected', detail: 'Recent line items are within market ranges.' });
        }
        const forecast = cashFlowForecast();
        insights.push({
          id: 'fin-cash',
          module: 'finance',
          severity: forecast.gapWarning ? 'warning' : 'success',
          title: `Cash flow forecast — ${forecast.monthsOfRunway} months of runway`,
          detail: forecast.detail,
        });
        return <AIPanel title="AI Insights — Anomaly Detection & Forecast" insights={insights} />;
      })()}

      {/* ── EDITABLE FINANCIAL RECORDS (ED-approval gated) ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Financial Records{canEditRecords ? ' — Edit & Submit for ED Approval' : ' — Read-Only View'}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{canEditRecords ? 'Finance can edit income, expenditure and budgets. Every change is queued and the ED is notified immediately; the change applies only after ED approval.' : 'View-only for this role. Edits are restricted to the Finance team and take effect only after ED approval.'}</p>
          </div>
          {pendingEdits.length > 0 && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-aims-orange/15 text-aims-orange uppercase">{pendingEdits.length} pending ED approval</span>
          )}
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit mb-4">
          {(['income', 'expense', 'budget'] as const).map((t) => (
            <button key={t} onClick={() => setRecordTab(t)} className={cn('px-3 py-1.5 rounded-md text-xs font-bold transition-all capitalize', recordTab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>{t === 'income' ? 'Income' : t === 'expense' ? 'Expenditure' : 'Department Budgets'}</button>
          ))}
        </div>

        {recordTab !== 'budget' ? (
          <div className="space-y-2">
            {(recordTab === 'income' ? financeService.getIncome() : financeService.getExpenses()).map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-900">{r.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{r.detail}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-slate-900">{fmtUSD(r.amount)}</span>
                  {canEditRecords && (
                    <button onClick={() => openEdit(recordTab, r.id, r.label, r.amount)} className="text-[10px] font-bold text-aims-navy border border-aims-navy/20 rounded-lg px-2.5 py-1.5 hover:bg-aims-navy/5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">edit</span>Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {financeService.getBudgets().map((b) => {
              const pct = Math.round((b.actual / b.budget) * 100);
              return (
                <div key={b.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-slate-900">{b.dept}</p>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border', pct >= 90 ? 'text-red-600 bg-red-50 border-red-200' : pct >= 75 ? 'text-aims-orange bg-aims-orange/10 border-aims-orange/20' : 'text-aims-green bg-aims-green/10 border-aims-green/20')}>{pct}% used · forecast {b.forecastPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2"><div className={cn('h-2 rounded-full', pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-aims-orange' : 'bg-aims-green')} style={{ width: `${Math.min(100, pct)}%` }} /></div>
                    <p className="text-[10px] text-slate-500 mt-1">Budget: {fmtUSD(b.budget)} · Spent: {fmtUSD(b.actual)}</p>
                  </div>
                  {canEditRecords && (
                    <button onClick={() => openEdit('budget', b.id, `Budget — ${b.dept}`, b.budget)} className="ml-3 text-[10px] font-bold text-aims-navy border border-aims-navy/20 rounded-lg px-2.5 py-1.5 hover:bg-aims-navy/5 flex items-center gap-1 shrink-0">
                      <span className="material-symbols-outlined text-[13px]">edit</span>Edit Budget
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pending ED approval panel */}
        {pendingEdits.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Pending ED Approval — changes are NOT yet applied</p>
            <div className="space-y-2">
              {pendingEdits.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-2.5 bg-aims-orange/5 border border-aims-orange/20 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">{e.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{e.field}: <span className="line-through">{e.oldValue}</span> → <span className="font-bold text-aims-orange">{e.newValue}</span> · by {e.submittedBy}</p>
                  </div>
                  <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0', e.status === 'pending' ? 'bg-aims-orange/15 text-aims-orange' : e.status === 'approved' ? 'bg-aims-green/15 text-aims-green' : 'bg-red-50 text-red-500')}>{e.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-aims-orange/10 border border-aims-orange/30 rounded-xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-aims-orange text-[22px] mt-0.5">psychology</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-aims-orange">AI Insight - Cash Flow</p>
            <button onClick={() => showToast({ title: 'Insight regenerated', message: 'Analysis refreshed with latest transactions', type: 'success' })} className="text-[10px] font-bold text-aims-navy hover:underline flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">refresh</span>Regenerate</button>
          </div>
          <p className="text-sm text-slate-800">
            <strong>Innovation dept</strong> at 92% utilization with 38 days remaining - forecast warns of 18M UGX overrun by quarter-end. <strong>Grants</strong> pacing on-track. <strong>Bank Wire income</strong> trending 22% above prior month driven by USAID tranche 2.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-green p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Income</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{fmtMoney(totalIncome)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{filteredTransactions.filter((t) => t.type === 'income').length} transactions</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-orange p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Expenditure</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{fmtMoney(totalExpenditure)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{filteredTransactions.filter((t) => t.type === 'expenditure').length} transactions</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-navy p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Net Surplus</p>
          <p className={cn('text-xl font-extrabold mt-1', netSurplus >= 0 ? 'text-aims-green' : 'text-red-500')}>{fmtMoney(netSurplus)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Income less expenditure</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-mint p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Burn Rate</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{fmtMoney(Math.round(totalExpenditure / 22))}/day</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Average daily (22d period)</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Budget vs. Actual by Department</h3>
            <p className="text-xs text-slate-500 mt-0.5">Current quarter - departments over 90% flagged for review</p>
          </div>
        </div>
        <div className="space-y-3">
          {budgetVsActual.map((b) => (
            <div key={b.dept}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{b.dept}</span>
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border', getBudgetBadge(b.pct))}>{b.pct}% used</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900">{fmtMoney(b.actual)}</span>
                  <span className="text-xs text-slate-400"> / {fmtMoney(b.budget)}</span>
                </div>
              </div>
              <div className="relative w-full bg-slate-100 rounded-full h-2.5">
                <div className={cn('h-2.5 rounded-full transition-all', getBudgetColor(b.pct))} style={{ width: `${Math.min(100, b.pct)}%` }} />
                <div className="absolute top-0 h-2.5 w-0.5 bg-slate-500" style={{ left: '100%' }} title="Budget ceiling" />
              </div>
              <div className="flex justify-between mt-1 text-[10px]">
                <span className="text-slate-500">{b.variance > 0 ? `${fmtMoney(b.variance)} remaining` : `${fmtMoney(Math.abs(b.variance))} over budget`}</span>
                <span className={cn('font-bold', b.variance > 0 ? 'text-aims-green' : 'text-red-500')}>{b.variance > 0 ? 'On track' : 'Over budget'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">Income by Payment Channel</h3>
          <div className="space-y-3">
            {incomeByChannel.length === 0 && <p className="text-xs text-slate-400 italic">No income transactions match filters.</p>}
            {incomeByChannel.map((c) => {
              const max = incomeByChannel[0]?.amount ?? 1;
              const pct = (c.amount / max) * 100;
              return (
                <div key={c.channel}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900">{c.channel}</span>
                    <span className="font-bold text-slate-900">{fmtMoney(c.amount)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="h-2 rounded-full bg-aims-green" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">Burn Rate & Forecast</h3>
          <div className="space-y-4">
            <div className="p-3 bg-aims-green/5 rounded-lg border border-aims-green/20">
              <p className="text-[10px] font-bold text-aims-green uppercase tracking-wider mb-1">Cash Runway</p>
              <p className="text-2xl font-extrabold text-slate-900">~42 days</p>
              <p className="text-[10px] text-slate-500 mt-0.5">At current burn rate of {fmtMoney(Math.round(totalExpenditure / 22))}/day</p>
            </div>
            <div className="p-3 bg-aims-orange/5 rounded-lg border border-aims-orange/20">
              <p className="text-[10px] font-bold text-aims-orange uppercase tracking-wider mb-1">Quarter-End Forecast</p>
              <p className="text-sm font-bold text-slate-900">Projected expenditure: {fmtMoney(Math.round(totalExpenditure * 1.35))}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">18M overrun risk in Innovation - recommend freeze on non-essential R&D purchases.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Income Outlook</p>
              <p className="text-sm font-bold text-slate-900">Expected: UGX 420M in next 30 days</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Ford Foundation decision + WFP concept approval pipeline</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search</label>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Description, ref, category…" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
          </div>
          <div className="min-w-[120px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Type</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expenditure')} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30">
              <option value="all">All</option><option value="income">Income only</option><option value="expenditure">Expenditure only</option>
            </select>
          </div>
          <div className="min-w-[130px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30">
              <option value="">All depts</option><option>Finance</option><option>Grants</option><option>Innovation</option><option>HR</option><option>Procurement</option>
            </select>
          </div>
          <div className="min-w-[130px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Channel</label>
            <select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30">
              <option value="">All channels</option><option>Bank Wire</option><option>Bank Transfer</option><option>Mobile Money</option><option>Petty Cash</option>
            </select>
          </div>
          <div className="min-w-[130px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount</label>
            <select value={filterAmount} onChange={(e) => setFilterAmount(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30">
              <option value="">Any amount</option><option value="lt-5m">&lt; UGX 5M</option><option value="5m-20m">UGX 5M - 20M</option><option value="gt-20m">&gt; UGX 20M</option>
            </select>
          </div>
          <div className="min-w-[130px]">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date Range</label>
            <select value={filterDateRange} onChange={(e) => setFilterDateRange(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30">
              <option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="all">All time</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-500">{filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}</span>
          <div className="flex gap-2">
            <button onClick={() => showToast({ title: 'Exporting CSV', message: `${filteredTransactions.length} transactions exported.`, type: 'success' })} className="px-3 py-1.5 text-[10px] font-bold text-aims-navy border border-aims-navy/20 rounded-lg hover:bg-aims-navy/5 transition-colors flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">download</span>CSV</button>
            <button onClick={() => showToast({ title: 'Exporting PDF', message: 'Report generated.', type: 'success' })} className="px-3 py-1.5 text-[10px] font-bold text-aims-navy border border-aims-navy/20 rounded-lg hover:bg-aims-navy/5 transition-colors flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">picture_as_pdf</span>PDF</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4">Disbursement Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-slate-200">
              <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Date</th>
              <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Ref</th>
              <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Description</th>
              <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Dept</th>
              <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Category</th>
              <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Channel</th>
              <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Amount</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 text-slate-600 text-xs font-mono">{formatDate(t.date)}</td>
                  <td className="py-2.5 text-slate-600 text-xs font-mono">{t.ref}</td>
                  <td className="py-2.5 font-bold text-slate-900">{t.description}</td>
                  <td className="py-2.5"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{t.department}</span></td>
                  <td className="py-2.5 text-slate-600 text-xs">{t.category}</td>
                  <td className="py-2.5 text-slate-600 text-xs">{t.channel}</td>
                  <td className={cn('py-2.5 text-right text-xs font-bold', t.type === 'income' ? 'text-aims-green' : 'text-slate-900')}>
                    {t.type === 'income' ? '+' : '-'} {fmtMoney(t.amount)}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-xs text-slate-400 italic">No transactions match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit record modal — change requires ED approval */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setEditTarget(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-slate-900">Edit Financial Record</h3>
              <button onClick={() => setEditTarget(null)} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
            </div>
            <p className="text-sm text-slate-600 mb-4">{editTarget.label}</p>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount (USD)</label>
            <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} min={0} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
            <div className="p-3 bg-aims-orange/5 border border-aims-orange/20 rounded-lg mb-4">
              <p className="text-[11px] text-slate-600 flex items-start gap-1.5"><span className="material-symbols-outlined text-aims-orange text-[16px] mt-0.5">info</span>This change will be <strong>sent to the ED for approval</strong> and the ED notified immediately. It takes effect only after approval.</p>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditTarget(null)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancel</button>
              <button onClick={submitEdit} className="px-4 py-2 bg-aims-navy text-white text-sm font-bold rounded-lg hover:bg-aims-navy/90">Submit for ED Approval</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}