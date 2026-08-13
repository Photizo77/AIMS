// src/components/finance/BudgetTracker.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import type { BudgetSubmission, BudgetStatus } from '@/types';

const MOCK_BUDGETS: BudgetSubmission[] = [
  { id: 'b1', department: 'Research', submittedBy: 'user-innov-001', submittedByName: 'Pius Odong', period: 'Q3 2026', totalAmount: 150000000, status: 'approved', edNotes: 'Approved. Aligned with strategic priorities.', createdAt: '2026-06-15', updatedAt: '2026-06-20', lineItems: [{ category: 'Equipment', amount: 80000000 }, { category: 'Field Work', amount: 45000000 }, { category: 'Personnel', amount: 25000000 }] },
  { id: 'b2', department: 'Grants', submittedBy: 'user-gm-001', submittedByName: 'Sarah Aciro', period: 'Q3 2026', totalAmount: 50000000, status: 'submitted', createdAt: '2026-07-01', updatedAt: '2026-07-01', lineItems: [{ category: 'RFP Responses', amount: 20000000 }, { category: 'Travel', amount: 15000000 }, { category: 'Consultants', amount: 15000000 }] },
  { id: 'b3', department: 'Administration', submittedBy: 'user-admin-001', submittedByName: 'Grace Aceng', period: 'Q3 2026', totalAmount: 80000000, status: 'rejected', edNotes: 'Travel budget exceeds policy limits. Please revise.', createdAt: '2026-06-20', updatedAt: '2026-06-25', lineItems: [{ category: 'Office Supplies', amount: 25000000 }, { category: 'Travel', amount: 35000000 }, { category: 'Maintenance', amount: 20000000 }] },
  { id: 'b4', department: 'Innovation', submittedBy: 'user-innov-001', submittedByName: 'Pius Odong', period: 'Q4 2026', totalAmount: 120000000, status: 'draft', createdAt: '2026-08-01', updatedAt: '2026-08-01', lineItems: [{ category: 'Prototyping', amount: 60000000 }, { category: 'Testing', amount: 35000000 }, { category: 'Deployment', amount: 25000000 }] },
];

const STATUS_CONFIG: Record<BudgetStatus, { label: string; bg: string; color: string }> = {
  draft: { label: 'Draft', bg: 'bg-gray-100', color: 'text-gray-600' },
  submitted: { label: 'Submitted to ED', bg: 'bg-blue-100', color: 'text-blue-700' },
  approved: { label: 'Approved', bg: 'bg-green-100', color: 'text-green-700' },
  rejected: { label: 'Rejected', bg: 'bg-red-100', color: 'text-red-700' },
  withheld: { label: 'Withheld', bg: 'bg-yellow-100', color: 'text-yellow-700' },
};

export function BudgetTracker() {
  const { user } = useAuth();
  const { showToast, addNotification } = useNotifications();
  const [budgets, setBudgets] = useState(MOCK_BUDGETS);
  const [selectedBudget, setSelectedBudget] = useState<BudgetSubmission | null>(null);
  const [edNotes, setEdNotes] = useState('');
  const isED = user?.role === 'ED' || user?.role === 'CD';

  const handleSubmit = (id: string) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, status: 'submitted' as BudgetStatus, updatedAt: new Date().toISOString().split('T')[0] } : b));
    addNotification({ userId: 'user-ed-001', title: 'Budget Submitted', message: `${selectedBudget?.department} budget submitted for approval.`, type: 'approval' });
    showToast({ title: 'Submitted', message: 'Budget sent to ED for approval.', type: 'success' });
    setSelectedBudget(null);
  };

  const handleEDDecision = (action: 'approve' | 'reject' | 'withhold') => {
    if (!selectedBudget || edNotes.trim().length < 5) return;
    const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'withheld';
    setBudgets(prev => prev.map(b => b.id === selectedBudget.id ? { ...b, status: newStatus as BudgetStatus, edNotes: edNotes.trim(), updatedAt: new Date().toISOString().split('T')[0] } : b));
    addNotification({ userId: selectedBudget.submittedBy, title: `Budget ${newStatus}`, message: `${selectedBudget.department} budget ${newStatus} by ED.`, type: action === 'approve' ? 'success' : 'warning' });
    showToast({ title: `Budget ${newStatus}`, message: `${selectedBudget.department} budget ${newStatus}.`, type: action === 'approve' ? 'success' : 'warning' });
    setEdNotes('');
    setSelectedBudget(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900">Budget Submissions & Tracking</h3>
        <button onClick={() => showToast({ title: 'New Budget', message: 'Budget creation form coming next.', type: 'info' })} className="px-3 py-1.5 bg-aims-green text-white rounded-lg text-xs font-bold hover:opacity-90">+ New Budget</button>
      </div>

      <div className="space-y-3">
        {budgets.map(b => {
          const sc = STATUS_CONFIG[b.status];
          return (
            <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{b.department} — {b.period}</h4>
                  <p className="text-xs text-slate-500">Submitted by {b.submittedByName} • {b.updatedAt}</p>
                </div>
                <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold capitalize', sc.bg, sc.color)}>{sc.label}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-sm font-extrabold text-slate-900">UGX {(b.totalAmount / 1000000).toFixed(0)}M</span>
                <button onClick={() => setSelectedBudget(b)} className="text-xs font-bold text-aims-navy hover:underline">View Details</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAIL MODAL */}
      {selectedBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setSelectedBudget(null); setEdNotes(''); }} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6">
            <button onClick={() => { setSelectedBudget(null); setEdNotes(''); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{selectedBudget.department} Budget</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedBudget.period} • {STATUS_CONFIG[selectedBudget.status].label}</p>

            <div className="space-y-2 mb-4">
              {selectedBudget.lineItems.map((item, i) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-slate-50 text-sm">
                  <span className="text-slate-700">{item.category}</span>
                  <span className="font-bold text-slate-900">UGX {(item.amount / 1000000).toFixed(1)}M</span>
                </div>
              ))}
              <div className="flex justify-between py-2 font-extrabold text-slate-900 border-t-2 border-slate-200">
                <span>Total</span>
                <span>UGX {(selectedBudget.totalAmount / 1000000).toFixed(0)}M</span>
              </div>
            </div>

            {selectedBudget.edNotes && (
              <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">ED Notes</p>
                <p className="text-xs text-slate-700">{selectedBudget.edNotes}</p>
              </div>
            )}

            {!isED && selectedBudget.status === 'draft' && (
              <button onClick={() => handleSubmit(selectedBudget.id)} className="w-full py-2.5 bg-aims-navy text-white rounded-lg text-sm font-bold hover:opacity-90">Submit to ED for Approval</button>
            )}

            {isED && selectedBudget.status === 'submitted' && (
              <div>
                <textarea value={edNotes} onChange={(e) => setEdNotes(e.target.value)} placeholder="Approval/rejection notes (required, min 5 chars)..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm min-h-[80px] mb-3 focus:outline-none focus:ring-2 focus:ring-aims-green/50" />
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => handleEDDecision('approve')} disabled={edNotes.trim().length < 5} className={cn('py-2 rounded-lg text-xs font-bold text-white', edNotes.trim().length >= 5 ? 'bg-aims-green hover:opacity-90' : 'bg-slate-300 cursor-not-allowed')}>Approve</button>
                  <button onClick={() => handleEDDecision('withhold')} disabled={edNotes.trim().length < 5} className={cn('py-2 rounded-lg text-xs font-bold text-white', edNotes.trim().length >= 5 ? 'bg-yellow-500 hover:opacity-90' : 'bg-slate-300 cursor-not-allowed')}>Withhold</button>
                  <button onClick={() => handleEDDecision('reject')} disabled={edNotes.trim().length < 5} className={cn('py-2 rounded-lg text-xs font-bold text-white', edNotes.trim().length >= 5 ? 'bg-red-500 hover:opacity-90' : 'bg-slate-300 cursor-not-allowed')}>Reject</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}