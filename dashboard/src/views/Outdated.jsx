import { api } from "../api.js";
import { useAsync } from "../useAsync.js";
import Icon from "../components/Icon.jsx";
import { Badge, EmptyState, ErrorState, LoadingState, Panel } from "../components/ui.jsx";

export default function Outdated({ refreshKey }) {
  const { data, error, loading, reload } = useAsync(api.outdated, [refreshKey]);

  if (loading && !data) return <LoadingState rows={4} />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const majorBehind = data.rows.filter((row) => row.majorBehind).length;
  const devCount = data.rows.filter((row) => row.type === "dev").length;

  return (
    <div className="view">
      <Panel
        title="Outdated packages"
        subtitle="Newer versions published to the registry"
        actions={
          <button type="button" className="icon-btn" onClick={reload} title="Check again">
            <Icon name="refresh" size={16} />
          </button>
        }
      >
        {!data.supported ? (
          <EmptyState
            icon="clock"
            title="Version check unavailable"
            hint={data.error || "npm outdated could not read this project."}
          />
        ) : data.rows.length === 0 ? (
          <div className="success-note">
            <Icon name="check" size={16} />
            Every installed package is on the latest matching version.
          </div>
        ) : (
          <>
            <div className="mini-stats">
              <div>
                <span>Updates</span>
                <strong>{data.rows.length}</strong>
              </div>
              <div>
                <span>Major behind</span>
                <strong>{majorBehind}</strong>
              </div>
              <div>
                <span>Dev dependencies</span>
                <strong>{devCount}</strong>
              </div>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Package</th>
                    <th>Type</th>
                    <th>Current</th>
                    <th>Wanted</th>
                    <th>Latest</th>
                    <th>Gap</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.name}>
                      <td>
                        <code className="package-name">{row.name}</code>
                      </td>
                      <td>
                        <Badge
                          tone={row.type === "dev" ? "info" : row.type === "prod" ? "accent" : "muted"}
                        >
                          {row.type}
                        </Badge>
                      </td>
                      <td>
                        <code className="muted-code">{row.current ?? "—"}</code>
                      </td>
                      <td>
                        <code className="muted-code">{row.wanted ?? "—"}</code>
                      </td>
                      <td>
                        <code className="muted-code">{row.latest ?? "—"}</code>
                      </td>
                      <td>
                        {row.majorBehind ? (
                          <Badge tone="danger">major</Badge>
                        ) : (
                          <Badge tone="warning">update</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="footnote">
              Update a package from the Packages view by installing it with the desired version
              range.
            </p>
          </>
        )}
      </Panel>
    </div>
  );
}
