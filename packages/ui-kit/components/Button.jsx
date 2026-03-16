/**
 * @nexus/ui-kit — Button
 * Consome exclusivamente tokens semânticos — sem cores hardcoded.
 * Troca de tema automática via variáveis CSS do contexto pai.
 */

const styles = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--spacing-2)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    borderRadius: 'var(--radii-md)',
    border: '1px solid transparent',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.15s, border-color 0.15s, opacity 0.15s',
    outline: 'none',
  },
  sizes: {
    sm:  { padding: 'var(--spacing-1) var(--spacing-3)', fontSize: 'var(--text-sm)' },
    md:  { padding: 'var(--spacing-2) var(--spacing-4)', fontSize: 'var(--text-base)' },
    lg:  { padding: 'var(--spacing-3) var(--spacing-6)', fontSize: 'var(--text-md)' },
  },
  variants: {
    primary: {
      backgroundColor: 'var(--color-brand-primary)',
      color:           'var(--color-brand-text)',
      borderColor:     'var(--color-brand-primary)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color:           'var(--color-text-secondary)',
      borderColor:     'var(--color-border-default)',
    },
    danger: {
      backgroundColor: 'var(--color-action-danger-soft)',
      color:           'var(--color-action-danger)',
      borderColor:     'transparent',
    },
    success: {
      backgroundColor: 'var(--color-action-success-soft)',
      color:           'var(--color-action-success)',
      borderColor:     'transparent',
    },
  },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  style: extraStyle = {},
  ...props
}) {
  const variantStyle = styles.variants[variant] || styles.variants.primary;
  const sizeStyle    = styles.sizes[size] || styles.sizes.md;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...styles.base,
        ...sizeStyle,
        ...variantStyle,
        opacity: disabled ? 0.5 : 1,
        cursor:  disabled ? 'not-allowed' : 'pointer',
        ...extraStyle,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
