// src/components/layout/SideNavBar.tsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getVisibleNavItems } from '@/config/navigation';
import { cn } from '@/lib/utils';

export function SideNavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const navItems = getVisibleNavItems(user.role);

  // Determine if a nav item is currently active
  const isActive = (href: string): boolean => {
    const basePath = href.split('?')[0].split('#')[0];
    if (basePath === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname === basePath || location.pathname.startsWith(basePath + '/');
  };

  return (
    <aside className="w-64 h-full bg-white border-r border-slate-200 flex flex-col overflow-hidden">
      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <button
              key={item.title + item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-left transition-colors duration-150',
                active
                  ? 'bg-[#286b25] text-white'
                  : 'text-slate-700 hover:bg-[#286b25] hover:text-white'
              )}
            >
              <span className="material-symbols-outlined text-[20px] flex-shrink-0">{item.icon}</span>
              <span className="truncate">{item.title}</span>
            </button>
          );
        })}
      </nav>

      {/* User Card + Logout */}
      <div className="px-3 py-3 border-t border-slate-200">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-[#286b25] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
            <p className="text-[10px] text-slate-500 truncate uppercase tracking-wide">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login', { replace: true }); }}
          className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>Sign Out
        </button>
      </div>
    </aside>
  );
}