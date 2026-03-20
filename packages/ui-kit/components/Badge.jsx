/**
 * @nexus/ui-kit — Badge
 * Status e categorias — usa tokens de ação semânticos.
 */

const variantStyles = {
  success: {
    bg: 'var(--color-action-success-soft)',
    color: 'var(--color-action-success)',
  },
  danger: {
    bg: 'var(--color-action-danger-soft)',
    color: 'var(--color-action-danger)',
  },
  warning: {
    bg: 'var(--color-action-warning-soft)',
    color: 'var(--color-action-warning)',
  },
  info: {
    bg: 'var(--color-action-info-soft)',
    color: 'var(--color-action-info)',
  },
  neutral: {
    bg: 'var(--color-surface-alt)',
    color: 'var(--color-text-secondary)',
  },
  brand: { bg: 'var(--color-brand-soft)', color: 'var(--color-brand-primary)' },
};

export function Badge({ children, variant = 'neutral', style: extra = {} }) {
  const v = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--spacing-1)',
        padding: '3px var(--spacing-2)',
        borderRadius: 'var(--radii-full)',
        fontSize: 'var(--text-xs)',
        fontWeight: 500,
        fontFamily: 'var(--font-sans)',
        backgroundColor: v.bg,
        color: v.color,
        ...extra,
      }}
    >
      {children}
    </span>
  );
}

export default Badge;
