# Feature Specification: Score Text Drag Controls

**Feature Branch**: `023-text-drag-controls`

**Created**: 2026-09-30

**Status**: Draft

**Input**: User description: "create some controls for dragging score text in the textDragger.vue which is used to move SmoTextGroup objects.  1. a checkboxes to lock direction, one for vertical and one for horizontal, 2. Buttons to place the text horizontally, one for centering and one for right-justify, 3. Snap, which will snap the score to the nearest x, y evenly divisible by 10px (adjusted for svg scale), and if the user holds the 'alt' key down while dragging, drag in 'slow mode' so the onMouseMove only processes dragging events every 100ms."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lock drag direction (Priority: P1)

A user repositioning a text block (such as a title or page number) wants to nudge it purely up/down or purely left/right without accidentally drifting off-axis due to natural hand movement while dragging with a mouse.

**Why this priority**: This is the most common precision problem when manually dragging text, and without it users must repeatedly undo/redo small unwanted offsets on the other axis. It's the foundation the other controls build on.

**Independent Test**: Can be fully tested by selecting the "Move Horizontal" control, dragging the text diagonally, and confirming only the horizontal position changes (and vice versa for "Move Vertical").

**Acceptance Scenarios**:

1. **Given** the text drag controls are visible and "Move Horizontal" is selected, **When** the user drags the text diagonally, **Then** the text's vertical (y) position does not change, only its horizontal (x) position updates.
2. **Given** "Move Vertical" is selected, **When** the user drags the text diagonally, **Then** the text's horizontal (x) position does not change, only its vertical (y) position updates.
3. **Given** neither "Move Horizontal" nor "Move Vertical" is selected, **When** the user drags the text, **Then** both the horizontal and vertical position update normally, matching current behavior.
4. **Given** "Move Horizontal" is currently selected, **When** the user selects "Move Vertical", **Then** "Move Horizontal" is deselected and "Move Vertical" becomes the only one active (the two act like a mutually-exclusive pair).
5. **Given** "Move Horizontal" is currently selected, **When** the user selects "Move Horizontal" again, **Then** it is deselected and neither control is active (unlike a standard radio group, either or neither may be selected, but never both).

---

### User Story 2 - One-click horizontal placement (Priority: P2)

A user wants to instantly align a text block to the horizontal center or the right edge of the page (e.g., for titles or copyright text) without manually dragging it into position.

**Why this priority**: Precise centering/right-alignment by hand is tedious and error-prone; a single click delivers a clean, exact result and is a common formatting task, but it's less foundational than direction locking.

**Independent Test**: Can be fully tested by clicking the "center" button and confirming the text's horizontal position is centered on the page, then clicking "right-justify" and confirming it moves flush to the right margin.

**Acceptance Scenarios**:

1. **Given** a text block is selected in the text dragger, **When** the user clicks the "center" button, **Then** the text block's horizontal position is updated so it is centered on the page, and its vertical position is unchanged.
2. **Given** a text block is selected in the text dragger, **When** the user clicks the "right-justify" button, **Then** the text block's horizontal position is updated so it is aligned to the right margin of the page, and its vertical position is unchanged.
3. **Given** the user is in the middle of an active drag, **When** they click "center" or "right-justify", **Then** the placement is applied immediately and reflected in the text's rendered position.

---

### User Story 3 - Snap to grid and slow-drag precision mode (Priority: P3)

A user wants dragged text to land on a consistent, evenly-spaced grid instead of arbitrary pixel positions, and wants a way to slow down the drag response for finer control when precise placement matters.

**Why this priority**: This improves consistency and precision but is an enhancement on top of already-functional free-form dragging (P1/P2 deliver most of the day-to-day value on their own).

**Independent Test**: Can be fully tested by enabling "Snap" and dragging text to arbitrary positions, confirming the final position always lands on a 10px grid; separately, by holding Alt while dragging and confirming position updates are noticeably throttled compared to normal dragging.

**Acceptance Scenarios**:

1. **Given** "Snap" is enabled, **When** the user drags a text block and releases it, **Then** the text's final x and y coordinates are each the nearest value evenly divisible by 10 pixels, adjusted for the current page/SVG display scale.
2. **Given** "Snap" is disabled, **When** the user drags and releases a text block, **Then** the text lands at the exact dragged position, matching current (non-snapped) behavior.
3. **Given** the user is dragging a text block, **When** they press and hold the Alt key, **Then** position updates during the drag are limited to no more than once every 100 milliseconds until Alt is released.
4. **Given** the user is dragging in slow mode (Alt held), **When** they release the Alt key, **Then** subsequent position updates resume on every mouse-move event, matching normal drag speed.
5. **Given** both "Snap" is enabled and the user is holding Alt (slow mode), **When** the user drags and releases the text, **Then** the throttled updates still respect snapping, and the final released position is grid-aligned.

---

### Edge Cases

- What happens when the user selects "Move Horizontal" while "Move Vertical" is already selected (or vice versa)? The newly-selected control becomes active and the previously-selected one is automatically deselected; the two are mutually exclusive, so both are never active at once.
- What happens when the user clicks "center" or "right-justify" while "Move Horizontal" or "Move Vertical" is selected? The placement buttons act independently of the direction-lock controls and always reposition the text horizontally as requested.
- What happens when snapping the text near the edge of the page would push it partially off the page? The existing page-boundary constraints continue to apply after snapping is applied.
- What happens if the user releases the mouse button while still holding Alt? The drag ends normally and the final position (snapped, if enabled) is applied.
- How does the system handle a drag that starts, has Alt pressed partway through, and Alt released before the drag ends? The drag transitions between normal and slow-mode throttling as Alt is pressed/released, without losing or jumping position.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a "Move Horizontal" control that, when selected, prevents the vertical (y) position of the dragged text from changing during a drag (only horizontal movement remains possible).
- **FR-002**: System MUST provide a "Move Vertical" control that, when selected, prevents the horizontal (x) position of the dragged text from changing during a drag (only vertical movement remains possible).
- **FR-003**: "Move Horizontal" and "Move Vertical" MUST be mutually exclusive: selecting one automatically deselects the other, selecting whichever one is already active deselects it (returning to neither selected), and the two MUST NOT both be selected at the same time.
- **FR-004**: System MUST provide a "Center" button (icon-only, no visible text label) that immediately repositions the selected text horizontally to the center of the page, leaving its vertical position unchanged.
- **FR-005**: System MUST provide a "Right Justify" button (icon-only, no visible text label) that immediately repositions the selected text horizontally to align with the right margin of the page, leaving its vertical position unchanged.
- **FR-014**: The "Move Horizontal", "Move Vertical", "Center", and "Right Justify" controls MUST display only an icon, with no visible text label; each MUST expose its name ("Move Horizontal", "Move Vertical", "Center", "Right Justify") as an accessible (e.g. `aria-label`) label for assistive technology.
- **FR-006**: System MUST provide a "Snap" toggle control that enables/disables grid snapping for drag operations.
- **FR-007**: When "Snap" is enabled, the system MUST adjust the dragged text's x and y position to the nearest value evenly divisible by 10 pixels, scaled to match the current page/SVG display scale, so the visual grid spacing remains consistent regardless of zoom level.
- **FR-008**: When "Snap" is disabled, dragging behavior MUST be unaffected (exact pixel positioning, matching current behavior).
- **FR-009**: System MUST detect when the Alt key is held down during an active drag and enter "slow mode".
- **FR-010**: While in slow mode, the system MUST process at most one drag-position update per 100 milliseconds, discarding or deferring intermediate mouse-move events.
- **FR-011**: System MUST exit slow mode as soon as the Alt key is released, resuming per-event updates for the remainder of the drag.
- **FR-012**: Direction lock, snap, and slow-mode controls MUST apply to the text group currently active in the text dragger and MUST NOT affect other text groups on the page.
- **FR-013**: The "Move Horizontal"/"Move Vertical" controls (neither selected) and Snap toggle (off) MUST default to their unselected/off state each time the text dragger is opened for a new drag session.

### Key Entities

- **SmoTextGroup**: The score text element being repositioned; has a horizontal and vertical position that these controls read and modify.
- **Drag Session**: The transient interaction state representing an in-progress drag of a SmoTextGroup, including its current lock, snap, and slow-mode settings.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can constrain a drag to a single axis with a single click, and 100% of subsequent drags in that session stay confined to the locked axis.
- **SC-002**: Users can horizontally center or right-justify a text block in under 1 second (one click), without any manual dragging.
- **SC-003**: When snap is enabled, 100% of completed drag operations result in a final position aligned to the 10-pixel grid, at any page zoom level.
- **SC-004**: When slow mode is active (Alt held), the visible position of the dragged text updates no more than 10 times per second, giving users noticeably finer control than the default drag speed.
- **SC-005**: Existing drag behavior (no locks, no snap, no Alt) is unchanged from before this feature, verified by no regression in current drag acceptance tests.

## Assumptions

- "Center" and "right-justify" operate relative to the same page width/margins already used elsewhere in the app for horizontal text justification (consistent with existing title/copyright placement conventions), not a new/custom layout boundary.
- The 10px snap grid is expressed in logical page units and is adjusted by the current SVG/page display scale so the snapped grid appears visually consistent whether the user is zoomed in or out.
- These controls are additions to the existing text-drag toolbar (alongside the current "stop editing" control) and apply only while that toolbar/drag session is active.
- "Move Horizontal" and "Move Vertical" are presented as a mutually-exclusive toggle pair (selecting one clears the other; selecting the active one clears it back to neither) rather than independent checkboxes, so it is never possible to freeze both axes at once.
- No new persistence is required: lock/snap settings apply only for the current drag session and reset to their default (neither direction-lock control selected, snap off) the next time the text dragger is opened.
- "Move Horizontal"/"Move Vertical"/"Center"/"Right Justify" use the app's existing Material Symbols icon font (the `.mi` class already used elsewhere, e.g. the ribbon and staff-group menus) rather than a new icon asset.
