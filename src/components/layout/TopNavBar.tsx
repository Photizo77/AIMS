// src/components/layout/TopNavBar.tsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArdhiLogo } from './ArdhiLogo';
import { NotificationBell } from './NotificationBell';
import { EmailBell } from './EmailBell';
import { useAuth } from '@/context/AuthContext';

export function TopNavBar() {
  const navigate = useNavigate();
  const { user, logout, updateAvatar } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 2 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => { updateAvatar(reader.result as string); setImgError(false); };
      reader.readAsDataURL(file);
    }
    setShowMenu(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center px-3 sm:px-6 shadow-sm">
      <div className="w-32 sm:w-48 shrink-0 flex items-center"><ArdhiLogo /></div>
      <div className="flex-1 flex justify-center hidden md:flex">
        <span className="text-xs lg:text-base font-black tracking-wide text-aims-navy whitespace-nowrap text-center px-2">
          ARDHI INTERNAL MANAGEMENT SYSTEM
        </span>
      </div>
      <div className="shrink-0 flex items-center gap-1 sm:gap-2 ml-auto">
        <NotificationBell />
        <EmailBell />
        {user && (
          <div className="relative flex items-center gap-2 ml-1 pl-2 sm:pl-3 border-l border-slate-200">
            <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-1 sm:gap-2 focus:outline-none">
              {user.avatarUrl && !imgError ? (
                <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full border border-slate-200 object-cover" onError={() => setImgError(true)} />
              ) : (
                <div className="w-8 h-8 rounded-full bg-aims-green flex items-center justify-center text-white text-sm font-bold">{user.name.charAt(0)}</div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-sm font-bold text-slate-900 leading-tight">{user.name}</p>
                <p className="text-[10px] font-semibold text-slate-500 leading-tight">{user.role.replace('_', ' ')}</p>
              </div>
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg border border-slate-200 shadow-lg z-20 overflow-hidden">
                  <button onClick={() => fileInputRef.current?.click()} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">photo_camera</span>Upload Photo
                  </button>
                  <button onClick={() => { navigate('/settings'); setShowMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">settings</span>Settings
                  </button>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100">
                    <span className="material-symbols-outlined text-[18px]">logout</span>Sign Out
                  </button>
                </div>
              </>
            )}
            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
          </div>
        )}
      </div>
    </header>
  );
}