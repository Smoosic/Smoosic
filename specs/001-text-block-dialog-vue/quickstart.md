# Quickstart: Validating the Vue-Based Text Properties Dialog

This project has no wired automated test runner (`npm test` is a no-op). Validation is manual, against the dev/demo score app, following the acceptance scenarios in [spec.md](./spec.md).

## Prerequisites

- Node deps installed (`npm install`, if not already).
- Branch `001-text-block-dialog-vue` checked out.
- `SuiTextBlockDialogVue` (`src/ui/dialogs/textBlockVue.ts`) temporarily wired to a call site for manual testing — e.g. swap it in for `SuiTextBlockDialog` at whichever menu/keybinding currently opens the Text Properties dialog (see call sites via `grep -rn "SuiTextBlockDialog" src/ui`), or add a temporary entry point in the demo app. **Do not commit this swap** — per the spec, wiring real callers over to the new dialog is a separate, later change.

## Build & Run

```sh
npm run build
npm run server
```

Then open the served app in a browser and load or create a score with at least one staff/measure.

## Validation Scenarios

Each maps to an Acceptance Scenario in [spec.md](./spec.md).

### 1. Rich-text content editing (User Story 1, P1)

1. Select an existing text item (or trigger "add text" to create one) and open Text Properties.
2. **Expect**: the dialog opens with the rich-text editor (`TextGroupEditor`) already active and pre-loaded with the item's current content — no extra click needed (FR-014).
3. Type new text; apply bold, italic, superscript, subscript via the toolbar.
4. Click OK.
5. **Expect**: the score text re-renders with the same formatting, matching what the legacy in-place editor would have produced (verify against `SuiTextBlockDialog` on `main` for the same input, if in doubt).
6. Repeat, but click Cancel instead of OK after editing.
7. **Expect**: the text reverts entirely to its pre-dialog state (content and any position change).

### 2. Drag-to-reposition (User Story 2, P2)

1. Open Text Properties on an existing text item (not immediately after creation, so it's not auto-entering edit mode — reopen the dialog a second time in the same session to land in idle mode).
2. Click "Move Text".
3. **Expect**: every control except the "Done Dragging Text" affordance disappears from the dialog (FR-008).
4. Drag the text to a new location on the canvas.
5. Click "Done Dragging Text".
6. **Expect**: the other dialog controls reappear, and the X/Y Position fields reflect the new location (matching `modifier.ul()`).
7. Click OK and confirm the score reflects the new position.

### 3. Precise position & font controls (User Story 3, P3)

1. Open Text Properties on an existing text item in idle mode (neither editing nor moving active).
2. Change the X and/or Y numeric fields using the steppers.
3. Change font family, size, weight (bold), and style (italic) via the font picker.
4. Click OK.
5. **Expect**: the text re-renders at the new position with the new font.

### 4. Page behavior & attach-to-selection (User Story 4, P4)

1. Open Text Properties; select a different Page Behavior option (Once/Every/Odd/Subsequent) via the dropdown.
2. Click OK; reopen the dialog and confirm the choice persisted.
3. Reopen; toggle "Attach to Selection" on.
4. **Expect**: Page Behavior resets to "Once" (spec Edge Case) and the toggle is reflected in the checkbox.
5. Click OK; confirm the item is now attached to the current note/measure selection.

### 5. Mutual exclusion & mode edge cases

1. While in editing mode, confirm there is no way to activate Move Text (control is hidden/disabled) — FR-010.
2. While in moving mode, confirm there is no way to activate text editing — FR-010.
3. Drag the text to a new position, then click Cancel (not OK).
4. **Expect**: position reverts along with any content changes (same undo group) — spec Edge Case.

### 6. Remove

1. Open Text Properties in any mode (idle, editing, or moving).
2. Click Remove.
3. **Expect**: the text item is unrendered and deleted from the score regardless of which mode was active (FR-013, spec Edge Case).

## Regression check against the legacy dialog

Since `SuiTextBlockDialog` remains in the codebase unchanged, the fastest regression check is to run the same score/text item through both dialogs (legacy call site vs. the temporarily-wired new one) and diff the resulting `SmoTextGroup` JSON (`textGroup.serialize()`) after an equivalent sequence of edits — they should match on every field except transient session state (`edited`).
