export type BrushPreset =
  | "pencil"
  | "marker"
  | "highlighter"
  | "fine-liner"
  | "fountain-pen"
  | "calligraphy"
  | "watercolor"
  | "charcoal"
  | "crayon"
  | "paintbrush"
  | "airbrush";

export const BRUSH_PRESETS = [
  "pencil",
  "marker",
  "highlighter",
  "fine-liner",
  "fountain-pen",
  "calligraphy",
  "watercolor",
  "charcoal",
  "crayon",
  "paintbrush",
  "airbrush",
] as const satisfies readonly BrushPreset[];

export interface BrushStrokeOptions {
  preset: BrushPreset;
  width: number;
  color: string;
  opacity: number;
}

interface Point {
  x: number;
  y: number;
}

function boundedOpacity(opacity: number): number {
  return Math.max(0, Math.min(1, opacity));
}

function drawLine(
  context: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  color: string,
  width: number,
  opacity: number,
  cap: CanvasLineCap = "round",
  filter = "none",
): void {
  context.save();
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = boundedOpacity(opacity);
  context.strokeStyle = color;
  context.lineWidth = Math.max(0.65, width);
  context.lineCap = cap;
  context.lineJoin = "round";
  context.filter = filter;
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(
    Math.abs(end.x - start.x) + Math.abs(end.y - start.y) < 0.01
      ? start.x + 0.01
      : end.x,
    Math.abs(end.x - start.x) + Math.abs(end.y - start.y) < 0.01
      ? start.y + 0.01
      : end.y,
  );
  context.stroke();
  context.restore();
}

function offsetSegment(start: Point, end: Point, offset: number): [Point, Point] {
  const length = Math.hypot(end.x - start.x, end.y - start.y) || 1;
  const normalX = -(end.y - start.y) / length;
  const normalY = (end.x - start.x) / length;
  return [
    { x: start.x + normalX * offset, y: start.y + normalY * offset },
    { x: end.x + normalX * offset, y: end.y + normalY * offset },
  ];
}

function drawCharcoal(
  context: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  options: BrushStrokeOptions,
): void {
  drawLine(context, start, end, options.color, options.width * 1.15, options.opacity * 0.48);

  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const samples = Math.max(1, Math.ceil(distance / Math.max(2, options.width * 0.4)));
  context.save();
  context.fillStyle = options.color;
  for (let index = 0; index <= samples; index += 1) {
    const progress = index / samples;
    const x = start.x + (end.x - start.x) * progress;
    const y = start.y + (end.y - start.y) * progress;

    for (let fleck = 0; fleck < 2; fleck += 1) {
      const noise = Math.sin((x + index * 17.1) * 12.9898 + (y + fleck * 9.2) * 78.233) * 43758.5453;
      const random = noise - Math.floor(noise);
      const offset = (random - 0.5) * options.width * 1.1;
      const radius = Math.max(0.4, options.width * (0.025 + random * 0.07));
      context.globalAlpha = boundedOpacity(options.opacity * (0.14 + random * 0.2));
      context.beginPath();
      context.arc(x + offset, y - offset * 0.35, radius, 0, Math.PI * 2);
      context.fill();
    }
  }
  context.restore();
}

function drawAirbrush(
  context: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  options: BrushStrokeOptions,
): void {
  const channels = [
    Number.parseInt(options.color.slice(1, 3), 16),
    Number.parseInt(options.color.slice(3, 5), 16),
    Number.parseInt(options.color.slice(5, 7), 16),
  ];
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const spacing = Math.max(2, options.width * 0.24);
  const samples = Math.max(1, Math.ceil(distance / spacing));
  const radius = Math.max(2, options.width * 1.7);

  context.save();
  for (let index = 0; index <= samples; index += 1) {
    const progress = index / samples;
    const x = start.x + (end.x - start.x) * progress;
    const y = start.y + (end.y - start.y) * progress;
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${channels.join(",")},${boundedOpacity(options.opacity * 0.15)})`);
    gradient.addColorStop(0.45, `rgba(${channels.join(",")},${boundedOpacity(options.opacity * 0.065)})`);
    gradient.addColorStop(1, `rgba(${channels.join(",")},0)`);
    context.fillStyle = gradient;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  context.restore();
}

export function drawBrushSegment(
  context: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  options: BrushStrokeOptions,
): void {
  const width = Math.max(1, options.width);
  const opacity = boundedOpacity(options.opacity);
  const angle = Math.atan2(end.y - start.y, end.x - start.x);

  switch (options.preset) {
    case "pencil": {
      drawLine(context, start, end, options.color, width * 0.7, opacity * 0.68);
      const [grainStart, grainEnd] = offsetSegment(start, end, width * 0.08);
      drawLine(context, grainStart, grainEnd, options.color, width * 0.26, opacity * 0.22);
      break;
    }
    case "marker":
      drawLine(context, start, end, options.color, width * 1.15, opacity);
      break;
    case "highlighter":
      drawLine(context, start, end, options.color, width * 2.15, opacity * 0.22, "butt");
      break;
    case "fine-liner":
      drawLine(context, start, end, options.color, Math.max(0.85, width * 0.28), opacity);
      break;
    case "fountain-pen": {
      const nibWidth = width * (0.36 + 0.64 * Math.abs(Math.sin(angle - Math.PI / 4)));
      drawLine(context, start, end, options.color, nibWidth, opacity);
      break;
    }
    case "calligraphy": {
      const nibWidth = width * (0.14 + 0.86 * Math.abs(Math.sin(angle - Math.PI / 4)));
      drawLine(context, start, end, options.color, nibWidth, opacity, "butt");
      break;
    }
    case "watercolor": {
      drawLine(context, start, end, options.color, width * 2.4, opacity * 0.1, "round", "blur(1.4px)");
      drawLine(context, start, end, options.color, width * 1.45, opacity * 0.18, "round", "blur(0.5px)");
      drawLine(context, start, end, options.color, width * 0.72, opacity * 0.12);
      break;
    }
    case "charcoal":
      drawCharcoal(context, start, end, { ...options, width, opacity });
      break;
    case "crayon": {
      drawLine(context, start, end, options.color, width * 1.35, opacity * 0.32);
      context.save();
      context.setLineDash([Math.max(1, width * 0.55), Math.max(1, width * 0.42)]);
      drawLine(context, start, end, options.color, width * 0.78, opacity * 0.82);
      context.restore();
      break;
    }
    case "paintbrush": {
      drawLine(context, start, end, options.color, width * 1.45, opacity * 0.78);
      for (const offsetRatio of [-0.32, -0.16, 0, 0.16, 0.32]) {
        const [bristleStart, bristleEnd] = offsetSegment(start, end, width * offsetRatio);
        drawLine(
          context,
          bristleStart,
          bristleEnd,
          options.color,
          Math.max(0.55, width * 0.055),
          opacity * 0.45,
        );
      }
      break;
    }
    case "airbrush":
      drawAirbrush(context, start, end, { ...options, width, opacity });
      break;
  }
}
