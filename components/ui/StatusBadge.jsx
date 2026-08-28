import { GROUP_STATUS_LABELS_AR } from '@/lib/utils/group-status';

const TONES = {
  OPEN: 'bg-primary-fixed text-on-primary-fixed',
  NOT_STARTED: 'bg-secondary-fixed text-on-secondary-fixed',
  CLOSED: 'bg-error-container text-on-error-container',
  HOLIDAY: 'bg-surface-container-high text-on-surface-variant ring-1 ring-inset ring-outline-variant',
};

export default function StatusBadge({ status, label }) {
  return (
    <span
      role="status"
      aria-label={label ?? GROUP_STATUS_LABELS_AR[status] ?? status}
      className={`inline-flex min-h-[28px] items-center rounded-full px-3 py-1 text-sm font-semibold shadow-sm ${
        TONES[status] ?? TONES.NOT_STARTED
      }`}
    >
      {label ?? GROUP_STATUS_LABELS_AR[status] ?? status}
    </span>
  );
}
