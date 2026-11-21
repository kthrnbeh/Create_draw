# Create Draw feature inventory

This inventory reflects the current HTML and TypeScript implementation, not just the README. Source checks and automated tests were run after the changes. **Live browser verification was stopped at the user's request to close the shared browser page; no UI behavior below is claimed as browser-tested.**

| Feature | UI control | Event handler | Expected behavior | Test result | Fix required |
|---|---|---|---|---|---|
| Undo / Redo | Top-bar buttons; Ctrl/Cmd+Z, Ctrl/Cmd+Y | `restoreCanvas` | Restore prior project, layer, reference, and lesson snapshots | Existing history implementation; not browser-tested | Browser verification pending |
| Save PNG | Top-bar `Save PNG` | `downloadDrawing(false)` | Export paper and artwork without references or guides | `CanvasExport` unit test confirms only paper and artwork are composed | Verify downloaded PNG pixels in browser |
| Export with Reference | Top-bar `Export with Reference` | `downloadDrawing(true)` | Add the current reference beneath artwork at its selected opacity | `CanvasExport` unit test checks order and opacity | Verify downloaded PNG pixels in browser |
| Tool picker | `Brush ▾` dropdown | `toolPickerButton` and `[data-tool]` listeners; `setActiveTool` | Open the tool list and select/highlight one tool | HTML controls and handlers inspected; not browser-tested | Browser verification pending |
| Standard brush | Tool picker: Brush | `drawActiveStrokeSegment` → `drawBrushSegment` | Draw with selected brush preset, color, size, and opacity | Brush preset rendering tests pass | Verify pointer drawing in browser |
| Pencil | Brush style: Graphite pencil | `drawBrushSegment` | Draw a light graphite-like stroke | Brush preset rendering tests pass | Verify appearance in browser |
| Marker | Brush style: Felt marker | `drawBrushSegment` | Draw a broad opaque marker stroke | Brush preset rendering tests pass | Verify appearance in browser |
| Highlighter | Brush style: Highlighter | `drawBrushSegment` | Draw a wide translucent stroke | Brush preset rendering tests pass | Verify appearance in browser |
| Fine liner | Brush style: Fine liner | `drawBrushSegment` | Draw a narrow ink-like stroke | Brush preset rendering tests pass | Verify appearance in browser |
| Fountain pen | Brush style: Fountain pen | `drawBrushSegment` | Vary stroke width with stroke direction | Brush preset rendering tests pass | Verify appearance in browser |
| Calligraphy nib | Brush style: Calligraphy nib | `drawBrushSegment` | Draw direction-sensitive calligraphic strokes | Brush preset rendering tests pass | Verify appearance in browser |
| Watercolor | Brush style: Watercolor | `drawBrushSegment` | Draw soft, translucent layered strokes | Brush preset rendering tests pass | Verify appearance in browser |
| Paintbrush | Brush style: Paintbrush | `drawBrushSegment` | Draw a broad stroke with bristle texture | Brush preset rendering tests pass | Verify appearance in browser |
| Airbrush | Brush style: Airbrush | `drawBrushSegment` | Build soft pigment with radial gradients | Focused airbrush test passes | Verify appearance in browser |
| Charcoal | Brush style: Charcoal | `drawBrushSegment` | Draw textured charcoal-like marks | Brush preset rendering tests pass | Verify appearance in browser |
| Crayon | Brush style: Crayon | `drawBrushSegment` | Draw textured, broken crayon strokes | Brush preset rendering tests pass | Verify appearance in browser |
| Eraser | Picker, pink quick button, E shortcut | `setActiveTool`; `eraseSegment` | Erase transparency on only the active editable layer | Hard/soft and context-isolation tests pass | Verify pixels and cursor in browser |
| Hard / soft eraser | Eraser settings | `hardEraserButton`, `softEraserButton` | Toggle edge softness and selected styling | Eraser helper tests pass | Verify styling in browser |
| Eyedropper | Tool picker | Canvas pointer handler; `sampleVisibleColor` | Sample visible artwork, reference, or paper and return to the last drawing tool | Source handler inspected; not browser-tested | Verify sampled colors in browser |
| Paint bucket | Tool picker and Fill tolerance slider | `fillCanvasRegion` | Fill connected pixels on the active editable layer, supporting undo | Flood-fill tests pass | Verify UI and layer behavior in browser |
| Hand / pan | Tool picker or hold Space | Canvas pointer and keyboard handlers | Pan without changing artwork pixels | Viewport tests pass | Verify pointer navigation in browser |
| Line | Tool picker | `drawShape` | Draw a line by dragging | Source handler inspected; not browser-tested | Verify in browser |
| Rectangle | Tool picker | `drawShape` | Draw or fill a rectangle | Source handler inspected; not browser-tested | Verify in browser |
| Circle | Tool picker | `drawShape` | Draw or fill a circle | Source handler inspected; not browser-tested | Verify in browser |
| Triangle | Tool picker | `drawShape` | Draw or fill a triangle | Source handler inspected; not browser-tested | Verify in browser |
| Oval | Tool picker | `drawShape` | Draw or fill an oval | Source handler inspected; not browser-tested | Verify in browser |
| Arrow | Tool picker | `drawShape` | Draw a line with an arrowhead | Source handler inspected; not browser-tested | Verify in browser |
| Star | Tool picker | `drawShape` | Draw or fill a star | Source handler inspected; not browser-tested | Verify in browser |
| Heart | Tool picker | `drawShape` | Draw or fill a heart | Source handler inspected; not browser-tested | Verify in browser |
| Hexagon | Tool picker | `drawShape` | Draw or fill a hexagon | Source handler inspected; not browser-tested | Verify in browser |
| Brush style and size | Style select and size slider | Values read during drawing; size `input` updates output | Choose any of the eleven presets and set brush size | Preset tests pass; UI interaction not browser-tested | Verify settings in browser |
| Color and quick swatches | Color input and five swatches | `updateSelectedColor` | Change the drawing color | Source handler inspected; not browser-tested | Verify in browser |
| Brush opacity and shape fill | Opacity slider and Fill shapes checkbox | Drawing style and `drawShape` | Adjust stroke opacity and choose filled shapes | Source handler inspected; not browser-tested | Verify in browser |
| Canvas paper color | Paper color picker | `backgroundInput` listener; `scheduleSave` | Change the paper color and autosave it | Project serialization tests pass | Verify in browser |
| Upload Image | Canvas section file input | `traceInput` listener | Load a reference and save it to My Images when IndexedDB is available | Asset storage tests pass; UI not browser-tested | Verify image workflow in browser |
| My Images gallery | Thumbnail and saved-image rows | `refreshAssetLibrary` | Show saved uploads, artwork, generated images, and tracing guides | Asset storage tests pass; gallery not browser-tested | Verify gallery and thumbnail rendering |
| Trace This Image | Per-image action | `traceSavedImage` | Use an image as reference and create a separate drawing layer | Source handler inspected; not browser-tested | Verify in browser |
| Use as Reference | Per-image action | `useSavedImageAsReference` | Set a reference without changing drawing layers | Source handler inspected; not browser-tested | Verify in browser |
| Make It Traceable | Per-image and current-reference actions | `openTracingGenerator` | Open the non-modal tracing workbench for that image | Outline processor tests pass; UI not browser-tested | Verify in browser |
| Learn to Draw This | Per-image and current-reference actions | `startImageLesson` / `learnFromCurrentReference` | Start a saved lesson for uploaded, artwork, generated, or processed images | Lesson persistence and transition tests pass; UI not browser-tested | Verify in browser |
| Remove reference | `Remove tracing image` | `clearReferenceImage` | Remove the current reference without erasing artwork or saved image assets | Project reference validation tests pass | Verify in browser |
| Center reference | `Center image` | `centerImageButton` listener | Fit and center the reference in the canvas viewport | Viewport tests pass | Verify in browser |
| Reference visibility and opacity | Checkbox and slider | `referenceVisibleInput`, `traceOpacityInput` listeners | Show/hide and adjust the separate reference | Project persistence tests pass | Verify in browser |
| Tracing grid and size | Checkbox and size slider | `tracingGridInput`, `tracingGridSizeInput` listeners | Show/hide and resize the non-artwork grid overlay | Project persistence tests pass | Verify in browser |
| Layers | Add, select, rename, delete, reorder, visibility, lock, opacity, duplicate, merge, flatten | `LayerManager` methods and layer-row listeners | Manage editable raster layers; locked or hidden active layers cannot be drawn on | Layer operation tests pass | Verify controls in browser |
| Clear Active Layer | `Clear` menu → `Clear Active Layer` | `LayerManager.clearLayer` and button listener | Clear only the selected visible unlocked layer; report empty/locked/hidden states; support history and autosave | Focused layer clear tests pass | Verify undo/redo and autosave in browser |
| Clear All Artwork | `Clear` menu → `Clear All Artwork` → inline confirmation | `LayerManager.clearEditableLayers` and confirmation listener | Clear content from unlocked layers; preserve locked layers, references, and project metadata; support undo/redo and autosave | Focused all-layer and lock tests pass | Verify confirmation, references, and undo/redo in browser |
| Zoom, fit, center, reset | Canvas navigation buttons and Ctrl/Cmd+wheel | `Viewport` and canvas wheel handlers | Navigate the view without changing artwork dimensions | Viewport mapping tests pass | Verify controls in browser |
| Mini-map navigator | Collapsible navigator and Reset view | Navigator pointer/keyboard handlers | Inspect and pan to a region of the canvas | Viewport tests pass | Verify pointer navigation in browser |
| Tracing difficulty and adjustments | Tracing workbench controls | `readTracingSettings`, `scheduleTracingPreview` | Update previews for presets, brightness, contrast, grayscale, sensitivity, threshold, noise, thickness, and inversion | Outline processing tests pass | Verify each control's preview in browser |
| Save tracing guide / Start tracing | Tracing workbench actions | `saveTracingGuide` | Save original and processed images, or start with a separate artwork layer | Asset and outline tests pass | Verify in browser |
| Lesson catalog | Learn to Draw button and six starter buttons | `toggleLearnWorkspace`, `startStarterLesson` | Open a non-modal workspace and start one of six original offline lessons | Lesson module tests pass | Verify in browser |
| Lesson stages and references | Previous, Next, Show Original, Show Main/Detailed Outline, Hide Reference, Show/Hide Guides | Lesson transition and reference handlers | Move through Observe, Basic Shapes, Main Outlines, Fine Details, Draw Independently, and Color and Finish | Stage-transition and persistence tests pass | Verify stages and drawing preservation in browser |
| Lesson hints | Show Hint / Hide Hint | `toggleLessonHintButton` listener | Show general hints and honest, manually authored starter-guide advice | Source inspected; not browser-tested | Verify in browser |
| Lesson save, reset, exit, finish | Lesson action buttons | `saveCurrentLessonProgress`, `resetCurrentLesson`, `exitCurrentLesson`, `finishCurrentLesson` | Save/resume progress; reset steps without clearing artwork; exit while retaining progress; finish with editable artwork | Lesson persistence tests pass | Verify reload/resume and drawing preservation in browser |

## Clear Canvas diagnosis

The former `Clear canvas` button called `clearRect` only on the active layer. Because the screen displays a composite of all visible layers, artwork on other layers remained visible and made the action appear not to work. The replacement explicitly distinguishes active-layer clearing from clearing all unlocked layers. The all-artwork action uses an inline confirmation rather than a blocking dialog.

## Verification limitation

The shared browser page was closed and the Vite server stopped after the user said it had opened an unwanted window. As requested, no more browser page was opened. Automated tests and the production build can validate code-level behavior, but the listed browser checks remain outstanding.
