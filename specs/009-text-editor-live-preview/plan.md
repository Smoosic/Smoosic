# Implementation Plan: Text Editor Live Preview and Active-Font Sync

**Branch**: `009-text-editor-live-preview` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-text-editor-live-preview/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Extend the existing text-group editing dialog (`SuiTextBlockDialogVue` / `textBlockVue.ts`, rendered via `textBlock.vue` and `textGroupEditor.vue`) so that: (1) the rich-text editing surface already initializes and tracks the active block's font — this behavior exists today and simply needs to be preserved/verified; (2) while the user types, the in-progress content is periodically (debounced) pushed into the score's rendering via the existing `SuiScoreViewOperations.updateTextGroup()` / `groupUndo()` machinery, so the edit is visible in context without ending the edit session; and (3) the `SmoTextGroup` being edited is rendered at a reduced, non-persisted opacity by the SVG text renderer (`scoreRender.ts` / `textRender.ts`) for the duration of editing, reverting to normal opacity on commit or cancel. No new persisted data, no new external interfaces — this is a rendering/UX refinement of an existing dialog flow.

## Technical Context

**Language/Version**: TypeScript 5.9 (compiled via `tsc`/`ts-loader`), Vue 3.5 Single-File Components (`<script setup>`)

**Primary Dependencies**: Vue 3, `@tiptap/vue-3` + `@tiptap/starter-kit` (rich-text editing surface used by `textGroupEditor.vue`), the project's own `vexflow_smoosic` SVG rendering fork (`src/render/sui`), no new third-party dependency is introduced

**Storage**: N/A — in-memory `SmoScore`/`SmoTextGroup` object graph only; nothing here is persisted to disk/XML/JSON beyond what already round-trips today

**Testing**: No automated test harness is currently wired up in this repository (`npm test` is a no-op placeholder); validation for this feature is manual, browser-based, per the `quickstart.md` produced in Phase 1, consistent with the constitution's note that UI/rendering regressions are a lower priority than music-logic correctness. Any new *non-UI* pure logic introduced (e.g., the opacity-flag lifecycle helper) should still be written so it is unit-testable even though no harness currently exercises it.

**Target Platform**: Browser (client-side web app / embeddable library), no server component involved in this feature

**Project Type**: Single-project web application/library (existing `src/` tree: `smo/` data model, `render/sui/` SVG rendering, `ui/` Vue dialogs/components)

**Performance Goals**: The periodic live-preview update must not introduce perceptible input lag while typing, and must not degrade the rendering performance safeguards already in place for large scores (see Constraints)

**Constraints**: `SuiScoreRender.rerenderTextGroups()` (invoked by `updateTextGroup()`) unrenders and re-renders **every** text group on the score, not just the one being edited; per Constitution Principle #3 (SVG rendering performance), the periodic update must therefore be **debounced** (fire only after a short pause in typing, not per keystroke) to keep this bounded and avoid needless repainting/reflow on scores with many text groups

**Scale/Scope**: Touches 3 existing files (`textGroupEditor.vue`, `scoreText.ts`, `scoreRender.ts`/`textRender.ts`) plus no new files; no schema/serialization format changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle #1 (Serialization)**: PASS. The "being edited" state needed to drive reduced opacity is modeled as a new **non-serialized, session-only** field on `SmoTextGroup`, following the exact precedent already set by the existing `edited` and `skipRender` fields (both excluded from `SmoTextGroup.defaults`/`nonTextAttributes` and therefore never written to or expected from serialized scores). Legacy scores are unaffected because the field is never read from or written to saved JSON.
- **Principle #2 (Music editing/transformation logic)**: N/A. This feature does not change pitch, duration, selection, accidental, or clef logic — it only affects text-group content timing and rendering. No new transformation logic requires regression testing under this principle.
- **Principle #3 (Rendering performance)**: PASS, with a design constraint. Because `updateTextGroup()` currently re-renders *all* text groups, the plan requires debouncing the periodic preview (see Constraints above) rather than updating on every keystroke, so this feature does not introduce a repainting regression. This is called out explicitly in `research.md`.
- **Principle #4 (Logical dependencies)**: PASS. The new opacity-driving field lives on the `smo` data class (`SmoTextGroup`), matching the existing `skipRender` pattern; only the rendering layer (`scoreRender.ts`/`textRender.ts`) reads it to decide how to draw. No UI/Vue code is imported into `smo/`, and no rendering logic is imported into UI dialog code beyond the existing `SuiScoreViewOperations` boundary.

No violations requiring the Complexity Tracking table.

*Post-Phase-1 re-check*: `data-model.md`, `contracts/ui-contract.md`, and `quickstart.md` (below) do not introduce anything beyond what was gated above — no new persisted fields, no new external interfaces, and the debounced-update constraint from Principle #3 is carried through explicitly into the UI contract (§3) and `research.md` (§4). Gate remains PASS.

## Project Structure

### Documentation (this feature)

```text
specs/009-text-editor-live-preview/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
# Single project (existing Smoosic layout; no new top-level directories)
src/
├── smo/
│   └── data/
│       └── scoreText.ts          # SmoTextGroup: add non-serialized "being edited" flag
├── render/
│   └── sui/
│       ├── scoreRender.ts        # renderTextGroup(): apply/skip reduced opacity per flag
│       ├── textRender.ts         # SuiInlineText/SuiTextBlock render(): set opacity on <g> elements
│       └── scoreViewOperations.ts # updateTextGroup()/groupUndo() reused as-is for live preview + single-step undo
└── ui/
    ├── dialogs/
    │   └── textBlockVue.ts       # sets/clears the "being edited" flag on dialog open/commit/cancel
    └── components/
        └── dialogs/
            ├── textBlock.vue         # unchanged wiring; hosts textGroupEditorComp
            └── textGroupEditor.vue   # add debounced periodic sync-and-preview on tiptap "update" event
```

**Structure Decision**: Single existing project (no frontend/backend split, no new packages). This feature is implemented entirely within the current `src/smo`, `src/render/sui`, and `src/ui` trees, following the layering the constitution already mandates (data model → renderer → UI dialog), and touches no other part of the codebase.

## Complexity Tracking

*No Constitution Check violations were identified; this table is intentionally empty.*
