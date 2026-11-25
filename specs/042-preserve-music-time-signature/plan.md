# Implementation Plan: Preserve Music When Changing Time Signature

**Branch**: `042-preserve-music-time-signature` (work is on `main`; no feature branch was created) | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/042-preserve-music-time-signature/spec.md`

## Summary

Two changes to the Time Signature dialog:

1. **Commit on OK.** The dialog stops changing the score as fields are edited. It keeps its choices locally and applies them once, when OK is clicked. Cancel does nothing. The existing "change, then put the backup back on Cancel" logic is removed.
2. **Preserve music** checkbox, ticked by default. Ticked: the music of the chosen measures is re-barred into the new meter, in order, with extra measures added so nothing is lost. Unticked: today's behavior (`SmoOperation.setTimeSignature`, keep what fits).

The re-bar is a new, headless transform in the smo layer. It works on each staff and voice separately: it flattens the music of the chosen measures into one ordered list, lays that list out again measure by measure at the new lengths (splitting and tying notes that cross a bar line, keeping a tuplet whole), adds the measures that are needed, and then remaps the slurs, ties and hairpins that pointed at the old note positions. It does **not** use the clipboard (see [research.md](research.md) R1). The view runs it on the displayed and the backing score as one undo step.

No file format change. Scores that were re-barred are ordinary scores with different measures.

## Technical Context

**Language/Version**: TypeScript; Vue 3 single-file component for the dialog. Tests run with `ts-node`.

**Primary Dependencies**: None new. Reuses `SmoMusic.gcdMap`, `SmoNote.cloneWithDuration`, `SmoTupletTree`, `SmoTie`/`SmoOperation.createTie`, `SmoScore.addMeasure`, `SmoTimeSignature`, `SuiScoreView._undoScore`.

**Storage**: No change.

**Testing**: Headless `ts-node` script `tests/rebarMeasures.ts` (npm script `test:rebar-measures`): the cases in [contracts/rebar-api.md](contracts/rebar-api.md) (the spec's 4/4 to 3/4 example, larger and equal meters, split and tied notes, rests, tuplets, voices, staves, markings, slurs and ties remapped, alternating meters, pickups, apply ranges, and a serialize and reload). The view method needs the DOM, so its undo and redraw wiring is checked by `tsc` and the manual steps in [quickstart.md](quickstart.md). The `.vue` file is compiled with `@vue/compiler-sfc`. The constitution says rendering and UI need not be tested.

**Target Platform**: Browser application and library.

**Project Type**: Single project.

**Performance Goals**: One pass over the chosen measures, then one full redraw (the measure count changes). Spec SC-007: 100 measures in under 2 seconds.

**Constraints**: The smo layer must not import UI code. The transform must lose no note, in any case ([spec FR-006](spec.md)). It must not touch the user's copy buffer.

**Scale/Scope**: One new smo file (about 300 lines), a small additive change to `SmoScore.addMeasure`, two small `SmoOperation` helpers, one view method change, a rewrite of `timeSignature.ts` and a few additions to `timeSignature.vue`, hand-edited declarations, one test file.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|-----------|------------|
| #1 Serialization | Pass. No new persisted field. A test serializes and reloads a re-barred score and compares the music. Legacy scores need no handling. |
| #2 Editing and transformation logic regression tested | Pass. The re-bar is a pure smo transform with a headless test file covering each rule in the spec. The old keep-what-fits path is covered by a regression case. |
| #3 Rendering performance | Pass. The change is applied once, then the score is redrawn once (`rerenderAll`), which is the existing path for structural changes. The dialog no longer redraws the score on each edit, which removes repeated renders. |
| #4 Logical dependencies | Pass. The transform is in `src/smo/xform/rebar.ts` with no UI or renderer imports. The view calls it; the dialog only collects choices. |

Re-check after Phase 1 design: still passes. No complexity violations.

## Project Structure

### Documentation (this feature)

```text
specs/042-preserve-music-time-signature/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── rebar-api.md     # Phase 1 output: library API and test cases
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
src/
├── smo/
│   ├── data/score.ts                     # addMeasure/getPrototypeMeasure: optional prototype index
│   └── xform/
│       ├── rebar.ts                      # NEW: rebarMeasures and its helpers
│       └── operations.ts                 # SmoOperation.rebarMeasures, timeSignatureChanges (thin wrappers)
├── render/sui/scoreViewOperations.ts     # setTimeSignature(ts, options): decide range, undo, run, redraw
├── application/exports.ts                # export the new smo module
└── ui/
    ├── dialogs/timeSignature.ts          # collect choices, commit on OK, no live updates
    └── components/dialogs/timeSignature.vue   # Preserve music checkbox; remove live updates

types/src/...                             # hand-edited declarations for the above
tests/rebarMeasures.ts                    # NEW headless test
package.json                              # "test:rebar-measures" script
changes.md                                # release note
```

**Structure Decision**: Single project. The new transform lives beside the other `smo/xform` edit logic so it can be tested without a browser; the view and dialog are thin.

## Complexity Tracking

No constitution violations to justify.
