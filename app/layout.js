import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import OfflineBanner from '@/components/ui/OfflineBanner';
import ThemeInit from '@/components/ui/ThemeInit';

export const metadata = {
  title: {
    default: 'نظام متابعة الحفظ',
    template: '%s | نظام متابعة الحفظ',
  },
  description: 'نظام حضور ومتابعة حلقات تحفيظ القرآن الكريم — المدينة المنورة',
  icons: { icon: '/favicon.svg' },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf9f5' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1512' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen bg-surface font-sans text-on-surface antialiased">
        <ThemeInit />
        <ToastProvider>
          <OfflineBanner />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
