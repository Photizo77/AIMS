// src/components/dashboard/CheckInCard.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useAttendance } from '@/context/AttendanceContext';
import { cn } from '@/lib/utils';
import { logGeofenceAttempt } from '@/services/attendanceService';
import { detectLocalIPv4s, matchesOfficeNetwork, OFFICE_GEOFENCE, haversineDistance } from '@/config/geofence';

export function CheckInCard() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const { isCheckedIn, checkInTime, checkInMode, location, locationVerified, checkIn, checkOut } = useAttendance();
  const [selectedMode, setSelectedMode] = useState<'physical' | 'remote'>('physical');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [netInfo, setNetInfo] = useState<{ onOffice: boolean; ips: string[] } | null>(null);
  const [coordsInfo, setCoordsInfo] = useState<string | null>(null);

  const locateMe = () => {
    if (!navigator.geolocation) {
      setCoordsInfo('Geolocation is not supported by this browser.');
      return;
    }
    setCoordsInfo('Locating…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const distance = haversineDistance(latitude, longitude, OFFICE_GEOFENCE.latitude, OFFICE_GEOFENCE.longitude);
        setCoordsInfo(`Latitude: ${latitude.toFixed(6)} | Longitude: ${longitude.toFixed(6)} — accuracy ±${Math.round(accuracy)} m · ${Math.round(distance)} m from the geofence centre`);
      },
      (error) => {
        let msg = 'Unable to retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) msg = 'Location permission denied — allow location access.';
        if (error.code === error.POSITION_UNAVAILABLE) msg = 'Location unavailable — try a GPS-enabled device or HTTPS.';
        if (error.code === error.TIMEOUT) msg = 'Location request timed out — try again.';
        setCoordsInfo(msg);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    let mounted = true;
    detectLocalIPv4s(3000).then((ips) => {
      if (mounted) setNetInfo({ onOffice: ips.some((ip) => matchesOfficeNetwork(ip)), ips: ips.filter((ip) => !ip.startsWith('127.')) });
    });
    return () => { mounted = false; };
  }, []);

  const handleCheckIn = () => {
    if (selectedMode === 'physical') {
      setIsLocating(true);
      setLocationError(null);
      // GPS is the PRIMARY verification; office network (192.168.100.x) is the fallback.
      const tryNetwork = (gpsIssue: string) => {
        detectLocalIPv4s().then((ips) => {
          const officeIp = ips.find((ip) => matchesOfficeNetwork(ip));
          if (officeIp) {
            setIsLocating(false);
            checkIn('physical', `ARDHI Office Network (${officeIp})`, true);
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
            checkIn('physical', 'ARDHI Office, Kampala', true);
          } else {
            // GPS reported a position outside the geofence → blocked (no IP override).
            if (user) logGeofenceAttempt(user.id, user.name, distance, `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`);
            setLocationError(`You must be within ${OFFICE_GEOFENCE.radiusMeters}m of the ARDHI office to check in. You are ${Math.round(distance)}m away.`);
            showToast({ title: 'Outside Office Radius', message: `Physical check-in blocked — ${Math.round(distance)}m from the office (limit ${OFFICE_GEOFENCE.radiusMeters}m).`, type: 'error' });
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
                    ? location?.startsWith('ARDHI Office Network')
                      ? '✓ Office network verified (192.168.100.x)'
                      : '✓ Geofence verified · within 200 m of office'
                    : 'Physical (location pending)'
                  : 'Remote work'}
                {location ? ` · ${location}` : ''}
              </p>
            )}
            {!isCheckedIn && (
              <p className="text-[10px] text-slate-400 mt-1">
                GPS geofence: {OFFICE_GEOFENCE.latitude.toFixed(6)}, {OFFICE_GEOFENCE.longitude.toFixed(6)} · within {OFFICE_GEOFENCE.radiusMeters} m · GPS first, office network fallback
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

          {netInfo && (
            <p className={cn('text-[10px] font-semibold rounded-lg px-3 py-1.5 max-w-[280px] text-right', netInfo.onOffice ? 'bg-aims-green/10 text-aims-green' : 'bg-slate-100 text-slate-500')}>
              {netInfo.onOffice
                ? `✓ On the office network (${netInfo.ips.join(', ')}) — physical check-in allowed`
                : netInfo.ips.length > 0
                  ? `Network: ${netInfo.ips.join(', ')} — not the office LAN (GPS will be used)`
                  : 'Office network not detectable in this browser (GPS will be used)'}
            </p>
          )}

          {coordsInfo && (
            <p className="text-[10px] font-bold bg-aims-navy/5 border border-aims-navy/20 text-aims-navy rounded-lg px-3 py-1.5 max-w-[300px] text-right">
              {coordsInfo}
            </p>
          )}

          {!isCheckedIn ? (
            <button
              onClick={locateMe}
              className="text-[10px] font-bold text-slate-500 hover:text-aims-navy hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[13px]">my_location</span>Locate me (show my GPS)
            </button>
          ) : null}

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