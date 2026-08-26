// src/components/admin/PayslipsTab.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';

interface PayslipRecord {
  id: string; employeeName: string; position: string; period: string;
  baseSalary: number; allowances: number; deductions: number; netPay: number;
  status: 'pending' | 'approved' | 'rejected'; generatedBy: string; notes?: string;
}

const MOCK_PAYSLIPS: PayslipRecord[] = [
  { id: 'ps1', employeeName: 'Grace Aceng', position: 'Company Administrator', period: 'August 2026', baseSalary: 2800000, allowances: 350000, deductions: 700000, netPay: 2450000, status: 'pending', generatedBy: 'Amos Ojok' },
  { id: 'ps2', employeeName: 'Amos Ojok', position: 'Finance Officer', period: 'August 2026', baseSalary: 2500000, allowances: 300000, deductions: 550000, netPay: 2250000, status: 'pending', generatedBy: 'System' },
  { id: 'ps3', employeeName: 'Sarah Aciro', position: 'Grants Manager', period: 'August 2026', baseSalary: 2600000, allowances: 400000, deductions: 600000, netPay: 2400000, status: 'approved', generatedBy: 'Amos Ojok', notes: 'Approved by ED.' },
  { id: 'ps4', employeeName: 'Janet Apio', position: 'Grant Writer', period: 'August 2026', baseSalary: 2000000, allowances: 250000, deductions: 450000, netPay: 1800000, status: 'approved', generatedBy: 'Amos Ojok', notes: 'Approved.' },
  { id: 'ps5', employeeName: 'Pius Odong', position: 'Lead Innovator', period: 'August 2026', baseSalary: 1800000, allowances: 200000, deductions: 400000, netPay: 1600000, status: 'rejected', generatedBy: 'Amos Ojok', notes: 'Recalculate field stipend.' },
  { id: 'ps6', employeeName: 'Nassir Mwanje', position: 'Country Director', period: 'July 2026', baseSalary: 3500000, allowances: 500000, deductions: 850000, netPay: 3150000, status: 'approved', generatedBy: 'Amos Ojok', notes: 'Approved.' },
];

export function PayslipsTab() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [payslips, setPayslips] = useState(MOCK_PAYSLIPS);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const isED = user?.role === 'ED';

  const filtered = filterStatus === 'all' ? payslips : payslips.filter(function(p) { return p.status === filterStatus; });
  const pendingCount = payslips.filter(function(p) { return p.status === 'pending'; }).length;

  const edDecision = (decision: 'approved' | 'rejected') => {
    setPayslips((prev) => prev.map((p) => (p.status === 'pending' ? { ...p, status: decision, notes: decision === 'approved' ? 'Authorized by ED' : 'Returned by ED for revision' } : p)));
    showToast({
      title: decision === 'approved' ? 'Payroll Authorized' : 'Payroll Returned',
      message: decision === 'approved' ? `August batch (${pendingCount} payslips) authorized & signed — ready for disbursement.` : 'August batch returned to Company Admin for revision.',
      type: decision === 'approved' ? 'success' : 'warning',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900">Payslips</h3>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map(function(s) {
            return (
              <button key={s} onClick={function() { setFilterStatus(s); }} className={cn("px-3 py-1 rounded-lg text-xs font-bold capitalize", filterStatus === s ? "bg-aims-navy text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{s}</button>
            );
          })}
        </div>
      </div>

      {/* ED Payroll Authorization Panel */}
      {isED && pendingCount > 0 && (
        <div className="bg-white rounded-xl border border-aims-navy/30 border-l-4 border-l-aims-navy p-5 mb-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">Payroll Batch — August 2026 · Awaiting ED Authorization</h4>
              <p className="text-xs text-slate-500 mt-0.5">Submitted by Grace Aceng (Company Admin) · {pendingCount} payslips · total UGX 186M · ED is the sole signatory</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-aims-orange/15 text-aims-orange uppercase">SLA: Overdue by 1 day</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Employee Count</p><p className="text-lg font-extrabold text-slate-900">{pendingCount}</p></div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Verification</p><p className="text-sm font-bold text-aims-green mt-1">✓ Matched to headcount</p></div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Compliance</p><p className="text-sm font-bold text-aims-green mt-1">✓ Taxes withheld</p></div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => edDecision('approved')} className="px-4 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90 flex items-center gap-1.5"><span className="material-symbols-outlined text-[15px]">approval</span>Authorize & Sign</button>
            <button onClick={() => edDecision('rejected')} className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100">✗ Reject & Return</button>
            <button onClick={() => showToast({ title: 'Revisions Requested', message: 'Payroll batch returned to Company Admin for revision.', type: 'warning' })} className="px-4 py-2 bg-aims-orange text-white text-xs font-bold rounded-lg hover:bg-aims-orange/90">◄ Request Revisions</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Employee</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Period</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">Base</th>
            <th className="text-right px-4 py-3 font-semibold text-slate-600">Net Pay</th>
            <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600">Notes</th>
          </tr></thead>
          <tbody>
            {filtered.map(function(ps) {
              return (
                <tr key={ps.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3"><p className="font-bold text-slate-900">{ps.employeeName}</p><p className="text-xs text-slate-500">{ps.position}</p></td>
                  <td className="px-4 py-3 text-slate-600">{ps.period}</td>
                  <td className="px-4 py-3 text-right text-slate-700">UGX {(ps.baseSalary / 1000000).toFixed(1)}M</td>
                  <td className="px-4 py-3 text-right font-extrabold text-aims-navy">UGX {(ps.netPay / 1000000).toFixed(1)}M</td>
                  <td className="px-4 py-3 text-center"><span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold capitalize", ps.status === 'pending' ? "bg-orange-100 text-orange-700" : ps.status === 'approved' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>{ps.status}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[150px] truncate">{ps.notes || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
