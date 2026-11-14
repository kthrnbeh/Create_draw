import assert from "node:assert/strict";
import test from "node:test";
import { MAX_ZOOM, MIN_ZOOM, Viewport } from "../browser-build/core/Viewport.js";

test("zooms around the focal point without moving its artwork coordinate", () => {
  const viewport = new Viewport();
  const viewportSize = { width: 900, height: 600 };
  const artworkSize = { width: 1200, height: 800 };
  const focalPoint = { x: 265, y: 210 };

  viewport.panBy(38, -17);
  const before = {
    x: (focalPoint.x - viewportSize.width / 2 - viewport.panX) / viewport.zoom + artworkSize.width / 2,
    y: (focalPoint.y - viewportSize.height / 2 - viewport.panY) / viewport.zoom + artworkSize.height / 2,
  };

  viewport.zoomAt(3.2, focalPoint, viewportSize);

  const after = {
    x: (focalPoint.x - viewportSize.width / 2 - viewport.panX) / viewport.zoom + artworkSize.width / 2,
    y: (focalPoint.y - viewportSize.height / 2 - viewport.panY) / viewport.zoom + artworkSize.height / 2,
  };

  assert.ok(Math.abs(after.x - before.x) < 1e-9);
  assert.ok(Math.abs(after.y - before.y) < 1e-9);
});

test("clamps zoom to the supported range", () => {
  const viewport = new Viewport();

  viewport.zoomAt(0.01, { x: 50, y: 50 }, { width: 100, height: 100 });
  assert.equal(viewport.zoom, MIN_ZOOM);

  viewport.zoomAt(9, { x: 50, y: 50 }, { width: 100, height: 100 });
  assert.equal(viewport.zoom, MAX_ZOOM);
});

test("fits, centers, and resets without changing artwork dimensions", () => {
  const viewport = new Viewport();
  const viewportSize = { width: 900, height: 600 };
  const artworkSize = { width: 1200, height: 800 };

  viewport.fitToScreen(viewportSize, artworkSize);
  assert.equal(viewport.zoom, 0.69);
  assert.equal(viewport.panX, 0);
  assert.equal(viewport.panY, 0);

  viewport.zoomAt(2, { x: 450, y: 300 }, viewportSize);
  viewport.panBy(30, -20);
  viewport.centerCanvas();
  assert.equal(viewport.zoom, 2);
  assert.equal(viewport.panX, 0);
  assert.equal(viewport.panY, 0);

  viewport.resetView();
  assert.equal(viewport.zoom, 1);
  assert.equal(viewport.panX, 0);
  assert.equal(viewport.panY, 0);
  assert.deepEqual(artworkSize, { width: 1200, height: 800 });
});

test("centers a navigator-selected artwork point in the viewport", () => {
  const viewport = new Viewport();
  const artworkSize = { width: 1200, height: 800 };
  const point = { x: 900, y: 300 };

  viewport.zoomAt(2, { x: 450, y: 300 }, { width: 900, height: 600 });
  viewport.centerOnArtworkPoint(point, artworkSize);

  assert.equal(viewport.panX, -600);
  assert.equal(viewport.panY, 200);
});

test("maps the visible region correctly at 25%, 100%, and 400% zoom", () => {
  const viewport = new Viewport();
  const viewportSize = { width: 900, height: 600 };
  const artworkSize = { width: 1200, height: 800 };

  for (const zoom of [MIN_ZOOM, 1, MAX_ZOOM]) {
    viewport.resetView();
    viewport.zoomAt(zoom, { x: 450, y: 300 }, viewportSize);
    const visible = viewport.getVisibleArtworkRect(viewportSize, artworkSize);

    assert.ok(Math.abs(visible.width - viewportSize.width / zoom) < 1e-9);
    assert.ok(Math.abs(visible.height - viewportSize.height / zoom) < 1e-9);
    assert.equal(visible.x + visible.width / 2, artworkSize.width / 2);
    assert.equal(visible.y + visible.height / 2, artworkSize.height / 2);
  }
});

test("converts pointer coordinates to artwork and back at every supported zoom", () => {
  const viewport = new Viewport();
  const viewportSize = { width: 900, height: 600 };
  const artworkSize = { width: 1200, height: 800 };
  const artworkPoint = { x: 337.25, y: 612.75 };

  for (const zoom of [MIN_ZOOM, 1, MAX_ZOOM]) {
    viewport.resetView();
    viewport.zoomAt(zoom, { x: 319, y: 274 }, viewportSize);
    viewport.panBy(23, -41);

    const pointerPoint = viewport.artworkToViewport(
      artworkPoint,
      viewportSize,
      artworkSize,
    );
    const mappedPoint = viewport.viewportToArtwork(
      pointerPoint,
      viewportSize,
      artworkSize,
    );

    assert.ok(Math.abs(mappedPoint.x - artworkPoint.x) < 1e-9);
    assert.ok(Math.abs(mappedPoint.y - artworkPoint.y) < 1e-9);
  }
});
