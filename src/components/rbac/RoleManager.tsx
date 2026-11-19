import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useLiveData } from '@/lib/useLiveData';
import { ROLE_LABELS, ROLE_HIERARCHY } from '@/config/roles';
import { userOpsGet, setUserRole } from '@/services/userOpsService';
import type { Role } from '@/types';

const ROLE_COLORS: Record<Role, string> = {
  CD: 'bg-purple-100 text-purple-700',
  ED: 'bg-indigo-100 text-indigo-700',
  SYS_ADMIN: 'bg-red-100 text-red-700',
  COMPANY_ADMIN: 'bg-blue-100 text-blue-700',
  FINANCE: 'bg-green-100 text-green-700',
  GRANTS_MANAGER: 'bg-cyan-100 text-cyan-700',
  GRANT_WRITER: 'bg-yellow-100 text-yellow-700',
  INNOVATOR: 'bg-orange-100 text-orange-700',
};

export function RoleManager() {
  const { user: actor } = useAuth();
  const { showToast } = useNotifications();
  const [filterRole, setFilterRole] = useState<string>('all');
  useLiveData();

  // Live account directory — no seeded users (the organisation starts empty)
  const users = userOpsGet.users();

  const filtered = filterRole === 'all' ? users : users.filter((u) => u.role === filterRole);

  const handleRoleChange = (userId: string, newRole: Role) => {
    const updated = setUserRole(userId, newRole, actor?.name ?? 'Company Admin');
    showToast({
      title: updated ? 'Role Updated' : 'Role Not Saved',
      message: updated ? `${updated.name} is now ${ROLE_LABELS[newRole]} — recorded in the audit trail.` : 'That account no longer exists.',
      type: updated ? 'success' : 'error',
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="all">All Roles</option>
          {Object.keys(ROLE_LABELS).map((role) => (
            <option key={role} value={role}>{ROLE_LABELS[role as Role]}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Department</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Current Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Change Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Authority</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-xs text-slate-400 italic">No accounts yet — employees appear here once they are provisioned in the onboarding pipeline.</td></tr>
            )}
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{user.department}</td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium', ROLE_COLORS[user.role])}>
                    {ROLE_LABELS[user.role]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                    className="px-2 py-1 border border-gray-200 rounded text-xs"
                  >
                    {Object.keys(ROLE_LABELS).map((role) => (
                      <option key={role} value={role}>{ROLE_LABELS[role as Role]}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="w-16 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-aims-mint h-2 rounded-full transition-all"
                      style={{ width: `${(ROLE_HIERARCHY[user.role] / 100) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">{ROLE_HIERARCHY[user.role]}/100</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}