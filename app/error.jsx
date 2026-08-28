'use client';

function MosqueIllustration() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" className="mx-auto mb-4 text-primary opacity-30" aria-hidden="true">
      <rect x="35" y="40" width="50" height="45" rx="4" fill="currentColor" />
      <rect x="40" y="25" width="40" height="20" rx="3" fill="currentColor" />
      <circle cx="60" cy="18" r="10" fill="currentColor" />
      <rect x="25" y="50" width="10" height="35" rx="2" fill="currentColor" />
      <rect x="85" y="50" width="10" height="35" rx="2" fill="currentColor" />
      <rect x="55" y="60" width="10" height="25" rx="2" fill="currentColor" className="opacity-60" />
      <path d="M57 18 l3-6 3 6" fill="currentColor" className="opacity-80" />
      <path d="M30 85 h60" stroke="currentColor" strokeWidth="2" className="opacity-40" />
    </svg>
  );
}

export default function Error({ error, reset }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="card max-w-md p-8 text-center">
        <MosqueIllustration />
        <h1 className="text-2xl">حدث خطأ غير متوقع</h1>
        <p className="mt-3 text-on-surface-variant">
          حدثت مشكلة أثناء عرض هذه الصفحة. يمكنك إعادة المحاولة.
        </p>
        <button onClick={reset} className="btn-primary mt-6">
          إعادة المحاولة
        </button>
      </div>
    </main>
  );
}
