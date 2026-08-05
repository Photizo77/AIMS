// src/context/NotificationContext.tsx
// ============================================================
// AIMS — Notification & Toast System (Phase 2)
// ============================================================

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Notification, NotificationType } from '@/types';

// ─────────────────────────────────────────────
// TOAST TYPE (temporary pop-up)
// ─────────────────────────────────────────────
export interface Toast {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  duration?: number; // ms before auto-dismiss
}

// ─────────────────────────────────────────────
// CONTEXT TYPE
// ─────────────────────────────────────────────
interface NotificationContextType {
  // Persistent notifications (bell icon)
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;

  // Temporary toasts (pop-up)
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

// ─────────────────────────────────────────────
// CREATE CONTEXT
// ─────────────────────────────────────────────
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// ─────────────────────────────────────────────
// HELPER: Generate unique ID
// ─────────────────────────────────────────────
let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `${Date.now()}-${idCounter}`;
}

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ── Persistent Notifications ──
  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
      const newNotification: Notification = {
        ...notification,
        id: generateId(),
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // ── Temporary Toasts ──
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = generateId();
      const newToast: Toast = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      // Auto-dismiss after duration (default 4 seconds)
      const duration = toast.duration || 4000;
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    },
    [dismissToast]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// ─────────────────────────────────────────────
// CUSTOM HOOK
// ─────────────────────────────────────────────
export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
