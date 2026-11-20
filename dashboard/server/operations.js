import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { execa } from "execa";

import { parseJson, parsePackageList, parsePackageSpec } from "./validation.js";

const DEFAULT_PROJECT = process.env.NPM_PAL_PROJECT
  ? path.resolve(process.env.NPM_PAL_PROJECT)
  : process.cwd();

const READ_TIMEOUT = 60_000;
const INSTALL_TIMEOUT = 5 * 60_000;
const UNINSTALL_TIMEOUT = 2 * 60_000;
const MAX_ACTIVITY = 50;

const PLAYGROUND_COMMANDS = {
  list: { args: ["list", "--depth=0"], allowExitCodes: [0, 1] },
  outdated: { args: ["outdated", "--json"], allowExitCodes: [0, 1] },
  audit: { args: ["audit", "--json"], allowExitCodes: [0, 1] },
  doctor: { args: ["--version"], allowExitCodes: [0] },
  view: { args: [], allowExitCodes: [0] }
};

const state = {
  projectPath: DEFAULT_PROJECT,
  busy: false,
  activity: [],
  nextActivityId: 1
};

export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConflictError";
    this.status = 409;
  }
}

function npmEnv() {
  return {
    ...process.env,
    npm_config_update_notifier: "false",
    npm_config_fund: "false",
    npm_config_audit: "false",
    npm_config_progress: "false",
    NO_COLOR: "1",
    FORCE_COLOR: "0"
  };
}

async function npm(args, { timeout = READ_TIMEOUT, allowExitCodes = [0] } = {}) {
  const command = `npm ${args.join(" ")}`;
  const startedAt = Date.now();
  let result;

  try {
    result = await execa("npm", args, {
      cwd: state.projectPath,
      reject: false,
      timeout,
      env: npmEnv()
    });
  } catch (error) {
    return {
      command,
      ok: false,
      exitCode: null,
      timedOut: error.timedOut === true,
      stdout: "",
      stderr: error.message,
      durationMs: Date.now() - startedAt
    };
  }

  const exitCode = typeof result.exitCode === "number" ? result.exitCode : null;
  return {
    command,
    ok: result.timedOut ? false : allowExitCodes.includes(exitCode),
    exitCode,
    timedOut: result.timedOut === true,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    durationMs: Date.now() - startedAt
  };
}

async function withLock(task) {
  if (state.busy) {
    throw new ConflictError("Another package operation is running. Wait for it to finish.");
  }

  state.busy = true;
  try {
    return await task();
  } finally {
    state.busy = false;
  }
}

function recordActivity(entry) {
  const item = {
    id: state.nextActivityId++,
    at: new Date().toISOString(),
    ...entry
  };
  state.activity.unshift(item);
  if (state.activity.length > MAX_ACTIVITY) {
    state.activity.length = MAX_ACTIVITY;
  }
  return item;
}

async function readManifest() {
  const file = path.join(state.projectPath, "package.json");
  const text = await fs.readFile(file, "utf8");
  return JSON.parse(text);
}

async function readInstalledTree() {
  const result = await npm(["list", "--json", "--depth=0", "--offline"], {
    allowExitCodes: [0, 1]
  });
  const tree = parseJson(result.stdout, null);
  return { result, tree };
}

export function getState() {
  return {
    projectPath: state.projectPath,
    busy: state.busy,
    defaultProjectPath: DEFAULT_PROJECT
  };
}

export async function setProjectPath(projectPath) {
  if (state.busy) {
    throw new ConflictError("Wait for the current package operation to finish.");
  }
  await readManifestFor(projectPath);
  state.projectPath = projectPath;
  recordActivity({
    kind: "project",
    label: "Switched project",
    command: null,
    ok: true,
    exitCode: null,
    durationMs: 0,
    summary: projectPath
  });
  return getState();
}

async function readManifestFor(projectPath) {
  const text = await fs.readFile(path.join(projectPath, "package.json"), "utf8");
  return JSON.parse(text);
}

export async function getProjectInfo() {
  const manifest = await readManifest();
  const hasLock = await fs
    .access(path.join(state.projectPath, "package-lock.json"))
    .then(() => true)
    .catch(() => false);
  const hasModules = await fs
    .stat(path.join(state.projectPath, "node_modules"))
    .then((stats) => stats.isDirectory())
    .catch(() => false);

  return {
    path: state.projectPath,
    name: manifest.name ?? path.basename(state.projectPath),
    version: manifest.version ?? "0.0.0",
    description: manifest.description ?? "",
    scripts: Object.keys(manifest.scripts ?? {}),
    engines: manifest.engines ?? {},
    hasLockfile: hasLock,
    hasNodeModules: hasModules,
    dependencyCount: Object.keys(manifest.dependencies ?? {}).length,
    devDependencyCount: Object.keys(manifest.devDependencies ?? {}).length
  };
}

export async function getPackages() {
  const manifest = await readManifest();
  const { result, tree } = await readInstalledTree();

  if (!tree && !result.ok) {
    const error = new Error("Could not read installed packages.");
    error.status = 502;
    error.detail = result.stderr || result.stdout;
    throw error;
  }

  const installed = tree?.dependencies ?? {};
  const rows = [];

  const addRows = (deps, type) => {
    for (const [name, range] of Object.entries(deps ?? {})) {
      const entry = installed[name];
      rows.push({
        name,
        type,
        requested: range,
        installed: entry?.version ?? null,
        status: entry?.version ? "installed" : "missing",
        invalid: Boolean(entry?.invalid)
      });
    }
  };

  addRows(manifest.dependencies, "prod");
  addRows(manifest.devDependencies, "dev");

  rows.sort((a, b) => a.name.localeCompare(b.name));

  const installedNames = new Set(rows.filter((row) => row.installed).map((row) => row.name));
  const extraInstalled = Object.keys(installed)
    .filter((name) => installed[name]?.version && !installedNames.has(name))
    .map((name) => ({
      name,
      type: "transitive",
      requested: null,
      installed: installed[name]?.version ?? null,
      status: "installed"
    }));

  return {
    packages: rows,
    extraInstalled,
    totals: {
      prod: rows.filter((row) => row.type === "prod").length,
      dev: rows.filter((row) => row.type === "dev").length,
      installed: rows.filter((row) => row.installed).length,
      missing: rows.filter((row) => !row.installed).length
    }
  };
}

export async function getOutdated() {
  const manifest = await readManifest();
  const result = await npm(["outdated", "--json"], { allowExitCodes: [0, 1] });
  const data = parseJson(result.stdout, null);

  if (!data) {
    return {
      supported: false,
      rows: [],
      error: (result.stderr || result.stdout || "npm outdated produced no output.").trim()
    };
  }

  const rows = Object.entries(data).map(([name, info]) => ({
    name,
    current: info.current ?? null,
    wanted: info.wanted ?? null,
    latest: info.latest ?? null,
    type: manifest.devDependencies?.[name]
      ? "dev"
      : manifest.dependencies?.[name]
        ? "prod"
        : "transitive",
    majorBehind: isMajorBehind(info.current, info.latest)
  }));

  rows.sort((a, b) => a.name.localeCompare(b.name));

  return { supported: true, rows, error: null };
}

function isMajorBehind(current, latest) {
  if (!current || !latest) return false;
  const extract = (value) => {
    const match = String(value).match(/(\d+)\.(\d+)\.(\d+)/);
    return match ? Number(match[1]) : null;
  };
  const currentMajor = extract(current);
  const latestMajor = extract(latest);
  return currentMajor !== null && latestMajor !== null && latestMajor > currentMajor;
}

export async function getAudit() {
  const result = await npm(["audit", "--json"], { allowExitCodes: [0, 1, 2] });
  const report = parseJson(result.stdout, null);

  if (!report || !report.metadata) {
    return {
      supported: false,
      summary: null,
      advisories: [],
      error: (result.stderr || result.stdout || "npm audit produced no report.").trim()
    };
  }

  const vulnerabilities = report.vulnerabilities ?? {};
  const advisories = Object.entries(vulnerabilities).map(([name, info]) => ({
    name,
    severity: info.severity ?? "info",
    direct: Boolean(info.isDirect),
    range: info.range ?? null,
    fixAvailable: info.fixAvailable === true
      ? true
      : info.fixAvailable && typeof info.fixAvailable === "object"
        ? `${info.fixAvailable.name ?? name}@${info.fixAvailable.version ?? "?"}`
        : false
  }));

  const order = { critical: 0, high: 1, moderate: 2, low: 3, info: 4 };
  advisories.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));

  const counts = report.metadata.vulnerabilities ?? {};

  return {
    supported: true,
    summary: {
      total: counts.total ?? 0,
      critical: counts.critical ?? 0,
      high: counts.high ?? 0,
      moderate: counts.moderate ?? 0,
      low: counts.low ?? 0,
      dependencies: report.metadata.dependencies?.total ?? 0
    },
    advisories,
    error: null
  };
}

export async function getDoctor() {
  const npmVersion = await npm(["--version"]);
  const manifest = await readManifest();
  const hasLock = await fs
    .access(path.join(state.projectPath, "package-lock.json"))
    .then(() => true)
    .catch(() => false);
  const hasModules = await fs
    .stat(path.join(state.projectPath, "node_modules"))
    .then((stats) => stats.isDirectory())
    .catch(() => false);

  const nodeMajor = Number(process.versions.node.split(".")[0]);
  const requiredMajor = Number((manifest.engines?.node ?? "").replace(/[^\d.]/g, "").split(".")[0]) || null;

  const checks = [
    {
      id: "node",
      label: "Node.js runtime",
      value: process.version,
      ok: requiredMajor ? nodeMajor >= requiredMajor : nodeMajor >= 18,
      hint: requiredMajor
        ? `Project requires Node.js >= ${requiredMajor}.`
        : "No engines requirement declared."
    },
    {
      id: "npm",
      label: "npm CLI",
      value: npmVersion.ok ? npmVersion.stdout.trim() : "unavailable",
      ok: npmVersion.ok,
      hint: npmVersion.ok ? "npm responded to --version." : npmVersion.stderr
    },
    {
      id: "lockfile",
      label: "Lockfile",
      value: hasLock ? "package-lock.json" : "missing",
      ok: hasLock,
      hint: hasLock
        ? "Dependency versions are locked for reproducible installs."
        : "Run npm install to create a lockfile."
    },
    {
      id: "modules",
      label: "node_modules",
      value: hasModules ? "present" : "missing",
      ok: hasModules,
      hint: hasModules
        ? "Dependencies are installed."
        : "Run npm install before using the project."
    },
    {
      id: "manifest",
      label: "package.json",
      value: manifest.name ?? "unnamed",
      ok: Boolean(manifest.name && manifest.version),
      hint: Boolean(manifest.name && manifest.version)
        ? "Name and version are declared."
        : "Add name and version fields."
    }
  ];

  return {
    projectPath: state.projectPath,
    os: `${os.type()} ${os.release()} (${process.arch})`,
    checks
  };
}

export async function installPackages(input, { dev = false } = {}) {
  const packages = parsePackageList(input);
  return withLock(async () => {
    const args = ["install", ...packages, "--no-audit", "--no-fund"];
    if (dev) args.push("--save-dev");

    const result = await npm(args, { timeout: INSTALL_TIMEOUT });
    recordActivity({
      kind: "install",
      label: dev ? "Installed dev dependencies" : "Installed packages",
      command: result.command,
      ok: result.ok,
      exitCode: result.exitCode,
      durationMs: result.durationMs,
      summary: packages.join(", ")
    });
    return { ...result, packages };
  });
}

export async function uninstallPackages(input) {
  const packages = parsePackageList(input);
  return withLock(async () => {
    const result = await npm(["uninstall", ...packages, "--no-audit", "--no-fund"], {
      timeout: UNINSTALL_TIMEOUT
    });
    recordActivity({
      kind: "uninstall",
      label: "Removed packages",
      command: result.command,
      ok: result.ok,
      exitCode: result.exitCode,
      durationMs: result.durationMs,
      summary: packages.join(", ")
    });
    return { ...result, packages };
  });
}

export function getActivity() {
  return { items: state.activity };
}

export async function runPlayground({ command, packageName } = {}) {
  if (!Object.hasOwn(PLAYGROUND_COMMANDS, command)) {
    const error = new Error(
      `Unsupported command. Choose one of: ${Object.keys(PLAYGROUND_COMMANDS).join(", ")}.`
    );
    error.status = 400;
    throw error;
  }

  let args;
  let label;

  if (command === "view") {
    const spec = parsePackageSpec(packageName);
    args = ["view", spec, "--json"];
    label = `npm view ${spec}`;
  } else {
    args = PLAYGROUND_COMMANDS[command].args;
    label = command === "doctor" ? "npm --version" : `npm ${command}`;
  }

  return withLock(async () => {
    const result = await npm(args, { timeout: READ_TIMEOUT });
    recordActivity({
      kind: "playground",
      label: `Ran ${label}`,
      command: result.command,
      ok: result.ok,
      exitCode: result.exitCode,
      durationMs: result.durationMs,
      summary: "read-only command"
    });
    return result;
  });
}

export function getPlaygroundCommands() {
  return Object.keys(PLAYGROUND_COMMANDS);
}
