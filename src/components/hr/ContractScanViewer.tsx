// src/components/hr/ContractScanViewer.tsx
// ============================================================
// AIMS — Scanned contract viewer.
// Shows an employee's scanned contract (image) with a clean
// "document sheet", lets HR/ED attach or replace the scan (file
// stored as a size-capped image data URL), download a record sheet,
// and open the scan full-size. Used from the People Directory and
// the HR Contracts tab.
// ============================================================

import { useRef, useState } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { exportRecordSheet } from '@/lib/export';
import { attachContractScan, updateContract, type ContractRecord } from '@/services/contractService';

export function ContractScanViewer({ contract, canManage, onClose, onChanged }: { contract: ContractRecord; canManage: boolean; onClose: () => void; onChanged?: () => void }) {
  const { showToast } = useNotifications();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleScan = (file: File | undefined) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      showToast({ title: 'Invalid Scan', message: 'Please attach a PNG or JPG image of the scanned contract.', type: 'error' });
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      showToast({ title: 'Scan Too Large', message: 'Please use an image under ~1.5MB so it can be stored in the record.', type: 'error' });
      return;
    }
    setBusy(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = attachContractScan(contract.id, String(reader.result), file.name);
      setBusy(false);
      if (!res.ok) { showToast({ title: 'Upload Failed', message: res.reason ?? 'Try a smaller image.', type: 'error' }); return; }
      showToast({ title: 'Scan Attached', message: `${file.name} saved to ${contract.employeeName}'s record.`, type: 'success' });
      onChanged?.();
    };
    reader.readAsDataURL(file);
  };

  const removeScan = () => {
    updateContract(contract.id, { scanDataUrl: null, scanName: undefined });
    showToast({ title: 'Scan Removed', message: 'The scanned copy was detached from this contract.', type: 'info' });
    onChanged?.();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 bg-aims-navy text-white flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Scanned Employment Contract</p>
            <h3 className="text-sm font-extrabold truncate">{contract.employeeName} — {contract.type} contract</h3>
            <p className="text-[11px] text-white/70">{contract.startDate}{contract.endDate ? ` → ${contract.endDate}` : ' (open-ended)'} · {contract.status}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white shrink-0"><span className="material-symbols-outlined text-[22px]">close</span></button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {/* Scan / sheet */}
          {contract.scanDataUrl ? (
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
              <img src={contract.scanDataUrl} alt={`Scan of ${contract.employeeName}'s contract`} className="w-full object-contain max-h-[46vh] bg-white" />
              <p className="px-3 py-2 text-[10px] text-slate-500 border-t border-slate-200">{contract.scanName ?? 'Scanned contract'} — stored in the employee record (private to HR/ED).</p>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-300 p-10 text-center">
              <span className="material-symbols-outlined text-[44px] text-slate-300">document_scanner</span>
              <p className="text-sm font-bold text-slate-700 mt-2">No scanned copy on file</p>
              <p className="text-xs text-slate-500 mt-1">Upload a scan of the signed contract to view it here.</p>
            </div>
          )}

          {/* Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Salary / mo</p><p className="text-xs font-extrabold text-aims-navy mt-0.5">UGX {contract.salary.toLocaleString()}</p></div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Status</p><p className="text-xs font-bold text-slate-900 mt-0.5 capitalize">{contract.status.replace('_', ' ')}</p></div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Signed</p><p className="text-xs font-bold text-slate-900 mt-0.5">{contract.signedBy ?? '—'}</p></div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><p className="text-[10px] font-bold text-slate-500 uppercase">Updated</p><p className="text-xs font-bold text-slate-900 mt-0.5">{contract.updatedAt}</p></div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 justify-end pt-3 border-t border-slate-100">
            {contract.scanDataUrl && (
              <button onClick={() => window.open(contract.scanDataUrl as string, '_blank')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 flex items-center gap-1.5"><span className="material-symbols-outlined text-[15px]">open_in_new</span>Open Full Size</button>
            )}
            <button onClick={() => exportRecordSheet(`${contract.employeeName} contract`, 'Employment Contract', [['Employee', contract.employeeName], ['Type', contract.type], ['Start', contract.startDate], ['End', contract.endDate || 'Open-ended'], ['Salary (monthly, UGX)', contract.salary.toLocaleString()], ['Status', contract.status], ['Signed By', contract.signedBy ?? '—'], ['Updated', contract.updatedAt]])} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1.5"><span className="material-symbols-outlined text-[15px]">download</span>Download Record</button>
            {canManage && (
              <>
                <button onClick={() => fileRef.current?.click()} disabled={busy} className="px-4 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90 flex items-center gap-1.5 disabled:opacity-50"><span className="material-symbols-outlined text-[15px]">document_scanner</span>{contract.scanDataUrl ? 'Replace Scan' : 'Attach Scan'}</button>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { handleScan(e.target.files?.[0]); e.target.value = ''; }} />
                {contract.scanDataUrl && (
                  <button onClick={removeScan} className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 flex items-center gap-1.5"><span className="material-symbols-outlined text-[15px]">link_off</span>Detach</button>
                )}
              </>
            )}
            <button onClick={onClose} className={cn('px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg')}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
