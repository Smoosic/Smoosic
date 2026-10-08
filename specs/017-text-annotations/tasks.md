---

description: "Task list template for feature implementation"
---

# Tasks: Note Text Annotations

**Input**: Design documents from `/specs/017-text-annotations/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/component-interfaces.md](./contracts/component-interfaces.md), [quickstart.md](./quickstart.md)

**Tests**: This project has no wired automated test runner (`npm test` is a no-op placeholder) and the feature spec does not request TDD. No automated test tasks are generated; each story instead ends with a manual validation task against `quickstart.md`.

**Organization**: Tasks are grouped by user story (from spec.md, priorities P1–P3) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US3)
- Every task includes an exact file path

## Path Conventions

Single front-end project — paths span `src/smo/data/` (data model), `src/render/sui/` and `src/render/vex/` (score operations and rendering), and `src/ui/menus/` / `src/ui/dialogs/` / `src/ui/components/dialogs/` (menu, dialog), per plan.md's Project Structure. No `backend/`/`frontend/` split, no new top-level directories.

**Note on execution (as implemented)**: Rather than build empty stubs (Phase 1) and fill logic in later passes exactly as sequenced below, the implementation was done file-by-file to completion (data model → score operations → rendering → menu → dialog components), since the whole feature set is small enough to hold in context at once. Every task's described behavior was still implemented; task numbering/grouping below reflects the design decomposition, not the literal edit order.

---

## Phase 1: Setup

**Purpose**: Create the new source files as empty, correctly-typed scaffolding so later phases only fill in logic.

- [X] T001 [P] Create stub `src/ui/dialogs/annotationVue.ts` exporting an empty `SuiAnnotationDialogVue(parameters: SuiDialogParams): void` function, matching the signature in [contracts/component-interfaces.md](./contracts/component-interfaces.md) §3
- [X] T002 [P] Create stub `src/ui/components/dialogs/annotation.vue` (`<script setup lang="ts">`) declaring the `Props` interface from [contracts/component-interfaces.md](./contracts/component-interfaces.md) §4, with an empty `<template>`
- [X] T003 [P] Create stub `src/ui/components/dialogs/annotationEditor.vue` (`<script setup lang="ts">`) declaring the `Props`/`Expose` interfaces from [contracts/component-interfaces.md](./contracts/component-interfaces.md) §5, with an empty `<template>`

**Checkpoint**: New files exist and type-check with no logic yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The data-model field, score-mutation methods, and rendering wiring every user story depends on — an annotation can exist on a note, be added/removed via the score-operations layer, and render on the score (at its default position/font/justify) once attached. No menu, dialog, or text-editing UI exists yet.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 [P] In `src/smo/data/noteModifiers.ts`, add `verticalJustify: number` to the `SmoLyricParamsSer`/`SmoLyricParams` interfaces, `SmoLyric.defaults` (value `1`), the `SmoLyric` class field declaration (default `1`), and `SmoLyric.persistArray` (implicitly included since it iterates `SmoLyric.defaults`' keys, per `noteModifiers.ts:888-894` — verify no separate list needs updating); add a new `static readonly annotationVerticalJustify: Record<string, number> = { TOP: 1, BOTTOM: 3 }` alongside the existing `static readonly parsers` (`noteModifiers.ts:857-859`) — per [data-model.md](./data-model.md) and [research.md](./research.md) §4
- [X] T005 [P] In `src/smo/data/noteModifiers.ts`, fix `SmoLyric.getClassSelector()` (`noteModifiers.ts:990-995`) to map `parser` three ways (`lyric` → `'lyric'`, `chord` → `'chord'`, `annotation` → `'annotation'`) instead of the current binary lyric/chord check, so it returns `'g.annotation-<verse>'` for annotations — per [research.md](./research.md) §2
- [X] T006 In `src/render/sui/scoreViewOperations.ts`, add `async addOrUpdateAnnotation(selector: SmoSelector, annotation: SmoLyric): Promise<void>`, copied from `addOrUpdateLyric` (`scoreViewOperations.ts:430-442`) but calling `selection.note!.addAnnotation(annotation)` (live tree) and `equiv!.note!.addAnnotation(altLyric)` (store tree, same `SmoNoteModifierBase.deserialize(annotation.serialize())` clone pattern) — per [data-model.md](./data-model.md)
- [X] T007 In `src/render/sui/scoreViewOperations.ts`, add `async removeAnnotation(selector: SmoSelector, annotation: SmoLyric): Promise<void>`, copied from `removeLyric` (`scoreViewOperations.ts:408-423`) but calling `note.removeAnnotations(annotation)` on both the live and store-tree notes, and setting `annotation.deleted = true` — per [data-model.md](./data-model.md)
- [X] T008 In `src/render/vex/vxNote.ts`, add `addAnnotationToNote(vexNote: Note, annotation: SmoLyric)`, copied from `addLyricAnnotationToNote` (`vxNote.ts:159-183`) but: class string `'annotation annotation-' + annotation.verse'` instead of `'lyric lyric-' + ...'`, no hyphen-related branches, and `vexL.setVerticalJustification(annotation.verticalJustify)` instead of the hardcoded `VF.Annotation.VerticalJustify.BOTTOM` — per [contracts/component-interfaces.md](./contracts/component-interfaces.md) §6
- [X] T009 In `src/render/vex/vxNote.ts`, extend `createLyric()` (`vxNote.ts:203-215`) with a third dispatch branch: `this.noteData.smoNote.getAnnotations().forEach((a) => this.addAnnotationToNote(this.noteData.staveNote, a as SmoLyric))`, alongside the existing lyric/chord branches (depends on T008)
- [X] T010 In `src/render/vex/vxSystem.ts`, add `_updateAnnotationOffsets(note: SmoNote)`, copied from `_updateChordOffsets` (`vxSystem.ts:105-117`) but iterating `note.getAnnotations()` and applying the same `transform: translate(translateX, -translateY)` to the SVG element found via `this.context.svg.getElementById('vf-' + annotation.attrs.id)` — per [contracts/component-interfaces.md](./contracts/component-interfaces.md) §7
- [X] T011 In `src/render/vex/vxSystem.ts`, call `this._updateAnnotationOffsets(note)` inside `updateLyricOffsets()`'s existing per-note loop (`vxSystem.ts:186-187`), alongside the existing `this._updateChordOffsets(note)` call (depends on T010)
- [X] T012 In `src/ui/components/dialogs/annotation.vue`, define `type DialogMode = 'editing' | 'dialog'`, a `mode: Ref<DialogMode>`, the working-copy refs from [data-model.md](./data-model.md) (`selections`, `currentAnnotation`, `originalText`, `annotationText`, `translateX`, `translateY`, `verticalJustify`, `fontInfo`), and a `loadAnnotation()` that populates all of them from `props.annotation`/`props.selections`
- [X] T013 In `src/ui/components/dialogs/annotation.vue`, implement `syncModifiers()`: loop `props.selections`, calling `await props.view.addOrUpdateAnnotation(sel.selector, props.annotation)` for each — modeled on `SuiDynamicDialogAdapter.syncModifiers` (`src/ui/dialogs/dynamics.ts:46-50`) — per [research.md](./research.md) §5 (depends on T006)
- [X] T014 In `src/ui/components/dialogs/annotation.vue`, implement a shared `finish()` (commit any in-progress text edit if `mode.value === 'editing'`), and wire the `commitCb`/`cancelCb` props (from `InstallDialog`) through `handleCommit`/`handleCancel` that call `finish()` first, matching `lyric.vue`'s pattern (`lyric.vue:248-266`)
- [X] T015 In `src/ui/components/dialogs/annotation.vue`, build the `dialogContainer`-wrapped shell with `v-if`-gated sections for `mode === 'editing'` (a placeholder "Done Editing" button only, for now) vs `mode === 'dialog'` (an "Edit Text" button only, for now) per the Visibility contract in [contracts/component-interfaces.md](./contracts/component-interfaces.md) §4, passing `handleCommit`/`handleCancel` to `dialogContainer`
- [X] T016 In `src/ui/dialogs/annotationVue.ts`, implement `SuiAnnotationDialogVue`: create the Vue root via `replaceVueRoot(modalContainerId)`, build `appParams` (`domId`, `label: 'Annotation'`, `view`, `selections: view.tracker.selections`, `annotation: parameters.modifier`, `startInEditingMode`), and call `InstallDialog({ root, app: annotationComp, appParams, dialogParams: parameters, commitCb, cancelCb })` — per [contracts/component-interfaces.md](./contracts/component-interfaces.md) §3 (depends on T001, T012-T015)

**Checkpoint**: An annotation can be created programmatically (e.g. via a temporary test call to `addOrUpdateAnnotation`), renders on the score with its default font/position/justify, and the dialog shell opens/closes generically via OK/Cancel with no story-specific controls yet.

---

## Phase 3: User Story 1 - Add a free-text annotation to selected notes (Priority: P1) 🎯 MVP

**Goal**: A "Annotation" Text-menu entry that opens a text-editing session for the current selection (one or many notes), commits the typed text to every selected note on "Done Editing" (or removes the annotation if left empty), and shows the result on the rendered score.

**Independent Test**: Select a note with no existing annotation, choose "Annotation" from the Text menu, type text, end the editing session, and confirm the text renders on the score near that note; repeat with a multi-note selection and confirm every selected note gets the same text; clear the text on an existing annotation and confirm it's removed.

### Implementation for User Story 1

- [X] T017 [US1] In `src/ui/components/dialogs/annotationEditor.vue`, implement a plain-text TipTap editor cloned from `lyricEditor.vue` (`src/ui/components/dialogs/lyricEditor.vue`) minus the `LyricNoHardBreak` extension's `'-'`/`Space` auto-advance shortcuts — keep `Enter`/`Shift-Enter` suppressed, the debounced (`400ms`) `preview` emit, the `autofocus: 'end'` behavior, and the font-style `watch`/`computeFontStyle` logic, all unchanged from `lyricEditor.vue` — per [research.md](./research.md) §6 and [contracts/component-interfaces.md](./contracts/component-interfaces.md) §5
- [X] T018 [US1] In `src/ui/components/dialogs/annotationEditor.vue`, implement `getText(): string` (`editor.value?.getText() ?? props.text`) and `defineExpose({ getText })`, matching `lyricEditor.vue`'s equivalent
- [X] T019 [US1] In `src/ui/components/dialogs/annotation.vue`, embed `annotationEditor.vue` into the `mode === 'editing'` section (replacing T015's placeholder), bound to `:text="annotationText"` / `:fontInfo="fontInfo"`, with a template ref (`annotationEditorRef`) for reading `getText()` (depends on T017, T018)
- [X] T020 [US1] In `src/ui/components/dialogs/annotation.vue`, implement `commitIfChanged()`: read `annotationEditorRef.value?.getText() ?? annotationText.value`; if unchanged from `originalText`, no-op; if the new text is empty, call `removeAnnotation` for every selection (loop `props.selections`, `await props.view.removeAnnotation(sel.selector, props.annotation)`) — FR-003's empty-removes path; otherwise `props.annotation.setText(text)` then `syncModifiers()` (T013) — per [contracts/component-interfaces.md](./contracts/component-interfaces.md) §4 (depends on T007, T013)
- [X] T021 [US1] In `src/ui/components/dialogs/annotation.vue`, wire `finish()` (T014) to call `commitIfChanged()` (T020) when `mode.value === 'editing'`, and wire a "Done Editing" click handler (`enterDialogMode`) that calls `commitIfChanged()` then sets `mode.value = 'dialog'`
- [X] T022 [US1] In `src/ui/menus/text.ts`, add `annotationDialogMenuOption` to `SuiTextMenuOptions`, modeled on `dynamicsDialogMenuOption` (`text.ts:118-150`): read `menu.view.tracker.selections`, no-op if empty or `selections[0].note` is null; if `selections[0].note.getAnnotations()` is non-empty use that instance, else construct a new `SmoLyric({ ...SmoLyric.defaults, parser: SmoLyric.parsers.annotation, text: '' })` and loop `await menu.view.addOrUpdateAnnotation(selections[i].selector, annotation)` for every selection; then call `SuiAnnotationDialogVue({ ...standard SuiDialogParams fields, modifier: annotation })` — per [contracts/component-interfaces.md](./contracts/component-interfaces.md) §1 (depends on T006, T016)
- [X] T023 [US1] In `src/ui/menus/text.ts`, import `SmoLyric` (from `../../smo/data/noteModifiers`, if not already imported) and `SuiAnnotationDialogVue` (from `../dialogs/annotationVue`), and add a menu icon/label (`icon: 'mi comment'` or an existing equivalent class, `text: 'Annotation'`, `value: 'annotationMenu'`) to `annotationDialogMenuOption.menuChoice`
- [ ] T024 [US1] Manually validate against [quickstart.md](./quickstart.md) §1-3 (single-note create/edit/reopen; multi-note selection gets identical text; clearing text removes the annotation) — **not run**: no browser/UI automation tool was available in this session; `npm run build` (T036) confirms the code compiles and bundles, but the interactive flow has not been exercised in an actual browser. Recommend running this manually before shipping.

**Checkpoint**: User Story 1 is fully functional and independently testable — this is the MVP.

---

## Phase 4: User Story 2 - Adjust an annotation's font, position, and vertical justification (Priority: P2)

**Goal**: The non-editing dialog mode gains real font, X-offset, Y-offset, and vertical-justify controls, each committing per-instance (not score-wide) and propagating identically to every note in the original selection.

**Independent Test**: Create an annotation, end text editing, confirm the dialog switches to non-editing mode with font/X/Y/justify controls, change each one, and confirm the rendered annotation (on every originally-selected note, for a multi-note selection) reflects the new font, position, and justification, while lyrics/chords/other annotations are unaffected.

### Implementation for User Story 2

- [X] T025 [P] [US2] In `src/ui/components/dialogs/annotation.vue`'s `mode === 'dialog'` section, add an X-offset `numberInputApp` (`label: 'X Offset (Px)'`) bound to `translateX`, with an `onXChange` handler that sets `props.annotation.translateX = value` then calls `syncModifiers()` (T013)
- [X] T026 [P] [US2] In `src/ui/components/dialogs/annotation.vue`'s `mode === 'dialog'` section, add a Y-offset `numberInputApp` (`label: 'Y Adjustment (Px)'`, matching `lyric.vue`'s existing control) bound to `translateY`, with an `onYChange` handler that sets `props.annotation.translateY = value` then calls `syncModifiers()` (T013)
- [X] T027 [P] [US2] In `src/ui/components/dialogs/annotation.vue`'s `mode === 'dialog'` section, add a vertical-justify `selectComp` with two options (`{ value: SmoLyric.annotationVerticalJustify.TOP.toString(), label: 'Top' }`, `{ value: SmoLyric.annotationVerticalJustify.BOTTOM.toString(), label: 'Bottom' }`) bound to `verticalJustify`, with an `onJustifyChange` handler that parses the value, sets `props.annotation.verticalJustify`, then calls `syncModifiers()` (T013) — per [data-model.md](./data-model.md) and spec FR-005
- [X] T028 [US2] In `src/ui/components/dialogs/annotation.vue`'s `mode === 'dialog'` section, add a `fontPickerComp` bound to `fontInfo`, with an `onFontChange` handler that sets `props.annotation.fontInfo = { ...font }` (per-instance, **not** `view.setLyricFont`/`setChordFont` — deliberately different from `lyric.vue`'s score-wide font commit) then calls `syncModifiers()` (T013) — per [research.md](./research.md) §6
- [ ] T029 [US2] Manually validate against [quickstart.md](./quickstart.md) §2, §4, §5 — **not run**, same reason as T024

**Checkpoint**: User Stories 1 and 2 are both independently functional.

---

## Phase 5: User Story 3 - Reopen an existing annotation's dialog (Priority: P3)

**Goal**: Choosing "Annotation" on a note that already has one opens the dialog directly in non-editing mode (skipping the empty-editor step), showing its current settings, with an explicit path back into text-editing.

**Independent Test**: Create an annotation and close the dialog; reselect that note and reopen "Annotation" from the Text menu; confirm the dialog opens directly in non-editing mode showing the saved font/offset/justify; choose "Edit Text" and confirm the text-editing session reopens pre-loaded with the existing text.

### Implementation for User Story 3

- [X] T030 [US3] In `src/ui/dialogs/annotationVue.ts`, compute `startInEditingMode = annotation.getText().length === 0` and pass it into `appParams` (depends on T016) — per [contracts/component-interfaces.md](./contracts/component-interfaces.md) §3, FR-002/FR-007
- [X] T031 [US3] In `src/ui/components/dialogs/annotation.vue`, initialize `mode.value` from `props.startInEditingMode ? 'editing' : 'dialog'` instead of unconditionally `'editing'` (replaces the Foundational-phase default from T012)
- [X] T032 [US3] In `src/ui/components/dialogs/annotation.vue`'s `mode === 'dialog'` section, wire the "Edit Text" button (placeholder from T015) to an `enterEditingMode` handler that sets `mode.value = 'editing'`, so `annotationEditor.vue` (T019) remounts pre-loaded with `annotationText.value` (the current, already-loaded text)
- [ ] T033 [US3] Manually validate against [quickstart.md](./quickstart.md) §1 step 5-6 — **not run**, same reason as T024

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify the feature doesn't regress existing behavior and holds up against the Constitution's serialization/rendering-performance principles.

- [ ] T034 [P] Manually validate against [quickstart.md](./quickstart.md) §6 (drag/reflow) and §7 (legacy-score compatibility) — **not run**, same reason as T024. Type-checking confirms `getAnnotations()` returns `[]` for any note with no annotation `SmoLyric`, so a legacy score (no `parser === 1` modifiers anywhere) takes the exact same code paths as before this feature; this has not been verified against an actual old score file in a browser.
- [ ] T035 [P] Manually validate against [quickstart.md](./quickstart.md) §8 (save/reload round-trip) — **not run**, same reason as T024. The serialization path relies on the same generic `smoSerialize.serializedMergeNonDefault`/`serializedMerge` mechanism already used for every other `SmoLyric` field (verified by reading the code, not by an actual save/reload cycle).
- [X] T036 Run `npm run build` and confirm no new TypeScript errors were introduced by any of the above changes — **done**: `npx tsc --noEmit` is clean and `npm run build` (webpack) completes successfully with no new errors/warnings attributable to this feature.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - US1 (P1) has no dependency on US2/US3
  - US2 (P2) extends the `mode === 'dialog'` section US1 leaves as a placeholder — build after US1 for a working end-to-end flow, though its controls (T025-T028) don't structurally depend on US1's editor internals
  - US3 (P3) changes how `mode` is initialized (T031) — build after US1/US2 so both editing (US1) and dialog-mode controls (US2) already exist to land in the "skip straight to" target
- **Polish (Phase 6)**: Depends on all three user stories being complete

### Parallel Opportunities

- T001-T003 (Setup) can run in parallel
- T004-T005 (both in `noteModifiers.ts` but non-overlapping regions) can run in parallel; T006-T011 depend on T004/T005 only insofar as they reference `SmoLyric`'s new members, but can be drafted in parallel and reconciled at integration
- T025-T027 (Phase 4) touch different, additive sections of the same `annotation.vue` template and can be drafted in parallel, merged before T028
- T034-T035 (Polish) can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently via quickstart.md §1-3
5. Deploy/demo if ready — an annotation can be created, edited, and cleared, with correct multi-selection behavior, using default font/position/justify

### Incremental Delivery

1. Complete Setup + Foundational → annotations can be created programmatically and render correctly
2. Add User Story 1 → Text menu + text editing + multi-selection → Test independently (MVP!)
3. Add User Story 2 → font/offset/justify controls → Test independently
4. Add User Story 3 → reopen-into-dialog-mode → Test independently
5. Polish → drag/reflow, legacy-score, and save/reload validation

## Outstanding Work

All code tasks (T001-T023, T025-T028, T030-T032, T036) are complete; `npx tsc --noEmit` and `npm run build` both pass cleanly. The five manual browser-validation tasks (T024, T029, T033, T034, T035) have **not** been run in this session — no browser/UI automation tool was available. Before considering this feature shippable, run the dev server (`npm run server`) and manually walk through [quickstart.md](./quickstart.md) end to end.
