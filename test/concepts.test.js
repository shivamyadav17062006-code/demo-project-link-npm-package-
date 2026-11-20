import test from "node:test";
import assert from "node:assert/strict";

import {
  explainConcept,
  getConcept,
  listTopics
} from "../src/learning/concepts.js";

function captureLogs(fn) {
  const lines = [];
  const original = console.log;

  console.log = (...args) => lines.push(args.join(" "));

  try {
    fn();
  } finally {
    console.log = original;
  }

  return lines.join("\n");
}

test("every topic has the expected shape", () => {
  for (const topic of listTopics()) {
    const concept = getConcept(topic);

    assert.equal(typeof concept.title, "string");
    assert.equal(typeof concept.meaning, "string");
    assert.equal(typeof concept.example, "string");
    assert.match(concept.command, /^npm /);
  }
});

test("topic lookup is case insensitive", () => {
  assert.equal(
    getConcept("DEPENDENCIES").title,
    "Dependencies"
  );
  assert.equal(
    getConcept("node_modules").title,
    "node_modules"
  );
});

test("common file names resolve to their topic", () => {
  assert.equal(getConcept("package.json").title, "package.json");
  assert.equal(getConcept("package-lock.json").title, "package-lock.json");
  assert.equal(getConcept("node-modules").title, "node_modules");
});

test("explaining a topic prints its details", () => {
  const output = captureLogs(() =>
    explainConcept("devdependencies")
  );

  assert.match(output, /DevDependencies/);
  assert.match(output, /Meaning:/);
  assert.match(output, /--save-dev/);
});

test("unknown topics list the available ones", () => {
  const output = captureLogs(() =>
    explainConcept("webpack")
  );

  assert.match(output, /Topic not found/);
  assert.match(output, /dependencies/);
  assert.match(output, /node_modules/);
});
