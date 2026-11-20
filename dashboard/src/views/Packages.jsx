import { useState } from "react";

import { api } from "../api.js";
import { useAsync } from "../useAsync.js";
import Icon from "../components/Icon.jsx";
import { Badge, EmptyState, ErrorState, LoadingState, Panel } from "../components/ui.jsx";
import { formatDuration, splitPackageInput } from "../format.js";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "prod", label: "Production" },
  { id: "dev", label: "Development" },
  { id: "missing", label: "Missing" }
];

export default function Packages({ refreshKey, notify }) {
  const { data, error, loading, reload } = useAsync(api.packages, [refreshKey]);
  const [input, setInput] = useState("");
  const [dev, setDev] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const [confirming, setConfirming] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const runOperation = async (promise, successMessage) => {
    setBusy(true);
    setConfirming(null);
    try {
      const result = await promise;
      setLastResult(result);
      setInput("");
      notify("success", successMessage(result));
      reload();
    } catch (operationError) {
      if (operationError.data?.command) {
        setLastResult(operationError.data);
        notify("error", `${operationError.data.command} failed`);
      } else {
        notify("error", operationError.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleInstall = (event) => {
    event.preventDefault();
    const packages = splitPackageInput(input);
    if (!packages.length) return;
    runOperation(api.install(packages, dev), (result) =>
      `Installed ${result.packages.join(", ")}${dev ? " as dev" : ""}`
    );
  };

  const handleRemove = (name) => {
    runOperation(api.uninstall([name]), () => `Removed ${name}`);
  };

  if (loading && !data) return <LoadingState rows={4} />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const packages = data.packages;
  const totals = data.totals;
  const visible = packages.filter((row) => {
    if (filter === "prod") return row.type === "prod";
    if (filter === "dev") return row.type === "dev";
    if (filter === "missing") return row.status === "missing";
    return true;
  });

  const counts = {
    all: packages.length,
    prod: totals.prod,
    dev: totals.dev,
    missing: totals.missing
  };

  return (
    <div className="view">
      <Panel className="toolbar-panel">
        <form className="install-form" onSubmit={handleInstall}>
          <div className="field grow">
            <label htmlFor="install-input">Install packages</label>
            <div className="input-with-icon">
              <Icon name="search" size={15} />
              <input
                id="install-input"
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="express, zod@^3.23.8"
                disabled={busy}
                autoComplete="off"
                spellCheck="false"
              />
            </div>
            <span className="field-hint">
              Space or comma separated. Version ranges like <code>react@^19</code> are supported.
            </span>
          </div>

          <label className="toggle">
            <input
              type="checkbox"
              checked={dev}
              onChange={(event) => setDev(event.target.checked)}
              disabled={busy}
            />
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
            Save as devDependency
          </label>

          <button type="submit" className="btn primary" disabled={busy || !input.trim()}>
            {busy ? (
              <>
                <span className="spinner" /> Working…
              </>
            ) : (
              <>
                <Icon name="plus" size={15} /> Install
              </>
            )}
          </button>
        </form>
      </Panel>

      {lastResult && (
        <Panel
          title="Last operation"
          subtitle={lastResult.command}
          actions={
            <button type="button" className="icon-btn" onClick={() => setLastResult(null)} title="Dismiss">
              <Icon name="x" size={15} />
            </button>
          }
        >
          <div className="result-meta">
            <Badge tone={lastResult.ok ? "success" : "danger"}>
              {lastResult.ok ? `exit ${lastResult.exitCode}` : "failed"}
            </Badge>
            <span>{formatDuration(lastResult.durationMs)}</span>
            {lastResult.timedOut && <Badge tone="warning">timed out</Badge>}
            {lastResult.packages?.length > 0 && (
              <span className="muted">{lastResult.packages.join(", ")}</span>
            )}
          </div>
          <pre className="terminal-output">
            {(lastResult.stdout || lastResult.stderr || "No output.").trim()}
          </pre>
        </Panel>
      )}

      <Panel
        title="Declared dependencies"
        subtitle={`${totals.installed} installed · ${totals.missing} missing · ${totals.prod} production · ${totals.dev} dev`}
        actions={
          <button type="button" className="icon-btn" onClick={reload} title="Reload packages" disabled={busy}>
            <Icon name="refresh" size={16} />
          </button>
        }
      >
        <div className="tabs">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`tab ${filter === item.id ? "active" : ""}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label} <span className="tab-count">{counts[item.id]}</span>
            </button>
          ))}
        </div>

        {packages.length === 0 ? (
          <EmptyState
            icon="box"
            title="No dependencies yet"
            hint="Install your first package above. It will appear in package.json and node_modules."
          />
        ) : visible.length === 0 ? (
          <EmptyState icon="search" title="Nothing matches this filter" hint="Try the All tab." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Package</th>
                  <th>Type</th>
                  <th>Requested</th>
                  <th>Installed</th>
                  <th>Status</th>
                  <th className="align-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.name} className={confirming === row.name ? "row-confirming" : ""}>
                    <td>
                      <code className="package-name">{row.name}</code>
                    </td>
                    <td>
                      <Badge tone={row.type === "dev" ? "info" : "accent"}>
                        {row.type === "dev" ? "dev" : "prod"}
                      </Badge>
                    </td>
                    <td>
                      <code className="muted-code">{row.requested ?? "—"}</code>
                    </td>
                    <td>
                      <code className="muted-code">{row.installed ?? "not installed"}</code>
                    </td>
                    <td>
                      {row.status === "installed" ? (
                        <Badge tone="success">installed</Badge>
                      ) : (
                        <Badge tone="warning">missing</Badge>
                      )}
                    </td>
                    <td className="align-right">
                      {confirming === row.name ? (
                        <span className="confirm-actions">
                          <button
                            type="button"
                            className="btn danger small"
                            onClick={() => handleRemove(row.name)}
                            disabled={busy}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            className="btn ghost small"
                            onClick={() => setConfirming(null)}
                            disabled={busy}
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn ghost small danger-text"
                          onClick={() => setConfirming(row.name)}
                          disabled={busy}
                        >
                          <Icon name="trash" size={13} /> Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
