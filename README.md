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
- Paint bucket with solid, gradient, and procedural texture fills; adjustable tolerance, gap closing, opacity, visible-layer/reference sampling, and undo/redo support
- Editable raster layers with selection, rename, visibility, lock, opacity, reorder, duplicate, delete, merge-down, and flatten controls
- Clear Active Layer and confirmed Clear All Artwork actions; locked layers and tracing references are preserved
- Memory-conscious Undo/Redo history across layer contents and layer settings, including keyboard shortcuts
- Change the paper color
- Add an image as a tracing guide and continue drawing on a separate transparent layer
- Adjust tracing-reference opacity and keep the reference separate from artwork
- Make uploaded or saved images traceable with Beginner, Intermediate, and Advanced outlines, real-time previews, and adjustable edge, brightness, contrast, noise, and thickness settings
- Save original images and generated tracing guides separately in My Images, then start tracing without downloading and re-uploading
- Show or hide the reference and add an adjustable tracing grid
- Use the 1–100 px hard or soft eraser with an artwork-scaled cursor and the E shortcut
- Save uploaded images and artwork to the IndexedDB-backed My Images library, then trace a saved image later
- Export a clean PNG without the reference, or choose Export with Reference
- Learn to Draw workspace with six original offline starter lessons and lessons from images in My Images
- Six guided stages with original and processed references, separate construction guides, hints, saved progress, and a transparent lesson artwork layer
- Automatically save a versioned, multi-layer project in this browser
- Download the drawing as a PNG

The first saved project automatically migrates the previous single-canvas drawing into a raster layer. The older browser save is kept as a recovery copy. Project data and lesson progress are saved in local browser storage, while reusable image files and lesson references are kept separately in IndexedDB. If IndexedDB is unavailable, drawing still works and an uploaded reference can be used for the current page session, but reusable image and lesson features are unavailable.

The artwork remains a 1200 × 800 canvas; zooming and panning change only its viewport. The tracing workspace currently supports one centered reference image. Moving, resizing, rotating, and flipping references are planned for a later phase.

Create Draw is a regular webpage. Use your browser or operating system window controls to minimize or close it. The drawing is saved in browser storage on this device. Download it as a PNG to keep a separate copy.

## iPhone, iPad, and deployment

The app includes a relative-path web manifest, iOS Home Screen metadata, and a small service worker that caches core application files. Install it from Safari with Share → Add to Home Screen. The service worker does not cache project artwork; projects remain in this browser's local storage/IndexedDB and do not sync automatically between devices. Keep using PNG export or the project's existing backup workflow for transfer.

For a production build, run `npm run build` and deploy the generated `dist/` directory over HTTPS. GitHub Pages can publish `dist/` from the repository's configured Pages workflow; the Vite configuration uses relative asset paths so a repository subpath is supported. Do not publish from this workspace without reviewing and approving the deployment workflow first.

Real-device verification still needed: Safari on a current iPhone and iPad in portrait and landscape, Apple Pencil pressure/cancellation, Home Screen launch/offline recovery, IndexedDB persistence, and import/export across devices.

## Build

Run `npm run build` to type-check the TypeScript and create a production build in `dist/`.

Run `npm test` to test image-asset storage, layer operations and project validation, clear actions, lesson progress, clean export composition, eraser behavior, paint-bucket filling, brush rendering, and viewport behavior.

See [FEATURE_INVENTORY.md](./FEATURE_INVENTORY.md) for the control-by-control implementation audit and browser-verification status.
