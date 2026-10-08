# Implementation Plan: Annotation Drag Tool

**Branch**: `020-annotation-drag-tool` | **Date**: 2026-09-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/020-annotation-drag-tool/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add a "Move" tool to the annotation dialog (`annotation.vue`), so a `SmoLyric` annotation (`parser === SmoLyric.parsers.annotation`) can be repositioned by dragging it directly on the rendered score, mirroring the existing text-block ("SmoTextGroup") drag tool (`textBlock.vue` / `textDragger.vue` / `SuiDragSession` in `src/render/sui/textEdit.ts`). Unlike the text-block tool — which drags a multi-block text group and must build a temporary off-model clone (`SuiTextBlock.fromTextGroup`) to render a live preview — an annotation is always a single, already-rendered VexFlow `Annotation` glyph with a known screen position (`SmoLyric.logicalBox`, populated by the existing render/map pipeline) and an existing live-offset mechanism (`VxSystem._updateAnnotationOffsets`, which sets the glyph's `transform` attribute from `translateX`/`translateY`). The new `SuiAnnotationDragSession` (added alongside `SuiDragSession` in `textEdit.ts`) reuses that same DOM element and transform convention directly during the drag instead of cloning/rebuilding it, and on drag end writes the resulting `translateX`/`translateY` back onto the annotation and lets the dialog's existing `syncModifiers()` commit path (already used by the X/Y offset number fields) persist it — including to every note in a multi-note selection, which the text-block tool doesn't need to handle but the annotation dialog already does.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Vue 3.5 SFCs (`<script setup lang="ts">`)

**Primary Dependencies**: Vue 3 (`vue`); existing in-repo Vue dialog components (`dialogContainer.vue`, `numberInput.vue`, `select.vue`, `fontPicker.vue`, `annotationEditor.vue`); existing drag infrastructure precedent (`src/ui/components/dialogs/textDragger.vue`, `SuiDragSession` in `src/render/sui/textEdit.ts`) providing the interaction pattern to mirror; existing score-operation infrastructure already used by the annotation dialog (`SuiScoreViewOperations.addOrUpdateAnnotation`, `annotation.vue`'s `syncModifiers()`); existing SVG/geometry helpers (`SvgHelpers.doesBox1ContainBox2`, `SvgHelpers.outlineRect`/`eraseOutline`, `SvgPageMap.clientToSvg`/`getRendererFromModifier`) already used by `SuiDragSession`.

**Storage**: N/A — operates on the in-memory `SmoLyric` (`parser === annotation`) via its existing `translateX`/`translateY` fields (both already persisted; no schema change) and the existing `SuiScoreViewOperations.addOrUpdateAnnotation` write path.

**Testing**: No automated unit/integration test runner is wired up in this repo (`npm test` is a no-op placeholder). Verification is manual: build with `npm run build`, serve with `npm run server`, and exercise the dialog in a browser against the demo/dev score app, per `quickstart.md`.

**Target Platform**: Browser (SVG-rendered score editor), same runtime as the rest of `src/ui`/`src/render`

**Project Type**: Single front-end library project (no frontend/backend split) — changes span `src/render/sui` (one new drag-session class) and `src/ui/components/dialogs` (one new Vue component, one modified Vue component)

**Performance Goals**: No new performance targets; live drag feedback is a single `setAttributeNS('transform', ...)` per `mousemove` on the annotation's own already-rendered DOM element (the same operation `_updateAnnotationOffsets` already performs once per full render pass), not a new render/reflow per frame — matching `SuiDragSession.mouseMove`'s existing pattern of avoiding a full score re-render mid-drag.

**Constraints**: Must not change the rendered appearance or behavior of an annotation when the move tool is not active (no change to `createLyric()`, `_updateAnnotationOffsets`, or the persisted rendering path); must not introduce a new commit/persistence mechanism — the drag session only ever mutates `translateX`/`translateY` on the shared `SmoLyric` instance, exactly as the existing X/Y `numberInputApp` change handlers already do, so `syncModifiers()` remains the single commit path for both; must continue to apply a completed drag to every note in a multi-note selection (annotation dialog's existing multi-selection behavior, spec User Story 3).

**Scale/Scope**: One new class (`SuiAnnotationDragSession`) in `src/render/sui/textEdit.ts`; one new Vue component (`annotationDragger.vue`) modeled on `textDragger.vue`; modifications to `annotation.vue` (new `'moving'` dialog mode, a "Move" button, drag-stop handling) — no changes to `src/smo/data`, no new persisted fields, no changes to the text-block drag tool it's modeled on.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle #1 (Serialization)**: No new fields, no schema change — `translateX`/`translateY` already exist, are already persisted, and are already the fields the dialog's numeric inputs write to. A legacy score deserializes identically. **Gate: PASS.**
- **Principle #2 (Music editing/transformation logic)**: No pitch/rhythm/accidental/clef logic touched; this is a UI positioning feature. Not applicable. **Gate: PASS (N/A).**
- **Principle #3 (Rendering performance)**: The drag session updates only the dragged annotation's own `transform` attribute directly (mirroring the existing `_updateAnnotationOffsets` mechanism) rather than forcing a full score re-render or DOM measurement on every `mousemove`; a full re-render happens exactly once, on drag completion, via the existing `syncModifiers()`/`addOrUpdateAnnotation` path — the same cost as one numeric-field edit today. **Gate: PASS.**
- **Principle #4 (Logical dependencies)**: The new drag session lives in `src/render/sui` (rendering layer, already VexFlow/DOM-aware, same file as the precedent `SuiDragSession`), not in `src/smo`. It reads/writes only existing plain-data fields (`translateX`, `translateY`, `logicalBox`) already defined on `SmoLyric` in `src/smo/data`. **Gate: PASS.**

No project-constitution gate specific to UI dialogs or drag interactions exists; per spec Assumptions, this plan follows the established text-block drag-tool precedent (`001-text-block-dialog-vue`) rather than inventing a new interaction pattern.

## Project Structure

### Documentation (this feature)

```text
specs/020-annotation-drag-tool/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/render/sui/
└── textEdit.ts                    # MODIFIED: add SuiAnnotationDragSession class, alongside the existing
                                    #   SuiDragSession (lines 33-155) — same file, same drag-session pattern,
                                    #   adapted for a single already-rendered SmoLyric glyph instead of a
                                    #   multi-block SmoTextGroup

src/ui/components/dialogs/
├── textDragger.vue                # EXISTING — read as the direct structural precedent, not modified
├── annotation.vue                 # MODIFIED: add a 'moving' DialogMode, a "Move" button next to
                                    #   "Edit Text"/"Add Annotation", and an onDragStop handler that
                                    #   refreshes translateX/translateY from the model and calls the
                                    #   dialog's existing syncModifiers()
└── annotationDragger.vue          # NEW: thin wrapper component around SuiAnnotationDragSession's
                                    #   window mouse-event handlers, modeled 1:1 on textDragger.vue
```

**Structure Decision**: Single front-end project — no frontend/backend split. The new drag-session class lives alongside its precedent (`SuiDragSession`) in the existing `src/render/sui/textEdit.ts`; the new Vue component lives alongside its precedent (`textDragger.vue`) in `src/ui/components/dialogs/`. No new top-level directories, no new files in `src/smo/data` or `src/render/vex` — this feature reuses the annotation rendering/offset machinery added by `017-text-annotations` unmodified.

## Complexity Tracking

*No entries — Constitution Check has no violations.*

## Post-Design Constitution Check

*Re-evaluated after Phase 1 (data-model.md, contracts/, quickstart.md).* Design decisions in [research.md](./research.md) — reusing the annotation's own already-rendered DOM element and `logicalBox` instead of building a temporary clone (unlike the text-block tool, which must clone because a text group has multiple blocks and no single pre-existing DOM node to reuse); routing the completed drag through the dialog's existing multi-selection `syncModifiers()` rather than adding a new single-object commit method (the text-block tool's `updateTextGroup` has no multi-selection concept to preserve, but the annotation dialog does); reusing `SvgHelpers.outlineRect`/`doesBox1ContainBox2`/`SvgPageMap.clientToSvg`/`getRendererFromModifier` unmodified from their existing `SuiDragSession` call sites — all stay within the existing conventions of the drag tool this feature is modeled on, touch no pitch/rhythm logic, add no new full-score render pass, and keep `src/smo/data` untouched. **Gate: PASS.**
