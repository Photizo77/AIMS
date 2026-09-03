// src/components/dashboard/SharedLibraryWidget.tsx
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import { downloadFile } from '@/lib/storage';
import { listDocs, docRecordSheet } from '@/services/docService';
import { exportRecordSheet } from '@/lib/export';

const QUICK_DOCS = [
  { id: 'd18', title: 'Leave Request Form', fileType: 'PDF', size: '120 KB', icon: 'picture_as_pdf', color: 'text-red-500' },
  { id: 'd19', title: 'Requisition Form Template', fileType: 'DOCX', size: '95 KB', icon: 'description', color: 'text-blue-600' },
  { id: 'd20', title: 'Employee Handbook SOP', fileType: 'PDF', size: '3.4 MB', icon: 'picture_as_pdf', color: 'text-red-500' },
  { id: 'd21', title: 'ARDHI Brand Assets', fileType: 'ZIP', size: '18 MB', icon: 'folder_zip', color: 'text-orange-500' },
];

export function SharedLibraryWidget() {
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#286b25] text-[22px]">local_library</span>
          <div>
            <h3 className="text-base font-bold text-slate-900">Shared Reference Library</h3>
            <p className="text-xs text-slate-500">Quick access — available to all roles</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/documents')}
          className="text-xs font-bold text-aims-navy hover:underline flex items-center gap-1"
        >
          Open Hub<span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {QUICK_DOCS.map((doc) => (
          <button
            key={doc.id}
            onClick={() => {
              const real = listDocs().find((d) => d.id === doc.id);
              if (real) {
                downloadFile(`${real.title.replace(/\.[^.]+$/, '')}.txt`, docRecordSheet(real), 'text/plain;charset=utf-8');
              } else {
                exportRecordSheet(doc.title, 'Shared Reference Document', [['Title', doc.title], ['Type', doc.fileType], ['Size', doc.size]]);
              }
              showToast({ title: 'Download Started', message: doc.title, type: 'success' });
            }}
            className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 hover:border-[#286b25]/30 transition-colors text-left group"
          >
            <span className={cn('material-symbols-outlined text-[20px] flex-shrink-0', doc.color)}>
              {doc.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate group-hover:text-[#286b25] transition-colors">
                {doc.title}
              </p>
              <p className="text-[10px] text-slate-400">{doc.fileType} • {doc.size}</p>
            </div>
            <span className="material-symbols-outlined text-[16px] text-slate-300 group-hover:text-[#286b25] flex-shrink-0">
              download
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}