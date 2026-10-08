# Implementation Plan: Score Text Drag Controls

**Branch**: `023-text-drag-controls` | **Date**: 2026-09-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/023-text-drag-controls/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add direction-lock checkboxes, one-click horizontal placement buttons (center / right-justify), and a snap-to-grid toggle to the existing text-drag toolbar (`textDragger.vue`), plus an Alt-key "slow mode" that throttles drag position updates to once per 100ms. Direction-lock and snap are implemented as new mutable settings on the existing `SuiDragSession` (`src/render/sui/textEdit.ts`), consulted inside its existing `mouseMove()` before the live-drag box is committed — no new class, no change to its public shape beyond three new fields. Alt slow-mode is implemented purely in `textDragger.vue`'s own `onMouseMove` window handler (per the spec's literal wording), by timestamp-gating calls into `session.mouseMove(ev)` while `ev.altKey` is true. Center/right-justify are implemented as two new pure, DOM-free methods on `SmoTextGroup` (`src/smo/data/scoreText.ts`) that reuse the same margin/width math already used by `SmoTextGroup.createLandmarkText`'s `xJustify` branch, driven by a new `pageLayout: ScaledPageLayout` prop threaded down from `textBlock.vue` (which already has access to `view.score.layoutManager`) — so these buttons commit directly to the model and rerender, independent of whether a live mouse-drag is in progress, matching the existing "quick position field" (`onXChange`/`onYChange`) commit pattern already in `textBlock.vue`.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Vue 3.5 SFCs (`<script setup lang="ts">`)

**Primary Dependencies**: Vue 3 (`vue`); existing drag infrastructure (`src/ui/components/dialogs/textDragger.vue`, `SuiDragSession` in `src/render/sui/textEdit.ts`); existing text-model layer (`SmoTextGroup`, `SmoScoreText` in `src/smo/data/scoreText.ts`); existing scaled-layout infrastructure (`ScaledPageLayout`, `SmoLayoutManager.getScaledPageLayout` in `src/smo/data/scoreModifiers.ts`) already used by `SmoTextGroup.createLandmarkText` for the same center/right-margin math this feature reuses; existing geometry helpers (`SvgPageMap.renderScale`/`clientToSvg`, `SvgHelpers.smoBox`) already used by `SuiDragSession`.

**Storage**: N/A — operates on the in-memory `SmoTextGroup`'s existing `x`/`y` fields (via its existing `offsetX`/`offsetY`) and the existing `SuiScoreViewOperations.updateTextGroup` write path already used by `textBlock.vue`'s `rerender()`. No new persisted fields; lock/snap settings are session-local UI state, not part of `SmoTextGroup`'s serializable shape (spec Assumption: no new persistence required).

**Testing**: No automated UI/render test runner is wired up in this repo (`npm test` is a no-op placeholder); render/UI behavior (direction lock, snap-while-dragging, Alt slow-mode) is verified manually per `quickstart.md`, consistent with the constitution's "lower priority is rendering regression" stance and precedent (`020-annotation-drag-tool`). The two new pure `SmoTextGroup` methods (`centerOnPage`, `rightJustifyOnPage`) are headless-testable data transformations, matching the existing `tests/globalLayoutTextReposition.ts` precedent (`npm run test:global-layout-reposition`) — this feature adds a sibling script, `tests/textDragPlacement.ts`, run via a new `npm run test:text-drag-placement`.

**Target Platform**: Browser (SVG-rendered score editor), same runtime as the rest of `src/ui`/`src/render`

**Project Type**: Single front-end library project (no frontend/backend split) — changes span `src/smo/data` (two new pure methods), `src/render/sui` (three new fields + logic on an existing class), and `src/ui/components/dialogs` (one modified Vue component, one prop threaded through its parent)

**Performance Goals**: No new performance targets beyond the spec's own throttle requirement (FR-010: at most one drag-position update per 100ms while Alt is held, SC-004). Outside slow mode, drag-update cost is unchanged from today (one `mousemove`-driven reposition of the same temporary `SuiTextBlock`, per existing `SuiDragSession.mouseMove`); the added lock/snap math is a few extra comparisons/one `Math.round` per event, negligible next to the existing per-event text layout work.

**Constraints**: Must not change rendered position/behavior when no lock/snap/Alt control is active (all three default off — FR-013 — and are no-ops when off, preserving today's exact drag behavior, spec SC-005). Center/right-justify must not require an active mouse-drag to be in progress (FR-009, US2 AC3) and must leave the vertical position untouched (FR-004/FR-005). Snap's 10px grid must be expressed so it looks like 10 real screen pixels regardless of the current SVG render scale (FR-007) — resolved in research.md as `10 / SvgPageMap.renderScale` (i.e., `10 / SmoGlobalLayout.svgScale`), intentionally *not* also divided by the transient UI `zoomScale`, so the grid stays fixed in model/logical space and doesn't visually change spacing as the user zooms (spec SC-003: grid-aligned "at any page zoom level").

**Scale/Scope**: Three new fields + ~10 lines of branching logic on the existing `SuiDragSession.mouseMove`/`startDrag` (no new class); two new methods on `SmoTextGroup`; one new prop (`pageLayout`) and its computed value threaded from `textBlock.vue` into `textDragger.vue`; new template markup (3 checkboxes, 2 buttons) and their handlers in `textDragger.vue`; one new headless test script. No changes to `SuiTextBlock`, `SvgPageMap`, or any other dialog.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle #1 (Serialization)**: No new persisted fields on `SmoTextGroup` or any serializable type — lock/snap/Alt state is transient UI state local to `textDragger.vue` and `SuiDragSession`, never written to the model; a legacy score deserializes identically. **Gate: PASS.**
- **Principle #2 (Music editing/transformation logic)**: `centerOnPage`/`rightJustifyOnPage` are non-UI text-layout transformations on `SmoTextGroup` (not pitch/rhythm, but the same category of already-tested transformation as `022-text-reposition-on-resize`'s repositioning logic) — covered by a new headless test script per the Testing section above. **Gate: PASS.**
- **Principle #3 (Rendering performance)**: No new full-score render/DOM-measurement pass is introduced. Lock/snap run inside the existing per-`mousemove` `SuiDragSession.mouseMove` path (already the sole per-event cost today); center/right-justify commit once (matching the cost of one `onXChange`/`onYChange` numeric-field edit, an already-established pattern) rather than on every event. Alt slow-mode *reduces* event-processing frequency, it does not add work. **Gate: PASS.**
- **Principle #4 (Logical dependencies)**: `centerOnPage`/`rightJustifyOnPage` live in `src/smo/data/scoreText.ts` and depend only on plain data already available on the model (`this.logicalBox`, `this.ul()`) plus a plain `ScaledPageLayout` value object passed in by the caller — no DOM/render import, mirroring `createLandmarkText`'s existing signature shape. Lock/snap/Alt-throttle logic lives in the render layer (`SuiDragSession` in `src/render/sui`, `textDragger.vue`'s window handlers), which is already DOM/VexFlow-aware — consistent with where `SuiDragSession`'s existing drag math lives today. **Gate: PASS.**

No project-constitution gate specific to UI dialogs or drag interactions exists; per spec Assumptions, this plan extends the established text-block drag-tool precedent (`001-text-block-dialog-vue`, `020-annotation-drag-tool`) rather than inventing a new interaction pattern.

## Project Structure

### Documentation (this feature)

```text
specs/023-text-drag-controls/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/smo/data/
└── scoreText.ts                   # MODIFIED: add SmoTextGroup.centerOnPage(layout) and
                                    #   .rightJustifyOnPage(layout), reusing the xJustify math
                                    #   already used by createLandmarkText (lines ~600-610)

src/render/sui/
└── textEdit.ts                    # MODIFIED: SuiDragSession gets three new public fields
                                    #   (lockHorizontal, lockVertical, snapEnabled, default false)
                                    #   and a dragOriginBox snapshot; mouseMove()/startDrag() apply
                                    #   snap-then-lock to the computed box before it's committed —
                                    #   no new class, no change to existing constructor/params shape

src/ui/components/dialogs/
├── textDragger.vue                # MODIFIED: new props (pageLayout: ScaledPageLayout); new local
                                    #   refs + checkboxes (lockHorizontal, lockVertical, snapEnabled)
                                    #   that mirror onto the live session; new "Center"/"Right Justify"
                                    #   buttons that call SmoTextGroup.centerOnPage/rightJustifyOnPage
                                    #   directly and emit a new 'reposition' event; Alt-gated timestamp
                                    #   throttle added to the existing onMouseMove window handler
└── textBlock.vue                  # MODIFIED: compute/pass the new pageLayout prop (via
                                    #   view.score.layoutManager!.getScaledPageLayout(pageIndex));
                                    #   new @reposition handler that calls the existing
                                    #   refreshFromModel()/rerender() pair (same as onDragStop)

tests/
└── textDragPlacement.ts           # NEW: headless checks for centerOnPage/rightJustifyOnPage
                                    #   math across varying margins/widths, modeled on the existing
                                    #   tests/globalLayoutTextReposition.ts precedent
```

**Structure Decision**: Single front-end project — no frontend/backend split. All changes extend existing files/classes at their established layers (`smo/data` for pure text-position math, `render/sui` for the drag session, `ui/components/dialogs` for the two collaborating Vue components); no new top-level directories, no new Vue components, no new render/session classes. This mirrors the "extend, don't duplicate, the existing drag-tool precedent" approach `020-annotation-drag-tool` took, but goes further here since this feature augments the *same* drag tool (`textDragger.vue`/`SuiDragSession`) rather than adding a parallel one.

## Complexity Tracking

*No entries — Constitution Check has no violations.*

## Post-Design Constitution Check

*Re-evaluated after Phase 1 (data-model.md, contracts/, quickstart.md).* Design decisions in [research.md](./research.md) confirm: the snap grid divisor uses only `svgScale` (via `SvgPageMap.renderScale`), deliberately excluding `zoomScale`, so the grid is stable in model space regardless of UI zoom (Principle #3 — no render-time recomputation needed, it's a constant per layout); center/right-justify reuse `logicalBox`/`ul()`, both already-populated plain data fields, so no new DOM measurement or render pass is added just to support the buttons (Principle #3/#4); lock/snap are additive fields on the existing `SuiDragSession` rather than a new class, and Alt-throttle stays entirely in `textDragger.vue`'s own event handler as the spec literally describes, touching no shared/session state (Principle #4). No `src/smo/data` schema or serialization change, no new persisted fields, no new full-score render pass. **Gate: PASS.**
