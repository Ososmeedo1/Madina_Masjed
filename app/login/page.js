import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { teacherCount } from '@/lib/services/teacher.service';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  let count = null;
  try {
    count = await teacherCount();
  } catch {
    count = null;
  }
  if (count === 0) redirect('/teacher/setup');

  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-12">
      <Image
        src="/images/picture1.jpg"
        alt=""
        fill
        priority
        className="object-cover opacity-15"
        sizes="100vw"
      />
      <div className="img-overlay-dark" />
      <div className="relative z-10 w-full max-w-md">
        <header className="mb-8 text-center">
          <h1 className="text-3xl">نظام متابعة الحفظ</h1>
          <p className="mt-2 text-on-surface-variant">حلقات تحفيظ القرآن الكريم</p>
        </header>

        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
