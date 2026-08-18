# Quickstart: Validating the Block-Aligned Text Group Editor

No automated test runner is wired up in this repo (`npm test` is a no-op placeholder, same as feature 001). Validate manually in a browser against the dev score app.

## Prerequisites

- Repo built and served:
  ```
  npm run build
  npm run server
  ```
- Open the served app in a browser, load or create a score, and open the Text Properties dialog on an existing text item (or add a new one) so the block-aligned editor described in this feature is on screen.

## Scenario 1 — No formatting toolbar; active block's font applies automatically (User Story 1)

1. Open the text editor on a text group with a single block whose font is, e.g., bold 18pt serif.
2. Confirm no bold/italic/superscript/subscript/alignment/font-family/font-size buttons are rendered anywhere in the editor.
3. Click into the block and type additional text.
4. **Expected**: the new text renders bold, 18pt, serif — matching the block's existing font — with no manual action taken.
5. Change the font via the dialog's existing font picker (outside the editor surface).
6. **Expected**: the block's text in the editor immediately updates to the new font.

_Covers spec Acceptance Scenarios 1–3 under User Story 1; FR-001, FR-004._

## Scenario 2 — Non-active blocks are read-only and correctly arranged (User Story 2)

1. Open the text editor on a text group with 3 blocks and `relativePosition` set to `BELOW`.
2. **Expected**: each block appears on its own line, in order.
3. Attempt to click into / type over a non-active block.
4. **Expected**: nothing changes — cursor does not enter it, its text/font stay exactly as before.
5. Using the relative-position dropdown (see Scenario 4), switch to `RIGHT`.
6. **Expected**: all three blocks now appear joined on one line, in the same order.

_Covers spec Acceptance Scenarios 1–3 under User Story 2; FR-003, FR-005._

## Scenario 3 — Add / remove / navigate blocks (User Story 3)

Starting from a text group with 2 blocks (call them A, B; A active):

1. Click the add (+) control.
   **Expected**: a new empty block C is created, becomes active/editable, and its font matches whatever was active immediately beforehand (FR-012).
2. Click the previous (◄) control.
   **Expected**: the block immediately before C in array order (B) becomes active.
3. With the first block in the group active, confirm the previous (◄) control is disabled; with the last block active, confirm the next (►) control is disabled.
4. Click next (►) repeatedly across all blocks and confirm the correct block becomes editable each time, with previously-active blocks becoming read-only.
5. With only one block remaining after repeated removals, confirm the remove (X) control is disabled and clicking it (if forced) does nothing.
6. With more than one block, click remove (X) on the active block.
   **Expected**: that block is deleted from the group and a different block becomes active.

_Covers spec Acceptance Scenarios 1–7 under User Story 3; FR-006 through FR-011._

## Scenario 4 — Relative-position dropdown

1. With any multi-block group open, change the relative-position dropdown value.
2. **Expected**: the layout of every block (active and read-only) updates immediately to match (paragraph-per-block for ABOVE/BELOW, joined-on-one-line for LEFT/RIGHT).
3. In-progress edits to the active block's text are preserved across the layout change (only arrangement changes, not content).

_Covers spec Edge Cases (relative-position change mid-edit); FR-009._

## Scenario 5 — Empty group / new text item

1. Create a brand-new text item so its group starts with zero blocks.
2. **Expected**: the editor opens with exactly one empty, active, editable block — never a blank/unusable state.

_Covers spec Edge Cases (zero-block group)._

## Regression check — existing dialog contract still holds

1. Open the editor, make an edit, click the dialog's OK/commit action.
2. **Expected**: the score updates exactly as it does today (feature 001's commit/cancel/remove behavior is unaffected — see `contracts/textGroupEditor.contract.md`).
3. Open the editor, make an edit, click Cancel.
4. **Expected**: changes are discarded, same as feature 001.
