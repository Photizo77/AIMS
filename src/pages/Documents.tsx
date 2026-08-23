// src/pages/Documents.tsx
import { useState, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';

type DocCategory = 'governance' | 'hr_contracts' | 'finance_procurement' | 'grants' | 'grants_resource' | 'innovations' | 'inventory_policy' | 'system_security' | 'shared_reference';
type AccessLevel = 'full' | 'view' | 'flag' | 'none';

const CATEGORIES: { key: DocCategory; label: string; icon: string; description: string }[] = [
  { key: 'governance', label: 'Governance', icon: 'gavel', description: 'Board minutes, compliance policies, institutional announcements' },
  { key: 'hr_contracts', label: 'HR & Contracts', icon: 'badge', description: 'Employee contracts, appraisal forms, employee profiles' },
  { key: 'finance_procurement', label: 'Finance & Procurement', icon: 'account_balance', description: 'Requisition backup, receipts, budget sheets, procurement records' },
  { key: 'grants', label: 'Grants', icon: 'volunteer_activism', description: 'Proposal drafts, budgets, funder correspondence, award letters' },
  { key: 'grants_resource', label: 'Grants Resource Library', icon: 'menu_book', description: 'Proposal & budget templates, funder guidelines, ARDHI boilerplate' },
  { key: 'innovations', label: 'Innovations', icon: 'lightbulb', description: 'Feasibility studies, technical docs, prototypes, research' },
  { key: 'inventory_policy', label: 'Inventory & Policy', icon: 'inventory_2', description: 'Low-stock records, operational policy storage' },
  { key: 'system_security', label: 'System & Security', icon: 'shield', description: 'Audit logs, access logs, config exports' },
  { key: 'shared_reference', label: 'Shared Reference Library', icon: 'local_library', description: 'Meeting minutes, policies, leave forms, requisition & contract templates, SOPs, brand assets' },
];

// ── Visibility Matrix (F/V/Flag/none) ──
function getCategoryAccess(role: string, category: DocCategory): AccessLevel {
  const matrix: Record<string, Record<DocCategory, AccessLevel>> = {
    CD: { governance: 'full', hr_contracts: 'flag', finance_procurement: 'flag', grants: 'view', grants_resource: 'view', innovations: 'flag', inventory_policy: 'flag', system_security: 'none', shared_reference: 'full' },
    ED: { governance: 'full', hr_contracts: 'full', finance_procurement: 'full', grants: 'full', grants_resource: 'full', innovations: 'full', inventory_policy: 'full', system_security: 'view', shared_reference: 'full' },
    COMPANY_ADMIN: { governance: 'view', hr_contracts: 'full', finance_procurement: 'none', grants: 'none', grants_resource: 'none', innovations: 'none', inventory_policy: 'full', system_security: 'none', shared_reference: 'full' },
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

interface DocumentVersion { version: number; uploadedBy: string; uploadedAt: string; size: string; }
interface DocRecord {
  id: string; title: string; fileType: string; fileSize: string; category: DocCategory;
  uploadedBy: string; uploadedAt: string; versions: DocumentVersion[]; tags: string[];
}

const MOCK_DOCUMENTS: DocRecord[] = [
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
  const [isDragOver, setIsDragOver] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userRole = user?.role ?? '';

  // Categories the user can access (any level other than none)
  const accessibleCategories = useMemo(() =>
    CATEGORIES.filter((c) => getCategoryAccess(userRole, c.key) !== 'none'),
  [userRole]);

  const [activeCategory, setActiveCategory] = useState<DocCategory>(accessibleCategories[0]?.key ?? 'shared_reference');

  const activeAccess = getCategoryAccess(userRole, activeCategory);
  const canUpload = activeAccess === 'full';
  const activeCategoryMeta = CATEGORIES.find((c) => c.key === activeCategory);

  const filteredDocs = useMemo(() => {
    return MOCK_DOCUMENTS.filter((doc) => {
      if (doc.category !== activeCategory) return false;
      if (filterType && doc.fileType !== filterType) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return doc.title.toLowerCase().includes(q) || doc.tags.some((t) => t.toLowerCase().includes(q)) || doc.uploadedBy.toLowerCase().includes(q);
    }).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [activeCategory, searchQuery, filterType]);

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
      showToast({ title: 'File Uploaded', message: `${file.name} → ${activeCategoryMeta?.label}`, type: 'success' });

      // Shared Reference Library notification rule
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

  const handleDownloadZip = () => {
    if (selectedIds.size === 0) {
      showToast({ title: 'No Files Selected', message: 'Select files to download as ZIP.', type: 'error' });
      return;
    }
    showToast({ title: 'Downloading ZIP', message: `${selectedIds.size} file(s) being packaged…`, type: 'success' });
    setSelectedIds(new Set());
  };

  const handleFlag = (doc: DocRecord) => {
    showToast({ title: 'Flag Submitted', message: `Your flag on "${doc.title}" was routed to the ED.`, type: 'success' });
  };

  if (!user) return <div className="p-8 text-center text-slate-500">Loading documents…</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">Document Management Hub</h1>
        <p className="text-base font-medium text-white">Central repository across all modules — access governed by role permissions</p>
      </div>

      {/* Shared Reference notification banner */}
      {notification && (
        <div className="bg-aims-green/10 border border-aims-green/30 rounded-xl px-4 py-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="material-symbols-outlined text-aims-green text-[20px] mt-0.5">campaign</span>
          <p className="text-sm text-slate-800 font-medium">{notification}</p>
        </div>
      )}

      {/* Category Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-200">
          {accessibleCategories.map((cat) => {
            const access = getCategoryAccess(userRole, cat.key);
            const isActive = activeCategory === cat.key;
            const isShared = cat.key === 'shared_reference';
            return (
              <button
                key={cat.key}
                onClick={() => { setActiveCategory(cat.key); setSelectedIds(new Set()); setVersionDocId(null); }}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors',
                  isActive ? 'border-aims-green text-aims-green bg-aims-green/5' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                )}
              >
                <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                {cat.label}
                {isShared && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-aims-green text-white uppercase">All Roles</span>}
                <span className={cn('text-[8px] font-bold px-1.5 py-0.5 rounded uppercase', ACCESS_BADGE[access].cls)}>{ACCESS_BADGE[access].label}</span>
              </button>
            );
          })}
        </div>

        {/* Active category description + permission note */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-sm font-bold text-slate-900">{activeCategoryMeta?.label}</p>
            <p className="text-xs text-slate-500">{activeCategoryMeta?.description}</p>
          </div>
          <div className="text-right">
            <span className={cn('text-[10px] font-bold px-2 py-1 rounded uppercase', ACCESS_BADGE[activeAccess].cls)}>
              Your access: {ACCESS_BADGE[activeAccess].label}
            </span>
            <p className="text-[10px] text-slate-400 mt-1">
              {activeAccess === 'full' ? 'Upload, edit, delete' : activeAccess === 'view' ? 'View + download only' : activeAccess === 'flag' ? 'View, download, comment/flag — no edit' : 'No access'}
            </p>
          </div>
        </div>

        {/* Upload zone — only for full access */}
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
              <p className="text-sm font-bold text-slate-900 mb-0.5">Drag & drop files here, or click to browse</p>
              <p className="text-xs text-slate-500">Accepted: PDF, DOCX, XLSX, PNG, JPG, ZIP • Max 25MB • Uploading to {activeCategoryMeta?.label}</p>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.zip" onChange={(e) => handleFileUpload(e.target.files)} className="hidden" />
            </div>
          </div>
        )}

        {/* Filters + Actions */}
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
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}</span>
              {selectedIds.size > 0 && <span className="text-xs font-bold text-aims-navy">• {selectedIds.size} selected</span>}
            </div>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <button onClick={handleDownloadZip} className="px-3 py-1.5 bg-aims-navy text-white text-[10px] font-bold rounded-lg hover:bg-aims-navy/90 transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">folder_zip</span>Download ZIP ({selectedIds.size})
                </button>
              )}
              <button onClick={() => showToast({ title: 'Exporting CSV', message: `${filteredDocs.length} documents exported.`, type: 'success' })} className="px-3 py-1.5 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">download</span>CSV
              </button>
              <button onClick={() => showToast({ title: 'Exporting PDF', message: `${filteredDocs.length} documents exported.`, type: 'success' })} className="px-3 py-1.5 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>PDF
              </button>
            </div>
          </div>
        </div>

        {/* Document Table */}
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
                    ) : (
                      <span className="text-xs text-slate-400">v1</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => showToast({ title: 'Downloading', message: doc.title, type: 'success' })} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Download"><span className="material-symbols-outlined text-[18px]">download</span></button>
                      <button onClick={() => showToast({ title: 'Preview', message: doc.title, type: 'info' })} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Preview"><span className="material-symbols-outlined text-[18px]">visibility</span></button>
                      {/* Flag/comment for 'flag' access */}
                      {activeAccess === 'flag' && (
                        <button onClick={() => handleFlag(doc)} className="p-1.5 rounded hover:bg-slate-100 text-aims-orange" title="Comment / Flag"><span className="material-symbols-outlined text-[18px]">flag</span></button>
                      )}
                      {/* Edit/delete only for 'full' access */}
                      {activeAccess === 'full' && (
                        <>
                          <button onClick={() => showToast({ title: 'Share Link Copied', message: doc.title, type: 'success' })} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" title="Share"><span className="material-symbols-outlined text-[18px]">share</span></button>
                          <button onClick={() => showToast({ title: 'Deleted', message: doc.title, type: 'success' })} className="p-1.5 rounded hover:bg-slate-100 text-red-500" title="Delete"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Version History */}
        {versionDocId && (() => {
          const doc = MOCK_DOCUMENTS.find((d) => d.id === versionDocId);
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
                      <td className="py-1.5 text-right"><button onClick={() => showToast({ title: 'Downloading v' + v.version, message: doc.title, type: 'success' })} className="text-aims-navy font-bold hover:underline">Download</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
  );
}