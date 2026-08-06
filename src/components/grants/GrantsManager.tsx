// src/components/grants/GrantsManager.tsx
// ============================================================
// AIMS — Grants Manager (with Ardhi Pillars)
// ============================================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import { AIWritingAssistant } from './AIWritingAssistant';
import type { Grant, GrantStatus } from '@/types';

// ─────────────────────────────────────────────
// ARDHI PILLARS CONFIGURATION
// ─────────────────────────────────────────────
interface Pillar {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const ARDHI_PILLARS: Pillar[] = [
  {
    id: 'ArdhiAgric',
    name: 'ArdhiAgric',
    description: 'Sustainable agriculture, food security, and farming innovation',
    icon: 'agriculture',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    id: 'ArdhiWaste',
    name: 'ArdhiWaste',
    description: 'Waste management, recycling, and circular economy initiatives',
    icon: 'delete',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  {
    id: 'ArdhiDisasters',
    name: 'ArdhiDisasters',
    description: 'Disaster preparedness, emergency response, and resilience',
    icon: 'warning',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  {
    id: 'ArdhiHealth',
    name: 'ArdhiHealth',
    description: 'Community health, maternal care, and disease prevention',
    icon: 'local_hospital',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'ArdhiLand',
    name: 'ArdhiLand',
    description: 'Land rights, sustainable land use, and environmental restoration',
    icon: 'terrain',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
  },
];

// ─────────────────────────────────────────────
// MOCK GRANTS DATA (Realistic examples per pillar)
// ─────────────────────────────────────────────
const MOCK_GRANTS: Grant[] = [
  // ArdhiAgric
  {
    id: 'grant-1',
    uniqueId: 'GRANT-AGRIC-2026-001',
    title: 'Climate-Smart Farming Initiative',
    pillar: 'ArdhiAgric',
    description: 'Training 200 smallholder farmers in drought-resistant crop varieties and water-efficient irrigation techniques across semi-arid regions.',
    amount: 250000000,
    assignedWriterId: 'user-grant-001',
    status: 'submitted',
    deadline: '2026-09-15',
    createdAt: '2026-06-01',
    updatedAt: '2026-07-20',
  },
  {
    id: 'grant-2',
    uniqueId: 'GRANT-AGRIC-2026-002',
    title: 'Urban Vertical Farming Hubs',
    pillar: 'ArdhiAgric',
    description: 'Establishing 10 urban vertical farming hubs to provide fresh produce to food-insecure neighborhoods while creating youth employment.',
    amount: 180000000,
    assignedWriterId: 'user-grant-001',
    status: 'drafting',
    deadline: '2026-10-30',
    createdAt: '2026-07-10',
    updatedAt: '2026-08-02',
  },
  
  // ArdhiWaste
  {
    id: 'grant-3',
    uniqueId: 'GRANT-WASTE-2026-001',
    title: 'Community Recycling Centers',
    pillar: 'ArdhiWaste',
    description: 'Building 5 community recycling centers and training 50 waste collectors in proper sorting and processing techniques.',
    amount: 320000000,
    assignedWriterId: 'user-grant-001',
    status: 'awarded',
    deadline: '2026-08-20',
    createdAt: '2026-03-15',
    updatedAt: '2026-07-01',
  },
  {
    id: 'grant-4',
    uniqueId: 'GRANT-WASTE-2026-002',
    title: 'Plastic-to-Biofuel Conversion',
    pillar: 'ArdhiWaste',
    description: 'Research and pilot project for converting plastic waste into biofuel for rural communities.',
    amount: 150000000,
    assignedWriterId: 'user-grant-001',
    status: 'idea',
    deadline: '2026-12-01',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  
  // ArdhiDisasters
  {
    id: 'grant-5',
    uniqueId: 'GRANT-DISASTERS-2026-001',
    title: 'Flood Early Warning System',
    pillar: 'ArdhiDisasters',
    description: 'Deploying IoT-based flood monitoring sensors across 15 vulnerable river basins with SMS-based community alert systems.',
    amount: 280000000,
    assignedWriterId: 'user-grant-001',
    status: 'submitted',
    deadline: '2026-09-30',
    createdAt: '2026-06-20',
    updatedAt: '2026-07-28',
  },
  {
    id: 'grant-6',
    uniqueId: 'GRANT-DISASTERS-2026-002',
    title: 'Emergency Response Kits Program',
    pillar: 'ArdhiDisasters',
    description: 'Distributing 500 pre-positioned emergency response kits to disaster-prone communities with trained first responders.',
    amount: 95000000,
    assignedWriterId: 'user-grant-001',
    status: 'drafting',
    deadline: '2026-11-15',
    createdAt: '2026-07-25',
    updatedAt: '2026-08-03',
  },
  
  // ArdhiHealth
  {
    id: 'grant-7',
    uniqueId: 'GRANT-HEALTH-2026-001',
    title: 'Mobile Maternal Health Clinics',
    pillar: 'ArdhiHealth',
    description: 'Operating 3 mobile health clinics providing prenatal and postnatal care to 5,000 women in remote areas annually.',
    amount: 420000000,
    assignedWriterId: 'user-grant-001',
    status: 'awarded',
    deadline: '2026-08-15',
    createdAt: '2026-02-10',
    updatedAt: '2026-06-30',
  },
  {
    id: 'grant-8',
    uniqueId: 'GRANT-HEALTH-2026-002',
    title: 'Community Health Worker Training',
    pillar: 'ArdhiHealth',
    description: 'Training 150 community health workers in disease prevention, basic diagnostics, and health education.',
    amount: 180000000,
    assignedWriterId: 'user-grant-001',
    status: 'submitted',
    deadline: '2026-10-01',
    createdAt: '2026-07-05',
    updatedAt: '2026-07-30',
  },
  
  // ArdhiLand
  {
    id: 'grant-9',
    uniqueId: 'GRANT-LAND-2026-001',
    title: 'Community Land Rights Documentation',
    pillar: 'ArdhiLand',
    description: 'Supporting 8 indigenous communities in formally documenting and securing their ancestral land rights through legal processes.',
    amount: 220000000,
    assignedWriterId: 'user-grant-001',
    status: 'drafting',
    deadline: '2026-11-30',
    createdAt: '2026-07-20',
    updatedAt: '2026-08-04',
  },
  {
    id: 'grant-10',
    uniqueId: 'GRANT-LAND-2026-002',
    title: 'Degraded Land Restoration Project',
    pillar: 'ArdhiLand',
    description: 'Restoring 500 hectares of degraded land through community-led reforestation and soil conservation techniques.',
    amount: 350000000,
    assignedWriterId: 'user-grant-001',
    status: 'idea',
    deadline: '2027-01-15',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
];

const STATUS_STYLES: Record<GrantStatus, string> = {
  idea: 'bg-gray-100 text-gray-600',
  drafting: 'bg-yellow-100 text-yellow-700',
  submitted: 'bg-blue-100 text-blue-700',
  awarded: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export function GrantsManager() {
  const { showToast } = useNotifications();
  const [grants] = useState<Grant[]>(MOCK_GRANTS);
  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
  const [filterPillar, setFilterPillar] = useState<string>('all');

  const filtered = filterPillar === 'all' ? grants : grants.filter((g) => g.pillar === filterPillar);

  // Summary statistics
  const stats = {
    total: grants.length,
    awarded: grants.filter((g) => g.status === 'awarded').length,
    submitted: grants.filter((g) => g.status === 'submitted').length,
    drafting: grants.filter((g) => g.status === 'drafting').length,
    totalValue: grants.reduce((sum, g) => sum + g.amount, 0),
  };

  if (selectedGrant) {
    return <GrantDetailView grant={selectedGrant} onBack={() => setSelectedGrant(null)} />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Ardhi Grants Portfolio</h2>
          <p className="text-sm text-gray-500">Manage grants across our five pillars with AI-powered writing assistance</p>
        </div>
        <button
          onClick={() => showToast({ title: 'New Grant', message: 'Grant creation form coming next.', type: 'info' })}
          className="px-4 py-2 bg-aims-mint text-white rounded-lg text-sm font-medium hover:opacity-90"
        >
          + New Grant
        </button>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total Grants</p>
          <p className="text-xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-3">
          <p className="text-xs text-green-600">Awarded</p>
          <p className="text-xl font-bold text-green-600">{stats.awarded}</p>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 p-3">
          <p className="text-xs text-blue-600">Submitted</p>
          <p className="text-xl font-bold text-blue-600">{stats.submitted}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-500">Total Value</p>
          <p className="text-xl font-bold text-gray-800">UGX {(stats.totalValue / 1000000000).toFixed(1)}B</p>
        </div>
      </div>

      {/* Pillar Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {ARDHI_PILLARS.map((pillar) => {
          const pillarGrants = grants.filter((g) => g.pillar === pillar.id);
          const isActive = filterPillar === pillar.id;
          return (
            <button
              key={pillar.id}
              onClick={() => setFilterPillar(isActive ? 'all' : pillar.id)}
              className={cn(
                'p-3 rounded-xl border-2 transition-all text-left',
                isActive
                  ? `${pillar.bgColor} ${pillar.borderColor} shadow-md`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('material-symbols-outlined text-[20px]', pillar.color)}>
                  {pillar.icon}
                </span>
                <span className="text-xs font-bold text-gray-800">{pillar.name}</span>
              </div>
              <p className="text-xs text-gray-500">{pillarGrants.length} grants</p>
            </button>
          );
        })}
      </div>

      {/* All Pillars Button */}
      {filterPillar !== 'all' && (
        <button
          onClick={() => setFilterPillar('all')}
          className="mb-4 text-xs text-aims-mint hover:underline"
        >
          ← Show all pillars
        </button>
      )}

      {/* Grants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((grant) => {
          const pillar = ARDHI_PILLARS.find((p) => p.id === grant.pillar);
          return (
            <button
              key={grant.id}
              onClick={() => setSelectedGrant(grant)}
              className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-gray-400">{grant.uniqueId}</span>
                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium capitalize', STATUS_STYLES[grant.status])}>
                  {grant.status}
                </span>
              </div>

              <div className={cn('flex items-center gap-2 mb-2 px-2 py-1 rounded-md w-fit', pillar?.bgColor)}>
                <span className={cn('material-symbols-outlined text-[16px]', pillar?.color)}>
                  {pillar?.icon}
                </span>
                <span className={cn('text-xs font-medium', pillar?.color)}>{grant.pillar}</span>
              </div>

              <h3 className="text-sm font-semibold text-gray-800 mb-1">{grant.title}</h3>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{grant.description}</p>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm font-bold text-gray-800">UGX {grant.amount.toLocaleString()}</span>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400">Deadline</p>
                  <p className="text-xs font-medium text-gray-700">{grant.deadline}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <span className="material-symbols-outlined text-[48px] text-gray-300 block mb-2">
            folder_open
          </span>
          <p className="text-gray-500">No grants in this pillar yet.</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// GRANT DETAIL VIEW
// ─────────────────────────────────────────────
function GrantDetailView({ grant, onBack }: { grant: Grant; onBack: () => void }) {
  const pillar = ARDHI_PILLARS.find((p) => p.id === grant.pillar);

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Grants
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Grant Details + Proposal */}
        <div className="lg:col-span-2 space-y-4">
          {/* Grant Header Card */}
          <div className={cn('rounded-xl border-2 p-5', pillar?.borderColor, pillar?.bgColor)}>
            <span className="text-[10px] font-mono text-gray-500">{grant.uniqueId}</span>
            <h2 className="text-xl font-bold text-gray-800 mt-1">{grant.title}</h2>

            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', pillar?.bgColor, pillar?.color)}>
                <span className="material-symbols-outlined text-[14px]">{pillar?.icon}</span>
                {grant.pillar}
              </span>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', STATUS_STYLES[grant.status])}>
                {grant.status}
              </span>
            </div>

            <p className="text-sm text-gray-700 mt-3 leading-relaxed">{grant.description}</p>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500">Amount</p>
              <p className="text-lg font-bold text-gray-800">UGX {grant.amount.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500">Deadline</p>
              <p className="text-lg font-bold text-gray-800">{grant.deadline}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500">Last Updated</p>
              <p className="text-lg font-bold text-gray-800">{grant.updatedAt}</p>
            </div>
          </div>

          {/* Proposal Draft */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">description</span>
              Grant Proposal Draft
            </h3>
            <textarea
              placeholder="Write your grant proposal here. Use the AI Assistant on the right to refine sections..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm min-h-[300px] resize-none focus:outline-none focus:ring-2 focus:ring-aims-mint/50"
            />
          </div>
        </div>

        {/* Right: AI Writing Assistant - FIXED: Now passing grant prop */}
        <div className="lg:col-span-1">
          <AIWritingAssistant grant={grant} />
        </div>
      </div>
    </div>
  );
}