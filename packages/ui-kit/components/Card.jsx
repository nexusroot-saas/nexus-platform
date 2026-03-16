/**
 * @nexus/ui-kit — Card
 */

export function Card({ children, style: extra = {} }) {
  return (
    <div
      style={{
        background:   'var(--color-surface-card)',
        border:       '1px solid var(--color-border-default)',
        borderRadius: 'var(--radii-lg)',
        boxShadow:    'var(--shadow-sm)',
        ...extra,
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, children, style: extra = {} }) {
  return (
    <div
      style={{
        padding:      'var(--spacing-4) var(--spacing-5)',
        borderBottom: '1px solid var(--color-border-default)',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'space-between',
        gap:          'var(--spacing-3)',
        ...extra,
      }}
    >
      {title && (
        <span
          style={{
            fontSize:   'var(--text-base)',
            fontWeight: 600,
            color:      'var(--color-text-primary)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {title}
        </span>
      )}
      {children}
    </div>
  );
}

export function CardBody({ children, style: extra = {} }) {
  return (
    <div style={{ padding: 'var(--spacing-5)', ...extra }}>
      {children}
    </div>
  );
}

export default Card;
