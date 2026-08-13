// src/pages/Knowledge.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { KnowledgeResource } from '@/types';

const MOCK_RESOURCES: KnowledgeResource[] = [
  { id: 'k1', title: 'Grant Writing Best Practices Guide', type: 'document', category: 'Grants', uploadedBy: 'Sarah Aciro', uploadedAt: '2026-07-20', url: '#', description: 'Comprehensive guide for institutional funders' },
  { id: 'k2', title: 'Ardhi Impact Report 2025', type: 'document', category: 'Reports', uploadedBy: 'Grace Aceng', uploadedAt: '2026-06-15', url: '#', description: 'Annual impact metrics and beneficiary stories' },
  { id: 'k3', title: 'Climate-Smart Agriculture Training', type: 'video', category: 'Training', uploadedBy: 'Pius Odong', uploadedAt: '2026-07-10', url: '#', description: '45-min training session recording for field staff' },
  { id: 'k4', title: 'Donor Pitch Presentation', type: 'video', category: 'Grants', uploadedBy: 'Sarah Aciro', uploadedAt: '2026-08-01', url: '#', description: 'Standard 10-min pitch deck walkthrough' },
  { id: 'k5', title: 'Board Meeting Recording Q2', type: 'audio', category: 'Governance', uploadedBy: 'Nassir Mwanje', uploadedAt: '2026-06-30', url: '#', description: 'Full audio recording of Q2 board meeting' },
  { id: 'k6', title: 'Field Visit Photos - Karamoja', type: 'photo', category: 'Documentation', uploadedBy: 'Janet Apio', uploadedAt: '2026-07-25', url: '#', description: '24 photos from irrigation project site visit' },
  { id: 'k7', title: 'Organizational Theory of Change', type: 'document', category: 'Strategy', uploadedBy: 'Nassir Mwanje', uploadedAt: '2026-05-10', url: '#', description: 'Logic model and impact pathway documentation' },
  { id: 'k8', title: 'Staff Onboarding Orientation', type: 'video', category: 'HR', uploadedBy: 'Grace Aceng', uploadedAt: '2026-04-20', url: '#', description: 'New hire orientation video package' },
];

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  document: { icon: 'description', color: 'text-aims-navy', bg: 'bg-blue-50' },
  video: { icon: 'videocam', color: 'text-red-600', bg: 'bg-red-50' },
  audio: { icon: 'mic', color: 'text-purple-600', bg: 'bg-purple-50' },
  photo: { icon: 'photo_library', color: 'text-aims-green', bg: 'bg-green-50' },
};

export function Knowledge() {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = MOCK_RESOURCES.filter(r => {
    const matchesType = filterType === 'all' || r.type === filterType;
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Knowledge Base</h1>
        <p className="text-sm text-slate-500 mt-1">Documents, videos, audio recordings, and photos</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input type="text" placeholder="Search resources..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-aims-green/50" />
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
          {['all', 'document', 'video', 'audio', 'photo'].map(t => (
            <button key={t} onClick={() => setFilterType(t)} className={cn('px-3 py-2 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-colors', filterType === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>
              {t === 'all' ? 'All' : t + 's'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(r => {
          const cfg = TYPE_CONFIG[r.type] || TYPE_CONFIG.document;
          return (
            <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow group">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', cfg.bg)}>
                <span className={cn('material-symbols-outlined text-[22px]', cfg.color)}>{cfg.icon}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-2">{r.title}</h3>
              <p className="text-xs text-slate-500 mb-2 line-clamp-2">{r.description}</p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{r.category}</span>
                <span className="text-[10px] text-slate-400">{r.uploadedAt}</span>
              </div>
              <button className="mt-3 w-full py-1.5 bg-slate-50 hover:bg-aims-green hover:text-white rounded-lg text-xs font-bold text-slate-600 transition-colors">
                {r.type === 'document' ? 'Open Document' : r.type === 'video' ? 'Watch Video' : r.type === 'audio' ? 'Play Audio' : 'View Photos'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}