// src/pages/Grants.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { GrantsManager } from '@/components/grants/GrantsManager';
import { GrantsHistory } from '@/components/grants/GrantsHistory';
import { Link } from 'react-router-dom';

export function Grants() {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Grants Portal</h1>
          <p className="text-sm text-slate-500 mt-1">Manage grants across all five Ardhi pillars</p>
        </div>
        <Link to="/ai-assistant" className="px-4 py-2 bg-aims-navy text-white rounded-lg text-sm font-bold hover:opacity-90 flex items-center gap-2 shadow-sm">
          <span className="material-symbols-outlined text-[18px]">smart_toy</span> Open AI Assistant
        </Link>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab('active')} className={cn('px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors', activeTab === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>Active Grants</button>
        <button onClick={() => setActiveTab('history')} className={cn('px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors', activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>History</button>
      </div>

      {activeTab === 'active' && <GrantsManager />}
      {activeTab === 'history' && <GrantsHistory />}
    </div>
  );
}