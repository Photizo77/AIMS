// src/components/admin/AttendanceTab.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import type { AttendanceStatus } from '@/types';

type ViewTab = 'register' | 'timesheets';

interface DailyRecord {
  id: string; name: string; position: string; department: string;
  checkIn: string; checkOut: string; status: AttendanceStatus; location: string; hours: number;
}

const MOCK_DAILY: DailyRecord[] = [
  { id: 'a1', name: 'Nassir Mwanje', position: 'Country Director', department: 'Executive', checkIn: '08:00', checkOut: '17:00', status: 'present', location: 'On-site (2.7750° N, 32.2986° E)', hours: 9 },
  { id: 'a2', name: 'Amos Ojok', position: 'Finance Officer', department: 'Finance', checkIn: '08:45', checkOut: '17:30', status: 'late', location: 'On-site (2.7750° N, 32.2986° E)', hours: 8.75 },
  { id: 'a3', name: 'Sarah Aciro', position: 'Grants Manager', department: 'Grants', checkIn: '08:15', checkOut: '16:45', status: 'remote', location: 'Remote (IP: 197.239.xx.xx)', hours: 8.5 },
  { id: 'a4', name: 'Pius Odong', position: 'Innovator', department: 'Innovation', checkIn: '-', checkOut: '-', status: 'absent', location: '-', hours: 0 },
  { id: 'a5', name: 'Grace Aceng', position: 'Company Admin', department: 'Administration', checkIn: '07:55', checkOut: '17:15', status: 'present', location: 'On-site (2.7750° N, 32.2986° E)', hours: 9.3 },
  { id: 'a6', name: 'Janet Apio', position: 'Grant Writer', department: 'Grants', checkIn: '-', checkOut: '-', status: 'leave', location: '-', hours: 0 },
];

const MOCK_TIMESHEETS: any[] = [
  { name: 'Sarah Aciro', mon: 8, tue: 8.5, wed: 8, thu: 9, fri: 8, total: 41.5, status: 'Approved' },
  { name: 'Pius Odong', mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, total: 40, status: 'Pending' },
  { name: 'Amos Ojok', mon: 9, tue: 8.5, wed: 9, thu: 8, fri: 8.5, total: 43, status: 'Approved' },
  { name: 'Grace Aceng', mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, total: 40, status: 'Approved' },
  { name: 'Nassir Mwanje', mon: 9, tue: 9, wed: 8.5, thu: 9, fri: 8.5, total: 44, status: 'Approved' },
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
  const [activeView, setActiveView] = useState<ViewTab>('register');
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [step, setStep] = useState<'choose' | 'fetching' | 'confirm'>('choose');
  const [locationType, setLocationType] = useState<'onsite' | 'remote' | null>(null);
  const [gpsCoords, setGpsCoords] = useState('');

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterCheckType, setFilterCheckType] = useState<string>('all');

  const filteredDaily = MOCK_DAILY.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesDept = filterDept === 'all' || r.department === filterDept;
    const matchesDate = !filterDate || r.checkIn !== '-';
    const matchesCheck = filterCheckType === 'all' || (filterCheckType === 'checked_in' ? r.checkIn !== '-' : r.checkIn === '-');
    return matchesStatus && matchesDept && matchesDate && matchesCheck;
  });

  const handleSelectType = (type: 'onsite' | 'remote') => {
    setLocationType(type);
    if (type === 'remote') {
      setGpsCoords('Remote IP: 197.239.xx.xx (Kampala)');
      setStep('confirm');
    } else {
      setStep('fetching');
      setTimeout(() => {
        setGpsCoords('2.7750° N, 32.2986° E (Gulu Main Campus)');
        setStep('confirm');
      }, 1500);
    }
  };

  const handleFinalCheckIn = () => {
    setShowCheckIn(false);
    setStep('choose');
    setLocationType(null);
    setGpsCoords('');
    showToast({ title: 'Attendance Logged', message: `Checked in as ${locationType}.`, type: 'success' });
  };

  const resetModal = () => {
    setShowCheckIn(false);
    setStep('choose');
    setLocationType(null);
    setGpsCoords('');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Attendance & Timesheets</h2>
          <p className="text-sm text-slate-500">Monitor daily presence and weekly hours worked</p>
        </div>
        <button onClick={() => setShowCheckIn(true)} className="px-4 py-2 bg-aims-green text-white rounded-lg text-sm font-bold hover:opacity-90 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">fingerprint</span>Check In Now
        </button>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveView('register')} className={cn('px-5 py-2 rounded-lg text-sm font-semibold transition-colors', activeView === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>Daily Register</button>
        <button onClick={() => setActiveView('timesheets')} className={cn('px-5 py-2 rounded-lg text-sm font-semibold transition-colors', activeView === 'timesheets' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>Timesheets</button>
      </div>

      {activeView === 'register' && (
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="all">All Statuses</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="remote">Remote</option>
                <option value="absent">Absent</option>
                <option value="leave">Leave</option>
              </select>
              <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="all">All Departments</option>
                <option>Executive</option>
                <option>Finance</option>
                <option>Grants</option>
                <option>Administration</option>
                <option>Innovation</option>
              </select>
              <select value={filterCheckType} onChange={(e) => setFilterCheckType(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="all">All Records</option>
                <option value="checked_in">Checked In</option>
                <option value="not_checked_in">Not Checked In</option>
              </select>
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Employee</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Position</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Check In/Out</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Location / GPS</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Hours</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDaily.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{r.name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{r.position}</td>
                    <td className="px-4 py-3 text-slate-600">{r.checkIn !== '-' ? `${r.checkIn} - ${r.checkOut}` : '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono">{r.location}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{r.hours > 0 ? `${r.hours}h` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', STATUS_STYLES[r.status])}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === 'timesheets' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Weekly Timesheet (Aug 1 - Aug 5)</h3>
            <button className="text-xs font-bold text-aims-navy hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">download</span>Export PDF
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="text-left px-4 py-3 font-semibold">Employee</th>
                <th className="text-center px-2 py-3 font-semibold">Mon</th>
                <th className="text-center px-2 py-3 font-semibold">Tue</th>
                <th className="text-center px-2 py-3 font-semibold">Wed</th>
                <th className="text-center px-2 py-3 font-semibold">Thu</th>
                <th className="text-center px-2 py-3 font-semibold">Fri</th>
                <th className="text-center px-4 py-3 font-bold text-slate-900">Total</th>
                <th className="text-center px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TIMESHEETS.map((t, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-900">{t.name}</td>
                  <td className="text-center px-2 py-3 text-slate-600">{t.mon}h</td>
                  <td className="text-center px-2 py-3 text-slate-600">{t.tue}h</td>
                  <td className="text-center px-2 py-3 text-slate-600">{t.wed}h</td>
                  <td className="text-center px-2 py-3 text-slate-600">{t.thu}h</td>
                  <td className="text-center px-2 py-3 text-slate-600">{t.fri}h</td>
                  <td className="text-center px-4 py-3 font-extrabold text-aims-navy">{t.total}h</td>
                  <td className="text-center px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-[10px] font-bold uppercase', t.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CHECK-IN MODAL — Opens directly to Remote/Physical choice */}
      {showCheckIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={resetModal} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <button onClick={resetModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <span className="material-symbols-outlined">close</span>
            </button>

            {step === 'choose' && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Daily Check-In</h3>
                <p className="text-sm text-slate-500 mb-5">How are you working today?</p>
                <div className="space-y-3">
                  <button onClick={() => handleSelectType('onsite')} className="w-full py-4 rounded-xl border-2 border-slate-200 hover:border-aims-green hover:bg-green-50/30 transition-all flex items-center gap-4 px-4 group">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-aims-green transition-colors">
                      <span className="material-symbols-outlined text-2xl text-aims-green group-hover:text-white transition-colors">location_on</span>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900">Physical / On-Site</p>
                      <p className="text-xs text-slate-500">Captures GPS coordinates automatically</p>
                    </div>
                  </button>
                  <button onClick={() => handleSelectType('remote')} className="w-full py-4 rounded-xl border-2 border-slate-200 hover:border-aims-navy hover:bg-blue-50/30 transition-all flex items-center gap-4 px-4 group">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-aims-navy transition-colors">
                      <span className="material-symbols-outlined text-2xl text-aims-navy group-hover:text-white transition-colors">home</span>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900">Remote / WFH</p>
                      <p className="text-xs text-slate-500">Logs IP address instead of GPS</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {step === 'fetching' && (
              <div className="py-10 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 border-4 border-aims-green border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-slate-900 text-base">Capturing GPS Coordinates...</p>
                <p className="text-xs text-slate-500 mt-1">Please ensure location services are enabled.</p>
              </div>
            )}

            {step === 'confirm' && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Confirm Check-In</h3>
                <div className="bg-aims-navy p-4 rounded-xl mb-4">
                  <p className="text-[10px] font-bold text-white/60 uppercase mb-1">Location Verified</p>
                  <p className="text-sm font-mono font-bold text-white">{gpsCoords}</p>
                  <p className="text-xs text-white/70 mt-1">Type: <span className="font-bold capitalize text-white">{locationType}</span></p>
                </div>
                <div className="flex gap-3">
                  <button onClick={resetModal} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button onClick={handleFinalCheckIn} className="flex-1 py-2.5 bg-aims-green text-white rounded-lg text-sm font-bold hover:opacity-90">Confirm & Clock In</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}