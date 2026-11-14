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

declare const self: {
  onmessage: ((event: MessageEvent<ProcessRequest>) => void) | null;
  postMessage(message: ProcessReply, transfer: Transferable[]): void;
};

self.onmessage = (event) => {
  const { id, image, settings } = event.data;
  try {
    const result = generateOutline(image, settings);
    self.postMessage({ id, image: result }, [result.data.buffer]);
  } catch (error) {
    self.postMessage({
      id,
      error: error instanceof Error ? error.message : "The tracing image could not be processed.",
    }, []);
  }
};
