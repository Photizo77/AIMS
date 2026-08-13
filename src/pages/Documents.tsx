// src/pages/Documents.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import type { Policy, MeetingMinute } from '@/types';

type DocTab = 'templates' | 'minutes' | 'policies';

const TEMPLATES = [
  { id: 't1', name: 'Leave Request Form', icon: 'event_available', desc: 'Annual, sick, and maternity leave requests' },
  { id: 't2', name: 'Requisition Form', icon: 'request_quote', desc: 'Purchase and expense requisitions' },
  { id: 't3', name: 'Travel Authorization', icon: 'flight_takeoff', desc: 'Domestic and international travel approval' },
  { id: 't4', name: 'Performance Appraisal', icon: 'stars', desc: 'Quarterly and annual staff evaluations' },
  { id: 't5', name: 'Incident Report', icon: 'report', desc: 'Workplace incidents and safety reports' },
  { id: 't6', name: 'Contract Renewal Request', icon: 'description', desc: 'Employment contract extension forms' },
];

const MOCK_POLICIES: Policy[] = [
  { id: 'p1', title: 'Employee Handbook 2026', category: 'internal', department: 'HR', lastUpdated: '2026-07-01', downloadUrl: '#', content: 'Full HR manual covering leave, conduct, benefits...' },
  { id: 'p2', title: 'Financial Management Policy', category: 'internal', department: 'Finance', lastUpdated: '2026-06-15', downloadUrl: '#', content: 'Procurement thresholds, approval matrices...' },
  { id: 'p3', title: 'Data Protection & Privacy', category: 'internal', department: 'IT', lastUpdated: '2026-05-20', downloadUrl: '#', content: 'GDPR-compliant data handling procedures...' },
  { id: 'p4', title: 'USAID Compliance Guidelines', category: 'external', department: 'Grants', lastUpdated: '2026-04-10', downloadUrl: '#', content: 'Federal acquisition regulations...' },
  { id: 'p5', title: 'EU Grant Reporting Standards', category: 'external', department: 'Grants', lastUpdated: '2026-03-25', downloadUrl: '#', content: 'EuropeAid reporting requirements...' },
  { id: 'p6', title: 'Uganda NGO Act Compliance', category: 'external', department: 'Administration', lastUpdated: '2026-02-18', downloadUrl: '#', content: 'National Bureau for NGOs regulations...' },
];

const MOCK_MINUTES: MeetingMinute[] = [
  { id: 'm1', title: 'Q3 2026 Strategy Meeting', date: '2026-08-01', attendees: ['Nassir Mwanje', 'Peter Byamugisha', 'Grace Aceng'], status: 'approved', summary: 'Q3 targets finalized.', fullContent: 'MINUTES OF Q3 2026 STRATEGY MEETING\nDate: August 1, 2026\nVenue: Gulu Main Office Boardroom\n\n1. OPENING\nThe meeting was called to order at 9:00 AM by CD Nassir Mwanje.\n\n2. Q3 TARGETS REVIEW\n- Grant pipeline target: UGX 1.5B (currently at UGX 850M)\n- Staff retention rate: 95% (currently 94%)\n- New innovation prototypes: 3 (currently 2 in testing)\n\n3. BUDGET ALLOCATION\nApproved reallocation of UGX 50M from Operations to Grants department for RFP response costs.\n\n4. HR EXPANSION\nApproved hiring of 2 additional grant writers and 1 field coordinator for Northern region.\n\n5. ACTION ITEMS\n- Sarah Aciro: Submit USAID climate resilience proposal by Aug 20\n- Grace Aceng: Complete onboarding for new hires by Aug 15\n- Amos Ojok: Revised Q3 budget breakdown by Aug 10\n\n6. ADJOURNMENT\nMeeting adjourned at 11:30 AM. Next meeting: September 5, 2026.' },
  { id: 'm2', title: 'Board of Directors Annual Review', date: '2026-07-15', attendees: ['Nassir Mwanje', 'Peter Byamugisha', 'Board Members'], status: 'approved', summary: 'Annual performance review completed.', fullContent: 'BOARD OF DIRECTORS ANNUAL REVIEW\nDate: July 15, 2026\n\n1. FINANCIAL PERFORMANCE\nFY2025-26 revenue: UGX 1.2B (12% above target)\nNet surplus: UGX 345M\n\n2. PROGRAM IMPACT\n- 15,000 farmers trained in climate-smart agriculture\n- 8 communities received land rights documentation\n- 5,000 women accessed maternal health services\n\n3. STRATEGIC PRIORITIES FY2026-27\n- Expand ArdhiWaste to 3 new districts\n- Launch AI-powered grant writing platform\n- Achieve ISO 9001 certification\n\n4. BOARD RESOLUTIONS\nAll resolutions passed unanimously.' },
];

export function Documents() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DocTab>('templates');
  const [policySearch, setPolicySearch] = useState('');
  const [selectedMinute, setSelectedMinute] = useState<MeetingMinute | null>(null);

  const canSeeMinutes = user?.role === 'CD' || user?.role === 'ED' || user?.role === 'COMPANY_ADMIN';
  const filteredPolicies = MOCK_POLICIES.filter(p => p.title.toLowerCase().includes(policySearch.toLowerCase()) || p.department.toLowerCase().includes(policySearch.toLowerCase()));

  const TABS: { id: DocTab; label: string; icon: string; restricted?: boolean }[] = [
    { id: 'templates', label: 'Templates', icon: 'note_add' },
    { id: 'minutes', label: 'Meeting Minutes', icon: 'groups', restricted: !canSeeMinutes },
    { id: 'policies', label: 'Policies', icon: 'policy' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Documents</h1>
        <p className="text-sm text-slate-500 mt-1">Templates, policies, and meeting records</p>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {TABS.filter(t => !t.restricted).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors', activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map(t => (
            <button key={t.id} className="bg-white rounded-xl border border-slate-200 p-5 text-left hover:shadow-md hover:border-aims-green transition-all group">
              <div className="w-10 h-10 rounded-lg bg-aims-mint flex items-center justify-center mb-3 group-hover:bg-aims-green transition-colors">
                <span className="material-symbols-outlined text-[22px] text-aims-green group-hover:text-white transition-colors">{t.icon}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{t.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{t.desc}</p>
              <span className="inline-block mt-3 text-xs font-bold text-aims-navy group-hover:underline">Download Template →</span>
            </button>
          ))}
        </div>
      )}

      {activeTab === 'minutes' && canSeeMinutes && (
        <div className="space-y-3">
          {MOCK_MINUTES.map(m => (
            <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{m.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{m.date} • {m.attendees.length} attendees</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 capitalize">{m.status}</span>
              </div>
              <p className="text-xs text-slate-600 mb-3">{m.summary}</p>
              <button onClick={() => setSelectedMinute(m)} className="text-xs font-bold text-aims-navy hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">visibility</span>View Full Minutes
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'policies' && (
        <div>
          <input type="text" placeholder="Search policies by title or department..." value={policySearch} onChange={(e) => setPolicySearch(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-aims-green/50 mb-4" />
          <div className="flex gap-2 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Internal: {filteredPolicies.filter(p => p.category === 'internal').length}</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">External: {filteredPolicies.filter(p => p.category === 'external').length}</span>
          </div>
          <div className="space-y-2">
            {filteredPolicies.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={cn('material-symbols-outlined text-[22px] shrink-0', p.category === 'internal' ? 'text-aims-navy' : 'text-purple-600')}>{p.category === 'internal' ? 'lock' : 'public'}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{p.title}</p>
                    <p className="text-xs text-slate-500">{p.department} • Updated {p.lastUpdated} • <span className="capitalize">{p.category}</span></p>
                  </div>
                </div>
                <a href={p.downloadUrl} className="shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1 transition-colors">
                  <span className="material-symbols-outlined text-[14px]">download</span>PDF
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedMinute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedMinute(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6">
            <button onClick={() => setSelectedMinute(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
            <h2 className="text-lg font-bold text-slate-900 mb-1">{selectedMinute.title}</h2>
            <p className="text-xs text-slate-500 mb-4">{selectedMinute.date} • Attendees: {selectedMinute.attendees.join(', ')}</p>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
              <pre className="whitespace-pre-wrap text-sm text-slate-800 font-sans leading-relaxed">{selectedMinute.fullContent}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}