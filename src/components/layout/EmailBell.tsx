// src/components/layout/EmailBell.tsx
import { useNavigate } from 'react-router-dom';

export function EmailBell() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/email')}
      className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-aims-navy transition-colors"
      title="Email"
    >
      <span className="material-symbols-outlined text-[22px]">mail</span>
      {/* Unread badge — replace with real count from API */}
      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-aims-orange rounded-full border-2 border-white" />
    </button>
  );
}