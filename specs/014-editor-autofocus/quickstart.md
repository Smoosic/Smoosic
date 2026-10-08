# Quickstart: Validating Text Editor Autofocus on Open

This project has no wired automated test runner (`npm test` is a no-op). Validation is manual, against the dev/demo score app, following the acceptance scenarios in [spec.md](./spec.md).

## Prerequisites

- Node deps installed (`npm install`, if not already).
- Branch `014-editor-autofocus` checked out.
- The Lyric Editor, Chord Symbol, and Score Text dialogs reachable from a real call site (as of `013-vue-chord-dialog`/`010-vue-lyric-dialog`, `SuiChordChangeDialogVue`/`SuiLyricDialogVue` may already be temporarily or permanently wired into `src/ui/menus/text.ts` / `src/ui/dialogs/factory.ts` for manual testing — check current wiring before assuming it needs to be added).
- A score with at least one note, and at least one existing text block/lyric/chord symbol (to test the "existing content, cursor at end, nothing selected" case) alongside a fresh note/new text block (to test the "empty content" case).

## Build & Run

```sh
npm run build
npm run server
```

Then open the served app in a browser and load or create a score meeting the prerequisites above.

## Validation Scenarios

### 1. Lyric Editor opens with focus in the editor (User Story 1, P1 / FR-001)

1. Select a note with no lyric yet and open the Lyric Editor dialog.
2. **Expect**: without clicking anywhere, typing a character immediately inserts it into the lyric editor.
3. Repeat on a note that already has lyric text.
4. **Expect**: same result, and the existing text is not selected/highlighted - the cursor is simply positioned at its end (typing appends).

### 2. Chord Symbol dialog opens with focus in the editor (User Story 1, P1 / FR-002)

1. Select a note with no chord symbol yet and open the Chord Symbol dialog.
2. **Expect**: without clicking anywhere, typing a character (including one of the recognized shortcut characters, e.g. `b`) immediately takes effect in the chord editor.
3. Repeat on a note that already has a chord symbol.
4. **Expect**: same result, with existing content unselected.

### 3. Score Text dialog opens with focus in the editor for a new block (User Story 1, P1 / FR-003)

1. Add a brand-new text block via the Score Text dialog (a text item that has not been edited before, so it opens directly into editing mode).
2. **Expect**: without clicking anywhere, typing a character immediately inserts it into the text block editor.

### 4. Focus returns to the editor when resuming editing (User Story 2, P2 / SC-002)

1. Open the Lyric Editor, click "Done Editing Lyrics" (or equivalent) to switch to its non-editing controls, then click "Edit Lyrics" to switch back.
2. **Expect**: without clicking into the editor, typing immediately inserts a character.
3. Repeat for the Chord Symbol dialog's equivalent "Done Editing Chord Symbols" / "Edit Chord Symbols" toggle.
4. Repeat for the Score Text dialog: from its non-editing view, click back into editing (`enterEditing`).
5. **Expect**: the same result in all three cases.

### 5. No regression to existing controls/data flow (FR-005)

1. In each of the three dialogs, exercise a representative non-focus-related control (e.g. the Lyric Editor's Verse dropdown, the Chord Symbol dialog's Symbols dropdown, the Score Text dialog's Insert Special dropdown) and confirm it still behaves exactly as before this change.
2. **Expect**: no functional difference outside of where keyboard focus lands when each editor becomes visible.

## Notes

- Because all three editors' host dialogs already remount the editor component via `v-if` on every mode transition (research.md §1), Scenario 4 is expected to pass using the *same* code change as Scenarios 1-3 - no separate implementation is needed for "resume editing" versus "initial open."
- For `textGroupEditor.vue` specifically, exact caret position within the active block after the very first open is best-effort (matching the existing, already-shipped behavior of `activateBlock()`'s own focus call when switching blocks) - the pass/fail bar for Scenario 3 is "keyboard focus is somewhere in the editable editor, ready to type," not a specific character offset.
