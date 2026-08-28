'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-surface font-sans text-on-surface antialiased">
        <main className="flex min-h-screen items-center justify-center px-5">
          <div className="card max-w-md p-8 text-center">
            <h1 className="text-2xl">خطأ في النظام</h1>
            <p className="mt-3 text-on-surface-variant">
              تعذر تحميل التطبيق. يرجى إعادة المحاولة.
            </p>
            <button
              onClick={reset}
              className="btn-primary mt-6"
            >
              إعادة المحاولة
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
