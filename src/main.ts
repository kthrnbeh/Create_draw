type Tool =
  | "brush"
  | "eraser"
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

const saveStatus = getRequiredElement<HTMLElement>("#saveStatus");
const appShell = getRequiredElement<HTMLDivElement>(".app-shell");
const toolPicker = getRequiredElement<HTMLDivElement>("#toolPicker");
const toolPickerButton = getRequiredElement<HTMLButtonElement>("#toolPickerButton");
const toolPickerPanel = getRequiredElement<HTMLDivElement>("#toolPickerPanel");
const selectedToolName = getRequiredElement<HTMLSpanElement>("#selectedToolName");
const canvasMessage = getRequiredElement<HTMLElement>("#canvasMessage");
const colorInput = getRequiredElement<HTMLInputElement>("#colorInput");
const colorValue = getRequiredElement<HTMLElement>("#colorValue");
const sizeInput = getRequiredElement<HTMLInputElement>("#sizeInput");
const sizeValue = getRequiredElement<HTMLOutputElement>("#sizeValue");
const fillInput = getRequiredElement<HTMLInputElement>("#fillInput");
const backgroundInput = getRequiredElement<HTMLInputElement>("#backgroundInput");
const canvasPaper = getRequiredElement<HTMLElement>("#canvasPaper");
const traceInput = getRequiredElement<HTMLInputElement>("#traceInput");
const traceImage = getRequiredElement<HTMLImageElement>("#traceImage");
const removeTraceButton = getRequiredElement<HTMLButtonElement>("#removeTraceButton");
const undoButton = getRequiredElement<HTMLButtonElement>("#undoButton");
const redoButton = getRequiredElement<HTMLButtonElement>("#redoButton");
const clearButton = getRequiredElement<HTMLButtonElement>("#clearButton");
const saveButton = getRequiredElement<HTMLButtonElement>("#saveButton");
const minimizeButton = getRequiredElement<HTMLButtonElement>("#minimizeButton");
const minimizedWindow = getRequiredElement<HTMLDivElement>("#minimizedWindow");
const restoreButton = getRequiredElement<HTMLButtonElement>("#restoreButton");

const storageKey = "create-draw-canvas-v1";
const maxHistoryEntries = 30;
const toolButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-tool]"));
const colorSwatches = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-color]"));
const toolLabels: Record<Tool, string> = {
  brush: "Brush",
  eraser: "Eraser",
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
let isDrawing = false;
let startPoint = { x: 0, y: 0 };
let drawingSnapshot: ImageData | null = null;
let gestureSnapshot: ImageData | null = null;
let traceObjectUrl: string | null = null;
let saveTimer: number | undefined;
let history: ImageData[] = [];
let historyIndex = -1;

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
  undoButton.disabled = historyIndex <= 0;
  redoButton.disabled = historyIndex >= history.length - 1;
}

function rememberCanvas(): void {
  history = history.slice(0, historyIndex + 1);
  history.push(context.getImageData(0, 0, canvas.width, canvas.height));

  if (history.length > maxHistoryEntries) {
    history.shift();
  }

  historyIndex = history.length - 1;
  updateHistoryButtons();
  scheduleSave();
}

function restoreCanvas(index: number): void {
  const image = history[index];
  if (!image) return;

  context.putImageData(image, 0, 0);
  historyIndex = index;
  updateHistoryButtons();
  scheduleSave();
}

function getCanvasPoint(event: PointerEvent): { x: number; y: number } {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
    y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
  };
}

function applyBrushStyle(): void {
  context.lineWidth = Number(sizeInput.value);
  context.strokeStyle = colorInput.value;
  context.fillStyle = colorInput.value;
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

function setActiveTool(tool: Tool): void {
  activeTool = tool;
  selectedToolName.textContent = toolLabels[tool];
  closeToolPicker();

  for (const button of toolButtons) {
    const selected = button.dataset.tool === tool;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  }

  canvas.classList.toggle("eraser-cursor", tool === "eraser");
  canvas.classList.toggle("shape-cursor", tool !== "brush" && tool !== "eraser");
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
      history = [context.getImageData(0, 0, canvas.width, canvas.height)];
      historyIndex = 0;
      updateHistoryButtons();
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

canvas.addEventListener("pointerdown", (event: PointerEvent) => {
  if (event.button !== 0) return;

  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  isDrawing = true;
  startPoint = getCanvasPoint(event);
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
  if (!isDrawing) return;

  const point = getCanvasPoint(event);
  if (drawingSnapshot) {
    drawShape(point);
    return;
  }

  context.lineTo(point.x, point.y);
  context.stroke();
});

canvas.addEventListener("pointerup", (event: PointerEvent) => {
  if (!isDrawing) return;

  if (drawingSnapshot) {
    drawShape(getCanvasPoint(event));
  }
  isDrawing = false;
  drawingSnapshot = null;
  gestureSnapshot = null;
  context.globalCompositeOperation = "source-over";
  rememberCanvas();
});

canvas.addEventListener("pointercancel", () => {
  if (gestureSnapshot) {
    context.putImageData(gestureSnapshot, 0, 0);
  }
  isDrawing = false;
  drawingSnapshot = null;
  gestureSnapshot = null;
  context.globalCompositeOperation = "source-over";
});

undoButton.addEventListener("click", () => {
  if (historyIndex > 0) restoreCanvas(historyIndex - 1);
});

redoButton.addEventListener("click", () => {
  if (historyIndex < history.length - 1) restoreCanvas(historyIndex + 1);
});

clearButton.addEventListener("click", () => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  rememberCanvas();
  announce("Canvas cleared.");
});

saveButton.addEventListener("click", () => {
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
  colorValue.textContent = colorInput.value.toUpperCase();
});

for (const swatch of colorSwatches) {
  swatch.addEventListener("click", () => {
    const color = swatch.dataset.color;
    if (!color) return;
    colorInput.value = color;
    colorValue.textContent = color.toUpperCase();
  });
}

sizeInput.addEventListener("input", () => {
  sizeValue.value = `${sizeInput.value} px`;
});

backgroundInput.addEventListener("input", () => {
  canvasPaper.style.backgroundColor = backgroundInput.value;
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
  announce("Tracing guide added. It won't cover your drawing.");
});

removeTraceButton.addEventListener("click", () => {
  traceImage.hidden = true;
  traceImage.removeAttribute("src");
  removeTraceButton.hidden = true;
  traceInput.value = "";

  if (traceObjectUrl) {
    URL.revokeObjectURL(traceObjectUrl);
    traceObjectUrl = null;
  }
});

document.addEventListener("keydown", (event: KeyboardEvent) => {
  if (event.key === "Escape" && !toolPickerPanel.hidden) {
    closeToolPicker();
    toolPickerButton.focus();
    return;
  }

  const isApple = navigator.userAgent.includes("Mac");
  const modifierPressed = isApple ? event.metaKey : event.ctrlKey;
  if (!modifierPressed) return;

  if (event.key.toLowerCase() === "z") {
    event.preventDefault();
    if (event.shiftKey) {
      if (historyIndex < history.length - 1) restoreCanvas(historyIndex + 1);
    } else if (historyIndex > 0) {
      restoreCanvas(historyIndex - 1);
    }
  } else if (event.key.toLowerCase() === "y" && historyIndex < history.length - 1) {
    event.preventDefault();
    restoreCanvas(historyIndex + 1);
  }
});

loadSavedDrawing();
