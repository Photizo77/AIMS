// src/lib/employeeFormTemplate.ts
// ============================================================
// AIMS — shareable blank copies of the ARDHI Employee Information Form.
// The Company Admin can print / save the blank form as a PDF and hand it
// to any prospective employee, or copy a direct link to the form so the
// hire can fill it in themselves inside AIMS (self-service mode).
// ============================================================

export const EMPLOYEE_FORM_SECTIONS: { title: string; fields: string[] }[] = [
  { title: '1 · Personal Information (Biodata)', fields: ['Surname (Family Name)', 'First Name', 'Middle Name(s)', 'Preferred Name', 'Date of Birth', 'Place of Birth', 'Gender', 'Marital Status', 'Nationality', 'Religion (Optional)', 'National ID (NIN)', 'NSSF Number', 'TIN Number', 'Passport Number', 'Languages Spoken', 'Driving Permit (No. & Class)'] },
  { title: '2 · Contact Details & Address', fields: ['Primary Phone', 'Alternative Phone', 'Personal Email', 'Postal Address', 'Plot / House No.', 'Street / Road', 'Village / Parish', 'Sub-county / Division', 'District / City', 'Country', 'Permanent Home Address'] },
  { title: '3 · Next of Kin & Emergency Contact', fields: ['Next of Kin — Full Name', 'Relationship', 'Phone Number', 'Email / National ID', 'Residential Address', 'Emergency Contact — Name', 'Emergency Contact — Phone & Relationship', "Spouse's Name", "Spouse's Phone & Occupation", 'Number of Dependants', 'Number of Children'] },
  { title: '4 · Education Background', fields: ['Primary & Secondary: School / Location / Level / Years / Grade', 'Tertiary: Institution / Qualification / Field / Years', 'Professional Certifications: Course / Awarding Body / Year / Expiry'] },
  { title: '5 · Employment History & Experience', fields: ['Employer / Organisation', 'Job Title', 'Start (MM/YY)', 'End (MM/YY)', 'Supervisor & Contact', 'Reason for Leaving', 'Key Responsibilities & Achievements'] },
  { title: '6 · Skills, Competencies & Languages', fields: ['Technical Skills', 'Soft Skills', 'Computer Literacy', 'Languages — Speak / Read / Write / Overall Proficiency'] },
  { title: '7 · Professional References', fields: ['Full Name', 'Job Title & Organisation', 'Relationship', 'Phone', 'Email'] },
  { title: '8 · Banking, Payroll & Medical Information', fields: ['Bank Name & Branch', 'Account Name', 'Account Number', 'SWIFT Code', 'Mobile Money Number', 'Mobile Money Network & Name', 'Blood Group', 'Allergies', 'Chronic Conditions / Medications', 'Disability / Special Needs', 'Health Insurance (Provider & Policy No.)', 'Preferred Hospital / Personal Doctor'] },
  { title: '9 · Background Declarations', fields: ['Ever convicted of a criminal offence?', 'Any pending criminal or civil cases?', 'Dismissed or asked to resign from any role?', 'Other employment / business interests?', 'Related to any current ARDHI employee?'] },
  { title: '10 · Declaration & Signature', fields: ['Employee Full Name', 'Date', 'Place', 'Signature'] },
];

export const EMPLOYEE_FORM_DOCS = [
  'Copy of National ID / Passport', 'Copy of NSSF Card', 'Copy of TIN Certificate',
  'Academic Certificates & Transcripts', 'Professional Certifications', 'Curriculum Vitae (CV)',
  'Passport-size Photographs (2)', 'Reference / Recommendation Letters', 'Birth Certificate',
  'Bank / Mobile Money Details', 'Medical / Fitness Certificate', 'Police Clearance / Good Conduct',
  'Signed Employment Contract / Offer Letter',
];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Build the printable blank form document (used for print / save-as-PDF) */
export function buildBlankEmployeeFormHtml(): string {
  const sections = EMPLOYEE_FORM_SECTIONS.map((section) => `
    <section>
      <h2>${esc(section.title)}</h2>
      <table>${section.fields.map((f) => `<tr><td class="label">${esc(f)}</td><td class="blank"></td></tr>`).join('')}</table>
    </section>`).join('');
  const docs = EMPLOYEE_FORM_DOCS.map((d) => `<li><span class="box"></span>${esc(d)}</li>`).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>ARDHI — Employee Information Form</title>
<style>
  @page { margin: 16mm; }
  body { font-family: Inter, 'Segoe UI', Arial, sans-serif; color: #0b1c30; margin: 24px; font-size: 11px; }
  header { border-bottom: 3px solid #053664; padding-bottom: 10px; margin-bottom: 16px; }
  h1 { font-size: 17px; color: #053664; margin: 0 0 4px; }
  header p { margin: 2px 0; font-size: 10px; color: #43474f; }
  .conf { color: #eb3b14; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; font-size: 9px; }
  section { break-inside: avoid; margin-bottom: 14px; }
  h2 { font-size: 11px; background: #053664; color: #fff; padding: 5px 8px; margin: 0 0 6px; text-transform: uppercase; letter-spacing: .04em; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 4px 6px; border-bottom: 1px solid #dfe6ef; vertical-align: top; }
  td.label { width: 42%; font-weight: 600; color: #0b1c30; }
  td.blank { border-bottom: 1px solid #9aa7b6; }
  ul.docs { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; }
  ul.docs li { display: flex; align-items: flex-start; gap: 6px; font-size: 10px; }
  .box { display: inline-block; width: 10px; height: 10px; border: 1.5px solid #286b25; border-radius: 2px; flex: 0 0 auto; margin-top: 1px; }
  .decl { background: #f1f6f1; border: 1px solid #c1dbc3; padding: 8px; font-size: 10px; line-height: 1.5; margin-bottom: 8px; }
  footer { margin-top: 18px; border-top: 1px solid #dfe6ef; padding-top: 8px; font-size: 9px; color: #43474f; display: flex; justify-content: space-between; }
</style></head>
<body>
  <header>
    <p class="conf">Confidential — to be completed by the employee and returned to the Company Admin</p>
    <h1>ARDHI Law and Policy Initiative — Employee Information Form</h1>
    <p>Form ref: FORM-HR-02 · AIMS Internal Management System · Print or complete online in the Forms Library</p>
    <p>Complete every section accurately. Write "N/A" where a field does not apply.</p>
  </header>
  ${sections}
  <section>
    <h2>Documents Submitted (tick as applicable)</h2>
    <ul class="docs">${docs}</ul>
  </section>
  <section>
    <h2>Declaration</h2>
    <p class="decl">I declare that the information provided in this form is true, complete and accurate to the best of my knowledge. I understand that any false statement or omission may result in rejection of my application or termination of employment without notice. I authorise ARDHI to verify any information provided, and consent to the processing of my personal data for employment-related purposes in accordance with the Data Protection and Privacy Act, 2019.</p>
  </section>
  <footer><span>ARDHI · Research. Advocacy. Innovation.</span><span>Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></footer>
  <script>window.onload = function () { setTimeout(function () { window.print(); }, 300); };</script>
</body></html>`;
}

/** Open the blank form ready to print or save as PDF (a copy to share) */
export function printBlankEmployeeForm(): void {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) { frame.remove(); return; }
  doc.open();
  doc.write(buildBlankEmployeeFormHtml());
  doc.close();
  try {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
  } catch { /* print may be blocked — the iframe is still cleaned up */ }
  setTimeout(() => frame.remove(), 60_000);
}

/** Direct link employees can follow to fill the form in themselves */
export function employeeFormShareLink(): string {
  const base = typeof window === 'undefined' ? '' : window.location.origin;
  return `${base}/forms?form=hr-02&mode=employee`;
}

/** Share text the Company Admin can paste into an email or WhatsApp message */
export function employeeFormShareMessage(): string {
  return [
    'ARDHI — Employee Information Form (FORM-HR-02)',
    '',
    'Congratulations on your appointment. Please complete the ARDHI Employee Information Form before your first day.',
    '',
    `Complete it online: ${employeeFormShareLink()}`,
    '',
    'Inside AIMS: Forms → Employee Information Form → "Fill as Employee".',
    'Your submission goes straight to the Company Admin for review; login details are issued once it is verified.',
    '',
    'Bring certified copies of your ID/passport, NSSF card, TIN certificate, academic certificates and 2 passport photos.',
  ].join('\n');
}
