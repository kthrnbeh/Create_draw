import { generateOutline, type RasterImageData, type TracingSettings } from "./OutlineGenerator.js";

interface ProcessRequest {
  id: number;
  image: RasterImageData;
  settings: TracingSettings;
}

interface ProcessReply {
  id: number;
  image?: RasterImageData;
  error?: string;
}

interface PendingProcess {
  resolve: (image: RasterImageData) => void;
  reject: (error: Error) => void;
  source: RasterImageData;
  settings: TracingSettings;
}

export class OutlineProcessor {
  private worker: Worker | null = null;
  private nextId = 0;
  private readonly pending = new Map<number, PendingProcess>();

  constructor() {
    if (typeof Worker === "undefined") return;
    try {
      this.worker = new Worker(new URL("./outline.worker.js", import.meta.url), {
        type: "module",
      });
      this.worker.addEventListener("message", (event: MessageEvent<ProcessReply>) => {
        this.handleReply(event.data);
      });
      this.worker.addEventListener("error", () => {
        this.fallbackPendingRequests();
      });
    } catch (error) {
      console.error("Could not start the tracing worker; using main-thread processing.", error);
    }
  }

  process(
    source: RasterImageData,
    settings: TracingSettings,
  ): Promise<RasterImageData> {
    if (!this.worker) {
      return Promise.resolve().then(() => generateOutline(source, settings));
    }

    this.nextId += 1;
    const id = this.nextId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, source, settings });
      const pixels = new Uint8ClampedArray(source.data);
      const request: ProcessRequest = {
        id,
        image: { data: pixels, width: source.width, height: source.height },
        settings,
      };
      try {
        this.worker!.postMessage(request, [pixels.buffer]);
      } catch {
        this.pending.delete(id);
        Promise.resolve()
          .then(() => generateOutline(source, settings))
          .then(resolve, reject);
      }
    });
  }

  private handleReply(reply: ProcessReply): void {
    const pending = this.pending.get(reply.id);
    if (!pending) return;
    this.pending.delete(reply.id);
    if (reply.image) {
      pending.resolve(reply.image);
    } else {
      pending.reject(new Error(reply.error ?? "The tracing worker returned no image."));
    }
  }

  private fallbackPendingRequests(): void {
    this.worker?.terminate();
    this.worker = null;
    for (const [id, pending] of this.pending) {
      this.pending.delete(id);
      Promise.resolve()
        .then(() => generateOutline(pending.source, pending.settings))
        .then(pending.resolve, pending.reject);
    }
  }
}
