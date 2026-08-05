import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';

interface ApprovalItem {
  id: string;
  type: 'requisition' | 'payslip';
  title: string;
  description: string;
  amount: number;
  requestedBy: string;
  requestedByName: string;
  department: string;
  submittedAt: string;
  priority: string;
}

const MOCK_PENDING_APPROVALS: ApprovalItem[] = [
  { id: 'appr-req-1', type: 'requisition', title: 'Conference Travel Budget', description: 'Travel expenses for the Nairobi innovation summit', amount: 120000, requestedBy: 'user-innov-001', requestedByName: 'Kevin Njoroge', department: 'Innovation', submittedAt: '2026-08-01', priority: 'medium' },
  { id: 'appr-req-2', type: 'requisition', title: 'Office Supplies Restock', description: 'Paper, toner, and stationery for Q3', amount: 45000, requestedBy: 'user-admin-001', requestedByName: 'Sarah Kimani', department: 'Administration', submittedAt: '2026-08-03', priority: 'low' },
  { id: 'appr-pay-1', type: 'payslip', title: 'Payslip — Fatima Hassan', description: 'August 2026 payslip pending approval', amount: 52200, requestedBy: 'user-admin-001', requestedByName: 'Sarah Kimani', department: 'HR', submittedAt: '2026-08-03', priority: 'high' },
];

export function ApprovalQueue() {
  const { showToast, addNotification } = useNotifications();
  const [approvals, setApprovals] = useState<ApprovalItem[]>(MOCK_PENDING_APPROVALS);
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = approvals.filter((item) => filterType === 'all' || item.type === filterType);

  const handleApprove = (item: ApprovalItem) => {
    setApprovals((prev) => prev.filter((a) => a.id !== item.id));
    addNotification({ userId: item.requestedBy, title: 'Request Approved', message: `"${item.title}" has been approved by the Executive Director.`, type: 'success', actionUrl: '/dashboard' });
    showToast({ title: 'Approved', message: `"${item.title}" has been approved.`, type: 'success' });
  };

  const handleReject = (item: ApprovalItem) => {
    setApprovals((prev) => prev.filter((a) => a.id !== item.id));
    addNotification({ userId: item.requestedBy, title: 'Request Rejected', message: `"${item.title}" has been rejected. Please revise and resubmit.`, type: 'error', actionUrl: '/dashboard' });
    showToast({ title: 'Rejected', message: `"${item.title}" has been rejected.`, type: 'warning' });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Pending Approvals</h2>
          <p className="text-sm text-gray-500">{approvals.length} item(s) awaiting your decision</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilterType('all')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium', filterType === 'all' ? 'bg-aims-mint text-white' : 'bg-gray-100 text-gray-600')}>All</button>
          <button onClick={() => setFilterType('requisition')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium', filterType === 'requisition' ? 'bg-aims-mint text-white' : 'bg-gray-100 text-gray-600')}>Requisitions</button>
          <button onClick={() => setFilterType('payslip')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium', filterType === 'payslip' ? 'bg-aims-mint text-white' : 'bg-gray-100 text-gray-600')}>Payslips</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <span className="material-symbols-outlined text-[48px] text-green-400 block mb-2">check_circle</span>
          <p className="text-gray-600 font-medium">All caught up!</p>
          <p className="text-sm text-gray-400">No pending approvals at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', item.type === 'requisition' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700')}>{item.type}</span>
                    <span className="text-xs text-gray-400">{item.submittedAt}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-sm font-bold text-gray-800">KES {item.amount.toLocaleString()}</span>
                    <span className="text-xs text-gray-400">by {item.requestedByName} • {item.department}</span>
                  </div>
                </div>
                <div className="flex sm:flex-col gap-2">
                  <button onClick={() => handleApprove(item)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors">Approve</button>
                  <button onClick={() => handleReject(item)} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}