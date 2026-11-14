import { floodFillPixels } from "./floodFill.js";
import { MAX_ZOOM, MIN_ZOOM, Viewport } from "./core/Viewport.js";
import { LayerManager } from "./layers/LayerManager.js";
import { createProjectDocument, isLegacySavedDrawing, isProjectDocument, } from "./storage/ProjectDocument.js";
import { BRUSH_PRESETS, drawBrushSegment, } from "./tools/BrushStrokes.js";
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
let context = layerManager.activeLayer.context;
const colorSampleCanvas = document.createElement("canvas");
colorSampleCanvas.width = canvas.width;
colorSampleCanvas.height = canvas.height;
const colorSampleContext = getCanvasContext(colorSampleCanvas);
const saveStatus = getRequiredElement("#saveStatus");
const appShell = getRequiredElement(".app-shell");
const canvasViewport = getRequiredElement("#canvasViewport");
const toolPicker = getRequiredElement("#toolPicker");
const toolPickerButton = getRequiredElement("#toolPickerButton");
const toolPickerPanel = getRequiredElement("#toolPickerPanel");
const selectedToolName = getRequiredElement("#selectedToolName");
const bucketSettings = getRequiredElement("#bucketSettings");
const canvasMessage = getRequiredElement("#canvasMessage");
const colorInput = getRequiredElement("#colorInput");
const colorValue = getRequiredElement("#colorValue");
const colorPreview = getRequiredElement("#colorPreview");
const sizeInput = getRequiredElement("#sizeInput");
const sizeValue = getRequiredElement("#sizeValue");
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
const undoButton = getRequiredElement("#undoButton");
const redoButton = getRequiredElement("#redoButton");
const clearButton = getRequiredElement("#clearButton");
const saveButton = getRequiredElement("#saveButton");
const minimizeButton = getRequiredElement("#minimizeButton");
const minimizedWindow = getRequiredElement("#minimizedWindow");
const restoreButton = getRequiredElement("#restoreButton");
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
let isDrawing = false;
let isPanning = false;
let isFilling = false;
let isHistoryRestoring = false;
let isProjectLoading = true;
let isSpaceHandActive = false;
let startPoint = { x: 0, y: 0 };
let previousBrushPoint = null;
let lastPanPoint = null;
let panPointerId = null;
let drawingPointerId = null;
let pinchMidpoint = null;
let pinchDistance = 0;
let isTouchNavigationActive = false;
const touchPoints = new Map();
const viewport = new Viewport();
let drawingSnapshot = null;
let gestureSnapshot = null;
let traceObjectUrl = null;
let saveTimer;
let history = [];
let historyIndex = -1;
let historyCharacters = 0;
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
    clearButton.disabled = isBusy;
    saveButton.disabled = isBusy;
    backgroundInput.disabled = isBusy;
    updateLayerActionAvailability();
}
function createCurrentProject(updatedAt) {
    return createProjectDocument(projectId, projectName, canvas.width, canvas.height, backgroundInput.value, layerManager.serialize(), updatedAt);
}
function renderLayers() {
    layerManager.render(displayContext);
    updateNavigator();
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
        refreshLayerPanel();
        renderLayers();
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
    if (!traceImage.hidden && traceImage.complete && traceImage.naturalWidth > 0) {
        navigatorContext.globalAlpha = 0.28;
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
    if (!traceImage.hidden && traceImage.complete && traceImage.naturalWidth > 0) {
        colorSampleContext.globalAlpha = 0.28;
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
        const imageData = targetContext.getImageData(0, 0, canvas.width, canvas.height);
        const fillColor = colorToRgba(colorInput.value);
        const tolerance = Number(fillToleranceInput.value);
        const changed = await floodFillPixels(imageData.data, imageData.width, imageData.height, x, y, fillColor, tolerance);
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
    activeTool = tool;
    if (tool !== "eyedropper" && tool !== "bucket" && tool !== "hand") {
        lastDrawingTool = tool;
    }
    selectedToolName.textContent = toolLabels[tool];
    bucketSettings.hidden = tool !== "bucket";
    closeToolPicker();
    for (const button of toolButtons) {
        const selected = button.dataset.tool === tool;
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));
    }
    updateCanvasCursor();
}
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
            renderLayers();
            refreshLayerPanel();
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
clearButton.addEventListener("click", () => {
    if (isFilling || isHistoryRestoring || isProjectLoading)
        return;
    if (!layerManager.canEditActiveLayer) {
        announce("Unlock and show the selected layer before clearing it.");
        return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    renderLayers();
    rememberCanvas();
    announce("Canvas cleared.");
});
saveButton.addEventListener("click", () => {
    if (isFilling || isHistoryRestoring || isProjectLoading)
        return;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportContext = exportCanvas.getContext("2d");
    if (!exportContext) {
        announce("Couldn't prepare the image for download.");
        return;
    }
    exportContext.fillStyle = backgroundInput.value;
    exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    if (!traceImage.hidden && traceImage.complete) {
        exportContext.globalAlpha = 0.3;
        drawImageContained(exportContext, traceImage, exportCanvas.width, exportCanvas.height);
        exportContext.globalAlpha = 1;
    }
    exportContext.drawImage(canvas, 0, 0);
    const downloadLink = document.createElement("a");
    downloadLink.download = "my-drawing.png";
    downloadLink.href = exportCanvas.toDataURL("image/png");
    downloadLink.click();
    announce("Your drawing downloaded as a PNG.");
});
minimizeButton.addEventListener("click", () => {
    appShell.classList.add("is-minimized");
    minimizedWindow.hidden = false;
    restoreButton.focus();
});
restoreButton.addEventListener("click", () => {
    appShell.classList.remove("is-minimized");
    minimizedWindow.hidden = true;
    minimizeButton.focus();
});
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
});
backgroundInput.addEventListener("input", () => {
    canvasPaper.style.backgroundColor = backgroundInput.value;
    updateNavigator();
    scheduleSave();
});
traceInput.addEventListener("change", () => {
    const file = traceInput.files?.[0];
    if (!file)
        return;
    if (!file.type.startsWith("image/")) {
        announce("Choose an image file to use as a tracing guide.");
        traceInput.value = "";
        return;
    }
    if (traceObjectUrl)
        URL.revokeObjectURL(traceObjectUrl);
    traceObjectUrl = URL.createObjectURL(file);
    traceImage.src = traceObjectUrl;
    traceImage.hidden = false;
    removeTraceButton.hidden = false;
    centerImageButton.hidden = false;
    announce("Tracing guide added. It won't cover your drawing.");
    updateNavigator();
});
traceImage.addEventListener("load", updateNavigator);
removeTraceButton.addEventListener("click", () => {
    traceImage.hidden = true;
    traceImage.removeAttribute("src");
    removeTraceButton.hidden = true;
    centerImageButton.hidden = true;
    traceInput.value = "";
    if (traceObjectUrl) {
        URL.revokeObjectURL(traceObjectUrl);
        traceObjectUrl = null;
    }
    updateNavigator();
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !toolPickerPanel.hidden) {
        closeToolPicker();
        toolPickerButton.focus();
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
layoutCanvasPaper();
viewport.fitToScreen(getViewportSize(), getArtworkSize());
applyViewport();
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
});
