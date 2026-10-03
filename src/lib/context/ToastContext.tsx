import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ToastType = 'info' | 'success' | 'error';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

export interface ActiveToast extends ToastOptions {
  id: string;
}

interface ToastContextData {
  showToast: (options: ToastOptions) => string;
  hideToast: (id?: string) => void;
  toast: ActiveToast | null;
}

const ToastContext = createContext<ToastContextData>({
  showToast: () => '',
  hideToast: () => {},
  toast: null,
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback((id?: string) => {
    setToast((current) => {
      if (!current) return null;
      if (id && current.id !== id) return current;
      return null;
    });
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showToast = useCallback(
    ({ message, type = 'info', actionLabel, onAction, duration }: ToastOptions) => {
      const id = String(Date.now() + Math.random());
      const effectiveDuration = duration ?? (actionLabel ? 5000 : 3500);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setToast({
        id,
        message,
        type,
        actionLabel,
        onAction,
        duration: effectiveDuration,
      });

      timerRef.current = setTimeout(() => {
        hideToast(id);
      }, effectiveDuration);

      return id;
    },
    [hideToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast, toast }}>
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
