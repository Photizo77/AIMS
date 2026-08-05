import { cn } from '@/lib/utils';

const INCOME_BY_METHOD = [
  { method: 'Bank Transfer', amount: 2450000, percentage: 55, color: 'bg-blue-500' },
  { method: 'Mobile Money', amount: 1200000, percentage: 27, color: 'bg-green-500' },
  { method: 'Cheque', amount: 580000, percentage: 13, color: 'bg-purple-500' },
  { method: 'Cash', amount: 220000, percentage: 5, color: 'bg-orange-500' },
];

const EXPENDITURE_BREAKDOWN = [
  { category: 'Salaries & Wages', amount: 1850000, percentage: 52, color: 'bg-aims-mint' },
  { category: 'Operations', amount: 720000, percentage: 20, color: 'bg-blue-500' },
  { category: 'Equipment & Tools', amount: 540000, percentage: 15, color: 'bg-purple-500' },
  { category: 'Travel & Logistics', amount: 280000, percentage: 8, color: 'bg-orange-500' },
  { category: 'Training & Development', amount: 180000, percentage: 5, color: 'bg-pink-500' },
];

const TOTAL_INCOME = 4450000;
const TOTAL_EXPENDITURE = 3570000;

export function IncomeExpenseTab() {
  const netBalance = TOTAL_INCOME - TOTAL_EXPENDITURE;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Income & Expenditure</h2>
        <p className="text-sm text-gray-500">Financial breakdown by payment method and category</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Income</p>
          <p className="text-2xl font-bold text-green-600 mt-1">KES {TOTAL_INCOME.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Expenditure</p>
          <p className="text-2xl font-bold text-red-600 mt-1">KES {TOTAL_EXPENDITURE.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Net Balance</p>
          <p className={cn('text-2xl font-bold mt-1', netBalance >= 0 ? 'text-green-600' : 'text-red-600')}>KES {netBalance.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Income by Payment Method</h3>
          <div className="space-y-4">
            {INCOME_BY_METHOD.map((item) => (
              <div key={item.method}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">{item.method}</span>
                  <span className="text-sm font-medium text-gray-800">KES {item.amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className={cn('h-2.5 rounded-full transition-all', item.color)} style={{ width: `${item.percentage}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{item.percentage}%</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Expenditure Breakdown</h3>
          <div className="space-y-4">
            {EXPENDITURE_BREAKDOWN.map((item) => (
              <div key={item.category}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">{item.category}</span>
                  <span className="text-sm font-medium text-gray-800">KES {item.amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className={cn('h-2.5 rounded-full transition-all', item.color)} style={{ width: `${item.percentage}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{item.percentage}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}