// src/pages/HR.tsx
// ============================================================
// AIMS — HR & PEOPLE MANAGEMENT (Consolidated hub)
// Directory · Payslips · Leave · Contracts · Appraisals · Offboarding
// ============================================================

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PeopleTab } from '@/components/admin/PeopleTab';
import { PayslipsTab } from '@/components/admin/PayslipsTab';
import { LeaveTab } from '@/components/admin/LeaveTab';
import { ContractsTab } from '@/components/admin/ContractsTab';
import { PerformanceTab } from '@/components/admin/PerformanceTab';
import { OffboardingTab } from '@/components/admin/OffboardingTab';

type AdminTab = 'directory' | 'payslips' | 'leave' | 'contracts' | 'appraisals' | 'offboarding';

const TABS: { id: AdminTab; label: string; icon: string }[] = [
  { id: 'directory', label: 'Directory', icon: 'people' },
  { id: 'payslips', label: 'Payslips', icon: 'payments' },
  { id: 'leave', label: 'Leave', icon: 'event_available' },
  { id: 'contracts', label: 'Contracts', icon: 'description' },
  { id: 'appraisals', label: 'Appraisals', icon: 'assessment' },
  { id: 'offboarding', label: 'Offboarding', icon: 'person_remove' },
];

function initialTab(stateTab?: string): AdminTab {
  const map: Record<string, AdminTab> = {
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
  return (stateTab && map[stateTab]) || 'directory';
}

export function HR() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<AdminTab>(() => initialTab((location.state as { tab?: string } | null)?.tab));

  return (
    <div className="space-y-6">
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">HR & People Management</h1>
        <p className="text-base font-medium text-white">Consolidated directory, payslips, leave, contracts, appraisals and offboarding</p>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors',
              activeTab === tab.id ? 'bg-white text-aims-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-50 rounded-xl p-5">
        {activeTab === 'directory' && <PeopleTab />}
        {activeTab === 'payslips' && <PayslipsTab />}
        {activeTab === 'leave' && <LeaveTab />}
        {activeTab === 'contracts' && <ContractsTab />}
        {activeTab === 'appraisals' && <PerformanceTab />}
        {activeTab === 'offboarding' && <OffboardingTab />}
      </div>
    </div>
  );
}
