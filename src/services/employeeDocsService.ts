// src/services/employeeDocsService.ts
// ============================================================
// AIMS — HR-confidential employee documents (CVs, personnel files).
// These land in the Documents hub under the "HR Confidential —
// Employee Files" category, which is accessible ONLY to the
// Executive Director and HR (COMPANY_ADMIN). See src/pages/Documents.tsx.
// ============================================================

import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';

export interface HrDocVersion { version: number; uploadedBy: string; uploadedAt: string; size: string; }

export interface HrDocRecord {
  id: string;
  title: string;
  fileType: string;
  fileSize: string;
  category: 'hr_confidential';
  uploadedBy: string;
  uploadedAt: string;
  versions: HrDocVersion[];
  tags: string[];
}

const persisted = loadJSON<HrDocRecord[] | null>(STORAGE_KEYS.hrDocs, null);
let docs: HrDocRecord[] = (persisted && Array.isArray(persisted) ? persisted : []).map((d) => ({
  ...d,
  versions: d.versions.map((v) => ({ ...v })),
}));

/** All HR-confidential documents (sorted newest first) */
export function listHrDocs(): HrDocRecord[] {
  return docs;
}

/** Add a document (e.g. an uploaded CV) directly into the HR-confidential section */
export function addHrDoc(input: Omit<HrDocRecord, 'id' | 'uploadedAt' | 'versions'> & { uploadedAt?: string }): HrDocRecord {
  const now = input.uploadedAt ?? new Date().toISOString();
  const doc: HrDocRecord = {
    ...input,
    id: `hr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    uploadedAt: now,
    versions: [{ version: 1, uploadedBy: input.uploadedBy, uploadedAt: now, size: input.fileSize }],
  };
  docs = [doc, ...docs];
  saveJSON(STORAGE_KEYS.hrDocs, docs);
  return doc;
}

/** Human-readable size label for a raw byte count */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
