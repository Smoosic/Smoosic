# Implementation Plan: Multiple Annotations Per Note

**Branch**: `018-annotation-index-selector` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/018-annotation-index-selector/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Extend the Annotation dialog (`017-text-annotations`) to support up to 4 independent annotations per note, reusing `SmoLyric.verse` — the exact same field that already lets lyrics and chords have multiple lines on one note — as the internal "index." No data-model, score-operation, or rendering changes are needed: `VxNote.createLyric()`/`VxSystem._updateAnnotationOffsets()` were already written in `017` to iterate over *every* annotation a note has, not just the first, and `SmoNote.addAnnotation`/`getAnnotations`/`removeAnnotations` already key off `(parser, verse)` generically. The entire feature is a dialog-layer change: `annotation.vue` gains a "+" control (visible below 4 annotations), an index dropdown (visible at 2+ annotations), and a remove-and-renumber operation that shifts every higher-indexed annotation down by one so indices stay contiguous — new logic, since inspection during planning found lyrics don't actually renumber on removal today (the feature description's "like with lyric" describes the desired behavior by analogy, not existing code to copy). `annotation.vue`'s props change from a single `annotation: SmoLyric` to `annotations: SmoLyric[]` + `initialIndex`; `annotationVue.ts` is updated to resolve that list from the first selected note. `src/ui/menus/text.ts` needs no changes — it already guarantees at least one annotation exists before the dialog opens, and the dialog now independently discovers the rest.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Vue 3.5 SFCs (`<script setup lang="ts">`)

**Primary Dependencies**: None new. Reuses `017-text-annotations`'s `SuiScoreViewOperations.addOrUpdateAnnotation`/`removeAnnotation` (unmodified), `SmoNote.getAnnotations`/`addAnnotation`/`removeAnnotations` (unmodified, `src/smo/data/note.ts`), and the existing `select.vue`/`numberInput.vue`/`fontPicker.vue` dialog components (unmodified).

**Storage**: N/A — no schema change; `verse` already exists on `SmoLyric` and is already fully serialized/deserialized (used today by lyrics and chords).

**Testing**: No automated test runner is wired up in this repo (`npm test` is a no-op placeholder). Verification is manual: `npm run build` + `npm run server`, exercised against `quickstart.md`.

**Target Platform**: Browser (SVG-rendered score editor), same runtime as the rest of `src/ui`

**Project Type**: Single front-end library project (no frontend/backend split) — changes are confined to `src/ui/dialogs/annotationVue.ts` and `src/ui/components/dialogs/annotation.vue`

**Performance Goals**: No new performance targets; at most 4 small `SmoLyric` mutations per selection per user action (add/remove), well within the existing per-note render/offset-update cost already paid for any number of annotations (research.md §1)

**Constraints**: Must not modify `src/ui/menus/text.ts`, `src/render/sui/scoreViewOperations.ts`, `src/render/vex/vxNote.ts`, `src/render/vex/vxSystem.ts`, or any lyric/chord behavior — this feature is additive within the annotation dialog only (research.md §1, §2, §4); removal-and-renumber logic is annotation-specific and must not be generalized onto the existing (non-renumbering) lyric removal path

**Scale/Scope**: Two files modified (`src/ui/dialogs/annotationVue.ts`, `src/ui/components/dialogs/annotation.vue`); no new files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle #1 (Serialization)**: No schema change — `verse` is already a persisted field, already exercised by lyrics/chords today. **Gate: PASS.**
- **Principle #2 (Music editing/transformation logic)**: N/A — no pitch/rhythm/accidental/clef logic touched. **Gate: PASS (N/A).**
- **Principle #3 (Rendering performance)**: No rendering-layer changes at all; the existing per-note render/offset passes already handle any number of annotations (research.md §1). **Gate: PASS.**
- **Principle #4 (Logical dependencies)**: No `src/smo` changes. All new logic is UI-layer (`annotation.vue`), calling existing score-operation methods exactly as `017` already did for its own per-field sync. **Gate: PASS.**

## Project Structure

### Documentation (this feature)

```text
specs/018-annotation-index-selector/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/ui/dialogs/
└── annotationVue.ts               # MODIFIED (017 → 018): resolves the full `annotations: SmoLyric[]` list
                                    #   from view.tracker.selections[0].note.getAnnotations() instead of
                                    #   passing through a single `annotation` prop; computes `initialIndex`

src/ui/components/dialogs/
└── annotation.vue                 # MODIFIED (017 → 018): `annotations`/`initialIndex` props replace
                                    #   `annotation`; new `annotationList`/`currentIndex`/`currentAnnotation`
                                    #   reactive state (data-model.md); new `addAnnotation()` ("+") and
                                    #   `removeAndRenumber()` operations; new "+" control and index
                                    #   `selectComp` in the mode === 'dialog' template section

# Unchanged (verified sufficient as-is, research.md §1, §4):
src/ui/menus/text.ts
src/render/sui/scoreViewOperations.ts
src/render/vex/vxNote.ts
src/render/vex/vxSystem.ts
src/smo/data/noteModifiers.ts
src/smo/data/note.ts
```

**Structure Decision**: Single front-end project, no new files or directories. This is a scoped enhancement to the two dialog-layer files `017-text-annotations` introduced.

## Complexity Tracking

*No entries — Constitution Check has no violations.*

## Post-Design Constitution Check

*Re-evaluated after Phase 1 (data-model.md, contracts/, quickstart.md).* The renumbering algorithm (research.md §6) is expressed entirely via the two existing single-selector score-operation methods from `017`, processed in ascending verse order to avoid transient slot collisions — no new score-operation method, no new data field, no rendering change. Re-reading the display list fresh from the first selected note after every mutation (research.md §5), rather than hand-patching a cached array, keeps the dialog correct even if a multi-note selection's notes have independently diverged annotation counts (an edge case the spec explicitly allows for). **Gate: PASS.**
