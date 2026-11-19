// src/pages/Attendance.tsx
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { useLiveData } from '@/lib/useLiveData';
import { AttendanceManagement } from '@/components/admin/AttendanceManagement';
import { AttendanceSummary } from '@/components/admin/AttendanceSummary';
import { OFFICE_GEOFENCE, haversineDistance, detectLocalIPv4s, matchesOfficeNetwork } from '@/config/geofence';
import { attendanceGet, recordUserCheckIn, recordUserCheckOut, logGeofenceAttempt } from '@/services/attendanceService';
import { leaveGet } from '@/services/leaveService';
import { PageHero } from '@/components/ui/PageHero';

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

  // ── LIVE personal stats + history (real aims_attendance register) ──
  useLiveData();
  const histRows = attendanceGet.history()
    .filter((h) => h.staffId === user?.id || h.name === user?.name)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((h) => ({
      id: h.id,
      date: h.date,
      checkIn: h.checkIn || '—',
      checkOut: h.checkOut || '—',
      mode: h.mode,
      location: h.mode === 'physical' ? 'ARDHI Office' : h.mode === 'remote' ? 'Remote' : '—',
      status: h.status,
      hours: h.duration ?? '—',
    }));
  const monthPrefix = new Date().toISOString().slice(0, 7);
  const monthRows = histRows.filter((r) => r.date.startsWith(monthPrefix));
  const daysPresent = monthRows.filter((r) => r.status === 'present' || r.status === 'late').length;
  const lateCount = monthRows.filter((r) => r.status === 'late').length;
  const totalHours = monthRows.reduce((sum, r) => {
    const m = r.hours.match(/(\d+(?:\.\d+)?)h(?:\s*(\d+)m)?/i);
    return sum + (m ? Number(m[1]) + (m[2] ? Number(m[2]) / 60 : 0) : 0);
  }, 0);
  const myBalance = leaveGet.balances().find((b) => b.name === user?.name);
  const leaveRemaining = myBalance ? Math.max(0, (myBalance.annual ?? 0) + (myBalance.sick ?? 0) + (myBalance.study ?? 0)) : 0;

  const handleCheckIn = () => {
    if (checkInMode === 'physical') {
      setIsLocating(true);
      setLocationError(null);
      // GPS is the PRIMARY check (0.278316N, 32.613831E); office network is the fallback.
      const tryNetwork = (gpsIssue: string) => {
        detectLocalIPv4s().then((ips) => {
          const officeIp = ips.find((ip) => matchesOfficeNetwork(ip));
          const now = new Date();
          const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          if (officeIp) {
            setIsCheckedIn(true);
            setCheckInTime(timeString);
            recordUserCheckIn(user?.id ?? '', user?.name, 'physical', `ARDHI Office Network (${officeIp})`, true);
            showToast({ title: 'Checked In (Physical)', message: `Office network verified (${officeIp}). Checked in at ${timeString}.`, type: 'success' });
            return;
          }
          setIsLocating(false);
          const finalMsg = `${gpsIssue} and the device is not on the office network (192.168.100.x).`;
          if (user) logGeofenceAttempt(user.id, user.name, -1, finalMsg);
          setLocationError(finalMsg);
          showToast({ title: 'Check-In Blocked', message: finalMsg, type: 'error' });
        });
      };
      if (!navigator.geolocation) {
        tryNetwork('Geolocation is not supported by this browser');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const distance = haversineDistance(latitude, longitude, OFFICE_GEOFENCE.latitude, OFFICE_GEOFENCE.longitude);
          setIsLocating(false);
          if (distance <= OFFICE_GEOFENCE.radiusMeters) {
            // PRIMARY — GPS verified against 0.278316N, 32.613831E
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            setIsCheckedIn(true);
            setCheckInTime(timeString);
            recordUserCheckIn(user?.id ?? '', user?.name, 'physical', 'ARDHI Office, Kampala', true);
            showToast({ title: 'Checked In (Physical)', message: `Location verified within ${OFFICE_GEOFENCE.radiusMeters}m. Checked in at ${timeString}.`, type: 'success' });
          } else {
            // GPS reported a position outside the geofence → blocked (no IP override).
            if (user) logGeofenceAttempt(user.id, user.name, distance, `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`);
            setLocationError(`You must be within ${OFFICE_GEOFENCE.radiusMeters}m of the ARDHI office to check in. You are ${Math.round(distance)}m away.`);
            showToast({ title: 'Outside Office Radius', message: `Physical check-in blocked — ${Math.round(distance)}m from the office.`, type: 'error' });
          }
        },
        (error) => {
          // GPS unavailable/denied/timed out → FALLBACK to the office network.
          let msg = 'Unable to retrieve your location.';
          if (error.code === error.PERMISSION_DENIED) msg = 'Location permission denied.';
          if (error.code === error.POSITION_UNAVAILABLE) msg = 'GPS location unavailable.';
          if (error.code === error.TIMEOUT) msg = 'GPS location request timed out.';
          tryNetwork(msg);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      setIsCheckedIn(true);
      setCheckInTime(timeString);
      recordUserCheckIn(user?.id ?? '', user?.name, 'remote', 'Remote Location', false);
      showToast({ title: 'Checked In (Remote)', message: `Checked in at ${timeString}.`, type: 'success' });
    }
  };

  const handleCheckOut = () => {
    recordUserCheckOut(user?.id ?? '');
    setIsCheckedIn(false);
    setCheckInTime(null);
    setLocationError(null);
    showToast({ title: 'Checked Out', message: 'You have successfully checked out.', type: 'success' });
  };

  const filteredHistory = histRows.filter((r) => {
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  if (!user) return <div className="p-8 text-center text-slate-500">Loading…</div>;

  // Company Admin / ED / SYS_ADMIN see the company-wide management view
  if (['COMPANY_ADMIN', 'ED', 'SYS_ADMIN'].includes(user.role)) {
    return (
      <div className="space-y-6">
        <PageHero title="Attendance Management" subtitle="Company-wide individual-level visibility — presence, records, leave, anomalies & analytics" icon="schedule" />
        <AttendanceManagement />
      </div>
    );
  }

  // Country Director sees aggregate-only summary (no individual records, no export)
  if (user.role === 'CD') {
    return (
      <div className="space-y-6">
        <PageHero title="Attendance" subtitle="Aggregate presence & punctuality trends — summary level" icon="schedule" />
        <AttendanceSummary />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero title="My Attendance" subtitle="Track your daily check-ins, hours, and leave balance" icon="schedule" />

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

      {/* Stats — live from your real attendance register & leave balance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-green p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Days Present</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{daysPresent}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">this month{daysPresent === 0 ? ' · none yet' : ''}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-orange p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Late Arrivals</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{lateCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">this month</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-navy p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Hours</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{Math.round(totalHours)}h</p>
          <p className="text-[10px] text-slate-400 mt-0.5">this month{totalHours === 0 ? ' · none yet' : ''}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-aims-mint p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Leave Balance</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{leaveRemaining}</p>
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