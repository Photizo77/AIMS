// src/components/layout/EmailBell.tsx
import { useNavigate } from 'react-router-dom';

export function EmailBell() {
  const navigate = useNavigate();
  const unread = 2;

  return (
    <button onClick={() => navigate('/email')} className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
      <span className="material-symbols-outlined text-[22px]">mail</span>
      {unread > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-aims-orange text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unread}</span>
      )}
    </button>
  );
}