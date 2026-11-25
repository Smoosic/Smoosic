# Tasks: Preserve Music When Changing Time Signature

**Input**: Design documents from `/specs/042-preserve-music-time-signature/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/rebar-api.md](contracts/rebar-api.md), [quickstart.md](quickstart.md)

**Tests**: Included. The constitution (Principle #2) requires regression tests for transformation logic, and the plan names `tests/rebarMeasures.ts`. The view and the Vue component are checked by `tsc`, the SFC compiler and the manual quickstart, not by headless tests.

**Format**: `- [ ] [ID] [P?] [Story] Description with file path`. `[P]` means a different file with no dependency on an unfinished task.

## Phase 1: Setup

- [X] T001 Create the headless test harness `tests/rebarMeasures.ts` (same shape as `tests/measureFill.ts`: register the `*ModifierDynamicCtorInit` functions, a `check` helper, builders for a score of N measures of 4/4 with a given list of note lengths, one or two staves, optional second voice). Add `"test:rebar-measures": "ts-node -P tests/tsconfig.json tests/rebarMeasures.ts"` to `package.json` after `test:measure-fill`.

## Phase 2: Foundational (blocks all stories)

- [X] T002 Add an optional `prototypeIndex?: number` argument to `SmoScore.addMeasure(measureIndex, prototypeIndex?)` and `SmoScore.getPrototypeMeasure(measureIndex, staffIndex, prototypeIndex?)` in `src/smo/data/score.ts`. When given, that measure is the prototype; without it nothing changes. Update `types/src/smo/data/score.d.ts`.
- [X] T003 Create `src/smo/xform/rebar.ts` with the shapes from the data model (`RebarResult`, layout unit, placement map) and the measure-length helper: for the k-th measure of a range, the ticks of the part at `(startIndex + k) mod times.length` of the new `SmoTimeSignature`, with `startIndex` taken from the measure before the range when it has an equal signature ([research.md](research.md) R4). No UI or renderer imports.

**Checkpoint**: the pieces the stories share exist; `npx tsc --noEmit -p .` is clean.

## Phase 3: User Story 1 - Change the meter without losing notes (Priority: P1)

**Goal**: With Preserve music, the music of a range of measures is re-barred into the new meter, in order, adding measures as needed ([spec.md](spec.md) Story 1, FR-006 to FR-013, FR-017).

**Independent Test**: `npm run test:rebar-measures`, cases B1 to B16 and B19 to B21 and B23 pass; in particular two 4/4 measures of eight quarters become three 3/4 measures (B1).

### Tests for User Story 1

- [X] T004 [US1] Write cases B1 to B6 in `tests/rebarMeasures.ts`: the spec's 4/4 to 3/4 example, 3/4 to 4/4, 4/4 to 6/8 and 5/8, a note and a dotted whole note crossing bar lines (tied pieces), rests crossing bar lines (no ties). Assert the pitch sequence with tied pieces joined, the measure count and the total ticks.
- [X] T005 [US1] Write cases B7 to B9 in `tests/rebarMeasures.ts`: a tuplet that fits, one that straddles the new bar line (rest fill, starts the next measure, all notes kept), one longer than the new measure (plain notes, all kept).
- [X] T006 [US1] Write cases B10 to B13 in `tests/rebarMeasures.ts`: two voices, two staves with different rhythms (same measure count in both), markings on a split note (first piece only), and slurs, ties and hairpins whose end selectors must point at the same notes afterwards.
- [X] T007 [US1] Write cases B14, B16, B19, B20, B21 and B23 in `tests/rebarMeasures.ts`: alternating 3/4+2/4, added measures copy the old last measure's settings, no measure removed when fewer are needed, serialize and reload, invalid range, and the copy buffer untouched.

### Implementation for User Story 1

- [X] T008 [US1] In `src/smo/xform/rebar.ts`, implement the per-voice layout: flatten the voice of the range into units (a note, a rest, or a whole tuplet tree), then place them measure by measure by the rules in [research.md](research.md) R2 (split with `SmoMusic.gcdMap` and `SmoNote.cloneWithDuration`, pitches only on later pieces, tuplet whole or moved to the next measure, unmake when longer than a measure, rest fill at the end). The layout produces new voices, the new tuplet trees (indices adjusted with `SmoTupletTree`), the placement map, the list of ties to add, and the count of measures filled.
- [X] T009 [US1] In `src/smo/xform/rebar.ts`, implement `rebarMeasures(score, firstMeasure, lastMeasure, timeSignature)`: lay out every staff and voice, take `needed` as the maximum count, add `max(existing, needed) - existing` measures after `lastMeasure` with `score.addMeasure(lastMeasure + 1, lastMeasure)` (R3, R5), set a copy of the time signature on every measure of the range, write the new voices (rest-filling measures the layout does not reach and voices a measure lacks), call `score.updateCompoundTimeSignature()`, and return a `RebarResult`. An invalid range returns `added: 0` and changes nothing.
- [X] T010 [US1] In `src/smo/xform/rebar.ts`, remap the staff modifiers ([research.md](research.md) R6): before the measures are inserted, rewrite the start and end selectors of every modifier with an end in the range from the placement map (starts use `firstPiece`, ends `lastPiece`, a `SmoTie` start `lastPiece` and end `firstPiece`), then add the new ties for split notes with `SmoOperation.createTie`-style parameters, and move ends after the range later by `added`.
- [X] T011 [US1] Add `SmoOperation.rebarMeasures`, `SmoOperation.timeSignatureChanges` and `SmoOperation.timeSignatureKeepsLength` to `src/smo/xform/operations.ts` as described in [contracts/rebar-api.md](contracts/rebar-api.md). The first calls `rebarMeasures`; the others only read.
- [X] T012 [US1] Run `npm run test:rebar-measures` and fix `rebar.ts` until B1 to B16, B19 to B21 and B23 pass.

**Checkpoint**: the transform works and is tested without any UI.

## Phase 4: User Story 2 - Change takes effect only on OK (Priority: P1)

**Goal**: The dialog changes nothing until OK, then applies everything as one undo step ([spec.md](spec.md) Story 2, FR-001 to FR-005).

**Independent Test**: Quickstart steps 2 to 5 and 11 to 13.

- [X] T013 [US2] In `src/render/sui/scoreViewOperations.ts`, add `TimeSignatureApplyTo` and `SetTimeSignatureOptions` and change `setTimeSignature(timeSignature, options?)`. With no options, keep the old behavior unchanged. With options: work out the range from `options.applyTo` and the tracker's selections (data model table), return with no change, undo step or redraw when `SmoOperation.timeSignatureChanges` is false, use the old path when `preserveMusic` is not true or `timeSignatureKeepsLength` is true, otherwise call `_undoScore('Set time signature')`, run `SmoOperation.rebarMeasures` on `this.score` and on `this.storeScore` with the same range, then `renderer.rerenderAll()` and `await renderer.updatePromise()`. Update `types/src/render/sui/scoreViewOperations.d.ts`.
- [X] T014 [US2] Rewrite `src/ui/dialogs/timeSignature.ts`: hold `timeSignature`, `applyTo` and `preserveMusic` as local state; `updateTimeSignatureCb`, `updateApplyTo` and a new `updatePreserve` only store values (no score change, no `tracker.selections` change, no backup); `commitCb` calls `parameters.view.setTimeSignature(timeSignature.value, { applyTo, preserveMusic })` once; `cancelCb` does nothing.
- [X] T015 [US2] In `src/ui/components/dialogs/timeSignature.vue`, add the **Preserve music** `toggle` (ticked at first, calling the new `updatePreserve` prop) and add the prop to `Props`; make sure no watcher calls anything that changes the score (they now only update the local signature), and remove the leftover `console.log('changed!')` watcher.
- [X] T016 [US2] Compile `timeSignature.vue` with `@vue/compiler-sfc` (a scratchpad script like the one used for `deleteSpecial.vue`): parse errors 0, template errors 0.

**Checkpoint**: the dialog is commit-on-OK with Preserve music wired through.

## Phase 5: User Story 3 - Keep only what fits, as it is today (Priority: P2)

**Goal**: Unticking Preserve music gives exactly the old result ([spec.md](spec.md) Story 3, FR-014, FR-018, FR-019).

**Independent Test**: Quickstart step 6; `npm run test:rebar-measures` B17, B18, B22.

- [X] T017 [US3] Write cases B17, B18 and B22 in `tests/rebarMeasures.ts`: `timeSignatureKeepsLength` for 4/4 to 2/2, `timeSignatureChanges` false for an equal signature and true when only a display option differs, and a regression that `SmoOperation.setTimeSignature` 4/4 to 3/4 on two measures of quarters still keeps what fits (two measures, three quarters each).
- [X] T018 [US3] Confirm in `src/render/sui/scoreViewOperations.ts` (from T013) that the unticked path and the same-length path call the unchanged `SmoOperation.setTimeSignature` on both scores, with `_undoScore`, and add a one-line comment saying why. Run the new cases.

## Phase 6: User Story 4 - Choose which measures change (Priority: P2)

**Goal**: Apply To (Selected, Remaining, Score) decides the range for both settings of Preserve music, and what follows the range is kept ([spec.md](spec.md) Story 4, FR-015, FR-016).

**Independent Test**: Quickstart step 8; B15.

- [X] T019 [US4] Write case B15 in `tests/rebarMeasures.ts`: a six-measure score re-barred over measures 2 to 3, over 2 to the end, and over the whole score. Measures outside the range keep their notes, signatures and settings; modifiers that start or end after the range move later by `added`.
- [X] T020 [US4] Make the range calculation a small exported pure function (placed in `src/smo/xform/rebar.ts`, not the view file, so the headless test can import it without the renderer) (`timeSignatureRange(applyTo, selections, measureCount)`) and add cases for it to `tests/rebarMeasures.ts` (Selected: lowest to highest selected measure; Remaining: lowest to the end; Score: whole score; non-contiguous selections span the lowest to the highest). Keep it free of DOM use so the test can import it.

## Phase 7: Polish and cross-cutting

- [X] T021 [P] Export the new module: add `export * from '../smo/xform/rebar';` to `src/application/exports.ts` and the matching export line in `typedoc.ts` and `types/typedoc.d.ts`.
- [X] T022 [P] Hand-write `types/src/smo/xform/rebar.d.ts` and update `types/src/smo/xform/operations.d.ts` and `types/src/application/exports.d.ts` for the new members.
- [X] T023 [P] Add the release note to `changes.md` under a new `11-24-2026` heading: the dialog applies on OK, the Preserve music checkbox, what it does, the unticked behavior, and the library additions.
- [X] T024 Run `npx tsc --noEmit -p .` and fix errors. Run `npm run test:rebar-measures` and the suites that share code: `test:paste-special`, `test:voice-copy-paste`, `test:measure-fill`, `test:beam-groups`, `test:score-archive`, `test:time-signature-display`, `test:delete-special`, `test:time-range-select`.
- [ ] T025 Walk through [quickstart.md](quickstart.md) section 4 in the running application (manual; cannot be done headless) and record any finding.

## Dependencies and order

- Phase 1 then Phase 2, then the stories.
- US1 (T004 to T012) needs T002 and T003. T004 to T007 can be written before T008 to T011, and T012 runs them.
- US2 needs US1's `SmoOperation` members (T011).
- US3 and US4 need T013. US3's tests (T017) can be written after T011.
- Polish T021 to T023 can run once the API is stable (after T011); T024 and T025 are last.
- Within `rebar.ts`: T003, then T008, then T009, then T010. They are in one file, so they are sequential.

## Parallel opportunities

- T004, T005, T006 and T007 add separate groups of cases to one file; write them one after another, but they do not depend on the implementation.
- T021, T022 and T023 touch different files and can run together.

## Implementation strategy

- **MVP**: Phases 1 to 3 (the transform and its tests) plus T013 with a hard-coded call. That already proves the hard part.
- Then Phase 4 for the user-visible dialog, then 5 and 6, then Polish. Stop and check `tsc` and the suite after each phase.

## Format check

All 25 tasks begin with a checkbox and an ID, user-story phases carry `[US1]` to `[US4]`, setup, foundational and polish tasks carry none, and every task names a file.
