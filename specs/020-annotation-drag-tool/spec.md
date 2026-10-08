# Feature Specification: Annotation Drag Tool

**Feature Branch**: `020-annotation-drag-tool`

**Created**: 2026-09-21

**Status**: Draft

**Input**: User description: "create a draggable tool for the SmoLyric annotation feaature, similar to how it works for SmoTextGroup dialog.  Dragging the tool from its origin point changes the x and y offset."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reposition an annotation by dragging it on the score (Priority: P1)

A user has attached a text annotation to a note and opens the annotation dialog to adjust its position. Instead of guessing pixel values in the X/Y offset fields, they activate a "Move" tool, then click on the annotation where it currently appears on the score and drag it to the desired spot. When they release, the annotation stays at the new location and the dialog's offset values update to match.

**Why this priority**: This is the entire feature. Without it, users must position annotations by trial-and-error numeric entry, which is slow and imprecise — the same problem the existing text-block ("SmoTextGroup") drag tool already solves for other score text. This is the minimum slice that delivers the requested value.

**Independent Test**: Open the annotation dialog for a note with an existing annotation, activate the move tool, drag the annotation to a new on-screen location, release, and confirm the annotation renders at the new location and the X/Y offset fields reflect the change.

**Acceptance Scenarios**:

1. **Given** the annotation dialog is open in its normal (non-editing) view for an annotation with offset X=0, Y=0, **When** the user activates the move tool, presses the mouse down on the annotation at its current position, drags it 20 pixels right and 10 pixels up on the score, and releases, **Then** the annotation moves with the cursor during the drag, the drag ends when the mouse is released, and the dialog's X/Y offset fields update to reflect the new offset.
2. **Given** the user has just finished dragging an annotation to a new position, **When** they exit the move tool, **Then** the dialog returns to its normal view showing the updated X/Y offset values and the annotation remains rendered at the dragged-to position.
3. **Given** the move tool is active, **When** the user presses the mouse down somewhere that is not on the annotation's current rendered position, **Then** no drag starts and the annotation does not move.

---

### User Story 2 - Offset fields and drag stay in sync (Priority: P2)

A user drags an annotation to reposition it, then switches to the numeric X/Y offset fields to fine-tune the placement by a few pixels, or vice versa: they type a rough offset into the numeric fields first, then fine-tune visually with the drag tool.

**Why this priority**: The numeric fields already exist and remain the precise-adjustment path; the drag tool is a complementary, faster way to get close. Both must agree on the same underlying value so neither path silently overwrites the other's work.

**Independent Test**: Set an annotation's offset via the numeric X/Y fields, then activate the move tool and drag; confirm the drag starts from the position implied by the numeric values. Then drag to a new position, exit the move tool, and confirm the numeric fields show the resulting offset.

**Acceptance Scenarios**:

1. **Given** an annotation whose X/Y offset was set via the numeric fields, **When** the user activates the move tool, **Then** the annotation's drag origin reflects the current offset (not a reset position).
2. **Given** the user has dragged an annotation to a new position and exited the move tool, **When** they look at the numeric X/Y offset fields, **Then** the fields show values consistent with the dragged position.

---

### User Story 3 - Dragging an annotation on a multi-note selection (Priority: P3)

A user has selected multiple notes that share the same annotation (e.g., applied to a chord or a multi-note selection) and repositions it with the drag tool.

**Why this priority**: Supports an existing capability of the annotation dialog (annotations can apply to multiple selected notes at once); lower priority because it extends an existing multi-selection behavior rather than introducing new interaction.

**Independent Test**: Select multiple notes that share an annotation, open the annotation dialog, drag the annotation to a new position, exit the move tool, and confirm the new offset is applied consistently to the annotation on every selected note.

**Acceptance Scenarios**:

1. **Given** an annotation attached to more than one selected note, **When** the user drags it to a new position and exits the move tool, **Then** the updated offset applies to the annotation on all of the originally selected notes.

---

### Edge Cases

- What happens if the user drags the annotation off the edge of the visible page? The annotation's position is constrained so it cannot be dragged fully off the page, consistent with the existing text-block drag tool's behavior.
- What happens if the user activates the move tool, then cancels the whole annotation dialog (instead of exiting the move tool first) without confirming? The dialog's cancel behavior applies to any drag already completed the same way it applies to numeric-field edits, since both update the annotation immediately as the user interacts.
- What happens if the user tries to switch between annotations (when a note has more than one annotation) while the move tool is active? The move tool must be exited before switching to a different annotation, mirroring how other editing actions in the dialog are scoped to one mode at a time.
- What happens if the annotation has no visible text (empty)? The move tool is only relevant to an annotation that has been created and has a rendered position on the score; it is not offered before an annotation exists.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The annotation dialog MUST offer a "Move" tool, presented the same way the equivalent tool is presented in the existing text-block dialog, that lets the user reposition the currently selected annotation by dragging it directly on the rendered score.
- **FR-002**: Activating the move tool MUST let the user press the mouse down on the annotation at its current rendered position and drag it; the annotation MUST visually follow the mouse for the duration of the drag.
- **FR-003**: Releasing the mouse MUST end the drag and update the annotation's X and Y offset by the distance dragged from its origin point.
- **FR-004**: Pressing the mouse down at a point that is not on the annotation's current rendered position MUST NOT start a drag.
- **FR-005**: The dialog's numeric X/Y offset fields MUST reflect the offset resulting from a completed drag, and the move tool's drag origin MUST reflect any offset previously set via the numeric fields.
- **FR-006**: The user MUST be able to explicitly exit the move tool (without necessarily closing the whole dialog), returning the dialog to its normal view.
- **FR-007**: A drag MUST be constrained so the annotation cannot be moved fully outside the visible page, consistent with the existing text-block drag tool.
- **FR-008**: When an annotation is shared by multiple selected notes, completing a drag MUST update the offset for the annotation on every one of those notes.
- **FR-009**: The move tool MUST only be available for an annotation that currently exists and has a rendered position (i.e., not before the user has added an annotation).

### Key Entities

- **Annotation**: A text annotation attached to one or more notes, positioned relative to its note via an X and Y pixel offset. The move tool changes this offset; it does not change the annotation's text, font, or other display properties.
- **Move tool / drag session**: A temporary interaction mode, scoped to one annotation dialog session, in which mouse drag input on the score is translated into a change to that annotation's offset. It has no persisted state of its own beyond the offset it writes back to the annotation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can reposition an annotation to a specific visual location on the score using only the mouse (no numeric entry) in a single drag gesture.
- **SC-002**: After a drag completes, the annotation's rendered position and the dialog's displayed offset values agree, with no additional user action needed to reconcile them.
- **SC-003**: The drag interaction (activation, drag, release, exit) follows the same steps and number of clicks as the existing text-block move tool, so users familiar with that tool require no new learning to use this one.
- **SC-004**: Repositioning an annotation shared across multiple selected notes takes the same single drag gesture as repositioning one attached to a single note.

## Assumptions

- The move tool is additive: it complements the existing numeric X ("X Offset (Px)") and Y ("Y Adjustment (Px)") fields in the annotation dialog rather than replacing them, matching the pattern in the text-block dialog where a drag tool coexists with X Pos/Y Pos fields.
- The move tool operates on whichever single annotation is currently selected in the dialog (relevant when a note has more than one annotation and an index selector is shown); it does not offer a way to move multiple different annotations in one drag.
- "Origin point" (per the feature description) refers to the annotation's current rendered position on the score at the moment the move tool is activated — the point the user must press down on to begin a drag — not a fixed page coordinate.
- Visual drag direction is intuitive: dragging the annotation up/right on screen moves it up/right, regardless of how the offset's sign is internally represented.
- No new persistence, undo/redo, or multi-user concerns are introduced beyond what already applies to editing an annotation's offset via the numeric fields.
