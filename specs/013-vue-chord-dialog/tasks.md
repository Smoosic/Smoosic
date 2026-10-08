---

description: "Task list template for feature implementation"
---

# Tasks: Vue-Based Chord Change Dialog

**Input**: Design documents from `/specs/013-vue-chord-dialog/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/component-interfaces.md](./contracts/component-interfaces.md), [quickstart.md](./quickstart.md)

**Tests**: This project has no wired automated test runner (`npm test` is a no-op placeholder) and the feature spec does not request TDD. No automated test tasks are generated; each story instead ends with a manual validation task against `quickstart.md`. The one exception is `chordText.ts`'s pure encode/decode round-trip, called out as an optional ad-hoc check in the Polish phase (quickstart.md's "Optional" section), since it needs no browser/UI to verify.

**Organization**: Tasks are grouped by user story (from spec.md, priorities P1–P5) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Every task includes an exact file path

## Path Conventions

Single front-end project — all paths are under `src/ui/` (or `src/smo/`/`src/render/sui/`/`src/common/` for reused, unmodified legacy code), per plan.md's Project Structure. No `backend/`/`frontend/` split, no new top-level directories.

**Note on state ownership**: Following the precedent established while implementing `010-vue-lyric-dialog` (see that feature's tasks.md "Implementation Notes (as executed)"), the creation function (`chordChangeVue.ts`) stays a thin shell — it derives the initial selector and installs the dialog with no-op `commitCb`/`cancelCb` closures — while all transient dialog state and behavior (`mode`, `currentChord`, `loadNote`, `commitIfChanged`, navigation, etc., per data-model.md) lives in `chord.vue` itself, since that is where the mounted `chordEditor` template ref (needed to read `getText()`) actually lives. Tasks below are written against this actual convention rather than the original (superseded) `010` task text.

---

## Phase 1: Setup

**Purpose**: Create the new source files as empty, correctly-typed scaffolding so later phases only fill in logic.

- [X] T001 [P] Create stub `src/ui/dialogs/chordChangeVue.ts` exporting an empty `SuiChordChangeDialogVue(parameters: SuiDialogParams): void` function, matching the signature in [contracts/component-interfaces.md](./contracts/component-interfaces.md) §1
- [X] T002 [P] Create stub `src/ui/components/dialogs/chord.vue` (`<script setup lang="ts">`) declaring the `Props` interface from [contracts/component-interfaces.md](./contracts/component-interfaces.md) §2, with an empty `<template>`
- [X] T003 [P] Create stub `src/ui/components/dialogs/chordEditor.vue` (`<script setup lang="ts">`) declaring the `Props`/`Expose` interfaces from [contracts/component-interfaces.md](./contracts/component-interfaces.md) §3, with an empty `<template>`
- [X] T004 [P] Create stub `src/ui/components/dialogs/chordText.ts` declaring the `TextType`/`ChordSegment` types and empty `decodeChordText`/`encodeChordText` function signatures from [contracts/component-interfaces.md](./contracts/component-interfaces.md) §4

**Checkpoint**: New files exist and type-check with no logic yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared dialog scaffolding and the pure chord-text codec every user story depends on — the dialog can open, load the initially-selected note's chord symbol, and close, but no story-specific control is wired yet.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 In `src/ui/components/dialogs/chordText.ts`, implement `decodeChordText(raw: string): ChordSegment[]`: tokenize via `SmoLyric._tokenizeChordString(raw)` (`src/smo/data/noteModifiers.ts`), track a running `textType` starting at `SuiInlineText.textTypes.normal` and updated via `SuiInlineText.getTextTypeResult(textType, SuiTextEditor.textTypeFromChar(token))` on `^`/`%` tokens, and emit one `ChordSegment` per literal-text run (`kind: 'text'`) or `@glyphKey@` run (`kind: 'glyph'`), each stamped with the `textType` active at that point — per [research.md](./research.md) §6
- [X] T006 In `src/ui/components/dialogs/chordText.ts`, implement `encodeChordText(segments: ChordSegment[]): string`: walk `segments`, tracking `previousType` starting at `normal`; whenever a segment's `textType` differs from `previousType`, emit `SuiTextEditor.textTypeToChar(SuiInlineText.getTextTypeTransition(previousType, segment.textType))` and update `previousType`; then emit the segment's literal text or `'@' + glyphKey + '@'` — per [research.md](./research.md) §6
- [X] T007 In `src/ui/dialogs/chordChangeVue.ts`, capture `view.tracker.selections[0]` and a deep-copied `SmoSelector` as the `initialSelector` passed into `appParams`, matching `SuiChordChangeDialog`'s constructor (`src/ui/dialogs/chordChange.ts`) and `SuiLyricDialogVue`'s existing pattern (`src/ui/dialogs/lyricVue.ts`)
- [X] T008 In `src/ui/dialogs/chordChangeVue.ts`, define no-op `commitCb`/`cancelCb` closures and call `InstallDialog({ root, app: chordComp, appParams, dialogParams: parameters, commitCb, cancelCb })` with **no** `removeCb` (matching `SuiChordChangeDialog.bindElements()` removing the remove-button, per [research.md](./research.md) §8)
- [X] T009 In `src/ui/components/dialogs/chord.vue`, define `type DialogMode = 'editing' | 'dialog'` and a `mode: Ref<DialogMode>` initialized unconditionally to `'editing'` on every open (FR-016), plus the working-copy refs from [data-model.md](./data-model.md) (`currentSelector`, `ordinality`, `currentChord`, `originalText`, `currentTextType`, `translateY`, `fontInfo`, `adjustWidth`)
- [X] T010 In `src/ui/components/dialogs/chord.vue`, implement `loadNote(selector, ordinality)`: resolve the note via `SmoSelection.noteFromSelector`, fetch its chord symbol via `note.getLyricForVerse(ordinality, SmoLyric.parsers.chord)` or construct a default `SmoLyric` (parser `chord`) from the score's `'chords'` font entry if none exists, and populate `currentChord`, `originalText`, `translateY`, `fontInfo`, `adjustWidth` — mirroring `SuiChordSession._setLyricForNote()` (`src/render/sui/textEdit.ts:1373-1396`), per [data-model.md](./data-model.md) Operations
- [X] T011 In `src/ui/components/dialogs/chord.vue`, implement `commitIfChanged()`: read the mounted `chordEditor` ref's `getText()` (the current content re-encoded via `encodeChordText`); if it differs from `originalText` and `currentChord` is not `deleted`, call `currentChord.value.setText(text)` then `await view.addOrUpdateLyric(currentSelector.value, currentChord.value)` — mirroring `SuiChordSession`'s update-on-leave behavior
- [X] T012 In `src/ui/components/dialogs/chord.vue`, implement a shared `finish()` (call `commitIfChanged()` only if `mode.value === 'editing'`, no undo-group open/close per [research.md](./research.md) §8), and wrap the `commitCb`/`cancelCb` props (from `InstallDialog`) with `handleCommit`/`handleCancel` that call `finish()` first
- [X] T013 In `src/ui/components/dialogs/chord.vue`, build the `dialogContainer`-wrapped shell with `v-if`-gated sections for `mode === 'editing'` vs `mode === 'dialog'` per the Visibility contract in [contracts/component-interfaces.md](./contracts/component-interfaces.md) §2, passing `handleCommit`/`handleCancel` to `dialogContainer` (no `removeCb` prop)
- [X] T014 In `src/ui/components/dialogs/chord.vue`, call `loadNote(currentSelector, 0)` once at setup (ordinality `0`, the `dialogElements` default) so `mode === 'editing'` (T009) opens pre-loaded, matching `SuiChordChangeDialog.bindElements()`'s unconditional `startEditSession()`

**Checkpoint**: Dialog installs, opens into edit mode on the initially-selected note (with an empty editor placeholder), and closes generically via OK/Cancel; `mode` structurally enforces FR-014. `chordText.ts`'s codec is complete and ready for the editor to use. Ready for stories to add real controls.

---

## Phase 3: User Story 1 - Enter or edit a chord symbol as text with music-glyph shortcuts (Priority: P1) 🎯 MVP

**Goal**: Replace the legacy `SuiChordEditor` SVG glyph-mixing editor with an embedded TipTap panel that supports plain-text entry plus the seven recognized shortcut characters (`b`, `#`, `+`, `-`, `(`, `)`, `/`), producing byte-identical `SmoLyric.text` output so the existing, untouched score-rendering pipeline (`vxNote.ts`/`getVexChordBlocks`) renders the correct music glyphs.

**Independent Test**: Select a note, open the Chord Symbol dialog, confirm the editor opens automatically pre-loaded with that note's chord symbol (or empty), type a chord name containing shortcut characters, end the session, and confirm the score shows the corresponding music glyphs in place of those characters.

### Implementation for User Story 1

- [X] T015 [P] [US1] In `src/ui/components/dialogs/chordEditor.vue`, define a custom atomic inline TipTap Node extension `chordGlyph` (`inline: true, group: 'inline', atom: true, selectable: true`, no editable content, one attribute `glyphKey: string`) rendering a short ASCII placeholder derived from `glyphKey` (identity for single-character keys `b`/`#`/`+`/`-`/`(`/`)`/`/`; short labels like `dim`/`hdim`/`maj7` for `diminished`/`halfDiminished`/`majorSeventh`) — per [research.md](./research.md) §4
- [X] T016 [US1] In `src/ui/components/dialogs/chordEditor.vue`, register `@tiptap/extension-superscript` and `@tiptap/extension-subscript` as marks in the `useEditor` extensions list (no toolbar/UI yet — just structural support so round-tripping existing `^`/`%`-bearing text doesn't lose information), per [research.md](./research.md) §5
- [X] T017 [US1] In `src/ui/components/dialogs/chordEditor.vue`, implement `toDoc(segments: ChordSegment[])`/`fromDoc(): ChordSegment[]` mapping between `ChordSegment[]` and the TipTap/ProseMirror JSON document: a `text` segment becomes a text node with the `Superscript`/`Subscript` mark applied per its `textType` (neither mark when `normal`); a `glyph` segment becomes one `chordGlyph` node (T015) with the same mark applied per its `textType`
- [X] T018 [US1] In `src/ui/components/dialogs/chordEditor.vue`, initialize `useEditor` with `StarterKit` configured to disable every mark/block extension except `paragraph`/`text` (no bold, italic, strike, code, links, headings, lists, blockquote), suppress Enter/hard-break (single-line content, matching `lyricEditor.vue`), set initial content via `toDoc(decodeChordText(props.text))` (T005, T017), and re-initialize (`setContent`, `emitUpdate: false`) whenever `props.text` changes
- [X] T019 [US1] In `src/ui/components/dialogs/chordEditor.vue`, add a private helper `insertGlyphAtCursor(glyphKey: string)` that inserts one `chordGlyph` node (T015) at the current selection, marked per the active text-position state (see T025 in US3 for the exposed/dropdown-driven entry point; here it is used only internally)
- [X] T020 [US1] In `src/ui/components/dialogs/chordEditor.vue`, implement a keyboard-shortcut TipTap Extension recognizing exactly `b`, `#`, `+`, `-`, `(`, `)`, `/` (membership test against `ChordSymbolGlyphs`, `src/common/vex.ts`) that calls `insertGlyphAtCursor(char)` (T019) instead of inserting the literal character — per [research.md](./research.md) §3; every other character continues to insert as ordinary (possibly superscript/subscript-marked) text
- [X] T021 [US1] In `src/ui/components/dialogs/chordEditor.vue`, implement `getText(): string` (`encodeChordText(fromDoc())`, T006/T017) and `defineExpose({ getText })` — per [contracts/component-interfaces.md](./contracts/component-interfaces.md) §3
- [X] T022 [US1] In `src/ui/components/dialogs/chord.vue`, embed `chordEditor.vue` into the editing-mode section, bound to `:text="currentChord.getText()"` (reactive to `loadNote`, T010) / `:fontInfo="fontInfo"`, with a template ref (`chordEditorRef`) for calling `getText()` from `commitIfChanged()` (T011)
- [ ] T023 [US1] Manually validate against [quickstart.md](./quickstart.md) §1 (auto-open into edit mode pre-loaded with existing text; typed shortcut characters become the correct music glyphs on the score once editing ends; a note with no chord symbol opens empty)

**Checkpoint**: User Story 1 is fully functional and independently testable — this is the MVP.

---

## Phase 4: User Story 2 - See the chord symbol update on the score as you type (Priority: P2)

**Goal**: A debounced (~400ms) periodic score update while typing, reusing `commitIfChanged()` unchanged, matching `012-lyric-live-preview-cursor`'s pattern for the lyric dialog.

**Independent Test**: Type a chord name containing a shortcut character, pause without navigating away or finishing editing, and confirm the note's chord symbol on the score updates to the in-progress text (with correct glyphs) within about half a second, without interrupting continued typing.

### Implementation for User Story 2

- [X] T024 [US2] In `src/ui/components/dialogs/chordEditor.vue`, add `onUpdate: schedulePreview` to the `useEditor` config, where `schedulePreview`/`pushPreview` implement a 400ms debounce (`PREVIEW_DEBOUNCE_MS`, matching `lyricEditor.vue`) and `pushPreview()` does `emit('preview')` — per [contracts/component-interfaces.md](./contracts/component-interfaces.md) §3 and [research.md](./research.md) §9
- [X] T025 [US2] In `src/ui/components/dialogs/chord.vue`, bind `@preview="onEditorPreview"` on `<chordEditorComp>`, where `onEditorPreview` is simply `await commitIfChanged()` (T011), reused unchanged
- [ ] T026 [US2] Manually validate against [quickstart.md](./quickstart.md) §2 (periodic, debounced score update while typing; no flicker/lag; clears when text is deleted back to empty)

**Checkpoint**: User Stories 1 and 2 are both independently functional.

---

## Phase 5: User Story 3 - Insert a symbol or toggle superscript/subscript from a dropdown (Priority: P3)

**Goal**: The Symbols dropdown (Dim/Half dim/Slash/Maj7) and the Text Position dropdown (Superscript/Subscript/Normal), available only in edit mode.

**Independent Test**: Select each Symbols option and confirm the corresponding glyph is inserted at the cursor and renders correctly on the score; select Superscript/Subscript and confirm subsequently-typed characters render raised/lowered on the score once updated, while earlier text is unaffected.

### Implementation for User Story 3

- [X] T027 [US3] In `src/ui/components/dialogs/chordEditor.vue`, expose the internal `insertGlyphAtCursor` helper (T019) as `insertGlyph(glyphKey: string)` via `defineExpose` — per [contracts/component-interfaces.md](./contracts/component-interfaces.md) §3
- [X] T028 [US3] In `src/ui/components/dialogs/chordEditor.vue`, accept a `textType: number` prop (`currentTextType` from the parent, `SuiInlineText.textTypes`) and use it to determine the `Superscript`/`Subscript` mark (or neither) applied to content inserted going forward — both via ordinary typing and via `insertGlyph`/the shortcut-character path (T020) — per [research.md](./research.md) §5; previously-inserted content is never retroactively changed
- [X] T029 [P] [US3] In `src/ui/components/dialogs/chord.vue`'s editing-mode section, add a Symbols `select.vue` dropdown (4 options — "Dim"/`csymDiminished`, "Half dim"/`csymHalfDiminished`, "Slash"/`csymDiagonalArrangementSlash`, "Maj7"/`csymMajorSeventh`, matching `SuiChordChangeDialog.dialogElements` `src/ui/dialogs/chordChange.ts`); on change, resolve the glyph key via `getChordSymbolGlyphFromCode(value)` (`src/common/vex.ts`, per [research.md](./research.md) §3) and call `chordEditorRef.insertGlyph(resolvedKey)` (T027)
- [X] T030 [P] [US3] In `src/ui/components/dialogs/chord.vue`'s editing-mode section, add a Text Position `select.vue` dropdown (Superscript/Subscript/Normal, matching `SuiChordChangeDialog.dialogElements`); on change, set `currentTextType.value` (T009), passed down to `chordEditor.vue` as the `textType` prop (T028)
- [X] T031a [US3] In `src/ui/components/dialogs/chordEditor.vue`, add `^` and `%` entries to the `ChordGlyphShortcuts` keyboard-shortcut extension: each computes the toggled type via `SuiInlineText.getTextTypeResult(props.textType, target)` with a locally-defined `char → target` mapping (`'^' → subScript`, `'%' → superScript`, deliberately the reverse of `SuiTextEditor.textTypeFromChar`) and emits a new `textTypeChange` event with the result, instead of inserting the character — per [research.md](./research.md) §10, FR-025/FR-026
- [X] T031b [US3] In `src/ui/components/dialogs/chord.vue`, bind `@textTypeChange="onEditorTextTypeChange"` on `<chordEditorComp>`, where `onEditorTextTypeChange(type)` sets `currentTextType.value = type` — the identical effect as `onTextPositionChange`, so both input methods share one source of truth
- [ ] T031 [US3] Manually validate against [quickstart.md](./quickstart.md) §3 (each Symbols option inserts the correct glyph; Text Position affects only subsequently-typed content; three consecutive text-position changes produce three distinct runs on the score) and against the `^`/`%` keyboard-shortcut acceptance scenarios in spec.md User Story 3 (added post-implementation)

**Checkpoint**: User Stories 1-3 are all independently functional.

---

## Phase 6: User Story 4 - Move between notes and delete a chord symbol while editing (Priority: P4)

**Goal**: Next/previous-note controls that save the current note's chord symbol and load the adjacent note's, plus a delete control, stopping cleanly at the first/last note in the score.

**Independent Test**: Type a chord symbol, click "next note", confirm the text was saved and the editor now shows the next note's chord symbol; click delete on a note with a chord symbol and confirm it is removed and the editor advances; confirm navigating past the first/last note has no effect.

### Implementation for User Story 4

- [X] T032 [US4] In `src/ui/components/dialogs/chord.vue`, implement `navigate(direction: 'next' | 'previous')`: `commitIfChanged()` (reads `chordEditorRef.getText()` internally, T011) → resolve `SmoSelection.nextNoteSelectionFromSelector`/`lastNoteSelectionFromSelector(score, currentSelector.value)` → if found, set `currentSelector.value` to the new selector and call `loadNote(currentSelector.value, ordinality.value)`; if `null`, no-op — per [data-model.md](./data-model.md) Operations
- [X] T033 [P] [US4] Add next-note and previous-note arrow controls in `chord.vue`'s editing-mode section, calling `navigate('next')` / `navigate('previous')`
- [X] T034 [US4] In `src/ui/components/dialogs/chord.vue`, implement `deleteCurrent()`: `await view.removeLyric(currentSelector.value, currentChord.value)` (marks the chord symbol `deleted`), then resolve and move to the next note *without* an intervening `commitIfChanged()` call — mirroring the lyric dialog's `deleteCurrent()` (`010-vue-lyric-dialog`) and `SuiChordSession`'s inherited `removeLyric()` ordering
- [X] T035 [P] [US4] Add a delete (cross) control in `chord.vue`'s editing-mode section, calling `deleteCurrent()`
- [ ] T036 [US4] Manually validate against [quickstart.md](./quickstart.md) §4 (forward/backward navigation across a run of notes; delete removes and advances; no-op at score boundaries)

**Checkpoint**: User Stories 1-4 are all independently functional.

---

## Phase 7: User Story 5 - Finish editing and adjust ordinality, position, font, and note width (Priority: P5)

**Goal**: A mode toggle into "dialog mode" exposing Ordinality, Y Adjustment, Font, and Adjust Note Width controls, and back into edit mode, with the score-wide Font/Adjust-Note-Width semantics preserved.

**Independent Test**: Finish typing a chord symbol, mark editing complete, confirm the four dialog-mode controls appear (and edit-mode controls disappear), change each, and confirm the corresponding update; confirm resuming editing restores the text editor.

### Implementation for User Story 5

- [X] T037 [US5] In `src/ui/components/dialogs/chord.vue`, implement `enterDialogMode()` (`commitIfChanged()` → `mode.value = 'dialog'`) and `enterEditingMode()` (`mode.value = 'editing'`, no reload needed since `currentSelector`/`ordinality` state is already current) — per [data-model.md](./data-model.md) Operations
- [X] T038 [P] [US5] Add a "done editing" control in `chord.vue`'s editing-mode section (calling `enterDialogMode()`) and a separate "edit chord symbols" control in the dialog-mode section (calling `enterEditingMode()`) — two mode-specific buttons, matching the `010` convention (research.md §8)
- [X] T039 [P] [US5] Add an Ordinality control using `select.vue` in `chord.vue`'s dialog-mode section (3 options, labels "1"-"3", values `"0"`-`"2"`, from `SuiChordChangeDialog.dialogElements` `src/ui/dialogs/chordChange.ts`), calling `onOrdinalityChange(v)`: `ordinality.value = parseInt(v, 10)` then `loadNote(currentSelector.value, ordinality.value)` (reloads display state only — no score write until editing resumes, per [research.md](./research.md) §1)
- [X] T040 [P] [US5] Add a Y Adjustment control using `numberInput.vue` in `chord.vue`'s dialog-mode section, `precision: 0` with explicit `minValue`/`maxValue` (e.g. `-9999`/`9999`, matching `010` research.md §5), calling `onYChange(v)`: `translateY.value = v` → `currentChord.value.translateY = v` → `await view.addOrUpdateLyric(currentSelector.value, currentChord.value)`
- [X] T041 [P] [US5] Add a Font control using `fontPicker.vue` in `chord.vue`'s dialog-mode section (family/size fields only), seeded from `currentChord.value.fontInfo`, calling `onFontChange(font)`: `fontInfo.value = { ...font, weight: 'normal' }` → `await view.setChordFont({ family: font.family, size: font.size, weight: 'normal' })` — score-wide, not per-chord-symbol, per [research.md](./research.md) §7
- [X] T042 [P] [US5] Add an Adjust Note Width control using `toggle.vue` in `chord.vue`'s dialog-mode section, seeded from `currentChord.value.adjustNoteWidthChord`, calling `onAdjustWidthChange(v)`: `adjustWidth.value = v` → `view.score.setChordAdjustWidth(v)` — score-wide, matching the legacy dialog's direct `view.score.*` call (no `SuiScoreViewOperations` wrapper exists for this setting), per [research.md](./research.md) §7
- [ ] T043 [US5] Manually validate against [quickstart.md](./quickstart.md) §5 (mode toggle both directions; Ordinality reload has no immediate score effect; Y Adjustment accepts negative values; Font and Adjust Note Width changes are score-wide)

**Checkpoint**: All five user stories are independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Verify OK/Cancel parity, confirm the legacy-free and byte-identical-output success criteria, and run the end-to-end regression pass.

- [X] T044 [P] Verify OK and Cancel produce identical results (both call the same `finish()` from T012) per [quickstart.md](./quickstart.md) §6 (FR-023, spec Edge Case)
- [X] T045 [P] Audit `src/ui/components/dialogs/chord.vue`, `src/ui/components/dialogs/chordEditor.vue`, `src/ui/components/dialogs/chordText.ts`, and `src/ui/dialogs/chordChangeVue.ts` to confirm none import the legacy `SuiComponentBase`-derived classes or session/editor classes (`SuiDropdownComponent`, `SuiRockerComponent`, `SuiFontComponent`, `SuiToggleComponent`, `SuiNoteTextComponent`/`SuiChordComponent`, `SuiChordSession`, `SuiChordEditor`) — confirms SC-006
- [X] T046 Run `npm run build` and fix any TypeScript errors introduced by the new/changed files
- [ ] T047 Temporarily wire `SuiChordChangeDialogVue` into a real call site (see [quickstart.md](./quickstart.md) Prerequisites), run the full quickstart.md validation pass end-to-end via `npm run server`, then revert the temporary wiring (do not commit the swap) — confirms SC-001 through SC-005
- [ ] T048 [P] Perform the regression-diff check from [quickstart.md](./quickstart.md) "Regression check against the legacy dialog": compare `note.getLyricForVerse(verse, SmoLyric.parsers.chord)` raw `text` between the legacy and new dialog for an equivalent edit sequence (must match byte-for-byte per [contracts/component-interfaces.md](./contracts/component-interfaces.md) §4's round-trip contract), and confirm the score-wide Font/Adjust-Note-Width settings match after equivalent changes
- [ ] T049 [P] Perform the optional `chordText.ts` round-trip check from [quickstart.md](./quickstart.md) "Optional" section (`encodeChordText(decodeChordText(raw)) === raw` for representative strings including a mid-text glyph, a superscript-to-subscript direct transition, and a lone dropdown-only glyph)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - Structurally, US2-US5 each build on the editor/state US1 introduces (`chordEditor.vue`'s document, `chord.vue`'s `commitIfChanged`/`loadNote`), so they are listed and best executed in priority order (P1 → P2 → P3 → P4 → P5) even though each adds controls to a distinct section of `chord.vue`/`chordEditor.vue`
- **Polish (Phase 8)**: Depends on all five user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependency on other stories; this is the MVP and the highest-risk part of the migration (the chord-text codec plus the TipTap glyph/mark model)
- **User Story 2 (P2)**: Can start after Foundational — depends on US1's `chordEditor.vue` document existing for `onUpdate` to hook into
- **User Story 3 (P3)**: Can start after Foundational — depends on US1's `insertGlyphAtCursor`/shortcut-character plumbing (T019/T020) and the `chordGlyph` node (T015) to extend with an exposed `insertGlyph`/`textType` prop
- **User Story 4 (P4)**: Can start after Foundational — depends on US1's `commitIfChanged`/`loadNote` (Foundational, not US1-specific) but not on US2/US3
- **User Story 5 (P5)**: Can start after Foundational — no dependency on US1-US4 beyond the shared `mode` ref (Foundational)

### Within Each User Story

- Story-specific logic in `chordEditor.vue`/`chordText.ts` before the controls in `chord.vue` that call it
- Wiring before the manual validation task
- Story complete before moving to next priority (recommended sequencing, since US1-US5 share `chord.vue`/`chordEditor.vue`)

### Parallel Opportunities

- T001-T004 (Setup) can all run in parallel — four independent new files
- T029 and T030 (US3) are independent dropdowns in the same editing-mode template section; treat as parallel-safe only if coordinated by a single editor of `chord.vue`
- T033 and T035 (US4) are independent controls, likewise
- T038-T042 (US5) are five independent controls and can be done in parallel by different contributors coordinating on `chord.vue`
- T044, T045, T048, T049 (Polish) are independent verification passes and can run in parallel

---

## Parallel Example: Setup

```bash
Task: "Create stub src/ui/dialogs/chordChangeVue.ts exporting SuiChordChangeDialogVue"
Task: "Create stub src/ui/components/dialogs/chord.vue with Props interface"
Task: "Create stub src/ui/components/dialogs/chordEditor.vue with Props/Expose interfaces"
Task: "Create stub src/ui/components/dialogs/chordText.ts with ChordSegment types and encode/decode signatures"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories; includes the full `chordText.ts` codec)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run quickstart.md §1 independently
5. This alone delivers FR-001 through FR-009, FR-014, FR-016 (partially), FR-019, FR-022, FR-023 — the highest-risk part of the migration (replacing the SVG-mixing `SuiChordEditor` with a TipTap panel that still produces byte-identical persisted chord text)

### Incremental Delivery

1. Setup + Foundational → dialog shell ready, opens pre-loaded on the selected note, chord-text codec complete
2. Add User Story 1 → validate independently (MVP: chord text entry with music-glyph shortcuts works end-to-end)
3. Add User Story 2 → validate independently (live score preview while typing, doesn't regress US1)
4. Add User Story 3 → validate independently (Symbols/Text Position dropdowns work)
5. Add User Story 4 → validate independently (navigation/delete work)
6. Add User Story 5 → validate independently (mode toggle + Ordinality/Y/Font/Adjust-Width controls work)
7. Phase 8: Polish — confirm SC-006 (no legacy component/session classes), run full quickstart.md, regression-diff against `SuiChordChangeDialog`, optional codec round-trip check

### Notes

- `SuiChordChangeDialog` (`src/ui/dialogs/chordChange.ts`) and its call sites are never modified by any task above — the swap-in during T047 is explicitly temporary and reverted before completion, per the spec's scope boundary.
- No task introduces a new project dependency; `vue`, `@tiptap/*` (including `@tiptap/extension-superscript`/`-subscript`) are already present in `package.json`.
- Per [research.md](./research.md) §2, §8, and §9, `SuiChordSession`, `SuiChordEditor`, and the legacy dialog's `remove-button` are intentionally **not** ported, and no position-marker cursor (unlike `012-lyric-live-preview-cursor`) is added for chords — no task should reintroduce/add these.
- The real chord-rendering pipeline (`src/render/vex/vxNote.ts`, `src/render/vex/smoAdapter.ts`, `SmoLyric._tokenizeChordString`) is read-only for this feature — no task modifies it; T048's regression check is what verifies this constraint held.

## Implementation Notes (as executed)

**Design decisions and deviations from the task text, decided during implementation for correctness/simplicity — code is authoritative over these task descriptions:**

- **Superscript/Subscript mark propagation (T016, T020, T028, T038)**: Ordinary typed text relies on ProseMirror/TipTap's built-in "stored marks" mechanism — the same mechanism that makes "toggle Bold, then type" work in any rich-text editor — so `chord.vue`'s `currentTextType` change simply calls `setSuperscript()`/`setSubscript()`/`unsetSuperscript()`+`unsetSubscript()` via a `watch` on `props.textType` inside `chordEditor.vue`, and subsequently-typed plain characters inherit the mark automatically. This is *not* relied on for glyph insertion: both the shortcut-character path (`ChordGlyphShortcuts` extension) and the exposed `insertGlyph` method explicitly construct the inserted `chordGlyph` node's `marks` array from the live `props.textType` at insertion time, since stored-mark auto-propagation onto an explicitly-inserted atomic node is not a documented/guaranteed TipTap behavior. Both paths are driven by the same `textType` value, so they can never disagree.
- **`insertGlyphAtCursor` vs. `insertGlyph` (T019 vs. T027)**: These ended up as the same function — `insertGlyph`, exposed via `defineExpose` from the start — rather than a private helper wrapped by a later public one. Splitting them into two tasks (US1 internal-only, US3 exposed) reflected planned incremental delivery order, not two different code paths; since both the keyboard-shortcut extension (US1) and the parent's Symbols dropdown (US3) need the identical "insert this glyph key, marked per the current text type" behavior, one function correctly serves both from the outset.
- **Round-trip contract verification (T049)**: Executing `chordText.ts`'s `decodeChordText`/`encodeChordText` in isolation via `ts-node` was not possible in this sandboxed environment — the module graph transitively reaches `.vue` files (via `render/sui/textEdit.ts` → `scoreViewOperations.ts` → UI dialog modules) that only the project's own webpack + `vue-loader` pipeline can load; plain Node/`ts-node` fails on the `.vue` extension. In place of executing the script, the encode/decode algorithm was traced by hand against `SuiInlineText.getTextTypeResult`/`getTextTypeTransition`'s actual transition tables for representative cases (a mid-text glyph, a direct superscript→subscript transition, a lone dropdown-only glyph), confirming round-trip fidelity for every string shape the legacy `SuiChordEditor.getText()` can actually produce. (One edge case does *not* round-trip: a raw string with a *trailing, dangling* toggle character with no content after it, e.g. `"C^7%9%"` — the trailing `%` is dropped on re-encode. This is expected and matches legacy behavior: the legacy editor's own block-based model never emits a transition character except between two blocks, so it could never have produced a dangling trailing toggle in the first place; the contract in `contracts/component-interfaces.md` §4 is explicitly scoped to strings producible by the legacy editor, which this case is not.) T049 is left unchecked because the task as written calls for actually *running* a check, which did not execute successfully here — a human or a future session with a working Node/`ts-node` setup (or a small `jest`/`vitest` addition) should run it before treating this item as verified.
- **Verification performed**: `npm run build` (T046) was run with `SuiChordChangeDialogVue` temporarily wired into `src/ui/menus/text.ts`'s `chordChangeDialogMenuOption` (the same call site `SuiChordChangeDialog` uses today), the same approach `010-vue-lyric-dialog` used, so `ts-loader` would actually type-check the four new files — they aren't reachable from the build's entry point otherwise. The build compiled cleanly with no TypeScript errors (module count for `src/ui/` rose from 432 to 444, confirming the new files were actually included). The temporary wiring was reverted immediately after (`git diff` on `src/ui/menus/text.ts` is empty) and is not part of the final diff. A grep audit (T045) confirmed none of the four new files import any legacy `SuiComponentBase`-derived or session/editor class.
- **Not performed**: T023, T026, T031, T036, T043, T047, and T048 all require driving the dialog in a live browser (typing into the TipTap panel including the seven shortcut characters, picking dropdown options, clicking navigation/delete/mode controls, and inspecting the rendered chord symbols on the score). No browser/UI-automation tool was available in this session to do that safely, so these remain unchecked rather than being marked done on the strength of code review alone. T044 (OK/Cancel parity) *was* marked done, since it is fully verifiable by code inspection alone — both handlers call the identical `finish()` (T012) with no divergent logic, needing no browser to confirm. A human (or a future session with browser access) should run through [quickstart.md](./quickstart.md) using the same temporary-wiring approach described in its Prerequisites, and perform the regression-diff and round-trip checks, before treating this feature as verified end-to-end.
- **T031a/T031b addendum (post-implementation correction)**: After initial implementation, the feature owner corrected the `^`/`%` keyboard-shortcut mapping (not present in the original task list — spec.md, research.md §10, and contracts/component-interfaces.md §3 were all updated alongside this code change). Unlike the temporary wiring for T046, `SuiChordChangeDialogVue` was *left* wired into `src/ui/menus/text.ts`'s `chordChangeDialogMenuOption` for this round, at the feature owner's own request/action (they were using it for live manual testing, which is how the missing shortcuts were noticed) — so, unlike the earlier verification pass, `git diff` on `src/ui/menus/text.ts` is **not** empty after this change; that file's temporary wiring should still be reverted before this feature is considered ready to merge, per the spec's scope boundary (`SuiChordChangeDialog` and its call sites are not meant to change as part of this migration). `npm run build` was re-run with this wiring in place and compiled cleanly.
