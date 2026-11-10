# Implementation Plan: Per-Measure Beam Groups

**Branch**: `038-per-measure-beam-groups` (work is on `main`; no feature branch was created) | **Date**: 2026-11-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/038-per-measure-beam-groups/spec.md`

## Summary

Add a measure modifier, `SmoBeamPreferences`, that holds a list of 1 to 4 for the measure's beam groups, and teach the beamer to use it. Today the beamer decides where a beam ends from a per-note value (`beamBeats`) that comes from the score-wide duple/triple default. A measure with a non-empty grouping skips that logic: the beamer turns the list into tick positions (the list repeated from its first number, in eighth-note or sixteenth-note units) and ends a beam group at each position. Measures with no grouping keep the existing logic untouched, so old scores beam as before.

On top of that sit one model operation (apply a grouping to a set of measures, or clear it), one view method that wraps it in a single undo step, a "Beam Groups" dialog (a Vue dialog like the key signature dialog, with an Apply To choice of selected measures or whole score), and a menu entry in the Beams menu.

## Technical Context

**Language/Version**: TypeScript; Vue 3 single-file component for the dialog. Tests run with `ts-node`.

**Primary Dependencies**: None new. Reuses `SmoMeasureModifierBase`, `SmoDynamicCtor`, `SmoBeamer`, `SmoSelection`, `InstallDialog`, `dialogContainer.vue`, `select.vue`.

**Storage**: The grouping is a measure modifier, saved in the measure's `modifiers` array as `{ ctor: 'SmoBeamPreferences', groups: [3, 2] }`. An empty grouping is not stored, so scores that never use the feature serialize exactly as before. The `.smz` dictionary compression builds its key dictionary from the data, so the new key needs no table entry (checked in research R6).

**Testing**: Headless `ts-node` script `tests/beamGroups.ts` (npm script `test:beam-groups`), following `tests/beamDotted.ts` and `tests/createPart.ts`. It covers the boundary calculation, beaming results, serialization round trip and legacy load, and the model operation. The dialog and menu are checked by compilation and the manual steps in [quickstart.md](quickstart.md), as the constitution allows.

**Target Platform**: Browser application and library.

**Project Type**: Single project.

**Performance Goals**: The boundary list is computed once per measure per beaming pass (a handful of additions). No extra DOM measurement and no extra repaint. Applying a grouping re-renders only the changed measures, or the score once for "whole score".

**Constraints**: Measures with no grouping must beam exactly as before (FR-002, FR-017). Tuplet beaming is not changed. The smo layer must not import UI code.

**Scale/Scope**: One new modifier class, a few measure accessors, one beamer change, two model operations, one view method, one dialog (TypeScript and Vue), one menu entry, one test file.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|-----------|------------|
| #1 Serialization | Pass. The new modifier serializes and deserializes through the existing measure modifier path. A test saves a score with groupings and reloads it, and loads a score JSON written without any grouping and checks the beams are unchanged. An empty grouping is never written. |
| #2 Editing and transformation logic regression tested | Pass. Boundary calculation (5/8, 6/8, 9/8, 12/8, 8/8, 6/16, 7/8 cut-off repeat), beamed results, the apply/clear operation, and hand-placed beams are headless tests. |
| #3 Rendering performance | Pass. Changes are in `SmoBeamer`, which already runs per measure at layout. No new DOM reads. The view re-renders only changed measures. |
| #4 Logical dependencies | Pass. The modifier, the boundary calculation and the operation are in `src/smo` with no UI imports. The dialog only parses text and calls the view. |

Re-check after Phase 1 design: still passes. No complexity violations.

## Project Structure

### Documentation (this feature)

```text
specs/038-per-measure-beam-groups/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── beam-groups-api.md   # Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/smo/data/measureModifiers.ts          # NEW SmoBeamPreferences (+ params types, validation, unit ticks); registered in measureModifierDynamicCtorInit
src/smo/data/measure.ts                   # getBeamGroups(), setBeamGroups() (singleton modifier; empty removes it)
src/smo/xform/beamers.ts                  # NEW SmoBeamer.groupBoundaries(); beamNote uses boundaries when the measure has a grouping
src/smo/xform/operations.ts               # NEW setBeamGroups(), setAllBeamGroups(); beamSelections marks interior notes 'continue' in grouped measures
src/render/sui/scoreViewOperations.ts     # NEW setBeamGroups(groups, scope): one undo step, re-render
src/ui/dialogs/beamGroupsVue.ts           # NEW SuiBeamGroupsDialogVue: adapter + creation function
src/ui/components/dialogs/beamGroups.vue  # NEW dialog form: one number field per group, add and remove buttons, Apply To, Clear
src/ui/menus/beams.ts                     # NEW "Beam Groups" menu option that opens the dialog
types/src/...                             # regenerated declarations for the files above only
tests/beamGroups.ts                       # NEW
package.json                              # test:beam-groups script
changes.md                                # changelog entry
```

**Structure Decision**: Single-project layout as it exists. The modifier goes with the other measure modifiers in `measureModifiers.ts`, the position logic goes in the beamer where beam decisions already live, and the dialog follows the existing adapter/Vue pattern used by the key signature and tab stave dialogs.

## Complexity Tracking

No constitution violations to justify.
