# Implementation Plan: Lyric Editor Live Preview and Position Cursor

**Branch**: `012-lyric-live-preview-cursor` | **Date**: 2026-09-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-lyric-live-preview-cursor/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add two visual-only behaviors to the Vue-based Lyric Editor's plain-text editor (`lyricEditor.vue`/`lyric.vue`, from `010-vue-lyric-dialog`, extended by `011-lyric-editor-auto-advance`): (1) a subtle vertical-line position marker on the score, drawn near the current note (or at the end of its existing lyric's bounding box) whenever the plain-text editor is active, moved on every navigate and removed when editing stops; and (2) a debounced live preview that periodically writes the in-progress typed text to the score via the existing `view.addOrUpdateLyric` path — reusing `lyric.vue`'s own `commitIfChanged()` unchanged, triggered by a new pause-triggered emit from `lyricEditor.vue`, mirroring the exact debounce pattern `009-text-editor-live-preview` already established in `textGroupEditor.vue`. One small, additive static helper is added to `SvgHelpers` (`src/render/sui/svgHelpers.ts`) to draw/return the marker element; no other rendering internals change, and neither `SuiLyricDialog` nor the legacy `SuiLyricSession`/`SuiLyricEditor` inline-SVG typing classes are touched or reintroduced.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Vue 3.5 SFCs (`<script setup lang="ts">`)

**Primary Dependencies**: `@tiptap/vue-3` (`useEditor`'s existing `onUpdate` hook — the same one `textGroupEditor.vue` already uses for its own debounced preview); `SvgHelpers`/`SvgPage` (`src/render/sui/svgHelpers.ts`, `src/render/sui/svgPageMap.ts`) for drawing the marker directly into the score's SVG; no new dependencies

**Storage**: N/A — the "preview" is not separate state; it is the same `SmoLyric`/`SmoNote` score model already written via `view.addOrUpdateLyric` in `010-vue-lyric-dialog`'s `commitIfChanged()`, just triggered more often (debounced while typing, not only on navigate/finish)

**Testing**: No automated unit/integration test runner is wired up in this repo (`npm test` is a no-op placeholder). Verification is manual: build with `npm run build`, serve with `npm run server`, and exercise the dialog in a browser against the demo/dev score app, per `quickstart.md`

**Target Platform**: Browser (SVG-rendered score editor), same runtime as the rest of `src/ui`

**Project Type**: Single front-end library project (no frontend/backend split) — changes are in `src/ui/components/dialogs/` and one additive method in `src/render/sui/svgHelpers.ts`

**Performance Goals**: Marker draw/remove and the debounced preview write must not introduce perceptible lag while typing; reuses the same debounce interval (400ms) and targeted (not full-score) re-render path `009-text-editor-live-preview` already validated for an equivalent live-preview feature

**Constraints**: Must not change when lyric text is actually persisted for real (still governed by navigate/finish/close, per FR-009); must not reintroduce the legacy `SuiLyricSession`/`SuiLyricEditor` inline-SVG typing/cursor machinery (`010-vue-lyric-dialog` research.md §3) — the marker is a new, much simpler, purely-visual line, not a revived editable-cursor system; must not change `011-lyric-editor-auto-advance`'s hyphen/space behavior

**Scale/Scope**: Three files touched: `src/ui/components/dialogs/lyricEditor.vue` (new debounced `preview` emit), `src/ui/components/dialogs/lyric.vue` (marker state/positioning/lifecycle, `onEditorPreview` handler), `src/render/sui/svgHelpers.ts` (one new additive static method); no new files, no score-model changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

No project constitution has been ratified (`.specify/memory/constitution.md` contains only high-level project principles — serialization, music-editing/transformation logic, rendering performance, logical dependencies — no gates specific to UI dialogs). This feature draws directly into the existing SVG render surface via the already-established `SvgPage`/`pageMap.getRenderer` API (Principle #3: rendering performance) but adds only a single small, static element per marker update/removal — no new DOM-measurement passes, no full-score re-layout, consistent with the targeted-redraw approach `addOrUpdateLyric` already uses. It touches no code under `src/smo` (Principle #1/#2). **Gate: PASS (no constitution to violate)**.

## Project Structure

### Documentation (this feature)

```text
specs/012-lyric-live-preview-cursor/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/ui/components/dialogs/
├── lyricEditor.vue     # MODIFIED: add onUpdate-driven, debounced `preview` emit
│                        #   (mirrors textGroupEditor.vue's schedulePreview/pushPreview)
└── lyric.vue            # MODIFIED: add position-marker state (element ref + compute/draw/
                          #   remove), wire @preview="onEditorPreview" onto lyricEditorComp,
                          #   call marker update after loadNote()/navigate/commitIfChanged,
                          #   remove marker on mode change to 'dialog' and on dialog close

src/render/sui/
└── svgHelpers.ts         # MODIFIED (additive only): new static method to draw a subtle
                           #   vertical-line marker into a given SvgPage's <svg>, returning
                           #   the created element for later removal. No existing method
                           #   changed.

src/ui/dialogs/
└── lyricVue.ts            # UNCHANGED — no creation-function changes needed
```

**Structure Decision**: No new files. Two of the three touched files are the same Vue components `010`/`011` already modify; the third is one additive static method on the existing shared `SvgHelpers` utility class, following the same pattern already used by `SvgHelpers.renderCursor`/`eraseOutline`/`outlineRect` for drawing/erasing transient score overlays.

## Complexity Tracking

*No entries — Constitution Check has no violations (no ratified constitution to violate; the design reuses established rendering APIs and the existing `009` debounce pattern with no added complexity to justify).*

## Post-Design Constitution Check

*Re-evaluated after Phase 1 (data-model.md, contracts/, quickstart.md).* Design decisions in [research.md](./research.md) (drawing the marker as a plain `<line>` directly against `SvgPage.svg` rather than reviving `SuiInlineText`/`SuiLyricEditor`'s glyph-level cursor renderer; reusing `commitIfChanged()` verbatim as the "preview" write with no separate draft state; approximating "end of existing lyric" via the lyric's whole bounding box rather than per-character layout) stay within the existing Vue-dialog and renderer conventions, touch no code under `src/smo`, and add only one small, additive, backward-compatible method to `SvgHelpers`. **Gate: PASS.**
