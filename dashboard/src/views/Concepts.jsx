import { useEffect, useState } from "react";

import { api } from "../api.js";
import { useAsync } from "../useAsync.js";
import Icon from "../components/Icon.jsx";
import { EmptyState, ErrorState, LoadingState, Panel } from "../components/ui.jsx";

export default function Concepts({ refreshKey, onNavigate }) {
  const { data, error, loading, reload } = useAsync(api.learn, [refreshKey]);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    if (data?.topics?.length && !activeId) {
      setActiveId(data.topics[0].id);
    }
  }, [data, activeId]);

  if (loading && !data) return <LoadingState rows={3} />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { topics } = data;
  if (!topics.length) {
    return (
      <EmptyState icon="book" title="No concepts available" hint="The learning library failed to load." />
    );
  }

  const active = topics.find((topic) => topic.id === activeId) ?? topics[0];

  return (
    <div className="view">
      <div className="learn-layout">
        <Panel title="npm concepts" subtitle="Pick a topic to study">
          <div className="concept-list">
            {topics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                className={`concept-item ${active.id === topic.id ? "active" : ""}`}
                onClick={() => setActiveId(topic.id)}
              >
                <span className="concept-index">
                  <Icon name="book" size={15} />
                </span>
                <span>
                  <strong>{topic.title}</strong>
                  <small>{topic.meaning}</small>
                </span>
                <Icon name="chevronRight" size={14} />
              </button>
            ))}
          </div>
        </Panel>

        <Panel
          title={active.title}
          subtitle="What it means in practice"
          actions={
            <button type="button" className="btn ghost small" onClick={() => onNavigate("quiz")}>
              Take the quiz <Icon name="arrowRight" size={14} />
            </button>
          }
        >
          <div className="concept-detail">
            <div className="detail-block">
              <h3>Meaning</h3>
              <p>{active.meaning}</p>
            </div>
            <div className="detail-block">
              <h3>Examples</h3>
              <p>{active.example}</p>
            </div>
            <div className="detail-block">
              <h3>Try this command</h3>
              <code className="command-chip">{active.command}</code>
            </div>
            <p className="footnote">
              The same lesson is available offline in the CLI:{" "}
              <code>npm-buddy explain {active.id}</code>
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
