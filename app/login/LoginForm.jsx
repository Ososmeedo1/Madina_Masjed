'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { ErrorAlert, SuccessAlert } from '@/components/ui/Alerts';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors || {});
        setMessage(data.message || 'تعذر تسجيل الدخول');
        return;
      }

      router.replace(searchParams.get('next') || '/dashboard');
      router.refresh();
    } catch {
      setMessage('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ErrorAlert>{message}</ErrorAlert>

      <Input
        id="email"
        name="email"
        type="email"
        label="البريد الإلكتروني"
        dir="ltr"
        placeholder="teacher@example.com"
        autoComplete="email"
        value={form.email}
        error={errors.email}
        onChange={onChange}
        required
      />

      <Input
        id="password"
        name="password"
        type="password"
        label="كلمة المرور"
        autoComplete="current-password"
        value={form.password}
        error={errors.password}
        onChange={onChange}
        required
      />

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'جارٍ التحقق...' : 'تسجيل الدخول'}
      </Button>
    </form>
  );
}
