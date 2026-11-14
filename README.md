# Create Draw

A personal drawing app built in this repository, inspired by the tools and ideas in the school project—but developed independently here.

## Get started

1. Install [Node.js](https://nodejs.org/).
2. In this folder, run `npm install`.
3. Run `npm run dev` and open the local address Vite prints. It does not open a browser window automatically.

You can also open `index.html` with VS Code Live Server. The browser scripts are compiled from the TypeScript files in `src/`; after editing them, run `npm run compile` to refresh `browser-build/`.

## Current tools

- Tool dropdown with brush, eraser, eyedropper, paint bucket, line, rectangle, circle, triangle, oval, arrow, star, heart, and hexagon
- Hand tool, Space-drag panning, and touch pinch navigation
- Zoom controls from 25% to 400%, cursor-centered Ctrl/Command-wheel zoom, Fit, Center, and Reset
- Collapsible mini-map for navigating the artwork at high zoom
- Eleven simulated art-supply brush styles, including pencil, fine liner, fountain pen, calligraphy, watercolor, charcoal, crayon, paintbrush, and airbrush, with adjustable size and opacity
- Eyedropper sampling from visible artwork, tracing guide, and paper color
- Paint bucket with adjustable tolerance and undo/redo support
- Editable raster layers with selection, rename, visibility, lock, opacity, reorder, duplicate, delete, merge-down, and flatten controls
- Memory-conscious Undo/Redo history across layer contents and layer settings, including keyboard shortcuts
- Change the paper color
- Add or remove an image as a tracing guide
- Minimize the app into a compact restore control
- Automatically save a versioned, multi-layer project in this browser
- Download the drawing as a PNG

The first saved project automatically migrates the previous single-canvas drawing into a raster layer. The older browser save is kept as a recovery copy.

The artwork remains a 1200 × 800 canvas; zooming and panning change only its viewport. The tracing image is still a single centered reference at this phase. Moving, resizing, rotating, and flipping references are planned for the next implementation phase.

The minimize button collapses the drawing app inside the page; use your browser or operating system controls to minimize or close the browser window itself. The drawing is saved in browser storage on this device. Download it as a PNG to keep a separate copy.

## Build

Run `npm run build` to type-check the TypeScript and create a production build in `dist/`.

Run `npm test` to test layer operations and persistence validation, paint-bucket filling, brush rendering, and viewport behavior.
