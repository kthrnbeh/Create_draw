import assert from "node:assert/strict";
import test from "node:test";
import {
  createProjectDocument,
  isLegacySavedDrawing,
  isProjectDocument,
} from "../browser-build/storage/ProjectDocument.js";

const serializedLayer = {
  id: "layer-one",
  name: "Layer 1",
  visible: true,
  locked: false,
  opacity: 1,
  imageData: "data:image/png;base64,AA==",
};

test("creates and validates a versioned raster-layer project", () => {
  const project = createProjectDocument(
    "project-one",
    "My drawing",
    1200,
    800,
    "#fffdf9",
    { activeLayerId: serializedLayer.id, layers: [serializedLayer] },
  );

  assert.equal(project.schemaVersion, 1);
  assert.equal(isProjectDocument(project), true);
  assert.equal(isProjectDocument({ ...project, schemaVersion: 999 }), false);
  assert.equal(isProjectDocument({ ...project, activeLayerId: "missing" }), false);
});

test("recognizes the legacy single-canvas save without mutating it", () => {
  const legacyDrawing = {
    drawing: "data:image/png;base64,AA==",
    background: "#ffffff",
  };
  const before = JSON.stringify(legacyDrawing);

  assert.equal(isLegacySavedDrawing(legacyDrawing), true);
  assert.equal(isLegacySavedDrawing({ ...legacyDrawing, drawing: "not-an-image" }), false);
  assert.equal(JSON.stringify(legacyDrawing), before);
});
