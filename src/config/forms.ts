// src/config/forms.ts
export type FieldType = 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'signature' | 'table' | 'auto';

export interface FormField {
  label: string;
  key: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  required?: boolean;
  section?: string;
  colSpan?: number;
  /** Conditional logic — field only renders when another field equals this value */
  showWhen?: { key: string; value: string };
}

export interface FormSection {
  title: string;
  description?: string;
  fields: FormField[];
}

export interface FormDefinition {
  id: string;
  code: string;
  title: string;
  confidentiality?: string;
  instructions?: string;
  module: string;
  sections: FormSection[];
}

export const FORMS_LIBRARY: FormDefinition[] = [
  // HR Forms
  {
    id: 'hr-01',
    code: 'HR-01',
    title: 'Employment Contract',
    confidentiality: 'Confidential — For HR & Legal Use',
    instructions: 'Complete all sections before issuing to the employee for signature. Attach the signed Employee Information Form (FORM-HR-02) and job description as annexes.',
    module: 'hr',
    sections: [
      {
        title: 'Section 1: Parties',
        fields: [
          { label: 'Employer', key: 'employer', type: 'text', placeholder: 'ARDHI (registered NGO)', required: true },
          { label: 'Employee Full Name', key: 'employeeName', type: 'text', required: true },
          { label: 'Employee ID', key: 'employeeId', type: 'text' },
          { label: 'Position / Title', key: 'position', type: 'text', required: true },
          { label: 'Directorate', key: 'directorate', type: 'text' },
          { label: 'Reports To', key: 'reportsTo', type: 'text' },
          { label: 'Contract Type', key: 'contractType', type: 'select', options: ['Permanent', 'Fixed-Term', 'Contract', 'Intern'] },
        ],
      },
      {
        title: 'Section 2: Term & Probation',
        fields: [
          { label: 'Start Date', key: 'startDate', type: 'date', required: true },
          { label: 'End Date (if fixed-term)', key: 'endDate', type: 'date' },
          { label: 'Probation Period (months)', key: 'probationMonths', type: 'number' },
          { label: 'Probation Review Date', key: 'probationReview', type: 'date' },
          { label: 'Working Location', key: 'workLocation', type: 'text' },
          { label: 'Working Hours', key: 'workHours', type: 'text' },
        ],
      },
      {
        title: 'Section 3: Compensation & Benefits',
        fields: [
          { label: 'Gross Monthly Salary (UGX)', key: 'salary', type: 'number', required: true },
          { label: 'Pay Frequency', key: 'payFrequency', type: 'select', options: ['Monthly', 'Bi-weekly', 'Weekly'] },
          { label: 'NSSF Contribution', key: 'nssf', type: 'text' },
          { label: 'Medical Insurance', key: 'medical', type: 'text' },
          { label: 'Leave Entitlement (days/yr)', key: 'leaveDays', type: 'number' },
          { label: 'Other Allowances', key: 'allowances', type: 'text' },
        ],
      },
      {
        title: 'Section 4: Key Responsibilities',
        fields: [
          { label: 'Summary of Role', key: 'roleSummary', type: 'textarea', placeholder: 'Full description attached as Annex A' },
        ],
      },
      {
        title: 'Section 5: Confidentiality, Conduct & Termination',
        fields: [
          { label: 'Notice Period', key: 'noticePeriod', type: 'text' },
          { label: 'Grounds for Summary Dismissal', key: 'dismissalGrounds', type: 'textarea' },
        ],
      },
      {
        title: 'Section 6: Declaration & Signatures',
        fields: [
          { label: 'Employee Signature', key: 'employeeSig', type: 'signature' },
          { label: 'Executive Director Signature', key: 'edSig', type: 'signature' },
          { label: 'Witness Name & Signature', key: 'witnessSig', type: 'signature' },
          { label: 'HR Officer Signature', key: 'hrSig', type: 'signature' },
        ],
      },
    ],
  },
  {
    id: 'hr-04',
    code: 'HR-04',
    title: 'Leave Request Form',
    instructions: 'Submit at least 5 working days in advance for planned leave. Attach a medical certificate for sick leave exceeding 2 days.',
    module: 'attendance',
    sections: [
      {
        title: 'Leave Details',
        fields: [
          { label: 'Leave Type', key: 'leaveType', type: 'select', options: ['Annual', 'Sick', 'Maternity', 'Paternity', 'Unpaid', 'Compassionate'], required: true },
          { label: 'Start Date', key: 'startDate', type: 'date', required: true },
          { label: 'End Date', key: 'endDate', type: 'date', required: true },
          { label: 'Total Days Requested', key: 'totalDays', type: 'auto' },
          { label: 'Reason', key: 'reason', type: 'textarea' },
        ],
      },
      {
        title: 'Leave Balance Summary',
        fields: [
          { label: 'Annual Entitlement (days)', key: 'entitlement', type: 'auto' },
          { label: 'Days Used to Date', key: 'daysUsed', type: 'auto' },
          { label: 'Remaining Balance', key: 'remaining', type: 'auto' },
          { label: 'Balance After This Request', key: 'afterRequest', type: 'auto' },
        ],
      },
      {
        title: 'Handover Arrangements',
        fields: [
          { label: 'Cover Person During Leave', key: 'coverPerson', type: 'text' },
          { label: 'Contactable During Leave?', key: 'contactable', type: 'select', options: ['Yes', 'No'] },
          { label: 'Contact Number During Leave', key: 'contactPhone', type: 'text', showWhen: { key: 'contactable', value: 'Yes' } },
          { label: 'Pending Tasks / Handover Notes', key: 'handoverNotes', type: 'textarea' },
        ],
      },
    ],
  },
  {
    id: 'hr-02',
    code: 'HR-02',
    title: 'Employee Information Form',
    confidentiality: 'Confidential — For HR Use Only',
    instructions: 'Complete every section accurately. Write "N/A" where a field does not apply. Attach certified copies of your national ID, academic certificates, professional certifications and references before submission.',
    module: 'hr',
    sections: [
      {
        title: 'Personal Information (Biodata)',
        fields: [
          { label: 'Surname (Family Name)', key: 'surname', type: 'text', required: true },
          { label: 'First Name', key: 'firstName', type: 'text', required: true },
          { label: 'Middle Name(s)', key: 'middleName', type: 'text' },
          { label: 'Date of Birth', key: 'dob', type: 'date', required: true },
          { label: 'Gender', key: 'gender', type: 'select', options: ['Male', 'Female', 'Other'] },
          { label: 'National ID (NIN)', key: 'nin', type: 'text', required: true },
          { label: 'Nationality', key: 'nationality', type: 'text' },
        ],
      },
      {
        title: 'Contact Details',
        fields: [
          { label: 'Primary Phone', key: 'phone', type: 'text', required: true },
          { label: 'Personal Email', key: 'email', type: 'text', required: true },
          { label: 'Residential Address', key: 'address', type: 'textarea' },
        ],
      },
      {
        title: 'Emergency Contact',
        fields: [
          { label: 'Next of Kin Name', key: 'nextOfKin', type: 'text', required: true },
          { label: 'Relationship', key: 'relationship', type: 'text' },
          { label: 'Phone Number', key: 'emergencyPhone', type: 'text', required: true },
        ],
      },
    ],
  },
  {
    id: 'hr-03',
    code: 'HR-03',
    title: 'Performance Appraisal Form',
    confidentiality: 'Confidential — For HR & Management Use',
    instructions: 'Employee completes the self-assessment column first. Manager completes assessment and ratings during the review meeting. Both sign before submission to HR.',
    module: 'hr',
    sections: [
      {
        title: 'KPI Assessment',
        fields: [
          { label: 'KPI', key: 'kpi', type: 'text' },
          { label: 'Target', key: 'target', type: 'text' },
          { label: 'Weight (%)', key: 'weight', type: 'number' },
          { label: 'Self-Rating (1-5)', key: 'selfRating', type: 'number' },
          { label: 'Manager Rating (1-5)', key: 'managerRating', type: 'number' },
        ],
      },
      {
        title: 'Development Plan',
        fields: [
          { label: 'Training Needs', key: 'trainingNeeds', type: 'textarea' },
          { label: 'Career Development Goals', key: 'careerGoals', type: 'textarea' },
        ],
      },
    ],
  },
  {
    id: 'hr-05',
    code: 'HR-05',
    title: 'Employee Offboarding / Exit Form',
    confidentiality: 'Confidential — For HR Use Only',
    instructions: 'Initiate this form as soon as a resignation, contract end, or termination is confirmed. All department clearances must be completed before final settlement is processed.',
    module: 'hr',
    sections: [
      {
        title: 'Exit Details',
        fields: [
          { label: 'Employee Name', key: 'employeeName', type: 'text', required: true },
          { label: 'Last Working Day', key: 'lastDay', type: 'date', required: true },
          { label: 'Reason for Exit', key: 'reason', type: 'select', options: ['Resignation', 'Contract End', 'Termination', 'Redundancy', 'Other'] },
        ],
      },
      {
        title: 'Exit Interview',
        fields: [
          { label: 'Primary reason for leaving', key: 'exitReason', type: 'textarea' },
          { label: 'What could ARDHI improve?', key: 'improvements', type: 'textarea' },
        ],
      },
    ],
  },
  // Finance Forms
  {
    id: 'fin-01',
    code: 'FIN-01',
    title: 'Requisition Form',
    instructions: 'Attach at least one supporting document (quote, invoice, or vendor proforma) before pushing to the Executive Director for review.',
    module: 'finance',
    sections: [
      {
        title: 'Requisition Details',
        fields: [
          { label: 'Requisition ID', key: 'reqId', type: 'auto' },
          { label: 'Date', key: 'date', type: 'auto' },
          { label: 'Requested By', key: 'requestedBy', type: 'text', required: true },
          { label: 'Department', key: 'department', type: 'select', options: ['Finance', 'Grants', 'Innovation', 'HR', 'IT', 'Procurement'] },
          { label: 'Urgency', key: 'urgency', type: 'select', options: ['Standard', 'Urgent'] },
          { label: 'Linked Budget Line', key: 'budgetLine', type: 'text' },
        ],
      },
      {
        title: 'Line Items',
        fields: [
          { label: 'Item / Description', key: 'item', type: 'text' },
          { label: 'Quantity', key: 'qty', type: 'number' },
          { label: 'Unit Cost (UGX)', key: 'unitCost', type: 'number' },
          { label: 'Total (UGX)', key: 'total', type: 'auto' },
        ],
      },
      {
        title: 'Justification',
        fields: [
          { label: 'Purpose / justification', key: 'justification', type: 'textarea', required: true },
        ],
      },
      {
        title: 'Supporting Documents',
        fields: [
          { label: 'Vendor Quote(s)', key: 'vendorQuote', type: 'checkbox' },
          { label: 'Invoice / Proforma', key: 'invoice', type: 'checkbox' },
          { label: 'Prior Approval Reference', key: 'priorApproval', type: 'checkbox' },
        ],
      },
    ],
  },
  {
    id: 'fin-02',
    code: 'FIN-02',
    title: 'Procurement Request Form',
    instructions: 'A minimum of three vendor quotes is required for purchases above ARDHI\'s procurement threshold.',
    module: 'procurement',
    sections: [
      {
        title: 'Item Specifications',
        fields: [
          { label: 'Item', key: 'item', type: 'text' },
          { label: 'Specification', key: 'spec', type: 'text' },
          { label: 'Quantity', key: 'qty', type: 'number' },
          { label: 'Est. Unit Cost (UGX)', key: 'estCost', type: 'number' },
        ],
      },
      {
        title: 'Vendor Comparison',
        fields: [
          { label: 'Vendor Name', key: 'vendorName', type: 'text' },
          { label: 'Quote (UGX)', key: 'quote', type: 'number' },
          { label: 'Delivery Time', key: 'deliveryTime', type: 'text' },
          { label: 'Notes', key: 'notes', type: 'textarea' },
        ],
      },
      {
        title: 'Recommendation',
        fields: [
          { label: 'Recommended Vendor', key: 'recommendedVendor', type: 'text' },
          { label: 'Justification', key: 'justification', type: 'textarea' },
        ],
      },
    ],
  },
  {
    id: 'fin-03',
    code: 'FIN-03',
    title: 'Expense Reimbursement Form',
    instructions: 'Attach original receipts for every line item. Claims without receipts may be declined per ARDHI\'s finance policy.',
    module: 'finance',
    sections: [
      {
        title: 'Itemized Expenses',
        fields: [
          { label: 'Date', key: 'date', type: 'date' },
          { label: 'Category', key: 'category', type: 'select', options: ['Travel', 'Field Work', 'Supplies', 'Accommodation', 'Other'] },
          { label: 'Description', key: 'description', type: 'text' },
          { label: 'Amount (UGX)', key: 'amount', type: 'number' },
          { label: 'Receipt Attached', key: 'receiptAttached', type: 'checkbox' },
        ],
      },
    ],
  },
  // Grant Forms
  {
    id: 'grt-01',
    code: 'GRT-01',
    title: 'Grant Proposal Cover Sheet',
    instructions: 'Complete before submission to the funder. Attach the full proposal narrative, budget, and compliance documents.',
    module: 'grants',
    sections: [
      {
        title: 'Grant & Funder Information',
        fields: [
          { label: 'Grant Title', key: 'grantTitle', type: 'text', required: true },
          { label: 'Funder Name', key: 'funderName', type: 'text', required: true },
          { label: 'Strategic Pillar', key: 'pillar', type: 'select', options: ['ArdhiLaw', 'ArdhiAgriculture', 'ArdhiWaste', 'ArdhiDisasters', 'ArdhiHealth', 'ArdhiLandGovernance'] },
          { label: 'Submission Deadline', key: 'deadline', type: 'date', required: true },
          { label: 'Amount Requested (UGX)', key: 'amount', type: 'number', required: true },
          { label: 'Grant Duration', key: 'duration', type: 'text' },
        ],
      },
      {
        title: 'ARDHI Project Team',
        fields: [
          { label: 'Handler (Lead Grant Writer)', key: 'handler', type: 'text' },
          { label: 'Contributors', key: 'contributors', type: 'text' },
        ],
      },
      {
        title: 'Project Summary',
        fields: [
          { label: 'Problem Statement', key: 'problem', type: 'textarea' },
          { label: 'Objectives', key: 'objectives', type: 'textarea' },
          { label: 'Target Beneficiaries', key: 'beneficiaries', type: 'text' },
          { label: 'Geographic Coverage', key: 'coverage', type: 'text' },
        ],
      },
      {
        title: 'Compliance Checklist',
        fields: [
          { label: 'NGO Registration Certificate', key: 'ngoCert', type: 'checkbox' },
          { label: 'Board Approval Reference', key: 'boardApproval', type: 'checkbox' },
          { label: 'Audited Accounts (latest)', key: 'auditedAccounts', type: 'checkbox' },
          { label: 'Organizational Profile', key: 'orgProfile', type: 'checkbox' },
          { label: 'Tax Compliance Certificate', key: 'taxCert', type: 'checkbox' },
          { label: 'Theory of Change / Strategic Plan', key: 'theoryOfChange', type: 'checkbox' },
        ],
      },
    ],
  },
  {
    id: 'grt-02',
    code: 'GRT-02',
    title: 'Grant Budget Template',
    instructions: 'List all budget lines by category. Indicate co-financing separately from the amount requested from this funder.',
    module: 'grants',
    sections: [
      {
        title: 'Budget Line Items',
        fields: [
          { label: 'Line Item', key: 'lineItem', type: 'text' },
          { label: 'Category', key: 'category', type: 'select', options: ['Personnel', 'Program', 'Operations', 'M&E', 'Overhead'] },
          { label: 'Year 1 (UGX)', key: 'year1', type: 'number' },
          { label: 'Year 2 (UGX)', key: 'year2', type: 'number' },
          { label: 'Total (UGX)', key: 'total', type: 'auto' },
        ],
      },
    ],
  },
  {
    id: 'grt-03',
    code: 'GRT-03',
    title: 'Grant Milestone Checklist',
    instructions: 'Update as each milestone is completed. Attach evidence (document, screenshot, or link) for each completed item.',
    module: 'grants',
    sections: [
      {
        title: 'Milestone Tracker',
        fields: [
          { label: 'Milestone', key: 'milestone', type: 'text' },
          { label: 'Owner', key: 'owner', type: 'text' },
          { label: 'Target Date', key: 'targetDate', type: 'date' },
          { label: 'Completion Date', key: 'completionDate', type: 'date' },
          { label: 'Evidence Attached', key: 'evidenceAttached', type: 'checkbox' },
          { label: 'Status', key: 'status', type: 'select', options: ['Pending', 'In Progress', 'Completed'] },
        ],
      },
    ],
  },
  {
    id: 'grt-04',
    code: 'GRT-04',
    title: 'Grant Closeout Report',
    instructions: 'Complete within 30 days of grant end date. Attach final financial reconciliation and any funder-required closeout documentation.',
    module: 'grants',
    sections: [
      {
        title: 'Outcome Indicators',
        fields: [
          { label: 'Indicator', key: 'indicator', type: 'text' },
          { label: 'Target', key: 'target', type: 'text' },
          { label: 'Achieved', key: 'achieved', type: 'text' },
          { label: 'Variance', key: 'variance', type: 'text' },
          { label: 'Explanation', key: 'explanation', type: 'textarea' },
        ],
      },
      {
        title: 'Lessons Learned',
        fields: [
          { label: 'Key lessons learned', key: 'lessons', type: 'textarea' },
          { label: 'Recommendations for future grants', key: 'recommendations', type: 'textarea' },
        ],
      },
    ],
  },
  // Innovation Forms
  {
    id: 'inv-01',
    code: 'INV-01',
    title: 'Innovation Project Proposal Form',
    instructions: 'Complete before a project moves from idea to the Concept Phase of the Innovation Pipeline.',
    module: 'innovations',
    sections: [
      {
        title: 'Project Team',
        fields: [
          { label: 'Project Title', key: 'projectTitle', type: 'text', required: true },
          { label: 'Lead', key: 'lead', type: 'text' },
          { label: 'Contributors', key: 'contributors', type: 'text' },
          { label: 'Related Thematic Pillar', key: 'pillar', type: 'text' },
        ],
      },
      {
        title: 'Problem & Proposed Solution',
        fields: [
          { label: 'Problem Statement', key: 'problem', type: 'textarea', required: true },
          { label: 'Proposed Solution', key: 'solution', type: 'textarea', required: true },
        ],
      },
      {
        title: 'Resource Requirements',
        fields: [
          { label: 'Estimated Budget (UGX)', key: 'budget', type: 'number' },
          { label: 'Equipment Needed', key: 'equipment', type: 'text' },
          { label: 'Personnel Time (person-days)', key: 'personnelTime', type: 'number' },
          { label: 'External Support Needed', key: 'externalSupport', type: 'text' },
        ],
      },
      {
        title: 'Risk Register',
        fields: [
          { label: 'Risk', key: 'risk', type: 'text' },
          { label: 'Likelihood', key: 'likelihood', type: 'select', options: ['Low', 'Medium', 'High'] },
          { label: 'Impact', key: 'impact', type: 'select', options: ['Low', 'Medium', 'High'] },
          { label: 'Mitigation', key: 'mitigation', type: 'textarea' },
        ],
      },
    ],
  },
  {
    id: 'inv-02',
    code: 'INV-02',
    title: 'Feasibility Study Template',
    instructions: 'Complete before a project moves from Concept to Prototype phase.',
    module: 'innovations',
    sections: [
      {
        title: 'Technical Feasibility',
        fields: [
          { label: 'Technical approach and feasibility summary', key: 'technicalFeasibility', type: 'textarea' },
        ],
      },
      {
        title: 'Financial Feasibility',
        fields: [
          { label: 'Cost Item', key: 'costItem', type: 'text' },
          { label: 'Estimated Cost (UGX)', key: 'estCost', type: 'number' },
          { label: 'Notes', key: 'notes', type: 'textarea' },
        ],
      },
      {
        title: 'SWOT Analysis',
        fields: [
          { label: 'Strengths', key: 'strengths', type: 'textarea' },
          { label: 'Weaknesses', key: 'weaknesses', type: 'textarea' },
          { label: 'Opportunities', key: 'opportunities', type: 'textarea' },
          { label: 'Threats', key: 'threats', type: 'textarea' },
        ],
      },
    ],
  },
  // Inventory forms
  {
    id: 'invt-01',
    code: 'INVT-01',
    title: 'Inventory Reorder Request Form',
    instructions: 'Auto-generated when stock falls below threshold, or submit manually for new items.',
    module: 'inventory',
    sections: [
      {
        title: 'Item Details',
        fields: [
          { label: 'Item Name', key: 'itemName', type: 'text', required: true },
          { label: 'Item Code', key: 'itemCode', type: 'text' },
          { label: 'Current Stock', key: 'currentStock', type: 'number' },
          { label: 'Reorder Threshold', key: 'reorderThreshold', type: 'number' },
          { label: 'Quantity Requested', key: 'qtyRequested', type: 'number', required: true },
          { label: 'Urgency', key: 'urgency', type: 'select', options: ['Standard', 'Urgent'] },
        ],
      },
      {
        title: 'Vendor Quotes',
        fields: [
          { label: 'Vendor', key: 'vendor', type: 'text' },
          { label: 'Unit Price (UGX)', key: 'unitPrice', type: 'number' },
          { label: 'Delivery Time', key: 'deliveryTime', type: 'text' },
          { label: 'Notes', key: 'notes', type: 'textarea' },
        ],
      },
    ],
  },
  {
    id: 'invt-02',
    code: 'INVT-02',
    title: 'Asset Register Entry Form',
    instructions: 'Complete for every new asset purchase or donation. Update the Custodian History table whenever an asset changes hands.',
    module: 'inventory',
    sections: [
      {
        title: 'Asset Details',
        fields: [
          { label: 'Asset Name', key: 'assetName', type: 'text', required: true },
          { label: 'Asset Tag / ID', key: 'assetTag', type: 'auto' },
          { label: 'Category', key: 'category', type: 'text' },
          { label: 'Condition', key: 'condition', type: 'select', options: ['New', 'Good', 'Fair', 'Poor'] },
        ],
      },
      {
        title: 'Acquisition Information',
        fields: [
          { label: 'Purchase Date', key: 'purchaseDate', type: 'date' },
          { label: 'Vendor', key: 'vendor', type: 'text' },
          { label: 'Value (UGX)', key: 'value', type: 'number' },
          { label: 'Warranty Expiry', key: 'warrantyExpiry', type: 'date' },
        ],
      },
    ],
  },
  // System forms
  {
    id: 'sys-01',
    code: 'SYS-01',
    title: 'Incident Report Form',
    confidentiality: 'Confidential — For System Admin & ED Use',
    instructions: 'Submit as soon as possible after any security, safeguarding, data protection, or field safety incident.',
    module: 'rbac',
    sections: [
      {
        title: 'Incident Details',
        fields: [
          { label: 'Reported By', key: 'reportedBy', type: 'text', required: true },
          { label: 'Incident Type', key: 'incidentType', type: 'select', options: ['Security', 'Data Protection', 'Safeguarding', 'Field Safety', 'Other'] },
          { label: 'Severity', key: 'severity', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
          { label: 'Confidential?', key: 'confidential', type: 'select', options: ['Yes', 'No'] },
          { label: 'Date/Time of Incident', key: 'incidentTime', type: 'date' },
        ],
      },
      {
        title: 'Incident Description',
        fields: [
          { label: 'Full description', key: 'description', type: 'textarea', required: true },
        ],
      },
      {
        title: 'Immediate Action Taken',
        fields: [
          { label: 'Actions taken', key: 'actions', type: 'textarea' },
        ],
      },
      {
        title: 'Corrective / Preventive Action Plan',
        fields: [
          { label: 'Action', key: 'action', type: 'text' },
          { label: 'Owner', key: 'owner', type: 'text' },
          { label: 'Due Date', key: 'dueDate', type: 'date' },
          { label: 'Status', key: 'status', type: 'select', options: ['Pending', 'In Progress', 'Completed'] },
        ],
      },
    ],
  },
  {
    id: 'sys-02',
    code: 'SYS-02',
    title: 'System Access Request Form',
    instructions: 'Submit for new accounts, role changes, password resets, or module access extensions.',
    module: 'rbac',
    sections: [
      {
        title: 'Access Details',
        fields: [
          { label: 'Requested By', key: 'requestedBy', type: 'text', required: true },
          { label: 'Access Type Needed', key: 'accessType', type: 'select', options: ['New Account', 'Role Change', 'Password Reset', 'Module Access Extension'] },
          { label: 'Employee ID', key: 'employeeId', type: 'text' },
        ],
      },
      {
        title: 'Modules Requested',
        fields: [
          { label: 'Module', key: 'module', type: 'text' },
          { label: 'Access Level Needed', key: 'accessLevel', type: 'select', options: ['View', 'Edit', 'Full'] },
          { label: 'Justification', key: 'justification', type: 'textarea' },
        ],
      },
    ],
  },
  // HR operational forms — Timesheet & Travel
  {
    id: 'hr-06',
    code: 'HR-06',
    title: 'Timesheet Form',
    instructions: 'Record hours worked per day and per project/activity. Submit weekly by Friday 17:00. Overtime requires pre-approval from your supervisor.',
    module: 'hr',
    sections: [
      {
        title: 'Timesheet Period',
        fields: [
          { label: 'Week Starting (Monday)', key: 'weekStart', type: 'date', required: true },
          { label: 'Employee Name', key: 'employeeName', type: 'text', required: true },
          { label: 'Department', key: 'department', type: 'select', options: ['Executive', 'Finance', 'Grants', 'Innovation', 'HR & Admin', 'IT', 'Field Operations'] },
          { label: 'Supervisor', key: 'supervisor', type: 'text' },
        ],
      },
      {
        title: 'Hours by Day',
        fields: [
          { label: 'Monday Hours', key: 'mon', type: 'number', placeholder: '0 – 12' },
          { label: 'Tuesday Hours', key: 'tue', type: 'number' },
          { label: 'Wednesday Hours', key: 'wed', type: 'number' },
          { label: 'Thursday Hours', key: 'thu', type: 'number' },
          { label: 'Friday Hours', key: 'fri', type: 'number' },
          { label: 'Weekend / Field Hours', key: 'weekendHours', type: 'number' },
          { label: 'Total Hours This Week', key: 'totalHours', type: 'auto' },
          { label: 'Leave Days Taken (this week)', key: 'leaveDays', type: 'number' },
        ],
      },
      {
        title: 'Activity Allocation',
        fields: [
          { label: 'Primary Project / Grant', key: 'project', type: 'text' },
          { label: 'Main Activities Undertaken', key: 'activities', type: 'textarea', required: true },
          { label: 'Any Overtime?', key: 'overtime', type: 'select', options: ['No', 'Yes — pre-approved'] },
        ],
      },
    ],
  },
  {
    id: 'hr-07',
    code: 'HR-07',
    title: 'Travel Request Form',
    instructions: 'Submit before booking any travel. Field trips require department head approval; accommodation and advances are handled only after this form is approved.',
    module: 'hr',
    sections: [
      {
        title: 'Travel Details',
        fields: [
          { label: 'Traveller Name', key: 'travellerName', type: 'text', required: true },
          { label: 'Department', key: 'department', type: 'select', options: ['Executive', 'Finance', 'Grants', 'Innovation', 'HR & Admin', 'Field Operations'] },
          { label: 'Travel Purpose', key: 'purpose', type: 'textarea', required: true },
          { label: 'Destination', key: 'destination', type: 'text', required: true },
          { label: 'Departure Date', key: 'departure', type: 'date', required: true },
          { label: 'Return Date', key: 'returnDate', type: 'date', required: true },
          { label: 'Mode of Transport', key: 'transport', type: 'select', options: ['Road — ARDHI vehicle', 'Road — hired/private', 'Flight', 'Other'], required: true },
          { label: 'Flight Booking Reference / Airline', key: 'flightRef', type: 'text', showWhen: { key: 'transport', value: 'Flight' } },
          { label: 'Vehicle Registration / Driver', key: 'vehicle', type: 'text', showWhen: { key: 'transport', value: 'Road — ARDHI vehicle' } },
        ],
      },
      {
        title: 'Accommodation & Advance',
        fields: [
          { label: 'Accommodation Needed?', key: 'accommodation', type: 'select', options: ['No', 'Yes'] },
          { label: 'Hotel / Guest House & Nights', key: 'hotel', type: 'text', showWhen: { key: 'accommodation', value: 'Yes' } },
          { label: 'Cash Advance Needed?', key: 'advance', type: 'select', options: ['No', 'Yes'] },
          { label: 'Advance Amount (UGX)', key: 'advanceAmount', type: 'number', showWhen: { key: 'advance', value: 'Yes' } },
        ],
      },
      {
        title: 'Approvals',
        fields: [
          { label: 'Supervisor Name', key: 'supervisor', type: 'text' },
          { label: 'Comments', key: 'comments', type: 'textarea' },
        ],
      },
    ],
  },
  // Compliance forms
  {
    id: 'sys-03',
    code: 'SYS-03',
    title: 'Risk Assessment Form',
    confidentiality: 'Confidential — For Management Use',
    instructions: 'Complete a risk assessment before any new activity, field operation or partner engagement. High risks must be reviewed by the ED before proceeding.',
    module: 'rbac',
    sections: [
      {
        title: 'Risk Context',
        fields: [
          { label: 'Assessed By', key: 'assessedBy', type: 'text', required: true },
          { label: 'Activity / Operation', key: 'activity', type: 'textarea', required: true },
          { label: 'Location', key: 'location', type: 'text' },
          { label: 'Date of Assessment', key: 'assessmentDate', type: 'date', required: true },
          { label: 'Risk Category', key: 'category', type: 'select', options: ['Field Safety', 'Safeguarding', 'Data Protection', 'Financial', 'Reputational', 'Operational'] },
          { label: 'Affects Children / Vulnerable Beneficiaries?', key: 'affectsVulnerable', type: 'select', options: ['No', 'Yes'] },
          { label: 'Safeguarding Lead Informed?', key: 'safeguardingLead', type: 'select', options: ['Yes', 'No'], showWhen: { key: 'affectsVulnerable', value: 'Yes' } },
        ],
      },
      {
        title: 'Risk Rating & Mitigation',
        fields: [
          { label: 'Likelihood', key: 'likelihood', type: 'select', options: ['Low', 'Medium', 'High'] },
          { label: 'Impact', key: 'impact', type: 'select', options: ['Low', 'Medium', 'High'] },
          { label: 'Overall Rating', key: 'rating', type: 'auto' },
          { label: 'Existing Controls', key: 'controls', type: 'textarea' },
          { label: 'Additional Mitigation Required', key: 'mitigation', type: 'textarea', required: true },
          { label: 'Action Owner', key: 'owner', type: 'text' },
          { label: 'Review / Due Date', key: 'dueDate', type: 'date' },
        ],
      },
    ],
  },
];

export function getFormsByModule(moduleName: string): FormDefinition[] {
  return FORMS_LIBRARY.filter((f) => f.module === moduleName);
}

export function getFormById(id: string): FormDefinition | undefined {
  return FORMS_LIBRARY.find((f) => f.id === id);
}