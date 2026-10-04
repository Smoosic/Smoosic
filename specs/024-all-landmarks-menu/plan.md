# Implementation Plan: Add All Landmarks Menu Option

**Branch**: `024-all-landmarks-menu` | **Date**: 2026-10-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/024-all-landmarks-menu/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add an "All" leaf option to the existing landmark submenu (`landmarkOptions` in `src/ui/menus/text.ts`), whose handler loops over the same seven landmark purposes in the same order as the existing per-purpose options (Title, Subtitle, Composer, Copyright, Date, Page Number, Part), and for each one that is both "available" (reusing the existing `sourceTextDefined` gate already used by each individual option's `display`) and not already present (reusing the existing `findLandmark` lookup), creates it the same way the individual option does (`resolveLandmarkText`/`resolveLandmarkMeasureText`/`findAboveLandmark`/`SmoTextGroup.createLandmarkText`/`view.addTextGroup`) — but, unlike the individual option's handler, never calls `SuiTextBlockDialogVue`. No new "close the menu" logic is needed: `SuiConfiguredMenu.selection()`/`menu.vue`'s `selectItem()` already call `menu.complete()` unconditionally right after any leaf option's handler returns, which is exactly what closes the menu today for every other option — "All" gets this for free simply by not opening a dialog at the end.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict)

**Primary Dependencies**: Existing menu infrastructure (`SuiConfiguredMenuOption`, `SuiConfiguredMenu`, `src/ui/menus/menu.ts`); the existing landmark-creation helpers already defined in `src/ui/menus/text.ts` (`findLandmark`, `findAboveLandmark`, `sourceTextDefined`, `resolveLandmarkText`, `resolveLandmarkMeasureText`, `landmarkOptions`' purpose/label/icon list); `SmoTextGroup.createLandmarkText` (`src/smo/data/scoreText.ts`); `SuiScoreViewOperations.addTextGroup` (`src/render/sui/scoreViewOperations.ts`) — all unmodified, reused as-is.

**Storage**: N/A — creates ordinary `SmoTextGroup` landmarks via the existing `view.addTextGroup` path, the same persisted representation every other landmark (individually created or MusicXML-imported) already uses. No new fields, no new schema.

**Testing**: No automated UI/menu test runner is wired up in this repo (`npm test` is a no-op placeholder; established pattern per `020-annotation-drag-tool`/`023-text-drag-controls`). The "which purposes count as available and missing" selection logic is a thin loop over already-existing, already-correct helpers (`findLandmark`, `sourceTextDefined`) with no new business logic of its own worth a dedicated headless test; verification is manual via `quickstart.md`.

**Target Platform**: Browser (same menu system as the rest of `src/ui/menus`)

**Project Type**: Single front-end library project — this feature is scoped entirely to one new option object in one existing file (`src/ui/menus/text.ts`); no other layer changes.

**Performance Goals**: No new performance target. Creating N missing landmarks performs N sequential calls to the existing `view.addTextGroup` (each of which does one full text-group unrender/re-render pass, per its current implementation) — identical per-call cost to selecting N individual landmark options one at a time today, just without the intervening dialog opens/closes. N is bounded by the fixed set of seven landmark purposes, so this is a small, one-off cost incurred only when the user deliberately chooses to bulk-populate landmarks, not a hot path.

**Constraints**: Must not change the behavior, placement, or appearance of any landmark created through its existing individual menu option (FR-006 — same creation/placement helpers, same order, reused unmodified). Must not alter or recreate any landmark that already exists (FR-003). Must never open `SuiTextBlockDialogVue` or any other dialog (FR-004), for both the "created some" and "created none" cases (FR-005).

**Scale/Scope**: One new `SuiConfiguredMenuOption` ("All") added to the existing `landmarkOptions` array in `src/ui/menus/text.ts`; no new files, no new classes, no changes to `SmoTextGroup`, `SuiScoreViewOperations`, or the menu framework itself.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle #1 (Serialization)**: No new fields, no schema change — "All" only calls the already-shipped `SmoTextGroup.createLandmarkText` / `view.addTextGroup` path, producing ordinary landmark `SmoTextGroup`s indistinguishable from ones created individually or via MusicXML import. **Gate: PASS.**
- **Principle #2 (Music editing/transformation logic)**: Not applicable — this is a menu/UI feature with no pitch/rhythm/accidental/clef logic, and introduces no new text-position math (it reuses `createLandmarkText`'s existing, already-covered-by-precedent placement logic unmodified). **Gate: PASS (N/A).**
- **Principle #3 (Rendering performance)**: No new rendering code path. Each created landmark goes through the exact same `view.addTextGroup` → `renderer.rerenderTextGroups()` call every individual landmark creation already uses today; "All" just issues that same call up to seven times in a row instead of the user doing so one menu-visit at a time. **Gate: PASS.**
- **Principle #4 (Logical dependencies)**: The new option lives in `src/ui/menus/text.ts` (UI/menu layer, already where `landmarkOption`/`landmarkOptions` live), calling only existing `src/smo/data` (`SmoTextGroup.createLandmarkText`) and `src/render/sui` (`SuiScoreViewOperations.addTextGroup`) entry points exactly as its sibling options already do. No new coupling introduced. **Gate: PASS.**

No project-constitution gate specific to menus exists; per spec Assumptions, this plan extends the established landmark-menu precedent (`021-landmark-text-menu`) rather than introducing a new pattern.

## Project Structure

### Documentation (this feature)

```text
specs/024-all-landmarks-menu/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/ui/menus/
└── text.ts                        # MODIFIED: add an `allLandmarksOption` (or equivalently-named)
                                    #   SuiConfiguredMenuOption, appended to the existing
                                    #   `landmarkOptions` array (lines ~366-374) that feeds
                                    #   `landmarkTextMenuOption.subMenu` — no other file touched
```

**Structure Decision**: Single front-end project — no frontend/backend split, no new directories or files. The entire feature is one additional entry in an existing array in one existing file, reusing every helper function already defined immediately above it in that same file.

## Complexity Tracking

*No entries — Constitution Check has no violations.*

## Post-Design Constitution Check

*Re-evaluated after Phase 1 (data-model.md, contracts/, quickstart.md).* Design decisions in [research.md](./research.md) confirm: "available and missing" reuses `sourceTextDefined`/`findLandmark` directly rather than introducing a parallel eligibility check (no risk of the bulk path ever disagreeing with what the individual options show); creation order reuses the existing `landmarkOptions` array order unmodified, so `findAboveLandmark`'s column-stacking (which depends on what's already been added) produces the same stacking result as if the user created the same set one at a time in that order; "closing the menu" requires no new code, since the existing `selection()`/`selectItem()` leaf-option flow already calls `menu.complete()` right after any handler returns. No `src/smo/data` or `SuiScoreViewOperations` change, no new persisted fields, no new render path. **Gate: PASS.**
