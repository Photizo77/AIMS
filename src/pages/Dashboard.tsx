// src/pages/Dashboard.tsx
// ============================================================
// AIMS — Role-Based Persona Dashboards
// Includes: Deadline Reminders, Executive Control Panel,
//           Analytics Bars, and all 6 persona views
// ============================================================

import { type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';

type ColorKey = 'green' | 'navy' | 'orange' | 'mint';
const CHIP: Record<ColorKey, string> = { green: 'bg-aims-green text-white', navy: 'bg-aims-navy text-white', orange: 'bg-aims-orange text-white', mint: 'bg-aims-mint text-aims-green' };
const ACCENT: Record<ColorKey, string> = { green: 'border-t-aims-green', navy: 'border-t-aims-navy', orange: 'border-t-aims-orange', mint: 'border-t-aims-mint' };
const FILL: Record<ColorKey, string> = { green: 'bg-aims-green', navy: 'bg-aims-navy', orange: 'bg-aims-orange', mint: 'bg-aims-green' };

export function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;
  const role = user.role;
  if (role === 'CD' || role === 'ED') return <ExecutiveDashboard />;
  if (role === 'COMPANY_ADMIN') return <AdminDashboard />;
  if (role === 'FINANCE') return <FinanceDashboard />;
  if (role === 'GRANT_WRITER' || role === 'GRANTS_MANAGER') return <GrantDashboard />;
  if (role === 'INNOVATOR') return <InnovatorDashboard />;
  if (role === 'SYS_ADMIN') return <SysAdminDashboard />;
  return <DefaultDashboard />;
}

// ═════════════════════════════════════════════
// 1. EXECUTIVE DASHBOARD (CD / ED)
// ═════════════════════════════════════════════
function ExecutiveDashboard() {
  const { showToast } = useNotifications();
  const handleAction = (msg: string) => showToast({ title: 'Action Logged', message: msg, type: 'success' });

  // Deadline reminder data
  const urgentGrants = [
    { id: 'g3', title: 'Community Land Rights Documentation', uniqueId: 'GRANT-LAND-2026-001', days: 7, status: 'ED Review' },
    { id: 'g1', title: 'Climate-Smart Farming Initiative', uniqueId: 'GRANT-AGRIC-2026-001', days: 15, status: 'Team Lead Review' },
  ].filter(g => g.days <= 14);

  return (
    <div className="space-y-6">
      <DashHeader gradient="bg-grad-navy" title="Executive Command Center" subtitle="Strategic oversight, approvals & operational control" />

      <div className="grid grid-cols-1 sm:grid-cols-