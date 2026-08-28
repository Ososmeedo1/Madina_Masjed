import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSessionPayload } from '@/lib/utils/auth';
import { resolveHijriDate } from '@/lib/utils/date-resolve';
import AppShell from '@/components/layout/AppShell';
import { getGroupDayDetail } from '@/lib/services/history.service';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'تفاصيل الحضور' };

export default async function HistoryDetailPage({ params }) {
  const { date: rawDate, groupId } = await params;
  await getSessionPayload();

  const date = resolveHijriDate(rawDate);

  let detail = null;
  try {
    detail = await getGroupDayDetail(date, groupId);
  } catch (err) {
    if (err.status === 404) notFound();
    detail = null;
  }

  if (!detail) {
    return (
      <AppShell>
        <main className="container-app py-8">
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
            <p className="text-on-surface-variant">تعذر تحميل التفاصيل</p>
            <Link href="/history" className="mt-3 inline-block text-primary underline">
              رجوع للسجل
            </Link>
          </Card>
        </main>
      </AppShell>
    );
  }

  const presentEntries = detail.entries.filter((e) => e.status === 'present');
  const listenerEntries = detail.entries.filter((e) => e.status === 'listener');
  const absentEntries = detail.entries.filter((e) => e.status === 'absent');

  return (
    <AppShell>
      <main className="container-app py-6 md:py-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl">{detail.group.name}</h1>
          <p className="mt-1 font-amiri text-lg text-primary">{detail.date.hijri}</p>
          <p className="font-jakarta text-sm text-on-surface-variant">
            {detail.date.hijriShort} · {detail.group.startTimeLabel} — {detail.group.endTimeLabel}
          </p>
        </div>
        <Link
          href="/history"
          className="rounded-md px-3 py-2 text-sm font-semibold text-primary ring-1 ring-inset ring-outline-variant transition-colors hover:bg-primary-fixed/30 hover:ring-primary/40"
        >
          رجوع للسجل
        </Link>
      </header>

      <Card className="mb-5 flex flex-wrap items-center justify-around gap-4 bg-primary text-on-primary">
        <div className="text-center">
          <p className="font-jakarta text-3xl font-bold">{detail.totals.students}</p>
          <p className="text-sm opacity-80">حاضر</p>
        </div>
        <div className="text-center">
          <p className="font-jakarta text-3xl font-bold">{detail.totals.listeners}</p>
          <p className="text-sm opacity-80">مستمع</p>
        </div>
        <div className="text-center">
          <p className="font-jakarta text-3xl font-bold">{detail.totals.absents}</p>
          <p className="text-sm opacity-80">غائب</p>
        </div>
        <div className="text-center">
          <p className="font-jakarta text-3xl font-bold">{detail.totals.pages}</p>
          <p className="text-sm opacity-80">إجمالي الصفحات</p>
        </div>
        <div className="text-center">
          <p className="font-jakarta text-lg font-bold">{detail.date.hijri}</p>
          <p className="text-sm opacity-80">الهجري</p>
        </div>
      </Card>

      {detail.entries.length === 0 ? (
        <Card className="p-8 text-center text-on-surface-variant">
          <svg width="60" height="50" viewBox="0 0 24 24" fill="currentColor" className="mx-auto mb-3 text-primary opacity-25" aria-hidden="true">
            <path d="M12 2l2.4 4.9L20 8l-4 3.9.9 5.6L12 14.8 7.1 17.5 8 11.9 4 8l5.6-1.1L12 2z" />
          </svg>
          لا يوجد تسجيل في هذه المجموعة بهذا اليوم
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="mb-4 flex gap-2" role="tablist" aria-label="نوع السجل">
            <button
              role="tab"
              aria-selected="true"
              className="flex-1 rounded-md px-3 py-2 text-sm font-semibold text-primary ring-1 ring-inset ring-primary"
            >
              حاضر ({presentEntries.length})
            </button>
            <button
              role="tab"
              aria-selected="false"
              className="flex-1 rounded-md px-3 py-2 text-sm font-semibold text-on-surface-variant ring-1 ring-inset ring-outline-variant hover:bg-surface-container-high"
            >
              مستمع ({listenerEntries.length})
            </button>
            <button
              role="tab"
              aria-selected="false"
              className="flex-1 rounded-md px-3 py-2 text-sm font-semibold text-on-surface-variant ring-1 ring-inset ring-outline-variant hover:bg-surface-container-high"
            >
              غائب ({absentEntries.length})
            </button>
          </div>
          <ol className="space-y-2">
            {detail.entries.map((e) => (
              <li key={e._id} className="flex items-center gap-3 rounded-md bg-surface-container-lowest px-3 py-3 shadow-card">
                {e.status === 'present' && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-jakarta text-sm font-bold text-on-primary">
                    {e.order}
                  </span>
                )}
                {e.status === 'absent' && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-error font-jakarta text-sm font-bold text-on-error">
                    غ
                  </span>
                )}
                {e.status === 'listener' && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tertiary font-jakarta text-sm font-bold text-on-tertiary">
                    م
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{e.studentName}</p>
                  {e.status === 'present' && (
                    <>
                      <p className="truncate text-sm text-on-surface-variant">{e.revision}</p>
                      <p className="text-xs text-on-surface-variant">
                        {e.pagesCount} أوجه · سرد: {e.countOfSard}
                      </p>
                    </>
                  )}
                  {e.status === 'absent' && e.reason && (
                    <p className="truncate text-sm text-on-surface-variant">السبب: {e.reason}</p>
                  )}
                  <span className="mt-1 inline-flex items-center gap-1">
                    <StatusBadge status={e.status} label={e.status === 'present' ? 'حاضر' : e.status === 'listener' ? 'مستمع' : 'غائب'} />
                  </span>
                </div>
                <span dir="ltr" className="shrink-0 font-jakarta text-sm text-on-surface-variant">
                  {e.registeredAtTime}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mt-6 flex justify-between gap-3">
        <Link href={`/history/${detail.date.prev}/${detail.group.id}`} className="btn-primary flex-1 text-center">
          اليوم السابق
        </Link>
        <Link href={`/history/${detail.date.next}/${detail.group.id}`} className="btn-primary flex-1 text-center">
          اليوم التالي
        </Link>
      </div>
    </main>
    </AppShell>
  );
}