export function ErrorAlert({ children }) {
  if (!children) return null;
  return (
    <div className="mb-4 rounded-md bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container ring-1 ring-inset ring-error/20" role="alert">
      {children}
    </div>
  );
}

export function SuccessAlert({ children }) {
  if (!children) return null;
  return (
    <div className="mb-4 rounded-md bg-primary-fixed px-4 py-3 text-sm font-semibold text-on-primary-fixed ring-1 ring-inset ring-primary/20" role="status">
      {children}
    </div>
  );
}
