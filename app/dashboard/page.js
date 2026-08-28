import { getSessionPayload } from '@/lib/utils/auth';
import { getDashboardSnapshot } from '@/lib/services/groups.service';
import DashboardClient from '@/components/dashboard/DashboardClient';
import AppShell from '@/components/layout/AppShell';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'لوحة المتابعة' };

export default async function DashboardPage() {
  const payload = await getSessionPayload();
  const displayName = payload?.email ? payload.email.split('@')[0] : '';

  let snapshot = null;
  try {
    snapshot = await getDashboardSnapshot();
  } catch {
    snapshot = null;
  }

  if (!snapshot) {
    return (
      <AppShell>
        <main className="container-app py-8">
          <div className="card mx-auto max-w-md p-8 text-center">
            <svg width="100" height="80" viewBox="0 0 120 100" fill="none" className="mx-auto mb-4 text-primary opacity-25" aria-hidden="true">
              <rect x="35" y="40" width="50" height="45" rx="4" fill="currentColor" />
              <rect x="40" y="25" width="40" height="20" rx="3" fill="currentColor" />
              <circle cx="60" cy="18" r="10" fill="currentColor" />
              <rect x="25" y="50" width="10" height="35" rx="2" fill="currentColor" />
              <rect x="85" y="50" width="10" height="35" rx="2" fill="currentColor" />
              <path d="M57 18 l3-6 3 6" fill="currentColor" className="opacity-80" />
              <path d="M30 85 h60" stroke="currentColor" strokeWidth="2" className="opacity-40" />
            </svg>
            <h1 className="text-2xl">تعذر تحميل البيانات</h1>
            <p className="mt-3 text-on-surface-variant">
              تأكد من تشغيل قاعدة البيانات ثم أعد تحديث الصفحة
            </p>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <DashboardClient initial={snapshot} displayName={displayName} />
    </AppShell>
  );
}
