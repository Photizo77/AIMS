// src/components/dashboard/CheckInCard.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { OFFICE_GEOFENCE, isWithinGeofence } from '@/config/geofence';
import type { AttendanceType } from '@/types';

/**
 * Geofenced Check-In Card — used across ALL user personas.
 * 
 * Physical check-in: Requires GPS within 150m of Nsambya office.
 *   - Blocked entirely if outside geofence with error toast.
 *   - Failed attempts logged to SysAdmin audit trail.
 * 
 * Remote check-in: Manual action, no GPS required.
 *   - IP address automatically captured and logged.
 *   - Tagged with attendance_type: 'remote'.
 */
export function CheckInCard() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [attendanceType, setAttendanceType] = useState<AttendanceType | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

  /**
   * Physical check-in: Request GPS → validate geofence → allow or block.
   */
  const handlePhysicalCheckIn = () => {
    if (!navigator.geolocation) {
      showToast({
        title: 'Geolocation Unavailable',
        message: 'Your browser does not support GPS. Use remote check-in instead.',
        type: 'error',
      });
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        const passed = isWithinGeofence(latitude, longitude);

        if (passed) {
          setCheckedIn(true);
          setCheckInTime(formattedTime);
          setAttendanceType('physical');
          showToast({
            title: 'Checked In (Onsite)',
            message: `Welcome, ${user?.name ?? 'User'}. Clock-in recorded at ${formattedTime}.`,
            type: 'success',
          });
        } else {
          // BLOCKED — log to audit trail (in production, POST to /api/audit/geofence-violations)
          console.warn('[AUDIT] Geofence violation:', {
            userId: user?.id,
            userName: user?.name,
            userRole: user?.role,
            timestamp: new Date().toISOString(),
            attemptedLat: latitude,
            attemptedLng: longitude,
            action: 'check_in',
          });
          showToast({
            title: 'Check-In Blocked',
            message: `You are outside the ${OFFICE_GEOFENCE.label} perimeter (${OFFICE_GEOFENCE.radiusMeters}m). This attempt has been logged.`,
            type: 'error',
          });
        }
      },
      (error) => {
        setIsLocating(false);
        showToast({
          title: 'GPS Error',
          message: error.code === 1 ? 'Location permission denied. Enable GPS and retry.' : 'Unable to determine location. Try remote check-in.',
          type: 'error',
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  /**
   * Remote check-in: No GPS. IP logged automatically.
   */
  const handleRemoteCheckIn = () => {
    // In production, IP is captured server-side via request headers.
    // Client-side placeholder for demonstration.
    const simulatedIP = '41.220.138.xx';

    setCheckedIn(true);
    setCheckInTime(formattedTime);
    setAttendanceType('remote');
    showToast({
      title: 'Checked In (Remote)',
      message: `Remote clock-in recorded at ${formattedTime}. IP: ${simulatedIP}`,
      type: 'success',
    });
  };

  const handleCheckOut = () => {
    setCheckedIn(false);
    setCheckInTime(null);
    setAttendanceType(null);
    showToast({
      title: 'Checked Out',
      message: `Clock-out recorded at ${formattedTime}. Have a great day!`,
      type: 'info',
    });
  };

  return (
    <div className="bg-aims-orange rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 flex items-center justify-between">
        {/* Left: Time & Date */}
        <div>
          <p className="text-sm font-medium text-white/80">{formattedDate}</p>
          <p className="text-4xl font-extrabold tracking-tight text-white">{formattedTime}</p>
          {checkedIn && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="material-symbols-outlined text-[18px] text-white">check_circle</span>
              <span className="text-sm font-bold text-white">
                Checked in at {checkInTime} ({attendanceType === 'physical' ? 'Onsite' : 'Remote'})
              </span>
            </div>
          )}
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-col gap-2">
          {!checkedIn ? (
            <>
              <button
                onClick={handlePhysicalCheckIn}
                disabled={isLocating}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
                  isLocating
                    ? 'bg-white/30 text-white/60 cursor-wait'
                    : 'bg-white text-aims-orange hover:bg-white/90 shadow-md'
                )}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isLocating ? 'progress_activity' : 'location_on'}
                </span>
                {isLocating ? 'Locating…' : 'Clock In (Onsite)'}
              </button>
              <button
                onClick={handleRemoteCheckIn}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white/20 text-white hover:bg-white/30 transition-all flex items-center gap-2 backdrop-blur-sm"
              >
                <span className="material-symbols-outlined text-[18px]">wifi</span>
                Clock In (Remote)
              </button>
            </>
          ) : (
            <button
              onClick={handleCheckOut}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-aims-orange hover:bg-white/90 shadow-md transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Clock Out
            </button>
          )}
        </div>
      </div>

      {/* Geofence info footer */}
      <div className="relative z-10 mt-4 pt-3 border-t border-white/20 flex items-center gap-2">
        <span className="material-symbols-outlined text-[14px] text-white/60">fence</span>
        <p className="text-[10px] text-white/60">
          Onsite check-in requires GPS within {OFFICE_GEOFENCE.radiusMeters}m of {OFFICE_GEOFENCE.label} ({OFFICE_GEOFENCE.latitude.toFixed(4)}°N, {OFFICE_GEOFENCE.longitude.toFixed(4)}°E)
        </p>
      </div>
    </div>
  );
}