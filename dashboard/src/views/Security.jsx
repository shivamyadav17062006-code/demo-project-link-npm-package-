import { api } from "../api.js";
import { useAsync } from "../useAsync.js";
import Icon from "../components/Icon.jsx";
import { Badge, EmptyState, ErrorState, LoadingState, Panel } from "../components/ui.jsx";
import { severityTone } from "../format.js";

export default function Security({ refreshKey }) {
  const { data, error, loading, reload } = useAsync(api.audit, [refreshKey]);

  if (loading && !data) return <LoadingState rows={4} />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const summary = data.summary;

  return (
    <div className="view">
      <Panel
        title="Vulnerability report"
        subtitle={
          summary ? `${summary.dependencies} dependencies scanned with npm audit` : "npm audit"
        }
        actions={
          <button type="button" className="icon-btn" onClick={reload} title="Re-run audit">
            <Icon name="refresh" size={16} />
          </button>
        }
      >
        {!data.supported ? (
          <EmptyState
            icon="shield"
            title="Audit could not run"
            hint={data.error || "npm audit needs installed dependencies."}
          />
        ) : (
          <>
            <div className="severity-grid">
              <div className="severity-tile total">
                <span>Total</span>
                <strong>{summary.total}</strong>
              </div>
              <div className="severity-tile critical">
                <span>Critical</span>
                <strong>{summary.critical}</strong>
              </div>
              <div className="severity-tile high">
                <span>High</span>
                <strong>{summary.high}</strong>
              </div>
              <div className="severity-tile moderate">
                <span>Moderate</span>
                <strong>{summary.moderate}</strong>
              </div>
              <div className="severity-tile low">
                <span>Low</span>
                <strong>{summary.low}</strong>
              </div>
            </div>

            {data.advisories.length === 0 ? (
              <div className="success-note">
                <Icon name="check" size={16} />
                No known vulnerabilities in the installed dependency tree.
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Package</th>
                      <th>Severity</th>
                      <th>Scope</th>
                      <th>Affected range</th>
                      <th>Fix available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.advisories.map((advisory) => (
                      <tr key={advisory.name}>
                        <td>
                          <code className="package-name">{advisory.name}</code>
                        </td>
                        <td>
                          <Badge tone={severityTone(advisory.severity)}>{advisory.severity}</Badge>
                        </td>
                        <td>
                          <Badge tone={advisory.direct ? "accent" : "muted"}>
                            {advisory.direct ? "direct" : "transitive"}
                          </Badge>
                        </td>
                        <td>
                          <code className="muted-code">{advisory.range ?? "—"}</code>
                        </td>
                        <td>
                          {advisory.fixAvailable === true ? (
                            <Badge tone="success">yes</Badge>
                          ) : advisory.fixAvailable ? (
                            <code className="muted-code">{advisory.fixAvailable}</code>
                          ) : (
                            <Badge tone="warning">no</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="footnote">
              Fixes are never applied automatically. Review the advisory, then run{" "}
              <code>npm audit fix</code> in your terminal if it is safe for your project.
            </p>
          </>
        )}
      </Panel>
    </div>
  );
}
