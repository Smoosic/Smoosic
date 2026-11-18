# Feature Specification: Delete Special for Note Attachments

**Feature Branch**: `041-delete-special`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "create a 'delete special' similar to paste special.  You can delete specific SmoNote modifiers attached to notes:  dynamics, lyrics,  annotations, articulations, ornaments, grace notes, arpeggios, microtones."

## Clarifications

### Session 2026-11-16

- Q: Should Delete Special also remove chord symbols and annotations? → A: Yes, include both. Annotations were already in the list; chord symbols are added as a ninth kind, matching Paste Special. Lyrics, annotations and chord symbols are three separate checkboxes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remove only chosen kinds of markings from the selected notes (Priority: P1)

A composer or arranger has a passage with dynamics, lyrics, articulations and other markings on its notes, and wants to strip some of them (for example, all the dynamics and articulations, to start again) without touching the music itself. They select the notes, choose **Delete Special...** from the Edit menu, and a dialog lists the kinds of markings that can be removed, each with a checkbox. They tick the kinds they want gone and confirm. Those markings disappear from every selected note. The pitches, rhythms and rests, and every kind that was not ticked, are exactly as before.

**Why this priority**: This is the whole point of the feature. Today the only way to clear markings is to remove them one note and one kind at a time, or to delete the notes and re-enter them.

**Independent Test**: In a measure of four notes, give each note a dynamic, a lyric and an articulation. Select the whole measure, open Delete Special, tick only Dynamics, and confirm. No note has a dynamic any more; every note still has its lyric and articulation, and the pitches and durations are unchanged.

**Acceptance Scenarios**:

1. **Given** selected notes that carry markings, **When** the user chooses Delete Special from the Edit menu, **Then** a dialog appears with a checkbox for each of: dynamics, lyrics, annotations, chords, articulations, ornaments, grace notes, arpeggios and microtones, none of them ticked.
2. **Given** the dialog is open, **When** the user ticks one or more kinds and confirms, **Then** every marking of those kinds is removed from every selected note, and nothing else about the notes changes.
3. **Given** the dialog is open, **When** the user ticks nothing and confirms, **Then** the score is not changed (and no undo step is recorded).
4. **Given** the dialog is open, **When** the user cancels, **Then** the score is not changed.
5. **Given** a Delete Special that removed markings, **When** the user chooses Undo once, **Then** all the removed markings are restored together.

---

### User Story 2 - The right markings are removed, and only those (Priority: P1)

Several of the kinds are stored in similar ways (lyrics, annotations and chords are all text attached to a note; a grace note is a small note attached to a note). The user needs each checkbox to mean exactly what its name says, so that removing one kind never removes another.

**Why this priority**: A delete that takes more than it says is data loss, so this is as important as the command itself.

**Independent Test**: Give one note a lyric in two verses, an annotation, and a chord symbol. Delete only Lyrics. Both verses' lyrics are gone; the annotation and the chord symbol remain. Repeat with only Annotations: the annotation is gone; the lyrics and chord symbol remain.

**Acceptance Scenarios**:

1. **Given** a note with lyrics in several verses, an annotation and a chord symbol, **When** the user deletes Lyrics, **Then** the lyrics of every verse are removed and the annotation and chord symbol remain.
2. **Given** the same note, **When** the user deletes Annotations, **Then** the annotation is removed and the lyrics and chord symbol remain.
3. **Given** the same note, **When** the user deletes Chords, **Then** the chord symbol is removed and the lyrics and annotation remain.
4. **Given** a note with a dynamic, several articulations and several ornaments, **When** the user deletes Articulations, **Then** all the articulations are removed and the dynamic and ornaments remain; likewise for Ornaments and Dynamics.
5. **Given** a note with grace notes, **When** the user deletes Grace Notes, **Then** all of the note's grace notes are removed and the note's own pitches and duration are unchanged.
6. **Given** a note with an arpeggio, **When** the user deletes Arpeggios, **Then** the arpeggio is removed.
7. **Given** a note (or a chord) with microtones, **When** the user deletes Microtones, **Then** all the microtones are removed and the note keeps its pitches, as they were before the microtone was applied.
8. **Given** a note that has none of the ticked kinds, **When** the user confirms, **Then** that note is unchanged and no error is shown.

---

### User Story 3 - Work on any selection, in any number of staves and voices (Priority: P2)

The user may select one note, a run of notes, several measures, or notes in several staves. Delete Special applies to everything that is selected, and to nothing outside the selection.

**Why this priority**: It makes the command useful on whole passages, and keeps it safe.

**Independent Test**: In a two-staff score with dynamics throughout, select measures 2 and 3 in both staves, delete Dynamics. Measures 2 and 3 of both staves have no dynamics; measures 1 and 4 still have theirs.

**Acceptance Scenarios**:

1. **Given** a selection of one note, **When** the user deletes a kind, **Then** only that note is affected.
2. **Given** a selection spanning several measures and several staves, **When** the user deletes a kind, **Then** every selected note in every selected staff and measure is affected, and no unselected note is.
3. **Given** a measure with more than one voice and a selection in that measure, **When** the user deletes a kind, **Then** the notes of the selected voices are affected, in the same way an ordinary edit applies to a selection.
4. **Given** selected rests that carry markings (such as a dynamic or an annotation), **When** the user deletes those kinds, **Then** the markings are removed from the rests too.
5. **Given** a Delete Special on a large selection (16 measures), **When** it is confirmed, **Then** the score redraws once the change is complete, with no error, and a single Undo restores everything.

---

### Edge Cases

- What happens when nothing is selected? The command always has at least the note under the cursor, so a selection exists. If there is truly none, the command does nothing and reports nothing.
- What if the selected notes carry none of the ticked kinds? Nothing changes, there is no error, and (as for nothing ticked) no undo step is left behind that restores identical content.
- What if grace notes are removed from a note in a crowded measure? The measure's note durations do not change (grace notes take no time), and the measure redraws so the spacing is correct.
- What if the notes are in a part or a staff that is hidden or is a transposing instrument? The command works the same; transposition does not matter because markings are removed, not changed.
- What if a note's microtone is removed but the note is part of a chord? All microtones on the note's pitches are removed; the pitches themselves stay.
- Is a tie, slur, hairpin, tuplet, beam or other note-to-note thing removed? No. Only the nine kinds listed are available, and the other things attached to notes are untouched.
- What if the user opens Delete Special while playing audio? It behaves like the other Edit menu commands and dialogs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Edit menu MUST offer a **Delete Special...** command, next to Paste Special, that opens a dialog.
- **FR-002**: The dialog MUST list exactly these kinds of marking, each with a checkbox: dynamics, lyrics, annotations, chords, articulations, ornaments, grace notes, arpeggios, microtones.
- **FR-003**: No checkbox MUST be ticked when the dialog opens, so a delete always reflects an explicit choice. The dialog does not need to remember its choices between uses.
- **FR-004**: On confirm, the system MUST remove every marking of each ticked kind from every selected note, and MUST NOT change any selected note's pitches, durations, rests, ties, tuplets, beams, voices, or any marking of an unticked kind.
- **FR-005**: **Lyrics** MUST mean the sung text of every verse. It MUST NOT include annotations or chord symbols.
- **FR-006**: **Annotations** MUST mean the free-text annotations on the note. It MUST NOT include lyrics or chord symbols.
- **FR-007**: **Chords** MUST mean the chord symbols on the note. It MUST NOT include lyrics or annotations. Only a ticked Chords box removes chord symbols.
- **FR-008**: **Dynamics**, **articulations** and **ornaments** MUST mean all of the note's markings of that kind.
- **FR-009**: **Grace notes** MUST mean all the grace notes attached to the note.
- **FR-010**: **Arpeggios** MUST mean the note's arpeggio marking.
- **FR-011**: **Microtones** MUST mean all the microtone adjustments on the note's pitches; the pitches themselves are kept.
- **FR-012**: The command MUST apply to exactly the current selection (one note, a run of notes, several measures, several staves) and to no note outside it. Markings on rests in the selection MUST be treated the same as markings on notes.
- **FR-013**: The whole command MUST be a single undoable step; one Undo MUST restore every removed marking.
- **FR-014**: Confirming with no kind ticked, or cancelling the dialog, MUST leave the score unchanged and MUST NOT add an undo step.
- **FR-015**: The score MUST redraw correctly after the delete, including the spacing of measures that lose grace notes, accidentals or lyrics.
- **FR-016**: A saved score MUST not contain the removed markings; saving and reopening after a Delete Special MUST give the same notes without them.
- **FR-017**: Automated tests MUST cover each of the nine kinds, a mix of kinds in one delete, kinds left alone when unticked, each of lyrics, annotations and chords removed on its own leaving the other two, notes with none of the ticked kinds, multi-measure and multi-staff selections, selections that stop inside a measure, rests, single-step undo, and a save and reload of the result.

### Key Entities

- **Marking kind**: One of dynamics, lyrics, annotations, chords, articulations, ornaments, grace notes, arpeggios, microtones. The user chooses which kinds to delete.
- **Selected notes**: The notes (and rests) the user has selected on the score. Delete Special acts on these and on no others.
- **Note marking**: Anything in the nine kinds attached to a note, such as a dynamic, a verse of lyrics, an annotation, a chord symbol, an articulation, an ornament, a grace note, an arpeggio or a microtone.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can clear a kind of marking from a whole passage in no more than 4 actions (select, open Delete Special, tick, confirm), with no per-note editing.
- **SC-002**: In every test case, 100% of pitches, durations, rests, ties, tuplets and unticked markings of the selected notes are identical before and after a Delete Special.
- **SC-003**: In every test case, 100% of markings of the ticked kinds on selected notes are gone, and 100% of markings on unselected notes are unchanged.
- **SC-004**: Deleting any one of lyrics, annotations or chords never removes either of the other two, in 100% of tested cases.
- **SC-005**: One Undo returns the score to exactly its state before the delete in 100% of tested cases.
- **SC-006**: Deleting from a 16-measure selection completes without any visible delay beyond that of a normal edit of the same size.
- **SC-007**: A score saved after a Delete Special, then reopened, has none of the deleted markings and is otherwise identical, in 100% of tested cases.

## Assumptions

- The list of kinds is the one in the request plus **chords**, added in the clarification session, so the dialog offers the same six kinds as Paste Special (dynamics, lyrics, annotations, chords, articulations, ornaments) plus grace notes, arpeggios and microtones.
- The command works on the current selection, as the other editing commands do. It does not ask for a range or offer "whole score".
- There is no add or replace mode, unlike Paste Special; the command only removes.
- Like Paste Special, no checkbox is pre-ticked, and the dialog is a small modal dialog with the kinds as checkboxes, OK and Cancel.
- The command is always offered in the Edit menu (the selection always has at least the note under the cursor).
- "Annotations" means the free-text note annotations; "lyrics" means sung text by verse; "dynamics", "articulations" and "ornaments" are those attached to notes, as in Paste Special.
- Removing markings does not change how the notes sound apart from what the markings themselves affect (for example an arpeggio, a grace note or a microtone).
- Ties, slurs, hairpins, tuplets, beams, tab information, and anything attached to measures or staves rather than notes are out of scope.
- This feature does not change Paste Special, Copy or Paste.
