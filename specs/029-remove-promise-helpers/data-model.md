# Data Model: Replace Promise Helpers with Native Async

There is no data model change: no persisted or in-memory data structures are added or altered. This document inventories the code sites that change.

## Call sites: `emptyPromise()` (19, in 13 files)

| # | File | Method | Currently async | Change |
|---|------|--------|-----------------|--------|
| 1 | `src/application/application.ts` | `createScore` (translate mode) | yes | `return null;` |
| 2 | `src/render/sui/scoreViewOperations.ts` | `removeLyric` | yes | `return;` |
| 3 | `src/render/sui/scoreViewOperations.ts` | `removeAnnotation` | yes | `return;` |
| 4 | `src/render/sui/scoreViewOperations.ts` | `toggleBeamDirection` | yes | `return;` |
| 5 | `src/render/sui/scoreViewOperations.ts` | `setPitch` | yes | `return;` |
| 6 | `src/render/sui/scoreViewOperations.ts` | `addOrUpdateStaffModifier` | yes | `return;` |
| 7 | `src/render/sui/scoreViewOperations.ts` | `deleteMeasure` | yes | `return;` |
| 8 | `src/render/sui/scoreViewOperations.ts` | `removeStaff` | yes | `return;` |
| 9 | `src/ui/dialogs/adapter.ts` | `SuiDialogAdapterBase.remove` | **no** | add `async`, `return;` |
| 10 | `src/ui/dialogs/audioSettings.ts` | `commit` | yes | empty body |
| 11 | `src/ui/dialogs/dialog.ts` | `SuiDialogBase.commit` | yes | `return;` (declared type stays `Promise<any>`) |
| 12 | `src/ui/dialogs/dynamics.ts` | `commit` | yes | empty body |
| 13 | `src/ui/dialogs/hairpin.ts` | `commit` | yes | empty body |
| 14 | `src/ui/dialogs/slur.ts` | `commit` | yes | empty body |
| 15 | `src/ui/dialogs/tempo.ts` | `commit` | yes | empty body |
| 16 | `src/ui/dialogs/textBracket.ts` | `commit` | yes | empty body |
| 17 | `src/ui/dialogs/tie.ts` | `commit` | yes | empty body |
| 18 | `src/ui/dialogs/volta.ts` | `commit` | yes | empty body |
| 19 | `src/ui/fileio/library.ts` | `SmoLibrary.load` (already loaded) | **no** | add `async`, `return;` |

## Call site: `makePromise()` (1)

| File | Method | Change |
|------|--------|--------|
| `src/render/sui/renderState.ts` | `_renderStatePromise(condition)` | rewritten as `async`, polling with `delay2()` (see research.md section 4) |

## Unused imports to remove (7)

`src/ui/dialogs/scoreId.ts`, `src/ui/dialogs/timeSignature.ts`, `src/ui/dialogs/keySignature.ts`, `src/ui/dialogs/fileDialogs.ts`, `src/ui/dialogs/customTuplets.ts`, `src/render/sui/textEdit.ts`, `src/render/audio/samples.ts`.

In addition, the `PromiseHelpers` import is removed from each file in the two tables above once its last call is gone, and the unused `SuiRenderState` import is removed from `src/common/promiseHelpers.ts`.

## Unchanged

`src/common/promiseHelpers.ts` (class and exported types, apart from the one import), `src/application/exports.ts`.

The 22 files other than `promiseHelpers.ts` that mention the helper today are: `exports.ts`, the 13 files with `emptyPromise` calls (the first table), `renderState.ts` (the `makePromise` call), and the 7 files with unused imports.
