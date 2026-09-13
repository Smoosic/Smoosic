# Quickstart: Validating the Vue-Based Chord Change Dialog

This project has no wired automated test runner (`npm test` is a no-op). Validation is manual, against the dev/demo score app, following the acceptance scenarios in [spec.md](./spec.md). (One exception: `chordText.ts`'s `encodeChordText`/`decodeChordText` round-trip is pure logic — see the optional standalone check at the end.)

## Prerequisites

- Node deps installed (`npm install`, if not already).
- Branch `013-vue-chord-dialog` checked out.
- `SuiChordChangeDialogVue` (`src/ui/dialogs/chordChangeVue.ts`) temporarily wired to a call site for manual testing — e.g. swap it in for `SuiChordChangeDialog` at whichever menu/keybinding currently opens the Chord Symbol dialog (see call sites via `grep -rn "SuiChordChangeDialog" src/ui`), or add a temporary entry point in the demo app. **Do not commit this swap** — per the spec, wiring real callers over to the new dialog is a separate, later change.
- A score with at least a few consecutive notes on one staff, some with existing chord symbols and some without, to exercise navigation across both cases.

## Build & Run

```sh
npm run build
npm run server
```

Then open the served app in a browser and load or create a score meeting the prerequisite above.

## Validation Scenarios

Each maps to a User Story / Acceptance Scenario in [spec.md](./spec.md).

### 1. Text entry with music-glyph shortcuts (User Story 1, P1)

1. Select a note with an existing chord symbol and open the Chord Symbol dialog.
2. **Expect**: edit mode opens automatically with the text editor showing that chord symbol's current text (FR-016).
3. On a note with no chord symbol yet, type an ordinary chord name (e.g. `C7`).
4. **Expect**: the characters are inserted as plain text, exactly as typed.
5. Type a chord name containing each shortcut character in turn: `b`, `#`, `+`, `-`, `(`, `)`, `/` (e.g. type `Cb`, then clear and type `C#`, then `C+`, `Cm-`, `C(9)`, `C/G`).
6. **Expect**: each shortcut character is *not* inserted as a literal character; instead a small glyph placeholder appears in the editor (FR-006–FR-009). The editor's own rendering of this placeholder does not need to match the true Bravura symbol (FR-022) — this is expected and acceptable.
7. End the editing session (click "done editing") and inspect the note's chord symbol as rendered on the score.
8. **Expect**: the score shows the correct music glyph (accidental flat/sharp, augmented, minor, tall left/right parenthesis, or diagonal slash) in place of each shortcut character — this is the pass/fail check, not the editor's own appearance.

### 2. Live preview on the score while typing (User Story 2, P2)

1. Open the Chord Symbol dialog on a note, type a chord name containing at least one shortcut character (e.g. `Cbm7`).
2. Pause without navigating away or finishing editing.
3. **Expect**: within about half a second, the note's chord symbol as rendered on the score updates to show the in-progress text, with shortcut characters shown as their correct music glyphs (FR-021).
4. Continue typing several characters quickly.
5. **Expect**: no visible flicker/lag in either the dialog's own editor or the score, and the score update happens periodically, not after every keystroke.
6. Delete all typed text back to empty.
7. **Expect**: the score's chord symbol for this note clears to match once the preview next updates.

### 3. Symbols and Text Position dropdowns (User Story 3, P3)

1. Open the Chord Symbol dialog on a note, place the cursor at some position in the editor.
2. Select "Dim" from the Symbols dropdown.
3. **Expect**: a glyph placeholder is inserted at the cursor position (FR-010). Repeat for "Half dim", "Slash", and "Maj7", each in a fresh note/clear.
4. End editing after each and confirm the score shows: a diminished symbol, a half-diminished symbol, a diagonal arrangement slash, and a major-seventh symbol, respectively.
5. On a fresh note, type a few characters, then select "Superscript" from the Text Position dropdown, then type a few more characters.
6. **Expect**: only the characters typed *after* selecting Superscript render smaller/raised once the score updates (FR-011); the earlier characters are unaffected.
7. Select "Subscript", type more characters, then select "Normal" and type a final few.
8. **Expect**: the score shows three distinct runs — normal, superscript, then subscript, then normal again — matching the order the dropdown was changed.

### 4. Navigate and delete while editing (User Story 4, P4)

1. Open the Chord Symbol dialog on the first note of a short run of consecutive notes.
2. Type a chord symbol, click the "next note" arrow.
3. **Expect**: the typed text is saved to that note, and the editor now shows the next note's existing chord symbol (or empty) (FR-017).
4. Repeat forward across the whole run, then use the "previous note" arrow to walk back, confirming each note's chord symbol was preserved.
5. Click the delete control on a note with a chord symbol.
6. **Expect**: that note's chord symbol is removed and the editor automatically advances to the next note (FR-018).
7. At the first and last note in the score, click "previous"/"next" respectively.
8. **Expect**: no navigation occurs and no error is thrown.

### 5. Finish editing and adjust ordinality/position/font/width (User Story 5, P5)

1. Open the Chord Symbol dialog, type a chord symbol, and click the "done editing" control.
2. **Expect**: Ordinality, Y Adjustment, Font, and Adjust Note Width controls appear; the text editor, Symbols/Text Position dropdowns, and next/previous/delete controls are gone from the DOM (FR-014, FR-019).
3. Change Ordinality to a different value.
4. **Expect**: no immediate score change (the new ordinality only takes effect once editing resumes on this or another note, matching the Verse behavior in `010`).
5. Change Y Adjustment to a negative value and to a large positive value.
6. **Expect**: both are accepted and the chord symbol's vertical position updates on the score immediately (FR-020).
7. Change the Font family and size.
8. **Expect**: since this control is score-wide (research.md §7), *every* chord symbol in the score re-renders in the new font/size, not only the current note's.
9. Toggle Adjust Note Width.
10. **Expect**: since this is also score-wide (research.md §7), note spacing behavior changes for chord symbols throughout the score.
11. Click the "edit chord symbols" control.
12. **Expect**: the text editor reopens on the current note, pre-loaded with that note's chord symbol for the ordinality selected in step 3.

### 6. OK / Cancel parity

1. Open the Chord Symbol dialog, edit a chord symbol, navigate to a second note and edit that one too, then click OK.
2. **Expect**: both notes' edits are present on the score (already committed incrementally as you navigated).
3. Repeat, but click Cancel instead of OK after the same sequence of edits.
4. **Expect**: the identical result — both notes' edits remain, since Cancel performs the same "commit current note, then close" action as OK, with no whole-session revert (FR-023).

## Regression check against the legacy dialog

Since `SuiChordChangeDialog` remains in the codebase unchanged, the fastest regression check is to run the same score/note sequence through both dialogs (legacy call site vs. the temporarily-wired new one) and diff the resulting notes' chord-symbol data (`note.getLyricForVerse(verse, SmoLyric.parsers.chord)`, serialized `text`) after an equivalent sequence of edits — the raw `text` string should match byte-for-byte for the same keystrokes/dropdown picks (this is the contract in `contracts/component-interfaces.md` §4), and the rendered score output should therefore be pixel-identical since both flow through the same untouched `vxNote.ts`/`getVexChordBlocks` pipeline.

## Optional: standalone `chordText.ts` round-trip check

If a quick Node/ts-node scratch check is convenient, exercise `encodeChordText(decodeChordText(raw)) === raw` for a handful of representative raw strings pulled from real scores or hand-constructed, e.g.:

- `"C@b@m7"` (a flat glyph in the middle of ordinary text)
- `"C^7%9%"` (superscript then a direct-to-subscript transition, matching `getTextTypeTransition`'s two-step table)
- `"@diminished@"` (a lone Symbols-dropdown-only glyph, no ordinary text)

Since `npm test` is a no-op in this repo, this is a manual/ad-hoc check (or a small addition to `tasks.md` if the tasks phase decides to wire up a minimal test harness just for this one pure module) rather than a required CI step.
