---

description: "Task list template for feature implementation"
---

# Tasks: Rehearsal Mark Properties Dialog

**Input**: Design documents from `/specs/025-rehearsal-mark-dialog/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/component-interfaces.md, quickstart.md

**Tests**: Not requested — this repo has no automated selection/render/dialog test runner wired up (`npm test` is a no-op placeholder, per plan.md's Technical Context). Verification is manual against `quickstart.md`, matching the established pattern (`020-annotation-drag-tool`, `023-text-drag-controls`, `024-all-landmarks-menu`).

**Organization**: Tasks are grouped by user story (spec.md). The tracker wiring (T002) is shared by both stories, so it sits in a Foundational phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Include exact file paths in descriptions

## Path Conventions

Single front-end project (per plan.md's Structure Decision). Paths are under `src/`.

---

## Phase 1: Setup

**Purpose**: Confirm a clean baseline before making changes

- [X] T001 Run `npm run build` to confirm the repo builds cleanly on the current branch before this feature's changes, so any later build failure can be attributed to this feature

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Make a rehearsal mark appear in the tracker's modifier list. Both user stories need it: mouse selection (US1) and keyboard cycling (US2) both read this list.

**⚠️ CRITICAL**: No user story work can be validated until this phase is complete

- [X] T002 In `src/render/sui/mapper.ts`, extend `_createLocalModifiersList()` (around lines 158-165, alongside the existing `SmoVolta` and `SmoTempo` blocks) with a block that pushes each `sel.measure.getModifiersByType('SmoRehearsalMark')` entry into `this.localModifiers` as `{ index, selection: sel, modifier: rm, box: rm.logicalBox ?? SvgBox.default }`, incrementing `index` (contracts/component-interfaces.md §1)

**Checkpoint**: A rehearsal mark appears in the tracker's modifier list whenever its measure is selected. Mouse hit-testing still requires T003.

---

## Phase 3: User Story 1 - Click a rehearsal mark to edit its properties (Priority: P1) 🎯 MVP

**Goal**: Clicking a rendered rehearsal mark opens a Vue properties dialog. The user can change symbol, numbering style, and auto-increment; changes update the score live; Cancel reverts; Remove deletes the mark.

**Independent Test**: Add a rehearsal mark, click its rendered glyph, confirm the dialog opens with current settings, edit a field, confirm the score updates, then Cancel and confirm it reverts.

### Implementation for User Story 1

- [X] T003 [US1] In `src/render/vex/vxSystem.ts`, add a per-system pass modeled on the existing Volta box pass (lines ~550-591). For each first-row measure with a rehearsal mark, set `rm.logicalBox = { x, y, width, height }`, where `x = smoMeasure.svg.staffX` and `width`/`height`/`y` replicate `StaveSection.draw()`'s formula (`node_modules/vexflow_smoosic/src/stavesection.ts` lines 54-83) for `rm.symbol` at `StaveSection.TEXT_FONT`. Use `TextFormatter` for the metrics (research.md §2, contracts §2)
- [X] T004 [US1] In `src/render/sui/scoreViewOperations.ts`, add `updateRehearsalMark(mark: SmoRehearsalMark): Promise<void>` and `removeRehearsalMark(mark: SmoRehearsalMark): Promise<void>`, modeled on `updateEnding`/`removeEnding` (lines ~1451-1480). Resolve the owning measure by searching `score` and `storeScore` for the measure whose `getRehearsalMark()?.attrs.id === mark.attrs.id`; return quietly if none is found. Apply the change to every staff, via `SmoOperation.removeRehearsalMark`/`addRehearsalMark` (`src/smo/xform/operations.ts` lines 739-750), and use an undo-buffer entry per method. Leave `toggleRehearsalMark()` unchanged (research.md §3-4, contracts §3)
- [X] T005 [P] [US1] Create `src/ui/dialogs/rehearsalMark.ts` with `SuiRehearsalMarkAdapter`, modeled on `SuiVoltaAdapter` in `src/ui/dialogs/volta.ts`. Include a `backup` copy taken at construction and getter/setter pairs for `symbol`, `cardinality`, and `increment` (not `position`). Each setter writes the field, awaits `view.updateRehearsalMark(mark)`, and sets `changed`. Implement `commit()`, `cancel()` (reverts via `updateRehearsalMark(backup)` if changed), and `remove()` (calls `view.removeRehearsalMark(mark)`) (contracts §4, data-model.md)
- [X] T006 [P] [US1] Create `src/ui/components/dialogs/rehearsalMark.vue`, modeled on `src/ui/components/dialogs/pedalMarking.vue`. Props: `domId`, `label` (`'Rehearsal Mark Properties'`), `initialPosition`, `symbol`, `cardinality`, `increment`, `updateFieldCb`. Controls: a text field for symbol, a select for cardinality (capitals / lowercase / numbers), and a checkbox for increment. Each change calls `updateFieldCb` immediately. No position control (contracts §7)
- [X] T007 [US1] Create `src/ui/dialogs/rehearsalMarkVue.ts` exporting `SuiRehearsalMarkDialogVue(parameters: SuiDialogParams)`, modeled on `src/ui/dialogs/pedalMarkingVue.ts`. It constructs `SuiRehearsalMarkAdapter(parameters.view, parameters.modifier)`, passes the fields plus `updateFieldCb` to `rehearsalMark.vue`, and wires commit/cancel/remove through `InstallDialog` (contracts §5). Depends on T005 and T006
- [X] T008 [US1] In `src/ui/dialogs/factory.ts`, add `'SmoRehearsalMark'` to `ModifiersWithDialogNames` (line ~41-42), add the `SuiRehearsalMarkDialogVue` import, and add an `else if (ctor === 'SmoRehearsalMark')` branch beside the `SmoVolta` branch (lines ~73-75) that calls `SuiRehearsalMarkDialogVue(parameters)` and returns `null` (contracts §6). Depends on T007
- [ ] T009 [US1] Manually validate `specs/025-rehearsal-mark-dialog/quickstart.md` Manual checks 2, 3, 4, and 5 (click opens dialog; live edits; cancel reverts; commit persists and undoes; remove deletes and undoes), and check 8 (no position control). Depends on T003, T004, T008
- [ ] T010 [US1] Manually validate `quickstart.md` Manual check 6 (a change made from one staff's mark is reflected on every staff at that measure), research.md §4. Depends on T009

**Checkpoint**: User Story 1 is fully functional. This is the MVP.

---

## Phase 4: User Story 2 - Reach a rehearsal mark without using the mouse (Priority: P2)

**Goal**: Keyboard modifier-cycling reaches a rehearsal mark and opens the same dialog.

**Independent Test**: Select a measure with a rehearsal mark and another modifier, cycle with the keyboard, and confirm the rehearsal mark is reached and its dialog opens on confirm.

### Implementation for User Story 2

- [ ] T011 [US2] Manually validate `quickstart.md` Manual check 7 (keyboard cycling reaches the rehearsal mark, and confirming opens the same dialog as clicking). Depends on T002 and T008. This story needs no new code beyond the shared tracker wiring (T002), because keyboard cycling reads `localModifiers` directly and does not depend on `logicalBox`.

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Confirm no regression and a clean build

- [ ] T012 [P] Manually validate `quickstart.md` Manual check 1 (creating and removing a mark via the "Rehearsal Letter" menu command is unchanged; no dialog opens from the menu) — FR-009 / SC-005
- [X] T013 Run `npm run build` and `npm run types` to confirm no TypeScript errors in `src/render/vex/vxSystem.ts`, `src/render/sui/mapper.ts`, `src/render/sui/scoreViewOperations.ts`, `src/ui/dialogs/rehearsalMark.ts`, `src/ui/dialogs/rehearsalMarkVue.ts`, `src/ui/dialogs/factory.ts`, and `src/ui/components/dialogs/rehearsalMark.vue`. Then run `git status` to confirm no unrelated files changed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS both user stories
- **User Story 1 (Phase 3)**: Depends on Foundational. T003 and T004 are independent of each other. T005 and T006 are parallel. T007 depends on T005 and T006. T008 depends on T007
- **User Story 2 (Phase 4)**: Depends on Foundational (T002) and on T008, because the dialog must exist for the keyboard path to open it. It has no new code of its own
- **Polish (Phase 5)**: Depends on Phases 3 and 4

### Within User Story 1

- T003 (render box) and T004 (view operations) can be done in parallel: different files.
- T005 (adapter) and T006 (Vue component) can be done in parallel: different files.
- T007 → T008 → T009 → T010 form a sequential validation chain.

### Parallel Opportunities

- T003 ∥ T004 ∥ T005 ∥ T006 (four different files, once T002 is done)
- T012 can run alongside T011

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1: Setup (T001)
2. Phase 2: Foundational (T002)
3. Phase 3: User Story 1 (T003-T008), then validate T009-T010
4. **STOP and VALIDATE**: a clicked rehearsal mark opens its dialog, edits are live, and Cancel and Remove work

### Incremental Delivery

1. Foundational lands the tracker wiring (keyboard reachability is then only a manual check away)
2. User Story 1 adds mouse click-to-edit (MVP)
3. User Story 2 is verification only, with no new code
4. Polish confirms no regression to creation and a clean build

---

## Notes

- **Manual validation status**: T009-T012 require driving a browser to click marks, edit fields, and check undo. They were **not** performed in this environment, which has no browser-driving tool. T001-T008 and T013 are complete: `npm run build` and `npm run types` both pass, and `git status` shows only the intended source changes plus the generated `types/` declarations. One deviation from research.md: `VF.StaveSection` is not on the VexFlow `Flow` namespace, so `StaveSection` and the VexFlow `TextFormatter` are exported from `src/common/vex.ts` (the project's vexflow import hub) and imported from there.
- [P] tasks: different files, no dependencies
- [Story] labels map each task to its user story
- No automated tests are added. Verification is manual via `quickstart.md`, matching this repo's convention for UI, selection, and dialog control flow
- `SmoRehearsalMark.position` is intentionally absent from the dialog (spec Assumptions). It is a known non-functional field, so do not add a control for it
- Commit after each task or logical group
