import { createFloodFillMask, paintMask } from "./floodFill.js";
import { AssetManager, } from "./core/AssetManager.js";
import { MAX_ZOOM, MIN_ZOOM, Viewport } from "./core/Viewport.js";
import { LayerManager } from "./layers/LayerManager.js";
import { createProjectDocument, isLegacySavedDrawing, isProjectDocument, } from "./storage/ProjectDocument.js";
import { BRUSH_PRESETS, drawBrushSegment, } from "./tools/BrushStrokes.js";
import { eraseSegment } from "./tools/Eraser.js";
import { drawExportContent } from "./export/CanvasExport.js";
import { DEFAULT_TRACING_SETTINGS, TRACING_PRESETS, isTracingSettings, } from "./tracing/OutlineGenerator.js";
import { OutlineProcessor } from "./tracing/OutlineProcessor.js";
import { changeLessonStage, } from "./lessons/LessonProgress.js";
import { genericConstructionGuide, getStarterLesson, STARTER_LESSONS, } from "./lessons/StarterLessons.js";
function getRequiredElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
        throw new Error(`The drawing app could not find ${selector}.`);
    }
    return element;
}
const canvas = getRequiredElement("#drawingCanvas");
function getCanvasContext(element) {
    const drawingContext = element.getContext("2d");
    if (!drawingContext) {
        throw new Error("The drawing app could not create a 2D canvas context.");
    }
    return drawingContext;
}
const displayContext = getCanvasContext(canvas);
const layerManager = new LayerManager(canvas.width, canvas.height);
const assetManager = new AssetManager();
let context = layerManager.activeLayer.context;
const colorSampleCanvas = document.createElement("canvas");
colorSampleCanvas.width = canvas.width;
colorSampleCanvas.height = canvas.height;
const colorSampleContext = getCanvasContext(colorSampleCanvas);
const saveStatus = getRequiredElement("#saveStatus");
const canvasViewport = getRequiredElement("#canvasViewport");
const toolPicker = getRequiredElement("#toolPicker");
const toolPickerButton = getRequiredElement("#toolPickerButton");
const toolPickerPanel = getRequiredElement("#toolPickerPanel");
const selectedToolName = getRequiredElement("#selectedToolName");
const eraserQuickButton = getRequiredElement("#eraserQuickButton");
const eraserSettings = getRequiredElement("#eraserSettings");
const hardEraserButton = getRequiredElement("#hardEraserButton");
const softEraserButton = getRequiredElement("#softEraserButton");
const bucketSettings = getRequiredElement("#bucketSettings");
const paintBucketQuickButton = getRequiredElement("#paintBucketQuickButton");
const bucketFillStyle = getRequiredElement("#bucketFillStyle");
const bucketSecondaryColor = getRequiredElement("#bucketSecondaryColor");
const bucketSecondaryColorControl = getRequiredElement("#bucketSecondaryColorControl");
const bucketGradientMode = getRequiredElement("#bucketGradientMode");
const bucketGradientAngle = getRequiredElement("#bucketGradientAngle");
const bucketGradientAngleValue = getRequiredElement("#bucketGradientAngleValue");
const bucketTexture = getRequiredElement("#bucketTexture");
const bucketGapClosing = getRequiredElement("#bucketGapClosing");
const bucketOpacity = getRequiredElement("#bucketOpacity");
const bucketOpacityValue = getRequiredElement("#bucketOpacityValue");
const bucketBoundary = getRequiredElement("#bucketBoundary");
const bucketReferenceBoundary = getRequiredElement("#bucketReferenceBoundary");
const canvasMessage = getRequiredElement("#canvasMessage");
const colorInput = getRequiredElement("#colorInput");
const colorValue = getRequiredElement("#colorValue");
const colorPreview = getRequiredElement("#colorPreview");
const sizeInput = getRequiredElement("#sizeInput");
const sizeValue = getRequiredElement("#sizeValue");
const sizeControlLabel = getRequiredElement("#sizeControlLabel");
const brushPresetInput = getRequiredElement("#brushPreset");
const brushOpacityInput = getRequiredElement("#brushOpacity");
const opacityValue = getRequiredElement("#opacityValue");
const fillToleranceInput = getRequiredElement("#fillTolerance");
const fillToleranceValue = getRequiredElement("#fillToleranceValue");
const fillInput = getRequiredElement("#fillInput");
const backgroundInput = getRequiredElement("#backgroundInput");
const canvasPaper = getRequiredElement("#canvasPaper");
const traceInput = getRequiredElement("#traceInput");
const traceImage = getRequiredElement("#traceImage");
const removeTraceButton = getRequiredElement("#removeTraceButton");
const centerImageButton = getRequiredElement("#centerImageButton");
const traceOpacityControl = getRequiredElement("#traceOpacityControl");
const traceOpacityInput = getRequiredElement("#traceOpacity");
const traceOpacityValue = getRequiredElement("#traceOpacityValue");
const makeTraceableButton = getRequiredElement("#makeTraceableButton");
const learnReferenceButton = getRequiredElement("#learnReferenceButton");
const referenceVisibleInput = getRequiredElement("#referenceVisibleInput");
const tracingGridInput = getRequiredElement("#tracingGridInput");
const tracingGridSizeInput = getRequiredElement("#tracingGridSize");
const tracingGridSizeValue = getRequiredElement("#tracingGridSizeValue");
const tracingGridOverlay = getRequiredElement("#tracingGridOverlay");
const eraserCursor = getRequiredElement("#eraserCursor");
const assetLibrary = getRequiredElement("#assetLibrary");
const assetLibraryMessage = getRequiredElement("#assetLibraryMessage");
const saveArtworkButton = getRequiredElement("#saveArtworkButton");
const learnToDrawButton = getRequiredElement("#learnToDrawButton");
const learnWorkspace = getRequiredElement("#learnWorkspace");
const learnWorkspaceDescription = getRequiredElement("#learnWorkspaceDescription");
const lessonCatalog = getRequiredElement("#lessonCatalog");
const activeLesson = getRequiredElement("#activeLesson");
const lessonProgressText = getRequiredElement("#lessonProgressText");
const lessonProgressBar = getRequiredElement("#lessonProgressBar");
const lessonStageHeading = getRequiredElement("#lessonStageHeading");
const lessonInstruction = getRequiredElement("#lessonInstruction");
const lessonHint = getRequiredElement("#lessonHint");
const showOriginalButton = getRequiredElement("#showOriginalButton");
const showConstructionGuidesButton = getRequiredElement("#showConstructionGuidesButton");
const showMainOutlineButton = getRequiredElement("#showMainOutlineButton");
const showDetailedOutlineButton = getRequiredElement("#showDetailedOutlineButton");
const hideLessonReferenceButton = getRequiredElement("#hideLessonReferenceButton");
const previousLessonStepButton = getRequiredElement("#previousLessonStepButton");
const nextLessonStepButton = getRequiredElement("#nextLessonStepButton");
const toggleLessonHintButton = getRequiredElement("#toggleLessonHintButton");
const saveLessonProgressButton = getRequiredElement("#saveLessonProgressButton");
const resetLessonButton = getRequiredElement("#resetLessonButton");
const exitLessonButton = getRequiredElement("#exitLessonButton");
const finishLessonButton = getRequiredElement("#finishLessonButton");
const lessonCompletionMessage = getRequiredElement("#lessonCompletionMessage");
const lessonGuideCanvas = getRequiredElement("#lessonGuideCanvas");
const lessonGuideContext = getCanvasContext(lessonGuideCanvas);
const exportWithReferenceButton = getRequiredElement("#exportWithReferenceButton");
const undoButton = getRequiredElement("#undoButton");
const redoButton = getRequiredElement("#redoButton");
const clearActiveLayerButton = getRequiredElement("#clearActiveLayerButton");
const clearAllArtworkButton = getRequiredElement("#clearAllArtworkButton");
const clearConfirmation = getRequiredElement("#clearConfirmation");
const confirmClearAllArtworkButton = getRequiredElement("#confirmClearAllArtworkButton");
const cancelClearAllArtworkButton = getRequiredElement("#cancelClearAllArtworkButton");
const clearMenu = getRequiredElement("#clearMenu");
const saveButton = getRequiredElement("#saveButton");
const zoomOutButton = getRequiredElement("#zoomOutButton");
const zoomInButton = getRequiredElement("#zoomInButton");
const zoomValue = getRequiredElement("#zoomValue");
const fitToScreenButton = getRequiredElement("#fitToScreenButton");
const centerCanvasButton = getRequiredElement("#centerCanvasButton");
const resetViewButton = getRequiredElement("#resetViewButton");
const navigatorCanvas = getRequiredElement("#navigatorCanvas");
const navigatorResetButton = getRequiredElement("#navigatorResetButton");
const navigatorContext = getCanvasContext(navigatorCanvas);
const addLayerButton = getRequiredElement("#addLayerButton");
const layerList = getRequiredElement("#layerList");
const layerOpacityInput = getRequiredElement("#layerOpacity");
const layerOpacityValue = getRequiredElement("#layerOpacityValue");
const duplicateLayerButton = getRequiredElement("#duplicateLayerButton");
const mergeLayerButton = getRequiredElement("#mergeLayerButton");
const flattenLayersButton = getRequiredElement("#flattenLayersButton");
const deleteLayerButton = getRequiredElement("#deleteLayerButton");
const tracingWorkbench = getRequiredElement("#tracingWorkbench");
const closeTracingDialogButton = getRequiredElement("#closeTracingDialogButton");
const tracingSourceName = getRequiredElement("#tracingSourceName");
const tracingOriginalPreview = getRequiredElement("#tracingOriginalPreview");
const tracingOutputPreview = getRequiredElement("#tracingOutputPreview");
const tracingDifficultyInput = getRequiredElement("#tracingDifficulty");
const tracingBrightnessInput = getRequiredElement("#tracingBrightness");
const tracingContrastInput = getRequiredElement("#tracingContrast");
const tracingEdgeSensitivityInput = getRequiredElement("#tracingEdgeSensitivity");
const tracingThresholdInput = getRequiredElement("#tracingThreshold");
const tracingNoiseReductionInput = getRequiredElement("#tracingNoiseReduction");
const tracingOutlineThicknessInput = getRequiredElement("#tracingOutlineThickness");
const tracingGrayscaleInput = getRequiredElement("#tracingGrayscale");
const tracingInvertInput = getRequiredElement("#tracingInvert");
const tracingStatus = getRequiredElement("#tracingStatus");
const resetTracingSettingsButton = getRequiredElement("#resetTracingSettingsButton");
const saveTracingGuideButton = getRequiredElement("#saveTracingGuideButton");
const startTracingButton = getRequiredElement("#startTracingButton");
const tracingProcessor = new OutlineProcessor();
const tracingPreviewContext = getCanvasContext(tracingOriginalPreview);
const tracingOutputContext = getCanvasContext(tracingOutputPreview);
const tracingControlMap = [
    { input: tracingBrightnessInput, output: getRequiredElement("#tracingBrightnessValue") },
    { input: tracingContrastInput, output: getRequiredElement("#tracingContrastValue") },
    { input: tracingEdgeSensitivityInput, output: getRequiredElement("#tracingEdgeSensitivityValue"), digits: 2 },
    { input: tracingThresholdInput, output: getRequiredElement("#tracingThresholdValue") },
    { input: tracingNoiseReductionInput, output: getRequiredElement("#tracingNoiseReductionValue") },
    { input: tracingOutlineThicknessInput, output: getRequiredElement("#tracingOutlineThicknessValue") },
];
const projectStorageKey = "create-draw-project-v1";
const legacyStorageKey = "create-draw-canvas-v1";
const historySnapshotTime = "2000-01-01T00:00:00.000Z";
let projectId = `project-${Date.now().toString(36)}`;
let projectName = "My drawing";
const maxHistoryEntries = 30;
const maxHistoryCharacters = 24 * 1024 * 1024;
const toolButtons = Array.from(document.querySelectorAll("[data-tool]"));
const colorSwatches = Array.from(document.querySelectorAll("[data-color]"));
const toolLabels = {
    brush: "Brush",
    eraser: "Eraser",
    eyedropper: "Eyedropper",
    bucket: "Paint Bucket",
    hand: "Hand",
    line: "Line",
    rectangle: "Rectangle",
    circle: "Circle",
    triangle: "Triangle",
    oval: "Oval",
    arrow: "Arrow",
    star: "Star",
    heart: "Heart",
    hexagon: "Hexagon",
};
let activeTool = "brush";
let lastDrawingTool = "brush";
let toolBeforeEraser = "brush";
let isSoftEraser = false;
let isDrawing = false;
let isPanning = false;
let isFilling = false;
let isHistoryRestoring = false;
let isProjectLoading = true;
let isAssetSaving = false;
let isSpaceHandActive = false;
let startPoint = { x: 0, y: 0 };
let previousBrushPoint = null;
let lastPanPoint = null;
let panPointerId = null;
let drawingPointerId = null;
let pinchMidpoint = null;
let pinchDistance = 0;
let isTouchNavigationActive = false;
let lastEraserCanvasPoint = null;
const touchPoints = new Map();
const viewport = new Viewport();
let drawingSnapshot = null;
let gestureSnapshot = null;
let traceObjectUrl = null;
let currentReferenceAssetId = null;
let currentOriginalReferenceAssetId = null;
let currentReferenceBlob = null;
let currentReferenceAssetPromise = null;
let currentReferenceVisible = true;
let tracingGridVisible = false;
let tracingGridSize = 50;
let traceSettings = null;
let lessonProgress = null;
let lessonCatalogOpen = false;
let lessonGuideGeneration = 0;
let isLessonStarting = false;
let saveTimer;
let history = [];
let historyIndex = -1;
let historyCharacters = 0;
let selectedTracingBlob = null;
let selectedTracingAssetId = null;
let selectedTracingSource = "upload";
let selectedTracingName = "";
let selectedTracingFromCurrentReference = false;
let selectedTracingPixels = null;
let tracingSourceGeneration = 0;
let tracingPreviewGeneration = 0;
let tracingDebounceTimer;
let savedTracingGuideId = null;
let latestProcessedTracingImage = null;
let latestTracingSettings = null;
let isTracingProcessing = false;
let isTracingSaving = false;
context.lineCap = "round";
context.lineJoin = "round";
function announce(message) {
    canvasMessage.textContent = message;
    window.setTimeout(() => {
        if (canvasMessage.textContent === message) {
            canvasMessage.textContent = "";
        }
    }, 3000);
}
function updateHistoryButtons() {
    const isBusy = isFilling || isHistoryRestoring || isProjectLoading;
    undoButton.disabled = isBusy || historyIndex <= 0;
    redoButton.disabled = isBusy || historyIndex >= history.length - 1;
    clearActiveLayerButton.disabled = isBusy;
    clearAllArtworkButton.disabled = isBusy;
    confirmClearAllArtworkButton.disabled = isBusy;
    cancelClearAllArtworkButton.disabled = isBusy;
    saveButton.disabled = isBusy;
    saveArtworkButton.disabled = isBusy || isAssetSaving;
    traceOpacityInput.disabled = isBusy || traceImage.hidden;
    traceInput.disabled = isBusy;
    makeTraceableButton.disabled = isBusy || !currentReferenceBlob;
    learnReferenceButton.disabled = isBusy || isLessonStarting || !currentReferenceBlob;
    saveTracingGuideButton.disabled =
        isBusy || isTracingProcessing || isTracingSaving || !latestProcessedTracingImage;
    startTracingButton.disabled =
        isBusy || isTracingProcessing || isTracingSaving || !latestProcessedTracingImage;
    tracingDifficultyInput.disabled = isBusy || isTracingSaving;
    tracingGrayscaleInput.disabled = isBusy || isTracingSaving;
    tracingInvertInput.disabled = isBusy || isTracingSaving;
    for (const { input } of tracingControlMap) {
        input.disabled = isBusy || isTracingSaving;
    }
    referenceVisibleInput.disabled = isBusy || traceImage.hidden;
    tracingGridInput.disabled = isBusy || traceImage.hidden;
    tracingGridSizeInput.disabled = isBusy || traceImage.hidden;
    learnToDrawButton.disabled = isBusy || isLessonStarting;
    for (const button of lessonCatalog.querySelectorAll("button")) {
        button.disabled = isBusy || isLessonStarting;
    }
    for (const button of activeLesson.querySelectorAll("button")) {
        button.disabled = isBusy || isLessonStarting;
    }
    removeTraceButton.disabled = isBusy;
    centerImageButton.disabled = isBusy;
    exportWithReferenceButton.disabled =
        isBusy || traceImage.hidden || !traceImage.complete || traceImage.naturalWidth === 0;
    backgroundInput.disabled = isBusy;
    updateLayerActionAvailability();
}
function createCurrentProject(updatedAt) {
    return createProjectDocument(projectId, projectName, canvas.width, canvas.height, backgroundInput.value, layerManager.serialize(), updatedAt, currentReferenceAssetId, Number(traceOpacityInput.value) / 100, currentReferenceVisible, currentOriginalReferenceAssetId, tracingGridVisible, tracingGridSize, traceSettings, lessonProgress);
}
function renderLayers() {
    layerManager.render(displayContext);
    updateNavigator();
}
function updateReferenceVisibility() {
    referenceVisibleInput.checked = currentReferenceVisible;
    traceImage.style.visibility = currentReferenceVisible ? "visible" : "hidden";
    tracingGridOverlay.hidden =
        traceImage.hidden || !tracingGridVisible || !currentReferenceVisible;
    tracingGridInput.checked = tracingGridVisible;
    tracingGridSizeInput.value = String(tracingGridSize);
    tracingGridSizeValue.value = `${tracingGridSize} px`;
    tracingGridOverlay.style.backgroundSize = `${tracingGridSize}px ${tracingGridSize}px`;
    tracingGridOverlay.style.backgroundImage =
        "linear-gradient(to right, rgba(89, 84, 76, 0.26) 1px, transparent 1px), " +
            "linear-gradient(to bottom, rgba(89, 84, 76, 0.26) 1px, transparent 1px)";
    updateNavigator();
    updateHistoryButtons();
}
function updateEraserCursor(point) {
    if (activeTool !== "eraser") {
        eraserCursor.hidden = true;
        return;
    }
    const diameter = Number(sizeInput.value);
    eraserCursor.hidden = false;
    eraserCursor.classList.toggle("is-soft", isSoftEraser);
    eraserCursor.style.width = `${diameter}px`;
    eraserCursor.style.height = `${diameter}px`;
    eraserCursor.style.left = `${point.x - diameter / 2}px`;
    eraserCursor.style.top = `${point.y - diameter / 2}px`;
}
function rememberCanvas() {
    const snapshot = JSON.stringify(createCurrentProject(historySnapshotTime));
    if (history[historyIndex] === snapshot)
        return;
    history = history.slice(0, historyIndex + 1);
    historyCharacters = history.reduce((total, entry) => total + entry.length, 0);
    history.push(snapshot);
    historyCharacters += snapshot.length;
    while (history.length > 1 &&
        (history.length > maxHistoryEntries || historyCharacters > maxHistoryCharacters)) {
        const removed = history.shift();
        if (removed)
            historyCharacters -= removed.length;
    }
    historyIndex = history.length - 1;
    updateHistoryButtons();
    scheduleSave();
}
function updateCurrentHistorySnapshot() {
    const previous = history[historyIndex];
    if (!previous) {
        rememberCanvas();
        return;
    }
    const snapshot = JSON.stringify(createCurrentProject(historySnapshotTime));
    if (previous === snapshot)
        return;
    history[historyIndex] = snapshot;
    historyCharacters = history.reduce((total, entry) => total + entry.length, 0);
    while (history.length > 1 &&
        (history.length > maxHistoryEntries || historyCharacters > maxHistoryCharacters)) {
        const removed = history.shift();
        if (removed)
            historyCharacters -= removed.length;
        historyIndex = Math.max(0, historyIndex - 1);
    }
    updateHistoryButtons();
    scheduleSave();
}
async function restoreCanvas(index) {
    if (isFilling ||
        isHistoryRestoring ||
        isProjectLoading ||
        index < 0 ||
        index >= history.length)
        return;
    const snapshot = history[index];
    if (!snapshot)
        return;
    isHistoryRestoring = true;
    updateHistoryButtons();
    refreshLayerPanel();
    try {
        const project = JSON.parse(snapshot);
        if (!isProjectDocument(project)) {
            throw new Error("The history entry has an unexpected format.");
        }
        await layerManager.restore(project);
        context = layerManager.activeLayer.context;
        backgroundInput.value = project.background;
        canvasPaper.style.backgroundColor = project.background;
        tracingGridVisible = project.tracingGridVisible ?? false;
        tracingGridSize = project.tracingGridSize ?? 50;
        traceSettings = project.traceSettings ?? null;
        lessonProgress = project.lessonProgress ?? null;
        await restoreProjectReference(project.referenceAssetId ?? null, project.referenceOpacity ?? 0.28, project.referenceVisible ?? true, project.originalReferenceAssetId ?? null, project.traceSettings ?? null);
        refreshLayerPanel();
        renderLayers();
        renderLessonWorkspace();
        historyIndex = index;
        scheduleSave();
    }
    catch (error) {
        announce("Couldn't restore that history step.");
        console.error("Could not restore canvas history.", error);
    }
    finally {
        isHistoryRestoring = false;
        refreshLayerPanel();
        updateHistoryButtons();
    }
}
function getCanvasPoint(event) {
    return viewport.viewportToArtwork(getViewportPoint(event), getViewportSize(), getArtworkSize());
}
function getViewportPoint(event) {
    const bounds = canvasViewport.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
}
function getViewportSize() {
    return { width: canvasViewport.clientWidth, height: canvasViewport.clientHeight };
}
function getArtworkSize() {
    return { width: canvas.width, height: canvas.height };
}
function getSelectedBrushPreset() {
    const selectedPreset = brushPresetInput.value;
    for (const preset of BRUSH_PRESETS) {
        if (preset === selectedPreset)
            return preset;
    }
    throw new Error(`Unknown brush style: ${selectedPreset}`);
}
function drawActiveStrokeSegment(start, end) {
    if (activeTool === "brush") {
        drawBrushSegment(context, start, end, {
            preset: getSelectedBrushPreset(),
            width: Number(sizeInput.value),
            color: colorInput.value,
            opacity: Number(brushOpacityInput.value) / 100,
        });
        renderLayers();
        return;
    }
    if (activeTool === "eraser") {
        eraseSegment(context, start, end, Number(sizeInput.value), isSoftEraser);
        renderLayers();
        return;
    }
    applyBrushStyle();
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(Math.abs(end.x - start.x) + Math.abs(end.y - start.y) < 0.01
        ? start.x + 0.01
        : end.x, Math.abs(end.x - start.x) + Math.abs(end.y - start.y) < 0.01
        ? start.y + 0.01
        : end.y);
    context.stroke();
    renderLayers();
}
function applyViewport() {
    canvasPaper.style.transform =
        `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`;
    zoomValue.value = `${Math.round(viewport.zoom * 100)}%`;
    zoomOutButton.disabled = viewport.zoom <= MIN_ZOOM;
    zoomInButton.disabled = viewport.zoom >= MAX_ZOOM;
    updateNavigator();
}
function layoutCanvasPaper() {
    const size = getViewportSize();
    if (size.width <= 0 || size.height <= 0)
        return;
    canvasPaper.style.width = `${canvas.width}px`;
    canvasPaper.style.height = `${canvas.height}px`;
    canvasPaper.style.left = `${(size.width - canvas.width) / 2}px`;
    canvasPaper.style.top = `${(size.height - canvas.height) / 2}px`;
    applyViewport();
}
function updateNavigator() {
    const viewportSize = getViewportSize();
    if (viewportSize.width <= 0 || viewportSize.height <= 0)
        return;
    const mapWidth = navigatorCanvas.width;
    const mapHeight = navigatorCanvas.height;
    navigatorContext.clearRect(0, 0, mapWidth, mapHeight);
    navigatorContext.fillStyle = backgroundInput.value;
    navigatorContext.fillRect(0, 0, mapWidth, mapHeight);
    if (!traceImage.hidden &&
        currentReferenceVisible &&
        traceImage.complete &&
        traceImage.naturalWidth > 0) {
        navigatorContext.globalAlpha = Number(traceOpacityInput.value) / 100;
        drawImageContained(navigatorContext, traceImage, mapWidth, mapHeight);
        navigatorContext.globalAlpha = 1;
    }
    navigatorContext.drawImage(canvas, 0, 0, mapWidth, mapHeight);
    const visible = viewport.getVisibleArtworkRect(viewportSize, getArtworkSize());
    const left = Math.max(0, visible.x / canvas.width * mapWidth);
    const top = Math.max(0, visible.y / canvas.height * mapHeight);
    const right = Math.min(mapWidth, (visible.x + visible.width) / canvas.width * mapWidth);
    const bottom = Math.min(mapHeight, (visible.y + visible.height) / canvas.height * mapHeight);
    if (right <= left || bottom <= top)
        return;
    navigatorContext.save();
    navigatorContext.strokeStyle = "#e27763";
    navigatorContext.lineWidth = 2;
    navigatorContext.fillStyle = "rgba(226, 119, 99, 0.12)";
    navigatorContext.fillRect(left, top, right - left, bottom - top);
    navigatorContext.strokeRect(left, top, right - left, bottom - top);
    navigatorContext.restore();
}
function applyBrushStyle() {
    let widthMultiplier = 1;
    let opacityMultiplier = 1;
    if (activeTool === "brush") {
        if (brushPresetInput.value === "pencil") {
            widthMultiplier = 0.75;
            opacityMultiplier = 0.58;
        }
        else if (brushPresetInput.value === "highlighter") {
            widthMultiplier = 1.8;
            opacityMultiplier = 0.25;
        }
    }
    context.lineWidth = Number(sizeInput.value) * widthMultiplier;
    context.strokeStyle = colorInput.value;
    context.fillStyle = colorInput.value;
    context.globalAlpha =
        activeTool === "eraser"
            ? 1
            : (Number(brushOpacityInput.value) / 100) * opacityMultiplier;
}
function drawShape(point) {
    if (!drawingSnapshot)
        return;
    context.putImageData(drawingSnapshot, 0, 0);
    applyBrushStyle();
    context.globalCompositeOperation = "source-over";
    context.beginPath();
    const width = point.x - startPoint.x;
    const height = point.y - startPoint.y;
    switch (activeTool) {
        case "line":
            context.moveTo(startPoint.x, startPoint.y);
            context.lineTo(point.x, point.y);
            break;
        case "rectangle":
            context.rect(startPoint.x, startPoint.y, width, height);
            break;
        case "circle":
            context.arc(startPoint.x, startPoint.y, Math.hypot(width, height), 0, Math.PI * 2);
            break;
        case "triangle":
            context.moveTo(startPoint.x + width / 2, startPoint.y);
            context.lineTo(startPoint.x, point.y);
            context.lineTo(point.x, point.y);
            context.closePath();
            break;
        case "oval":
            context.ellipse(startPoint.x + width / 2, startPoint.y + height / 2, Math.abs(width / 2), Math.abs(height / 2), 0, 0, Math.PI * 2);
            break;
        case "arrow": {
            const angle = Math.atan2(height, width);
            const headLength = 18;
            context.moveTo(startPoint.x, startPoint.y);
            context.lineTo(point.x, point.y);
            context.moveTo(point.x, point.y);
            context.lineTo(point.x - headLength * Math.cos(angle - Math.PI / 6), point.y - headLength * Math.sin(angle - Math.PI / 6));
            context.moveTo(point.x, point.y);
            context.lineTo(point.x - headLength * Math.cos(angle + Math.PI / 6), point.y - headLength * Math.sin(angle + Math.PI / 6));
            break;
        }
        case "star": {
            const centerX = startPoint.x + width / 2;
            const centerY = startPoint.y + height / 2;
            const outerRadius = Math.min(Math.abs(width), Math.abs(height)) / 2;
            const innerRadius = outerRadius / 2.2;
            for (let index = 0; index < 10; index += 1) {
                const radius = index % 2 === 0 ? outerRadius : innerRadius;
                const angle = (Math.PI / 5) * index - Math.PI / 2;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                if (index === 0)
                    context.moveTo(x, y);
                else
                    context.lineTo(x, y);
            }
            context.closePath();
            break;
        }
        case "heart": {
            const left = Math.min(startPoint.x, point.x);
            const top = Math.min(startPoint.y, point.y);
            const heartWidth = Math.abs(width);
            const heartHeight = Math.abs(height);
            context.moveTo(left + heartWidth / 2, top + heartHeight);
            context.bezierCurveTo(left + heartWidth, top + heartHeight * 0.75, left + heartWidth, top + heartHeight * 0.25, left + heartWidth / 2, top + heartHeight * 0.35);
            context.bezierCurveTo(left, top + heartHeight * 0.25, left, top + heartHeight * 0.75, left + heartWidth / 2, top + heartHeight);
            context.closePath();
            break;
        }
        case "hexagon": {
            const centerX = startPoint.x + width / 2;
            const centerY = startPoint.y + height / 2;
            const radius = Math.min(Math.abs(width), Math.abs(height)) / 2;
            for (let index = 0; index < 6; index += 1) {
                const angle = (Math.PI / 3) * index - Math.PI / 6;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                if (index === 0)
                    context.moveTo(x, y);
                else
                    context.lineTo(x, y);
            }
            context.closePath();
            break;
        }
        case "brush":
        case "eraser":
        case "eyedropper":
        case "bucket":
            return;
    }
    if (fillInput.checked && activeTool !== "line" && activeTool !== "arrow") {
        context.fill();
    }
    else {
        context.stroke();
    }
    renderLayers();
}
function drawImageContained(targetContext, image, width, height) {
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    targetContext.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}
function setReferenceImage(blob, assetId, originalAssetId = assetId, settings = null) {
    const nextObjectUrl = URL.createObjectURL(blob);
    if (traceObjectUrl)
        URL.revokeObjectURL(traceObjectUrl);
    traceObjectUrl = nextObjectUrl;
    currentReferenceAssetId = assetId;
    currentOriginalReferenceAssetId = originalAssetId;
    currentReferenceBlob = blob;
    currentReferenceAssetPromise = null;
    traceSettings = settings;
    currentReferenceVisible = true;
    traceImage.src = nextObjectUrl;
    traceImage.style.objectPosition = "center center";
    traceImage.style.transform = "none";
    traceImage.style.opacity = String(Number(traceOpacityInput.value) / 100);
    traceImage.hidden = false;
    removeTraceButton.hidden = false;
    centerImageButton.hidden = false;
    makeTraceableButton.hidden = false;
    learnReferenceButton.hidden = false;
    traceOpacityControl.hidden = false;
    updateReferenceVisibility();
    return nextObjectUrl;
}
function clearReferenceImage(preserveAssetId = false) {
    traceImage.hidden = true;
    traceImage.removeAttribute("src");
    removeTraceButton.hidden = true;
    centerImageButton.hidden = true;
    makeTraceableButton.hidden = true;
    learnReferenceButton.hidden = true;
    traceOpacityControl.hidden = true;
    if (traceObjectUrl) {
        URL.revokeObjectURL(traceObjectUrl);
        traceObjectUrl = null;
    }
    if (!preserveAssetId) {
        currentReferenceAssetId = null;
        currentOriginalReferenceAssetId = null;
    }
    currentReferenceBlob = null;
    currentReferenceAssetPromise = null;
    currentReferenceVisible = true;
    tracingGridVisible = false;
    tracingGridOverlay.hidden = true;
    traceSettings = null;
    updateNavigator();
    updateHistoryButtons();
}
async function restoreProjectReference(assetId, opacity, visible = true, originalAssetId = null, settings = null) {
    const opacityPercent = Math.round(Math.max(0, Math.min(1, opacity)) * 100);
    traceOpacityInput.value = String(opacityPercent);
    traceOpacityValue.value = `${opacityPercent}%`;
    traceImage.style.opacity = String(opacityPercent / 100);
    if (!assetId) {
        clearReferenceImage();
        currentReferenceVisible = visible;
        currentOriginalReferenceAssetId = originalAssetId;
        traceSettings = settings;
        updateReferenceVisibility();
        return;
    }
    currentReferenceAssetId = assetId;
    try {
        const asset = await assetManager.getImage(assetId);
        if (!asset)
            throw new Error(`The reference asset ${assetId} is missing.`);
        setReferenceImage(asset.blob, asset.id, originalAssetId ?? asset.id, settings);
        currentReferenceVisible = visible;
        updateReferenceVisibility();
    }
    catch (error) {
        clearReferenceImage(true);
        currentOriginalReferenceAssetId = originalAssetId;
        announce("The drawing loaded, but its saved reference image is unavailable.");
        console.error("Could not restore the tracing reference.", error);
    }
}
function prepareTraceWorkspace() {
    const traceLayer = layerManager.addLayer("Tracing");
    context = traceLayer.context;
    refreshLayerPanel();
    renderLayers();
    setActiveTool("brush");
    viewport.fitToScreen(getViewportSize(), getArtworkSize());
    applyViewport();
    rememberCanvas();
}
function colorToRgba(color) {
    return [
        Number.parseInt(color.slice(1, 3), 16),
        Number.parseInt(color.slice(3, 5), 16),
        Number.parseInt(color.slice(5, 7), 16),
        255,
    ];
}
function updateSelectedColor(color) {
    colorInput.value = color;
    colorValue.textContent = color.toUpperCase();
    colorPreview.style.backgroundColor = color;
}
function sampleVisibleColor(point) {
    const x = Math.max(0, Math.min(canvas.width - 1, Math.floor(point.x)));
    const y = Math.max(0, Math.min(canvas.height - 1, Math.floor(point.y)));
    colorSampleContext.clearRect(0, 0, canvas.width, canvas.height);
    colorSampleContext.fillStyle = backgroundInput.value;
    colorSampleContext.fillRect(0, 0, canvas.width, canvas.height);
    if (!traceImage.hidden &&
        currentReferenceVisible &&
        traceImage.complete &&
        traceImage.naturalWidth > 0) {
        colorSampleContext.globalAlpha = Number(traceOpacityInput.value) / 100;
        drawImageContained(colorSampleContext, traceImage, canvas.width, canvas.height);
        colorSampleContext.globalAlpha = 1;
    }
    colorSampleContext.drawImage(canvas, 0, 0);
    const pixel = colorSampleContext.getImageData(x, y, 1, 1).data;
    return `#${[pixel[0], pixel[1], pixel[2]]
        .map((channel) => channel.toString(16).padStart(2, "0"))
        .join("")}`;
}
async function fillCanvasRegion(point) {
    if (isFilling || isHistoryRestoring || isProjectLoading)
        return;
    isFilling = true;
    canvas.setAttribute("aria-busy", "true");
    updateHistoryButtons();
    refreshLayerPanel();
    try {
        const x = Math.max(0, Math.min(canvas.width - 1, Math.floor(point.x)));
        const y = Math.max(0, Math.min(canvas.height - 1, Math.floor(point.y)));
        if (!layerManager.canEditActiveLayer) {
            announce("Unlock and show the selected layer before editing it.");
            return;
        }
        const targetContext = context;
        const boundaryContext = colorSampleContext;
        boundaryContext.clearRect(0, 0, canvas.width, canvas.height);
        if (bucketBoundary.value === "visible") {
            layerManager.render(boundaryContext);
        }
        else {
            boundaryContext.drawImage(layerManager.activeLayer.canvas, 0, 0);
        }
        if (!traceImage.hidden && currentReferenceVisible && bucketReferenceBoundary.checked && traceImage.complete && traceImage.naturalWidth > 0) {
            boundaryContext.globalAlpha = Number(traceOpacityInput.value) / 100;
            drawImageContained(boundaryContext, traceImage, canvas.width, canvas.height);
            boundaryContext.globalAlpha = 1;
        }
        const boundaryData = boundaryContext.getImageData(0, 0, canvas.width, canvas.height);
        const imageData = targetContext.getImageData(0, 0, canvas.width, canvas.height);
        const tolerance = Number(fillToleranceInput.value);
        const mask = await createFloodFillMask(boundaryData.data, imageData.width, imageData.height, x, y, tolerance, bucketGapClosing.value);
        const first = colorToRgba(colorInput.value);
        const second = colorToRgba(bucketSecondaryColor.value);
        const opacity = Number(bucketOpacity.value) / 100;
        let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
        for (let index = 0; index < mask.length; index += 1)
            if (mask[index]) {
                const px = index % canvas.width;
                const py = Math.floor(index / canvas.width);
                minX = Math.min(minX, px);
                minY = Math.min(minY, py);
                maxX = Math.max(maxX, px);
                maxY = Math.max(maxY, py);
            }
        const colorAt = (px, py) => {
            if (bucketFillStyle.value === "gradient") {
                const dx = Math.max(1, maxX - minX);
                const t = bucketGradientMode.value === "radial"
                    ? Math.min(1, Math.hypot(px - (minX + dx / 2), py - (minY + Math.max(1, maxY - minY) / 2)) / Math.max(1, Math.hypot(dx, Math.max(1, maxY - minY)) / 2))
                    : Math.max(0, Math.min(1, ((px - minX) * Math.cos(Number(bucketGradientAngle.value) * Math.PI / 180) + (py - minY) * Math.sin(Number(bucketGradientAngle.value) * Math.PI / 180)) / Math.max(1, Math.hypot(dx, maxY - minY))));
                return [Math.round(first[0] + (second[0] - first[0]) * t), Math.round(first[1] + (second[1] - first[1]) * t), Math.round(first[2] + (second[2] - first[2]) * t), 255];
            }
            if (bucketFillStyle.value === "texture") {
                const stripe = bucketTexture.value === "stripes" && Math.floor((px + py) / 8) % 2 === 0;
                const dot = bucketTexture.value === "dots" && (px % 12 < 3 && py % 12 < 3);
                const cross = bucketTexture.value === "crosshatch" && (px + py) % 10 < 2;
                const noise = bucketTexture.value === "crayon" && ((px * 17 + py * 31) % 23 < 8);
                return (stripe || dot || cross || noise) ? second : first;
            }
            return first;
        };
        const changed = paintMask(imageData.data, mask, imageData.width, colorAt, opacity);
        if (!changed) {
            announce("That area already matches the selected color.");
            return;
        }
        targetContext.putImageData(imageData, 0, 0);
        renderLayers();
        rememberCanvas();
        announce("Area filled.");
    }
    catch (error) {
        announce("Couldn't fill that area.");
        console.error("Paint bucket fill failed.", error);
    }
    finally {
        isFilling = false;
        canvas.removeAttribute("aria-busy");
        updateHistoryButtons();
        refreshLayerPanel();
    }
}
function setActiveTool(tool) {
    if (tool === "eraser" && activeTool !== "eraser") {
        toolBeforeEraser = activeTool;
    }
    activeTool = tool;
    if (tool !== "eyedropper" && tool !== "bucket" && tool !== "hand" && tool !== "eraser") {
        lastDrawingTool = tool;
    }
    selectedToolName.textContent = toolLabels[tool];
    bucketSettings.hidden = tool !== "bucket";
    paintBucketQuickButton.classList.toggle("is-selected", tool === "bucket");
    bucketSecondaryColorControl.hidden = bucketFillStyle.value !== "gradient";
    eraserSettings.hidden = tool !== "eraser";
    eraserQuickButton.classList.toggle("is-selected", tool === "eraser");
    sizeControlLabel.textContent = tool === "eraser" ? "Eraser size" : "Brush size";
    sizeInput.max = tool === "eraser" ? "100" : "48";
    if (Number(sizeInput.value) > Number(sizeInput.max)) {
        sizeInput.value = sizeInput.max;
        sizeValue.value = `${sizeInput.value} px`;
    }
    eraserCursor.hidden = true;
    closeToolPicker();
    for (const button of toolButtons) {
        const selected = button.dataset.tool === tool;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
    }
    updateCanvasCursor();
}
paintBucketQuickButton.addEventListener("click", () => setActiveTool("bucket"));
bucketFillStyle.addEventListener("change", () => {
    bucketSecondaryColorControl.hidden = bucketFillStyle.value !== "gradient";
});
bucketOpacity.addEventListener("input", () => { bucketOpacityValue.value = `${bucketOpacity.value}%`; });
bucketGradientAngle.addEventListener("input", () => { bucketGradientAngleValue.value = `${bucketGradientAngle.value}°`; });
function updateCanvasCursor() {
    const handActive = activeTool === "hand" || isSpaceHandActive;
    canvas.classList.toggle("hand-cursor", handActive);
    canvas.classList.toggle("eraser-cursor", !handActive && activeTool === "eraser");
    canvas.classList.toggle("eyedropper-cursor", !handActive && activeTool === "eyedropper");
    canvas.classList.toggle("bucket-cursor", !handActive && activeTool === "bucket");
    canvas.classList.toggle("shape-cursor", !handActive &&
        activeTool !== "brush" &&
        activeTool !== "eraser" &&
        activeTool !== "eyedropper" &&
        activeTool !== "bucket");
}
function closeToolPicker() {
    toolPickerPanel.hidden = true;
    toolPickerButton.setAttribute("aria-expanded", "false");
}
toolPickerButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toolPickerPanel.hidden = !toolPickerPanel.hidden;
    toolPickerButton.setAttribute("aria-expanded", String(!toolPickerPanel.hidden));
});
toolPickerPanel.addEventListener("click", (event) => {
    event.stopPropagation();
});
document.addEventListener("click", (event) => {
    if (!(event.target instanceof Node) || !toolPicker.contains(event.target)) {
        closeToolPicker();
    }
});
function isTool(value) {
    return value !== undefined && Object.hasOwn(toolLabels, value);
}
function updateSaveStatus(message) {
    saveStatus.textContent = message;
}
const assetSourceLabels = {
    upload: "Uploaded",
    artwork: "Artwork",
    generated: "Generated",
    "coloring-page": "Coloring page",
    sticker: "Sticker",
    processed: "Tracing guide",
    lesson: "Lesson",
};
let assetLibraryRefreshId = 0;
const assetPreviewObjectUrls = [];
async function refreshAssetLibrary() {
    const refreshId = ++assetLibraryRefreshId;
    for (const objectUrl of assetPreviewObjectUrls)
        URL.revokeObjectURL(objectUrl);
    assetPreviewObjectUrls.length = 0;
    assetLibrary.replaceChildren();
    assetLibraryMessage.textContent = "Loading saved images…";
    try {
        const storedAssets = await assetManager.listImages();
        if (refreshId !== assetLibraryRefreshId)
            return;
        const assets = storedAssets.filter((asset) => asset.source !== "lesson");
        assetLibraryMessage.textContent = assets.length
            ? ""
            : "Images you upload or save from your artwork will appear here.";
        const imageAssets = await Promise.all(assets.map(async (asset) => {
            const storedAsset = await assetManager.getImage(asset.id);
            if (!storedAsset)
                throw new Error(`Saved image ${asset.id} is missing.`);
            return storedAsset;
        }));
        if (refreshId !== assetLibraryRefreshId)
            return;
        for (const asset of assets) {
            const storedAsset = imageAssets.find((image) => image.id === asset.id);
            if (!storedAsset)
                throw new Error(`Saved image ${asset.id} is missing.`);
            const row = document.createElement("li");
            row.className = "asset-row";
            const preview = document.createElement("img");
            const objectUrl = URL.createObjectURL(storedAsset.blob);
            assetPreviewObjectUrls.push(objectUrl);
            preview.className = "asset-thumbnail";
            preview.src = objectUrl;
            preview.alt = `${asset.name} preview`;
            const details = document.createElement("span");
            details.className = "asset-details";
            details.textContent = `${asset.name} · ${assetSourceLabels[asset.source]}`;
            const traceButton = document.createElement("button");
            traceButton.className = "layer-action-button asset-trace-button";
            traceButton.type = "button";
            traceButton.textContent = "Trace This Image";
            traceButton.setAttribute("aria-label", `Trace ${asset.name}`);
            traceButton.disabled = isProjectLoading || isHistoryRestoring;
            traceButton.addEventListener("click", () => {
                void traceSavedImage(asset.id);
            });
            const makeTraceable = document.createElement("button");
            makeTraceable.className = "layer-action-button asset-trace-button";
            makeTraceable.type = "button";
            makeTraceable.textContent = "Make It Traceable";
            makeTraceable.setAttribute("aria-label", `Make ${asset.name} traceable`);
            makeTraceable.disabled = isProjectLoading || isHistoryRestoring;
            makeTraceable.addEventListener("click", () => {
                void assetManager.getImage(asset.id).then((storedAsset) => {
                    if (!storedAsset)
                        throw new Error("The selected saved image no longer exists.");
                    return openTracingGenerator(storedAsset.blob, asset.id, asset.source, asset.name);
                }).catch((error) => {
                    announce("Couldn't open that image in the tracing generator.");
                    console.error("Could not load a saved image for tracing.", error);
                });
            });
            const useAsReferenceButton = document.createElement("button");
            useAsReferenceButton.className = "layer-action-button asset-trace-button";
            useAsReferenceButton.type = "button";
            useAsReferenceButton.textContent = "Use as Reference";
            useAsReferenceButton.setAttribute("aria-label", `Use ${asset.name} as reference`);
            useAsReferenceButton.disabled = isProjectLoading || isHistoryRestoring;
            useAsReferenceButton.addEventListener("click", () => {
                void useSavedImageAsReference(asset.id);
            });
            const learnButton = document.createElement("button");
            learnButton.className = "layer-action-button asset-trace-button";
            learnButton.type = "button";
            learnButton.textContent = "Learn to Draw This";
            learnButton.setAttribute("aria-label", `Learn to draw ${asset.name}`);
            learnButton.disabled = isProjectLoading || isHistoryRestoring || isLessonStarting;
            learnButton.addEventListener("click", () => {
                void startImageLesson(asset.id);
            });
            const actions = document.createElement("div");
            actions.className = "asset-actions";
            actions.append(traceButton, makeTraceable, useAsReferenceButton, learnButton);
            row.append(preview, details, actions);
            assetLibrary.append(row);
        }
    }
    catch (error) {
        if (refreshId !== assetLibraryRefreshId)
            return;
        assetLibraryMessage.textContent =
            "The saved image library is unavailable. You can still draw and use an uploaded image until you close this page.";
        console.error("Could not load the saved image library.", error);
    }
}
async function useSavedImageAsReference(assetId) {
    if (isProjectLoading || isHistoryRestoring || isFilling)
        return;
    try {
        const asset = await assetManager.getImage(assetId);
        if (!asset)
            throw new Error("The selected saved image no longer exists.");
        setReferenceImage(asset.blob, asset.id, asset.id, null);
        rememberCanvas();
        announce(`${asset.name} is ready as a reference.`);
    }
    catch (error) {
        announce("Couldn't use that saved image as a reference.");
        console.error("Could not use a saved image as a reference.", error);
    }
}
async function traceSavedImage(assetId) {
    if (isProjectLoading || isHistoryRestoring || isFilling)
        return;
    try {
        const asset = await assetManager.getImage(assetId);
        if (!asset)
            throw new Error("The selected saved image no longer exists.");
        setReferenceImage(asset.blob, asset.id, asset.id, null);
        prepareTraceWorkspace();
        announce(`${asset.name} is ready to trace.`);
    }
    catch (error) {
        announce("Couldn't open that saved image.");
        console.error("Could not use a saved image as a tracing reference.", error);
    }
}
function canvasToBlob(source) {
    return new Promise((resolve, reject) => {
        source.toBlob((blob) => {
            if (!blob) {
                reject(new Error("The browser could not encode the canvas image."));
                return;
            }
            resolve(blob);
        }, "image/png");
    });
}
const lessonStageTitles = [
    "Observe",
    "Basic Shapes",
    "Main Outlines",
    "Fine Details",
    "Draw Independently",
    "Color and Finish",
];
const lessonStageInstructions = [
    "Look at the whole picture first. Notice its broad silhouette, proportions, and where the largest parts sit.",
    "Use the construction guides to plan simple shapes and proportions. These guides are suggestions, not automatic object recognition.",
    "Use the simplified outline as a separate reference. Draw the main contours on the transparent artwork layer.",
    "Compare the original and detailed outline, then add smaller features with a thinner brush if you like.",
    "Hide the reference and try drawing from memory. You can reveal it again whenever you need a hint.",
    "Choose brushes and colors, fill larger areas, erase mistakes, and add your finishing details.",
];
const lessonStageHints = [
    "Look for the largest shapes first.",
    "Try drawing the main forms with simple circles, ovals, or boxes.",
    "Follow the major outside edges before drawing interior lines.",
    "Zoom in and use a smaller brush for tiny features.",
    "Try hiding the reference and drawing from memory.",
    "Start with large color areas before adding shadows.",
];
function renderLessonGuide() {
    lessonGuideGeneration += 1;
    const generation = lessonGuideGeneration;
    lessonGuideContext.clearRect(0, 0, lessonGuideCanvas.width, lessonGuideCanvas.height);
    const progress = lessonProgress;
    if (!progress ||
        !progress.workspaceVisible ||
        progress.currentStage !== 2 ||
        !progress.constructionGuidesVisible)
        return;
    const svg = getStarterLesson(progress.lessonId)?.constructionSvg ??
        genericConstructionGuide();
    const objectUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const image = new Image();
    image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (generation !== lessonGuideGeneration)
            return;
        lessonGuideContext.drawImage(image, 0, 0, lessonGuideCanvas.width, lessonGuideCanvas.height);
    };
    image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        console.error("Could not display the construction guide.");
    };
    image.src = objectUrl;
}
function renderLessonWorkspace() {
    const progress = lessonProgress;
    const workspaceVisible = progress ? progress.workspaceVisible : lessonCatalogOpen;
    learnWorkspace.hidden = !workspaceVisible;
    activeLesson.hidden = !progress || !progress.workspaceVisible;
    learnToDrawButton.textContent =
        progress && !progress.workspaceVisible && !progress.completed
            ? "Resume Lesson"
            : "Learn to Draw";
    if (!progress) {
        learnWorkspaceDescription.textContent =
            "Choose an original starter lesson or learn from an image in My Images.";
        renderLessonGuide();
        return;
    }
    const stageIndex = progress.currentStage - 1;
    lessonProgressText.textContent = `Step ${progress.currentStage} of 6`;
    lessonProgressBar.value = progress.currentStage;
    lessonStageHeading.textContent = lessonStageTitles[stageIndex];
    lessonInstruction.textContent = lessonStageInstructions[stageIndex];
    const starter = getStarterLesson(progress.lessonId);
    lessonHint.textContent = progress.currentStage === 2 && starter
        ? `${lessonStageHints[stageIndex]} ${starter.constructionHint}`
        : lessonStageHints[stageIndex];
    lessonHint.hidden = !progress.hintVisible;
    toggleLessonHintButton.textContent = progress.hintVisible ? "Hide Hint" : "Show Hint";
    showConstructionGuidesButton.hidden = progress.currentStage !== 2;
    showConstructionGuidesButton.textContent =
        progress.constructionGuidesVisible ? "Hide Guides" : "Show Construction Guides";
    showMainOutlineButton.hidden = progress.currentStage !== 3;
    showDetailedOutlineButton.hidden = progress.currentStage !== 4;
    hideLessonReferenceButton.hidden = !progress.referenceVisible;
    previousLessonStepButton.disabled = progress.currentStage === 1;
    nextLessonStepButton.hidden = progress.currentStage === 6;
    finishLessonButton.hidden = progress.currentStage !== 6;
    finishLessonButton.disabled = progress.completed;
    finishLessonButton.textContent = progress.completed ? "Lesson Finished" : "Finish Lesson";
    lessonCompletionMessage.hidden = !progress.completed;
    lessonCompletionMessage.textContent = progress.completed
        ? "Nice work! Your drawing is still editable on the canvas."
        : "";
    learnWorkspaceDescription.textContent =
        `${progress.title} · Your artwork is separate from the reference and guides.`;
    renderLessonGuide();
}
function initializeLessonCatalog() {
    lessonCatalog.replaceChildren();
    for (const lesson of STARTER_LESSONS) {
        const button = document.createElement("button");
        button.className = "lesson-catalog-button";
        button.type = "button";
        button.textContent = lesson.title;
        button.setAttribute("aria-label", `Start ${lesson.title} lesson`);
        button.addEventListener("click", () => {
            void startStarterLesson(lesson.id);
        });
        lessonCatalog.append(button);
    }
}
async function readImagePixels(blob) {
    const objectUrl = URL.createObjectURL(blob);
    try {
        const image = new Image();
        image.src = objectUrl;
        await image.decode();
        const scale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const sourceCanvas = document.createElement("canvas");
        sourceCanvas.width = width;
        sourceCanvas.height = height;
        const sourceContext = getCanvasContext(sourceCanvas);
        sourceContext.drawImage(image, 0, 0, width, height);
        const imageData = sourceContext.getImageData(0, 0, width, height);
        return { data: imageData.data, width, height };
    }
    finally {
        URL.revokeObjectURL(objectUrl);
    }
}
async function createLessonOutlineAsset(image, name, settings) {
    const result = await tracingProcessor.process(image, settings);
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = result.width;
    outputCanvas.height = result.height;
    const outputContext = getCanvasContext(outputCanvas);
    const output = outputContext.createImageData(result.width, result.height);
    output.data.set(result.data);
    outputContext.putImageData(output, 0, 0);
    const blob = await canvasToBlob(outputCanvas);
    return assetManager.saveImage(blob, name, "lesson");
}
function createLessonProgress(lessonId, title, sourceImageId, originalReferenceId, processedReferenceId, detailedReferenceId) {
    return {
        lessonId,
        title,
        sourceImageId,
        originalReferenceId,
        processedReferenceId,
        detailedReferenceId,
        currentStage: 1,
        drawingProjectId: projectId,
        constructionGuidesVisible: false,
        referenceVisible: true,
        referenceOpacity: Number(traceOpacityInput.value) / 100,
        selectedReference: "original",
        hintVisible: false,
        workspaceVisible: true,
        completed: false,
        mainOutlineSettings: { ...TRACING_PRESETS.beginner },
        detailedOutlineSettings: { ...TRACING_PRESETS.advanced },
    };
}
async function showLessonReference(reference, visible = true) {
    if (!lessonProgress)
        return;
    const progress = lessonProgress;
    const assetId = reference === "original"
        ? progress.originalReferenceId
        : reference === "main-outline"
            ? progress.processedReferenceId
            : progress.detailedReferenceId;
    const asset = await assetManager.getImage(assetId);
    if (!asset)
        throw new Error(`The lesson reference ${assetId} is unavailable.`);
    const settings = reference === "main-outline"
        ? progress.mainOutlineSettings
        : reference === "detailed-outline"
            ? progress.detailedOutlineSettings
            : null;
    setReferenceImage(asset.blob, asset.id, progress.originalReferenceId, settings);
    const opacity = Math.round(progress.referenceOpacity * 100);
    traceOpacityInput.value = String(opacity);
    traceOpacityValue.value = `${opacity}%`;
    traceImage.style.opacity = String(opacity / 100);
    currentReferenceVisible = visible;
    lessonProgress = {
        ...progress,
        selectedReference: reference,
        referenceVisible: visible,
    };
    updateReferenceVisibility();
}
async function resumeLesson() {
    if (!lessonProgress || isLessonStarting)
        return;
    isLessonStarting = true;
    updateHistoryButtons();
    try {
        lessonProgress = { ...lessonProgress, workspaceVisible: true };
        const reference = lessonProgress.selectedReference ?? "original";
        await showLessonReference(reference, lessonProgress.referenceVisible);
        renderLessonWorkspace();
        rememberCanvas();
        learnWorkspace.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    catch (error) {
        announce("Couldn't resume the saved lesson references.");
        console.error("Could not resume the saved lesson.", error);
    }
    finally {
        isLessonStarting = false;
        updateHistoryButtons();
    }
}
async function startLessonFromAsset(assetId, lessonId, title, sourceBlob) {
    if (isProjectLoading || isHistoryRestoring || isFilling || isLessonStarting)
        return;
    if (lessonProgress?.lessonId === lessonId) {
        await resumeLesson();
        return;
    }
    isLessonStarting = true;
    learnWorkspaceDescription.textContent = `Preparing ${title} and its separate drawing guides…`;
    updateHistoryButtons();
    try {
        let source = assetId ? await assetManager.getImage(assetId) : undefined;
        if (!assetId && sourceBlob) {
            const savedSource = await assetManager.saveImage(sourceBlob, `${title} - original`, "lesson");
            source = await assetManager.getImage(savedSource.id);
        }
        if (!source)
            throw new Error("The selected source image is no longer available.");
        const imagePixels = await readImagePixels(source.blob);
        const [mainOutline, detailedOutline] = await Promise.all([
            createLessonOutlineAsset(imagePixels, `${title} - main outline`, TRACING_PRESETS.beginner),
            createLessonOutlineAsset(imagePixels, `${title} - detailed outline`, TRACING_PRESETS.advanced),
        ]);
        lessonProgress = createLessonProgress(lessonId, title, source.id, source.id, mainOutline.id, detailedOutline.id);
        const artworkLayer = layerManager.addLayer("Lesson Artwork");
        context = artworkLayer.context;
        refreshLayerPanel();
        renderLayers();
        viewport.fitToScreen(getViewportSize(), getArtworkSize());
        applyViewport();
        await showLessonReference("original");
        renderLessonWorkspace();
        rememberCanvas();
        learnWorkspace.scrollIntoView({ behavior: "smooth", block: "start" });
        announce(`${title} is ready. Your drawing will stay separate from the guides.`);
    }
    catch (error) {
        learnWorkspaceDescription.textContent =
            "The lesson could not be prepared. Your existing artwork has been kept.";
        announce("Couldn't prepare this drawing lesson.");
        console.error("Could not prepare a drawing lesson.", error);
    }
    finally {
        isLessonStarting = false;
        updateHistoryButtons();
    }
}
async function startStarterLesson(lessonId) {
    if (isProjectLoading || isHistoryRestoring || isFilling || isLessonStarting)
        return;
    const lesson = getStarterLesson(lessonId);
    if (!lesson) {
        announce("That starter lesson is unavailable.");
        return;
    }
    if (lessonProgress?.lessonId === `starter-${lesson.id}`) {
        await resumeLesson();
        return;
    }
    await startLessonFromAsset(null, `starter-${lesson.id}`, lesson.title, new Blob([lesson.sourceSvg], { type: "image/svg+xml" }));
}
async function startImageLesson(assetId) {
    if (isProjectLoading || isHistoryRestoring || isFilling || isLessonStarting)
        return;
    try {
        const asset = await assetManager.getImage(assetId);
        if (!asset)
            throw new Error("The selected saved image no longer exists.");
        await startLessonFromAsset(asset.id, `image-${asset.id}`, asset.name);
    }
    catch (error) {
        announce("Couldn't start a lesson from that saved image.");
        console.error("Could not start a lesson from a saved image.", error);
    }
}
async function changeCurrentLessonStage(direction) {
    if (!lessonProgress)
        return;
    const next = changeLessonStage(lessonProgress, direction);
    if (next.currentStage === lessonProgress.currentStage)
        return;
    lessonProgress = next;
    renderLessonWorkspace();
    try {
        const reference = next.selectedReference ?? "original";
        await showLessonReference(reference, next.referenceVisible);
        renderLessonWorkspace();
        rememberCanvas();
    }
    catch (error) {
        announce("Couldn't change the lesson reference.");
        console.error("Could not change lesson stage references.", error);
    }
}
async function resetCurrentLesson() {
    if (!lessonProgress)
        return;
    lessonProgress = {
        ...lessonProgress,
        currentStage: 1,
        constructionGuidesVisible: false,
        referenceVisible: true,
        selectedReference: "original",
        hintVisible: false,
        workspaceVisible: true,
        completed: false,
    };
    try {
        await showLessonReference("original");
        renderLessonWorkspace();
        rememberCanvas();
        announce("Lesson restarted. Your drawing was kept.");
    }
    catch (error) {
        announce("Couldn't reset the lesson steps.");
        console.error("Could not reset lesson progress.", error);
    }
}
function exitCurrentLesson() {
    if (!lessonProgress)
        return;
    lessonProgress = {
        ...lessonProgress,
        constructionGuidesVisible: false,
        referenceVisible: false,
        workspaceVisible: false,
    };
    currentReferenceVisible = false;
    updateReferenceVisibility();
    renderLessonWorkspace();
    rememberCanvas();
    announce("Lesson progress saved. Choose Resume Lesson whenever you're ready.");
}
function finishCurrentLesson() {
    if (!lessonProgress || lessonProgress.currentStage !== 6)
        return;
    lessonProgress = {
        ...lessonProgress,
        completed: true,
        workspaceVisible: true,
        constructionGuidesVisible: false,
    };
    renderLessonWorkspace();
    rememberCanvas();
    announce("Lesson finished. Your drawing is still editable.");
}
function saveCurrentLessonProgress() {
    if (!lessonProgress)
        return;
    lessonProgress = {
        ...lessonProgress,
        workspaceVisible: true,
        referenceVisible: currentReferenceVisible,
        referenceOpacity: Number(traceOpacityInput.value) / 100,
    };
    renderLessonWorkspace();
    rememberCanvas();
    announce("Lesson progress saved on this device.");
}
function selectLessonReference(reference) {
    void showLessonReference(reference)
        .then(() => {
        renderLessonWorkspace();
        rememberCanvas();
    })
        .catch((error) => {
        announce("Couldn't display that lesson reference.");
        console.error("Could not display a lesson reference.", error);
    });
}
function toggleLearnWorkspace() {
    if (isProjectLoading || isHistoryRestoring || isLessonStarting)
        return;
    if (lessonProgress) {
        if (lessonProgress.workspaceVisible) {
            learnWorkspace.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        else {
            void resumeLesson();
        }
        return;
    }
    lessonCatalogOpen = !lessonCatalogOpen;
    renderLessonWorkspace();
    if (lessonCatalogOpen) {
        learnWorkspace.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}
function readTracingSettings() {
    const difficulty = tracingDifficultyInput.value;
    if (difficulty !== "beginner" &&
        difficulty !== "intermediate" &&
        difficulty !== "advanced") {
        throw new TypeError("Choose a valid tracing difficulty.");
    }
    const settings = {
        difficulty,
        brightness: Number(tracingBrightnessInput.value),
        contrast: Number(tracingContrastInput.value),
        grayscale: tracingGrayscaleInput.checked,
        edgeSensitivity: Number(tracingEdgeSensitivityInput.value),
        threshold: Number(tracingThresholdInput.value),
        noiseReduction: Number(tracingNoiseReductionInput.value),
        outlineThickness: Number(tracingOutlineThicknessInput.value),
        invert: tracingInvertInput.checked,
    };
    if (!isTracingSettings(settings)) {
        throw new TypeError("The tracing controls contain invalid settings.");
    }
    return settings;
}
function updateTracingControlOutputs() {
    for (const { input, output, digits } of tracingControlMap) {
        const value = Number(input.value);
        output.value = digits === undefined ? String(value) : value.toFixed(digits);
    }
}
function applyTracingSettings(settings) {
    tracingDifficultyInput.value = settings.difficulty;
    tracingBrightnessInput.value = String(settings.brightness);
    tracingContrastInput.value = String(settings.contrast);
    tracingGrayscaleInput.checked = settings.grayscale;
    tracingEdgeSensitivityInput.value = String(settings.edgeSensitivity);
    tracingThresholdInput.value = String(settings.threshold);
    tracingNoiseReductionInput.value = String(settings.noiseReduction);
    tracingOutlineThicknessInput.value = String(settings.outlineThickness);
    tracingInvertInput.checked = settings.invert;
    updateTracingControlOutputs();
    scheduleTracingPreview();
}
function scheduleTracingPreview() {
    if (tracingWorkbench.hidden || !selectedTracingPixels)
        return;
    window.clearTimeout(tracingDebounceTimer);
    const generation = ++tracingPreviewGeneration;
    latestProcessedTracingImage = null;
    latestTracingSettings = null;
    savedTracingGuideId = null;
    isTracingProcessing = true;
    tracingStatus.textContent = "Updating preview…";
    updateHistoryButtons();
    tracingDebounceTimer = window.setTimeout(() => {
        void processTracingPreview(generation);
    }, 100);
}
async function processTracingPreview(generation) {
    try {
        const settings = readTracingSettings();
        const result = await tracingProcessor.process(selectedTracingPixels, settings);
        if (generation !== tracingPreviewGeneration || tracingWorkbench.hidden)
            return;
        tracingOutputPreview.width = result.width;
        tracingOutputPreview.height = result.height;
        const output = tracingOutputContext.createImageData(result.width, result.height);
        output.data.set(result.data);
        tracingOutputContext.putImageData(output, 0, 0);
        latestProcessedTracingImage = result;
        latestTracingSettings = settings;
        tracingStatus.textContent = "";
    }
    catch (error) {
        if (generation !== tracingPreviewGeneration)
            return;
        latestProcessedTracingImage = null;
        latestTracingSettings = null;
        tracingStatus.textContent = "Couldn't generate this preview. Try another image or adjust the settings.";
        console.error("Could not generate tracing preview.", error);
    }
    finally {
        if (generation === tracingPreviewGeneration) {
            isTracingProcessing = false;
            updateHistoryButtons();
        }
    }
}
async function openTracingGenerator(blob, assetId, source, name) {
    if (isProjectLoading || isHistoryRestoring || isFilling || isTracingSaving)
        return;
    if (!blob.type.startsWith("image/") || blob.size === 0) {
        announce("Choose a non-empty image to make traceable.");
        return;
    }
    selectedTracingBlob = blob;
    selectedTracingAssetId = assetId;
    selectedTracingFromCurrentReference =
        (assetId !== null &&
            (assetId === currentReferenceAssetId || assetId === currentOriginalReferenceAssetId)) ||
            (assetId === null && blob === currentReferenceBlob);
    selectedTracingSource = source;
    selectedTracingName = name.trim() || "Untitled image";
    window.clearTimeout(tracingDebounceTimer);
    tracingPreviewGeneration += 1;
    isTracingProcessing = false;
    const sourceGeneration = ++tracingSourceGeneration;
    const image = new Image();
    selectedTracingPixels = null;
    latestProcessedTracingImage = null;
    latestTracingSettings = null;
    savedTracingGuideId = null;
    tracingSourceName.textContent = selectedTracingName;
    tracingStatus.textContent = "Preparing image preview…";
    tracingOriginalPreview.width = 1;
    tracingOriginalPreview.height = 1;
    tracingOutputPreview.width = 1;
    tracingOutputPreview.height = 1;
    tracingWorkbench.hidden = false;
    tracingWorkbench.scrollIntoView({ behavior: "smooth", block: "start" });
    updateHistoryButtons();
    const objectUrl = URL.createObjectURL(blob);
    try {
        image.src = objectUrl;
        await image.decode();
        if (sourceGeneration !== tracingSourceGeneration)
            return;
        const scale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        tracingOriginalPreview.width = width;
        tracingOriginalPreview.height = height;
        tracingOutputPreview.width = width;
        tracingOutputPreview.height = height;
        tracingPreviewContext.clearRect(0, 0, width, height);
        tracingPreviewContext.drawImage(image, 0, 0, width, height);
        selectedTracingPixels = tracingPreviewContext.getImageData(0, 0, width, height);
        const settings = (currentReferenceAssetId === assetId || currentOriginalReferenceAssetId === assetId) &&
            traceSettings
            ? traceSettings
            : DEFAULT_TRACING_SETTINGS;
        applyTracingSettings(settings);
        tracingStatus.textContent = "Updating preview…";
    }
    catch (error) {
        tracingStatus.textContent = "This image could not be decoded. Try a different image file.";
        console.error("Could not load the image for tracing.", error);
    }
    finally {
        URL.revokeObjectURL(objectUrl);
    }
}
function makeCurrentReferenceTraceable() {
    if (!currentReferenceBlob)
        return;
    const originalId = currentOriginalReferenceAssetId ?? currentReferenceAssetId;
    if (originalId) {
        void assetManager.getImage(originalId).then((asset) => {
            if (!asset)
                throw new Error("The original reference image is unavailable.");
            return openTracingGenerator(asset.blob, asset.id, asset.source, asset.name);
        }).catch((error) => {
            announce("Couldn't open the original reference image.");
            console.error("Could not open the original reference image for tracing.", error);
        });
        return;
    }
    void openTracingGenerator(currentReferenceBlob, null, "upload", "Tracing image");
}
async function learnFromCurrentReference() {
    try {
        let assetId = currentReferenceAssetId ?? currentOriginalReferenceAssetId;
        if (!assetId && currentReferenceAssetPromise) {
            assetId = (await currentReferenceAssetPromise).id;
        }
        if (!assetId && currentReferenceBlob) {
            const saved = await assetManager.saveImage(currentReferenceBlob, "Tracing image", "upload");
            assetId = saved.id;
            currentReferenceAssetId = saved.id;
            currentOriginalReferenceAssetId = saved.id;
            updateCurrentHistorySnapshot();
            await refreshAssetLibrary();
        }
        if (!assetId)
            throw new Error("The current reference image is unavailable.");
        await startImageLesson(assetId);
    }
    catch (error) {
        announce("Couldn't start a lesson from the current reference.");
        console.error("Could not start a lesson from the current reference.", error);
    }
}
async function ensureTracingGuideSaved() {
    if (!selectedTracingBlob || !latestProcessedTracingImage || !latestTracingSettings) {
        throw new Error("Wait for the tracing preview to finish before saving.");
    }
    let originalId = selectedTracingAssetId;
    if (!originalId) {
        const original = selectedTracingFromCurrentReference && currentReferenceAssetPromise
            ? await currentReferenceAssetPromise
            : await assetManager.saveImage(selectedTracingBlob, selectedTracingName, selectedTracingSource);
        originalId = original.id;
        selectedTracingAssetId = original.id;
        if (selectedTracingFromCurrentReference) {
            currentOriginalReferenceAssetId = original.id;
            if (!currentReferenceAssetId)
                currentReferenceAssetId = original.id;
            updateCurrentHistorySnapshot();
        }
    }
    else {
        const original = await assetManager.getImage(originalId);
        if (!original)
            throw new Error("The original image is no longer in My Images.");
    }
    let processedId = savedTracingGuideId;
    if (!processedId) {
        const processedBlob = await canvasToBlob(tracingOutputPreview);
        const baseName = selectedTracingName.replace(/\.[^.]+$/, "");
        const processed = await assetManager.saveImage(processedBlob, `${baseName} - tracing guide`, "processed");
        processedId = processed.id;
        savedTracingGuideId = processed.id;
    }
    return { originalId, processedId };
}
async function saveTracingGuide(startTracing) {
    if (isTracingSaving || isProjectLoading || isHistoryRestoring)
        return;
    isTracingSaving = true;
    updateHistoryButtons();
    tracingStatus.textContent = startTracing ? "Preparing your tracing workspace…" : "Saving image assets…";
    try {
        const { originalId, processedId } = await ensureTracingGuideSaved();
        await refreshAssetLibrary();
        if (startTracing) {
            const guide = await assetManager.getImage(processedId);
            if (!guide)
                throw new Error("The generated tracing guide could not be loaded.");
            setReferenceImage(guide.blob, guide.id, originalId, latestTracingSettings);
            traceOpacityInput.value = "100";
            traceOpacityValue.value = "100%";
            traceImage.style.opacity = "1";
            currentReferenceVisible = true;
            referenceVisibleInput.checked = true;
            closeTracingGenerator();
            prepareTraceWorkspace();
            tracingStatus.textContent = "";
            announce("Your tracing guide is ready on a separate artwork layer.");
        }
        else {
            tracingStatus.textContent = "Original and tracing guide saved to My Images.";
            announce("Original image and tracing guide saved to My Images.");
        }
    }
    catch (error) {
        tracingStatus.textContent = "Couldn't save the tracing guide. Your original image is unchanged.";
        announce("Couldn't save the tracing guide.");
        console.error("Could not save the tracing guide.", error);
    }
    finally {
        isTracingSaving = false;
        updateHistoryButtons();
    }
}
async function saveArtworkToLibrary() {
    if (isProjectLoading || isHistoryRestoring || isFilling || isAssetSaving)
        return;
    isAssetSaving = true;
    updateHistoryButtons();
    try {
        const blob = await canvasToBlob(canvas);
        await assetManager.saveImage(blob, "My artwork", "artwork");
        await refreshAssetLibrary();
        announce("Artwork saved to My Images.");
    }
    catch (error) {
        assetLibraryMessage.textContent = "Couldn't save the artwork to your image library.";
        announce("Couldn't save artwork to My Images.");
        console.error("Could not save artwork as an image asset.", error);
    }
    finally {
        isAssetSaving = false;
        updateHistoryButtons();
    }
}
function updateLayerActionAvailability() {
    const active = layerManager.activeLayer;
    const activeIndex = layerManager.layers.indexOf(active);
    const busy = isFilling || isHistoryRestoring || isProjectLoading;
    addLayerButton.disabled = busy;
    duplicateLayerButton.disabled = busy;
    mergeLayerButton.disabled = busy || activeIndex <= 0;
    flattenLayersButton.disabled = busy || layerManager.layers.length <= 1;
    deleteLayerButton.disabled = busy || layerManager.layers.length <= 1;
    layerOpacityInput.disabled = busy;
}
function refreshLayerPanel() {
    layerList.replaceChildren();
    const active = layerManager.activeLayer;
    layerOpacityInput.value = String(Math.round(active.opacity * 100));
    layerOpacityValue.value = `${layerOpacityInput.value}%`;
    for (const layer of [...layerManager.layers].reverse()) {
        const layerIndex = layerManager.layers.indexOf(layer);
        const row = document.createElement("li");
        row.className = "layer-row";
        row.classList.toggle("is-active", layer.id === active.id);
        const selectButton = document.createElement("button");
        selectButton.className = "layer-select-button";
        selectButton.type = "button";
        selectButton.textContent = layer.id === active.id ? "●" : "○";
        selectButton.title = `Select ${layer.name}`;
        selectButton.disabled = isFilling || isHistoryRestoring || isProjectLoading;
        selectButton.setAttribute("aria-pressed", String(layer.id === active.id));
        selectButton.addEventListener("click", () => {
            if (isFilling || isHistoryRestoring || isProjectLoading)
                return;
            layerManager.setActiveLayer(layer.id);
            context = layerManager.activeLayer.context;
            refreshLayerPanel();
            rememberCanvas();
        });
        const visibilityButton = document.createElement("button");
        visibilityButton.className = "layer-icon-button";
        visibilityButton.type = "button";
        visibilityButton.textContent = layer.visible ? "◉" : "○";
        visibilityButton.title = layer.visible ? "Hide layer" : "Show layer";
        visibilityButton.setAttribute("aria-label", visibilityButton.title);
        visibilityButton.setAttribute("aria-pressed", String(layer.visible));
        visibilityButton.disabled = isFilling || isHistoryRestoring || isProjectLoading;
        visibilityButton.addEventListener("click", () => {
            if (isFilling || isHistoryRestoring || isProjectLoading)
                return;
            layerManager.setLayerVisible(layer.id, !layer.visible);
            refreshLayerPanel();
            renderLayers();
            rememberCanvas();
        });
        const lockButton = document.createElement("button");
        lockButton.className = "layer-icon-button";
        lockButton.type = "button";
        lockButton.textContent = layer.locked ? "▣" : "▢";
        lockButton.title = layer.locked ? "Unlock layer" : "Lock layer";
        lockButton.setAttribute("aria-label", lockButton.title);
        lockButton.setAttribute("aria-pressed", String(layer.locked));
        lockButton.disabled = isFilling || isHistoryRestoring || isProjectLoading;
        lockButton.addEventListener("click", () => {
            if (isFilling || isHistoryRestoring || isProjectLoading)
                return;
            layerManager.setLayerLocked(layer.id, !layer.locked);
            refreshLayerPanel();
            rememberCanvas();
        });
        const renameInput = document.createElement("input");
        renameInput.className = "layer-name-input";
        renameInput.type = "text";
        renameInput.value = layer.name;
        renameInput.maxLength = 80;
        renameInput.setAttribute("aria-label", `Rename ${layer.name}`);
        renameInput.disabled = isFilling || isHistoryRestoring || isProjectLoading;
        renameInput.addEventListener("change", () => {
            if (isFilling || isHistoryRestoring || isProjectLoading) {
                refreshLayerPanel();
                return;
            }
            if (!layerManager.renameLayer(layer.id, renameInput.value)) {
                announce("Layer names cannot be empty.");
            }
            refreshLayerPanel();
            rememberCanvas();
        });
        const reorderButtons = document.createElement("span");
        reorderButtons.className = "layer-reorder-buttons";
        const moveUpButton = document.createElement("button");
        moveUpButton.className = "layer-icon-button";
        moveUpButton.type = "button";
        moveUpButton.textContent = "↑";
        moveUpButton.title = "Move layer up";
        moveUpButton.setAttribute("aria-label", moveUpButton.title);
        moveUpButton.disabled =
            isFilling ||
                isHistoryRestoring ||
                isProjectLoading ||
                layerIndex === layerManager.layers.length - 1;
        moveUpButton.addEventListener("click", () => {
            if (isFilling || isHistoryRestoring || isProjectLoading)
                return;
            if (layerManager.moveLayer(layer.id, 1)) {
                refreshLayerPanel();
                renderLayers();
                rememberCanvas();
            }
        });
        const moveDownButton = document.createElement("button");
        moveDownButton.className = "layer-icon-button";
        moveDownButton.type = "button";
        moveDownButton.textContent = "↓";
        moveDownButton.title = "Move layer down";
        moveDownButton.setAttribute("aria-label", moveDownButton.title);
        moveDownButton.disabled =
            isFilling || isHistoryRestoring || isProjectLoading || layerIndex === 0;
        moveDownButton.addEventListener("click", () => {
            if (isFilling || isHistoryRestoring || isProjectLoading)
                return;
            if (layerManager.moveLayer(layer.id, -1)) {
                refreshLayerPanel();
                renderLayers();
                rememberCanvas();
            }
        });
        reorderButtons.append(moveUpButton, moveDownButton);
        row.append(selectButton, renameInput, visibilityButton, lockButton, reorderButtons);
        layerList.append(row);
    }
    updateLayerActionAvailability();
}
function selectCurrentLayer(id) {
    if (isFilling || isHistoryRestoring || isProjectLoading)
        return;
    if (!layerManager.setActiveLayer(id))
        return;
    context = layerManager.activeLayer.context;
    refreshLayerPanel();
}
addLayerButton.addEventListener("click", () => {
    if (isFilling || isHistoryRestoring || isProjectLoading)
        return;
    const layer = layerManager.addLayer();
    selectCurrentLayer(layer.id);
    renderLayers();
    rememberCanvas();
});
duplicateLayerButton.addEventListener("click", () => {
    if (isFilling || isHistoryRestoring || isProjectLoading)
        return;
    const duplicate = layerManager.duplicateLayer(layerManager.activeLayer.id);
    if (!duplicate) {
        announce("Couldn't duplicate the selected layer.");
        return;
    }
    selectCurrentLayer(duplicate.id);
    renderLayers();
    rememberCanvas();
});
mergeLayerButton.addEventListener("click", () => {
    if (isFilling || isHistoryRestoring || isProjectLoading)
        return;
    if (!layerManager.mergeDown(layerManager.activeLayer.id)) {
        announce("This layer cannot be merged down without changing its appearance.");
        return;
    }
    context = layerManager.activeLayer.context;
    refreshLayerPanel();
    renderLayers();
    rememberCanvas();
});
flattenLayersButton.addEventListener("click", () => {
    if (isFilling || isHistoryRestoring || isProjectLoading)
        return;
    layerManager.flattenArtwork();
    context = layerManager.activeLayer.context;
    refreshLayerPanel();
    renderLayers();
    rememberCanvas();
    announce("Visible artwork flattened into one layer.");
});
deleteLayerButton.addEventListener("click", () => {
    if (isFilling || isHistoryRestoring || isProjectLoading)
        return;
    if (!layerManager.deleteLayer(layerManager.activeLayer.id))
        return;
    context = layerManager.activeLayer.context;
    refreshLayerPanel();
    renderLayers();
    rememberCanvas();
});
layerOpacityInput.addEventListener("input", () => {
    if (isFilling || isHistoryRestoring || isProjectLoading)
        return;
    const opacity = Number(layerOpacityInput.value) / 100;
    layerManager.setLayerOpacity(layerManager.activeLayer.id, opacity);
    layerOpacityValue.value = `${layerOpacityInput.value}%`;
    renderLayers();
});
layerOpacityInput.addEventListener("change", rememberCanvas);
function scheduleSave() {
    window.clearTimeout(saveTimer);
    updateSaveStatus("Saving…");
    saveTimer = window.setTimeout(() => {
        try {
            window.localStorage.setItem(projectStorageKey, JSON.stringify(createCurrentProject()));
            updateSaveStatus("Saved on this device");
        }
        catch (error) {
            updateSaveStatus("Could not save");
            announce("Your browser couldn't save this drawing. You can still download it as a PNG.");
            console.error("Could not save drawing to local storage.", error);
        }
    }, 400);
}
function initializeHistory() {
    const snapshot = JSON.stringify(createCurrentProject(historySnapshotTime));
    history = [snapshot];
    historyCharacters = snapshot.length;
    historyIndex = 0;
    updateHistoryButtons();
}
async function loadSavedDrawing() {
    let projectValue;
    let legacyValue;
    try {
        projectValue = window.localStorage.getItem(projectStorageKey);
        legacyValue = window.localStorage.getItem(legacyStorageKey);
    }
    catch (error) {
        renderLayers();
        refreshLayerPanel();
        initializeHistory();
        updateSaveStatus("Browser storage is unavailable");
        announce("Couldn't read saved work from this browser.");
        console.error("Could not access drawing storage.", error);
        return;
    }
    if (projectValue) {
        try {
            const savedProject = JSON.parse(projectValue);
            if (!isProjectDocument(savedProject) ||
                savedProject.width !== canvas.width ||
                savedProject.height !== canvas.height) {
                throw new Error("The saved project is invalid or has unsupported canvas dimensions.");
            }
            await layerManager.restore(savedProject);
            projectId = savedProject.projectId;
            projectName = savedProject.projectName;
            backgroundInput.value = savedProject.background;
            canvasPaper.style.backgroundColor = savedProject.background;
            context = layerManager.activeLayer.context;
            tracingGridVisible = savedProject.tracingGridVisible ?? false;
            tracingGridSize = savedProject.tracingGridSize ?? 50;
            traceSettings = savedProject.traceSettings ?? null;
            lessonProgress = savedProject.lessonProgress ?? null;
            await restoreProjectReference(savedProject.referenceAssetId ?? null, savedProject.referenceOpacity ?? 0.28, savedProject.referenceVisible ?? true, savedProject.originalReferenceAssetId ?? null, savedProject.traceSettings ?? null);
            renderLayers();
            refreshLayerPanel();
            renderLessonWorkspace();
            initializeHistory();
            updateSaveStatus("Your last drawing is back");
            return;
        }
        catch (error) {
            updateSaveStatus("Saved project couldn't be loaded");
            announce("Couldn't load the saved project. Your saved data was kept.");
            console.error("Could not load the saved project.", error);
        }
    }
    if (legacyValue) {
        try {
            const savedDrawing = JSON.parse(legacyValue);
            if (!isLegacySavedDrawing(savedDrawing)) {
                throw new Error("The legacy drawing data has an unexpected format.");
            }
            const image = new Image();
            image.src = savedDrawing.drawing;
            await image.decode();
            backgroundInput.value = savedDrawing.background;
            canvasPaper.style.backgroundColor = savedDrawing.background;
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            renderLayers();
            refreshLayerPanel();
            history = [];
            historyCharacters = 0;
            historyIndex = -1;
            rememberCanvas();
            updateSaveStatus("Your last drawing was migrated to editable layers");
            return;
        }
        catch (error) {
            renderLayers();
            refreshLayerPanel();
            initializeHistory();
            updateSaveStatus("Saved drawing couldn't be loaded");
            announce("Couldn't load the previous drawing. Your saved data was kept.");
            console.error("Could not migrate the legacy drawing.", error);
            return;
        }
    }
    renderLayers();
    refreshLayerPanel();
    if (projectValue) {
        initializeHistory();
    }
    else {
        history = [];
        historyCharacters = 0;
        historyIndex = -1;
        rememberCanvas();
    }
}
for (const button of toolButtons) {
    button.addEventListener("click", () => {
        const tool = button.dataset.tool;
        if (isTool(tool))
            setActiveTool(tool);
    });
}
eraserQuickButton.addEventListener("click", () => setActiveTool("eraser"));
hardEraserButton.addEventListener("click", () => {
    isSoftEraser = false;
    hardEraserButton.classList.add("is-selected");
    softEraserButton.classList.remove("is-selected");
    hardEraserButton.setAttribute("aria-pressed", "true");
    softEraserButton.setAttribute("aria-pressed", "false");
    eraserCursor.classList.remove("is-soft");
});
softEraserButton.addEventListener("click", () => {
    isSoftEraser = true;
    softEraserButton.classList.add("is-selected");
    hardEraserButton.classList.remove("is-selected");
    softEraserButton.setAttribute("aria-pressed", "true");
    hardEraserButton.setAttribute("aria-pressed", "false");
    eraserCursor.classList.add("is-soft");
});
function interruptDrawing() {
    if (gestureSnapshot) {
        context.putImageData(gestureSnapshot, 0, 0);
        renderLayers();
    }
    isDrawing = false;
    drawingPointerId = null;
    previousBrushPoint = null;
    drawingSnapshot = null;
    gestureSnapshot = null;
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 1;
}
function getTouchGeometry() {
    const points = Array.from(touchPoints.values());
    if (points.length < 2)
        return null;
    const first = points[0];
    const second = points[1];
    return {
        midpoint: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
        distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
    };
}
canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") {
        touchPoints.set(event.pointerId, getViewportPoint(event));
        if (touchPoints.size >= 2) {
            event.preventDefault();
            interruptDrawing();
            isPanning = false;
            panPointerId = null;
            lastPanPoint = null;
            canvas.classList.remove("is-panning");
            isTouchNavigationActive = true;
            canvas.setPointerCapture(event.pointerId);
            const geometry = getTouchGeometry();
            pinchMidpoint = geometry?.midpoint ?? null;
            pinchDistance = geometry?.distance ?? 0;
            return;
        }
    }
    if (event.button !== 0 ||
        isFilling ||
        isHistoryRestoring ||
        isProjectLoading ||
        isTouchNavigationActive)
        return;
    event.preventDefault();
    canvasViewport.focus({ preventScroll: true });
    if (activeTool === "hand" || isSpaceHandActive) {
        canvas.setPointerCapture(event.pointerId);
        isPanning = true;
        panPointerId = event.pointerId;
        lastPanPoint = getViewportPoint(event);
        canvas.classList.add("is-panning");
        return;
    }
    const point = getCanvasPoint(event);
    if (activeTool === "eyedropper") {
        try {
            const sampledColor = sampleVisibleColor(point);
            updateSelectedColor(sampledColor);
            setActiveTool(lastDrawingTool);
            announce(`Color sampled: ${sampledColor.toUpperCase()}`);
        }
        catch (error) {
            announce("Couldn't sample the color at that point.");
            console.error("Eyedropper color sampling failed.", error);
        }
        return;
    }
    if (activeTool === "bucket") {
        void fillCanvasRegion(point);
        return;
    }
    if (!layerManager.canEditActiveLayer) {
        announce("Unlock and show the selected layer before editing it.");
        return;
    }
    canvas.setPointerCapture(event.pointerId);
    isDrawing = true;
    drawingPointerId = event.pointerId;
    startPoint = point;
    gestureSnapshot = context.getImageData(0, 0, canvas.width, canvas.height);
    if (activeTool !== "brush" && activeTool !== "eraser") {
        applyBrushStyle();
        drawingSnapshot = gestureSnapshot;
        return;
    }
    context.globalCompositeOperation = activeTool === "eraser" ? "destination-out" : "source-over";
    previousBrushPoint = startPoint;
    drawActiveStrokeSegment(startPoint, startPoint);
});
canvas.addEventListener("pointermove", (event) => {
    lastEraserCanvasPoint = getCanvasPoint(event);
    updateEraserCursor(lastEraserCanvasPoint);
    if (event.pointerType === "touch" && touchPoints.has(event.pointerId)) {
        touchPoints.set(event.pointerId, getViewportPoint(event));
        if (isTouchNavigationActive) {
            const geometry = getTouchGeometry();
            if (geometry && pinchMidpoint && pinchDistance > 0) {
                const viewportSize = getViewportSize();
                viewport.zoomAt(viewport.zoom * (geometry.distance / pinchDistance), pinchMidpoint, viewportSize);
                viewport.panBy(geometry.midpoint.x - pinchMidpoint.x, geometry.midpoint.y - pinchMidpoint.y);
                pinchMidpoint = geometry.midpoint;
                pinchDistance = geometry.distance;
                applyViewport();
            }
            return;
        }
    }
    if (isPanning && event.pointerId === panPointerId && lastPanPoint) {
        const point = getViewportPoint(event);
        viewport.panBy(point.x - lastPanPoint.x, point.y - lastPanPoint.y);
        lastPanPoint = point;
        applyViewport();
        return;
    }
    if (!isDrawing || event.pointerId !== drawingPointerId)
        return;
    const point = getCanvasPoint(event);
    if (drawingSnapshot) {
        drawShape(point);
        return;
    }
    if (previousBrushPoint) {
        drawActiveStrokeSegment(previousBrushPoint, point);
        previousBrushPoint = point;
    }
});
canvas.addEventListener("pointerleave", () => {
    eraserCursor.hidden = true;
    lastEraserCanvasPoint = null;
});
canvas.addEventListener("pointerup", (event) => {
    if (event.pointerType === "touch") {
        touchPoints.delete(event.pointerId);
        if (touchPoints.size < 2) {
            pinchMidpoint = null;
            pinchDistance = 0;
        }
        if (touchPoints.size === 0)
            isTouchNavigationActive = false;
    }
    if (isPanning && event.pointerId === panPointerId) {
        isPanning = false;
        panPointerId = null;
        lastPanPoint = null;
        canvas.classList.remove("is-panning");
        return;
    }
    if (!isDrawing || event.pointerId !== drawingPointerId)
        return;
    if (drawingSnapshot) {
        drawShape(getCanvasPoint(event));
    }
    else if (previousBrushPoint) {
        const point = getCanvasPoint(event);
        if (Math.hypot(point.x - previousBrushPoint.x, point.y - previousBrushPoint.y) > 0.01) {
            drawActiveStrokeSegment(previousBrushPoint, point);
        }
    }
    isDrawing = false;
    drawingPointerId = null;
    previousBrushPoint = null;
    drawingSnapshot = null;
    gestureSnapshot = null;
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 1;
    rememberCanvas();
});
canvas.addEventListener("pointercancel", (event) => {
    if (event.pointerType === "touch") {
        touchPoints.delete(event.pointerId);
        if (touchPoints.size < 2) {
            pinchMidpoint = null;
            pinchDistance = 0;
        }
        if (touchPoints.size === 0)
            isTouchNavigationActive = false;
    }
    if (event.pointerId === drawingPointerId)
        interruptDrawing();
    if (event.pointerId === panPointerId) {
        isPanning = false;
        panPointerId = null;
        lastPanPoint = null;
        canvas.classList.remove("is-panning");
    }
});
canvas.addEventListener("lostpointercapture", (event) => {
    if (event.pointerType === "touch" && touchPoints.delete(event.pointerId)) {
        if (touchPoints.size < 2) {
            pinchMidpoint = null;
            pinchDistance = 0;
        }
        if (touchPoints.size === 0)
            isTouchNavigationActive = false;
    }
    if (event.pointerId === drawingPointerId)
        interruptDrawing();
    if (event.pointerId === panPointerId) {
        isPanning = false;
        panPointerId = null;
        lastPanPoint = null;
        canvas.classList.remove("is-panning");
    }
});
function zoomAtViewportPoint(zoom, focalPoint = {
    x: getViewportSize().width / 2,
    y: getViewportSize().height / 2,
}) {
    viewport.zoomAt(zoom, focalPoint, getViewportSize());
    applyViewport();
}
function resetViewport() {
    viewport.resetView();
    applyViewport();
}
zoomInButton.addEventListener("click", () => {
    zoomAtViewportPoint(viewport.zoom * 1.2);
});
zoomOutButton.addEventListener("click", () => {
    zoomAtViewportPoint(viewport.zoom / 1.2);
});
fitToScreenButton.addEventListener("click", () => {
    viewport.fitToScreen(getViewportSize(), getArtworkSize());
    applyViewport();
});
centerCanvasButton.addEventListener("click", () => {
    viewport.centerCanvas();
    applyViewport();
});
resetViewButton.addEventListener("click", resetViewport);
navigatorResetButton.addEventListener("click", resetViewport);
canvasViewport.addEventListener("wheel", (event) => {
    if (!event.ctrlKey && !event.metaKey)
        return;
    event.preventDefault();
    const zoomFactor = Math.exp(-event.deltaY * 0.002);
    zoomAtViewportPoint(viewport.zoom * zoomFactor, getViewportPoint(event));
}, { passive: false });
centerImageButton.addEventListener("click", () => {
    traceImage.style.objectPosition = "center center";
    traceImage.style.transform = "none";
    viewport.fitToScreen(getViewportSize(), getArtworkSize());
    applyViewport();
    announce("Tracing image centered on the canvas.");
});
let navigatorDragging = false;
let navigatorLastPoint = null;
function getNavigatorPoint(event) {
    const bounds = navigatorCanvas.getBoundingClientRect();
    return {
        x: ((event.clientX - bounds.left) / bounds.width) * navigatorCanvas.width,
        y: ((event.clientY - bounds.top) / bounds.height) * navigatorCanvas.height,
    };
}
navigatorCanvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0)
        return;
    event.preventDefault();
    navigatorCanvas.setPointerCapture(event.pointerId);
    const point = getNavigatorPoint(event);
    const visible = viewport.getVisibleArtworkRect(getViewportSize(), getArtworkSize());
    const scaleX = navigatorCanvas.width / canvas.width;
    const scaleY = navigatorCanvas.height / canvas.height;
    const isInsideViewport = point.x >= visible.x * scaleX &&
        point.x <= (visible.x + visible.width) * scaleX &&
        point.y >= visible.y * scaleY &&
        point.y <= (visible.y + visible.height) * scaleY;
    if (!isInsideViewport) {
        viewport.centerOnArtworkPoint({ x: point.x / scaleX, y: point.y / scaleY }, getArtworkSize());
        applyViewport();
    }
    navigatorDragging = true;
    navigatorLastPoint = point;
});
navigatorCanvas.addEventListener("pointermove", (event) => {
    if (!navigatorDragging || !navigatorLastPoint)
        return;
    const point = getNavigatorPoint(event);
    const deltaX = point.x - navigatorLastPoint.x;
    const deltaY = point.y - navigatorLastPoint.y;
    viewport.panBy(-deltaX * (canvas.width / navigatorCanvas.width) * viewport.zoom, -deltaY * (canvas.height / navigatorCanvas.height) * viewport.zoom);
    navigatorLastPoint = point;
    applyViewport();
});
function stopNavigatorDrag() {
    navigatorDragging = false;
    navigatorLastPoint = null;
}
navigatorCanvas.addEventListener("pointerup", stopNavigatorDrag);
navigatorCanvas.addEventListener("pointercancel", stopNavigatorDrag);
navigatorCanvas.addEventListener("lostpointercapture", stopNavigatorDrag);
navigatorCanvas.addEventListener("keydown", (event) => {
    const keyDeltas = {
        ArrowUp: { x: 0, y: 40 },
        ArrowDown: { x: 0, y: -40 },
        ArrowLeft: { x: 40, y: 0 },
        ArrowRight: { x: -40, y: 0 },
    };
    const delta = keyDeltas[event.key];
    if (!delta)
        return;
    event.preventDefault();
    viewport.panBy(delta.x, delta.y);
    applyViewport();
});
undoButton.addEventListener("click", () => {
    if (historyIndex > 0)
        void restoreCanvas(historyIndex - 1);
});
redoButton.addEventListener("click", () => {
    if (historyIndex < history.length - 1)
        void restoreCanvas(historyIndex + 1);
});
function downloadDrawing(includeReference) {
    if (isFilling || isHistoryRestoring || isProjectLoading)
        return;
    if (includeReference && (traceImage.hidden || !traceImage.complete)) {
        announce("Add a tracing reference before exporting with it.");
        return;
    }
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportContext = exportCanvas.getContext("2d");
    if (!exportContext) {
        announce("Couldn't prepare the image for download.");
        return;
    }
    try {
        drawExportContent(exportContext, canvas, backgroundInput.value, includeReference && traceImage.naturalWidth > 0 ? traceImage : null, Number(traceOpacityInput.value) / 100);
        const downloadLink = document.createElement("a");
        downloadLink.download = includeReference
            ? "my-drawing-with-reference.png"
            : "my-drawing.png";
        downloadLink.href = exportCanvas.toDataURL("image/png");
        downloadLink.click();
        announce(includeReference
            ? "Your drawing and tracing reference downloaded as a PNG."
            : "Your artwork downloaded without the tracing reference.");
    }
    catch (error) {
        announce("Couldn't export the image. Try removing the reference and exporting the artwork only.");
        console.error("Could not export the drawing as a PNG.", error);
    }
}
clearActiveLayerButton.addEventListener("click", () => {
    if (isFilling || isHistoryRestoring || isProjectLoading)
        return;
    const activeLayer = layerManager.activeLayer;
    if (!activeLayer.visible) {
        announce("Show the selected layer before clearing it.");
        return;
    }
    if (activeLayer.locked) {
        announce("Unlock the selected layer before clearing it.");
        return;
    }
    const result = layerManager.clearLayer(activeLayer.id);
    if (result === "empty") {
        announce("The selected layer is already empty.");
        return;
    }
    if (result !== "cleared") {
        announce("Couldn't clear the selected layer.");
        return;
    }
    clearConfirmation.hidden = true;
    clearMenu.open = false;
    context = activeLayer.context;
    refreshLayerPanel();
    renderLayers();
    rememberCanvas();
    announce("Active layer cleared.");
});
clearAllArtworkButton.addEventListener("click", () => {
    if (isFilling || isHistoryRestoring || isProjectLoading)
        return;
    clearConfirmation.hidden = false;
    clearMenu.open = true;
});
confirmClearAllArtworkButton.addEventListener("click", () => {
    if (isFilling || isHistoryRestoring || isProjectLoading)
        return;
    const { clearedLayerIds, lockedLayerIds } = layerManager.clearEditableLayers();
    clearConfirmation.hidden = true;
    clearMenu.open = false;
    if (clearedLayerIds.length === 0) {
        announce(lockedLayerIds.length > 0
            ? "No editable artwork to clear. Locked layers were preserved."
            : "There is no artwork to clear.");
        return;
    }
    context = layerManager.activeLayer.context;
    refreshLayerPanel();
    renderLayers();
    rememberCanvas();
    announce(lockedLayerIds.length > 0
        ? `Cleared ${clearedLayerIds.length} layer(s). Locked layers were preserved.`
        : "All editable artwork cleared.");
});
cancelClearAllArtworkButton.addEventListener("click", () => {
    clearConfirmation.hidden = true;
});
saveButton.addEventListener("click", () => {
    downloadDrawing(false);
});
exportWithReferenceButton.addEventListener("click", () => downloadDrawing(true));
saveArtworkButton.addEventListener("click", () => void saveArtworkToLibrary());
learnToDrawButton.addEventListener("click", toggleLearnWorkspace);
showOriginalButton.addEventListener("click", () => selectLessonReference("original"));
showMainOutlineButton.addEventListener("click", () => selectLessonReference("main-outline"));
showDetailedOutlineButton.addEventListener("click", () => selectLessonReference("detailed-outline"));
showConstructionGuidesButton.addEventListener("click", () => {
    if (!lessonProgress)
        return;
    lessonProgress = {
        ...lessonProgress,
        constructionGuidesVisible: !lessonProgress.constructionGuidesVisible,
    };
    renderLessonWorkspace();
    rememberCanvas();
});
hideLessonReferenceButton.addEventListener("click", () => {
    if (!lessonProgress)
        return;
    currentReferenceVisible = false;
    lessonProgress = { ...lessonProgress, referenceVisible: false };
    updateReferenceVisibility();
    renderLessonWorkspace();
    rememberCanvas();
});
previousLessonStepButton.addEventListener("click", () => void changeCurrentLessonStage(-1));
nextLessonStepButton.addEventListener("click", () => void changeCurrentLessonStage(1));
toggleLessonHintButton.addEventListener("click", () => {
    if (!lessonProgress)
        return;
    lessonProgress = { ...lessonProgress, hintVisible: !lessonProgress.hintVisible };
    renderLessonWorkspace();
    rememberCanvas();
});
saveLessonProgressButton.addEventListener("click", saveCurrentLessonProgress);
resetLessonButton.addEventListener("click", () => void resetCurrentLesson());
exitLessonButton.addEventListener("click", exitCurrentLesson);
finishLessonButton.addEventListener("click", finishCurrentLesson);
colorInput.addEventListener("input", () => {
    updateSelectedColor(colorInput.value);
});
for (const swatch of colorSwatches) {
    swatch.addEventListener("click", () => {
        const color = swatch.dataset.color;
        if (!color)
            return;
        updateSelectedColor(color);
    });
}
brushOpacityInput.addEventListener("input", () => {
    opacityValue.value = `${brushOpacityInput.value}%`;
});
fillToleranceInput.addEventListener("input", () => {
    fillToleranceValue.value = fillToleranceInput.value;
});
sizeInput.addEventListener("input", () => {
    sizeValue.value = `${sizeInput.value} px`;
    if (lastEraserCanvasPoint)
        updateEraserCursor(lastEraserCanvasPoint);
});
backgroundInput.addEventListener("input", () => {
    canvasPaper.style.backgroundColor = backgroundInput.value;
    updateNavigator();
    scheduleSave();
});
traceOpacityInput.addEventListener("input", () => {
    traceOpacityValue.value = `${traceOpacityInput.value}%`;
    traceImage.style.opacity = String(Number(traceOpacityInput.value) / 100);
    if (lessonProgress) {
        lessonProgress = {
            ...lessonProgress,
            referenceOpacity: Number(traceOpacityInput.value) / 100,
        };
    }
    updateNavigator();
});
traceOpacityInput.addEventListener("change", rememberCanvas);
makeTraceableButton.addEventListener("click", makeCurrentReferenceTraceable);
learnReferenceButton.addEventListener("click", () => void learnFromCurrentReference());
referenceVisibleInput.addEventListener("change", () => {
    if (traceImage.hidden)
        return;
    currentReferenceVisible = referenceVisibleInput.checked;
    if (lessonProgress) {
        lessonProgress = {
            ...lessonProgress,
            referenceVisible: currentReferenceVisible,
        };
    }
    updateReferenceVisibility();
    renderLessonWorkspace();
    rememberCanvas();
});
tracingGridInput.addEventListener("change", () => {
    tracingGridVisible = tracingGridInput.checked;
    updateReferenceVisibility();
    rememberCanvas();
});
tracingGridSizeInput.addEventListener("input", () => {
    tracingGridSize = Number(tracingGridSizeInput.value);
    updateReferenceVisibility();
});
tracingGridSizeInput.addEventListener("change", rememberCanvas);
traceInput.addEventListener("change", () => {
    if (isProjectLoading || isHistoryRestoring)
        return;
    const file = traceInput.files?.[0];
    if (!file)
        return;
    if (!file.type.startsWith("image/")) {
        announce("Choose an image file to use as a tracing guide.");
        traceInput.value = "";
        return;
    }
    const objectUrl = setReferenceImage(file, null, null, null);
    prepareTraceWorkspace();
    announce("Tracing guide added. A new drawing layer is ready above it.");
    currentReferenceAssetPromise = assetManager
        .saveImage(file, file.name, "upload");
    void currentReferenceAssetPromise
        .then((asset) => {
        if (traceObjectUrl === objectUrl) {
            currentReferenceAssetId = asset.id;
            currentOriginalReferenceAssetId = asset.id;
            updateCurrentHistorySnapshot();
        }
        return refreshAssetLibrary();
    })
        .catch((error) => {
        if (traceObjectUrl === objectUrl) {
            assetLibraryMessage.textContent =
                "This image is ready to trace, but couldn't be saved to My Images for reuse.";
            announce("Image ready to trace, but it couldn't be saved to My Images.");
        }
        console.error("Could not save the uploaded tracing image.", error);
    });
});
function cancelTracingPreview() {
    window.clearTimeout(tracingDebounceTimer);
    tracingPreviewGeneration += 1;
    tracingSourceGeneration += 1;
    isTracingProcessing = false;
    updateHistoryButtons();
}
function closeTracingGenerator() {
    tracingWorkbench.hidden = true;
    cancelTracingPreview();
}
closeTracingDialogButton.addEventListener("click", closeTracingGenerator);
tracingDifficultyInput.addEventListener("change", () => {
    const difficulty = tracingDifficultyInput.value;
    if (difficulty === "beginner" ||
        difficulty === "intermediate" ||
        difficulty === "advanced") {
        applyTracingSettings(TRACING_PRESETS[difficulty]);
    }
});
for (const { input } of tracingControlMap) {
    input.addEventListener("input", () => {
        updateTracingControlOutputs();
        scheduleTracingPreview();
    });
}
tracingGrayscaleInput.addEventListener("change", scheduleTracingPreview);
tracingInvertInput.addEventListener("change", scheduleTracingPreview);
resetTracingSettingsButton.addEventListener("click", () => {
    const difficulty = tracingDifficultyInput.value;
    if (difficulty === "beginner" ||
        difficulty === "intermediate" ||
        difficulty === "advanced") {
        applyTracingSettings(TRACING_PRESETS[difficulty]);
    }
});
saveTracingGuideButton.addEventListener("click", () => void saveTracingGuide(false));
startTracingButton.addEventListener("click", () => void saveTracingGuide(true));
traceImage.addEventListener("load", () => {
    updateNavigator();
    updateHistoryButtons();
});
traceImage.addEventListener("error", () => {
    updateHistoryButtons();
    announce("Couldn't display that image as a tracing reference.");
    console.error("The selected tracing image could not be decoded.");
});
removeTraceButton.addEventListener("click", () => {
    if (isProjectLoading || isHistoryRestoring)
        return;
    clearReferenceImage();
    traceInput.value = "";
    rememberCanvas();
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !toolPickerPanel.hidden) {
        closeToolPicker();
        toolPickerButton.focus();
        return;
    }
    const isEditingText = event.target instanceof HTMLElement &&
        event.target.closest("input, select, textarea, [contenteditable='true']");
    if (event.key.toLowerCase() === "e" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !isEditingText) {
        event.preventDefault();
        setActiveTool(activeTool === "eraser" ? toolBeforeEraser : "eraser");
        return;
    }
    if (event.code === "Space" &&
        !event.repeat &&
        !isDrawing &&
        !(event.target instanceof HTMLElement && event.target.closest("button, input, select, textarea"))) {
        event.preventDefault();
        isSpaceHandActive = true;
        updateCanvasCursor();
    }
    const isApple = navigator.userAgent.includes("Mac");
    const modifierPressed = isApple ? event.metaKey : event.ctrlKey;
    if (!modifierPressed)
        return;
    if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
            if (historyIndex < history.length - 1)
                void restoreCanvas(historyIndex + 1);
        }
        else if (historyIndex > 0) {
            void restoreCanvas(historyIndex - 1);
        }
    }
    else if (event.key.toLowerCase() === "y" && historyIndex < history.length - 1) {
        event.preventDefault();
        void restoreCanvas(historyIndex + 1);
    }
});
document.addEventListener("keyup", (event) => {
    if (event.code !== "Space" || !isSpaceHandActive)
        return;
    isSpaceHandActive = false;
    updateCanvasCursor();
});
window.addEventListener("blur", () => {
    if (isSpaceHandActive) {
        isSpaceHandActive = false;
        updateCanvasCursor();
    }
    if (isDrawing)
        interruptDrawing();
    isPanning = false;
    panPointerId = null;
    lastPanPoint = null;
    canvas.classList.remove("is-panning");
    touchPoints.clear();
    pinchMidpoint = null;
    pinchDistance = 0;
    isTouchNavigationActive = false;
});
window.addEventListener("resize", layoutCanvasPaper);
updateSelectedColor(colorInput.value);
opacityValue.value = `${brushOpacityInput.value}%`;
fillToleranceValue.value = fillToleranceInput.value;
traceOpacityValue.value = `${traceOpacityInput.value}%`;
tracingGridSizeValue.value = `${tracingGridSizeInput.value} px`;
updateTracingControlOutputs();
initializeLessonCatalog();
renderLessonWorkspace();
layoutCanvasPaper();
viewport.fitToScreen(getViewportSize(), getArtworkSize());
applyViewport();
updateReferenceVisibility();
updateHistoryButtons();
void loadSavedDrawing()
    .catch((error) => {
    updateSaveStatus("Saved project couldn't be loaded");
    announce("Couldn't load saved work from this browser.");
    console.error("Could not initialize the drawing project.", error);
})
    .finally(() => {
    isProjectLoading = false;
    refreshLayerPanel();
    updateHistoryButtons();
    void refreshAssetLibrary();
});
