export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ArtworkRect extends Point, Size {}

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;

export class Viewport {
  zoom = 1;
  panX = 0;
  panY = 0;

  zoomAt(zoom: number, focalPoint: Point, viewportSize: Size): void {
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    const ratio = nextZoom / this.zoom;
    const centerX = focalPoint.x - viewportSize.width / 2;
    const centerY = focalPoint.y - viewportSize.height / 2;

    this.panX = centerX - (centerX - this.panX) * ratio;
    this.panY = centerY - (centerY - this.panY) * ratio;
    this.zoom = nextZoom;
  }

  panBy(deltaX: number, deltaY: number): void {
    this.panX += deltaX;
    this.panY += deltaY;
  }

  centerCanvas(): void {
    this.panX = 0;
    this.panY = 0;
  }

  resetView(): void {
    this.zoom = 1;
    this.centerCanvas();
  }

  fitToScreen(viewportSize: Size, artworkSize: Size, padding = 24): void {
    const availableWidth = Math.max(1, viewportSize.width - padding * 2);
    const availableHeight = Math.max(1, viewportSize.height - padding * 2);
    this.zoom = Math.max(
      MIN_ZOOM,
      Math.min(MAX_ZOOM, availableWidth / artworkSize.width, availableHeight / artworkSize.height),
    );
    this.centerCanvas();
  }

  centerOnArtworkPoint(point: Point, artworkSize: Size): void {
    this.panX = (artworkSize.width / 2 - point.x) * this.zoom;
    this.panY = (artworkSize.height / 2 - point.y) * this.zoom;
  }

  artworkToViewport(point: Point, viewportSize: Size, artworkSize: Size): Point {
    return {
      x:
        viewportSize.width / 2 +
        this.panX +
        (point.x - artworkSize.width / 2) * this.zoom,
      y:
        viewportSize.height / 2 +
        this.panY +
        (point.y - artworkSize.height / 2) * this.zoom,
    };
  }

  viewportToArtwork(point: Point, viewportSize: Size, artworkSize: Size): Point {
    return {
      x:
        (point.x - viewportSize.width / 2 - this.panX) / this.zoom +
        artworkSize.width / 2,
      y:
        (point.y - viewportSize.height / 2 - this.panY) / this.zoom +
        artworkSize.height / 2,
    };
  }

  getVisibleArtworkRect(viewportSize: Size, artworkSize: Size): ArtworkRect {
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
