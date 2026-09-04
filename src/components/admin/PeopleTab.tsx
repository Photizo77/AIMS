// src/components/admin/PeopleTab.tsx
import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import type { User } from '@/types';
import { ROLE_LABELS } from '@/config/roles';
import { ACTIVE_STAFF } from '@/data/roster';
import { useLiveData } from '@/lib/useLiveData';
import { getDirectoryEntries, type DirectoryEntry } from '@/services/employeeService';
import { openEmployeeOnboarding } from '@/components/hr/EmployeeOnboardingForm';
import { contractsFor, contractsByName, addContract, contractGet, type ContractRecord } from '@/services/contractService';
import { ContractScanViewer } from '@/components/hr/ContractScanViewer';

// Unified staff roster — the single source of truth for people
const MOCK_EMPLOYEES: (User & { position: string })[] = ACTIVE_STAFF.map((s) => ({
  id: s.id, name: s.name, email: s.email, role: s.role, department: s.department,
  position: s.position, status: s.status, createdAt: '2025-01-15',
}));

export function PeopleTab() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterPosition, setFilterPosition] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<(User & { position: string }) | DirectoryEntry | null>(null);
  const [viewingContract, setViewingContract] = useState<ContractRecord | null>(null);
  const live = useLiveData();

  const canManage = user?.role === 'COMPANY_ADMIN' || user?.role === 'ED';

  // Roster + employees added through the onboarding form (auto-updates live)
  const employees = useMemo(() => [...MOCK_EMPLOYEES, ...getDirectoryEntries()], [live]);
  const onboardingCount = getDirectoryEntries().length;

  const contractsOf = (emp: (User & { position: string }) | DirectoryEntry): ContractRecord[] => {
    const byId = contractsFor(emp.id);
    return byId.length > 0 ? byId : contractsByName(emp.name);
  };

  const openNewContract = (emp: (User & { position: string }) | DirectoryEntry) => {
    const created = addContract({ employeeId: emp.id, employeeName: emp.name, type: 'permanent', startDate: new Date().toISOString().slice(0, 10), salary: 0 });
    setViewingContract(created);
  };

  const refreshViewer = () => {
    if (viewingContract) {
      const fresh = contractGet().find((c) => c.id === viewingContract.id);
      if (fresh) setViewingContract(fresh);
    }
  };

  const departments = ['all', ...Array.from(new Set(employees.map(e => e.department)))];
  const positions = ['all', ...Array.from(new Set(employees.map(e => e.position)))];

  const filtered = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept === 'all' || emp.department === filterDept;
    const matchesPos = filterPosition === 'all' || emp.position === filterPosition;
    return matchesSearch && matchesDept && matchesPos;
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">People Directory</h2>
          <p className="text-sm text-slate-500">View employee profiles and contracts{onboardingCount > 0 ? ` · ${onboardingCount} new hire(s) in onboarding` : ''}</p>
        </div>
        <button onClick={openEmployeeOnboarding} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">person_add</span>Add Employee
        </button>
      </div>

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
              {avatarOf(employee) ? <img src={avatarOf(employee)} alt={employee.name} className="w-10 h-10 rounded-full border border-slate-200 object-cover" /> : <div className="w-10 h-10 rounded-full bg-aims-mint flex items-center justify-center text-white font-bold">{employee.name.charAt(0)}</div>}
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
              {avatarOf(selectedEmployee) ? <img src={avatarOf(selectedEmployee)} alt={selectedEmployee.name} className="w-16 h-16 rounded-full border-2 border-slate-200 object-cover" /> : <div className="w-16 h-16 rounded-full bg-aims-mint flex items-center justify-center text-white text-2xl font-bold">{selectedEmployee.name.charAt(0)}</div>}
              <div><h3 className="text-lg font-bold text-slate-900">{selectedEmployee.name}</h3><p className="text-sm text-slate-500">{selectedEmployee.position}</p></div>
            </div>
            <div className="space-y-3">
              <InfoRow label="Email" value={selectedEmployee.email} />
              <InfoRow label="Department" value={selectedEmployee.department} />
              <InfoRow label="Role" value={ROLE_LABELS[selectedEmployee.role]} />
              <InfoRow label="Status" value={selectedEmployee.status} />
              <InfoRow label="Joined" value={selectedEmployee.createdAt} />
            </div>
            {/* CONTRACTS ON FILE */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-500 uppercase">Contracts on file ({contractsOf(selectedEmployee).length})</p>
                {canManage && <button onClick={() => openNewContract(selectedEmployee)} className="text-[10px] font-bold text-aims-navy hover:underline">+ New / Attach</button>}
              </div>
              {contractsOf(selectedEmployee).length === 0 ? (
                <div className="bg-slate-50 rounded-lg p-4 border border-dashed border-slate-200 text-center">
                  <span className="material-symbols-outlined text-[22px] text-slate-300 block">description</span>
                  <p className="text-xs text-slate-500 mt-1">No contract on file yet.</p>
                  {canManage && <button onClick={() => openNewContract(selectedEmployee)} className="mt-2 px-3 py-1.5 bg-aims-navy text-white text-[10px] font-bold rounded-lg hover:bg-aims-navy/90">Create Contract & Attach Scan</button>}
                </div>
              ) : (
                <div className="space-y-2">
                  {contractsOf(selectedEmployee).map((c) => (
                    <div key={c.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-slate-400">description</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 capitalize truncate">{c.type} contract</p>
                        <p className="text-[10px] text-slate-500">{c.startDate}{c.endDate ? ` → ${c.endDate}` : ' · open-ended'} · {c.status.replace('_', ' ')}{c.scanDataUrl ? ' · 📄 scan on file' : ' · no scan yet'}</p>
                      </div>
                      <button onClick={() => setViewingContract(c)} className={cn('px-3 py-1.5 rounded-lg text-[10px] font-bold', c.scanDataUrl ? 'bg-aims-navy text-white hover:bg-aims-navy/90' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100')}>View Scan</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scanned contract viewer */}
      {viewingContract && (
        <ContractScanViewer
          contract={viewingContract}
          canManage={canManage}
          onClose={() => setViewingContract(null)}
          onChanged={refreshViewer}
        />
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (<div className="flex justify-between py-2 border-b border-slate-50"><span className="text-sm text-slate-500">{label}</span><span className="text-sm font-medium text-slate-800 capitalize">{value}</span></div>);
}

/** Avatar URL, safe across roster employees and onboarding entries */
function avatarOf(e: (User & { position: string }) | DirectoryEntry): string | undefined {
  return (e as { avatarUrl?: string }).avatarUrl;
}