# Implementation Plan: Split Multimeasure Rests at Landmarks

**Branch**: `032-split-multimeasure-rests` | **Date**: 2026-10-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/032-split-multimeasure-rests/spec.md`

## Summary

`SmoOperation.computeMultipartRest` groups empty measures into multimeasure blocks using `SmoScore.isMultimeasureRest`, which treats a rehearsal mark, repeat symbol or instrument change as disqualifying a measure from being in a block at all, including starting one. That is the lone-rest-bar bug: the block ends before the landmark measure, the landmark measure fails the "can start a block" test and is drawn as a single ordinary rest, and a new block starts after it. The grouping loop is rewritten around two kinds of landmark. **Start landmarks** (rehearsal mark, key, time and tempo changes, Segno and Coda, a non-plain start barline, an instrument change) end the current block before their measure and may start the next one. **End landmarks** (D.S., D.C., To Coda, Fine, a non-plain end barline) are allowed on the last measure of a block and end it after that measure. Volta endings keep today's behavior. The classification lives in new `SmoScore` helpers so it can be tested headlessly, the old `isMultimeasureRest` is left in place for outside users, and `computeMultipartRest` also resets stale runtime flags on measures that no longer start a block. On the drawing side, the block's last measure is hidden, so an end symbol (D.S. and the like) on it would vanish; its symbol is recorded on the block's first measure and `vxMeasure.ts` draws it there. Because the grouping is only computed when a part is first shown, the layout step now recomputes it for parts so landmark edits take effect on the next full layout.

## Technical Context

**Language/Version**: TypeScript (built by `build/build.js`).

**Primary Dependencies**: None new. Existing `SmoScore`, `SmoSystemStaff` (`isRehearsal`, `isRepeatSymbol`, `getVoltasForMeasure`, `measureInstrumentMap`), `SmoMeasure` (`getStartBarline`, `getEndBarline`, `getRepeatSymbol`, `getTempo`), `SmoRepeatSymbol`, `SmoTempo.eq`, and the VexFlow wrappers in `vxMeasure.ts`.

**Storage**: None. Block information is runtime state on `measure.svg`; no serialized field changes.

**Testing**: A headless script `tests/multimeasureRest.ts` (`npm run test:multimeasure-rest`) that builds in-memory scores of empty measures with each landmark and checks the block lengths, hidden flags, end barlines and recorded end symbols that `computeMultipartRest` produces. Drawing (symbols over the rest, signatures at the start of the second block) cannot be run headlessly and is verified manually (quickstart.md).

**Target Platform**: Browser application; tests run under Node.

**Project Type**: Single project (library + application).

**Performance Goals**: No regression. The grouping is O(measures × staves); it is now also run at the start of a full layout for parts, which already costs far more.

**Constraints**: Scores with no landmark inside a run of rests must group exactly as today (SC-004). Volta endings and `expandMultimeasureRests` keep their behavior. No serialized data changes. The existing public `SmoScore.isMultimeasureRest` keeps its signature and result.

**Scale/Scope**: One algorithm rewritten, four small helpers, one new runtime field, one drawing change, one layout hook, one test.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle #1 (Serialization)**: PASS. Only ephemeral `measure.svg` fields change; the score format is untouched, so legacy scores load and group by the new rules.
- **Principle #2 (Music transformation logic regression testing)**: PASS. The grouping rules are pure score logic in `src/smo` and get a headless regression script with a contract case list.
- **Principle #3 (Rendering performance)**: PASS. The extra grouping pass is linear and runs at most once per full layout, before measurements; no DOM measurement or repaint logic is added.
- **Principle #4 (Logical dependencies)**: PASS. Landmark classification and grouping stay in `src/smo`. The render layer only reads the resulting `svg` fields. The `svg` mixin is ephemeral, which the principle allows.

No violations; Complexity Tracking is not needed. Re-check after Phase 1: unchanged, still PASS.

## Project Structure

### Documentation (this feature)

```text
specs/032-split-multimeasure-rests/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── grouping-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md                # created later by /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── smo/
│   ├── data/
│   │   ├── score.ts                   # SmoScore: isMultimeasureStartLandmark / isMultimeasureEndLandmark /
│   │   │                              #   isMultimeasureBlocked; isMultimeasureRest left unchanged (deprecated note)
│   │   └── measure.ts                 # SvgMeasureInfo: multimeasureEndSymbol (runtime)
│   └── xform/operations.ts            # computeMultipartRest rewritten around the two landmark kinds
├── render/
│   ├── vex/vxMeasure.ts               # draw the block's end symbol over the multimeasure rest
│   └── sui/formatter.ts               # run computeMultipartRest at the start of a layout for parts
tests/
└── multimeasureRest.ts                # NEW headless regression script
package.json                           # add "test:multimeasure-rest"
```

**Structure Decision**: Keep the classification next to the existing rule (`SmoScore`) and the algorithm where it is (`SmoOperation.computeMultipartRest`), so callers do not change. The only render-layer changes are drawing the recorded end symbol and triggering the grouping at layout.

## Complexity Tracking

*No Constitution Check violations; table not needed.*
