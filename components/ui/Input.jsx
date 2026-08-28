export default function Input({ label, error, id, className = '', ...props }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-semibold text-on-surface-variant">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`input-field ${error ? 'input-field-error' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
}
