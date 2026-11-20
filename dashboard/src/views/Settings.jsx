import { useEffect, useState } from "react";

import { api } from "../api.js";
import { useAsync } from "../useAsync.js";
import Icon from "../components/Icon.jsx";
import { Badge, ErrorState, LoadingState, Panel } from "../components/ui.jsx";

const SAFETY_POINTS = [
  {
    title: "Localhost only",
    body: "The API binds to 127.0.0.1 and rejects requests with any other Host header."
  },
  {
    title: "Fixed npm commands",
    body: "Only install, uninstall, list, outdated, audit, --version and view can run. No free-form shell."
  },
  {
    title: "Validated package names",
    body: "Every package argument is checked against the npm name grammar; at most 10 per operation."
  },
  {
    title: "One mutation at a time",
    body: "Install and remove requests are serialized behind a lock to keep package.json consistent."
  },
  {
    title: "No credentials",
    body: "The dashboard never asks for npm tokens or one-time codes. Publishing stays in your terminal."
  }
];

export default function Settings({ refreshKey, notify, onProjectChange }) {
  const state = useAsync(api.project, [refreshKey]);
  const [pathInput, setPathInput] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (state.data && !dirty) {
      setPathInput(state.data.path);
    }
  }, [state.data, dirty]);

  if (state.loading && !state.data && !formError) return <LoadingState rows={3} />;
  if (state.error && !state.data) return <ErrorState error={state.error} onRetry={state.reload} />;

  const info = state.data;

  const submit = async (event) => {
    event.preventDefault();
    if (!pathInput.trim()) return;
    setBusy(true);
    setFormError(null);
    try {
      const data = await api.setProject(pathInput.trim());
      onProjectChange(data);
      setDirty(false);
      setPathInput(data.path);
      notify("success", `Now managing ${data.name}`);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="view">
      <div className="grid-2">
        <Panel title="Project location" subtitle="The folder the dashboard manages">
          {info ? (
            <dl className="detail-list compact">
              <div>
                <dt>Name</dt>
                <dd>{info.name}</dd>
              </div>
              <div>
                <dt>Version</dt>
                <dd>
                  <code>{info.version}</code>
                </dd>
              </div>
              <div>
                <dt>Dependencies</dt>
                <dd>
                  {info.dependencyCount} production · {info.devDependencyCount} dev
                </dd>
              </div>
              <div>
                <dt>Lockfile</dt>
                <dd>
                  {info.hasLockfile ? (
                    <Badge tone="success">present</Badge>
                  ) : (
                    <Badge tone="warning">missing</Badge>
                  )}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="muted">Project metadata unavailable.</p>
          )}

          <form className="settings-form" onSubmit={submit}>
            <div className="field">
              <label htmlFor="project-path">Project folder</label>
              <div className="input-with-icon">
                <Icon name="folder" size={15} />
                <input
                  id="project-path"
                  type="text"
                  value={pathInput}
                  onChange={(event) => {
                    setPathInput(event.target.value);
                    setDirty(true);
                  }}
                  placeholder="/Users/you/projects/my-app"
                  disabled={busy}
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
              <span className="field-hint">
                Must contain a <code>package.json</code>. Absolute paths and <code>~/</code> are
                supported.
              </span>
            </div>

            {formError && (
              <p className="form-error">
                <Icon name="alert" size={14} /> {formError}
              </p>
            )}

            <div className="form-actions">
              <button type="submit" className="btn primary" disabled={busy || !pathInput.trim()}>
                {busy ? (
                  <>
                    <span className="spinner" /> Switching…
                  </>
                ) : (
                  <>
                    <Icon name="folder" size={15} /> Load project
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setPathInput(info?.defaultProjectPath ?? "");
                  setDirty(true);
                  setFormError(null);
                }}
                disabled={busy || !info?.defaultProjectPath}
              >
                Use default
              </button>
            </div>
          </form>
        </Panel>

        <Panel title="Safety model" subtitle="Why this dashboard stays local">
          <ul className="safety-list">
            {SAFETY_POINTS.map((point) => (
              <li key={point.title}>
                <span className="safety-icon">
                  <Icon name="check" size={13} />
                </span>
                <div>
                  <strong>{point.title}</strong>
                  <p>{point.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="npm-pal CLI" subtitle="The published package behind this dashboard">
        <div className="cli-card">
          <div>
            <span className="muted">Install globally</span>
            <code className="command-chip">npm install -g npm-pal</code>
          </div>
          <div>
            <span className="muted">Run the assistant</span>
            <code className="command-chip">npm-buddy</code>
          </div>
          <div>
            <span className="muted">Open this dashboard</span>
            <code className="command-chip">npm-buddy dashboard</code>
          </div>
          <div>
            <span className="muted">Ask about a concept</span>
            <code className="command-chip">npm-buddy explain dependencies</code>
          </div>
        </div>
        <p className="footnote">
          npm-pal is published on the npm registry and bundles this dashboard. Run{" "}
          <code>npm-buddy dashboard</code> inside any project to reopen it.
        </p>
      </Panel>
    </div>
  );
}
