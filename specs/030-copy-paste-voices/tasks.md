---

description: "Task list for Copy and Paste Voices"
---

# Tasks: Copy and Paste Voices

**Input**: Design documents from `/specs/030-copy-paste-voices/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/voice-copy-paste-contract.md](./contracts/voice-copy-paste-contract.md), [quickstart.md](./quickstart.md)

**Tests**: Included. The plan commits to a headless `tests/voiceCopyPaste.ts` (cases V1 to V20) that drives the real `PasteBuffer` on in-memory scores. Undo, menus and redraw are checked manually (cases M1 to M10).

**Organization**: Tasks are grouped by user story. The core copy and paste logic in `copypaste.ts` is shared by all three stories, so it is the foundation; each story then adds its tests and its menu/view surface.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

Single project: `src/`, `tests/`, repo-root `package.json`.

---

## Phase 1: Setup

- [X] T001 Add the script `"test:voice-copy-paste": "ts-node -P tests/tsconfig.json tests/voiceCopyPaste.ts"` to `package.json`, next to the existing `test:promise-helpers` entry.
- [X] T002 Create `tests/voiceCopyPaste.ts` with the scaffold and the shared test score builder: header comment pointing at `specs/030-copy-paste-voices/contracts/voice-copy-paste-contract.md`; the dynamic-ctor-init calls and imports used by `tests/attachedTextMigration.ts`; the `failures` counter and `check()` helper; the final summary block; and `buildScore()` which makes the single-staff 12-measure 4/4 test score described in the contract (voice 1 on every measure with four quarter notes whose pitches encode the position; voice 2 on measures 1 to 4; voice 3 on measure 2 only; a triplet in voice 1 of measure 6; a triplet in voice 2 of measure 7 is added to measure 7 for case V17; measure 10 with one voice only), plus helpers `voiceNotes(score, measure, voice)` returning `pitch:ticks` strings and `selectNotes(score, measure, firstTick, lastTick, voice)` returning note `SmoSelection`s. Use `SmoScore.getDefaultScore`, `SmoScore.addMeasure`/`addStaff` equivalents, `SmoMeasure.populateVoice`, `SmoNote` and `SmoMeasure.makeTuplet` helpers already used elsewhere in the code.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The voice-copy capture and paste logic in the smo layer, used by every story.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 In `src/smo/xform/copypaste.ts`, add the `VoiceCopy` interface (fields per [data-model.md](./data-model.md)) and a `voiceCopy: VoiceCopy | null = null` field on `PasteBuffer`, and implement `setVoiceSelections(score: SmoScore, selections: SmoSelection[], voice: number | 'all'): boolean`: derive the staves and first/last measure from the selections (extending to whole measures), choose the voice list (the one voice, or every voice present in any selected measure, up to 4), and for each voice and staff build the full note list for all copied measures using the existing `_populateSelectArray` per voice (set `this.notes = {}` and `this.modifiers = []` before each call, store the results in `voiceCopy.notes[voice]` and `voiceCopy.modifiers[voice]`, then restore `this.notes` and `this.modifiers` to empty). For a measure that lacks the voice, add a `PasteNote` for each note of `SmoMeasure.getDefaultNotes(measure)` (default rests) with a selector `{ staff, measure, voice, tick }`. Return false if nothing was copied.
- [X] T004 In `src/smo/xform/copypaste.ts`, implement the paste core `pasteVoice(destination: SmoSelector, voice: number): SmoSelection[]` that requires a single-voice `voiceCopy`; for each copied staff `k` (stopping when the destination staff `destination.staff + k` does not exist) deep-copy the notes (using `SmoNote.deserialize(note.serialize())` and `SmoTupletTree.deserialize(tupletStart.serialize())` like `pasteNoteSelections` does), set each copied `PasteNote.selector.voice` and each copied tuplet tree's `voice` to the destination voice, and call `pasteNoteSelections({ staff, measure: destination.measure, voice, tick: 0, pitches: [] }, notes)`. Set `this.modifiers` to the voice's copied modifiers only if the destination voice equals the source voice; otherwise set it to an empty list ([research.md](./research.md) section 5). Collect and return the replaced measure selections from `this.replacementMeasures`. Reject (return `[]`) a destination voice above 3.
- [X] T005 In `src/smo/xform/copypaste.ts`, implement `pasteAllVoices(destination: SmoSelector): SmoSelection[]` which, for a multi-voice `voiceCopy`, calls the same paste step as `pasteVoice` once per copied voice in ascending voice order, each into the voice of the same number (so missing voices are created in order), and returns all replaced measure selections.
- [X] T006 In `src/smo/xform/copypaste.ts` `_populateMeasureArray`, change the middle-measure tuplet clearing loop to `for (let i = 1; i < this.measures.length - 1; i++)` and remove only the trees of the destination voice: `this.measures[i].tupletTrees = this.measures[i].tupletTrees.filter((tree) => tree.voice !== this.destination.voice);` ([research.md](./research.md) section 3).
- [X] T007 [P] In `src/smo/xform/copypaste.ts`, add the pure static functions `PasteBuffer.copyVoiceChoices(voicesInSelection: number)` and `PasteBuffer.pasteVoiceChoices(copiedVoices: number[], destVoiceCount: number)` exactly as specified in [data-model.md](./data-model.md), and the queries `hasVoiceCopy()`, `copiedVoiceNumbers()` and `getVoiceCopyTickCount()` (the ticks of one copied voice on one staff).
- [X] T008 In `src/smo/xform/copypaste.ts`, clear `voiceCopy` in `setSelections` and `clearSelections` so a normal copy invalidates a voice copy, and add a `clearVoiceCopy()` method.
- [X] T009 Run `npx tsc --noEmit -p tsconfig.json` and fix any errors; confirm the existing tests still pass (`npm run test:attached-text` and the others).

**Checkpoint**: The smo layer can capture and paste voices; nothing in the UI uses it yet.

---

## Phase 3: User Story 2 - Copy one voice and put it in a chosen voice (Priority: P1) MVP

**Goal**: Copy Voices > Voice N and Paste Voice > Voice M work from the Edit menu.

**Independent Test**: quickstart.md section 3, steps 1, 2, 5, 6, 7.

### Tests for User Story 2

- [X] T010 [P] [US2] In `tests/voiceCopyPaste.ts`, add cases V5 to V10 (copy extent from partial selections, paste into the same voice number, other voices unchanged, paste into an existing different voice, paste into a new voice, voice number change).
- [X] T011 [P] [US2] In `tests/voiceCopyPaste.ts`, add cases V14 to V18 (end-of-score limiting, missing voice becomes rests, a triplet kept intact and registered for the destination voice, another voice's triplet survives a multi-measure paste, no stale tuplet tree in the second-to-last pasted measure).
- [X] T012 [US2] Run `npm run test:voice-copy-paste` and fix `copypaste.ts` until V5 to V10 and V14 to V18 pass.

### Implementation for User Story 2

- [X] T013 [US2] In `src/render/sui/scoreViewOperations.ts`, add `async copyVoices(voice: number | 'all'): Promise<void>`: map `this.tracker.selections` to store-score selections with `_getEquivalentSelection` (as `copy()` does), call `this.storePaste.setVoiceSelections(this.storeScore, altSelections, voice)`, and `await this.renderer.updatePromise()`.
- [X] T014 [US2] In `src/render/sui/scoreViewOperations.ts`, add `async pasteVoices(voice: number | 'all'): Promise<void>` modeled on `paste()`: return if there is no voice copy or no selection; take the first selection's measure as the target (tick forced to 0); compute the affected measure range by adding destination measure lengths (`getTicksFromThisOrAnyVoice`) until they reach `storePaste.getVoiceCopyTickCount()`, limited to the last measure; set `storeUndo.grouping = true`, call `_undoColumn('paste voices', i)` and `renderer.unrenderColumn(...)` for each measure in the range, set `grouping = false`; call `pasteVoice(target, voice)` or `pasteAllVoices(target)` on `storePaste` using the store-equivalent selector; then `replaceMeasureView(range)` and `await this.renderer.updatePromise()`.
- [X] T015 [US2] In `src/render/sui/scoreViewOperations.ts`, add `getSelectionVoiceCount(): number` (highest `voices.length` among the selected measures) and `getDestinationVoiceCount(): number` (`voices.length` of the first selected measure), for the menus.
- [X] T016 [US2] In `src/ui/menus/edit.ts`, add the `Copy Voices` option with a `subMenu` of four choices (value `copyVoice0` to `copyVoice3`, text `Voice 1` to `Voice 4`), each calling `menu.view.copyVoices(n)` and displayed when `PasteBuffer.copyVoiceChoices(menu.view.getSelectionVoiceCount())` includes `n`; the parent option's `display` is true when that list is non-empty. Add the `Paste Voice` option with a `subMenu` of four choices (`pasteVoice0` to `pasteVoice3`) each calling `menu.view.pasteVoices(n)` and displayed when `PasteBuffer.pasteVoiceChoices(menu.view.storePaste.copiedVoiceNumbers(), menu.view.getDestinationVoiceCount())` includes `n`; the parent is displayed when that list is non-empty. Add both options to `SuiEditMenuOptions` after `Paste Chords`.
- [X] T017 [US2] Run `npx tsc --noEmit -p tsconfig.json` and fix any errors.
- [ ] T018 [US2] Manual validation: quickstart.md section 3, steps 1, 2, 5, 6, 7 (M1, M2, M3, M5, M8).

**Checkpoint**: Single-voice copy and paste work from the menu.

---

## Phase 4: User Story 1 - Copy a whole passage with all its voices (Priority: P1)

**Goal**: Copy Voices > All and Paste Voice > All.

**Independent Test**: quickstart.md section 3, steps 3 and 4.

### Tests for User Story 1

- [X] T019 [P] [US1] In `tests/voiceCopyPaste.ts`, add cases V11 to V13 and V19 (paste All into a one-voice destination, into a destination with existing voices, uncopied destination voices unchanged, slurs carried within a voice number and not carried when the number changes).
- [X] T020 [US1] Run `npm run test:voice-copy-paste` and fix `copypaste.ts` until V11 to V13 and V19 pass.

### Implementation for User Story 1

- [X] T021 [US1] In `src/ui/menus/edit.ts`, add an `All Voices` choice (value `copyVoiceAll`, calls `menu.view.copyVoices('all')`) to the Copy Voices submenu, displayed when `PasteBuffer.copyVoiceChoices(...)` includes `'all'`; and an `All` choice (value `pasteVoiceAll`, calls `menu.view.pasteVoices('all')`) to the Paste Voice submenu, displayed when `PasteBuffer.pasteVoiceChoices(...)` includes `'all'`.
- [X] T022 [US1] Run `npx tsc --noEmit -p tsconfig.json`.
- [ ] T023 [US1] Manual validation: quickstart.md section 3, steps 3 and 4 (M4, M6).

**Checkpoint**: Whole passages with several voices can be copied and pasted, and undone in one step.

---

## Phase 5: User Story 3 - Whole measures only, and sensible menu choices (Priority: P2)

**Goal**: Whole-measure behavior and menu choices are tested and the clipboard is invalidated correctly.

**Independent Test**: V1 to V4, V15, V20 pass; quickstart.md steps 1 to 3 and 8 to 11.

### Tests for User Story 3

- [X] T024 [P] [US3] In `tests/voiceCopyPaste.ts`, add cases V1 to V4 (the pure choice functions) and V20 (the existing `setSelections` / `pasteSelections` path gives the same result as before for single-voice, multi-voice-selected and multi-measure copies; capture the expected notes from a run before the T006 change by reasoning from the source score and assert they equal the pasted notes).
- [X] T025 [US3] Run `npm run test:voice-copy-paste` and fix until all cases V1 to V20 pass.

### Implementation for User Story 3

- [X] T026 [US3] In `src/render/sui/scoreView.ts` `changeScore`, call `this.storePaste.clearVoiceCopy()` so a voice copy from a previous score is not offered after a new score is loaded.
- [X] T027 [US3] In `src/render/sui/scoreViewOperations.ts` `pasteVoices`, make sure the target tick is 0 whatever note was selected (the paste starts at the beginning of its measure) and that nothing is done when the selection or the clipboard is empty; confirm in the code that no existing `paste()` tick handling is reused.
- [ ] T028 [US3] Manual validation: quickstart.md section 3, steps 8 to 11 (edge cases, existing Copy/Paste, part view).

**Checkpoint**: All stories complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T029 Run `npm run test:voice-copy-paste` and all seven existing test scripts; confirm all pass.
- [X] T030 Run `npx tsc --noEmit -p tsconfig.json` and `npm run build`; confirm both succeed with no new warnings.
- [ ] T031 Run through all of quickstart.md (sections 1 to 3) and note the result.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none.
- **Foundational (Phase 2)**: depends on Setup. T003 to T006 all edit `copypaste.ts`, so do them in order; T007 can be written in parallel to a separate region of the same file only if edited carefully, otherwise after T006.
- **US2 (Phase 3)**: depends on Phase 2. Its tests (T010, T011) are in the shared test file and depend on T002.
- **US1 (Phase 4)**: depends on Phase 2 and on T013 to T016 (the view methods and submenu it extends).
- **US3 (Phase 5)**: depends on Phase 2; T026 and T027 touch the view files after US2's edits.
- **Polish (Phase 6)**: depends on all stories.

### Within Each Story

- `copypaste.ts` is edited in Phase 2 only (and `scoreViewOperations.ts` by T013 to T015, then T027); keep edits in the order given.
- `edit.ts` is edited by T016 then T021.
- `tests/voiceCopyPaste.ts` is edited by T002, T010, T011, T019 and T024: add cases in separate blocks, in order.

### Parallel Opportunities

- T010 and T011 (separate test blocks) with T013 to T015 (different file).
- T007 is independent in logic from T003 to T006.
- Most other work is in shared files, so it is sequential.

---

## Parallel Example: Phase 3

```text
Task: "Add cases V5-V10 to tests/voiceCopyPaste.ts"                         (T010)
Task: "Add cases V14-V18 to tests/voiceCopyPaste.ts"                        (T011)
Task: "copyVoices / pasteVoices / count helpers in scoreViewOperations.ts" (T013-T015)
```

---

## Implementation Strategy

### MVP First (User Story 2)

1. Phases 1 and 2 (the smo logic, compiled but untested).
2. Phase 3: tests prove single-voice copy and paste; the view and menu expose them.
3. Stop and validate in the app: copy a voice, paste it into a new voice.

### Incremental Delivery

1. US2 delivers single-voice copy and paste.
2. US1 adds the All choices.
3. US3 adds the regression guard for existing Copy/Paste, the choice-function tests and score-change invalidation.

---

## Notes

- Tests are written before the view and menu code in each story and should fail first where they exercise new logic; if T003 to T008 already make them pass, record that.
- The two fixes in `_populateMeasureArray` (T006) also affect existing paste in a narrow way (other voices' tuplets in middle measures are kept). Case V20 and V17 guard it.
- No keyboard shortcuts are added (spec assumption).
- Commit after each phase.
