import { useState } from 'react';
import { cn } from '@/lib/utils';
import { RequisitionsTab } from '@/components/finance/RequisitionsTab';
import { IncomeExpenseTab } from '@/components/finance/IncomeExpenseTab';

type FinanceTab = 'requisitions' | 'income_expense';

const TABS: { id: FinanceTab; label: string; icon: string }[] = [
  { id: 'requisitions', label: 'Requisitions', icon: 'request_quote' },
  { id: 'income_expense', label: 'Income & Expenditure', icon: 'account_balance' },
];

export function Finance() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('requisitions');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Finance</h1>
        <p className="text-sm text-gray-500 mt-1">Manage requisitions, income, and expenditures</p>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors', activeTab === tab.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        {activeTab === 'requisitions' && <RequisitionsTab />}
        {activeTab === 'income_expense' && <IncomeExpenseTab />}
      </div>
    </div>
  );
}