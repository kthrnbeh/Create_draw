let generatedId = 0;
function createLayerId() {
    generatedId += 1;
    return `layer-${Date.now().toString(36)}-${generatedId.toString(36)}`;
}
export class LayerManager {
    width;
    height;
    items = [];
    activeId = "";
    createCanvas;
    constructor(width, height, createCanvas = () => document.createElement("canvas")) {
        this.width = width;
        this.height = height;
        if (width <= 0 || height <= 0) {
            throw new RangeError("Layer dimensions must be positive.");
        }
        this.createCanvas = createCanvas;
        const firstLayer = this.createRasterLayer("Layer 1");
        this.items.push(firstLayer);
        this.activeId = firstLayer.id;
    }
    get layers() {
        return this.items;
    }
    get activeLayer() {
        const layer = this.getLayer(this.activeId);
        if (!layer)
            throw new Error("The active raster layer no longer exists.");
        return layer;
    }
    get canEditActiveLayer() {
        return this.activeLayer.visible && !this.activeLayer.locked;
    }
    getLayer(id) {
        return this.items.find((layer) => layer.id === id);
    }
    setActiveLayer(id) {
        if (!this.getLayer(id))
            return false;
        this.activeId = id;
        return true;
    }
    addLayer(name) {
        const index = this.items.findIndex((layer) => layer.id === this.activeId);
        const layer = this.createRasterLayer(name?.trim() || this.nextLayerName());
        this.items.splice(index + 1, 0, layer);
        this.activeId = layer.id;
        return layer;
    }
    renameLayer(id, name) {
        const layer = this.getLayer(id);
        const normalizedName = name.trim().slice(0, 80);
        if (!layer || !normalizedName)
            return false;
        layer.name = normalizedName;
        return true;
    }
    duplicateLayer(id) {
        const source = this.getLayer(id);
        if (!source)
            return undefined;
        const duplicate = this.createRasterLayer(`${source.name} copy`);
        duplicate.visible = source.visible;
        duplicate.locked = source.locked;
        duplicate.opacity = source.opacity;
        duplicate.context.drawImage(source.canvas, 0, 0);
        const sourceIndex = this.items.indexOf(source);
        this.items.splice(sourceIndex + 1, 0, duplicate);
        this.activeId = duplicate.id;
        return duplicate;
    }
    deleteLayer(id) {
        if (this.items.length <= 1)
            return false;
        const index = this.items.findIndex((layer) => layer.id === id);
        if (index < 0)
            return false;
        const [removed] = this.items.splice(index, 1);
        if (removed?.id === this.activeId) {
            this.activeId = this.items[Math.min(index, this.items.length - 1)].id;
        }
        return true;
    }
    moveLayer(id, direction) {
        const index = this.items.findIndex((layer) => layer.id === id);
        const destination = index + direction;
        if (index < 0 || destination < 0 || destination >= this.items.length)
            return false;
        const [layer] = this.items.splice(index, 1);
        if (!layer)
            return false;
        this.items.splice(destination, 0, layer);
        return true;
    }
    setLayerVisible(id, visible) {
        const layer = this.getLayer(id);
        if (!layer)
            return false;
        layer.visible = visible;
        return true;
    }
    setLayerLocked(id, locked) {
        const layer = this.getLayer(id);
        if (!layer)
            return false;
        layer.locked = locked;
        return true;
    }
    setLayerOpacity(id, opacity) {
        const layer = this.getLayer(id);
        if (!layer || !Number.isFinite(opacity))
            return false;
        layer.opacity = Math.max(0, Math.min(1, opacity));
        return true;
    }
    clearLayer(id) {
        const layer = this.getLayer(id);
        if (!layer)
            return "missing";
        if (layer.locked)
            return "locked";
        if (this.isLayerEmpty(layer))
            return "empty";
        layer.context.clearRect(0, 0, this.width, this.height);
        return "cleared";
    }
    clearEditableLayers() {
        const clearedLayerIds = [];
        const lockedLayerIds = [];
        for (const layer of this.items) {
            if (layer.locked) {
                lockedLayerIds.push(layer.id);
            }
            else if (!this.isLayerEmpty(layer)) {
                layer.context.clearRect(0, 0, this.width, this.height);
                clearedLayerIds.push(layer.id);
            }
        }
        return { clearedLayerIds, lockedLayerIds };
    }
    mergeDown(id) {
        const topIndex = this.items.findIndex((layer) => layer.id === id);
        const top = this.items[topIndex];
        const below = this.items[topIndex - 1];
        if (!top ||
            !below ||
            !top.visible ||
            top.locked ||
            !below.visible ||
            below.locked ||
            below.opacity !== 1) {
            return false;
        }
        const mergedCanvas = this.createLayerCanvas();
        const mergedContext = this.getLayerContext(mergedCanvas);
        mergedContext.drawImage(below.canvas, 0, 0);
        mergedContext.globalAlpha = top.opacity;
        mergedContext.drawImage(top.canvas, 0, 0);
        mergedContext.globalAlpha = 1;
        below.context.clearRect(0, 0, this.width, this.height);
        below.context.drawImage(mergedCanvas, 0, 0);
        below.opacity = 1;
        this.items.splice(topIndex, 1);
        this.activeId = below.id;
        return true;
    }
    flattenArtwork() {
        const flattenedCanvas = this.createLayerCanvas();
        const flattenedContext = this.getLayerContext(flattenedCanvas);
        this.render(flattenedContext);
        const flattened = this.createRasterLayer("Flattened Artwork");
        flattened.context.drawImage(flattenedCanvas, 0, 0);
        this.items.splice(0, this.items.length, flattened);
        this.activeId = flattened.id;
        return flattened;
    }
    render(targetContext) {
        targetContext.save();
        targetContext.globalCompositeOperation = "source-over";
        targetContext.globalAlpha = 1;
        targetContext.clearRect(0, 0, this.width, this.height);
        for (const layer of this.items) {
            if (!layer.visible || layer.opacity <= 0)
                continue;
            targetContext.globalAlpha = layer.opacity;
            targetContext.drawImage(layer.canvas, 0, 0);
        }
        targetContext.restore();
    }
    serialize() {
        return {
            activeLayerId: this.activeId,
            layers: this.items.map((layer) => ({
                id: layer.id,
                name: layer.name,
                visible: layer.visible,
                locked: layer.locked,
                opacity: layer.opacity,
                imageData: layer.canvas.toDataURL("image/png"),
            })),
        };
    }
    async restore(state) {
        if (!isSerializedLayerState(state)) {
            throw new Error("The saved layer data is invalid.");
        }
        const restoredLayers = [];
        for (const serialized of state.layers) {
            const layer = this.createRasterLayer(serialized.name, serialized.id);
            const image = new Image();
            image.src = serialized.imageData;
            await image.decode();
            layer.context.drawImage(image, 0, 0, this.width, this.height);
            layer.visible = serialized.visible;
            layer.locked = serialized.locked;
            layer.opacity = serialized.opacity;
            restoredLayers.push(layer);
        }
        this.items.splice(0, this.items.length, ...restoredLayers);
        this.activeId = state.activeLayerId;
    }
    createRasterLayer(name, id = createLayerId()) {
        const canvas = this.createLayerCanvas();
        const context = this.getLayerContext(canvas);
        context.lineCap = "round";
        context.lineJoin = "round";
        return {
            id,
            name,
            visible: true,
            locked: false,
            opacity: 1,
            canvas,
            context,
        };
    }
    createLayerCanvas() {
        const canvas = this.createCanvas();
        canvas.width = this.width;
        canvas.height = this.height;
        return canvas;
    }
    getLayerContext(canvas) {
        const context = canvas.getContext("2d");
        if (!context)
            throw new Error("The drawing app could not create a raster layer.");
        return context;
    }
    isLayerEmpty(layer) {
        const pixels = layer.context.getImageData(0, 0, this.width, this.height).data;
        for (let alpha = 3; alpha < pixels.length; alpha += 4) {
            if (pixels[alpha] !== 0)
                return false;
        }
        return true;
    }
    nextLayerName() {
        let number = this.items.length + 1;
        while (this.items.some((layer) => layer.name === `Layer ${number}`))
            number += 1;
        return `Layer ${number}`;
    }
}
export function isSerializedRasterLayer(value) {
    if (!value || typeof value !== "object")
        return false;
    const layer = value;
    return (typeof layer.id === "string" &&
        layer.id.length > 0 &&
        typeof layer.name === "string" &&
        layer.name.trim().length > 0 &&
        typeof layer.visible === "boolean" &&
        typeof layer.locked === "boolean" &&
        typeof layer.opacity === "number" &&
        Number.isFinite(layer.opacity) &&
        layer.opacity >= 0 &&
        layer.opacity <= 1 &&
        typeof layer.imageData === "string" &&
        layer.imageData.startsWith("data:image/png;base64,"));
}
export function isSerializedLayerState(value) {
    if (!value || typeof value !== "object")
        return false;
    const state = value;
    return (typeof state.activeLayerId === "string" &&
        Array.isArray(state.layers) &&
        state.layers.length > 0 &&
        state.layers.every(isSerializedRasterLayer) &&
        new Set(state.layers.map((layer) => layer.id)).size === state.layers.length &&
        state.layers.some((layer) => layer.id === state.activeLayerId));
}
