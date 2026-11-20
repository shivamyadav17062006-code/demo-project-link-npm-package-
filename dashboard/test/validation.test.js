import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  ValidationError,
  parseJson,
  parsePackageList,
  parsePackageSpec,
  resolveProjectPath
} from "../server/validation.js";

test("parsePackageSpec accepts valid npm specs", () => {
  assert.equal(parsePackageSpec("express"), "express");
  assert.equal(parsePackageSpec("@scope/name"), "@scope/name");
  assert.equal(parsePackageSpec("react@^19.0.0"), "react@^19.0.0");
  assert.equal(parsePackageSpec("  zod@3.23.8  "), "zod@3.23.8");
  assert.equal(parsePackageSpec("express@"), "express");
  assert.equal(parsePackageSpec("react@>=18.0.0"), "react@>=18.0.0");
});

test("parsePackageSpec rejects unsafe input", () => {
  const invalid = [
    "",
    "   ",
    "-g",
    "--save-dev",
    "foo bar",
    "express; rm -rf /",
    "UPPER/Case",
    "name@bad version",
    "a".repeat(300)
  ];

  for (const value of invalid) {
    assert.throws(() => parsePackageSpec(value), ValidationError, `expected rejection for ${JSON.stringify(value)}`);
  }

  assert.throws(() => parsePackageSpec(42), ValidationError);
});

test("parsePackageList validates, dedupes and caps input", () => {
  assert.deepEqual(parsePackageList(["express", "express", "zod@^3"]), ["express", "zod@^3"]);
  assert.throws(() => parsePackageList([]), ValidationError);
  assert.throws(() => parsePackageList("express"), ValidationError);
  assert.throws(() => parsePackageList(Array.from({ length: 11 }, (_, index) => `pkg-${index}`)), ValidationError);
  assert.throws(() => parsePackageList(["express", "-x"]), ValidationError);
});

test("resolveProjectPath requires an existing directory with package.json", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "npm-pal-paths-"));
  try {
    await fs.writeFile(path.join(dir, "package.json"), '{"name":"demo"}');
    const resolved = await resolveProjectPath(dir);
    assert.equal(resolved, path.resolve(dir));

    await assert.rejects(() => resolveProjectPath(path.join(dir, "missing")), ValidationError);

    const file = path.join(dir, "file.txt");
    await fs.writeFile(file, "x");
    await assert.rejects(() => resolveProjectPath(file), ValidationError);

    await assert.rejects(() => resolveProjectPath(""), ValidationError);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("parseJson falls back on invalid input", () => {
  assert.deepEqual(parseJson('{"a":1}'), { a: 1 });
  assert.equal(parseJson("", "fallback"), "fallback");
  assert.equal(parseJson("not json", null), null);
});
