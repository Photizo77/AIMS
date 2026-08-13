// src/components/grants/ApplicationWorkspace.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';

interface SectionItem {
  id: string;
  label: string;
  completed: boolean;
}

const SECTIONS: SectionItem[] = [
  { id: 'summary', label: 'Executive Summary', completed: true },
  { id: 'need', label: 'Statement of Need', completed: true },
  { id: 'objectives', label: 'Goals & Objectives', completed: true },
  { id: 'methodology', label: 'Methodology', completed: false },
  { id: 'me', label: 'Monitoring & Evaluation', completed: false },
  { id: 'budget', label: 'Budget Narrative', completed: false },
  { id: 'sustainability', label: 'Sustainability Plan', completed: false },
];

const AI_SUGGESTIONS = [
  { type: 'compliance', icon: 'fact_check', color: 'text-orange-600', text: 'RFP requires 3 measurable metrics in Section 2. Only 1 detected.' },
  { type: 'evidence', icon: 'science', color: 'text-blue-600', text: 'Claim about "500 beneficiaries" lacks supporting evidence. Add citation.' },
  { type: 'alignment', icon: 'tune', color: 'text-green-600', text: 'Funder prioritizes "climate adaptation." Consider reframing methodology.' },
  { type: 'budget', icon: 'calculate', color: 'text-red-600', text: 'Training sessions in narrative (20) do not match budget line items (10).' },
];

export function ApplicationWorkspace() {
  const { showToast } = useNotifications();
  const [activeSection, setActiveSection] = useState('methodology');
  const [sections, setSections] = useState(SECTIONS);
  const [editorContent, setEditorContent] = useState('Describe the implementation approach, including timelines, responsible parties, and quality assurance mechanisms...');

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const completedCount = sections.filter(s => s.completed).length;
  const progress = Math.round((completedCount / sections.length) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-220px)] min-h-[600px]">
      {/* LEFT PANEL: Application Checklist */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4 overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Application Sections</h3>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 bg-slate-100 rounded-full h-2">
              <div className="bg-aims-green h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-bold text-slate-600">{progress}%</span>
          </div>
        </div>
        <div className="space-y-1">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition-colors',
                activeSection === section.id ? 'bg-aims-navy text-white' : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <button
                onClick={(e) => { e.stopPropagation(); toggleSection(section.id); }}
                className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                  section.completed ? 'bg-aims-green border-aims-green' : 'border-slate-300'
                )}
              >
                {section.completed && <span className="material-symbols-outlined text-white text-[10px]">check</span>}
              </button>
              <span className="truncate">{section.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <button onClick={() => showToast({ title: 'RFP Uploaded', message: 'Analyzing requirements...', type: 'info' })} className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-xs font-bold text-slate-500 hover:border-aims-green hover:text-aims-green transition-colors flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[16px]">upload_file</span>Upload RFP
          </button>
        </div>
      </div>

      {/* CENTER PANEL: Document Editor */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">
            {sections.find(s => s.id === activeSection)?.label || 'Select a section'}
          </h3>
          <div className="flex gap-2">
            <button className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-aims-navy hover:bg-white rounded transition-colors">Save Draft</button>
            <button className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-aims-navy hover:bg-white rounded transition-colors">Version History</button>
          </div>
        </div>
        <textarea
          value={editorContent}
          onChange={(e) => setEditorContent(e.target.value)}
          className="flex-1 px-6 py-4 text-sm text-slate-800 leading-relaxed resize-none focus:outline-none font-sans"
          placeholder="Start writing this section..."
        />
        <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[10px] text-slate-400">
          <span>{editorContent.split(/\s+/).filter(Boolean).length} words</span>
          <span>Last saved: Just now</span>
        </div>
      </div>

      {/* RIGHT PANEL: AI Assistant & Compliance */}
      <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-aims-green text-[18px]">smart_toy</span>AI Insights
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Requirements Check</p>
            <p className="text-xs text-slate-700">4 of 7 RFP requirements addressed. 3 remaining.</p>
          </div>
          {AI_SUGGESTIONS.map((s, i) => (
            <div key={i} className="flex gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
              <span className={cn('material-symbols-outlined text-[18px] shrink-0 mt-0.5', s.color)}>{s.icon}</span>
              <div>
                <p className="text-xs text-slate-700 leading-relaxed">{s.text}</p>
                <span className="text-[10px] font-bold text-aims-navy opacity-0 group-hover:opacity-100 transition-opacity mt-1 inline-block">Apply suggestion →</span>
              </div>
            </div>
          ))}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Quick Actions</p>
            <div className="space-y-1.5">
              <button className="w-full text-left px-3 py-2 bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors">✨ Rewrite for funder alignment</button>
              <button className="w-full text-left px-3 py-2 bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors">📊 Add evidence citations</button>
              <button className="w-full text-left px-3 py-2 bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors">✅ Run compliance audit</button>
              <button className="w-full text-left px-3 py-2 bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors">💰 Check budget consistency</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}