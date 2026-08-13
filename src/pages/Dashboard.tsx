// src/pages/Dashboard.tsx
import { Fragment, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';

type ColorKey = 'green' | 'navy' | 'orange' | 'mint';
const CHIP: Record<ColorKey, string> = { green: 'bg-aims-green text-white', navy: 'bg-aims-navy text-white', orange: 'bg-aims-orange text-white', mint: 'bg-aims-mint text-aims-green' };
const ACCENT: Record<ColorKey, string> = { green: 'border-t-aims-green', navy: 'border-t-aims-navy', orange: 'border-t-aims-orange', mint: 'border-t-aims-mint' };
const FILL: Record<ColorKey, string> = { green: 'bg-aims-green', navy: 'bg-aims-navy', orange: 'bg-aims-orange', mint: 'bg-aims-green' };

export function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;
  const role = user.role;
  if (role === 'CD' || role === 'ED') return <ExecutiveDashboard />;
  if (role === 'COMPANY_ADMIN') return <AdminDashboard />;
  if (role === 'FINANCE') return <FinanceDashboard />;
  if (role === 'GRANT_WRITER') return <GrantDashboard />;
  if (role === 'INNOVATOR') return <InnovatorDashboard />;
  if (role === 'SYS_ADMIN') return <SysAdminDashboard />;
  return <DefaultDashboard />;
}

function ExecutiveDashboard() {
  const { showToast } = useNotifications();
  const handleAction = (msg: string) => showToast({ title: 'Action Logged', message: msg, type: 'success' });

  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="Executive Command Center" subtitle="Strategic oversight, approvals & operational control" />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Income (MTD)" value="UGX 1.1B" icon="trending_up" color="green" />
        <StatCard title="Active Grants" value="10" icon="volunteer_activism" color="navy" />
        <StatCard title="Pending Approvals" value="2" icon="approval" color="orange" />
        <StatCard title="Org Health" value="94%" icon="monitor_heart" color="mint" />
      </div>

      {/* Executive Control Panel (CRUD & Approvals) */}
      <Section title="Executive Control Panel" subtitle="Direct management of personnel, contracts, and payouts">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Recent Contracts</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div><p className="text-sm font-bold text-slate-900">Sarah Aciro</p><p className="text-xs text-slate-500">Grant Writer • Permanent</p></div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction('Viewing contract...')} className="text-xs font-bold text-aims-navy hover:underline">View</button>
                  <button onClick={() => handleAction('Editing contract...')} className="text-xs font-bold text-aims-orange hover:underline">Edit</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div><p className="text-sm font-bold text-slate-900">Pius Odong</p><p className="text-xs text-slate-500">Innovator • 1-Year Contract</p></div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction('Viewing contract...')} className="text-xs font-bold text-aims-navy hover:underline">View</button>
                  <button onClick={() => handleAction('Renewing contract...')} className="text-xs font-bold text-aims-green hover:underline">Renew</button>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Pending Payslips (Authorize)</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-orange-50/50 rounded-lg border border-orange-100">
                <div><p className="text-sm font-bold text-slate-900">Grace Aceng</p><p className="text-xs font-extrabold text-slate-700">UGX 2,450,000</p></div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction('Payslip Approved')} className="px-2 py-1 text-[10px] font-bold bg-aims-green text-white rounded">Approve</button>
                  <button onClick={() => handleAction('Payslip Rejected')} className="px-2 py-1 text-[10px] font-bold bg-red-500 text-white rounded">Reject</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Financial Health" subtitle="Income vs. expenditure">
          <div className="space-y-5">
            <Bar label="Total Income" value={1100} max={1200} display="UGX 1.1B" color="green" />
            <Bar label="Total Expenditure" value={850} max={1200} display="UGX 850M" color="orange" />
          </div>
        </Section>
        <Section title="Grant Portfolio" subtitle="Secured vs. pipeline">
          <div className="space-y-5">
            <Bar label="Secured Funding" value={850} max={1200} display="UGX 850M" color="navy" />
            <Bar label="Pipeline" value={350} max={1200} display="UGX 350M" color="mint" />
          </div>
        </Section>
      </div>
    </div>
  );
}

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

function FinanceDashboard() {
  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="Financial Command" subtitle="Cash flow, procurement & requisition workflows" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Income (MTD)" value="UGX 1.1B" icon="trending_up" color="green" />
        <StatCard title="Expenditure" value="UGX 850M" icon="trending_down" color="orange" />
        <StatCard title="Net Balance" value="UGX 250M" icon="account_balance_wallet" color="navy" />
        <StatCard title="Requisitions" value="7" icon="request_quote" color="mint" />
      </div>
    </div>
  );
}

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

function DefaultDashboard() { return <div className="p-8 text-center text-slate-500">Welcome to Ardhi.</div>; }

/* Shared UI */
function DashHeader({ gradient, title, subtitle }: { gradient: string; title: string; subtitle: string }) {
  return (<div className={cn('rounded-2xl p-7 text-white shadow-lg', gradient)}><h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">{title}</h1><p className="text-base font-medium text-white/85">{subtitle}</p></div>);
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
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="mb-4"><h3 className="text-base font-bold text-slate-900">{title}</h3>{subtitle && <p className="text-xs font-semibold text-slate-500 mt-0.5">{subtitle}</p>}</div>
      {children}
    </div>
  );
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