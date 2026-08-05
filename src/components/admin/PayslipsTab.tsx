import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import type { Payslip, ApprovalStatus } from '@/types';

const MOCK_PAYSLIPS: Payslip[] = [
  { id: 'pay-1', employeeId: 'user-emp-001', employeeName: 'Lucy Wanjiku', period: 'July 2026', baseSalary: 45000, allowances: 5000, deductions: 3200, netPay: 46800, status: 'approved', generatedBy: 'user-admin-001', approvedBy: 'user-ed-001', generatedAt: '2026-07-28', approvedAt: '2026-07-30' },
  { id: 'pay-2', employeeId: 'user-finance-001', employeeName: 'James Odhiambo', period: 'July 2026', baseSalary: 55000, allowances: 7000, deductions: 4100, netPay: 57900, status: 'approved', generatedBy: 'user-admin-001', approvedBy: 'user-ed-001', generatedAt: '2026-07-28', approvedAt: '2026-07-30' },
  { id: 'pay-3', employeeId: 'user-grant-001', employeeName: 'Fatima Hassan', period: 'August 2026', baseSalary: 50000, allowances: 6000, deductions: 3800, netPay: 52200, status: 'pending', generatedBy: 'user-admin-001', generatedAt: '2026-08-03' },
];

const STATUS_STYLES: Record<ApprovalStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  edited: 'bg-blue-100 text-blue-700',
};

export function PayslipsTab() {
  const { showToast, addNotification } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [payslips, setPayslips] = useState<Payslip[]>(MOCK_PAYSLIPS);

  const filtered = payslips.filter((p) =>
    p.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.period.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePushToED = (payslip: Payslip) => {
    setPayslips((prev) =>
      prev.map((p) => (p.id === payslip.id ? { ...p, status: 'pending' as ApprovalStatus } : p))
    );

    addNotification({
      userId: 'user-ed-001',
      title: 'Payslip Approval Required',
      message: `${payslip.employeeName}'s payslip for ${payslip.period} is awaiting your approval.`,
      type: 'approval',
      actionUrl: '/approvals',
    });

    showToast({
      title: 'Pushed to ED',
      message: `${payslip.employeeName}'s payslip has been sent for approval.`,
      type: 'success',
    });
  };

  const handleGenerateNew = () => {
    showToast({
      title: 'Generate Payslip',
      message: 'Payslip generation form will open here. (Full form coming in next iteration)',
      type: 'info',
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Payslip Management</h2>
          <p className="text-sm text-gray-500">Generate, search, and push payslips for approval</p>
        </div>
        <button
          onClick={handleGenerateNew}
          className="px-4 py-2 bg-aims-mint text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Generate New Payslip
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by employee or period..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aims-mint/50 mb-4"
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Period</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Net Pay</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((payslip) => (
              <tr key={payslip.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{payslip.employeeName}</td>
                <td className="px-4 py-3 text-gray-600">{payslip.period}</td>
                <td className="px-4 py-3 text-gray-600">KES {payslip.netPay.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', STATUS_STYLES[payslip.status])}>
                    {payslip.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {payslip.status === 'draft' && (
                    <button
                      onClick={() => handlePushToED(payslip)}
                      className="text-xs px-3 py-1.5 bg-aims-mint text-white rounded-lg hover:opacity-90"
                    >
                      Push to ED
                    </button>
                  )}
                  {payslip.status === 'pending' && (
                    <span className="text-xs text-yellow-600">Awaiting ED</span>
                  )}
                  {payslip.status === 'approved' && (
                    <span className="text-xs text-green-600">✓ Approved</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}