# Implementation Plan: Replace Promise Helpers with Native Async

**Branch**: `029-remove-promise-helpers` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/029-remove-promise-helpers/spec.md`

## Summary

The application calls `PromiseHelpers.emptyPromise()` in 19 places and `PromiseHelpers.makePromise()` in one. All 19 `emptyPromise` sites are in methods that either are already `async` or only need to be, so each becomes a plain `return` (the declared result type does not change). The single `makePromise` call, `SuiRenderState._renderStatePromise`, is rewritten as an `async` method that reuses the renderer's existing `delay2()` timer and a `do ... while (!condition())` loop, with identical timing (it waits one poll interval before the first check, as the helper did). A direct `await` of the render step is not possible, because the renderer advances its state from an independent background loop (`pollRedrawTask`), so the wait stays a poll. Seven other files only carry an unused `PromiseHelpers` import, which is removed. The `PromiseHelpers` class stays in `src/common/promiseHelpers.ts` and in the public exports. A small headless script guards both halves of the contract: nothing in the application uses the helper, and the exported class still behaves as before.

## Technical Context

**Language/Version**: TypeScript (built by `build/build.js`).

**Primary Dependencies**: None added or removed. `renderState.ts` already has `delay2`.

**Storage**: N/A.

**Testing**: Type check (`tsc --noEmit`), the full webpack build, the six existing headless scripts, and one new headless script `tests/promiseHelpersUsage.ts` (`npm run test:promise-helpers`) that (a) scans `src/` for any use of the helper outside its own file and the export file, and (b) exercises the retained class (`emptyPromise`, `makePromise`, `promiseChainThen`) and checks it is still re-exported. Dialog and render behavior has no automated coverage in this repository, so it is verified by a manual pass (quickstart.md).

**Target Platform**: Browser application; headless tests under Node.

**Project Type**: Single project (library + application).

**Performance Goals**: No regression. Replacing a 1 ms timer with an immediate return only makes completion earlier. The render wait keeps its `demonPollTime` interval.

**Constraints**: Public API unchanged (declared result types, exports). `PromiseHelpers` remains exported from `src/application/exports.ts`. The render-state wait must not block the page and must restore `suspendRendering` after it ends.

**Scale/Scope**: 20 call sites in 14 files, plus 7 unused imports in 7 files, plus the new test. Mechanical edits.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle #1 (Serialization)**: PASS. No data model or file format is touched.
- **Principle #2 (Non-UI logic regression testing)**: PASS. This is not music logic. The retained helper class and the "no application use" invariant get a headless regression script anyway.
- **Principle #3 (Rendering performance)**: PASS, with one watch item. The render-state wait keeps the same poll interval and conditions, and adds no DOM measurement or repaint. `async`/`await` with `delay2` does not change how often the flags are read.
- **Principle #4 (Logical dependencies)**: PASS. No new imports between layers. The unused import in `promiseHelpers.ts` that points a generic utility at the renderer (`SuiRenderState`) is removed, which improves the layering.
- **Async use (core principles)**: "We try to avoid race conditions by judicious use of async/await". This change moves toward that, and each call site is checked for dependence on the old extra timer tick (see research.md section 3).

No violations; Complexity Tracking is not needed. Re-check after Phase 1: unchanged, still PASS.

## Project Structure

### Documentation (this feature)

```text
specs/029-remove-promise-helpers/
├── plan.md
├── research.md
├── data-model.md          # inventory of the 20 call sites and 7 unused imports
├── quickstart.md
├── contracts/
│   └── public-api-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md               # created later by /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── application/application.ts          # createScore: return null (translate mode)
├── common/promiseHelpers.ts            # remove the unused SuiRenderState import; class otherwise unchanged
├── render/sui/
│   ├── renderState.ts                  # _renderStatePromise -> async, uses delay2; drop import
│   └── scoreViewOperations.ts          # 7 early returns -> plain return; drop import
└── ui/
    ├── dialogs/                        # adapter, audioSettings, dialog, dynamics, hairpin, slur, tempo,
    │                                   #   textBracket, tie, volta: commit()/remove() -> plain return; drop imports
    └── fileio/library.ts               # load() -> async, plain return; drop import
    (unused imports only, removed:      # dialogs/scoreId.ts, timeSignature.ts, keySignature.ts, fileDialogs.ts,
                                        #   customTuplets.ts; render/sui/textEdit.ts; render/audio/samples.ts)

tests/
└── promiseHelpersUsage.ts              # NEW headless guard + retained-class checks

package.json                            # add "test:promise-helpers"
```

**Structure Decision**: Mechanical edits in place; no new modules. The only new file is the test.

## Complexity Tracking

*No Constitution Check violations; table not needed.*
