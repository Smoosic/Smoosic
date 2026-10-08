---

description: "Task list template for feature implementation"
---

# Tasks: Vue-Based Lyric Dialog

**Input**: Design documents from `/specs/010-vue-lyric-dialog/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/component-interfaces.md](./contracts/component-interfaces.md), [quickstart.md](./quickstart.md)

**Tests**: This project has no wired automated test runner (`npm test` is a no-op placeholder) and the feature spec does not request TDD. No automated test tasks are generated; each story instead ends with a manual validation task against `quickstart.md`.

**Organization**: Tasks are grouped by user story (from spec.md, priorities P1–P4) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Every task includes an exact file path

## Path Conventions

Single front-end project — all paths are under `src/ui/` (or `src/smo/`/`src/render/sui/` for reused, unmodified legacy code), per plan.md's Project Structure. No `backend/`/`frontend/` split, no new top-level directories.

---

## Phase 1: Setup

**Purpose**: Create the new source files as empty, correctly-typed scaffolding so later phases only fill in logic.

- [X] T001 [P] Create stub `src/ui/dialogs/lyricVue.ts` exporting an empty `SuiLyricDialogVue(parameters: SuiDialogParams): void` function, matching the signature in [contracts/component-interfaces.md](./contracts/component-interfaces.md) §1
- [X] T002 [P] Create stub `src/ui/components/dialogs/lyric.vue` (`<script setup lang="ts">`) declaring the `Props` interface from [contracts/component-interfaces.md](./contracts/component-interfaces.md) §2, with an empty `<template>`
- [X] T003 [P] Create stub `src/ui/components/dialogs/lyricEditor.vue` (`<script setup lang="ts">`) declaring the `Props`/`Expose` interfaces from [contracts/component-interfaces.md](./contracts/component-interfaces.md) §3, with an empty `<template>`

**Checkpoint**: New files exist and type-check with no logic yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared dialog scaffolding every user story depends on — the dialog can open, load the initially-selected note's lyric, and close, but no story-specific control is wired yet.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 In `src/ui/dialogs/lyricVue.ts`, capture `view.tracker.selections[0]` and a deep-copied `SmoSelector` as `currentSelector`, matching `SuiLyricDialog`'s constructor (`src/ui/dialogs/lyric.ts:88-95`)
- [X] T005 In `src/ui/dialogs/lyricVue.ts`, define `type DialogMode = 'editing' | 'dialog'` and a `mode: Ref<DialogMode>` initialized unconditionally to `'editing'` on every open (FR-009), per [data-model.md](./data-model.md) `DialogMode` and [research.md](./research.md) §9
- [X] T006 In `src/ui/dialogs/lyricVue.ts`, implement `loadNote(selector, verse)`: resolve the note via `SmoSelection.noteFromSelector`, fetch its lyric via `note.getLyricForVerse(verse, SmoLyric.parsers.lyric)` or construct a default `SmoLyric` from the score's `'lyrics'` font entry if none exists, and populate `currentLyric`, `originalText`, `lyricText`, `translateY`, `fontInfo` — mirroring `SuiLyricSession._setLyricForNote()` (`src/render/sui/textEdit.ts:1134-1155`), per [data-model.md](./data-model.md) Operations
- [X] T007 In `src/ui/dialogs/lyricVue.ts`, implement `commitIfChanged()`: if `lyricText.value !== originalText` and `currentLyric` is not `deleted`, call `currentLyric.value.setText(lyricText.value)` then `await view.addOrUpdateLyric(currentSelector.value, currentLyric.value)` — mirroring `SuiLyricSession._updateLyricFromEditor()` (`src/render/sui/textEdit.ts:1290-1300`)
- [X] T008 In `src/ui/dialogs/lyricVue.ts`, implement a shared `finish()` (commit the current note via `commitIfChanged()` only if `mode.value === 'editing'`, no undo-group open/close per [research.md](./research.md) §8), wire it as both `commitCb` and `cancelCb`, and call `InstallDialog({ root, app: lyricComp, appParams, dialogParams: parameters, commitCb, cancelCb })` with **no** `removeCb` (per [research.md](./research.md) §7)
- [X] T009 In `src/ui/components/dialogs/lyric.vue`, build the `dialogContainer`-wrapped shell with `v-if`-gated sections for `mode === 'editing'` vs `mode === 'dialog'` per the Visibility contract in [contracts/component-interfaces.md](./contracts/component-interfaces.md) §2, passing `commitCb`/`cancelCb` straight through to `dialogContainer` (no `removeCb` prop)

**Checkpoint**: Dialog installs, opens into edit mode on the initially-selected note, and closes generically via OK/Cancel; `mode` structurally enforces FR-007. Ready for stories to add real controls.

---

## Phase 3: User Story 1 - Enter or edit a note's lyric as plain text (Priority: P1) 🎯 MVP

**Goal**: Replace the legacy inline-SVG lyric editor with an embedded, plain-text-only TipTap panel that auto-opens on the currently selected note.

**Independent Test**: Select a note, open the Lyric Editor dialog, confirm the plain-text editor opens automatically pre-loaded with that note's lyric (or empty), type text, end the session, and confirm the note's lyric reflects the typed text with no styling controls ever shown.

### Implementation for User Story 1

- [X] T010 [P] [US1] Implement `src/ui/components/dialogs/lyricEditor.vue`: `useEditor` with `StarterKit` configured to disable every mark/block extension except `paragraph`/`text` (no bold, italic, strike, code, links, headings, lists, blockquote — matching FR-006's "no styling controls"), suppress Enter/hard-break so the document stays a single paragraph (`SmoLyric.text` has no line-break concept), apply `props.fontInfo` via the `createStyleTag` technique from `textGroupEditor.vue` (`src/ui/components/dialogs/textGroupEditor.vue:24-26,113-133`), and `defineExpose({ getText })` — per [contracts/component-interfaces.md](./contracts/component-interfaces.md) §3
- [X] T011 [US1] Embed `lyricEditor.vue` into `lyric.vue`'s editing-mode section, bound to `:text="lyricText"` / `:fontInfo="fontInfo"`, with a template ref for calling `getText()` on commit/navigate/delete
- [X] T012 [US1] In `src/ui/dialogs/lyricVue.ts`, call `loadNote(currentSelector, 0)` once at dialog construction (verse `0`, the `dialogElements` default) so `mode === 'editing'` (T005) opens pre-loaded, matching `SuiLyricDialog.bindElements()`'s unconditional `startEditSession()` (`src/ui/dialogs/lyric.ts:166`)
- [X] T013 [US1] In `finish()` (T008), read the mounted `lyricEditor` ref's `getText()` into `lyricText.value` before calling `commitIfChanged()`
- [ ] T014 [US1] Manually validate against [quickstart.md](./quickstart.md) §1 (auto-open into edit mode pre-loaded with existing text; edited text persists after ending the session; a note with no lyric opens empty)

**Checkpoint**: User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Move between notes while entering lyrics (Priority: P2)

**Goal**: Next/previous-note controls that save the current note's text and load the adjacent note's lyric, stopping cleanly at the first/last note in the score.

**Independent Test**: Open the Lyric Editor, type a lyric, click "next note", confirm the text was saved and the editor now shows the next note's lyric; repeat backward; confirm navigating past the first/last note has no effect.

### Implementation for User Story 2

- [X] T015 [US2] In `src/ui/dialogs/lyricVue.ts`, implement `navigate(direction: 'next' | 'previous')`: read `lyricEditor.getText()` into `lyricText.value` → `commitIfChanged()` → resolve `SmoSelection.nextNoteSelectionFromSelector`/`lastNoteSelectionFromSelector(score, currentSelector.value)` → if found, set `currentSelector.value` to the new selector and call `loadNote(currentSelector.value, verse.value)`; if `null`, no-op — per [data-model.md](./data-model.md) Operations and [research.md](./research.md) §4
- [X] T016 [P] [US2] Add next-note and previous-note arrow controls in `lyric.vue`'s editing-mode section, calling `navigate('next')` / `navigate('previous')`
- [ ] T017 [US2] Manually validate against [quickstart.md](./quickstart.md) §2 (forward/backward navigation across a run of notes; no-op at score boundaries)

**Checkpoint**: User Stories 1 and 2 are both independently functional.

---

## Phase 5: User Story 3 - Delete a note's lyric (Priority: P3)

**Goal**: A delete (cross) control that removes the current note's lyric and advances to the next note without re-committing the deleted text.

**Independent Test**: Open the Lyric Editor on a note with lyric text, click delete, and confirm the lyric is removed from the score and the editor advances to the next note.

### Implementation for User Story 3

- [X] T018 [US3] In `src/ui/dialogs/lyricVue.ts`, implement `deleteCurrent()`: `await view.removeLyric(currentSelector.value, currentLyric.value)` (marks the lyric `deleted`), then resolve and move to the next note *without* an intervening `commitIfChanged()` call — mirroring `SuiLyricSession.removeLyric()`'s ordering (`src/render/sui/textEdit.ts:1280-1286`), per [research.md](./research.md) §4
- [X] T019 [P] [US3] Add a delete (cross) control in `lyric.vue`'s editing-mode section, calling `deleteCurrent()`
- [ ] T020 [US3] Manually validate against [quickstart.md](./quickstart.md) §3 (deleting a lyric removes it and advances; deleting an empty lyric is a harmless no-op that still advances)

**Checkpoint**: User Stories 1-3 are all independently functional.

---

## Phase 6: User Story 4 - Finish editing and adjust verse, position, and font (Priority: P4)

**Goal**: A mode toggle into "dialog mode" exposing Verse, Y Adjustment, and Font controls, and back into edit mode, with the score-wide Font semantics preserved.

**Independent Test**: Finish typing a lyric, mark editing complete, confirm Verse/Y Adjustment/Font controls appear (and edit-mode controls disappear), change each, and confirm the corresponding update; confirm resuming editing restores the plain-text editor.

### Implementation for User Story 4

- [X] T021 [US4] In `src/ui/dialogs/lyricVue.ts`, implement `enterDialogMode()` (read `lyricEditor.getText()` → `commitIfChanged()` → `mode.value = 'dialog'`) and `enterEditingMode()` (`mode.value = 'editing'`, no reload needed since `currentSelector`/`verse` state is already current) — per [data-model.md](./data-model.md) Operations
- [X] T022 [P] [US4] Add a "done editing" control in `lyric.vue`'s editing-mode section (calling `enterDialogMode()`) and a separate "edit lyrics" control in the dialog-mode section (calling `enterEditingMode()`) — two mode-specific buttons rather than one icon-swapped button, per [research.md](./research.md) §11
- [X] T023 [P] [US4] Add a Verse control using `select.vue` in `lyric.vue`'s dialog-mode section (four options, labels "1"–"4", values `"0"`–`"3"`, from `SuiLyricDialog.dialogElements` `src/ui/dialogs/lyric.ts:40-53`), calling `onVerseChange(v)`: `verse.value = parseInt(v, 10)` then `loadNote(currentSelector.value, verse.value)` (reloads display state only — no score write, per [research.md](./research.md) §2)
- [X] T024 [P] [US4] Add a Y Adjustment control using `numberInput.vue` in `lyric.vue`'s dialog-mode section, `precision: 0` with explicit `minValue`/`maxValue` (e.g. `-9999`/`9999`, per [research.md](./research.md) §5), calling `onYChange(v)`: `translateY.value = v` → `currentLyric.value.translateY = v` → `await view.addOrUpdateLyric(currentSelector.value, currentLyric.value)`
- [X] T025 [P] [US4] Add a Font control using `fontPicker.vue` in `lyric.vue`'s dialog-mode section (family/size fields only), seeded from `currentLyric.value.fontInfo`, calling `onFontChange(font)`: `fontInfo.value = { ...font, weight: 'normal' }` → `await view.setLyricFont({ family: font.family, size: font.size, weight: 'normal' })` — note this is score-wide, not per-lyric, per [research.md](./research.md) §6
- [ ] T026 [US4] Manually validate against [quickstart.md](./quickstart.md) §4 (mode toggle both directions; Verse reload has no immediate score effect; Y Adjustment accepts negative values; Font change is score-wide)

**Checkpoint**: All four user stories are independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verify OK/Cancel parity, confirm the legacy-free success criterion, and run the end-to-end regression pass.

- [X] T027 [P] Verify OK and Cancel produce identical results (both call the same `finish()` from T008) per [quickstart.md](./quickstart.md) §5 (FR-014, spec Edge Case)
- [X] T028 [P] Audit `src/ui/components/dialogs/lyric.vue`, `src/ui/components/dialogs/lyricEditor.vue`, and `src/ui/dialogs/lyricVue.ts` to confirm none import the legacy `SuiComponentBase`-derived classes or session/editor classes (`SuiDropdownComponent`, `SuiRockerComponent`, `SuiFontComponent`, `SuiNoteTextComponent`/`SuiLyricComponent`, `SuiLyricSession`, `SuiLyricEditor`) — confirms SC-005
- [X] T029 Run `npm run build` and fix any TypeScript errors introduced by the new/changed files
- [ ] T030 Temporarily wire `SuiLyricDialogVue` into a real call site (see [quickstart.md](./quickstart.md) Prerequisites), run the full quickstart.md validation pass end-to-end via `npm run server`, then revert the temporary wiring (do not commit the swap) — confirms SC-001 through SC-004
- [ ] T031 [P] Perform the regression-diff check from [quickstart.md](./quickstart.md) "Regression check against the legacy dialog": compare `note.getLyricForVerse(...)` output (text, verse, `translateY`) between the legacy and new dialog for an equivalent edit sequence, and confirm the score-wide lyric font setting matches after an equivalent Font change

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - Structurally independent of each other (each adds controls to distinct sections of `lyric.vue`'s editing-mode/dialog-mode regions), but are listed in priority order (P1 → P2 → P3 → P4) since they share the same three files (`lyricVue.ts`, `lyric.vue`, `lyricEditor.vue`) and editing them concurrently risks merge conflicts
- **Polish (Phase 7)**: Depends on all four user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependency on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) — depends on `lyricEditor.getText()` (T010/T011) being available to read before navigating, but no other US1 control dependency
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) — no dependency on US1/US2 beyond the same file-sharing caveat
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) — no dependency on US1/US2/US3

### Within Each User Story

- Story-specific logic in `lyricVue.ts` before the controls in `lyric.vue` that call it
- Wiring before the manual validation task
- Story complete before moving to next priority (recommended sequencing, since US1-US4 share `lyricVue.ts`/`lyric.vue`)

### Parallel Opportunities

- T001-T003 (Setup) can all run in parallel — three independent new files
- T016 (US2) and T019 (US3) are independent controls in different sections of the same editing-mode template; treat as parallel-safe only if coordinated by a single editor of `lyric.vue`
- T022, T023, T024, T025 (US4) are independent controls and can be done in parallel by different contributors coordinating on `lyric.vue`
- T027, T028, T031 (Polish) are independent verification passes and can run in parallel

---

## Parallel Example: Setup

```bash
Task: "Create stub src/ui/dialogs/lyricVue.ts exporting SuiLyricDialogVue"
Task: "Create stub src/ui/components/dialogs/lyric.vue with Props interface"
Task: "Create stub src/ui/components/dialogs/lyricEditor.vue with Props/Expose interfaces"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run quickstart.md §1 independently
5. This alone delivers FR-001, FR-002 (partially), FR-006, FR-009, FR-012 (partially), FR-014 — the highest-risk part of the migration (replacing the inline-SVG `SuiLyricEditor` with a TipTap panel)

### Incremental Delivery

1. Setup + Foundational → dialog shell ready, opens pre-loaded on the selected note
2. Add User Story 1 → validate independently (MVP: plain-text lyric entry works end-to-end)
3. Add User Story 2 → validate independently (next/previous navigation works, doesn't regress US1)
4. Add User Story 3 → validate independently (delete works)
5. Add User Story 4 → validate independently (mode toggle + Verse/Y/Font controls work)
6. Phase 7: Polish — confirm SC-005 (no legacy component/session classes), run full quickstart.md, regression-diff against `SuiLyricDialog`

### Notes

- `SuiLyricDialog` (`src/ui/dialogs/lyric.ts`) and its call sites are never modified by any task above — the swap-in during T030 is explicitly temporary and reverted before completion, per the spec's scope boundary.
- No task introduces a new dependency; `vue`, `@tiptap/*` are already present (used by `textGroupEditor.vue`).
- Per [research.md](./research.md) §3, §12, and §13, `SuiLyricSession`, `SuiLyricEditor`, and the legacy space/hyphen keyboard-advance shortcut and `idleRedrawTime` override are intentionally **not** ported — no task should reintroduce them.

## Implementation Notes (as executed)

**Design deviations from the task text, decided during implementation for correctness/simplicity — code is authoritative over these task descriptions:**

- **Commit/cancel split (T008)**: `lyricVue.ts`'s `commitCb`/`cancelCb` (the closures passed to `InstallDialog`) ended up as no-ops. The actual "commit the note currently being edited" logic (`finish()`/`commitIfChanged()`) lives in `lyric.vue` itself, wrapping the `commitCb`/`cancelCb` *props* it receives from `InstallDialog` (`handleCommit`/`handleCancel`) before calling them. Reason: `InstallDialog`'s own `commitCb`/`cancelCb` wrappers (in `dialog.ts`) only ever call back into the creation function's closures for final teardown-time side effects; since every score mutation in this dialog (`addOrUpdateLyric`, `removeLyric`, `setLyricFont`) already happens incrementally inside `lyric.vue`'s own handlers as the user types/navigates/deletes/adjusts (mirroring the legacy dialog's incremental-commit design), there is nothing left for a creation-function-level closure to do except the one shared "flush the in-progress edit" step — which needs the TipTap `getText()` ref that only `lyric.vue` holds. This mirrors how `xPosition`/`yPosition`/`fontInfo` etc. ended up owned inside `textBlock.vue` rather than `textBlockVue.ts` in the prior migration (see `specs/001-text-block-dialog-vue/tasks.md` Implementation Notes).
- **State ownership**: All transient state from [data-model.md](./data-model.md) (`currentSelector`, `verse`, `currentLyric`, `lyricText`, `translateY`, `fontInfo`, `mode`) lives in `lyric.vue`, not `lyricVue.ts`. `lyricVue.ts` stays a thin creation function: derive the initial selector, install the dialog, no-op commit/cancel closures.
- **Verification performed**: `npm run build` (T029) was run twice with `SuiLyricDialogVue` temporarily wired into `src/ui/menus/text.ts`'s `lyricsDialogMenuOption` (the same call site `SuiLyricDialog` uses today) so `ts-loader` would actually type-check the new files — they aren't reachable from the build's entry point otherwise. Both runs compiled cleanly; the temporary wiring was reverted (`git checkout`) immediately after and is not part of the final diff.
- **Not performed**: T014, T017, T020, T026, T030, T031 all require driving the dialog in a live browser (typing into the TipTap panel, clicking arrow/delete/mode controls, inspecting rendered lyrics on the score). No browser/UI-automation tool was available in this session to do that safely, so these remain unchecked rather than being marked done on the strength of code review alone. A human (or a future session with browser access) should run through [quickstart.md](./quickstart.md) using the same temporary-wiring approach described in its Prerequisites before treating this feature as verified end-to-end.
