import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import type { AttendanceRecord, AttendanceStatus } from '@/types';

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: 'att-1', employeeId: 'user-emp-001', employeeName: 'Lucy Wanjiku', date: '2026-08-05', checkIn: '08:15', checkOut: '17:02', status: 'present' },
  { id: 'att-2', employeeId: 'user-finance-001', employeeName: 'James Odhiambo', date: '2026-08-05', checkIn: '08:45', checkOut: '17:30', status: 'late' },
  { id: 'att-3', employeeId: 'user-grant-001', employeeName: 'Fatima Hassan', date: '2026-08-05', checkIn: '08:00', checkOut: '16:55', status: 'present' },
  { id: 'att-4', employeeId: 'user-innov-001', employeeName: 'Kevin Njoroge', date: '2026-08-05', status: 'remote' },
  { id: 'att-5', employeeId: 'user-emp-002', employeeName: 'Peter Kamau', date: '2026-08-05', status: 'absent' },
  { id: 'att-6', employeeId: 'user-emp-003', employeeName: 'Grace Achieng', date: '2026-08-05', status: 'leave' },
];

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: 'bg-green-100 text-green-700',
  late: 'bg-yellow-100 text-yellow-700',
  absent: 'bg-red-100 text-red-700',
  leave: 'bg-blue-100 text-blue-700',
  remote: 'bg-purple-100 text-purple-700',
};

export function AttendanceTab() {
  const { showToast } = useNotifications();
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = MOCK_ATTENDANCE.filter((record) => {
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    const matchesSearch = record.employeeName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleGenerateReport = () => {
    showToast({
      title: 'Report Generated',
      message: 'Attendance report for August 2026 has been generated and is ready for download.',
      type: 'success',
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Attendance Oversight</h2>
          <p className="text-sm text-gray-500">Monitor and generate attendance reports</p>
        </div>
        <button
          onClick={handleGenerateReport}
          className="px-4 py-2 bg-aims-mint text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Generate Report
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search employee..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aims-mint/50"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as AttendanceStatus | 'all')}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aims-mint/50"
        >
          <option value="all">All Statuses</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
          <option value="leave">On Leave</option>
          <option value="remote">Remote</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Check In</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Check Out</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((record) => (
              <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{record.employeeName}</td>
                <td className="px-4 py-3 text-gray-600">{record.date}</td>
                <td className="px-4 py-3 text-gray-600">{record.checkIn || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{record.checkOut || '—'}</td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', STATUS_STYLES[record.status])}>
                    {record.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}