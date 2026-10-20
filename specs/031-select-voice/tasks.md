---

description: "Task list for Select Voice"
---

# Tasks: Select Voice

**Input**: Design documents from `/specs/031-select-voice/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/select-voice-contract.md](./contracts/select-voice-contract.md), [quickstart.md](./quickstart.md)

**Tests**: Included. The plan commits to a headless `tests/selectVoice.ts` (cases S1 to S16) for the pure selection logic. The tracker mapping, highlighting and menu need the renderer and are checked manually (M1 to M10).

**Organization**: Tasks are grouped by user story. The pure functions, tracker method and view methods are shared by all stories, so they are the foundation; each story then adds its tests and the part of the menu behavior it covers.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

Single project: `src/`, `tests/`, repo-root `package.json`.

---

## Phase 1: Setup

- [X] T001 Add the script `"test:select-voice": "ts-node -P tests/tsconfig.json tests/selectVoice.ts"` to `package.json`, next to the existing `test:voice-copy-paste` entry.
- [X] T002 Create `tests/selectVoice.ts` with the scaffold and the shared test score builder: header comment pointing at `specs/031-select-voice/contracts/select-voice-contract.md`; the dynamic-ctor-init calls and imports used by `tests/voiceCopyPaste.ts`; the `failures` counter and `check()` helper; the final summary block; `buildScore()` making the two-staff, six-measure 4/4 score described in the contract (staff 0: voice 0 four quarter notes in every measure, except measure 3 where they are rests; voice 1 on measures 0 to 2 as a whole note, two half notes and four quarter notes; voice 2 on measure 2 only. Staff 1: voice 0 in every measure, voice 1 on measure 1 only), using `SmoScore.getDefaultScore`, `addStaff`, `addMeasure`, `SmoMeasure.populateVoice` and setting `note.ticks` as in `tests/voiceCopyPaste.ts`; and helpers `sel(score, staff, measure, voice, tick)` returning a `SmoSelection` via `SmoSelection.noteSelection`, and `tickRange(score, staff, measure, voice, first, last)` returning a list of selections.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The logic and plumbing every story uses.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 In `src/smo/xform/selections.ts`, add to `SmoSelection` the two static functions from [data-model.md](./data-model.md): `voiceChoices(score, selections): number[]` (unique selected `(staff, measure)` pairs, largest `voices.length` capped at 4, `[]` below 2, else `0..max-1`) and `getVoiceSelectors(score, selections, voice): SmoSelector[]` (for each unique pair in staff then measure order, one selector per note of the voice with `pitches: []`; nothing for a measure that lacks the voice; empty for a voice outside 0 to 3 or an empty selection). Skip pairs whose measure cannot be found in the score.
- [X] T004 In `src/render/sui/tracker.ts`, add `selectVoice(voice: number): boolean` to `SuiTracker`: call `SmoSelection.getVoiceSelectors(this.score, this.selections, voice)`, map each selector to `this.measureNoteMap[SmoSelector.getNoteKey(selector)]` (skip any that are missing; do not use `_getClosestTick`), return false without changing anything if none are mapped, otherwise set `this.selections` to the mapped list, set `this.pitchIndex = -1`, call `setActiveVoice(voice)` on the measure of each selection, call `this.score.setActiveStaff(...)` with the first selected staff, then `_createLocalModifiersList()` and `deferHighlight()`, and return true. Document that it makes no score change and no undo entry.
- [X] T005 In `src/render/sui/scoreViewOperations.ts`, add `getSelectVoiceChoices(): number[]` returning `SmoSelection.voiceChoices(this.score, this.tracker.selections)` and `async selectVoice(voice: number): Promise<void>` calling `this.tracker.selectVoice(voice)` and doing nothing else (no `_undo*` call, no `populateVoice`).
- [X] T006 Run `npx tsc --noEmit -p tsconfig.json` and fix any errors.

**Checkpoint**: The logic and plumbing exist; nothing in the menu uses them yet.

---

## Phase 3: User Story 1 - Select every note of one voice in the chosen measures (Priority: P1) MVP

**Goal**: Edit > Select Voice > Voice N selects the whole voice in the selected measures.

**Independent Test**: quickstart.md section 3, steps 2 to 4 and 7.

### Tests for User Story 1

- [X] T007 [P] [US1] In `tests/selectVoice.ts`, add cases S6 to S9 and S11 to S13 from the contract (whole-measure selection from a single note, uneven voices, multi-measure counts and order, a voice present in only some measures, two staves, rests).
- [X] T008 [US1] Run `npm run test:select-voice` and fix `selections.ts` until S6 to S9 and S11 to S13 pass.

### Implementation for User Story 1

- [X] T009 [US1] In `src/ui/menus/edit.ts`, add a `selectVoiceChoice(voice: number)` factory returning a `SuiConfiguredMenuOption` (handler `await menu.view.selectVoice(voice)`, text `Voice ${voice + 1}`, value `selectVoice${voice}`, empty icon, `display` true when `menu.view.getSelectVoiceChoices()` includes `voice`) and a `selectVoiceMenuOption` with `subMenu` of the four choices, text `Select Voice`, value `selectVoiceAction`, a no-op handler (unreachable), and `display` true when the choices list is non-empty. Add it to `SuiEditMenuOptions` after `pasteVoiceMenuOption`.
- [X] T010 [US1] Run `npx tsc --noEmit -p tsconfig.json` and fix any errors.
- [ ] T011 [US1] Manual validation: quickstart.md section 3, steps 2 to 4 and 7 (M2, M3, M4, M7).

**Checkpoint**: Users can select one voice's notes across their selected measures.

---

## Phase 4: User Story 2 - The menu only offers choices that make sense (Priority: P1)

**Goal**: Choices reflect the voices that exist; a single voice offers nothing; an empty result leaves the selection alone.

**Independent Test**: quickstart.md section 3, steps 1 and 5; cases S1 to S5, S10, S15, S16.

### Tests for User Story 2

- [X] T012 [P] [US2] In `tests/selectVoice.ts`, add cases S1 to S5, S10, S15 and S16 (single-voice and empty selections offer nothing, the voices listed, a voice with no notes in the selected measures returns no selectors, out-of-range voices, selector shape).
- [X] T013 [US2] Run `npm run test:select-voice` and fix `selections.ts` until S1 to S5, S10, S15 and S16 pass.

### Implementation for User Story 2

- [X] T014 [US2] In `src/render/sui/tracker.ts` `selectVoice`, confirm by reading the code that the no-notes and nothing-mapped paths return false before any change to `selections`, `pitchIndex`, active voices, or the highlight, and that a measure missing the voice is skipped without calling `populateVoice`. Fix any path that changes state early.
- [ ] T015 [US2] Manual validation: quickstart.md section 3, steps 1 and 5 (M1, M5).

**Checkpoint**: The menu is accurate and a no-op choice is harmless.

---

## Phase 5: User Story 3 - Selecting a voice never changes the music (Priority: P2)

**Goal**: No edit and no undo entry.

**Independent Test**: S14 passes; quickstart.md section 3, step 6.

### Tests for User Story 3

- [X] T016 [P] [US3] In `tests/selectVoice.ts`, add case S14: serialize the score before and after calling `voiceChoices` and `getVoiceSelectors` for every voice and compare, and check each measure's voice count is unchanged.
- [X] T017 [US3] Run `npm run test:select-voice` and confirm all cases S1 to S16 pass.

### Implementation for User Story 3

- [X] T018 [US3] Confirm by search that `selectVoice` in `scoreViewOperations.ts` and `tracker.ts` calls none of `_undoScore`, `_undoSelection`, `undoMeasureRange`, `storeUndo.addBuffer`, `populateVoice` or any `SmoOperation` method, and that the existing Voices menu file `src/ui/menus/voices.ts` is unchanged.
- [ ] T019 [US3] Manual validation: quickstart.md section 3, steps 6, 8 and 9 (M6, M9, M10).

**Checkpoint**: Select Voice is selection-only.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T020 Run `npm run test:select-voice` and all eight existing test scripts; confirm all pass.
- [X] T021 Run `npx tsc --noEmit -p tsconfig.json` and `npm run build`; confirm both succeed with no new warnings.
- [ ] T022 Run through all of quickstart.md (sections 1 to 3), including step 10 in part view, and note the result.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none.
- **Foundational (Phase 2)**: depends on Setup. T003, T004 and T005 edit three different files but T004 and T005 call T003's functions, so do T003 first.
- **US1 (Phase 3)**: depends on Phase 2.
- **US2 (Phase 4)**: depends on Phase 2; T014 reviews T004 and is best done after US1's manual check.
- **US3 (Phase 5)**: depends on Phase 2.
- **Polish (Phase 6)**: depends on all stories.

### Within Each Story

- `tests/selectVoice.ts` is edited by T002, T007, T012 and T016: add cases in separate blocks, in order.
- `edit.ts` is edited only by T009.

### Parallel Opportunities

- T007, T012 and T016 are separate test blocks in one file, so write them one after another; each can proceed while code in other files is edited (T004, T005, T009).
- T004 and T005 can be edited in parallel once T003 exists.

---

## Parallel Example: Foundational phase

```text
Task: "SmoSelection.voiceChoices / getVoiceSelectors in src/smo/xform/selections.ts"   (T003)
Task: "SuiTracker.selectVoice in src/render/sui/tracker.ts"                              (T004, after T003)
Task: "selectVoice / getSelectVoiceChoices in src/render/sui/scoreViewOperations.ts"     (T005, after T003)
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phases 1 and 2 (pure logic, tracker method, view methods compile).
2. Phase 3: tests prove the selection logic; the menu exposes it.
3. Stop and validate in the app: select a voice across several measures and change its pitch.

### Incremental Delivery

1. US1 delivers the feature.
2. US2 locks in the choice and no-op rules with tests.
3. US3 proves it is selection-only.

---

## Notes

- The tracker method needs a renderer and is not covered by the headless test; keep it small so that the logic lives in the tested functions.
- No keyboard shortcut is added (spec assumption).
- Commit after each phase.
