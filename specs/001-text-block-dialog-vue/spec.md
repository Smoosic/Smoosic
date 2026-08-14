# Feature Specification: Vue-Based Text Properties Dialog

**Feature Branch**: `001-text-block-dialog-vue`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "create a new version of the SuiTextBlockDialog dialog in textBlock.ts, with the logic in a vue component instead of legacy custom components. The creation function should follow a pattern similar to SuiTimeSignatureDialogVue in src/ui/dialogs/timeSignature.ts. SuiTextBlockDialog.dialogElements indicate which elements we should have in the vue component. SuiRockerComponent legacy component can be implemented with numberInput.vue, SuiDropdownComponent can be implemented by select.vue. The textInPlace component can be replaced with the new TextGroupEditor. The textDragger component will probably be implemented similar to how it is now. When textDrag component is selected, we should hide everything in the dialog except for the button stopping the text drag. When the text editor component is enabled, the other controls in the dialog should be hidden or disabled. The font control can use the fontPicker.vue component."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit score text content in a modern rich-text editor (Priority: P1)

As a score editor user, when I open the Text Properties dialog for a text item (title, composer credit, free text, etc.), I can edit its content and formatting (bold, italic, superscript, subscript) using the same dialog as today, but the actual editing surface is the new rich-text editor component instead of the legacy in-place SVG typing editor.

**Why this priority**: Editing content is the dialog's core purpose and the highest-risk area of this migration, since it replaces the most complex legacy piece (the custom SVG-based typing editor).

**Independent Test**: Open the Text Properties dialog on an existing (or new) score text item, confirm the rich-text editing surface appears instead of the old inline SVG editor, type and format some text, click OK, and confirm the score text updates exactly as it would have with the legacy dialog.

**Acceptance Scenarios**:

1. **Given** a score with an existing text item selected, **When** the user opens Text Properties for the first time this session, **Then** the dialog automatically starts a text-editing session with the item's current content pre-loaded into the rich-text editor.
2. **Given** the rich-text editor contains formatted text (bold/italic/superscript/subscript), **When** the user clicks OK, **Then** the score text reflects the same formatting it would have if entered via the legacy in-place editor.
3. **Given** the user has made changes in the rich-text editor, **When** the user clicks Cancel, **Then** all changes made since the dialog was opened are discarded and the text reverts to its prior state.

---

### User Story 2 - Reposition text by dragging it on the score (Priority: P2)

As a score editor user, I can grab and drag a text item to a new position on the page directly from within the dialog, the same way I can today.

**Why this priority**: Positioning is a distinct, independently valuable capability, used less frequently than content editing but essential to laying out a score.

**Independent Test**: Open Text Properties on an existing text item, activate "Move Text", drag the text to a new location, confirm only the stop-dragging control is visible while dragging is active, stop dragging, and confirm the X/Y position fields reflect the new location.

**Acceptance Scenarios**:

1. **Given** the Text Properties dialog is open, **When** the user activates "Move Text", **Then** every other dialog control is hidden except the control that stops the drag.
2. **Given** the user is dragging the text on the canvas, **When** the user stops dragging, **Then** the dialog's other controls reappear and the X/Y Position fields reflect the new location.

---

### User Story 3 - Fine-tune position and font with precise controls (Priority: P3)

As a score editor user, I can adjust a text item's X/Y position and font (family, size, weight, style) using numeric steppers and a font picker, without needing to drag or retype.

**Why this priority**: A precision/convenience capability, valuable but secondary to the primary edit and move interactions above.

**Independent Test**: Open Text Properties on an existing text item (not in edit or move mode), change X or Y using the numeric stepper, change the font via the font picker, click OK, and confirm the text re-renders at the new position with the new font.

**Acceptance Scenarios**:

1. **Given** the dialog is open and neither editing nor moving is active, **When** the user changes the X or Y numeric field, **Then** the text's position updates accordingly once the user clicks OK.
2. **Given** the dialog is open, **When** the user picks a different font family, size, weight, or style, **Then** the active text block's font updates accordingly once the user clicks OK.

---

### User Story 4 - Configure page behavior and score attachment (Priority: P4)

As a score editor user, I can control whether a text item repeats across pages (pagination) and whether it's attached to a specific note/measure selection, using the same dropdown and toggle controls as before.

**Why this priority**: An occasional-use administrative setting, not part of the core edit-or-move loop.

**Independent Test**: Open Text Properties, change Page Behavior (Once/Every/Odd/Subsequent) via the dropdown, toggle Attach to Selection, click OK, and confirm the settings persisted.

**Acceptance Scenarios**:

1. **Given** the dialog is open, **When** the user selects a different Page Behavior option, **Then** the text item's pagination updates once the user clicks OK.
2. **Given** the dialog is open, **When** the user toggles Attach to Selection on, **Then** the item is attached to the current note/measure selection and its pagination resets to "Once", matching current behavior.

---

### Edge Cases

- Move-text mode and text-edit mode are mutually exclusive: activating one is not possible while the other is already active (matches current `hide-when-editing` / `hide-when-moving` behavior in the legacy dialog).
- Opening the dialog on a text item that has not yet been edited this session automatically starts a text-editing session, matching current behavior; opening it again later in the same session does not re-trigger auto-edit.
- Cancelling after the text has been dragged to a new position reverts the position along with any content changes, since both are tracked by the same undo group opened when the dialog was shown.
- Toggling Attach to Selection on forces Page Behavior back to "Once", since pagination and attach-to-selection are mutually exclusive today.
- Removing the text item (Remove control) unrenders and deletes it regardless of which mode (edit/move/idle) was active when Remove was clicked.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dialog MUST be implemented as a Vue component with a creation function following the same pattern as `SuiTimeSignatureDialogVue` (`src/ui/dialogs/timeSignature.ts`): a plain function that accepts the standard dialog parameters, wires up reactive state and commit/cancel callbacks, and installs a corresponding new `.vue` component via the existing dialog-installation mechanism.
- **FR-002**: The dialog's set of controls MUST match the elements enumerated in `SuiTextBlockDialog.dialogElements` (`src/ui/dialogs/textBlock.ts`): text editing, insert-special, move-text, X position, Y position, font, page behavior, and attach-to-selection — reimplemented without the legacy custom dialog-component base classes.
- **FR-003**: The X Position and Y Position controls MUST be implemented using the existing `numberInput.vue` component.
- **FR-004**: The insert-special and page-behavior dropdown controls MUST be implemented using the existing `select.vue` component.
- **FR-005**: The text-content editing control MUST be implemented using the `TextGroupEditor` component, editing the same text-group data the dialog is operating on, in place of the legacy in-place SVG text editor.
- **FR-006**: The font control MUST be implemented using the existing `fontPicker.vue` component, editing the active text block's font family, size, weight, and style.
- **FR-007**: The move/drag-text control MUST preserve its current on-canvas drag behavior (mouse-driven positioning), reachable and toggleable from the new dialog rather than rebuilt from scratch.
- **FR-008**: When move-text mode is active, the dialog MUST hide every other control, showing only the control needed to stop the drag.
- **FR-009**: When the text-editing control is active, the dialog MUST hide or disable every other control until text editing is exited.
- **FR-010**: Move-text mode and text-editing mode MUST remain mutually exclusive.
- **FR-011**: Clicking OK MUST commit all pending changes (text content, position, font, page behavior, attach-to-selection) to the score, matching the legacy dialog's save behavior.
- **FR-012**: Clicking Cancel MUST discard all changes made since the dialog was opened, restoring the text item to its prior state.
- **FR-013**: A Remove control MUST remain available to delete the text item, matching current behavior.
- **FR-014**: Opening the dialog on a text item that has not yet been edited this session MUST automatically start a text-editing session, matching current behavior.

### Key Entities

- **Text Group**: The score text item being edited as a whole — its justification, pagination, position, attach-to-selection state, and the one or more text blocks it contains.
- **Active Text Block**: The specific block within the text group currently being edited — its content and font (family, size, weight, style).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can open the Text Properties dialog on any existing score text item and successfully edit its content, format it, reposition it, change its font, and save, with no user-visible functional regression compared to the current dialog.
- **SC-002**: A user can complete a full open-edit-save cycle without encountering any control built on the dialog's legacy custom-component base classes; every interaction surface responds and behaves consistently with the rest of the application's modern dialogs.
- **SC-003**: Activating move-text mode always results in exactly one visible/interactive control (stop-dragging); activating text-edit mode always results in every other control being hidden or disabled.
- **SC-004**: Cancel always fully reverts the text item to its state before the dialog was opened, with no residual changes to score content or position.

## Assumptions

- `SuiTextBlockComponent` (the legacy control for adding, reordering, and independently positioning multiple text blocks within a group) is superseded by `TextGroupEditor`, which already represents every text block in the group as a paragraph within one rich-text document and reconstructs the block list from the edited document on save. A separate block-list-management control is not part of this version, and new blocks created via the rich-text editor stack below the previous one rather than supporting independent left/right/above placement.
- "Attach to Selection" continues to be a simple on/off control; since no dedicated Vue toggle component exists yet, it is implemented with a plain checkbox styled consistently with existing Vue dialog conventions (e.g., the bold/italic checkboxes already used in `fontPicker.vue`).
- The move-text (drag) control's underlying drag-session logic (mouse down/move/up driving the canvas drag) is reused largely as-is; only its dialog-control shell moves to a Vue component, since the interaction directly manipulates the SVG canvas outside typical Vue-managed DOM.
- "Insert Special" continues to exist as a dropdown (via `select.vue`) whose selection inserts the corresponding placeholder token into the text editor at the current cursor position, now targeting the `TextGroupEditor` component instead of the legacy typing session.
- This is an internal architectural migration (legacy custom dialog components to Vue components) rather than a change to end-user-visible score-text capabilities. The existing `SuiTextBlockDialog` class and its call sites are expected to remain unchanged until the new dialog is verified; swapping callers over to it is a separate, later change and out of scope here.
- No project constitution has been ratified yet, so no additional project-specific principles apply beyond the existing Vue dialog conventions already established in the codebase (e.g., `src/ui/dialogs/*.ts` creation functions paired with `src/ui/components/dialogs/*.vue` components).
