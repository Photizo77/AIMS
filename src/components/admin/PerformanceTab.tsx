import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import type { Appraisal } from '@/types';

const MOCK_APPRAISALS: Appraisal[] = [
  {
    id: 'appr-1',
    employeeId: 'user-emp-001',
    employeeName: 'Lucy Wanjiku',
    reviewPeriod: 'Q2 2026',
    kpis: [
      { id: 'kpi-1', name: 'Project Delivery', target: 100, achieved: 92, weight: 40 },
      { id: 'kpi-2', name: 'Team Collaboration', target: 100, achieved: 88, weight: 30 },
      { id: 'kpi-3', name: 'Innovation', target: 100, achieved: 75, weight: 30 },
    ],
    overallRating: 4,
    status: 'submitted',
    reviewerId: 'user-admin-001',
    submittedAt: '2026-07-15',
  },
  {
    id: 'appr-2',
    employeeId: 'user-finance-001',
    employeeName: 'James Odhiambo',
    reviewPeriod: 'Q2 2026',
    kpis: [
      { id: 'kpi-4', name: 'Report Accuracy', target: 100, achieved: 95, weight: 50 },
      { id: 'kpi-5', name: 'Deadline Compliance', target: 100, achieved: 90, weight: 50 },
    ],
    overallRating: 5,
    status: 'acknowledged',
    reviewerId: 'user-admin-001',
    submittedAt: '2026-07-10',
  },
];

export function PerformanceTab() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [selectedAppraisal, setSelectedAppraisal] = useState<Appraisal | null>(null);
  const isED = user?.role === 'ED';

  const [countersignQueue, setCountersignQueue] = useState([
    { id: 'cs-1', employee: 'Sarah Aciro', manager: 'Grace Aceng', rating: '4.2/5', submitted: '2026-08-20' },
    { id: 'cs-2', employee: 'Janet Apio', manager: 'Grace Aceng', rating: '3.9/5', submitted: '2026-08-19' },
    { id: 'cs-3', employee: 'Pius Odong', manager: 'Isaac Tumusiime', rating: '4.1/5', submitted: '2026-08-22' },
    { id: 'cs-4', employee: 'Grace Nakamya', manager: 'Isaac Tumusiime', rating: '3.8/5', submitted: '2026-08-20' },
  ]);

  const countersign = (id: string, employee: string) => {
    setCountersignQueue((prev) => prev.filter((c) => c.id !== id));
    showToast({ title: 'Appraisal Countersigned', message: `${employee}'s Q3 appraisal countersigned by ED and filed.`, type: 'success' });
  };

  const handleSubmitAppraisal = (appraisal: Appraisal) => {
    showToast({
      title: 'Appraisal Submitted',
      message: `${appraisal.employeeName}'s performance review has been submitted.`,
      type: 'success',
    });
    setSelectedAppraisal(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Performance Appraisals</h2>
        <p className="text-sm text-gray-500">View, edit, and submit KPI-based performance reviews</p>
      </div>

      {/* ED Countersignature Panel */}
      {isED && countersignQueue.length > 0 && (
        <div className="bg-white rounded-xl border border-aims-navy/30 border-l-4 border-l-aims-navy p-5 mb-4 shadow-sm">
          <h4 className="text-sm font-extrabold text-slate-900 mb-1">Appraisals Awaiting ED Countersignature (Q3 2026)</h4>
          <p className="text-xs text-slate-500 mb-3">Manager assessments submitted — ED provides final approval. Auto-files to Documents {'>'} HR &amp; Contracts on signing.</p>
          <div className="space-y-2">
            {countersignQueue.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-900">{c.employee} — Rating: <span className="text-aims-navy">{c.rating}</span></p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Manager: {c.manager} · Submitted {c.submitted}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => showToast({ title: 'Revisions Requested', message: `Revisions requested on ${c.employee}'s appraisal.`, type: 'warning' })} className="px-3 py-1.5 bg-aims-orange text-white text-[10px] font-bold rounded-lg hover:bg-aims-orange/90">Request Revisions</button>
                  <button onClick={() => countersign(c.id, c.employee)} className="px-3 py-1.5 bg-aims-green text-white text-[10px] font-bold rounded-lg hover:bg-aims-green/90 flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">edit_note</span>Approve & Sign</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_APPRAISALS.map((appraisal) => (
          <div key={appraisal.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">{appraisal.employeeName}</p>
                <p className="text-xs text-gray-500">{appraisal.reviewPeriod}</p>
              </div>
              <span className={cn(
                'px-2 py-1 rounded-full text-xs font-medium capitalize',
                appraisal.status === 'submitted' ? 'bg-green-100 text-green-700' :
                appraisal.status === 'acknowledged' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-600'
              )}>
                {appraisal.status}
              </span>
            </div>

            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={cn(
                    'material-symbols-outlined text-[18px]',
                    star <= appraisal.overallRating ? 'text-yellow-400' : 'text-gray-200'
                  )}
                >
                  star
                </span>
              ))}
              <span className="text-xs text-gray-500 ml-2">{appraisal.overallRating}/5</span>
            </div>

            <button
              onClick={() => setSelectedAppraisal(appraisal)}
              className="text-xs text-aims-mint hover:underline"
            >
              View Details & KPIs
            </button>
          </div>
        ))}
      </div>

      {selectedAppraisal && (
        <AppraisalDetailModal
          appraisal={selectedAppraisal}
          onSubmit={() => handleSubmitAppraisal(selectedAppraisal)}
          onClose={() => setSelectedAppraisal(null)}
        />
      )}
    </div>
  );
}

function AppraisalDetailModal({ appraisal, onSubmit, onClose }: {
  appraisal: Appraisal;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <span className="material-symbols-outlined">close</span>
        </button>

        <h3 className="text-lg font-bold text-gray-800 mb-1">{appraisal.employeeName}</h3>
        <p className="text-sm text-gray-500 mb-4">{appraisal.reviewPeriod} Performance Review</p>

        <div className="space-y-4 mb-6">
          {appraisal.kpis.map((kpi) => (
            <div key={kpi.id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">{kpi.name}</span>
                <span className="text-xs text-gray-500">Weight: {kpi.weight}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-aims-mint h-2 rounded-full transition-all"
                  style={{ width: `${kpi.achieved}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">Achieved: {kpi.achieved}%</span>
                <span className="text-xs text-gray-500">Target: {kpi.target}%</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            Close
          </button>
          <button onClick={onSubmit} className="px-4 py-2 text-sm bg-aims-mint text-white rounded-lg hover:opacity-90">
            Submit Appraisal
          </button>
        </div>
      </div>
    </div>
  );
}