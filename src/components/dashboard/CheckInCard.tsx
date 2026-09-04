// src/components/dashboard/CheckInCard.tsx
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAttendance } from '@/context/AttendanceContext';
import { cn } from '@/lib/utils';
import { logGeofenceAttempt } from '@/services/attendanceService';

// Office geofence: 0°19'12.0"N, 32°34'48.0"E — 200 metre radius
const OFFICE_LAT = 0.32;
const OFFICE_LNG = 32.58;
const MAX_RADIUS_METERS = 200;

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function CheckInCard() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const { isCheckedIn, checkInTime, checkInMode, location, locationVerified, checkIn, checkOut } = useAttendance();
  const [selectedMode, setSelectedMode] = useState<'physical' | 'remote'>('physical');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleCheckIn = () => {
    if (selectedMode === 'physical') {
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
            checkIn('physical', 'ARDHI Office, Kampala', true);
          } else {
            // BLOCKED — log the failed attempt (appears in Attendance → Anomalies & Violations)
            if (user) logGeofenceAttempt(user.id, user.name, distance, `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`);
            setLocationError(`You must be within ${MAX_RADIUS_METERS}m of the ARDHI office to check in. You are ${Math.round(distance)}m away.`);
            showToast({ title: 'Outside Office Radius', message: `Physical check-in blocked — you are ${Math.round(distance)}m from the office (limit 200m).`, type: 'error' });
          }
        },
        (error) => {
          setIsLocating(false);
          let msg = 'Unable to retrieve your location.';
          if (error.code === error.PERMISSION_DENIED) msg = 'Location permission denied. Please allow location access to check in.';
          if (error.code === error.POSITION_UNAVAILABLE) msg = 'Location information unavailable.';
          if (error.code === error.TIMEOUT) msg = 'Location request timed out.';
          if (user) logGeofenceAttempt(user.id, user.name, -1, msg);
          setLocationError(msg);
          showToast({ title: 'Location Error', message: msg, type: 'error' });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      checkIn('remote', 'Remote Location', false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white border border-slate-200 border-t-4 border-t-aims-orange rounded-xl p-5 shadow-sm transition-all hover:shadow-md">
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
            {isCheckedIn && (
              <p className="text-[10px] font-bold mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-aims-green/10 text-aims-green">
                {checkInMode === 'physical'
                  ? locationVerified
                    ? '✓ Geofence verified · within 200 m of office'
                    : 'Physical (location pending)'
                  : 'Remote work'}
                {location ? ` · ${location}` : ''}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 items-end">
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => { setSelectedMode('physical'); setLocationError(null); }}
              className={cn('px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1',
                selectedMode === 'physical' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
            >
              <span className="material-symbols-outlined text-[14px]">location_on</span>Physical
            </button>
            <button
              onClick={() => { setSelectedMode('remote'); setLocationError(null); }}
              className={cn('px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1',
                selectedMode === 'remote' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
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
              onClick={checkOut}
              className="px-6 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>Check Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}