import test from "node:test";
import assert from "node:assert/strict";

import { questions } from "../src/learning/quiz.js";

test("quiz has questions", () => {
  assert.ok(questions.length > 0);
});

test("every question has a valid answer and explanation", () => {
  for (const q of questions) {
    assert.equal(typeof q.question, "string");
    assert.ok(q.choices.length >= 2);
    assert.ok(
      q.choices.includes(q.answer),
      `answer "${q.answer}" must be one of the choices`
    );
    assert.equal(typeof q.explanation, "string");
  }
});
