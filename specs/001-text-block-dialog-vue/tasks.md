---

description: "Task list template for feature implementation"
---

# Tasks: Vue-Based Text Properties Dialog

**Input**: Design documents from `/specs/001-text-block-dialog-vue/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/component-interfaces.md](./contracts/component-interfaces.md), [quickstart.md](./quickstart.md)

**Tests**: This project has no wired automated test runner (`npm test` is a no-op placeholder) and the feature spec does not request TDD. No automated test tasks are generated; each story instead ends with a manual validation task against `quickstart.md`.

**Organization**: Tasks are grouped by user story (from spec.md, priorities P1–P4) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Every task includes an exact file path

## Path Conventions

Single front-end project — all paths are under `src/ui/` (or `src/render/sui/` for reused, unmodified legacy code), per plan.md's Project Structure. No `backend/`/`frontend/` split, no new top-level directories.

---

## Phase 1: Setup

**Purpose**: Create the new source files as empty, correctly-typed scaffolding so later phases only fill in logic.

- [x] T001 [P] Create stub `src/ui/dialogs/textBlockVue.ts` exporting an empty `SuiTextBlockDialogVue(parameters: SuiDialogParams): void` function, matching the signature in [contracts/component-interfaces.md](./contracts/component-interfaces.md) §1
- [x] T002 [P] Create stub `src/ui/components/dialogs/textBlock.vue` (`<script setup lang="ts">`) declaring the `Props` interface from [contracts/component-interfaces.md](./contracts/component-interfaces.md) §2, with an empty `<template>`
- [x] T003 [P] Create stub `src/ui/components/dialogs/textDragger.vue` declaring the `Props`/`Emits`/`Expose` interfaces from [contracts/component-interfaces.md](./contracts/component-interfaces.md) §4, with an empty `<template>`

**Checkpoint**: New files exist and type-check with no logic yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared dialog scaffolding every user story depends on — the dialog can open/close and switch modes, but no story-specific control is wired yet.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Refactor `src/ui/components/dialogs/textGroupEditor.vue` into the embeddable contract: remove its `dialogContainer` wrapper, its own OK/Cancel buttons, and the `onSave`/`onCancel` props; change `Props` to `{ domId, textGroup }`; add `defineExpose({ getTextGroup, insertAtCursor })` — per [contracts/component-interfaces.md](./contracts/component-interfaces.md) §3 and [research.md](./research.md) §3
- [x] T005 In `src/ui/dialogs/textBlockVue.ts`, define `type DialogMode = 'idle' | 'editing' | 'moving'` and a `mode: Ref<DialogMode>` initialized per [data-model.md](./data-model.md)'s State Transition Summary (auto-`'editing'` when `modifier.edited === false`, else `'idle'`)
- [x] T006 In `src/ui/dialogs/textBlockVue.ts`, port the working-copy derivation logic from `SuiTextBlockDialog`'s constructor (`src/ui/dialogs/textBlock.ts:149-202`): new-vs-existing `SmoTextGroup` branching, `SmoTextGroup.deserializePreserveId`, `modifier.setActiveBlock(...)`, and `view.groupUndo(true)`
- [x] T007 In `src/ui/dialogs/textBlockVue.ts`, implement `commitCb`/`cancelCb`/`removeCb` (`view.updateTextGroup(modifier)` / revert rendered elements + `view.undo()` / `view.removeTextGroup(modifier)`, each closing the undo group via `view.groupUndo(false)`) and call `InstallDialog({ root, app: textBlockComp, appParams, dialogParams: parameters, commitCb, cancelCb, removeCb })` — per [research.md](./research.md) §7 and [contracts/component-interfaces.md](./contracts/component-interfaces.md) §1
- [x] T008 In `src/ui/components/dialogs/textBlock.vue`, build the `dialogContainer`-wrapped shell with `v-if`-gated sections for moving-only / editing-only / idle-controls per the Visibility contract in [contracts/component-interfaces.md](./contracts/component-interfaces.md) §2, passing `commitCb`/`cancelCb`/`removeCb` straight through to `dialogContainer`
- [x] T009 In `src/ui/dialogs/textBlockVue.ts`, bind `eventSource.bindMouseMoveHandler` / `bindMouseDownHandler` / `bindMouseUpHandler` / `bindMouseClickHandler`, delegating to whichever mode-specific control is active via a template ref, mirroring `SuiTextBlockDialog.mouseMove/mouseDown/mouseUp/mouseClick` (`src/ui/dialogs/textBlock.ts:406-425`)

**Checkpoint**: Dialog installs, opens, closes, commits, cancels, and removes generically; `mode` structurally enforces FR-008/FR-009/FR-010. Ready for stories to add real controls.

---

## Phase 3: User Story 1 - Edit score text content in a modern rich-text editor (Priority: P1) 🎯 MVP

**Goal**: Replace the legacy in-place SVG text editor with the embedded `TextGroupEditor`, auto-starting an edit session on first open, with working OK/Cancel and Insert Special.

**Independent Test**: Open Text Properties on an existing (or new) text item, confirm the rich-text editor appears pre-loaded and active, type/format text, click OK, and confirm the score updates as the legacy dialog would; verify Cancel discards all changes.

### Implementation for User Story 1

- [x] T010 [P] [US1] Embed the refactored `TextGroupEditor` (`textGroupEditor.vue`) into `src/ui/components/dialogs/textBlock.vue`'s editing-mode section, bound via `:textGroup="modifier"` and a template ref for calling `getTextGroup()`/`insertAtCursor()`
- [x] T011 [US1] In `src/ui/dialogs/textBlockVue.ts`, implement auto-start-editing on first open (FR-014): when `mode` initializes to `'editing'` (T005), set `modifier.edited = true` immediately, matching `SuiTextBlockDialog.display()`'s `if (!this.modifier.edited) { this.modifier.edited = true; ...startEditSession(); }` (`src/ui/dialogs/textBlock.ts:250-254`) — per [data-model.md](./data-model.md) §6
- [x] T012 [P] [US1] Add an "Edit Text" idle-mode control and a "Done Editing Text" editing-mode control (labels from `SuiTextBlockDialog.dialogElements.staticText`, `src/ui/dialogs/textBlock.ts:131-135`) in `textBlock.vue`, toggling `mode` between `'idle'` and `'editing'`
- [x] T013 [US1] On exiting editing mode (Done Editing Text, or OK clicked while still editing), call the embedded `TextGroupEditor` ref's `getTextGroup()` and write the result back into `modifier.value`, then refresh `activeScoreText`/`fontInfo` per [data-model.md](./data-model.md)
- [x] T014 [P] [US1] Add an Insert Special dropdown using `select.vue` in `textBlock.vue`'s editing-mode section, with options `{ '@@@': 'Pages', '###': 'Page Number' }` from `SuiTextBlockDialog.dialogElements` (`src/ui/dialogs/textBlock.ts:74-77`), forwarding the selected token to the embedded editor's `insertAtCursor(token)`
- [x] T015 [US1] In `src/ui/dialogs/textBlockVue.ts`'s `cancelCb`, discard content edits: clear `modifier.elements` (unrendering each), call `view.undo()` when the dialog-level `edited` flag is set — matching `SuiTextBlockDialog`'s cancel handler (`src/ui/dialogs/textBlock.ts:468-477`)
- [ ] T016 [US1] Manually validate against [quickstart.md](./quickstart.md) §1 (auto-open into edit mode; format text and OK; edit and Cancel-reverts)

**Checkpoint**: User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Reposition text by dragging it on the score (Priority: P2)

**Goal**: Move-text mode shows only the stop-dragging control and reuses the existing `SuiDragSession` mouse-driven canvas logic behind a Vue shell.

**Independent Test**: Open Text Properties on an existing text item, activate "Move Text", confirm only the stop-dragging control is visible, drag to a new location, stop dragging, and confirm the X/Y fields reflect the new location.

### Implementation for User Story 2

- [x] T017 [P] [US2] Implement `src/ui/components/dialogs/textDragger.vue` internals: construct a `SuiDragSession` (`src/render/sui/textEdit.ts`) on `start`, tear it down on `stop`, and expose `mouseDown`/`mouseMove`/`mouseUp` — mirroring `SuiDragText.startEditSession`/`stopEditSession` (`src/ui/dialogs/components/dragText.ts:45-69`), per [contracts/component-interfaces.md](./contracts/component-interfaces.md) §4 and [research.md](./research.md) §4
- [x] T018 [US2] Add a "Move Text" idle-mode control in `textBlock.vue` that mounts `textDragger.vue` (showing only "Done Dragging Text" while running) in the moving-mode section, toggling `mode` between `'idle'` and `'moving'`
- [x] T019 [US2] In `src/ui/dialogs/textBlockVue.ts`, delegate the mouse handlers from T009 into the mounted `textDragger` ref's exposed methods while `mode === 'moving'`
- [x] T020 [US2] On "Done Dragging Text", refresh the `xPosition`/`yPosition` refs from `modifier.value.ul()` and return `mode` to `'idle'`
- [ ] T021 [US2] Manually validate against [quickstart.md](./quickstart.md) §2 and §5 (moving hides all but stop-control; stop reveals updated X/Y; Cancel-after-drag reverts position)

**Checkpoint**: User Stories 1 and 2 are both independently functional.

---

## Phase 5: User Story 3 - Fine-tune position and font with precise controls (Priority: P3)

**Goal**: Idle-mode numeric X/Y steppers and a font picker, both committing only on OK.

**Independent Test**: Open Text Properties on an existing text item (idle mode), change X or Y via the numeric stepper, change the font via the font picker, click OK, and confirm the text re-renders at the new position with the new font.

### Implementation for User Story 3

- [x] T022 [P] [US3] Add an X Position control using `numberInput.vue` in `textBlock.vue`'s idle-mode section, bound to an `xPosition` ref, calling `modifier.value.offsetX(newX - pos.x)` on change — mirrors `src/ui/dialogs/textBlock.ts:322-323`
- [x] T023 [P] [US3] Add a Y Position control using `numberInput.vue` in `textBlock.vue`'s idle-mode section, bound to a `yPosition` ref, calling `modifier.value.offsetY(newY - pos.y)` on change — mirrors `src/ui/dialogs/textBlock.ts:325-326`
- [x] T024 [P] [US3] Add a font control using `fontPicker.vue` in `textBlock.vue`'s idle-mode section, bound to `activeScoreText.fontInfo`, writing `family`/`size`/`weight`/`style` back on change — mirrors `src/ui/dialogs/textBlock.ts:340-347`
- [ ] T025 [US3] Manually validate against [quickstart.md](./quickstart.md) §3 (X/Y steppers and font family/size/weight/style all apply on OK)

**Checkpoint**: User Stories 1-3 are all independently functional.

---

## Phase 6: User Story 4 - Configure page behavior and score attachment (Priority: P4)

**Goal**: Idle-mode Page Behavior dropdown and Attach to Selection checkbox, with their existing mutual-exclusivity rule preserved.

**Independent Test**: Open Text Properties, change Page Behavior via the dropdown, toggle Attach to Selection, click OK, and confirm the settings persisted (including the pagination-reset-to-Once side effect).

### Implementation for User Story 4

- [x] T026 [P] [US4] Add a Page Behavior dropdown using `select.vue` in `textBlock.vue`'s idle-mode section, with options Once/Every/Odd/Subsequent from `SmoTextGroup.paginations` (`src/ui/dialogs/textBlock.ts:120-124`), bound to a `pagination` ref
- [x] T027 [P] [US4] Add an Attach to Selection checkbox (styled like `fontPicker.vue`'s bold/italic checkboxes, `src/ui/components/dialogs/fontPicker.vue:82-87`) in `textBlock.vue`'s idle-mode section, bound to an `attachToSelector` ref
- [x] T028 [US4] Implement the two-way exclusivity watchers in `src/ui/dialogs/textBlockVue.ts`: activating attach-to-selection forces `pagination` to `ONCE` and sets `modifier.selector`/`musicXOffset`/`musicYOffset`; choosing any pagination value resets attach-to-selection off — mirroring `_activateAttachToSelector`/`_resetAttachToSelector` (`src/ui/dialogs/textBlock.ts:273-286`), per [research.md](./research.md) §8
- [x] T029 [US4] Wire `commitCb` (T007) to persist the `pagination`/`attachToSelector` refs onto `modifier.value` before `view.updateTextGroup` runs
- [ ] T030 [US4] Manually validate against [quickstart.md](./quickstart.md) §4 (pagination choice persists; enabling attach-to-selection forces Page Behavior to Once)

**Checkpoint**: All four user stories are independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verify remove-control behavior, confirm the legacy-free success criterion, and run the end-to-end regression pass.

- [x] T031 [P] Verify the Remove control (`removeCb` from T007) unrenders and deletes the text item regardless of `mode` (idle, editing, or moving) per [quickstart.md](./quickstart.md) §6 (FR-013, spec Edge Case)
- [x] T032 [P] Audit `src/ui/components/dialogs/textBlock.vue`, `src/ui/components/dialogs/textDragger.vue`, and `src/ui/dialogs/textBlockVue.ts` to confirm none import the legacy `SuiComponentBase`-derived classes (`SuiTextInPlace`, `SuiDropdownComponent`, `SuiRockerComponent`, `SuiFontComponent`, `SuiToggleComponent`, `SuiTextBlockComponent`) — confirms SC-002
- [x] T033 Run `npm run build` and fix any TypeScript errors introduced by the new/changed files
- [ ] T034 Temporarily wire `SuiTextBlockDialogVue` into a real call site (see [quickstart.md](./quickstart.md) Prerequisites), run the full quickstart.md validation pass end-to-end via `npm run server`, then revert the temporary wiring (do not commit the swap) — confirms SC-001, SC-003, SC-004
- [ ] T035 [P] Perform the regression-diff check from [quickstart.md](./quickstart.md) "Regression check against the legacy dialog": compare `SmoTextGroup.serialize()` output between the legacy and new dialog for an equivalent edit sequence

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - Structurally independent of each other (each adds controls to distinct sections of `textBlock.vue`'s idle/editing/moving regions), but are listed in priority order (P1 → P2 → P3 → P4) since they share the same two files (`textBlockVue.ts`, `textBlock.vue`) and editing them concurrently risks merge conflicts
- **Polish (Phase 7)**: Depends on all four user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependency on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) — no dependency on US1's controls, but shares files with US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) — no dependency on US1/US2
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) — no dependency on US1/US2/US3

### Within Each User Story

- Story-specific control components before the wiring that binds them into `textBlock.vue`
- Wiring before the manual validation task
- Story complete before moving to next priority (recommended sequencing, since US1-US4 share `textBlock.vue`/`textBlockVue.ts`)

### Parallel Opportunities

- T001-T003 (Setup) can all run in parallel — three independent new files
- T010, T012, T014 (US1) touch different concerns within the same file; treat as parallel-safe only if coordinated by a single editor of `textBlock.vue`, otherwise do sequentially
- T022, T023, T024 (US3) are independent controls and can be done in parallel by different contributors coordinating on `textBlock.vue`
- T026, T027 (US4) are independent controls and can be done in parallel
- T031, T032, T035 (Polish) are independent verification passes and can run in parallel

---

## Parallel Example: Setup

```bash
Task: "Create stub src/ui/dialogs/textBlockVue.ts exporting SuiTextBlockDialogVue"
Task: "Create stub src/ui/components/dialogs/textBlock.vue with Props interface"
Task: "Create stub src/ui/components/dialogs/textDragger.vue with Props/Emits/Expose"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run quickstart.md §1 independently
5. This alone delivers FR-001, FR-002 (partially), FR-005, FR-009, FR-011, FR-012, FR-014 — the highest-risk part of the migration (SuiTextInPlace replacement)

### Incremental Delivery

1. Setup + Foundational → dialog shell ready
2. Add User Story 1 → validate independently (MVP: rich-text editing works end-to-end)
3. Add User Story 2 → validate independently (drag reposition works, still doesn't regress US1)
4. Add User Story 3 → validate independently (precise X/Y/font controls work)
5. Add User Story 4 → validate independently (pagination/attach-to-selection work)
6. Phase 7: Polish — confirm SC-002 (no legacy component classes), run full quickstart.md, regression-diff against `SuiTextBlockDialog`

### Notes

- `SuiTextBlockDialog` (`src/ui/dialogs/textBlock.ts`) and its call sites are never modified by any task above — the swap-in during T034 is explicitly temporary and reverted before completion, per the spec's scope boundary.
- No task introduces a new dependency; `vue`, `@tiptap/*` are already present (used by the existing, currently-unwired `textGroupEditor.vue`).

## Implementation Notes (as executed)

**Design deviations from the task text, decided during implementation for correctness/simplicity — code is authoritative over these task descriptions:**

- **State ownership**: `mode`, `xPosition`, `yPosition`, `fontInfo`, `pagination`, and `attachToSelector` ended up owned inside `textBlock.vue` itself (as local refs derived from the `modifier` prop), not in `textBlockVue.ts` as T005 originally sketched. This mirrors how `timeSignature.vue` owns its own UI-derived refs (`applyTo`, `isCompound`, `display`) rather than receiving them from `timeSignature.ts` — `textBlockVue.ts` stays a thin creation function (working-copy derivation, undo grouping, commit/cancel/remove), matching the established pattern more closely than the original task split.
- **Drag mouse handling (T009/T019)**: `textDragger.vue` binds its own `window` mousedown/mousemove/mouseup listeners directly, scoped to its own `start()`/`stop()` lifecycle, instead of routing through `parameters.eventSource` from `textBlockVue.ts`. Reason found during implementation: `InstallDialog` (`src/ui/dialogs/dialog.ts`) doesn't hand back the mounted component instance, so there was no non-invasive way to bridge `eventSource`-bound handlers in the `.ts` file into a child component ref without changing shared dialog infrastructure used by every other Vue dialog. Self-contained window listeners, scoped to the lifetime of an active drag session, avoid that entirely. Text editing needs no such bridge at all: TipTap (`TextGroupEditor`) is a real `contenteditable` DOM component that handles its own mouse/keyboard events natively, unlike the legacy SVG-rendered typing editor that needed manual event routing.
- **`fontPicker.vue` and `textGroupEditor.vue` had no callers before this feature.** `fontPicker.vue` in particular had no output mechanism at all (no emit, no callback prop — changes to its internal `fontCopy` state went nowhere). Fixed as part of T024 by adding an optional `changeCb` prop and a `watch(() => props.font, ...)` resync, since FR-006 requires it to actually drive the active text block's font.
- **Verification performed**: `npm run build` (T033) was run twice with `SuiTextBlockDialogVue` temporarily wired into `src/ui/menus/text.ts`'s `textBlockDialogMenuOption` (the same call site `SuiTextBlockDialog` uses today) so `ts-loader` would actually type-check the new files — they aren't reachable from the build's entry point otherwise. Both runs compiled cleanly; the temporary wiring was reverted (`git checkout`) immediately after each check and is not part of the final diff.
- **Not performed**: T016, T021, T025, T030, T034, T035 all require driving the dialog in a live browser (dragging text on an actual canvas, clicking through OK/Cancel/Insert-Special, diffing rendered output). No browser/UI-automation tool was available in this session to do that safely, so these remain unchecked rather than being marked done on the strength of code review alone. A human (or a future session with browser access) should run through [quickstart.md](./quickstart.md) using the same temporary-wiring approach described in its Prerequisites before treating this feature as verified end-to-end.
