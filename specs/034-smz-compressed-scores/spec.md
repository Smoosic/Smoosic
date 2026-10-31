# Feature Specification: Compressed Score Files (.smz)

**Feature Branch**: `034-smz-compressed-scores`

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: "allow us to save scores that are compressed.  Currently we save scores to disk in a dictionary that is smaller than just serializing the score.  When we save to disk, we should save files in zip format.  The extension should be smz for Smoosic zipped format.  I don't think it matters to use the dictionary anymore, since the serialized score will probably compress to the same size.  We should support the legacy json format for existing scores.  We should also support the 'validation' format since that's how we compare the score to the specification.  When we open a file for input, we should accept either smz or json file and handle it accordingly."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Save a score as a compressed .smz file (Priority: P1)

A composer finishes editing and chooses to save. The default "Smoosic" format now produces a single compressed file with the extension `.smz` (Smoosic zipped). The file is smaller than the full, un-abbreviated score text and no larger than the abbreviated text format used until now. The saved file contains the whole score, so the unsaved-changes indicator clears just as it does after any full save today.

**Why this priority**: This is the request itself. Smaller files are easier to store, email and share, and a single compressed format replaces the current trade-off between readable and compact files.

**Independent Test**: Open or create a score, choose Save, keep the default Smoosic format, and save. The file name ends in `.smz`, the file is a valid zip archive, and its size is no larger than the same score saved in the previous abbreviated format.

**Acceptance Scenarios**:

1. **Given** a score is open, **When** the user saves in the default Smoosic format, **Then** a file with the extension `.smz` is produced and the suggested file name ends in `.smz`.
2. **Given** a score has unsaved changes, **When** the user saves it as `.smz`, **Then** the unsaved-changes indicator clears.
3. **Given** a score is saved as `.smz`, **When** the file is inspected with an ordinary zip tool, **Then** it opens as a zip archive holding the full score document.
4. **Given** a typical multi-page score, **When** it is saved as `.smz`, **Then** the file is no larger than the same score saved in the previous abbreviated text format.

---

### User Story 2 - Open either .smz or .json files (Priority: P1)

A user opens a file from disk. They can pick a new `.smz` file or any score they saved earlier as `.json`, including scores in the previous abbreviated format and scores saved in the validation format. The application recognizes which kind it was given and loads the score without the user having to say.

**Why this priority**: Without this, saved `.smz` files cannot be reopened, and existing scores would become unreadable. It is as essential as saving.

**Independent Test**: Save the same score as `.smz`, then reopen it. The score shown is identical to the original. Then open a legacy `.json` file saved before this change; it also opens and shows the same music.

**Acceptance Scenarios**:

1. **Given** a `.smz` file, **When** the user opens it, **Then** the score loads with all of its content (staves, measures, notes, text, layout and preferences).
2. **Given** a legacy abbreviated `.json` file, **When** the user opens it, **Then** the score loads exactly as before this change.
3. **Given** a `.json` file saved in the validation format, **When** the user opens it, **Then** the score loads.
4. **Given** the file chooser, **When** the user browses for a file, **Then** `.smz` files are offered alongside `.json`, MusicXML and MIDI files.
5. **Given** a score saved as `.smz` and reopened, **When** it is saved again as `.smz`, **Then** the content is unchanged (the round trip loses nothing).

---

### User Story 3 - Keep the validation format (Priority: P2)

The validation format is how a saved score is compared against the published specification. It stays available as a save option, still produces plain, complete, un-abbreviated, uncompressed score text, and files saved this way can still be opened.

**Why this priority**: Specification checks and tooling depend on it, but it is used far less often than normal saving.

**Independent Test**: Save a score using the validation option; confirm the result is plain readable score text that passes the same specification check as before this change, and that the application can open it again.

**Acceptance Scenarios**:

1. **Given** a score is open, **When** the user saves with the validation option, **Then** the file is plain text, not zipped, and contains the complete score in full, un-abbreviated form.
2. **Given** a validation file saved by this version, **When** it is compared against the specification as before, **Then** it validates the same way as files from the previous version.
3. **Given** a score is saved in the validation format and as `.smz`, **When** both are opened, **Then** they show the same score.

---

### User Story 4 - Clear message when a file can't be read (Priority: P3)

A user opens a damaged `.smz` file, a zip that does not hold a score, or a file whose name and contents don't agree. They see that the file could not be opened and the score they were working on is left alone.

**Why this priority**: Failure handling protects the user's work, but it is only exercised when something has gone wrong.

**Independent Test**: Try to open a truncated `.smz`, an empty zip, and a text file renamed to `.smz`. Each is refused with a message, and the open score is unchanged.

**Acceptance Scenarios**:

1. **Given** a truncated or corrupt `.smz`, **When** the user opens it, **Then** an error is shown and the current score stays open and unchanged.
2. **Given** a valid zip that does not contain a score, **When** the user opens it, **Then** an error is shown and the current score is unchanged.
3. **Given** a `.json` file whose contents are not a valid score, **When** the user opens it, **Then** an error is shown and the current score is unchanged.

---

### Edge Cases

- A file's extension and its actual contents disagree (a zip named `.json`, or plain text named `.smz`): the file is handled according to its contents, not its name.
- A zip that contains more than one file, or extra files such as folder entries: the score document is found and the rest ignored; if there is no score document, the file is refused.
- Very large scores: saving and opening complete without freezing the application for noticeably longer than the previous format.
- Scores saved with a name that already ends in `.smz`, or that contain periods: the extension is not duplicated.
- Scores loaded from a web address (a configured remote score or a library entry): `.smz` and `.json` are both accepted there too.
- Opening a legacy abbreviated `.json`, then saving: the saved result is `.smz` with the full score content; the legacy abbreviation is not carried forward.
- Unicode text in titles, lyrics and annotations survives the save and open round trip unchanged.
- Scores saved by this version in `.smz` are not expected to open in older versions of the application; this is acceptable, and the validation format remains the readable interchange form.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The default Smoosic save format MUST produce a compressed zip archive with the extension `.smz`.
- **FR-002**: The `.smz` archive MUST contain the complete score, in full un-abbreviated form (no key-abbreviation dictionary), so that opening it restores everything a previously saved score restored.
- **FR-003**: The save dialog MUST offer `.smz` as the Smoosic format, suggest file names ending in `.smz`, and not add a second extension when the name already ends with it.
- **FR-004**: Saving as `.smz` MUST count as a full save of the score, clearing the unsaved-changes indicator as other full saves do.
- **FR-005**: The validation save option MUST remain available and MUST continue to produce plain, uncompressed, un-abbreviated score text suitable for comparison against the specification, with output equivalent to the previous version's.
- **FR-006**: The application MUST open `.smz` files, legacy abbreviated `.json` files, and validation-format `.json` files from the Open/Load file dialog, choosing how to read each automatically.
- **FR-007**: The file chooser in the Open/Load dialog MUST list `.smz` as an accepted type.
- **FR-008**: When a file's name and contents disagree about its kind (zip versus text), the application MUST handle the file according to its contents.
- **FR-009**: Opening any of these files and then saving as `.smz` MUST produce a file that opens to an identical score (no data loss in the round trip), including text with accented and non-Latin characters.
- **FR-010**: When a file cannot be read (corrupt archive, archive with no score, text that is not a score), the application MUST show an error message and MUST leave the currently open score unchanged.
- **FR-011**: Scores loaded from a web address MUST accept both `.smz` and `.json` content, determined the same way as for local files.
- **FR-012**: MusicXML, MIDI and Vex exports and imports MUST be unchanged.
- **FR-013**: Scores written by previous versions MUST continue to open with no loss, and the file layouts the specification defines MUST be unchanged for the validation format.
- **FR-014**: Automated tests MUST cover: save-then-open round trip for `.smz`; opening a legacy abbreviated `.json`; opening a validation `.json`; a corrupt `.smz`; a zip with no score; a mismatched extension; and a text round trip with non-Latin characters.

### Key Entities

- **Score file (.smz)**: A zip archive holding one complete score document. Identified by the `.smz` extension, and by its zip contents when the extension is wrong.
- **Legacy score file (.json, abbreviated)**: Plain text score using a dictionary to shorten repeated names. Read-only going forward.
- **Validation score file (.json, full)**: Plain text, complete, un-abbreviated score used to compare against the specification. Can be saved and opened.
- **Score document**: The complete serialized description of a score (staves, measures, notes, text, layout, preferences) common to all three file kinds once decoded.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A score saved as `.smz` is no larger than the same score saved in the previous abbreviated format, and at least 50% smaller than the same score in the validation format, for a multi-page sample score.
- **SC-002**: 100% of scores in the project's sample and test collection open after being saved as `.smz`, and show identical content (measured by comparing the full score document before and after).
- **SC-003**: 100% of existing `.json` scores in the sample collection (both abbreviated and validation) open with identical content to what the previous version produced.
- **SC-004**: Saving or opening a typical score takes no more than 1 second longer than the previous format on the same machine.
- **SC-005**: Opening a corrupt, empty-zip or non-score file never changes the open score and always shows an error message (verified in all three failure scenarios).
- **SC-006**: A user can save and reopen a score with no extra step compared with today: the number of choices in the save dialog does not increase (one Smoosic format replaces the previous one).

## Assumptions

- The default "Smoosic" choice in the save dialog now means `.smz`. A separate plain-text option for new abbreviated `.json` files is not retained; the validation option remains the plain-text, full-fidelity choice. Existing abbreviated `.json` files remain readable.
- The archive holds a single score document; its internal file name is not part of the user-facing contract, and the application finds the score by looking at the archive's contents.
- The validation format is saved with the same content and options as today, and keeps the `.json` extension, so existing specification-checking tools keep working.
- The existing zip support already available in the application can be reused; no new third-party dependency is expected.
- Scores held in the browser's own automatic local storage are not saved to disk and are not affected.
- Files from the previous abbreviated format and the validation format are both recognized without the user choosing.
- Forward compatibility (older application versions opening `.smz`) is out of scope.
- Library and remote scores currently published as `.json` remain valid; publishing them as `.smz` is a later, optional change.
