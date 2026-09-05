---

description: "Task list template for feature implementation"
---

# Tasks: Anchor Menus to Triggering Button

**Input**: Design documents from `/specs/008-anchor-menu-to-button/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)

**Tests**: Not requested. Per the project constitution, UI-only rendering/positioning changes are validated manually (see quickstart.md); no automated test tasks are included.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every description

## Phase 1: Setup

**Purpose**: Establish a clean baseline before making changes

- [X] T001 Confirm the project currently builds cleanly (`npm run build`) before making any changes, as a baseline to compare against after implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared signature changes that every user story below depends on

**⚠️ CRITICAL**: Both user stories (and the fallback story) depend on this phase being complete first

- [X] T002 Update the `ButtonCallback` type in `src/ui/buttons/button.ts` to `(button: ButtonDefinition, elementId?: string) => Promise<void>`, and update its adjacent doc comment to mention the new optional `elementId` parameter
- [X] T003 Update `SuiMenuManager.createMenu` in `src/ui/menus/manager.ts` to accept an optional third parameter `anchor?: SvgPoint` (import `SvgPoint` from `../../smo/data/common`); when `anchor` is supplied, set `this.menuPosition = { x: anchor.x, y: anchor.y, width: 1, height: 1 }`, otherwise keep the existing default `{ x: 250, y: 40, width: 1, height: 1 }`

**Checkpoint**: `createMenu` can now be positioned by callers; button callbacks can now carry an element id. User story implementation can begin.

---

## Phase 3: User Story 1 - Menu opens next to the ribbon button that triggered it (Priority: P1) 🎯 MVP

**Goal**: Buttons routed through `RibbonButtons.executeButton` (action `menu` or `collapseChildMenu`) open their menu anchored to the top-right corner of the clicked element.

**Independent Test**: Click a menu-producing button whose action is `menu`/`collapseChildMenu` and confirm the menu appears anchored at that button's top-right corner instead of the old fixed default position.

### Implementation for User Story 1

- [X] T004 [US1] In `src/ui/buttons/ribbon.ts`, add a private method `resolveTopRightAnchor(elementId?: string): SvgPoint | undefined` on `RibbonButtons` that: returns `undefined` if `elementId` is falsy; strips a leading `#` from `elementId`; looks the element up with `document.getElementById`; returns `undefined` if not found; otherwise returns `{ x: rect.right, y: rect.top }` from `element.getBoundingClientRect()`
- [X] T005 [US1] Update `executeButton(buttonElement, buttonData)` in `src/ui/buttons/ribbon.ts` so that when `buttonData.action === 'menu' || buttonData.action === 'collapseChildMenu'`, it computes `const anchor = this.resolveTopRightAnchor(buttonElement);` and calls `await this.menus.createMenu(buttonData.ctor, this.controller, anchor);` (depends on T003, T004)
- [X] T006 [US1] Update the `executeButton` wrapper closure inside `createSidebarMenuHtml` in `src/ui/buttons/ribbon.ts` to accept a second `elementId?: string` parameter and forward it: `async (buttonData: ButtonDefinition, elementId?: string) => { await this.executeButton(elementId ?? buttonData.id, buttonData); }` (depends on T002)
- [X] T007 [US1] Update the `onClick` handler in `src/ui/components/buttons/menuButtons.vue` to call `buttonProps.callback!(buttonProps, getId(buttonProps.id))`, passing the actual rendered element id (depends on T006)

**Checkpoint**: User Story 1 is fully functional and independently testable — sidebar/menu buttons anchor their menus to their own top-right corner.

---

## Phase 4: User Story 2 - Quick-action buttons open their menu near the clicked control (Priority: P2)

**Goal**: Buttons routed through `RibbonButtons.executeQuickButton` that result in a menu open it anchored to the bottom-left corner of the clicked control.

**Independent Test**: Trigger a quick-access button that results in a menu (e.g. "select part") and confirm the menu appears anchored at that control's bottom-left corner.

### Implementation for User Story 2

- [X] T008 [US2] In `src/ui/buttons/ribbon.ts`, add a private method `resolveBottomLeftAnchor(elementId?: string): SvgPoint | undefined` on `RibbonButtons`, mirroring T004's null-safety, but returning `{ x: rect.left, y: rect.bottom }` from `getBoundingClientRect()`
- [X] T009 [US2] Update `executeQuickButton` in `src/ui/buttons/ribbon.ts` to accept a second parameter `elementId?: string`; in the `selectPart` branch, compute `const anchor = this.resolveBottomLeftAnchor(elementId);` and pass it into the existing call: `this.menus.createMenu('SuiPartSelectionMenu', this.controller, anchor);` (depends on T003, T008)
- [X] T010 [US2] Update the `buttonCallback` wrapper inside `createRibbonHtml` in `src/ui/buttons/ribbon.ts` to accept a second `elementId?: string` parameter and forward it: `async (button: ButtonDefinition, elementId?: string) => { return await this.executeQuickButton(button, elementId); }` (depends on T002)
- [X] T011 [US2] Update the click handler in `src/ui/components/buttons/ribbonButtons.vue` to call `buttonProps.callback(buttonProps, getId(buttonProps.id))`, passing the actual rendered element id (depends on T010)

**Checkpoint**: User Stories 1 and 2 both work independently — every menu-producing button path now anchors correctly.

---

## Phase 5: User Story 3 - Menus without a known trigger element still open correctly (Priority: P3)

**Goal**: When no triggering element can be resolved (e.g. keyboard-shortcut-driven menu opens), the menu keeps opening at the existing default position with no errors.

**Independent Test**: Trigger a menu through a path with no associated triggering element (e.g. an Alt+hotkey binding) and confirm it still opens at the same default position as before this feature.

### Implementation for User Story 3

- [X] T012 [US3] Review `handleKeyDown` in `src/ui/buttons/ribbon.ts`, which calls `this.executeButton(element, keyButton)` with `element = '#' + keyButton.id`; confirm this flows safely into `resolveTopRightAnchor` (T004)'s `#`-stripping and returns `undefined` when the element isn't currently rendered, with no exception thrown (depends on T004, T005)
- [ ] T013 [US3] Manually validate Scenario 3 in `specs/008-anchor-menu-to-button/quickstart.md`: trigger a menu with no resolvable element and confirm it opens at the existing default position (`{x: 250, y: 40}`) with no browser console errors

**Checkpoint**: All user stories are independently functional; no regression for callers that don't supply a triggering element.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and final validation across all stories

- [X] T014 [P] Update the JSDoc comments on `ButtonDefinition`/`ButtonCallback` in `src/ui/buttons/button.ts` and on `createMenu` in `src/ui/menus/manager.ts` to document the new optional `elementId`/`anchor` parameters
- [ ] T015 Run full manual validation of `specs/008-anchor-menu-to-button/quickstart.md` Scenarios 1–4 end-to-end in a browser
- [X] T016 Run `npm run build` to confirm no TypeScript errors after all changes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (T002, T003 must land before any of T004–T013)
- **User Story 1 (Phase 3)**: Depends on Foundational only
- **User Story 2 (Phase 4)**: Depends on Foundational only — independent of User Story 1 (different branch of `executeQuickButton` vs. `executeButton`; only shares T002/T003)
- **User Story 3 (Phase 5)**: Depends on Foundational and on T004/T005 from User Story 1 (it reviews the same `resolveTopRightAnchor`/`executeButton` path that `handleKeyDown` already uses)
- **Polish (Phase 6)**: Depends on all three user stories being complete

### Within Each User Story

- Helper method (T004/T008) before the function that calls it (T005/T009)
- Ribbon-side wrapper update (T006/T010) before the Vue template update that relies on the new parameter being accepted (T007/T011)

### Parallel Opportunities

- T002 and T003 (Phase 2) touch different files (`button.ts` vs `manager.ts`) and can be done in parallel
- User Story 1 (Phase 3) and User Story 2 (Phase 4) touch largely disjoint logic and can be implemented in parallel by different people once Phase 2 is done, though both edit `src/ui/buttons/ribbon.ts` so should be merged carefully rather than edited simultaneously by automation
- T014 (doc comments) can be done in parallel with T015/T016 (manual/build validation)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks everything else)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Manually confirm sidebar/menu buttons anchor correctly (quickstart Scenario 1)

### Incremental Delivery

1. Setup + Foundational → shared plumbing ready
2. User Story 1 → validate → this alone already delivers the most common menu-positioning improvement
3. User Story 2 → validate → quick-action buttons now anchor too
4. User Story 3 → validate → fallback confirmed safe, no regressions
5. Polish → doc comments, full quickstart pass, build check
