import assert from "node:assert/strict";
import test from "node:test";
import { BRUSH_PRESETS, drawBrushSegment } from "../browser-build/tools/BrushStrokes.js";

class RecordingContext {
  globalAlpha = 1;
  globalCompositeOperation = "source-over";
  strokeStyle = "#000000";
  fillStyle = "#000000";
  lineWidth = 1;
  lineCap = "butt";
  lineJoin = "miter";
  filter = "none";
  operations = [];
  states = [];
  lineDash = [];

  save() {
    this.states.push({
      globalAlpha: this.globalAlpha,
      globalCompositeOperation: this.globalCompositeOperation,
      strokeStyle: this.strokeStyle,
      fillStyle: this.fillStyle,
      lineWidth: this.lineWidth,
      lineCap: this.lineCap,
      lineJoin: this.lineJoin,
      filter: this.filter,
      lineDash: [...this.lineDash],
    });
  }

  restore() {
    Object.assign(this, this.states.pop());
  }

  beginPath() {
    this.operations.push("beginPath");
  }

  moveTo() {
    this.operations.push("moveTo");
  }

  lineTo() {
    this.operations.push("lineTo");
  }

  stroke() {
    this.operations.push("stroke");
  }

  arc() {
    this.operations.push("arc");
  }

  fill() {
    this.operations.push("fill");
  }

  fillRect() {
    this.operations.push("fillRect");
  }

  setLineDash(lineDash) {
    this.lineDash = lineDash;
  }

  createRadialGradient() {
    this.operations.push("gradient");
    return { addColorStop() {} };
  }
}

test("all art-supply presets draw and restore canvas state", () => {
  assert.equal(new Set(BRUSH_PRESETS).size, BRUSH_PRESETS.length);

  for (const preset of BRUSH_PRESETS) {
    const context = new RecordingContext();
    drawBrushSegment(
      context,
      { x: 10, y: 12 },
      { x: 68, y: 45 },
      { preset, width: 8, color: "#e27763", opacity: 0.72 },
    );

    assert.ok(context.operations.length > 0, `${preset} should render`);
    assert.equal(context.states.length, 0, `${preset} should balance save and restore`);
    assert.equal(context.globalAlpha, 1, `${preset} should not leak opacity`);
    assert.equal(context.globalCompositeOperation, "source-over");
  }
});

test("airbrush uses soft radial pigment rather than a hard line", () => {
  const context = new RecordingContext();

  drawBrushSegment(
    context,
    { x: 0, y: 0 },
    { x: 24, y: 0 },
    { preset: "airbrush", width: 8, color: "#34343d", opacity: 1 },
  );

  assert.ok(context.operations.includes("gradient"));
  assert.ok(context.operations.includes("fillRect"));
  assert.equal(context.operations.includes("stroke"), false);
});
