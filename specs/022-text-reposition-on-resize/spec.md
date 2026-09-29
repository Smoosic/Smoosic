# Feature Specification: Reposition Text on Layout Resize

**Feature Branch**: `022-text-reposition-on-resize`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "When the screen dimensions change, calculate the changes to SmoTextGroup objects so that it is in the same position relative to the new page. 1. This is done in scoreViewOperations.ts setGlobalLayout, but there is a bug. The score tries to calculate the change in the svgScale and change the scoreText x and y by the same amount, but it isn't working because it needs the old and new coordinates. globalLayout.ts needs to send both the currentValue and the old value, the reactive 'currentValue' is updated with the new value, so we need to make the deep copy everytime it is changed. 2) we also need to handle the case where the x/y dimensions of the page change, either on the score or part. We should try to make sure the text is in the same position relative to the page, e.g. if text has an x position 10% of the page width, it should still be 10% of the new page width."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Text stays put when scale changes (Priority: P1)

A user opens the Global Layout dialog and changes the SVG scale (e.g. to make the score render bigger or smaller). All existing text (titles, composer credit, footers, annotations) should keep its visual size and position on the page, exactly as it appeared before the change — it should not jump, shrink, or grow out of proportion.

**Why this priority**: This is an active, visible bug. Every time a user adjusts scale today, text blocks land in the wrong place because the calculation compares the new value to itself instead of to the previous value. This breaks the dialog's core promise ("preview and apply a layout change") for any score that already has custom text placed on it.

**Independent Test**: Add a title and a footer annotation to a score, note their rendered position, open Global Layout, change svg scale, and apply. The title and footer must render at the same visual position/size as before the change (adjusted only for the new scale itself, not shifted or duplicated).

**Acceptance Scenarios**:

1. **Given** a score with a text block placed at a known coordinate under the current svg scale, **When** the user changes svg scale in the Global Layout dialog and the change is applied, **Then** the text block's stored x/y position is rescaled by the ratio of the old scale to the new scale, so it renders in the same visual spot as before.
2. **Given** a user has changed svg scale and other settings in the Global Layout dialog, **When** the user cancels the dialog instead of committing, **Then** all text positions and layout settings revert exactly to what they were before the dialog was opened.
3. **Given** a user changes svg scale more than once within the same dialog session before committing, **When** each change is applied, **Then** the text position calculation uses the immediately-preceding value as the "old" value, not the value from when the dialog was first opened, so repeated changes don't over- or under-scale the text.

---

### User Story 2 - Text stays proportionally placed when page size changes (Priority: P2)

A user changes the page width or height (for example, switching paper size or orientation) for the whole score or for an individual part. Text that was positioned at a certain percentage across or down the page should remain at that same percentage after the page dimensions change, rather than keeping its old absolute pixel position (which could now fall off the page or land somewhere disproportionate).

**Why this priority**: This is a related but separate gap from User Story 1 — even with scale-based repositioning fixed, changing page width/height alone doesn't adjust text position at all today. It's lower priority than the outright bug in Story 1, but is explicitly called out as necessary in this request and affects a distinct, common action (changing page size or working with a part that has its own page layout).

**Independent Test**: Place a text block at roughly 10% of the page width from the left edge. Change the score's page width to a different value. Confirm the text block is still positioned at approximately 10% of the new page width.

**Acceptance Scenarios**:

1. **Given** a text block positioned at some percentage of the current page width/height, **When** the page width and/or height is changed, **Then** the text block's x/y position is recalculated so it sits at the same percentage of the new page width/height.
2. **Given** a part has its own page layout separate from the main score, **When** the part's page width/height is changed, **Then** only the part's text groups are repositioned proportionally; the score's own text groups (and other parts) are unaffected.
3. **Given** the score's page width/height is changed while a part is not exposed, **When** the change is applied, **Then** the score's own text groups are repositioned proportionally.

---

### Edge Cases

- What happens when only svg scale changes and page width/height stay the same? Only the scale-ratio repositioning from Story 1 applies; percentage-of-page repositioning from Story 2 is a no-op since the page dimensions didn't change.
- What happens when a text block sits exactly at an edge (x = 0, or x = page width)? It must remain exactly at that edge (0% or 100%) after the page dimensions change, with no drift from rounding.
- What happens when the Global Layout dialog is opened and closed without changing any value? No repositioning or scaling should occur, and no undo entry should be created for text.
- What happens when a user undoes a committed global layout change? Both the layout settings and the text positions must revert together to their prior state.
- What happens when svg scale and page width/height are both changed in the same commit? Both adjustments must be applied together without double-counting or canceling each other out.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST know the global layout values as they were immediately before a change, distinct from the newly-requested values, whenever it is about to reposition text — it must not compare the new values to themselves.
- **FR-002**: System MUST rescale each text group's stored position (and any dependent offsets) by the ratio of the previous svg scale to the new svg scale whenever svg scale changes, so text keeps its prior visual size and position after the change is applied.
- **FR-003**: System MUST reposition each text group's x and y coordinates whenever page width and/or page height changes (for the score, or for a part), so each text block keeps the same position relative to the page (e.g. the same percentage from the left/top) that it had before the change.
- **FR-004**: System MUST apply the page-size repositioning from FR-003 only to the text groups that belong to the layout that actually changed — a part's page size change repositions only that part's text groups, and a score-level change repositions only the score's text groups.
- **FR-005**: System MUST NOT apply scale-based or page-size-based repositioning when the relevant value did not actually change (no false-positive adjustments).
- **FR-006**: System MUST correctly handle multiple sequential layout changes made before the dialog is committed, using the most recently applied values as the baseline for each subsequent change.
- **FR-007**: Cancelling the Global Layout dialog MUST restore text positions and layout settings to their exact state from before the dialog was opened, undoing any changes that were applied while the dialog was open.
- **FR-008**: A committed global layout change that repositions text MUST be a single undoable action — undoing it restores both the layout settings and the text positions together.

### Key Entities

- **SmoTextGroup**: A positioned group of text blocks (e.g. title, composer credit, footer, annotation) belonging to a score or a part, whose position is defined by x/y coordinates plus an associated offset.
- **Global Layout (score or part)**: The set of page-wide rendering settings — including svg scale, page width, and page height — that determines how the score or part is rendered; the score and each part may have their own independent copy of these settings.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After changing svg scale through the Global Layout dialog, text groups render at the same visual position and size as before the change, with zero manual repositioning needed by the user afterward.
- **SC-002**: After changing page width or height, a text block's position relative to the page (as a percentage of width/height) differs from its pre-change value by less than 1%.
- **SC-003**: Cancelling the Global Layout dialog after making changes leaves text and layout settings with zero measurable difference from their pre-dialog state.
- **SC-004**: A single undo after a committed global layout change fully restores prior text positions and layout settings, verified across scores containing multiple text groups.

## Assumptions

- "Screen dimensions" in this request refers to the score's or part's global page layout (svg scale, page width, page height) as configured through the Global Layout dialog, not the browser window/viewport size.
- "Same position relative to the page" is measured as percentage of page width (for x) and page height (for y); margins and other page-layout attributes are out of scope for this proportional repositioning unless they are part of the same global layout change.
- This behavior applies to both the main score's global layout and a part's independently-configured global layout, since parts can have their own page settings.
- Existing offsets used internally by a text group (e.g. its offset from the music) are adjusted using the same scale-ratio logic as its x/y position, consistent with current behavior for scale changes.
