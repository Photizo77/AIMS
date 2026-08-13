// src/pages/Dashboard.tsx
import { type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';

type ColorKey = 'green' | 'navy' | 'orange' | 'mint';

const CHIP: Record<ColorKey, string> = {
  green: 'bg-aims-green text-white',
  navy: 'bg-aims-navy text-white',
  orange: 'bg-aims-orange text-white',
  mint: 'bg-aims-mint text-aims-green',
};

const ACCENT: Record<ColorKey, string> = {
  green: 'border-t-aims-green',
  navy: 'border-t-aims-navy',
  orange: 'border-t-aims-orange',
  mint: 'border-t-aims-mint',
};

const FILL: Record<ColorKey, string> = {
  green: 'bg-aims-green',
  navy: 'bg-aims-navy',
  orange: 'bg-aims-orange',
  mint: 'bg-aims-green',
};

// ═══════════════════════════════════════════
// SHARED UI COMPONENTS (defined first)
// ═══════════════════════════════════════════

function DashHeader({ gradient, title, subtitle }: { gradient: string; title: string; subtitle: string }) {
  return (
    <div className={cn('rounded-2xl p-7 text-white shadow-lg', gradient)}>
      <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">{title}</h1>
      <p className="text-base font-medium text-white/85">{subtitle}</p>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: string; color: ColorKey }) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 border-t-4 p-5 shadow-sm hover:shadow-md transition-shadow', ACCENT[color])}>
      <div className={cn('w-11 h-11 rounded-lg flex items-center justify-center mb-4', CHIP[color])}>
        <span className="material-symbols-outlined text-[24px]">{icon}</span>
      </div>
      <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</p>
      <p className="text-sm font-semibold text-slate-600 mt-1">{title}</p>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs font-semibold text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Bar({ label, value, max, display, color }: { label: string; value: number; max: number; display: string; color: ColorKey }) {
  const pct = Math.max(3, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className="text-sm font-extrabold text-slate-900">{display}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5">
        <div className={cn('h-2.5 rounded-full', FILL[color])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ContractRow({ name, role, type, salary, onAction }: { name: string; role: string; type: string; salary: string; onAction: (msg: string) => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
      <div>
        <p className="text-sm font-bold text-slate-900">{name}</p>
        <p className="text-xs text-slate-500">{role} • {type} • {salary}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onAction(`Viewing ${name}'s contract`)} className="text-xs font-bold text-aims-navy hover:underline">View</button>
        <button onClick={() => onAction(`Editing ${name}'s contract`)} className="text-xs font-bold text-aims-orange hover:underline">Edit</button>
        <button onClick={() => onAction(`Deleting ${name}'s contract`)} className="text-xs font-bold text-red-500 hover:underline">Delete</button>
      </div>
    </div>
  );
}

function PayslipRow({ name, amount, period, onAction }: { name: string; amount: string; period: string; onAction: (msg: string) => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-orange-50/50 rounded-lg border border-orange-100">
      <div>
        <p className="text-sm font-bold text-slate-900">{name}</p>
        <p className="text-xs font-extrabold text-slate-700">{amount} • {period}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onAction(`${name}'s payslip approved`)} className="px-2.5 py-1 text-[10px] font-bold bg-aims-green text-white rounded hover:opacity-90">Approve</button>
        <button onClick={() => onAction(`${name}'s payslip rejected`)} className="px-2.5 py-1 text-[10px] font-bold bg-red-500 text-white rounded hover:opacity-90">Reject</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN DASHBOARD ROUTER
// ═══════════════════════════════════════════

export function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;
  const role = user.role;
  if (role === 'CD' || role === 'ED') return <ExecutiveDashboard />;
  if (role === 'COMPANY_ADMIN') return <AdminDashboard />;
  if (role === 'FINANCE') return <FinanceDashboard />;
  if (role === 'GRANT_WRITER' || role === 'GRANTS_MANAGER') return <GrantDashboard />;
  if (role === 'INNOVATOR') return <InnovatorDashboard />;
  if (role === 'SYS_ADMIN') return <SysAdminDashboard />;
  return <DefaultDashboard />;
}

// ═══════════════════════════════════════════
// 1. EXECUTIVE DASHBOARD (CD / ED)
// ═══════════════════════════════════════════

function ExecutiveDashboard() {
  const { showToast } = useNotifications();
  const handleAction = (msg: string) => showToast({ title: 'Action Logged', message: msg, type: 'success' });

  const urgentGrants = [
    { id: 'g3', title: 'Community Land Rights Documentation', uniqueId: 'GRANT-LAND-2026-001', days: 7, status: 'ED Review' },
    { id: 'g1', title: 'Climate-Smart Farming Initiative', uniqueId: 'GRANT-AGRIC-2026-001', days: 15, status: 'Team Lead Review' },
  ].filter(g => g.days <= 14);

  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="Executive Command Center" subtitle="Strategic oversight, approvals & operational control" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Income (MTD)" value="UGX 1.2B" icon="trending_up" color="green" />
        <StatCard title="Active Grants" value="10" icon="volunteer_activism" color="navy" />
        <StatCard title="Pending Approvals" value="3" icon="approval" color="orange" />
        <StatCard title="Org Health" value="94%" icon="monitor_heart" color="mint" />
      </div>

      {urgentGrants.length > 0 && (
        <div className="bg-aims-orange/10 border border-aims-orange/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-aims-orange text-[22px]">alarm</span>
            <h3 className="text-sm font-bold text-aims-orange">Grant Deadline Alerts</h3>
          </div>
          <div className="space-y-2">
            {urgentGrants.map(g => (
              <div key={g.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-orange-100">
                <div>
                  <p className="text-sm font-bold text-slate-900">{g.title}</p>
                  <p className="text-[10px] text-slate-500">{g.uniqueId} • {g.status}</p>
                </div>
                <span className={cn('text-sm font-extrabold', g.days <= 7 ? 'text-aims-orange' : 'text-slate-600')}>{g.days}d left</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Section title="Executive Control Panel" subtitle="Direct management of personnel, contracts, and payouts">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contracts & Personnel</h4>
              <button onClick={() => handleAction('Opening new contract form...')} className="text-xs font-bold text-aims-navy hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">add</span>New Contract
              </button>
            </div>
            <div className="space-y-2">
              <ContractRow name="Sarah Aciro" role="Grants Manager" type="Permanent" salary="UGX 2.4M" onAction={handleAction} />
              <ContractRow name="Janet Apio" role="Grant Writer" type="1-Year" salary="UGX 1.8M" onAction={handleAction} />
              <ContractRow name="Pius Odong" role="Innovator" type="Contract" salary="UGX 1.5M" onAction={handleAction} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Payslips (Authorize)</h4>
              <span className="text-xs font-bold text-aims-orange">2 pending</span>
            </div>
            <div className="space-y-2">
              <PayslipRow name="Grace Aceng" amount="UGX 2,450,000" period="August 2026" onAction={handleAction} />
              <PayslipRow name="Amos Ojok" amount="UGX 2,250,000" period="August 2026" onAction={handleAction} />
            </div>
          </div>
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Financial Health" subtitle="Income vs. expenditure">
          <div className="space-y-5">
            <Bar label="Total Income" value={1200} max={1400} display="UGX 1.2B" color="green" />
            <Bar label="Total Expenditure" value={850} max={1400} display="UGX 850M" color="orange" />
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between">
            <span className="text-sm font-semibold text-slate-600">Net Surplus</span>
            <span className="text-xl font-extrabold text-aims-green">UGX 350M</span>
          </div>
        </Section>
        <Section title="Grant Portfolio" subtitle="Secured vs. pipeline">
          <div className="space-y-5">
            <Bar label="Secured Funding" value={850} max={1200} display="UGX 850M" color="navy" />
            <Bar label="Pipeline Opportunities" value={350} max={1200} display="UGX 350M" color="mint" />
          </div>
        </Section>
      </div>

      <Section title="Performance Appraisals" subtitle="Staff evaluations and KPI tracking">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Completed (Q2)</p>
            <p className="text-2xl font-extrabold text-slate-900">12</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Pending Review</p>
            <p className="text-2xl font-extrabold text-aims-orange">3</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Avg. Rating</p>
            <p className="text-2xl font-extrabold text-aims-green">4.2 / 5.0</p>
          </div>
        </div>
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════
// 2. COMPANY ADMIN DASHBOARD
// ═══════════════════════════════════════════

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="Operations & HR Hub" subtitle="Workforce administration and resource oversight" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Active Staff" value="142" icon="people" color="navy" />
        <StatCard title="Present Today" value="128" icon="check_circle" color="green" />
        <StatCard title="Pending Payslips" value="15" icon="payments" color="orange" />
        <StatCard title="Expiring Contracts" value="3" icon="description" color="mint" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// 3. FINANCE DASHBOARD
// ═══════════════════════════════════════════

function FinanceDashboard() {
  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="Financial Command" subtitle="Cash flow, procurement & requisition workflows" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Income (MTD)" value="UGX 1.2B" icon="trending_up" color="green" />
        <StatCard title="Expenditure" value="UGX 850M" icon="trending_down" color="orange" />
        <StatCard title="Net Balance" value="UGX 350M" icon="account_balance_wallet" color="navy" />
        <StatCard title="Requisitions" value="7" icon="request_quote" color="mint" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// 4. GRANT WRITER / GRANTS MANAGER DASHBOARD
// ═══════════════════════════════════════════

function GrantDashboard() {
  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="Grants & Proposals" subtitle="AI-assisted drafting & deadline tracking" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Active Grants" value="4" icon="edit_note" color="navy" />
        <StatCard title="Deadlines < 30d" value="2" icon="event_busy" color="orange" />
        <StatCard title="Awarded (YTD)" value="UGX 890M" icon="workspace_premium" color="green" />
        <StatCard title="AI Assists" value="28" icon="smart_toy" color="mint" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// 5. INNOVATOR DASHBOARD
// ═══════════════════════════════════════════

function InnovatorDashboard() {
  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="Innovation Pipeline" subtitle="Research execution, prototyping & production" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Concept Phase" value="3" icon="lightbulb" color="orange" />
        <StatCard title="Prototype" value="2" icon="science" color="navy" />
        <StatCard title="Production" value="1" icon="rocket_launch" color="green" />
        <StatCard title="My Assigned" value="4" icon="assignment" color="mint" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// 6. SYSTEM ADMIN DASHBOARD
// ═══════════════════════════════════════════

function SysAdminDashboard() {
  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="System Telemetry" subtitle="Platform stability, security & configuration" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Uptime" value="99.9%" icon="check_circle" color="green" />
        <StatCard title="Error Rate" value="0.4%" icon="bug_report" color="orange" />
        <StatCard title="API Latency" value="182ms" icon="speed" color="navy" />
        <StatCard title="Sessions" value="47" icon="group" color="mint" />
      </div>
    </div>
  );
}

function DefaultDashboard() {
  return <div className="p-8 text-center text-slate-500">Welcome to Ardhi.</div>;
}