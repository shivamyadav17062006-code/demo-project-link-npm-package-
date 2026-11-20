import express from "express";

export function createApp() {
  const app = express();

  app.get("/", (req, res) => {
    res.json({
      message: "Hello from the npm-pal demo",
      time: new Date().toISOString()
    });
  });

  app.get("/health", (req, res) => {
    res.json({ ok: true, uptimeSeconds: Math.round(process.uptime()) });
  });

  return app;
}
