import { useCallback, useEffect, useState } from "react";

import { api } from "../api.js";
import Icon from "../components/Icon.jsx";
import { Badge, EmptyState, ErrorState, LoadingState, Panel } from "../components/ui.jsx";
import { activityMeta, formatDuration, timeAgo } from "../format.js";

export default function Activity({ refreshKey }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [live, setLive] = useState(true);

  const load = useCallback(async (silent = false) => {
    try {
      const data = await api.activity();
      setItems(data.items);
      setError(null);
      setLive(true);
    } catch (loadError) {
      if (!silent) setError(loadError);
      setLive(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(() => load(true), 8000);
    return () => window.clearInterval(id);
  }, [load, refreshKey]);

  if (!items && error) return <ErrorState error={error} onRetry={() => load()} />;
  if (!items) return <LoadingState rows={4} />;

  return (
    <div className="view">
      <Panel
        title="Operation log"
        subtitle="Newest first · keeps the last 50 operations in memory"
        actions={
          <>
            <span className={`live-pill ${live ? "" : "off"}`}>{live ? "live" : "paused"}</span>
            <button type="button" className="icon-btn" onClick={() => load()} title="Refresh log">
              <Icon name="refresh" size={16} />
            </button>
          </>
        }
      >
        {items.length === 0 ? (
          <EmptyState
            icon="pulse"
            title="No operations logged yet"
            hint="Installs, removals, project switches and playground runs will appear here."
          />
        ) : (
          <ul className="activity-feed">
            {items.map((item) => {
              const meta = activityMeta(item.kind);
              return (
                <li key={item.id} className="activity-item">
                  <span className={`activity-icon tone-${item.ok ? meta.tone : "danger"}`}>
                    <Icon name={meta.icon} size={15} />
                  </span>
                  <div className="activity-body">
                    <div className="activity-title">
                      <strong>{item.label}</strong>
                      <Badge tone={item.ok ? "success" : "danger"}>
                        {item.ok ? "ok" : `exit ${item.exitCode ?? "?"}`}
                      </Badge>
                    </div>
                    <span className="activity-summary">{item.summary}</span>
                    {item.command && <code className="activity-command">{item.command}</code>}
                  </div>
                  <div className="activity-meta">
                    <time dateTime={item.at}>{timeAgo(item.at)}</time>
                    <span>{formatDuration(item.durationMs)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
