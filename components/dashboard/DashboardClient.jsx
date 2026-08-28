'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import CopyLinkButton from './CopyLinkButton';
import TeacherAbsence from '@/components/absence/TeacherAbsence';
import { GROUP_STATUS_LABELS_AR } from '@/lib/utils/group-status';
import { fetchJson } from '@/lib/utils/fetcher';
import { useToast } from '@/components/ui/Toast';

const CLOCK_FMT = new Intl.DateTimeFormat('ar-SA-u-nu-latn', {
  timeZone: 'Asia/Riyadh',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const UPDATED_FMT = new Intl.DateTimeFormat('ar-SA', {
  timeZone: 'Asia/Riyadh',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

const POLL_MS = 15000;

export default function DashboardClient({ initial, displayName }) {
  const [data, setData] = useState(initial);
  const [clock, setClock] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const tick = () => setClock(CLOCK_FMT.format(new Date()));
    tick();
    setLastUpdated(UPDATED_FMT.format(new Date()));
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const poll = async () => {
      if (document.hidden) return;
      try {
        const res = await fetchJson('/api/teacher/groups');
        if (res.ok) {
          setData(await res.json());
          setLastUpdated(UPDATED_FMT.format(new Date()));
        }
      } catch {}
    };
    const id = setInterval(poll, POLL_MS);
    const onVisible = () => {
      if (!document.hidden) poll();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return (
    <main className="container-app py-6 md:py-8">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl">لوحة المتابعة</h1>
        <p className="mt-1 text-sm text-on-surface-variant">مرحباً، {displayName}</p>
      </header>

      <div className="pattern-khatim relative mb-5 overflow-hidden rounded-lg bg-primary text-on-primary shadow-card">
        <Image
          src="/images/picture2.jpg"
          alt=""
          fill
          priority
          className="object-cover opacity-20"
          sizes="(max-width: 768px) 100vw, 600px"
        />
        <div className="img-overlay-dark" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm opacity-80">الوقت الآن في المدينة المنورة</p>
            <p dir="ltr" className="font-jakarta text-4xl font-bold tracking-wider md:text-5xl" suppressHydrationWarning>
              {clock ?? '--:--'}
            </p>
          </div>
          <div className="text-left">
            <p className="font-amiri text-2xl leading-relaxed">{data.today.hijri}</p>
            <span
              className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                data.today.isHoliday
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-primary-fixed text-on-primary-fixed'
              }`}
            >
              {data.today.isHoliday ? 'اليوم عطلة' : 'يوم حضور'}
            </span>
          </div>
        </div>
      </div>

      <section className="mb-5">
        <TeacherAbsence />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {data.groups.map((g) => (
          <Card key={g._id} className="flex flex-col gap-4 animate-fade-in">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl">{g.name}</h2>
              <StatusBadge status={g.status} label={g.statusAr} />
            </div>

            <p className="text-on-surface-variant" dir="ltr" style={{ textAlign: 'right' }}>
              <span className="font-jakarta font-semibold text-on-surface-variant">
                {g.startTimeLabel} — {g.endTimeLabel}
              </span>
            </p>

            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-md bg-surface-container-low p-3 text-center">
                <p className="font-jakarta text-3xl font-bold text-primary">{Number(g.studentsToday) || 0}</p>
                <p className="mt-1 text-sm text-on-surface-variant">حاضر</p>
              </div>
              <div className="rounded-md bg-surface-container-low p-3 text-center">
                <p className="font-jakarta text-3xl font-bold text-tertiary">{Number(g.listenersToday) || 0}</p>
                <p className="mt-1 text-sm text-on-surface-variant">مستمع</p>
              </div>
              <div className="rounded-md bg-surface-container-low p-3 text-center">
                <p className="font-jakarta text-3xl font-bold text-error">{Number(g.absentToday) || 0}</p>
                <p className="mt-1 text-sm text-on-surface-variant">غائب</p>
              </div>
              <div className="rounded-md bg-surface-container-low p-3 text-center">
                <p className="font-jakarta text-3xl font-bold text-primary">{Number(g.pagesToday) || 0}</p>
                <p className="mt-1 text-sm text-on-surface-variant">صفحات</p>
              </div>
            </div>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/40 pt-3">
              <code dir="ltr" className="rounded-sm bg-surface-container-low px-2 py-1 font-jakarta text-sm text-on-surface-variant">
                /attendance/{g.key}
              </code>
              <div className="flex gap-2">
                <CopyLinkButton path={`/attendance/${g.key}`} />
                <Link href={`/attendance/${g.key}`}>
                  <Button size="sm">فتح الحضور</Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </section>

      <div className="mt-6 text-center">
        <span className="text-xs text-on-surface-variant">
          آخر تحديث: <span dir="rtl" suppressHydrationWarning>{lastUpdated ?? '--:--:--'}</span> — يتجدد كل ١٥ ثانية عند تصفح الصفحة
        </span>
      </div>
    </main>
  );
}