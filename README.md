# Create Draw

A personal drawing app built in this repository, inspired by the tools and ideas in the school project—but developed independently here.

## Get started

1. Install [Node.js](https://nodejs.org/).
2. In this folder, run `npm install`.
3. Run `npm run dev` and open the local address Vite prints. It does not open a browser window automatically.

You can also open `index.html` with VS Code Live Server. The browser scripts are compiled from the TypeScript files in `src/`; after editing them, run `npm run compile` to refresh `browser-build/`.

## Current tools

- Tool dropdown with brush, eraser, eyedropper, paint bucket, line, rectangle, circle, triangle, oval, arrow, star, heart, and hexagon
- Pencil, marker, and highlighter brush presets, adjustable size and opacity, and optional shape fill
- Eyedropper sampling from visible artwork, tracing guide, and paper color
- Paint bucket with adjustable tolerance and undo/redo support
- Memory-conscious Undo/Redo history, including keyboard shortcuts
- Change the paper color
- Add or remove an image as a tracing guide
- Minimize the app into a compact restore control
- Automatically save the current drawing in this browser
- Download the drawing as a PNG

The minimize button collapses the drawing app inside the page; use your browser or operating system controls to minimize or close the browser window itself. The drawing is saved in browser storage on this device. Download it as a PNG to keep a separate copy.

## Build

Run `npm run build` to type-check the TypeScript and create a production build in `dist/`.

Run `npm test` to test the paint-bucket fill behavior.
