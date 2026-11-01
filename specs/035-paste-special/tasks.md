---

description: "Task list for Paste Special"
---

# Tasks: Paste Special for Note Attachments

**Input**: Design documents from `/specs/035-paste-special/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/paste-special-api.md, quickstart.md

**Tests**: Requested (FR-015). One headless file, `tests/pasteSpecial.ts`, grown story by story.

**Organization**: Grouped by user story. The alignment routine (Foundational) serves every story. US1 is the paste itself plus the dialog and menu, US2 replace/add, US3 alignment with different rhythms, US4 chords and unchanged kinds, US5 undo and removal of Paste Chords.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Phase 1: Setup

- [X] T001 Create `tests/pasteSpecial.ts` with the `check()`/failure-count harness and the dynamic-ctor registration used in `tests/voiceCopyPaste.ts`, plus a `buildScore()` helper: two staves, 4 measures of 4/4 quarter notes on staff 0 each carrying a distinctive dynamic, lyric (verse 0), annotation, chord, articulation and ornament (text includes the note's position), and staff 1 with different pitches and its own different markings; helpers `markings(note)` (per-kind lists of comparable strings), `pitchesAndDurations(score)` and `selectNotes()`/`dest()` like `voiceCopyPaste.ts`; register `"test:paste-special": "ts-node -P tests/tsconfig.json tests/pasteSpecial.ts"` in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The types and the alignment routine every story uses. See [research.md](research.md) R1 and [data-model.md](data-model.md).

- [X] T002 In `src/smo/xform/copypaste.ts` add the exported types `PasteAttributeKind`, `PasteAttributeMode`, `PasteAttributeOptions`, `PasteAttributePair` and a static `PasteBuffer.attributeKinds` list in dialog order (dynamics, lyrics, annotations, chords, articulations, ornaments), per [contracts/paste-special-api.md](contracts/paste-special-api.md)
- [X] T003 Add `PasteBuffer.hasNotes()` in `src/smo/xform/copypaste.ts`: true when any staff in `this.notes` has at least one note
- [X] T004 Add `PasteBuffer.alignAttributeNotes(selector, notes)` in `src/smo/xform/copypaste.ts`: the algorithm of the existing `pasteChordNotes` with the same two running totals of `tickCount` (named `copiedElapsed` and `destinationElapsed` in the new code), returning the `{ copied, destination }` pairs in order and changing nothing; returns `[]` for no notes or no score; stops when the destination part ends
- [X] T005 Add `PasteBuffer.getAttributePasteExtent(selector)` in `src/smo/xform/copypaste.ts`: use `pasteIntoScore` with a function that calls `alignAttributeNotes` and records the lowest and highest measure over all pairs, returns the notes unchanged, and returns `null` when there are no pairs
- [X] T006 Tests in `tests/pasteSpecial.ts` for the foundation: `hasNotes()` false before and true after a copy; alignment with the same rhythm pairs note *i* with note *i*; alignment returns `[]` for empty input and never changes the score; extent is `null` for no pairs and equals the pairs' min and max measure

**Checkpoint**: Alignment and extent exist and are verified in isolation.

---

## Phase 3: User Story 1 - Paste only chosen kinds onto existing notes (Priority: P1) 🎯 MVP

**Goal**: Choose kinds in a dialog from the Edit menu and have only those kinds appear on the destination, leaving pitches and rhythms alone.

**Independent Test**: With dynamics ticked only, staff 2 gains staff 1's dynamics and nothing else changes.

### Tests for User Story 1

- [X] T007 [US1] In `tests/pasteSpecial.ts` add: for each of the six kinds alone, same rhythm, only that kind arrives on the destination (compare `markings()` of every kind) and the others are unchanged; all six ticked; empty `kinds` does nothing; `pitchesAndDurations()` identical before and after for every case; a pasted marking is a different object from the copied one and editing the pasted one leaves the copied unchanged (FR-014); serialize then deserialize the score and the markings survive

### Implementation for User Story 1

- [X] T008 [US1] In `src/smo/xform/copypaste.ts` add the per-kind helpers from research R2 and R3: a `cloneModifier()` using `SmoNoteModifierBase.deserialize(item.serialize())`; for each kind a function that returns the copied note's items of that kind and one that adds a clone to a destination note (`addDynamic`, `addLyric`, `addAnnotation`, `addLyric` for chords after `SmoLyric.transposeChordToKey(chord, destMeasure.transposeIndex, copied.originalKey, destMeasure.keySignature)`, `setArticulation(a, true)`, `setOrnament(o, true)`)
- [X] T009 [US1] Add `PasteBuffer.pasteAttributes(selector, options)` in `src/smo/xform/copypaste.ts`: return when `kinds` is empty; use `pasteIntoScore`; group the alignment pairs by destination note (keyed by the note's `attrs.id`) keeping copied-note order; for each destination note add the items of each ticked kind (add mode only for now); never touch pitches, durations or unticked kinds
- [X] T010 [US1] In `src/render/sui/scoreViewOperations.ts` add `hasCopiedNotes()` and `pasteAttributes(options)`: return if nothing is copied or selected; compute the target as the existing `pasteChords` does (equivalent selection of the tracker's first selection, tick from the tracker); call `getAttributePasteExtent` for the measure range and return if `null`; then group undo with `_undoColumn('paste', i)` and `unrenderColumn` for each measure in the range, call `storePaste.pasteAttributes`, `replaceMeasureView(range)`, `await renderer.updatePromise()` (the structure of `paste()`)
- [X] T011 [P] [US1] Create `src/ui/components/dialogs/pasteSpecial.vue`: `dialogContainer` with six `toggle.vue` rows labelled Dynamics, Lyrics, Annotations, Chords, Articulations, Ornaments (all off), the container's `enable` bound to "at least one is on", following `addMeasures.vue`
- [X] T012 [US1] Create `src/ui/dialogs/pasteSpecial.ts` exporting `SuiPasteSpecialDialog(parameters)` using `InstallDialog` and `replaceVueRoot(modalContainerId)` like `addMeasure.ts`; its commit calls `parameters.view.pasteAttributes({ kinds, mode: 'replace' })`; cancel does nothing; export it from `src/application/exports.ts`
- [X] T013 [US1] In `src/ui/menus/edit.ts` replace `pasteChordsMenuOption` with `pasteSpecialMenuOption` (text "Paste Special...", `display` = `menu.view.hasCopiedNotes()`) whose handler calls `SuiPasteSpecialDialog` with the menu's `view`, `tracker`, `eventSource`, `completeNotifier` and `startPromise: menu.closePromise` as `file.ts` does; update the options list
- [X] T014 [US1] Run `npx tsc --noEmit -p tsconfig.json` and `npm run test:paste-special`

**Checkpoint**: Copy, then Paste Special with chosen kinds, works from the Edit menu.

---

## Phase 4: User Story 2 - Replace or add (Priority: P1)

**Goal**: The dialog chooses whether pasted markings replace or add to the destination's.

**Independent Test**: Over existing lyrics, replace gives the copied lyrics; add keeps both.

### Tests for User Story 2

- [X] T015 [P] [US2] In `tests/pasteSpecial.ts` add: replace over existing articulations, copied note has none, destination ends with none; replace with several kinds replaces only the ticked ones; add keeps existing and adds copied (articulations, ornaments, annotations, chords); add of a dynamic over an existing dynamic leaves exactly one (the pasted); add of a same-verse lyric leaves one while a different verse keeps both; replace clears only on destination notes that are aligned to a copied note

### Implementation for User Story 2

- [X] T016 [US2] In `PasteBuffer.pasteAttributes` add the replace step before adding: for each ticked kind clear the destination note's items of that kind (research R2 table: filter `textModifiers` by type or parser, `clearArticulations()`, `ornaments = []`), only for destination notes that appear in an alignment pair
- [X] T017 [US2] In `pasteSpecial.vue` add a "Replace existing" `toggle.vue` row (on by default) and pass its value through; update `pasteSpecial.ts` to send `mode: 'replace'` when on and `'add'` when off

**Checkpoint**: Both modes work from the dialog.

---

## Phase 5: User Story 3 - Alignment by elapsed time (Priority: P1)

**Goal**: Different rhythms line up exactly as the existing Paste Chords did.

**Independent Test**: Four quarter notes with lyrics onto eight eighth notes land on eighths 1, 3, 5, 7.

### Tests for User Story 3

- [X] T018 [P] [US3] In `tests/pasteSpecial.ts` add cases 7–13 and 15 of [quickstart.md](quickstart.md): quarters onto eighths (1, 3, 5, 7, others unchanged even in replace mode), two quarters onto whole notes in two measures, four quarters onto half, quarter, quarter (pairing 0, 1, 1, 2; the shared quarter gets both markings, later dynamic wins), copy longer than the destination part (stops, no error, no notes added), rests in copy and destination, a two-measure copy across the barline, a two-staff copy and a destination with too few staves; and for each, the dry-run extent equals the measures actually edited
- [X] T019 [US3] Run the tests; if the pairing or extent disagrees with the hand-traced results in research R1, fix `alignAttributeNotes` (it must reproduce `pasteChordNotes` exactly) without changing the rule

**Checkpoint**: Alignment verified against the old behavior.

---

## Phase 6: User Story 4 - Chords follow the key; the rest unchanged (Priority: P2)

**Goal**: Chords are transposed for the destination; every other kind is copied as is.

**Independent Test**: Chords pasted onto a transposing part are spelled for it and left alone on a concert-pitch part; lyrics and annotations are identical.

- [X] T020 [P] [US4] In `tests/pasteSpecial.ts` add: chords from a C-major measure pasted onto a D-major measure are transposed (compare with `SmoLyric.transposeChordToKey` output) and onto a transposing-instrument measure follow its `transposeIndex`; lyrics, annotations, dynamics, articulations and ornaments pasted onto the D-major measure have identical text and settings (including position offsets); two successive pastes of different kinds leave the first paste's kinds alone
- [X] T021 [US4] Fix `pasteAttributes` chord handling if the test shows a difference from the old Paste Chords output for the same input (compare against the removed `pasteChordNotes` logic, kept in git history)

**Checkpoint**: Key handling matches the old chord paste; other kinds untouched by transposition.

---

## Phase 7: User Story 5 - One undo step; Paste Chords folded in (Priority: P3)

**Goal**: One undo restores the score; the old command is gone.

**Independent Test**: Paste Special then Undo once restores the score; the Edit menu has Paste Special and no Paste Chords.

- [X] T022 [US5] Remove `PasteBuffer.pasteChords` and `PasteBuffer.pasteChordNotes` from `src/smo/xform/copypaste.ts` and `SuiScoreViewOperations.pasteChords` from `src/render/sui/scoreViewOperations.ts`; grep `src`, `tests`, `types` for remaining references and fix them
- [X] T023 [US5] Review `pasteAttributes` in `scoreViewOperations.ts` against `paste()`: the undo grouping spans every measure in the extent so one Undo restores them all; add a comment saying so. (Undo and refresh are exercised in the manual steps of [quickstart.md](quickstart.md); there is no headless view. Not yet run in the application.)

**Checkpoint**: Menu shows only Paste Special; old code removed.

---

## Phase 8: Polish & Cross-Cutting

- [X] T024 [P] Fix `SmoNote.removeAllAnnotations` in `src/smo/data/note.ts` to keep everything except `SmoLyric` annotations (research R10), and add a test: a note with a lyric, a chord and an annotation keeps the lyric and chord
- [X] T025 [P] Add a changelog entry to `changes.md`: Paste Special replaces Paste Chords; six kinds; replace or add; alignment by elapsed time unchanged; library users replace `pasteChords` with `pasteAttributes({ kinds: ['chords'], mode: 'replace' })`
- [X] T026 [P] Regenerate declarations with `npm run types`, keep only the files for sources changed here (`copypaste.d.ts`, `scoreViewOperations.d.ts`, `pasteSpecial.d.ts`, `exports.d.ts`, `note.d.ts` if its doc changed), and restore every other changed or untracked file under `types/`
- [X] T027 Run `tsc --noEmit -p tsconfig.json` and every `test:*` script in `package.json`; fix regressions
- [ ] T028 Walk through the manual checks in [quickstart.md](quickstart.md) in the running application

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → stories. Phase 2 blocks everything.
- US1 first (it creates `pasteAttributes`, the view method, dialog and menu). US2 modifies `pasteAttributes` and the dialog. US3 and US4 are mainly tests over the same code and can follow in either order. US5 last because it deletes the old code the earlier tests compare against by hand.
- Most tasks touch `copypaste.ts` or `tests/pasteSpecial.ts`, so serialize those edits.
- Polish after all stories.

## Parallel Opportunities

T011 (Vue file) alongside T008–T010; T015, T018 and T020 (test additions) alongside the implementation tasks of their own phase if written first; T024, T025, T026 at the end.

## Implementation Strategy

1. Phases 1–2 (alignment), then US1 for a usable Paste Special, then US2 for the mode choice (the pair is the MVP).
2. US3 and US4 harden alignment and chords against the old behavior; US5 finishes the migration.
