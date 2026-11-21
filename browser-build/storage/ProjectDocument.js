import { isSerializedLayerState, } from "../layers/LayerManager.js";
import { isTracingSettings, } from "../tracing/OutlineGenerator.js";
import { isLessonProgress, } from "../lessons/LessonProgress.js";
export const PROJECT_SCHEMA_VERSION = 1;
export function createProjectDocument(projectId, projectName, width, height, background, layerState, updatedAt = new Date().toISOString(), referenceAssetId = null, referenceOpacity = 0.28, referenceVisible = true, originalReferenceAssetId = null, tracingGridVisible = false, tracingGridSize = 50, traceSettings = null, lessonProgress = null) {
    return {
        ...layerState,
        schemaVersion: PROJECT_SCHEMA_VERSION,
        projectId,
        projectName,
        width,
        height,
        background,
        updatedAt,
        referenceAssetId,
        originalReferenceAssetId,
        referenceOpacity,
        referenceVisible,
        tracingGridVisible,
        tracingGridSize,
        traceSettings,
        lessonProgress,
    };
}
export function isProjectDocument(value) {
    if (!value || typeof value !== "object")
        return false;
    const project = value;
    return (project.schemaVersion === PROJECT_SCHEMA_VERSION &&
        typeof project.projectId === "string" &&
        project.projectId.length > 0 &&
        typeof project.projectName === "string" &&
        project.projectName.trim().length > 0 &&
        typeof project.width === "number" &&
        project.width > 0 &&
        typeof project.height === "number" &&
        project.height > 0 &&
        typeof project.background === "string" &&
        /^#[\da-f]{6}$/i.test(project.background) &&
        typeof project.updatedAt === "string" &&
        (project.referenceAssetId === undefined ||
            project.referenceAssetId === null ||
            (typeof project.referenceAssetId === "string" && project.referenceAssetId.length > 0)) &&
        (project.referenceOpacity === undefined ||
            (typeof project.referenceOpacity === "number" &&
                Number.isFinite(project.referenceOpacity) &&
                project.referenceOpacity >= 0 &&
                project.referenceOpacity <= 1)) &&
        (project.originalReferenceAssetId === undefined ||
            project.originalReferenceAssetId === null ||
            (typeof project.originalReferenceAssetId === "string" &&
                project.originalReferenceAssetId.length > 0)) &&
        (project.referenceVisible === undefined ||
            typeof project.referenceVisible === "boolean") &&
        (project.tracingGridVisible === undefined ||
            typeof project.tracingGridVisible === "boolean") &&
        (project.tracingGridSize === undefined ||
            (typeof project.tracingGridSize === "number" &&
                Number.isFinite(project.tracingGridSize) &&
                project.tracingGridSize >= 10 &&
                project.tracingGridSize <= 100)) &&
        (project.traceSettings === undefined ||
            project.traceSettings === null ||
            isTracingSettings(project.traceSettings)) &&
        (project.lessonProgress === undefined ||
            project.lessonProgress === null ||
            isLessonProgress(project.lessonProgress)) &&
        isSerializedLayerState(project));
}
export function isLegacySavedDrawing(value) {
    if (!value || typeof value !== "object")
        return false;
    const drawing = value;
    return (typeof drawing.drawing === "string" &&
        drawing.drawing.startsWith("data:image/png;base64,") &&
        typeof drawing.background === "string" &&
        /^#[\da-f]{6}$/i.test(drawing.background));
}
