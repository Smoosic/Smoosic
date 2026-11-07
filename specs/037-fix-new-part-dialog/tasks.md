---

description: "Task list for Fix the Create Part Dialog"
---

# Tasks: Fix the Create Part Dialog

**Input**: Design documents from `/specs/037-fix-new-part-dialog/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/create-part-api.md](contracts/create-part-api.md), [quickstart.md](quickstart.md)

**Tests**: Included. The constitution asks for regression tests on editing logic and serialization. The model operation and the small helpers are tested headless in `tests/createPart.ts`; the dialog and view method are checked by compilation and [quickstart.md](quickstart.md).

**Organization**: Tasks are grouped by user story. Shifting references when a staff is inserted above others is needed by every story, so it is in the Foundational phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on unfinished tasks)
- **[Story]**: Which user story the task belongs to (US1 to US4)

## Phase 1: Setup

- [X] T001 Create `tests/createPart.ts` with the `check()`/failure-count harness and the dynamic-ctor registration used in `tests/voiceCopyPaste.ts` (`noteModifierDynamicCtorInit`, `measureModifierDynamicCtorInit`, `staffModifierDynamicCtorInit`, `scoreModifierDynamicCtorInit`), plus a `buildScore(names: string[])` helper that makes a score with one measure per staff using `SmoScore.getDefaultScore(SmoScore.defaults, null)` and `score.addStaff(...)` with `SmoSystemStaff.defaults` (set `staffId` to the next index), giving each staff a `partInfo.partName` from `names`; and an `order(score)` helper returning the part names in staff order. Register `"test:create-part": "ts-node -P tests/tsconfig.json tests/createPart.ts"` in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Inserting a staff above others must keep everything that refers to a staff by number correct. See [research.md](research.md) R4.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 In `src/smo/data/systemStaff.ts` add `shiftStaffReferences(fromIndex: number, delta: number)` to `SmoSystemStaff`: for every staff modifier in `this.modifiers` and every text bracket in `this.textBrackets`, add `delta` to `startSelector.staff`, `endSelector.staff` and `associatedStaff` when each is `>= fromIndex`; and do the same for the `startSelector.staff` and `endSelector.staff` of every instrument in `this.measureInstrumentMap`. Follow the style of `mapStaffFromTo` in the same file
- [X] T003 In `src/smo/data/score.ts` add `shiftStaffReferences(fromIndex: number, delta: number)` to `SmoScore`: call each staff's `shiftStaffReferences`, add `delta` to the `startSelector.staff` and `endSelector.staff` of every system group when each is `>= fromIndex`, and add `delta` to `selector.staff` of every score text group that has a selector when it is `>= fromIndex`. Then in `SmoScore.addStaff`, call `this.shiftStaffReferences(parameters.staffId, 1)` just before the new staff is pushed onto `this.staves` (so only the existing staves are shifted and the new staff's own selectors are untouched), and only when `parameters.staffId < this.staves.length` (an append shifts nothing)
- [X] T004 Write the shifting tests R1-R5 and S2 in `tests/createPart.ts` as listed in [contracts/create-part-api.md](contracts/create-part-api.md): a slur on the third staff (use `SmoSlur` with start and end selectors on that staff, added through `staff.addStaffModifier`), a system group over staves 1-2 and one over 0-2 (`SmoSystemGroup`), an instrument map entry, an append that shifts nothing, and `staves[i].staffId === i` after each insertion, inserting with `score.addStaff` at a staff id of 0, 1 and N. Run `npm run test:create-part` and confirm they pass

**Checkpoint**: Staves can be inserted anywhere without corrupting references. User stories can begin.

---

## Phase 3: User Story 1 - Put the new part anywhere in the score (Priority: P1) 🎯 MVP

**Goal**: Staff Location accepts 1 to N+1, starts at N+1, and the new part lands there.

**Independent Test**: Per [quickstart.md](quickstart.md) section 3: in a score with A, B, C, create a part at 4, 1 and 2 (undoing between) and check where it lands; 0 and 9 are held to 1 and 4; the new part goes in as one undo step.

### Implementation for User Story 1

- [X] T005 [US1] In `src/smo/data/score.ts` add `resolveNewPartIndex(location: number): number` to `SmoScore`: round the location (use N+1 if it is not a finite number), hold it to 1..N+1 where N is `this.staves.length`, and return `location - 1`. (The two-stave rule is added in T012.) See [data-model.md](data-model.md) Placement
- [X] T006 [US1] In `src/smo/xform/operations.ts` export the `AddPartParams` interface from [contracts/create-part-api.md](contracts/create-part-api.md) and add `static addPart(score: SmoScore, params: AddPartParams): number` to `SmoOperation`: resolve the index with `score.resolveNewPartIndex(params.location)`; build `SmoSystemStaff.defaults` parameters with `staffId` set to the index and `measureInstrumentMap[0]` set to a copy of `params.instrument` whose `startSelector.measure` is 0 and `endSelector.measure` is the last measure; build the part information from `SmoPartInfo.defaults` with `partName` set to `params.name.trim()` or `params.instrumentLabel` and `partAbbreviation` to `params.abbreviation.trim()`, and pass it as `partInfo`; call `score.addStaff`; return the index. Keep a single staff here; `twoStaves` is added in T013. Return the index of the new staff
- [X] T007 [US1] Write the placement tests P1, A1 and A2 in `tests/createPart.ts`: `resolveNewPartIndex` on a 3-staff score for locations 1, 2, 3, 4 and 9 (expect 0, 1, 2, 3, 3), and `addPart` at each of 1..4 checking the new staff's name is at the resolved index and the other names keep their order. Run `npm run test:create-part`
- [X] T008 [US1] In `src/render/sui/scoreViewOperations.ts` add `async createPart(params: AddPartParams): Promise<void>`: call `this._undoScore('Create part')` once; set the instrument's measure range as `addStaff` does (`startSelector.measure = 0`, `endSelector.measure` = last measure of `this.storeScore.staves[0]`); call `SmoOperation.addPart(this.storeScore, params)`; call `updateInstrumentOffsets()` on the new staff and `this.storeScore.setNoteInstrumentProperties()`; join the new staff to the system group of the staff above it, widening the group instead of assigning (`end = Math.max(end, newIndex)`), or create a two-staff group, exactly as `addStaff` does for a staff id above 0 (research R5); then `this.viewAll()` and `return this.renderer.updatePromise()`. Leave `addStaff` unchanged
- [X] T009 [US1] In `src/ui/dialogs/instrument.ts` rewrite `SuiCreatePartVue`: keep `staffLocation` as a one-based `ref` starting at `parameters.view.storeScore.staves.length + 1`; `setStaffId` stores the value held to 1..N+1; `commitCb` calls `parameters.view.createPart({ location: staffLocation.value, instrument, twoStaves: addStave, name: '', instrumentLabel: '', abbreviation: '' })` (name fields are filled in T017); remove the two `addStaff` calls and the `partInfo.stavesAfter = 1` code
- [X] T010 [US1] In `src/ui/components/dialogs/newPart.vue` set the Staff Location input's `initialValue` to `props.staffLength + 1`, `maxValue` to `props.staffLength + 1` and keep `minValue` 1; in `SuiCreatePartVue` (`instrument.ts`) pass `staffLength: storeScore.staves.length` as before. Fix the 2-stave toggle in the component so it calls `props.addStaveCb()` (it currently calls an undefined `addStaveCb`)
- [ ] T011 [US1] Run `npx tsc --noEmit -p tsconfig.json` and `npm run test:create-part`; then do the quickstart section 3 manual check *(compile and automated tests done; the manual app check is not done)*

**Checkpoint**: User Story 1 is complete: a part can be created at any position.

---

## Phase 4: User Story 2 - Never split an existing two-stave part (Priority: P1)

**Goal**: A location inside a two-stave part puts the new part after it, and the dialog's own two-stave parts are properly linked.

**Independent Test**: Per [quickstart.md](quickstart.md) section 4: create a 2-stave part, then a part at a location between its staves; the part stays together and the new one is below it.

### Implementation for User Story 2

- [X] T012 [US2] In `src/smo/data/score.ts` extend `resolveNewPartIndex`: after computing the index, if `index < this.staves.length` and `this.staves[index].partInfo.stavesBefore > 0`, return `index + this.staves[index].partInfo.stavesAfter + 1`. See [research.md](research.md) R3
- [X] T013 [US2] In `SmoOperation.addPart` (`src/smo/xform/operations.ts`) support `params.twoStaves`: after inserting the first staff at the resolved index, insert a second staff at index + 1 with `measureInstrumentMap[0]` a new `SmoInstrument` of the same instrument and the opposite clef (`instrument.clef === 'treble' ? 'bass' : 'treble'`, as the dialog did), the same name and abbreviation; set the first staff's `partInfo.stavesAfter = 1, stavesBefore = 0` and the second's `stavesAfter = 0, stavesBefore = 1`, on the staves in the score returned from `addStaff` (not on a copy). Build each staff's `SmoPartInfo` separately so they are not shared objects. See [research.md](research.md) R6
- [X] T014 [US2] In `createPart` (`src/render/sui/scoreViewOperations.ts`) call `updateInstrumentOffsets()` on both new staves when `twoStaves`, and join the second staff to the group with the first (the group end becomes the second staff's index)
- [X] T015 [US2] Write the two-stave tests P2-P5, A6 and A7 in `tests/createPart.ts`: a score A, P1+P2, C built with `addPart(twoStaves)` then locations 3 (expect 3), 2 (expect 1), 4 (expect 3) and 1 (expect 0); a score of two adjacent two-stave parts; the link values and opposite clefs of a created two-stave part; a two-stave part created at a location inside an existing one lands after it intact. Run `npm run test:create-part`
- [ ] T016 [US2] Run `npx tsc --noEmit -p tsconfig.json`; then do the quickstart section 4 manual check *(compile and automated tests done; the manual app check is not done)*

**Checkpoint**: User Stories 1 and 2 work together: any position, no split parts.

---

## Phase 5: User Story 3 - Name the part when creating it (Priority: P2)

**Goal**: The dialog is titled "Create Part", has Name and Abbreviation fields, and the Name placeholder follows the chosen instrument.

**Independent Test**: Per [quickstart.md](quickstart.md) section 5: choose Cello with no name and get a part named Cello; type "Cello I" and "Vc. I" and get exactly those.

### Implementation for User Story 3

- [X] T017 [US3] Create `src/ui/dialogs/createPartHelpers.ts` (no Vue or DOM imports) exporting `instrumentChoices: SelectOption[]` (move the list from `newPart.vue`, dropping the duplicate "Grand Piano" entry), `instrumentLabelFor(value: string): string`, `clampPartLocation(value: unknown, staffCount: number): number` and `resolvePartName(typed: string, instrumentLabel: string): string` per [contracts/create-part-api.md](contracts/create-part-api.md); import `SelectOption` as a type from `../common`. Use `clampPartLocation` in `SuiCreatePartVue` (T009's `setStaffId`)
- [X] T018 [P] [US3] Write the helper tests C1-C3 and the name tests A2-A3 in `tests/createPart.ts`: `clampPartLocation` with 0, 1, N+1, N+2, 2.6, NaN and a string; `resolvePartName` with '', '  ', 'Cello I', ' Vc '; no duplicate `value` in `instrumentChoices`; `instrumentLabelFor('cello') === 'Cello'`; `addPart` with a typed name and abbreviation gives exactly those, and with a blank name gives the label. Run `npm run test:create-part`
- [X] T019 [US3] In `src/ui/components/dialogs/newPart.vue` import `instrumentChoices` from `../../dialogs/createPartHelpers` in place of the local list; add two text inputs (Name and Abbreviation) styled like the text input in `tempo.vue`, with v-models bound to two refs and `@input` callbacks passed in as props `setName(value: string)` and `setAbbreviation(value: string)`; set the Name input's `placeholder` to `instrumentLabelFor(currentInstrument)` where `currentInstrument` is a local ref that `updateInstrumentCb` updates (the instrument object is not reactive here, as the tempo dialog showed)
- [X] T020 [US3] In `SuiCreatePartVue` (`src/ui/dialogs/instrument.ts`) set the dialog `label` to `'Create Part'`, keep `name` and `abbreviation` in local variables updated by `setName` and `setAbbreviation` (pass them as props), and in `commitCb` pass `name`, `abbreviation` and `instrumentLabel: instrumentLabelFor(instrument.instrument)` to `createPart`
- [ ] T021 [US3] Run `npx tsc --noEmit -p tsconfig.json`; compile the template with `@vue/compiler-sfc` as a syntax check; then do the quickstart section 5 manual check *(compile and automated tests done; the manual app check is not done)*

**Checkpoint**: User Stories 1-3 work: placed, protected and named.

---

## Phase 6: User Story 4 - Keep the text of new parts by default (Priority: P3)

**Goal**: A part made with the dialog has Preserve Text Groups on; nothing else changes.

**Independent Test**: Per [quickstart.md](quickstart.md) section 6.

### Implementation for User Story 4

- [X] T022 [US4] In `SmoOperation.addPart` (`src/smo/xform/operations.ts`) set `preserveTextGroups = true` on every `SmoPartInfo` it builds (one or two staves); do not touch `SmoPartInfo.defaults` or the `SmoSystemStaff` constructor default
- [X] T023 [US4] Write the tests A4, A5 and S1 in `tests/createPart.ts`: a part from `addPart` has `preserveTextGroups` true on each of its staves; `SmoPartInfo.defaults.preserveTextGroups` is still false after the call; a staff added with `score.addStaff(SmoSystemStaff.defaults)` has it false; and a score with a one-stave and a two-stave part created by `addPart` survives `SmoScore.deserialize(JSON.stringify(score.serialize({ skipStaves: false, useDictionary: false, preserveStaffIds: true })))` with names, abbreviations, the setting and the before/after links intact. Run `npm run test:create-part`
- [ ] T024 [US4] Run `npx tsc --noEmit -p tsconfig.json`; then do the quickstart section 6 manual check *(compile and automated tests done; the manual app check is not done)*

**Checkpoint**: All four stories work.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T025 [P] Add a changelog entry to `changes.md`: Create Part dialog fixes (Staff Location 1 to N+1 starting after the last staff; never splits a two-stave part; Name and Abbreviation fields and the "Create Part" title; Preserve Text Groups on for parts made there); one undo step for a two-stave part; inserting a staff above others now keeps slurs, hairpins, brackets and groups attached to the right staves; library note: `SmoScore.addStaff` now shifts references when inserting above existing staves
- [X] T026 [P] Regenerate declarations with `npm run types` (run it in the background, it takes more than two minutes), keep only the files for sources changed here (`score.d.ts`, `systemStaff.d.ts`, `operations.d.ts`, `scoreViewOperations.d.ts`, `createPartHelpers.d.ts`, `instrument.d.ts` if its signature changed) and restore every other changed or untracked file under `types/`
- [ ] T027 Run the full [quickstart.md](quickstart.md) sections 1, 2 and 7 *(sections 1 and 2 done; the manual checks are not done)*
- [X] T028 Run `tsc --noEmit -p tsconfig.json` and every `test:*` script in `package.json`; fix regressions

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: none.
- **Foundational (Phase 2)**: depends on T001. T002 then T003 (same concept, different files; T003 calls T002); T004 after T003.
- **User Story 1 (Phase 3)**: depends on Phase 2. T005 then T006 (T006 calls T005); T007 after T006; T008 after T006; T009 and T010 after T008 (T010 and T009 touch different files and can be done together).
- **User Story 2 (Phase 4)**: depends on User Story 1 (it extends T005 and T006 and T008).
- **User Story 3 (Phase 5)**: depends on User Story 1 (it fills the name fields T006 and T009 left empty). Independent of User Story 2.
- **User Story 4 (Phase 6)**: depends on T006 only.
- **Polish (Phase 7)**: depends on all stories.

### Within each story

- Model before view; view before dialog; helper module before the component that imports it; tests written in the same step as the code they cover.

### Parallel opportunities

- After User Story 1: User Stories 2, 3 and 4 touch mostly different places (T012-T014 model/view; T017-T020 UI; T022 one line) and can proceed in parallel, with T013 and T022 in the same function so those two should be done in order.
- T018 (tests) is independent of T019.
- T025 and T026 touch different files.

```text
# Example: after Phase 3
Developer A: T012 -> T013 -> T014 -> T015  (US2)  then T022 -> T023 (US4)
Developer B: T017 -> T019 -> T020  (US3), with T018 alongside
```

---

## Implementation Strategy

### MVP first (User Story 1)

1. Phase 1 and Phase 2 (shifting references, with tests).
2. Phase 3: a part can be created at every position. The dialog already works better than today.
3. Stop and check. User Story 2 is also P1: it should ship with it, because the new reach of the dialog makes splitting a two-stave part easy to do by accident.

### Incremental delivery

1. Foundational + US1 + US2: safe placement.
2. US3: naming. US4: the setting. Each can ship alone.
3. Polish.

---

## Notes

- Do not change `SmoPartInfo.defaults`.
- `SmoScore.addStaff` is used by library callers and by file import; the shifting in T003 must do nothing for an append.
- The instrument list is a bare list in two places today (the component and `createPartHelpers.ts` after T017); after T019 it must exist only in the helper.
- Never read the instrument's display label from the select component; use `instrumentLabelFor`.
- Implementation note: the system-group joining that T008 and T014 put in the view method is in `SmoOperation.addPart` instead, so the headless tests cover it (cases G1 and G2). `createPart` is just the undo step, `addPart`, and the redraw. `addPart` also calls `updateInstrumentOffsets` and `setNoteInstrumentProperties` itself.
