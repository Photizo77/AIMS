// src/pages/HR.tsx
// ============================================================
// AIMS — HR & PEOPLE MANAGEMENT (Consolidated hub)
// Directory · Payslips · Leave · Contracts · Appraisals · Offboarding
// The active tab's panel renders immediately beneath the tab bar so
// switching is always visible, and each panel is error-contained.
// ============================================================

import { Component, useState, type ReactNode } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { PeopleTab } from '@/components/admin/PeopleTab';
import { PayslipsTab } from '@/components/admin/PayslipsTab';
import { LeaveTab } from '@/components/admin/LeaveTab';
import { ContractsTab } from '@/components/admin/ContractsTab';
import { PerformanceTab } from '@/components/admin/PerformanceTab';
import { OffboardingTab } from '@/components/admin/OffboardingTab';
import { HROverview } from '@/components/admin/HROverview';
import { HRSummary } from '@/components/admin/HRSummary';
import { FormsShortcut } from '@/components/forms/FormsShortcut';
import { AIPanel } from '@/components/ai/AIPanel';
import { sentimentSummary, contractRenewalAdvice, type AiInsight } from '@/lib/aiEngine';

type AdminTab = 'overview' | 'directory' | 'payslips' | 'leave' | 'contracts' | 'appraisals' | 'offboarding';

const TABS: { id: AdminTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Dashboard', icon: 'dashboard' },
  { id: 'directory', label: 'People Directory', icon: 'people' },
  { id: 'payslips', label: 'Payslips', icon: 'payments' },
  { id: 'leave', label: 'Leave', icon: 'event_available' },
  { id: 'contracts', label: 'Contracts', icon: 'description' },
  { id: 'appraisals', label: 'Appraisals', icon: 'assessment' },
  { id: 'offboarding', label: 'Offboarding', icon: 'person_remove' },
];

function initialTab(stateTab?: string): AdminTab {
  const map: Record<string, AdminTab> = {
    overview: 'overview',
    dashboard: 'overview',
    summary: 'overview',
    home: 'overview',
    people: 'directory',
    users: 'directory',
    directory: 'directory',
    payslips: 'payslips',
    leave: 'leave',
    contracts: 'contracts',
    performance: 'appraisals',
    appraisals: 'appraisals',
    offboarding: 'offboarding',
  };
  return (stateTab && map[stateTab]) || 'overview';
}

/** Contain per-tab failures so one bad panel never blanks the whole HR page */
class TabBoundary extends Component<{ name: string; children: ReactNode }, { error: string | null }> {
  state: { error: string | null } = { error: null };
  static getDerivedStateFromError(err: unknown) {
    return { error: err instanceof Error ? err.message : 'Unknown rendering error' };
  }
  componentDidCatch(err: unknown) {
    console.error(`[HR:${this.props.name}]`, err);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-700">
          <p className="font-bold mb-1">This section hit an error</p>
          <p className="text-xs">{this.state.error}</p>
          <button onClick={() => this.setState({ error: null })} className="mt-3 px-3 py-1.5 bg-aims-navy text-white text-xs font-bold rounded-lg">
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function HR() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<AdminTab>(() => initialTab((location.state as { tab?: string } | null)?.tab ?? searchParams.get('tab') ?? undefined));

  // Country Director gets the consolidated HR & Admin Summary (no individual records)
  if (user?.role === 'CD') {
    return (
      <div className="space-y-6">
        <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">HR & Admin Summary</h1>
          <p className="text-base font-medium text-white">Consolidated workforce indicators — headcount, contracts, appraisals</p>
        </div>
        <HRSummary />
      </div>
    );
  }

  const goTab = (tab: AdminTab) => {
    setActiveTab(tab);
    document.getElementById('hr-tab-content')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">HR & People Management</h1>
        <p className="text-base font-medium text-white">Consolidated directory, payslips, leave, contracts, appraisals and offboarding</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto sticky top-16 z-30">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => goTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors',
              activeTab === tab.id ? 'bg-white text-aims-navy shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
            )}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active panel — directly under the tabs so switching is always visible */}
      <div id="hr-tab-content" className="scroll-mt-20 bg-slate-50 rounded-xl p-5">
        <TabBoundary key={activeTab} name={activeTab}>
          {activeTab === 'overview' && <HROverview onGo={(tab) => goTab(tab as AdminTab)} />}
          {activeTab === 'directory' && <PeopleTab />}
          {activeTab === 'payslips' && <PayslipsTab />}
          {activeTab === 'leave' && <LeaveTab />}
          {activeTab === 'contracts' && <ContractsTab />}
          {activeTab === 'appraisals' && <PerformanceTab />}
          {activeTab === 'offboarding' && <OffboardingTab />}
        </TabBoundary>
      </div>

      <FormsShortcut module={['hr', 'attendance']} title="HR Forms — Employment Contract · Employee Info · Appraisal · Leave · Offboarding" />

      {/* AI Insights — workforce intelligence */}
      {(() => {
        const insights: AiInsight[] = [];
        const senti = sentimentSummary();
        insights.push({
          id: 'hr-sent',
          module: 'hr',
          severity: senti.morale === 'concern' ? 'warning' : senti.morale === 'positive' ? 'success' : 'info',
          title: `Team morale: ${senti.morale}`,
          detail: senti.detail,
        });
        insights.push(...contractRenewalAdvice());
        return <AIPanel title="AI Insights — Workforce Intelligence" insights={insights} />;
      })()}
    </div>
  );
}
