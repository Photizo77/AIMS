// src/pages/RBAC.tsx
// ============================================================
// AIMS — Role-Based Access Control (System Admin) + System Forms
// ============================================================

import { RoleManager } from '@/components/rbac/RoleManager';
import { FormsShortcut } from '@/components/forms/FormsShortcut';

export function RBAC() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Role-Based Access Control</h1>
        <p className="text-xs text-slate-500 mt-0.5">Assign and modify user roles across the system (System Admin only)</p>
      </div>
      <FormsShortcut module="rbac" title="System Forms — Incident Report · System Access Request" />
      <RoleManager />
    </div>
  );
}
