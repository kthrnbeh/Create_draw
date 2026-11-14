import assert from "node:assert/strict";
import test from "node:test";
import {
  createProjectDocument,
  isLegacySavedDrawing,
  isProjectDocument,
} from "../browser-build/storage/ProjectDocument.js";
import { DEFAULT_TRACING_SETTINGS } from "../browser-build/tracing/OutlineGenerator.js";

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
  assert.equal(project.referenceAssetId, null);
  assert.equal(project.referenceOpacity, 0.28);
  assert.equal(project.referenceVisible, true);
  assert.equal(project.tracingGridVisible, false);
  assert.equal(project.traceSettings, null);
  assert.equal(isProjectDocument(project), true);
  assert.equal(isProjectDocument({ ...project, schemaVersion: 999 }), false);
  assert.equal(isProjectDocument({ ...project, activeLayerId: "missing" }), false);
  const previousProjectFormat = { ...project };
  delete previousProjectFormat.referenceAssetId;
  delete previousProjectFormat.referenceOpacity;
  delete previousProjectFormat.originalReferenceAssetId;
  delete previousProjectFormat.referenceVisible;
  delete previousProjectFormat.tracingGridVisible;
  delete previousProjectFormat.tracingGridSize;
  delete previousProjectFormat.traceSettings;
  assert.equal(isProjectDocument(previousProjectFormat), true);
  assert.equal(isProjectDocument({ ...project, referenceAssetId: "" }), false);
  assert.equal(isProjectDocument({ ...project, referenceOpacity: 1.5 }), false);
  assert.equal(isProjectDocument({ ...project, tracingGridSize: 101 }), false);
  assert.equal(
    isProjectDocument({
      ...project,
      traceSettings: { ...DEFAULT_TRACING_SETTINGS, threshold: 300 },
    }),
    false,
  );
  assert.equal(
    isProjectDocument({
      ...project,
      originalReferenceAssetId: "original-image",
      traceSettings: DEFAULT_TRACING_SETTINGS,
    }),
    true,
  );

  const tracingProject = createProjectDocument(
    "project-two",
    "Trace practice",
    1200,
    800,
    "#fffdf9",
    { activeLayerId: serializedLayer.id, layers: [serializedLayer] },
    "2026-01-01T00:00:00.000Z",
    "processed-image",
    0.75,
    false,
    "original-image",
    true,
    24,
    DEFAULT_TRACING_SETTINGS,
  );
  assert.equal(tracingProject.referenceVisible, false);
  assert.equal(tracingProject.originalReferenceAssetId, "original-image");
  assert.equal(tracingProject.tracingGridVisible, true);
  assert.equal(tracingProject.tracingGridSize, 24);
  assert.deepEqual(tracingProject.traceSettings, DEFAULT_TRACING_SETTINGS);
  assert.equal(isProjectDocument(tracingProject), true);
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
