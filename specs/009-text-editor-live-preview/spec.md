# Feature Specification: Text Editor Live Preview and Active-Font Sync

**Feature Branch**: `009-text-editor-live-preview`

**Created**: 2026-09-10

**Status**: Draft

**Input**: User description: "when bringing up the dialog box TextBluckVue.ts, set the font in the editor window to be the same as the font for the active text block. Periodically as changes are made, replace the contents of the active text block with the edited content so the user can see it in context. For the text group that is being edited, change the font opacity slightly so we can see that is the text group that is being edited."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Editor opens with the active block's font (Priority: P1)

When a user opens the text properties dialog to add or edit a text group on the score, the text-entry area should immediately display in the same font (family, size, weight, style) as the text block that is currently active, so what they see while typing already looks like what will appear on the score.

**Why this priority**: Without this, the editing surface looks generic/mismatched, and users cannot judge how their text will actually look until after they close the editor — this is the most basic trust-building behavior for the feature.

**Independent Test**: Open the text dialog on an existing text group whose font differs from the application default (e.g., a large bold serif heading). Verify the editor's displayed font matches that text block's font as soon as the dialog/editor opens, and continues to match if the user changes the font or switches which block is active while the dialog stays open.

**Acceptance Scenarios**:

1. **Given** a text group with a non-default font is selected for editing, **When** the text dialog opens, **Then** the editing area's font (family, size, weight, style) matches the active text block's font.
2. **Given** the text dialog is open and editing is in progress, **When** the user changes the font of the active block via the font picker, **Then** the editing area's displayed font updates to match immediately.
3. **Given** a text group with multiple blocks, **When** the user switches the active block (next/previous/add/remove), **Then** the editing area's font updates to match the newly active block.

---

### User Story 2 - Score reflects in-progress edits (Priority: P1)

While a user is typing in the text editor, the corresponding text group on the score itself should update to show the in-progress content, so the user can see how their edit looks in the actual context of the score (position, layout, surrounding music) without having to finish editing first.

**Why this priority**: Seeing text only inside a small dialog box doesn't tell the user how it will look against the staff, page margins, or other text — this is the core value of the feature and the main reason a user would want this over the prior editing flow.

**Independent Test**: Open the text dialog for a text group already placed on the score, type new content, and — without clicking "Done Editing Text" or closing the dialog — observe that the text rendered on the score updates to reflect what has been typed so far.

**Acceptance Scenarios**:

1. **Given** the text editor is open and the user is typing, **When** the user pauses briefly after making changes, **Then** the score's rendering of that text group updates to show the current in-progress content.
2. **Given** the user is still actively editing, **When** they have not clicked Done/OK, **Then** the in-progress content is visible on the score but the edit is not yet a separate, individually-undoable step — cancelling still discards it in one action.
3. **Given** the user cancels the edit after in-progress content has already been shown on the score, **When** cancellation completes, **Then** the score reverts to exactly the content that existed before the dialog was opened.
4. **Given** the user confirms (OK/commit) the edit, **When** commit completes, **Then** the score shows the final edited content, matching what was last previewed.

---

### User Story 3 - Visual indicator for the text group being edited (Priority: P2)

While a text group is open for editing, that text group should be rendered slightly differently (reduced opacity) on the score than all other text, so the user can immediately tell, just by looking at the page, which piece of text corresponds to the dialog they have open.

**Why this priority**: This is a clarity/orientation improvement, most valuable on scores with several text items where it would otherwise be ambiguous which one is being edited; it depends on User Story 2's live rendering already being in place to be meaningful.

**Independent Test**: Place two or more text groups on a score. Open the text dialog for one of them and confirm only that one visibly dims (reduced opacity) while the others remain at full, normal opacity. Close the dialog (via OK or Cancel) and confirm the edited group returns to full opacity.

**Acceptance Scenarios**:

1. **Given** a score with multiple text groups, **When** the user opens the text dialog for one of them, **Then** only that text group is rendered at reduced opacity; all other text groups remain at normal opacity.
2. **Given** a text group is currently shown at reduced opacity because it is being edited, **When** the user confirms or cancels the edit, **Then** the text group returns to full, normal opacity.
3. **Given** a brand-new text group is being created (not yet confirmed), **When** the creation dialog is open, **Then** the new text group is also shown at the same reduced opacity as any other in-progress edit.

---

### Edge Cases

- What happens if the user clears all text from the active block while editing? The score preview should show the block as empty/blank during editing; empty blocks are only pruned when the edit is confirmed (existing behavior), not while editing is in progress.
- What happens if the user switches the active block within the same group mid-edit (e.g., via Previous/Next/Add/Remove)? The whole text group remains at reduced opacity throughout; only the editor's displayed font needs to change to match the newly active block.
- What happens if the user drags/moves the text group or changes its position while editing is paused? The reduced-opacity indicator should persist for as long as the dialog is open and in an editing state, regardless of other in-dialog actions.
- What happens if periodic content updates would fire faster than the score can visibly redraw? Updates should be paced so the score stays visually responsive and does not lag behind or flicker noticeably.
- What happens on cancel after several periodic updates have already changed the score? The final result must be indistinguishable from the score never having been touched during that editing session.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When the text properties dialog opens for a text group (new or existing), the system MUST set the text editor's displayed font (family, size, weight, and style) to match the font of that group's active text block.
- **FR-002**: The system MUST keep the editor's displayed font synchronized with the active block's font for the remainder of the dialog session, whenever the font changes or a different block becomes active.
- **FR-003**: While the user is actively editing text content, the system MUST periodically apply the in-progress edited content to the active text block so the score rendering reflects the current, unfinished edit.
- **FR-004**: The periodic update described in FR-003 MUST occur automatically, without the user needing to take an explicit "preview" or "apply" action, and at a cadence frequent enough that the score visibly keeps pace with typing (e.g., shortly after each pause in typing) without introducing noticeable lag to the editor itself.
- **FR-005**: Content applied to the score by the periodic update described in FR-003 MUST NOT be treated as a separate, individually undoable action; the entire editing session (from dialog open to commit or cancel) remains a single undo step, consistent with current dialog behavior.
- **FR-006**: If the user cancels editing at any point, the system MUST discard all periodically-previewed content and restore the score to the exact state it was in before the dialog was opened.
- **FR-007**: If the user confirms (commits) the edit, the system MUST ensure the score's final rendered content matches the content most recently previewed.
- **FR-008**: While a text group is open for editing (from dialog open until commit or cancel), the system MUST render that text group at a reduced opacity, distinct from the normal, full opacity used for all other text on the score.
- **FR-009**: The reduced opacity applied per FR-008 MUST leave the previewed text legible while still being visibly distinguishable from full-opacity text elsewhere on the score.
- **FR-010**: The opacity reduction and periodic content preview described above MUST apply only to the single text group currently open in the dialog; all other text groups on the score MUST remain unaffected, at normal opacity, and showing their own last-committed content.
- **FR-011**: As soon as editing ends, whether by confirming or cancelling, the system MUST restore the previously-edited text group to normal, full opacity.

### Key Entities

- **Text Group (SmoTextGroup)**: A positioned piece of text on the score, made up of one or more text blocks; has a layout/position and can be attached to a musical selection. This is the entity that gets the reduced-opacity treatment while being edited.
- **Text Block (SmoScoreText)**: An individual run of text within a text group, carrying its own font (family, size, weight, style) and content; exactly one text block in a group is "active" at a time, and its font drives what the editor displays.
- **Text Editing Dialog / Editor**: The on-screen dialog and its text-entry area where a user creates or modifies a text group's content, opened from the score for a new or existing text group.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the time a user opens the text dialog on a text block with a non-default font, the editor's initial displayed font visually matches that text block's font with no manual step required.
- **SC-002**: While a user types in the text editor, the on-score preview of that text reflects the user's latest input within about one second of a pause in typing, without the user closing or confirming the dialog.
- **SC-003**: In a score containing multiple text groups, a user can correctly identify which single text group is currently being edited, based only on its appearance on the score (reduced opacity), without needing to open or inspect the dialog.
- **SC-004**: After cancelling an edit, the score is visually identical to its state before the dialog was opened, in 100% of cancellation cases, regardless of how many in-progress preview updates occurred.
- **SC-005**: After confirming an edit, the on-score text matches exactly what was last shown in the live preview, with the text restored to normal (full) opacity.

## Assumptions

- "The dialog box TextBluckVue.ts" refers to the text properties dialog launched for creating/editing a `SmoTextGroup` (currently implemented as `SuiTextBlockDialogVue` in `src/ui/dialogs/textBlockVue.ts`), and "the editor window" refers to that dialog's text-entry/editing surface.
- "The active text block" means whichever `SmoScoreText` block within the group is currently marked active (the one the user is positioned in / editing), as already tracked by the text group model.
- "Periodically" is interpreted as an automatic, near-real-time update cadence (on the order of well under a second to about a second after the user pauses typing) rather than a fixed interval the user configures; the exact cadence is a technical tuning detail, not a user-facing setting.
- "Change the font opacity slightly" means a fixed, subtle, non-configurable reduction in opacity for the entire text group being edited (not just its font glyphs) — enough to be noticeable at a glance but not so much that the previewed text becomes hard to read.
- This behavior applies uniformly whether the user is editing a pre-existing text group or creating a brand-new one (new groups are already added to the score at dialog-open time in the current implementation).
- Only one text dialog can be open at a time (consistent with current modal dialog behavior), so at most one text group is in the reduced-opacity/live-preview state at any given moment.
- The existing single grouped-undo transaction per dialog session (open → commit or cancel) is preserved; this feature does not introduce new, separately-undoable steps for each periodic preview update.
