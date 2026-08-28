'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';

export default function Modal({ open, onClose, title, children, confirmLabel = 'تأكيد', cancelLabel = 'إلغاء', onConfirm, danger = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm dark:bg-black/60" onClick={onClose} />
      <div className="card relative w-full max-w-sm p-6 shadow-raised animate-fade-in">
        <h3 className="mb-3 text-lg">{title}</h3>
        <div className="text-sm text-on-surface-variant">{children}</div>
        <div className="mt-5 flex justify-start gap-2">
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} autoFocus>
            {confirmLabel}
          </Button>
          <Button variant="outline" onClick={onClose}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
