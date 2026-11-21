import assert from "node:assert/strict";
import test from "node:test";
import { createFloodFillMask, paintMask } from "../browser-build/floodFill.js";

test("mask respects an antialiased boundary with tolerance", async () => {
  const pixels = new Uint8ClampedArray([
    255, 255, 255, 255, 250, 250, 250, 255, 0, 0, 0, 255,
    255, 255, 255, 255, 252, 252, 252, 255, 0, 0, 0, 255,
  ]);
  const mask = await createFloodFillMask(pixels, 3, 2, 0, 0, 8);
  assert.deepEqual(Array.from(mask), [1, 1, 0, 1, 1, 0]);
});

test("small gap closing crosses a narrow gap without painting the boundary pixel", async () => {
  const white = [255, 255, 255, 255];
  const black = [0, 0, 0, 255];
  const pixels = new Uint8ClampedArray([...white, ...black, ...white, ...white]);
  const mask = await createFloodFillMask(pixels, 4, 1, 0, 0, 0, "small");
  assert.deepEqual(Array.from(mask), [1, 0, 1, 1]);
});

test("paintMask supports a confined gradient and opacity", () => {
  const pixels = new Uint8ClampedArray(3 * 4);
  const mask = new Uint8Array([1, 1, 0]);
  paintMask(pixels, mask, 3, (x) => [x ? 200 : 10, 20, 30, 255], 0.5);
  assert.deepEqual(Array.from(pixels.slice(0, 4)), [10, 20, 30, 128]);
  assert.deepEqual(Array.from(pixels.slice(4, 8)), [200, 20, 30, 128]);
  assert.deepEqual(Array.from(pixels.slice(8, 12)), [0, 0, 0, 0]);
});
