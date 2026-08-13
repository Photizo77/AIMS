// src/components/admin/PeopleTab.tsx
import { useState } from 'react';
import type { User } from '@/types';
import { ROLE_LABELS } from '@/config/roles';

const MOCK_EMPLOYEES: (User & { position: string })[] = [
  { id: 'u1', name: 'Nassir Mwanje', email: 'cd@aims.org', role: 'CD', department: 'Executive', position: 'Country Director', avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=Nassir&backgroundColor=c1dbc3', status: 'active', createdAt: '2025-01-15' },
  { id: 'u2', name: 'Peter Byamugisha', email: 'ed@aims.org', role: 'ED', department: 'Executive', position: 'Executive Director', avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=Peter&backgroundColor=c1dbc3', status: 'active', createdAt: '2025-01-15' },
  { id: 'u3', name: 'Grace Aceng', email: 'admin@aims.org', role: 'COMPANY_ADMIN', department: 'Administration', position: 'Company Administrator', avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=Grace&backgroundColor=c1dbc3', status: 'active', createdAt: '2025-02-01' },
  { id: 'u4', name: 'Amos Ojok', email: 'finance@aims.org', role: 'FINANCE', department: 'Finance', position: 'Finance Officer', avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=Amos&backgroundColor=c1dbc3', status: 'active', createdAt: '2025-03-10' },
  { id: 'u5', name: 'Sarah Aciro', email: 'grantsmanager@aims.org', role: 'GRANTS_MANAGER', department: 'Grants', position: 'Grants Manager', avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=Sarah&backgroundColor=c1dbc3', status: 'active', createdAt: '2025-04-20' },
  { id: 'u6', name: 'Janet Apio', email: 'grants@aims.org', role: 'GRANT_WRITER', department: 'Grants', position: 'Grant Writer', avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=Janet&backgroundColor=c1dbc3', status: 'active', createdAt: '2025-05-05' },
  { id: 'u7', name: 'Pius Odong', email: 'innovation@aims.org', role: 'INNOVATOR', department: 'Innovation', position: 'Lead Innovator', avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=Pius&backgroundColor=c1dbc3', status: 'active', createdAt: '2025-05-05' },
];

export function PeopleTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterPosition, setFilterPosition] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<(User & { position: string }) | null>(null);

  const departments = ['all', ...Array.from(new Set(MOCK_EMPLOYEES.map(e => e.department)))];
  const positions = ['all', ...Array.from(new Set(MOCK_EMPLOYEES.map(e => e.position)))];

  const filtered = MOCK_EMPLOYEES.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept === 'all' || emp.department === filterDept;
    const matchesPos = filterPosition === 'all' || emp.position === filterPosition;
    return matchesSearch && matchesDept && matchesPos;
  });

  return (
    <div>
      <div className="mb-6"><h2 className="text-lg font-semibold text-slate-900">People Directory</h2><p className="text-sm text-slate-500">View employee profiles and contracts</p></div>

      {/* ADVANCED FILTERS */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 space-y-3">
        <input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aims-green/50" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm"><option value="all">All Departments</option>{departments.filter(d => d !== 'all').map(d => <option key={d}>{d}</option>)}</select>
          <select value={filterPosition} onChange={(e) => setFilterPosition(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm"><option value="all">All Positions</option>{positions.filter(p => p !== 'all').map(p => <option key={p}>{p}</option>)}</select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(employee => (
          <button key={employee.id} onClick={() => setSelectedEmployee(employee)} className="bg-white rounded-xl border border-slate-200 p-4 text-left hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              {employee.avatarUrl ? <img src={employee.avatarUrl} alt={employee.name} className="w-10 h-10 rounded-full border border-slate-200 object-cover" /> : <div className="w-10 h-10 rounded-full bg-aims-mint flex items-center justify-center text-white font-bold">{employee.name.charAt(0)}</div>}
              <div><p className="text-sm font-semibold text-slate-900">{employee.name}</p><p className="text-xs text-slate-500">{employee.position}</p></div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100"><p className="text-xs text-slate-500">{employee.email}</p><p className="text-xs text-slate-400 mt-1">{employee.department}</p></div>
          </button>
        ))}
      </div>

      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedEmployee(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <button onClick={() => setSelectedEmployee(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
            <div className="flex items-center gap-4 mb-6">
              {selectedEmployee.avatarUrl ? <img src={selectedEmployee.avatarUrl} alt={selectedEmployee.name} className="w-16 h-16 rounded-full border-2 border-slate-200 object-cover" /> : <div className="w-16 h-16 rounded-full bg-aims-mint flex items-center justify-center text-white text-2xl font-bold">{selectedEmployee.name.charAt(0)}</div>}
              <div><h3 className="text-lg font-bold text-slate-900">{selectedEmployee.name}</h3><p className="text-sm text-slate-500">{selectedEmployee.position}</p></div>
            </div>
            <div className="space-y-3">
              <InfoRow label="Email" value={selectedEmployee.email} />
              <InfoRow label="Department" value={selectedEmployee.department} />
              <InfoRow label="Role" value={ROLE_LABELS[selectedEmployee.role]} />
              <InfoRow label="Status" value={selectedEmployee.status} />
              <InfoRow label="Joined" value={selectedEmployee.createdAt} />
            </div>
            {/* READ-ONLY CONTRACT VIEW */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Employment Contract</p>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex items-center gap-3">
                <span className="material-symbols-outlined text-[24px] text-slate-400">description</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{selectedEmployee.name} — Employment Contract</p>
                  <p className="text-xs text-slate-500">Scanned PDF • Last updated Jan 2025</p>
                </div>
                <button className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold text-slate-700 transition-colors">View</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (<div className="flex justify-between py-2 border-b border-slate-50"><span className="text-sm text-slate-500">{label}</span><span className="text-sm font-medium text-slate-800 capitalize">{value}</span></div>);
}