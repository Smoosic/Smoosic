# Implementation Plan: Rehearsal Mark Properties Dialog

**Branch**: `025-rehearsal-mark-dialog` | **Date**: 2026-10-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/025-rehearsal-mark-dialog/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Make `SmoRehearsalMark` selectable (by mouse click and by the existing keyboard modifier-cycling) and give it a Vue properties dialog, following the same "make an existing modifier selectable + add a Vue dialog" pattern already established for `SmoVolta`/`SmoPedalMarking`. Three gaps block this today (confirmed by reading the current code, not assumed): (1) `SmoRehearsalMark.logicalBox` is never populated by the renderer (`src/render/vex/vxMeasure.ts`'s `stave.setSection(rm.symbol, 0)` is purely decorative, unlike `SmoVolta`'s own box computed in `src/render/vex/vxSystem.ts`), so there is nothing to hit-test a mouse click against; (2) `SuiMapper._createLocalModifiersList()` (`src/render/sui/mapper.ts`) has a block for `SmoVolta`/`SmoTempo` but none for `SmoRehearsalMark`, so it can never become the tracker's selected modifier; (3) `SmoRehearsalMark` is absent from `ModifiersWithDialogNames` in `src/ui/dialogs/factory.ts`, and no adapter/dialog exists for it at all (unlike every other modifier type, which already has one). This plan closes all three gaps, adds a new `SuiRehearsalMarkAdapter` (modeled on `SuiVoltaAdapter`) plus matching `updateRehearsalMark`/`removeRehearsalMark` methods on `SuiScoreViewOperations` (modeled on the existing `updateEnding`/`removeEnding`), and a new Vue dialog (modeled on `pedalMarkingVue.ts`/`pedalMarking.vue`) — while leaving the existing `toggleRehearsalMark()` creation/removal menu command completely untouched (spec FR-009).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), Vue 3.5 SFCs (`<script setup lang="ts">`)

**Primary Dependencies**: Existing tracker/selection infrastructure (`SuiMapper._createLocalModifiersList`/`SuiTracker` in `src/render/sui/mapper.ts`/`tracker.ts`, `SvgPageMap.findModifierTabs` in `src/render/sui/svgPageMap.ts`); existing modifier-dialog dispatch (`SuiModifierDialogFactory`/`ModifiersWithDialogNames` in `src/ui/dialogs/factory.ts`, invoked from `src/application/eventHandler.ts`'s `createModifierDialog`); the established Vue-dialog-over-reused-adapter precedent (`src/ui/dialogs/volta.ts` + `voltaVue.ts` + `components/dialogs/volta.vue`; `pedalMarking.ts` + `pedalMarkingVue.ts` + `components/dialogs/pedalMarking.vue`); existing `SmoOperation.addRehearsalMark`/`removeRehearsalMark` (`src/smo/xform/operations.ts`); existing `SmoRehearsalMark` model and `SmoMeasure.getRehearsalMark()` (`src/smo/data/measureModifiers.ts`, `src/smo/data/measure.ts`); the existing per-system post-layout render pass where `SmoVolta.logicalBox` is computed today (`src/render/vex/vxSystem.ts`), used as the pattern for computing `SmoRehearsalMark.logicalBox` without touching the forked `vexflow_smoosic` package's `StaveSection` class.

**Storage**: N/A — no new fields, no schema change. `SmoRehearsalMark` already has `symbol`, `cardinality`, `increment`, and `position`; `logicalBox: SvgBox | null` already exists on the `SmoMeasureModifierBase` it extends — this feature is the first time anything actually assigns it a value.

**Testing**: No automated UI/selection/dialog test runner is wired up in this repo (`npm test` is a no-op placeholder; established pattern per `020-annotation-drag-tool`/`023-text-drag-controls`/`024-all-landmarks-menu`). All the new logic here (tracker wiring, box computation, dialog adapter) is render/UI-layer control flow with no new pure-data transformation worth a headless test; verification is manual via `quickstart.md`.

**Target Platform**: Browser (SVG-rendered score editor), same runtime as the rest of `src/ui`/`src/render`

**Project Type**: Single front-end library project (no frontend/backend split) — changes span `src/render/vex` (box computation), `src/render/sui` (tracker wiring, new view-operation methods), `src/ui/dialogs` (new adapter + Vue wiring function, factory registration), and `src/ui/components/dialogs` (new Vue component)

**Performance Goals**: No new performance target. Computing `SmoRehearsalMark.logicalBox` is a one-time, per-render, per-existing-mark cost (at most one per measure, since only one rehearsal mark can exist per measure) using the same text-metric estimation `StaveSection.draw()` already performs internally — not a new DOM measurement/reflow pass, matching the cost already accepted for `SmoVolta`'s equivalent box computation.

**Constraints**: Must not change `toggleRehearsalMark()`'s existing create/toggle/remove behavior or its hardcoded-defaults semantics (spec FR-009/SC-005). The computed `logicalBox` must correspond to where `StaveSection.draw()` (the forked VexFlow library's own stave-section modifier) actually draws the glyph, or mouse-click hit-testing will silently miss — this plan computes it by replicating that class's own geometry formula in Smoosic's own render layer rather than modifying the forked library. The dialog must not expose `SmoRehearsalMark.position`, which the codebase itself marks as non-functional (`// TODO: positions don't work` in `measureModifiers.ts`) — per spec Assumptions.

**Scale/Scope**: One new adapter file (`src/ui/dialogs/rehearsalMark.ts`), one new Vue-wiring file (`rehearsalMarkVue.ts`), one new Vue component (`components/dialogs/rehearsalMark.vue`); small, additive edits to four existing files (`mapper.ts` +1 block, `factory.ts` +1 branch +1 list entry, `scoreViewOperations.ts` +2 methods, `vxSystem.ts` +box-computation pass mirroring the existing Volta one). No changes to `SmoRehearsalMark` itself, no changes to `toggleRehearsalMark`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle #1 (Serialization)**: No new fields, no schema change — `symbol`/`cardinality`/`increment`/`position` already exist and already serialize; `logicalBox` is already a non-serialized, ephemeral render-layer field on the base class (same as every other modifier's). A legacy score deserializes identically. **Gate: PASS.**
- **Principle #2 (Music editing/transformation logic)**: Not applicable — no pitch/rhythm/accidental/clef logic touched; this is selection/rendering/dialog plumbing for an existing text-like marking. **Gate: PASS (N/A).**
- **Principle #3 (Rendering performance)**: The new box computation is a per-existing-mark, per-render estimate (text-metric lookup), not a forced DOM measurement/reflow — the same category of cost `SmoVolta`'s already-accepted box computation in `vxSystem.ts` incurs today. No new full-score render pass is added; the dialog's live-update calls (`updateRehearsalMark`) reuse the existing `renderer.setRefresh()`/`updatePromise()` path every other modifier dialog's update method already uses. **Gate: PASS.**
- **Principle #4 (Logical dependencies)**: The new adapter (`src/ui/dialogs/rehearsalMark.ts`) and tracker wiring (`mapper.ts`) live in the UI/render layers, exactly where their `SmoVolta`/`SmoTempo` counterparts already live; `SmoRehearsalMark` itself (`src/smo/data`) is read from, never modified to know about the UI. The box-computation addition lives in `src/render/vex` (already DOM/VexFlow-aware), replicating `StaveSection`'s own geometry rather than reaching into the forked library — keeping the change contained to this repository. **Gate: PASS.**

No project-constitution gate specific to modifier dialogs exists; per spec Assumptions, this plan follows the established "make an existing modifier selectable + Vue dialog" precedent (`004-vue-modifier-dialogs`, and the `SmoVolta`/`SmoPedalMarking` dialogs it produced) rather than inventing a new pattern.

## Project Structure

### Documentation (this feature)

```text
specs/025-rehearsal-mark-dialog/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/render/vex/
└── vxSystem.ts                    # MODIFIED: add a rehearsal-mark box-computation pass,
                                    #   mirroring the existing per-system Volta box pass (lines
                                    #   ~550-591) — for each measure with a rehearsal mark, compute
                                    #   logicalBox by replicating StaveSection.draw()'s own x/y/
                                    #   width/height formula (vexflow_smoosic's stavesection.ts),
                                    #   using smoMeasure.svg.staffX / smoMeasure.svg.logicalBox.y

src/render/sui/
├── mapper.ts                      # MODIFIED: add a getModifiersByType('SmoRehearsalMark') block
                                    #   to _createLocalModifiersList(), alongside the existing
                                    #   SmoVolta/SmoTempo blocks (lines ~158-165)
└── scoreViewOperations.ts         # MODIFIED: add updateRehearsalMark(mark)/removeRehearsalMark(mark)
                                    #   methods (modeled on updateEnding/removeEnding, lines
                                    #   ~1451-1480), resolving the owning measure/selection by
                                    #   searching for the measure whose current rehearsal mark's
                                    #   id matches `mark`'s, across both score and storeScore
                                    #   (research.md) — toggleRehearsalMark() itself is unmodified

src/ui/dialogs/
├── rehearsalMark.ts               # NEW: SuiRehearsalMarkAdapter (modeled on SuiVoltaAdapter in
                                    #   volta.ts) — getter/setters for symbol, cardinality,
                                    #   increment (not position, per spec Assumptions); commit/
                                    #   cancel/remove methods calling the new view methods above
├── rehearsalMarkVue.ts             # NEW: SuiRehearsalMarkDialogVue wiring function (modeled on
                                    #   pedalMarkingVue.ts), wraps SuiRehearsalMarkAdapter
└── factory.ts                     # MODIFIED: add 'SmoRehearsalMark' to ModifiersWithDialogNames
                                    #   and a branch in SuiModifierDialogFactory.createModifierDialog
                                    #   calling SuiRehearsalMarkDialogVue (mirrors the SmoVolta branch)

src/ui/components/dialogs/
└── rehearsalMark.vue              # NEW: Vue component (modeled on pedalMarking.vue) — symbol
                                    #   text field, cardinality select, increment checkbox
```

**Structure Decision**: Single front-end project — no frontend/backend split. Every new file sits alongside its direct precedent (`rehearsalMark.ts` beside `volta.ts`/`pedalMarking.ts`; `rehearsalMarkVue.ts` beside `voltaVue.ts`/`pedalMarkingVue.ts`; `rehearsalMark.vue` beside `volta.vue`/`pedalMarking.vue`); the four modified files each receive one additive, narrowly-scoped change in the exact location their `SmoVolta`/`SmoTempo` counterparts already occupy. No new top-level directories, no changes to `SmoRehearsalMark`, `SuiDialogParams`, or `eventHandler.ts`'s shared dialog-launch path.

## Complexity Tracking

*No entries — Constitution Check has no violations.*

## Post-Design Constitution Check

*Re-evaluated after Phase 1 (data-model.md, contracts/, quickstart.md).* Design decisions in [research.md](./research.md) confirm: the owning-measure lookup for `updateRehearsalMark`/`removeRehearsalMark` is resolved by searching for the mark's `attrs.id` across `score`/`storeScore` (mirroring the existing `findLandmark`-style identity search already used elsewhere, `src/ui/menus/text.ts`), deliberately avoiding any change to `SuiDialogParams` or `eventHandler.ts` — infrastructure every other modifier dialog also depends on; the box computation replicates `StaveSection`'s own internal geometry formula in Smoosic's own render layer rather than modifying the forked `vexflow_smoosic` package, keeping the whole feature contained to one repository. No `src/smo/data` schema change, no new persisted fields, no new full-score render pass, no change to `toggleRehearsalMark()`. **Gate: PASS.**
