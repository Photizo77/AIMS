// src/config/navigation.ts
import type { NavItem, Role } from '@/types';

const CD_NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: 'dashboard', roles: ['CD'] },
  { title: 'Grants', href: '/dashboard?view=grants', icon: 'volunteer_activism', roles: ['CD'] },
  { title: 'Approvals in Progress', href: '/approvals?view=readonly', icon: 'visibility', roles: ['CD'] },
  { title: 'Finance & Procurement', href: '/dashboard?view=finance', icon: 'account_balance', roles: ['CD'] },
  { title: 'Attendance', href: '/attendance?view=read', icon: 'schedule', roles: ['CD'] },
  { title: 'HR & Admin Summary', href: '/dashboard?view=hr', icon: 'people', roles: ['CD'] },
  { title: 'Innovations & Tasks', href: '/dashboard?view=innovations', icon: 'lightbulb', roles: ['CD'] },
  { title: 'Documents', href: '/documents', icon: 'folder', roles: ['CD'] },
  { title: 'Inventory', href: '/dashboard?view=inventory', icon: 'inventory_2', roles: ['CD'] },
  { title: 'Feed', href: '/feed', icon: 'feed', roles: ['CD'] },
  { title: 'Email', href: '/email', icon: 'mail', roles: ['CD'] },
  { title: 'Calendar', href: '/calendar', icon: 'calendar_month', roles: ['CD'] },
  { title: 'Reports', href: '/reports', icon: 'summarize', roles: ['CD'] },
  { title: 'Settings', href: '/settings', icon: 'settings', roles: ['CD'] },
];

const ED_NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: 'dashboard', roles: ['ED'] },
  { title: 'Grants', href: '/grants', icon: 'volunteer_activism', roles: ['ED'] },
  { title: 'Approvals Queue', href: '/approvals', icon: 'approval', roles: ['ED'] },
  { title: 'Finance & Procurement', href: '/dashboard?view=finance', icon: 'account_balance', roles: ['ED'] },
  { title: 'Attendance', href: '/attendance', icon: 'schedule', roles: ['ED'] },
  { title: 'HR & People Management', href: '/hr', icon: 'people', roles: ['ED'] },
  { title: 'Innovations & Tasks', href: '/dashboard?view=innovations', icon: 'lightbulb', roles: ['ED'] },
  { title: 'Inventory', href: '/inventory', icon: 'inventory_2', roles: ['ED'] },
  { title: 'Documents', href: '/documents', icon: 'folder', roles: ['ED'] },
  { title: 'Feed', href: '/feed', icon: 'feed', roles: ['ED'] },
  { title: 'Email', href: '/email', icon: 'mail', roles: ['ED'] },
  { title: 'Calendar', href: '/calendar', icon: 'calendar_month', roles: ['ED'] },
  { title: 'Reports', href: '/reports', icon: 'summarize', roles: ['ED'] },
  { title: 'Settings', href: '/settings', icon: 'settings', roles: ['ED'] },
];

const COMPANY_ADMIN_NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: 'dashboard', roles: ['COMPANY_ADMIN'] },
  { title: 'User Management', href: '/user-management', icon: 'manage_accounts', roles: ['COMPANY_ADMIN'] },
  { title: 'Attendance', href: '/attendance', icon: 'schedule', roles: ['COMPANY_ADMIN'] },
  { title: 'HR & People Management', href: '/hr', icon: 'people', roles: ['COMPANY_ADMIN'] },
  { title: 'Inventory Management', href: '/inventory', icon: 'inventory_2', roles: ['COMPANY_ADMIN'] },
  { title: 'Documents', href: '/documents', icon: 'folder', roles: ['COMPANY_ADMIN'] },
  { title: 'Feed', href: '/feed', icon: 'feed', roles: ['COMPANY_ADMIN'] },
  { title: 'Email', href: '/email', icon: 'mail', roles: ['COMPANY_ADMIN'] },
  { title: 'Settings', href: '/settings', icon: 'settings', roles: ['COMPANY_ADMIN'] },
];

const SYS_ADMIN_NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: 'dashboard', roles: ['SYS_ADMIN'] },
  { title: 'System Telemetry & Logs', href: '/analytics', icon: 'monitoring', roles: ['SYS_ADMIN'] },
  { title: 'Audit & Security Logs', href: '/rbac?tab=audit', icon: 'shield', roles: ['SYS_ADMIN'] },
  { title: 'System Configuration', href: '/rbac', icon: 'admin_panel_settings', roles: ['SYS_ADMIN'] },
  { title: 'Full Route Access', href: '/rbac?tab=routes', icon: 'bug_report', roles: ['SYS_ADMIN'] },
  { title: 'Feed', href: '/feed', icon: 'feed', roles: ['SYS_ADMIN'] },
  { title: 'Calendar', href: '/calendar', icon: 'calendar_month', roles: ['SYS_ADMIN'] },
  { title: 'Reports', href: '/reports', icon: 'summarize', roles: ['SYS_ADMIN'] },
  { title: 'Email', href: '/email', icon: 'mail', roles: ['SYS_ADMIN'] },
  { title: 'Settings', href: '/settings', icon: 'settings', roles: ['SYS_ADMIN'] },
];

const FINANCE_NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: 'dashboard', roles: ['FINANCE'] },
  { title: 'Requisition Queue', href: '/approvals', icon: 'request_quote', roles: ['FINANCE'] },
  { title: 'Cash Flow Analytics', href: '/finance', icon: 'account_balance', roles: ['FINANCE'] },
  { title: 'My Attendance', href: '/attendance', icon: 'schedule', roles: ['FINANCE'] },
  { title: 'Feed', href: '/feed', icon: 'feed', roles: ['FINANCE'] },
  { title: 'Email', href: '/email', icon: 'mail', roles: ['FINANCE'] },
  { title: 'Settings', href: '/settings', icon: 'settings', roles: ['FINANCE'] },
];

const GRANT_WRITER_NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: 'dashboard', roles: ['GRANT_WRITER', 'GRANTS_MANAGER'] },
  { title: 'Grants', href: '/grants', icon: 'volunteer_activism', roles: ['GRANT_WRITER', 'GRANTS_MANAGER'] },
  { title: 'AI Assistant', href: '/ai-assistant', icon: 'smart_toy', roles: ['GRANT_WRITER', 'GRANTS_MANAGER'] },
  { title: 'My Attendance', href: '/attendance', icon: 'schedule', roles: ['GRANT_WRITER', 'GRANTS_MANAGER'] },
  { title: 'Calendar', href: '/calendar', icon: 'calendar_month', roles: ['GRANT_WRITER', 'GRANTS_MANAGER'] },
  { title: 'Feed', href: '/feed', icon: 'feed', roles: ['GRANT_WRITER', 'GRANTS_MANAGER'] },
  { title: 'Email', href: '/email', icon: 'mail', roles: ['GRANT_WRITER', 'GRANTS_MANAGER'] },
  { title: 'Settings', href: '/settings', icon: 'settings', roles: ['GRANT_WRITER', 'GRANTS_MANAGER'] },
];

const INNOVATOR_NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: 'dashboard', roles: ['INNOVATOR'] },
  { title: 'Innovations & Tasks', href: '/tasks', icon: 'lightbulb', roles: ['INNOVATOR'] },
  { title: 'My Attendance', href: '/attendance', icon: 'schedule', roles: ['INNOVATOR'] },
  { title: 'Calendar', href: '/calendar', icon: 'calendar_month', roles: ['INNOVATOR'] },
  { title: 'Feed', href: '/feed', icon: 'feed', roles: ['INNOVATOR'] },
  { title: 'Email', href: '/email', icon: 'mail', roles: ['INNOVATOR'] },
  { title: 'Settings', href: '/settings', icon: 'settings', roles: ['INNOVATOR'] },
];

export const NAV_ITEMS: NavItem[] = [
  ...CD_NAV_ITEMS, ...ED_NAV_ITEMS, ...COMPANY_ADMIN_NAV_ITEMS, ...SYS_ADMIN_NAV_ITEMS,
  ...FINANCE_NAV_ITEMS, ...GRANT_WRITER_NAV_ITEMS, ...INNOVATOR_NAV_ITEMS,
];

export function getVisibleNavItems(userRole: Role): NavItem[] {
  if (userRole === 'CD') return CD_NAV_ITEMS;
  if (userRole === 'ED') return ED_NAV_ITEMS;
  if (userRole === 'COMPANY_ADMIN') return COMPANY_ADMIN_NAV_ITEMS;
  if (userRole === 'SYS_ADMIN') return SYS_ADMIN_NAV_ITEMS;
  if (userRole === 'FINANCE') return FINANCE_NAV_ITEMS;
  if (userRole === 'GRANT_WRITER' || userRole === 'GRANTS_MANAGER') return GRANT_WRITER_NAV_ITEMS;
  if (userRole === 'INNOVATOR') return INNOVATOR_NAV_ITEMS;
  return [];
}