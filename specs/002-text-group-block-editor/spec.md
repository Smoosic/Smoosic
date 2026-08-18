# Feature Specification: Block-Aligned Text Group Editor

**Feature Branch**: `002-text-group-block-editor`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "bring textGroupEditor vue element into line with how SmoTextGroup works. SmoTextGroup has a single relativePosition for all of the SmoScoreText elements that determine the layout of the text. Each SmoScoreText block has a single font/weight/style (the position in SmoTextBlock is not used). One of the text blocks is considered the 'active' block during editing, and all the current font settings apply to that block. So we should remove all formatting controls in the tip tap editor. The non-active elements should be displayed as atoms in the tip-tap editor (not editable), and the layout of the text should reflect the relativePosition. For instance, if the relativePosition is 'BELOW', each element is in its own paragraph. We should add some controls to the non-editable part of the control: A button (+) to add a new active element, A button (X) to remove the active element. A dropdown to change the relativePosition for the group. And controls (left and right arrow) to move between active elements, disabled if it is already the first/last control. So to summarize the changes: 1) remove tip-tap formatting from the text editor, 2) formatting and editing in tip-tap should reflect the current block's font settings and overall relativePosition, 3) add controls for managing the active elements."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit one text block at a time with its own font applied automatically (Priority: P1)

As a score editor user working in the text editing surface, I want only the single block I'm currently working on to be editable, with its font/weight/style applied to it automatically, so that the block's appearance in the editor always matches the single font/weight/style it will actually have on the score, and I can't accidentally mix formatting inside one block.

**Why this priority**: This is the core correctness fix — today the editor exposes per-character/per-run rich-text formatting (bold, italic, superscript, subscript, font family, font size, alignment) that doesn't match the data model, where each text block has exactly one font/weight/style for its entire content. This mismatch is the root problem the feature exists to solve.

**Independent Test**: Open the text editor for a text group with a single block, confirm no formatting toolbar is present, confirm typed text automatically takes on the active block's existing font/weight/style, and confirm the change is preserved when the dialog is closed and reopened.

**Acceptance Scenarios**:

1. **Given** a text group with one block, **When** the user opens the text editor, **Then** no bold/italic/superscript/subscript/alignment/font-family/font-size toolbar controls are shown.
2. **Given** the active block has a bold, italic, 18pt serif font, **When** the user types or edits text in that block, **Then** the new text visually renders with that same font/weight/style without any manual selection.
3. **Given** the user changes the active block's font/weight/style using the existing font controls outside the text editing surface, **When** the change is applied, **Then** the active block's text in the editor immediately reflects the new font/weight/style.

---

### User Story 2 - See other blocks in the group as read-only context while editing (Priority: P1)

As a score editor user, when a text group has more than one block, I want to see the non-active blocks laid out the way they'll actually appear (using the group's relative position), but not be able to edit them directly, so I have accurate context for how my edits fit into the whole group without risking unintended changes to blocks I'm not currently working on.

**Why this priority**: Without this, users editing a multi-block group (e.g., a title with a subtitle) have no visual feedback for how the block they're editing relates to the rest of the group, and could accidentally alter blocks that aren't the intended target of an edit.

**Independent Test**: Open the text editor for a text group with 3 blocks where the second block is active; confirm the first and third blocks are visible but not editable (clicking/typing into them has no effect), and confirm their layout (each on its own line, or joined on the same line) matches the group's relative-position setting.

**Acceptance Scenarios**:

1. **Given** a text group with multiple blocks and relative position set so each block starts a new line, **When** the editor is opened, **Then** each block appears on its own line/paragraph, active or not.
2. **Given** a text group with multiple blocks and relative position set so blocks flow on the same line, **When** the editor is opened, **Then** the blocks appear joined on a single line in their existing order.
3. **Given** a non-active block is displayed, **When** the user clicks into it or attempts to type over it, **Then** its content and font/weight/style remain unchanged and the editing cursor does not enter it.

---

### User Story 3 - Manage which blocks exist and which one is active (Priority: P2)

As a score editor user, I want controls to add a new block, remove the currently active block, step to the previous/next block, and change the group's overall relative-position layout, so I can build and rearrange a multi-part text element (for example, a composer line and an arranger line) entirely from the text editor without needing a separate dialog.

**Why this priority**: This delivers the block-management workflow the feature is meant to enable, but it depends on User Stories 1 and 2 already correctly rendering a single active, editable block among read-only siblings — management controls are only useful once that foundation exists.

**Independent Test**: Open the text editor for a text group with 2 blocks; use the add control to create a third block and confirm it becomes active and editable; use the previous/next controls to move the active selection across all three blocks, confirming the boundary controls disable correctly; use the remove control to delete the active block and confirm the group returns to 2 blocks with a different block now active; use the relative-position dropdown and confirm the on-screen layout of all blocks updates to match.

**Acceptance Scenarios**:

1. **Given** a text group with one or more blocks, **When** the user activates the add control, **Then** a new block is created, becomes the active block, and is immediately editable.
2. **Given** a text group with more than one block, **When** the user activates the remove control, **Then** the active block is deleted from the group and another block in the group becomes active.
3. **Given** a text group with only one block remaining, **When** the user views the remove control, **Then** the control is disabled so the group cannot be emptied.
4. **Given** the active block is the first block in the group, **When** the user views the "previous block" control, **Then** it is disabled; **When** the user views the "next block" control (and more than one block exists), **Then** it is enabled.
5. **Given** the active block is the last block in the group, **When** the user views the "next block" control, **Then** it is disabled.
6. **Given** the user activates the "next" or "previous" control while it is enabled, **When** the control is activated, **Then** the adjacent block becomes the active, editable block and the previously active block becomes read-only.
7. **Given** a text group with multiple blocks, **When** the user selects a different value in the relative-position dropdown, **Then** the group's relative position updates and the on-screen arrangement of all blocks (active and read-only) immediately reflects the new layout.

### Edge Cases

- What happens when the user activates the remove control while only one block exists? The control MUST be disabled/inert; removing the group's last block is not permitted from this control (the whole text item can still be deleted via the dialog's existing remove/delete action).
- What happens when the group starts with zero blocks (e.g., a brand-new text item)? The editor MUST behave as if one empty block exists so there is always exactly one active, editable block to type into.
- What happens to the newly added block's font/weight/style? It MUST start from the currently active block's font/weight/style at the time the add control is used, so newly added text doesn't default to an unrelated style.
- What happens when the relative-position dropdown is changed while a block is being actively edited? The in-progress edit MUST be preserved; only the arrangement/layout of blocks changes, not their text content.
- What happens when there is only one block and the user changes the relative-position dropdown? The setting MUST still be recorded on the group (it affects where a second block would go if one is added later), even though a single block's own on-screen arrangement doesn't visibly change.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The text editing surface MUST NOT present manual formatting controls (bold, italic, superscript, subscript, text alignment, font family, font size) to the user.
- **FR-002**: Exactly one text block in the group MUST be marked active and editable at any time the text editor is open.
- **FR-003**: All text blocks other than the active block MUST be displayed as read-only, non-editable, non-splittable elements that preserve their own text and font/weight/style.
- **FR-004**: Text entered or edited in the active block MUST automatically take on that block's existing font, weight, and style, with no separate manual formatting step required inside the text editor.
- **FR-005**: The arrangement of blocks within the text editor MUST reflect the group's relative-position setting: blocks whose relative position starts a new line MUST each appear on their own line/paragraph, in order; blocks whose relative position continues the current line MUST appear joined together on the same line, in order.
- **FR-006**: The text editor MUST provide an "add block" control that creates a new, initially empty text block, inserts it into the group, and makes it the active/editable block.
- **FR-007**: The text editor MUST provide a "remove block" control that deletes the currently active block from the group and activates a different remaining block.
- **FR-008**: The "remove block" control MUST be disabled whenever the group contains only one block, so the group can never be reduced to zero blocks through this control.
- **FR-009**: The text editor MUST provide a relative-position dropdown, scoped to the whole group, that lets the user choose among the group's supported relative-position values; selecting a value MUST update the group's relative position and the on-screen arrangement of all blocks.
- **FR-010**: The text editor MUST provide "previous block" and "next block" controls that move the active/editable state to the adjacent block in the group's block order.
- **FR-011**: The "previous block" control MUST be disabled when the active block is the first block in the group; the "next block" control MUST be disabled when the active block is the last block in the group.
- **FR-012**: When a new block is added via FR-006, its font/weight/style MUST be initialized from the block that was active immediately before the add action.
- **FR-013**: Changing the active block (via add, remove, or previous/next controls) MUST update any font-editing controls elsewhere in the dialog so they reflect the newly active block's font/weight/style.

## Key Entities *(include if feature involves data)*

- **Text Group**: A set of one or more text blocks that are laid out together as a single visual text item on the score; carries the single relative-position setting shared by the whole group.
- **Text Block**: A single run of text with its own font, weight, and style, and a position within its group's ordering. Exactly one text block per group is the "active" block at any time during editing.
- **Relative Position**: A group-level setting describing how each block is placed relative to the one before it (starting a new line above/below the previous content, or continuing on the same line to the left/right).
- **Active Block**: The single text block currently open for editing; determines which font-editing controls apply and which content in the editor is editable versus read-only.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can build a 3-line text item (e.g., title, subtitle, credit line) using only the add/navigate/remove controls, without ever needing a formatting toolbar, in under 30 seconds.
- **SC-002**: In a multi-block group, 100% of non-active blocks are visibly distinguishable as read-only and reject direct text edits, in every relative-position layout.
- **SC-003**: Switching the active block via the previous/next controls updates the editable content and any related font display within a single interaction (one click/tap), with no intermediate manual step.
- **SC-004**: Changing the relative-position dropdown updates the visual arrangement of every block in the group immediately, with no page reload or dialog re-open required.
- **SC-005**: After the change, zero text blocks can end up with more than one font/weight/style combination within themselves, since per-run formatting is no longer possible in the editor.

## Assumptions

- Font/weight/style for the active block continue to be set through the existing font-editing controls in the surrounding text dialog (outside the text editing surface itself), which already operate on the group's active block; this feature only removes the redundant in-editor formatting toolbar and keeps those existing controls as the single source of font changes.
- The group's text-alignment/justification setting (left/center/right) is out of scope for this feature; since its previous editing path (the alignment buttons in the removed toolbar) goes away, its value is left unchanged by this feature and is not exposed as a new control.
- "Relative position starts a new line" refers to the group's ABOVE/BELOW-style values, and "continues the same line" refers to the group's LEFT/RIGHT-style values, consistent with how the score's renderer already lays out blocks using this setting.
- A brand-new text item with no blocks yet is treated as a single empty active block for editing purposes, consistent with how the rest of the dialog already assumes at least one block exists (e.g., when reading the active block's font).
- Deleting the very last remaining block entirely (removing the text item itself) remains the responsibility of the dialog's existing overall remove/delete action, not the in-editor "remove block" control.
