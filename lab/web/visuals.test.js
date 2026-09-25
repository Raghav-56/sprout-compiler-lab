import { expect, test } from "bun:test";
import { VISUALS, frameFor, validVisual } from "./visuals.js";

test("each unit has a connected, step-by-step diagram", () => {
  expect(Object.keys(VISUALS).map(Number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  for (const visual of Object.values(VISUALS)) {
    expect(validVisual(visual)).toBe(true);
    expect(visual.prompt.length).toBeGreaterThan(20);
    expect(visual.answer.length).toBeGreaterThan(20);
    expect(visual.frames.length).toBeGreaterThanOrEqual(3);
  }
});

test("a requested frame stays inside the unit's diagram", () => {
  expect(frameFor(3, -1)).toBe(VISUALS[3].frames[0]);
  expect(frameFor(3, 100)).toBe(VISUALS[3].frames.at(-1));
  expect(frameFor(42, 0)).toBe(null);
});

test("the parsing trace places multiplication under addition", () => {
  const parser = VISUALS[3];
  expect(parser.edges).toContainEqual(["add", "mul"]);
  expect(parser.edges).toContainEqual(["mul", "three"]);
  expect(parser.edges).toContainEqual(["mul", "four"]);
});

test("recursive frames grow and unwind in order", () => {
  expect(VISUALS[5].frames.map((frame) => frame.active.length)).toEqual([2, 3, 4, 3, 2, 1]);
  expect(VISUALS[5].frames[3].active).not.toContain("f1");
  expect(VISUALS[5].frames.at(-1).active).toEqual(["main"]);
});
