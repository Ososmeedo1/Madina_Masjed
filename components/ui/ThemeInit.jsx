'use client';

import { useEffect } from 'react';

export default function ThemeInit() {
  useEffect(() => {
    try {
      const t = localStorage.getItem('masjed_theme');
      if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
    } catch {}
  }, []);

  return null;
}
