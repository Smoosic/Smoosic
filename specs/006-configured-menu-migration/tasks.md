---

description: "Task list template for feature implementation"
---

# Tasks: Configured Menu Migration for Language, Part Selection, Score, and Staff Modifier Menus

**Input**: Design documents from `/specs/006-configured-menu-migration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested in the feature specification, and this repo has no automated test harness for menu classes (`npm test` is a no-op). Validation is manual, per quickstart.md, plus a TypeScript build/typecheck.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent implementation and validation of each menu.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single front-end project — all paths are under `src/ui/menus/` at the repository root, per plan.md's Project Structure.

---

## Phase 1: Setup

**Purpose**: Confirm a clean starting point before any changes.

- [X] T001 Run `npm run build` (or `npm run types`) on the current, unmigrated code and confirm it succeeds with no errors, establishing the baseline that later checkpoints compare against. (Baseline has one pre-existing, unrelated error: `typedoc.ts(153,15): TS2307 Cannot find module './src/ui/menus/timeSignature'` — not touched by this feature; used as the "no *new* errors" reference point for later checkpoints.)

---

## Phase 2: Foundational

**Purpose**: Blocking prerequisites shared by all user stories.

**None required.** All shared infrastructure this migration depends on — `SuiConfiguredMenu`, `SuiConfiguredMenuOption`, `SuiMenuHandler`, `SuiMenuShowOption`, and the `cancelOption` auto-append behavior — already exists, unmodified, in `src/ui/menus/menu.ts` (plan.md Project Structure). Each of the four target files (language.ts, staffModifier.ts, score.ts, partSelection.ts) is edited independently in place, with no new shared file and no change to `SuiMenuParams` or `SuiMenuManager` (research.md R6). User stories may proceed directly after Phase 1.

---

## Phase 3: User Story 1 - Language and Lines menus keep working exactly as before (Priority: P1) 🎯 MVP

**Goal**: Convert the two static, unconditional-choice-list menus (Language, Lines) to `SuiConfiguredMenu`, proving out the basic options-array pattern with the lowest-risk files before tackling the two menus with conditional/dynamic option lists.

**Independent Test**: Open the Language menu and select each language, confirming the UI language switches correctly. Open the Lines menu and exercise every choice, confirming each produces the same score change as today, including the pedal-marking overlap-resolution behavior and the deferred completion of "Reset slurs".

### Implementation for User Story 1

- [X] T002 [P] [US1] Convert `SuiLanguageMenu` in `src/ui/menus/language.ts` to extend `SuiConfiguredMenu`: define the three `SuiConfiguredMenuOption` constants (en/de/ar) per data-model.md's "Language Menu" table, each with `handler: async (menu) => { SmoTranslator.setLanguage(<value>); }` and `display: () => true`; collect them into a `SuiLanguageMenuOptions` array; change the constructor to `super(params, 'Language', SuiLanguageMenuOptions)`; remove the now-redundant `static defaults`, `getDefinition()`, `static get ctor()`, and `keydown() {}` (research.md R1, R5).
- [X] T003 [P] [US1] Convert `SuiStaffModifierMenu` in `src/ui/menus/staffModifier.ts` to extend `SuiConfiguredMenu`: define the twelve `SuiConfiguredMenuOption` constants (crescendo, decrescendo, slur, tie, pedalMarking, ending, dimenuendo, crescendoBracket, accel, ritard, resetSlurs, endings) per data-model.md's "Lines Menu" table, each `handler` reproducing its current `selection()` branch verbatim (using `menu.view`/`menu.tracker`/`menu.score` in place of `this.view`/`this.tracker`/`this.score`) and `display: () => true`; preserve the Pedal Marking handler's overlap-resolution `await`s and the Reset Slurs handler's `await menu.view.refreshViewport()` exactly, so `SuiConfiguredMenu.selection()`'s existing `await option.handler(this)` reproduces today's completion timing (research.md R4); collect the options into a `SuiStaffModifierMenuOptions` array; change the constructor to `super(params, 'Lines', SuiStaffModifierMenuOptions)`; remove `static defaults`, `getDefinition()`, and `keydown() {}` (research.md R1, R5).
- [ ] T004 [US1] Manually validate per quickstart.md's "Language menu" and "Lines menu" scenarios: switch through all three languages; exercise every Lines choice; confirm the pedal-marking overlap case merges correctly; confirm "Reset slurs" keeps the menu open until `refreshViewport()` resolves. **Not run** — no live browser/dev-server session available in this environment; verified instead by code-level trace of every handler against its original `selection()` branch, plus a clean typecheck/build. Live in-browser exercise per quickstart.md is still recommended before merging.

**Checkpoint**: Language and Lines menus are fully functional and independently testable; `SuiScoreMenu` and `SuiPartSelectionMenu` are untouched so far.

---

## Phase 4: User Story 2 - Score Settings menu keeps its context-sensitive options working (Priority: P2)

**Goal**: Convert `SuiScoreMenu`, moving its four view-state-conditional options' visibility logic out of a shared `preAttach()` filter and into each option's own `display` function — the main structural improvement of this migration.

**Independent Test**: With a part exposed, open Score Settings and confirm Page Layout/Global Layout/System Groups are hidden and View All is shown; return to full-score view and confirm the reverse; confirm Preferences/Fonts/Score Info/Transpose Score are always visible.

### Implementation for User Story 2

- [X] T005 [US2] Convert `SuiScoreMenu` in `src/ui/menus/score.ts` to extend `SuiConfiguredMenu`: define the eight `SuiConfiguredMenuOption` constants per data-model.md's "Score Settings Menu" table — `preferences`, `fonts`, `identification`, `transposeScore` with `display: () => true`; `pageLayout`, `globalLayout`, `staffGroups` with `display: (menu) => menu.view.isPartExposed() === false`; `viewAll` with `display: (menu) => menu.score.staves.length < menu.view.storeScore.staves.length`; each `handler` reproducing the current `execXxx`/`selection()` logic (inlining the `execXxx` bodies directly into each handler is preferred, per data-model.md, to avoid an `as SuiScoreMenu` cast) — per research.md R2; collect into a `SuiScoreMenuOptions` array; change the constructor to `super(params, 'Score Settings', SuiScoreMenuOptions)`; delete the current shared `preAttach()` filter entirely (superseded by per-option `display`); remove `static defaults`, `getDefinition()`, and `keydown() {}` (research.md R1, R5).
- [ ] T006 [US2] Manually validate per quickstart.md's "Score Settings menu" scenarios in both full-score and part-exposed view states, confirming the exact set of visible options in each state and that each unconditional option still opens its dialog correctly. **Not run** — same environment limitation as T004; verified by code-level trace of each `display` condition against the original `preAttach()` filter, plus a clean typecheck/build.

**Checkpoint**: Language, Lines, and Score Settings menus are all fully functional; only `SuiPartSelectionMenu` remains.

---

## Phase 5: User Story 3 - Parts menu keeps listing the score's current parts (Priority: P3)

**Goal**: Convert `SuiPartSelectionMenu`, whose option list is rebuilt from the live part map on every open rather than fixed — the most structurally different of the four conversions, attempted last.

**Independent Test**: On a multi-part score, open the Parts menu and confirm one choice per part (by name); select one and confirm it's exposed; reopen and confirm View All now appears; select it and confirm the full score view returns.

### Implementation for User Story 3

- [X] T007 [US3] Convert `SuiPartSelectionMenu` in `src/ui/menus/partSelection.ts` to extend `SuiConfiguredMenu`: change the constructor to `super(params, 'Parts', [])` (starting from an empty/minimal options array, since the real list is dynamic); override `preAttach()` to rebuild `this.menuOptions` on every call per research.md R3 — read `this.view.getPartMap()` into `this.partMap`, locate the existing `cancel` option already auto-appended by the constructor (`this.menuOptions.find((op) => op.menuChoice.value === 'cancel')`), build a fresh array containing a `View All` option (`handler: (menu) => menu.view.viewAll()`, included only when `this.score.staves.length < this.view.storeScore.staves.length`) followed by one option per part (`value: key.toString()`, `text: partMap.partMap[key].partName`, `handler: (menu) => menu.view.exposePart(menu.view.storeScore.staves[partMap.partMap[key].associatedStaff])`) followed by the reused `cancel` option, assign it to `this.menuOptions`, then call `super.preAttach()`; every rebuilt option's `display` is `() => true` (list membership itself expresses the conditionality, not `display`), per data-model.md's "Parts Menu" table; remove the old `getDefinition()`'s static list, `static defaults`, and `keydown() {}` (research.md R1, R5).
- [ ] T008 [US3] Manually validate per quickstart.md's "Parts menu" scenarios: confirm per-part choices with no View All when no part is exposed; select a part and confirm exposure; reopen and confirm View All appears; select it and confirm the full view returns; confirm Cancel/unparseable selection makes no view change. **Not run** — same environment limitation as T004; verified by code-level trace of the rebuilt `preAttach()` against the original dynamic-list logic, plus a clean typecheck/build.

**Checkpoint**: All four menus (Language, Lines, Score Settings, Parts) are migrated and independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Whole-feature validation across all four migrated files together.

- [X] T009 [P] Run `npm run build` (or `npm run types`) across the full, migrated codebase and fix any TypeScript errors (SC-004). Result: same single pre-existing, unrelated `typedoc.ts` error as the T001 baseline — zero new errors.
- [X] T010 [P] Run quickstart.md's two regression greps — no `extends SuiMenuBase` and no locally-defined `value: 'cancel'` — against `src/ui/menus/language.ts`, `src/ui/menus/partSelection.ts`, `src/ui/menus/score.ts`, `src/ui/menus/staffModifier.ts`, confirming both come back clean (SC-005, FR-007). Result: both greps returned no matches.
- [ ] T011 Work through quickstart.md's full "Done when" checklist across all four menus together, confirming no cross-menu regression was introduced by later stories. **Partially verified**: SC-004/SC-005 (build, greps) confirmed via T009/T010; SC-001/SC-002/SC-003 (behavioral parity) require the live in-browser pass from T004/T006/T008, not run in this environment.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: No tasks; nothing blocks the user stories beyond Setup.
- **User Stories (Phase 3-5)**: Each depends only on Phase 1 completion. Because each story touches a disjoint file (language.ts/staffModifier.ts vs. score.ts vs. partSelection.ts), stories are fully independent of each other and may proceed in any order or in parallel — priority order (P1 → P2 → P3) is recommended since it matches increasing structural complexity (research.md), not a hard dependency.
- **Polish (Phase 6)**: Depends on all three user stories being complete (it validates all four files together).

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories.
- **User Story 2 (P2)**: No dependencies on other stories (touches only score.ts).
- **User Story 3 (P3)**: No dependencies on other stories (touches only partSelection.ts).

### Within Each User Story

- Implementation task(s) before that story's manual-validation task.
- Story complete before its checkpoint is considered met.

### Parallel Opportunities

- T002 and T003 (Language, Lines — different files) can run in parallel within User Story 1.
- Because User Stories 1, 2, and 3 touch entirely disjoint files (language.ts+staffModifier.ts / score.ts / partSelection.ts), all three stories' implementation tasks (T002/T003, T005, T007) could in principle be done in parallel by different people; sequential P1→P2→P3 order is recommended for a single implementer since it goes simplest-to-most-complex.
- T009 and T010 in Polish can run in parallel (build vs. grep, no shared state).

---

## Parallel Example: User Story 1

```bash
# Launch both conversions for User Story 1 together (different files):
Task: "Convert SuiLanguageMenu in src/ui/menus/language.ts to extend SuiConfiguredMenu"
Task: "Convert SuiStaffModifierMenu in src/ui/menus/staffModifier.ts to extend SuiConfiguredMenu"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (baseline build).
2. Complete Phase 3: User Story 1 (Language + Lines menus).
3. **STOP and VALIDATE**: Run T004 independently.
4. This alone already delivers the architectural consistency win for two of the four menus, with zero risk to Score Settings' or Parts' current behavior.

### Incremental Delivery

1. Setup → baseline confirmed.
2. Add User Story 1 (Language, Lines) → validate independently (T004).
3. Add User Story 2 (Score Settings) → validate independently (T006).
4. Add User Story 3 (Parts) → validate independently (T008).
5. Polish (T009-T011) → whole-feature build/grep/checklist pass.

Each story adds value without breaking previous stories, since the four target files never share code beyond the already-existing, unmodified `SuiConfiguredMenu` base.

---

## Notes

- [P] tasks touch different files with no dependencies between them.
- [Story] label maps each task to its user story for traceability back to spec.md.
- No automated tests exist or are requested for this feature; T004/T006/T008/T011 are manual validation steps against quickstart.md, and T001/T009 are the only build/typecheck gates.
- Commit after each task or logical group (e.g., after each of T002, T003, T005, T007).
- Stop at any checkpoint to validate a story independently before continuing.
