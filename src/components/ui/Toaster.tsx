// src/components/ui/Toaster.tsx
// ============================================================
// AIMS — Toast Notification Display (Phase 2)
// Renders pop-up toasts in the top-right corner
// ============================================================

import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import type { NotificationType } from '@/types';

// ─────────────────────────────────────────────
// TOAST STYLES BY TYPE
// ─────────────────────────────────────────────
const TOAST_STYLES: Record<NotificationType, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  success: 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  approval: 'border-purple-200 bg-purple-50 text-purple-800',
};

const TOAST_ICONS: Record<NotificationType, string> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
  approval: 'approval',
};

// ─────────────────────────────────────────────
// TOASTER COMPONENT
// ─────────────────────────────────────────────
export function Toaster() {
  const { toasts, dismissToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-in slide-in-from-right duration-300',
            TOAST_STYLES[toast.type]
          )}
        >
          <span className="material-symbols-outlined text-[20px] mt-0.5 shrink-0">
            {TOAST_ICONS[toast.type]}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{toast.title}</p>
            <p className="text-xs mt-0.5 opacity-80">{toast.message}</p>
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}