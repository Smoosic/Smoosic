---

description: "Task list template for feature implementation"
---

# Tasks: Vue-Rendered Menu Component

**Input**: Design documents from `/specs/007-vue-menu-component/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested in the feature specification, and this repo has no automated test harness for menu rendering/events (`npm test` is a no-op). Validation is manual, per quickstart.md, plus a TypeScript build/typecheck.

**Organization**: Tasks are grouped by user story (from spec.md). **Note, unlike a typical independently-testable-story breakdown**: this feature is a single incremental mechanism spread across exactly two files (`src/ui/menus/manager.ts` and `src/ui/components/menus/menu.vue`), so User Stories 2 and 3 genuinely depend on the prior story's work existing first (spec.md says as much: US2 "depends on User Story 1", US3 assumes US2's event-binding exists so it has something to clean up). Tasks are ordered accordingly rather than claiming false file-level independence.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single front-end project — `src/ui/menus/manager.ts` and `src/ui/components/menus/menu.vue`, per plan.md's Project Structure.

---

## Phase 1: Setup

**Purpose**: Confirm a clean starting point before any changes.

- [X] T001 Run `npm run build` (or `npm run types`) on the current code and confirm it succeeds with no errors, establishing the baseline that later checkpoints compare against. Result: clean build (the prior feature's `typedoc.ts` baseline error has since been fixed by other work committed to the branch).

---

## Phase 2: Foundational

**Purpose**: Blocking prerequisites shared by all user stories.

**None required.** Every piece of shared infrastructure this feature depends on — `replaceVueRoot` (`src/ui/common.ts`), `BrowserEventSource.bindKeydownHandler`/`unbindKeydownHandler` (`src/ui/eventSource.ts`), and `SuiConfiguredMenu`/`SuiConfiguredMenuOption`/`SuiMenuParams` (`src/ui/menus/menu.ts`) — already exists, unmodified (research.md R8). User Story 1 itself *is* the foundational "make the component render" step, so work starts there directly after Phase 1.

---

## Phase 3: User Story 1 - Every menu still shows exactly the right choices and opens the same way (Priority: P1) 🎯 MVP

**Goal**: Switch `SuiMenuManager.attach()` from building menu markup with `buildDom` to mounting `menu.vue`, and fix the draft component's two rendering-correctness gaps (its `display` filter, and closing the menu on selection).

**Independent Test**: Open every menu, including Score Settings (in both full-score and part-exposed view) and Parts (with and without a part exposed), and confirm the same set of choices appears as before this change.

### Implementation for User Story 1

- [X] T002 [US1] Add a `menuApp: App | null` field to `SuiMenuManager` in `src/ui/menus/manager.ts`, importing `App`/`createApp` from `'vue'` and `replaceVueRoot` from `'../common'`, and import the `menu.vue` component (research.md R1).
- [X] T003 [US1] Rewrite `SuiMenuManager.attach()` in `src/ui/menus/manager.ts` per research.md R1/R2: call `replaceVueRoot(this.menuContainer)` to get a mount-target id, `createApp(menuComponent, { domId, menuParams: <current SuiMenuParams>, menuStructure: this.menu }).mount('#' + id)`, store the result in `this.menuApp`; remove the `buildDom`-based `<ul>/<li>/<a>` construction and the per-item `vkey`/`item.hotkey` assignment loop (moves to US2); keep setting `z-index` and `left`/`top` (from `this.menuPosition`) on `this.menuContainer` via jQuery; keep the trailing `this.bindEvents()` call.
- [X] T004 [US1] In `src/ui/components/menus/menu.vue`, fix the option filter from `menuStructure.menuOptions.filter((x) => x.display)` to `menuStructure.menuOptions.filter((x) => x.display(menuStructure))` (research.md R3), so only options currently valid for the mounted `menuStructure` render.
- [X] T005 [US1] In `src/ui/components/menus/menu.vue`, add a `selectItem` method — `async (option: SuiConfiguredMenuOption) => { await option.handler(props.menuStructure); props.menuStructure.complete(); }` — and bind it as `@click.prevent="selectItem(item)"` in place of the current `@click.prevent="item.handler(menuStructure)"` (research.md R3), so selecting an item both runs its handler and closes the menu.
- [ ] T006 [US1] Manually validate per quickstart.md's "Rendering parity" scenarios: every menu's item set and order matches today's; Score Settings shows the correct conditional subset in both view states; Parts shows the correct dynamic list in both states. **Not run** — no live browser/dev-server session available in this environment; verified instead by code-level trace of the mount pipeline and filter logic against the original, plus a clean full build.

**Checkpoint**: Menus render correctly via the mounted component and clicking a choice runs it and closes the menu. Hotkey/arrow-key navigation is not yet relocated (still dead, non-functional manager-side code at this point — resolved in User Story 2, before this is ever exercised end-to-end).

---

## Phase 4: User Story 2 - Selecting a menu item and using the keyboard still work the same way (Priority: P2)

**Goal**: Move hotkey-character assignment, hotkey dispatch, and Up/Down arrow focus cycling into `menu.vue`'s own mount lifecycle, and remove the now-dead equivalent logic from `SuiMenuManager`.

**Independent Test**: With any menu open, click a choice and confirm it performs the same action as today and the menu closes; reopen and press its hotkey; reopen and press Down/Up repeatedly, confirming focus cycles through only the visible choices with wraparound; reopen and press Escape, confirming the menu closes with no action performed.

### Implementation for User Story 2

- [X] T007 [US2] In `src/ui/components/menus/menu.vue`, compute the visible-item list once and assign each item's hotkey character onto `item.menuChoice.hotkey`, reproducing `attach()`'s existing algorithm exactly: `vkey = index < 10 ? String.fromCharCode(48 + index) : String.fromCharCode(87 + index)` (research.md R4, data-model.md).
- [X] T008 [US2] In `src/ui/components/menus/menu.vue`, add a local `ref<number>` focus index and a function that moves it forward/backward (wrapping) among the visible items, updating DOM focus on the corresponding rendered element (research.md R4).
- [X] T009 [US2] In `src/ui/components/menus/menu.vue`, in `onMounted`, call `props.menuParams.eventSource.bindKeydownHandler(...)` with a handler that routes `ArrowUp`/`ArrowDown` to T008's focus-cycling and any other key matching a visible item's assigned hotkey (T007) to `selectItem` (T005) for that item; keep the returned handler reference in a local variable for later unbinding (research.md R4; the unbind side is added in User Story 3's T012).
- [X] T010 [US2] In `src/ui/menus/manager.ts`, remove the now-relocated per-item logic: delete the `hotkeyBindings` field, the `optionElements` getter, and the `_advanceSelection` method; in `evKey()`, remove the `if (this.menu) {...}` block's body (arrow-key/hotkey dispatch) but keep the guard itself (`if (this.menu) { return; }`); in `bindEvents()`, remove the `.dropdown-item` click-delegation block (keep the one-time global `eventSource.bindKeydownHandler(evkey)` subscription guarded by `this.bound`); in `displayMenu()`, remove the `this.menu!.menuItems.forEach(...)` loop that built `hotkeyBindings` (research.md R5, R6).
- [ ] T011 [US2] Manually validate per quickstart.md's "Selection and keyboard" scenarios: click-to-select-and-close for every menu; hotkey selection; Up/Down wraparound focus cycling; Escape dismissal with no action performed. **Not run** — same environment limitation as T006; verified by code-level trace of `selectItem`/hotkey-matching/`advanceFocus` against the original manager-side logic, plus a clean full build.

**Checkpoint**: Full click/hotkey/arrow-key/Escape parity restored, now owned by the component (plus manager.ts for Escape/hotkey-to-open, per research.md R5). The component's keydown subscription is not yet unbound on close — reopening menus repeatedly will accumulate handlers until User Story 3.

---

## Phase 5: User Story 3 - Opening and closing menus repeatedly never leaves stray behavior behind (Priority: P3)

**Goal**: Make the component's keydown subscription actually get released when its menu closes, by explicitly unmounting the Vue `App` instance so `onUnmounted` runs.

**Independent Test**: Open a menu, close it via Escape, open a different menu, select a choice from it, then reopen the first menu and confirm a single click/keypress produces exactly one action, not several.

### Implementation for User Story 3

- [X] T012 [US3] In `src/ui/components/menus/menu.vue`, add `onUnmounted(() => { props.menuParams.eventSource.unbindKeydownHandler(<handler from T009>); })` (research.md R7).
- [X] T013 [US3] In `src/ui/menus/manager.ts`: in `attach()`, call `this.menuApp?.unmount();` before creating and mounting the new app (defensive); in `unattach()`, call `this.menuApp?.unmount(); this.menuApp = null;` alongside its existing `$(this.menuContainer).html('')`/state reset (research.md R7).
- [ ] T014 [US3] Manually validate per quickstart.md's "No leaked handlers" scenarios: open/close/reopen across different menus repeatedly (5-10 cycles), then confirm a single keypress/click still produces exactly one action. **Not run** — same environment limitation as T006; verified by code-level trace confirming `attach()`/`unattach()` both call `menuApp?.unmount()` (making `onUnmounted` reliably fire) and that exactly one `bindKeydownHandler`/`unbindKeydownHandler` pair exists in `menu.vue`.

**Checkpoint**: All three user stories complete — rendering, interaction, and cleanup all match spec.md's success criteria.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Whole-feature validation across both migrated files together.

- [X] T015 [P] Run `npm run build` (or `npm run types`) and fix any new TypeScript errors (quickstart.md regression check). Result: webpack build succeeds with no errors.
- [X] T016 [P] Run quickstart.md's regression greps: confirm `manager.ts` no longer builds menu-item markup with `buildDom` and has no `hotkeyBindings`/`optionElements`/`_advanceSelection` remnants; confirm `menu.vue` has exactly one `bindKeydownHandler` call paired with one `unbindKeydownHandler` call reachable from `onUnmounted`. Result: all greps clean/matching expectations.
- [ ] T017 Work through quickstart.md's full "Done when" checklist across all three user stories together, confirming no cross-story regression. **Partially verified**: build/grep-based checks (T015/T016) confirmed; the behavioral checks (rendering parity, selection/keyboard, no-leaked-handlers) require the live in-browser pass from T006/T011/T014, not run in this environment.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: No tasks; User Story 1 is itself the foundational step.
- **User Story 1 (Phase 3)**: Depends only on Phase 1.
- **User Story 2 (Phase 4)**: Depends on User Story 1 (mounts the component before wiring its own events; also removes manager-side code that would otherwise silently duplicate/conflict with the new component-owned handling).
- **User Story 3 (Phase 5)**: Depends on User Story 2 (nothing to unbind in `onUnmounted` until T009's subscription exists).
- **Polish (Phase 6)**: Depends on all three user stories being complete.

### Within Each User Story

- Manager-side and component-side tasks within a story are ordered so the component change lands before the manager-side change that depends on it being ready (e.g., T004/T005 before validating T003's mount in T006; T007-T009 before T010 removes the old equivalent).
- Story complete before its checkpoint is considered met.

### Parallel Opportunities

- T015 and T016 in Polish can run in parallel (build vs. grep, no shared state).
- No other tasks are marked [P]: every implementation task in User Stories 1-3 edits one of the same two files (`manager.ts`, `menu.vue`) with a real ordering dependency on the task before it, unlike features whose stories touch disjoint files.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (baseline build).
2. Complete Phase 3: User Story 1 (mount `menu.vue`, fix rendering/close-on-select).
3. **STOP and VALIDATE**: Run T006 independently. Note that hotkey/arrow-key navigation will not work yet at this checkpoint (expected — see Phase 3's Checkpoint note); this MVP slice validates rendering correctness only, not full interaction parity.

### Incremental Delivery

1. Setup → baseline confirmed.
2. User Story 1 → menus render correctly via Vue; click-to-select-and-close works; validate (T006).
3. User Story 2 → hotkey/arrow-key parity restored, now component-owned; validate (T011).
4. User Story 3 → no handler leaks across repeated open/close; validate (T014).
5. Polish (T015-T017) → whole-feature build/grep/checklist pass.

### Parallel Team Strategy

Not well-suited to parallel work by multiple people: all three stories edit the same two files with real sequential dependencies (unlike this repo's other recent features, e.g. `#006`, whose stories touched disjoint files). A single implementer working P1 → P2 → P3 in order is the natural path here.

---

## Notes

- [P] tasks touch different files/concerns with no dependencies between them (only T015/T016 qualify here).
- [Story] label maps each task to its user story for traceability back to spec.md.
- No automated tests exist or are requested for this feature; T006/T011/T014/T017 are manual validation steps against quickstart.md, and T001/T015 are the only build/typecheck gates.
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently before continuing, but be aware User Stories 2 and 3 are prerequisites for full interaction parity, not optional enhancements — see this file's opening note.
