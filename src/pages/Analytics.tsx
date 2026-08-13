// src/pages/Analytics.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';

type ReportPeriod = 'monthly' | 'quarterly' | 'annual';

export function Analytics() {
  const { showToast } = useNotifications();
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      showToast({ title: 'Report Generated', message: `Your ${period} report is ready for download.`, type: 'success' });
    }, 2000);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Analytics & Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Performance metrics and automated report generation</p>
      </div>

      {/* REPORT GENERATOR */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-aims-navy text-[24px]">summarize</span>
          <h2 className="text-base font-bold text-slate-900">Generate Report</h2>
        </div>
        <p className="text-sm text-slate-600 mb-4">Automatically compile performance data, financial summaries, and activity logs into a formatted report.</p>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Time Period</label>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {(['monthly', 'quarterly', 'annual'] as ReportPeriod[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)} className={cn('flex-1 py-2.5 rounded-lg text-sm font-bold capitalize transition-colors', period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>{p}</button>
              ))}
            </div>
          </div>
          <button onClick={handleGenerate} disabled={generating} className={cn('px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all', generating ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-aims-navy text-white hover:opacity-90')}>
            {generating ? (<><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Generating...</>) : (<><span className="material-symbols-outlined text-[18px]">download</span>Generate Report</>)}
          </button>
        </div>
      </div>

      {/* METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Grants Submitted', value: '12', change: '+3 vs last period', positive: true },
          { label: 'Total Revenue', value: 'UGX 1.2B', change: '+18% vs last period', positive: true },
          { label: 'Staff Retention', value: '94%', change: '-1% vs last period', positive: false },
          { label: 'Avg. Approval Time', value: '3.2 days', change: '-0.8 days improvement', positive: true },
        ].map((m, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">{m.label}</p>
            <p className="text-2xl font-extrabold text-slate-900">{m.value}</p>
            <p className={cn('text-xs font-bold mt-1', m.positive ? 'text-aims-green' : 'text-aims-orange')}>{m.change}</p>
          </div>
        ))}
      </div>
    </div>
  );
}