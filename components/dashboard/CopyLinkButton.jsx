'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

export default function CopyLinkButton({ path }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="ghost" size="sm" onClick={copy} type="button">
      {copied ? 'تم النسخ' : 'نسخ الرابط'}
    </Button>
  );
}
