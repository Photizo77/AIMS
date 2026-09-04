// src/pages/Documents.tsx
// ============================================================
// AIMS — Document Management Hub.
// All records live in the persisted library (docService), so
// uploads, deletes, versions and HR-confidential CVs are REAL and
// auto-update. Exports (CSV/PDF) produce real files; "Download"
// downloads a record sheet of the document; Share copies a link.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { useLiveData } from '@/lib/useLiveData';
import { downloadFile } from '@/lib/storage';
import { exportCsv, exportTableAsPdf } from '@/lib/export';
import { listDocs, addDoc, removeDoc, docRecordSheet, type DocCategory, type DocRecord } from '@/services/docService';
import { formatBytes } from '@/services/employeeDocsService';
import { openFlagForED } from '@/components/grants/FlagForEDModal';

type AccessLevel = 'full' | 'view' | 'flag' | 'none';

const CATEGORIES: { key: DocCategory; label: string; icon: string; description: string }[] = [
  { key: 'governance', label: 'Governance', icon: 'gavel', description: 'Board minutes, compliance policies, institutional announcements' },
  { key: 'hr_contracts', label: 'HR & Contracts', icon: 'badge', description: 'Employee contracts, appraisal forms, employee profiles' },
  { key: 'hr_confidential', label: 'HR Confidential — Employee Files', icon: 'lock', description: 'Employee CVs and confidential personnel files — Executive Director & HR only' },
  { key: 'finance_procurement', label: 'Finance & Procurement', icon: 'account_balance', description: 'Requisition backup, receipts, budget sheets, procurement records' },
  { key: 'grants', label: 'Grants', icon: 'volunteer_activism', description: 'Proposal drafts, budgets, funder correspondence, award letters' },
  { key: 'grants_resource', label: 'Grants Resource Library', icon: 'menu_book', description: 'Proposal & budget templates, funder guidelines, ARDHI boilerplate' },
  { key: 'innovations', label: 'Innovations', icon: 'lightbulb', description: 'Feasibility studies, technical docs, prototypes, research' },
  { key: 'inventory_policy', label: 'Inventory & Policy', icon: 'inventory_2', description: 'Low-stock records, operational policy storage' },
  { key: 'system_security', label: 'System & Security', icon: 'shield', description: 'Audit logs, access logs, config exports' },
  { key: 'shared_reference', label: 'Shared Reference Library', icon: 'local_library', description: 'Meeting minutes, policies, leave forms, requisition & contract templates, SOPs, brand assets' },
];

// ── Visibility Matrix — missing categories default to 'none' ──
// HR Confidential (employee CVs) is visible ONLY to the ED and HR.
function getCategoryAccess(role: string, category: DocCategory): AccessLevel {
  const matrix: Record<string, Partial<Record<DocCategory, AccessLevel>>> = {
    CD: { governance: 'full', hr_contracts: 'flag', finance_procurement: 'flag', grants: 'view', grants_resource: 'view', innovations: 'flag', inventory_policy: 'flag', system_security: 'none', shared_reference: 'full' },
    ED: { governance: 'full', hr_contracts: 'full', hr_confidential: 'full', finance_procurement: 'full', grants: 'full', grants_resource: 'full', innovations: 'full', inventory_policy: 'full', system_security: 'view', shared_reference: 'full' },
    COMPANY_ADMIN: { governance: 'view', hr_contracts: 'full', hr_confidential: 'full', finance_procurement: 'none', grants: 'none', grants_resource: 'none', innovations: 'none', inventory_policy: 'full', system_security: 'none', shared_reference: 'full' },
    SYS_ADMIN: { governance: 'none', hr_contracts: 'none', finance_procurement: 'none', grants: 'none', grants_resource: 'none', innovations: 'none', inventory_policy: 'none', system_security: 'full', shared_reference: 'view' },
    FINANCE: { governance: 'none', hr_contracts: 'none', finance_procurement: 'full', grants: 'none', grants_resource: 'none', innovations: 'none', inventory_policy: 'none', system_security: 'none', shared_reference: 'view' },
    GRANT_WRITER: { governance: 'none', hr_contracts: 'none', finance_procurement: 'none', grants: 'full', grants_resource: 'full', innovations: 'none', inventory_policy: 'none', system_security: 'none', shared_reference: 'view' },
    GRANTS_MANAGER: { governance: 'none', hr_contracts: 'none', finance_procurement: 'none', grants: 'full', grants_resource: 'full', innovations: 'none', inventory_policy: 'none', system_security: 'none', shared_reference: 'view' },
    INNOVATOR: { governance: 'none', hr_contracts: 'none', finance_procurement: 'none', grants: 'none', grants_resource: 'none', innovations: 'full', inventory_policy: 'none', system_security: 'none', shared_reference: 'view' },
  };
  return matrix[role]?.[category] ?? 'none';
}

const ACCESS_BADGE: Record<AccessLevel, { label: string; cls: string }> = {
  full: { label: 'Full', cls: 'bg-aims-green/15 text-aims-green' },
  view: { label: 'View', cls: 'bg-aims-navy/10 text-aims-navy' },
  flag: { label: 'Flag', cls: 'bg-aims-orange/15 text-aims-orange' },
  none: { label: 'None', cls: 'bg-slate-100 text-slate-400' },
};

// ── Persona-tailored document hub ──
const PERSONA_PROFILE: Record<string, { label: string; blurb: string; focus: DocCategory[]; pinned: string[] }> = {
  CD: { label: 'Country Director', blurb: 'Governance, board minutes, institutional policy and compliance oversight — view everything, flag for the ED, approve nothing.', focus: ['governance', 'shared_reference'], pinned: ['d1', 'd2', 'd3'] },
  ED: { label: 'Executive Director', blurb: 'Full institutional picture — governance, finance, HR, grants and operations, with authority over every document.', focus: ['governance', 'finance_procurement', 'hr_contracts', 'grants'], pinned: ['d3', 'd6', 'd9'] },
  COMPANY_ADMIN: { label: 'Company Administrator', blurb: 'HR contracts, appraisals, employment records, operational policy and the shared reference library.', focus: ['hr_contracts', 'shared_reference', 'inventory_policy'], pinned: ['d4', 'd5', 'd20'] },
  SYS_ADMIN: { label: 'System Administrator', blurb: 'Audit logs, access logs and system security records — platform governance.', focus: ['system_security'], pinned: ['d17'] },
  FINANCE: { label: 'Finance Officer', blurb: 'Requisitions, receipts, budgets, payroll and procurement records — plus shared templates.', focus: ['finance_procurement', 'shared_reference'], pinned: ['d6', 'd7', 'd8'] },
  GRANT_WRITER: { label: 'Grant Writer', blurb: 'Proposals, budgets, funder correspondence and the grants resource library for drafting.', focus: ['grants', 'grants_resource'], pinned: ['d9', 'd10', 'd11'] },
  GRANTS_MANAGER: { label: 'Grants Manager', blurb: 'The full proposal pipeline — drafts, budgets, award letters and funder guidelines.', focus: ['grants', 'grants_resource'], pinned: ['d9', 'd12', 'd13'] },
  INNOVATOR: { label: 'Innovator', blurb: 'Feasibility studies, technical specifications, prototypes and research outputs.', focus: ['innovations'], pinned: ['d14', 'd15'] },
};

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.png', '.jpg', '.jpeg', '.zip'];
const MAX_FILE_SIZE = 25 * 1024 * 1024;

function getFileIcon(type: string): string {
  if (type === 'PDF') return 'picture_as_pdf';
  if (type === 'DOCX') return 'description';
  if (type === 'XLSX') return 'table_chart';
  if (type === 'ZIP') return 'folder_zip';
  if (type === 'PNG' || type === 'JPG') return 'image';
  return 'draft';
}

function getFileColor(type: string): string {
  if (type === 'PDF') return 'text-red-500';
  if (type === 'DOCX') return 'text-blue-600';
  if (type === 'XLSX') return 'text-green-600';
  if (type === 'ZIP') return 'text-orange-500';
  return 'text-slate-400';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function Documents() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [versionDocId, setVersionDocId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocRecord | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useLiveData();

  const userRole = user?.role ?? '';
  const persona = PERSONA_PROFILE[userRole];

  const accessibleCategories = CATEGORIES.filter((c) => getCategoryAccess(userRole, c.key) !== 'none');
  const [activeCategory, setActiveCategory] = useState<DocCategory>(accessibleCategories[0]?.key ?? 'shared_reference');

  const activeAccess = getCategoryAccess(userRole, activeCategory);
  const canUpload = activeAccess === 'full';
  const activeCategoryMeta = CATEGORIES.find((c) => c.key === activeCategory);

  const allDocs = listDocs();
  const pinnedDocs = persona ? allDocs.filter((d) => persona.pinned.includes(d.id)) : [];

  const filteredDocs = allDocs
    .filter((doc) => {
      if (doc.category !== activeCategory) return false;
      if (filterType && doc.fileType !== filterType) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return doc.title.toLowerCase().includes(q) || doc.tags.some((t) => t.toLowerCase().includes(q)) || doc.uploadedBy.toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  const goCategory = (key: DocCategory) => {
    setActiveCategory(key);
    setSelectedIds(new Set());
    setVersionDocId(null);
    setPreviewDoc(null);
  };

  const [searchParams, setSearchParams] = useSearchParams();

  // Deep link from global search (?doc=id) — jump to the category and open the preview
  useEffect(() => {
    const docId = searchParams.get('doc');
    if (!docId) return;
    const doc = listDocs().find((d) => d.id === docId);
    const allowed = doc ? getCategoryAccess(userRole, doc.category) !== 'none' : false;
    const next = new URLSearchParams(searchParams.toString());
    next.delete('doc');
    setSearchParams(next, { replace: true });
    if (doc && allowed) {
      setActiveCategory(doc.category);
      setPreviewDoc(doc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, userRole]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === filteredDocs.length ? new Set() : new Set(filteredDocs.map((d) => d.id)));
  };

  // ── REAL ACTIONS ──

  const downloadRecord = (doc: DocRecord) => {
    const safe = doc.title.replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]/g, '-');
    downloadFile(`${safe}.txt`, docRecordSheet(doc), 'text/plain;charset=utf-8');
    showToast({ title: 'Download Started', message: `${safe}.txt (record sheet)`, type: 'success' });
  };

  const downloadSelected = () => {
    const docs = allDocs.filter((d) => selectedIds.has(d.id));
    if (docs.length === 0) return;
    docs.forEach((d) => downloadRecord(d));
    showToast({ title: 'Downloads Started', message: `${docs.length} record sheet(s) downloading.`, type: 'success' });
    setSelectedIds(new Set());
  };

  const deleteSelected = () => {
    const docs = allDocs.filter((d) => selectedIds.has(d.id));
    docs.forEach((d) => removeDoc(d.id));
    showToast({ title: 'Deleted', message: `${docs.length} document(s) removed from the library.`, type: 'success' });
    setSelectedIds(new Set());
    setVersionDocId(null);
  };

  const exportRows = filteredDocs.map((d) => ({
    title: d.title, type: d.fileType, size: d.fileSize, category: d.category.replace(/_/g, ' '),
    uploadedBy: d.uploadedBy, uploadedOn: formatDate(d.uploadedAt), tags: d.tags.join(', '),
  }));

  const runExport = (fmt: 'csv' | 'pdf') => {
    if (exportRows.length === 0) {
      showToast({ title: 'Nothing to Export', message: 'No documents in this category match your filters.', type: 'error' });
      return;
    }
    if (fmt === 'csv') {
      exportCsv(`aims-documents-${activeCategory}`, exportRows);
      showToast({ title: 'CSV Exported', message: `${exportRows.length} document(s) exported.`, type: 'success' });
    } else {
      const cols = ['title', 'type', 'size', 'category', 'uploadedBy', 'uploadedOn', 'tags'];
      const head = ['Title', 'Type', 'Size', 'Category', 'Uploaded By', 'Uploaded On', 'Tags'];
      exportTableAsPdf(`${activeCategoryMeta?.label ?? 'Documents'} — Library Export`, head, exportRows.map((r) => cols.map((c) => String(r[c as keyof typeof r] ?? ''))));
      showToast({ title: 'Print Layout Ready', message: 'Choose "Save as PDF" in the print dialog.', type: 'success' });
    }
  };

  const shareDoc = (doc: DocRecord) => {
    const link = `${window.location.origin}${window.location.pathname}?doc=${encodeURIComponent(doc.id)}`;
    const done = () => showToast({ title: 'Link Copied', message: `Share link for "${doc.title}" copied to clipboard.`, type: 'success' });
    const fail = () => showToast({ title: 'Copy Failed', message: link, type: 'info' });
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(link).then(done).catch(fail);
    else fail();
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!canUpload) {
      showToast({ title: 'Access Denied', message: 'You do not have upload permission for this category.', type: 'error' });
      return;
    }
    Array.from(files).forEach((file) => {
      const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '');
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        showToast({ title: 'Invalid File Type', message: `${file.name}: Allowed types are PDF, DOCX, XLSX, PNG, JPG, ZIP`, type: 'error' });
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        showToast({ title: 'File Too Large', message: `${file.name}: Maximum size is 25MB`, type: 'error' });
        return;
      }
      addDoc({
        title: file.name,
        fileType: (file.name.split('.').pop() ?? 'FILE').toUpperCase(),
        fileSize: formatBytes(file.size),
        category: activeCategory,
        uploadedBy: user?.name ?? 'Unknown',
        tags: [activeCategory.replace(/_/g, '-')],
      });
      showToast({ title: 'File Uploaded', message: `${file.name} → ${activeCategoryMeta?.label}`, type: 'success' });
      if (activeCategory === 'shared_reference') {
        setNotification(`📢 Notification sent to all users: "${file.name}" is now the current version in the Shared Reference Library. Uploaded by ${user?.name}. Old versions remain in version history.`);
        setTimeout(() => setNotification(null), 8000);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleFlag = (doc: DocRecord) => {
    openFlagForED({ recordLabel: doc.title, sourceModule: 'documents' });
    showToast({ title: 'Flag Window Opened', message: `Raise a flag on "${doc.title}" for the ED.`, type: 'success' });
  };

  if (!user) return <div className="p-8 text-center text-slate-500">Loading documents…</div>;

  return (
    <div className="space-y-6">
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Document Management Hub</h1>
        <p className="text-base font-medium text-white">Central repository across all modules — access governed by role permissions</p>
      </div>

      {notification && (
        <div className="bg-aims-green/10 border border-aims-green/30 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="material-symbols-outlined text-aims-green text-[20px] mt-0.5">campaign</span>
          <p className="text-sm text-slate-800 font-medium">{notification}</p>
        </div>
      )}

      {/* Tailored for you */}
      {persona && (
        <div className="bg-grad-navy rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-aims-mint text-[18px]">person_pin</span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-aims-mint">Tailored for you</p>
          </div>
          <h2 className="text-lg font-extrabold text-white mb-1">{persona.label} Documents</h2>
          <p className="text-sm text-white/90 mb-4">{persona.blurb}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {persona.focus.map((key) => {
              const cat = CATEGORIES.find((c) => c.key === key);
              if (!cat || getCategoryAccess(userRole, key) === 'none') return null;
              return (
                <button key={key} onClick={() => goCategory(key)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-lg text-xs font-bold transition-colors">
                  <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>{cat.label}
                </button>
              );
            })}
          </div>
          {pinnedDocs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {pinnedDocs.map((doc) => (
                <button key={doc.id} onClick={() => goCategory(doc.category)} className="flex items-center gap-2 p-2.5 bg-white/10 hover:bg-white/20 rounded-lg border border-white/15 text-left transition-colors group">
                  <span className={cn('material-symbols-outlined text-[18px] shrink-0', getFileColor(doc.fileType))}>{getFileIcon(doc.fileType)}</span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-white truncate">{doc.title}</span>
                    <span className="block text-[10px] text-white/70">{doc.fileType} • {doc.fileSize}</span>
                  </span>
                  <span className="material-symbols-outlined text-[14px] text-white/60 ml-auto group-hover:text-white transition-colors">arrow_forward</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Category tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200">
          {accessibleCategories.map((cat) => {
            const access = getCategoryAccess(userRole, cat.key);
            const isActive = activeCategory === cat.key;
            const isShared = cat.key === 'shared_reference';
            return (
              <button
                key={cat.key}
                onClick={() => goCategory(cat.key)}
                className={cn('flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors', isActive ? 'border-aims-green text-aims-green bg-aims-green/5' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50')}
              >
                <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                {cat.label}
                {isShared && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-aims-green text-white uppercase">All Roles</span>}
                <span className={cn('text-[8px] font-bold px-1.5 py-0.5 rounded uppercase', ACCESS_BADGE[access].cls)}>{ACCESS_BADGE[access].label}</span>
              </button>
            );
          })}
        </div>

        {/* Category header */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-sm font-bold text-slate-900">{activeCategoryMeta?.label}</p>
            <p className="text-xs text-slate-500">{activeCategoryMeta?.description}</p>
          </div>
          <div className="text-right">
            <span className={cn('text-[10px] font-bold px-2 py-1 rounded uppercase', ACCESS_BADGE[activeAccess].cls)}>Your access: {ACCESS_BADGE[activeAccess].label}</span>
            <p className="text-[10px] text-slate-400 mt-1">
              {activeAccess === 'full' ? 'Upload, delete, download' : activeAccess === 'view' ? 'View + download only' : activeAccess === 'flag' ? 'View, download, comment/flag — no edit' : 'No access'}
            </p>
          </div>
        </div>

        {/* Upload zone */}
        {canUpload && (
          <div className="p-5 border-b border-slate-200">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn('border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all', isDragOver ? 'border-aims-green bg-aims-green/5' : 'border-slate-300 hover:border-aims-green/50 hover:bg-slate-50')}
            >
              <span className={cn('material-symbols-outlined text-[40px] mb-2', isDragOver ? 'text-aims-green' : 'text-slate-400')}>cloud_upload</span>
              <p className="text-sm font-bold text-slate-900 mb-0.5">Drag &amp; drop files here, or click to browse</p>
              <p className="text-xs text-slate-500">Accepted: PDF, DOCX, XLSX, PNG, JPG, ZIP • Max 25MB • Uploading to {activeCategoryMeta?.label}</p>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.zip" onChange={(e) => handleFileUpload(e.target.files)} className="hidden" />
            </div>
          </div>
        )}

        {/* Filters + actions */}
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Search</label>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Title, tag, uploader…" className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30" />
            </div>
            <div className="min-w-[120px]">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">File Type</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30">
                <option value="">All Types</option>
                <option value="PDF">PDF</option><option value="DOCX">DOCX</option><option value="XLSX">XLSX</option><option value="PNG">PNG</option><option value="JPG">JPG</option><option value="ZIP">ZIP</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}</span>
              {selectedIds.size > 0 && <span className="text-xs font-bold text-aims-navy">• {selectedIds.size} selected</span>}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedIds.size > 0 && (
                <>
                  <button onClick={downloadSelected} className="px-3 py-1.5 bg-aims-navy text-white text-[10px] font-bold rounded-lg hover:bg-aims-navy/90 transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">download</span>Download ({selectedIds.size})
                  </button>
                  {canUpload && (
                    <button onClick={deleteSelected} className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-bold rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">delete</span>Delete ({selectedIds.size})
                    </button>
                  )}
                </>
              )}
              <button onClick={() => runExport('csv')} className="px-3 py-1.5 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">download</span>CSV
              </button>
              <button onClick={() => runExport('pdf')} className="px-3 py-1.5 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>PDF
              </button>
            </div>
          </div>
        </div>

        {/* Document table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 w-10"><input type="checkbox" checked={selectedIds.size === filteredDocs.length && filteredDocs.length > 0} onChange={toggleSelectAll} className="rounded border-slate-300 accent-aims-navy" /></th>
                <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Document</th>
                <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Uploaded By</th>
                <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Size</th>
                <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Versions</th>
                <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400 italic">No documents in this category match your filters.</td></tr>
              )}
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className={cn('hover:bg-slate-50 transition-colors', selectedIds.has(doc.id) ? 'bg-blue-50/50' : '')}>
                  <td className="px-4 py-3"><input type="checkbox" checked={selectedIds.has(doc.id)} onChange={() => toggleSelect(doc.id)} className="rounded border-slate-300 accent-aims-navy" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn('material-symbols-outlined text-[20px]', getFileColor(doc.fileType))}>{getFileIcon(doc.fileType)}</span>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{doc.title}</p>
                        <div className="flex gap-1 mt-0.5">{doc.tags.slice(0, 3).map((t) => <span key={t} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{t}</span>)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{doc.uploadedBy}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{formatDate(doc.uploadedAt)}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{doc.fileSize}</td>
                  <td className="px-4 py-3">
                    {doc.versions.length > 1 ? (
                      <button onClick={() => setVersionDocId(versionDocId === doc.id ? null : doc.id)} className="text-xs font-bold text-aims-navy hover:underline flex items-center gap-1">
                        v{doc.versions[0].version} ({doc.versions.length})<span className="material-symbols-outlined text-[14px]">{versionDocId === doc.id ? 'expand_less' : 'expand_more'}</span>
                      </button>
                    ) : (<span className="text-xs text-slate-400">v1</span>)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => downloadRecord(doc)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Download"><span className="material-symbols-outlined text-[18px]">download</span></button>
                      <button onClick={() => setPreviewDoc(doc)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Preview"><span className="material-symbols-outlined text-[18px]">visibility</span></button>
                      {activeAccess === 'flag' && (
                        <button onClick={() => handleFlag(doc)} className="p-1.5 rounded hover:bg-slate-100 text-aims-orange" title="Comment / Flag"><span className="material-symbols-outlined text-[18px]">flag</span></button>
                      )}
                      {activeAccess === 'full' && (
                        <>
                          <button onClick={() => shareDoc(doc)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Share"><span className="material-symbols-outlined text-[18px]">share</span></button>
                          <button onClick={() => { removeDoc(doc.id); setSelectedIds(new Set()); setVersionDocId(null); showToast({ title: 'Deleted', message: doc.title, type: 'success' }); }} className="p-1.5 rounded hover:bg-slate-100 text-red-500" title="Delete"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Version history */}
        {versionDocId && (() => {
          const doc = allDocs.find((d) => d.id === versionDocId);
          if (!doc) return null;
          return (
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Version History — {doc.title}</p>
              <table className="w-full text-xs">
                <thead><tr className="border-b border-slate-200"><th className="pb-1 text-left text-slate-500">Version</th><th className="pb-1 text-left text-slate-500">Uploaded By</th><th className="pb-1 text-left text-slate-500">Date</th><th className="pb-1 text-left text-slate-500">Size</th><th className="pb-1 text-right text-slate-500">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {doc.versions.map((v) => (
                    <tr key={v.version} className="hover:bg-slate-100/50">
                      <td className="py-1.5 font-bold text-slate-900">v{v.version}{v.version === doc.versions[0].version ? ' (current)' : ''}</td>
                      <td className="py-1.5 text-slate-600">{v.uploadedBy}</td>
                      <td className="py-1.5 text-slate-600">{formatDate(v.uploadedAt)}</td>
                      <td className="py-1.5 text-slate-600">{v.size}</td>
                      <td className="py-1.5 text-right"><button onClick={() => downloadRecord({ ...doc, versions: [v], title: `${doc.title.replace(/\.[^.]+$/, '')} v${v.version}${doc.title.match(/\.[^.]+$/)?.[0] ?? ''}` })} className="text-aims-navy font-bold hover:underline">Download</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* Preview modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPreviewDoc(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <button onClick={() => setPreviewDoc(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
            <div className="flex items-start gap-3 mb-5">
              <span className={cn('material-symbols-outlined text-[38px]', getFileColor(previewDoc.fileType))}>{getFileIcon(previewDoc.fileType)}</span>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900 break-words">{previewDoc.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{previewDoc.fileType} • {previewDoc.fileSize} • {formatDate(previewDoc.uploadedAt)}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500">Category</span><span className="font-medium text-slate-800 capitalize">{previewDoc.category.replace(/_/g, ' ')}</span></div>
              <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500">Uploaded By</span><span className="font-medium text-slate-800">{previewDoc.uploadedBy}</span></div>
              <div className="flex justify-between py-1.5 border-b border-slate-100"><span className="text-slate-500">Versions</span><span className="font-medium text-slate-800">{previewDoc.versions.length}</span></div>
              <div className="py-1.5 border-b border-slate-100"><span className="text-slate-500 block">Tags</span><div className="flex gap-1 mt-1 flex-wrap">{previewDoc.tags.map((t) => <span key={t} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{t}</span>)}</div></div>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setPreviewDoc(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Close</button>
              <button onClick={() => downloadRecord(previewDoc)} className="px-4 py-2 bg-aims-navy text-white text-xs font-bold rounded-lg hover:bg-aims-navy/90 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">download</span>Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
