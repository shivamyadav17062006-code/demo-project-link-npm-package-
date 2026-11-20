import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { ValidationError, parsePackageList, parsePackageSpec, resolveProjectPath } from "./validation.js";
import {
  getActivity,
  getAudit,
  getDoctor,
  getOutdated,
  getPackages,
  getPlaygroundCommands,
  getProjectInfo,
  getState,
  installPackages,
  runPlayground,
  setProjectPath,
  uninstallPackages
} from "./operations.js";
import { getConcept, listTopics } from "../../src/learning/concepts.js";
import { questions as quizQuestions } from "../../src/learning/quiz.js";

const DIST_DIR = path.resolve(fileURLToPath(new URL("..", import.meta.url)), "dist");
const INDEX_HTML = path.join(DIST_DIR, "index.html");

const ALLOWED_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4174",
  "http://127.0.0.1:4174"
]);

function hostHeaderName(header) {
  if (!header) return "";
  if (header.startsWith("[")) {
    return header.slice(0, header.indexOf("]") + 1).toLowerCase();
  }
  return header.split(":")[0].toLowerCase();
}

function requireLocalHost(req, res, next) {
  if (!ALLOWED_HOSTS.has(hostHeaderName(req.headers.host))) {
    return res.status(403).json({ error: "This dashboard only accepts localhost requests." });
  }
  next();
}

function requireTrustedOrigin(req, res, next) {
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return res.status(403).json({ error: "Request origin is not allowed." });
  }
  next();
}

function learnPayload() {
  return {
    topics: listTopics().map((id) => ({ id, ...getConcept(id) })),
    quiz: quizQuestions.map(({ question, choices, answer, explanation }) => ({
      question,
      choices,
      answer,
      explanation
    }))
  };
}

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(requireLocalHost);
  app.use(express.json({ limit: "32kb" }));

  app.get("/api/health", (req, res) => {
    res.json({
      ok: true,
      service: "npm-pal-dashboard",
      node: process.version,
      projectPath: getState().projectPath,
      busy: getState().busy
    });
  });

  app.get("/api/project", async (req, res) => {
    const state = getState();
    const info = await getProjectInfo();
    res.json({ ...info, busy: state.busy, defaultProjectPath: state.defaultProjectPath });
  });

  app.post("/api/project", requireTrustedOrigin, async (req, res) => {
    const projectPath = await resolveProjectPath(req.body?.path);
    const state = await setProjectPath(projectPath);
    const info = await getProjectInfo();
    res.json({ ...info, busy: state.busy, defaultProjectPath: state.defaultProjectPath });
  });

  app.get("/api/packages", async (req, res) => {
    res.json(await getPackages());
  });

  app.get("/api/outdated", async (req, res) => {
    res.json(await getOutdated());
  });

  app.get("/api/audit", async (req, res) => {
    res.json(await getAudit());
  });

  app.get("/api/activity", (req, res) => {
    res.json(getActivity());
  });

  app.get("/api/doctor", async (req, res) => {
    res.json(await getDoctor());
  });

  app.get("/api/learn", (req, res) => {
    res.json(learnPayload());
  });

  app.post("/api/install", requireTrustedOrigin, async (req, res) => {
    const packages = parsePackageList(req.body?.packages);
    const dev = req.body?.dev === true;
    const result = await installPackages(packages, { dev });
    res.status(result.ok ? 200 : 502).json(result);
  });

  app.post("/api/uninstall", requireTrustedOrigin, async (req, res) => {
    const packages = parsePackageList(req.body?.packages);
    const result = await uninstallPackages(packages);
    res.status(result.ok ? 200 : 502).json(result);
  });

  app.get("/api/playground", (req, res) => {
    res.json({ commands: getPlaygroundCommands() });
  });

  app.post("/api/playground", requireTrustedOrigin, async (req, res) => {
    const command = req.body?.command;
    const packageName = req.body?.package;
    if (command === "view") {
      parsePackageSpec(packageName);
    }
    const result = await runPlayground({ command, packageName });
    res.status(200).json(result);
  });

  app.use("/api", (req, res) => {
    res.status(404).json({ error: `Unknown API route: ${req.method} ${req.path}` });
  });

  if (fs.existsSync(INDEX_HTML)) {
    app.use(express.static(DIST_DIR, { index: false }));
    app.use((req, res, next) => {
      if (req.method !== "GET" || !req.accepts("html")) {
        return next();
      }
      res.sendFile(INDEX_HTML);
    });
  } else {
    app.get("/", (req, res) => {
      res
        .status(200)
        .type("text/plain")
        .send("npm-pal dashboard API is running. Start the UI with `npm run dev`.");
    });
  }

  app.use((req, res) => {
    res.status(404).type("text/plain").send("Not found");
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error instanceof ValidationError ? 400 : error.status || 500;
    if (status >= 500) {
      console.error("[npm-pal] request failed:", error);
    }
    res.status(status).json({
      error: error.message || "Unexpected server error.",
      detail: error.detail
    });
  });

  return app;
}
