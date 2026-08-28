import { redirect } from 'next/navigation';
import Image from 'next/image';
import { teacherCount } from '@/lib/services/teacher.service';
import SetupForm from './SetupForm';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'الإعداد الأول' };

export default async function TeacherSetupPage() {
  let count = null;
  try {
    count = await teacherCount();
  } catch {
    count = null;
  }

  if (count === null) {
    return (
      <main className="flex h-dvh items-center justify-center px-5">
        <div className="card max-w-md p-8 text-center">
          <svg width="100" height="80" viewBox="0 0 120 100" fill="none" className="mx-auto mb-4 text-primary opacity-25" aria-hidden="true">
            <rect x="35" y="40" width="50" height="45" rx="4" fill="currentColor" />
            <rect x="40" y="25" width="40" height="20" rx="3" fill="currentColor" />
            <circle cx="60" cy="18" r="10" fill="currentColor" />
            <rect x="25" y="50" width="10" height="35" rx="2" fill="currentColor" />
            <rect x="85" y="50" width="10" height="35" rx="2" fill="currentColor" />
            <path d="M57 18 l3-6 3 6" fill="currentColor" className="opacity-80" />
            <path d="M30 85 h60" stroke="currentColor" strokeWidth="2" className="opacity-40" />
          </svg>
          <h1 className="text-2xl">تعذر الاتصال بقاعدة البيانات</h1>
          <p className="mt-3 text-on-surface-variant">
            تأكد من تشغيل MongoDB ومن ضبط MONGODB_URI في ملف .env.local
          </p>
        </div>
      </main>
    );
  }

  if (count > 0) redirect('/login');

  return (
    <main className="relative flex h-dvh items-center justify-center px-5 py-12">
      <Image
        src="/images/picture3.jpg"
        alt=""
        fill
        priority
        className="object-cover opacity-10"
        sizes="100vw"
      />
      <div className="img-overlay-dark" />
      <div className="relative z-10 w-full max-w-md">
        <header className="mb-8 text-center">
          <h1 className="text-3xl">إعداد النظام لأول مرة</h1>
          <p className="mt-2 leading-relaxed text-on-surface-variant">
            أنشئ حساب المعلم الرئيسي لبدء إدارة حلقات التحفيظ ومتابعة حضور الطلاب
          </p>
        </header>

        <div className="card p-6 md:p-8">
          <SetupForm />
        </div>
      </div>
    </main>
  );
}
