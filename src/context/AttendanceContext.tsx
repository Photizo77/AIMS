// src/context/AttendanceContext.tsx
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

export type CheckInMode = 'physical' | 'remote';

interface AttendanceState {
  isCheckedIn: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInMode: CheckInMode;
  location: string | null;
}

interface AttendanceContextType extends AttendanceState {
  checkIn: (mode: CheckInMode, location: string) => void;
  checkOut: () => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

const STORAGE_PREFIX = 'aims_attendance_';

function loadState(userId: string): AttendanceState {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userId);
    if (raw) return JSON.parse(raw) as AttendanceState;
  } catch { /* ignore */ }
  return { isCheckedIn: false, checkInTime: null, checkOutTime: null, checkInMode: 'physical', location: null };
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

  // Auto check-in when the user logs in — login reflects in attendance
  useEffect(() => {
    if (user && lastUserId.current !== user.id) {
      lastUserId.current = user.id;
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      setState({
        isCheckedIn: true,
        checkInTime: timeString,
        checkOutTime: null,
        checkInMode: 'remote',
        location: 'System login — office session',
      });
    }
  }, [user]);

  const checkIn = (mode: CheckInMode, location: string) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    setState({
      isCheckedIn: true,
      checkInTime: timeString,
      checkOutTime: null,
      checkInMode: mode,
      location,
    });
  };

  const checkOut = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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
