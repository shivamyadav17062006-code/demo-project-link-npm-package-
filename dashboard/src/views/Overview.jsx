import { useMemo, useState } from "react";

import { api } from "../api.js";
import { useAsync } from "../useAsync.js";
import Icon from "../components/Icon.jsx";
import { Badge, EmptyState, ErrorState, LoadingState, Panel } from "../components/ui.jsx";
import { activityMeta, timeAgo } from "../format.js";

const RANGES = [
  {
    id: "60m",
    label: "60m",
    buckets: 12,
    span: 60 * 60_000,
    ticks: ["60m ago", "45m", "30m", "15m", "Now"]
  },
  {
    id: "7d",
    label: "7d",
    buckets: 7,
    span: 7 * 24 * 60 * 60_000,
    ticks: ["7 days ago", "5d", "3d", "1d", "Now"]
  },
  {
    id: "30d",
    label: "30d",
    buckets: 30,
    span: 30 * 24 * 60 * 60_000,
    ticks: ["30 days ago", "22d", "15d", "7d", "Now"]
  }
];

const CHART = { width: 760, height: 118, top: 12 };

const QUICK_LINKS = [
  { label: "List packages", command: "npm list" },
  { label: "Check outdated", command: "npm outdated" },
  { label: "Run doctor", command: "npm --version" }
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function bucketActivity(items, range) {
  const now = Date.now();
  const start = now - range.span;
  const success = Array(range.buckets).fill(0);
  const failed = Array(range.buckets).fill(0);

  for (const item of items) {
    const at = new Date(item.at).getTime();
    if (!Number.isFinite(at) || at < start) continue;
    const ratio = Math.min((at - start) / range.span, 0.999999);
    const index = Math.floor(ratio * range.buckets);
    (item.ok ? success : failed)[index] += 1;
  }

  return { success, failed };
}

function linePath(values, max) {
  const step = CHART.width / Math.max(values.length - 1, 1);
  return values
    .map((value, index) => {
      const x = (index * step).toFixed(1);
      const y = (CHART.top + (1 - value / max) * (CHART.height - CHART.top)).toFixed(1);
      return `${index === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join(" ");
}

function resolveQuickCommand(raw) {
  const text = raw.trim().replace(/\s+/g, " ");
  if (text === "npm list") return { id: "list" };
  if (text === "npm outdated") return { id: "outdated" };
  if (text === "npm audit") return { id: "audit" };
  if (text === "npm --version") return { id: "doctor" };
  const view = text.match(/^npm view (\S+)$/);
  if (view) return { id: "view", pkg: view[1] };
  return null;
}

function Metric({ label, value, note, icon, tone }) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <span className="metric-icon">
        <Icon name={icon} size={17} />
      </span>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <span className="metric-note">{note}</span>
      <span className={`metric-accent ${tone}`} aria-hidden="true" />
    </article>
  );
}

export default function Overview({ refreshKey, project, notify, onNavigate }) {
  const { data, error, loading, reload } = useAsync(
    async () => {
      const [packages, outdated, audit, doctor, activity] = await Promise.all([
        api.packages(),
        api.outdated(),
        api.audit(),
        api.doctor(),
        api.activity()
      ]);
      return { packages, outdated, audit, doctor, activity };
    },
    [refreshKey]
  );

  const [rangeId, setRangeId] = useState("60m");
  const [status, setStatus] = useState("LATEST");
  const [commandInput, setCommandInput] = useState("npm list");
  const [quickResult, setQuickResult] = useState(null);
  const [running, setRunning] = useState(false);

  const range = RANGES.find((item) => item.id === rangeId) ?? RANGES[0];
  const activities = data?.activity.items ?? [];

  const series = useMemo(() => bucketActivity(activities, range), [activities, range]);
  const successTotal = series.success.reduce((sum, value) => sum + value, 0);
  const failedTotal = series.failed.reduce((sum, value) => sum + value, 0);

  if (loading && !data) return <LoadingState rows={4} />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const totals = data.packages.totals;
  const declared = totals.prod + totals.dev;
  const outdatedRows = data.outdated.rows;
  const majorBehind = outdatedRows.filter((row) => row.majorBehind).length;
  const auditSummary = data.audit.summary;
  const vulnerabilities = auditSummary?.total ?? 0;
  const passedChecks = data.doctor.checks.filter((check) => check.ok).length;
  const healthPct = Math.round((passedChecks / data.doctor.checks.length) * 100);
  const failedChecks = data.doctor.checks.length - passedChecks;

  const chartMax = Math.max(3, ...series.success, ...series.failed);
  const successPath = linePath(series.success, chartMax);
  const failedPath = linePath(series.failed, chartMax);
  const areaPath = `${successPath} L${CHART.width} 130 L0 130 Z`;
  const yLabels = [chartMax, Math.round((chartMax * 2) / 3), Math.round(chartMax / 3), 0];

  const recent = activities.slice(0, 5);
  const filtered = recent.filter((item) => {
    if (status === "SUCCESS") return item.ok;
    if (status === "FAILED") return !item.ok;
    return true;
  });

  const runQuick = async (event) => {
    event.preventDefault();
    const resolved = resolveQuickCommand(commandInput);
    if (!resolved) {
      notify(
        "error",
        "Quick command only runs npm list, npm outdated, npm audit, npm view <package> and npm --version."
      );
      return;
    }
    setRunning(true);
    try {
      const output = await api.playground(resolved.id, resolved.pkg);
      setQuickResult(output);
      reload();
    } catch (runError) {
      notify("error", runError.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="view">
      <section className="welcome-row">
        <div>
          <h2>{greeting()}</h2>
          <p>
            Here's what's happening in <b>{project?.name ?? "your project"}</b>.
          </p>
        </div>
        <button type="button" className="btn primary" onClick={() => onNavigate("playground")}>
          <Icon name="plus" size={14} /> Run a command
        </button>
      </section>

      <section className="metrics">
        <Metric
          icon="box"
          tone="teal"
          label="Dependencies"
          value={declared}
          note={`${totals.prod} production · ${totals.dev} dev`}
        />
        <Metric
          icon="refresh"
          tone="amber"
          label="Outdated packages"
          value={outdatedRows.length}
          note={
            !data.outdated.supported
              ? "Version check unavailable"
              : outdatedRows.length
                ? `${majorBehind} major version${majorBehind === 1 ? "" : "s"} behind`
                : "Everything is current"
          }
        />
        <Metric
          icon="shield"
          tone={vulnerabilities ? "red" : "green"}
          label="Vulnerabilities"
          value={vulnerabilities}
          note={
            auditSummary
              ? vulnerabilities
                ? `${auditSummary.critical} critical · ${auditSummary.high} high`
                : "No known issues"
              : "Audit unavailable"
          }
        />
        <Metric
          icon="heart"
          tone="purple"
          label="Project health"
          value={`${healthPct}%`}
          note={
            failedChecks
              ? `${failedChecks} check${failedChecks === 1 ? "" : "s"} need attention`
              : "All checks passed"
          }
        />
      </section>

      <section className="panel chart-panel">
        <div className="panel-head">
          <div>
            <h2>Package activity</h2>
            <p>Operations recorded in this window</p>
          </div>
          <div className="segmented" role="group" aria-label="Activity range">
            {RANGES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={rangeId === item.id ? "active" : ""}
                onClick={() => setRangeId(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="chart-legend">
          <span>
            <i className="legend-teal" /> Successful operations
          </span>
          <span>
            <i className="legend-red" /> Failed operations
          </span>
        </div>

        <div className="chart">
          <div className="y-labels" aria-hidden="true">
            {yLabels.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>
          <svg
            viewBox="0 0 760 130"
            preserveAspectRatio="none"
            role="img"
            aria-label={`${successTotal} successful and ${failedTotal} failed operations in the last ${range.label}`}
          >
            {[10, 43, 76, 109].map((y) => (
              <line key={y} x1="0" y1={y} x2="760" y2={y} className="grid-line" />
            ))}
            <path d={areaPath} className="area-teal" />
            <path d={successPath} className="line-teal" />
            <path d={failedPath} className="line-red" />
          </svg>
          <div className="x-labels" aria-hidden="true">
            {range.ticks.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>
        </div>

        {successTotal + failedTotal === 0 && (
          <p className="chart-empty">
            No operations recorded in this window yet. Install a package or run a command to start
            the chart.
          </p>
        )}
      </section>

      <div className="lower-grid">
        <Panel
          title="Recent activity"
          subtitle="Latest commands executed in this project"
          actions={
            <button type="button" className="text-button" onClick={() => onNavigate("activity")}>
              View logs →
            </button>
          }
        >
          <div className="status-tabs">
            {["LATEST", "SUCCESS", "FAILED"].map((tab) => (
              <button
                key={tab}
                type="button"
                className={status === tab ? "active" : ""}
                onClick={() => setStatus(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {filtered.length ? (
            <div className="activity-list">
              {filtered.map((item) => {
                const meta = activityMeta(item.kind);
                return (
                  <div className="activity-item" key={item.id}>
                    <span className="terminal-icon">
                      <Icon name={meta.icon} size={14} />
                    </span>
                    <div className="activity-copy">
                      <b>{item.command ?? item.label}</b>
                      <small>{item.summary}</small>
                    </div>
                    <div className="activity-meta">
                      <span className={`status-pill ${item.ok ? "success" : "failed"}`}>
                        {item.ok ? "SUCCESS" : "FAILED"}
                      </span>
                      <small>{timeAgo(item.at)}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="pulse"
              title="Nothing to show"
              hint={
                status === "LATEST"
                  ? "Install a package or run a command to populate the log."
                  : `No ${status.toLowerCase()} operations yet.`
              }
            />
          )}
        </Panel>

        <section className="panel command-panel">
          <div className="panel-head">
            <div>
              <h2>Quick command</h2>
              <p>Run a fixed, read-only npm command</p>
            </div>
            <span className="terminal-badge">
              <Icon name="terminal" size={11} /> CLI
            </span>
          </div>

          <form onSubmit={runQuick}>
            <label className="field-label" htmlFor="quick-command">
              COMMAND
            </label>
            <div className="command-input">
              <span>$</span>
              <input
                id="quick-command"
                type="text"
                value={commandInput}
                onChange={(event) => setCommandInput(event.target.value)}
                disabled={running}
                autoComplete="off"
                spellCheck="false"
              />
            </div>
            <button type="submit" className="run-button" disabled={running || !commandInput.trim()}>
              {running ? (
                <>
                  <span className="spinner dark" /> Running…
                </>
              ) : (
                <>
                  <Icon name="play" size={13} /> Run command
                </>
              )}
            </button>
          </form>

          {quickResult && (
            <div className="cmd-output">
              <div className="cmd-output-head">
                <Badge tone={quickResult.ok ? "success" : "danger"}>
                  {quickResult.ok ? "SUCCESS" : "FAILED"}
                </Badge>
                <code>{quickResult.command}</code>
              </div>
              <pre>
                {(quickResult.stdout ||
                  quickResult.stderr ||
                  "The command finished without output.").trim()}
              </pre>
            </div>
          )}

          <div className="quick-links">
            {QUICK_LINKS.map((link) => (
              <button
                key={link.command}
                type="button"
                onClick={() => setCommandInput(link.command)}
                disabled={running}
              >
                {link.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
