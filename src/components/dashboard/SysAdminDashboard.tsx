// src/components/dashboard/SysAdminDashboard.tsx
// ============================================================
// AIMS — System Admin Technical Dashboard
// ============================================================

import { cn } from '@/lib/utils';

interface SystemLog {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

const MOCK_LOGS: SystemLog[] = [
  { id: 'log-1', type: 'info', message: 'User "Sarah Kimani" logged in successfully', timestamp: '2026-08-05 09:15:23' },
  { id: 'log-2', type: 'warning', message: 'API rate limit approaching for Claude AI model', timestamp: '2026-08-05 08:42:11' },
  { id: 'log-3', type: 'error', message: 'Failed login attempt for email: unknown@test.com', timestamp: '2026-08-05 08:15:02' },
  { id: 'log-4', type: 'info', message: 'System backup completed successfully', timestamp: '2026-08-05 02:00:00' },
  { id: 'log-5', type: 'info', message: 'User "David Mwangi" approved requisition #req-2', timestamp: '2026-08-04 16:30:45' },
];

const LOG_ICONS: Record<string, string> = {
  info: 'info',
  warning: 'warning',
  error: 'error',
};

const LOG_COLORS: Record<string, string> = {
  info: 'text-blue-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
};

export function SysAdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Active Users" value="24" icon="people" color="text-green-600" />
        <StatCard label="API Calls Today" value="1,847" icon="api" color="text-blue-600" />
        <StatCard label="Failed Logins (24h)" value="3" icon="block" color="text-red-600" />
        <StatCard label="System Uptime" value="99.9%" icon="check_circle" color="text-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">memory</span>
            AI Model Integration
          </h3>
          <div className="space-y-3">
            <AIModelStatus name="Claude" status="healthy" usage="67%" />
            <AIModelStatus name="Kimi-3" status="healthy" usage="23%" />
            <AIModelStatus name="Qwen" status="healthy" usage="45%" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">list</span>
            Recent System Logs
          </h3>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {MOCK_LOGS.map((log) => (
              <div key={log.id} className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
                <span className={cn('material-symbols-outlined text-[16px] mt-0.5', LOG_COLORS[log.type])}>
                  {LOG_ICONS[log.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 leading-tight">{log.message}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{log.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className={cn('material-symbols-outlined text-[20px]', color)}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function AIModelStatus({ name, status, usage }: { name: string; status: string; usage: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2">
        <span className={cn('w-2 h-2 rounded-full', status === 'healthy' ? 'bg-green-500' : 'bg-red-500')} />
        <span className="text-sm font-medium text-gray-800">{name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">Usage: {usage}</span>
        <span className="text-xs text-green-600 font-medium capitalize">{status}</span>
      </div>
    </div>
  );
}