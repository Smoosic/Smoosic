# Implementation Plan: Measure Fill Submenu

**Branch**: `039-measure-fill-submenu` (work is on `main`; no feature branch was created) | **Date**: 2026-11-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/039-measure-fill-submenu/spec.md`

## Summary

Add a "Fill Measures" submenu to the Measure menu with three choices (Whole Rest, Beats, Eighth Rests) that replace the selected measures' content with rests.

The rule for which rests to use goes in one small, pure module in `src/smo/xform` that turns a time signature, a fill choice and a measure length into a list of rest durations (in ticks). One model operation applies a list to every selected measure: it removes the notes of every voice, builds the rests in a single voice, clears the tuplets and beam groups, and removes the markings that pointed at the removed notes (staff modifiers such as slurs, hairpins and ties that start or end in the measure, and text attached to its notes). One view method wraps the operation in a single whole-score undo step and redraws the changed measures. The menu entries call the view method.

## Technical Context

**Language/Version**: TypeScript. Tests run with `ts-node`.

**Primary Dependencies**: None new. Reuses `SmoMusic.validDurations` (the rest values the application can show), `SmoMeasure`, `SmoNote`, `SmoSelection`, and the configured-menu submenu mechanism used by Copy Voices and Arpeggio.

**Storage**: N/A. A filled measure is an ordinary measure of rest notes and serializes like any other. No new persisted fields.

**Testing**: Headless `ts-node` script `tests/measureFill.ts` (npm script `test:measure-fill`), following `tests/beamGroups.ts` and `tests/quickBeam.ts`. The duration rule, the operation and the cleanup are tested; the menu and view method are checked by compilation and the manual steps in [quickstart.md](quickstart.md).

**Target Platform**: Browser application and library.

**Project Type**: Single project.

**Performance Goals**: Work is proportional to the number of selected measures. One whole-score undo snapshot and one redraw of the changed measures per command.

**Constraints**: A filled measure must be exactly as long as the measure (never short, never long). The smo layer must not import UI code. The undo must restore voices, staff modifiers and text, so it is a single step.

**Scale/Scope**: One pure module, one measure method, one model operation, one view method, one menu submenu, one test file.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|-----------|------------|
| #1 Serialization | Pass. No new persisted data. A test serializes and reloads a score with filled measures (including a pickup measure) and checks the rests, their durations and the preserved measure settings survive. Scores written before the feature are untouched because nothing is added to the format. |
| #2 Editing and transformation logic regression tested | Pass. The duration rule is tested against every row of the spec's examples table plus the extra meters in the Assumptions; the operation is tested for voices, tuplets, beams, preserved settings, cleanup, scope, and idempotence. |
| #3 Rendering performance | Pass. No new rendering code. The view redraws only the changed measures through the existing path. |
| #4 Logical dependencies | Pass. The rule, the measure method and the operation are in `src/smo` with no UI imports. The menu only calls the view. |

Re-check after Phase 1 design: still passes. No complexity violations.

## Project Structure

### Documentation (this feature)

```text
specs/039-measure-fill-submenu/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── measure-fill-api.md   # Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/smo/xform/measureFill.ts              # NEW pure rule: MeasureFillType, fillRestDurations(), restDurationsFor()
src/smo/data/measure.ts                   # NEW SmoMeasure.fillWithRests(durations, defaultBeamBeats): rests in one voice, tuplets/beams cleared
src/smo/xform/operations.ts               # NEW SmoOperation.fillMeasures(): rule + measure + cleanup of modifiers and attached text
src/render/sui/scoreViewOperations.ts     # NEW fillMeasures(fill): one undo step, redraw
src/ui/menus/measure.ts                   # NEW "Fill Measures" submenu: Whole Rest, Beats, Eighth Rests
types/src/...                             # hand-updated declarations for the files above only
tests/measureFill.ts                      # NEW
package.json                              # test:measure-fill script
changes.md                                # changelog entry
```

**Structure Decision**: Single-project layout as it exists. The rule is separate from `operations.ts` so it can be tested without a score and read in one place; the operation sits with the other score operations; the menu follows the submenu pattern of `edit.ts` and `note.ts`.

## Complexity Tracking

No constitution violations to justify.
