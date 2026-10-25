---

description: "Task list for Split Multimeasure Rests at Landmarks"
---

# Tasks: Split Multimeasure Rests at Landmarks

**Input**: Design documents from `/specs/032-split-multimeasure-rests/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/grouping-contract.md](./contracts/grouping-contract.md), [quickstart.md](./quickstart.md)

**Tests**: Included. The plan commits to a headless `tests/multimeasureRest.ts` (cases G1 to G24) for the grouping logic. Drawing is checked manually (M1 to M10).

**Organization**: Tasks are grouped by user story. The landmark classification and the rewritten grouping loop are shared by all three stories, so they are the foundation; each story then adds its tests and the drawing or layout work it needs.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

Single project: `src/`, `tests/`, repo-root `package.json`.

---

## Phase 1: Setup

- [X] T001 Add the script `"test:multimeasure-rest": "ts-node -P tests/tsconfig.json tests/multimeasureRest.ts"` to `package.json`, next to the existing `test:select-voice` entry.
- [X] T002 Create `tests/multimeasureRest.ts` with the scaffold and builders: header comment pointing at `specs/032-split-multimeasure-rests/contracts/grouping-contract.md`; the dynamic-ctor-init calls and imports used by `tests/selectVoice.ts`; the `failures` counter and `check()` helper; the final summary block; `buildScore(staffCount = 1)` returning a score of 12 measures in 4/4 where every measure contains only rests (the default measures are rests), exposed as a part by leaving `partInfo.expandMultimeasureRests` false on `staves[0]`; and helpers `blocks(score)` returning the list of `start:length` strings for measures with `svg.multimeasureLength > 0` (1-based start), `hidden(score)` returning the 1-based indexes with `svg.hideMultimeasure`, and `accounted(score)` returning true when the block lengths plus the measures that are neither a block start nor hidden add up to the measure count. Add landmark helpers: `addRehearsal(score, m)` (via `measure.addRehearsalMark`), `setRepeatSymbol(score, m, symbolName)` (set `measure.repeatSymbol = true` and the symbol on `getRepeatSymbol()`), `setStartBarline(score, m, barline)`, `setEndBarline(score, m, barline)`, `setKey(score, m, key)` and `setTime(score, m, beats, duration)` (applied to the measure and all later measures, as a real change carries forward), `setTempo(score, m, display)` (a tempo with a different `bpm`, applied to measure m and later), and `setInstrument(score, m)` (an entry in `staves[0].measureInstrumentMap`).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The classification and grouping that every story relies on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 [P] In `src/smo/data/measure.ts`, add `multimeasureEndSymbol: SmoRepeatSymbol | null` to the `svg` runtime interface (next to `multimeasureEndBarline`) and to its default (`null`), importing `SmoRepeatSymbol` if needed. It is not serialized.
- [X] T004 In `src/smo/data/score.ts`, add the three helpers from [data-model.md](./data-model.md): `isMultimeasureBlocked(measureIndex)`, `isMultimeasureStartLandmark(measureIndex)` and `isMultimeasureEndLandmark(measureIndex)`, implemented exactly as specified there (volta on any staff, plus the legacy measure-0-of-a-multi-staff-part block; start landmarks: rehearsal mark, repeat symbol Segno or Coda, instrument map entry at measure above 0, non-plain start barline, and for staff 0 a key signature, time signature or displayed-tempo difference from the previous measure; end landmarks: repeat symbol ToCoda, DcAlCoda, DcAlFine, DsAlCoda, DsAlFine or Fine, and a non-plain end barline). Use `SmoBarline.barlines.singleBar` and `.noBar`, `SmoRepeatSymbol.symbols`, `SmoTimeSignature.equal` and `SmoTempo.eq`. Leave `isMultimeasureRest` unchanged and add a doc comment that it is superseded by the new helpers but kept for outside users.
- [X] T005 In `src/smo/xform/operations.ts`, rewrite `computeMultipartRest` as specified in [data-model.md](./data-model.md): keep the early return for `expandMultimeasureRests`; walk the measures with the new block rule (start measure may carry start landmarks; an end landmark on a measure closes the block after it; join only rest, unblocked measures with no `restBreak` and no start landmark; `forceRest` as before); for every block set length, end barline from the last measure, `multimeasureEndSymbol` from the last measure's end-type symbol (null if none) and `hideMultimeasure` on every staff; and for every measure that is not a block start or a hidden block member, reset `multimeasureLength` to 0, `multimeasureEndBarline` to the single bar, `multimeasureEndSymbol` to null and `hideMultimeasure` to false, on every staff.
- [X] T006 Run `npx tsc --noEmit -p tsconfig.json` and fix any errors.

**Checkpoint**: The grouping follows the new rules; nothing yet exercises them.

---

## Phase 3: User Story 1 - A rehearsal mark inside a long rest starts the next multimeasure rest (Priority: P1) MVP

**Goal**: A rehearsal mark splits a run of rests without a lone bar between the blocks, and edits take effect on the next layout.

**Independent Test**: quickstart.md section 3, steps 1 to 4.

### Tests for User Story 1

- [X] T007 [P] [US1] In `tests/multimeasureRest.ts`, add cases G1 to G5 (no landmarks, rehearsal mark in the middle, on the first measure, on the last measure, two marks) and G21 and G22 (expand multimeasure rests on, and a volta ending), each also checking `accounted(score)`.
- [X] T008 [US1] Run `npm run test:multimeasure-rest` and fix `score.ts` / `operations.ts` until G1 to G5, G21 and G22 pass.

### Implementation for User Story 1

- [X] T009 [US1] In `src/render/sui/formatter.ts` `SuiLayoutFormatter.layout()`, call `SmoOperation.computeMultipartRest(this.score)` at the start when `this.score.isPartExposed()` is true, importing `SmoOperation`; first confirm there is no circular import problem with `operations.ts` (if there is, call it from the code that invokes `layout()` instead, for example in `scoreRender.ts`).
- [X] T010 [US1] Run `npx tsc --noEmit -p tsconfig.json` and `npm run build`; fix any errors.
- [ ] T011 [US1] Manual validation: quickstart.md section 3, steps 1 to 4 and 12 (M1, M7).

**Checkpoint**: Rehearsal marks split a long rest correctly.

---

## Phase 4: User Story 2 - Key, time signature and tempo changes inside a long rest (Priority: P1)

**Goal**: Key, time and tempo changes split the rest and the change is shown at the start of the second block.

**Independent Test**: quickstart.md section 3, step 5.

### Tests for User Story 2

- [X] T012 [P] [US2] In `tests/multimeasureRest.ts`, add cases G6 to G10 (key change, time change, displayed tempo change, undisplayed tempo change, key change together with a rehearsal mark).
- [X] T013 [US2] Run `npm run test:multimeasure-rest` and fix until G6 to G10 pass.

### Implementation for User Story 2

- [ ] T014 [US2] Manual validation: quickstart.md section 3, step 5 (M2, M3, M4): confirm the new key signature, time signature and tempo are drawn at the start of the second rest. If one is not drawn, read `calculateBeginningSymbols` and the hidden-measure carry-over in `src/render/sui/formatter.ts` (around lines 780 to 795 and 833 to 866) and `createMeasureModifiers` in `src/render/vex/vxMeasure.ts`, and fix the cause in the drawing code (the force flags are computed against the measure to the left, which may be a hidden measure); record what was found.

**Checkpoint**: Signature and tempo changes split the rest and are visible.

---

## Phase 5: User Story 3 - Landmarks that end a section break the rest after their measure (Priority: P1)

**Goal**: D.S., D.C., To Coda, Fine and end barlines end a block and are shown on it; Segno, Coda and start barlines begin the next block.

**Independent Test**: quickstart.md section 3, steps 6 to 9.

### Tests for User Story 3

- [X] T015 [P] [US3] In `tests/multimeasureRest.ts`, add cases G11 to G20 and G23 (Segno and Coda, D.S. al Coda, To Coda, D.C. al Fine on the first measure, end-repeat and start-repeat barlines, double bar both ways, instrument change, a rehearsal mark together with a D.S., two staves). Include in G13, G14 and G15 checks that `svg.multimeasureEndSymbol` is set on the block's first measure with the right symbol (and null elsewhere), and in G16 that `svg.multimeasureEndBarline` of the first block's first measure equals the end-repeat barline.
- [X] T016 [US3] Run `npm run test:multimeasure-rest` and fix until G11 to G20 and G23 pass.

### Implementation for User Story 3

- [X] T017 [US3] In `src/render/vex/vxMeasure.ts` `createMeasureModifiers`, after the existing own-symbol block, add: if `this.smoMeasure.svg.multimeasureEndSymbol` is set and `this.smoMeasure.svg.multimeasureLength > 0` and `this.firstInColumn`, create a `VF.Repetition` from that symbol (using `toVexSymbol`, `symbol.xOffset + this.smoMeasure.staffX`, and `symbol.yOffset`, moved up 30 as the existing code does when the measure has a rehearsal mark) and push it onto the stave modifiers, so the symbol shows over the multimeasure rest.
- [X] T018 [US3] Check `src/render/vex/toVex.ts` (around lines 128 to 142 and where it handles repeat symbols): if the Vex export draws repeat symbols for measures, mirror T017 for `multimeasureEndSymbol`; if it does not draw them at all, record that and make no change.
- [X] T019 [US3] Run `npx tsc --noEmit -p tsconfig.json` and `npm run build`; fix any errors.
- [ ] T020 [US3] Manual validation: quickstart.md section 3, steps 6 to 9 (M5, M6, M8): the D.S. over the first rest, the Coda sign at the start of the last rest after the barline, repeat barlines drawn once.

**Checkpoint**: All landmark kinds split rests as specified.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T021 [P] In `tests/multimeasureRest.ts`, add case G24 (group with a rehearsal mark, remove it, regroup; assert one block `1:12` and that no measure keeps a stale `multimeasureLength`, `hideMultimeasure` or `multimeasureEndSymbol`; repeat with a D.S. added then removed).
- [X] T022 Run `npm run test:multimeasure-rest` and all nine existing test scripts; confirm all pass.
- [X] T023 Run `npx tsc --noEmit -p tsconfig.json` and `npm run build`; confirm both succeed with no new warnings.
- [ ] T024 Run through all of quickstart.md (sections 1 to 3), including steps 9 to 11, and note the result, including which edits regroup immediately.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none.
- **Foundational (Phase 2)**: depends on Setup. T003 (measure.ts) is independent; T004 (score.ts) must precede T005 (operations.ts), which uses its helpers and T003's field.
- **US1, US2, US3 (Phases 3 to 5)**: depend on Phase 2; their test blocks are in one file, so add them in order. US3's drawing task T017 depends on T003 and T005.
- **Polish (Phase 6)**: depends on all stories.

### Within Each Story

- `tests/multimeasureRest.ts` is edited by T002, T007, T012, T015 and T021: add cases in separate blocks, in order.
- `vxMeasure.ts` is edited by T017 (and possibly T014).
- `formatter.ts` is edited by T009 (and possibly T014).

### Parallel Opportunities

- T003 can be done while T001 and T002 are written.
- T007, T012 and T015 are separate blocks of the same file; write them while the code tasks proceed.
- T017 (drawing) can be written in parallel with T015/T016 once T003 and T005 exist.

---

## Parallel Example: Foundational phase

```text
Task: "Add multimeasureEndSymbol to the svg record in src/smo/data/measure.ts"   (T003)
Task: "Landmark helpers in src/smo/data/score.ts"                                 (T004)
Task: "Rewrite computeMultipartRest in src/smo/xform/operations.ts"               (T005, after T003, T004)
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phases 1 and 2 (classification and algorithm in place and compiling).
2. Phase 3: tests prove rehearsal-mark splitting and regression behavior; the layout hook makes it take effect.
3. Stop and validate in the app: a rehearsal mark in the middle of a part's long rest.

### Incremental Delivery

1. US1 fixes the most common case.
2. US2 locks in key, time and tempo changes and verifies their drawing.
3. US3 adds end landmarks and the drawing of end symbols.

---

## Notes

- The legacy rule that blocks measure 0 from starting a block in a multi-staff part is kept on purpose (research.md section 4) so that existing parts look the same; raise it separately if it should change.
- `SmoScore.isMultimeasureRest` is left unchanged for outside users.
- Edits that only re-render single columns without a full layout are an existing limitation and out of scope (research.md section 7).
- Commit after each phase.
