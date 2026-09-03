// src/services/employeeDocsService.ts
// ============================================================
// AIMS — HR-confidential employee documents (CVs, personnel files).
// Files land in the Documents hub under "HR Confidential —
// Employee Files", visible ONLY to the Executive Director and HR
// (COMPANY_ADMIN). Records live in the shared document library
// store (docService) so the Documents page shows them live.
// ============================================================

import { addDoc, listDocs } from '@/services/docService';

export interface HrDocRecord {
  id: string;
  title: string;
  fileType: string;
  fileSize: string;
  category: 'hr_confidential';
  uploadedBy: string;
  uploadedAt: string;
  versions: { version: number; uploadedBy: string; uploadedAt: string; size: string }[];
  tags: string[];
}

/** HR-confidential documents (newest first) */
export function listHrDocs(): HrDocRecord[] {
  return listDocs().filter((d) => d.category === 'hr_confidential') as HrDocRecord[];
}

/** Add a document (e.g. an uploaded CV) directly into the HR-confidential section */
export function addHrDoc(input: Omit<HrDocRecord, 'id' | 'uploadedAt' | 'versions'> & { uploadedAt?: string }): HrDocRecord {
  const doc = addDoc({
    title: input.title,
    fileType: input.fileType,
    fileSize: input.fileSize,
    category: 'hr_confidential',
    uploadedBy: input.uploadedBy,
    tags: input.tags,
    uploadedAt: input.uploadedAt,
  });
  return { ...doc, category: 'hr_confidential' } as HrDocRecord;
}

/** Human-readable size label for a raw byte count */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
