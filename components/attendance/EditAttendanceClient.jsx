'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import StatusBadge from '@/components/ui/StatusBadge';
import { fetchJson } from '@/lib/utils/fetcher';
import { useToast } from '@/components/ui/Toast';

function loadStoredToken(id) {
  try {
    const store = JSON.parse(localStorage.getItem('masjed_edit_tokens') || '{}');
    return store[id] || null;
  } catch {
    return null;
  }
}

function saveStoredToken(id, token) {
  try {
    const store = JSON.parse(localStorage.getItem('masjed_edit_tokens') || '{}');
    store[id] = token;
    localStorage.setItem('masjed_edit_tokens', JSON.stringify(store));
  } catch {}
}

export default function EditAttendanceClient({ attendanceId, initialToken }) {
  const [token, setToken] = useState(initialToken || '');
  const [tokenInput, setTokenInput] = useState('');
  const [phase, setPhase] = useState(initialToken ? 'loading' : 'needToken');
  const [loadError, setLoadError] = useState('');
  const [record, setRecord] = useState(null);
  const [group, setGroup] = useState(null);
  const [labels, setLabels] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetchRecord = useCallback(
    async (t) => {
      setPhase('loading');
      setLoadError('');
      try {
        const res = await fetch(
          `/api/attendance/${attendanceId}?token=${encodeURIComponent(t)}`
        );
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 404) setLoadError(data.message);
          else setLoadError(data.message || 'تعذر تحميل السجل');
          setPhase(res.status === 404 ? 'notFound' : 'needToken');
          return;
        }

        saveStoredToken(attendanceId, t);
        setToken(t);
        setRecord(data.record);
        setGroup(data.group);
        setLabels(data.labels);
        setForm({
          studentName: data.record.studentName,
          revision: data.record.revision,
          pagesCount: String(data.record.pagesCount),
          countOfSard: data.record.countOfSard,
          reason: data.record.reason || '',
          status: data.record.status,
        });
        setPhase('ready');
      } catch {
        setLoadError('خطأ في الاتصال بالخادم');
        setPhase('needToken');
      }
    },
    [attendanceId]
  );

  useEffect(() => {
    if (initialToken) {
      fetchRecord(initialToken);
      return;
    }
    const stored = loadStoredToken(attendanceId);
    if (stored) fetchRecord(stored);
    else setPhase('needToken');
  }, [attendanceId, initialToken, fetchRecord]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setErrors({});
    setSaved(false);

    try {
      const payload = { token, studentName: form.studentName, status: form.status };
      if (form.status === 'present') {
        payload.revision = form.revision;
        payload.pagesCount = form.pagesCount ? Number(form.pagesCount) : undefined;
        payload.countOfSard = form.countOfSard;
      } else if (form.status === 'absent') {
        payload.reason = form.reason;
      }

      const res = await fetch(`/api/attendance/${attendanceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors || {});
        setMessage(data.message || 'تعذر التحديث');
        return;
      }

      setRecord(data.entry);
      setForm((f) => ({
        ...f,
        studentName: data.entry.studentName,
        revision: data.entry.revision,
        pagesCount: String(data.entry.pagesCount ?? ''),
        countOfSard: data.entry.countOfSard,
        reason: data.entry.reason || '',
        status: data.entry.status,
      }));
      if (data.editToken) {
        setToken(data.editToken);
        saveStoredToken(attendanceId, data.editToken);
      }
      setSaved(true);
      const statusLabel = data.entry.status === 'absent' ? 'غياب' : data.entry.status === 'listener' ? 'استماع' : 'حضور';
      toast('success', data.converted
        ? `تم تحويل السجل إلى ${statusLabel}`
        : 'تم تحديث السجل بنجاح');
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setMessage('خطأ في الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  }

  function handleConvert(newStatus) {
    setErrors({});
    setMessage('');
    setSaved(false);

    if (newStatus === 'present') {
      setForm((f) => ({
        ...f,
        status: 'present',
        revision: '',
        pagesCount: '',
        countOfSard: '',
        reason: '',
      }));
    } else if (newStatus === 'listener') {
      setForm((f) => ({
        ...f,
        status: 'listener',
        revision: '',
        pagesCount: '',
        countOfSard: '',
        reason: '',
      }));
    } else {
      setForm((f) => ({
        ...f,
        status: 'absent',
        revision: '',
        pagesCount: '',
        countOfSard: '',
        reason: f.reason || 'تم التحويل',
      }));
    }
  }

  if (phase === 'loading') {
    return (
      <main className="mx-auto max-w-lg px-5 py-10 text-center text-on-surface-variant">
        جارٍ التحقق من الرمز...
      </main>
    );
  }

  if (phase === 'notFound') {
    return (
      <main className="mx-auto max-w-lg px-5 py-10">
        <Card className="p-8 text-center">
          <svg width="60" height="50" viewBox="0 0 24 24" fill="currentColor" className="mx-auto mb-3 text-primary opacity-25" aria-hidden="true">
            <path d="M12 2l2.4 4.9L20 8l-4 3.9.9 5.6L12 14.8 7.1 17.5 8 11.9 4 8l5.6-1.1L12 2z" />
          </svg>
          <h1 className="text-xl">{loadError}</h1>
          <Link href="/attendance/group-1" className="mt-4 inline-block text-primary underline">
            رجوع لصفحة الحضور
          </Link>
        </Card>
      </main>
    );
  }

  if (phase === 'needToken') {
    return (
      <main className="mx-auto max-w-lg px-5 py-10">
        <Card className="p-6 md:p-8">
          <h1 className="mb-2 text-xl">تعديل سجل الحضور/الغياب/الاستماع</h1>
          {loadError && (
            <p className="mb-3 rounded-md bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">
              {loadError}
            </p>
          )}
          <p className="mb-4 text-sm text-on-surface-variant">
            أدخل رمز التعديل الذي ظهر لك عند التسجيل
          </p>
          <div className="space-y-4">
            <Input
              id="token"
              name="token"
              label="رمز التعديل"
              dir="ltr"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              required
            />
            <Button className="w-full" disabled={!tokenInput.trim()} onClick={() => fetchRecord(tokenInput.trim())}>
              متابعة
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  const isAbsent = record?.status === 'absent';
  const isListener = record?.status === 'listener';

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-6 md:py-10">
      <header className="mb-5 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-primary opacity-50" aria-hidden="true">
            <path d="M12 2l2.4 4.9L20 8l-4 3.9.9 5.6L12 14.8 7.1 17.5 8 11.9 4 8l5.6-1.1L12 2z" />
          </svg>
          <h1 className="text-2xl">تعديل سجل {isAbsent ? 'الغياب' : isListener ? 'الاستماع' : 'الحضور'}</h1>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-primary opacity-50" aria-hidden="true">
            <path d="M12 2l2.4 4.9L20 8l-4 3.9.9 5.6L12 14.8 7.1 17.5 8 11.9 4 8l5.6-1.1L12 2z" />
          </svg>
        </div>
        {group && <p className="mt-1 text-on-surface-variant">{group.name}</p>}
      </header>

      {record && (
        <Card className="mb-5 bg-surface-container-low p-4">
          <div className="mb-3 flex items-center gap-2">
            <StatusBadge status={record.status} label={record.status === 'present' ? 'حاضر' : record.status === 'listener' ? 'مستمع' : 'غائب'} />
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {record.status === 'present' && (
              <>
                <dt className="text-on-surface-variant">رقم الدور</dt>
                <dd className="font-jakarta font-bold">{record.order}</dd>
              </>
            )}
            <dt className="text-on-surface-variant">التاريخ الهجري</dt>
            <dd className="text-left">{labels?.attendanceHijri}</dd>
            <dt className="text-on-surface-variant">وقت التسجيل</dt>
            <dd className="text-left">{labels?.registeredAt}</dd>
          </dl>
          <p className="mt-3 border-t border-outline-variant/30 pt-2 text-xs text-on-surface-variant">
            هذه البيانات ثابتة ولا يمكن تعديلها
          </p>
        </Card>
      )}

      {form && (
        <Card>
          {message && (
            <p className="mb-4 rounded-md bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">
              {message}
            </p>
          )}
          {saved && (
            <p className="mb-4 rounded-md bg-primary-fixed px-4 py-3 text-sm font-semibold text-on-primary-fixed">
              تم تحديث السجل بنجاح
            </p>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              id="studentName"
              name="studentName"
              label="الاسم"
              value={form.studentName}
              error={errors.studentName}
              onChange={onChange}
              maxLength={80}
              required
            />
            {form.status === 'present' && (
              <>
                <Input
                  id="revision"
                  name="revision"
                  label="المراجعة"
                  value={form.revision}
                  error={errors.revision}
                  onChange={onChange}
                  maxLength={60}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    id="pagesCount"
                    name="pagesCount"
                    type="number"
                    min="1"
                    max="604"
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
                    placeholder="مثال: نصف وجه"
                    value={form.countOfSard ?? ''}
                    error={errors.countOfSard}
                    onChange={onChange}
                    maxLength={200}
                  />
                </div>
              </>
            )}
            {form.status === 'listener' && (
              <p className="text-sm text-on-surface-variant">
                المستمع مسجل بالاسم فقط — لا يُطلب منه مراجعة أو أوجه
              </p>
            )}
            {form.status === 'absent' && (
              <Input
                id="reason"
                name="reason"
                label="السبب"
                value={form.reason}
                error={errors.reason}
                onChange={onChange}
                maxLength={500}
              />
            )}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
              </Button>
              {form.status === 'present' && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleConvert('absent')}
                    disabled={saving}
                  >
                    غياب
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleConvert('listener')}
                    disabled={saving}
                  >
                    استماع
                  </Button>
                </>
              )}
              {form.status === 'listener' && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleConvert('present')}
                    disabled={saving}
                  >
                    حضور
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleConvert('absent')}
                    disabled={saving}
                  >
                    غياب
                  </Button>
                </>
              )}
              {form.status === 'absent' && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleConvert('present')}
                    disabled={saving}
                  >
                    حضور
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleConvert('listener')}
                    disabled={saving}
                  >
                    استماع
                  </Button>
                </>
              )}
            </div>
            <Link href={`/attendance/${group?.key ?? ''}`} className="block text-center text-sm text-primary underline">
              رجوع لصفحة الحضور
            </Link>
          </form>
        </Card>
      )}
    </main>
  );
}