'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function SetupForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setErrors({});

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors || {});
        setMessage(data.message || 'تعذر إكمال الإعداد');
        return;
      }

      router.replace('/dashboard');
      router.refresh();
    } catch {
      setMessage('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {message && (
        <p className="rounded-md bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">
          {message}
        </p>
      )}

      <Input
        id="email"
        name="email"
        type="email"
        label="البريد الإلكتروني"
        dir="ltr"
        placeholder="teacher@example.com"
        value={form.email}
        error={errors.email}
        onChange={onChange}
        autoComplete="email"
        required
      />

      <Input
        id="password"
        name="password"
        type="password"
        label="كلمة المرور"
        value={form.password}
        error={errors.password}
        onChange={onChange}
        autoComplete="new-password"
        required
      />

      <Input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        label="تأكيد كلمة المرور"
        value={form.confirmPassword}
        error={errors.confirmPassword}
        onChange={onChange}
        autoComplete="new-password"
        required
      />

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'جارٍ الإعداد...' : 'إنشاء الحساب والبدء'}
      </Button>

      <p className="text-center text-sm text-on-surface-variant">
        يُنشأ هذا الحساب مرة واحدة فقط عند أول تشغيل للنظام
      </p>
    </form>
  );
}
