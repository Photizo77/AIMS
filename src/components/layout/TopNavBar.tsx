// src/components/layout/TopNavBar.tsx
// ============================================================
// AIMS — Top Navigation Bar (with Avatar Photos)
// ============================================================

import { useNavigate } from 'react-router-dom';
import { ArdhiLogo } from './ArdhiLogo';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '@/context/AuthContext';

export function TopNavBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center px-4 md:px-6 shadow-sm">
      {/* Left: logo */}
      <div className="flex items-center shrink-0">
        <ArdhiLogo />
      </div>

      {/* Center: bold system name */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden sm:block">
        <span className="text-sm md:text-base font-black tracking-wide text-aims-navy whitespace-nowrap">
          ARDHI INTERNAL MANAGEMENT SYSTEM
        </span>
      </div>

      {/* Right: controls */}
      <div className="ml-auto flex items-center gap-2 shrink-0">
        <NotificationBell />
        {user && (
          <div className="flex items-center gap-2 ml-1 pl-3 border-l border-slate-200">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-aims-green flex items-center justify-center text-white text-sm font-bold">
                {user.name.charAt(0)}
              </div>
            )}
            <div className="hidden md:block">
              <p className="text-sm font-bold text-slate-900 leading-tight">{user.name}</p>
              <p className="text-[10px] font-semibold text-slate-500 leading-tight">{user.role.replace('_', ' ')}</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-1 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}