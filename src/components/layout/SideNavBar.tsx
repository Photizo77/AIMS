// src/components/layout/SideNavBar.tsx
// ============================================================
// AIMS — Side Navigation Bar (with Avatar Photo)
// ============================================================

import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { getVisibleNavItems } from '@/config/navigation';

export function SideNavBar() {
  const location = useLocation();
  const { user } = useAuth();
  if (!user) return null;
  const visibleItems = getVisibleNavItems(user.role);

  return (
    <aside className="w-64 h-full bg-white border-r border-slate-200 overflow-y-auto">
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-9 h-9 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-aims-green flex items-center justify-center text-white font-bold text-sm">
              {user.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
            <p className="text-xs font-semibold text-slate-500 truncate">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      <nav className="p-3 flex flex-col gap-0.5">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-semibold',
                isActive
                  ? 'bg-aims-green text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}