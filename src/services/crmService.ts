// src/services/crmService.ts
// ============================================================
// AIMS — CRM store (persisted).
// Contact Relationship Manager contacts (donors, partners,
// government, vendors) with add/update/remove operations. All
// mutations persist through the unified storage layer so the CRM
// screen auto-updates and data survives reloads.
// ============================================================

import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';
import type { CRMContact } from '@/types';

const SEED: CRMContact[] = [
  { id: 'c1', name: 'Dr. James Mukasa', organization: 'USAID Uganda', email: 'jmukasa@usaid.gov', phone: '+256 772 123 456', type: 'donor', lastContact: '2026-08-01', notes: 'Interested in climate resilience proposals' },
  { id: 'c2', name: 'Ms. Florence Nakamya', organization: 'EU Delegation', email: 'f.nakamya@eu.eu', phone: '+256 701 234 567', type: 'donor', lastContact: '2026-07-28', notes: 'Follow up on waste management grant' },
  { id: 'c3', name: 'Mr. David Okot', organization: 'Ministry of Agriculture', email: 'dokot@mag.go.ug', phone: '+256 752 345 678', type: 'government', lastContact: '2026-07-20', notes: 'MOU renewal pending' },
  { id: 'c4', name: 'Ms. Rose Atim', organization: 'Gulu University', email: 'ratim@gu.ac.ug', phone: '+256 771 456 789', type: 'partner', lastContact: '2026-08-03', notes: 'Research collaboration on soil health' },
  { id: 'c5', name: 'Mr. Charles Opio', organization: 'TechSupply Ltd', email: 'copio@techsupply.ug', phone: '+256 703 567 890', type: 'vendor', lastContact: '2026-07-15', notes: 'Solar equipment supplier, reliable' },
];

const persisted = loadJSON<CRMContact[] | null>(STORAGE_KEYS.crm, null);
let contacts: CRMContact[] = (persisted && persisted.length > 0 ? persisted : SEED).map((c) => ({ ...c }));

function persist(): void { saveJSON(STORAGE_KEYS.crm, contacts); }
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export function crmGet(): CRMContact[] { return clone(contacts); }

export interface NewContactInput {
  name: string; organization: string; email: string; phone: string;
  type: CRMContact['type']; lastContact: string; notes: string;
}

export function addContact(input: NewContactInput): CRMContact {
  const contact: CRMContact = { id: `c-${Date.now()}`, ...input };
  contacts = [contact, ...contacts];
  persist();
  return clone(contact);
}

export function updateContact(id: string, patch: Partial<CRMContact>): CRMContact | undefined {
  const cur = contacts.find((c) => c.id === id);
  if (!cur) return undefined;
  contacts = contacts.map((c) => (c.id === id ? { ...c, ...patch } : c));
  persist();
  return clone(contacts.find((c) => c.id === id) as CRMContact);
}

export function removeContact(id: string): boolean {
  const before = contacts.length;
  contacts = contacts.filter((c) => c.id !== id);
  persist();
  return contacts.length < before;
}
