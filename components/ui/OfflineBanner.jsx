'use client';

import { useEffect, useState } from 'react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-[70] bg-secondary-container py-2 text-center text-sm font-bold text-on-secondary-container shadow-md"
    >
      لا يوجد اتصال بالإنترنت — سيتم استئناف التحديث تلقائيًا عند عودة الشبكة
    </div>
  );
}
