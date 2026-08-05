import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import type { Innovation, InnovationStatus } from '@/types';

const COLUMNS: { id: InnovationStatus; label: string; color: string }[] = [
  { id: 'concept', label: 'Concept', color: 'border-gray-300' },
  { id: 'research', label: 'Research', color: 'border-blue-400' },
  { id: 'prototype', label: 'Prototype', color: 'border-yellow-400' },
  { id: 'testing', label: 'Testing', color: 'border-purple-400' },
  { id: 'deployed', label: 'Deployed', color: 'border-green-400' },
];

const MOCK_INNOVATIONS: Innovation[] = [
  { id: 'inn-1', title: 'AI Grant Writing Assistant', description: 'Fine-tuned LLM to help grant writers draft proposals with a human touch', assignedTo: ['user-innov-001'], status: 'prototype', priority: 'high', createdAt: '2026-06-01', updatedAt: '2026-08-01' },
  { id: 'inn-2', title: 'Solar-Powered IoT Sensors', description: 'Low-cost environmental monitoring sensors for rural communities', assignedTo: ['user-innov-001', 'user-emp-001'], status: 'research', priority: 'medium', createdAt: '2026-05-15', updatedAt: '2026-07-20' },
  { id: 'inn-3', title: 'Mobile Health Diagnosis App', description: 'AI-assisted preliminary health screening via smartphone', assignedTo: ['user-innov-001'], status: 'concept', priority: 'high', createdAt: '2026-07-10', updatedAt: '2026-07-10' },
  { id: 'inn-4', title: 'Blockchain Land Registry', description: 'Transparent land ownership records using distributed ledger', assignedTo: ['user-emp-001'], status: 'testing', priority: 'medium', createdAt: '2026-03-20', updatedAt: '2026-07-30' },
  { id: 'inn-5', title: 'Automated Report Generator', description: 'Internal tool to auto-generate monthly impact reports', assignedTo: ['user-innov-001'], status: 'deployed', priority: 'low', createdAt: '2026-02-01', updatedAt: '2026-06-15' },
];

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
};

export function InnovationBoard() {
  const { showToast } = useNotifications();
  const [innovations, setInnovations] = useState<Innovation[]>(MOCK_INNOVATIONS);

  const moveInnovation = (id: string, newStatus: InnovationStatus) => {
    setInnovations((prev) => prev.map((inn) => (inn.id === id ? { ...inn, status: newStatus } : inn)));
    showToast({ title: 'Status Updated', message: 'Innovation moved to a new stage.', type: 'info' });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Innovation Pipeline</h2>
          <p className="text-sm text-gray-500">Track research and innovations from concept to deployment</p>
        </div>
        <button onClick={() => showToast({ title: 'New Innovation', message: 'Innovation creation form coming next.', type: 'info' })} className="px-4 py-2 bg-aims-mint text-white rounded-lg text-sm font-medium hover:opacity-90">
          New Innovation
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => {
          const columnItems = innovations.filter((inn) => inn.status === column.id);
          return (
            <div key={column.id} className="flex-shrink-0 w-64">
              <div className={cn('border-t-4 rounded-t-lg px-3 py-2 bg-gray-100', column.color)}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">{column.label}</span>
                  <span className="text-xs bg-white px-2 py-0.5 rounded-full text-gray-500">{columnItems.length}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-b-lg p-2 space-y-2 min-h-[200px]">
                {columnItems.map((innovation) => (
                  <InnovationCard key={innovation.id} innovation={innovation} onMove={moveInnovation} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InnovationCard({ innovation, onMove }: { innovation: Innovation; onMove: (id: string, status: InnovationStatus) => void }) {
  const currentIndex = COLUMNS.findIndex((c) => c.id === innovation.status);
  const canMoveBack = currentIndex > 0;
  const canMoveForward = currentIndex < COLUMNS.length - 1;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-800 leading-tight">{innovation.title}</h4>
        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ml-2', PRIORITY_STYLES[innovation.priority])}>{innovation.priority}</span>
      </div>
      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{innovation.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex -space-x-1">
          {innovation.assignedTo.map((_, i) => (
            <div key={i} className="w-5 h-5 rounded-full bg-aims-mint border-2 border-white flex items-center justify-center text-white text-[8px] font-bold">K</div>
          ))}
        </div>
        <div className="flex gap-1">
          {canMoveBack && (
            <button onClick={() => onMove(innovation.id, COLUMNS[currentIndex - 1].id)} className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-500">
              <span className="material-symbols-outlined text-[14px]">chevron_left</span>
            </button>
          )}
          {canMoveForward && (
            <button onClick={() => onMove(innovation.id, COLUMNS[currentIndex + 1].id)} className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-500">
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}