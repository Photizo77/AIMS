// src/components/admin/AttendanceTab.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/NotificationContext';
import type { AttendanceStatus } from '@/types';

type ViewTab = 'register' | 'timesheets';

const MOCK_DAILY: any[] = [
  { id: 'a1', name: 'Nassir Mwanje', checkIn: '08:00', checkOut: '17:00', status: 'present', location: 'On-site (2.7750° N, 32.2986° E)', hours: 9 },
  { id: 'a2', name: 'Amos Ojok', checkIn: '08:45', checkOut: '17:30', status: 'late', location: 'On-site (2.7750° N, 32.2986° E)', hours: 8.75 },
  { id: 'a3', name: 'Sarah Aciro', checkIn: '08:15', checkOut: '16:45', status: 'remote', location: 'Remote (Home Office)', hours: 8.5 },
  { id: 'a4', name: 'Pius Odong', checkIn: '-', checkOut: '-', status: 'absent', location: '-', hours: 0 },
];

const MOCK_TIMESHEETS: any[] = [
  { name: 'Sarah Aciro', mon: 8, tue: 8.5, wed: 8, thu: 9, fri: 8, total: 41.5, status: 'Approved' },
  { name: 'Pius Odong', mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, total: 40, status: 'Pending' },
  { name: 'Amos Ojok', mon: 9, tue: 8.5, wed: 9, thu: 8, fri: 8.5, total: 43, status: 'Approved' },
  { name: 'Grace Aceng', mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, total: 40, status: 'Approved' },
];

const STATUS_STYLES: Record<AttendanceStatus, string> = { 
  present: 'bg-green-100 text-green-700', late: 'bg-yellow-100 text-yellow-700', 
  absent: 'bg-red-100 text-red-700', leave: 'bg-blue-100 text-blue-700', remote: 'bg-purple-100 text-purple-700' 
};

export function AttendanceTab() {
  const { showToast } = useNotifications();
  const [activeView, setActiveView] = useState<ViewTab>('register');
  const [showCheckIn, setShowCheckIn] = useState(false);
  
  // Check-in Modal State
  const [step, setStep] = useState<'choose' | 'fetching' | 'confirm'>('choose');
  const [locationType, setLocationType] = useState<'onsite' | 'remote' | null>(null);
  const [gpsCoords, setGpsCoords] = useState('');

  const handleSelectType = (type: 'onsite' | 'remote') => {
    setLocationType(type);
    if (type === 'remote') {
      setGpsCoords('Remote IP Logged');
      setStep('confirm');
    } else {
      setStep('fetching');
      // Simulate GPS hardware fetch
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
    showToast({ title: 'Attendance Logged', message: `Checked in as ${locationType}.`, type: 'success' });
  };

  const resetModal = () => {
    setShowCheckIn(false);
    setStep('choose');
    setLocationType(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Attendance & Timesheets</h2>
          <p className="text-sm text-slate-500">Monitor daily presence and weekly hours worked</p>
        </div>
        <button onClick={() => setShowCheckIn(true)} className="px-4 py-2 bg-aims-green text-white rounded-lg text-sm font-bold hover:opacity-90 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">fingerprint</span> Check In Now
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveView('register')} className={cn('px-5 py-2 rounded-lg text-sm font-semibold transition-colors', activeView === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>Daily Register</button>
        <button onClick={() => setActiveView('timesheets')} className={cn('px-5 py-2 rounded-lg text-sm font-semibold transition-colors', activeView === 'timesheets' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}>Timesheets</button>
      </div>

      {/* DAILY REGISTER VIEW */}
      {activeView === 'register' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Employee</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Check In/Out</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Location / GPS</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Hours</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
            </tr></thead>
            <tbody>
              {MOCK_DAILY.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-900">{r.name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.checkIn !== '-' ? `${r.checkIn} - ${r.checkOut}` : '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs font-mono">{r.location}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{r.hours > 0 ? `${r.hours}h` : '—'}</td>
                  <td className="px-4 py-3"><span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', STATUS_STYLES[r.status])}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TIMESHEETS VIEW */}
      {activeView === 'timesheets' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-900">Weekly Timesheet (Aug 1 - Aug 5)</h3>
            <button className="text-xs font-bold text-aims-navy hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">download</span> Export PDF
            </button>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <th className="text-left px-4 py-3 font-semibold">Employee</th>
              <th className="text-center px-2 py-3 font-semibold">Mon</th>
              <th className="text-center px-2 py-3 font-semibold">Tue</th>
              <th className="text-center px-2 py-3 font-semibold">Wed</th>
              <th className="text-center px-2 py-3 font-semibold">Thu</th>
              <th className="text-center px-2 py-3 font-semibold">Fri</th>
              <th className="text-center px-4 py-3 font-bold text-slate-900">Total</th>
              <th className="text-center px-4 py-3 font-semibold">Status</th>
            </tr></thead>
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
                    <span className={cn('px-2 py-1 rounded-full text-[10px] font-bold uppercase', t.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2-STEP CHECK-IN MODAL */}
      {showCheckIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={resetModal} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Daily Check-In</h3>
            
            {step === 'choose' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 mb-4">How are you working today?</p>
                <button onClick={() => handleSelectType('onsite')} className="w-full py-4 rounded-xl border-2 border-slate-200 hover:border-aims-green hover:bg-green-50/30 transition-all flex items-center gap-4 px-4">
                  <span className="material-symbols-outlined text-3xl text-aims-green">location_on</span>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">Physical / On-Site</p>
                    <p className="text-xs text-slate-500">Will capture your GPS coordinates</p>
                  </div>
                </button>
                <button onClick={() => handleSelectType('remote')} className="w-full py-4 rounded-xl border-2 border-slate-200 hover:border-aims-navy hover:bg-blue-50/30 transition-all flex items-center gap-4 px-4">
                  <span className="material-symbols-outlined text-3xl text-aims-navy">home</span>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">Remote / WFH</p>
                    <p className="text-xs text-slate-500">Logs IP address instead of GPS</p>
                  </div>
                </button>
              </div>
            )}

            {step === 'fetching' && (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 border-4 border-aims-green border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-slate-900">Capturing GPS Coordinates...</p>
                <p className="text-xs text-slate-500 mt-1">Please ensure location services are enabled.</p>
              </div>
            )}

            {step === 'confirm' && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Location Verified</p>
                  <p className="text-sm font-mono font-bold text-slate-900">{gpsCoords}</p>
                  <p className="text-xs text-slate-500 mt-1">Type: <span className="font-bold capitalize">{locationType}</span></p>
                </div>
                <div className="flex gap-3">
                  <button onClick={resetModal} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600">Cancel</button>
                  <button onClick={handleFinalCheckIn} className="flex-1 py-2.5 bg-aims-green text-white rounded-lg text-sm font-bold">Confirm & Clock In</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}