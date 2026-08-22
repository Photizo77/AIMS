// src/config/navigation.ts
import type { NavItem, Role } from '@/types';

/**
 * CD Sidebar — Ordered by strategic urgency
 * External-facing deadlines first, then governance visibility, then internal summaries.
 */
const CD_NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: 'dashboard', roles: ['CD'] },
  { title: 'Grants', href: '/grants', icon: 'volunteer_activism', roles: ['CD'] },
  { title: 'Approvals in Progress', href: '/approvals?view=readonly', icon: 'visibility', roles: ['CD'] },
  { title: 'Finance & Procurement', href: '/finance', icon: 'account_balance', roles: ['CD'] },
  { title: 'Attendance', href: '/attendance?view=read', icon: 'schedule', roles: ['CD'] },
  { title: 'HR & Admin Summary', href: '/hr?view=summary', icon: 'people', roles: ['CD'] },
  { title: 'Innovations & Tasks', href: '/innovations?view=read', icon: 'lightbulb', roles: ['CD'] },
  { title: 'Documents', href: '/documents', icon: 'folder', roles: ['CD'] },
  { title: 'Inventory', href: '/inventory?view=read', icon: 'inventory_2', roles: ['CD'] },
  { title: 'Company Feed', href: '/feed', icon: 'feed', roles: ['CD'] },
];

/**
 * ED Sidebar — Ordered by operational urgency
 * Actionable blocking items first, then full management modules.
 */
const ED_NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: 'dashboard', roles: ['ED'] },
  { title: 'Grants', href: '/grants', icon: 'volunteer_activism', roles: ['ED'] },
  { title: 'Approvals Queue', href: '/approvals', icon: 'approval', roles: ['ED'] },
  { title: 'Finance & Procurement', href: '/finance', icon: 'account_balance', roles: ['ED'] },
  { title: 'Attendance', href: '/attendance', icon: 'schedule', roles: ['ED'] },
  { title: 'HR & People Management', href: '/hr', icon: 'people', roles: ['ED'] },
  { title: 'Contracts', href: '/contracts', icon: 'description', roles: ['ED'] },
  { title: 'Appraisals', href: '/appraisals', icon: 'fact_check', roles: ['ED'] },
  { title: 'Innovations & Tasks', href: '/innovations', icon: 'lightbulb', roles: ['ED'] },
  { title: 'Inventory & Documents', href: '/inventory', icon: 'inventory_2', roles: ['ED'] },
  { title: 'Company Feed', href: '/feed', icon: 'feed', roles: ['ED'] },
];

/**
 * Shared nav items for all other roles (unchanged from baseline)
 */
const SHARED_NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: 'dashboard', roles: 'ALL' },
  { title: 'Feed', href: '/feed', icon: 'feed', roles: 'ALL' },
  { title: 'Attendance', href: '/attendance', icon: 'schedule', roles: 'ALL' },
  { title: 'HR & Admin', href: '/hr', icon: 'people', roles: ['SYS_ADMIN', 'COMPANY_ADMIN'] },
  { title: 'Grants', href: '/grants', icon: 'volunteer_activism', roles: ['SYS_ADMIN', 'COMPANY_ADMIN', 'GRANTS_MANAGER', 'GRANT_WRITER'] },
  { title: 'Innovations', href: '/innovations', icon: 'lightbulb', roles: ['SYS_ADMIN', 'COMPANY_ADMIN', 'INNOVATOR'] },
  { title: 'Finance', href: '/finance', icon: 'account_balance', roles: ['SYS_ADMIN', 'FINANCE'] },
  { title: 'Procurement', href: '/procurement', icon: 'shopping_cart', roles: ['SYS_ADMIN', 'FINANCE'] },
  { title: 'Documents', href: '/documents', icon: 'folder', roles: 'ALL' },
  { title: 'Knowledge Base', href: '/knowledge', icon: 'menu_book', roles: 'ALL' },
  { title: 'CRM', href: '/crm', icon: 'contacts', roles: ['COMPANY_ADMIN'] },
  { title: 'Analytics', href: '/analytics', icon: 'analytics', roles: 'ALL' },
  { title: 'RBAC', href: '/rbac', icon: 'admin_panel_settings', roles: ['SYS_ADMIN'] },
  { title: 'Settings', href: '/settings', icon: 'settings', roles: 'ALL' },
];

/** Combined nav items array */
export const NAV_ITEMS: NavItem[] = [...CD_NAV_ITEMS, ...ED_NAV_ITEMS, ...SHARED_NAV_ITEMS];

/**
 * Get visible nav items for a specific role.
 * CD and ED get their dedicated ordered sidebars.
 * All other roles use the shared nav filtered by role.
 */
export function getVisibleNavItems(userRole: Role): NavItem[] {
  if (userRole === 'CD') return CD_NAV_ITEMS;
  if (userRole === 'ED') return ED_NAV_ITEMS;
  return SHARED_NAV_ITEMS.filter((item) => item.roles === 'ALL' || item.roles.includes(userRole));
}