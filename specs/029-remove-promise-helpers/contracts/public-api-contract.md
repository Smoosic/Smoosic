# Contract: Public API and Helper Usage

Verified by `tests/promiseHelpersUsage.ts` (`npm run test:promise-helpers`) for cases P1 to P9, and by the type check, build and manual pass for cases T1 to T4. Spec references: [spec.md](../spec.md).

## What must not change

- `PromiseHelpers` and its methods (`makePromise`, `makePromiseObj`, `promiseChainThen`, `emptyPromise`), the helper types (`promiseFunction`, `promiseCondition`, `promiseInstance`, `PromiseParameters`) and `TEmptyPromise` remain in `src/common/promiseHelpers.ts` with unchanged behavior.
- `src/application/exports.ts` keeps `export * from '../common/promiseHelpers'` and the `PromiseHelpers` entry in its export object.
- Every method that returned `Promise<X>` before still returns `Promise<X>`. No declared result type changes.

## Headless test cases

| ID | Case | Expected | Spec |
|----|------|----------|------|
| P1 | Scan every `.ts`, `.vue` and `.js` file under `src/` for `PromiseHelpers`, excluding `src/common/promiseHelpers.ts` and `src/application/exports.ts` | no matches | FR-001, FR-005, SC-001 |
| P2 | Scan the same files for `emptyPromise(` and `makePromise(` outside `src/common/promiseHelpers.ts` | no matches | FR-001, FR-005 |
| P3 | `src/application/exports.ts` still re-exports the module and lists `PromiseHelpers` | both present | FR-006, SC-003 |
| P4 | Import `PromiseHelpers` and check `typeof` each static method | all four are functions | FR-006 |
| P5 | `await PromiseHelpers.emptyPromise()` | resolves (value `undefined`) | FR-006 |
| P6 | `PromiseHelpers.makePromise` with a condition that becomes true on the 3rd poll, a pre-resolve method, and a poll method | resolves; pre-resolve called once; poll method called twice | FR-006 |
| P7 | `makePromise` with a condition that is already true | resolves after about one poll interval, pre-resolve called once, poll method never | FR-006 |
| P8 | `promiseChainThen` over two parameter sets | both end conditions are reached in order | FR-006 |
| P9 | `TEmptyPromise('x')` | resolves with `'x'` | FR-006 |

## Verification by type check, build and manual pass

| ID | Case | Expected | Spec |
|----|------|----------|------|
| T1 | `npx tsc --noEmit -p tsconfig.json` | no errors | FR-007, FR-008 |
| T2 | `npm run build` | succeeds, no new warnings | FR-008 |
| T3 | The six existing headless scripts | all pass | FR-008 |
| T4 | Manual pass in quickstart.md | no visible difference | FR-009, SC-005 |
