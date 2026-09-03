// src/components/hr/EmployeeOnboardingForm.tsx
// ============================================================
// AIMS — ARDHI Employee Information Form (client onboarding).
// Customised from the standard institutional employee information
// form for ARDHI. Captures the full record (biodata, contact, next
// of kin, education, employment, skills, references, banking/payroll,
// declarations, HR-use fields and the documents checklist) and adds
// the employee to the HR People Directory as "onboarding".
//
// CV upload (optional) is filed DIRECTLY into the Documents hub under
// "HR Confidential — Employee Files", which is accessible only to the
// Executive Director and HR (COMPANY_ADMIN).
// ============================================================

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { ROLE_LABELS } from '@/config/roles';
import type { Role } from '@/types';
import {
  emptyOnboarding, addOnboarding, listOnboarding,
  type EmployeeOnboarding,
  type EmployeeEducationRow, type EmployeeTertiaryRow, type EmployeeCertRow,
  type EmployeeWorkRow, type EmployeeLanguageRow, type EmployeeReferenceRow,
} from '@/services/employeeService';
import { addHrDoc, formatBytes } from '@/services/employeeDocsService';

/** Programmatically open the employee onboarding form (used across HR surfaces) */
export function openEmployeeOnboarding(): void {
  window.dispatchEvent(new CustomEvent('aims:employee-onboarding'));
}

const DOCS_CHECKLIST = [
  'Copy of National ID / Passport',
  'Copy of NSSF Card',
  'Copy of TIN Certificate',
  'Academic Certificates & Transcripts',
  'Professional Certifications',
  'Curriculum Vitae (CV)',
  'Passport-size Photographs (2)',
  'Reference / Recommendation Letters',
  'Birth Certificate',
  'Bank / Mobile Money Details',
  'Medical / Fitness Certificate',
  'Police Clearance / Good Conduct',
];

const GENDERS = ['Male', 'Female', 'Other'];
const MARITAL = ['Single', 'Married', 'Divorced', 'Widowed', 'Other'];
const LITERACY = ['Basic', 'Intermediate', 'Advanced'];
const PROFICIENCY = ['Basic', 'Fluent', 'Native'];

function F({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
    </label>
  );
}

function SEL({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30">
        <option value="">—</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function TA({ label, value, onChange, placeholder, rows = 2 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30 resize-y" />
    </label>
  );
}

function SectionBlock({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-aims-navy px-4 py-2.5 flex items-center gap-2">
        <span className="text-[10px] font-extrabold text-white bg-white/20 px-2 py-0.5 rounded shrink-0">{n}</span>
        <p className="text-xs font-bold text-white uppercase tracking-wider">{title}</p>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

const CELL = 'w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-aims-navy/40';

export function EmployeeOnboardingModal() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const blank = emptyOnboarding();
  const [personal, setPersonalState] = useState(blank.personal);
  const [contact, setContactState] = useState(blank.contact);
  const [nextOfKin, setNextOfKinState] = useState(blank.nextOfKin);
  const [schools, setSchoolsState] = useState<EmployeeEducationRow[]>(blank.education.schools);
  const [tertiaryRows, setTertiaryState] = useState<EmployeeTertiaryRow[]>(blank.education.tertiary);
  const [certs, setCertsState] = useState<EmployeeCertRow[]>(blank.education.certs);
  const [workHistory, setWorkHistoryState] = useState<EmployeeWorkRow[]>(blank.employment.history);
  const [responsibilities, setResponsibilitiesState] = useState(blank.employment.responsibilities);
  const [skills, setSkillsState] = useState(blank.skills);
  const [langRows, setLangRowsState] = useState<EmployeeLanguageRow[]>(blank.skills.languages);
  const [references, setReferencesState] = useState<EmployeeReferenceRow[]>(blank.references);
  const [banking, setBankingState] = useState(blank.banking);
  const [declarations, setDeclarationsState] = useState(blank.declarations);
  const [signature, setSignatureState] = useState(blank.signature);
  const [hrUse, setHrUseState] = useState(blank.hrUse);
  const [top, setTop] = useState<{ employeeId: string; position: string; department: string; role: Role }>({ employeeId: '', position: '', department: '', role: 'GRANT_WRITER' });
  const [docsSubmitted, setDocsSubmitted] = useState<Set<string>>(new Set());
  const [cv, setCv] = useState<{ name: string; size: string; type: string } | null>(null);

  useEffect(() => {
    const handler = () => {
      const fresh = emptyOnboarding();
      setPersonalState(fresh.personal);
      setContactState(fresh.contact);
      setNextOfKinState(fresh.nextOfKin);
      setSchoolsState(fresh.education.schools);
      setTertiaryState(fresh.education.tertiary);
      setCertsState(fresh.education.certs);
      setWorkHistoryState(fresh.employment.history);
      setResponsibilitiesState(fresh.employment.responsibilities);
      setSkillsState(fresh.skills);
      setLangRowsState(fresh.skills.languages);
      setReferencesState(fresh.references);
      setBankingState(fresh.banking);
      setDeclarationsState(fresh.declarations);
      setSignatureState(fresh.signature);
      setHrUseState(fresh.hrUse);
      setTop({ employeeId: '', position: '', department: '', role: 'GRANT_WRITER' });
      setDocsSubmitted(new Set());
      setCv(null);
      setOpen(true);
    };
    window.addEventListener('aims:employee-onboarding', handler);
    return () => window.removeEventListener('aims:employee-onboarding', handler);
  }, []);

  // Generic row helpers for repeatable sections
  const updateRow = <T,>(rows: T[], setRows: (r: T[]) => void, index: number, patch: Partial<T>) =>
    setRows(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const addRow = <T,>(rows: T[], setRows: (r: T[]) => void, blankRow: T) => setRows([...rows, blankRow]);
  const removeRow = <T,>(rows: T[], setRows: (r: T[]) => void, index: number) => setRows(rows.filter((_, i) => i !== index));

  const toggleDoc = (label: string) => {
    setDocsSubmitted((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  };

  const handleCv = (file: File | undefined) => {
    if (!file) return;
    const ext = ('.' + (file.name.split('.').pop()?.toLowerCase() ?? ''));
    if (!['.pdf', '.docx', '.png', '.jpg', '.jpeg'].includes(ext)) {
      showToast({ title: 'Invalid CV File', message: 'CV must be PDF, DOCX, PNG or JPG.', type: 'error' });
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      showToast({ title: 'File Too Large', message: 'CV must be 25MB or smaller.', type: 'error' });
      return;
    }
    setCv({ name: file.name, size: formatBytes(file.size), type: file.type });
  };

  const submit = () => {
    const fullName = [personal.firstName, personal.surname].filter(Boolean).join(' ').trim();
    if (!fullName) {
      showToast({ title: 'Missing Details', message: 'Provide at least the first name and surname (Section 1 — Personal Information).', type: 'error' });
      return;
    }
    const now = new Date().toISOString();
    const seq = String(listOnboarding().length + 1).padStart(3, '0');
    const rec: EmployeeOnboarding = {
      id: `emp-${Date.now()}`,
      employeeId: top.employeeId.trim() || `ARD-${new Date().getFullYear()}-${seq}`,
      status: 'Onboarding',
      role: top.role,
      position: top.position.trim() || 'New Hire',
      department: top.department.trim() || 'Unassigned',
      submittedAt: now,
      personal,
      contact,
      nextOfKin,
      education: { schools, tertiary: tertiaryRows, certs },
      employment: { history: workHistory, responsibilities },
      skills: { ...skills, languages: langRows },
      references,
      banking,
      declarations,
      signature,
      hrUse,
      documentsSubmitted: Array.from(docsSubmitted),
      cvFile: cv,
    };
    addOnboarding(rec);

    // CV goes straight into HR-confidential documents (ED + HR only)
    if (cv) {
      addHrDoc({
        title: `CV — ${fullName}.${cv.name.split('.').pop() ?? 'pdf'}`,
        fileType: (cv.name.split('.').pop() ?? 'pdf').toUpperCase(),
        fileSize: cv.size,
        category: 'hr_confidential',
        uploadedBy: user?.name ?? 'HR',
        tags: ['cv', 'confidential', rec.employeeId],
      });
    }

    showToast({
      title: 'Employee Added',
      message: `${fullName} (${rec.employeeId}) added to the People Directory as onboarding.${cv ? ' CV filed under HR Confidential documents.' : ''}`,
      type: 'success',
    });
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-grad-navy px-6 py-4 text-white shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-aims-mint flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">lock</span>Confidential — For HR Use Only
              </p>
              <h2 className="text-lg font-extrabold text-white mt-0.5">ARDHI Employee Information Form</h2>
              <p className="text-xs text-white/85">Client onboarding — complete every section accurately. Write "N/A" where a field does not apply.</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white shrink-0"><span className="material-symbols-outlined">close</span></button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Quick fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <F label="Date of Submission" value={new Date().toISOString().slice(0, 10)} onChange={() => undefined} />
            <F label="Employee ID (HR)" value={top.employeeId} onChange={(v) => setTop((t) => ({ ...t, employeeId: v }))} placeholder="ARD-2026-001 (auto if blank)" />
            <F label="Position" value={top.position} onChange={(v) => setTop((t) => ({ ...t, position: v }))} placeholder="e.g. Grants Officer" />
            <F label="Department" value={top.department} onChange={(v) => setTop((t) => ({ ...t, department: v }))} placeholder="e.g. Grants" />
          </div>
          <div className="max-w-xs">
            <SEL label="System Role" value={top.role} onChange={(v) => setTop((t) => ({ ...t, role: v as Role }))} options={Object.keys(ROLE_LABELS)} />
          </div>

          {/* SECTION 1 — PERSONAL */}
          <SectionBlock n="1" title="Personal Information (Biodata)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <F label="Surname (Family Name)" value={personal.surname} onChange={(v) => setPersonalState((s) => ({ ...s, surname: v }))} />
              <F label="First Name" value={personal.firstName} onChange={(v) => setPersonalState((s) => ({ ...s, firstName: v }))} />
              <F label="Middle Name(s)" value={personal.middleNames} onChange={(v) => setPersonalState((s) => ({ ...s, middleNames: v }))} />
              <F label="Preferred Name" value={personal.preferredName} onChange={(v) => setPersonalState((s) => ({ ...s, preferredName: v }))} />
              <F label="Date of Birth (DD/MM/YYYY)" value={personal.dob} onChange={(v) => setPersonalState((s) => ({ ...s, dob: v }))} />
              <F label="Place of Birth" value={personal.placeOfBirth} onChange={(v) => setPersonalState((s) => ({ ...s, placeOfBirth: v }))} />
              <SEL label="Gender" value={personal.gender} onChange={(v) => setPersonalState((s) => ({ ...s, gender: v }))} options={GENDERS} />
              <SEL label="Marital Status" value={personal.maritalStatus} onChange={(v) => setPersonalState((s) => ({ ...s, maritalStatus: v }))} options={MARITAL} />
              <F label="Nationality" value={personal.nationality} onChange={(v) => setPersonalState((s) => ({ ...s, nationality: v }))} />
              <F label="Religion (Optional)" value={personal.religion} onChange={(v) => setPersonalState((s) => ({ ...s, religion: v }))} />
              <F label="National ID (NIN)" value={personal.nin} onChange={(v) => setPersonalState((s) => ({ ...s, nin: v }))} />
              <F label="NSSF Number" value={personal.nssf} onChange={(v) => setPersonalState((s) => ({ ...s, nssf: v }))} />
              <F label="TIN Number" value={personal.tin} onChange={(v) => setPersonalState((s) => ({ ...s, tin: v }))} />
              <F label="Passport Number" value={personal.passport} onChange={(v) => setPersonalState((s) => ({ ...s, passport: v }))} />
              <F label="Languages Spoken" value={personal.languages} onChange={(v) => setPersonalState((s) => ({ ...s, languages: v }))} />
              <F label="Driving Permit (No. & Class)" value={personal.drivingPermit} onChange={(v) => setPersonalState((s) => ({ ...s, drivingPermit: v }))} />
            </div>
          </SectionBlock>

          {/* SECTION 2 — CONTACT */}
          <SectionBlock n="2" title="Contact Details & Address">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <F label="Primary Phone" value={contact.primaryPhone} onChange={(v) => setContactState((s) => ({ ...s, primaryPhone: v }))} />
              <F label="Alternative Phone" value={contact.altPhone} onChange={(v) => setContactState((s) => ({ ...s, altPhone: v }))} />
              <F label="Personal Email" value={contact.personalEmail} onChange={(v) => setContactState((s) => ({ ...s, personalEmail: v }))} />
              <F label="Postal Address" value={contact.postalAddress} onChange={(v) => setContactState((s) => ({ ...s, postalAddress: v }))} />
              <F label="Plot / House No." value={contact.plot} onChange={(v) => setContactState((s) => ({ ...s, plot: v }))} />
              <F label="Street / Road" value={contact.street} onChange={(v) => setContactState((s) => ({ ...s, street: v }))} />
              <F label="Village / Parish" value={contact.village} onChange={(v) => setContactState((s) => ({ ...s, village: v }))} />
              <F label="Sub-county / Division" value={contact.subCounty} onChange={(v) => setContactState((s) => ({ ...s, subCounty: v }))} />
              <F label="District / City" value={contact.district} onChange={(v) => setContactState((s) => ({ ...s, district: v }))} />
              <F label="Country" value={contact.country} onChange={(v) => setContactState((s) => ({ ...s, country: v }))} />
            </div>
            <TA label="Permanent Home Address (if different)" value={contact.permanentAddress} onChange={(v) => setContactState((s) => ({ ...s, permanentAddress: v }))} />
          </SectionBlock>

          {/* SECTION 3 — NEXT OF KIN */}
          <SectionBlock n="3" title="Next of Kin & Emergency Contact">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <F label="Next of Kin — Full Name" value={nextOfKin.name} onChange={(v) => setNextOfKinState((s) => ({ ...s, name: v }))} />
              <F label="Relationship" value={nextOfKin.relationship} onChange={(v) => setNextOfKinState((s) => ({ ...s, relationship: v }))} />
              <F label="Phone Number" value={nextOfKin.phone} onChange={(v) => setNextOfKinState((s) => ({ ...s, phone: v }))} />
              <F label="Email / National ID" value={nextOfKin.emailNin} onChange={(v) => setNextOfKinState((s) => ({ ...s, emailNin: v }))} />
              <F label="Residential Address" value={nextOfKin.address} onChange={(v) => setNextOfKinState((s) => ({ ...s, address: v }))} />
              <F label="Emergency Contact — Name" value={nextOfKin.emergencyName} onChange={(v) => setNextOfKinState((s) => ({ ...s, emergencyName: v }))} />
              <F label="Emergency Contact — Phone & Relationship" value={nextOfKin.emergencyPhone} onChange={(v) => setNextOfKinState((s) => ({ ...s, emergencyPhone: v }))} />
              <F label="Spouse's Name" value={nextOfKin.spouseName} onChange={(v) => setNextOfKinState((s) => ({ ...s, spouseName: v }))} />
              <F label="Spouse's Phone & Occupation" value={nextOfKin.spousePhoneOccupation} onChange={(v) => setNextOfKinState((s) => ({ ...s, spousePhoneOccupation: v }))} />
              <F label="Number of Dependants" value={nextOfKin.dependants} onChange={(v) => setNextOfKinState((s) => ({ ...s, dependants: v }))} />
              <F label="Number of Children" value={nextOfKin.children} onChange={(v) => setNextOfKinState((s) => ({ ...s, children: v }))} />
            </div>
          </SectionBlock>

          {/* SECTION 4 — EDUCATION */}
          <SectionBlock n="4" title="Education Background">
            <p className="text-[11px] text-slate-500 italic">Begin with the most recent. Attach certified copies of certificates and transcripts.</p>
            <p className="text-xs font-bold text-slate-700">Primary & Secondary Education</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-slate-200 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-1 pr-1">School Name</th><th className="py-1 pr-1">Location</th><th className="py-1 pr-1">Level (Primary/O/A)</th><th className="py-1 pr-1">Year Started</th><th className="py-1 pr-1">Year Completed</th><th className="py-1">Grade / Award</th><th className="py-1 w-8"></th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {schools.map((row, i) => (
                    <tr key={i}>
                      <td className="py-1 pr-1"><input className={CELL} value={row.school} onChange={(e) => updateRow(schools, setSchoolsState, i, { school: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.location} onChange={(e) => updateRow(schools, setSchoolsState, i, { location: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.level} onChange={(e) => updateRow(schools, setSchoolsState, i, { level: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.yearStart} onChange={(e) => updateRow(schools, setSchoolsState, i, { yearStart: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.yearEnd} onChange={(e) => updateRow(schools, setSchoolsState, i, { yearEnd: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.grade} onChange={(e) => updateRow(schools, setSchoolsState, i, { grade: e.target.value })} /></td>
                      <td className="py-1 text-right"><button onClick={() => removeRow(schools, setSchoolsState, i)} className="text-red-400 hover:text-red-600"><span className="material-symbols-outlined text-[16px]">remove_circle</span></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => addRow(schools, setSchoolsState, { school: '', location: '', level: '', yearStart: '', yearEnd: '', grade: '' })} className="text-[11px] font-bold text-aims-navy hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">add_circle</span>Add school</button>

            <p className="text-xs font-bold text-slate-700 mt-2">Tertiary / University Education</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-slate-200 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-1 pr-1">Institution</th><th className="py-1 pr-1">Qualification / Award</th><th className="py-1 pr-1">Field of Study</th><th className="py-1 pr-1">Year Started</th><th className="py-1">Year Completed</th><th className="py-1 w-8"></th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {tertiaryRows.map((row, i) => (
                    <tr key={i}>
                      <td className="py-1 pr-1"><input className={CELL} value={row.institution} onChange={(e) => updateRow(tertiaryRows, setTertiaryState, i, { institution: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.qualification} onChange={(e) => updateRow(tertiaryRows, setTertiaryState, i, { qualification: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.field} onChange={(e) => updateRow(tertiaryRows, setTertiaryState, i, { field: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.yearStart} onChange={(e) => updateRow(tertiaryRows, setTertiaryState, i, { yearStart: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.yearEnd} onChange={(e) => updateRow(tertiaryRows, setTertiaryState, i, { yearEnd: e.target.value })} /></td>
                      <td className="py-1 text-right"><button onClick={() => removeRow(tertiaryRows, setTertiaryState, i)} className="text-red-400 hover:text-red-600"><span className="material-symbols-outlined text-[16px]">remove_circle</span></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => addRow(tertiaryRows, setTertiaryState, { institution: '', qualification: '', field: '', yearStart: '', yearEnd: '' })} className="text-[11px] font-bold text-aims-navy hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">add_circle</span>Add institution</button>

            <p className="text-xs font-bold text-slate-700 mt-2">Professional Certifications & Short Courses</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-slate-200 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-1 pr-1">Certification / Course</th><th className="py-1 pr-1">Awarding Body</th><th className="py-1 pr-1">Year Obtained</th><th className="py-1">Expiry / Renewal</th><th className="py-1 w-8"></th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {certs.map((row, i) => (
                    <tr key={i}>
                      <td className="py-1 pr-1"><input className={CELL} value={row.course} onChange={(e) => updateRow(certs, setCertsState, i, { course: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.awarding} onChange={(e) => updateRow(certs, setCertsState, i, { awarding: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.year} onChange={(e) => updateRow(certs, setCertsState, i, { year: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.expiry} onChange={(e) => updateRow(certs, setCertsState, i, { expiry: e.target.value })} /></td>
                      <td className="py-1 text-right"><button onClick={() => removeRow(certs, setCertsState, i)} className="text-red-400 hover:text-red-600"><span className="material-symbols-outlined text-[16px]">remove_circle</span></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => addRow(certs, setCertsState, { course: '', awarding: '', year: '', expiry: '' })} className="text-[11px] font-bold text-aims-navy hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">add_circle</span>Add certification</button>
          </SectionBlock>

          {/* SECTION 5 — EMPLOYMENT */}
          <SectionBlock n="5" title="Employment History & Experience">
            <p className="text-[11px] text-slate-500 italic">List the most recent first. Include internships and part-time roles.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-slate-200 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-1 pr-1">Employer / Organisation</th><th className="py-1 pr-1">Job Title</th><th className="py-1 pr-1">Start (MM/YY)</th><th className="py-1 pr-1">End (MM/YY)</th><th className="py-1 pr-1">Supervisor & Contact</th><th className="py-1">Reason for Leaving</th><th className="py-1 w-8"></th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {workHistory.map((row, i) => (
                    <tr key={i}>
                      <td className="py-1 pr-1"><input className={CELL} value={row.employer} onChange={(e) => updateRow(workHistory, setWorkHistoryState, i, { employer: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.title} onChange={(e) => updateRow(workHistory, setWorkHistoryState, i, { title: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.start} onChange={(e) => updateRow(workHistory, setWorkHistoryState, i, { start: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.end} onChange={(e) => updateRow(workHistory, setWorkHistoryState, i, { end: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.supervisor} onChange={(e) => updateRow(workHistory, setWorkHistoryState, i, { supervisor: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.reason} onChange={(e) => updateRow(workHistory, setWorkHistoryState, i, { reason: e.target.value })} /></td>
                      <td className="py-1 text-right"><button onClick={() => removeRow(workHistory, setWorkHistoryState, i)} className="text-red-400 hover:text-red-600"><span className="material-symbols-outlined text-[16px]">remove_circle</span></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => addRow(workHistory, setWorkHistoryState, { employer: '', title: '', start: '', end: '', supervisor: '', reason: '' })} className="text-[11px] font-bold text-aims-navy hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">add_circle</span>Add role</button>
            <TA label="Key Responsibilities & Achievements (most recent role)" value={responsibilities} onChange={setResponsibilitiesState} rows={3} />
          </SectionBlock>

          {/* SECTION 6 — SKILLS */}
          <SectionBlock n="6" title="Skills, Competencies & Languages">
            <TA label="Technical Skills" value={skills.technical} onChange={(v) => setSkillsState((s) => ({ ...s, technical: v }))} rows={2} />
            <TA label="Soft Skills" value={skills.soft} onChange={(v) => setSkillsState((s) => ({ ...s, soft: v }))} rows={2} />
            <div className="max-w-xs">
              <SEL label="Computer Literacy" value={skills.computerLiteracy} onChange={(v) => setSkillsState((s) => ({ ...s, computerLiteracy: v }))} options={LITERACY} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-slate-200 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-1 pr-1">Language</th><th className="py-1 pr-1">Speak (B/F/N)</th><th className="py-1 pr-1">Read (B/F/N)</th><th className="py-1 pr-1">Write (B/F/N)</th><th className="py-1">Overall Proficiency</th><th className="py-1 w-8"></th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {langRows.map((row, i) => (
                    <tr key={i}>
                      <td className="py-1 pr-1"><input className={CELL} value={row.lang} onChange={(e) => updateRow(langRows, setLangRowsState, i, { lang: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.speak} onChange={(e) => updateRow(langRows, setLangRowsState, i, { speak: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.read} onChange={(e) => updateRow(langRows, setLangRowsState, i, { read: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.write} onChange={(e) => updateRow(langRows, setLangRowsState, i, { write: e.target.value })} /></td>
                      <td className="py-1 pr-1">
                        <select className={CELL} value={row.proficiency} onChange={(e) => updateRow(langRows, setLangRowsState, i, { proficiency: e.target.value })}>
                          <option value="">—</option>{PROFICIENCY.map((o) => <option key={o}>{o}</option>)}
                        </select>
                      </td>
                      <td className="py-1 text-right"><button onClick={() => removeRow(langRows, setLangRowsState, i)} className="text-red-400 hover:text-red-600"><span className="material-symbols-outlined text-[16px]">remove_circle</span></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => addRow(langRows, setLangRowsState, { lang: '', speak: '', read: '', write: '', proficiency: '' })} className="text-[11px] font-bold text-aims-navy hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">add_circle</span>Add language</button>
          </SectionBlock>

          {/* SECTION 7 — REFERENCES */}
          <SectionBlock n="7" title="Professional References">
            <p className="text-[11px] text-slate-500 italic">Provide three references who are not relatives. At least one must be a previous direct supervisor.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-slate-200 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-1 pr-1">Full Name</th><th className="py-1 pr-1">Job Title & Organisation</th><th className="py-1 pr-1">Relationship</th><th className="py-1 pr-1">Phone</th><th className="py-1">Email</th><th className="py-1 w-8"></th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {references.map((row, i) => (
                    <tr key={i}>
                      <td className="py-1 pr-1"><input className={CELL} value={row.name} onChange={(e) => updateRow(references, setReferencesState, i, { name: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.titleOrg} onChange={(e) => updateRow(references, setReferencesState, i, { titleOrg: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.relationship} onChange={(e) => updateRow(references, setReferencesState, i, { relationship: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.phone} onChange={(e) => updateRow(references, setReferencesState, i, { phone: e.target.value })} /></td>
                      <td className="py-1 pr-1"><input className={CELL} value={row.email} onChange={(e) => updateRow(references, setReferencesState, i, { email: e.target.value })} /></td>
                      <td className="py-1 text-right"><button onClick={() => removeRow(references, setReferencesState, i)} className="text-red-400 hover:text-red-600"><span className="material-symbols-outlined text-[16px]">remove_circle</span></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => addRow(references, setReferencesState, { name: '', titleOrg: '', relationship: '', phone: '', email: '' })} className="text-[11px] font-bold text-aims-navy hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">add_circle</span>Add reference</button>
          </SectionBlock>

          {/* SECTION 8 — BANKING / PAYROLL / MEDICAL */}
          <SectionBlock n="8" title="Banking, Payroll & Medical Information">
            <p className="text-[11px] text-slate-500 italic">Medical information is confidential and used only for emergencies or workplace accommodations.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <F label="Bank Name & Branch" value={banking.bank} onChange={(v) => setBankingState((s) => ({ ...s, bank: v }))} />
              <F label="Account Name" value={banking.accountName} onChange={(v) => setBankingState((s) => ({ ...s, accountName: v }))} />
              <F label="Account Number" value={banking.accountNumber} onChange={(v) => setBankingState((s) => ({ ...s, accountNumber: v }))} />
              <F label="SWIFT Code" value={banking.swift} onChange={(v) => setBankingState((s) => ({ ...s, swift: v }))} />
              <F label="Mobile Money Number" value={banking.momoNumber} onChange={(v) => setBankingState((s) => ({ ...s, momoNumber: v }))} />
              <F label="Mobile Money Network & Name" value={banking.momoNetwork} onChange={(v) => setBankingState((s) => ({ ...s, momoNetwork: v }))} />
              <F label="Blood Group" value={banking.bloodGroup} onChange={(v) => setBankingState((s) => ({ ...s, bloodGroup: v }))} />
              <F label="Allergies" value={banking.allergies} onChange={(v) => setBankingState((s) => ({ ...s, allergies: v }))} />
              <F label="Chronic Conditions / Medications" value={banking.chronicConditions} onChange={(v) => setBankingState((s) => ({ ...s, chronicConditions: v }))} />
              <F label="Disability / Special Needs" value={banking.disability} onChange={(v) => setBankingState((s) => ({ ...s, disability: v }))} />
              <F label="Health Insurance (Provider & Policy No.)" value={banking.insurance} onChange={(v) => setBankingState((s) => ({ ...s, insurance: v }))} />
              <F label="Preferred Hospital / Personal Doctor" value={banking.hospital} onChange={(v) => setBankingState((s) => ({ ...s, hospital: v }))} />
            </div>
          </SectionBlock>

          {/* SECTION 9 — DECLARATIONS */}
          <SectionBlock n="9" title="Background Declarations">
            <p className="text-[11px] text-slate-500 italic">Failure to disclose may result in termination. A "yes" answer does not automatically disqualify the applicant.</p>
            <TA label="Ever convicted of a criminal offence? (details if yes)" value={declarations.criminal} onChange={(v) => setDeclarationsState((s) => ({ ...s, criminal: v }))} rows={1} />
            <TA label="Any pending criminal or civil cases? (details if yes)" value={declarations.pendingCases} onChange={(v) => setDeclarationsState((s) => ({ ...s, pendingCases: v }))} rows={1} />
            <TA label="Dismissed or asked to resign from any role? (details if yes)" value={declarations.dismissed} onChange={(v) => setDeclarationsState((s) => ({ ...s, dismissed: v }))} rows={1} />
            <TA label="Other employment / business interests? (details if yes)" value={declarations.otherEmployment} onChange={(v) => setDeclarationsState((s) => ({ ...s, otherEmployment: v }))} rows={1} />
            <TA label="Related to any current ARDHI employee? (name & relationship if yes)" value={declarations.relatedToEmployee} onChange={(v) => setDeclarationsState((s) => ({ ...s, relatedToEmployee: v }))} rows={1} />
          </SectionBlock>

          {/* SECTION 10 — DECLARATION & SIGNATURE */}
          <SectionBlock n="10" title="Declaration & Signature">
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-xs text-slate-700 leading-relaxed">
              I declare that the information provided in this form is true, complete and accurate to the best of my knowledge. I understand that any false statement or omission may result in rejection of my application or termination of employment without notice. I authorise ARDHI to verify any information provided, and consent to the processing of my personal data for employment-related purposes in accordance with the Data Protection and Privacy Act, 2019.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <F label="Employee Full Name" value={signature.name} onChange={(v) => setSignatureState((s) => ({ ...s, name: v }))} />
              <F label="Date" type="date" value={signature.date} onChange={(v) => setSignatureState((s) => ({ ...s, date: v }))} />
              <F label="Place" value={signature.place} onChange={(v) => setSignatureState((s) => ({ ...s, place: v }))} />
            </div>
          </SectionBlock>

          {/* HR USE ONLY */}
          <SectionBlock n="HR" title="For HR Use Only">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <F label="Received By" value={hrUse.receivedBy} onChange={(v) => setHrUseState((s) => ({ ...s, receivedBy: v }))} />
              <F label="Received Date" type="date" value={hrUse.receivedDate} onChange={(v) => setHrUseState((s) => ({ ...s, receivedDate: v }))} />
              <F label="Verified By" value={hrUse.verifiedBy} onChange={(v) => setHrUseState((s) => ({ ...s, verifiedBy: v }))} />
              <F label="Verified Date" type="date" value={hrUse.verifiedDate} onChange={(v) => setHrUseState((s) => ({ ...s, verifiedDate: v }))} />
              <F label="Employee Number" value={hrUse.employeeNumber} onChange={(v) => setHrUseState((s) => ({ ...s, employeeNumber: v }))} />
              <F label="File Reference No." value={hrUse.fileRef} onChange={(v) => setHrUseState((s) => ({ ...s, fileRef: v }))} />
            </div>
          </SectionBlock>

          {/* DOCUMENTS CHECKLIST */}
          <SectionBlock n="✓" title="Documents Submitted (tick as applicable)">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {DOCS_CHECKLIST.map((doc) => {
                const checked = docsSubmitted.has(doc);
                return (
                  <button key={doc} onClick={() => toggleDoc(doc)} className={cn('flex items-start gap-2 p-2.5 rounded-lg border text-left text-xs transition-colors', checked ? 'bg-aims-green/10 border-aims-green/40 text-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')}>
                    <span className={cn('material-symbols-outlined text-[16px] mt-0.5', checked ? 'text-aims-green' : 'text-slate-300')}>{checked ? 'check_box' : 'check_box_outline_blank'}</span>
                    <span className="font-medium">{doc}</span>
                  </button>
                );
              })}
            </div>
          </SectionBlock>

          {/* CV UPLOAD */}
          <SectionBlock n="CV" title="Curriculum Vitae Upload (Optional)">
            <p className="text-[11px] text-slate-500 italic">Uploaded CVs are filed directly under <b>HR Confidential — Employee Files</b> in the Documents hub, accessible only to the Executive Director and HR.</p>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">upload_file</span>{cv ? 'Replace CV' : 'Upload CV'}
              </button>
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.png,.jpg,.jpeg" className="hidden" onChange={(e) => handleCv(e.target.files?.[0])} />
              {cv && (
                <div className="flex items-center gap-2 px-3 py-2 bg-aims-green/10 border border-aims-green/30 rounded-lg">
                  <span className="material-symbols-outlined text-aims-green text-[18px]">description</span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{cv.name}</p>
                    <p className="text-[10px] text-slate-500">{cv.size} · will be filed under HR Confidential documents</p>
                  </div>
                  <button onClick={() => setCv(null)} className="ml-2 text-red-400 hover:text-red-600"><span className="material-symbols-outlined text-[16px]">close</span></button>
                </div>
              )}
            </div>
          </SectionBlock>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[10px] text-slate-400 italic">ARDHI · Research. Advocacy. Innovation.</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button onClick={submit} className="px-5 py-2 bg-aims-green text-white text-xs font-bold rounded-lg hover:bg-aims-green/90 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">person_add</span>Save Employee
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
