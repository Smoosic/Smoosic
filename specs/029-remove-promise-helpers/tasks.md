---

description: "Task list for Replace Promise Helpers with Native Async"
---

# Tasks: Replace Promise Helpers with Native Async

**Input**: Design documents from `/specs/029-remove-promise-helpers/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/public-api-contract.md](./contracts/public-api-contract.md), [quickstart.md](./quickstart.md)

**Tests**: Included. The plan commits to a headless guard script `tests/promiseHelpersUsage.ts` (cases P1 to P9). Its "no application use" cases (P1, P2) are expected to fail until the call sites are converted, and then pass; that is how the guard is proven to work.

**Organization**: Tasks are grouped by user story. Almost all edits are in different files, so most can run in parallel.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

Single project: `src/`, `tests/`, repo-root `package.json`.

---

## Phase 1: Setup

- [X] T001 Add the script `"test:promise-helpers": "ts-node -P tests/tsconfig.json tests/promiseHelpersUsage.ts"` to `package.json`, next to the existing `test:score-change-state` entry.
- [X] T002 Create `tests/promiseHelpersUsage.ts` with the scaffold only: a header comment pointing at `specs/029-remove-promise-helpers/contracts/public-api-contract.md`, the `failures` counter and `check(name, condition, detail?)` helper copied from `tests/pageDivisions.ts`, and the final summary block (`all checks passed`, or `process.exitCode = 1`). Use only Node's `fs` and `path` plus the helper class; no DOM.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The guard test, written before the edits so it can fail first.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 In `tests/promiseHelpersUsage.ts`, add cases P1 and P2: recursively read every `.ts`, `.vue` and `.js` file under `src/`, skip `src/common/promiseHelpers.ts` and `src/application/exports.ts`, and fail for each file that contains `PromiseHelpers` (P1) or `emptyPromise(` / `makePromise(` (P2), printing the offending file names in the failure detail.
- [X] T004 In `tests/promiseHelpersUsage.ts`, add cases P3 to P9: P3 reads `src/application/exports.ts` and checks that it contains `export * from '../common/promiseHelpers'` and a `PromiseHelpers` entry; P4 to P9 import `PromiseHelpers` and `TEmptyPromise` from `../src/common/promiseHelpers` and exercise `emptyPromise`, `makePromise` (condition true on the 3rd poll, with pre-resolve and poll methods counted; and an already-true condition), `promiseChainThen` over two parameter sets, and `TEmptyPromise('x')`, using a 5 ms poll time.
- [X] T005 Run `npm run test:promise-helpers` and confirm: P3 to P9 pass, and P1 and P2 fail naming the files listed in [data-model.md](./data-model.md). If `promiseHelpers.ts` fails to load under `ts-node` because of its renderer import, that is resolved by T006 (do T006 first).

**Checkpoint**: The guard is in place and fails for the right reasons.

---

## Phase 3: User Story 3 - External applications that use the helper keep working (Priority: P1)

**Goal**: The helper class stays complete and exported; it no longer pulls the renderer into every importer.

**Independent Test**: `npm run test:promise-helpers` cases P3 to P9 pass.

- [X] T006 [US3] In `src/common/promiseHelpers.ts`, remove the unused `import { SuiRenderState } from "../render/sui/renderState";` (confirm with a search that `SuiRenderState` is not otherwise used in the file), and add a short doc comment on the class stating that the application no longer uses it and that it is kept for external applications. Do not change any method, type or export.
- [X] T007 [US3] Re-run `npm run test:promise-helpers` and confirm P3 to P9 pass.

**Checkpoint**: The retained class is verified independent of the application.

---

## Phase 4: User Story 1 - Application code no longer builds placeholder promises by hand (Priority: P1) MVP

**Goal**: All 19 `emptyPromise()` calls are plain returns from `async` functions, with no change to declared result types.

**Independent Test**: A search of `src/` finds no `emptyPromise`; `tsc` and the build pass; the manual pass in quickstart.md steps 5 to 10 shows no change.

### Implementation for User Story 1

For each file below: replace the `return PromiseHelpers.emptyPromise();` with `return;` (or an empty body where it is the only statement), make the method `async` if it is not, do not change the declared result type, and remove the `PromiseHelpers` import if it is now unused.

- [X] T008 [P] [US1] `src/application/application.ts`: in `createScore`, replace the translate-mode `return PromiseHelpers.emptyPromise();` with `return null;` (the declared type is `Promise<SmoScore | null>`; the only caller ignores the value, per research.md section 2). Drop the import if unused.
- [X] T009 [P] [US1] `src/render/sui/scoreViewOperations.ts`: replace the seven early-exit calls in `removeLyric`, `removeAnnotation`, `toggleBeamDirection`, `setPitch`, `addOrUpdateStaffModifier`, `deleteMeasure` and `removeStaff` with `return;`. All seven methods are already `async`. Drop the import if unused.
- [X] T010 [P] [US1] `src/ui/dialogs/adapter.ts`: make `remove()` of `SuiDialogAdapterBase` `async` with an empty body (keep the `Promise<any>` return type). Drop the import.
- [X] T011 [P] [US1] `src/ui/dialogs/dialog.ts`: change `SuiDialogBase.commit()` to `async commit(): Promise<any> { }`. Drop the import.
- [X] T012 [P] [US1] `src/ui/dialogs/audioSettings.ts`, `dynamics.ts`, `hairpin.ts`, `slur.ts`, `tempo.ts`, `textBracket.ts`, `tie.ts`, `volta.ts`: in each, make `commit()` an empty `async` method (they are already `async`). Drop each import. (These are eight small files with no shared edits; do them together.)
- [X] T013 [P] [US1] `src/ui/fileio/library.ts`: declare `SmoLibrary.load()` `async`, replace the already-loaded `return PromiseHelpers.emptyPromise();` with `return;`, and leave the XHR `return new Promise<void>(...)` as it is. Drop the import. Check `libraryVue.ts` and `library.vue` still compile: they `await` the call.
- [X] T014 [P] [US1] Remove the unused `PromiseHelpers` import (and any `import` line that becomes empty) from `src/ui/dialogs/scoreId.ts`, `timeSignature.ts`, `keySignature.ts`, `fileDialogs.ts`, `customTuplets.ts`, `src/render/sui/textEdit.ts` and `src/render/audio/samples.ts`. Confirm each file has no other mention of the name.
- [X] T015 [US1] Run `npx tsc --noEmit -p tsconfig.json` and fix any errors (for example a caller that relied on a method being synchronous, per research.md section 3).
- [ ] T016 [US1] Manual validation: quickstart.md section 4, steps 5 to 10.

**Checkpoint**: No `emptyPromise` remains in the application.

---

## Phase 5: User Story 2 - Polling for render state needs no helper class (Priority: P2)

**Goal**: The wait for a rendered state is ordinary async code with the same timing.

**Independent Test**: `npm run test:promise-helpers` passes P1 and P2; the manual pass in quickstart.md steps 1 to 4 shows no change.

### Implementation for User Story 2

- [X] T017 [US2] In `src/render/sui/renderState.ts`, rewrite `_renderStatePromise(condition)` as an `async` method that saves `suspendRendering`, sets it to `false`, then `do { await this.delay2(); } while (!condition());`, and then restores `suspendRendering`, exactly as shown in research.md section 4 (the first check must come only after one `delay2()`, as `makePromise` did). Keep the `Promise<void>` result type, leave `renderPromise()` and `updatePromise()` unchanged, and drop the `PromiseHelpers` import. Ensure `delay2` is defined before use (it is a class property arrow function; `_renderStatePromise` is only called after construction).
- [X] T018 [US2] Run `npx tsc --noEmit -p tsconfig.json`, then `npm run test:promise-helpers` and confirm all cases P1 to P9 now pass.
- [ ] T019 [US2] Manual validation: quickstart.md section 4, steps 1 to 4 (render waits: add notes, delete measure, undo, layout change, New, Open, Library).

**Checkpoint**: The application has no remaining use of either helper method.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T020 Run `npm run test:promise-helpers` and the six existing scripts (`test:score-change-state`, `test:page-divisions`, `test:global-layout-reposition`, `test:text-drag-placement`, `test:attached-text`, `test:rehearsal-measure-number`) and confirm all pass.
- [X] T021 Run `npm run build` and confirm it succeeds with no new warnings.
- [ ] T022 Run through all of quickstart.md (sections 1 to 4) and note the result.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none.
- **Foundational (Phase 2)**: depends on Setup. T003 and T004 both edit the same test file, so do them in order; T005 needs both (and T006 if the helper's import breaks loading).
- **US3 (Phase 3)**: depends on Phase 2 (T006 may be needed before T005 can run).
- **US1 (Phase 4)**: depends on Phase 2; independent of US3 except for the shared test.
- **US2 (Phase 5)**: depends on Phase 2; independent of US1 (different file).
- **Polish (Phase 6)**: depends on all stories.

### Within Each Story

- T008 to T014 each touch different files and can run in parallel; T015 runs after all of them.
- T017 touches only `renderState.ts` and can run in parallel with the US1 edits.

### Parallel Opportunities

- T008, T009, T010, T011, T012, T013, T014, and T017 are all different files.

---

## Parallel Example: after Phase 2

```text
Task: "createScore return null in src/application/application.ts"             (T008)
Task: "Seven early returns in src/render/sui/scoreViewOperations.ts"           (T009)
Task: "adapter.ts / dialog.ts / eight dialog commit() methods"                 (T010-T012)
Task: "SmoLibrary.load async in src/ui/fileio/library.ts"                      (T013)
Task: "Remove 7 unused imports"                                                (T014)
Task: "_renderStatePromise async with delay2 in src/render/sui/renderState.ts" (T017)
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phases 1 and 2 (guard test fails for the right reasons).
2. Phase 3 (US3: the retained class is verified), then Phase 4 (US1).
3. Stop and validate: the guard's P2 still fails only because of `makePromise` in `renderState.ts`.

### Incremental Delivery

1. US1 removes 19 of the 20 call sites.
2. US2 removes the last one and brings the guard fully green.
3. Polish runs the full verification.

---

## Notes

- These are mechanical edits, but each early-exit call site was checked for dependence on the old extra timer tick (research.md section 3); no explicit delay is introduced anywhere.
- `src/application/exports.ts` is intentionally not edited.
- Commit after each phase.
