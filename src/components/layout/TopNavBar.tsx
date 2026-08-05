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
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <ArdhiLogo />
        <span className="text-lg font-bold text-gray-800 hidden sm:block">AIMS</span>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />

        {user && (
          <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-200">
            <div className="w-8 h-8 rounded-full bg-aims-mint flex items-center justify-center text-white text-sm font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-700 leading-tight">{user.name}</p>
              <p className="text-[10px] text-gray-400 leading-tight">{user.role.replace('_', ' ')}</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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