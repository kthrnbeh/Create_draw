import assert from "node:assert/strict";
import test from "node:test";
import { floodFillPixels } from "../browser-build/floodFill.js";

function makePixels(colors) {
  return new Uint8ClampedArray(colors.flat());
}

function readPixel(pixels, index) {
  return Array.from(pixels.slice(index * 4, index * 4 + 4));
}

test("fills only pixels connected to the selected region", async () => {
  const white = [255, 255, 255, 255];
  const black = [0, 0, 0, 255];
  const red = [220, 40, 50, 255];
  const pixels = makePixels([white, white, black, white, black, white]);

  const changed = await floodFillPixels(pixels, 3, 2, 0, 0, red, 0);

  assert.equal(changed, true);
  assert.deepEqual(readPixel(pixels, 0), red);
  assert.deepEqual(readPixel(pixels, 1), red);
  assert.deepEqual(readPixel(pixels, 3), red);
  assert.deepEqual(readPixel(pixels, 2), black);
  assert.deepEqual(readPixel(pixels, 5), white);
});

test("tolerance includes nearby colors but respects the boundary", async () => {
  const target = [100, 100, 100, 255];
  const nearby = [104, 100, 100, 255];
  const boundary = [110, 110, 110, 255];
  const blue = [0, 0, 255, 255];
  const pixels = makePixels([target, nearby, boundary, blue]);

  await floodFillPixels(pixels, 4, 1, 0, 0, blue, 5);

  assert.deepEqual(readPixel(pixels, 0), blue);
  assert.deepEqual(readPixel(pixels, 1), blue);
  assert.deepEqual(readPixel(pixels, 2), boundary);
});

test("transparent pixels match regardless of hidden RGB values", async () => {
  const pixels = makePixels([
    [255, 0, 0, 0],
    [0, 255, 0, 0],
    [0, 0, 0, 255],
  ]);
  const green = [30, 180, 90, 255];

  await floodFillPixels(pixels, 3, 1, 0, 0, green, 0);

  assert.deepEqual(readPixel(pixels, 0), green);
  assert.deepEqual(readPixel(pixels, 1), green);
  assert.deepEqual(readPixel(pixels, 2), [0, 0, 0, 255]);
});

test("does not create a history-worthy change when the fill color already matches", async () => {
  const color = [30, 80, 120, 255];
  const pixels = makePixels([color, color]);

  const changed = await floodFillPixels(pixels, 2, 1, 0, 0, color, 0);

  assert.equal(changed, false);
  assert.deepEqual(readPixel(pixels, 1), color);
});

test("finishes a large region across asynchronous work chunks", async () => {
  const width = 20_001;
  const pixels = new Uint8ClampedArray(width * 4);
  const fill = [80, 120, 210, 255];

  const changed = await floodFillPixels(pixels, width, 1, 0, 0, fill, 0);

  assert.equal(changed, true);
  assert.deepEqual(readPixel(pixels, 0), fill);
  assert.deepEqual(readPixel(pixels, width - 1), fill);
});
