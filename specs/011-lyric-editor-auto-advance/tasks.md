---

description: "Task list template for feature implementation"
---

# Tasks: Lyric Editor Auto-Advance

**Input**: Design documents from `/specs/011-lyric-editor-auto-advance/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/component-interfaces.md](./contracts/component-interfaces.md), [quickstart.md](./quickstart.md)

**Tests**: This project has no wired automated test runner (`npm test` is a no-op placeholder) and the feature spec does not request TDD. No automated test tasks are generated; each story instead ends with a manual validation task against `quickstart.md`.

**Organization**: Tasks are grouped by user story (from spec.md, priorities P1–P2) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Every task includes an exact file path

## Path Conventions

Single front-end project — both modified files are under `src/ui/components/dialogs/`, per plan.md's Project Structure. No new files.

---

## Phase 1: Setup

**Purpose**: Declare the new `advance` emit contract on both sides of the `lyricEditor.vue` ↔ `lyric.vue` boundary, with no behavior yet.

- [X] T001 [P] In `src/ui/components/dialogs/lyricEditor.vue`, add `const emit = defineEmits<{ advance: [mode: 'commit' | 'skip'] }>();`, per [contracts/component-interfaces.md](./contracts/component-interfaces.md) §1
- [X] T002 [P] In `src/ui/components/dialogs/lyric.vue`, add an `onEditorAdvance(mode: 'commit' | 'skip')` function stub and wire `@advance="onEditorAdvance"` onto the existing `<lyricEditorComp ref="lyricEditorRef" ...>` usage in the editing-mode template section, per [contracts/component-interfaces.md](./contracts/component-interfaces.md) §2

**Checkpoint**: New files/props type-check; emit is declared and listened for, but nothing happens yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement both branches of `onEditorAdvance` in `lyric.vue` — the shared routing logic both user stories' keyboard shortcuts will trigger.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 In `src/ui/components/dialogs/lyric.vue`, implement `onEditorAdvance`'s `'commit'` branch: `await navigate('next')` — reuses the existing, unchanged function (commit current note via `commitIfChanged()`, then advance; no-op at the last note), per [data-model.md](./data-model.md) State Transition Summary
- [X] T004 In `src/ui/components/dialogs/lyric.vue`, implement `onEditorAdvance`'s `'skip'` branch: resolve `SmoSelection.nextNoteSelectionFromSelector(score, currentSelector.value)`; if found, set `currentSelector.value` to the new selector and call `loadNote(currentSelector.value, verse.value)`; if not found, no-op — deliberately does **not** call `commitIfChanged()`, per [research.md](./research.md) §3 and [data-model.md](./data-model.md) Operation table

**Checkpoint**: `onEditorAdvance('commit')` and `onEditorAdvance('skip')` both work correctly when called directly (e.g. temporarily from a dev console or a throwaway button) — ready for the keyboard shortcuts to trigger them.

---

## Phase 3: User Story 1 - Enter a hyphenated, multi-syllable lyric with the keyboard alone (Priority: P1) 🎯 MVP

**Goal**: Typing `-` in the lyric editor appends the hyphen and advances to the next note in one keystroke.

**Independent Test**: Open the Lyric Editor on a note, type part of a syllable, type `-`, and confirm the hyphen was appended and the editor moved to the next note.

### Implementation for User Story 1

- [X] T005 [US1] In `src/ui/components/dialogs/lyricEditor.vue`'s existing keyboard-shortcut extension (the one that already handles `Enter`/`Shift-Enter`), add a `'-'` entry: `this.editor.commands.insertContent('-')` then `emit('advance', 'commit')`, `return true` — per [research.md](./research.md) §1/§2 and [contracts/component-interfaces.md](./contracts/component-interfaces.md) §1
- [ ] T006 [US1] Manually validate against [quickstart.md](./quickstart.md) §1 (hyphen appends and advances across a run of notes; at the last note the hyphen is still appended but the editor stays put, per FR-004)

**Checkpoint**: User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Move to the next note with the space bar (Priority: P2)

**Goal**: Typing Space in the lyric editor advances to the next note without inserting a space character, and without persisting an empty lyric when the current note's text is empty.

**Independent Test**: Type a word, press Space, confirm advance with no trailing space; separately, press Space with no text typed, confirm advance with no lyric created on the note left behind.

### Implementation for User Story 2

- [X] T007 [US2] In the same extension (from T005), add a `'Space'` entry: `const hasText = this.editor.getText().trim().length > 0;` then `emit('advance', hasText ? 'commit' : 'skip')`, always `return true` (never insert a space character) — per [research.md](./research.md) §1/§3 and [contracts/component-interfaces.md](./contracts/component-interfaces.md) §1
- [ ] T008 [US2] Manually validate against [quickstart.md](./quickstart.md) §2 and §3 (Space with text commits and advances with no trailing space; Space with no text advances without creating a lyric; text typed-then-deleted-to-empty behaves the same as never-typed; boundary no-op at the last note)

**Checkpoint**: User Stories 1 and 2 are both independently functional.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Confirm no regressions to existing behavior and that the new files still type-check.

- [ ] T009 [P] Manually validate [quickstart.md](./quickstart.md) §4 (all characters other than a lone `-`/Space still insert literally, FR-006) and §5 (existing next/previous/delete/mode-toggle/Verse/Y-Adjustment/Font controls from `010-vue-lyric-dialog` are unaffected, FR-005)
- [ ] T010 [P] Re-run `specs/010-vue-lyric-dialog/quickstart.md` §1-§5 in full as a regression pass (mouse-driven only, no `-`/Space) and confirm every scenario still passes unchanged
- [X] T011 Run `npm run build` (with `SuiLyricDialogVue` temporarily wired per [quickstart.md](./quickstart.md) Prerequisites, so `ts-loader` actually type-checks the modified files) and fix any TypeScript errors, then revert the temporary wiring (do not commit the swap)
- [X] T012 [P] Confirm `Shift-Space` and every other key remain unbound and unaffected by the new `'-'`/`'Space'` extension entries (per [research.md](./research.md) §5) — no backward-navigation shortcut was introduced

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS both user stories
- **User Stories (Phase 3-4)**: Both depend on Foundational phase completion
  - Structurally independent (each adds one entry to the same shared extension object in `lyricEditor.vue`), but listed in priority order (P1 → P2) since they touch the same file and editing them concurrently risks merge conflicts
- **Polish (Phase 5)**: Depends on both user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependency on US2
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) — no dependency on US1's `'-'` entry, but shares the same extension object in the same file

### Within Each User Story

- Keyboard-shortcut entry (`lyricEditor.vue`) before its manual validation task
- Story complete before moving to the next priority (recommended sequencing, since both share `lyricEditor.vue`)

### Parallel Opportunities

- T001, T002 (Setup) touch different files and can run in parallel
- T009, T010, T012 (Polish) are independent verification passes and can run in parallel

---

## Parallel Example: Setup

```bash
Task: "Add advance emit to lyricEditor.vue"
Task: "Add onEditorAdvance stub and @advance listener to lyric.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks both stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run quickstart.md §1 independently
5. This alone delivers FR-001 and FR-004 (hyphen path) — the higher-value of the two triggers per the spec's priority ordering

### Incremental Delivery

1. Setup + Foundational → emit contract wired, both routing branches implemented
2. Add User Story 1 → validate independently (hyphen auto-advance works end-to-end)
3. Add User Story 2 → validate independently (space auto-advance works, doesn't regress US1)
4. Phase 5: Polish — confirm no regression to `010-vue-lyric-dialog`'s existing controls, run full quickstart.md

### Notes

- No new files are created by this feature; both changes live in `lyricEditor.vue` and `lyric.vue` from `010-vue-lyric-dialog`.
- `SuiLyricDialog` (legacy) and `SuiLyricSession`/`SuiLyricEditor` are never touched — per [research.md](./research.md), this feature reimplements the auto-advance *behavior*, not the legacy code path.
- Per [research.md](./research.md) §5, no backward-navigation (Shift-Space) shortcut should be added by any task above.

## Implementation Notes (as executed)

- **T011 deviation**: by the time this feature was implemented, `SuiLyricDialogVue` had already been wired into `src/ui/menus/text.ts`'s `lyricsDialogMenuOption` in a separate, already-committed change (commit `88063d6`) — not by this feature. `npm run build` therefore reached and type-checked the modified files through that existing real call site with no temporary wiring needed (nothing to revert).
- **Pre-existing wiring discrepancy noticed, not fixed**: that already-committed call site passes `id: 'textDialog'` and `ctor: 'SuiTextBlockDialog'` (apparent copy-paste residue from `textBlockDialogMenuOption` above it) instead of `'lyricDialog'`/`'SuiLyricDialog'`, and `modifier: null` instead of the note's existing lyric. This is outside this feature's scope (call-site wiring, not the auto-advance behavior) and was left as-is; flagged for the user's attention rather than silently changed. `modifier` is unused by `SuiLyricDialogVue`'s current implementation either way, so this does not affect this feature's correctness.
- **Not performed**: T006, T008, T009, T010 all require driving the dialog in a live browser (typing `-`/Space, observing advance behavior and score state). No browser/UI-automation tool was available in this session, so these remain unchecked. A human (or a future session with browser access) should run through [quickstart.md](./quickstart.md) before treating this feature as verified end-to-end.
