import test from "node:test";
import assert from "node:assert/strict";

test("dashboard server loads with the package dependencies", async () => {
  const { createApp } = await import("../dashboard/server/app.js");

  assert.equal(typeof createApp, "function");
});
