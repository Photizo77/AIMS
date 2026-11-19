// src/components/admin/OnboardStepModal.tsx
// ============================================================
// AIMS — executable onboarding steps.
// The 4-step onboarding checklist used to only flip a checkbox.
// Each step now opens a real form that writes real state:
//   1 Provision Account  → login (email + temporary password) + ARD-EMP code
//   2 Assign Role        → persona role on that account (module access)
//   3 Issue Credentials  → 2FA/MFA + optional API key, credentials delivered
//   4 Asset Issuance     → equipment handed over as an Inventory assignment
// ============================================================

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import { ROLE_LABELS } from '@/config/roles';
import type { Role } from '@/types';
import {
  ONBOARD_ASSETS, suggestLoginEmail, generateTempPassword,
  provisionOnboardAccount, assignOnboardRole, issueOnboardCredentials, issueOnboardAssets,
  type Onboardee,
} from '@/services/userOpsService';

const INPUT = 'w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30';
const LABEL = 'block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1';

const STEP_META: Record<string, { title: string; blurb: string; icon: string; cta: string }> = {
  s1: { title: 'Provision the login', blurb: 'Create the AIMS account with a unique ARD-EMP code and a temporary password the hire changes on first sign-in.', icon: 'key', cta: 'Create login' },
  s2: { title: 'Assign the role', blurb: 'The role decides which modules the account can open. It is written to the provisioned login.', icon: 'admin_panel_settings', cta: 'Assign role' },
  s3: { title: 'Issue credentials & 2FA', blurb: 'Turn on two-factor authentication so the account is protected from first login, and issue an API key if the role needs one.', icon: 'verified_user', cta: 'Issue credentials' },
  s4: { title: 'Hand over assets', blurb: 'Record the equipment issued to the new hire — this creates a tracked assignment in Inventory.', icon: 'inventory_2', cta: 'Issue assets' },
};

export function OnboardStepModal({
  onboardee, stepId, actor, onClose,
}: { onboardee: Onboardee; stepId: string; actor: string; onClose: () => void }) {
  const { showToast } = useNotifications();
  const meta = STEP_META[stepId] ?? { title: 'Onboarding step', blurb: '', icon: 'check', cta: 'Complete' };

  const hasLogin = Boolean(onboardee.account);

  // Step 1 — provisioning fields
  const [email, setEmail] = useState(() => onboardee.account?.loginEmail ?? suggestLoginEmail(onboardee.name, onboardee.email));
  const [password, setPassword] = useState(() => onboardee.account?.temporaryPassword ?? generateTempPassword());
  const [position, setPosition] = useState(onboardee.position ?? '');
  const [department, setDepartment] = useState(onboardee.department ?? '');

  // Step 2 — role
  const [role, setRole] = useState<Role>(() => (onboardee.role as Role | undefined) ?? 'GRANT_WRITER');

  // Step 3 — credentials
  const [enableMfa, setEnableMfa] = useState(true);
  const [issueApiKey, setIssueApiKey] = useState(false);

  // Step 4 — assets
  const [assets, setAssets] = useState<string[]>(() => (onboardee.assets && onboardee.assets.length > 0 ? onboardee.assets : ['Laptop', 'Mobile phone', 'Access card']));

  const needsLogin = stepId !== 's1';
  const blocked = needsLogin && !hasLogin;

  const toggleAsset = (item: string) =>
    setAssets((prev) => (prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]));

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);

  const copy = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      showToast({ title: 'Copied', message: 'Value copied to clipboard.', type: 'success' });
    } catch {
      showToast({ title: 'Copy Unavailable', message: 'Select the value and copy manually.', type: 'error' });
    }
  };

  const run = () => {
    if (stepId === 's1') {
      if (!emailValid) { showToast({ title: 'Invalid Email', message: 'Enter a valid work email for the new login.', type: 'error' }); return; }
      if (password.trim().length < 8) { showToast({ title: 'Weak Password', message: 'The temporary password needs at least 8 characters.', type: 'error' }); return; }
      const updated = provisionOnboardAccount(onboardee.id, {
        loginEmail: email, temporaryPassword: password.trim(), position, department,
      }, actor);
      if (!updated) { showToast({ title: 'Provisioning Failed', message: 'This hire is no longer in the pipeline.', type: 'error' }); onClose(); return; }
      showToast({ title: 'Login Provisioned', message: `${email} created for ${onboardee.name}. They appear in the Directory with a temporary password.`, type: 'success' });
    } else if (stepId === 's2') {
      const updated = assignOnboardRole(onboardee.id, role, actor);
      if (!updated) { showToast({ title: 'Role Assignment Failed', message: 'This hire is no longer in the pipeline.', type: 'error' }); onClose(); return; }
      showToast({ title: 'Role Assigned', message: `${onboardee.name} is now ${ROLE_LABELS[role]} — module access updated.`, type: 'success' });
    } else if (stepId === 's3') {
      const updated = issueOnboardCredentials(onboardee.id, { enableMfa, issueApiKey }, actor);
      if (!updated) { showToast({ title: 'Credential Issue Failed', message: 'This hire is no longer in the pipeline.', type: 'error' }); onClose(); return; }
      showToast({
        title: 'Credentials Issued',
        message: `${enableMfa ? '2FA enabled' : '2FA skipped'}${issueApiKey ? ' · API key issued' : ''} · credentials sent to ${onboardee.account?.loginEmail ?? onboardee.email ?? 'the new hire'}.`,
        type: 'success',
      });
    } else {
      const updated = issueOnboardAssets(onboardee.id, assets, actor);
      if (!updated) { showToast({ title: 'Asset Issue Failed', message: 'This hire is no longer in the pipeline.', type: 'error' }); onClose(); return; }
      showToast({ title: 'Assets Issued', message: assets.length > 0 ? `${assets.join(', ')} assigned to ${onboardee.name} in Inventory.` : 'No equipment was required.', type: 'success' });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 bg-aims-navy text-white flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-[20px]">{meta.icon}</span></span>
            <div>
              <h3 className="text-sm font-bold text-white">{meta.title}</h3>
              <p className="text-[11px] text-white/75 mt-0.5">{onboardee.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white shrink-0"><span className="material-symbols-outlined text-[20px]">close</span></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-3">{meta.blurb}</p>

          {blocked && (
            <div className="rounded-lg border border-aims-orange/30 bg-aims-orange/5 p-3 flex items-start gap-2">
              <span className="material-symbols-outlined text-aims-orange text-[16px] mt-0.5">warning</span>
              <p className="text-[11px] text-slate-700">Provision the login first (step 1) — this step writes to the account.</p>
            </div>
          )}

          {/* STEP 1 — Provision account */}
          {stepId === 's1' && (
            <>
              <div>
                <label className={LABEL}>Work email (login)</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT} placeholder="first.last@ardhi.org.ug" />
                {!emailValid && <p className="text-[10px] text-red-500 mt-1">Enter a valid email address.</p>}
              </div>
              <div>
                <label className={LABEL}>Temporary password</label>
                <div className="flex gap-2">
                  <input value={password} onChange={(e) => setPassword(e.target.value)} className={cn(INPUT, 'font-mono')} />
                  <button onClick={() => setPassword(generateTempPassword())} className="px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 shrink-0" title="Generate a new password">Generate</button>
                  <button onClick={() => copy(password)} className="px-3 py-2 border border-slate-200 rounded-lg text-[10px] font-bold text-aims-navy hover:bg-aims-navy/5 shrink-0">Copy</button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Share this once — the hire is asked to change it at first sign-in.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Position</label>
                  <input value={position} onChange={(e) => setPosition(e.target.value)} className={INPUT} placeholder="e.g. Grants Officer" />
                </div>
                <div>
                  <label className={LABEL}>Department</label>
                  <input value={department} onChange={(e) => setDepartment(e.target.value)} className={INPUT} placeholder="e.g. Grants" />
                </div>
              </div>
            </>
          )}

          {/* STEP 2 — Role */}
          {stepId === 's2' && (
            <>
              <div>
                <label className={LABEL}>Persona role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={INPUT}>
                  {Object.entries(ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">Account that will be updated</p>
                <p className="font-mono text-[10px]">{onboardee.account?.loginEmail ?? '—'}</p>
                <p>Current role: <span className="font-bold">{onboardee.role ? (ROLE_LABELS[onboardee.role as Role] ?? onboardee.role) : 'not set'}</span></p>
              </div>
            </>
          )}

          {/* STEP 3 — Credentials */}
          {stepId === 's3' && (
            <>
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" checked={enableMfa} onChange={(e) => setEnableMfa(e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-slate-300 accent-aims-green" />
                <span>
                  <span className="text-xs font-bold text-slate-900 block">Enable two-factor authentication (2FA)</span>
                  <span className="text-[10px] text-slate-500">A one-time code is required at every sign-in. Strongly recommended for every role.</span>
                </span>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" checked={issueApiKey} onChange={(e) => setIssueApiKey(e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-slate-300 accent-aims-green" />
                <span>
                  <span className="text-xs font-bold text-slate-900 block">Issue an API key</span>
                  <span className="text-[10px] text-slate-500">Only for roles that call AIMS from another system (e.g. Finance integrations).</span>
                </span>
              </label>
              <div className="rounded-lg border border-slate-200 p-3 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">Credentials delivered to</p>
                <p className="font-mono text-[10px]">{onboardee.account?.loginEmail ?? '—'}</p>
                <p>Temporary password: <span className="font-mono">{onboardee.account?.temporaryPassword ?? '—'}</span></p>
              </div>
            </>
          )}

          {/* STEP 4 — Assets */}
          {stepId === 's4' && (
            <div className="space-y-2">
              {ONBOARD_ASSETS.map((item) => {
                const checked = assets.includes(item);
                return (
                  <label key={item} className={cn('flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors', checked ? 'bg-aims-green/5 border-aims-green/30' : 'bg-white border-slate-200 hover:bg-slate-50')}>
                    <input type="checkbox" checked={checked} onChange={() => toggleAsset(item)} className="w-4 h-4 rounded border-slate-300 accent-aims-green" />
                    <span className={cn('text-xs font-bold', checked ? 'text-slate-900' : 'text-slate-600')}>{item}</span>
                  </label>
                );
              })}
              <p className="text-[10px] text-slate-400 italic">Ticked items are written to Inventory as a tracked assignment for {onboardee.name}.</p>
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
          <button onClick={run} disabled={blocked} className={cn('px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5', blocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-aims-green text-white hover:bg-aims-green/90')}>
            <span className="material-symbols-outlined text-[15px]">{meta.icon}</span>{meta.cta}
          </button>
        </div>
      </div>
    </div>
  );
}
