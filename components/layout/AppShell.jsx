'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';

const TABS = [
  { href: '/dashboard', label: 'الرئيسية', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
  { href: '/history', label: 'السجل', icon: 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  { href: '/dashboard/settings', label: 'الإعدادات', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
];

function isActive(pathname, href) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname.startsWith(href);
}

export default function AppShell({ children }) {
  const pathname = usePathname() || '/dashboard';

  return (
    <div className="min-h-screen">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:right-4 focus:top-4 focus:z-[80] focus:min-h-[44px] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary">تخطَّ إلى المحتوى</a>
      <header className="sticky top-0 z-40 border-b border-outline-variant/50 surface-header">
        <div className="container-app flex h-16 items-center justify-between gap-3">
          <Link href="/dashboard" className="flex min-h-[44px] items-center gap-2">
            <span className="pattern-khatim relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-primary text-on-primary">
              <svg width="22" height="22" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">
                <path d="M32 10C23 10 17 19 17 28V38H47V28C47 19 41 10 32 10Z"/>
                <circle cx="32" cy="8" r="3.5"/>
                <rect x="14" y="38" width="36" height="18" rx="2"/>
                <rect x="7" y="22" width="7" height="34" rx="1.5"/>
                <circle cx="10.5" cy="20" r="4.5"/>
                <rect x="50" y="22" width="7" height="34" rx="1.5"/>
                <circle cx="53.5" cy="20" r="4.5"/>
                <path d="M28 56V44C28 41.5 29.8 40 32 40C34.2 40 36 41.5 36 44V56"/>
                <rect x="17" y="43" width="5" height="7" rx="2.5"/>
                <rect x="42" y="43" width="5" height="7" rx="2.5"/>
              </svg>
            </span>
            <span className="font-amiri text-xl font-bold text-primary">نظام متابعة الحفظ</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {TABS.map((t) => {
              const active = isActive(pathname, t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-md px-3 text-sm transition-colors ${
                    active
                      ? 'bg-primary-fixed/40 font-bold text-on-primary-fixed'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={t.icon} />
                  </svg>
                  {t.label}
                </Link>
              );
            })}
          </nav>

          <ThemeToggle />
        </div>
      </header>

      <main id="main-content" className="pb-24 md:pb-8">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-outline-variant/50 surface-bottom-nav md:hidden">
        {TABS.map((t) => {
          const active = isActive(pathname, t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors ${
                active ? 'font-bold text-primary' : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={t.icon} />
              </svg>
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
