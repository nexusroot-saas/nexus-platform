/**
 * @nexus/ui-kit — Input
 */

export function Input({ label, id, error, style: extra = {}, ...props }) {
  return (
    <div style={{ marginBottom: 'var(--spacing-4)' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--spacing-1)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        style={{
          width: '100%',
          padding: 'var(--spacing-2) var(--spacing-3)',
          border: `1px solid ${error ? 'var(--color-action-danger)' : 'var(--color-border-strong)'}`,
          borderRadius: 'var(--radii-md)',
          fontSize: 'var(--text-base)',
          fontFamily: 'var(--font-sans)',
          color: 'var(--color-text-primary)',
          background: 'var(--color-surface-card)',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          ...extra,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--color-brand-primary)';
          e.target.style.boxShadow = '0 0 0 3px var(--color-brand-soft)';
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error
            ? 'var(--color-action-danger)'
            : 'var(--color-border-strong)';
          e.target.style.boxShadow = 'none';
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error && (
        <span
          style={{
            display: 'block',
            marginTop: 'var(--spacing-1)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-action-danger)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}

export default Input;
