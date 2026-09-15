'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import StatusBadge from '@/components/ui/StatusBadge';
import { REGISTRATION_MESSAGES_AR } from '@/lib/utils/group-status';
import { apiErrorAr } from '@/lib/utils/messages-ar';
import { fetchJson } from '@/lib/utils/fetcher';
import { useToast } from '@/components/ui/Toast';
import ThemeToggle from '@/components/ui/ThemeToggle';

const CLOCK_FMT = new Intl.DateTimeFormat('ar-SA-u-nu-latn', {
  timeZone: 'Asia/Riyadh',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

const POLL_MS = 10000;

function saveEditToken(id, token) {
  try {
    const store = JSON.parse(localStorage.getItem('masjed_edit_tokens') || '{}');
    store[id] = token;
    localStorage.setItem('masjed_edit_tokens', JSON.stringify(store));
  } catch {}
}

function loadEditToken(id) {
  try {
    const store = JSON.parse(localStorage.getItem('masjed_edit_tokens') || '{}');
    return store[id] || null;
  } catch {
    return null;
  }
}

export default function AttendanceClient({ initial }) {
  const [data, setData] = useState(initial);
  const [clock, setClock] = useState(null);
  const [activeTab, setActiveTab] = useState('present');
  const [form, setForm] = useState({ studentName: '', revision: '', pagesCount: '', countOfSard: '', reason: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [dupId, setDupId] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [freshIds, setFreshIds] = useState(() => new Set());
  const [currentRecord, setCurrentRecord] = useState(null);
  const [checkingRecord, setCheckingRecord] = useState(true);
  const [conflict, setConflict] = useState(null);
  const [ownedTokens, setOwnedTokens] = useState({});
  const toast = useToast();
  const prevIdsRef = useRef(null);
  const statusRef = useRef(initial.status);

  useEffect(() => {
    statusRef.current = data.status;
    if (data.status !== 'OPEN' && prevIdsRef.current === null) {
      prevIdsRef.current = new Set(data.entries.map((e) => e._id));
    }
  }, [data]);

  useEffect(() => {
    try {
      const store = JSON.parse(localStorage.getItem('masjed_edit_tokens') || '{}');
      setOwnedTokens(store);
    } catch {
      setOwnedTokens({});
    }
  }, [data.entries]);

  useEffect(() => {
    const tick = () => setClock(CLOCK_FMT.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function checkCurrent() {
      try {
        const res = await fetchJson(`/api/attendance/groups/${initial.group.key}/current`);
        if (res.ok) {
          const body = await res.json();
          if (!cancelled && body.record) {
            setCurrentRecord(body);
          }
        }
      } catch {}
      if (!cancelled) setCheckingRecord(false);
    }
    checkCurrent();
    return () => { cancelled = true; };
  }, [initial.group.key]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetchJson(`/api/attendance/groups/${initial.group.key}`);
      if (res.ok) setData(await res.json());
    } catch {}
  }, [initial.group.key]);

  useEffect(() => {
    const id = setInterval(() => {
      if (statusRef.current !== 'OPEN' || document.hidden) return;
      refresh();
    }, POLL_MS);

    const onVisible = () => {
      if (!document.hidden && statusRef.current === 'OPEN') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  useEffect(() => {
    if (!data.entries || data.entries.length === 0) return;
    const current = new Set(data.entries.map((e) => e._id));
    const prev = prevIdsRef.current;
    prevIdsRef.current = current;

    if (!prev) return;

    const fresh = data.entries.filter((e) => !prev.has(e._id)).map((e) => e._id);
    if (fresh.length > 0) {
      setFreshIds(new Set(fresh));
      const t = setTimeout(() => setFreshIds(new Set()), 2600);
      return () => clearTimeout(t);
    }
  }, [data]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const isOpen = data.status === 'OPEN' && !data.teacherAbsent;
  const totalPages = data.entries.reduce((s, e) => s + (e.pagesCount || 0), 0);
  const presentCount = data.entries.filter((e) => e.status === 'present').length;
  const listenerCount = data.entries.filter((e) => e.status === 'listener').length;
  const absentCount = data.entries.filter((e) => e.status === 'absent').length;

  function clearForm() {
    if (activeTab === 'present') {
      setForm({ studentName: '', revision: '', pagesCount: '', countOfSard: '', reason: '' });
    } else {
      setForm({ studentName: '', reason: '', revision: '', pagesCount: '', countOfSard: '' });
    }
  }

  async function submitWith(convert) {
    setSubmitting(true);
    setMessage('');
    setErrors({});
    setDupId(null);
    setConflict(null);

    try {
      const body = activeTab === 'present'
        ? { ...form, pagesCount: Number(form.pagesCount), status: 'present' }
        : activeTab === 'listener'
          ? { ...form, status: 'listener' }
          : { ...form, status: 'absent' };
      if (convert) body.convert = true;

      const res = await fetchJson(
        `/api/attendance/groups/${initial.group.key}/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      const resp = await res.json();

      if (!res.ok) {
        setErrors(resp.errors || {});
        setMessage(apiErrorAr(resp, res.status, 'تعذر التسجيل'));
        setDupId(resp.attendanceId || null);
        if (resp.code === 'STATUS_CONFLICT') {
          setConflict({
            existingStatus: resp.recordStatus,
            requestedStatus: activeTab === 'present' ? 'present' : activeTab === 'listener' ? 'listener' : 'absent',
          });
        }
        return;
      }

      saveEditToken(resp.entry._id, resp.editToken);
      setSuccess(resp);
      const statusLabel = resp.entry.status === 'absent' ? 'غياب' : resp.entry.status === 'listener' ? 'استماع' : 'حضور';
      toast('success', resp.converted
        ? `تم تحويل السجل إلى ${statusLabel}`
        : `تم تسجيل ${statusLabel}ك بنجاح`);
      clearForm();
      await refresh();
      setTimeout(() => {
        const rowEl = document.getElementById(`row-${resp.entry._id}`);
        rowEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    } catch {
      setMessage('خطأ في الاتصال بالخادم');
    } finally {
      setSubmitting(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    submitWith(false);
  }

  const presentEntries = data.entries.filter((e) => e.status === 'present');
  const listenerEntries = data.entries.filter((e) => e.status === 'listener');
  const absentEntries = data.entries.filter((e) => e.status === 'absent');
  const displayEntries = activeTab === 'present' ? presentEntries : activeTab === 'listener' ? listenerEntries : absentEntries;

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-6 md:py-10 bg-surface-container-low min-h-screen">
      {/* ── Background layers (fixed, behind content) ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[url('/images/picture4.jpg')] bg-cover bg-center"
        style={{ opacity: 0.10 }}
        aria-hidden="true"
      />

      {/* ── Header with group name + clock + theme toggle ── */}
      <header className="pattern-khatim relative mb-5 overflow-hidden rounded-lg bg-primary px-5 py-6 text-center shadow-card">
        <div className="absolute top-3 left-3 z-20">
          <ThemeToggle className="min-h-[40px] min-w-[40px] text-on-primary/70 ring-on-primary/20 hover:bg-on-primary/15 hover:text-on-primary" />
        </div>
        <div className="relative z-10">
          <h1 className="text-on-primary text-2xl md:text-3xl">{data.group.name}</h1>
          <p dir="ltr" className="mt-1 font-jakarta text-3xl font-bold tracking-wider text-on-primary md:text-4xl" suppressHydrationWarning>
            {clock ?? '--:--:--'}
          </p>
          <p className="mt-1 text-sm text-on-primary/80">التوقيت الحالي في المدينة المنورة</p>
        </div>
      </header>

      {data.teacherAbsent && (
        <div role="alert" className="mb-5 rounded-md bg-error-container px-4 py-4 text-center">
          <p className="text-lg font-bold text-on-error-container">المعلم غائب اليوم</p>
          <p className="mt-1 text-sm text-on-error-container">لا يوجد تسجيل حضور أو غياب أو استماع — يمكن للطالب العودة في يوم الحلقة القادم</p>
        </div>
      )}

      <div className="mb-5 flex items-center justify-between gap-3 rounded-md bg-surface-container-lowest px-4 py-3 shadow-card">
        <StatusBadge
          status={data.status}
          label={
            data.status === 'OPEN'
              ? REGISTRATION_MESSAGES_AR.OPEN
              : data.status === 'CLOSED'
                ? REGISTRATION_MESSAGES_AR.CLOSED
                : data.status === 'HOLIDAY'
                  ? REGISTRATION_MESSAGES_AR.HOLIDAY
                  : REGISTRATION_MESSAGES_AR.NOT_STARTED
          }
        />
        <span className="font-jakarta text-sm text-on-surface-variant">
          {data.group.startTimeLabel || data.group.startTime} — {data.group.endTimeLabel || data.group.endTime}
        </span>
      </div>

      <section className="mb-5 grid grid-cols-4 gap-3" aria-label="إحصاءات اليوم">
        <Card className="p-3 text-center">
          <p className="font-jakarta text-3xl font-bold text-primary">{presentCount}</p>
          <p className="text-xs text-on-surface-variant">حاضر اليوم</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="font-jakarta text-3xl font-bold text-tertiary">{listenerCount}</p>
          <p className="text-xs text-on-surface-variant">مستمع اليوم</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="font-jakarta text-3xl font-bold text-error">{absentCount}</p>
          <p className="text-xs text-on-surface-variant">غائب اليوم</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="font-jakarta text-3xl font-bold text-primary">{totalPages}</p>
          <p className="text-xs text-on-surface-variant">مجموع الصفحات</p>
        </Card>
      </section>

      <div className="mb-4 flex gap-2" role="tablist" aria-label="نوع التسجيل">
        <Button
          role="tab"
          aria-selected={activeTab === 'present'}
          variant={activeTab === 'present' ? 'primary' : 'outline'}
          className="flex-1"
          onClick={() => setActiveTab('present')}
        >
          حضور ({presentCount})
        </Button>
        <Button
          role="tab"
          aria-selected={activeTab === 'listener'}
          variant={activeTab === 'listener' ? 'primary' : 'outline'}
          className="flex-1"
          onClick={() => setActiveTab('listener')}
        >
          مستمع ({listenerCount})
        </Button>
        <Button
          role="tab"
          aria-selected={activeTab === 'absent'}
          variant={activeTab === 'absent' ? 'primary' : 'outline'}
          className="flex-1"
          onClick={() => setActiveTab('absent')}
        >
          غياب ({absentCount})
        </Button>
      </div>

      {currentRecord && !success && (
        <Card className="mb-5 animate-fade-in bg-surface-container-low p-5">
          <div className="mb-3 flex items-center gap-3">
            <StatusBadge
              status={currentRecord.record.status}
              label={currentRecord.record.status === 'present' ? 'حاضر' : currentRecord.record.status === 'listener' ? 'مستمع' : 'غائب'}
            />
            <span className="text-sm text-on-surface-variant">أنت مسجل اليوم</span>
          </div>
          <dl className="mb-4 space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-on-surface-variant">الاسم:</dt>
              <dd className="font-semibold">{currentRecord.record.studentName}</dd>
            </div>
            {currentRecord.record.status === 'present' && (
              <>
                <div className="flex gap-2">
                  <dt className="text-on-surface-variant">المراجعة:</dt>
                  <dd>{currentRecord.record.revision}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-on-surface-variant">الأوجه:</dt>
                  <dd className="font-jakarta">{currentRecord.record.pagesCount}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-on-surface-variant">السرد:</dt>
                  <dd>{currentRecord.record.countOfSard ? currentRecord.record.countOfSard : '-'}</dd>
                </div>
                {currentRecord.record.order && (
                  <div className="flex gap-2">
                    <dt className="text-on-surface-variant">رقم الدور:</dt>
                    <dd className="font-jakarta font-bold">{currentRecord.record.order}</dd>
                  </div>
                )}
              </>
            )}
            {currentRecord.record.status === 'absent' && currentRecord.record.reason && (
              <div className="flex gap-2">
                <dt className="text-on-surface-variant">السبب:</dt>
                <dd>{currentRecord.record.reason}</dd>
              </div>
            )}
          </dl>
          <Link
            href={`/attendance/edit/${currentRecord.record._id}`}
            className="block w-full rounded-md bg-primary px-4 py-3 text-center font-semibold text-on-primary transition-colors hover:bg-primary-container"
          >
            تعديل التسجيل
          </Link>
        </Card>
      )}

      {isOpen && !currentRecord && (
        <Card className="mb-5 animate-fade-in">
          {message && (
            <div className="mb-4 rounded-md bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">
              {message}
              {dupId && (
                <>
                  <br />
                  {data.entries.find((e) => e._id === dupId)?.status === 'present' ? (
                    <span>أنت مسجل حضور اليوم. </span>
                  ) : data.entries.find((e) => e._id === dupId)?.status === 'listener' ? (
                    <span>أنت مسجل استماع اليوم. </span>
                  ) : (
                    <span>أنت مسجل غياب اليوم. </span>
                  )}
                  <Link
                    href={`/attendance/edit/${dupId}`}
                    className="font-bold underline"
                  >
                    تعديل سجلي
                  </Link>
                  {' '}أو{' '}
                  <Link
                    href={`/attendance/edit/${dupId}?token=${encodeURIComponent(loadEditToken(dupId) || '')}`}
                    className="mt-2 inline-block rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-on-primary"
                  >
                    تعديل السجل
                  </Link>
                </>
              )}
            </div>
          )}

          {conflict && (
            <div className="mb-4 rounded-md bg-secondary-container px-4 py-3 text-sm font-semibold text-on-secondary-container">
              <p className="mb-3">
                أنت مسجل {conflict.existingStatus === 'present' ? 'حضور' : conflict.existingStatus === 'listener' ? 'استماع' : 'غياب'} اليوم —
                هل تريد التحويل إلى {conflict.requestedStatus === 'present' ? 'حضور' : conflict.requestedStatus === 'listener' ? 'استماع' : 'غياب'}؟
              </p>
              <div className="flex gap-2">
                <Button className="flex-1" disabled={submitting} loading={submitting} onClick={() => submitWith(true)}>
                  نعم، تحويل السجل
                </Button>
                <Button variant="outline" disabled={submitting} onClick={() => setConflict(null)}>
                  إلغاء
                </Button>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-md bg-primary-fixed p-4 text-on-primary-fixed">
              <p className="font-bold">
                {success.converted
                  ? `تم تحويل السجل إلى ${success.entry.status === 'absent' ? 'غياب' : success.entry.status === 'listener' ? 'استماع' : 'حضور'}`
                  : `تم تسجيل ${success.entry.status === 'absent' ? 'غياب' : success.entry.status === 'listener' ? 'استماع' : 'حضور'}ك بنجاح`}
              </p>
              {success.entry.status === 'present' && (
                <p className="mt-1 text-sm">
                  رقم دورك: <span className="font-jakarta text-xl font-bold">{success.entry.order}</span>
                </p>
              )}
              <p className="mt-2 text-xs">رمز التعديل (احتفظ به للتعديل لاحقاً):</p>
              <code dir="ltr" className="mt-1 block overflow-x-auto rounded-sm bg-surface p-2 font-jakarta text-xs text-on-surface">
                {success.editToken}
              </code>
              <Link href={`/attendance/edit/${success.entry._id}`} className="mt-2 inline-block text-sm underline">
                تعديل السجل
              </Link>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              id="studentName"
              name="studentName"
              label="الاسم"
              value={form.studentName}
              error={errors.studentName}
              onChange={onChange}
              maxLength={100}
              required
            />
            {activeTab === 'present' && (
              <>
                <Input
                  id="revision"
                  name="revision"
                  label="المراجعة"
                  placeholder="مثال: البقرة"
                  value={form.revision}
                  error={errors.revision}
                  onChange={onChange}
                  maxLength={200}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    id="pagesCount"
                    name="pagesCount"
                    type="number"
                    min="1"
                    max="1000"
                    dir="ltr"
                    label="عدد الأوجه"
                    value={form.pagesCount}
                    error={errors.pagesCount}
                    onChange={onChange}
                    required
                  />
                  <Input
                    id="countOfSard"
                    name="countOfSard"
                    label={<>عدد السرد <span className="text-xs text-on-surface-variant font-normal">(اختياري)</span></>}
                    placeholder=""
                    value={form.countOfSard}
                    error={errors.countOfSard}
                    onChange={onChange}
                    maxLength={500}
                  />
                </div>
              </>
            )}
            {activeTab === 'listener' && (
              <p className="text-sm text-on-surface-variant">
                المستمع مسجل بالاسم فقط — لا يُطلب منه مراجعة أو أوجه
              </p>
            )}
            {activeTab === 'absent' && (
              <Input
                id="reason"
                name="reason"
                label="السبب (اختياري)"
                placeholder="مثال: مرض، سفر، ظروف طارئة"
                value={form.reason}
                error={errors.reason}
                onChange={onChange}
                maxLength={500}
              />
            )}
            <Button type="submit" className="w-full" disabled={submitting} loading={submitting}>
              {submitting ? 'جارٍ التسجيل...' : activeTab === 'present' ? 'تسجيل الحضور' : activeTab === 'listener' ? 'تسجيل الاستماع' : 'تسجيل الغياب'}
            </Button>
          </form>
        </Card>
      )}

      {!isOpen && message && (
        <p className="mb-5 rounded-md bg-error-container px-4 py-3 text-center text-sm font-semibold text-on-error-container">
          {message}
        </p>
      )}

      <section aria-live="polite" aria-relevant="additions">
        <h2 className="mb-3 text-lg">
          {activeTab === 'present' ? 'الطلاب الحاضرون اليوم' : activeTab === 'listener' ? 'المستمعون اليوم' : 'الطلاب الغائبون اليوم'}{' '}
          <span className="font-jakarta text-on-surface-variant">({displayEntries.length})</span>
        </h2>

        {displayEntries.length === 0 ? (
          <p className="rounded-md bg-surface-container-low px-4 py-6 text-center text-on-surface-variant">
            {activeTab === 'present' ? 'لا يوجد طلاب حاضرون بعد' : activeTab === 'listener' ? 'لا يوجد مستمعون بعد' : 'لا يوجد طلاب غائبون بعد'}
          </p>
        ) : (
          <ul className="space-y-2">
            {displayEntries.map((entry) => (
              <li
                key={entry._id}
                id={`row-${entry._id}`}
                className={`flex items-center gap-3 rounded-md bg-surface-container-low px-3 py-3 ${
                  success?.entry?._id === entry._id ? 'ring-1 ring-inset ring-primary' : ''
                } ${freshIds.has(entry._id) ? 'animate-row-new' : ''}`}
              >
                {entry.status === 'present' && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-jakarta text-sm font-bold text-on-primary">
                    {entry.order}
                  </span>
                )}
                {entry.status === 'absent' && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-error font-jakarta text-sm font-bold text-on-error">
                    غ
                  </span>
                )}
                {entry.status === 'listener' && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tertiary font-jakarta text-sm font-bold text-on-tertiary">
                    م
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold" title={entry.studentName}>
                    {entry.studentName}
                  </p>
                  {entry.status === 'present' && (
                    <>
                      <p className="truncate text-sm text-on-surface-variant">{entry.revision}</p>
                      <p className="text-xs text-on-surface-variant">
                        {entry.pagesCount} أوجه · سرد: {entry.countOfSard ? entry.countOfSard : '-'}
                      </p>
                    </>
                  )}
                  {entry.status === 'absent' && entry.reason && (
                    <p className="truncate text-sm text-on-surface-variant">السبب: {entry.reason}</p>
                  )}
                </div>
                <span dir="ltr" className="shrink-0 font-jakarta text-sm text-on-surface-variant">
                  {entry.registeredAtTime}
                </span>
                {ownedTokens[entry._id] && (
                  <Link
                    href={`/attendance/edit/${entry._id}`}
                    className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-container"
                    aria-label={`تعديل سجل ${entry.studentName}`}
                  >
                    تعديل
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 text-center text-xs text-on-surface-variant">
        {isOpen
          ? `تُحدَّث القائمة تلقائياً كل ${POLL_MS / 1000} ثوانٍ عند فتح الصفحة`
          : 'التحديث التلقائي متوقف — انتهى وقت التسجيل'}{' '}
        · {data.today.hijri}
      </p>
    </main>
  );
}