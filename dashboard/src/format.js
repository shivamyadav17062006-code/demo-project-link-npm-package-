export function timeAgo(iso) {
  if (!iso) return "";
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function formatDuration(ms) {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.round(ms / 60_000)} min`;
}

export function shortPath(value, max = 46) {
  if (!value) return "";
  if (value.length <= max) return value;
  return `…${value.slice(-(max - 1))}`;
}

export function severityTone(severity) {
  switch (severity) {
    case "critical":
      return "critical";
    case "high":
      return "danger";
    case "moderate":
      return "warning";
    case "low":
      return "info";
    default:
      return "muted";
  }
}

const KIND_META = {
  install: { icon: "plus", tone: "accent" },
  uninstall: { icon: "trash", tone: "warning" },
  playground: { icon: "terminal", tone: "info" },
  project: { icon: "folder", tone: "info" }
};

export function activityMeta(kind) {
  return KIND_META[kind] ?? { icon: "pulse", tone: "muted" };
}

export function splitPackageInput(value) {
  return value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}
