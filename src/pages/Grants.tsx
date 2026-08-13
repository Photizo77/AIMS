// src/pages/Grants.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { GrantsManager } from '@/components/grants/GrantsManager';
import { GrantsHistory } from '@/components/grants/GrantsHistory';
import { GrantPipeline } from '@/components/grants/GrantPipeline';
import { ApplicationWorkspace } from '@/components/grants/ApplicationWorkspace';
import { GrantDiscovery } from '@/components/grants/GrantDiscovery';

type GrantsTab = 'active' | 'pipeline' | 'workspace' | 'discovery' | 'history';

export function Grants() {
  const [activeTab, setActiveTab] = useState<GrantsTab>('active');

  const TABS: { id: GrantsTab; label: string; icon: string }[] = [
    { id: 'active', label: 'Active Grants', icon: 'folder_open' },
    { id: 'pipeline', label: 'Pipeline', icon: 'view_kanban' },
    { id: 'workspace', label: 'Application Workspace', icon: 'edit_document' },
    { id: 'discovery', label: 'Discovery', icon: 'search' },
    { id: 'history', label: 'History', icon: 'history' },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Grant Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">Discover, draft, review, and track grants across all Ardhi pillars</p>
        </div>
        <Link to="/ai-assistant" className="px-4 py-2 bg-aims-navy text-white rounded-lg text-sm font-bold hover:opacity-90 flex items-center gap-2 shadow-sm shrink-0">
          <span className="material-symbols-outlined text-[18px]">smart_toy</span>AI Assistant
        </Link>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors',
              activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'active' && <GrantsManager />}
        {activeTab === 'pipeline' && <GrantPipeline />}
        {activeTab === 'workspace' && <ApplicationWorkspace />}
        {activeTab === 'discovery' && <GrantDiscovery />}
        {activeTab === 'history' && <GrantsHistory />}
      </div>
    </div>
  );
}