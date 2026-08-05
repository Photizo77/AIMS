import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import type { Requisition, ApprovalStatus } from '@/types';

const MOCK_REQUISITIONS: Requisition[] = [
  { id: 'req-1', title: 'Office Laptops (x5)', description: 'New laptops for the research team', amount: 350000, category: 'Equipment', department: 'Research', requestedBy: 'user-innov-001', status: 'approved', priority: 'high', createdAt: '2026-07-20', updatedAt: '2026-07-22', approvedBy: 'user-ed-001', approvedAt: '2026-07-22' },
  { id: 'req-2', title: 'Conference Travel Budget', description: 'Travel expenses for the Nairobi innovation summit', amount: 120000, category: 'Travel', department: 'Innovation', requestedBy: 'user-innov-001', status: 'pending', priority: 'medium', createdAt: '2026-08-01', updatedAt: '2026-08-01' },
  { id: 'req-3', title: 'Office Supplies Restock', description: 'Paper, toner, and stationery for Q3', amount: 45000, category: 'Operations', department: 'Administration', requestedBy: 'user-admin-001', status: 'pending', priority: 'low', createdAt: '2026-08-03', updatedAt: '2026-08-03' },
  { id: 'req-4', title: 'Software Licenses Renewal', description: 'Annual renewal for design and dev tools', amount: 89000, category: 'Operations', department: 'IT', requestedBy: 'user-sysadmin-001', status: 'draft', priority: 'medium', createdAt: '2026-08-04', updatedAt: '2026-08-04' },
  { id: 'req-5', title: 'Team Building Event', description: 'Quarterly team building activity', amount: 75000, category: 'Operations', department: 'Administration', requestedBy: 'user-admin-001', status: 'rejected', priority: 'low', createdAt: '2026-07-15', updatedAt: '2026-07-18' },
];

const STATUS_STYLES: Record<ApprovalStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  edited: 'bg-blue-100 text-blue-700',
};

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export function RequisitionsTab() {
  const { showToast, addNotification } = useNotifications();
  const [requisitions, setRequisitions] = useState<Requisition[]>(MOCK_REQUISITIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = requisitions.filter((req) => {
    const matchesSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase()) || req.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || req.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handlePushToED = (req: Requisition) => {
    setRequisitions((prev) => prev.map((r) => (r.id === req.id ? { ...r, status: 'pending' as ApprovalStatus, updatedAt: new Date().toISOString().split('T')[0] } : r)));
    addNotification({ userId: 'user-ed-001', title: 'Requisition Approval Required', message: `"${req.title}" (KES ${req.amount.toLocaleString()}) is awaiting your approval.`, type: 'approval', actionUrl: '/approvals' });
    showToast({ title: 'Pushed to ED', message: `"${req.title}" has been sent for approval.`, type: 'success' });
  };

  const handleDelete = (req: Requisition) => {
    setRequisitions((prev) => prev.filter((r) => r.id !== req.id));
    showToast({ title: 'Deleted', message: `"${req.title}" has been removed.`, type: 'info' });
  };

  const handleAddNew = () => {
    setShowAddForm(false);
    showToast({ title: 'Requisition Created', message: 'New requisition has been saved as a draft.', type: 'success' });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Requisitions</h2>
          <p className="text-sm text-gray-500">Create, manage, and push requisitions for approval</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="px-4 py-2 bg-aims-mint text-white rounded-lg text-sm font-medium hover:opacity-90">
          New Requisition
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="Search requisitions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aims-mint/50" />
        <button onClick={() => setShowFilters(!showFilters)} className={cn('px-4 py-2 border rounded-lg text-sm font-medium transition-colors', showFilters ? 'bg-aims-mint text-white border-aims-mint' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}>
          <span className="material-symbols-outlined text-[16px] align-middle mr-1">filter_list</span>Filters
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-4 p-4 bg-gray-50 rounded-xl">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Priority</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((req) => (
              <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{req.title}</p>
                  <p className="text-xs text-gray-400">{req.category} • {req.department}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">KES {req.amount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', PRIORITY_STYLES[req.priority])}>{req.priority}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', STATUS_STYLES[req.status])}>{req.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {req.status === 'draft' && (
                      <button onClick={() => handlePushToED(req)} className="text-xs px-3 py-1.5 bg-aims-mint text-white rounded-lg hover:opacity-90">Push to ED</button>
                    )}
                    {req.status === 'draft' && (
                      <button onClick={() => handleDelete(req)} className="text-xs text-red-500 hover:underline">Delete</button>
                    )}
                    {req.status === 'pending' && <span className="text-xs text-yellow-600">Awaiting ED</span>}
                    {req.status === 'approved' && <span className="text-xs text-green-600">✓ Approved</span>}
                    {req.status === 'rejected' && <span className="text-xs text-red-500">✗ Rejected</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddForm && <AddRequisitionModal onSave={handleAddNew} onClose={() => setShowAddForm(false)} />}
    </div>
  );
}

function AddRequisitionModal({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-800 mb-4">New Requisition</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" placeholder="e.g. Office Equipment Purchase" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea placeholder="Describe what this requisition is for..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[80px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
              <input type="number" placeholder="e.g. 50000" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option>Equipment</option>
                <option>Travel</option>
                <option>Operations</option>
                <option>Training</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={onSave} className="px-4 py-2 text-sm bg-aims-mint text-white rounded-lg hover:opacity-90">Save as Draft</button>
        </div>
      </div>
    </div>
  );
}