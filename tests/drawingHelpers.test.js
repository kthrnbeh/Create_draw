import assert from "node:assert/strict";
import test from "node:test";
import { drawExportContent } from "../browser-build/export/CanvasExport.js";
import { eraseSegment } from "../browser-build/tools/Eraser.js";

class RecordingContext {
  globalAlpha = 1;
  globalCompositeOperation = "source-over";
  fillStyle = "";
  lineWidth = 1;
  lineCap = "butt";
  lineJoin = "miter";
  strokeStyle = "";
  shadowColor = "";
  shadowBlur = 0;
  operations = [];
  states = [];

  save() {
    this.states.push({
      globalAlpha: this.globalAlpha,
      globalCompositeOperation: this.globalCompositeOperation,
      fillStyle: this.fillStyle,
      lineWidth: this.lineWidth,
      lineCap: this.lineCap,
      lineJoin: this.lineJoin,
      strokeStyle: this.strokeStyle,
      shadowColor: this.shadowColor,
      shadowBlur: this.shadowBlur,
    });
  }

  restore() {
    Object.assign(this, this.states.pop());
  }

  fillRect(...args) {
    this.operations.push({ type: "fillRect", args, fillStyle: this.fillStyle });
  }

  drawImage(...args) {
    this.operations.push({
      type: "drawImage",
      args,
      globalAlpha: this.globalAlpha,
    });
  }

  beginPath() {}
  moveTo() {}
  lineTo() {}
  stroke() {
    this.operations.push({
      type: "stroke",
      globalCompositeOperation: this.globalCompositeOperation,
      globalAlpha: this.globalAlpha,
      lineWidth: this.lineWidth,
      shadowBlur: this.shadowBlur,
    });
  }
}

test("clean export draws paper and artwork but excludes references and lesson guides", () => {
  const context = new RecordingContext();
  const artwork = { width: 1200, height: 800, name: "artwork" };
  const lessonGuide = { name: "lesson guide" };

  drawExportContent(context, artwork, "#fffdf9", null, 0.4);

  assert.deepEqual(
    context.operations.map((operation) => operation.type),
    ["fillRect", "drawImage"],
  );
  assert.equal(context.operations[0].fillStyle, "#fffdf9");
  assert.equal(context.operations[1].args[0], artwork);
  assert.equal(context.operations.some((operation) => operation.args?.[0] === lessonGuide), false);
});

test("reference export composites the reference beneath artwork at its chosen opacity", () => {
  const context = new RecordingContext();
  const artwork = { width: 1200, height: 800 };
  const reference = { naturalWidth: 400, naturalHeight: 200 };

  drawExportContent(context, artwork, "#ffffff", reference, 0.3);

  assert.equal(context.operations[1].args[0], reference);
  assert.equal(context.operations[1].globalAlpha, 0.3);
  assert.equal(context.operations[2].args[0], artwork);
  assert.equal(context.globalAlpha, 1);
});

test("eraser removes pixels only through the supplied artwork context", () => {
  const artworkContext = new RecordingContext();
  const referenceContext = new RecordingContext();

  eraseSegment(artworkContext, { x: 2, y: 3 }, { x: 12, y: 13 }, 18, false);

  assert.equal(artworkContext.operations[0].globalCompositeOperation, "destination-out");
  assert.equal(artworkContext.operations[0].lineWidth, 18);
  assert.equal(referenceContext.operations.length, 0);
  assert.equal(artworkContext.globalCompositeOperation, "source-over");
});

test("soft eraser uses a softer transparent stroke", () => {
  const context = new RecordingContext();

  eraseSegment(context, { x: 0, y: 0 }, { x: 0, y: 0 }, 20, true);

  assert.equal(context.operations[0].globalAlpha, 0.6);
  assert.equal(context.operations[0].shadowBlur, 7);
  assert.equal(context.globalCompositeOperation, "source-over");
});
