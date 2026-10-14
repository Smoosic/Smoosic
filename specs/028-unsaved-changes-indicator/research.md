# Research: Unsaved Changes Indicator and Save Prompt

No NEEDS CLARIFICATION items remained after `/speckit-clarify`. The findings below come from reading the code; each ends in a decision.

## 1. Where to detect "the score changed"

**Finding**: Every undo record goes through `UndoBuffer.addBuffer`. There are 10 call sites outside `undo.ts`: seven in `scoreView.ts` (`undoStaffModifier`, `_undoColumn`, `_undoScorePreferences`, `undoMeasureRange`, `_undoFirstMeasureSelection`, `_undoSelection`, `_undoScore`) and three direct calls in `scoreViewOperations.ts` (`remove text group` twice, `modify text`). The three direct calls do not use the `_undo*` helpers.

**Decision**: Add an optional `onAddBuffer?: () => void` field to `UndoBuffer`, invoked at the end of `addBuffer`. `SuiScoreView`'s constructor sets `this.storeUndo.onAddBuffer = () => this.markScoreChanged()`. Because `changeScore` calls `storeUndo.reset()` rather than replacing the buffer, the hook survives score loads.

**Alternatives considered**: Hooking only the `_undo*` helpers in `scoreView.ts` (the original suggestion). Rejected: it would miss text-group edits in `scoreViewOperations.ts` and any future direct `addBuffer` call. Hooking the helpers plus the three direct sites is possible but needs ten edits and stays fragile. The single callback covers all of them and keeps `UndoBuffer` free of any view or Vue knowledge (Principle #4).

## 2. Undo itself

**Finding**: `SuiScoreView.undo()` pops the undo stack and restores content. It does not call `addBuffer`. There is no redo path in the view.

**Decision**: `undo()` calls `markScoreChanged()` after restoring. The spec says undo is an edit and never clears the flag.

## 3. When to clear

**Finding**: All user-initiated loads funnel through `SuiScoreView.changeScore` (File menu New, Open, Import via `SuiFileUploadDialog`; `loadRemoteXml` / `loadRemoteJson` for the library). `generateVexTests.ts` and application startup also call it or construct the view with a score.

**Decision**: `changeScore` sets `scoreChanged = false` and refreshes the name as its last step, after `awaitRender`, so anything that records undo while the new score is being set up cannot leave a stray asterisk. The view constructor starts with the flag false and the name read from the initial score.

## 4. What counts as a save

**Finding**: `SuiFileSaveDialog` builds the file contents itself and offers `.json` (Smoosic), `.xml`, `.mid`/`.midi`, `.js` (Vex) and a "Validation (large)" option. The validation option sets the dialog extension back to `.json` after generating the content with different serialization options. `quickSave()` writes the same full JSON as the first option to local storage. The file is only produced when the download link is clicked, which happens in the dialog's commit callback.

**Decision**: Add `SuiScoreViewOperations.recordSave(extension: string): boolean`, called by the dialog on commit with its current extension. It clears the flag and returns true only when the extension is a full-fidelity format; for `.xml`, `.mid`, `.midi`, `.js` it leaves the flag alone and returns false. The policy itself is the pure function `isFullSaveFormat` in `scoreChangeState.ts`. `quickSave()` calls `markScoreSaved()` directly. This follows the clarification: the dialog does not know which formats are lossy; the view operation does.

**Alternatives considered**: Moving all content builders (`getSmoContent`, `getMusicXmlContent`, and so on) out of the dialog into `scoreViewOperations.ts` so one method both produces and records the save. Rejected for now as a larger refactor with no behavior benefit; `recordSave` keeps the knowledge in the view operation, as asked, with a small change.

**Known limit**: The dialog commits when the link is clicked; the application cannot see whether the browser's download actually finished. The flag is cleared on click.

## 5. Reactivity for the sidebar

**Finding**: The sidebar is mounted by `createSidebarMenuHtml` in `ribbon.ts` with `createApp(ribbonSidebarApp, { buttonProps, domId })`. The ribbon already watches `this.view.PartName`, a `Ref<string>` getter backed by `selectedPart` in `SuiScoreView`.

**Decision**: Follow the same pattern: `SuiScoreView` owns `scoreName: Ref<string>` and `scoreChanged: Ref<boolean>`; `ribbon.ts` passes both as props to the sidebar app; `sidebar.vue` renders `Smoosic {{ scoreName }}{{ scoreChanged ? '*' : '' }}`. Formatting goes through `formatScoreTitle(name, changed)` so the placeholder rule (empty name becomes "Untitled") is testable. The name is refreshed in `changeScore`, `updateScoreInfo`, and `undo()` (a score-info undo can change it).

## 6. Showing the prompt from inside a modal dialog

**Finding**: `InstallDialog` runs the dialog's commit callback and then, in the same function, calls `hideDialogModal()` and unmounts the Vue app. Opening a second dialog from inside the first commit callback would mount at the shared modal root (`replaceVueRoot` empties and recreates it) and then be hidden by the first dialog's own cleanup. Existing nested dialogs avoid this by passing `startPromise` so the new one waits for the old one to close.

**Decision**: Add an optional `afterCloseCb?: DialogCallback` to `DialogInstallParams`, awaited at the very end of the install's `commitCb` (after unmount) and not on cancel. The Open/Import dialog and the Library dialog do their score replacement from `afterCloseCb`. Everything the first dialog needs to do before closing (read and convert the file) stays in its commit callback, and the prompt appears only after the first dialog has fully gone. The File menu's New handler runs after the menu has closed, so it calls the prompt directly (passing `menu.closePromise` as `startPromise`, as the menu's other dialogs do).

**Alternatives considered**: (a) Prompt before opening the Open/Library dialog. Rejected: it would ask users who only wanted to look at the library, and contradicts spec scenario 7 (cancelling the selection should not leave a prompt). (b) `setTimeout(0)` inside the commit callback to run after cleanup. Rejected as timing-dependent. (c) A guard hook inside `changeScore`. Rejected: the render layer must not call UI, and it would still run inside the modal.

## 7. The save-then-load loop

**Decision**: `confirmReplaceScore(parameters)` loops:

1. If `!view.scoreChanged.value`, return true.
2. Show the prompt. Cancel returns false. Don't save returns true.
3. Save opens `SuiFileSaveDialog` with an `onClosed(outcome)` callback: `'saved'` (committed with a full format, so `recordSave` cleared the flag), `'exported'` (committed with a lossy format), `'cancelled'`.
4. After the save dialog closes, the pure function `nextStepAfterSave(outcome)` returns `'load'` for saved, `'prompt'` for exported (back to step 2), and `'abort'` for cancelled (return false).

This matches spec scenarios 2, 5 and 5a and FR-011.

## 8. Library dialog

**Finding**: `library.vue` currently calls `view.loadRemoteScore(url)` inside its commit handler, before `commitCb`. The legacy `SuiLibraryDialog` (`library.ts`) calls the same view method, but the ribbon creates `SuiLibraryDialogVue`.

**Decision**: Change `library.vue` to report the chosen URL through a prop callback and let `libraryVue.ts` load it from `afterCloseCb` after the prompt. The legacy `library.ts` path is not reachable from the ribbon; it is left unchanged and noted as out of scope.

## 9. Nothing here is persisted

The flag and name are not part of `SmoScore.serialize`; no schema or legacy-score handling is needed (Principle #1).
