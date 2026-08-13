// src/config/navigation.ts
import type { NavItem, Role } from '@/types';

export const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: 'dashboard', roles: 'ALL' },
  { title: 'Feed', href: '/feed', icon: 'feed', roles: 'ALL' },
  { title: 'Attendance', href: '/attendance', icon: 'schedule', roles: 'ALL' },
  { title: 'HR & Admin', href: '/hr', icon: 'people', roles: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN'] },
  { title: 'Grants', href: '/grants', icon: 'volunteer_activism', roles: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN', 'GRANT_WRITER'] },
  { title: 'Innovations', href: '/innovations', icon: 'lightbulb', roles: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN', 'INNOVATOR'] },
  { title: 'Finance', href: '/finance', icon: 'account_balance', roles: ['CD', 'ED', 'SYS_ADMIN', 'FINANCE'] },
  { title: 'Procurement', href: '/procurement', icon: 'shopping_cart', roles: ['CD', 'ED', 'SYS_ADMIN', 'FINANCE'] },
  { 
    title: 'Approvals', 
    href: '/approvals', 
    icon: 'approval', 
    roles: ['CD', 'ED', 'SYS_ADMIN'] // FINANCE REMOVED HERE
  },
  { title: 'Documents', href: '/documents', icon: 'folder', roles: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN'] },
  { title: 'Inventory', href: '/inventory', icon: 'inventory_2', roles: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN'] },
  { title: 'Analytics', href: '/analytics', icon: 'analytics', roles: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN', 'FINANCE'] },
  { title: 'Research', href: '/research', icon: 'science', roles: ['CD', 'ED', 'SYS_ADMIN', 'INNOVATOR'] },
  { title: 'Knowledge', href: '/knowledge', icon: 'menu_book', roles: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN'] },
  { title: 'CRM', href: '/crm', icon: 'contacts', roles: ['CD', 'ED', 'SYS_ADMIN', 'COMPANY_ADMIN'] },
  { title: 'RBAC', href: '/rbac', icon: 'admin_panel_settings', roles: ['CD', 'ED', 'SYS_ADMIN'] },
  { title: 'Settings', href: '/settings', icon: 'settings', roles: 'ALL' },
];

export function getVisibleNavItems(userRole: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (item.roles === 'ALL') return true;
    return item.roles.includes(userRole);
  });
}