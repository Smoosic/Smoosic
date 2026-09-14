---

description: "Task list for Sidebar Menu Submenus (016-menu-submenus)"
---

# Tasks: Sidebar Menu Submenus

**Input**: Design documents from `specs/016-menu-submenus/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/submenu-option.md](./contracts/submenu-option.md), [quickstart.md](./quickstart.md)

**Tests**: Not included - the feature spec did not request tests, and per the project constitution UI rendering regression is a lower priority in this repo (no automated UI test harness exists). Validation is manual via `quickstart.md`, run in the Polish phase below.

**Organization**: Tasks are grouped by user story per `spec.md` (US1 = P1 "choose an arpeggio style from a submenu", US2 = P2 "any sidebar menu choice can open another menu").

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no unmet dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2) - omitted for Foundational/Polish tasks
- File paths are relative to the repository root

## Path Conventions

Single project. All paths are under `src/ui/menus/`, `src/ui/components/menus/`, `src/ui/dialogs/`, `src/ui/components/dialogs/`, and `src/application/`, per [plan.md](./plan.md)'s Project Structure section.

---

## Phase 1: Setup

No setup tasks are required. This feature extends existing modules (`src/ui/menus/menu.ts`, `src/ui/components/menus/menu.vue`, `src/ui/menus/note.ts`) with no new dependencies, build configuration, or scaffolding.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the generic submenu mechanism that both User Story 1 (arpeggio submenu) and User Story 2 (reusability) depend on. No user story is testable until this phase is done.

**CRITICAL**: Both user stories require this phase complete first.

- [X] T001 Add an optional `subMenu?: SuiConfiguredMenuOption[]` field to the `SuiConfiguredMenuOption` interface in `src/ui/menus/menu.ts` (see [contracts/submenu-option.md](./contracts/submenu-option.md) for the exact shape and behavioral contract). Add a short doc comment on the field, matching the existing `@category SuiMenu` docblock style already used for other exported interfaces in this file.

- [X] T002 In `src/ui/components/menus/menu.vue`, convert the currently-static `menuItems` (computed once from `props.menuStructure.menuOptions` at setup) into reactive state (e.g. a `ref<SuiConfiguredMenuOption[]>`), and factor the existing "filter by `display`, assign hotkeys, set initial focus" logic (lines ~12-17 and the `onMounted` focus-setting at the end of the file) into a reusable function that can be re-run whenever the displayed item list changes, without altering current visible behavior for menus that don't use `subMenu`. Depends on: T001.

- [X] T003 In `src/ui/components/menus/menu.vue`'s `selectItem`, add the submenu branch described in [contracts/submenu-option.md](./contracts/submenu-option.md) rule 2: if the chosen `SuiConfiguredMenuOption` has a non-empty `subMenu`, replace the reactive item list from T002 with `subMenu` (re-running the hotkey/focus helper) and return without calling `option.handler` or `props.menuStructure.complete()`. If `subMenu` is absent or empty, keep the existing `handler` + `complete()` behavior unchanged. Depends on: T002.

**Checkpoint**: The submenu mechanism works generically for any `SuiConfiguredMenuOption` in any menu - both user stories can now be built.

---

## Phase 3: User Story 1 - Choose an arpeggio style from a submenu (Priority: P1) - MVP

**Goal**: Selecting "Arpeggio" in the Notes menu opens a submenu of the 8 arpeggio styles instead of the `SuiArpeggioDialog` dropdown; picking one applies it immediately.

**Independent Test**: Select a note, open the Notes menu, choose "Arpeggio", pick a style from the submenu, and confirm the note renders with that style and no dialog box ever appeared (see [quickstart.md](./quickstart.md) Scenarios 1-3).

### Implementation for User Story 1

- [X] T004 [P] [US1] In `src/ui/menus/note.ts`, create an array of 8 `SuiConfiguredMenuOption` entries - one per `SmoArpeggioType` (`directionless`/"Plain", `rasquedo_up`, `rasquedo_down`, `roll_up`, `roll_down`, `brush_up`, `brush_down`, `none`) per the label table in [data-model.md](./data-model.md). Each entry's `handler` calls `await menu.view.addRemoveArpeggio(value)` (see `src/render/sui/scoreViewOperations.ts:278`) with its own `SmoArpeggioType`, `display` returns `true`, and `menuChoice.value` is the style's type string. Depends on: T001.

- [X] T005 [US1] In `src/ui/menus/note.ts`, set `arpeggioMenuOption.subMenu` to the array built in T004, and remove the old `handler` body that constructed and opened `SuiArpeggioDialog` (keep `arpeggioMenuOption.menuChoice` - icon, text, value - unchanged so the Notes menu row itself looks the same). Depends on: T004, T003.

- [X] T006 [US1] Remove the now-unused `import { SuiArpeggioDialog } from '../dialogs/arpeggio';` line from `src/ui/menus/note.ts`. Depends on: T005.

- [X] T007 [P] [US1] In `src/application/exports.ts`, remove the `import { SuiArpeggioDialog } from '../ui/dialogs/arpeggio';` line, its entry in the export list, and the `export * from '../ui/dialogs/arpeggio';` re-export line.

- [X] T008 [P] [US1] In `src/ui/dialogs/factory.ts`, remove the commented-out `// DialogTranslations.push(suiDialogTranslate(SuiArpeggioDialog.dialogElements, 'SuiArpeggioDialog'));` line.

- [X] T009 [P] [US1] Delete `src/ui/dialogs/arpeggio.ts` - superseded by the submenu built in T004-T005. Depends on: T006, T007, T008.

- [X] T010 [P] [US1] Delete `src/ui/components/dialogs/arpeggio.vue` - superseded by the submenu built in T004-T005. Depends on: T006, T007, T008.

**Checkpoint**: User Story 1 is fully functional and independently testable - run [quickstart.md](./quickstart.md) Scenarios 1-3.

---

## Phase 4: User Story 2 - Any sidebar menu choice can open another menu (Priority: P2)

**Goal**: Confirm the `subMenu` mechanism added in Phase 2 is genuinely reusable - no arpeggio-specific coupling in the framework - so another menu choice could adopt it later with no changes to `menu.ts`/`menu.vue`.

**Independent Test**: Inspect `src/ui/components/menus/menu.vue` and `src/ui/menus/menu.ts` and confirm the submenu branch added in T002/T003 references only the generic `subMenu` field, never anything arpeggio-specific (see [quickstart.md](./quickstart.md) Scenario 4).

### Implementation for User Story 2

- [X] T011 [US2] Review the T002/T003 changes in `src/ui/components/menus/menu.vue` and confirm (refactor if needed) that the submenu-swap branch is generic: it reads only `option.subMenu` / `option.display` / `option.menuChoice`, with no reference to arpeggio, `SmoArpeggioType`, or `src/ui/menus/note.ts`. Depends on: T003.

- [X] T012 [US2] Add a short doc comment to the `subMenu` field on `SuiConfiguredMenuOption` in `src/ui/menus/menu.ts` (from T001) explaining the behavioral contract, so another menu (Measure, Part, Beam, etc.) can add its own submenu by setting the field alone. Depends on: T001.

**Checkpoint**: All user stories are independently functional. SC-003 (reusable without extra custom UI code) is satisfied structurally by T001-T003 and confirmed by T011.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T013 [P] Run [quickstart.md](./quickstart.md) Scenarios 1-3 against a running build to validate User Story 1 end-to-end.
- [X] T014 [P] Run the [quickstart.md](./quickstart.md) Regression check: open a Notes menu choice that has no submenu (e.g. "Head and Stem") and confirm its dialog still opens exactly as before.
- [X] T015 Search the repository for any remaining references to `SuiArpeggioDialog` or `arpeggio.vue` under `src/` (e.g. `grep -r SuiArpeggioDialog src`) to confirm full removal after T006-T010.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: None - no tasks.
- **Foundational (Phase 2)**: No dependencies beyond Setup - BLOCKS both user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational (T001, T003) - independently testable once done.
- **User Story 2 (Phase 4)**: Depends on Foundational (T001, T003) - independent of User Story 1's note.ts/dialog-removal work, can proceed in parallel with Phase 3.
- **Polish (Phase 5)**: Depends on Phase 3 (T013, T014 validate US1) and Phase 3's file deletions (T015 checks their completeness).

### Within Foundational

T001 -> T002 -> T003 (same-area sequential: type field, then reactive refactor, then the branch that uses it).

### Within User Story 1

T004 (needs T001, T003) -> T005 -> T006; T007 and T008 are independent of T004-T006 (different files) but must complete, along with T006, before T009/T010 delete the dialog files.

### Within User Story 2

T011 depends on T003; T012 depends on T001. T011 and T012 do not depend on each other.

---

## Parallel Example: Foundational -> User Story 1

```bash
# After T001-T003 (Foundational) are done:
Task: "Create arpeggio submenu options array in src/ui/menus/note.ts"      # T004
Task: "Remove SuiArpeggioDialog import/export in src/application/exports.ts"  # T007
Task: "Remove commented registration line in src/ui/dialogs/factory.ts"       # T008

# After T004-T008 are all done:
Task: "Delete src/ui/dialogs/arpeggio.ts"              # T009
Task: "Delete src/ui/components/dialogs/arpeggio.vue"   # T010
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001-T003) - required, not optional, since US1 needs the submenu mechanism to exist at all.
2. Complete Phase 3: User Story 1 (T004-T010).
3. **STOP and VALIDATE**: Run quickstart.md Scenarios 1-3 (T013) and the regression check (T014).
4. This is the MVP - it fully delivers the user-visible request (arpeggio submenu replacing the dialog).

### Incremental Delivery

1. Foundational (Phase 2) -> mechanism ready, nothing user-visible changes yet.
2. User Story 1 (Phase 3) -> arpeggio submenu ships; validate independently (MVP).
3. User Story 2 (Phase 4) -> confirms/documents reusability; can be done in parallel with Phase 3 since it touches different aspects of the same Foundational code, or immediately after.
4. Polish (Phase 5) -> final manual validation and cleanup confirmation.
