// src/components/finance/FinanceExtraTabs.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function BudgetsTab() {
  const budgets = [
    { dept: 'Research', allocated: 150000000, spent: 112000000 },
    { dept: 'Administration', allocated: 80000000, spent: 45000000 },
    { dept: 'Innovation', allocated: 120000000, spent: 95000000 },
    { dept: 'Grants', allocated: 50000000, spent: 12000000 },
  ];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-base font-bold text-slate-900 mb-4">Departmental Budgets (FY 2026)</h3>
      <div className="space-y-5">
        {budgets.map(b => {
          const pct = (b.spent / b.allocated) * 100;
          return (
            <div key={b.dept}>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-bold text-slate-700">{b.dept}</span>
                <span className="text-sm font-extrabold text-slate-900">UGX {(b.spent / 1000000).toFixed(1)}M <span className="text-slate-400 font-normal">/ {(b.allocated / 1000000).toFixed(0)}M</span></span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className={cn('h-2.5 rounded-full', pct > 80 ? 'bg-aims-orange' : 'bg-aims-green')} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DonorIncomeTab() {
  const donors = [
    { name: 'USAID', amount: 450000000, color: 'bg-aims-navy' },
    { name: 'European Union', amount: 320000000, color: 'bg-aims-green' },
    { name: 'FCDO (UK)', amount: 180000000, color: 'bg-aims-orange' },
    { name: 'World Bank', amount: 150000000, color: 'bg-purple-600' },
  ];
  const total = donors.reduce((s, d) => s + d.amount, 0);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-base font-bold text-slate-900 mb-4">Income by Donor</h3>
      <div className="space-y-4">
        {donors.map(d => (
          <div key={d.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-3">
              <span className={cn('w-3 h-3 rounded-full', d.color)} />
              <span className="text-sm font-bold text-slate-800">{d.name}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-extrabold text-slate-900">UGX {(d.amount / 1000000).toFixed(0)}M</p>
              <p className="text-[10px] font-semibold text-slate-500">{((d.amount / total) * 100).toFixed(1)}% of total</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FinancialStatementsTab() {
  const [stmt, setStmt] = useState<'pnl' | 'balance' | 'trial'>('pnl');
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {[{ id: 'pnl', label: 'Profit & Loss' }, { id: 'balance', label: 'Balance Sheet' }, { id: 'trial', label: 'Trial Balance' }].map(t => (
          <button key={t.id} onClick={() => setStmt(t.id as any)} className={cn('px-4 py-2 text-sm font-bold border-b-2 transition-colors', stmt === t.id ? 'border-aims-navy text-aims-navy' : 'border-transparent text-slate-500 hover:text-slate-700')}>{t.label}</button>
        ))}
      </div>
      
      {stmt === 'pnl' && (
        <table className="w-full text-sm">
          <tbody>
            <tr className="font-bold text-slate-900 border-b border-slate-200"><td className="py-2">Total Revenue</td><td className="text-right">UGX 1,100,000,000</td></tr>
            <tr className="text-slate-700 border-b border-slate-100"><td className="py-2 pl-4">Grant Income</td><td className="text-right">UGX 950,000,000</td></tr>
            <tr className="text-slate-700 border-b border-slate-100"><td className="py-2 pl-4">Consulting Services</td><td className="text-right">UGX 150,000,000</td></tr>
            <tr className="font-bold text-slate-900 border-b border-slate-200"><td className="py-2 pt-4">Total Expenses</td><td className="text-right">UGX 850,000,000</td></tr>
            <tr className="text-slate-700 border-b border-slate-100"><td className="py-2 pl-4">Salaries & Wages</td><td className="text-right">UGX 450,000,000</td></tr>
            <tr className="text-slate-700 border-b border-slate-100"><td className="py-2 pl-4">Operations & Admin</td><td className="text-right">UGX 250,000,000</td></tr>
            <tr className="text-slate-700 border-b border-slate-100"><td className="py-2 pl-4">Project Direct Costs</td><td className="text-right">UGX 150,000,000</td></tr>
            <tr className="font-extrabold text-aims-green text-base"><td className="py-4">Net Surplus</td><td className="text-right">UGX 250,000,000</td></tr>
          </tbody>
        </table>
      )}

      {stmt === 'balance' && (
        <table className="w-full text-sm">
          <tbody>
            <tr className="font-bold text-slate-900 border-b border-slate-200"><td className="py-2">Assets</td><td className="text-right"></td></tr>
            <tr className="text-slate-700 border-b border-slate-100"><td className="py-2 pl-4">Cash & Equivalents</td><td className="text-right">UGX 450,000,000</td></tr>
            <tr className="text-slate-700 border-b border-slate-100"><td className="py-2 pl-4">Accounts Receivable</td><td className="text-right">UGX 120,000,000</td></tr>
            <tr className="text-slate-700 border-b border-slate-100"><td className="py-2 pl-4">Property & Equipment</td><td className="text-right">UGX 300,000,000</td></tr>
            <tr className="font-bold text-slate-900 border-b border-slate-200"><td className="py-3">Total Assets</td><td className="text-right">UGX 870,000,000</td></tr>
            <tr className="font-bold text-slate-900 border-b border-slate-200"><td className="py-3 pt-4">Liabilities & Equity</td><td className="text-right"></td></tr>
            <tr className="text-slate-700 border-b border-slate-100"><td className="py-2 pl-4">Accounts Payable</td><td className="text-right">UGX 80,000,000</td></tr>
            <tr className="text-slate-700 border-b border-slate-100"><td className="py-2 pl-4">Retained Earnings</td><td className="text-right">UGX 790,000,000</td></tr>
            <tr className="font-bold text-slate-900 border-b border-slate-200"><td className="py-3">Total Liabilities & Equity</td><td className="text-right">UGX 870,000,000</td></tr>
          </tbody>
        </table>
      )}

      {stmt === 'trial' && (
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-200 text-slate-500 text-xs uppercase"><th className="text-left py-2">Account</th><th className="text-right py-2">Debit (UGX)</th><th className="text-right py-2">Credit (UGX)</th></tr></thead>
          <tbody>
            <tr className="border-b border-slate-100"><td className="py-2">Cash</td><td className="text-right">450,000,000</td><td className="text-right">-</td></tr>
            <tr className="border-b border-slate-100"><td className="py-2">Accounts Receivable</td><td className="text-right">120,000,000</td><td className="text-right">-</td></tr>
            <tr className="border-b border-slate-100"><td className="py-2">Equipment</td><td className="text-right">300,000,000</td><td className="text-right">-</td></tr>
            <tr className="border-b border-slate-100"><td className="py-2">Accounts Payable</td><td className="text-right">-</td><td className="text-right">80,000,000</td></tr>
            <tr className="border-b border-slate-100"><td className="py-2">Grant Revenue</td><td className="text-right">-</td><td className="text-right">950,000,000</td></tr>
            <tr className="border-b border-slate-100"><td className="py-2">Salary Expense</td><td className="text-right">450,000,000</td><td className="text-right">-</td></tr>
            <tr className="font-bold text-slate-900 border-t-2 border-slate-300"><td className="py-3">Totals</td><td className="text-right">1,320,000,000</td><td className="text-right">1,030,000,000</td></tr>
          </tbody>
        </table>
      )}
    </div>
  );
}