# Feature Specification: Rehearsal Mark Properties Dialog

**Feature Branch**: `025-rehearsal-mark-dialog`

**Created**: 2026-10-04

**Status**: Draft

**Input**: User description: "create a dialog for SmoRehearsalMark.  Creation of the rehearsal mark stays the same, but when a user selects the modifier, bring up the dialog box and allow the user to modify the parameters.  Rehearsal marks are not currently tracked by the tracker object, so we will have to add that in order for it to be selected.  It will have to be added to the modifier list when the selection changes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Click a rehearsal mark to edit its properties (Priority: P1)

A user has already added a rehearsal mark (e.g., a letter "A" above a measure) and later wants to change its symbol, numbering style, or whether it advances automatically — without deleting it and creating a new one from scratch.

**Why this priority**: This is the entire point of the feature. Today a rehearsal mark can only be added or removed as a whole; there is no way to adjust it afterward. Letting the user click it and edit its settings directly is the core value being delivered.

**Independent Test**: Can be fully tested by selecting a measure that already has a rehearsal mark, clicking directly on the rendered mark, confirming a properties dialog opens showing its current settings, changing a setting, and confirming the score updates to match.

**Acceptance Scenarios**:

1. **Given** a measure has a rehearsal mark, **When** the user clicks directly on it, **Then** a properties dialog opens showing that mark's current symbol, numbering style, and auto-increment setting.
2. **Given** the properties dialog is open, **When** the user changes the symbol or numbering style, **Then** the rehearsal mark on the score updates immediately to reflect the change.
3. **Given** the properties dialog is open and the user has made changes, **When** the user cancels the dialog, **Then** the rehearsal mark reverts to exactly the settings it had before the dialog was opened.
4. **Given** the properties dialog is open, **When** the user chooses to remove the mark, **Then** the rehearsal mark is removed from the measure and the dialog closes.

---

### User Story 2 - Reach a rehearsal mark without using the mouse (Priority: P2)

A user navigating the score's modifiers by keyboard (cycling between the markings already attached to the current selection) wants rehearsal marks to be included in that cycle, so they aren't limited to mouse-clicking to edit one.

**Why this priority**: Important for keyboard-driven workflows and consistency with how every other similar score marking already behaves, but the primary, most common path is the mouse click covered by User Story 1.

**Independent Test**: Can be fully tested by selecting a measure that has a rehearsal mark along with other markings, cycling through the modifier selection via keyboard, and confirming the rehearsal mark is reachable in that cycle and opens the same properties dialog when reached.

**Acceptance Scenarios**:

1. **Given** a measure has a rehearsal mark, **When** the user cycles through that measure's modifiers using the keyboard, **Then** the rehearsal mark is included as one of the reachable selections.
2. **Given** the rehearsal mark is reached via keyboard cycling, **When** the user confirms the selection, **Then** the same properties dialog from User Story 1 opens.

---

### Edge Cases

- What happens when the user clicks on a measure that has no rehearsal mark? Nothing related to rehearsal marks is selected — behavior is unchanged from today.
- What happens if the user removes the mark from within the dialog? It is deleted from the measure (the same end state as using the existing creation menu command to remove it) and the dialog closes without reopening.
- What happens if the user opens the dialog, makes a change, and then removes the mark instead of canceling or confirming? The removal takes effect; the earlier in-dialog change does not need to be separately undone since the mark no longer exists.
- What happens if a user selects a different rehearsal mark (in another measure) while one dialog is already open for a different mark? Only one rehearsal mark's dialog is open at a time, consistent with how every other modifier dialog in the app already behaves.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to select an existing rehearsal mark directly from the rendered score (for example, by clicking it), the same way other similar score markings are already selectable.
- **FR-002**: Selecting a rehearsal mark MUST open a properties dialog showing that mark's current settings.
- **FR-003**: The properties dialog MUST allow the user to change the mark's displayed symbol/letter.
- **FR-004**: The properties dialog MUST allow the user to change the mark's numbering style (capital letters, lowercase letters, or numbers).
- **FR-005**: The properties dialog MUST allow the user to change whether the mark automatically advances to the next symbol in sequence.
- **FR-006**: Changes made in the properties dialog MUST be reflected on the score immediately, without requiring a separate "apply" action.
- **FR-007**: Users MUST be able to cancel the properties dialog, which MUST revert the mark to exactly the settings it had before the dialog was opened.
- **FR-008**: Users MUST be able to remove the rehearsal mark entirely from within the properties dialog.
- **FR-009**: The existing menu action that creates or removes a rehearsal mark on the currently selected measure MUST continue to work exactly as it does today; this feature does not change how rehearsal marks are created.
- **FR-010**: A rehearsal mark MUST also be reachable and selectable through the same keyboard-based modifier-selection cycling already available for other score modifiers, not only by mouse click.
- **FR-011**: Only one rehearsal mark may exist per measure, consistent with current behavior; the properties dialog edits that single mark and does not add an additional mark to the same measure.

### Key Entities

- **Rehearsal Mark**: A single labeled marking attached to a measure, consisting of a displayed symbol/letter, a numbering style (capitals, lowercase, or numbers), and whether it auto-advances from the previous mark's symbol. At most one exists per measure.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can change an existing rehearsal mark's symbol or numbering style without deleting and recreating it.
- **SC-002**: 100% of changes made in the properties dialog are visible on the score immediately.
- **SC-003**: Canceling the properties dialog after making changes restores the mark to its exact prior state in 100% of cases.
- **SC-004**: Users relying only on the keyboard can reach and edit a rehearsal mark, matching the existing keyboard-navigation support already available for other score modifiers.
- **SC-005**: The existing rehearsal-mark creation menu command behaves identically to before this feature, with no regression, in 100% of cases.

## Assumptions

- The properties dialog exposes the settings that currently have a visible effect on the rendered mark — symbol, numbering style, and auto-increment — and does not expose the mark's position setting (above/below/left/right of the staff), since that setting currently has no visible effect on the rendered score; exposing a control with no observable effect would be confusing rather than useful.
- Clicking directly on a rendered rehearsal mark selects it the same way clicking on other similar score markings (such as second-ending brackets) already does, including replacing whatever modifier was previously selected.
- This feature only adds the ability to edit an already-created rehearsal mark's properties; the existing menu command for creating/removing a rehearsal mark on the current measure is unchanged.
- Canceling the properties dialog reverts the mark to its state at the moment the dialog was opened, consistent with the cancel behavior already used by every other modifier properties dialog in the app.
