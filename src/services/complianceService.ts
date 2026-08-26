// src/services/complianceService.ts
// ============================================================
// AIMS — Compliance Vault (persisted)
// Upload each core organisational document ONCE; every grant proposal
// auto-checks against this vault (no re-uploading per funder).
// ============================================================

import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';

export interface ComplianceDoc {
  category: string;
  fileName?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

const DEFAULT_DOCS: ComplianceDoc[] = [
  { category: 'NGO Registration Certificate' },
  { category: 'Incorporation / Certificate of Registration' },
  { category: 'TIN Certificate' },
  { category: 'Audited Accounts (latest)' },
  { category: 'Audited Accounts (prior year)' },
  { category: 'Organisational Profile (Annex 5)' },
  { category: 'Tax Compliance Certificate' },
  { category: 'Theory of Change / Strategic Plan' },
  { category: 'Safeguarding Policy (Annex 11)' },
  { category: 'Gender & Social Inclusion Policy (Annex 12)' },
  { category: 'Board Approval Reference' },
  { category: 'Code of Ethical Conduct' },
];

const persisted = loadJSON<ComplianceDoc[] | null>(STORAGE_KEYS.compliance, null);
let vault: ComplianceDoc[] = (persisted && persisted.length > 0 ? persisted : DEFAULT_DOCS).map((d) => ({ ...d }));

function persist(): void {
  saveJSON(STORAGE_KEYS.compliance, vault);
}

export const complianceService = {
  getAll(): ComplianceDoc[] {
    return vault;
  },
  uploadedCount(): number {
    return vault.filter((d) => d.fileName).length;
  },
  isReady(): boolean {
    return vault.filter((d) => d.fileName).length >= vault.length * 0.7;
  },
  upload(category: string, fileName: string, uploadedBy: string): ComplianceDoc[] {
    vault = vault.map((d) => (d.category === category ? { ...d, fileName, uploadedAt: new Date().toISOString(), uploadedBy } : d));
    persist();
    return vault;
  },
  remove(category: string): ComplianceDoc[] {
    vault = vault.map((d) => (d.category === category ? { category: d.category } : d));
    persist();
    return vault;
  },
  /** How many of the core documents required by the funder checklist are present */
  checklistStatus(): { present: number; total: number } {
    return { present: this.uploadedCount(), total: vault.length };
  },
};
