import Icon from "./Icon.jsx";

export function Badge({ tone = "muted", children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state-card error">
      <span className="state-icon">
        <Icon name="alert" size={22} />
      </span>
      <div>
        <h3>Something went wrong</h3>
        <p>{error?.message || "Unknown error."}</p>
      </div>
      {onRetry && (
        <button type="button" className="btn ghost" onClick={onRetry}>
          <Icon name="refresh" size={15} /> Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon = "box", title, hint, children }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={22} />
      </span>
      <h3>{title}</h3>
      {hint && <p>{hint}</p>}
      {children}
    </div>
  );
}

export function LoadingState({ rows = 3 }) {
  return (
    <div className="loading-stack" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="skeleton-row" key={index} style={{ animationDelay: `${index * 90}ms` }} />
      ))}
    </div>
  );
}

export function Panel({ title, subtitle, actions, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      {(title || actions) && (
        <header className="panel-head">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="panel-actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
