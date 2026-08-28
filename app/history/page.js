import Link from 'next/link';
import { getSessionPayload } from '@/lib/utils/auth';
import { getPaginatedDates } from '@/lib/services/history.service';
import AppShell from '@/components/layout/AppShell';
import Card from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'سجل الحضور' };

export default async function HistoryPage({ searchParams }) {
  const sp = await searchParams;
  await getSessionPayload();

  const page = Math.max(1, parseInt(sp?.page) || 1);

  let result = null;
  let loadError = false;

  try {
    result = await getPaginatedDates(page, 5);
  } catch {
    loadError = true;
  }

  return (
    <AppShell>
      <main className="container-app py-6 md:py-8">
        <header className="mb-5">
          <h1 className="text-2xl md:text-3xl">سجل الحضور</h1>
          <p className="mt-1 text-sm text-on-surface-variant">أيام التسجيل المتاحة</p>
        </header>

        {loadError ? (
          <Card className="mx-auto max-w-md p-8 text-center">
            <svg width="80" height="70" viewBox="0 0 120 100" fill="none" className="mx-auto mb-3 text-primary opacity-25" aria-hidden="true">
              <rect x="35" y="40" width="50" height="45" rx="4" fill="currentColor" />
              <rect x="40" y="25" width="40" height="20" rx="3" fill="currentColor" />
              <circle cx="60" cy="18" r="10" fill="currentColor" />
              <rect x="25" y="50" width="10" height="35" rx="2" fill="currentColor" />
              <rect x="85" y="50" width="10" height="35" rx="2" fill="currentColor" />
              <path d="M57 18 l3-6 3 6" fill="currentColor" className="opacity-80" />
              <path d="M30 85 h60" stroke="currentColor" strokeWidth="2" className="opacity-40" />
            </svg>
            <p className="text-on-surface-variant">تعذر تحميل السجل — تأكد من قاعدة البيانات</p>
          </Card>
        ) : result.dates.length === 0 ? (
          <Card className="mx-auto max-w-md p-8 text-center">
            <svg width="80" height="70" viewBox="0 0 120 100" fill="none" className="mx-auto mb-3 text-primary opacity-25" aria-hidden="true">
              <rect x="35" y="40" width="50" height="45" rx="4" fill="currentColor" />
              <rect x="40" y="25" width="40" height="20" rx="3" fill="currentColor" />
              <circle cx="60" cy="18" r="10" fill="currentColor" />
              <rect x="25" y="50" width="10" height="35" rx="2" fill="currentColor" />
              <rect x="85" y="50" width="10" height="35" rx="2" fill="currentColor" />
              <path d="M57 18 l3-6 3 6" fill="currentColor" className="opacity-80" />
              <path d="M30 85 h60" stroke="currentColor" strokeWidth="2" className="opacity-40" />
            </svg>
            <p className="text-on-surface-variant">لا يوجد سجل حضور بعد</p>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {result.dates.map((date) => (
                <Card key={date.hijriDate} className="overflow-hidden">
                  <div className="border-b border-outline-variant/30 px-4 py-3">
                    <h2 className="font-amiri text-xl text-primary">{date.hijri}</h2>
                  </div>
                  <div className="grid gap-3 p-4 lg:grid-cols-2">
                    {date.groups.map((g) => (
                      <Link key={g.id} href={`/history/${date.hijriDate}/${g.id}`} className="block">
                        <div className="flex h-full flex-col gap-2 rounded-md bg-surface-container-low p-3 transition-shadow hover:shadow-raised">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-bold">{g.name}</h3>
                            <span className="font-jakarta text-xs text-on-surface-variant">
                              {g.startTimeLabel} — {g.endTimeLabel}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            <div className="rounded bg-surface-container-lowest p-2 text-center">
                              <p className="font-jakarta text-lg font-bold text-primary">{g.students}</p>
                              <p className="text-[10px] text-on-surface-variant">حاضر</p>
                            </div>
                            <div className="rounded bg-surface-container-lowest p-2 text-center">
                              <p className="font-jakarta text-lg font-bold text-tertiary">{g.listeners}</p>
                              <p className="text-[10px] text-on-surface-variant">مستمع</p>
                            </div>
                            <div className="rounded bg-surface-container-lowest p-2 text-center">
                              <p className="font-jakarta text-lg font-bold text-error">{g.absents}</p>
                              <p className="text-[10px] text-on-surface-variant">غائب</p>
                            </div>
                            <div className="rounded bg-surface-container-lowest p-2 text-center">
                              <p className="font-jakarta text-lg font-bold text-primary">{g.pages}</p>
                              <p className="text-[10px] text-on-surface-variant">صفحة</p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-primary">عرض التفاصيل ←</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            {result.totalPages > 1 && (
              <nav className="mt-6 flex items-center justify-between gap-4" aria-label="تنقل بين الصفحات">
                <Link
                  href={result.hasPrev ? `/history?page=${result.currentPage - 1}` : undefined}
                  className={`btn-primary min-w-[100px] ${!result.hasPrev ? 'pointer-events-none opacity-40' : ''}`}
                  aria-disabled={!result.hasPrev}
                >
                  السابق
                </Link>
                <span className="font-jakarta text-sm text-on-surface-variant">
                  {result.currentPage} / {result.totalPages}
                </span>
                <Link
                  href={result.hasNext ? `/history?page=${result.currentPage + 1}` : undefined}
                  className={`btn-primary min-w-[100px] ${!result.hasNext ? 'pointer-events-none opacity-40' : ''}`}
                  aria-disabled={!result.hasNext}
                >
                  التالي
                </Link>
              </nav>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}
