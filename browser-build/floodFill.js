const pixelChunkSize = 20_000;
export async function floodFillPixels(pixels, width, height, startX, startY, fillColor, tolerance) {
    if (width <= 0 ||
        height <= 0 ||
        pixels.length !== width * height * 4 ||
        startX < 0 ||
        startX >= width ||
        startY < 0 ||
        startY >= height) {
        throw new RangeError("Flood fill received invalid image dimensions or start coordinates.");
    }
    const startIndex = (startY * width + startX) * 4;
    const targetColor = [
        pixels[startIndex],
        pixels[startIndex + 1],
        pixels[startIndex + 2],
        pixels[startIndex + 3],
    ];
    const allowedDifference = Math.max(0, Math.min(255, tolerance));
    if (colorsMatch(targetColor, fillColor, allowedDifference))
        return false;
    function matchesTarget(pixelIndex) {
        const alpha = pixels[pixelIndex + 3];
        if (targetColor[3] === 0)
            return alpha === 0;
        return (Math.abs(pixels[pixelIndex] - targetColor[0]) <= allowedDifference &&
            Math.abs(pixels[pixelIndex + 1] - targetColor[1]) <= allowedDifference &&
            Math.abs(pixels[pixelIndex + 2] - targetColor[2]) <= allowedDifference &&
            Math.abs(alpha - targetColor[3]) <= allowedDifference);
    }
    const pendingSeeds = [startY * width + startX];
    let processedPixels = 0;
    while (pendingSeeds.length > 0) {
        const seed = pendingSeeds.pop();
        const y = Math.floor(seed / width);
        let x = seed % width;
        while (x >= 0 && matchesTarget((y * width + x) * 4))
            x -= 1;
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
                if (aboveMatches && !spanAbove)
                    pendingSeeds.push((y - 1) * width + x);
                spanAbove = aboveMatches;
            }
            if (y < height - 1) {
                const belowMatches = matchesTarget(((y + 1) * width + x) * 4);
                if (belowMatches && !spanBelow)
                    pendingSeeds.push((y + 1) * width + x);
                spanBelow = belowMatches;
            }
            if (processedPixels >= pixelChunkSize) {
                await new Promise((resolve) => globalThis.setTimeout(resolve, 0));
                processedPixels = 0;
            }
        }
    }
    return true;
}
function colorsMatch(first, second, tolerance) {
    if (first[3] === 0 && second[3] === 0)
        return true;
    return (Math.abs(first[0] - second[0]) <= tolerance &&
        Math.abs(first[1] - second[1]) <= tolerance &&
        Math.abs(first[2] - second[2]) <= tolerance &&
        Math.abs(first[3] - second[3]) <= tolerance);
}
