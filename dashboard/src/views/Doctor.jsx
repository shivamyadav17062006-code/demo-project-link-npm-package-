import { api } from "../api.js";
import { useAsync } from "../useAsync.js";
import Icon from "../components/Icon.jsx";
import { Badge, ErrorState, LoadingState, Panel } from "../components/ui.jsx";

export default function Doctor({ refreshKey }) {
  const { data, error, loading, reload } = useAsync(api.doctor, [refreshKey]);

  if (loading && !data) return <LoadingState rows={4} />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const passed = data.checks.filter((check) => check.ok).length;
  const allGood = passed === data.checks.length;

  return (
    <div className="view">
      <div className="grid-2">
        <Panel
          title="Environment checks"
          subtitle={`${passed} of ${data.checks.length} checks passing`}
          actions={
            <>
              <Badge tone={allGood ? "success" : "warning"}>
                {allGood ? "healthy" : "needs attention"}
              </Badge>
              <button type="button" className="icon-btn" onClick={reload} title="Re-run checks">
                <Icon name="refresh" size={16} />
              </button>
            </>
          }
        >
          <ul className="check-list">
            {data.checks.map((check) => (
              <li key={check.id} className={`check-item ${check.ok ? "ok" : "fail"}`}>
                <span className="check-status">
                  <Icon name={check.ok ? "check" : "alert"} size={14} />
                </span>
                <div className="check-body">
                  <strong>{check.label}</strong>
                  <span>{check.hint}</span>
                </div>
                <code className="check-value">{check.value}</code>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Runtime" subtitle="What the dashboard sees">
          <dl className="detail-list">
            <div>
              <dt>Operating system</dt>
              <dd>{data.os}</dd>
            </div>
            <div>
              <dt>Node.js</dt>
              <dd>
                <code>{data.checks.find((check) => check.id === "node")?.value ?? process.version}</code>
              </dd>
            </div>
            <div>
              <dt>npm CLI</dt>
              <dd>
                <code>{data.checks.find((check) => check.id === "npm")?.value ?? "unknown"}</code>
              </dd>
            </div>
            <div>
              <dt>Project</dt>
              <dd>
                <code className="path" title={data.projectPath}>
                  {data.projectPath}
                </code>
              </dd>
            </div>
          </dl>

          <p className="footnote">
            The same diagnostics are available in the CLI with <code>npm-buddy doctor</code>.
          </p>
        </Panel>
      </div>
    </div>
  );
}
