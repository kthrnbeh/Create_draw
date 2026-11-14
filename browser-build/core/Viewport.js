export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;
export class Viewport {
    zoom = 1;
    panX = 0;
    panY = 0;
    zoomAt(zoom, focalPoint, viewportSize) {
        const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
        const ratio = nextZoom / this.zoom;
        const centerX = focalPoint.x - viewportSize.width / 2;
        const centerY = focalPoint.y - viewportSize.height / 2;
        this.panX = centerX - (centerX - this.panX) * ratio;
        this.panY = centerY - (centerY - this.panY) * ratio;
        this.zoom = nextZoom;
    }
    panBy(deltaX, deltaY) {
        this.panX += deltaX;
        this.panY += deltaY;
    }
    centerCanvas() {
        this.panX = 0;
        this.panY = 0;
    }
    resetView() {
        this.zoom = 1;
        this.centerCanvas();
    }
    fitToScreen(viewportSize, artworkSize, padding = 24) {
        const availableWidth = Math.max(1, viewportSize.width - padding * 2);
        const availableHeight = Math.max(1, viewportSize.height - padding * 2);
        this.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, availableWidth / artworkSize.width, availableHeight / artworkSize.height));
        this.centerCanvas();
    }
    centerOnArtworkPoint(point, artworkSize) {
        this.panX = (artworkSize.width / 2 - point.x) * this.zoom;
        this.panY = (artworkSize.height / 2 - point.y) * this.zoom;
    }
    artworkToViewport(point, viewportSize, artworkSize) {
        return {
            x: viewportSize.width / 2 +
                this.panX +
                (point.x - artworkSize.width / 2) * this.zoom,
            y: viewportSize.height / 2 +
                this.panY +
                (point.y - artworkSize.height / 2) * this.zoom,
        };
    }
    viewportToArtwork(point, viewportSize, artworkSize) {
        return {
            x: (point.x - viewportSize.width / 2 - this.panX) / this.zoom +
                artworkSize.width / 2,
            y: (point.y - viewportSize.height / 2 - this.panY) / this.zoom +
                artworkSize.height / 2,
        };
    }
    getVisibleArtworkRect(viewportSize, artworkSize) {
        const width = viewportSize.width / this.zoom;
        const height = viewportSize.height / this.zoom;
        const centerX = artworkSize.width / 2 - this.panX / this.zoom;
        const centerY = artworkSize.height / 2 - this.panY / this.zoom;
        return {
            x: centerX - width / 2,
            y: centerY - height / 2,
            width,
            height,
        };
    }
}
