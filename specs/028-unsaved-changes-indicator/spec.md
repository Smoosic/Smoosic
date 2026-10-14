# Feature Specification: Unsaved Changes Indicator and Save Prompt

**Feature Branch**: `028-unsaved-changes-indicator`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Indicate whether the user has saved the score, and check before loading a score from the library or file menu whether the user wants to save or not. In the sidebar.vue component, show the name of the current score after 'Smoosic'. Indicate with an asterisk if the file has been changed since it was last saved. There probably isn't a way to tell right now if the score has been changed. It makes the most sense to do this in scoreView.ts, whenever one of the 'undo....' methods is called: if we are pushing something onto the undo buffer, we are inevitably going to be modifying the score, so we can indicate the change. The flag should be cleared when a new score is created or loaded."

## Clarifications

### Session 2026-10-13

- Q: Do exports to MusicXML or MIDI clear the unsaved-changes indicator? → A: No. Those formats are lossy, so only a save in the full Smoosic (JSON) format clears it. The Save dialog does not know the difference, so the save operation itself decides whether the change state is cleared.
- Q: When the user chooses Save on the prompt but exports only to a lossy format, does the new score still load? → A: No. The score is still unsaved, so the new score is not loaded and the save prompt is shown again.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See which score is open and whether it has unsaved changes (Priority: P1)

A user working on a score looks at the sidebar header, which reads "Smoosic" followed by the name of the score they have open. As soon as they make an edit, an asterisk appears after the name. When they save the score, the asterisk disappears. At a glance, they know whether closing the page or switching scores would lose work.

**Why this priority**: This is the core of the request. It gives the user the information, and it is the basis for the save prompt in Story 2. It is useful on its own even if the prompt were never added.

**Independent Test**: Open a score, confirm the sidebar shows its name with no asterisk. Make any edit (for example, add a note) and confirm an asterisk appears. Save the score and confirm the asterisk disappears.

**Acceptance Scenarios**:

1. **Given** a score has just been created or loaded, **When** the user looks at the sidebar header, **Then** it shows "Smoosic" followed by the score's name, with no asterisk.
2. **Given** a score with no unsaved changes, **When** the user makes an edit that can be undone (adding or changing notes, measures, text, layout or other score content), **Then** an asterisk appears after the score name.
3. **Given** a score with unsaved changes, **When** the user saves it, **Then** the asterisk is removed.
4. **Given** a score with unsaved changes, **When** the user saves it and then makes another edit, **Then** the asterisk appears again.
4a. **Given** a score with unsaved changes, **When** the user exports it to a lossy format such as MusicXML or MIDI, **Then** the asterisk remains, because the exported file does not preserve the whole score.
5. **Given** the user changes the score's name in the score information dialog, **When** the change is applied, **Then** the sidebar header shows the new name.
6. **Given** a score whose name is empty, **When** the sidebar header is shown, **Then** it displays a readable placeholder name rather than blank text or a stray asterisk next to "Smoosic".

---

### User Story 2 - Be asked to save before replacing the open score (Priority: P1)

A user with unsaved changes chooses to open a different score: New, Open, or Import from the File menu, or a score from the Music Library. Before the current score is replaced, the user is asked whether to save it. They can save and continue, continue without saving, or cancel and stay on the current score. If there are no unsaved changes, the new score loads straight away without a prompt.

**Why this priority**: This prevents the real harm, silently losing work. It depends on Story 1's change tracking, and is the reason for that tracking.

**Independent Test**: Make an edit, then choose Open (or pick a library score). Confirm a prompt appears and that each of its three choices behaves as described. Then save, choose Open again, and confirm no prompt appears.

**Acceptance Scenarios**:

1. **Given** a score with unsaved changes, **When** the user starts loading another score from the File menu (New, Open, or Import) or from the Music Library, **Then** a prompt asks whether to save the current score first, with options to save, not save, or cancel.
2. **Given** the prompt is showing, **When** the user chooses to save, **Then** the user is taken through saving the current score, and once the score has been saved in the full Smoosic format the new score loads.
3. **Given** the prompt is showing, **When** the user chooses not to save, **Then** the current score is discarded and the new score loads.
4. **Given** the prompt is showing, **When** the user cancels, **Then** nothing is loaded and the current score and its unsaved-changes state are unchanged.
5. **Given** the user chose to save but then abandons the save step without saving, **When** the save step closes, **Then** the new score is not loaded and the current score remains open with its asterisk.
5a. **Given** the user chose to save but exported to a lossy format (MusicXML or MIDI), **When** the save step closes, **Then** the new score is not loaded, the current score remains open with its asterisk, and the save prompt is shown again so the user can save in the full format, choose not to save, or cancel.
6. **Given** a score with no unsaved changes, **When** the user starts loading another score, **Then** no prompt appears and the new score loads immediately.
7. **Given** the user starts loading a score from a file or the library and then cancels the file or library selection itself, **When** the selection closes without choosing a score, **Then** no save prompt is left behind and the current score is unaffected.

---

### User Story 3 - Fresh start for each new or loaded score (Priority: P2)

Whenever a score is created, opened, imported, or loaded from the library (including loads done programmatically at startup), the new score begins as "saved". The asterisk from the previous score never carries over, and the header shows the new score's name.

**Why this priority**: It makes Stories 1 and 2 accurate across consecutive scores. It is lower priority only because it mostly falls out of loading correctly.

**Independent Test**: Make an edit (asterisk appears), choose "don't save" on the prompt while loading another score, and confirm the new score shows its own name with no asterisk. Repeat for New, Open, Import and Library.

**Acceptance Scenarios**:

1. **Given** a score with unsaved changes, **When** the user discards it and a new or loaded score replaces it, **Then** the header shows the new score's name with no asterisk.
2. **Given** the application starts and loads an initial score, **When** the header is first shown, **Then** it shows that score's name with no asterisk.
3. **Given** a score is loaded and the user makes no edits, **When** the user starts loading yet another score, **Then** no prompt appears.

---

### Edge Cases

- What happens when the user undoes edits back to the original state? The score is still treated as changed (the asterisk stays) because the application cannot reliably tell the content is identical to what was saved. It clears only on save or load.
- What happens when the user presses undo or redo? These count as edits to the score and keep or set the asterisk; they never clear it.
- What happens when the user makes only changes that cannot be undone and so are not tracked (view-only actions such as scrolling, zooming, selecting, or switching between score and a part view)? They do not set the asterisk.
- What happens when a save is started but the user closes the save dialog without saving? The score remains marked as changed.
- What happens when the user uses Quick Save? That saves in the full Smoosic format, so it counts as saving and clears the asterisk.
- What happens when the user exports to MusicXML, MIDI, or another lossy format? The file is written, but the score still counts as unsaved and keeps its asterisk.
- What happens when a load fails (an unreadable file)? The current score stays open and keeps its unsaved-changes state.
- What happens when a very long score name is shown? The header stays readable without breaking the sidebar layout; the name may be truncated visually.
- What happens when the user closes or reloads the browser tab with unsaved changes? Out of scope for this feature (see Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST track, for the currently open score, whether it has been changed since it was last saved or loaded.
- **FR-002**: The system MUST mark the score as changed whenever an editing operation records an undo step, since recording an undo step means the score is about to be modified.
- **FR-003**: The system MUST NOT mark the score as changed because of view-only actions that record no undo step (selection, scrolling, zooming, playback).
- **FR-004**: The system MUST clear the changed state when the score is saved in the full Smoosic (JSON) format (through the Save dialog or Quick Save), and MUST NOT clear it when the score is exported to a lossy format such as MusicXML or MIDI. The decision is made by the save operation, which knows the format, not by the dialog. The system MUST also clear the changed state when a new score is created or a score is loaded or imported from a file, the Music Library, a remote address, or at application startup.
- **FR-005**: The sidebar header MUST show the application name followed by the current score's name.
- **FR-006**: The sidebar header MUST show an asterisk immediately after the score name when the score is marked as changed, and no asterisk otherwise.
- **FR-007**: The sidebar header MUST update when the score is edited, saved, replaced, or renamed, without the user needing to reload or reopen anything.
- **FR-008**: When the score's name is empty, the header MUST show a readable placeholder name.
- **FR-009**: Before a New, Open, or Import action from the File menu, or loading a score from the Music Library, replaces the current score, the system MUST check whether the score is marked as changed.
- **FR-010**: If the score is marked as changed, the system MUST ask the user whether to save, not save, or cancel, and MUST NOT replace the score until the user decides.
- **FR-011**: If the user chooses to save, the system MUST run the normal save flow for the current score and load the new score only once the score has been saved in the full Smoosic format; if the save is abandoned, or the score is exported only to a lossy format, the system MUST NOT load the new score, MUST keep the current score and its changed state, and, in the lossy-export case, MUST show the save prompt again.
- **FR-012**: If the user chooses not to save, the system MUST load the new score without saving the current one.
- **FR-013**: If the user cancels the prompt, the system MUST leave the current score and its changed state untouched and MUST NOT load anything.
- **FR-014**: If the score is not marked as changed, the system MUST load the new score without any prompt.
- **FR-015**: A failed or cancelled load MUST NOT change the current score's changed state.

### Key Entities

- **Score change state**: A yes/no indication, kept for the currently open score, of whether it has been modified since it was last saved or loaded. It is session state only and is not stored in the saved score file.
- **Score display name**: The name of the open score, taken from the score's own information; shown in the sidebar header and used as the suggested file name when saving.
- **Save prompt**: A question shown when the user is about to replace a changed score, offering save, don't save, and cancel.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After any single editing action that can be undone, the asterisk is visible in the header within one second, without the user doing anything else.
- **SC-002**: After a save, the asterisk disappears within one second; and after loading or creating any score, the header shows the new score's name with no asterisk in 100% of cases.
- **SC-003**: In 100% of attempts to replace a changed score through New, Open, Import, or the Music Library, the user is shown the save prompt before any content is lost; in 0% of attempts with an unchanged score is a prompt shown.
- **SC-004**: Choosing Cancel on the prompt results in zero change to the open score, its contents, and its asterisk.
- **SC-005**: A user can tell whether their score has unsaved changes at a glance, without opening any menu.

## Assumptions

- "Saved" means the score was written in the full Smoosic (JSON) format: either through the Save dialog or by Quick Save to the browser's local storage. Either one clears the asterisk. Exports to other formats (MusicXML, MIDI, and the like) lose information and so do not count as saving. The Save dialog's large "validation" variant of the Smoosic format holds the whole score, so it counts as a full save.
- Undo and redo are themselves edits and never clear the asterisk. Returning the score to its original content by undoing does not clear it either.
- The asterisk shows after any step recorded in the undo history, even if the step turns out not to alter the score. Slightly over-reporting a change is acceptable; under-reporting is not.
- Changes that are not recorded in the undo history (for example, zoom or other view settings) are not tracked as changes.
- The Save choice in the prompt reuses the existing Save dialog instead of introducing a new save mechanism, and the new score loads after the user completes that dialog.
- The prompt covers every way of replacing the current score from the user interface: File menu New, Open, and Import, and the Music Library. Loads made by the host application's own code (for example at startup) are not prompted for but do reset the state.
- The score name is the one in the score's information (the name also used as the suggested file name); an unnamed score is displayed with a placeholder such as "Untitled".
- Warning on closing or reloading the browser tab (a browser "leave site?" confirmation) is out of scope for this feature.
- The change state is not saved in the score file, so existing files and serialization are unchanged.
