import { useState } from "react";

import { api } from "../api.js";
import { useAsync } from "../useAsync.js";
import Icon from "../components/Icon.jsx";
import { Badge, ErrorState, LoadingState, Panel } from "../components/ui.jsx";
import { formatDuration } from "../format.js";

const COMMAND_META = {
  list: { label: "npm list", description: "Show direct dependencies" },
  outdated: { label: "npm outdated", description: "Check for newer versions" },
  audit: { label: "npm audit", description: "Security report as JSON" },
  doctor: { label: "npm --version", description: "Version of the npm CLI" },
  view: { label: "npm view", description: "Registry metadata for one package" }
};

export default function Playground({ notify }) {
  const commands = useAsync(api.playgroundCommands, []);
  const [command, setCommand] = useState("list");
  const [packageName, setPackageName] = useState("express");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  if (commands.loading && !commands.data) return <LoadingState rows={3} />;
  if (commands.error) return <ErrorState error={commands.error} onRetry={commands.reload} />;

  const available = commands.data.commands.filter((id) => COMMAND_META[id]);

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const output = await api.playground(command, command === "view" ? packageName : undefined);
      setResult(output);
    } catch (error) {
      notify("error", error.message);
    } finally {
      setRunning(false);
    }
  };

  const needsPackage = command === "view";
  const preview = needsPackage ? `npm view ${packageName || "<package>"} --json` : COMMAND_META[command].label;

  return (
    <div className="view">
      <Panel
        title="Run a safe npm command"
        subtitle="Only fixed, read-only commands are allowed"
        actions={
          <Badge tone="info">
            <Icon name="lock" size={12} /> sandboxed
          </Badge>
        }
      >
        <div className="playground-commands">
          {available.map((id) => (
            <button
              key={id}
              type="button"
              className={`command-option ${command === id ? "active" : ""}`}
              onClick={() => setCommand(id)}
              disabled={running}
            >
              <strong>{COMMAND_META[id].label}</strong>
              <span>{COMMAND_META[id].description}</span>
            </button>
          ))}
        </div>

        <div className="playground-runner">
          <div className="preview-line">
            <span className="prompt">$</span>
            <code>{preview}</code>
          </div>

          {needsPackage && (
            <div className="field">
              <label htmlFor="playground-package">Package name</label>
              <div className="input-with-icon">
                <Icon name="search" size={15} />
                <input
                  id="playground-package"
                  type="text"
                  value={packageName}
                  onChange={(event) => setPackageName(event.target.value)}
                  placeholder="express"
                  disabled={running}
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
            </div>
          )}

          <button
            type="button"
            className="btn primary"
            onClick={run}
            disabled={running || (needsPackage && !packageName.trim())}
          >
            {running ? (
              <>
                <span className="spinner" /> Running…
              </>
            ) : (
              <>
                <Icon name="play" size={14} /> Run command
              </>
            )}
          </button>
        </div>

        <div className="terminal-panel">
          <div className="terminal-bar">
            <span className="terminal-dots">
              <span />
              <span />
              <span />
            </span>
            <span className="terminal-title">output</span>
            {result && (
              <span className="terminal-meta">
                <Badge tone={result.ok ? "success" : "danger"}>
                  {result.ok ? `exit ${result.exitCode}` : "failed"}
                </Badge>
                <span>{formatDuration(result.durationMs)}</span>
              </span>
            )}
          </div>
          <pre className="terminal-output tall">
            {result
              ? (result.stdout || result.stderr || "The command finished without output.").trim()
              : "Run a command to see its output here."}
          </pre>
        </div>

        <p className="footnote">
          Install and remove live in the Packages view, where package names are validated before
          anything runs.
        </p>
      </Panel>
    </div>
  );
}
