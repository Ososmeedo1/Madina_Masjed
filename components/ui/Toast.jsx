'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(() => {});

const TONES = {
  success: 'bg-primary-fixed text-on-primary-fixed',
  error: 'bg-error-container text-on-error-container',
  info: 'bg-surface-container-highest text-on-surface ring-1 ring-inset ring-outline-variant/30',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const push = useCallback((type, message) => {
    const id = ++idRef.current;
    setToasts((list) => [...list, { id, type, message }]);
    setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-24 right-5 z-[60] flex flex-col gap-2 md:bottom-8 md:left-auto md:right-8"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`animate-fade-in min-h-[44px] rounded-md px-4 py-3 text-sm font-semibold shadow-raised ${TONES[t.type] ?? TONES.info}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
