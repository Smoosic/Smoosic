---

description: "Task list for Per-Measure Beam Groups"
---

# Tasks: Per-Measure Beam Groups

**Input**: Design documents from `/specs/038-per-measure-beam-groups/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/beam-groups-api.md](contracts/beam-groups-api.md), [quickstart.md](quickstart.md)

**Tests**: Included. The constitution asks for regression tests on editing logic and serialization. The modifier, boundary calculation, beaming, operations and parsing helper are tested headless in `tests/beamGroups.ts`; the dialog, menu and view method are checked by compilation and [quickstart.md](quickstart.md).

**Organization**: Tasks are grouped by user story. The modifier, the measure accessors and the beamer change are needed by every story, so they are in the Foundational phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on unfinished tasks)
- **[Story]**: Which user story the task belongs to (US1 to US4)

## Phase 1: Setup

- [X] T001 Create `tests/beamGroups.ts` with the `check()`/failure-count harness and the dynamic-ctor registration used in `tests/beamDotted.ts` (`noteModifierDynamicCtorInit`, `measureModifierDynamicCtorInit`, `staffModifierDynamicCtorInit`, `scoreModifierDynamicCtorInit`). Add helpers: `buildMeasure(actualBeats, beatDuration, ticks: number[])` that makes a default score, sets the first measure's time signature with `new SmoTimeSignature({ ...SmoTimeSignature.defaults, times: [{ actualBeats, beatDuration }] })`, replaces `voices[0].notes` with notes cloned from the default note by `SmoNote.cloneWithDuration` with `noteType = 'n'` (as in `tests/beamDotted.ts`), and returns the measure; `beamSizes(measure)` that runs `SmoBeamer.applyBeams(measure)` and returns `measure.beamGroups.map((bg) => bg.notes.length).join(',')`; and `eighths(n)` returning an array of n values of 2048. Register `"test:beam-groups": "ts-node -P tests/tsconfig.json tests/beamGroups.ts"` in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The modifier, the measure accessors and the beamer's boundary logic. See [data-model.md](data-model.md) and [research.md](research.md) R1 to R6.

- [X] T002 Add `SmoBeamPreferences` to `src/smo/data/measureModifiers.ts`, deriving from `SmoMeasureModifierBase` with `super('SmoBeamPreferences')`. Fields and API per [data-model.md](data-model.md): `groups: number[]`; `static readonly minGroup = 1`, `maxGroup = 4`; `static isValidGroups(values: number[]): boolean` (every entry a whole number from 1 to 4; an empty list is valid); `static unitTicks(timeSignature: SmoTimeSignature): number` (1024 when `beatDuration >= 16`, otherwise 2048); a constructor taking `{ groups: number[] }` that copies the list and throws on an invalid list; `serialize()` returning `{ ctor: 'SmoBeamPreferences', groups }`. Export the params and serialized types. Add `SmoDynamicCtor['SmoBeamPreferences'] = (params) => new SmoBeamPreferences(params)` to `measureModifierDynamicCtorInit`
- [X] T003 In `src/smo/data/measure.ts` add `getBeamGroups(): number[]` (copy of the singleton modifier's `groups`, or `[]`) and `setBeamGroups(groups: number[])`. `setBeamGroups` removes any existing `SmoBeamPreferences` with `_removeSingletonModifier`, validates with `SmoBeamPreferences.isValidGroups` (throw on invalid), pushes a new modifier when the list is non-empty, and sets `beamState = SmoNote.beamStates.auto` on every note of every voice (research R5). Import `SmoBeamPreferences` next to the existing measure modifier imports
- [X] T004 In `src/smo/xform/beamers.ts` add `static groupBoundaries(measure: SmoMeasure): number[]` to `SmoBeamer`: return `[]` when `measure.getBeamGroups()` is empty; otherwise compute tick positions with unit `SmoBeamPreferences.unitTicks(measure.timeSignature)` and measure length `measure.timeSignature.ticksFromTimeSignature()`, repeating the list from its first number and clamping the last position to the measure length, as in [data-model.md](data-model.md)
- [X] T005 In `src/smo/xform/beamers.ts` change `SmoBeamer` so that when `groupBoundaries` is non-empty `beamNote` uses boundaries: compute the boundaries once in the constructor (field `boundaries`, plus `boundaryIndex`); for a non-tuplet note, work out `start = this.measureDuration - tickmap.deltaMap[index]` and `end = this.measureDuration`; first advance `boundaryIndex` past every boundary at or before `start`; push the note; keep the existing `beamState === end` and last-note-in-voice handling; after pushing, if `end >= boundaries[boundaryIndex]` and the note's `beamState` is not `continue`, call `_completeGroup`/`_advanceGroup` and advance `boundaryIndex` past every boundary at or before `end`; then return, skipping the half-measure, beat-alignment and `beamBeats` checks. Tuplet notes, rests at the start of a group and notes of 4096 ticks or more keep the existing code. When `boundaries` is empty nothing changes
- [X] T006 Run `npx tsc --noEmit -p tsconfig.json` and `npm run test:beam-dotted` to confirm the foundation compiles and the existing beaming test still passes (no grouped measures yet)

**Checkpoint**: A measure can hold a grouping and the beamer honors it. Nothing yet lets a user set one.

---

## Phase 3: User Story 1 - Beam an irregular meter as 3 + 2 (Priority: P1)

**Goal**: A user selects a measure, opens Beam Groups, enters `3, 2`, and the measure beams 3 + 2.

**Independent Test**: Run the contract cases B1, B2, B8, M1, M2, M3, M8 and the operation and parser cases in `tests/beamGroups.ts`, then run [quickstart.md](quickstart.md) section 3.

- [X] T007 [US1] (dropped) The text-parsing helper `src/ui/dialogs/beamGroupHelpers.ts` was removed when the dialog changed to one number field per group with an Add group button; nothing parses text any more
- [X] T008 [P] [US1] Add `SmoOperation.setBeamGroups(score: SmoScore, selections: SmoSelection[], groups: number[])` to `src/smo/xform/operations.ts`: for each distinct measure in `selections` (de-duplicate by staff and measure index) call `measure.setBeamGroups(groups)`. It touches only the staves in the selections
- [X] T009 [US1] Add `setBeamGroups(groups: number[], scope: 'selections' | 'all'): Promise<void>` to `SuiScoreViewOperations` in `src/render/sui/scoreViewOperations.ts`. For `'selections'`: `const measureSelections = this.undoTrackerMeasureSelections('beam groups')`, apply `SmoOperation.setBeamGroups` to `this.score` with the tracker selections and to `this.storeScore` with `this._getEquivalentSelections(selections)` (as `clearSelectedBeams` does), then `this._renderChangedMeasures(measureSelections)` and `await this.renderer.updatePromise()`. Implement only the `'selections'` branch here; T014 adds `'all'`
- [X] T010 [US1] Create `src/ui/components/dialogs/beamGroups.vue` following `keySignature.vue`: props `domId`, `label`, `initialGroups`, `applyTo`, `setGroupsCb`, `setApplyToCb`, `commitCb`, `cancelCb`. It shows one `numberInput.vue` (1 to 4) for each group, labeled "Group N" with a remove button, an **Add group** (+) button (at most 16 groups; a new group copies the last one's number, or 3 for the first), a Clear button, the explanatory text, an Apply To select (`selections`: 'Selected measures', `all`: 'Whole score') and the note that applying replaces hand-placed beams. Each row has a stable id so removing a row does not shift values. Wrap in `dialogContainer`
- [X] T011 [US1] Create `src/ui/dialogs/beamGroupsVue.ts` exporting `SuiBeamGroupsDialogVue(parameters: SuiDialogParams)`, modeled on `src/ui/dialogs/keySignatureVue.ts`. It reads the first selected measure's `getBeamGroups()` for the initial groups, keeps `groups` and `applyTo` state, and on commit calls `view.setBeamGroups(groups, applyTo)`. Use `replaceVueRoot(modalContainerId)` and `InstallDialog` as in the key signature dialog; use `ctor: 'SuiBeamGroupsDialog'`
- [X] T012 [US1] Add a "Beam Groups" option to `src/ui/menus/beams.ts` (`menuChoice: { icon: 'bv tall bv-beamed', text: 'Beam Groups', value: 'beamGroupsMenuOption' }`, `display: () => true`) whose handler calls `SuiBeamGroupsDialogVue({ ctor: 'SuiBeamGroupsDialog', id: 'beamGroupsDialog', tracker: menu.view.tracker, completeNotifier: menu.completeNotifier, startPromise: null, view: menu.view, eventSource: menu.eventSource })`, as `tabStaveMenuOption` does in `src/ui/menus/parts.ts`; add it to `SuiBeamMenuOptions`
- [X] T013 [US1] In `tests/beamGroups.ts` add the checks: boundaries B1, B2, B8; beaming M1, M2, M3 (compare an ungrouped 5/8 measure's `beamSizes` before and after a set/clear round trip), M8; `SmoOperation.setBeamGroups` sets exactly the selected measures (two staves, select one) and leaves others empty; `SmoMeasure.setBeamGroups` replaces rather than duplicates, rejects `[5]`, `[0]`, `[1.5]`, and resets notes to `beamState` auto. Run `npm run test:beam-groups`

**Checkpoint**: User story 1 works end to end for selected measures.

---

## Phase 4: User Story 2 - Compound meter beams by dotted beats (Priority: P1)

**Goal**: 6/8, 9/8, 12/8, 8/8, 10/8 and x/16 measures beam by the entered grouping, including the repeat rule.

**Independent Test**: Contract cases B3 to B7, B9, M4 to M7, M9 pass, then [quickstart.md](quickstart.md) section 4.

- [X] T014 [US2] In `tests/beamGroups.ts` add boundary cases B3, B4, B5, B6, B7, B9 and beaming cases M4, M5, M6 (10/8 with `[3, 2]` gives `3,2,3,2`), M7 (6/16 with six notes of 1024 ticks), M9. Fix `src/smo/xform/beamers.ts` if any fails (the likely places are the unit for /16 and the final partial repeat)
- [X] T015 [US2] Add a regression check in `tests/beamGroups.ts` that a 4/4 measure and a 6/8 measure with no grouping beam the same as before this feature: record the `beamSizes` for eighths, sixteenths and dotted figures in 4/4, 3/4 and 6/8 using the cases in `tests/beamDotted.ts`, and assert them

**Checkpoint**: Compound and irregular meters work for selected measures.

---

## Phase 5: User Story 3 - Apply to the selection or the whole score (Priority: P2)

**Goal**: The dialog applies a grouping to the whole score, and Clear returns measures to the default.

**Independent Test**: Contract operation cases for `setAllBeamGroups`, then [quickstart.md](quickstart.md) section 4 steps 1 to 3.

- [X] T016 [P] [US3] Add `SmoOperation.setAllBeamGroups(score: SmoScore, groups: number[])` to `src/smo/xform/operations.ts`: call `measure.setBeamGroups(groups)` on every measure of every staff
- [X] T017 [US3] Add the `'all'` branch to `setBeamGroups` in `src/render/sui/scoreViewOperations.ts`: `this._undoScore('beam groups')`, `SmoOperation.setAllBeamGroups(this.score, groups)` and `SmoOperation.setAllBeamGroups(this.storeScore, groups)`, then `await this.awaitRender()` as `clearAllBeams` does
- [X] T018 [US3] Add a "Clear" button to `src/ui/components/dialogs/beamGroups.vue` that removes every group (an empty list clears the grouping on the chosen scope)
- [X] T019 [US3] In `tests/beamGroups.ts` add checks: `setAllBeamGroups` sets every measure of a two-staff, three-measure score; `setAllBeamGroups(score, [])` clears every measure and the serialized measures have no `SmoBeamPreferences` entry; `setBeamGroups` on a selection in staff 1 leaves staff 0 unchanged

**Checkpoint**: The scope choices and Clear work.

---

## Phase 6: User Story 4 - Existing scores and the default are unchanged (Priority: P2)

**Goal**: Old scores load and beam as before, the score-wide default still applies to ungrouped measures, and groupings are saved.

**Independent Test**: Contract serialization cases S1 to S3 and the fallback checks pass.

- [X] T020 [US4] In `tests/beamGroups.ts` add S1 (a score with groupings on measures 2 and 4, through `score.serialize()` and `SmoScore.deserialize`, keeps them and keeps measures 1 and 3 empty) and S2 (a serialized score containing no `SmoBeamPreferences` entries loads with every measure reporting `[]` and the same `beamSizes` as before). Use `JSON.parse(JSON.stringify(...))` on the serialized score to prove it is plain data
- [X] T021 [US4] In `tests/beamGroups.ts` add S3: round trip a grouped score through the `.smz` compression in `src/common/serializationHelpers.js` (see how `tests/scoreArchive.ts` or the score-archive code exercises it) and check the groupings survive. Add the fallback check: change `score.preferences.defaultDupleDuration` and confirm an ungrouped measure's notes follow `clearAllBeamGroups` as before while a grouped measure's `getBeamGroups()` is unchanged
- [X] T022 [US4] Add a check in `tests/beamGroups.ts` that a measure copied through `SmoMeasure.serialize()` then `SmoMeasure.deserialize()` keeps its grouping (FR-018, research R7)

**Checkpoint**: Compatibility and persistence are verified.

---

## Phase 7: Polish and Cross-Cutting Concerns

- [X] T023 In `src/smo/xform/operations.ts` change `SmoOperation.beamSelections` so that when the measure of the beamed notes has a non-empty `getBeamGroups()`, every note of the hand-beamed span except the last is marked `SmoNote.beamStates.continue` (the last note still gets `end`). Ungrouped measures keep today's behavior exactly (research R5, rule 3)
- [X] T024 In `tests/beamGroups.ts` add M10, M11 and M12 from the contract (an `end` state still closes a group; a hand beam with `continue` is not split at a boundary; a tuplet is beamed as before) and a check that `beamSelections` in an ungrouped measure leaves note states as it did before
- [X] T025 [P] Regenerate declarations for the changed source files only. Run `npm run types`, then keep only the `types/src/...` changes for `measureModifiers`, `measure`, `beamers`, `operations`, `scoreViewOperations`, and the new `beamGroupsVue` file (restore any unrelated declaration churn with `git checkout -- <file>`)
- [X] T026 [P] Add a `changes.md` entry (follow the entries at the top of the file) describing per-measure beam groups, the Beam Groups menu item, and that applying a grouping replaces hand-placed beam states in those measures
- [X] T027 Run `npx tsc --noEmit -p tsconfig.json`, then `npm run test:beam-groups`, `npm run test:beam-dotted`, `npm run test:paste-special`, `npm run test:score-archive`, `npm run test:create-part`, `npm run test:move-part`. All must pass
- [ ] T028 Walk through [quickstart.md](quickstart.md) sections 3 to 7 by hand in the running application (`npm run build`, then load the app) and note any difference from the expected results

---

## Dependencies and Execution Order

- Phase 1 (T001) first. Phase 2 (T002 to T006) blocks every story. T002 before T003 and T004; T004 before T005.
- US1 (T007 to T013) depends on Phase 2. T007 and T008 are independent files. T009 needs T008. T010 and T011 need T007 and T009. T012 needs T011. T013 needs T007, T008 and T003 to T005.
- US2 (T014, T015) depends only on Phase 2 and can run alongside US1's UI work.
- US3 (T016 to T019) depends on US1 (T009, T010, T011).
- US4 (T020 to T022) depends on Phase 2 and can run alongside US1 to US3.
- Polish (T023 to T028) after the stories; T023 and T024 can start after Phase 2.

### Parallel opportunities

- T007 and T008 (different files).
- T014 and T015 once Phase 2 is done.
- T016 alongside T010 and T011.
- T025 and T026.

## Implementation Strategy

**MVP**: Phase 1, Phase 2, then US1 (T001 to T013): a user can set a grouping on selected measures and see 3 + 2 in 5/8. US2 adds test coverage for compound meters and the repeat rule against the same code, so ship it with US1 if desired. US3 adds the whole-score scope and Clear. US4 locks in compatibility. Polish adds hand-beam handling, declarations, changelog and the manual walkthrough.

Run `npm run test:beam-groups` after each phase.
