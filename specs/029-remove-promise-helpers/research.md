# Research: Replace Promise Helpers with Native Async

No NEEDS CLARIFICATION items remained after the spec. The findings below come from reading the code.

## 1. Inventory of uses

**Finding**: A search of `src/` for `PromiseHelpers` finds:

- 19 calls to `emptyPromise()`: `application.ts` (1), `scoreViewOperations.ts` (7), `ui/dialogs/adapter.ts`, `audioSettings.ts`, `dialog.ts`, `dynamics.ts`, `hairpin.ts`, `slur.ts`, `tempo.ts`, `textBracket.ts`, `tie.ts`, `volta.ts` (1 each), and `ui/fileio/library.ts` (1).
- 1 call to `makePromise()`: `renderState.ts` (`_renderStatePromise`).
- 0 calls to `promiseChainThen`, `makePromiseObj` or `TEmptyPromise`.
- 7 files that import the class and never use it: `ui/dialogs/scoreId.ts`, `timeSignature.ts`, `keySignature.ts`, `fileDialogs.ts`, `customTuplets.ts`, `render/sui/textEdit.ts`, `render/audio/samples.ts`.
- `application/exports.ts` imports it and re-exports the whole module (`export * from '../common/promiseHelpers'`) and lists it in the export object. This is the public surface for external applications.

**Decision**: Edit the 20 call sites and the 7 unused imports; leave `exports.ts` untouched.

## 2. What the replaced value was

**Finding**: `emptyPromise()` resolves with `undefined` after `setTimeout(..., 1)`. Of the 19 sites, 18 are in methods declared `Promise<void>`, `Promise<any>` or with an inferred promise type where the value is ignored; one, `application.ts createScore(): Promise<SmoScore | null>`, returns it in translate mode. The only caller of `createScore` is `application.ts:186` (`await this.createScore();`), which ignores the value and reads `this.score` instead.

**Decision**: A bare `return;` for the `void`/`any` methods. For `createScore` use `return null;`, matching its declared type (`SmoScore | null`); `undefined` was never a valid value of that type, and no caller reads it.

## 3. The extra timer tick

**Finding**: `emptyPromise` resolves on a timer, so an `await` on it yields to the event loop (a macrotask); a plain `return` from an `async` function resolves in a microtask. Behavior differs only if a caller depends on the event loop turning (for example, for the browser to repaint) between the call and its continuation. Checked:

- All 7 `scoreViewOperations.ts` sites are early exits that return before doing any rendering work, so nothing on screen has changed that would need a repaint before the caller continues. Their callers are menu, key and dialog handlers that do not await the result, or await it only to sequence later operations, which an earlier resolution does not affect.
- `commit()` / `remove()` on the dialog classes: no call sites exist in `src/` outside the class definitions and `InstallDialog`-style callbacks that do not await them. They are legacy adapter methods.
- `library.ts load()`: awaited by `libraryVue.ts` and `library.vue` (`loadChildrenIfNeeded`), which only continue to read `children`; an immediate resolve is correct when already loaded.
- `createScore`: value ignored; see section 2.

**Decision**: No call site needs the extra tick. Nothing is replaced by an explicit delay. The manual pass in quickstart.md still exercises each dialog once.

## 4. Why the render-state wait stays a poll

**Finding**: `SuiRenderState._renderStatePromise(condition)` lets a caller wait until `renderStateClean` or `renderStateRendered` is true. Those flags are changed by `handleRedrawTimer`, which runs in a background loop (`pollRedrawTask`: `handleRedrawTimer`, then `delay2`, repeated forever, started by `startDemon`). There is no promise for "this render finished" to await; callers only share the flags. `makePromise` is therefore a poll: wait `pollTime`, test the condition, restore, resolve.

**Decision**: Keep the poll but write it as ordinary async code using the renderer's existing `delay2()` (a timer of `demonPollTime`, the same interval `makePromise` was given):

```ts
async _renderStatePromise(condition: () => boolean): Promise<void> {
  const oldSuspend = this.suspendRendering;
  this.suspendRendering = false;
  do {
    await this.delay2();
  } while (!condition());
  this.suspendRendering = oldSuspend;
}
```

This matches the helper exactly: `makePromise` always waited one poll interval before the first test, ran `endAction` (restoring `suspendRendering`) before resolving, and passed no per-poll action (`pollMethod` was `null`). The page is never blocked, because each wait is an awaited timer.

**Alternatives considered**: Restructuring the redraw loop so that a render completion resolves a stored promise. Rejected: larger change to the performance-critical render pipeline (constitution Principle #3), and the spec scopes this to the way the wait is written. Using a `while (!condition()) await delay2()` loop that tests first: rejected because it would resolve with no delay if the state is already reached, which the existing callers (like `updatePromise`) have relied on to let the demon loop run once.

## 5. `library.ts load()` is not `async`

**Finding**: `SmoLibrary.load()` returns either `emptyPromise()` or `new Promise<void>(...)` that wraps an XHR. It is not declared `async`.

**Decision**: Declare it `async`, use a bare `return;` for the already-loaded case, and keep the `return new Promise<void>(...)` for the XHR (an `async` function may return a promise). The XHR body is not otherwise in scope.

## 6. The retained helper class

**Finding**: `src/common/promiseHelpers.ts` imports `SuiRenderState` from the renderer but never uses it. It is exported to external applications.

**Decision**: Keep the class and all its exports unchanged. Remove only the unused `SuiRenderState` import, which creates a generic-utility to renderer dependency (and would drag the renderer into a headless test). Add a note to the class's documentation that the application no longer uses it and that it is retained for external users.

**Alternatives considered**: Marking the methods `@deprecated`. Rejected for now: the request is to keep the class for external applications, and a deprecation tag would add warnings for them. Can be revisited.

## 7. Guarding the result

**Decision**: Add `tests/promiseHelpersUsage.ts`. It reads every `.ts`, `.vue` and `.js` file under `src/` and fails if `PromiseHelpers` appears in any file other than `src/common/promiseHelpers.ts` and `src/application/exports.ts`. It also imports the class and runs `emptyPromise`, `makePromise` (a condition that becomes true after a few polls) and `promiseChainThen`, and checks that the export module still re-exports it. This makes SC-001 and SC-003 repeatable instead of a one-time search.
