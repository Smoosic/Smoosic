# Phase 0 Research: Annotation Drag Tool

## 1. The annotation's screen position is already tracked — no temporary render clone needed

**Decision**: Use the annotation's own `SmoLyric.logicalBox` (`src/smo/data/noteModifiers.ts:25`, inherited from `SmoNoteModifierBase`) as the drag origin/hit-test box, and manipulate its own already-rendered DOM element (`context.svg.getElementById('vf-' + annotation.attrs.id)`) directly during the drag, instead of building a temporary off-model render object the way `SuiDragSession` does for `SmoTextGroup` (`SuiTextBlock.fromTextGroup`, `src/render/sui/textEdit.ts:50`).

**Rationale**: `SmoLyric.logicalBox` is already populated for every rendered lyric/chord/annotation by the existing render/map pipeline — `SuiMapper._setModifierBoxes` (`src/render/sui/mapper.ts:373-406`) calls `SvgHelpers.updateArtifactBox(context, element, modifier)` for every note's `SmoLyric`-typed modifier (the filter is by ctor, so it already includes `parser === annotation`, not just lyrics), which sets `artifact.logicalBox = context.offsetBbox(element)` (`src/render/sui/svgHelpers.ts:268-274`). A `SmoTextGroup` has no single equivalent DOM node (it can contain multiple text blocks), which is why `SuiDragSession` must synthesize one (`SuiTextBlock`) purely to have something to drag/render. An annotation is always exactly one `VF.Annotation` glyph with one DOM element (`vxNote.ts:addAnnotationToNote`, unmodified by this feature) — reusing it directly is simpler and avoids duplicating render logic.

**Alternatives considered**: Building an equivalent `SuiTextBlock`-style temporary render object for a single annotation glyph — rejected as unnecessary indirection; there is nothing multi-block to assemble, and the DOM element to drag already exists.

## 2. Live drag feedback reuses the existing offset-transform mechanism, not a new render call

**Decision**: On `mousemove`, compute the pixel delta (in SVG coordinates) since drag start and set the annotation's existing DOM element's `transform` attribute directly — `translate(<translateX + dx> <-(translateY - dy)>)` — the exact same attribute and sign convention `VxSystem._updateAnnotationOffsets` already writes on every full render pass (`src/render/vex/vxSystem.ts:118-128`: `'translate(' + annotation.translateX + ' ' + (-1 * annotation.translateY) + ')'`). No score re-render, no DOM measurement, is triggered per `mousemove`.

**Rationale**: Constitution Principle #3 (rendering performance) — `SuiDragSession.mouseMove` avoids a full-score render mid-drag by rendering only its temporary clone; the annotation tool achieves the same by writing one attribute on one already-existing element, which is even cheaper (no render call at all). The sign convention (`-translateY`) must match `_updateAnnotationOffsets` exactly, or the annotation would jump when the drag ends and the next full render pass takes over.

**Alternatives considered**: Calling `addOrUpdateAnnotation` (full commit + re-render) on every `mousemove` — rejected, far too expensive per Principle #3, and would also spam the undo buffer (`addOrUpdateAnnotation` calls `_undoSelection` on every invocation, `scoreViewOperations.ts:476`) once per pixel of mouse movement.

## 3. Origin-point hit test and page-bounds clamping reuse `SuiDragSession`'s existing helpers unmodified

**Decision**: Start a drag only if the `mousedown` point (converted via `SvgPageMap.clientToSvg`, same as `SuiDragSession.startDrag`) falls inside the annotation's `logicalBox`, using `SvgHelpers.doesBox1ContainBox2` (`src/render/sui/svgHelpers.ts`, same call `SuiDragSession.startDrag` already makes at `textEdit.ts:101`). Resolve the containing page via `SvgPageMap.getRendererFromModifier(annotation)` (`svgPageMap.ts:728-737`) — this already accepts any `Renderable` (`{ logicalBox }`), which `SmoLyric` satisfies via `SmoNoteModifierBase`, so it works unmodified for an annotation exactly as it does for a `SmoTextGroup`. Clamp the drag so the annotation's shifted box stays within `page.box`, mirroring `SuiDragSession.checkBounds` (`textEdit.ts:80-93`).

**Rationale**: FR-004 (press must land on the annotation to start a drag) and FR-007 (can't drag fully off the page) are exactly what `SuiDragSession` already enforces for text blocks; reusing the same helpers keeps the two tools' edge behavior identical (spec SC-003: "no new learning" to use this tool having used the other one), and avoids re-deriving page/coordinate-space math that already exists and is already exercised.

**Alternatives considered**: Loosening the hit test to "anywhere near the annotation" (larger hit target) — rejected; FR-004 and the existing text-block precedent both require pressing on the object's current rendered position, and diverging here would be an inconsistency between the two tools with no stated justification.

## 4. Outline feedback reuses `SvgHelpers.outlineRect`/`eraseOutline` and the existing `'text-drag'` stroke style

**Decision**: While dragging, draw and update a dashed outline rectangle around the annotation's current drag position using `SvgHelpers.outlineRect`/`eraseOutline` and `SuiTextStrokes['text-drag']` (`textEdit.ts:56`, `svgHelpers.ts`), the same visual affordance `SuiDragSession` already shows for text blocks.

**Rationale**: Matches SC-003 (identical interaction affordances to the existing tool) at negligible cost — this is the same helper, called the same way, just against the annotation's box instead of a text block's.

**Alternatives considered**: No outline, relying solely on the glyph itself moving — rejected; the existing tool always shows one, and removing it here would be an unexplained visual inconsistency between two dialogs that are otherwise meant to feel the same.

## 5. Commit path: reuse the dialog's existing multi-selection `syncModifiers()`, not a new single-object update method

**Decision**: `SuiAnnotationDragSession.endDrag()` only mutates the shared `SmoLyric` instance's `translateX`/`translateY` fields (mirroring how `SuiDragSession.endDrag()` mutates `textGroup`'s offset via `offsetX()`/`offsetY()`, `textEdit.ts:147-148`) — it does not call any score-operation method itself. The dialog's `onDragStop` handler (in `annotation.vue`, modeled on `textBlock.vue`'s existing `onDragStop`, `textBlock.vue:88-92`) then calls the dialog's already-existing `syncModifiers()` (`annotation.vue:97-108`), exactly as the X/Y `numberInputApp` change handlers (`onXChange`/`onYChange`, `annotation.vue:207-224`) already do.

**Rationale**: `syncModifiers()` already loops every selection in `props.selections` and calls `view.addOrUpdateAnnotation(sel.selector, annotation)` for each — this is exactly what's needed for FR-008 (a completed drag must update every selected note sharing the annotation), and it's the single existing commit path every other field-edit in this dialog already uses. `textBlock.vue`'s `rerender()`/`updateTextGroup` has no multi-selection concept to preserve (a `SmoTextGroup` is never shared across multiple notes the way an annotation can be), so it isn't a fitting model for the commit call itself — only for the drag-session mechanics.

**Alternatives considered**: Adding a dedicated `updateAnnotationPosition` method to `SuiScoreViewOperations`, mirroring `updateTextGroup` — rejected; `addOrUpdateAnnotation` (looped via `syncModifiers()`) already does exactly this and is already the dialog's established path for every other mutable field, so a parallel method would be pure duplication with no behavioral difference.

## 6. Dialog wiring: mirror `textBlock.vue`'s `'moving'` mode almost exactly

**Decision**: Add `'moving'` to `annotation.vue`'s `DialogMode` (currently `'editing' | 'dialog'`, `annotation.vue:28`), add a "Move" button next to the existing "Edit Text"/"Add Annotation" controls in the `'dialog'`-mode template (only when `currentAnnotation.value` exists, satisfying FR-009), and — like `textBlock.vue:93-98` — a `watch(mode, ...)` that calls `draggerRef.value?.start()` after `nextTick()` when entering `'moving'`. While `mode === 'moving'`, render only the new `annotationDragger.vue` (with a "Done Dragging Annotation" control), hiding the index selector, edit/add/delete buttons, and X/Y/font/justify controls — matching `textBlock.vue`'s `<div v-if="mode === 'moving'">...</div><template v-else>...</template>` structure and directly satisfying the Edge Case (must exit the move tool before switching annotations).

**Rationale**: This is the same three-mode shape `textBlock.vue` already uses (`'idle' | 'editing' | 'moving'` there vs. `'editing' | 'dialog' | 'moving'` here — names differ because the two dialogs' existing non-moving mode names already differ, not because the moving behavior differs). Reusing the shape keeps the two dialogs' drag UX identical (SC-003) with minimal new code.

**Alternatives considered**: Allowing the move tool to run concurrently with the index selector / other controls visible — rejected per the spec's Edge Case, and inconsistent with `textBlock.vue`, which also hides its other controls while `mode === 'moving'`.

## 7. Testing approach

**Decision**: Same as `017-text-annotations` and the text-block drag tool's own feature (`001-text-block-dialog-vue`) — no automated test runner is wired up (`npm test` is a no-op placeholder). Verification is manual: `npm run build` + `npm run server`, exercised against the acceptance scenarios in `quickstart.md`.
