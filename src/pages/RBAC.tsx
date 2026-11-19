// src/pages/RBAC.tsx
// ============================================================
// AIMS — Role-Based Access Control (System Admin) + System Forms
// ============================================================

import { RoleManager } from '@/components/rbac/RoleManager';
import { FormsShortcut } from '@/components/forms/FormsShortcut';
import { PageHero } from '@/components/ui/PageHero';

export function RBAC() {
  return (
    <div className="space-y-6">
      <PageHero title="Role-Based Access Control" subtitle="Assign and modify user roles across the system (System Admin only)" icon="admin_panel_settings" />
      <FormsShortcut module="rbac" title="System Forms — Incident Report · System Access Request" />
      <RoleManager />
    </div>
  );
}
