// src/pages/Finance.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { RequisitionsTab } from '@/components/finance/RequisitionsTab';
import { BudgetsTab, DonorIncomeTab, FinancialStatementsTab } from '@/components/finance/FinanceExtraTabs';
import { BudgetTracker } from '@/components/finance/BudgetTracker';
import { ExpenseTracker } from '@/components/finance/ExpenseTracker';

type FinanceTab = 'overview' | 'budgets' | 'tracker' | 'expenses' | 'donors' | 'statements';

export function Finance() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const TABS: { id: FinanceTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'budgets', label: 'Budget Allocation', icon: 'account_balance_wallet' },
    { id: 'tracker', label: 'Budget Tracker', icon: 'track_changes' },
    { id: 'expenses', label: 'Expense Tracker', icon: 'receipt' },
    { id: 'donors', label: 'Income by Donor', icon: 'diversity_3' },
    { id: 'statements', label: 'Statements', icon: 'receipt_long' },
  ];

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-extrabold text-slate-900">Finance & Procurement</h1><p className="text-sm text-slate-500 mt-1">Cash flow, budgets, expenses, and financial statements</p></div>
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors', activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>
      <div className="bg-slate-50 rounded-xl p-4 sm:p-6">
        {activeTab === 'overview' && <RequisitionsTab />}
        {activeTab === 'budgets' && <BudgetsTab />}
        {activeTab === 'tracker' && <BudgetTracker />}
        {activeTab === 'expenses' && <ExpenseTracker />}
        {activeTab === 'donors' && <DonorIncomeTab />}
        {activeTab === 'statements' && <FinancialStatementsTab />}
      </div>
    </div>
  );
}