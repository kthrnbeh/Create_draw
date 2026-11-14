import { generateOutline } from "./OutlineGenerator.js";
export class OutlineProcessor {
    worker = null;
    nextId = 0;
    pending = new Map();
    constructor() {
        if (typeof Worker === "undefined")
            return;
        try {
            this.worker = new Worker(new URL("./outline.worker.js", import.meta.url), {
                type: "module",
            });
            this.worker.addEventListener("message", (event) => {
                this.handleReply(event.data);
            });
            this.worker.addEventListener("error", () => {
                this.fallbackPendingRequests();
            });
        }
        catch (error) {
            console.error("Could not start the tracing worker; using main-thread processing.", error);
        }
    }
    process(source, settings) {
        if (!this.worker) {
            return Promise.resolve().then(() => generateOutline(source, settings));
        }
        this.nextId += 1;
        const id = this.nextId;
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject, source, settings });
            const pixels = new Uint8ClampedArray(source.data);
            const request = {
                id,
                image: { data: pixels, width: source.width, height: source.height },
                settings,
            };
            try {
                this.worker.postMessage(request, [pixels.buffer]);
            }
            catch {
                this.pending.delete(id);
                Promise.resolve()
                    .then(() => generateOutline(source, settings))
                    .then(resolve, reject);
            }
        });
    }
    handleReply(reply) {
        const pending = this.pending.get(reply.id);
        if (!pending)
            return;
        this.pending.delete(reply.id);
        if (reply.image) {
            pending.resolve(reply.image);
        }
        else {
            pending.reject(new Error(reply.error ?? "The tracing worker returned no image."));
        }
    }
    fallbackPendingRequests() {
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
