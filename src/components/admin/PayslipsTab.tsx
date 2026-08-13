// src/components/admin/PayslipReviewPanel.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';

interface PayslipItem {
  id: string;
  employeeName: string;
  position: string;
  period: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: 'pending' | 'approved' | 'rejected';
  edNotes?: string;
  imageUrl?: string;
}

const MOCK_PAYSLIPS: PayslipItem[] = [
  { id: 'ps1', employeeName: 'Grace Aceng', position: 'Company Administrator', period: 'August 2026', baseSalary: 2800000, allowances: 350000, deductions: 700000, netPay: 2450000, status: 'pending', imageUrl: '#' },
  { id: 'ps2', employeeName: 'Amos Ojok', position: 'Finance Officer', period: 'August 2026', baseSalary: 2500000, allowances: 300000, deductions: 550000, netPay: 2250000, status: 'pending', imageUrl: '#' },
  { id: 'ps3', employeeName: 'Sarah Aciro', position: 'Grants Manager', period: 'August 2026', baseSalary: 2600000, allowances: 400000, deductions: 600000, netPay: 2400000, status: 'approved', edNotes: 'Approved. All calculations verified.' },
  { id: 'ps4', employeeName: 'Janet Apio', position: 'Grant Writer', period: 'August 2026', baseSalary: 2000000, allowances: 250000, deductions: 450000, netPay: 1800000, status: 'approved', edNotes: 'Approved.' },
  { id: 'ps5', employeeName: 'Pius Odong', position: 'Lead Innovator', period: 'August 2026', baseSalary: 1800000, allowances: 200000, deductions: 400000, netPay: 1600000, status: 'rejected', edNotes: 'Allowance calculation error. Please recalculate field stipend component.' },
];

export function PayslipReviewPanel() {
  const { showToast, addNotification } = useNotifications();
  const [payslips, setPayslips] = useState(MOCK_PAYSLIPS);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipItem | null>(null);
  const [notes, setNotes] = useState('');
  const [viewImage, setViewImage] = useState(false);

  const pending = payslips.filter(p => p.status === 'pending');
  const processed = payslips.filter(p => p.status !== 'pending');

  const handleDecision = (action: 'approve' | 'reject') => {
    if (!selectedPayslip || notes.trim().length < 5) return;
    setPayslips(prev => prev.map(p => p.id === selectedPayslip.id ? { ...p, status: action === 'approve' ? 'approved' : 'rejected', edNotes: notes.trim() } : p));
    addNotification({ userId: 'user-admin-001', title: `Payslip ${action === 'approve' ? 'Approved' : 'Rejected'}`, message: `${selectedPayslip.employeeName} payslip ${action === 'approve' ? 'approved' : 'rejected'} by ED.`, type: action === 'approve' ? 'success' : 'warning' });
    showToast({ title: `Payslip ${action === 'approve' ? 'Approved' : 'Rejected'}`, message: `${selectedPayslip.employeeName} — ${action === 'approve' ? 'Approved' : 'Rejected'}.`, type: action === 'approve' ? 'success' : 'warning' });
    setNotes('');
    setSelectedPayslip(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900">Payslip Review & Approval</h3>
        <span className="text-xs font-bold text-aims-orange">{pending.length} pending</span>
      </div>

      <div className="space-y-3">
        {payslips.map(ps => (
          <div key={ps.id} className={cn('bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow cursor-pointer', ps.status === 'pending' ? 'border-orange-200 bg-orange-50/30' : 'border-slate-200')} onClick={() => setSelectedPayslip(ps)}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-bold text-slate-900">{ps.employeeName}</p>
                <p className="text-xs text-slate-500">{ps.position} • {ps.period}</p>
              </div>
              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold capitalize', ps.status === 'pending' ? 'bg-orange-100 text-orange-700' : ps.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>{ps.status}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs mb-2">
              <div><p className="text-slate-400">Base</p><p className="font-bold text-slate-800">UGX {(ps.baseSalary / 1000000).toFixed(1)}M</p></div>
              <div><p className="text-slate-400">Allow.</p><p className="font-bold text-slate-800">UGX {(ps.allowances / 1000000).toFixed(1)}M</p></div>
              <div><p className="text-slate-400">Deduct.</p><p className="font-bold text-slate-800">UGX {(ps.deductions / 1000000).toFixed(1)}M</p></div>
              <div><p className="text-slate-400">Net</p><p className="font-extrabold text-aims-navy">UGX {(ps.netPay / 1000000).toFixed(1)}M</p></div>
            </div>
            {ps.edNotes && <p className="text-xs text-slate-500 italic bg-slate-50 rounded p-2">"{ps.edNotes}"</p>}
          </div>
        ))}
      </div>

      {/* PAYSLIP DETAIL MODAL */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setSelectedPayslip(null); setNotes(''); setViewImage(false); }} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6">
            <button onClick={() => { setSelectedPayslip(null); setNotes(''); setViewImage(false); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">{selectedPayslip.employeeName} — Payslip</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedPayslip.position} • {selectedPayslip.period}</p>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate-600">Base Salary</span><span className="font-bold text-slate-900">UGX {selectedPayslip.baseSalary.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-600">Allowances</span><span className="font-bold text-slate-900">UGX {selectedPayslip.allowances.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-600">Deductions (PAYE, NSSF)</span><span className="font-bold text-red-600">- UGX {selectedPayslip.deductions.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-200 font-extrabold text-base"><span className="text-slate-900">Net Pay</span><span className="text-aims-navy">UGX {selectedPayslip.netPay.toLocaleString()}</span></div>
            </div>

            {/* SCANNED PAYSLIP IMAGE */}
            {selectedPayslip.imageUrl && (
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Scanned Payslip Document</p>
                {!viewImage ? (
                  <button onClick={() => setViewImage(true)} className="w-full py-3 bg-slate-100 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-200 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">visibility</span>View Scanned Image
                  </button>
                ) : (
                  <div className="bg-slate-100 rounded-lg border border-slate-200 p-8 text-center">
                    <span className="material-symbols-outlined text-[48px] text-slate-300 block mb-2">image</span>
                    <p className="text-xs text-slate-500 mb-2">[Scanned payslip image preview]</p>
                    <button onClick={() => setViewImage(false)} className="text-xs font-bold text-aims-navy hover:underline">Hide Image</button>
                  </div>
                )}
              </div>
            )}

            {selectedPayslip.edNotes && (
              <div className="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">ED Notes</p>
                <p className="text-xs text-slate-700">{selectedPayslip.edNotes}</p>
              </div>
            )}

            {selectedPayslip.status === 'pending' && (
              <div>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Approval/rejection notes (required, min 5 chars)..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm min-h-[80px] mb-3 focus:outline-none focus:ring-2 focus:ring-aims-green/50" />
                <div className="flex gap-2">
                  <button onClick={() => handleDecision('reject')} disabled={notes.trim().length < 5} className={cn('flex-1 py-2 rounded-lg text-xs font-bold text-white', notes.trim().length >= 5 ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-300 cursor-not-allowed')}>Reject</button>
                  <button onClick={() => handleDecision('approve')} disabled={notes.trim().length < 5} className={cn('flex-1 py-2 rounded-lg text-xs font-bold text-white', notes.trim().length >= 5 ? 'bg-aims-green hover:opacity-90' : 'bg-slate-300 cursor-not-allowed')}>Approve</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}