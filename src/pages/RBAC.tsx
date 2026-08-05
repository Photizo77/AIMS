// src/pages/RBAC.tsx
// ============================================================
// AIMS — Role-Based Access Control (System Admin)
// ============================================================

import { RoleManager } from '@/components/rbac/RoleManager';

export function RBAC() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Role Management</h1>
        <p className="text-sm text-gray-500 mt-1">Assign and modify user roles across the system (System Admin only)</p>
      </div>
      <RoleManager />
    </div>
  );
}