// src/lib/formSubmissions.ts
// ============================================================
// AIMS — Form submission store + routing/notification mapping.
// Every completed library form is persisted (aims_form_submissions),
// routed to the module queue it feeds, and the owning team is
// notified. Backend swap point stays in src/lib/storage.ts.
// ============================================================

import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';

export interface FormSubmission {
  id: string;
  code: string;
  title: string;
  module: string;
  submittedBy: string;
  submittedAt: string;
  status: 'submitted';
  data: Record<string, string>;
}

export interface QueueTarget {
  route: string;
  label: string;
  /** Notification recipients — name-based (roster) or explicit user ids */
  recipients: { name?: string; userId?: string }[];
}

/** Where each module's submitted forms are reviewed (queue page) */
export const FORM_QUEUE: Record<string, QueueTarget> = {
  hr: { route: '/hr', label: 'HR queue', recipients: [{ name: 'Grace Aceng' }] },
  attendance: { route: '/hr', label: 'HR queue', recipients: [{ name: 'Grace Aceng' }] },
  finance: { route: '/approvals', label: 'Approvals queue', recipients: [{ userId: 'user-ed-001' }] },
  procurement: { route: '/approvals', label: 'Approvals queue', recipients: [{ userId: 'user-ed-001' }] },
  grants: { route: '/grants', label: 'Grants workspace', recipients: [{ userId: 'user-gm-001' }, { userId: 'user-gw-001' }] },
  innovations: { route: '/innovations', label: 'Innovations workspace', recipients: [{ userId: 'user-innov-001' }] },
  inventory: { route: '/inventory', label: 'Inventory module', recipients: [{ name: 'Grace Aceng' }] },
  rbac: { route: '/rbac', label: 'Compliance queue', recipients: [{ userId: 'user-sysadmin-001' }] },
};

export function queueForModule(moduleName: string): QueueTarget | undefined {
  return FORM_QUEUE[moduleName];
}

const persisted = loadJSON<FormSubmission[] | null>(STORAGE_KEYS.formSubmissions, null);
let submissions: FormSubmission[] = persisted && Array.isArray(persisted) ? persisted : [];

let counter = 0;
function nextId(): string {
  counter += 1;
  return `fs-${Date.now()}-${counter}`;
}

export function saveFormSubmission(input: Omit<FormSubmission, 'id' | 'status'>): FormSubmission {
  const submission: FormSubmission = { ...input, id: nextId(), status: 'submitted' };
  submissions = [submission, ...submissions];
  saveJSON(STORAGE_KEYS.formSubmissions, submissions);
  return submission;
}

export function getFormSubmissions(): FormSubmission[] {
  return submissions;
}

export function submissionsForModule(moduleName: string): FormSubmission[] {
  return submissions.filter((s) => s.module === moduleName);
}
