# Implementation Plan: Reposition Text on Layout Resize

**Branch**: `022-text-reposition-on-resize` | **Date**: 2026-09-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/022-text-reposition-on-resize/spec.md`

## Summary

`SuiScoreView.setGlobalLayout()` is supposed to keep `SmoTextGroup` positions visually stable when a user changes svg scale, page width, or page height in the Global Layout dialog, but the svg-scale compensation is broken and page-dimension compensation doesn't exist. The root cause is that `globalLayout.ts` wraps the score's *live* `globalLayout` object in a Vue `reactive()` proxy and edits it in place, so by the time `setGlobalLayout` reads "the old value" it is already reading the new one. The fix threads an explicit previous-value snapshot from the dialog into `setGlobalLayout`, and adds a page-dimension-ratio repositioning step (in addition to the existing svg-scale-ratio step) inside a new UI-free helper in the `src/smo` data layer, applied consistently to the view score, the store score, and — where a layout's own text groups are involved — any part whose `SmoLayoutManager` is the one that changed.

## Technical Context

**Language/Version**: TypeScript (compiled via the project's own `build/build.js`), Vue 3 `<script setup>` for the dialog layer.

**Primary Dependencies**: Vue 3 (`reactive`/`watch` in `src/ui/dialogs/globalLayout.ts` and `src/ui/components/dialogs/scoreLayout.vue`); existing SMO data model (`SmoScore`, `SmoTextGroup`, `SmoLayoutManager` in `src/smo/data`); VexFlow-based renderer (`SuiRenderer`), which only needs to re-render after the fix — it is not otherwise touched.

**Storage**: N/A — in-memory `SmoScore` object graph only; changes must round-trip correctly through `SmoScore.serialize`/`deserialize` (JSON), but no new persisted fields are introduced.

**Testing**: Headless, UI-free `ts-node` scripts under `tests/` that import `src/smo` classes directly and assert with a small `check()` helper, matching the existing `tests/attachedTextMigration.ts` pattern (each backed by a `npm run test:<name>` script and a `contracts/*.md` case list). No browser/rendering test is added, per the constitution's lower priority on rendering-UI regression.

**Target Platform**: Browser-based web app (client-side); headless tests run under Node via `ts-node`.

**Project Type**: Single project (library + application) — existing `src/` (library/app source) and `tests/` (headless regression scripts) structure; no new top-level project is introduced.

**Performance Goals**: N/A beyond "no regression" — this runs once per Global Layout dialog commit (or equivalent programmatic layout change), operating over at most a few dozen `SmoTextGroup` objects; it is not in the per-frame or per-measure render path.

**Constraints**: Must preserve `scoreLayout.vue`'s existing live-editing UX (the dialog mutates a reactive object as the user types, with per-field two-way binding) — the fix changes what `globalLayout.ts` does with that mutation, not how the Vue component binds to it. Must not add new persisted fields to `SmoGlobalLayout`/`SmoTextGroup` (Principle #1). Must not introduce rendering/UI dependencies into `src/smo` (Principle #4).

**Scale/Scope**: Typical scores have a handful of text groups (title, composer, footer); heavily annotated scores may have dozens. Applies to both the score's own `SmoLayoutManager` and each staff's `partInfo.layoutManager`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle #1 (Serialization)** — PASS. No new fields are added to `SmoGlobalLayout`, `SmoTextGroup`, or their serialized JSON shapes; only the in-memory numeric values of existing fields (`x`, `y`, `musicXOffset`, `musicYOffset`) are recalculated. Existing legacy-score upconversion paths in `score.ts` are unaffected.
- **Principle #2 (Non-UI transformation logic regression testing)** — PASS, with an explicit deliverable: the new repositioning math lives in `src/smo` and ships with a headless `tests/*.ts` regression script and a `contracts/*.md` case list, matching the project's established pattern (see spec 019).
- **Principle #3 (Rendering performance)** — PASS. The change is confined to a rare, user-initiated dialog-commit action; it does not add per-measure or per-render-frame work, and does not change `scoreRender.ts`/`renderState.ts`/Vex rendering hot paths.
- **Principle #4 (Logical dependencies)** — PASS. The new repositioning helper is added to `src/smo/data` (alongside the existing `scaleTextGroups`), with no Vue/DOM/rendering imports. `scoreViewOperations.ts` (the render/sui bridge layer) remains the only place that calls it, consistent with how it already calls `scaleTextGroups`.

No violations requiring the Complexity Tracking table.

## Project Structure

### Documentation (this feature)

```text
specs/022-text-reposition-on-resize/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── reposition-contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── smo/
│   └── data/
│       ├── score.ts           # existing scaleTextGroups(); add repositionTextGroups(oldLayout, newLayout)
│       └── scoreText.ts       # existing SmoTextGroup.scaleText(); add a page-dimension-ratio counterpart
├── render/
│   └── sui/
│       └── scoreViewOperations.ts   # setGlobalLayout(layout, previousLayout) — orchestrates score/storeScore/part mirroring
└── ui/
    └── dialogs/
        └── globalLayout.ts     # keeps and updates the "previous value" snapshot, passes it to setGlobalLayout

tests/
└── globalLayoutTextReposition.ts   # new headless regression script (ts-node, no DOM/rendering)
```

**Structure Decision**: Single project, using the existing `src/smo` (data/model, UI-free) vs. `src/render/sui` (rendering/UI bridge) vs. `src/ui` (Vue dialogs) layering already established in the codebase. No new directories or projects are needed; the fix and its test fit entirely inside the existing `src/` and `tests/` trees.

## Complexity Tracking

*No Constitution Check violations — table not needed.*
