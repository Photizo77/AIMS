// src/components/layout/SideNavBar.tsx
// ============================================================
// AIMS — Side Navigation Bar (Phase 1 — RBAC Aware)
// Renders only the nav items the current user's role can access
// ============================================================

import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { getVisibleNavItems } from '@/config/navigation';

export function SideNavBar() {
  const location = useLocation();
  const { user } = useAuth();

  // If no user is logged in, don't render navigation
  if (!user) return null;

  // Get only the nav items this role is allowed to see
  const visibleItems = getVisibleNavItems(user.role);

  return (
    <aside className="w-64 h-full bg-white border-r border-gray-200 overflow-y-auto">
      {/* User Info Section */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-aims-mint flex items-center justify-center text-white font-bold text-sm">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user.role.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 flex flex-col gap-0.5">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm',
                isActive
                  ? 'bg-aims-mint text-white font-medium shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}