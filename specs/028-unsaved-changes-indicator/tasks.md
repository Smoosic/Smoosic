---

description: "Task list for Unsaved Changes Indicator and Save Prompt"
---

# Tasks: Unsaved Changes Indicator and Save Prompt

**Input**: Design documents from `/specs/028-unsaved-changes-indicator/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/score-change-contract.md](./contracts/score-change-contract.md), [quickstart.md](./quickstart.md)

**Tests**: Included. The plan commits to a headless `tests/scoreChangeState.ts` script (cases S1 to S14) for the pure logic and the undo hook. UI behavior (cases U1 to U17) is checked manually per quickstart.md.

**Organization**: Tasks are grouped by user story. The shared state and the pure policy module are foundational because all three stories read them.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

Single project: `src/`, `tests/`, repo-root `package.json`.

---

## Phase 1: Setup

- [X] T001 Add the script `"test:score-change-state": "ts-node -P tests/tsconfig.json tests/scoreChangeState.ts"` to `package.json`, next to the existing `test:page-divisions` entry.
- [X] T002 Create `tests/scoreChangeState.ts` with the scaffold only: header comment pointing at `specs/028-unsaved-changes-indicator/contracts/score-change-contract.md`, the `failures` counter and `check(name, condition, detail?)` helper copied from `tests/pageDivisions.ts`, and the final summary block (`all checks passed`, or `process.exitCode = 1`). It may import only `src/smo/xform/undo.ts` and `src/render/sui/scoreChangeState.ts` (no DOM, Vue or VexFlow).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The undo hook, the pure policy module and the view state that every story uses.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 [P] In `src/smo/xform/undo.ts`, add an optional public field `onAddBuffer?: () => void` to `UndoBuffer` (documented as a listener for any recorded undo step) and call it at the end of `addBuffer`, after the entry has been stored. Do not clear it in `reset()`.
- [X] T004 [P] Create `src/render/sui/scoreChangeState.ts` with no imports, exporting: `type SaveOutcome = 'saved' | 'exported' | 'cancelled'`; `type AfterSaveStep = 'load' | 'prompt' | 'abort'`; `isFullSaveFormat(extension)` (true only for `.json`, compared case-insensitively); `formatScoreTitle(name, changed)` (trimmed name or `Untitled` when empty, plus a trailing `*` when changed); `nextStepAfterSave(outcome)` (`saved` returns `load`, `exported` returns `prompt`, `cancelled` returns `abort`). Per [data-model.md](./data-model.md).
- [X] T005 [P] In `tests/scoreChangeState.ts`, add cases S1 to S4 (`UndoBuffer.onAddBuffer`: unset is harmless, fires once per `addBuffer`, fires inside grouping, survives `reset()`). Build entries with `UndoBuffer.bufferTypes.COLUMN` or the simplest type that `addBuffer` accepts with a minimal object.
- [X] T006 [P] In `tests/scoreChangeState.ts`, add cases S5 to S14 (`isFullSaveFormat`, `formatScoreTitle` including the empty-name and asterisk cases, `nextStepAfterSave`).
- [X] T007 Run `npm run test:score-change-state` and fix `undo.ts` / `scoreChangeState.ts` until every case passes.
- [X] T008 In `src/render/sui/scoreView.ts`, add `scoreChanged: Ref<boolean> = ref(false)` and `scoreName: Ref<string> = ref('')` next to the existing `selectedPart`; add `markScoreChanged()`, `markScoreSaved()` and `refreshScoreName()` (sets `scoreName.value` from `this.score.scoreInfo.name`); in the constructor set `this.storeUndo.onAddBuffer = () => this.markScoreChanged()` after `storeUndo` is created and call `refreshScoreName()`.
- [X] T009 In `src/render/sui/scoreView.ts`, update `undo()` to call `markScoreChanged()` and `refreshScoreName()` after the restore, and update `changeScore()` to call `markScoreSaved()` and `refreshScoreName()` as its last step after `await this.awaitRender()` and before returning.

**Checkpoint**: The flag is set by every recorded undo step and cleared by every score load; the pure logic is tested.

---

## Phase 3: User Story 1 - See which score is open and whether it has unsaved changes (Priority: P1) MVP

**Goal**: The sidebar header shows the score name with an asterisk when changed, and it clears on a full-format save.

**Independent Test**: quickstart.md section 4, steps 1 to 8 (header, edits, renaming, Smoosic-format save clears, MusicXML export does not, Quick Save clears).

### Implementation for User Story 1

- [X] T010 [US1] In `src/render/sui/scoreViewOperations.ts`, import `isFullSaveFormat` and add `recordSave(extension: string): boolean`, which calls `markScoreSaved()` and returns true when `isFullSaveFormat(extension)`, and otherwise leaves the flag unchanged and returns false. In `quickSave()`, call `markScoreSaved()` after the local-storage write.
- [X] T011 [US1] In `src/render/sui/scoreViewOperations.ts` `updateScoreInfo`, call `this.refreshScoreName()` after the score info is assigned.
- [X] T012 [US1] In `src/ui/dialogs/fileDialogs.ts` `SuiFileSaveDialog`, call `parameters.view.recordSave(extension.value)` from the dialog's `commitCb` (currently empty), so the decision is made by the view operation, not the dialog.
- [X] T013 [US1] In `src/ui/components/buttons/sidebar.vue`, add props `scoreName: Ref<string>` and `scoreChanged: Ref<boolean>` and show `Smoosic {{ formatScoreTitle(scoreName, scoreChanged) }}` in the `side-brand` span (import `formatScoreTitle` from `src/render/sui/scoreChangeState`). Add a CSS rule in `src/styles/menus.css` next to `.side-brand` so a long name is truncated with an ellipsis instead of breaking the layout.
- [X] T014 [US1] In `src/ui/buttons/ribbon.ts` `createSidebarMenuHtml`, pass `scoreName: this.view.scoreName` and `scoreChanged: this.view.scoreChanged` in the `createApp(ribbonSidebarApp, ...)` props.
- [X] T015 [US1] Run `npx tsc --noEmit -p tsconfig.json` and fix any errors.
- [ ] T016 [US1] Manual validation: quickstart.md section 4, steps 1 to 8 (U1 to U9).

**Checkpoint**: The header and the save behavior work; users can see unsaved changes.

---

## Phase 4: User Story 2 - Be asked to save before replacing the open score (Priority: P1)

**Goal**: New, Open, Import and Library loads ask Save / Don't save / Cancel when the score has unsaved changes, with the lossy-export loop.

**Independent Test**: quickstart.md section 4, steps 9 to 14 (U10 to U17).

### Implementation for User Story 2

- [X] T017 [US2] In `src/ui/dialogs/dialog.ts`, add `afterCloseCb?: DialogCallback` to `DialogInstallParams` and, in `InstallDialog`'s `commitCb` only, `await params.afterCloseCb?.()` after `dialogApp?.unmount()`. Do not call it from `cancelCb` or `removeCb`.
- [X] T018 [US2] In `src/ui/dialogs/fileDialogs.ts` `SuiFileSaveDialog`, add an optional second parameter `onClosed?: (outcome: SaveOutcome) => void`. Call it from `commitCb` with `'saved'` when `recordSave` returned true and `'exported'` otherwise, and from `cancelCb` with `'cancelled'` (import `SaveOutcome` from `scoreChangeState`).
- [X] T019 [P] [US2] Create `src/ui/components/dialogs/unsavedChanges.vue` modeled on `modalMessage.vue`: props `domId`, `headline`, `message` and three callbacks `saveCb`, `discardCb`, `cancelCb`; three buttons labelled "Save", "Don't save" and "Cancel"; classes consistent with the other modal dialogs.
- [X] T020 [US2] Create `src/ui/dialogs/unsavedChanges.ts` exporting `confirmReplaceScore(parameters: SuiDialogParams): Promise<boolean>`: return true immediately when `!parameters.view.scoreChanged.value`; otherwise mount `unsavedChanges.vue` through `InstallDialog` (with `replaceVueRoot(modalContainerId)`, as in `partInfo.ts`) and resolve per [data-model.md](./data-model.md): Don't save returns true, Cancel returns false, Save opens `SuiFileSaveDialog(parameters, onClosed)` and then follows `nextStepAfterSave(outcome)` (`load` returns true, `prompt` shows the prompt again, `abort` returns false). The save dialog must be started with a fresh `startPromise` so it waits for the prompt to close.
- [X] T021 [US2] In `src/ui/dialogs/fileDialogs.ts` `SuiFileUploadDialog`, split the commit: `commitCb` keeps reading and converting the file but stores the result in a local `pendingScore` instead of calling `changeScore`, catching conversion errors as it does now; pass an `afterCloseCb` to `InstallDialog` that, when `pendingScore` is set, awaits `confirmReplaceScore(parameters)` and only then calls `parameters.view.changeScore(pendingScore)`. Applies to Open and Import Midi, which share this dialog.
- [X] T022 [US2] In `src/ui/components/dialogs/library.vue`, replace the direct `props.view.loadRemoteScore(...)` in `confirmLoad` with a new prop callback (for example `selectedCb: (url: string) => void`) that reports the chosen URL. In `src/ui/dialogs/libraryVue.ts`, pass that callback in `appParams`, remember the URL, and pass an `afterCloseCb` to `InstallDialog` that, when a URL was selected, awaits `confirmReplaceScore(parameters)` and only then calls `parameters.view.loadRemoteScore(url)`.
- [X] T023 [US2] In `src/ui/menus/file.ts`, change the New handler to `if (await confirmReplaceScore({ ...dialog params from menu, startPromise: menu.closePromise })) { await menu.view.changeScore(score); }`, building the parameters object the same way the other handlers in the file do.
- [X] T024 [US2] Run `npx tsc --noEmit -p tsconfig.json` and fix any errors.
- [ ] T025 [US2] Manual validation: quickstart.md section 4, steps 9 to 14 (U10 to U17), including Cancel, Don't save, Save in Smoosic format, Save then MusicXML (prompt returns), and cancelling the Open dialog (no prompt).

**Checkpoint**: Users cannot lose a changed score through New, Open, Import or the Library without being asked.

---

## Phase 5: User Story 3 - Fresh start for each new or loaded score (Priority: P2)

**Goal**: Each created or loaded score starts as saved and shows its own name.

**Independent Test**: Make an edit, choose Don't save while loading another score, and confirm the new score shows its own name and no asterisk, for New, Open, Import and Library; confirm initial startup shows no asterisk.

### Implementation for User Story 3

- [X] T026 [US3] Confirm `src/application/application.ts` and `src/application/generateVexTests.ts` need no change: the first score is passed to the `SuiScoreViewOperations` constructor (flag starts false, name read from the score, per T008) and later loads use `changeScore` (per T009). If a code path sets `view.score` or `storeScore` directly outside `changeScore`, route it through `changeScore` or call `markScoreSaved()` and `refreshScoreName()` there. Record the result in the PR description.
- [ ] T027 [US3] Manual validation: after an edit, load each of New, Open, Import and Library with Don't save, and confirm the header shows the new score's name with no asterisk each time; reload the page and confirm the first score shows no asterisk (U1, U10).

**Checkpoint**: The state never carries over from one score to the next.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T028 Run `npm run test:score-change-state` and the five existing tests (`test:page-divisions`, `test:global-layout-reposition`, `test:text-drag-placement`, `test:attached-text`, `test:rehearsal-measure-number`) and confirm all pass.
- [X] T029 Run `npm run build` and confirm it succeeds.
- [ ] T030 Run through all of quickstart.md (sections 1 to 4) and note the result.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none.
- **Foundational (Phase 2)**: depends on Setup. T003, T004, T005 and T006 are independent; T007 needs all four; T008 and T009 edit `scoreView.ts` and run in order after T003 and T004.
- **US1 (Phase 3)**: depends on Phase 2.
- **US2 (Phase 4)**: depends on Phase 2 and on T010 and T012 (`recordSave` and the dialog's commit), since the prompt loop relies on the save outcome.
- **US3 (Phase 5)**: depends on Phase 2 (verification only).
- **Polish (Phase 6)**: depends on all stories.

### Within Each Story

- `fileDialogs.ts` is edited by T012, T018 and T021: do them in that order.
- `scoreViewOperations.ts` is edited by T010 and T011 in order.
- T017 precedes T021 and T022 (they use `afterCloseCb`); T019 precedes T020.

### Parallel Opportunities

- T003, T004, T005, T006 (four different files).
- T019 (new Vue file) can be written while T017 and T018 are in progress.
- T013 (`sidebar.vue` and CSS) can proceed in parallel with T010 to T012 once T008 is done.

---

## Parallel Example: Foundational phase

```text
Task: "Add onAddBuffer to UndoBuffer in src/smo/xform/undo.ts"            (T003)
Task: "Create src/render/sui/scoreChangeState.ts"                          (T004)
Task: "Add cases S1-S4 to tests/scoreChangeState.ts"                       (T005)
Task: "Add cases S5-S14 to tests/scoreChangeState.ts"                      (T006)
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phases 1 and 2 (hook, policy, state; tests pass).
2. Phase 3: header, `recordSave`, Quick Save, dialog commit, sidebar props.
3. Stop and validate: the asterisk appears on edits and clears only on a full-format save.

### Incremental Delivery

1. MVP gives visibility of unsaved changes.
2. US2 adds the prompt so work cannot be lost by replacing the score.
3. US3 confirms fresh state on every load.

---

## Notes

- The single `onAddBuffer` hook replaces the ten separate `addBuffer` sites the original idea would have needed (research.md section 1).
- Legacy `src/ui/dialogs/library.ts` is not reachable from the ribbon and is left unchanged.
- Commit after each phase.
