import test from "node:test";
import assert from "node:assert/strict";
import { execa } from "execa";

const cli = (...args) =>
  execa(process.execPath, ["src/index.js", ...args]);

test("--help lists the available commands", async () => {
  const { stdout } = await cli("--help");

  for (const command of [
    "install",
    "remove",
    "list",
    "outdated",
    "audit",
    "explain",
    "learn",
    "doctor",
    "dashboard",
    "menu"
  ]) {
    assert.match(stdout, new RegExp(command));
  }
});

test("--version prints the package version", async () => {
  const { stdout } = await cli("--version");

  assert.equal(stdout.trim(), "1.1.0");
});

test("explain prints a concept", async () => {
  const { stdout } = await cli("explain", "packagejson");

  assert.match(stdout, /package\.json/);
  assert.match(stdout, /npm init -y/);
});

test("explain with an unknown topic fails gracefully", async () => {
  const { stdout } = await cli("explain", "not-a-topic");

  assert.match(stdout, /Topic not found/);
});
