// src/pages/Documents.tsx
// ============================================================
// AIMS — Documents Hub
// ============================================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MeetingMinutes } from '@/components/documents/MeetingMinutes';

type DocTab = 'minutes' | 'policies' | 'templates';

const TABS: { id: DocTab; label: string; icon: string }[] = [
  { id: 'minutes', label: 'Meeting Minutes', icon: 'event_note' },
  { id: 'policies', label: 'Policies', icon: 'policy' },
  { id: 'templates', label: 'Templates', icon: 'description' },
];

export function Documents() {
  const [activeTab, setActiveTab] = useState<DocTab>('minutes');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Documents</h1>
        <p className="text-sm text-gray-500 mt-1">Meeting minutes, policies, and templates</p>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
              activeTab === tab.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        {activeTab === 'minutes' && <MeetingMinutes />}
        {activeTab === 'policies' && (
          <div className="text-center py-12 text-gray-400">
            <span className="material-symbols-outlined text-[48px] block mb-2">policy</span>
            <p>Company policies coming soon...</p>
          </div>
        )}
        {activeTab === 'templates' && (
          <div className="text-center py-12 text-gray-400">
            <span className="material-symbols-outlined text-[48px] block mb-2">description</span>
            <p>Document templates coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}