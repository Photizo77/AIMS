// src/pages/Dashboard.tsx
// ============================================================
// AIMS — Role-Based Dashboard
// ============================================================

import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/config/roles';
import { SysAdminDashboard } from '@/components/dashboard/SysAdminDashboard';

export function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  // System Admin gets the technical dashboard
  if (user.role === 'SYS_ADMIN') {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">System Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, {user.name} — {ROLE_LABELS[user.role]}
          </p>
        </div>
        <SysAdminDashboard />
      </div>
    );
  }

  // Default dashboard for other roles
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, {user.name} — {ROLE_LABELS[user.role]}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Pending Tasks</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">12</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Notifications</p>
          <p className="text-2xl font-bold text-aims-mint mt-1">5</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Active Projects</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">8</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Team Members</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">24</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction label="View Feed" icon="feed" />
          <QuickAction label="My Tasks" icon="task_alt" />
          <QuickAction label="Documents" icon="folder" />
          <QuickAction label="Settings" icon="settings" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ label, icon }: { label: string; icon: string }) {
  return (
    <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
      <span className="material-symbols-outlined text-[24px] text-aims-mint">{icon}</span>
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </button>
  );
}