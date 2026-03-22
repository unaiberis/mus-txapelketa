import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type ToastType = 'error' | 'success' | 'info';

type Toast = { id: string; type: ToastType; message: string };

type ToastContextShape = {
  showError: (msg: string) => void;
  showSuccess: (msg: string) => void;
  showInfo: (msg: string) => void;
};

const ToastContext = createContext<ToastContextShape | null>(null);

export function useInternalToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    setToasts((t) => [...t, { id, type, message }]);
    return id;
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  useEffect(() => {
    const timers: Array<{ id: string; to: number }> = [];
    toasts.forEach((toast) => {
      const timeout = window.setTimeout(() => remove(toast.id), 4000);
      timers.push({ id: toast.id, to: timeout });
    });
    return () => timers.forEach((t) => clearTimeout(t.to));
  }, [toasts, remove]);

  const api = useMemo<ToastContextShape>(() => ({
    showError: (m: string) => push('error', m),
    showSuccess: (m: string) => push('success', m),
    showInfo: (m: string) => push('info', m),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div aria-live="polite" style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 9999 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              style={{
                minWidth: 260,
                maxWidth: 420,
                padding: '10px 14px',
                borderRadius: 8,
                color: '#fff',
                background: t.type === 'error' ? '#ef4444' : t.type === 'success' ? '#10b981' : '#374151',
                boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
              }}
            >
              <div style={{ fontSize: '0.875rem', lineHeight: 1.2 }}>{t.message}</div>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}
