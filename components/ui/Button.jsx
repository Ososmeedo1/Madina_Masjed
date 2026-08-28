const VARIANTS = {
  primary: 'bg-primary text-on-primary hover:bg-primary-container focus-visible:ring-primary',
  secondary:
    'bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed hover:text-on-secondary-fixed focus-visible:ring-secondary',
  outline:
    'bg-transparent text-primary ring-1 ring-inset ring-outline-variant hover:bg-primary-fixed/30 focus-visible:ring-primary',
  ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-container-high focus-visible:ring-primary',
  gold: 'bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed focus-visible:ring-secondary',
  danger: 'bg-error text-on-error hover:bg-error-container hover:text-on-error-container focus-visible:ring-error',
};

const SIZES = {
  sm: 'min-h-[40px] px-3 py-1.5 text-sm',
  md: 'min-h-[44px] px-4 py-2.5 text-base',
  lg: 'min-h-[48px] px-6 py-3 text-lg',
};

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  children,
  ...props
}) {
  const busy = loading || disabled;
  return (
    <button
      type={type}
      disabled={busy}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] active:shadow-pressed disabled:pointer-events-none disabled:opacity-60 ${
        VARIANTS[variant] ?? VARIANTS.primary
      } ${SIZES[size] ?? SIZES.md} ${className}`}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
