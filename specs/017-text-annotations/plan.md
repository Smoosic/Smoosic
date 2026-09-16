# Implementation Plan: Note Text Annotations

**Branch**: `017-text-annotations` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-text-annotations/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add a free-text "Annotation" note modifier, reusing the existing `SmoLyric` class with `parser === SmoLyric.parsers.annotation` (`= 1`, already defined but unwired anywhere in the app) instead of a new data type. A new "Annotation" entry in the Text menu (`src/ui/menus/text.ts`) creates or edits the annotation on the current selection — for a multi-note selection, one shared annotation instance is applied identically to every selected note, reusing the existing `dynamicsDialogMenuOption`/`SuiDynamicDialogAdapter` multi-selection-sync pattern rather than inventing a new one. A new Vue dialog (`SuiAnnotationDialogVue` / `annotation.vue`), modeled on the existing lyric dialog (`010-vue-lyric-dialog`) minus its note-to-note navigation (explicitly out of scope per the feature description) and minus its score-wide font commit (this feature commits font/offset per annotation instance), adds a text-editing mode and a non-editing mode with font, X/Y pixel offset, and a new vertical-justify control (Top/Bottom). Rendering is added to `vxNote.ts` (`addAnnotationToNote`, dispatched from `createLyric()` alongside the existing lyric/chord branches) and `vxSystem.ts` (`_updateAnnotationOffsets`, called from `updateLyricOffsets()` alongside `_updateChordOffsets`), both copied from their chord equivalents. One small pre-existing bug is fixed along the way: `SmoLyric.getClassSelector()` currently maps any non-lyric parser to `'chord'`, which would mislabel annotation elements. Clicking to open an annotation's dialog reuses the existing note-selection + Text-menu flow (confirmed with the user during `/speckit-specify`) — no new click/hit-test handler is added, since neither lyrics nor chords have one today either.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Vue 3.5 SFCs (`<script setup lang="ts">`)

**Primary Dependencies**: Vue 3 (`vue`); TipTap 3.30 (`@tiptap/vue-3`, `@tiptap/starter-kit`, already used by `lyricEditor.vue`, the direct model for the new `annotationEditor.vue`); existing in-repo Vue dialog components (`dialogContainer.vue`, `numberInput.vue`, `select.vue`, `fontPicker.vue`); existing score-operation infrastructure on `SuiScoreViewOperations` (pattern from `addOrUpdateLyric`/`removeLyric`, reused to add `addOrUpdateAnnotation`/`removeAnnotation`); existing `SmoNote` annotation methods (`addAnnotation`/`getAnnotations`/`removeAnnotations`, already implemented and unused, `src/smo/data/note.ts:530-591`); existing `SmoLyric` class (`src/smo/data/noteModifiers.ts`) extended with one new field; existing multi-selection-sync pattern from `SuiDynamicDialogAdapter`/`dynamicsDialogMenuOption` (`src/ui/dialogs/dynamics.ts`, `src/ui/menus/text.ts`), reused for annotation's "apply to every selected note" semantics.

**Storage**: N/A — operates on the in-memory `SmoLyric` (parser `annotation`) / `SmoNote` score model via `SuiScoreViewOperations`; the one schema change (`SmoLyric.verticalJustify`, new field, default `1`) uses the existing `smoSerialize` default-fill mechanism, so no migration code is needed and legacy scores are unaffected (Constitution Principle #1)

**Testing**: No automated unit/integration test runner is wired up in this repo (`npm test` is a no-op placeholder). Verification is manual: build with `npm run build`, serve with `npm run server`, and exercise the dialog in a browser against the demo/dev score app, per `quickstart.md`.

**Target Platform**: Browser (SVG-rendered score editor), same runtime as the rest of `src/ui`/`src/render`

**Project Type**: Single front-end library project (no frontend/backend split) — changes span `src/smo/data` (one new field + one bug fix), `src/render/sui` (two new score-operation methods), `src/render/vex` (two new rendering methods), and `src/ui` (one new menu option, one new dialog creation function, three new Vue components)

**Performance Goals**: No new performance targets; annotation rendering/offset-translation reuses the exact same per-note, per-render-pass mechanism already used for chords (`_updateChordOffsets`), so it adds the same constant per-note cost, not a new pass over the score

**Constraints**: Must not change the rendered appearance or behavior of existing lyrics or chords (the lyric/chord branches in `createLyric()`/`updateLyricOffsets()`/`getClassSelector()` are extended, not altered); must not add a score-wide "set annotation font" operation (out of scope per spec Assumptions — font/offset are per-instance); must not add a click/hit-test handler on rendered annotation SVG (explicitly out of scope, confirmed with user); a legacy score with no annotations must load/render identically to today (FR-011)

**Scale/Scope**: One new field + one bug fix in `src/smo/data/noteModifiers.ts`; two new methods in `src/render/sui/scoreViewOperations.ts`; two new methods in `src/render/vex/vxNote.ts` and `src/render/vex/vxSystem.ts`; one new menu option in `src/ui/menus/text.ts`; four new files under `src/ui/dialogs/` and `src/ui/components/dialogs/` (`annotationVue.ts`, `annotation.vue`, `annotationEditor.vue`, plus reuse of existing `numberInput.vue`/`select.vue`/`fontPicker.vue`/`dialogContainer.vue`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle #1 (Serialization)**: The one schema change (`SmoLyric.verticalJustify`) is added the same way `translateX`/`translateY` already were — a defaulted field picked up automatically by the existing `smoSerialize.serializedMerge`/`serializedMergeNonDefault` machinery. Legacy scores (no `verticalJustify`, no annotations at all) deserialize unchanged. **Gate: PASS.**
- **Principle #2 (Music editing/transformation logic)**: This feature adds no pitch/rhythm/accidental/clef logic; it is a text-attachment feature. Not applicable. **Gate: PASS (N/A).**
- **Principle #3 (Rendering performance)**: Reuses the exact existing per-note render/offset-update passes (`createLyric()`, `updateLyricOffsets()`) rather than adding a new full-score pass; no new DOM-measurement timing introduced. **Gate: PASS.**
- **Principle #4 (Logical dependencies)**: The new `SmoLyric.verticalJustify` field and `annotationVerticalJustify` constant live in `src/smo/data` and import nothing from VexFlow or the renderer — the chosen numeric values (`1`/`3`) merely happen to line up with VexFlow's own enum so `vxNote.ts` (a rendering-layer file, already VexFlow-dependent) can consume them without translation. `SmoNote.addAnnotation`/`getAnnotations`/`removeAnnotations` (reused, unmodified) are likewise UI/rendering-free. **Gate: PASS.**

No project-constitution gate specific to UI dialogs exists; per spec Assumptions, this plan follows the established Vue-dialog convention (`src/ui/dialogs/*.ts` creation functions paired with `src/ui/components/dialogs/*.vue` components) precedented by `010-vue-lyric-dialog` and `013-vue-chord-dialog`.

## Project Structure

### Documentation (this feature)

```text
specs/017-text-annotations/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/smo/data/
└── noteModifiers.ts               # MODIFIED: SmoLyric gets a new `verticalJustify` field (+ params/defaults/persistArray
                                    #   entries) and a new `annotationVerticalJustify` static constant; getClassSelector()
                                    #   extended from a binary lyric/chord map to a three-way lyric/chord/annotation map

src/smo/data/
└── note.ts                        # EXISTING addAnnotation/getAnnotations/removeAnnotations/removeAllAnnotations/
                                    #   getLyricForVerse (lines 530-598) — reused unmodified

src/render/sui/
└── scoreViewOperations.ts         # MODIFIED: add addOrUpdateAnnotation/removeAnnotation, copied from
                                    #   addOrUpdateLyric/removeLyric (lines 408-442)

src/render/vex/
├── vxNote.ts                      # MODIFIED: add addAnnotationToNote (modeled on addLyricAnnotationToNote,
                                    #   lines 159-183); createLyric() (lines 203-215) gets a third dispatch branch
                                    #   for getAnnotations()
└── vxSystem.ts                    # MODIFIED: add _updateAnnotationOffsets (modeled on _updateChordOffsets,
                                    #   lines 105-117); updateLyricOffsets() (line 166) calls it per note
                                    #   alongside the existing _updateChordOffsets(note) call

src/ui/menus/
└── text.ts                        # MODIFIED: add annotationDialogMenuOption to SuiTextMenuOptions, modeled on
                                    #   dynamicsDialogMenuOption (lines 118-150) for its multi-selection semantics

src/ui/dialogs/
├── lyricVue.ts                    # EXISTING — read as the closest structural precedent (mode/commit shape)
├── dynamics.ts                    # EXISTING SuiDynamicDialogAdapter — read for the multi-selection sync pattern
│                                   #   (syncModifiers), reused unmodified
└── annotationVue.ts                # NEW: SuiAnnotationDialogVue creation function

src/ui/components/dialogs/
├── lyric.vue                      # EXISTING — read as the closest structural precedent, not modified
├── lyricEditor.vue                # EXISTING — read as the closest structural precedent, not modified
├── numberInput.vue                # EXISTING — reused for X Offset (new consumer) and Y Offset
├── select.vue                     # EXISTING — reused for the new Vertical Justify control
├── fontPicker.vue                 # EXISTING — reused for per-instance Font
├── dialogContainer.vue            # EXISTING — reused for the dialog's own OK/Cancel/Delete shell
├── annotation.vue                  # NEW: top-level dialog component
└── annotationEditor.vue            # NEW: embeddable plain-text TipTap editor for one annotation (no advance emit)
```

**Structure Decision**: Single front-end project — no frontend/backend split. New files live under the existing `src/ui/dialogs/` (creation function) and `src/ui/components/dialogs/` (Vue components) directories, matching the established pairing convention. All other changes are additive extensions to existing files in `src/smo/data`, `src/render/sui`, `src/render/vex`, and `src/ui/menus` — no new top-level directories or build targets.

## Complexity Tracking

*No entries — Constitution Check has no violations.*

## Post-Design Constitution Check

*Re-evaluated after Phase 1 (data-model.md, contracts/, quickstart.md).* Design decisions in [research.md](./research.md) — reusing `SuiDynamicDialogAdapter`'s multi-selection sync pattern rather than inventing one; storing `verticalJustify` as a plain numeric field with values chosen to match (but not import) VexFlow's own enum; fixing `getClassSelector()`'s pre-existing lyric/chord binary assumption; extending `createLyric()`/`updateLyricOffsets()` with a third parallel branch rather than restructuring them — all stay within the existing conventions of the lyric/chord/dynamics features they're modeled on, touch no pitch/rhythm logic, add no new full-score render pass, and keep `src/smo/data` free of rendering dependencies. **Gate: PASS.**
