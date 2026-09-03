// src/pages/UserManagement.tsx
// ============================================================
// AIMS — USER MANAGEMENT & PROVISIONING (Company Admin)
// Directory · Onboarding Pipeline · Offboarding Pipeline ·
// Role & Permissions · Audit Trail
// All records and actions live in the persisted user-ops store
// (userOpsService) — role changes, status toggles, credential
// resets, API keys, MFA resets and exports are real, and every
// operation lands in the audit log.
// ============================================================

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { useLiveData } from '@/lib/useLiveData';
import { exportCsv, exportRecordSheet } from '@/lib/export';
import type { Role } from '@/types';
import { ROLE_LABELS } from '@/config/roles';
import {
  userOpsGet, setUserRole, toggleUserStatus, resetCredential, reissueApiKey, resetMfa,
  advanceOnboard, addOnboardee, type ManagedUser,
} from '@/services/userOpsService';
import { OffboardingTab } from '@/components/admin/OffboardingTab';
import { openEmployeeOnboarding } from '@/components/hr/EmployeeOnboardingForm';

type TabKey = 'directory' | 'onboarding' | 'offboarding' | 'roles' | 'audit';

const TABS: { id: TabKey; label: string; icon: string }[] = [
  { id: 'directory', label: 'Directory', icon: 'groups' },
  { id: 'onboarding', label: 'Onboarding Pipeline', icon: 'person_add' },
  { id: 'offboarding', label: 'Offboarding Pipeline', icon: 'person_remove' },
  { id: 'roles', label: 'Role & Permissions', icon: 'admin_panel_settings' },
  { id: 'audit', label: 'Audit Trail', icon: 'history' },
];

const ROLE_OPTIONS: { role: Role; note: string }[] = [
  { role: 'GRANTS_MANAGER', note: 'Approve grants, manage pipeline' },
  { role: 'GRANT_WRITER', note: 'Draft & submit proposals' },
  { role: 'INNOVATOR', note: 'Innovations & tasks module' },
  { role: 'FINANCE', note: 'Finance, procurement, approvals' },
  { role: 'COMPANY_ADMIN', note: 'People, inventory, daily operations' },
  { role: 'ED', note: 'Organization-wide, final approvals' },
];

function stepCount(steps: { done: boolean }[]): { done: number; total: number; pct: number } {
  const done = steps.filter((s) => s.done).length;
  return { done, total: steps.length, pct: Math.round((done / steps.length) * 100) };
}

export function UserManagement() {
  const { user } = useAuth();
  const location = useLocation();
  const { showToast } = useNotifications();
  const actor = user?.name ?? 'HR Admin';
  const initialTab = (location.state as { tab?: TabKey } | null)?.tab ?? 'directory';
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  useLiveData();

  // Directory filters
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  const [showAddHire, setShowAddHire] = useState(false);
  const [newHireName, setNewHireName] = useState('');
  const [newHireRole, setNewHireRole] = useState<string>('GRANT_WRITER');
  const [newHireEmail, setNewHireEmail] = useState('');
  const [newHireStart, setNewHireStart] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [roleTarget, setRoleTarget] = useState<ManagedUser | null>(null);
  const [newRole, setNewRole] = useState<Role>('GRANT_WRITER');
  const [auditFilter, setAuditFilter] = useState('');
  const [showTemplate, setShowTemplate] = useState(false);

  const users = userOpsGet.users();
  const audit = userOpsGet.audit();
  const onboardees = userOpsGet.onboardees();
  const depts = Array.from(new Set(users.map((u) => u.department)));

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (filterDept !== 'all' && u.department !== filterDept) return false;
    if (filterStatus !== 'all' && u.status !== filterStatus) return false;
    return true;
  });
  const activeCount = users.filter((u) => u.status === 'active').length;
  const inactiveCount = users.filter((u) => u.status === 'inactive').length;

  const filteredAudit = audit.filter((a) => {
    const q = auditFilter.toLowerCase();
    if (!q) return true;
    return a.user.toLowerCase().includes(q) || a.action.toLowerCase().includes(q) || a.by.toLowerCase().includes(q);
  });

  const exportAudit = () => {
    if (filteredAudit.length === 0) { showToast({ title: 'Nothing to Export', message: 'No audit rows match your filter.', type: 'error' }); return; }
    exportCsv('aims-user-audit-log', filteredAudit.map((a) => ({ time: a.ts, user: a.user, action: a.action, by: a.by })));
    showToast({ title: 'CSV Exported', message: `${filteredAudit.length} audit row(s).`, type: 'success' });
  };

  const downloadProfile = (u: ManagedUser) => {
    exportRecordSheet(`${u.name} profile`, 'User Account Profile', [
      ['Name', u.name], ['Email', u.email], ['Role', ROLE_LABELS[u.role]], ['Department', u.department],
      ['Position', u.position], ['Status', u.status], ['Provisioned', u.provisioned ? 'Yes' : 'No'],
      ['MFA', u.mfaEnabled ? 'Enabled' : 'Not enrolled'], ['API Key', u.apiKey ?? '—'], ['Credential version', String(u.credentialVersion)],
    ]);
    showToast({ title: 'Profile Downloaded', message: `${u.name} — account record sheet.`, type: 'success' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">User Management & Provisioning</h1>
        <p className="text-base font-medium text-white">Directory, onboarding, offboarding, roles and account audit</p>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors', activeTab === tab.id ? 'bg-white text-aims-navy shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* ── DIRECTORY ── */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-green p-4 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Users</p><p className="text-2xl font-extrabold text-slate-900 mt-1">{activeCount}</p></div>
            <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-orange p-4 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inactive</p><p className="text-2xl font-extrabold text-slate-900 mt-1">{inactiveCount}</p></div>
            <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-navy p-4 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Accounts</p><p className="text-2xl font-extrabold text-slate-900 mt-1">{users.length}</p></div>
            <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-mint p-4 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Provision</p><p className="text-2xl font-extrabold text-slate-900 mt-1">{users.filter((u) => !u.provisioned).length}</p></div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap gap-2">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…" className="flex-1 min-w-[180px] text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-3 py-2"><option value="all">All roles</option>{Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-3 py-2"><option value="all">All departments</option>{depts.map((d) => <option key={d}>{d}</option>)}</select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-3 py-2"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b border-slate-200"><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Name</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Email</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Role</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Department</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Status</th><th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-aims-navy text-white flex items-center justify-center text-[10px] font-bold">{u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
                          <div><p className="font-bold text-slate-900">{u.name}</p><p className="text-[10px] text-slate-400">{u.position}</p></div>
                        </div>
                      </td>
                      <td className="py-2.5 text-slate-600 text-xs">{u.email}</td>
                      <td className="py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded bg-aims-navy/10 text-aims-navy uppercase">{u.role.replace('_', ' ')}</span></td>
                      <td className="py-2.5 text-slate-600 text-xs">{u.department}</td>
                      <td className="py-2.5">
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded uppercase', u.status === 'active' ? 'bg-aims-green/15 text-aims-green' : 'bg-slate-100 text-slate-500')}>{u.status}</span>
                        {u.mfaEnabled && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded ml-1 bg-aims-navy/10 text-aims-navy">MFA</span>}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button onClick={() => setSelectedUser(u)} className="text-[10px] font-bold text-aims-navy hover:underline">View Profile</button>
                          <button onClick={() => { setRoleTarget(u); setNewRole(u.role); }} className="text-[10px] font-bold text-aims-navy hover:underline">Edit Role</button>
                          <button onClick={() => { const r = resetCredential(u.id, actor); if (r) showToast({ title: 'Credential Reset', message: `Temporary code for ${r.user.email}: ${r.code}`, type: 'info' }); }} className="text-[10px] font-bold text-aims-navy hover:underline">Reset Credential</button>
                          <button onClick={() => { const r = toggleUserStatus(u.id, actor); if (r) showToast({ title: r.status === 'inactive' ? 'Account Deactivated' : 'Account Reactivated', message: `${r.name} ${r.status}.`, type: 'info' }); }} className="text-[10px] font-bold text-red-500 hover:underline">{u.status === 'active' ? 'Deactivate' : 'Reactivate'}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── ONBOARDING ── */}
      {activeTab === 'onboarding' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm font-bold text-slate-700">New Hires In Pipeline: <span className="text-aims-navy">{onboardees.length}</span></p>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={openEmployeeOnboarding} className="px-4 py-2 border border-aims-navy/30 text-aims-navy text-xs font-bold rounded-lg hover:bg-aims-navy/5 flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">description</span>Employee Information Form</button>
              <button onClick={() => setShowAddHire(true)} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">person_add</span>Add New Hire</button>
            </div>
          </div>
          {onboardees.map((ob) => {
            const { done, total, pct } = stepCount(ob.steps);
            return (
              <div key={ob.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-aims-green text-white flex items-center justify-center font-bold text-sm">{ob.name[0]}</div>
                    <div><p className="text-base font-extrabold text-slate-900">{ob.name}</p><p className="text-xs text-slate-500">Hired: {ob.hired}{ob.role ? ` · ${ROLE_LABELS[ob.role as Role] ?? ob.role}` : ''}{ob.email ? ` · ${ob.email}` : ''}</p></div>
                  </div>
                  <div className="w-32"><div className="flex justify-between text-[10px] mb-0.5"><span className="font-semibold text-slate-500">Timeline</span><span className="font-bold text-slate-900">{done}/{total} ({pct}%)</span></div><div className="w-full bg-slate-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-aims-green" style={{ width: `${pct}%` }} /></div></div>
                </div>
                <div className="space-y-2">
                  {ob.steps.map((s, i) => (
                    <div key={s.id} className={cn('flex items-start gap-3 p-3 rounded-lg border', s.done ? 'bg-aims-green/5 border-aims-green/20' : 'bg-slate-50 border-slate-100')}>
                      <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0', s.done ? 'bg-aims-green text-white' : 'bg-slate-200 text-slate-500')}>
                        <span className="material-symbols-outlined text-[14px]">{s.done ? 'check' : i === 0 ? '1' : i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-bold', s.done ? 'text-slate-500 line-through' : 'text-slate-900')}>{s.label}</p>
                        {s.detail && <p className="text-[10px] text-slate-500 mt-0.5">{s.detail}</p>}
                      </div>
                      {!s.done && (
                        <button onClick={() => { advanceOnboard(ob.id, s.id, actor); showToast({ title: 'Step Completed', message: `${s.label} recorded for ${ob.name}.`, type: 'success' }); }} className="text-[10px] font-bold text-aims-green hover:underline shrink-0">Mark Complete</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { onboardees.forEach((ob) => ob.steps.forEach((s) => { if (!s.done) advanceOnboard(ob.id, s.id, actor); })); showToast({ title: 'Checklist Complete', message: 'All onboarding steps completed.', type: 'success' }); }} className="px-4 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90">Complete All Steps</button>
            <button onClick={() => setShowTemplate(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50">View Checklist Template</button>
          </div>
        </div>
      )}

      {/* ── OFFBOARDING ── */}
      {activeTab === 'offboarding' && <OffboardingTab />}

      {/* ── ROLE & PERMISSIONS ── */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm max-w-2xl">
          <h3 className="text-base font-bold text-slate-900 mb-1">Role & Permission Management</h3>
          <p className="text-xs text-slate-500 mb-4">Assign or change roles for any user. Changes are recorded in the audit trail.</p>
          <input type="text" value={roleSearch} onChange={(e) => setRoleSearch(e.target.value)} placeholder="Search user…" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
          <div className="space-y-2 mb-4 max-h-56 overflow-y-auto">
            {users.filter((u) => !roleSearch || u.name.toLowerCase().includes(roleSearch.toLowerCase())).map((u) => (
              <button key={u.id} onClick={() => { setRoleTarget(u); setNewRole(u.role); }} className={cn('w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-colors', roleTarget?.id === u.id ? 'border-aims-navy bg-aims-navy/5' : 'border-slate-100 hover:bg-slate-50')}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-aims-navy text-white flex items-center justify-center text-[9px] font-bold">{u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
                  <div><p className="text-xs font-bold text-slate-900">{u.name}</p><p className="text-[10px] text-slate-400">{u.email}</p></div>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-aims-navy/10 text-aims-navy uppercase">{u.role.replace('_', ' ')}</span>
              </button>
            ))}
          </div>
          {roleTarget ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">{roleTarget.name}</p>
                  <p className="text-xs text-slate-500">Current role: <span className="font-bold text-aims-navy">{ROLE_LABELS[roleTarget.role]}</span>{roleTarget.apiKey && ' · API key set'}{roleTarget.mfaEnabled && ' · MFA on'}</p>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Change Role To</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value as Role)} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white">
                  {ROLE_OPTIONS.map((o) => <option key={o.role} value={o.role}>{ROLE_LABELS[o.role]} — {o.note}</option>)}
                </select>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => { const u = setUserRole(roleTarget.id, newRole, actor); if (u) { showToast({ title: 'Role Updated', message: `${u.name} is now ${ROLE_LABELS[u.role]}.`, type: 'success' }); setRoleTarget(null); } }} className="px-4 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90">Save Changes</button>
                <button onClick={() => { const r = resetCredential(roleTarget.id, actor); if (r) showToast({ title: 'Password Reset', message: `Temporary code for ${r.user.email}: ${r.code}`, type: 'info' }); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50">Reset Password</button>
                <button onClick={() => { const r = reissueApiKey(roleTarget.id, actor); if (r) showToast({ title: 'API Key Reissued', message: `New key for ${r.user.name}: ${r.key}`, type: 'info' }); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50">Reissue API Key</button>
                <button onClick={() => { const r = resetMfa(roleTarget.id, actor); if (r) showToast({ title: 'MFA Reset', message: `${r.name} must re-enroll for MFA.`, type: 'info' }); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50">Reset MFA</button>
                <button onClick={() => { const r = toggleUserStatus(roleTarget.id, actor); if (r) showToast({ title: 'Status Changed', message: `${r.name} is now ${r.status}.`, type: 'info' }); }} className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100">{roleTarget.status === 'active' ? 'Disable Account' : 'Enable Account'}</button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Select a user to manage their role and credentials.</p>
          )}
        </div>
      )}

      {/* ── AUDIT ── */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h3 className="text-base font-bold text-slate-900">User Account Action Log</h3>
            <div className="flex gap-2">
              <input type="text" value={auditFilter} onChange={(e) => setAuditFilter(e.target.value)} placeholder="Filter by user, action…" className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
              <button onClick={exportAudit} className="px-3 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">download</span>Export CSV</button>
            </div>
          </div>
          <div className="space-y-0 relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200" />
            {filteredAudit.map((a) => (
              <div key={a.id} className="relative flex gap-3 pb-4 last:pb-0">
                <div className="relative z-10 w-6 h-6 rounded-full bg-aims-navy flex items-center justify-center flex-shrink-0 border-2 border-white"><span className="material-symbols-outlined text-white text-[12px]">manage_accounts</span></div>
                <div className="pt-0.5">
                  <p className="text-sm text-slate-900"><span className="font-bold">{a.user}</span>: {a.action} <span className="text-slate-400">by {a.by}</span></p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{a.ts}</p>
                </div>
              </div>
            ))}
            {filteredAudit.length === 0 && <p className="text-xs text-slate-400 italic py-6 text-center">No audit rows match.</p>}
          </div>
        </div>
      )}

      {/* Profile modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 bg-aims-navy text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">{selectedUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
                <div><h3 className="text-sm font-bold">{selectedUser.name}</h3><p className="text-[11px] text-white/70">{selectedUser.position}</p></div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-white/80 hover:text-white"><span className="material-symbols-outlined text-[20px]">close</span></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Email</p><p className="text-xs font-bold text-slate-900 mt-0.5 break-all">{selectedUser.email}</p></div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Role</p><p className="text-xs font-bold text-slate-900 mt-0.5">{ROLE_LABELS[selectedUser.role]}</p></div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Department</p><p className="text-xs font-bold text-slate-900 mt-0.5">{selectedUser.department}</p></div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Status</p><p className="text-xs font-bold text-slate-900 mt-0.5 capitalize">{selectedUser.status}</p></div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button onClick={() => downloadProfile(selectedUser)} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg">Download Profile</button>
                <button onClick={() => { setRoleTarget(selectedUser); setNewRole(selectedUser.role); setSelectedUser(null); setActiveTab('roles'); }} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg">Edit Role</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add new hire modal */}
      {showAddHire && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowAddHire(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add New Hire</h3>
            <p className="text-xs text-slate-500 mb-4">Capture the hire's details — they enter the onboarding pipeline with a standard 4-step checklist.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name *</label>
                <input type="text" value={newHireName} onChange={(e) => setNewHireName(e.target.value)} placeholder="e.g. Rita Auma" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                <input type="email" value={newHireEmail} onChange={(e) => setNewHireEmail(e.target.value)} placeholder="rita.auma@ardhi.org.ug" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Planned Role</label>
                <select value={newHireRole} onChange={(e) => setNewHireRole(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30">
                  {ROLE_OPTIONS.map((o) => <option key={o.role} value={o.role}>{ROLE_LABELS[o.role]} — {o.note}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Start Date</label>
                <input type="date" value={newHireStart} onChange={(e) => setNewHireStart(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowAddHire(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancel</button>
              <button onClick={() => { if (!newHireName.trim()) return; addOnboardee({ name: newHireName.trim(), email: newHireEmail.trim() || undefined, role: newHireRole, startDate: newHireStart || undefined }); setNewHireName(''); setNewHireEmail(''); setNewHireStart(''); setShowAddHire(false); showToast({ title: 'New Hire Added', message: `${newHireName.trim()} added to the onboarding pipeline.`, type: 'success' }); }} disabled={!newHireName.trim()} className={cn('px-4 py-2 rounded-lg text-sm font-bold', newHireName.trim() ? 'bg-aims-green text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}>Add to Pipeline</button>
            </div>
          </div>
        </div>
      )}

      {/* Checklist template modal */}
      {showTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowTemplate(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Standard Onboarding Checklist</h3>
            <div className="space-y-2">
              {[['1', 'Provision Account', 'Create the login, set a temporary password, send welcome email'], ['2', 'Assign Role', 'Grant the correct persona role and module access'], ['3', 'Issue Credentials', 'Enable MFA and issue an API key where required'], ['4', 'Asset Issuance', 'Hand over laptop, phone and access card via Inventory']].map(([n, t, d]) => (
                <div key={n} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-aims-navy text-white flex items-center justify-center text-[11px] font-bold shrink-0">{n}</span>
                  <div><p className="text-sm font-bold text-slate-900">{t}</p><p className="text-[10px] text-slate-500">{d}</p></div>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4"><button onClick={() => setShowTemplate(false)} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg">Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
