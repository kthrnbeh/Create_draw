import { isTracingSettings, } from "../tracing/OutlineGenerator.js";
export function isLessonStage(value) {
    return value === 1 || value === 2 || value === 3 ||
        value === 4 || value === 5 || value === 6;
}
export function isLessonProgress(value) {
    if (!value || typeof value !== "object")
        return false;
    const progress = value;
    return (typeof progress.lessonId === "string" &&
        progress.lessonId.length > 0 &&
        typeof progress.title === "string" &&
        progress.title.length > 0 &&
        typeof progress.sourceImageId === "string" &&
        progress.sourceImageId.length > 0 &&
        typeof progress.originalReferenceId === "string" &&
        progress.originalReferenceId.length > 0 &&
        typeof progress.processedReferenceId === "string" &&
        progress.processedReferenceId.length > 0 &&
        typeof progress.detailedReferenceId === "string" &&
        progress.detailedReferenceId.length > 0 &&
        isLessonStage(progress.currentStage) &&
        typeof progress.drawingProjectId === "string" &&
        progress.drawingProjectId.length > 0 &&
        typeof progress.constructionGuidesVisible === "boolean" &&
        typeof progress.referenceVisible === "boolean" &&
        typeof progress.referenceOpacity === "number" &&
        Number.isFinite(progress.referenceOpacity) &&
        progress.referenceOpacity >= 0 &&
        progress.referenceOpacity <= 1 &&
        (progress.selectedReference === null ||
            progress.selectedReference === "original" ||
            progress.selectedReference === "main-outline" ||
            progress.selectedReference === "detailed-outline") &&
        typeof progress.hintVisible === "boolean" &&
        typeof progress.workspaceVisible === "boolean" &&
        typeof progress.completed === "boolean" &&
        isTracingSettings(progress.mainOutlineSettings) &&
        isTracingSettings(progress.detailedOutlineSettings));
}
export function changeLessonStage(progress, direction) {
    const currentStage = Math.max(1, Math.min(6, progress.currentStage + direction));
    return {
        ...progress,
        currentStage,
        constructionGuidesVisible: currentStage === 2,
        selectedReference: currentStage === 3 ? "main-outline" :
            currentStage === 4 ? "detailed-outline" : "original",
        referenceVisible: currentStage !== 5,
    };
}
