// src/components/layout/SideNavBar.tsx
// Navigation only — the account/profile card lives in the top bar
// (TopNavBar avatar menu: photo, settings, sign out). Keeping the rail
// free of the profile block lets the nav list use the full height.
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getVisibleNavItems } from '@/config/navigation';
import { cn } from '@/lib/utils';

export function SideNavBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Collapsible state with localStorage persistence
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  if (!user) return null;

  const navItems = getVisibleNavItems(user.role);

  // Determine if a nav item is currently active — exactly one item active at a time
  const isActive = (href: string): boolean => {
    const [pathPart, queryPart] = href.split('?');
    if (queryPart) {
      // e.g. /dashboard?view=grants — active only when the same query is present
      return location.pathname === pathPart && location.search.includes(queryPart);
    }
    if (pathPart === '/dashboard') {
      // The plain Dashboard item must not light up while a ?view= redirect is shown
      return location.pathname === '/dashboard' && !location.search.includes('view=');
    }
    return location.pathname === pathPart || location.pathname.startsWith(pathPart + '/');
  };

  return (
    <aside
      className={cn(
        "h-full bg-white border-r border-slate-200 flex flex-col overflow-hidden transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header / Logo Area with Toggle */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-slate-200 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#286b25] text-white flex items-center justify-center font-bold text-sm">
              A
            </div>
            <span className="font-bold text-slate-900">AIMS</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors flex-shrink-0"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="material-symbols-outlined text-[20px]">
            {collapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </div>

      {/* Nav Items — full remaining height, scrolls independently */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <button
              key={item.title + item.href}
              onClick={() => navigate(item.href)}
              title={collapsed ? item.title : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-left transition-colors duration-150',
                collapsed ? 'justify-center' : 'justify-start',
                active
                  ? 'bg-[#286b25] text-white'
                  : 'text-slate-700 hover:bg-[#286b25] hover:text-white'
              )}
            >
              <span className="material-symbols-outlined text-[20px] flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.title}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
