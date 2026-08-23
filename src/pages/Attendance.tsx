// src/pages/Attendance.tsx
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';

// Office location (updated coordinates)
const OFFICE_LAT = 0.2925;
const OFFICE_LNG = 32.5979;
const MAX_RADIUS_METERS = 150;

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  mode: 'physical' | 'remote';
  location: string;
  status: 'present' | 'late' | 'absent' | 'leave';
  hours: string;
}

const MOCK_HISTORY: AttendanceRecord[] = [
  { id: 'a1', date: '2026-08-22', checkIn: '07:58', checkOut: '17:02', mode: 'physical', location: 'ARDHI Office, Kampala', status: 'present', hours: '9h 4m' },
  { id: 'a2', date: '2026-08-21', checkIn: '08:15', checkOut: '17:30', mode: 'remote', location: 'Plot 45, Kira Road', status: 'late', hours: '9h 15m' },
  { id: 'a3', date: '2026-08-20', checkIn: '07:52', checkOut: '16:45', mode: 'physical', location: 'ARDHI Office, Kampala', status: 'present', hours: '8h 53m' },
  { id: 'a4', date: '2026-08-19', checkIn: '', checkOut: null, mode: 'physical', location: '', status: 'leave', hours: '—' },
  { id: 'a5', date: '2026-08-18', checkIn: '07:55', checkOut: '17:10', mode: 'physical', location: 'ARDHI Office, Kampala', status: 'present', hours: '9h 15m' },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  present: { label: 'Present', cls: 'bg-aims-green/15 text-aims-green' },
  late: { label: 'Late', cls: 'bg-aims-orange/15 text-aims-orange' },
  absent: { label: 'Absent', cls: 'bg-red-100 text-red-600' },
  leave: { label: 'On Leave', cls: 'bg-slate-100 text-slate-600' },
};

export function Attendance() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkInMode, setCheckInMode] = useState<'physical' | 'remote'>('physical');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');

  const handleCheckIn = () => {
    if (checkInMode === 'physical') {
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by your browser.');
        showToast({ title: 'Location Unavailable', message: 'Your browser does not support GPS.', type: 'error' });
        return;
      }
      setIsLocating(true);
      setLocationError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const distance = getDistanceMeters(latitude, longitude, OFFICE_LAT, OFFICE_LNG);
          setIsLocating(false);
          if (distance <= MAX_RADIUS_METERS) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            setIsCheckedIn(true);
            setCheckInTime(timeString);
            showToast({ title: 'Checked In (Physical)', message: `Location verified. Checked in at ${timeString}.`, type: 'success' });
          } else {
            setLocationError(`You are ${Math.round(distance)}m from the office. Physical check-in requires you to be within ${MAX_RADIUS_METERS}m.`);
            showToast({ title: 'Outside Office Radius', message: `You are ${Math.round(distance)}m away. Move closer to check in physically.`, type: 'error' });
          }
        },
        (error) => {
          setIsLocating(false);
          let msg = 'Unable to retrieve your location.';
          if (error.code === error.PERMISSION_DENIED) msg = 'Location permission denied. Please allow location access.';
          if (error.code === error.POSITION_UNAVAILABLE) msg = 'Location information unavailable.';
          if (error.code === error.TIMEOUT) msg = 'Location request timed out.';
          setLocationError(msg);
          showToast({ title: 'Location Error', message: msg, type: 'error' });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      setIsCheckedIn(true);
      setCheckInTime(timeString);
      showToast({ title: 'Checked In (Remote)', message: `Checked in at ${timeString}.`, type: 'success' });
    }
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
    setCheckInTime(null);
    setLocationError(null);
    showToast({ title: 'Checked Out', message: 'You have successfully checked out.', type: 'success' });
  };

  const filteredHistory = MOCK_HISTORY.filter((r) => {
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  if (!user) return <div className="p-8 text-center text-slate-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="bg-grad-navy rounded-2xl p-7 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1.5">My Attendance</h1>
        <p className="text-base font-medium text-white">Track your daily check-ins, hours, and leave balance</p>
      </div>

      {/* Check-In Card */}
      <div className="bg-white border border-slate-200 border-t-4 border-t-aims-orange rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-aims-orange/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-aims-orange text-[24px]">
                {isCheckedIn ? 'check_circle' : 'schedule'}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                {isCheckedIn ? 'Current Status' : 'Daily Attendance'}
              </p>
              <p className="text-lg font-extrabold text-slate-900 tracking-tight">
                {isCheckedIn ? `Checked In at ${checkInTime}` : 'Ready to check in?'}
              </p>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 items-end">
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => { setCheckInMode('physical'); setLocationError(null); }}
                className={cn('px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1',
                  checkInMode === 'physical' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
              >
                <span className="material-symbols-outlined text-[14px]">location_on</span>Physical
              </button>
              <button
                onClick={() => { setCheckInMode('remote'); setLocationError(null); }}
                className={cn('px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1',
                  checkInMode === 'remote' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
              >
                <span className="material-symbols-outlined text-[14px]">home</span>Remote
              </button>
            </div>

            {locationError && (
              <p className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 max-w-[280px] text-right">
                {locationError}
              </p>
            )}

            {!isCheckedIn ? (
              <button
                onClick={handleCheckIn}
                disabled={isLocating}
                className={cn('px-6 py-2.5 text-sm font-bold rounded-lg transition-colors shadow-sm flex items-center gap-2',
                  isLocating ? 'bg-slate-100 text-slate-400 cursor-wait' : 'bg-aims-green text-white hover:bg-aims-green/90')}
              >
                {isLocating ? (
                  <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Locating…</>
                ) : (
                  <><span className="material-symbols-outlined text-[18px]">login</span>Check In Now</>
                )}
              </button>
            ) : (
              <button
                onClick={handleCheckOut}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>Check Out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-green p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Days Present</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">18</p>
          <p className="text-[10px] text-slate-400 mt-0.5">this month</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-orange p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Late Arrivals</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">2</p>
          <p className="text-[10px] text-slate-400 mt-0.5">this month</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-navy p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Hours</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">162h</p>
          <p className="text-[10px] text-slate-400 mt-0.5">this month</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-mint p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Leave Balance</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">12</p>
          <p className="text-[10px] text-slate-400 mt-0.5">days remaining</p>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">Attendance History</h3>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-aims-navy/30"
          >
            <option value="">All statuses</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
            <option value="leave">On Leave</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Date</th>
                <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Check In</th>
                <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Check Out</th>
                <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Mode</th>
                <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Location</th>
                <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                <th className="pb-2 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400 italic">
                    No attendance records match your filter.
                  </td>
                </tr>
              )}
              {filteredHistory.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 font-bold text-slate-900">
                    {new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="py-2.5 text-slate-600 font-mono text-xs">{r.checkIn || '—'}</td>
                  <td className="py-2.5 text-slate-600 font-mono text-xs">{r.checkOut || '—'}</td>
                  <td className="py-2.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">
                      {r.mode}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-600 text-xs truncate max-w-[180px]">{r.location || '—'}</td>
                  <td className="py-2.5">
                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase', STATUS_BADGE[r.status].cls)}>
                      {STATUS_BADGE[r.status].label}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-bold text-slate-900 text-xs">{r.hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}