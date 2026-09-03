// src/services/docService.ts
// ============================================================
// AIMS — Document library store (persisted).
// The central, mutable source of truth for the Documents hub:
// seeded with the institutional library, then extended/deleted by
// real uploads. HR-confidential CV uploads (employeeDocsService)
// write into the same store so they appear in their own category.
// Components re-render automatically via the live data bus.
// ============================================================

import { loadJSON, saveJSON, STORAGE_KEYS, demoMode } from '@/lib/storage';

export type DocCategory =
  | 'governance' | 'hr_contracts' | 'hr_confidential' | 'finance_procurement'
  | 'grants' | 'grants_resource' | 'innovations' | 'inventory_policy'
  | 'system_security' | 'shared_reference';

export interface DocVersion { version: number; uploadedBy: string; uploadedAt: string; size: string; }

export interface DocRecord {
  id: string;
  title: string;
  fileType: string;
  fileSize: string;
  category: DocCategory;
  uploadedBy: string;
  uploadedAt: string;
  versions: DocVersion[];
  tags: string[];
}

export const SEED_DOCUMENTS: DocRecord[] = [
  { id: 'd1', title: 'Q2 Board Meeting Minutes.pdf', fileType: 'PDF', fileSize: '520 KB', category: 'governance', uploadedBy: 'Dr. Sarah Namukasa', uploadedAt: '2026-08-21T11:00:00Z', versions: [{ version: 1, uploadedBy: 'Dr. Sarah Namukasa', uploadedAt: '2026-08-21T11:00:00Z', size: '520 KB' }], tags: ['board', 'minutes', 'q2'] },
  { id: 'd2', title: 'Compliance Policy v2.1.docx', fileType: 'DOCX', fileSize: '410 KB', category: 'governance', uploadedBy: 'Nassir Mukiibi', uploadedAt: '2026-08-10T09:00:00Z', versions: [{ version: 2, uploadedBy: 'Nassir Mukiibi', uploadedAt: '2026-08-10T09:00:00Z', size: '410 KB' }, { version: 1, uploadedBy: 'Nassir Mukiibi', uploadedAt: '2026-06-01T09:00:00Z', size: '380 KB' }], tags: ['compliance', 'policy'] },
  { id: 'd3', title: 'Annual Report Draft 2026.docx', fileType: 'DOCX', fileSize: '2.8 MB', category: 'governance', uploadedBy: 'Nassir Mukiibi', uploadedAt: '2026-08-18T14:00:00Z', versions: [{ version: 1, uploadedBy: 'Nassir Mukiibi', uploadedAt: '2026-08-18T14:00:00Z', size: '2.8 MB' }], tags: ['annual-report', 'draft'] },
  { id: 'd4', title: 'Sarah Aciro - Employment Contract.pdf', fileType: 'PDF', fileSize: '280 KB', category: 'hr_contracts', uploadedBy: 'Grace Nakamya', uploadedAt: '2026-07-01T10:00:00Z', versions: [{ version: 1, uploadedBy: 'Grace Nakamya', uploadedAt: '2026-07-01T10:00:00Z', size: '280 KB' }], tags: ['contract', 'grants-manager'] },
  { id: 'd5', title: 'Q2 Appraisal Form - Template.docx', fileType: 'DOCX', fileSize: '190 KB', category: 'hr_contracts', uploadedBy: 'Grace Nakamya', uploadedAt: '2026-07-15T09:00:00Z', versions: [{ version: 1, uploadedBy: 'Grace Nakamya', uploadedAt: '2026-07-15T09:00:00Z', size: '190 KB' }], tags: ['appraisal', 'template'] },
  { id: 'd6', title: 'August Payroll Summary.xlsx', fileType: 'XLSX', fileSize: '890 KB', category: 'finance_procurement', uploadedBy: 'David Okello', uploadedAt: '2026-08-21T16:00:00Z', versions: [{ version: 1, uploadedBy: 'David Okello', uploadedAt: '2026-08-21T16:00:00Z', size: '890 KB' }], tags: ['payroll', 'august'] },
  { id: 'd7', title: 'REQ-041 Requisition Backup.pdf', fileType: 'PDF', fileSize: '340 KB', category: 'finance_procurement', uploadedBy: 'David Okello', uploadedAt: '2026-08-18T10:00:00Z', versions: [{ version: 1, uploadedBy: 'David Okello', uploadedAt: '2026-08-18T10:00:00Z', size: '340 KB' }], tags: ['requisition', 'req-041'] },
  { id: 'd8', title: 'Q3 Budget Sheet.xlsx', fileType: 'XLSX', fileSize: '1.2 MB', category: 'finance_procurement', uploadedBy: 'David Okello', uploadedAt: '2026-08-20T11:00:00Z', versions: [{ version: 2, uploadedBy: 'David Okello', uploadedAt: '2026-08-20T11:00:00Z', size: '1.2 MB' }, { version: 1, uploadedBy: 'David Okello', uploadedAt: '2026-08-05T11:00:00Z', size: '1.0 MB' }], tags: ['budget', 'q3'] },
  { id: 'd9', title: 'Land Rights - Full Proposal v3.docx', fileType: 'DOCX', fileSize: '1.8 MB', category: 'grants', uploadedBy: 'Sarah Aciro', uploadedAt: '2026-08-01T15:00:00Z', versions: [{ version: 3, uploadedBy: 'Sarah Aciro', uploadedAt: '2026-08-01T15:00:00Z', size: '1.8 MB' }, { version: 2, uploadedBy: 'Sarah Aciro', uploadedAt: '2026-07-20T15:00:00Z', size: '1.6 MB' }], tags: ['proposal', 'land-rights', 'usaid'] },
  { id: 'd10', title: 'Land Rights - Budget v3.xlsx', fileType: 'XLSX', fileSize: '340 KB', category: 'grants', uploadedBy: 'Janet Apio', uploadedAt: '2026-08-05T09:00:00Z', versions: [{ version: 3, uploadedBy: 'Janet Apio', uploadedAt: '2026-08-05T09:00:00Z', size: '340 KB' }], tags: ['budget', 'land-rights'] },
  { id: 'd11', title: 'USAID Proposal Template 2026.docx', fileType: 'DOCX', fileSize: '520 KB', category: 'grants_resource', uploadedBy: 'Sarah Aciro', uploadedAt: '2026-06-15T09:00:00Z', versions: [{ version: 1, uploadedBy: 'Sarah Aciro', uploadedAt: '2026-06-15T09:00:00Z', size: '520 KB' }], tags: ['template', 'usaid'] },
  { id: 'd12', title: 'ARDHI Standard Budget Template.xlsx', fileType: 'XLSX', fileSize: '280 KB', category: 'grants_resource', uploadedBy: 'Sarah Aciro', uploadedAt: '2026-06-15T09:30:00Z', versions: [{ version: 1, uploadedBy: 'Sarah Aciro', uploadedAt: '2026-06-15T09:30:00Z', size: '280 KB' }], tags: ['template', 'budget'] },
  { id: 'd13', title: 'Org Profile & Theory of Change.pdf', fileType: 'PDF', fileSize: '1.2 MB', category: 'grants_resource', uploadedBy: 'Sarah Aciro', uploadedAt: '2026-06-20T10:00:00Z', versions: [{ version: 1, uploadedBy: 'Sarah Aciro', uploadedAt: '2026-06-20T10:00:00Z', size: '1.2 MB' }], tags: ['boilerplate', 'theory-of-change'] },
  { id: 'd14', title: 'Solar Grain Dryer - Feasibility Study.pdf', fileType: 'PDF', fileSize: '2.1 MB', category: 'innovations', uploadedBy: 'Pius Odong', uploadedAt: '2026-08-12T14:00:00Z', versions: [{ version: 1, uploadedBy: 'Pius Odong', uploadedAt: '2026-08-12T14:00:00Z', size: '2.1 MB' }], tags: ['feasibility', 'solar'] },
  { id: 'd15', title: 'Land Mapping Drone - Technical Spec.pdf', fileType: 'PDF', fileSize: '1.5 MB', category: 'innovations', uploadedBy: 'Florence Adong', uploadedAt: '2026-08-15T11:00:00Z', versions: [{ version: 2, uploadedBy: 'Florence Adong', uploadedAt: '2026-08-15T11:00:00Z', size: '1.5 MB' }, { version: 1, uploadedBy: 'Florence Adong', uploadedAt: '2026-08-01T11:00:00Z', size: '1.3 MB' }], tags: ['drone', 'specs'] },
  { id: 'd16', title: 'Inventory Low-Stock Report - Aug.xlsx', fileType: 'XLSX', fileSize: '410 KB', category: 'inventory_policy', uploadedBy: 'Isaac Tumusiime', uploadedAt: '2026-08-20T09:00:00Z', versions: [{ version: 1, uploadedBy: 'Isaac Tumusiime', uploadedAt: '2026-08-20T09:00:00Z', size: '410 KB' }], tags: ['inventory', 'low-stock'] },
  { id: 'd17', title: 'Access Log - August 2026.pdf', fileType: 'PDF', fileSize: '780 KB', category: 'system_security', uploadedBy: 'System', uploadedAt: '2026-08-22T00:00:00Z', versions: [{ version: 1, uploadedBy: 'System', uploadedAt: '2026-08-22T00:00:00Z', size: '780 KB' }], tags: ['audit', 'access-log'] },
  { id: 'd18', title: 'Leave Request Form.pdf', fileType: 'PDF', fileSize: '120 KB', category: 'shared_reference', uploadedBy: 'Grace Nakamya', uploadedAt: '2026-08-18T11:00:00Z', versions: [{ version: 2, uploadedBy: 'Grace Nakamya', uploadedAt: '2026-08-18T11:00:00Z', size: '120 KB' }, { version: 1, uploadedBy: 'Grace Nakamya', uploadedAt: '2026-05-01T11:00:00Z', size: '110 KB' }], tags: ['form', 'leave'] },
  { id: 'd19', title: 'Requisition Form Template.docx', fileType: 'DOCX', fileSize: '95 KB', category: 'shared_reference', uploadedBy: 'Grace Nakamya', uploadedAt: '2026-08-19T10:00:00Z', versions: [{ version: 1, uploadedBy: 'Grace Nakamya', uploadedAt: '2026-08-19T10:00:00Z', size: '95 KB' }], tags: ['form', 'requisition', 'template'] },
  { id: 'd20', title: 'Employee Handbook SOP.pdf', fileType: 'PDF', fileSize: '3.4 MB', category: 'shared_reference', uploadedBy: 'Grace Nakamya', uploadedAt: '2026-07-01T09:00:00Z', versions: [{ version: 1, uploadedBy: 'Grace Nakamya', uploadedAt: '2026-07-01T09:00:00Z', size: '3.4 MB' }], tags: ['sop', 'handbook'] },
  { id: 'd21', title: 'ARDHI Brand Assets.zip', fileType: 'ZIP', fileSize: '18 MB', category: 'shared_reference', uploadedBy: 'Nassir Mukiibi', uploadedAt: '2026-06-01T09:00:00Z', versions: [{ version: 1, uploadedBy: 'Nassir Mukiibi', uploadedAt: '2026-06-01T09:00:00Z', size: '18 MB' }], tags: ['brand', 'assets'] },
];

const persisted = loadJSON<DocRecord[] | null>(STORAGE_KEYS.docsLibrary, null);
let docs: DocRecord[] = (persisted && persisted.length > 0
  ? persisted
  : demoMode()
    ? SEED_DOCUMENTS
    : []
).map((d) => ({ ...d, versions: d.versions.map((v) => ({ ...v })) }));

/** Reload the demo document library (Settings → Load demo dataset) */
export function loadDemoDocs(): void {
  docs = SEED_DOCUMENTS.map((d) => ({ ...d, versions: d.versions.map((v) => ({ ...v })) }));
  persist();
}

function persist(): void {
  saveJSON(STORAGE_KEYS.docsLibrary, docs);
}

/** All documents (seeded library + uploads, newest first) */
export function listDocs(): DocRecord[] {
  return docs;
}

export interface NewDocInput {
  title: string;
  fileType: string;
  fileSize: string;
  category: DocCategory;
  uploadedBy: string;
  tags?: string[];
  uploadedAt?: string;
}

/** Add a document (real upload record) */
export function addDoc(input: NewDocInput): DocRecord {
  const now = input.uploadedAt ?? new Date().toISOString();
  const doc: DocRecord = {
    id: `d-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: input.title,
    fileType: input.fileType,
    fileSize: input.fileSize,
    category: input.category,
    uploadedBy: input.uploadedBy,
    uploadedAt: now,
    versions: [{ version: 1, uploadedBy: input.uploadedBy, uploadedAt: now, size: input.fileSize }],
    tags: input.tags ?? [],
  };
  docs = [doc, ...docs];
  persist();
  return doc;
}

/** Remove a document; returns false when not found */
export function removeDoc(id: string): boolean {
  const before = docs.length;
  docs = docs.filter((d) => d.id !== id);
  persist();
  return docs.length < before;
}

/** A readable record sheet (text) representing the document for download */
export function docRecordSheet(doc: DocRecord): string {
  const lines = [
    'ARDHI — Document Record',
    '=======================',
    `Title: ${doc.title}`,
    `Type: ${doc.fileType}`,
    `Size: ${doc.fileSize}`,
    `Category: ${doc.category.replace(/_/g, ' ')}`,
    `Uploaded by: ${doc.uploadedBy}`,
    `Uploaded on: ${new Date(doc.uploadedAt).toLocaleString('en-GB')}`,
    `Tags: ${doc.tags.join(', ') || '—'}`,
    '',
    'Version history:',
  ];
  doc.versions.forEach((v) => {
    lines.push(`  v${v.version} — ${v.uploadedBy} — ${new Date(v.uploadedAt).toLocaleString('en-GB')} (${v.size})`);
  });
  lines.push('', 'ARDHI · Research. Advocacy. Innovation.');
  return lines.join('\n');
}
