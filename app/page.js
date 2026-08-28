import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db/mongoose';
import Teacher from '@/lib/models/Teacher';

export const dynamic = 'force-dynamic';

function MosqueIllustration() {
  return (
    <svg width="100" height="80" viewBox="0 0 120 100" fill="none" className="mx-auto mb-4 text-primary opacity-25" aria-hidden="true">
      <rect x="35" y="40" width="50" height="45" rx="4" fill="currentColor" />
      <rect x="40" y="25" width="40" height="20" rx="3" fill="currentColor" />
      <circle cx="60" cy="18" r="10" fill="currentColor" />
      <rect x="25" y="50" width="10" height="35" rx="2" fill="currentColor" />
      <rect x="85" y="50" width="10" height="35" rx="2" fill="currentColor" />
      <path d="M57 18 l3-6 3 6" fill="currentColor" className="opacity-80" />
      <path d="M30 85 h60" stroke="currentColor" strokeWidth="2" className="opacity-40" />
    </svg>
  );
}

export default async function HomePage() {
  let error = null;
  let target = '/teacher/setup';

  try {
    await dbConnect();
    const count = await Teacher.countDocuments();
    target = count > 0 ? '/dashboard' : '/teacher/setup';
  } catch (err) {
    error = err;
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="card max-w-md p-8 text-center">
          <MosqueIllustration />
          <h1 className="text-2xl">تعذر الاتصال بقاعدة البيانات</h1>
          <p className="mt-3 text-on-surface-variant">
            تأكد من تشغيل MongoDB ومن ضبط MONGODB_URI في ملف .env.local
          </p>
        </div>
      </main>
    );
  }

  redirect(target);
}
