import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import type { Contract } from '@/types';

const MOCK_CONTRACTS: Contract[] = [
  { id: 'con-1', employeeId: 'user-emp-001', employeeName: 'Lucy Wanjiku', type: 'permanent', startDate: '2025-06-15', salary: 45000, status: 'active', createdAt: '2025-06-15', updatedAt: '2025-06-15' },
  { id: 'con-2', employeeId: 'user-grant-001', employeeName: 'Fatima Hassan', type: 'contract', startDate: '2025-04-20', endDate: '2026-10-20', salary: 50000, status: 'active', createdAt: '2025-04-20', updatedAt: '2025-04-20' },
  { id: 'con-3', employeeId: 'user-innov-001', employeeName: 'Kevin Njoroge', type: 'permanent', startDate: '2025-05-05', salary: 60000, status: 'active', createdAt: '2025-05-05', updatedAt: '2025-05-05' },
  { id: 'con-4', employeeId: 'user-emp-004', employeeName: 'John Mutua', type: 'intern', startDate: '2026-01-10', endDate: '2026-07-10', salary: 20000, status: 'expired', createdAt: '2026-01-10', updatedAt: '2026-07-10' },
];

const STATUS_STYLES: Record<Contract['status'], string> = {
  active: 'bg-green-100 text-green-700',
  expiring: 'bg-yellow-100 text-yellow-700',
  expired: 'bg-red-100 text-red-700',
  terminated: 'bg-gray-100 text-gray-600',
};

export function ContractsTab() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const isED = user?.role === 'ED';

  // Contracts awaiting ED employer signature
  const [signQueue, setSignQueue] = useState([
    { id: 'sig-1', employee: 'Isaac Tumusiime', role: 'Senior Technical Lead', type: 'Permanent', effective: '2026-09-01', salary: '$48,000 annually' },
    { id: 'sig-2', employee: 'Okello Komakech', role: 'System Administrator', type: 'Permanent (renewal)', effective: 'Renewal due', salary: '—' },
  ]);

  const signContract = (id: string, employee: string) => {
    setSignQueue((prev) => prev.filter((c) => c.id !== id));
    showToast({ title: 'Contract Signed & Filed', message: `${employee} contract signed (employer signature) and auto-filed to Documents > HR & Contracts.`, type: 'success' });
  };

  const filtered = MOCK_CONTRACTS.filter((c) =>
    c.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddContract = () => {
    setShowAddForm(true);
  };

  const handleSaveContract = () => {
    setShowAddForm(false);
    showToast({
      title: 'Contract Created',
      message: 'New contract has been added successfully.',
      type: 'success',
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Contract Management</h2>
          <p className="text-sm text-gray-500">Add, search, edit, and update employee contracts</p>
        </div>
        <button
          onClick={handleAddContract}
          className="px-4 py-2 bg-aims-mint text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Add New Contract
        </button>
      </div>

      {/* ED Employer Signature Panel */}
      {isED && signQueue.length > 0 && (
        <div className="bg-white rounded-xl border border-aims-navy/30 border-l-4 border-l-aims-navy p-5 mb-4 shadow-sm">
          <h4 className="text-sm font-extrabold text-slate-900 mb-1">Contracts Ready for ED Signature</h4>
          <p className="text-xs text-slate-500 mb-3">ED is the employer signatory — signing auto-files to Documents {'>'} HR &amp; Contracts.</p>
          <div className="space-y-2">
            {signQueue.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-900">{c.employee} — {c.role}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{c.type} · Effective: {c.effective} · Salary: {c.salary}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => showToast({ title: 'Deferred', message: `Signature on ${c.employee}'s contract deferred.`, type: 'info' })} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-50">Defer</button>
                  <button onClick={() => signContract(c.id, c.employee)} className="px-3 py-1.5 bg-aims-green text-white text-[10px] font-bold rounded-lg hover:bg-aims-green/90 flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">edit_note</span>Sign Contract & File</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        type="text"
        placeholder="Search by employee name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aims-mint/50 mb-4"
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Start Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">End Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((contract) => (
              <tr key={contract.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{contract.employeeName}</td>
                <td className="px-4 py-3 text-gray-600 capitalize">{contract.type}</td>
                <td className="px-4 py-3 text-gray-600">{contract.startDate}</td>
                <td className="px-4 py-3 text-gray-600">{contract.endDate || '—'}</td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', STATUS_STYLES[contract.status])}>
                    {contract.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-xs text-aims-mint hover:underline mr-3">Edit</button>
                  <button className="text-xs text-gray-500 hover:underline">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddForm && (
        <AddContractModal
          onSave={handleSaveContract}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}

function AddContractModal({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Contract</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option>Select employee...</option>
              <option>Lucy Wanjiku</option>
              <option>James Odhiambo</option>
              <option>Fatima Hassan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option>Permanent</option>
              <option>Contract</option>
              <option>Intern</option>
              <option>Consultant</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salary (KES)</label>
            <input type="number" placeholder="e.g. 50000" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button onClick={onSave} className="px-4 py-2 text-sm bg-aims-mint text-white rounded-lg hover:opacity-90">
            Save Contract
          </button>
        </div>
      </div>
    </div>
  );
}