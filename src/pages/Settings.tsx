// src/pages/Settings.tsx
import { useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { exportAllData, exportModuleData, importAllData, validateVaultFile, downloadFile, toCSV, vaultFilename, DATA_VAULT_VERSION, DATA_VAULT_BASELINE, STORAGE_KEYS } from '@/lib/storage';
import { grantService } from '@/services/grantService';
import { innovationService } from '@/services/innovationService';
import { financeService } from '@/services/financeService';
import { getAllRequisitions } from '@/services/requisitionService';
import { STAFF_ROSTER } from '@/data/roster';
import { userOpsGet } from '@/services/userOpsService';
import { loadDemoDataset } from '@/services/demoData';

export function Settings() {
  const { user, updateAvatar } = useAuth();
  const { showToast } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [imgError, setImgError] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [flashText, setFlashText] = useState('');
  const [pendingVault, setPendingVault] = useState<Record<string, unknown> | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { showToast({ title: 'Too Large', message: 'Max 2MB allowed.', type: 'error' }); return; }
      const reader = new FileReader();
      reader.onloadend = () => { updateAvatar(reader.result as string); setImgError(false); showToast({ title: 'Photo Updated', message: 'Your profile photo has been updated.', type: 'success' }); };
      reader.readAsDataURL(file);
    }
  };

  // ── Data Vault: backup / restore / per-domain export ──
  const handleExportBackup = () => {
    const envelope = exportAllData();
    const keys = Object.keys(envelope.data).length;
    downloadFile(vaultFilename('backup'), JSON.stringify(envelope, null, 2));
    showToast({ title: 'Full Backup Exported', message: `Timestamped JSON (${keys} storage keys, format v${envelope.version}).`, type: 'success' });
  };

  // Module-specific JSON export (timestamped envelope around one domain)
  const handleExportModuleJSON = (domain: string, storageKey: string) => {
    const envelope = exportModuleData(storageKey);
    const count = envelope.counts[storageKey] ?? 0;
    downloadFile(vaultFilename('module', domain), JSON.stringify(envelope, null, 2));
    showToast({ title: 'Module Exported', message: `${domain} exported as JSON (${count} record(s)).`, type: 'success' });
  };

  const handleRestoreFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Record<string, unknown>;
        const check = validateVaultFile(parsed);
        if (!check.ok || !parsed) {
          showToast({ title: 'Import Rejected', message: check.reason ?? 'The file is not a valid AIMS backup.', type: 'error' });
          return;
        }
        // Staging until the admin confirms the overwrite warning
        setPendingVault(parsed);
      } catch {
        showToast({ title: 'Import Failed', message: 'The file is not a valid AIMS backup.', type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const confirmRestore = () => {
    if (!pendingVault) return;
    try {
      importAllData(pendingVault);
      showToast({ title: 'Backup Restored', message: 'Data imported — reloading the app with your restored dataset.', type: 'success' });
    } catch {
      showToast({ title: 'Restore Failed', message: 'Could not apply the backup to this browser.', type: 'error' });
      setPendingVault(null);
      return;
    }
    setPendingVault(null);
    // Reload so every store re-reads the restored data from localStorage
    window.setTimeout(() => window.location.reload(), 900);
  };

  // ── Flash / factory reset ──
  const flashSystem = () => {
    try {
      const doomed: string[] = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && key.startsWith('aims_')) doomed.push(key);
      }
      doomed.forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
    window.location.reload();
  };

  const handleExportCSV = (domain: string) => {
    if (domain === 'grants') {
      downloadFile('grants.csv', toCSV(grantService.getAllGrants().map((g) => ({ id: g.id, title: g.title, funder: g.funder, stage: g.stage, deadline: g.deadline, requested: g.amountRequested, handler: g.handler }))), 'text/csv');
    } else if (domain === 'projects') {
      downloadFile('innovations.csv', toCSV(innovationService.getAllProjects().map((p) => ({ id: p.id, title: p.title, stage: p.stage, lead: p.leadName, progress: p.progressPercent, daysInStage: p.daysInStage, budget: p.budget ?? '' }))), 'text/csv');
    } else if (domain === 'requisitions') {
      downloadFile('requisitions.csv', toCSV(getAllRequisitions().map((r) => ({ id: r.id, title: r.title, dept: r.dept, amount: r.amount, status: r.status, requester: r.requester }))), 'text/csv');
    } else if (domain === 'staff') {
      downloadFile('staff.csv', toCSV(STAFF_ROSTER.map((s) => ({ name: s.name, email: s.email, role: s.role, department: s.department, position: s.position, status: s.status }))), 'text/csv');
    } else if (domain === 'finance') {
      downloadFile('finance.csv', toCSV(financeService.getBudgets().map((b) => ({ department: b.dept, budget: b.budget, spent: b.actual, forecastPct: b.forecastPct }))), 'text/csv');
    }
    showToast({ title: 'Exported', message: `${domain} exported as CSV.`, type: 'success' });
  };

  // ── Module catalogue for JSON exports (timestamped envelope per domain) ──
  const JSON_MODULES: { domain: string; key: string; label: string }[] = [
    { domain: 'grants', key: STORAGE_KEYS.grants, label: 'Grants' },
    { domain: 'projects', key: STORAGE_KEYS.projects, label: 'Projects' },
    { domain: 'finance', key: STORAGE_KEYS.finance, label: 'Finance' },
    { domain: 'requisitions', key: STORAGE_KEYS.requisitions, label: 'Requisitions' },
    { domain: 'compliance', key: STORAGE_KEYS.compliance, label: 'Compliance vault' },
    { domain: 'contracts', key: STORAGE_KEYS.contracts, label: 'Contracts' },
    { domain: 'leave', key: STORAGE_KEYS.leave, label: 'Leave' },
    { domain: 'inventory', key: STORAGE_KEYS.inventory, label: 'Inventory' },
    { domain: 'employees', key: STORAGE_KEYS.employees, label: 'Employees' },
    { domain: 'docs', key: STORAGE_KEYS.docsLibrary, label: 'Documents' },
    { domain: 'attendance', key: STORAGE_KEYS.attendanceRegister, label: 'Attendance' },
    { domain: 'forms', key: STORAGE_KEYS.formSubmissions, label: 'Form submissions' },
    { domain: 'notifications', key: STORAGE_KEYS.notifications, label: 'Notifications' },
    { domain: 'feed', key: STORAGE_KEYS.feed, label: 'Feed' },
  ];

  if (!user) return null;
  const myAccount = userOpsGet.users().find((u) => u.id === user.id);
  const vaultMeta = pendingVault as ({ app?: string; type?: string; version?: string; exportedAt?: string; data?: Record<string, unknown>; counts?: Record<string, number> } & Record<string, unknown>) | null;
  const vaultKeyCount = vaultMeta?.data ? Object.keys(vaultMeta.data).length : Object.keys(pendingVault ?? {}).filter((k) => k.startsWith('aims_')).length;
  const vaultDomainCounts = vaultMeta?.counts ? Object.entries(vaultMeta.counts).slice(0, 10) : [];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl font-extrabold text-slate-900">Settings</h1><p className="text-sm text-slate-500 mt-1">Manage your profile, preferences and data</p></div>

      {/* PROFILE PHOTO */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Profile Photo</h2>
        <div className="flex items-center gap-6">
          {user.avatarUrl && !imgError ? (
            <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 rounded-full border-2 border-slate-200 object-cover" onError={() => setImgError(true)} />
          ) : (
            <div className="w-20 h-20 rounded-full bg-aims-green flex items-center justify-center text-white text-2xl font-bold">{user.name.charAt(0)}</div>
          )}
          <div>
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-aims-navy text-white rounded-lg text-sm font-bold hover:opacity-90 mb-2">Upload New Photo</button>
            <p className="text-xs text-slate-500">JPG, PNG or GIF. Max 2MB.</p>
          </div>
          <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
        </div>
      </div>

      {/* PROFILE INFO */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Profile Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label><input type="text" defaultValue={user.name} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aims-green/50" /></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">User ID (unique)</label><input type="text" value={myAccount?.userCode ?? '—'} disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 font-mono" /></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label><input type="email" defaultValue={user.email} disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500" /></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label><input type="text" defaultValue={user.role.replace('_', ' ')} disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500" /></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Department</label><input type="text" defaultValue={user.department} disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500" /></div>
        </div>
      </div>

      {/* NOTIFICATION PREFERENCES */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Notification Preferences</h2>
        <div className="space-y-3">
          {[
            { label: 'Email notifications for approvals', defaultChecked: true },
            { label: 'Grant deadline reminders', defaultChecked: true },
            { label: 'Feed post notifications', defaultChecked: false },
            { label: 'System maintenance alerts', defaultChecked: true },
          ].map((pref, i) => (
            <label key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
              <span className="text-sm font-medium text-slate-700">{pref.label}</span>
              <input type="checkbox" defaultChecked={pref.defaultChecked} className="w-4 h-4 rounded border-slate-300 text-aims-green focus:ring-aims-green" />
            </label>
          ))}
        </div>
      </div>

      {/* DATA VAULT — backup & restore */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-bold text-slate-900 mb-1">Data Vault — Backup & Restore</h2>
        <p className="text-xs text-slate-500 mb-4">Everything (grants, proposals, projects, requisitions, finance, feed, notifications) lives in this browser. Export a backup regularly — restore it on any device.</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={handleExportBackup} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">download</span>Export Full Backup (JSON)
          </button>
          <button onClick={() => importRef.current?.click()} className="px-4 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">upload</span>Restore from Backup
          </button>
          <input ref={importRef} type="file" accept="application/json,.json" onChange={handleRestoreFileSelected} className="hidden" />
        </div>
        <p className="text-[10px] text-slate-400 mb-3 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[12px]">shield</span>Backup format v{DATA_VAULT_VERSION} · baseline {DATA_VAULT_BASELINE} · every export is timestamped and carries full metadata. Restoring replaces all current data (a confirmation step appears first).
        </p>

        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Per-domain CSV export</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {(['grants', 'projects', 'requisitions', 'finance', 'staff'] as const).map((d) => (
            <button key={d} onClick={() => handleExportCSV(d)} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-100 capitalize">{d}.csv</button>
          ))}
        </div>

        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Per-domain JSON export (timestamped)</p>
        <div className="flex flex-wrap gap-2">
          {JSON_MODULES.map((m) => (
            <button key={m.domain} onClick={() => handleExportModuleJSON(m.domain, m.key)} className="px-3 py-1.5 bg-aims-mint/20 border border-aims-mint/40 rounded-lg text-[10px] font-bold text-aims-navy hover:bg-aims-mint/40" title={m.label}>{m.domain}.json</button>
          ))}
        </div>

        {/* Flash the system — factory reset */}
        <div className="mt-6 pt-5 border-t-2 border-red-100">
          <h3 className="text-sm font-extrabold text-red-600 flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">restart_alt</span>Flash System (Factory Reset)</h3>
          <p className="text-xs text-slate-500 mt-1 mb-3">AIMS starts <strong>clean</strong> — no dummy records. Use the buttons below: flash wipes every record in this browser and restarts empty; load the demo dataset only when you want to preview features.</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowFlash(true)} className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">bolt</span>Flash / Reset to Clean
            </button>
            <button onClick={() => { loadDemoDataset(); showToast({ title: 'Demo Dataset Loaded', message: 'Sample records added to modules so you can preview features.', type: 'info' }); }} className="px-4 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">science</span>Load Demo Dataset
            </button>
          </div>
        </div>
      </div>

      {/* Restore confirmation modal — validating & confirming an uploaded backup */}
      {pendingVault && vaultMeta && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setPendingVault(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-11 h-11 rounded-full bg-aims-orange/15 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-aims-orange text-[22px]">restore</span></div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Restore Backup?</h3>
                <p className="text-xs text-slate-500 mt-0.5">Backup v{vaultMeta.version ?? 'legacy'} · exported {vaultMeta.exportedAt ? new Date(vaultMeta.exportedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'date unknown'}</p>
              </div>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
              <p className="text-xs font-bold text-red-600 flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">warning</span>This will replace all current data in this browser.</p>
              <p className="text-[11px] text-red-500 mt-1">Everything stored under the AIMS keys will be overwritten with the contents of this backup file.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Backup contents — {vaultKeyCount} storage key(s)</p>
              {vaultDomainCounts.length > 0 ? (
                <div className="space-y-1">
                  {vaultDomainCounts.map(([k, c]) => (
                    <p key={k} className="text-[11px] font-mono text-slate-600 flex items-center justify-between"><span>{k}</span><span className="font-bold">{c} record(s)</span></p>
                  ))}
                  {vaultDomainCounts.length < vaultKeyCount && <p className="text-[10px] text-slate-400 italic">…and {vaultKeyCount - vaultDomainCounts.length} more</p>}
                </div>
              ) : (
                <p className="text-[11px] font-mono text-slate-600">{Object.keys(pendingVault).filter((k) => k.startsWith('aims_')).slice(0, 10).join('\n')}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPendingVault(null)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={confirmRestore} className="px-4 py-2 bg-aims-green text-white text-sm font-bold rounded-lg hover:bg-aims-green/90 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">restore</span>Restore & Reload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flash confirmation modal */}
      {showFlash && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowFlash(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold text-red-600 mb-1">Flash the System?</h3>
            <p className="text-sm text-slate-600 mb-4">This permanently clears every AIMS record stored in this browser (including any demo dataset) and reloads a <strong>completely clean system</strong> — only data you enter afterwards will appear. Export a backup first if you might need the data.</p>
            <label className="block text-xs font-bold text-slate-600 mb-1">Type <span className="text-red-600">RESET</span> to confirm</label>
            <input value={flashText} onChange={(e) => setFlashText(e.target.value)} placeholder="RESET" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-400" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowFlash(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={flashSystem} disabled={flashText.trim() !== 'RESET'} className={cn('px-4 py-2 rounded-lg text-sm font-bold', flashText.trim() === 'RESET' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}>Flash System</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}