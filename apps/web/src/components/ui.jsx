// apps/web/src/components/ui.jsx

export function Card({ children, style = {}, className = '' }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      ...style,
    }} className={className}>
      {children}
    </div>
  );
}

export function Badge({ children, variant = 'default' }) {
  const styles = {
    default: { background: 'var(--bg-subtle)', color: 'var(--text-secondary)' },
    green:   { background: 'var(--green-bg)', color: 'var(--green)' },
    amber:   { background: 'var(--amber-bg)', color: 'var(--amber)' },
    red:     { background: 'var(--red-bg)',   color: 'var(--red)'   },
    blue:    { background: 'var(--blue-bg)',  color: 'var(--blue)'  },
    dark:    { background: 'var(--accent)',   color: 'white'        },
  };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 11,
      fontWeight: 500,
      padding: '3px 8px',
      borderRadius: 6,
      ...styles[variant],
    }}>
      {children}
    </span>
  );
}

export function Spinner({ size = 16 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid var(--border)`,
      borderTopColor: 'var(--text-secondary)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 28,
      gap: 16,
    }}>
      <div>
        <h1 style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '-0.5px',
          color: 'var(--text-primary)',
          marginBottom: 3,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '56px 24px',
      textAlign: 'center',
    }}>
      <div style={{
        width: 48, height: 48,
        background: 'var(--bg-subtle)',
        borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        {Icon && <Icon size={22} color="var(--text-muted)" strokeWidth={1.5} />}
      </div>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>
        {title}
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, maxWidth: 280, lineHeight: 1.5 }}>
        {description}
      </p>
      {action}
    </div>
  );
}