import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createApp } from "../server/app.js";
import { setProjectPath } from "../server/operations.js";

let server;
let base;
let fixture;

const json = (response) => response.json();

before(async () => {
  fixture = await fs.mkdtemp(path.join(os.tmpdir(), "npm-pal-api-"));
  await fs.writeFile(
    path.join(fixture, "package.json"),
    JSON.stringify({ name: "fixture-app", version: "2.1.0", private: true }, null, 2)
  );
  await setProjectPath(fixture);

  server = createApp().listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(fixture, { recursive: true, force: true });
});

function statusWithHost(host, pathname) {
  return new Promise((resolve, reject) => {
    const request = http.request(
      {
        host: "127.0.0.1",
        port: server.address().port,
        path: pathname,
        headers: { Host: host }
      },
      (response) => {
        response.resume();
        response.on("end", () => resolve(response.statusCode));
      }
    );
    request.on("error", reject);
    request.end();
  });
}

describe("npm-pal dashboard API", () => {
  test("health reports the active project", async () => {
    const response = await fetch(`${base}/api/health`);
    const body = await json(response);
    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.projectPath, fixture);
  });

  test("project metadata comes from package.json", async () => {
    const response = await fetch(`${base}/api/project`);
    const body = await json(response);
    assert.equal(response.status, 200);
    assert.equal(body.name, "fixture-app");
    assert.equal(body.version, "2.1.0");
    assert.equal(body.hasLockfile, false);
  });

  test("packages returns an empty project cleanly", async () => {
    const response = await fetch(`${base}/api/packages`);
    const body = await json(response);
    assert.equal(response.status, 200);
    assert.deepEqual(body.packages, []);
    assert.equal(body.totals.prod, 0);
    assert.equal(body.totals.missing, 0);
  });

  test("learn exposes concepts and quiz questions", async () => {
    const response = await fetch(`${base}/api/learn`);
    const body = await json(response);
    assert.equal(response.status, 200);
    assert.equal(body.topics.length, 5);
    assert.equal(body.quiz.length, 3);
    assert.deepEqual(
      body.topics.map((topic) => topic.id),
      ["dependencies", "devdependencies", "packagejson", "packagejsonlock", "node_modules"]
    );
  });

  test("project switch rejects folders without package.json", async () => {
    const response = await fetch(`${base}/api/project`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: path.join(fixture, "nope") })
    });
    const body = await json(response);
    assert.equal(response.status, 400);
    assert.match(body.error, /No package.json found/);
  });

  test("install rejects unsafe names before running npm", async () => {
    const response = await fetch(`${base}/api/install`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packages: ["--force"] })
    });
    const body = await json(response);
    assert.equal(response.status, 400);
    assert.match(body.error, /cannot start with/);
  });

  test("mutations from untrusted origins are blocked", async () => {
    const response = await fetch(`${base}/api/install`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://evil.example" },
      body: JSON.stringify({ packages: ["is-number"] })
    });
    const body = await json(response);
    assert.equal(response.status, 403);
    assert.match(body.error, /origin/i);
  });

  test("unsupported playground commands are rejected", async () => {
    const response = await fetch(`${base}/api/playground`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: "publish" })
    });
    const body = await json(response);
    assert.equal(response.status, 400);
    assert.match(body.error, /Unsupported command/);
  });

  test("unknown API routes return JSON 404", async () => {
    const response = await fetch(`${base}/api/nope`);
    const body = await json(response);
    assert.equal(response.status, 404);
    assert.match(body.error, /Unknown API route/);
  });

  test("non-local Host headers are rejected", async () => {
    assert.equal(await statusWithHost("evil.example:4174", "/api/health"), 403);
    assert.equal(await statusWithHost(`127.0.0.1:${server.address().port}`, "/api/health"), 200);
  });
});
