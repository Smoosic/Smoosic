# Quickstart: Validating the Vue-Based Lyric Dialog

This project has no wired automated test runner (`npm test` is a no-op). Validation is manual, against the dev/demo score app, following the acceptance scenarios in [spec.md](./spec.md).

## Prerequisites

- Node deps installed (`npm install`, if not already).
- Branch `010-vue-lyric-dialog` checked out.
- `SuiLyricDialogVue` (`src/ui/dialogs/lyricVue.ts`) temporarily wired to a call site for manual testing — e.g. swap it in for `SuiLyricDialog` at whichever menu/keybinding currently opens the Lyric Editor dialog (see call sites via `grep -rn "SuiLyricDialog" src/ui`), or add a temporary entry point in the demo app. **Do not commit this swap** — per the spec, wiring real callers over to the new dialog is a separate, later change.
- A score with at least a few consecutive notes on one staff, some with existing lyrics and some without, to exercise navigation across both cases.

## Build & Run

```sh
npm run build
npm run server
```

Then open the served app in a browser and load or create a score meeting the prerequisite above.

## Validation Scenarios

Each maps to an Acceptance Scenario in [spec.md](./spec.md).

### 1. Plain-text lyric entry (User Story 1, P1)

1. Select a note with an existing verse-1 lyric and open the Lyric Editor dialog.
2. **Expect**: edit mode opens automatically with the plain-text editor showing that lyric's current text, rendered in the lyric's own font, with no bold/italic/alignment controls visible anywhere in the editor panel (FR-006, FR-009).
3. Edit the text.
4. Click the "done editing" control.
5. **Expect**: dialog mode appears and the note's lyric now reflects the edited text (verify by re-opening the dialog, or inspecting the rendered score).
6. Repeat on a note with no lyric for verse 1.
7. **Expect**: the editor opens empty.

### 2. Navigate between notes while editing (User Story 2, P2)

1. Open the Lyric Editor on the first note of a short run of consecutive notes.
2. Type a lyric, click the "next note" arrow.
3. **Expect**: the typed text is saved to that note, and the editor now shows the next note's existing lyric (or empty) (FR-010).
4. Repeat forward across the whole run, then use the "previous note" arrow to walk back, confirming each note's text was preserved.
5. At the first and last note in the score, click "previous"/"next" respectively.
6. **Expect**: no navigation occurs and no error is thrown (spec Edge Case, `SmoSelection.lastNoteSelectionFromSelector`/`nextNoteSelectionFromSelector` returning `null`).

### 3. Delete a lyric (User Story 3, P3)

1. Open the Lyric Editor on a note that has lyric text; click the delete (cross) control.
2. **Expect**: that note's lyric is removed and the editor automatically advances to the next note (FR-011).
3. Repeat on a note with no lyric text.
4. **Expect**: no error; the editor still advances to the next note.

### 4. Finish editing and adjust verse/position/font (User Story 4, P4)

1. Open the Lyric Editor, type a lyric, and click the "done editing" control.
2. **Expect**: Verse, Y Adjustment, and Font controls appear; the next/previous/delete controls and the text editor are gone from the DOM (FR-007, FR-012).
3. Change Verse to a different value.
4. **Expect**: no immediate score change (the new verse only takes effect once editing resumes on this or another note — research.md §2/data-model.md `onVerseChange`).
5. Change Y Adjustment to a negative value (e.g. `-10`) and to a large positive value.
6. **Expect**: both are accepted (no silent clamp to `0` minimum — research.md §5) and the lyric's vertical position updates on the score immediately.
7. Change the Font family and size.
8. **Expect**: since this control is score-wide (research.md §6), *every* lyric in the score re-renders in the new font/size, not only the current note's.
9. Click the "edit lyrics" control.
10. **Expect**: the plain-text editor reopens on the current note, pre-loaded with that note's lyric for the verse selected in step 3.

### 5. OK / Cancel parity

1. Open the Lyric Editor, edit a lyric, navigate to a second note and edit that one too, then click OK.
2. **Expect**: both notes' edits are present on the score (already committed incrementally as you navigated).
3. Repeat, but click Cancel instead of OK after the same sequence of edits.
4. **Expect**: the identical result — both notes' edits remain, since Cancel performs the same "commit current note, then close" action as OK, with no whole-session revert (FR-014, spec Edge Case).

## Regression check against the legacy dialog

Since `SuiLyricDialog` remains in the codebase unchanged, the fastest regression check is to run the same score/note sequence through both dialogs (legacy call site vs. the temporarily-wired new one) and diff the resulting notes' lyric data (`note.getLyricForVerse(...)`, serialized) after an equivalent sequence of edits — text, verse, and `translateY` should match; the score-wide lyric font setting should match after an equivalent Font change.
