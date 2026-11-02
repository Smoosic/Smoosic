---

description: "Task list for Autosave Buffers and Crash Recovery"
---

# Tasks: Autosave Buffers and Crash Recovery

**Input**: Design documents from `/specs/036-autosave-recovery/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/autosave-api.md](contracts/autosave-api.md), [quickstart.md](quickstart.md)

**Tests**: Included. The constitution asks for regression tests on logic and serialization; the pure settings, store and scheduler logic is tested headless in `tests/autosave.ts`. The dialogs and menu are checked by compilation and [quickstart.md](quickstart.md).

**Organization**: Tasks are grouped by user story. The settings, the snapshot store and the scheduler are shared by every story, so they are in the Foundational phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on unfinished tasks)
- **[Story]**: Which user story the task belongs to (US1, US2, US3)

## Phase 1: Setup

**Purpose**: The test file and its script.

- [X] T001 Create `tests/autosave.ts` with the `check()`/failure-count harness used in `tests/scoreChangeState.ts` (print `PASS`/`FAIL`, exit 1 on any failure), a `FakeStorage` class implementing the `AutosaveStorage` interface from [contracts/autosave-api.md](contracts/autosave-api.md) (a `Map`, with a `failWrites` count or flag to make `setItem` throw, and a `quota` byte limit so a write throws when the total would exceed it), and a `FakeTimer` implementing `AutosaveTimer` (records pending timers with their delay, and a `fire()` method that runs the pending callback); register `"test:autosave": "ts-node -P tests/tsconfig.json tests/autosave.ts"` in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The settings, snapshot store and scheduler that all three stories use. See [research.md](research.md) R3 to R7 and [data-model.md](data-model.md).

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 In `src/smo/data/scoreModifiers.ts` add `autosaveInterval` and `autosaveCount` to `SmoScorePreferencesParams` (optional) and to the `SmoScorePreferences` class (defaults 10 and 10); export `autosaveLimits` and the functions `clampAutosaveInterval(value: unknown)` and `clampAutosaveCount(value: unknown)` (round to a whole number, hold to 5-60 and 1-20, use the default when not a finite number); add both fields to `SmoScorePreferences.defaults`; add both to `SmoScorePreferenceNumbers` (extend the `SmoScorePreferenceNumber` type) and apply the clamp functions in the constructor so an absent field gets its default (the existing loop would otherwise set `undefined`); keep `serialize()` writing both
- [X] T003 [P] Create `src/render/sui/autosave.ts` exporting the `AutosaveStorage`, `AutosaveEntry` and `AutosaveTimer` interfaces and the `AutosaveStore` class per [contracts/autosave-api.md](contracts/autosave-api.md): keys `_smoosicAutosaveIndex` and `_smoosicAutosave.<id>`; `list()` re-reads the index from storage each call and drops entries whose text key is missing (writing the cleaned index back); `add(text, title, time, maxCount)` re-reads the index, uses largest id plus one, writes the text key then the index, trims the oldest entries beyond `maxCount` (removing their text keys), and on a throwing write removes the oldest snapshot and retries until it succeeds or none remain, then returns `null` without throwing; `read(id)` returns `null` if the text is missing or its length differs from the entry's `size`; `trim(maxCount)`. Never touch any other key (Quick Save is `_smoosicScore`). No DOM or browser imports, per [research.md](research.md) R3, R4
- [X] T004 [P] In `src/render/sui/autosave.ts` add the `AutosaveScheduler` class per [contracts/autosave-api.md](contracts/autosave-api.md): `noteChange(intervalMinutes)` arms a single timer of `intervalMinutes * 60000` ms when idle and does nothing when armed; when the timer fires it goes idle first, then calls `takeSnapshot`, catching a thrown error or rejected promise so the scheduler stays usable; `reset()` clears the timer; `retime(intervalMinutes)` clears and restarts a pending timer from now using the new interval and does nothing when idle; `armed` getter. Add also `createLocalAutosaveStorage(): AutosaveStorage | null`, which returns `window.localStorage` only if a test write and delete of a probe key succeeds and returns `null` otherwise (including when `window` or `localStorage` does not exist), per [research.md](research.md) R5, R11
- [X] T005 Write the settings tests A1-A5 in `tests/autosave.ts`: legacy params with no autosave fields, clamping and rounding of out-of-range, fractional, `NaN` and non-numeric intervals and counts, serialize-then-construct round trip, and `defaults`. Run `npm run test:autosave` and confirm they pass
- [X] T006 [P] Write the store tests S1-S11 in `tests/autosave.ts` using `FakeStorage`: empty list, add three, trim on add, `trim`, write failure retry, permanent write failure, entry removed behind the store's back, truncated text, id after removing the newest, the Quick Save key untouched, and two stores sharing one storage. Run `npm run test:autosave` and confirm they pass
- [X] T007 [P] Write the scheduler tests T1-T9 in `tests/autosave.ts` using `FakeTimer`: arm when idle, one timer for many changes, fire takes one snapshot and goes idle, re-arm after a fire, `reset`, `retime` when armed and when idle, and a rejecting `takeSnapshot`. Run `npm run test:autosave` and confirm they pass

**Checkpoint**: Settings, store and scheduler work and are tested. User stories can begin.

---

## Phase 3: User Story 1 - Automatic snapshots while I work (Priority: P1) 🎯 MVP

**Goal**: While the user edits, snapshots of the whole score are kept in a rolling set in local storage, without interrupting them.

**Independent Test**: Per [quickstart.md](quickstart.md) section 3: with the interval at 5 minutes, edit and wait; one entry appears; wait without editing and none is added; keep editing and the set never exceeds the chosen count. (The settings dialog is User Story 3; until then set `autosaveInterval` and `autosaveCount` through the score preferences in a console, or accept the defaults of 10 and 10.)

### Implementation for User Story 1

- [X] T008 [US1] In `src/render/sui/scoreView.ts` create the store and scheduler: a private `autosaveStore: AutosaveStore | null` built from `createLocalAutosaveStorage()` (null when storage is unavailable) and an `autosaveScheduler` built with a timer wrapping `window.setTimeout`/`clearTimeout` and a `takeSnapshot` callback that calls the new method `takeAutosave()` (T009). Make `markScoreChanged()` also call `autosaveScheduler.noteChange(this.score.preferences.autosaveInterval)` when the store exists, and make `changeScore()` call `autosaveScheduler.reset()` before it renders the new score. Do not arm the scheduler for the initial `markScoreSaved`/load path, per [research.md](research.md) R5, R6
- [X] T009 [US1] In `src/render/sui/scoreView.ts` add `async takeAutosave()`: return at once if there is no store; call `SmoScoreArchive.pack(this.storeScore)` right away, before any other `await` (its first statement serializes the score synchronously, so the snapshot is one consistent state even if the user keeps editing while it compresses, per [research.md](research.md) R2), encode the resulting bytes as base64 text (T010), then call `autosaveStore.add(text, this.score.scoreInfo?.name ?? '', Date.now(), this.score.preferences.autosaveCount)`; catch every error and do nothing visible; it must not call `markScoreSaved`/`markScoreChanged` or touch the Quick Save key. See [research.md](research.md) R1 for the encoding
- [X] T010 [P] [US1] In `src/ui/fileio/scoreArchive.ts` add two small static helpers on `SmoScoreArchive`: `toBase64(bytes: Uint8Array): string` and `fromBase64(text: string): Uint8Array` (chunked `String.fromCharCode` and `btoa`/`atob`, safe for large arrays), used by `takeAutosave` and by recovery; a bad input throws an `Error` with a readable message
- [X] T011 [US1] In `src/render/sui/scoreView.ts` use `SmoScoreArchive.toBase64` in `takeAutosave()` (T009). Confirm that a snapshot taken from a score with one exposed part still serializes the full `storeScore`
- [ ] T012 [US1] Run `npx tsc --noEmit -p tsconfig.json` and `npm run test:autosave`; then do the quickstart section 3 manual check with a temporary shortened interval if desired, confirming one snapshot per interval, none without a change, and the set staying at the chosen count *(compile and automated tests done; the manual app check is not done)*

**Checkpoint**: User Story 1 is complete: snapshots accumulate and roll. The feature already protects work, though recovery is not yet possible from the UI.

---

## Phase 4: User Story 2 - Recover my work after a crash (Priority: P1)

**Goal**: File > Recovery lists the snapshots and loads the chosen one.

**Independent Test**: Per [quickstart.md](quickstart.md) sections 4 and 5: with several snapshots stored, open File > Recovery, pick one, confirm, and see that score with the unsaved-changes asterisk; reopen the dialog and every snapshot is still there; empty and damaged cases behave as described.

### Implementation for User Story 2

- [X] T013 [US2] In `src/render/sui/scoreViewOperations.ts` add `listSnapshots(): (AutosaveEntry & { available: boolean })[]`, newest first, with `available` true when `autosaveStore.read(id) !== null` (empty array when there is no store), and `async recoverSnapshot(id: number): Promise<void>`: read the text (throw `Error('That autosave is no longer available.')` if null), decode it with `SmoScoreArchive.fromBase64` and `SmoScoreArchive.load` (which throws readable errors), then `await this.changeScore(score)` and then `this.markScoreChanged()` so the recovered score is treated as unsaved; on any error the open score is untouched and the error propagates; no snapshot is removed. See [research.md](research.md) R9, R10. `markScoreChanged` also arms the autosave scheduler, which is wanted: the recovered score is not saved to a file
- [X] T014 [P] [US2] Create `src/ui/components/dialogs/recovery.vue` using `dialogContainer.vue` (label "Recovery"): props `domId`, `entries` (array of `{ id, time, title, available }`, already newest first), `storageAvailable`, `selectCb(id: number)`, `commitCb`, `cancelCb`. Render one selectable row per entry showing a formatted date and time (`toLocaleString`) and the title ("Untitled" if empty); rows with `available` false are shown dimmed with the text "unavailable" and cannot be selected; the selected row is highlighted; when `entries` is empty show "No autosaved scores are available" (and "Browser storage is not available" if `storageAvailable` is false) and no OK; the OK button is disabled until a row is selected. Follow the structure of `library.vue` and `unsavedChanges.vue`
- [X] T015 [US2] Create `src/ui/dialogs/recovery.ts` exporting `SuiRecoveryDialog(parameters: SuiDialogParams)` using `InstallDialog` and `replaceVueRoot(modalContainerId)` like `libraryVue.ts`: get the rows from `parameters.view.listSnapshots()`, record the chosen id in `selectCb`, and in `afterCloseCb`, if an id was chosen and `await confirmReplaceScore(parameters)` is true, call `parameters.view.recoverSnapshot(id)` and on a thrown error show it with `showLoadError(parameters, error.message)` (both from `./fileDialogs`); cancel does nothing
- [X] T016 [US2] In `src/ui/menus/file.ts` add a `systemRecoveryOption` (`icon: 'mi history'`, text `Recovery`, value `recovery`, always displayed) whose handler calls `SuiRecoveryDialog` with the same parameter shape as the other file dialogs (`ctor: 'SuiRecoveryDialog'`, `id: 'recovery'`, `modifier: null`, `completeNotifier`, `tracker`, `eventSource`, `view`, `startPromise: menu.closePromise`); add it to `SuiFileMenuOptions` after `systemQuickSave`. Register `'SuiRecoveryDialog'` in the dialog constructor list in `src/ui/i18n/language.ts` next to `'SuiPrintFileDialog'`
- [ ] T017 [US2] Run `npx tsc --noEmit -p tsconfig.json`; then do the quickstart sections 4 and 5 manual checks (newest-first list, recover, asterisk shown, snapshots remain, empty message, missing and truncated entries marked unavailable, unsaved-changes prompt before replacing) *(compile and automated tests done; the manual app check is not done)*

**Checkpoint**: User Stories 1 and 2 work: work is protected and recoverable with the default settings.

---

## Phase 5: User Story 3 - Adjust autosave to my needs (Priority: P2)

**Goal**: The Score Preferences dialog has an Autosave section for the interval and count, saved with the score and applied immediately.

**Independent Test**: Per [quickstart.md](quickstart.md) section 6: defaults show 10 and 10; values outside the limits are held to them; the values survive saving and reloading the score; lowering the count trims the stored set.

### Implementation for User Story 3

- [X] T018 [US3] In `src/ui/components/dialogs/scorePreferences.vue` add an "Autosave" section after the default-duration row: a heading row, then two `numberInput.vue` fields with precision 0: "Minutes between autosaves" (`minValue` 5, `maxValue` 60, `initialValue` `preferences.autosaveInterval`) and "Autosaves to keep" (`minValue` 1, `maxValue` 20, `initialValue` `preferences.autosaveCount`). Each `changeCb` writes the clamped value (`clampAutosaveInterval` / `clampAutosaveCount` from `scoreModifiers.ts`) to the reactive `preferences` object, so the existing watcher in `src/ui/dialogs/preferences.ts` sends it to `updateScorePreferences`. Check the `numberInput.vue` props before use and match its callback signature
- [X] T019 [US3] In `src/render/sui/scoreViewOperations.ts` `updateScorePreferences`, compare the incoming `autosaveInterval` and `autosaveCount` to the current ones before they are replaced; if the count changed call `autosaveStore.trim(count)`, and if the interval changed call `autosaveScheduler.retime(interval)`. Both are no-ops when there is no store. Per [research.md](research.md) R5, R7
- [X] T020 [US3] In `src/ui/dialogs/preferences.ts` check that the cancel path (`updateScorePreferences(backup)`) restores the previous interval and count and that a snapshot trimmed by a cancelled change is not an issue worth handling: trimming applies as the value is edited, so document in a code comment in `cancelCb` that a trim made while the dialog was open is not undone
- [X] T021 [P] [US3] In `tools/smoosic-schema.json` add `autosaveInterval` (`integer`, `default` 10, `minimum` 5, `maximum` 60) and `autosaveCount` (`integer`, `default` 10, `minimum` 1, `maximum` 20) to `SmoScorePreferences` under `scoreModifierSchema`
- [X] T022 [US3] Add a score round-trip test to `tests/autosave.ts` (case A6): build a default score, set `score.preferences.autosaveInterval = 25` and `autosaveCount = 4`, serialize with `SmoScore.serialize` and read back with `SmoScore.deserialize`, and check both values; then deserialize a serialized score whose preferences object has the two fields deleted and check the defaults of 10 and 10. Run `npm run test:autosave`
- [ ] T023 [US3] Run `npx tsc --noEmit -p tsconfig.json`; then do the quickstart section 6 manual checks *(compile and automated tests done; the manual app check is not done)*

**Checkpoint**: All three user stories work.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T024 [P] In `src/application/exports.ts` export `SuiRecoveryDialog` (`export * from '../ui/dialogs/recovery'` next to the other dialog exports) and the autosave module (`export * from '../render/sui/autosave'`), and add them to the explicit export list if the file keeps one
- [X] T025 [P] Add a changelog entry to `changes.md`: autosave snapshots in local storage; File > Recovery; Autosave settings in Score Preferences (`autosaveInterval` 5-60 minutes, `autosaveCount` 1-20, defaults 10 and 10, saved with the score); the separate SmoSchema repository needs the two new `SmoScorePreferences` properties
- [X] T026 [P] Regenerate declarations with `npm run types`; keep only the files for sources changed here (`autosave.d.ts`, `scoreModifiers.d.ts`, `scoreView.d.ts`, `scoreViewOperations.d.ts`, `scoreArchive.d.ts`, `recovery.d.ts`, `exports.d.ts`) and restore every other changed or untracked file under `types/`
- [ ] T027 Run the full quickstart sections 1 and 2 and the section 7 manual check (storage unavailable: no errors, empty Recovery dialog)
- [X] T028 Run `tsc --noEmit -p tsconfig.json` and every `test:*` script in `package.json`; fix regressions

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: none.
- **Foundational (Phase 2)**: depends on T001. Blocks all stories. T002 first (the others read its fields); T003 and T004 are in the same file, so do T003 then T004; T005 depends on T002; T006 on T003; T007 on T004.
- **User Story 1 (Phase 3)**: depends on Phase 2. T010 can be done at any time after Phase 2; T008, T009, T011 are in the same file and in order.
- **User Story 2 (Phase 4)**: depends on Phase 2 and on T010 (base64 helpers) and T008 (the store on the view). Can be tested with snapshots made by User Story 1.
- **User Story 3 (Phase 5)**: depends on Phase 2 and T008 (the store and scheduler it trims and retimes). Independent of User Story 2.
- **Polish (Phase 6)**: depends on all stories.

### Within each story

- The view method before the dialog that calls it; the Vue component before the TypeScript dialog that mounts it; the dialog before the menu entry that opens it.

### Parallel opportunities

- T003/T004 (store and scheduler) are one file, but their tests T006 and T007 are independent of each other once those exist.
- T010 (`scoreArchive.ts`) is independent of T008 and T009.
- T014 (`recovery.vue`) can be written while T013 is in progress.
- T021 (schema) can be done at any time after T002.
- T024, T025 and T026 touch different files.
- User Story 2 and User Story 3 can proceed in parallel after User Story 1.

```text
# Example: after Phase 2
Developer A: T008 -> T009 -> T011  (US1, view)       then T013 -> T015 -> T016  (US2)
Developer B: T010 (base64 helpers) then T018 -> T019 -> T020  (US3)
Anyone:      T014 (recovery.vue), T021 (schema)
```

---

## Implementation Strategy

### MVP first (User Story 1)

1. Phase 1 and Phase 2 (settings, store, scheduler, with tests).
2. Phase 3: snapshots accumulate with the default settings.
3. Stop and check. The work is protected, though not yet recoverable from the UI. Phase 4 is also P1 and is needed to ship, because snapshots no one can recover are not useful.

### Incremental delivery

1. Foundational, then User Story 1, then User Story 2: shippable (protected and recoverable with defaults).
2. User Story 3: adds user control. Can ship separately.
3. Polish.

---

## Notes

- Do not read, write or remove the Quick Save key (`_smoosicScore`) from any autosave code.
- Snapshots are taken from `storeScore` (the full score), never `score` (which may be one exposed part).
- Keep `src/render/sui/autosave.ts` free of DOM and browser imports other than inside `createLocalAutosaveStorage`; the store and scheduler take their storage and timer as arguments.
- The 3 manual-test items in [quickstart.md](quickstart.md) that need a real wait can be shortened by setting the interval to 5 minutes (the minimum).
