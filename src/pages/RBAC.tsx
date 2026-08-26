// src/pages/RBAC.tsx
// ============================================================
// AIMS — Role-Based Access Control (System Admin) + System Forms
// ============================================================

import { RoleManager } from '@/components/rbac/RoleManager';
import { FormsShortcut } from '@/components/forms/FormsShortcut';

export function RBAC() {
  return (
    <div className="space-y-6">
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Role-Based Access Control</h1>
        <p className="text-base font-medium text-white">Assign and modify user roles across the system (System Admin only)</p>
      </div>
      <FormsShortcut module="rbac" title="System Forms — Incident Report · System Access Request" />
      <RoleManager />
    </div>
  );
}
