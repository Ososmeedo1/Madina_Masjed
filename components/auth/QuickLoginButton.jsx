'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

const HIDDEN_IN_PROD =
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PUBLIC_ENABLE_QUICK_LOGIN !== 'true';

export default function QuickLoginButton({ label = 'دخول سريع للتجربة', redirectTo = '/dashboard' }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (HIDDEN_IN_PROD) return null;

  async function onQuickLogin() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/quick-login', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'تعذر الدخول السريع');
        return;
      }
      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="my-2 flex items-center gap-3 text-sm text-on-surface-variant">
        <span className="h-px flex-1 bg-outline-variant" />
        <span>أو</span>
        <span className="h-px flex-1 bg-outline-variant" />
      </div>
      {error && (
        <p className="mb-2 rounded-md bg-error-container px-4 py-2 text-sm font-semibold text-on-error-container">
          {error}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        loading={loading}
        disabled={loading}
        onClick={onQuickLogin}
      >
        {loading ? 'جارٍ الدخول...' : `⚡ ${label}`}
      </Button>
    </div>
  );
}
