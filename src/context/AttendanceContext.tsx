// src/context/AttendanceContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import { useNotifications } from '@/context/NotificationContext';

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

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const { showToast } = useNotifications();
  const [state, setState] = useState<AttendanceState>({
    isCheckedIn: false,
    checkInTime: null,
    checkOutTime: null,
    checkInMode: 'physical',
    location: null,
  });

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
    showToast({
      title: `Checked In (${mode === 'physical' ? 'Physical' : 'Remote'})`,
      message: `Checked in at ${timeString}${location ? ` • ${location}` : ''}`,
      type: 'success',
    });
  };

  const checkOut = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    setState((prev) => ({ ...prev, isCheckedIn: false, checkOutTime: timeString }));
    showToast({ title: 'Checked Out', message: `Checked out at ${timeString}.`, type: 'success' });
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