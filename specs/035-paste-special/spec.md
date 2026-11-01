# Feature Specification: Paste Special for Note Attachments

**Feature Branch**: `035-paste-special`

**Created**: 2026-10-31

**Status**: Draft

**Input**: User description: "make it easier to cut/paste things attached to notes.  Currently in the UI edit menu there is a 'Paste Chords' that lets you paste chord changes from one part to another, without affecting notes.  We should generalize this so that you can go 'Paste Special' and it will bring up a dialog with some checkboxes of things to paste.  Included in this should be: dynamics, lyrics, annotations, chords, articulations, ornaments.  This will allow you to paste to a different part or different part of the score, replacing or adding the specific attribute but not changing the chords or pitches.   The paste is done by counting notes, not their values.  For things other than chords, there is no need to transpose or change them in any other way."

## Clarifications

### Session 2026-10-31

- Q: The request says the paste counts notes, not their values. The existing Paste Chords actually lines notes up by adding up their lengths (elapsed time). Which should Paste Special use? -> A: Keep the existing behavior for all the markings: line up by elapsed time, exactly as Paste Chords does today. (The earlier "count notes" wording in the request came from reading the existing code differently.)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Paste only chosen kinds of markings onto existing notes (Priority: P1)

An arranger has lyrics, dynamics and articulations written on one part and wants the same markings on another part (or on another passage of the same part) without retyping them and without touching the music already there. They copy the passage, place the cursor on the first note of the destination, and choose **Paste Special** from the Edit menu. A dialog lists the kinds of markings that can be pasted: dynamics, lyrics, annotations, chords, articulations and ornaments, each with a checkbox. They tick the ones they want and confirm. Only those kinds of markings are copied onto the destination notes. The destination's pitches and rhythms are not changed, and neither are any kinds of marking left unticked.

**Why this priority**: This is the whole point of the feature: moving markings between parts and passages quickly, which today takes retyping or only works for chords.

**Independent Test**: In a score with two staves, put a dynamic, a lyric and an articulation on the notes of staff 1, give staff 2 different pitches, copy staff 1's measures, put the cursor on staff 2's first note, open Paste Special, tick only Dynamics, and confirm. Staff 2 gains staff 1's dynamics; its pitches, rhythms, lyrics and articulations are exactly as before.

**Acceptance Scenarios**:

1. **Given** a copied passage and a destination cursor, **When** the user chooses Paste Special, **Then** a dialog appears with checkboxes for dynamics, lyrics, annotations, chords, articulations and ornaments.
2. **Given** the dialog is open, **When** the user ticks one or more kinds and confirms, **Then** only those kinds of markings are applied to the destination notes.
3. **Given** a Paste Special has been applied, **When** the destination is inspected, **Then** every pitch, duration, rest, tie, slur, beam and tuplet is unchanged from before the paste.
4. **Given** the dialog is open and no checkbox is ticked, **Then** the confirm button is unavailable, so an empty paste cannot be performed by mistake.
5. **Given** the user cancels the dialog, **Then** the score is unchanged.

---

### User Story 2 - Choose to replace or add to what is already there (Priority: P1)

The destination notes may already have some of the same kind of marking. The dialog lets the user decide whether the pasted markings **replace** the existing ones of the chosen kinds, or are **added** to them. With replace, the destination's markings of each ticked kind end up matching the copied ones, including being cleared where the copied note has none. With add, the destination keeps what it has and gains the copied ones.

**Why this priority**: Without this choice the feature either destroys work the user wanted to keep or leaves old markings behind. The request calls for both behaviors.

**Independent Test**: Give destination notes their own lyrics. Paste Special lyrics from a source in replace mode: the destination lyrics become the source's. Undo, then paste in add mode: the destination keeps its lyrics and also shows the source's.

**Acceptance Scenarios**:

1. **Given** destination notes with their own articulations, **When** the user pastes articulations in replace mode, **Then** each destination note has exactly the articulations of the corresponding copied note, and a note whose copied counterpart has none ends up with none.
2. **Given** the same destination, **When** the user pastes articulations in add mode, **Then** each destination note keeps its articulations and also has those of the corresponding copied note.
3. **Given** replace mode with several kinds ticked, **When** the paste is applied, **Then** each ticked kind is replaced and each unticked kind is left alone.
4. **Given** a kind where a note can hold only one (a dynamic, or a lyric for a given verse), **When** the pasted one meets an existing one in add mode, **Then** the pasted one takes its place, so the note never ends up with two.

---

### User Story 3 - Markings land where the music lines up in time (Priority: P1)

The source and destination often have different rhythms: a vocal line in quarter notes and a piano part in eighths, or a part with a long note where another has several. The paste lines the copied passage up with the destination the same way Paste Chords does today, by elapsed time: it adds up the lengths of the copied notes to find when each copied note starts, measured from the beginning of the copied passage. The markings of each copied note go to the first destination note, counting from the cursor, that starts at or after that moment. Time runs on across barlines, so a copy of several measures keeps lining up in the destination's following measures. When the two parts have the same rhythm, this is simply one note to one note.

**Why this priority**: It decides which notes receive the markings, so every paste depends on it. Keeping the existing alignment means users who already use Paste Chords see no surprise.

**Independent Test**: Copy four quarter notes with lyrics "one two three four". Put the cursor on the first of eight eighth notes and Paste Special lyrics. The 1st, 3rd, 5th and 7th eighth notes get "one", "two", "three" and "four"; the other four eighth notes are unchanged.

**Acceptance Scenarios**:

1. **Given** a copy and a destination with the same rhythm, **When** markings are pasted, **Then** each destination note gets the markings of the copied note in the same position.
2. **Given** four copied quarter notes and a destination of eighth notes, **When** markings are pasted, **Then** they land on every second destination note and the notes in between are not changed.
3. **Given** a copied passage that spans several measures, **When** the paste crosses barlines in the destination, **Then** the alignment continues by elapsed time in the following measures.
4. **Given** four copied quarter notes and a destination of a half note followed by two quarter notes, **When** markings are pasted, **Then** the first copied note goes to the half note, the second and third both go to the first quarter note (their markings are combined, see FR-009 for single-valued kinds), and the fourth goes to the last quarter note.
5. **Given** the copied passage is longer than the rest of the destination part, **When** the paste reaches the end of the part, **Then** it stops there and the remaining copied markings are ignored; nothing is added past the end of the part.
6. **Given** the copied passage is shorter than the destination, **Then** the destination notes after the last matched note are not changed.
7. **Given** rests in the source or destination, **Then** a rest is aligned by its length like any other note.

---

### User Story 4 - Chords follow the destination's key; everything else is copied as is (Priority: P2)

Chord symbols pasted onto a transposing instrument (for example a B-flat clarinet part) are spelled for that instrument, as Paste Chords does today. A part in concert pitch keeps the chord names as they are, even when its key signature differs. All other kinds (dynamics, lyrics, annotations, articulations, ornaments) are copied exactly as they are, without any transposing or other change.

**Why this priority**: It preserves the behavior users already rely on for chords while keeping the rest simple, but it matters less than the paste itself working.

**Independent Test**: Copy a passage with chord symbols C, F, G, Am and paste Special chords onto a staff for an instrument written a whole step higher; the chords become D, G, A, Bm. Paste annotations and lyrics from the same source onto the same staff; the text is identical.

**Acceptance Scenarios**:

1. **Given** chords copied from a concert-pitch passage, **When** pasted onto a transposing instrument's part, **Then** the chord names are transposed for that instrument.
2. **Given** the same chords, **When** pasted onto a concert-pitch part whose key signature is different, **Then** the chord names are not changed.
3. **Given** lyrics, annotations, dynamics, articulations or ornaments, **When** pasted onto a part in a different key or transposition, **Then** they are unchanged.
4. **Given** the same source pasted twice with different tick choices, **Then** the second paste does not disturb markings applied by the first unless it covers the same kinds.

---

### User Story 5 - One undo step, and the old command is folded in (Priority: P3)

A Paste Special can be undone in one step. The separate **Paste Chords** command is replaced by Paste Special, in which chords is one of the checkboxes, so there is one place to go for this kind of paste.

**Why this priority**: Undo safety and a tidy menu are important to trust and discoverability but do not add new capability.

**Independent Test**: Apply a Paste Special with several kinds ticked; one Undo restores the score exactly. Open the Edit menu: Paste Special is there and Paste Chords is not.

**Acceptance Scenarios**:

1. **Given** a completed Paste Special, **When** the user chooses Undo once, **Then** the score is exactly as it was before.
2. **Given** the Edit menu, **Then** it offers Paste Special and no longer offers Paste Chords.
3. **Given** nothing has been copied, **When** the user looks at Paste Special, **Then** it is unavailable (or says there is nothing to paste) and no dialog changes the score.

---

### Edge Cases

- The destination cursor is on a note near the end of the part: the paste applies as far as the part goes and stops, without error.
- Several copied notes are aligned to one destination note (for example four copied quarter notes against a half note followed by two quarters: the second and third copied notes both go to the first quarter): the destination note receives all their markings; a dynamic or a same-verse lyric from the later copied note wins.
- The destination has notes between those that receive markings (for example copied quarter notes against destination eighth notes): those in-between notes are left exactly as they were, even in replace mode.
- The copied passage includes several staves: markings are matched staff to staff in the same arrangement as an ordinary paste, and each staff's destination is the corresponding staff below the cursor; if there aren't enough staves, the same limit as ordinary paste applies.
- The destination voice is the one the cursor is in; other voices of the destination are not touched.
- A copied note has several markings of one kind (for example two articulations): all of them are pasted.
- A destination note is a rest: it receives the markings like any other note.
- The same kind is ticked in replace mode and the copied note has none: the destination's markings of that kind are removed.
- The user pastes into the same place they copied from: the markings end up the same as before; nothing breaks.
- The copied passage was taken from a score that has since changed (notes deleted): the paste uses what was copied, not the current source.
- Dynamics and annotations that were drawn or placed by hand (offset or custom position) keep their position settings when pasted.
- Grace notes, ties, slurs, hairpins, tuplets, and rehearsal marks or other measure-level and staff-level items are not part of this feature and are not pasted.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Edit menu MUST offer a **Paste Special** command that opens a dialog, and the separate Paste Chords command MUST be removed from the menu.
- **FR-002**: The dialog MUST present one checkbox each for dynamics, lyrics, annotations, chords, articulations and ornaments, and a choice between replacing and adding to what the destination already has.
- **FR-003**: The dialog's confirm action MUST be unavailable until at least one checkbox is ticked; cancelling MUST leave the score unchanged.
- **FR-004**: Paste Special MUST apply only the ticked kinds of marking to the destination, and MUST NOT change the destination's pitches, durations, rests, ties, slurs, beams, tuplets or any unticked kind of marking.
- **FR-005**: The markings MUST be aligned to destination notes by elapsed time, exactly as the existing Paste Chords does: a copied note starts at the sum of the lengths of the copied notes before it, and its markings go to the first destination note, counting from the cursor in the cursor's voice and staff, that starts at or after that time. Elapsed time continues across barlines and measures. For the same rhythm in both, this is one note to one note.
- **FR-006**: Rests MUST be aligned by their length like any other note, in both the copied passage and the destination.
- **FR-007**: When the copy runs past the end of the destination part, the paste MUST stop at the end of the part without adding notes or raising an error. Destination notes that no copied note is aligned to MUST be left unchanged.
- **FR-008**: In replace mode, for each ticked kind, a destination note that receives markings from one or more copied notes MUST first lose its existing markings of that kind and then have exactly the markings of those copied notes, which may be none.
- **FR-009**: In add mode, for each ticked kind, a destination note MUST keep its existing markings and gain those of the copied notes aligned to it; where a note can hold only one of a kind (a dynamic, or a lyric for one verse), the last pasted one MUST take the place of any existing one. When several copied notes are aligned to one destination note, their markings are combined in order (in both modes), with the same single-valued rule.
- **FR-010**: Chord symbols MUST be spelled for the destination's instrument transposition, as the existing Paste Chords does (a concert-pitch destination keeps the chord names unchanged, whatever its key signature); all other kinds MUST be pasted unchanged.
- **FR-011**: Paste Special MUST work from one staff to another, within the same staff, and between different parts of the score, for copies of one or several staves arranged as in an ordinary paste.
- **FR-012**: The whole Paste Special MUST be a single undoable step.
- **FR-013**: The command MUST be unavailable, or report that there is nothing to paste, when nothing has been copied.
- **FR-014**: The pasted markings MUST be independent copies: changing or deleting a pasted marking MUST NOT affect the original, and the other way round.
- **FR-015**: Automated tests MUST cover each of the six kinds, replace and add modes, mismatched rhythms, running past the end of the destination, rests, multi-measure copies, chord transposition, unticked kinds left untouched, and that pitches and durations never change.

### Key Entities

- **Marking kind**: One of dynamics, lyrics, annotations, chords, articulations, ornaments. The user chooses which kinds to paste.
- **Copied passage**: The notes the user copied, in order, with their markings. Each copied note starts at the sum of the lengths of the copied notes before it.
- **Destination run**: The notes from the cursor onward in the cursor's voice and staff. A copied note is aligned to the first of them that starts at or after the copied note's start time.
- **Paste mode**: Replace (destination's markings of the ticked kinds become the copied ones) or Add (destination keeps its markings and gains the copied ones).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can move a set of markings (for example the lyrics of a vocal line) to another part in one dialog visit and no more than 4 actions after copying (place cursor, open Paste Special, tick, confirm), with no retyping.
- **SC-002**: In every test case, 100% of destination pitches, durations, rests and unticked markings are identical before and after a Paste Special.
- **SC-003**: In 100% of tested cases the markings of each copied note land on the destination note that Paste Chords would pick for it: one note to one note when the rhythms match, and the first destination note starting at or after the copied note's start time when they differ.
- **SC-004**: Replace mode leaves each destination note with exactly the copied note's markings of the ticked kinds in 100% of tested cases; add mode never removes an existing marking except a single-valued one that is explicitly superseded.
- **SC-005**: Chord symbols pasted onto concert-pitch and transposing parts match what Paste Chords gave before the change for the same cases (verified for eight rhythm and transposition scenarios).
- **SC-006**: One Undo returns the score to exactly its state before the paste in 100% of tested cases.
- **SC-007**: Pasting markings across a 16-measure passage completes without any visible delay beyond a normal paste.

## Assumptions

- "Cut/paste" in the request refers to the existing Copy followed by Paste Special; no new Cut variant is added. Copying works as it does today.
- Paste Special replaces Paste Chords, with chords as one of the checkboxes.
- No checkbox is pre-ticked, so a paste always reflects an explicit choice. The dialog's replace/add choice defaults to replace.
- The dialog does not remember its settings between uses (it may remember them for the current session).
- "Annotations" means the free-text note annotations; "lyrics" means sung text by verse; "chords" are chord symbols; "dynamics" are the dynamic marks attached to notes; "articulations" and "ornaments" are those attached to notes.
- Grace notes, tab or fret information, microtones, ties, slurs, hairpins, tuplets, and anything attached to measures or staves rather than notes are out of scope.
- Alignment starts at the note under the cursor in its voice and staff and uses elapsed time, like Paste Chords does today (the same rule for every kind of marking), and follows the same rules as an ordinary paste for copies that span several staves.
- This feature builds on the existing copy buffer and does not change how Copy or Paste work.
