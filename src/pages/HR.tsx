import { useState } from 'react';
import { cn } from '@/lib/utils';
import { AttendanceTab } from '@/components/admin/AttendanceTab';
import { PeopleTab } from '@/components/admin/PeopleTab';
import { PayslipsTab } from '@/components/admin/PayslipsTab';
import { ContractsTab } from '@/components/admin/ContractsTab';
import { PerformanceTab } from '@/components/admin/PerformanceTab';

type AdminTab = 'attendance' | 'people' | 'payslips' | 'contracts' | 'performance';

const TABS: { id: AdminTab; label: string; icon: string }[] = [
  { id: 'attendance', label: 'Attendance', icon: 'schedule' },
  { id: 'people', label: 'People', icon: 'people' },
  { id: 'payslips', label: 'Payslips', icon: 'payments' },
  { id: 'contracts', label: 'Contracts', icon: 'description' },
  { id: 'performance', label: 'Performance', icon: 'assessment' },
];

export function HR() {
  const [activeTab, setActiveTab] = useState<AdminTab>('attendance');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">HR & Administration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage attendance, people, payslips, contracts, and performance
        </p>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === tab.id
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        {activeTab === 'attendance' && <AttendanceTab />}
        {activeTab === 'people' && <PeopleTab />}
        {activeTab === 'payslips' && <PayslipsTab />}
        {activeTab === 'contracts' && <ContractsTab />}
        {activeTab === 'performance' && <PerformanceTab />}
      </div>
    </div>
  );
}