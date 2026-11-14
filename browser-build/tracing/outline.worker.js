import { generateOutline } from "./OutlineGenerator.js";
self.onmessage = (event) => {
    const { id, image, settings } = event.data;
    try {
        const result = generateOutline(image, settings);
        self.postMessage({ id, image: result }, [result.data.buffer]);
    }
    catch (error) {
        self.postMessage({
            id,
            error: error instanceof Error ? error.message : "The tracing image could not be processed.",
        }, []);
    }
};
