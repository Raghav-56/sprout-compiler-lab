import { expect, test } from "bun:test";
import { checkMessage, firstUnfinished, progressPercent } from "./model.js";

test("progress uses completed units", () => {
  expect(progressPercent(3, 7)).toBeCloseTo(42.857, 2);
  expect(progressPercent(8, 7)).toBe(100);
  expect(progressPercent(0, 0)).toBe(0);
});

test("next unit follows completion", () => {
  expect(firstUnfinished([{ id: 1, done: true }, { id: 2, done: false }])).toBe(2);
  expect(firstUnfinished([{ id: 1, done: true }])).toBe(null);
});

test("check message follows the result", () => {
  expect(checkMessage({ ok: true })).toBe("Checks passed.");
  expect(checkMessage({ ok: false })).toContain("failed");
});
