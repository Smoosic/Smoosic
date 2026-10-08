---

description: "Task list template for feature implementation"
---

# Tasks: Text Editor Autofocus on Open

**Input**: Design documents from `/specs/014-editor-autofocus/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)

**Tests**: This project has no wired automated test runner (`npm test` is a no-op placeholder) and the feature spec does not request TDD. No automated test tasks are generated; each story ends with a manual validation task against `quickstart.md`.

**Organization**: Tasks are grouped by user story (from spec.md, priorities P1–P2) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Every task includes an exact file path

## Path Conventions

Single front-end project — all paths are under `src/ui/components/dialogs/`, per plan.md's Project Structure. No new files or top-level directories.

---

## Phase 1: Setup

**Purpose**: N/A — this feature modifies three existing components in place; there is no new file, dependency, or scaffolding to set up (research.md §2/§3 already confirmed `autofocus`/`onCreate` are available in the installed `@tiptap/core` version).

*(No tasks in this phase.)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: N/A — there is no shared infrastructure separate from the per-component changes themselves; each of the three files in User Story 1 is independent of the others and independent of any prior setup.

*(No tasks in this phase — proceed directly to User Story 1.)*

---

## Phase 3: User Story 1 - Start typing immediately when a dialog opens directly into editing (Priority: P1) 🎯 MVP

**Goal**: Add automatic focus-on-construction to each of the three TipTap editor components, so typing works immediately without a prior click whenever a dialog opens directly into its editing view.

**Independent Test**: Open the Lyric Editor on a note with no lyric, the Chord Symbol dialog on a note with no chord symbol, and the Score Text dialog for a brand-new text block; in each case, without clicking, type a character and confirm it lands in the respective editor.

### Implementation for User Story 1

- [X] T001 [P] [US1] In `src/ui/components/dialogs/lyricEditor.vue`, add `autofocus: 'end'` to the `useEditor({...})` options object — per [research.md](./research.md) §2, FR-001
- [X] T002 [P] [US1] In `src/ui/components/dialogs/chordEditor.vue`, add `autofocus: 'end'` to the `useEditor({...})` options object — per [research.md](./research.md) §2, FR-002
- [X] T003 [P] [US1] In `src/ui/components/dialogs/textGroupEditor.vue`, add `onCreate: ({ editor }) => editor.commands.focus()` to the `useEditor({...})` options object, mirroring the existing `activateBlock()` focus-after-content-change call — per [research.md](./research.md) §3, FR-003
- [ ] T004 [US1] Manually validate against [quickstart.md](./quickstart.md) §1-§3 (Lyric Editor, Chord Symbol, and Score Text dialogs each place focus in their editor on open, with existing content unselected)

**Checkpoint**: User Story 1 is fully functional and independently testable — this is the MVP.

---

## Phase 4: User Story 2 - Focus returns to the editor when resuming editing later in the same dialog session (Priority: P2)

**Goal**: Confirm that the same three changes from User Story 1 also cover returning to editing mode later in a dialog's session, with no additional code.

**Independent Test**: In each of the three dialogs, switch away from editing mode and back again, and confirm focus lands in the editor without an extra click, exactly as it did on first open.

### Implementation for User Story 2

- [ ] T005 [US2] Manually validate against [quickstart.md](./quickstart.md) §4 (Lyric Editor, Chord Symbol, and Score Text dialogs each place focus in their editor when returning to editing mode after visiting their other view) — per [research.md](./research.md) §1, this requires no code beyond T001-T003, since every mode transition back into editing remounts the editor component (and its `useEditor()` call) via the host dialog's existing `v-if`

**Checkpoint**: Both user stories are independently functional, from the same three-file change.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Confirm no regression to existing dialog behavior and that the change is as narrowly-scoped as planned.

- [X] T006 Run `npm run build` and fix any TypeScript errors introduced by the changes in T001-T003
- [X] T007 [P] Confirm via `git diff --stat` that only `chordEditor.vue`, `lyricEditor.vue`, and `textGroupEditor.vue` were modified - no host dialog (`chord.vue`, `lyric.vue`, `textBlock.vue`) or any other file changed, confirming FR-005
- [ ] T008 [P] Manually validate against [quickstart.md](./quickstart.md) §5 (a representative non-focus control in each dialog - Verse dropdown, Symbols dropdown, Insert Special dropdown - still behaves exactly as before)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** / **Foundational (Phase 2)**: Empty - nothing blocks User Story 1
- **User Story 1 (Phase 3)**: No dependencies; T001-T003 are independent files and fully parallelizable
- **User Story 2 (Phase 4)**: Depends on Phase 3 being complete (T001-T003), since it validates the same code change rather than adding new code
- **Polish (Phase 5)**: Depends on both user stories being complete

### Parallel Opportunities

- T001, T002, T003 (US1) touch three entirely independent files and can all be done in parallel
- T007, T008 (Polish) are independent verification passes and can run in parallel

---

## Parallel Example: User Story 1

```bash
Task: "Add autofocus: 'end' to useEditor() in src/ui/components/dialogs/lyricEditor.vue"
Task: "Add autofocus: 'end' to useEditor() in src/ui/components/dialogs/chordEditor.vue"
Task: "Add onCreate focus callback to useEditor() in src/ui/components/dialogs/textGroupEditor.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3: User Story 1 (T001-T004)
2. **STOP and VALIDATE**: Run quickstart.md §1-§3 independently
3. This alone delivers FR-001 through FR-004, and — per research.md §1 — already delivers the User Story 2 behavior too, since it is the same code path; Phase 4 is validation-only

### Incremental Delivery

1. Add User Story 1 (T001-T004) → validate independently (MVP: focus-on-open works for all three dialogs)
2. Add User Story 2 (T005) → validate independently (confirms the same change covers resume-editing, with zero additional code)
3. Phase 5: Polish — confirm build is clean, no unintended files changed, no regression to existing controls

### Notes

- No task modifies any host dialog (`chord.vue`, `lyric.vue`, `textBlock.vue`) — per research.md §1, the `v-if`-driven remount already gives every mode transition back into editing a fresh `useEditor()` call, so the fix belongs entirely in the three editor components themselves.
- No task introduces a new dependency; `autofocus` and `onCreate` are both existing options on the already-installed `@tiptap/core` `useEditor`/`Editor` API.

## Implementation Notes (as executed)

- **Verification performed**: `npm run build` (T006) compiled cleanly with no TypeScript errors. Unlike `010-vue-lyric-dialog`/`013-vue-chord-dialog`, no temporary call-site wiring was needed to force type-checking: `lyricEditor.vue` and `chordEditor.vue` are already reachable through their respective (already-shipped) host dialogs, and `textGroupEditor.vue` is reachable through the shipped `textBlock.vue`/`SuiTextBlockDialogVue`. `git diff --stat` (T007) confirmed only the three intended files changed (5, 5, and 8 lines added respectively) — no host dialog or any other file was touched.
- **Not performed**: T004, T005, and T008 all require driving each dialog in a live browser (confirming keyboard focus actually lands in the editor, that existing text isn't selected, and that mode-toggle controls still behave identically). No browser/UI-automation tool was available in this session to do that safely, so these remain unchecked rather than marked done on the strength of code review alone. A human (or a future session with browser access) should run through [quickstart.md](./quickstart.md) before treating this feature as verified end-to-end.
