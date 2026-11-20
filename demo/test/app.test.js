import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../src/app.js";

async function withServer(run) {
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("GET / returns the welcome message", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/`);
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.message, "Hello from the npm-pal demo");
    assert.ok(!Number.isNaN(Date.parse(body.time)));
  });
});

test("GET /health reports ok", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/health`);
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(typeof body.uptimeSeconds, "number");
  });
});

test("unknown routes return 404", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/nope`);
    assert.equal(response.status, 404);
  });
});
