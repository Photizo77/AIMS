// src/services/employeeService.ts
// ============================================================
// AIMS — Employee onboarding store (HR adds employee data here).
// Records captured through the ARDHI Employee Information Form are
// persisted and surface in the HR People Directory (status: onboarding)
// until HR activates them. CV uploads are routed separately to the
// HR-confidential Documents section (see employeeDocsService).
// ============================================================

import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';
import type { Role } from '@/types';

// ── Form record types (mirror the ARDHI Employee Information Form) ──

export interface EmployeeEducationRow { school: string; location: string; level: string; yearStart: string; yearEnd: string; grade: string; }
export interface EmployeeTertiaryRow { institution: string; qualification: string; field: string; yearStart: string; yearEnd: string; }
export interface EmployeeCertRow { course: string; awarding: string; year: string; expiry: string; }
export interface EmployeeWorkRow { employer: string; title: string; start: string; end: string; supervisor: string; reason: string; }
export interface EmployeeLanguageRow { lang: string; speak: string; read: string; write: string; proficiency: string; }
export interface EmployeeReferenceRow { name: string; titleOrg: string; relationship: string; phone: string; email: string; }

export interface EmployeeOnboarding {
  id: string;
  employeeId: string;
  /**
   * Submitted — the employee filled the form in themselves and it is sitting
   *             with the Company Admin for review (no login exists yet).
   * Onboarding — reviewed by HR/Admin; the hire is in the onboarding pipeline.
   * Active     — every onboarding step (login, role, 2FA, assets) is complete.
   */
  status: 'Submitted' | 'Onboarding' | 'Active';
  /** Who captured the form: the employee (self-service) or HR/Company Admin */
  origin?: 'employee' | 'admin';
  submittedBy?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  /** Onboarding pipeline entry (userOps store) created for this hire */
  pipelineId?: string;
  role: Role;
  position: string;
  department: string;
  submittedAt: string;
  personal: {
    surname: string; firstName: string; middleNames: string; preferredName: string;
    dob: string; placeOfBirth: string; gender: string; maritalStatus: string;
    nationality: string; religion: string; nin: string; nssf: string; tin: string;
    passport: string; languages: string; drivingPermit: string;
  };
  contact: {
    primaryPhone: string; altPhone: string; personalEmail: string; postalAddress: string;
    plot: string; street: string; village: string; subCounty: string; district: string;
    country: string; permanentAddress: string;
  };
  nextOfKin: {
    name: string; relationship: string; phone: string; emailNin: string; address: string;
    emergencyName: string; emergencyPhone: string; spouseName: string;
    spousePhoneOccupation: string; dependants: string; children: string;
  };
  education: { schools: EmployeeEducationRow[]; tertiary: EmployeeTertiaryRow[]; certs: EmployeeCertRow[]; };
  employment: { history: EmployeeWorkRow[]; responsibilities: string; };
  skills: { technical: string; soft: string; computerLiteracy: string; languages: EmployeeLanguageRow[]; };
  references: EmployeeReferenceRow[];
  banking: {
    bank: string; branch: string; accountName: string; accountNumber: string; swift: string;
    momoNumber: string; momoNetwork: string; bloodGroup: string; allergies: string;
    chronicConditions: string; disability: string; insurance: string; hospital: string;
  };
  declarations: {
    criminal: string; pendingCases: string; dismissed: string; otherEmployment: string; relatedToEmployee: string;
  };
  signature: { name: string; date: string; place: string; };
  hrUse: {
    receivedBy: string; receivedDate: string; verifiedBy: string; verifiedDate: string;
    employeeNumber: string; fileRef: string;
  };
  documentsSubmitted: string[];
  cvFile: { name: string; size: string; type: string } | null;
  /** Contract start date & type captured in the HR quick-fields bar */
  startDate?: string;
  contractType?: string;
  /** Generated AIMS login account — created by HR when the employee is saved */
  account?: {
    loginEmail: string;
    defaultPassword: string;
    createdAt: string;
    credentialsSentAt?: string;
  };
}

/** A blank form with one empty row per repeatable section */
export function emptyOnboarding(): EmployeeOnboarding {
  return {
    id: '',
    employeeId: '',
    status: 'Onboarding',
    role: 'GRANT_WRITER',
    position: '',
    department: '',
    submittedAt: '',
    personal: { surname: '', firstName: '', middleNames: '', preferredName: '', dob: '', placeOfBirth: '', gender: '', maritalStatus: '', nationality: '', religion: '', nin: '', nssf: '', tin: '', passport: '', languages: '', drivingPermit: '' },
    contact: { primaryPhone: '', altPhone: '', personalEmail: '', postalAddress: '', plot: '', street: '', village: '', subCounty: '', district: '', country: 'Uganda', permanentAddress: '' },
    nextOfKin: { name: '', relationship: '', phone: '', emailNin: '', address: '', emergencyName: '', emergencyPhone: '', spouseName: '', spousePhoneOccupation: '', dependants: '', children: '' },
    education: {
      schools: [{ school: '', location: '', level: '', yearStart: '', yearEnd: '', grade: '' }],
      tertiary: [{ institution: '', qualification: '', field: '', yearStart: '', yearEnd: '' }],
      certs: [{ course: '', awarding: '', year: '', expiry: '' }],
    },
    employment: {
      history: [{ employer: '', title: '', start: '', end: '', supervisor: '', reason: '' }],
      responsibilities: '',
    },
    skills: {
      technical: '', soft: '', computerLiteracy: 'Basic',
      languages: [{ lang: '', speak: '', read: '', write: '', proficiency: '' }],
    },
    references: [{ name: '', titleOrg: '', relationship: '', phone: '', email: '' }],
    banking: { bank: '', branch: '', accountName: '', accountNumber: '', swift: '', momoNumber: '', momoNetwork: '', bloodGroup: '', allergies: '', chronicConditions: '', disability: '', insurance: '', hospital: '' },
    declarations: { criminal: '', pendingCases: '', dismissed: '', otherEmployment: '', relatedToEmployee: '' },
    signature: { name: '', date: '', place: '' },
    hrUse: { receivedBy: '', receivedDate: '', verifiedBy: '', verifiedDate: '', employeeNumber: '', fileRef: '' },
    documentsSubmitted: [],
    cvFile: null,
  };
}

// ── Store ──

const persisted = loadJSON<EmployeeOnboarding[] | null>(STORAGE_KEYS.employees, null);
let records: EmployeeOnboarding[] = persisted && Array.isArray(persisted) ? persisted : [];

export function listOnboarding(): EmployeeOnboarding[] {
  return records;
}

export function addOnboarding(rec: EmployeeOnboarding): EmployeeOnboarding {
  records = [rec, ...records];
  saveJSON(STORAGE_KEYS.employees, records);
  return rec;
}

export function updateOnboarding(id: string, patch: Partial<EmployeeOnboarding>): void {
  records = records.map((r) => (r.id === id ? { ...r, ...patch } : r));
  saveJSON(STORAGE_KEYS.employees, records);
}

/** Activate an onboarding record so it appears as an active employee */
export function activateEmployee(id: string): void {
  updateOnboarding(id, { status: 'Active' });
}

/** Forms an employee submitted themselves — awaiting Company Admin review */
export function listPendingSubmissions(): EmployeeOnboarding[] {
  return records.filter((r) => r.status === 'Submitted');
}

/**
 * Company Admin accepts an employee-submitted form: the record moves from
 * "Submitted" into the live onboarding pipeline.
 */
export function approveSubmission(id: string, by: string): EmployeeOnboarding | undefined {
  const rec = records.find((r) => r.id === id);
  if (!rec) return undefined;
  updateOnboarding(id, { status: 'Onboarding', reviewedBy: by, reviewedAt: new Date().toISOString() });
  return records.find((r) => r.id === id);
}

/** Reject / send an employee-submitted form back (record kept for the audit trail) */
export function rejectSubmission(id: string, by: string, note: string): EmployeeOnboarding | undefined {
  const rec = records.find((r) => r.id === id);
  if (!rec) return undefined;
  updateOnboarding(id, { status: 'Submitted', reviewedBy: by, reviewedAt: new Date().toISOString(), hrUse: { ...rec.hrUse, fileRef: note || rec.hrUse.fileRef } });
  return records.find((r) => r.id === id);
}

/** Link a form record to the onboarding pipeline entry it created */
export function linkPipeline(id: string, pipelineId: string): void {
  updateOnboarding(id, { pipelineId });
}

// ── People Directory mapping ──
// New employees appear in the HR People Directory with status "onboarding".

export interface DirectoryEntry {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  position: string;
  status: string;
  createdAt: string;
}

export function getDirectoryEntries(): DirectoryEntry[] {
  return records.map((r) => ({
    id: r.id,
    name: [r.personal.firstName, r.personal.surname].filter(Boolean).join(' ') || r.personal.preferredName || r.employeeId || 'New Hire',
    email: r.contact.personalEmail || (r.employeeId ? `${r.employeeId}@ardhi.org.ug` : ''),
    role: r.role,
    department: r.department || 'Unassigned',
    position: r.position || 'New Hire',
    status: r.status.toLowerCase(),
    createdAt: r.submittedAt ? r.submittedAt.slice(0, 10) : '',
  }));
}
