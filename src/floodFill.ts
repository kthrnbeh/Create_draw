export type RgbaColor = readonly [number, number, number, number];

const pixelChunkSize = 20_000;

export type GapClosing = "off" | "small" | "medium";

/** Return the connected fill region without changing the source pixels. */
export async function createFloodFillMask(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  startX: number,
  startY: number,
  tolerance: number,
  gapClosing: GapClosing = "off",
): Promise<Uint8Array> {
  if (width <= 0 || height <= 0 || pixels.length !== width * height * 4) {
    throw new RangeError("Flood fill received invalid image dimensions.");
  }
  const x0 = Math.floor(startX);
  const y0 = Math.floor(startY);
  if (x0 < 0 || x0 >= width || y0 < 0 || y0 >= height) {
    throw new RangeError("Flood fill received invalid start coordinates.");
  }

  const mask = new Uint8Array(width * height);
  const targetIndex = (y0 * width + x0) * 4;
  const target: RgbaColor = [pixels[targetIndex]!, pixels[targetIndex + 1]!, pixels[targetIndex + 2]!, pixels[targetIndex + 3]!];
  const allowed = Math.max(0, Math.min(255, tolerance));
  const bridge = gapClosing === "small" ? 1 : gapClosing === "medium" ? 2 : 0;
  const pending: Array<[number, number]> = [[x0, y0]];
  const bestGap = new Int16Array(width * height);
  bestGap.fill(32767);
  bestGap[y0 * width + x0] = 0;
  let processed = 0;

  const matches = (x: number, y: number) => {
    const index = (y * width + x) * 4;
    const alpha = pixels[index + 3]!;
    if (target[3] === 0) return alpha === 0;
    return Math.abs(pixels[index]! - target[0]) <= allowed &&
      Math.abs(pixels[index + 1]! - target[1]) <= allowed &&
      Math.abs(pixels[index + 2]! - target[2]) <= allowed &&
      Math.abs(alpha - target[3]) <= allowed;
  };

  while (pending.length) {
    const [x, y] = pending.pop()!;
    const position = y * width + x;
    const currentGap = bestGap[position]!;
    if (mask[position] || currentGap > bridge) continue;
    if (matches(x, y)) mask[position] = 1;
    processed += 1;
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const nextGap = matches(nx, ny) ? currentGap : currentGap + 1;
      const nextPosition = ny * width + nx;
      if (nextGap < bestGap[nextPosition]! && nextGap <= bridge) {
        bestGap[nextPosition] = nextGap;
        pending.push([nx, ny]);
      }
    }
    if (processed >= pixelChunkSize) {
      await new Promise<void>((resolve) => globalThis.setTimeout(resolve, 0));
      processed = 0;
    }
  }
  return mask;
}

export function paintMask(
  pixels: Uint8ClampedArray,
  mask: Uint8Array,
  width: number,
  colorAt: (x: number, y: number) => RgbaColor,
  opacity = 1,
): boolean {
  let changed = false;
  const alphaMultiplier = Math.max(0, Math.min(1, opacity));
  for (let index = 0; index < mask.length; index += 1) {
    if (!mask[index]) continue;
    const x = index % width;
    const y = Math.floor(index / width);
    const color = colorAt(x, y);
    const pixel = index * 4;
    const nextAlpha = Math.round(color[3] * alphaMultiplier);
    if (pixels[pixel] !== color[0] || pixels[pixel + 1] !== color[1] || pixels[pixel + 2] !== color[2] || pixels[pixel + 3] !== nextAlpha) changed = true;
    pixels[pixel] = color[0];
    pixels[pixel + 1] = color[1];
    pixels[pixel + 2] = color[2];
    pixels[pixel + 3] = nextAlpha;
  }
  return changed;
}

export async function floodFillPixels(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  startX: number,
  startY: number,
  fillColor: RgbaColor,
  tolerance: number,
): Promise<boolean> {
  if (
    width <= 0 ||
    height <= 0 ||
    pixels.length !== width * height * 4 ||
    startX < 0 ||
    startX >= width ||
    startY < 0 ||
    startY >= height
  ) {
    throw new RangeError("Flood fill received invalid image dimensions or start coordinates.");
  }

  const startIndex = (startY * width + startX) * 4;
  const targetColor: RgbaColor = [
    pixels[startIndex]!,
    pixels[startIndex + 1]!,
    pixels[startIndex + 2]!,
    pixels[startIndex + 3]!,
  ];
  const allowedDifference = Math.max(0, Math.min(255, tolerance));

  if (colorsMatch(targetColor, fillColor, allowedDifference)) return false;

  function matchesTarget(pixelIndex: number): boolean {
    const alpha = pixels[pixelIndex + 3]!;
    if (targetColor[3] === 0) return alpha === 0;

    return (
      Math.abs(pixels[pixelIndex]! - targetColor[0]) <= allowedDifference &&
      Math.abs(pixels[pixelIndex + 1]! - targetColor[1]) <= allowedDifference &&
      Math.abs(pixels[pixelIndex + 2]! - targetColor[2]) <= allowedDifference &&
      Math.abs(alpha - targetColor[3]) <= allowedDifference
    );
  }

  const pendingSeeds = [startY * width + startX];
  let processedPixels = 0;

  while (pendingSeeds.length > 0) {
    const seed = pendingSeeds.pop()!;
    const y = Math.floor(seed / width);
    let x = seed % width;

    while (x >= 0 && matchesTarget((y * width + x) * 4)) x -= 1;
    x += 1;

    let spanAbove = false;
    let spanBelow = false;

    for (; x < width && matchesTarget((y * width + x) * 4); x += 1) {
      const pixelIndex = (y * width + x) * 4;
      pixels[pixelIndex] = fillColor[0];
      pixels[pixelIndex + 1] = fillColor[1];
      pixels[pixelIndex + 2] = fillColor[2];
      pixels[pixelIndex + 3] = fillColor[3];
      processedPixels += 1;

      if (y > 0) {
        const aboveMatches = matchesTarget(((y - 1) * width + x) * 4);
        if (aboveMatches && !spanAbove) pendingSeeds.push((y - 1) * width + x);
        spanAbove = aboveMatches;
      }

      if (y < height - 1) {
        const belowMatches = matchesTarget(((y + 1) * width + x) * 4);
        if (belowMatches && !spanBelow) pendingSeeds.push((y + 1) * width + x);
        spanBelow = belowMatches;
      }

      if (processedPixels >= pixelChunkSize) {
        await new Promise<void>((resolve) => globalThis.setTimeout(resolve, 0));
        processedPixels = 0;
      }
    }
  }

  return true;
}

function colorsMatch(first: RgbaColor, second: RgbaColor, tolerance: number): boolean {
  if (first[3] === 0 && second[3] === 0) return true;

  return (
    Math.abs(first[0] - second[0]) <= tolerance &&
    Math.abs(first[1] - second[1]) <= tolerance &&
    Math.abs(first[2] - second[2]) <= tolerance &&
    Math.abs(first[3] - second[3]) <= tolerance
  );
}
