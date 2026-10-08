---

description: "Task list template for feature implementation"
---

# Tasks: Reposition Text on Layout Resize

**Input**: Design documents from `/specs/022-text-reposition-on-resize/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/reposition-contract.md](./contracts/reposition-contract.md), [quickstart.md](./quickstart.md)

**Tests**: Included. The project constitution (Principle #2) requires regression tests for non-UI transformation logic in `src/smo`, and the plan commits to a headless `tests/*.ts` script following the existing `tests/attachedTextMigration.ts` pattern.

**Organization**: Tasks are grouped by user story (US1 = P1 svg-scale bug fix, US2 = P2 page-dimension + part scoping) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Exact file paths are included in every task description

## Path Conventions

Single project (per plan.md): `src/` and `tests/` at the repository root. No new top-level directories are introduced.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Stand up the new headless regression test so later phases only need to add cases to it.

- [X] T001 [P] Register a `test:global-layout-reposition` script in `package.json` (next to the existing `"test:attached-text": "ts-node -P tests/tsconfig.json tests/attachedTextMigration.ts"` line), pointing at `tests/globalLayoutTextReposition.ts`.
- [X] T002 Create `tests/globalLayoutTextReposition.ts` with the shared scaffold only (no case assertions yet): the dynamic-ctor-init calls and imports used by `tests/attachedTextMigration.ts`, the `check()`/failure-counter helper, small builders for a minimal `SmoGlobalLayout` (`makeLayout(overrides: Partial<SmoGlobalLayout>)`) and a `SmoTextGroup` with known `musicXOffset`/`musicYOffset`/block `x`/`y` values, and the final pass/fail summary block (`if (failures > 0) { ... process.exitCode = 1 } else { ... }`).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Make the old/new layout values that reach `setGlobalLayout` correct and explicit. Both user stories depend on this â€” until it's done, no ratio computed anywhere in `setGlobalLayout` can be trusted.

**âš ï¸ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 In `src/ui/dialogs/globalLayout.ts`, fix the reactive-aliasing bug described in research.md item 1â€“2: add a `previousValue` variable seeded as `JSON.parse(JSON.stringify(currentValue))` right after the existing `backup` is created; inside the `watch(currentValue, async (newValue) => { ... })` callback, capture `const oldValue = previousValue;` *before* calling `parameters.view.setGlobalLayout`, call `await parameters.view.setGlobalLayout(newValue, oldValue)`, then set `previousValue = JSON.parse(JSON.stringify(newValue))` (in that order, so the next change diffs against this one, not the original dialog-open snapshot â€” contract case R10). Update `cancelCb` to call `await parameters.view.setGlobalLayout(backup, previousValue)` instead of the current single-argument call.
- [X] T004 In `src/render/sui/scoreViewOperations.ts`, change the `setGlobalLayout` signature from `setGlobalLayout(layout: SmoGlobalLayout): Promise<void>` to `setGlobalLayout(layout: SmoGlobalLayout, previousLayout: SmoGlobalLayout): Promise<void>`. Remove the unreliable `const original = this.score.layoutManager!.getGlobalLayout().svgScale;` read. Add a no-op guard as the very first statement in the method body (before `this._undoScore(...)` is called, so an unchanged commit creates no undo entry, per spec FR-005/FR-006): `if (previousLayout.svgScale === layout.svgScale && previousLayout.pageWidth === layout.pageWidth && previousLayout.pageHeight === layout.pageHeight) { return; }`. Replace `this.score.scaleTextGroups(original / layout.svgScale)` with a guarded call using `previousLayout.svgScale / layout.svgScale` instead (only when `previousLayout.svgScale !== layout.svgScale`).
- [X] T005 [P] Add contract cases R4 (no changed value â†’ nothing touched) and R10 (two sequential scale changes each diff against the immediately-preceding value, not the original dialog-open snapshot, and land at the same result as one direct change) to `tests/globalLayoutTextReposition.ts`, calling `setGlobalLayout`'s underlying ratio logic (either directly, if implementation exposes it as a small pure function, or by exercising `SmoScore.scaleTextGroups` with the ratios this phase's logic would compute) per `contracts/reposition-contract.md`.

**Checkpoint**: The dialog now hands `setGlobalLayout` a correct, explicit "before" layout on every change, and unchanged commits are true no-ops. The scale-ratio math itself is correct, but it still only touches the transient `this.score` view, not `this.storeScore`, and there is no page-dimension or part-level handling yet.

---

## Phase 3: User Story 1 - Text stays put when scale changes (Priority: P1) ðŸŽ¯ MVP

**Goal**: Fix the visible svg-scale bug for the common (no part exposed) case so text keeps its visual position and size when scale changes, and so the fix survives save/reload (not just the current render).

**Independent Test**: Add a title/footer text block, open Global Layout, change svg scale, apply â€” text renders at the same visual position/size as before. Cancel after a change restores text exactly. (spec.md User Story 1, Acceptance Scenarios 1â€“3)

### Tests for User Story 1

- [X] T006 [P] [US1] Add contract case R1 (svg-scale ratio applied to a block's `x`/`y`, page dimensions unchanged and untouched) to `tests/globalLayoutTextReposition.ts`.
- [X] T007 [P] [US1] Add contract case R7 (`musicXOffset`/`musicYOffset` rescaled identically to block `x`/`y`) to `tests/globalLayoutTextReposition.ts`.
- [X] T008 [US1] Add contract case R8 (a score-level scale change repositions both the `this.score`-equivalent list and the `this.storeScore`-equivalent list identically) to `tests/globalLayoutTextReposition.ts`, using two independent `SmoTextGroup` lists built from the same starting values to stand in for the view/store split, per `contracts/reposition-contract.md`.
- [X] T009 [US1] Add contract case R11 (apply a scale change, then run the cancel path â€” i.e. call the fixed logic again with the original `backup` layout as `newLayout` and the last-applied layout as `previousLayout` â€” text returns exactly to its pre-dialog values) to `tests/globalLayoutTextReposition.ts`.

### Implementation for User Story 1

- [X] T010 [US1] In `src/render/sui/scoreViewOperations.ts` `setGlobalLayout` (after T004's guarded `this.score.scaleTextGroups(...)` call), add the matching call on the persisted copy: `this.storeScore.scaleTextGroups(previousLayout.svgScale / layout.svgScale)` under the same `previousLayout.svgScale !== layout.svgScale` guard. This closes the gap identified in research.md item 3 â€” `this.storeScore.layoutManager` was already updated, but `this.storeScore.textGroups` was never rescaled, so the fix would otherwise be lost the next time `this.storeScore` becomes the source of truth (e.g. `viewAll()`/`setView()`'s serialize/deserialize round trip).
- [X] T011 [US1] Run `npm run test:global-layout-reposition` and fix any failures until cases R1, R4, R7, R8, R10, R11 all pass.
- [X] T012 [US1] Manual validation: follow `quickstart.md` steps 1â€“4 and 6 (scale-only change, then cancel) in the running app; confirm no visible text jump on apply and exact restoration on cancel.

**Checkpoint**: User Story 1 is fully functional and independently testable â€” the svg-scale bug is fixed for score-level (non-part) layouts, and the fix persists through `storeScore`.

---

## Phase 4: User Story 2 - Text stays proportionally placed when page size changes (Priority: P2)

**Goal**: Add page-width/page-height proportional repositioning, and extend both the scale and page-dimension handling to part-level layouts, so a part's own layout change only repositions that part's text.

**Independent Test**: Place a text block at ~10% of page width, change page width, confirm it's still at ~10%. Change a part's page layout and confirm only that part's text groups move. (spec.md User Story 2, Acceptance Scenarios 1â€“3)

### Tests for User Story 2

- [X] T013 [P] [US2] Add contract cases R2 (pageWidth ratio, X-axis only) and R3 (pageHeight ratio, Y-axis only) to `tests/globalLayoutTextReposition.ts`.
- [X] T014 [P] [US2] Add contract case R5 (combined svg-scale and page-dimension change in one call lands at the same result regardless of internal application order) to `tests/globalLayoutTextReposition.ts`.
- [X] T015 [P] [US2] Add contract case R6 (a block sitting exactly at `x = 0` or `x = oldLayout.pageWidth` stays exactly at the corresponding edge after a pageWidth change, no rounding drift) to `tests/globalLayoutTextReposition.ts`.
- [X] T016 [US2] Add contract case R9 (a part-level layout change repositions only that staff's `partInfo.textGroups`, not the score's own `textGroups` or another part's) to `tests/globalLayoutTextReposition.ts`, building a two-staff score with distinct part text groups following the `partWith` helper pattern already used in `tests/attachedTextMigration.ts`.

### Implementation for User Story 2

- [X] T017 [P] [US2] Add a page-dimension rescale method to `SmoTextGroup` in `src/smo/data/scoreText.ts`, sibling to the existing `scaleText(scale: number)` (around line 781): e.g. `rescalePosition(xRatio: number, yRatio: number)` that multiplies `musicXOffset` and every block's `text.x` by `xRatio`, and `musicYOffset` and every block's `text.y` by `yRatio`, independently.
- [X] T018 [US2] ~~Add a corresponding `SmoScore` method in `src/smo/data/score.ts`~~ â€” **superseded during implementation**: `setGlobalLayout` needs to reposition three different kinds of lists (`this.score.textGroups`, `this.storeScore.textGroups`, and raw `staff.partInfo.textGroups` arrays that aren't wrapped in a `SmoScore`), so a `SmoScore`-level wrapper would only cover two of the three call shapes. Implemented instead as a local `repositionGroups(textGroups: SmoTextGroup[])` closure inside `setGlobalLayout` (T019/T020) that calls `tg.scaleText`/`tg.rescalePosition` directly over any `SmoTextGroup[]`, uniformly for all three cases.
- [X] T019 [US2] In `src/render/sui/scoreViewOperations.ts` `setGlobalLayout`, after the existing (T004/T010) scale-ratio calls, add page-dimension handling: when `previousLayout.pageWidth !== layout.pageWidth` or `previousLayout.pageHeight !== layout.pageHeight`, compute `widthRatio = previousLayout.pageWidth !== layout.pageWidth ? layout.pageWidth / previousLayout.pageWidth : 1` and the analogous `heightRatio`, then call the new rescale method (T018) on both `this.score` and `this.storeScore`.
- [X] T020 [US2] In `src/render/sui/scoreViewOperations.ts` `setGlobalLayout`, add part-level scoping per research.md item 3 and data-model.md's Application Scope rule: when `this.isPartExposed()` is true, apply the same scale-ratio (T004/T010) and page-dimension (T019) rescales to each affected staff's `partInfo.textGroups` on both `this.score.staves` and the corresponding staff on `this.storeScore.staves[this.staffMap[staffIx]]` â€” mirroring the existing iteration pattern already used by `setPageLayout` (around line 1744) â€” instead of double-applying to the already-aliased score-level `textGroups` list, so a part's own layout change never rescales the score's own text or another part's.
- [X] T021 [US2] Run `npm run test:global-layout-reposition` and fix any failures until all contract cases R1â€“R11 pass.
- [X] T022 [US2] Manual validation: follow `quickstart.md` step 5 (page-width / paper-size-preset change) and step 7 (commit a change, then Undo) in the running app.

**Checkpoint**: Both user stories are independently functional â€” svg-scale and page-dimension changes both keep text correctly positioned, for score-level and part-level layouts alike.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T023 [P] Run the project's type-generation step (`npm run types`) to confirm the changed `setGlobalLayout` signature and the new `SmoTextGroup.rescalePosition` method (see T018 note — the planned `SmoScore.rescaleTextGroupPositions` sibling was not needed) regenerate cleanly into `types/`. Ran successfully; `types/src/render/sui/scoreViewOperations.d.ts` and `types/src/smo/data/scoreText.d.ts` updated accordingly.
- [X] T024 [P] Grep the repo for other `setGlobalLayout(` call sites (`Grep -n "setGlobalLayout(" src`) to confirm `src/ui/dialogs/globalLayout.ts` is the only caller of the now-two-argument method; update any others found.
- [X] T025 Re-read `specs/022-text-reposition-on-resize/quickstart.md` against the as-built UI (menu labels, dialog field names) and correct any step that drifted during implementation. Reviewed against `src/ui/menus/score.ts` ("Score Settings" → "Score Layout") and `src/ui/components/dialogs/scoreLayout.vue` ("Note Size (%)", "Page Width", "Paper Size") — no drift found, no changes needed.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies â€” start immediately.
- **Foundational (Phase 2)**: Depends on Setup (T002's scaffold file must exist for T005 to add cases to). Blocks both user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational completion (T003â€“T004). No dependency on User Story 2.
- **User Story 2 (Phase 4)**: Depends on Foundational completion. T017â€“T020 build on the `this.score`/`this.storeScore` scale-ratio calls that Phase 3 (T004, T010) put in place, so in practice Phase 4 is implemented after Phase 3, even though its test cases (T013â€“T016) could be drafted earlier.
- **Polish (Phase 5)**: Depends on both user stories being complete.

### Within Each Phase

- Test cases for a phase are added before that phase's implementation tasks are considered done (contract-first), and should fail against the pre-phase code before the corresponding implementation task lands.
- `tests/globalLayoutTextReposition.ts` is a single shared file â€” tasks that add cases to it (T005, T006, T007, T008, T009, T013, T014, T015, T016) are only marked `[P]` when they can be drafted independently of each other's case content even though they'll land in the same file; run them sequentially if your editing workflow can't merge concurrent edits to one file.

### Parallel Opportunities

- T001 (package.json) can run in parallel with T002 (test scaffold).
- T005's two contract cases can be drafted in parallel with each other.
- T006 and T007 (US1 test cases) can be drafted in parallel.
- T013, T014, T015 (US2 test cases) can be drafted in parallel; T016 depends on understanding the part-test helper pattern but not on T013â€“T015's content.
- T017 (SmoTextGroup method) has no dependency on T013â€“T016 and can be implemented in parallel with them; T018 depends on T017.
- T023 and T024 (Polish) can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Draft both US1 contract cases together:
Task: "Add contract case R1 (svg-scale ratio) to tests/globalLayoutTextReposition.ts"
Task: "Add contract case R7 (offset rescale) to tests/globalLayoutTextReposition.ts"
```

## Parallel Example: User Story 2

```bash
# Draft US2 contract cases while implementing the new SmoTextGroup method:
Task: "Add contract cases R2/R3 (page-dimension ratios) to tests/globalLayoutTextReposition.ts"
Task: "Add SmoTextGroup.rescalePosition in src/smo/data/scoreText.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (fixes the aliasing bug's root cause â€” CRITICAL, blocks both stories).
3. Complete Phase 3: User Story 1 â€” the svg-scale bug is fixed and persists correctly. This alone is a shippable, valuable fix even without Phase 4.
4. **STOP and VALIDATE**: run `npm run test:global-layout-reposition` and the manual quickstart steps for scale changes.

### Incremental Delivery

1. Setup + Foundational â†’ correct old/new values flow into `setGlobalLayout`.
2. Add User Story 1 â†’ svg-scale bug fixed for score-level layouts â†’ validate â†’ this is the MVP.
3. Add User Story 2 â†’ page-dimension repositioning plus part-level scoping â†’ validate â†’ full feature complete.
4. Polish â†’ confirm generated types and no stray single-argument callers remain.
