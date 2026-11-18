# Feature Specification: Dynamics Dialog Cleanup and Font Size

**Feature Branch**: `040-dynamics-dialog-cleanup`

**Created**: 2026-11-15

**Status**: Draft

**Input**: User description: "src/ui/dynamicsVue.ts uses SuiDynamicDialogAdapter, which is a method from a legacy method of dialogs. We don't need the object, instead implement all the functions directly in SuiDynamicModifierDialogVue anonymous functions and local variables. Also, there is a font parameter in the underlying SmoDynamicText that is not exposed in the vue dialog. We should be able to set the font size also. Once the functionality is in dynamicsVue.ts, we can remove dynamics.ts from the dialogs directory."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Change the size of a dynamic marking (Priority: P1)

A user has put a dynamic marking such as *mf* under a note and finds it too small to read, or too large next to the notes. They select the note, open the Dynamics dialog, and change the **Font Size** field. The marking on the score changes size as they adjust it. They press OK and the new size stays.

**Why this priority**: This is the only change a musician will notice. Every dynamic marking has a size, but today the dialog gives no way to change it.

**Independent Test**: Select a note with a dynamic marking, open the Dynamics dialog, increase Font Size, and confirm the marking is drawn larger. Press OK, save the score, reopen it, and confirm the size is the same.

**Acceptance Scenarios**:

1. **Given** a note with a dynamic marking, **When** the user opens the Dynamics dialog, **Then** it shows a Font Size field set to the marking's current size.
2. **Given** the dialog is open, **When** the user changes Font Size, **Then** the marking is redrawn at the new size right away, without closing the dialog.
3. **Given** the user changed the size, **When** they press OK, **Then** the marking keeps the new size, and the size is saved with the score.
4. **Given** the user changed the size, **When** they press Cancel, **Then** the marking returns to its original size, along with any other change made in the dialog.
5. **Given** several notes are selected, **When** the user changes Font Size, **Then** the marking on every selected note changes to that size.
6. **Given** a score saved before this feature, **When** it is opened, **Then** its dynamic markings are drawn at the same size as before.

---

### User Story 2 - The Dynamics dialog keeps working as it does today (Priority: P1)

A user opens the Dynamics dialog to choose a different dynamic (for example *p* instead of *mf*), nudge it up or down, move it left or right, or remove it. All of this works exactly as before, including on a selection of several notes, Cancel, and Remove, and each change shows on the score as it is made.

**Why this priority**: The dialog is being rewritten internally, so the main risk is breaking something people already use. This story is what proves nothing was lost.

**Independent Test**: Open the dialog on one note and on several notes; change the dynamic, the Y line, the Y offset and the X offset; confirm each shows on the score at once. Press Cancel and confirm everything returns. Open it again and press Remove, and confirm the marking is gone from every selected note.

**Acceptance Scenarios**:

1. **Given** the dialog is open on one note, **When** the user changes the dynamic, Y Line, Y Offset or X Offset, **Then** the marking on the score updates as each is changed.
2. **Given** several notes are selected, **When** the user changes any of those fields, **Then** the markings on all of the selected notes change together.
3. **Given** the user has made changes, **When** they press Cancel, **Then** every change made in the dialog is undone, including on every selected note.
4. **Given** the user has made several changes and presses OK, **When** they then choose Undo once, **Then** all the changes made in that dialog are undone together.
5. **Given** the dialog is open, **When** the user presses Remove, **Then** the marking is removed from every selected note.
6. **Given** a dynamic marking has been selected on the score (rather than a note), **When** the user opens the dialog, **Then** it edits that marking, and the markings of any other selected notes, as before.
7. **Given** a note with no dynamic marking, **When** the user chooses Dynamics from the menu, **Then** a default marking is added and the dialog opens on it, as before.
8. **Given** the dialog opens, **When** it appears, **Then** it is placed next to the marking, as before.

---

### User Story 3 - The old dialog is gone (Priority: P2)

A developer looking at the dialogs no longer finds two dynamics dialogs. The Dynamics dialog is defined in one place, its logic written directly where the dialog is created, without the intermediate object that older dialogs used. The old, unused dialog is deleted.

**Why this priority**: It keeps the code small and removes a dialog nobody opens, but it changes nothing for the user.

**Independent Test**: Search the project for the old dialog and its helper object: neither is defined or referenced anywhere. The application builds, and the Dynamics dialog still opens from the menu and from the dialog factory.

**Acceptance Scenarios**:

1. **Given** the change is complete, **When** the project is searched, **Then** there is no remaining definition of, or reference to, the old Dynamics dialog or its adapter object.
2. **Given** the change is complete, **When** the project is built, **Then** it builds without errors.
3. **Given** the dialog is requested by its name (for example from the dialog factory), **When** it is created, **Then** the same Dynamics dialog opens.

---

### Edge Cases

- A Font Size that is not a sensible number (empty, zero or negative) is not accepted; the marking keeps its last valid size. [see Assumptions for the allowed range]
- The size field can be changed many times quickly; the marking ends at the last value, with no flicker to old values.
- Pressing Cancel after changing only the size restores the original size.
- Pressing Remove after changing the size removes the marking; Undo brings back the marking at its original size.
- A selection that contains notes with different dynamic markings: the dialog edits the marking on the first note, as it does today, and applies each change to all of the selected notes.
- A selection that contains notes with no marking: the menu adds one to each before the dialog opens, as it does today.
- Opening the dialog on a large selection stays responsive: each change redraws once, not once per selected note.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Dynamics dialog MUST show a **Font Size** field alongside Y Line, Y Offset and X Offset, set to the current size of the marking.
- **FR-002**: Changing Font Size MUST redraw the marking at the new size immediately, without closing the dialog, on every selected note.
- **FR-003**: The marking's size MUST be saved with the score and restored when the score is opened.
- **FR-004**: Scores saved before this feature MUST open with dynamic markings at the same size as before.
- **FR-005**: The dialog MUST keep every existing control and behaviour: choosing the dynamic text, Y Line, Y Offset, X Offset, applying changes to all selected notes, live redraw, Cancel, Remove, placement next to the marking, and undo of all of a dialog session's changes in one step.
- **FR-006**: Cancel MUST undo every change made in the dialog session, including the size.
- **FR-007**: A Font Size outside the allowed range MUST NOT be applied. The marking keeps its last valid size.
- **FR-008**: The Dynamics dialog MUST be implemented in one place, with its state and actions written directly in the function that creates the dialog. It MUST NOT depend on the adapter object used by the older style of dialog.
- **FR-009**: The old Dynamics dialog and its adapter object MUST be deleted, and nothing in the project may refer to them.
- **FR-010**: Everything that opens the Dynamics dialog (the Text menu choice and the dialog factory, by name) MUST keep working and open the same dialog.
- **FR-011**: The application MUST build after the change.

### Key Entities *(include if feature involves data)*

- **Dynamic marking**: Text such as *p* or *ff* attached to a note. Has the dynamic itself, a vertical position (line and pixel offset), a horizontal offset, and a font size. All of these are saved with the note.
- **Dynamics dialog**: The form that edits a dynamic marking on the selected notes. Holds the values being edited while it is open and applies each change to the score as it is made.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can change the size of a dynamic marking in three actions or fewer: select the note, open the Dynamics dialog, change Font Size.
- **SC-002**: After a Font Size change, 100% of the selected notes' markings show the new size within one redraw, and the size is the same after saving and reopening the score.
- **SC-003**: Every behaviour in User Story 2 works as it did before the change: 0 behaviours lost, checked one by one.
- **SC-004**: After Cancel, 100% of the selected markings are back to their size, position and text from before the dialog opened.
- **SC-005**: Scores saved before this feature open with no visible change in any dynamic marking.
- **SC-006**: The project contains 0 definitions of, or references to, the old Dynamics dialog and its adapter object, and it builds without errors.

## Assumptions

- "Font Size" is the size already stored with each dynamic marking, and the score drawing already uses it. The feature exposes it; it does not change how it is used.
- The allowed range for Font Size is whole numbers from 1 to 99, shown in the dialog in the same way as the other number fields. This is a reasonable default and can be tuned. The marking's default size is unchanged.
- Font Size is applied to the marking only; the dynamic text, position and offsets are unchanged by it.
- The dialog's name as used by the dialog factory and the list of dialogs for translation stays the same, so existing callers and language files are unaffected.
- The old Dynamics dialog is a library export. Removing it removes it from the library's public list as well. No application code opens it (the menu and factory both use the newer dialog), so only third-party code that imported the old dialog by name would be affected; this is accepted, in line with the request to remove it.
- Other dialogs that mention the old adapter in a comment (for example the annotation dialog) are not changed except to fix the comment, so it no longer points at a file that does not exist.
- "Undo" behaviour of the dialog (one undo step for a dialog session) is kept exactly as it is today, whatever the mechanism.
- Text for the new field is in English, following the existing practice for dialog labels.
