'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DatesChips({ dates, active }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? dates : dates.slice(0, 14);

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold text-on-surface-variant">أيام فيها تسجيل:</span>
      {shown.map((d) => (
        <Link
          key={d.hijriDate}
          href={`/history?date=${d.hijriDate}`}
          aria-current={d.hijriDate === active ? 'page' : undefined}
          className={`min-h-[36px] rounded-full px-3 py-1.5 font-jakarta text-sm leading-none transition-all ${
            d.hijriDate === active
              ? 'bg-primary py-2 text-on-primary shadow-sm'
              : 'bg-surface-container-high py-2 text-on-surface-variant hover:bg-primary-fixed/40 hover:text-on-primary-fixed'
          }`}
          dir="ltr"
        >
          {d.label} ({d.students})
        </Link>
      ))}
      {dates.length > 14 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="min-h-[36px] rounded-full bg-surface-container-high px-3 py-2 text-sm font-semibold text-primary leading-none transition-colors hover:bg-primary-fixed/30"
        >
          {expanded ? 'إظهار أقل' : `إظهار الكل (${dates.length})`}
        </button>
      )}
    </div>
  );
}
