import { floodFillPixels } from "./floodFill.js";
import { MAX_ZOOM, MIN_ZOOM, Viewport } from "./core/Viewport.js";

type Tool =
  | "brush"
  | "eraser"
  | "eyedropper"
  | "bucket"
  | "hand"
  | "line"
  | "rectangle"
  | "circle"
  | "triangle"
  | "oval"
  | "arrow"
  | "star"
  | "heart"
  | "hexagon";

function getRequiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`The drawing app could not find ${selector}.`);
  }
  return element;
}

const canvas = getRequiredElement<HTMLCanvasElement>("#drawingCanvas");
function getCanvasContext(element: HTMLCanvasElement): CanvasRenderingContext2D {
  const drawingContext = element.getContext("2d");
  if (!drawingContext) {
    throw new Error("The drawing app could not create a 2D canvas context.");
  }
  return drawingContext;
}
const context = getCanvasContext(canvas);
const colorSampleCanvas = document.createElement("canvas");
colorSampleCanvas.width = canvas.width;
colorSampleCanvas.height = canvas.height;
const colorSampleContext = getCanvasContext(colorSampleCanvas);

const saveStatus = getRequiredElement<HTMLElement>("#saveStatus");
const appShell = getRequiredElement<HTMLDivElement>(".app-shell");
const canvasViewport = getRequiredElement<HTMLDivElement>("#canvasViewport");
const toolPicker = getRequiredElement<HTMLDivElement>("#toolPicker");
const toolPickerButton = getRequiredElement<HTMLButtonElement>("#toolPickerButton");
const toolPickerPanel = getRequiredElement<HTMLDivElement>("#toolPickerPanel");
const selectedToolName = getRequiredElement<HTMLSpanElement>("#selectedToolName");
const bucketSettings = getRequiredElement<HTMLDivElement>("#bucketSettings");
const canvasMessage = getRequiredElement<HTMLElement>("#canvasMessage");
const colorInput = getRequiredElement<HTMLInputElement>("#colorInput");
const colorValue = getRequiredElement<HTMLElement>("#colorValue");
const colorPreview = getRequiredElement<HTMLElement>("#colorPreview");
const sizeInput = getRequiredElement<HTMLInputElement>("#sizeInput");
const sizeValue = getRequiredElement<HTMLOutputElement>("#sizeValue");
const brushPresetInput = getRequiredElement<HTMLSelectElement>("#brushPreset");
const brushOpacityInput = getRequiredElement<HTMLInputElement>("#brushOpacity");
const opacityValue = getRequiredElement<HTMLOutputElement>("#opacityValue");
const fillToleranceInput = getRequiredElement<HTMLInputElement>("#fillTolerance");
const fillToleranceValue = getRequiredElement<HTMLOutputElement>("#fillToleranceValue");
const fillInput = getRequiredElement<HTMLInputElement>("#fillInput");
const backgroundInput = getRequiredElement<HTMLInputElement>("#backgroundInput");
const canvasPaper = getRequiredElement<HTMLElement>("#canvasPaper");
const traceInput = getRequiredElement<HTMLInputElement>("#traceInput");
const traceImage = getRequiredElement<HTMLImageElement>("#traceImage");
const removeTraceButton = getRequiredElement<HTMLButtonElement>("#removeTraceButton");
const centerImageButton = getRequiredElement<HTMLButtonElement>("#centerImageButton");
const undoButton = getRequiredElement<HTMLButtonElement>("#undoButton");
const redoButton = getRequiredElement<HTMLButtonElement>("#redoButton");
const clearButton = getRequiredElement<HTMLButtonElement>("#clearButton");
const saveButton = getRequiredElement<HTMLButtonElement>("#saveButton");
const minimizeButton = getRequiredElement<HTMLButtonElement>("#minimizeButton");
const minimizedWindow = getRequiredElement<HTMLDivElement>("#minimizedWindow");
const restoreButton = getRequiredElement<HTMLButtonElement>("#restoreButton");
const zoomOutButton = getRequiredElement<HTMLButtonElement>("#zoomOutButton");
const zoomInButton = getRequiredElement<HTMLButtonElement>("#zoomInButton");
const zoomValue = getRequiredElement<HTMLOutputElement>("#zoomValue");
const fitToScreenButton = getRequiredElement<HTMLButtonElement>("#fitToScreenButton");
const centerCanvasButton = getRequiredElement<HTMLButtonElement>("#centerCanvasButton");
const resetViewButton = getRequiredElement<HTMLButtonElement>("#resetViewButton");
const navigatorCanvas = getRequiredElement<HTMLCanvasElement>("#navigatorCanvas");
const navigatorResetButton = getRequiredElement<HTMLButtonElement>("#navigatorResetButton");
const navigatorContext = getCanvasContext(navigatorCanvas);

const storageKey = "create-draw-canvas-v1";
const maxHistoryEntries = 30;
const maxHistoryCharacters = 24 * 1024 * 1024;
const toolButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-tool]"));
const colorSwatches = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-color]"));
const toolLabels: Record<Tool, string> = {
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

interface SavedDrawing {
  drawing: string;
  background: string;
}

let activeTool: Tool = "brush";
let lastDrawingTool: Tool = "brush";
let isDrawing = false;
let isPanning = false;
let isFilling = false;
let isHistoryRestoring = false;
let isSpaceHandActive = false;
let startPoint = { x: 0, y: 0 };
let lastPanPoint: { x: number; y: number } | null = null;
let panPointerId: number | null = null;
let drawingPointerId: number | null = null;
let pinchMidpoint: { x: number; y: number } | null = null;
let pinchDistance = 0;
let isTouchNavigationActive = false;
const touchPoints = new Map<number, { x: number; y: number }>();
const viewport = new Viewport();
let drawingSnapshot: ImageData | null = null;
let gestureSnapshot: ImageData | null = null;
let traceObjectUrl: string | null = null;
let saveTimer: number | undefined;
let history: string[] = [];
let historyIndex = -1;
let historyCharacters = 0;

context.lineCap = "round";
context.lineJoin = "round";

function announce(message: string): void {
  canvasMessage.textContent = message;
  window.setTimeout(() => {
    if (canvasMessage.textContent === message) {
      canvasMessage.textContent = "";
    }
  }, 3000);
}

function updateHistoryButtons(): void {
  const isBusy = isFilling || isHistoryRestoring;
  undoButton.disabled = isBusy || historyIndex <= 0;
  redoButton.disabled = isBusy || historyIndex >= history.length - 1;
  clearButton.disabled = isBusy;
  saveButton.disabled = isBusy;
}

function rememberCanvas(): void {
  const snapshot = canvas.toDataURL("image/png");
  if (history[historyIndex] === snapshot) return;

  history = history.slice(0, historyIndex + 1);
  historyCharacters = history.reduce((total, entry) => total + entry.length, 0);
  history.push(snapshot);
  historyCharacters += snapshot.length;

  while (
    history.length > 1 &&
    (history.length > maxHistoryEntries || historyCharacters > maxHistoryCharacters)
  ) {
    const removed = history.shift();
    if (removed) historyCharacters -= removed.length;
  }

  historyIndex = history.length - 1;
  updateHistoryButtons();
  updateNavigator();
  scheduleSave();
}

async function restoreCanvas(index: number): Promise<void> {
  if (isFilling || isHistoryRestoring || index < 0 || index >= history.length) return;
  const snapshot = history[index];
  if (!snapshot) return;

  isHistoryRestoring = true;
  updateHistoryButtons();

  try {
    const image = new Image();
    image.src = snapshot;
    await image.decode();
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    historyIndex = index;
    updateNavigator();
    scheduleSave();
  } catch (error) {
    announce("Couldn't restore that history step.");
    console.error("Could not restore canvas history.", error);
  } finally {
    isHistoryRestoring = false;
    updateHistoryButtons();
  }
}

function getCanvasPoint(event: PointerEvent): { x: number; y: number } {
  return viewport.viewportToArtwork(
    getViewportPoint(event),
    getViewportSize(),
    getArtworkSize(),
  );
}

function getViewportPoint(event: PointerEvent | WheelEvent): { x: number; y: number } {
  const bounds = canvasViewport.getBoundingClientRect();
  return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
}

function getViewportSize(): { width: number; height: number } {
  return { width: canvasViewport.clientWidth, height: canvasViewport.clientHeight };
}

function getArtworkSize(): { width: number; height: number } {
  return { width: canvas.width, height: canvas.height };
}

function applyViewport(): void {
  canvasPaper.style.transform =
    `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`;
  zoomValue.value = `${Math.round(viewport.zoom * 100)}%`;
  zoomOutButton.disabled = viewport.zoom <= MIN_ZOOM;
  zoomInButton.disabled = viewport.zoom >= MAX_ZOOM;
  updateNavigator();
}

function layoutCanvasPaper(): void {
  const size = getViewportSize();
  if (size.width <= 0 || size.height <= 0) return;

  canvasPaper.style.width = `${canvas.width}px`;
  canvasPaper.style.height = `${canvas.height}px`;
  canvasPaper.style.left = `${(size.width - canvas.width) / 2}px`;
  canvasPaper.style.top = `${(size.height - canvas.height) / 2}px`;
  applyViewport();
}

function updateNavigator(): void {
  const viewportSize = getViewportSize();
  if (viewportSize.width <= 0 || viewportSize.height <= 0) return;

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

  if (right <= left || bottom <= top) return;

  navigatorContext.save();
  navigatorContext.strokeStyle = "#e27763";
  navigatorContext.lineWidth = 2;
  navigatorContext.fillStyle = "rgba(226, 119, 99, 0.12)";
  navigatorContext.fillRect(left, top, right - left, bottom - top);
  navigatorContext.strokeRect(left, top, right - left, bottom - top);
  navigatorContext.restore();
}

function applyBrushStyle(): void {
  let widthMultiplier = 1;
  let opacityMultiplier = 1;

  if (activeTool === "brush") {
    if (brushPresetInput.value === "pencil") {
      widthMultiplier = 0.75;
      opacityMultiplier = 0.58;
    } else if (brushPresetInput.value === "highlighter") {
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

function drawShape(point: { x: number; y: number }): void {
  if (!drawingSnapshot) return;

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
      context.ellipse(
        startPoint.x + width / 2,
        startPoint.y + height / 2,
        Math.abs(width / 2),
        Math.abs(height / 2),
        0,
        0,
        Math.PI * 2,
      );
      break;
    case "arrow": {
      const angle = Math.atan2(height, width);
      const headLength = 18;
      context.moveTo(startPoint.x, startPoint.y);
      context.lineTo(point.x, point.y);
      context.moveTo(point.x, point.y);
      context.lineTo(
        point.x - headLength * Math.cos(angle - Math.PI / 6),
        point.y - headLength * Math.sin(angle - Math.PI / 6),
      );
      context.moveTo(point.x, point.y);
      context.lineTo(
        point.x - headLength * Math.cos(angle + Math.PI / 6),
        point.y - headLength * Math.sin(angle + Math.PI / 6),
      );
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
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
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
      context.bezierCurveTo(
        left + heartWidth,
        top + heartHeight * 0.75,
        left + heartWidth,
        top + heartHeight * 0.25,
        left + heartWidth / 2,
        top + heartHeight * 0.35,
      );
      context.bezierCurveTo(
        left,
        top + heartHeight * 0.25,
        left,
        top + heartHeight * 0.75,
        left + heartWidth / 2,
        top + heartHeight,
      );
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
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
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
  } else {
    context.stroke();
  }
}

function drawImageContained(
  targetContext: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
): void {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  targetContext.drawImage(
    image,
    (width - drawWidth) / 2,
    (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
}

function colorToRgba(color: string): [number, number, number, number] {
  return [
    Number.parseInt(color.slice(1, 3), 16),
    Number.parseInt(color.slice(3, 5), 16),
    Number.parseInt(color.slice(5, 7), 16),
    255,
  ];
}

function updateSelectedColor(color: string): void {
  colorInput.value = color;
  colorValue.textContent = color.toUpperCase();
  colorPreview.style.backgroundColor = color;
}

function sampleVisibleColor(point: { x: number; y: number }): string {
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
  return `#${[pixel[0]!, pixel[1]!, pixel[2]!]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

async function fillCanvasRegion(point: { x: number; y: number }): Promise<void> {
  if (isFilling || isHistoryRestoring) return;

  isFilling = true;
  canvas.setAttribute("aria-busy", "true");
  updateHistoryButtons();

  try {
    const x = Math.max(0, Math.min(canvas.width - 1, Math.floor(point.x)));
    const y = Math.max(0, Math.min(canvas.height - 1, Math.floor(point.y)));
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const fillColor = colorToRgba(colorInput.value);
    const tolerance = Number(fillToleranceInput.value);
    const changed = await floodFillPixels(
      imageData.data,
      imageData.width,
      imageData.height,
      x,
      y,
      fillColor,
      tolerance,
    );

    if (!changed) {
      announce("That area already matches the selected color.");
      return;
    }

    context.putImageData(imageData, 0, 0);
    rememberCanvas();
    announce("Area filled.");
  } catch (error) {
    announce("Couldn't fill that area.");
    console.error("Paint bucket fill failed.", error);
  } finally {
    isFilling = false;
    canvas.removeAttribute("aria-busy");
    updateHistoryButtons();
  }
}

function setActiveTool(tool: Tool): void {
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

function updateCanvasCursor(): void {
  const handActive = activeTool === "hand" || isSpaceHandActive;
  canvas.classList.toggle("hand-cursor", handActive);
  canvas.classList.toggle("eraser-cursor", !handActive && activeTool === "eraser");
  canvas.classList.toggle("eyedropper-cursor", !handActive && activeTool === "eyedropper");
  canvas.classList.toggle("bucket-cursor", !handActive && activeTool === "bucket");
  canvas.classList.toggle(
    "shape-cursor",
    !handActive &&
      activeTool !== "brush" &&
      activeTool !== "eraser" &&
      activeTool !== "eyedropper" &&
      activeTool !== "bucket",
  );
}

function closeToolPicker(): void {
  toolPickerPanel.hidden = true;
  toolPickerButton.setAttribute("aria-expanded", "false");
}

toolPickerButton.addEventListener("click", (event: MouseEvent) => {
  event.stopPropagation();
  toolPickerPanel.hidden = !toolPickerPanel.hidden;
  toolPickerButton.setAttribute("aria-expanded", String(!toolPickerPanel.hidden));
});

toolPickerPanel.addEventListener("click", (event: MouseEvent) => {
  event.stopPropagation();
});

document.addEventListener("click", (event: MouseEvent) => {
  if (!(event.target instanceof Node) || !toolPicker.contains(event.target)) {
    closeToolPicker();
  }
});

function isTool(value: string | undefined): value is Tool {
  return value !== undefined && Object.hasOwn(toolLabels, value);
}

function updateSaveStatus(message: string): void {
  saveStatus.textContent = message;
}

function scheduleSave(): void {
  window.clearTimeout(saveTimer);
  updateSaveStatus("Saving…");
  saveTimer = window.setTimeout(() => {
    try {
      const savedDrawing: SavedDrawing = {
        drawing: canvas.toDataURL("image/png"),
        background: backgroundInput.value,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(savedDrawing));
      updateSaveStatus("Saved on this device");
    } catch (error) {
      updateSaveStatus("Could not save");
      announce("Your browser couldn't save this drawing. You can still download it as a PNG.");
      console.error("Could not save drawing to local storage.", error);
    }
  }, 400);
}

function loadSavedDrawing(): void {
  const savedValue = window.localStorage.getItem(storageKey);
  if (!savedValue) {
    rememberCanvas();
    return;
  }

  try {
    const savedDrawing = JSON.parse(savedValue) as SavedDrawing;
    if (
      typeof savedDrawing.drawing !== "string" ||
      typeof savedDrawing.background !== "string"
    ) {
      throw new Error("Saved drawing data has an unexpected format.");
    }

    backgroundInput.value = savedDrawing.background;
    canvasPaper.style.backgroundColor = savedDrawing.background;
    const image = new Image();
    image.onload = () => {
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const snapshot = canvas.toDataURL("image/png");
      history = [snapshot];
      historyCharacters = snapshot.length;
      historyIndex = 0;
      updateHistoryButtons();
      updateNavigator();
      updateSaveStatus("Your last drawing is back");
    };
    image.onerror = () => {
      window.localStorage.removeItem(storageKey);
      rememberCanvas();
      updateSaveStatus("Ready to draw");
      console.error("Could not load the saved drawing image.");
    };
    image.src = savedDrawing.drawing;
  } catch (error) {
    window.localStorage.removeItem(storageKey);
    rememberCanvas();
    updateSaveStatus("Ready to draw");
    console.error("Could not read the saved drawing.", error);
  }
}

for (const button of toolButtons) {
  button.addEventListener("click", () => {
    const tool = button.dataset.tool;
    if (isTool(tool)) setActiveTool(tool);
  });
}

function interruptDrawing(): void {
  if (gestureSnapshot) context.putImageData(gestureSnapshot, 0, 0);
  isDrawing = false;
  drawingPointerId = null;
  drawingSnapshot = null;
  gestureSnapshot = null;
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;
}

function getTouchGeometry(): { midpoint: { x: number; y: number }; distance: number } | null {
  const points = Array.from(touchPoints.values());
  if (points.length < 2) return null;

  const first = points[0]!;
  const second = points[1]!;
  return {
    midpoint: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
    distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
  };
}

canvas.addEventListener("pointerdown", (event: PointerEvent) => {
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

  if (event.button !== 0 || isFilling || isHistoryRestoring || isTouchNavigationActive) return;

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
    } catch (error) {
      announce("Couldn't sample the color at that point.");
      console.error("Eyedropper color sampling failed.", error);
    }
    return;
  }

  if (activeTool === "bucket") {
    void fillCanvasRegion(point);
    return;
  }

  canvas.setPointerCapture(event.pointerId);
  isDrawing = true;
  drawingPointerId = event.pointerId;
  startPoint = point;
  gestureSnapshot = context.getImageData(0, 0, canvas.width, canvas.height);
  applyBrushStyle();

  if (activeTool !== "brush" && activeTool !== "eraser") {
    drawingSnapshot = gestureSnapshot;
    return;
  }

  context.globalCompositeOperation = activeTool === "eraser" ? "destination-out" : "source-over";
  context.beginPath();
  context.moveTo(startPoint.x, startPoint.y);
  context.lineTo(startPoint.x + 0.1, startPoint.y + 0.1);
  context.stroke();
});

canvas.addEventListener("pointermove", (event: PointerEvent) => {
  if (event.pointerType === "touch" && touchPoints.has(event.pointerId)) {
    touchPoints.set(event.pointerId, getViewportPoint(event));
    if (isTouchNavigationActive) {
      const geometry = getTouchGeometry();
      if (geometry && pinchMidpoint && pinchDistance > 0) {
        const viewportSize = getViewportSize();
        viewport.zoomAt(
          viewport.zoom * (geometry.distance / pinchDistance),
          pinchMidpoint,
          viewportSize,
        );
        viewport.panBy(
          geometry.midpoint.x - pinchMidpoint.x,
          geometry.midpoint.y - pinchMidpoint.y,
        );
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

  if (!isDrawing || event.pointerId !== drawingPointerId) return;

  const point = getCanvasPoint(event);
  if (drawingSnapshot) {
    drawShape(point);
    return;
  }

  context.lineTo(point.x, point.y);
  context.stroke();
});

canvas.addEventListener("pointerup", (event: PointerEvent) => {
  if (event.pointerType === "touch") {
    touchPoints.delete(event.pointerId);
    if (touchPoints.size < 2) {
      pinchMidpoint = null;
      pinchDistance = 0;
    }
    if (touchPoints.size === 0) isTouchNavigationActive = false;
  }

  if (isPanning && event.pointerId === panPointerId) {
    isPanning = false;
    panPointerId = null;
    lastPanPoint = null;
    canvas.classList.remove("is-panning");
    return;
  }

  if (!isDrawing || event.pointerId !== drawingPointerId) return;

  if (drawingSnapshot) {
    drawShape(getCanvasPoint(event));
  }
  isDrawing = false;
  drawingPointerId = null;
  drawingSnapshot = null;
  gestureSnapshot = null;
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 1;
  rememberCanvas();
});

canvas.addEventListener("pointercancel", (event: PointerEvent) => {
  if (event.pointerType === "touch") {
    touchPoints.delete(event.pointerId);
    if (touchPoints.size < 2) {
      pinchMidpoint = null;
      pinchDistance = 0;
    }
    if (touchPoints.size === 0) isTouchNavigationActive = false;
  }

  if (event.pointerId === drawingPointerId) interruptDrawing();
  if (event.pointerId === panPointerId) {
    isPanning = false;
    panPointerId = null;
    lastPanPoint = null;
    canvas.classList.remove("is-panning");
  }
});

canvas.addEventListener("lostpointercapture", (event: PointerEvent) => {
  if (event.pointerType === "touch" && touchPoints.delete(event.pointerId)) {
    if (touchPoints.size < 2) {
      pinchMidpoint = null;
      pinchDistance = 0;
    }
    if (touchPoints.size === 0) isTouchNavigationActive = false;
  }
  if (event.pointerId === drawingPointerId) interruptDrawing();
  if (event.pointerId === panPointerId) {
    isPanning = false;
    panPointerId = null;
    lastPanPoint = null;
    canvas.classList.remove("is-panning");
  }
});

function zoomAtViewportPoint(zoom: number, focalPoint = {
  x: getViewportSize().width / 2,
  y: getViewportSize().height / 2,
}): void {
  viewport.zoomAt(zoom, focalPoint, getViewportSize());
  applyViewport();
}

function resetViewport(): void {
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

canvasViewport.addEventListener(
  "wheel",
  (event: WheelEvent) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const zoomFactor = Math.exp(-event.deltaY * 0.002);
    zoomAtViewportPoint(
      viewport.zoom * zoomFactor,
      getViewportPoint(event),
    );
  },
  { passive: false },
);

centerImageButton.addEventListener("click", () => {
  traceImage.style.objectPosition = "center center";
  traceImage.style.transform = "none";
  announce("Tracing image centered on the canvas.");
});

let navigatorDragging = false;
let navigatorLastPoint: { x: number; y: number } | null = null;

function getNavigatorPoint(event: PointerEvent): { x: number; y: number } {
  const bounds = navigatorCanvas.getBoundingClientRect();
  return {
    x: ((event.clientX - bounds.left) / bounds.width) * navigatorCanvas.width,
    y: ((event.clientY - bounds.top) / bounds.height) * navigatorCanvas.height,
  };
}

navigatorCanvas.addEventListener("pointerdown", (event: PointerEvent) => {
  if (event.button !== 0) return;
  event.preventDefault();
  navigatorCanvas.setPointerCapture(event.pointerId);
  const point = getNavigatorPoint(event);
  const visible = viewport.getVisibleArtworkRect(getViewportSize(), getArtworkSize());
  const scaleX = navigatorCanvas.width / canvas.width;
  const scaleY = navigatorCanvas.height / canvas.height;
  const isInsideViewport =
    point.x >= visible.x * scaleX &&
    point.x <= (visible.x + visible.width) * scaleX &&
    point.y >= visible.y * scaleY &&
    point.y <= (visible.y + visible.height) * scaleY;

  if (!isInsideViewport) {
    viewport.centerOnArtworkPoint(
      { x: point.x / scaleX, y: point.y / scaleY },
      getArtworkSize(),
    );
    applyViewport();
  }

  navigatorDragging = true;
  navigatorLastPoint = point;
});

navigatorCanvas.addEventListener("pointermove", (event: PointerEvent) => {
  if (!navigatorDragging || !navigatorLastPoint) return;
  const point = getNavigatorPoint(event);
  const deltaX = point.x - navigatorLastPoint.x;
  const deltaY = point.y - navigatorLastPoint.y;
  viewport.panBy(
    -deltaX * (canvas.width / navigatorCanvas.width) * viewport.zoom,
    -deltaY * (canvas.height / navigatorCanvas.height) * viewport.zoom,
  );
  navigatorLastPoint = point;
  applyViewport();
});

function stopNavigatorDrag(): void {
  navigatorDragging = false;
  navigatorLastPoint = null;
}

navigatorCanvas.addEventListener("pointerup", stopNavigatorDrag);
navigatorCanvas.addEventListener("pointercancel", stopNavigatorDrag);
navigatorCanvas.addEventListener("lostpointercapture", stopNavigatorDrag);
navigatorCanvas.addEventListener("keydown", (event: KeyboardEvent) => {
  const keyDeltas: Record<string, { x: number; y: number }> = {
    ArrowUp: { x: 0, y: 40 },
    ArrowDown: { x: 0, y: -40 },
    ArrowLeft: { x: 40, y: 0 },
    ArrowRight: { x: -40, y: 0 },
  };
  const delta = keyDeltas[event.key];
  if (!delta) return;
  event.preventDefault();
  viewport.panBy(delta.x, delta.y);
  applyViewport();
});

undoButton.addEventListener("click", () => {
  if (historyIndex > 0) void restoreCanvas(historyIndex - 1);
});

redoButton.addEventListener("click", () => {
  if (historyIndex < history.length - 1) void restoreCanvas(historyIndex + 1);
});

clearButton.addEventListener("click", () => {
  if (isFilling || isHistoryRestoring) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  rememberCanvas();
  announce("Canvas cleared.");
});

saveButton.addEventListener("click", () => {
  if (isFilling || isHistoryRestoring) return;
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
    if (!color) return;
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
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    announce("Choose an image file to use as a tracing guide.");
    traceInput.value = "";
    return;
  }

  if (traceObjectUrl) URL.revokeObjectURL(traceObjectUrl);
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

document.addEventListener("keydown", (event: KeyboardEvent) => {
  if (event.key === "Escape" && !toolPickerPanel.hidden) {
    closeToolPicker();
    toolPickerButton.focus();
    return;
  }

  if (
    event.code === "Space" &&
    !event.repeat &&
    !isDrawing &&
    !(event.target instanceof HTMLElement && event.target.closest("button, input, select, textarea"))
  ) {
    event.preventDefault();
    isSpaceHandActive = true;
    updateCanvasCursor();
  }

  const isApple = navigator.userAgent.includes("Mac");
  const modifierPressed = isApple ? event.metaKey : event.ctrlKey;
  if (!modifierPressed) return;

  if (event.key.toLowerCase() === "z") {
    event.preventDefault();
    if (event.shiftKey) {
      if (historyIndex < history.length - 1) void restoreCanvas(historyIndex + 1);
    } else if (historyIndex > 0) {
      void restoreCanvas(historyIndex - 1);
    }
  } else if (event.key.toLowerCase() === "y" && historyIndex < history.length - 1) {
    event.preventDefault();
    void restoreCanvas(historyIndex + 1);
  }
});

document.addEventListener("keyup", (event: KeyboardEvent) => {
  if (event.code !== "Space" || !isSpaceHandActive) return;
  isSpaceHandActive = false;
  updateCanvasCursor();
});

window.addEventListener("blur", () => {
  if (isSpaceHandActive) {
    isSpaceHandActive = false;
    updateCanvasCursor();
  }
  if (isDrawing) interruptDrawing();
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
loadSavedDrawing();
