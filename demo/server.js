import path from "node:path";
import { fileURLToPath } from "node:url";

import axios from "axios";
import express from "express";

const here = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 3000;

export const app = express();

app.use(express.static(path.join(here, "public")));

app.get("/api/health", async (req, res) => {
  let registry = "unreachable";

  try {
    await axios.get("https://registry.npmjs.org/-/ping", { timeout: 2500 });
    registry = "reachable";
  } catch {
    registry = "unreachable";
  }

  res.json({
    ok: true,
    app: "npm-pal-demo",
    node: process.version,
    uptimeSeconds: Math.round(process.uptime()),
    registry,
    time: new Date().toISOString()
  });
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(port, "127.0.0.1", () => {
    console.log(`npm-pal demo running at http://localhost:${port}`);
    console.log("Press Ctrl+C to stop.");
  });
}
