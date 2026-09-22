# Feature Specification: Convert Note-Attached Text Groups to Annotations

**Feature Branch**: `019-attached-text-to-annotation`

**Created**: 2026-09-19

**Status**: Draft

**Input**: User description: "convert SmoTextGroup with the attachToSelector to SmoLyric with annotation parser, and remove the original text groups from the score.  This should be done for both text groups in parts and text groups in the score.  In src/smo/data/score.ts, after line 744, look for text groups with attachToSelections set.  Find the note in the score, based on the stave/measure/note index.  If found, create a SmoLyric with the same text and parser set to annotation.  If there are multiple blocks, create an annotation for each block.  Remove those text groups from the list.  Do the same thing for text groups in parts (the partInfo attribute for each stave).  We should also remove the attachToSelector checkbox from the text group dialog."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Existing scores keep their note-attached text as annotations (Priority: P1)

As a user with saved scores that contain text "attached to selection" (text that was pinned to a particular note through the text block dialog), I want that text to still appear next to the same notes when I open the score, now as regular note annotations, so I don't lose or have to re-enter anything after the old attach feature goes away.

**Why this priority**: This is the core of the feature. The old attached-text representation is being retired, and if existing scores don't migrate cleanly, users lose content that was in their scores.

**Independent Test**: Open a score file saved with a note-attached text block (attached to a specific staff, measure and note). Confirm the same text is shown as an annotation on that note, that no separate attached text block remains in the score, and that saving and reopening the score keeps the annotation exactly once.

**Acceptance Scenarios**:

1. **Given** a saved score with a text block attached to a note that exists in the score, **When** the score is opened, **Then** that note has an annotation containing the same text, carrying the original's font and x/y offset, and the original attached text block is no longer part of the score.
2. **Given** a saved score whose attached text block contains several text blocks (multiple lines/runs), **When** the score is opened, **Then** the target note has one separate annotation for each block, each with the text of its own block, in the original block order.
3. **Given** a score that was opened and migrated, **When** the user saves it and opens it again, **Then** the annotations are present exactly once (no duplicates) and no attached text blocks reappear.
4. **Given** a saved score with a mix of attached text and ordinary text (title, subtitle, composer, headers/footers and other free-floating text), **When** the score is opened, **Then** only the attached text is converted; the ordinary text is unchanged and stays in place.

---

### User Story 2 - Part-level attached text is converted the same way (Priority: P2)

As a user whose score has individual parts (part extractions) that carry their own text blocks, I want note-attached text stored in those parts to be converted to note annotations just like it is in the main score, so the parts don't keep a leftover copy of the retired representation.

**Why this priority**: Parts hold their own separate list of text blocks. If they were skipped, some attached text would remain in the retired form or be lost, but this is a smaller share of scores than the main-score case.

**Independent Test**: Open a score whose part definition contains a note-attached text block, and confirm the referenced note has an annotation with the same text and the part's own attached text list no longer contains that block. Ordinary (unattached) part text remains.

**Acceptance Scenarios**:

1. **Given** a saved score where a part contains a text block attached to an existing note, **When** the score is opened, **Then** the note has an annotation with that text and the part no longer lists the attached text block.
2. **Given** a part containing both attached and unattached text blocks, **When** the score is opened, **Then** only the attached blocks are converted and removed; unattached part text is unchanged.
3. **Given** a score with several staves, each with its own part information, **When** the score is opened, **Then** every part's attached text is converted, not only the first staff's.

---

### User Story 3 - The text block dialog no longer offers "Attach to Selection" (Priority: P3)

As a user editing text blocks, I no longer want to see an "Attach to Selection" toggle in the text block dialog, because attaching text to a note is now done by adding an annotation to that note.

**Why this priority**: It stops new attached text blocks from being created, so the migration doesn't need to be re-run on newly created content. It's low risk and small, but only makes sense once conversion (Stories 1 and 2) is in place.

**Independent Test**: Open the text block dialog for a new or existing text block in non-editing view and confirm the "Attach to Selection" toggle is absent and every other control (position, font, page behavior, edit text, move text) still works.

**Acceptance Scenarios**:

1. **Given** the text block dialog is open in its normal (non-editing) view, **When** the user looks at its controls, **Then** there is no "Attach to Selection" toggle.
2. **Given** the text block dialog is open, **When** the user changes position, font or page behavior and commits, **Then** those changes are saved as before, and the text block is never marked as attached to a note.
3. **Given** the text block dialog previously kept "page behavior" and "attach" mutually exclusive, **When** the user changes page behavior, **Then** the change applies directly with no side effects related to attaching.

---

### Edge Cases

- What happens when the note referenced by an attached text block no longer exists (for example the stave, measure or note position is out of range, or the score was edited outside Smoosic)? No annotation can be created; the attached text block is still removed from the score's list so no unusable attached text remains. (See Assumptions.)
- What happens when an attached text block has a block with empty or whitespace-only text? No annotation is created for that block. If none of the blocks have text, no annotation is created and the text block is simply removed.
- What happens when the target note already has annotations? Converted annotations are added after the existing ones and the existing ones are unchanged. Notes support a limited number of annotations (four); if there isn't enough room for every block, the blocks that fit are converted in order and the remainder are dropped.
- What happens when two or more attached text blocks point at the same note? Their blocks all become annotations on that note, in the order the text blocks appeared, subject to the same limit.
- What happens when a part holds a copy of the same attached text that the main score also holds (the application copies attached text into a part that preserves text groups, so this is the usual case)? The note ends up with a single set of annotations, not one from the score plus one from the part. A part's attached text is discarded, unconverted, whenever its target note already has any annotation, whether or not the text matches. (The score's text and a part's text are never shown together, but annotations belong to the note and show in both, so converting the part's copy would show the text twice.)
- What happens when a score that has no attached text (including scores saved before text groups existed) is loaded? It loads exactly as before, with no changes and no errors.
- What happens when the score is opened and the migrated score is never saved? The saved file on disk is unchanged; the conversion happens on load and only becomes permanent when the user saves.
- What happens when part-level attached text points at a note that is also shown in the main score? The annotation belongs to the note, so it shows wherever that note is shown, in the main score and in the part.
- What happens with note-attached text created after this feature ships? It can't be created through the text block dialog anymore; users add an annotation to the note instead.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a score is opened, the system MUST find every text block group in the score's own text list that is marked as attached to a note.
- **FR-002**: For each such text block group, the system MUST locate the target note using the staff, measure and note position recorded on the group.
- **FR-003**: If the target note is found, the system MUST create an annotation on that note whose text is the same as the text block's text.
- **FR-004**: If the text block group contains multiple text blocks, the system MUST create one separate annotation for each block, each carrying its own block's text, in the original block order.
- **FR-005**: The system MUST remove every converted attached text block group from the score's text list, so the score contains no note-attached text groups after opening.
- **FR-006**: The system MUST perform the same find/locate/convert/remove process for the text block groups held in each staff's part information, so that no part retains any note-attached text groups after opening.
- **FR-007**: The conversion MUST leave all text block groups that are not attached to a note (titles, composer, headers/footers and other free-floating text) unchanged, in both the score and parts.
- **FR-008**: Converted annotations MUST behave like any other annotation on a note: they render on the score, can be edited from the Annotation dialog, are saved with the score, and reload intact.
- **FR-009**: The conversion MUST be idempotent: saving a converted score and reopening it MUST NOT create duplicate annotations or bring back any attached text groups.
- **FR-010**: Blocks with empty or whitespace-only text MUST NOT produce annotations.
- **FR-010a**: When converting a part's attached text, if the target note already has any annotation, the system MUST discard the whole text group without creating annotations from it, whatever its text, so a note never gets a second set of annotations from a part's copy of the score's text.
- **FR-011**: A converted annotation SHOULD keep the visual font (family, size, weight, style) of the text block it came from, as long as the annotation format can represent it.
- **FR-011a**: A converted annotation MUST keep the horizontal and vertical offset of the text group it came from, and the text MUST move in the same direction as before: an offset to the right or downward on the original stays to the right or downward on the annotation. When a group has several blocks, every resulting annotation gets the group's offset. A group with no offset gives an annotation with none.
- **FR-012**: The system MUST NOT fail to load a score because an attached text group cannot be matched to a note; unmatched groups are removed and loading continues.
- **FR-013**: The text block dialog MUST NOT show an "Attach to Selection" control, and using the dialog MUST NOT mark a text block as attached to a note.
- **FR-014**: Scores with no attached text groups (including those saved by older versions) MUST load and render exactly as they did before this feature.

### Key Entities

- **Attached Text Group**: A block of text (one or more text blocks) that is marked as attached to a specific note, recorded by staff, measure and note position. Existing in saved scores, both in the score's own text list and in each staff's part information. After this feature, it exists only transiently at load time and is never created or saved.
- **Text Block**: One run of text with its own font inside a text group. Each text block of an attached text group becomes one annotation.
- **Note Annotation**: Free-text attached to a note (up to four per note), with its own text, font, offset and vertical placement. It is the replacement representation for attached text groups.
- **Part Information**: The per-staff description of a part, including its own list of text groups. It is processed in the same way as the score's list.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For 100% of saved scores containing note-attached text where the target note exists, opening the score shows every non-empty text block as an annotation on that note, with the same text as before.
- **SC-002**: After opening any score, 0 note-attached text groups remain in the score or in any part.
- **SC-003**: Saving and reopening a converted score yields the same number of annotations as before saving (0 duplicates) and 0 attached text groups.
- **SC-004**: 100% of unattached text (titles, composer, headers/footers, free-floating text) is unchanged by the conversion.
- **SC-005**: Scores with no attached text, including those saved before this feature, load with 0 errors and no visible changes.
- **SC-006**: The text block dialog shows 0 "Attach to Selection" controls, and every remaining control continues to work.

## Assumptions

- The conversion happens when a score is loaded from its saved form, not each time the score is displayed; it becomes permanent in the saved file the next time the user saves.
- If the note an attached text group points at cannot be found, the group is still removed, since without a target note it cannot be displayed or edited meaningfully. No annotation is created in that case.
- Annotations on a note are limited to four, per the existing multiple-annotation feature (spec 018). Converted annotations use the next free positions on the target note; blocks that don't fit are dropped, which is expected to be very rare.
- The text, the font and the group's x/y offset are carried over. The group's offset is the position adjustment it had from where attached text is normally placed, and it becomes the annotation's own x/y offset, so the user can still see and change it in the Annotation dialog. It is not a pixel-exact match: the original was measured from the start of the measure and the annotation is measured from its note, so text may sit somewhere different from before, but it is shifted by the same amount and in the same direction. Page behavior and the relative positioning between blocks are not carried over, and converted annotations use the standard vertical placement (above the note).
- A part's attached text belongs to the staff that carries that part information, so the note is looked up on that staff using the recorded measure, voice and note position. The staff number recorded on a part's copy is part-relative (it is written as 0), so it is not used to pick the staff.
- The score's text is converted first and a part's text second, so a part's copy of the score's text always finds the note already annotated and is discarded. The rule is deliberately about the note having any annotation, not about the text matching, because a part's copy may have been edited separately from the score's. It applies to a part's text only; several attached groups in the score's own list that point at the same note are all converted.
- Removing the toggle from the dialog is the only change to the dialog; the underlying ability to read old attached-text data stays until a later cleanup, since the conversion has to read it.
- Attached-text-specific rendering and layout behavior elsewhere in the application (for example, moving attached text when measures are inserted) is out of scope here and can be cleaned up in a later change once conversion is in place.
- Existing behavior for ordinary text groups (titles, headers, footers, free-floating text) is unchanged.
