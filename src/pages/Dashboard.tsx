import { Fragment, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────
   Brand color system (mix & match)
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   Date helpers (live countdowns)
───────────────────────────────────────────── */
const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.now();
const inDays = (n: number) => new Date(NOW + n * DAY).toISOString();
const daysUntil = (d: string) => Math.max(0, Math.ceil((new Date(d).getTime() - NOW) / DAY));

/* ─────────────────────────────────────────────
   Main router
───────────────────────────────────────────── */
export function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;
  if (role === 'CD' || role === 'ED') return <ExecutiveDashboard />;
  if (role === 'COMPANY_ADMIN') return <AdminDashboard />;
  if (role === 'SYS_ADMIN') return <SysAdminDashboard />;
  if (role === 'GRANT_WRITER') return <GrantDashboard />;
  if (role === 'INNOVATOR') return <InnovatorDashboard />;
  if (role === 'FINANCE') return <FinanceDashboard />;
  return <DefaultDashboard />;
}

/* ═════════════════════════════════════════════
   1. EXECUTIVE (CD / ED)
═════════════════════════════════════════════ */
function ExecutiveDashboard() {
  const approvals = [
    { type: 'Requisition', title: 'Conference Travel Budget', by: 'Pius Odong', amount: 4500000 },
    { type: 'Payslip', title: 'Sarah Aciro — August', by: 'Grace Aceng', amount: 1870000 },
    { type: 'Requisition', title: 'Office Supplies Restock', by: 'Grace Aceng', amount: 850000 },
  ];

  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="Executive Command Center" subtitle="Strategic oversight, analytics & final approvals" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Income (MTD)" value="UGX 450M" icon="trending_up" color="green" />
        <StatCard title="Total Expenditure" value="UGX 312M" icon="trending_down" color="orange" />
        <StatCard title="Active Grants" value="10" icon="volunteer_activism" color="navy" />
        <StatCard title="Org Health" value="94%" icon="monitor_heart" color="mint" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Financial Health" subtitle="Income vs. expenditure">
          <div className="space-y-5">
            <Bar label="Total Income" value={450} max={450} display="UGX 450M" color="green" />
            <Bar label="Total Expenditure" value={312} max={450} display="UGX 312M" color="orange" />
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600">Net Surplus</span>
            <span className="text-xl font-extrabold text-aims-green">UGX 138M</span>
          </div>
        </Section>

        <Section title="Pending Approvals" subtitle="Awaiting your signature" action={<CountBadge n={approvals.length} color="orange" />}>
          <div className="space-y-3">
            {approvals.map((a) => (
              <QueueItem key={a.title} type={a.type} title={a.title} by={a.by} amount={a.amount} />
            ))}
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Grant Portfolio" subtitle="Secured vs. pipeline">
          <div className="space-y-5">
            <Bar label="Secured Funding" value={850} max={1200} display="UGX 850M" color="navy" />
            <Bar label="Pipeline Opportunities" value={350} max={1200} display="UGX 350M" color="mint" />
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600">Total Portfolio</span>
            <span className="text-xl font-extrabold text-aims-navy">UGX 1.2B</span>
          </div>
        </Section>

        <Section title="Executive Feed" subtitle="Institutional announcements">
          <div className="space-y-4">
            <FeedLine by="Nassir Mwanje" text="Q3 strategy targets finalized and distributed." time="2h ago" />
            <FeedLine by="Peter Byamugisha" text="Board review of ArdhiLand initiatives scheduled." time="1d ago" />
            <FeedLine by="System" text="Scheduled maintenance: Sunday 02:00–04:00." time="2d ago" />
          </div>
        </Section>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════
   2. COMPANY ADMIN
═════════════════════════════════════════════ */
function AdminDashboard() {
  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-green" title="Operations & HR Hub" subtitle="Workforce administration, attendance & resource oversight" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Active Staff" value="142" icon="people" color="navy" />
        <StatCard title="Present Today" value="128" icon="check_circle" color="green" />
        <StatCard title="Pending Payslips" value="15" icon="payments" color="orange" />
        <StatCard title="Expiring Contracts" value="3" icon="description" color="mint" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Attendance — Today" subtitle="Real-time presence overview">
          <div className="space-y-4">
            <Bar label="Present" value={128} max={142} display="128" color="green" />
            <Bar label="Late" value={6} max={142} display="6" color="orange" />
            <Bar label="On Leave" value={5} max={142} display="5" color="navy" />
            <Bar label="Absent" value={3} max={142} display="3" color="mint" />
          </div>
        </Section>

        <Section title="Low Stock Alerts" subtitle="Inventory below threshold" action={<CountBadge n={3} color="orange" />}>
          <div className="space-y-3">
            <StockItem name="A4 Paper Reams" left={12} min={20} />
            <StockItem name="HP Toner Cartridges" left={3} min={5} />
            <StockItem name="Whiteboard Markers" left={8} min={15} />
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Payslips Awaiting ED" subtitle="Submitted for authorization">
          <div className="space-y-3">
            <QueueItem type="Payslip" title="Sarah Aciro — August" by="Grace Aceng" amount={1870000} />
            <QueueItem type="Payslip" title="Janet Apio — August" by="Grace Aceng" amount={1550000} />
          </div>
        </Section>

        <Section title="Pending Onboarding" subtitle="New accounts to provision">
          <div className="space-y-3">
            <OnboardItem name="David Okonya" role="Innovator" />
            <OnboardItem name="Mary Atim" role="Grant Writer" />
          </div>
        </Section>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════
   3. SYSTEM ADMIN
═════════════════════════════════════════════ */
function SysAdminDashboard() {
  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-dark" title="System Telemetry" subtitle="Platform stability, security & configuration" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="System Uptime" value="99.9%" icon="check_circle" color="green" />
        <StatCard title="Error Rate (24h)" value="0.4%" icon="bug_report" color="orange" />
        <StatCard title="Avg API Latency" value="182ms" icon="speed" color="navy" />
        <StatCard title="Active Sessions" value="47" icon="group" color="mint" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="AI Provider Integrations" subtitle="Model health & usage">
          <div className="space-y-3">
            <ModelRow name="Claude" status="Healthy" usage="67%" />
            <ModelRow name="Kimi-3" status="Healthy" usage="23%" />
            <ModelRow name="Qwen" status="Healthy" usage="45%" />
          </div>
        </Section>

        <Section title="Security & Audit Log" subtitle="Recent activity">
          <div className="space-y-3.5">
            <LogRow type="ok" text="Grace Aceng signed in" time="09:15" />
            <LogRow type="warn" text="Claude API nearing rate limit" time="08:42" />
            <LogRow type="err" text="Failed login — unknown@test.com" time="08:15" />
            <LogRow type="ok" text="Nightly backup completed" time="02:00" />
          </div>
        </Section>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════
   4. GRANT WRITER
═════════════════════════════════════════════ */
function GrantDashboard() {
  const grants = [
    { id: 'GRANT-AGRIC-2026-001', title: 'Climate-Smart Farming', pillar: 'ArdhiAgric', amount: 250000000, deadline: inDays(12) },
    { id: 'GRANT-HEALTH-2026-002', title: 'Mobile Maternal Clinics', pillar: 'ArdhiHealth', amount: 420000000, deadline: inDays(25) },
    { id: 'GRANT-LAND-2026-001', title: 'Land Rights Documentation', pillar: 'ArdhiLand', amount: 220000000, deadline: inDays(45) },
  ];
  const colors: ColorKey[] = ['green', 'navy', 'orange'];

  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-orange" title="Grants & Proposals" subtitle="AI-assisted drafting & deadline tracking" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Active Grants" value="4" icon="edit_note" color="navy" />
        <StatCard title="Deadlines < 30d" value="2" icon="event_busy" color="orange" />
        <StatCard title="Awarded (YTD)" value="UGX 890M" icon="workspace_premium" color="green" />
        <StatCard title="AI Assists Used" value="28" icon="smart_toy" color="mint" />
      </div>

      <Section title="My Active Grants" subtitle="Organized by pillar with live countdowns">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {grants.map((g, i) => (
            <GrantCard key={g.id} {...g} color={colors[i % colors.length]} />
          ))}
        </div>
      </Section>

      <Section title="AI Writing Assistant" subtitle="One-click launch to fine-tuned pipelines">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm text-slate-600 max-w-md">Draft with Claude, Kimi-3, or Qwen — tuned for Ardhi's institutional tone.</p>
          <div className="flex gap-2">
            <AIChip label="Claude" />
            <AIChip label="Kimi-3" />
            <AIChip label="Qwen" />
          </div>
        </div>
      </Section>
    </div>
  );
}

/* ═════════════════════════════════════════════
   5. INNOVATOR
═════════════════════════════════════════════ */
function InnovatorDashboard() {
  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-innov" title="Innovation Pipeline" subtitle="Research execution, prototyping & production" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Concept Phase" value="3" icon="lightbulb" color="orange" />
        <StatCard title="Prototype Phase" value="2" icon="science" color="navy" />
        <StatCard title="Production Build" value="1" icon="rocket_launch" color="green" />
        <StatCard title="My Assigned" value="4" icon="assignment" color="mint" />
      </div>

      <Section title="Pipeline Tracker" subtitle="Concept ➔ Prototype ➔ Production">
        <Pipeline
          stages={[
            { label: 'Concept', count: 3, color: 'orange' },
            { label: 'Prototype', count: 2, color: 'navy' },
            { label: 'Production', count: 1, color: 'green' },
          ]}
        />
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="My Assigned Innovations" subtitle="Projects where you are lead">
          <div className="space-y-3">
            <InnovItem title="AI Grant Writing Assistant" phase="Prototype" color="navy" />
            <InnovItem title="Solar IoT Sensors" phase="Concept" color="orange" />
            <InnovItem title="Automated Report Generator" phase="Production" color="green" />
          </div>
        </Section>

        <Section title="Research Repository" subtitle="Feasibility studies & documentation">
          <div className="space-y-3">
            <RepoItem title="IoT Sensor Feasibility Study" type="PDF" />
            <RepoItem title="LLM Fine-tuning Reference" type="DOC" />
            <RepoItem title="Land Registry Technical Spec" type="PDF" />
          </div>
        </Section>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════
   6. FINANCE OFFICER
═════════════════════════════════════════════ */
function FinanceDashboard() {
  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-finance" title="Financial Command" subtitle="Cash flow, procurement & requisition workflows" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Income (MTD)" value="UGX 450M" icon="trending_up" color="green" />
        <StatCard title="Expenditure (MTD)" value="UGX 312M" icon="trending_down" color="orange" />
        <StatCard title="Net Balance" value="UGX 138M" icon="account_balance_wallet" color="navy" />
        <StatCard title="Pending Requisitions" value="7" icon="request_quote" color="mint" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Income by Channel" subtitle="Payment method breakdown">
          <div className="space-y-4">
            <Bar label="Bank Transfer" value={55} max={100} display="55%" color="navy" />
            <Bar label="Mobile Money" value={27} max={100} display="27%" color="green" />
            <Bar label="Cheque" value={13} max={100} display="13%" color="orange" />
            <Bar label="Cash" value={5} max={100} display="5%" color="mint" />
          </div>
        </Section>

        <Section title="Expenditure Breakdown" subtitle="Salaries vs. direct costs">
          <div className="space-y-4">
            <Bar label="Salaries & Wages" value={52} max={100} display="52%" color="green" />
            <Bar label="Operations" value={20} max={100} display="20%" color="navy" />
            <Bar label="Equipment" value={15} max={100} display="15%" color="orange" />
            <Bar label="Travel & Training" value={13} max={100} display="13%" color="mint" />
          </div>
        </Section>
      </div>

      <Section title="Requisition Lifecycle" subtitle="Draft ➔ Pushed to ED ➔ Review ➔ Approved">
        <Pipeline
          stages={[
            { label: 'Draft', count: 3, color: 'mint' },
            { label: 'Pushed to ED', count: 2, color: 'orange' },
            { label: 'ED Review', count: 1, color: 'navy' },
            { label: 'Approved', count: 5, color: 'green' },
          ]}
        />
      </Section>
    </div>
  );
}

function DefaultDashboard() {
  return <div className="p-8 text-center text-slate-500">Welcome to Ardhi.</div>;
}

/* ─────────────────────────────────────────────
   Shared UI components
───────────────────────────────────────────── */
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

function Section({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs font-semibold text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
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

function Pipeline({ stages }: { stages: { label: string; count: number; color: ColorKey }[] }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {stages.map((s, i) => (
        <Fragment key={s.label}>
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className={cn('w-2.5 h-2.5 rounded-full', FILL[s.color])} />
            <span className="text-sm font-semibold text-slate-700">{s.label}</span>
            <span className="text-base font-extrabold text-slate-900">{s.count}</span>
          </div>
          {i < stages.length - 1 && <span className="material-symbols-outlined text-slate-300">arrow_forward</span>}
        </Fragment>
      ))}
    </div>
  );
}

function CountBadge({ n, color }: { n: number; color: ColorKey }) {
  return <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold', CHIP[color])}>{n}</span>;
}

function QueueItem({ type, title, by, amount }: { type: string; title: string; by: string; amount: number }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold uppercase', type === 'Payslip' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')}>
            {type}
          </span>
          <span className="text-sm font-bold text-slate-900 truncate">{title}</span>
        </div>
        <p className="text-xs font-semibold text-slate-500 mt-1">by {by}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-extrabold text-slate-900">UGX {amount.toLocaleString()}</p>
        <button className="text-xs font-bold text-aims-green hover:underline">Review</button>
      </div>
    </div>
  );
}

function FeedLine({ by, text, time }: { by: string; text: string; time: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-aims-navy text-white flex items-center justify-center text-xs font-bold shrink-0">{by.charAt(0)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-900">
          {by} <span className="font-semibold text-slate-400">• {time}</span>
        </p>
        <p className="text-sm text-slate-700 mt-0.5">{text}</p>
      </div>
    </div>
  );
}

function StockItem({ name, left, min }: { name: string; left: number; min: number }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
      <div>
        <p className="text-sm font-bold text-slate-900">{name}</p>
        <p className="text-xs font-semibold text-slate-500">Min required: {min}</p>
      </div>
      <span className="text-sm font-extrabold text-red-600">{left} left</span>
    </div>
  );
}

function OnboardItem({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-aims-green text-white flex items-center justify-center text-xs font-bold">{name.charAt(0)}</div>
        <div>
          <p className="text-sm font-bold text-slate-900">{name}</p>
          <p className="text-xs font-semibold text-slate-500">{role}</p>
        </div>
      </div>
      <button className="text-xs font-bold text-aims-navy hover:underline">Provision</button>
    </div>
  );
}

function ModelRow({ name, status, usage }: { name: string; status: string; usage: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
      <div className="flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full bg-aims-green" />
        <span className="text-sm font-bold text-slate-900">{name}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs font-semibold text-slate-500">Usage {usage}</span>
        <span className="text-xs font-bold text-aims-green">{status}</span>
      </div>
    </div>
  );
}

function LogRow({ type, text, time }: { type: 'ok' | 'warn' | 'err'; text: string; time: string }) {
  const icon = type === 'ok' ? 'check_circle' : type === 'warn' ? 'warning' : 'error';
  const color = type === 'ok' ? 'text-aims-green' : type === 'warn' ? 'text-orange-500' : 'text-red-500';
  return (
    <div className="flex items-start gap-2.5">
      <span className={cn('material-symbols-outlined text-[18px] mt-0.5', color)}>{icon}</span>
      <p className="flex-1 text-sm text-slate-700">{text}</p>
      <span className="text-xs font-semibold text-slate-400 shrink-0">{time}</span>
    </div>
  );
}

function GrantCard({ id, title, pillar, amount, deadline, color }: { id: string; title: string; pillar: string; amount: number; deadline: string; color: ColorKey }) {
  const days = daysUntil(deadline);
  const urgent = days <= 14;
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 border-t-4 p-4 shadow-sm', ACCENT[color])}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono font-semibold text-slate-400">{id}</span>
        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-extrabold', urgent ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
          {days}d left
        </span>
      </div>
      <p className="text-sm font-bold text-slate-900">{title}</p>
      <p className="text-xs font-semibold text-slate-500 mt-0.5">{pillar}</p>
      <p className="text-lg font-extrabold text-slate-900 mt-3">UGX {(amount / 1000000).toFixed(0)}M</p>
    </div>
  );
}

function AIChip({ label }: { label: string }) {
  return <span className="px-3 py-1.5 rounded-lg bg-aims-navy text-white text-xs font-bold cursor-pointer hover:opacity-90">{label}</span>;
}

function InnovItem({ title, phase, color }: { title: string; phase: string; color: ColorKey }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
      <div className="flex items-center gap-2.5">
        <span className={cn('w-2.5 h-2.5 rounded-full', FILL[color])} />
        <span className="text-sm font-bold text-slate-900">{title}</span>
      </div>
      <span className="text-xs font-bold text-slate-500">{phase}</span>
    </div>
  );
}

function RepoItem({ title, type }: { title: string; type: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
      <div className="flex items-center gap-2.5">
        <span className="material-symbols-outlined text-[18px] text-aims-navy">description</span>
        <span className="text-sm font-bold text-slate-900">{title}</span>
      </div>
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">{type}</span>
    </div>
  );
}