# Feature Specification: Dialog Checkbox-to-Toggle Migration

**Feature Branch**: `003-checkbox-to-toggle`

**Created**: 2026-08-27

**Status**: Draft

**Input**: User description: "for all vue components in src/ui/components/dialogs that have an input checkbox, change it to use a toggle.vue control instead. If there is a div with the label following the input control, move the text to the 'label' parameter of the toggle.vue, then remove the label div and update the column width to be the combined width."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent toggle control replaces checkboxes in dialogs (Priority: P1)

As a score editor user, when I open any dialog that currently shows a plain checkbox for an on/off setting (for example "Append to Selection", part visibility, or staff/tab options), I want that setting presented as the same style of on/off toggle switch used elsewhere in the application, so that the dialogs look and behave consistently and it's visually obvious that the control is on or off.

**Why this priority**: This is the core of the request — every checkbox-based boolean control in the dialogs directory must be visually and behaviorally replaced by the existing toggle control. Without this, the feature has not been delivered.

**Independent Test**: Open each affected dialog, confirm every former checkbox now renders as a toggle switch showing on/off state, and confirm toggling it updates the same underlying setting the checkbox used to control (verified by the setting's effect persisting after the dialog is closed and reopened).

**Acceptance Scenarios**:

1. **Given** a dialog that previously showed a checkbox bound to a boolean setting, **When** the dialog is opened after the change, **Then** the same setting is presented as a toggle switch reflecting the setting's current value.
2. **Given** a toggle switch that replaced a checkbox, **When** the user clicks/activates it, **Then** the underlying setting flips exactly as it did when the checkbox was clicked, with no change in what the setting controls.
3. **Given** a checkbox that was previously disabled under certain conditions, **When** the toggle replaces it, **Then** the toggle is disabled under those same conditions.

---

### User Story 2 - Adjacent label text moves onto the toggle itself (Priority: P2)

As a score editor user, I want the descriptive text that used to sit in its own column next to a checkbox (e.g., "Append to Selection") to now appear as the toggle's own label, so the control and its description read as a single unit instead of two separately laid-out pieces.

**Why this priority**: This is required by the request wherever a label div follows the checkbox, but it is secondary to the control swap itself — a dialog could technically ship with the toggle first and label wiring as a fast follow. It's still necessary for the change to look intentional rather than broken.

**Independent Test**: In a dialog where the checkbox was immediately followed by a label div containing descriptive text, confirm after the change that (a) the label text now appears as part of the toggle control's own label, and (b) the separate label div/column no longer exists in the markup.

**Acceptance Scenarios**:

1. **Given** a checkbox immediately followed by a div containing a label describing it, **When** the migration is applied, **Then** the label's text is supplied to the toggle control's label parameter and the toggle displays that text.
2. **Given** the label text has moved onto the toggle, **When** the dialog renders, **Then** the standalone label div/column that used to hold that text is removed from the layout.

---

### User Story 3 - Layout width is preserved after removing the separate label column (Priority: P2)

As a score editor user, I want the row containing a migrated toggle to keep the same overall width and alignment as before, so that removing the separate label column doesn't leave a layout gap or cause the toggle to look cramped or misaligned relative to other rows in the dialog.

**Why this priority**: Necessary for visual polish and to avoid regressions in dialog layout, but depends on User Stories 1 and 2 being done first.

**Independent Test**: In a dialog row where a checkbox column and a following label column are merged into a single toggle column, measure/inspect that the toggle's column now spans the combined width the two original columns occupied, and confirm the row's total width and alignment relative to sibling rows is unchanged.

**Acceptance Scenarios**:

1. **Given** a checkbox column and a following label column with known widths, **When** they are merged into one toggle column, **Then** the toggle column's width equals the sum of the two original column widths.
2. **Given** a migrated row alongside other unmodified rows in the same dialog, **When** the dialog is rendered, **Then** the migrated row's overall width and left/right alignment still lines up with the other rows.

---

### Edge Cases

- What happens when a checkbox has no adjacent following label div (label text is elsewhere, e.g., preceding the checkbox, or absent)? The toggle's label parameter should reflect the best available description, or remain empty if none exists, and no unrelated label div should be removed.
- What happens when a dialog contains multiple checkboxes, each with its own following label (e.g., a dialog with 7 checkbox settings)? Each checkbox/label pair must be migrated independently to its own toggle.
- What happens when a checkbox is conditionally disabled or conditionally rendered based on component state? That same condition must continue to govern the replacement toggle.
- What happens when a checkbox's bound value drives other logic in the component (e.g., a computed property or watcher keyed off the checkbox's v-model)? That logic must continue to work unchanged against the toggle's bound value.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: For every Vue component under `src/ui/components/dialogs` that contains an `<input type="checkbox">` element, the checkbox MUST be replaced with the existing toggle control, preserving the same bound setting/value and change behavior.
- **FR-002**: Where a checkbox is immediately followed in the markup by a div whose content is the label text describing that checkbox, that label text MUST be passed as the toggle control's label parameter instead of being rendered as separate markup.
- **FR-003**: After a label's text is moved onto the toggle control, the now-empty/redundant label div (and its containing column, if the label occupied its own layout column) MUST be removed from the markup.
- **FR-004**: When a label column is removed as part of FR-003, the toggle's containing column width MUST be updated to equal the combined width previously occupied by the checkbox's column and the removed label's column, so total row width is unchanged.
- **FR-005**: Any conditional behavior that applied to the original checkbox (disabled state, visibility, validation) MUST apply identically to its replacement toggle.
- **FR-006**: Any component logic that reads or reacts to the checkbox's bound value (computed properties, watchers, submit handlers) MUST continue to function unchanged after the value is bound to the toggle instead.
- **FR-007**: Components that contain a checkbox with no immediately-following label div MUST still have that checkbox replaced with a toggle (per FR-001); FR-002/FR-003/FR-004 simply do not apply to that instance since there is no adjacent label to relocate.

### Key Entities

- **Checkbox-bound setting**: A boolean value in a dialog component (e.g., "append to selection", "show tab", part/staff visibility flags) previously edited via `<input type="checkbox">` and going forward via the toggle control.
- **Toggle control**: The existing shared control (`toggle.vue`) that presents a boolean setting as an on/off switch with an inline label and on/off hint text.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero `<input type="checkbox">` elements remain in any Vue component under `src/ui/components/dialogs` (excluding the toggle control's own internal implementation).
- **SC-002**: 100% of boolean settings that were previously editable via checkbox remain editable, with identical effect, via the replacement toggle.
- **SC-003**: In every dialog where a label div immediately followed a checkbox, that text is visibly presented as the toggle's label and no separate/orphaned label element remains in that row.
- **SC-004**: Every migrated row's total rendered width matches its pre-migration width (no layout shift in surrounding dialog content).

## Assumptions

- "Vue components in src/ui/components/dialogs" refers to `.vue` files directly in that directory (the toggle control itself, `toggle.vue`, is the replacement being adopted, not a migration target).
- "A div with the label following the input control" means a label element/div that appears immediately after the checkbox in markup order within the same row, describing that checkbox — not unrelated text elsewhere in the component.
- The existing `toggle.vue` control's behavior and appearance are correct as-is and are not being modified by this feature; this feature only changes which dialogs use it.
- Layout is built on a column/grid system (as currently used in these dialogs) where individual columns have widths that can be summed; "update the column width to be the combined width" means adjusting the toggle's column to span what the checkbox column and label column spanned together.
- Dialogs with multiple checkboxes (e.g., a dialog with 7 checkbox instances) require each checkbox/label pair to be migrated independently; this is treated as repetition of the same per-instance change, not a separate feature.
