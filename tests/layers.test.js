import assert from "node:assert/strict";
import test from "node:test";
import { LayerManager } from "../browser-build/layers/LayerManager.js";

class FakeCanvas {
  width = 0;
  height = 0;
  draws = [];
  hasPixels = false;
  context = new FakeContext(this);

  getContext() {
    return this.context;
  }

  toDataURL() {
    return "data:image/png;base64,AA==";
  }
}

class FakeContext {
  globalAlpha = 1;
  globalCompositeOperation = "source-over";
  lineCap = "butt";
  lineJoin = "miter";
  stateStack = [];

  constructor(canvas) {
    this.canvas = canvas;
  }

  save() {
    this.stateStack.push({
      globalAlpha: this.globalAlpha,
      globalCompositeOperation: this.globalCompositeOperation,
    });
  }

  restore() {
    Object.assign(this, this.stateStack.pop());
  }

  clearRect() {
    this.canvas.draws = [];
    this.canvas.hasPixels = false;
  }

  drawImage(source) {
    this.canvas.draws.push({ source, opacity: this.globalAlpha });
    this.canvas.hasPixels = true;
  }

  getImageData(_x, _y, width, height) {
    const data = new Uint8ClampedArray(width * height * 4);
    if (this.canvas.hasPixels) data[3] = 255;
    return { data };
  }
}

function createManager() {
  return new LayerManager(4, 3, () => new FakeCanvas());
}

test("supports layer selection, duplication, ordering, properties, and deletion", () => {
  const manager = createManager();
  const bottom = manager.activeLayer;
  const top = manager.addLayer("Color");

  assert.equal(manager.layers.length, 2);
  assert.equal(manager.activeLayer.id, top.id);
  assert.equal(manager.renameLayer(top.id, "  Shading  "), true);
  assert.equal(top.name, "Shading");
  assert.equal(manager.setLayerOpacity(top.id, 0.4), true);
  assert.equal(manager.setLayerVisible(top.id, false), true);
  assert.equal(manager.setLayerLocked(top.id, true), true);
  assert.equal(manager.canEditActiveLayer, false);

  const duplicate = manager.duplicateLayer(top.id);
  assert.ok(duplicate);
  assert.deepEqual(manager.layers.map((layer) => layer.id), [bottom.id, top.id, duplicate.id]);
  assert.equal(duplicate.name, "Shading copy");
  assert.equal(duplicate.visible, false);
  assert.equal(duplicate.locked, true);
  assert.equal(duplicate.opacity, 0.4);

  assert.equal(manager.moveLayer(bottom.id, 1), true);
  assert.deepEqual(manager.layers.map((layer) => layer.id), [top.id, bottom.id, duplicate.id]);
  assert.equal(manager.deleteLayer(duplicate.id), true);
  assert.equal(manager.deleteLayer(bottom.id), true);
  assert.equal(manager.layers.length, 1);
  assert.equal(manager.deleteLayer(top.id), false);
  assert.equal(manager.renameLayer(top.id, "   "), false);
});

test("composites visible layers in bottom-to-top order with their opacity", () => {
  const manager = createManager();
  const bottom = manager.activeLayer;
  const middle = manager.addLayer("Middle");
  const top = manager.addLayer("Top");
  manager.setLayerVisible(middle.id, false);
  manager.setLayerOpacity(top.id, 0.35);
  const target = new FakeCanvas();

  manager.render(target.context);

  assert.deepEqual(
    target.draws.map(({ source, opacity }) => ({ source, opacity })),
    [
      { source: bottom.canvas, opacity: 1 },
      { source: top.canvas, opacity: 0.35 },
    ],
  );
});

test("serializes layer order, active selection, and editable metadata", () => {
  const manager = createManager();
  const bottom = manager.activeLayer;
  const top = manager.addLayer("Color");
  manager.setLayerVisible(bottom.id, false);
  manager.setLayerLocked(bottom.id, true);
  manager.setLayerOpacity(bottom.id, 0.6);
  manager.setActiveLayer(bottom.id);

  assert.deepEqual(manager.serialize(), {
    activeLayerId: bottom.id,
    layers: [
      {
        id: bottom.id,
        name: "Layer 1",
        visible: false,
        locked: true,
        opacity: 0.6,
        imageData: "data:image/png;base64,AA==",
      },
      {
        id: top.id,
        name: "Color",
        visible: true,
        locked: false,
        opacity: 1,
        imageData: "data:image/png;base64,AA==",
      },
    ],
  });
});

test("clears only an unlocked layer that contains artwork", () => {
  const manager = createManager();
  const first = manager.activeLayer;
  const second = manager.addLayer("Color");
  first.canvas.hasPixels = true;
  second.canvas.hasPixels = true;

  assert.equal(manager.clearLayer(first.id), "cleared");
  assert.equal(first.canvas.hasPixels, false);
  assert.equal(second.canvas.hasPixels, true);
  assert.equal(manager.clearLayer(first.id), "empty");

  manager.setLayerLocked(second.id, true);
  assert.equal(manager.clearLayer(second.id), "locked");
  assert.equal(second.canvas.hasPixels, true);
  assert.equal(manager.clearLayer("missing"), "missing");
});

test("clears artwork from all unlocked layers but preserves locked artwork", () => {
  const manager = createManager();
  const visible = manager.activeLayer;
  const hidden = manager.addLayer("Hidden");
  const locked = manager.addLayer("Protected");
  visible.canvas.hasPixels = true;
  hidden.canvas.hasPixels = true;
  locked.canvas.hasPixels = true;
  manager.setLayerVisible(hidden.id, false);
  manager.setLayerLocked(locked.id, true);
  manager.setLayerOpacity(visible.id, 0.5);

  const result = manager.clearEditableLayers();

  assert.deepEqual(result, {
    clearedLayerIds: [visible.id, hidden.id],
    lockedLayerIds: [locked.id],
  });
  assert.equal(visible.canvas.hasPixels, false);
  assert.equal(hidden.canvas.hasPixels, false);
  assert.equal(locked.canvas.hasPixels, true);
  assert.equal(visible.opacity, 0.5);
  assert.equal(hidden.visible, false);
});

test("merges down only when the visible result can be preserved and flattens explicitly", () => {
  const manager = createManager();
  const bottom = manager.activeLayer;
  const top = manager.addLayer("Top");
  manager.setLayerOpacity(bottom.id, 0.5);

  assert.equal(manager.mergeDown(top.id), false);
  manager.setLayerOpacity(bottom.id, 1);
  assert.equal(manager.mergeDown(top.id), true);
  assert.equal(manager.layers.length, 1);
  assert.equal(manager.activeLayer.id, bottom.id);
  assert.equal(bottom.canvas.draws.at(-1)?.source instanceof FakeCanvas, true);

  manager.addLayer("Another");
  manager.setLayerVisible(manager.activeLayer.id, false);
  const flattened = manager.flattenArtwork();
  assert.equal(manager.layers.length, 1);
  assert.equal(flattened.visible, true);
  assert.equal(flattened.name, "Flattened Artwork");
});
