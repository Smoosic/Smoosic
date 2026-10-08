# Quickstart: Validating the Annotation Drag Tool

This project has no wired automated test runner (`npm test` is a no-op). Validation is manual, against the dev/demo score app, following the acceptance scenarios in [spec.md](./spec.md).

## Prerequisites

- Node deps installed (`npm install`, if not already).
- Branch checked out with this feature's changes.
- A score with at least one note carrying an existing annotation (create one via the Text menu's "Annotation" entry, per `017-text-annotations`'s quickstart, if none exists yet). At least one measure should also have a note selection spanning multiple notes, to exercise the multi-note-selection path.

## Build & Run

```sh
npm run build
npm run server
```

Then open the served app in a browser and load or create a score meeting the prerequisites above.

## Validation Scenarios

Each maps to a User Story / Acceptance Scenario in [spec.md](./spec.md).

### 1. Reposition an annotation by dragging (User Story 1, P1)

1. Open the annotation dialog for a note with an existing annotation (non-editing view).
2. Click "Move".
3. **Expect**: the dialog switches to a moving view showing only a "Done Dragging Annotation" control (FR-001, FR-006).
4. Press the mouse down directly on the annotation's text where it renders on the score, drag it ~20px right and ~10px up, and release.
5. **Expect**: the annotation visually follows the cursor during the drag and stays at the released position after mouseup (FR-002, FR-003).
6. Click "Done Dragging Annotation".
7. **Expect**: the dialog returns to its normal view; the X/Y offset fields show values consistent with the drag; the annotation remains rendered at the dragged-to position (FR-005, SC-002).

### 2. Pressing outside the annotation does not start a drag (User Story 1 Scenario 3)

1. With the move tool active, press the mouse down at a point clearly away from the annotation's rendered text, then move the mouse and release.
2. **Expect**: the annotation does not move (FR-004).

### 3. Numeric fields and drag stay in sync (User Story 2)

1. Set an annotation's X/Y offset via the numeric fields to a known non-zero value, then click "Move".
2. **Expect**: the drag origin (where you must press to start dragging) is at the annotation's current, offset position — not back at a zero/default position (FR-005).
3. Drag the annotation to a new position and click "Done Dragging Annotation".
4. **Expect**: the numeric X/Y offset fields now show the values corresponding to the new position (FR-005, SC-002).

### 4. Dragging an annotation shared by a multi-note selection (User Story 3)

1. Select multiple notes that already share one annotation (or create one via the Text menu on a multi-note selection, per `017-text-annotations`).
2. Open the annotation dialog, click "Move", drag the annotation to a new position, and click "Done Dragging Annotation".
3. **Expect**: every one of the originally selected notes' copies of the annotation reflects the new offset (FR-008, SC-004) — verify by reopening the dialog from a different one of the originally selected notes.

### 5. Page-edge clamping (Edge Case)

1. Click "Move" on an annotation near the edge of the visible page, and attempt to drag it fully off the page.
2. **Expect**: the annotation's position is constrained so it cannot be dragged fully outside the visible page, consistent with the existing text-block drag tool (FR-007).

### 6. Move tool is scoped to one mode at a time (Edge Case)

1. On a note with two or more annotations (index selector visible), click "Move" on the currently selected annotation.
2. **Expect**: the index selector and other editing controls are hidden while the move tool is active; only after clicking "Done Dragging Annotation" can a different annotation index be selected.
