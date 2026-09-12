# Feature Specification: Vue-Based Lyric Dialog

**Feature Branch**: `010-vue-lyric-dialog`

**Created**: 2026-09-11

**Status**: Draft

**Input**: User description: "create a vue-based dialog for the legacy dialog lyric.ts in src/ui/dialogs. Use numberInput.vue components for the SuiRockerComponent, and select.vue for the dropdowns. Create a tip-tap dialog for the lyricEditor component, similar to how the textBlockVue.ts works. There is an edit mode, where the text editor is open, and a dialog mode when editing is complete. The text editor should have no styling controls, it is just plain text in the lyric font. The arrow controls on the lyric component move to the next or last note, this legacy logic for this is in src/ui/dialogs/components/SuiNoteTextComponent.ts. The lyric component also has a cross (delete) button, which indicates to delete the current lyric. The checkbox button indicates editing is complete, and the other dialog components are shown (font, etc.) similar to text block."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enter or edit a note's lyric as plain text (Priority: P1)

As a score editor user, when I open the Lyric Editor dialog on a selected note, an edit mode opens automatically with a plain-text editing surface pre-loaded with that note's current lyric (or empty, if none), so I can type or correct the lyric syllable/word directly.

**Why this priority**: Entering lyric text is the dialog's core purpose; every other capability exists to support this workflow.

**Independent Test**: Select a note, open the Lyric Editor dialog, confirm the plain-text editor opens automatically with the note's existing lyric (if any), type a new value, complete editing, and confirm the note's lyric reflects the typed text with no font/size/weight styling applied from within the editor.

**Acceptance Scenarios**:

1. **Given** a note with an existing lyric selected, **When** the user opens the Lyric Editor dialog, **Then** edit mode starts automatically with the plain-text editor showing that lyric's current text rendered in the lyric's own font.
2. **Given** the plain-text editor is open and the user types new text, **When** the user ends the editing session, **Then** the note's lyric text is updated to match what was typed, with no bold/italic/alignment or other style controls having been available in the editor.
3. **Given** a note with no lyric yet for the active verse, **When** the user opens the dialog, **Then** the editor opens empty and ready for input.

---

### User Story 2 - Move between notes while entering lyrics (Priority: P2)

As a score editor user, while the plain-text editor is open, I can use arrow controls to move to the next or previous note in the score, so I can enter lyrics across a run of notes without closing and reopening the dialog for each one.

**Why this priority**: Lyrics are typically entered across a phrase of consecutive notes in one sitting; without in-place navigation the dialog would only be usable one note at a time.

**Independent Test**: Open the Lyric Editor on a note, type a lyric, click the "next note" arrow, confirm the current note's text was saved and the editor now shows the next note's lyric (or empty), repeat with the "previous note" arrow, and confirm navigating past the first or last note in the score simply has no effect.

**Acceptance Scenarios**:

1. **Given** the plain-text editor is open on a note with typed text, **When** the user activates the "next note" arrow, **Then** the typed text is saved to the current note's lyric, the editor advances to the next note in the score, and shows that note's existing lyric text (or empty).
2. **Given** the plain-text editor is open, **When** the user activates the "previous note" arrow, **Then** the same save-then-move behavior occurs in the opposite direction.
3. **Given** the currently selected note is the first (or last) note in the score, **When** the user activates the "previous" (or "next") arrow, **Then** the editor stays on the current note and no error occurs.

---

### User Story 3 - Delete a note's lyric (Priority: P3)

As a score editor user, while editing a note's lyric, I can click a delete control to remove that lyric entirely, so I can clear a mistakenly-entered or no-longer-needed lyric without retyping over it or leaving the dialog.

**Why this priority**: Removing a lyric is a distinct, occasionally-needed action, but it's secondary to the core entry and navigation workflow.

**Independent Test**: Open the Lyric Editor on a note that has lyric text, click the delete (cross) control, and confirm that note's lyric is removed and the editor automatically advances to the next note.

**Acceptance Scenarios**:

1. **Given** the plain-text editor is open on a note with lyric text, **When** the user clicks the delete control, **Then** that note's lyric is removed from the score and the editor advances to the next note, matching the current navigate-after-delete behavior.
2. **Given** the plain-text editor is open on a note with no lyric text, **When** the user clicks the delete control, **Then** the action completes with no error and the editor still advances to the next note.

---

### User Story 4 - Finish editing and adjust verse, position, and font (Priority: P4)

As a score editor user, once I've finished typing a lyric, I can mark editing complete to switch to a dialog mode that shows the verse selector, vertical (Y) position adjustment, and font controls for the lyric line, so I can fine-tune how the lyric line as a whole is presented.

**Why this priority**: These are line-level presentation settings, useful but secondary to the text-entry workflow that occupies most of a lyric-editing session.

**Independent Test**: Open the Lyric Editor, finish typing a lyric, mark editing complete, confirm the verse/Y-position/font controls appear (and the arrow/delete controls disappear), change each control, and confirm the underlying lyric updates accordingly. Confirm clicking back into edit mode restores the plain-text editor and hides those controls again.

**Acceptance Scenarios**:

1. **Given** the plain-text editor is open (edit mode), **When** the user clicks the "editing complete" control, **Then** the current note's text is saved, edit mode ends, and dialog mode appears showing Verse, Y Adjustment, and Font controls populated from the current note's lyric.
2. **Given** dialog mode is showing, **When** the user changes the Verse selection, the Y Adjustment value, or the Font, **Then** the corresponding property of the current note's lyric is updated.
3. **Given** dialog mode is showing, **When** the user clicks the control to resume editing, **Then** the plain-text editor reopens (edit mode) on the current note and the Verse/Y Adjustment/Font controls are hidden again.

---

### Edge Cases

- Navigating (next/previous) or deleting while not currently in edit mode has no effect, since those controls only exist within the editor and are not shown in dialog mode.
- Verse, Y Adjustment, and Font cannot be changed while edit mode is active; they only become available once editing is marked complete, matching current behavior where these controls are hidden while the text editor is open.
- Closing the dialog via OK or Cancel behaves identically: any active editing session is ended (saving the note currently being edited) and the dialog closes; lyric text changes and deletions made while navigating between notes are already applied to the score as they happen, so there is no separate whole-session discard.
- Pressing Escape while the dialog is open ends any active edit session and closes the dialog, matching current behavior.
- Reopening the dialog on a different note always restarts edit mode automatically for that note, regardless of whether a prior session in this dialog had been marked complete.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dialog MUST be implemented as a Vue component with a creation function following the established pattern used for other migrated dialogs (e.g., the Text Properties dialog), replacing `SuiLyricDialog` (`src/ui/dialogs/lyric.ts`) without modifying the legacy class or its call sites.
- **FR-002**: The dialog's control set MUST match the elements enumerated in `SuiLyricDialog.dialogElements`: Verse, Y Adjustment, Font, and the lyric text editor.
- **FR-003**: The Verse control MUST be implemented using the existing `select.vue` dropdown component, offering the four verses defined today (verse 1 through verse 4).
- **FR-004**: The Y Adjustment control MUST be implemented using the existing `numberInput.vue` component in place of the legacy `SuiRockerComponent`, editing the lyric's vertical offset as an integer.
- **FR-005**: The Font control MUST edit the lyric's font family and size, following the same font-control pattern already used by other migrated dialogs.
- **FR-006**: The lyric text editing surface MUST be a new plain-text editing component built on the same underlying rich-text editing library used by the existing text-group editor, but exposing no style/formatting controls of any kind — only plain text, displayed in the lyric's own font.
- **FR-007**: The dialog MUST have exactly two mutually exclusive modes: edit mode (the plain-text editor, with next/previous-note and delete controls) and dialog mode (Verse, Y Adjustment, and Font controls, editor hidden).
- **FR-008**: A single toggle control MUST switch between modes: while in edit mode, activating it ends the editing session and switches to dialog mode; while in dialog mode, activating it starts an editing session and switches to edit mode — matching the legacy pencil/checkmark icon toggle behavior.
- **FR-009**: Opening the dialog MUST automatically enter edit mode and start an editing session for the currently selected note's lyric, regardless of whether a prior session had already completed editing.
- **FR-010**: The next/previous-note controls (available only in edit mode) MUST reuse the existing note-navigation behavior (`SuiNoteTextComponent` / lyric session `advanceSelection` logic): saving the currently edited note's text, then moving the selection to the next or previous note in the score and loading that note's existing lyric (text, verse, font) into the editor and dialog state. Navigating past the first or last note in the score MUST leave the current note selected with no error.
- **FR-011**: The delete control (available only in edit mode) MUST remove the current note's lyric for the active verse and then advance to the next note, reusing the existing lyric-removal session logic.
- **FR-012**: Switching from edit mode to dialog mode MUST commit the currently edited note's text to the score and populate the Verse, Y Adjustment, and Font controls from that note's lyric.
- **FR-013**: Changing Verse, Y Adjustment, or Font while in dialog mode MUST update the corresponding property (verse assignment, vertical offset, font family/size) of the current note's lyric.
- **FR-014**: Both OK and Cancel MUST end any active editing session (saving the note currently being edited) and close the dialog; text changes and deletions made while navigating between notes remain applied, matching current behavior.
- **FR-015**: The dialog MUST be dismissible via the Escape key, which ends any active editing session before closing, matching current behavior.

### Key Entities

- **Lyric**: The text line attached to a specific note for a given verse — its content, verse number, vertical offset, and font (family, size).
- **Current Note Selection**: The note the dialog is currently positioned on; changes as the user navigates with the next/previous controls, driving which lyric is loaded into the editor and dialog controls.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can open the Lyric Editor dialog on any note, enter or edit its lyric text, and save it with no user-visible functional regression compared to the current dialog.
- **SC-002**: A user can enter lyrics across an entire consecutive run of notes using only the next/previous arrow controls, without closing and reopening the dialog.
- **SC-003**: While edit mode is active, none of the Verse, Y Adjustment, or Font controls are visible or interactive, and while dialog mode is active, none of the plain-text editor, next/previous, or delete controls are visible or interactive.
- **SC-004**: Deleting a note's lyric and continuing to the next note requires exactly one control activation (the delete control), with no additional navigation step needed.
- **SC-005**: A user can complete a full open-edit-toggle-adjust-save cycle without encountering any control built on the dialog's legacy custom-component base classes.

## Assumptions

- This is an internal architectural migration (legacy custom dialog components to Vue components), not a change to end-user-visible lyric capabilities. `SuiLyricDialog` and its call sites remain unchanged until the new dialog is verified; wiring callers over to it is a separate, later change and out of scope here.
- "No styling controls" means the plain-text editor exposes no bold/italic/alignment/insert-special or other formatting affordances; it renders and edits a single run of plain text in the lyric's configured font, unlike the richer text-group editor it is modeled after.
- The Font control is restricted to family and size, matching the legacy dialog's `setLyricFont` behavior, which always applies a fixed 'normal' weight.
- The Verse dropdown offers exactly four fixed verse options (1 through 4), matching the legacy dialog's configured options.
- No project constitution has been ratified yet, so no additional project-specific principles apply beyond the existing Vue dialog conventions already established in the codebase (e.g., `src/ui/dialogs/*.ts` creation functions paired with `src/ui/components/dialogs/*.vue` components, and reuse of `numberInput.vue` / `select.vue`).
