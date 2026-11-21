import assert from "node:assert/strict";
import test from "node:test";
import {
  changeLessonStage,
  isLessonProgress,
} from "../browser-build/lessons/LessonProgress.js";
import {
  createProjectDocument,
  isProjectDocument,
} from "../browser-build/storage/ProjectDocument.js";
import { TRACING_PRESETS } from "../browser-build/tracing/OutlineGenerator.js";

const serializedLayer = {
  id: "art-layer",
  name: "Lesson Artwork",
  visible: true,
  locked: false,
  opacity: 1,
  imageData: "data:image/png;base64,AA==",
};

function makeProgress(overrides = {}) {
  return {
    lessonId: "starter-flower",
    title: "Simple Flower",
    sourceImageId: "flower-original",
    originalReferenceId: "flower-original",
    processedReferenceId: "flower-main",
    detailedReferenceId: "flower-detail",
    currentStage: 1,
    drawingProjectId: "project-one",
    constructionGuidesVisible: false,
    referenceVisible: true,
    referenceOpacity: 0.28,
    selectedReference: "original",
    hintVisible: false,
    workspaceVisible: true,
    completed: false,
    mainOutlineSettings: { ...TRACING_PRESETS.beginner },
    detailedOutlineSettings: { ...TRACING_PRESETS.advanced },
    ...overrides,
  };
}

test("lesson stages transition with guide and reference visibility without touching artwork", () => {
  const progress = makeProgress();
  const basicShapes = changeLessonStage(progress, 1);
  assert.equal(basicShapes.currentStage, 2);
  assert.equal(basicShapes.constructionGuidesVisible, true);
  assert.equal(basicShapes.referenceVisible, true);
  assert.equal(progress.currentStage, 1);

  const independent = changeLessonStage(makeProgress({ currentStage: 4 }), 1);
  assert.equal(independent.currentStage, 5);
  assert.equal(independent.referenceVisible, false);
  assert.equal(independent.selectedReference, "original");

  const finalStage = changeLessonStage(makeProgress({ currentStage: 6 }), 1);
  assert.equal(finalStage.currentStage, 6);
  assert.equal(changeLessonStage(progress, -1).currentStage, 1);
});

test("lesson progress validates and persists source, outline references, settings, and guide state", () => {
  const lessonProgress = makeProgress({
    currentStage: 2,
    constructionGuidesVisible: true,
    referenceOpacity: 0.65,
    selectedReference: "original",
  });
  const project = createProjectDocument(
    "project-one",
    "Lesson practice",
    1200,
    800,
    "#fffdf9",
    { activeLayerId: serializedLayer.id, layers: [serializedLayer] },
    undefined,
    null,
    0.65,
    true,
    null,
    false,
    50,
    null,
    lessonProgress,
  );

  assert.equal(isLessonProgress(lessonProgress), true);
  assert.equal(isProjectDocument(project), true);
  assert.deepEqual(project.lessonProgress, lessonProgress);
  assert.equal(
    isLessonProgress(makeProgress({ currentStage: 7 })),
    false,
  );
  assert.equal(
    isProjectDocument({
      ...project,
      lessonProgress: { ...lessonProgress, referenceOpacity: 1.2 },
    }),
    false,
  );
});
