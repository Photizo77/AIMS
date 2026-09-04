// src/context/AttendanceContext.tsx
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { recordAutoCheckIn, recordUserCheckIn, recordUserCheckOut } from '@/services/attendanceService';

export type CheckInMode = 'physical' | 'remote';

interface AttendanceState {
  isCheckedIn: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInMode: CheckInMode;
  location: string | null;
  /** True when a physical check-in passed the 200 m office geofence */
  locationVerified?: boolean;
}

interface AttendanceContextType extends AttendanceState {
  checkIn: (mode: CheckInMode, location: string, verified?: boolean) => void;
  checkOut: () => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

const STORAGE_PREFIX = 'aims_attendance_';

function loadState(userId: string): AttendanceState {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userId);
    if (raw) return JSON.parse(raw) as AttendanceState;
  } catch { /* ignore */ }
  return { isCheckedIn: false, checkInTime: null, checkOutTime: null, checkInMode: 'physical', location: null, locationVerified: false };
}

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<AttendanceState>(() => loadState(user?.id ?? 'guest'));
  const lastUserId = useRef<string | null>(user?.id ?? null);

  // Persist per user
  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem(STORAGE_PREFIX + user.id, JSON.stringify(state));
      } catch { /* ignore */ }
    }
  }, [state, user]);

  // Auto check-in when the user logs in; record check-out when they log out.
  // Login -> check-in, logout -> check-out => a full-day attendance record for
  // offsite staff (no idle auto-logout; the person decides when to log off).
  useEffect(() => {
    if (user) {
      if (lastUserId.current !== user.id) {
        lastUserId.current = user.id;
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        // Write the dated attendance record into the register (auto check-in on login).
        try { recordAutoCheckIn(user.id, user.name, 'System login — office session'); } catch { /* register unavailable */ }
        setState({
          isCheckedIn: true,
          checkInTime: timeString,
          checkOutTime: null,
          checkInMode: 'remote',
          location: 'System login — office session',
        });
      }
    } else if (lastUserId.current) {
      // Logging out = check-out: stamp the register record with the check-out time.
      try { recordUserCheckOut(lastUserId.current); } catch { /* register unavailable */ }
      lastUserId.current = null;
      setState((prev) => (prev.isCheckedIn
        ? { ...prev, isCheckedIn: false, checkOutTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }
        : prev));
    }
  }, [user]);

  const checkIn = (mode: CheckInMode, location: string, verified = false) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    // Write the check-in into the attendance register (physical only when geofence-verified).
    try { recordUserCheckIn(user?.id ?? '', user?.name, mode, location, verified); } catch { /* register unavailable */ }
    setState({
      isCheckedIn: true,
      checkInTime: timeString,
      checkOutTime: null,
      checkInMode: mode,
      location,
      locationVerified: mode === 'physical' ? verified : false,
    });
  };

  const checkOut = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    // Stamp the register record with the check-out time (duration is computed there).
    try { recordUserCheckOut(user?.id ?? ''); } catch { /* register unavailable */ }
    setState((prev) => ({ ...prev, isCheckedIn: false, checkOutTime: timeString }));
  };

  return (
    <AttendanceContext.Provider value={{ ...state, checkIn, checkOut }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error('useAttendance must be used within AttendanceProvider');
  return ctx;
}
