# Quickstart: Text Editor Live Preview and Active-Font Sync

Manual, browser-based validation guide (this repository has no automated UI test harness — see `plan.md` Technical Context). Run through this after implementing the tasks in `tasks.md`.

## Prerequisites

- Node/npm installed; repository dependencies installed (`npm install`, already done in this workspace).
- A build of the app available to run in a browser: `npm run build`, then serve/open `build/html/smoosic.html` (or use whatever local dev flow this repository normally uses to preview `src/` changes).
- A test score with at least two text groups already on it, with visibly different fonts (e.g., one default, one large bold serif) — create these via the existing "Add Text" dialog if the score doesn't have any yet.

## Scenario 1 — Editor opens with the active block's font (User Story 1)

1. Select a text group whose font differs from the app default and open its text dialog (edit).
2. Observe the editor's text area as soon as it appears.
   - **Expected**: the editing font (family/size/weight/style) visually matches the text block's font — no default/generic font flash.
3. With the dialog still open, change the font via the font picker.
   - **Expected**: the editor's displayed font updates immediately to the new font.
4. If the group has multiple blocks, use Previous/Next to switch the active block.
   - **Expected**: the editor's displayed font updates to match whichever block is now active.

## Scenario 2 — Score reflects in-progress edits (User Story 2)

1. Open the text dialog for an existing text group placed on the score. Note its current on-score content.
2. Click "Edit Text" and type new content, then pause typing (don't click Done Editing Text or OK).
   - **Expected**: within about a second of pausing, the text rendered on the score (behind/around the dialog) updates to show the new in-progress content.
3. Keep typing/pausing a few more times.
   - **Expected**: the score keeps catching up shortly after each pause; typing itself does not feel laggy or delayed.
4. Click **Cancel**.
   - **Expected**: the score reverts to exactly the original content noted in step 1 — no partial edits remain, and the on-score text is at normal (full) opacity again.
5. Repeat steps 1–3, then click **OK** instead.
   - **Expected**: the score's final text exactly matches what was last shown in the live preview, and is at full opacity.

## Scenario 3 — Visual indicator for the text group being edited (User Story 3)

1. On a score with at least two text groups, open the text dialog for one of them (new or existing).
   - **Expected**: only that text group visibly dims (reduced but still legible opacity) on the score; every other text group stays at full, normal opacity.
2. While the dialog remains open, switch the active block inside the group (if it has more than one) or move it via the "Move Text" control.
   - **Expected**: the dimmed appearance persists on the whole group throughout — it doesn't flicker back to full opacity between these in-dialog actions.
3. Close the dialog via **OK**.
   - **Expected**: the group returns to full, normal opacity, showing the committed content.
4. Repeat, closing via **Cancel** instead.
   - **Expected**: the group returns to full, normal opacity, showing the original (pre-edit) content.
5. Start creating a brand-new text group (Add Text, don't select an existing one).
   - **Expected**: the new group is shown dimmed (same as an edited existing group) while its dialog is open, and reaches full opacity once committed.

## Edge cases to spot-check

- Clear all text from the active block while editing (don't confirm yet): the score should show that block as blank, not remove it, until you commit or cancel.
- Cancel after several seconds of typing/pausing (multiple periodic updates should have already landed on the score): confirm a single Undo (outside the dialog, after cancel) does **not** additionally revert anything else — the cancel itself should already have fully unwound the session as one step.
- Rapid typing (paste a large block of text, or type quickly without pausing): confirm the editor itself stays responsive and the score does not visibly stutter or flicker during the burst, catching up once typing pauses.

## Out of scope for this quickstart

- No automated test run is defined here (none exists in this repository today). If/when a UI or rendering test harness is introduced project-wide, these scenarios are good candidates to encode there.
