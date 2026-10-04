---

description: "Task list template for feature implementation"
---

# Tasks: Add All Landmarks Menu Option

**Input**: Design documents from `/specs/024-all-landmarks-menu/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/menu-option-contract.md, quickstart.md

**Tests**: Not requested — this repo has no automated menu/UI test runner wired up (`npm test` is a no-op placeholder, per plan.md's Technical Context). The new logic is a thin loop over already-correct, already-exercised helpers (`findLandmark`, `sourceTextDefined`, `createLandmarkText`, `addTextGroup`), so verification is manual against `quickstart.md`, matching the established pattern (`020-annotation-drag-tool`, `023-text-drag-controls`).

**Organization**: Tasks are grouped by user story (spec.md) to enable independent implementation and testing of each story. This feature has a single user story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1)
- Include exact file paths in descriptions

## Path Conventions

Single front-end project (per plan.md's Structure Decision) — the entire feature is one new value appended to an existing array in one existing file, `src/ui/menus/text.ts`.

---

## Phase 1: Setup

**Purpose**: Confirm a clean baseline before making changes

- [X] T001 Run `npm run build` to confirm the repo builds cleanly on the current branch before this feature's changes, so any later build failure can be attributed to this feature

**Note**: No separate Foundational phase is needed — every helper this feature calls (`findLandmark`, `findAboveLandmark`, `sourceTextDefined`, `resolveLandmarkText`, `resolveLandmarkMeasureText`, `SmoTextGroup.createLandmarkText`, `SuiScoreViewOperations.addTextGroup`) already exists and is unmodified; there is nothing to build before the single user story below.

---

## Phase 2: User Story 1 - Add every available landmark in one action (Priority: P1) 🎯 MVP

**Goal**: Selecting "All" in the landmark submenu creates a landmark for every currently-available purpose that doesn't already exist, leaves existing landmarks untouched, and closes the menu without opening any dialog.

**Independent Test**: Open the landmark submenu on a score with no landmarks yet, select "All", and confirm every currently-available landmark is created and the menu closes with no dialog appearing.

### Implementation for User Story 1

- [X] T002 [US1] In `src/ui/menus/text.ts`, add a new `allLandmarksOption: SuiConfiguredMenuOption` (contracts/menu-option-contract.md) whose `handler` iterates the same seven `(purpose, label, icon)` entries already listed in the `landmarkOptions` array's construction (Title, Subtitle, Composer, Copyright, Date, Page Number, Part — in that order), and for each one: skips it if `findLandmark(purpose, menu.view)` already finds one (FR-003); otherwise, if `sourceTextDefined(purpose, menu.view)` is true (research.md §2), builds it via `resolveLandmarkText` → `resolveLandmarkMeasureText` → `findAboveLandmark` → `SmoTextGroup.createLandmarkText` and calls `await menu.view.addTextGroup(group)` (mirroring `landmarkOption`'s own handler body, data-model.md); otherwise skips it. The handler MUST NOT call `SuiTextBlockDialogVue` at any point (FR-004). `display` is `() => true` (FR-007); `menuChoice` is `{ icon: 'mi title', text: 'All', value: 'landmark-All' }`.
- [X] T003 [US1] Append `allLandmarksOption` to the existing `landmarkOptions` array (after the existing seven `landmarkOption(...)` entries) in `src/ui/menus/text.ts`, so it appears in `landmarkTextMenuOption`'s submenu alongside them (depends on T002)
- [ ] T004 [US1] Manually validate quickstart.md "Manual check 1: Create everything available, from empty" per `specs/024-all-landmarks-menu/quickstart.md` (depends on T003)
- [ ] T005 [US1] Manually validate quickstart.md "Manual check 2: Skip existing, create only what's missing" per `specs/024-all-landmarks-menu/quickstart.md` (depends on T003)
- [ ] T006 [US1] Manually validate quickstart.md "Manual check 3: Nothing available, nothing to do" per `specs/024-all-landmarks-menu/quickstart.md` (depends on T003)
- [ ] T007 [US1] Manually validate quickstart.md "Manual check 4: No dialog ever opens" per `specs/024-all-landmarks-menu/quickstart.md` (depends on T003)

**Checkpoint**: User Story 1 is fully functional and independently testable — this is the MVP, and the only user story in this feature.

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Confirm a clean build and no regressions to the existing per-purpose options

- [ ] T008 [P] Manually confirm selecting an individual purpose (e.g., "Title") directly from the submenu still opens its editing dialog as before — unchanged, pre-existing behavior (quickstart.md Check 4's second half; regression guard for the per-purpose options this feature sits beside)
- [X] T009 Run `npm run build` and `npm run types` to confirm no TypeScript errors in `src/ui/menus/text.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **User Story 1 (Phase 2)**: Depends on Setup completion — the only user story, and the MVP
- **Polish (Phase 3)**: Depends on Phase 2 being complete

### Within User Story 1

- T002 → T003 (same file, same array) → T004/T005/T006/T007 (independent manual scenarios, all depend on T003 being in place; can be run in any order relative to each other but are listed in spec-scenario order)

### Parallel Opportunities

- T004-T007 are independent manual validation scenarios against the same built feature and can be run in parallel once T003 is complete
- T008 (Phase 3) is independent and can run in parallel with T004-T007

---

## Implementation Strategy

### MVP First (and only) — User Story 1

1. Complete Phase 1: Setup
2. Complete Phase 2: User Story 1 (T002-T007)
3. **STOP and VALIDATE**: all four quickstart checks
4. Complete Phase 3: Polish (regression guard + clean build)

This feature has no further increments beyond its single user story — once Phase 2 is validated, the feature is complete.

## Notes

- **Manual validation status**: T004-T008 (all the "Manually validate..."/"Manually confirm..." tasks) require driving an actual browser and were **not** performed — this implementation environment has no browser-driving tool available. T001-T003 and T009 are complete: `npm run build` and the stricter `npm run types` both pass with no TypeScript errors, and the diff is a pure refactor-plus-addition (the existing seven `landmarkOption` handlers now share a new `ensureLandmark` helper with identical behavior, verified by inspection against the pre-change code — `git diff` shows no change to `findLandmark`/`findAboveLandmark`/`sourceTextDefined`/`resolveLandmarkText`/`resolveLandmarkMeasureText`/`SmoTextGroup.createLandmarkText`/`addTextGroup`). The actual menu appearance, bulk-creation result, and stacking/placement should be manually verified in a browser per `specs/024-all-landmarks-menu/quickstart.md` before considering this feature fully done.
- [P] tasks = different files or independent validation scenarios, no dependencies
- [Story] label maps task to specific user story for traceability
- This feature adds no automated tests; all verification is manual via `quickstart.md`, matching this repo's established test boundary for menu/UI-layer control flow with no new business logic of its own
- Commit after each task or logical group
- Stop at the checkpoint to validate the story independently before moving to Polish
