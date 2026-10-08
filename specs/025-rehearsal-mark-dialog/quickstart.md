# Quickstart: Rehearsal Mark Properties Dialog

Manual validation for making a rehearsal mark selectable and editable. See [contracts/component-interfaces.md](./contracts/component-interfaces.md) and [data-model.md](./data-model.md) for the expected shapes.

## Prerequisites

- `npm install` (once)
- `npm run build`, then `npm run server`, and open the app in a browser
- A score with at least two measures and a Title (so the layout has a visible system)

## Manual check 1: Creation is unchanged (FR-009, SC-005)

1. Select a measure. Notes menu → "Rehearsal Letter" (icon `font_download`).
2. **Expect**: a rehearsal mark "A" appears above the measure, as before.
3. Select the same measure again and choose "Rehearsal Letter".
4. **Expect**: the mark is removed, as before. No dialog opens from the menu command.

## Manual check 2: Click selects, dialog opens (User Story 1, AC1)

1. Re-add a rehearsal mark to a measure.
2. Click directly on the rendered mark glyph.
3. **Expect**: the "Rehearsal Mark Properties" dialog opens showing symbol "A", capitals, auto-increment on.
4. Click on empty staff space in another measure.
5. **Expect**: no rehearsal-mark dialog. Normal selection behavior.

## Manual check 3: Live edits and cancel (AC2, AC3)

1. With the dialog open, change the symbol to "Q".
2. **Expect**: the score's rehearsal mark shows "Q" immediately, with no apply step.
3. Change the cardinality to lowercase.
4. **Expect**: the glyph updates to lowercase.
5. Click Cancel.
6. **Expect**: the mark returns to "A", capitals, as it was before the dialog opened.

## Manual check 4: Commit keeps edits (AC2)

1. Reopen the dialog for the mark. Set symbol to "B", increment off. Click Commit.
2. **Expect**: the mark shows "B". Reopening the dialog shows "B" with increment off.
3. Use Undo.
4. **Expect**: the change reverts to "A" (undo buffer entry "Change Rehearsal Mark").

## Manual check 5: Remove from dialog (AC4)

1. Open the dialog for a mark. Click Remove.
2. **Expect**: the mark disappears from the measure, and the dialog closes.
3. Use Undo.
4. **Expect**: the mark returns with its last committed settings.

## Manual check 6: Multi-staff consistency (research.md §4)

1. Use a score with two or more staves. Add a rehearsal mark to a measure.
2. Open the dialog from the top staff's mark and change the symbol to "C".
3. **Expect**: the rehearsal mark at that measure is "C" on every staff, not only the top one.

## Manual check 7: Keyboard reachability (User Story 2, FR-010)

1. Select a measure that has a rehearsal mark and also has another modifier (for example a second-ending volta or a tempo marking).
2. Use the keyboard modifier-cycling key (the same one used for other modifiers).
3. **Expect**: the rehearsal mark is reached in the cycle. Confirming it opens the same dialog as clicking.

## Manual check 8: Position is not exposed (spec Assumptions)

1. Open the rehearsal mark dialog.
2. **Expect**: there is no position control (above/below/left/right).
