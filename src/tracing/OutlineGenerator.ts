export type TracingDifficulty = "beginner" | "intermediate" | "advanced";

export interface TracingSettings {
  difficulty: TracingDifficulty;
  brightness: number;
  contrast: number;
  grayscale: boolean;
  edgeSensitivity: number;
  threshold: number;
  noiseReduction: number;
  outlineThickness: number;
  invert: boolean;
}

export interface RasterImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export const DEFAULT_TRACING_SETTINGS: Readonly<TracingSettings> = {
  difficulty: "beginner",
  brightness: 0,
  contrast: 12,
  grayscale: true,
  edgeSensitivity: 1.6,
  threshold: 105,
  noiseReduction: 2,
  outlineThickness: 2,
  invert: false,
};

export const TRACING_PRESETS: Readonly<Record<TracingDifficulty, TracingSettings>> = {
  beginner: { ...DEFAULT_TRACING_SETTINGS },
  intermediate: {
    difficulty: "intermediate",
    brightness: 0,
    contrast: 12,
    grayscale: true,
    edgeSensitivity: 1.25,
    threshold: 72,
    noiseReduction: 1,
    outlineThickness: 2,
    invert: false,
  },
  advanced: {
    difficulty: "advanced",
    brightness: 0,
    contrast: 8,
    grayscale: true,
    edgeSensitivity: 1,
    threshold: 42,
    noiseReduction: 0,
    outlineThickness: 1,
    invert: false,
  },
};

export function isTracingSettings(value: unknown): value is TracingSettings {
  if (!value || typeof value !== "object") return false;
  const settings = value as Partial<TracingSettings>;
  return (
    (settings.difficulty === "beginner" ||
      settings.difficulty === "intermediate" ||
      settings.difficulty === "advanced") &&
    typeof settings.brightness === "number" &&
    Number.isFinite(settings.brightness) &&
    settings.brightness >= -100 &&
    settings.brightness <= 100 &&
    typeof settings.contrast === "number" &&
    Number.isFinite(settings.contrast) &&
    settings.contrast >= -100 &&
    settings.contrast <= 100 &&
    typeof settings.grayscale === "boolean" &&
    typeof settings.edgeSensitivity === "number" &&
    Number.isFinite(settings.edgeSensitivity) &&
    settings.edgeSensitivity >= 0.25 &&
    settings.edgeSensitivity <= 4 &&
    typeof settings.threshold === "number" &&
    Number.isFinite(settings.threshold) &&
    settings.threshold >= 1 &&
    settings.threshold <= 255 &&
    typeof settings.noiseReduction === "number" &&
    Number.isInteger(settings.noiseReduction) &&
    settings.noiseReduction >= 0 &&
    settings.noiseReduction <= 4 &&
    typeof settings.outlineThickness === "number" &&
    Number.isInteger(settings.outlineThickness) &&
    settings.outlineThickness >= 1 &&
    settings.outlineThickness <= 5 &&
    typeof settings.invert === "boolean"
  );
}

function bounded(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function medianFilter(
  source: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const output = new Uint8Array(source.length);
  const neighborhood = new Uint8Array(9);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let sample = 0;
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        const sampleY = Math.max(0, Math.min(height - 1, y + offsetY));
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          const sampleX = Math.max(0, Math.min(width - 1, x + offsetX));
          neighborhood[sample] = source[sampleY * width + sampleX]!;
          sample += 1;
        }
      }
      neighborhood.sort();
      output[y * width + x] = neighborhood[4]!;
    }
  }
  return output;
}

function dilateEdges(source: Uint8Array, width: number, height: number): Uint8Array {
  const output = new Uint8Array(source.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let hasEdge = false;
      for (let offsetY = -1; offsetY <= 1 && !hasEdge; offsetY += 1) {
        const sampleY = y + offsetY;
        if (sampleY < 0 || sampleY >= height) continue;
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          const sampleX = x + offsetX;
          if (sampleX < 0 || sampleX >= width) continue;
          if (source[sampleY * width + sampleX]) {
            hasEdge = true;
            break;
          }
        }
      }
      output[y * width + x] = hasEdge ? 1 : 0;
    }
  }
  return output;
}

export function generateOutline(
  source: RasterImageData,
  settings: TracingSettings,
): RasterImageData {
  if (!isTracingSettings(settings)) {
    throw new TypeError("The tracing settings are invalid.");
  }
  if (
    !Number.isInteger(source.width) ||
    !Number.isInteger(source.height) ||
    source.width <= 0 ||
    source.height <= 0 ||
    source.data.length !== source.width * source.height * 4
  ) {
    throw new RangeError("The source image data has invalid dimensions.");
  }

  const brightness = bounded(settings.brightness, -100, 100);
  const contrast = bounded(settings.contrast, -100, 100);
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const sensitivity = bounded(settings.edgeSensitivity, 0.25, 4);
  const threshold = bounded(settings.threshold, 1, 255);
  const noiseReduction = Math.round(bounded(settings.noiseReduction, 0, 4));
  const outlineThickness = Math.round(bounded(settings.outlineThickness, 1, 5));
  const grayscale = settings.grayscale;
  const pixelCount = source.width * source.height;
  let luminance: Uint8Array = new Uint8Array(pixelCount);

  for (let index = 0; index < pixelCount; index += 1) {
    const offset = index * 4;
    const red = bounded((source.data[offset]! - 128) * contrastFactor + 128 + brightness, 0, 255);
    const green = bounded((source.data[offset + 1]! - 128) * contrastFactor + 128 + brightness, 0, 255);
    const blue = bounded((source.data[offset + 2]! - 128) * contrastFactor + 128 + brightness, 0, 255);
    const value = 0.299 * red + 0.587 * green + 0.114 * blue;
    const chroma = Math.max(red, green, blue) - Math.min(red, green, blue);
    luminance[index] = Math.round(
      grayscale ? value : bounded(value + chroma * 0.25, 0, 255),
    );
  }

  for (let pass = 0; pass < noiseReduction; pass += 1) {
    luminance = medianFilter(luminance, source.width, source.height);
  }

  let edges: Uint8Array = new Uint8Array(pixelCount);
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const top = Math.max(0, y - 1) * source.width;
      const middle = y * source.width;
      const bottom = Math.min(source.height - 1, y + 1) * source.width;
      const left = Math.max(0, x - 1);
      const right = Math.min(source.width - 1, x + 1);
      const gradientX =
        -luminance[top + left]! + luminance[top + right]! -
        2 * luminance[middle + left]! + 2 * luminance[middle + right]! -
        luminance[bottom + left]! + luminance[bottom + right]!;
      const gradientY =
        -luminance[top + left]! - 2 * luminance[top + x]! - luminance[top + right]! +
        luminance[bottom + left]! + 2 * luminance[bottom + x]! + luminance[bottom + right]!;
      const magnitude = (Math.hypot(gradientX, gradientY) / 4) * sensitivity;
      edges[middle + x] = magnitude >= threshold ? 1 : 0;
    }
  }

  for (let pass = 1; pass < outlineThickness; pass += 1) {
    edges = dilateEdges(edges, source.width, source.height);
  }

  const data = new Uint8ClampedArray(pixelCount * 4);
  for (let index = 0; index < pixelCount; index += 1) {
    const isEdge = Boolean(edges[index]);
    const value = isEdge !== settings.invert ? 0 : 255;
    const offset = index * 4;
    data[offset] = value;
    data[offset + 1] = value;
    data[offset + 2] = value;
    data[offset + 3] = 255;
  }
  return { data, width: source.width, height: source.height };
}
