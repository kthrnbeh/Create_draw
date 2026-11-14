import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_TRACING_SETTINGS,
  TRACING_PRESETS,
  generateOutline,
  isTracingSettings,
} from "../browser-build/tracing/OutlineGenerator.js";
import { OutlineProcessor } from "../browser-build/tracing/OutlineProcessor.js";

function createSplitImage(width = 7, height = 7, left = 0, right = 255) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const value = x < Math.floor(width / 2) ? left : right;
      data[offset] = value;
      data[offset + 1] = value;
      data[offset + 2] = value;
      data[offset + 3] = 255;
    }
  }
  return { data, width, height };
}

function blackPixelCount(image) {
  let count = 0;
  for (let offset = 0; offset < image.data.length; offset += 4) {
    if (image.data[offset] === 0) count += 1;
  }
  return count;
}

test("generates opaque black outlines with the source dimensions", () => {
  const source = createSplitImage();
  const outline = generateOutline(source, {
    ...DEFAULT_TRACING_SETTINGS,
    difficulty: "advanced",
    threshold: 40,
    noiseReduction: 0,
    outlineThickness: 1,
  });

  assert.equal(outline.width, source.width);
  assert.equal(outline.height, source.height);
  assert.ok(blackPixelCount(outline) > 0);
  assert.ok(outline.data.every((value, index) => index % 4 !== 3 || value === 255));
});

test("inverts the generated black and white guide", () => {
  const source = createSplitImage();
  const settings = {
    ...TRACING_PRESETS.advanced,
    threshold: 40,
    noiseReduction: 0,
  };
  const normal = generateOutline(source, settings);
  const inverted = generateOutline(source, { ...settings, invert: true });

  for (let offset = 0; offset < normal.data.length; offset += 4) {
    assert.equal(inverted.data[offset], 255 - normal.data[offset]);
  }
});

test("sensitivity and threshold change how much edge detail is included", () => {
  const source = createSplitImage(7, 7, 0, 100);
  const base = {
    ...TRACING_PRESETS.advanced,
    noiseReduction: 0,
    outlineThickness: 1,
  };
  const sensitive = generateOutline(source, {
    ...base,
    edgeSensitivity: 2,
    threshold: 100,
  });
  const insensitive = generateOutline(source, {
    ...base,
    edgeSensitivity: 0.25,
    threshold: 100,
  });
  const highThreshold = generateOutline(source, {
    ...base,
    edgeSensitivity: 1,
    threshold: 200,
  });

  assert.ok(blackPixelCount(sensitive) > blackPixelCount(insensitive));
  assert.equal(blackPixelCount(insensitive), blackPixelCount(highThreshold));
});

test("color edges are optional and presets become more detailed by difficulty", () => {
  const width = 8;
  const height = 8;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      if (x < width / 2) {
        data[offset] = 255;
      } else {
        data[offset + 1] = 130;
      }
      data[offset + 3] = 255;
    }
  }
  const source = { data, width, height };
  const base = {
    ...TRACING_PRESETS.advanced,
    threshold: 20,
    noiseReduction: 0,
    outlineThickness: 1,
  };
  const gray = generateOutline(source, { ...base, grayscale: true });
  const colorAware = generateOutline(source, { ...base, grayscale: false });

  assert.ok(blackPixelCount(colorAware) > blackPixelCount(gray));
  assert.ok(TRACING_PRESETS.beginner.threshold > TRACING_PRESETS.intermediate.threshold);
  assert.ok(TRACING_PRESETS.intermediate.threshold > TRACING_PRESETS.advanced.threshold);
  assert.ok(TRACING_PRESETS.beginner.noiseReduction > TRACING_PRESETS.advanced.noiseReduction);
});

test("noise reduction removes isolated image noise and thickness expands contours", () => {
  const source = createSplitImage();
  const noisy = new Uint8ClampedArray(source.data);
  const center = (3 * source.width + 3) * 4;
  noisy[center] = 0;
  noisy[center + 1] = 0;
  noisy[center + 2] = 0;
  const noisyImage = { ...source, data: noisy };
  const settings = {
    ...TRACING_PRESETS.advanced,
    threshold: 20,
    noiseReduction: 0,
    outlineThickness: 1,
  };
  const detailed = generateOutline(noisyImage, settings);
  const filtered = generateOutline(noisyImage, {
    ...settings,
    noiseReduction: 1,
  });
  const thick = generateOutline(source, {
    ...settings,
    outlineThickness: 3,
  });

  assert.ok(blackPixelCount(filtered) < blackPixelCount(detailed));
  assert.ok(blackPixelCount(thick) > blackPixelCount(generateOutline(source, settings)));
});

test("validates presets and rejects malformed image data or settings", () => {
  assert.equal(isTracingSettings(TRACING_PRESETS.beginner), true);
  assert.equal(isTracingSettings({ ...TRACING_PRESETS.beginner, threshold: 300 }), false);
  assert.throws(
    () => generateOutline({ data: new Uint8ClampedArray(4), width: 2, height: 2 }, DEFAULT_TRACING_SETTINGS),
    RangeError,
  );
  assert.throws(
    () => generateOutline(createSplitImage(), { ...DEFAULT_TRACING_SETTINGS, threshold: Number.NaN }),
    TypeError,
  );
});

test("uses main-thread tracing when web workers are unavailable", async (t) => {
  if (typeof Worker !== "undefined") {
    t.skip("The test runtime provides Web Workers.");
    return;
  }
  const source = createSplitImage();
  const expected = generateOutline(source, TRACING_PRESETS.advanced);
  const actual = await new OutlineProcessor().process(source, TRACING_PRESETS.advanced);

  assert.deepEqual(actual, expected);
});
