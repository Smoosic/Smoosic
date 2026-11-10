---

description: "Task list for Measure Fill Submenu"
---

# Tasks: Measure Fill Submenu

**Input**: Design documents from `/specs/039-measure-fill-submenu/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/measure-fill-api.md](contracts/measure-fill-api.md), [quickstart.md](quickstart.md)

**Tests**: Included. The constitution asks for regression tests on editing logic and serialization. The duration rule, the measure method, the operation and the cleanup are tested headless in `tests/measureFill.ts`; the menu and view method are checked by compilation and [quickstart.md](quickstart.md).

**Organization**: Tasks are grouped by user story. The duration rule for all three fills, the measure method, the operation and the view method serve every story, so they are in the Foundational phase. Each story then adds its menu choice and its tests.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on unfinished tasks)
- **[Story]**: Which user story the task belongs to (US1 to US4)

## Phase 1: Setup

- [X] T001 Create `tests/measureFill.ts` with the `check()`/failure-count harness and the dynamic-ctor registration used in `tests/quickBeam.ts` (`noteModifierDynamicCtorInit`, `measureModifierDynamicCtorInit`, `staffModifierDynamicCtorInit`, `scoreModifierDynamicCtorInit`). Add helpers: `ts(actualBeats, beatDuration)` returning `new SmoTimeSignature({ ...SmoTimeSignature.defaults, times: [{ actualBeats, beatDuration }] })`; `buildScore(meters: [number, number][], staves = 1)` that makes a default score, adds measures until it has `meters.length` measures, sets each measure's time signature from `meters`, fills each measure's voice 0 with notes of the measure's beat length (`noteType = 'n'`, built with `SmoNote.cloneWithDuration`) and adds the requested number of staves as `tests/beamGroups.ts` does; and `pick(score, staff, measure)` returning `SmoSelection.measureSelection(score, staff, measure)!`. Register `"test:measure-fill": "ts-node -P tests/tsconfig.json tests/measureFill.ts"` in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The rule, the measure method, the operation and the view method. See [data-model.md](data-model.md) and [research.md](research.md) R1 to R7.

- [X] T002 Create `src/smo/xform/measureFill.ts` (no UI imports) exporting `type MeasureFillType = 'wholeRest' | 'beats' | 'eighthRests'` and `fillRestDurations(timeSignature: SmoTimeSignature, fill: MeasureFillType, totalTicks?: number): number[]` as specified in [data-model.md](data-model.md). Private helpers: `greedy(left)` that repeatedly takes the largest key of `SmoMusic.validDurations` that is not larger than what is left (sort the keys numerically, descending, once) and stops if nothing fits; `beatTicks(timeSignature)` implementing the beat length rule (lower number 1, 2 or 4 gives the note value; 8 or more gives 3 or 2 times `16384 / lower` depending on whether the top number is a multiple of 3). `totalTicks` defaults to `SmoMusic.timeSignatureToTicks(actualBeats, beatDuration)`. Use the time signature's current `actualBeats` and `beatDuration`
- [X] T003 In `src/smo/data/measure.ts` add `fillWithRests(durations: number[], beamBeats: number)`: build each rest as `SmoNote.defaults` with `noteType = 'r'`, `clef = this.clef`, the pitch `SmoMeasure.defaultPitchForClef[this.clef]`, `ticks.numerator = duration`, `stemTicks = duration` and `beamBeats`; set `this.voices = [{ notes }]`, `this.tupletTrees = []`, `this.beamGroups = []`, `this.activeVoice = 0`; then call `this.setKeySignature(this.keySignature)` so the new notes carry the key. Do not touch `modifiers`, `timeSignature`, `tempo` or `format`
- [X] T004 Add `SmoOperation.fillMeasures(score: SmoScore, selections: SmoSelection[], fill: MeasureFillType)` to `src/smo/xform/operations.ts` as specified in [data-model.md](data-model.md): for each distinct (staff, measure) in the selections work out the target length (the full measure, or `getTicksFromVoice(0)` if `isPickup()`), get the durations from `fillRestDurations`, remove from the staff every modifier whose `startSelector.measure` or `endSelector.measure` is this measure (build a new array like `SmoSystemStaff.deleteMeasure` does and also remove matching entries from the staff's text brackets/tab stave handling by going through `staff.removeStaffModifier` for each match), remove every `SmoTextGroup` with `attachToSelector` whose selector is in this staff and measure from `score.textGroups` (use `score.removeTextGroup`) and from the staff's `partInfo.textGroups`, then call `measure.fillWithRests(durations, beamBeats)` with the score's triple default when the top number is a multiple of 3, otherwise the duple default (the test used by `clearAllBeamGroups`)
- [X] T005 Add `fillMeasures(fill: MeasureFillType): Promise<void>` to `SuiScoreViewOperations` in `src/render/sui/scoreViewOperations.ts`: do nothing if there are no selections; `this._undoScore('fill measures')`; get `const selections = this.tracker.selections` and `const measureSelections = SmoSelection.getMeasureList(selections)`; run `SmoOperation.fillMeasures(this.score, selections, fill)` and `SmoOperation.fillMeasures(this.storeScore, this._getEquivalentSelections(selections), fill)`; `this._renderChangedMeasures(measureSelections)`; `await this.renderer.updatePromise()`
- [X] T006 Run `npx tsc --noEmit -p tsconfig.json` to confirm the foundation compiles

**Checkpoint**: The rule and the operation exist and can be called. Nothing in the menu uses them yet.

---

## Phase 3: User Story 1 - Clear a measure to a whole rest (Priority: P1)

**Goal**: A user selects measures, opens Measure, Fill Measures, Whole Rest, and each measure holds the largest rests that fit.

**Independent Test**: Run the Whole Rest cases in `tests/measureFill.ts`, then [quickstart.md](quickstart.md) section 3.

- [X] T007 [US1] In `src/ui/menus/measure.ts` add the "Fill Measures" submenu: a helper `fillChoice(fill: MeasureFillType, text: string, value: string)` returning a `SuiConfiguredMenuOption` whose handler is `await menu.view.fillMeasures(fill)` and whose `display` is `menu.tracker.getSelectedMeasures().length > 0`; a `fillMeasuresMenuOption` with `subMenu` set to the choices, `handler: async () => { }` (unreachable, as in `edit.ts`), the same `display`, and `menuChoice: { icon: '', text: 'Fill Measures', value: 'fillMeasuresMenuOption' }`; add it to the Measure menu list. Add only the Whole Rest choice (`'Whole Rest'`, value `'fillWholeRest'`) here
- [X] T008 [US1] In `tests/measureFill.ts` add the Whole Rest duration cases from [data-model.md](data-model.md) (D1, D4, D7, D10, D13, D16, D19, D22, D25, D28, D31, D34, D37: the Whole Rest column for 4/4, 2/4, 3/4, 6/8, 9/8, 12/8, 5/8, 7/8, 3/8, 4/8, 2/2, 6/16 and 5/16) and the pickup cases D42 and D46. Add the `SmoMeasure.fillWithRests` cases F1 to F5 and the operation cases O3, O11, O12 and O13. Run `npm run test:measure-fill`

**Checkpoint**: User story 1 works end to end.

---

## Phase 4: User Story 2 - Fill a measure with beat rests (Priority: P1)

**Goal**: Beats gives quarter rests, dotted quarter rests in compound meters, and a remainder rest in odd meters.

**Independent Test**: Run the Beats cases in `tests/measureFill.ts`, then [quickstart.md](quickstart.md) section 4.

- [X] T009 [US2] Add the **Beats** choice (`'Beats'`, value `'fillBeats'`) to the submenu in `src/ui/menus/measure.ts`, after Whole Rest
- [X] T010 [US2] In `tests/measureFill.ts` add the Beats duration cases from [data-model.md](data-model.md) (D2, D5, D8, D11, D14, D17, D20, D23, D26, D29, D32, D35, D38) and the pickup cases D43 and D45. Fix `src/smo/xform/measureFill.ts` if any fails (likely places: the compound test for lower number 8 or more, and the remainder). Add O2 (4/4 and 6/8 measures selected together)

**Checkpoint**: Whole Rest and Beats both work.

---

## Phase 5: User Story 3 - Fill a measure with eighth rests (Priority: P2)

**Goal**: Eighth Rests fills with eighth rests, and a smaller rest if less than an eighth is left.

**Independent Test**: Run the Eighth Rests cases in `tests/measureFill.ts`, then [quickstart.md](quickstart.md) section 5.

- [X] T011 [US3] Add the **Eighth Rests** choice (`'Eighth Rests'`, value `'fillEighthRests'`) to the submenu in `src/ui/menus/measure.ts`, after Beats
- [X] T012 [US3] In `tests/measureFill.ts` add the Eighth Rests duration cases from [data-model.md](data-model.md) (D3, D6, D9, D12, D15, D18, D21, D24, D27, D30, D33, D36, D39) and the pickup case D44, and the D40 and D41 checks that every result adds up to the target and uses only valid durations, over all meters and all three fills

**Checkpoint**: All three choices work.

---

## Phase 6: User Story 4 - Several measures at once, and undo (Priority: P2)

**Goal**: The fill applies to the selected measures and staves only, removes everything attached to the removed notes, keeps the measure's settings, and is one undo step.

**Independent Test**: Run the operation and serialization cases in `tests/measureFill.ts`, then [quickstart.md](quickstart.md) section 6.

- [X] T013 [US4] In `tests/measureFill.ts` add the operation cases O1 (scope: only the selected measures of the selected staff change), O4 (lyrics, dynamics and articulations gone), O5, O6, O7, O8 (staff modifier cleanup: build slurs and hairpins with `SmoSlur`/`SmoStaffHairpin` and `staff.addStaffModifier`, with selectors from `SmoSelector.default` set to the staff, measure, voice and tick), O9 and O10 (text groups: create a `SmoTextGroup` with `attachToSelector` and a selector, add it with `score.addTextGroup`), O14 (beam grouping kept) and O15 (beam length on the rests)
- [X] T014 [US4] In `tests/measureFill.ts` add the serialization cases S1 and S2: fill one measure with each fill type and a pickup measure, serialize with `JSON.stringify(score.serialize())`, deserialize with `SmoScore.deserialize`, and compare the rest durations and the preserved settings; and check a score with no filled measures serializes to the same text before and after loading
- [X] T015 [US4] Add a test in `tests/measureFill.ts` that a measure with two voices ends with one voice (also covered by F1), and one that a 4/4 measure, a 6/8 measure and a 5/8 measure in one selection each get their own meter's rests with Beats (O2 extended to three meters)

**Checkpoint**: Every story and every contract case is covered.

---

## Phase 7: Polish and Cross-Cutting Concerns

- [X] T016 [P] Update the declarations by hand or with `npm run types`: add `types/src/smo/xform/measureFill.d.ts`, and the new members in `types/src/smo/data/measure.d.ts`, `types/src/smo/xform/operations.d.ts` and `types/src/render/sui/scoreViewOperations.d.ts`. If `npm run types` is used, keep only the changes for these files and restore unrelated declaration churn (`git checkout -- <file>`; delete other newly generated untracked declarations)
- [X] T017 [P] Add a `changes.md` entry (follow the entries at the top of the file) describing the Fill Measures submenu in the Measure menu, the three choices, that a fill removes all notes, voices and the markings attached to them, and that it is one undo step
- [X] T018 Run `npx tsc --noEmit -p tsconfig.json`, then `npm run test:measure-fill`, `npm run test:beam-groups`, `npm run test:quick-beam`, `npm run test:beam-dotted`, `npm run test:score-archive`, `npm run test:paste-special`, `npm run test:multimeasure-rest`, `npm run test:create-part`. All must pass
- [ ] T019 Walk through [quickstart.md](quickstart.md) sections 3 to 8 by hand in the running application and note any difference from the expected results

---

## Dependencies and Execution Order

- Phase 1 (T001) first. Phase 2 (T002 to T006) blocks every story. T002 and T003 are independent files; T004 needs both; T005 needs T004.
- US1 (T007, T008) depends on Phase 2. US2 (T009, T010) and US3 (T011, T012) edit the same menu file as US1, so their menu tasks (T009, T011) follow T007 in order; their test tasks do not depend on the menu.
- US4 (T013 to T015) depends only on Phase 2 and can run alongside US1 to US3.
- Polish (T016 to T019) after the stories.

### Parallel opportunities

- T002 and T003 (different files).
- T008, T010, T012 (test cases for different fills) once Phase 2 is done, although they share one file.
- T013 to T015 alongside the menu tasks.
- T016 and T017.

## Implementation Strategy

**MVP**: Phase 1, Phase 2, then US1 (T001 to T008): a user can clear selected measures to the largest rests that fit. US2 and US3 add one menu choice each; the rule for them is already in place from Phase 2, so each is a small step. US4 locks in the cleanup, scope and persistence. Polish adds declarations, changelog and the manual walkthrough.

Run `npm run test:measure-fill` after each phase.
