# Quickstart: Validating Note Text Annotations

This project has no wired automated test runner (`npm test` is a no-op). Validation is manual, against the dev/demo score app, following the acceptance scenarios in [spec.md](./spec.md).

## Prerequisites

- Node deps installed (`npm install`, if not already).
- Branch checked out with this feature's changes.
- A score with at least one measure containing a few notes, some single-selected and some multi-selected (e.g. via shift-click or the existing range-selection gesture), to exercise both the single-note and multi-note-selection paths.

## Build & Run

```sh
npm run build
npm run server
```

Then open the served app in a browser and load or create a score meeting the prerequisite above.

## Validation Scenarios

Each maps to a User Story / Acceptance Scenario in [spec.md](./spec.md).

### 1. Create an annotation on a single note (User Story 1, P1)

1. Select a single note with no existing annotation. Open the Text menu and choose "Annotation".
2. **Expect**: an editing session opens with an empty text editor (FR-002).
3. Type some text (e.g. "cresc. poco a poco"), then end the editing session ("Done Editing").
4. **Expect**: the dialog switches to non-editing mode (FR-004), and the text renders on the score near the note.
5. Reopen "Annotation" from the Text menu on the same note.
6. **Expect**: the dialog opens directly in non-editing mode (FR-007), showing the saved settings; choosing "Edit Text" reopens the editor pre-loaded with the existing text.

### 2. Create an annotation across a multi-note selection (User Story 1 Scenario 3, User Story 2 Scenario 6)

1. Select a range of several notes (none with existing annotations). Open the Text menu and choose "Annotation".
2. Type text and end the editing session.
3. **Expect**: every note in the selection now shows the same annotation text on the score (FR-003, SC-005).
4. In the resulting non-editing dialog, change the font, then the X offset, then the Y offset, then the vertical-justify control.
5. **Expect**: after each change, every one of the originally selected notes' annotations updates identically (font, position, justification) — User Story 2 Scenario 6.

### 3. Clear an annotation's text removes it (User Story 1 Scenario 5)

1. Open an existing annotation's dialog, choose "Edit Text", delete all the text, end the editing session.
2. **Expect**: the annotation is removed from the score (and, for a multi-note selection, from every note in it).

### 4. Vertical justify default and toggle (User Story 2 Scenarios 4-5)

1. Create a brand-new annotation and reach the non-editing dialog.
2. **Expect**: the vertical-justify control shows "Top" by default, and the annotation renders above the note.
3. Change it to "Bottom".
4. **Expect**: the annotation moves to render below the note.

### 5. Independence from lyrics/chords on the same note (Edge Case)

1. On a note that already has a lyric and/or a chord symbol, add an annotation with its own font and a noticeably different X/Y offset.
2. **Expect**: all three (lyric, chord, annotation) render independently, each keeping its own position/font; changing the annotation's offset does not move the lyric or chord, and vice versa.

### 6. Drag/reflow keeps the annotation attached (FR-009)

1. With an annotation present, trigger whatever existing action reflows the measure/system containing that note (e.g. edit an earlier note's duration so the layout reflows, or use an existing drag-to-reposition gesture if applicable to this score).
2. **Expect**: the annotation's rendered position visually follows the note, the same way an existing chord symbol on the same note does.

### 7. Legacy-score compatibility (FR-011, SC-004)

1. Load a score saved before this feature existed (any pre-existing `.smo`/demo score with no annotations).
2. **Expect**: it loads and renders with no console errors and no unexpected annotation text anywhere.

### 8. Save/reload round-trip (FR-010, SC-002)

1. Create an annotation with a non-default font, non-zero X/Y offset, and "Bottom" justify.
2. Save the score, reload it (or reload the page against the saved file).
3. **Expect**: the annotation reappears with the exact same text, font, offset, and justify setting.
