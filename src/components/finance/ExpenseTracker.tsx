// src/components/finance/ExpenseTracker.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ExpenseRecord } from '@/types';

const MOCK_EXPENSES: ExpenseRecord[] = [
  { id: 'ex1', date: '2026-08-05', category: 'Travel', description: 'Field visit to Karamoja - transport & accommodation', amount: 2500000, department: 'Research', status: 'approved', approvedBy: 'Amos Ojok' },
  { id: 'ex2', date: '2026-08-04', category: 'Equipment', description: 'Laptop for new grant writer', amount: 3200000, department: 'Grants', status: 'pending' },
  { id: 'ex3', date: '2026-08-03', category: 'Office Supplies', description: 'Printer toner and paper restock', amount: 450000, department: 'Administration', status: 'approved', approvedBy: 'Amos Ojok' },
  { id: 'ex4', date: '2026-08-02', category: 'Training', description: 'AI tools workshop registration (3 staff)', amount: 1800000, department: 'Innovation', status: 'flagged' },
  { id: 'ex5', date: '2026-08-01', category: 'Utilities', description: 'Office internet and electricity - August', amount: 850000, department: 'Administration', status: 'approved', approvedBy: 'Amos Ojok' },
];

const STATUS_STYLES: Record<string, string> = { approved: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', flagged: 'bg-red-100 text-red-700' };

export function ExpenseTracker() {
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = MOCK_EXPENSES.filter(e => {
    const matchesDept = filterDept === 'all' || e.department === filterDept;
    const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
    const matchesFrom = !dateFrom || e.date >= dateFrom;
    const matchesTo = !dateTo || e.date <= dateTo;
    return matchesDept && matchesStatus && matchesFrom && matchesTo;
  });

  const totalExpenses = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900">Expense Tracker</h3>
        <span className="text-sm font-extrabold text-slate-900">Total: UGX {(totalExpenses / 1000000).toFixed(1)}M</span>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm"><option value="all">All Departments</option><option>Research</option><option>Grants</option><option>Administration</option><option>Innovation</option><option>Finance</option></select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm"><option value="all">All Statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="flagged">Flagged</option></select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Description</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Dept</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">Amount</th>
            <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
          </tr></thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-600">{e.date}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{e.category}</td>
                <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">{e.description}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{e.department}</td>
                <td className="px-4 py-3 text-right font-bold text-slate-900">UGX {e.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-center"><span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold capitalize', STATUS_STYLES[e.status])}>{e.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}