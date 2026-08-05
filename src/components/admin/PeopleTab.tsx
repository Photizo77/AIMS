import { useState } from 'react';
import type { User } from '@/types';
import { ROLE_LABELS } from '@/config/roles';

const MOCK_EMPLOYEES: User[] = [
  { id: 'user-cd-001', name: 'Nassir Mwanje', email: 'cd@aims.org', role: 'CD', department: 'Executive', status: 'active', createdAt: '2025-01-15' },
  { id: 'user-ed-001', name: 'Peter Byamugisha', email: 'ed@aims.org', role: 'ED', department: 'Executive', status: 'active', createdAt: '2025-01-15' },
  { id: 'user-admin-001', name: 'Grace Aceng', email: 'admin@aims.org', role: 'COMPANY_ADMIN', department: 'Administration', status: 'active', createdAt: '2025-02-01' },
  { id: 'user-finance-001', name: 'Amos Ojok', email: 'finance@aims.org', role: 'FINANCE', department: 'Finance', status: 'active', createdAt: '2025-03-10' },
  { id: 'user-grant-001', name: 'Sarah Aciro', email: 'grants@aims.org', role: 'GRANT_WRITER', department: 'Grants', status: 'active', createdAt: '2025-04-20' },
  { id: 'user-innov-001', name: 'Pius Odong', email: 'innovation@aims.org', role: 'INNOVATOR', department: 'Innovation', status: 'active', createdAt: '2025-05-05' },
  { id: 'user-emp-001', name: 'Janet Apio', email: 'janet@aims.org', role: 'INNOVATOR', department: 'Research', status: 'active', createdAt: '2025-06-15' },
];

export function PeopleTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);

  const filtered = MOCK_EMPLOYEES.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800">People Directory</h2>
        <p className="text-sm text-gray-500">View and manage employee profiles</p>
      </div>

      <input
        type="text"
        placeholder="Search by name or email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aims-mint/50 mb-4"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((employee) => (
          <button
            key={employee.id}
            onClick={() => setSelectedEmployee(employee)}
            className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-aims-mint flex items-center justify-center text-white font-bold">
                {employee.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{employee.name}</p>
                <p className="text-xs text-gray-500">{ROLE_LABELS[employee.role]}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">{employee.email}</p>
              <p className="text-xs text-gray-400 mt-1">{employee.department}</p>
            </div>
          </button>
        ))}
      </div>

      {selectedEmployee && (
        <EmployeeProfileModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
}

function EmployeeProfileModal({ employee, onClose }: { employee: User; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-aims-mint flex items-center justify-center text-white text-2xl font-bold">
            {employee.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{employee.name}</h3>
            <p className="text-sm text-gray-500">{ROLE_LABELS[employee.role]}</p>
          </div>
        </div>

        <div className="space-y-3">
          <InfoRow label="Email" value={employee.email} />
          <InfoRow label="Department" value={employee.department} />
          <InfoRow label="Status" value={employee.status} />
          <InfoRow label="Joined" value={employee.createdAt} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800 capitalize">{value}</span>
    </div>
  );
}