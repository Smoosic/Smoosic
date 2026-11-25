# Feature Specification: Preserve Music When Changing Time Signature

**Feature Branch**: `042-preserve-music-time-signature`

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "preserve music when changing time signature. 1. For the time signature dialog, change the logic when the time signature changes - do not commit the change until the user clicks OK. 2. Add a checkbox for 'preserve music', checked by default. If checked: a. make sure there is no less time represented in the new time signature, by adding additional measure if required. For instance, if there are 2 4/4 measures, and the time signature changes to 3/4, we would add a 3rd 3/4 measure. b. copy all the music from the original set of selected measures, and paste it into the destination. So it will have the same notes in the same order. c. if the checkbox is unchecked, just preserve as much music as fits in a measure, as it is today."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Change the meter without losing notes (Priority: P1)

A composer has written music in one meter and decides it should be in another: two measures of 4/4 that should be 3/4. Today, changing the time signature keeps only as much music as fits in each measure and the rest is thrown away. With the new **Preserve music** option (on by default), the same notes in the same order are re-barred into the new meter, and extra measures are added so nothing is lost.

**Why this priority**: Losing notes silently is the one outcome of the current behavior that cannot be undone by the user's own judgment, and it is the reason for the whole feature. Everything else supports it.

**Independent Test**: Take a score with two 4/4 measures of eight quarter notes, open the Time Signature dialog, choose 3/4, leave **Preserve music** ticked, and click OK. The score has three 3/4 measures holding the same eight quarter notes in the same order (the last measure is two quarters and a quarter rest).

**Acceptance Scenarios**:

1. **Given** two 4/4 measures of eight quarter notes selected, **When** the user changes the time signature to 3/4 with Preserve music ticked and clicks OK, **Then** there are three 3/4 measures, the first two holding three quarter notes each and the third holding the last two quarter notes followed by a quarter rest.
2. **Given** the same selection, **When** the new meter holds *more* time per measure (3/4 changed to 4/4, or 4/4 changed to 6/4), **Then** the music is re-barred into the larger measures, no notes are lost, and no extra measures are added beyond those that already exist unless needed.
3. **Given** a note that would cross a new bar line (a half note starting on the third beat of a 3/4 measure), **When** the change is applied with Preserve music ticked, **Then** the note is split at the bar line into two tied notes whose total duration is unchanged.
4. **Given** measures with two voices, **When** the meter is changed with Preserve music ticked, **Then** each voice keeps its own notes in order in the new measures.
5. **Given** notes carrying dynamics, lyrics, articulations, ornaments, chords or other markings, **When** the meter is changed with Preserve music ticked, **Then** each marking stays with the note it was on.
6. **Given** a score with several staves, **When** the meter is changed with Preserve music ticked, **Then** every staff is re-barred, each keeping its own music, and every staff gets the same number of measures.

---

### User Story 2 - Change takes effect only on OK (Priority: P1)

Today the time signature dialog changes the score immediately, as each field is edited, and Cancel puts the old signature back. Because re-barring music and adding measures is a large change, the dialog now only collects the choices. The score is not touched until the user clicks OK, and Cancel leaves the score exactly as it was.

**Why this priority**: Re-barring cannot safely run on every keystroke or arrow click, and the half-typed values that the live updates produce are a source of bugs. A single apply step is also what makes the change one undo step. Preserve music is not workable without it.

**Independent Test**: Open the dialog on a score, change the time signature, the Apply To choice and the Preserve music box, then click Cancel. The score, its measure count and its undo history are the same as before the dialog was opened. Open it again, make the same changes, click OK: the score changes, and one Undo restores it.

**Acceptance Scenarios**:

1. **Given** the dialog is open, **When** the user edits the beats, beat value, compound signature, display options or Apply To, **Then** the score does not change.
2. **Given** the user has made changes in the dialog, **When** they click Cancel (or dismiss the dialog), **Then** the score is unchanged and no undo step is recorded.
3. **Given** the user has made changes, **When** they click OK, **Then** all of the changes are applied together as one undo step, and a single Undo restores the score to what it was before the dialog opened, including removing any measures that were added.
4. **Given** the user has changed nothing, **When** they click OK, **Then** the score is unchanged and no undo step is recorded.

---

### User Story 3 - Keep only what fits, as it is today (Priority: P2)

Sometimes the composer does want the old behavior: the music is a sketch, or they want to trim a pasted passage to a shorter meter. Unticking **Preserve music** applies the new time signature to the selected measures in place, keeping as much of each measure's music as fits and dropping the rest, with no measures added.

**Why this priority**: It is the existing behavior and must remain available, but it is not the new value.

**Independent Test**: With two 4/4 measures of quarter notes, change to 3/4 with Preserve music unticked and click OK. There are still two measures, each holding three quarter notes; the fourth quarter of each measure is gone.

**Acceptance Scenarios**:

1. **Given** Preserve music is unticked, **When** the user clicks OK, **Then** each selected measure keeps the music that fits in the new time signature, in order, and the music that does not fit is removed, exactly as time signature changes behave today.
2. **Given** Preserve music is unticked, **When** the user clicks OK, **Then** no measures are added or removed.
3. **Given** Preserve music is unticked and the new meter is longer than the old, **When** the user clicks OK, **Then** the remaining time in each measure is filled with rests, as today.

---

### User Story 4 - Choose which measures change (Priority: P2)

The dialog's **Apply To** choice (Selected Measures, Remaining Measures, Score) decides which measures change, and therefore which music is preserved. Preserve music works on whichever set of measures is chosen, and what follows that set in the score is left as it was, moved later if measures were added.

**Why this priority**: Without this, Preserve music would only be usable for whole-score changes, and a meter change in the middle of a piece is common.

**Independent Test**: In a six-measure score of 4/4, select measures 3 and 4, choose Selected Measures, change to 3/4 with Preserve music ticked, and click OK. Measures 1 and 2 and the old measures 5 and 6 are unchanged; measures 3 onward are re-barred, with a new measure inserted so that all of the old measures 3 and 4 music is kept, and the old measures 5 and 6 now follow.

**Acceptance Scenarios**:

1. **Given** Selected Measures, **When** the change is applied with Preserve music ticked, **Then** only the selected measures are re-barred; measures before them are untouched and measures after them keep their own time signature and music, now later in the score if measures were added.
2. **Given** Remaining Measures (from the selected measure to the end), **When** applied, **Then** the music from that measure to the end of the score is re-barred and any extra measures are added at the end.
3. **Given** Score, **When** applied, **Then** the whole score is re-barred.
4. **Given** the user switches Apply To in the dialog, **When** they click OK, **Then** the choice in effect at OK is the one applied.

---

### Edge Cases

- **Meter holds the same time per measure** (4/4 to 2/2, 3/4 to 6/8): the music already fits, so nothing is lost and no measures are added with Preserve music either ticked or unticked; the notes keep their order and durations.
- **A new meter that needs fewer measures**: measures are never removed. The measures that are not needed end up empty (rests), so no music is removed by accident.
- **Notes crossing a new bar line**: split into tied notes (see Story 1); a rest that crosses a bar line is split into rests.
- **Tuplets that would cross a new bar line**: a tuplet is kept whole where it can be. If it cannot be kept whole, the music in it is still preserved, in duration, in tied notes or rests, and nothing is dropped.
- **Ties across the old bar lines**: ties between notes that are re-barred stay with the notes. Ties split by the new bar lines are added as needed.
- **Pickup (partial) measures**: the music in a pickup measure is preserved at its actual duration, in the same way as any other music.
- **Grace notes**: kept with their notes.
- **Measure markings** (tempo, key signature, clef changes, repeats, endings, barlines, text): measures that exist already keep theirs. A measure added to hold the overflow takes the settings of the last measure of the selected set, except that repeat, ending and double-bar markings stay with the last measure of the set.
- **Other staves have different music or different voices**: each staff and voice is re-barred independently; all staves end up with the same number of measures.
- **A score with a single measure selected** (the common case): the music is re-barred from that measure and the extra measures are added immediately after it.
- **Changing only display options** (Use Symbol, Display Time Signature, the alternate display string): there is no change to durations, so no music is moved and no measures are added, regardless of the Preserve music box.
- **Music that does not fit even after adding measures**: cannot happen with Preserve music ticked; the number of measures added is enough to hold all of the music.
- **Compound (alternating) time signatures** (such as 3/4+2/4): the measures alternate between the parts, 3/4 then 2/4 then 3/4 and so on. Preserve music fills each measure to its own length in that pattern, starting with the first part at the first re-barred measure, and adds measures until all of the music fits.
- **Very large selections**: the change is still applied once, on OK, and the user sees one screen update.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Time Signature dialog MUST NOT change the score while it is open. Editing the time signature, the compound option, the display options, the alternate display string, Apply To or Preserve music MUST have no effect on the score until OK is clicked.
- **FR-002**: Clicking Cancel, or closing the dialog without OK, MUST leave the score, the selection and the undo history exactly as they were before the dialog was opened.
- **FR-003**: Clicking OK MUST apply all of the dialog's choices together as one undo step. A single Undo MUST restore the score to its state before the dialog opened, including removing every measure that was added.
- **FR-004**: Clicking OK when nothing in the dialog was changed MUST leave the score unchanged and MUST NOT record an undo step.
- **FR-005**: The dialog MUST have a **Preserve music** checkbox, ticked each time the dialog is opened.
- **FR-006**: With Preserve music ticked, the music of the selected measures (as set by Apply To) MUST be kept, in the same order with the same durations, pitches and markings, in measures of the new time signature, with no music lost.
- **FR-007**: With Preserve music ticked, if the new time signature would represent less total time than the music in the selected measures, the system MUST add as many measures as needed so that the total time of the new measures is at least the total time of the music being preserved. The added measures MUST be placed directly after the last re-barred measure, before the measures that followed the selected set.
- **FR-008**: With Preserve music ticked, the system MUST NOT remove measures. If fewer measures are needed, the unneeded ones MUST remain, filled with rests.
- **FR-009**: With Preserve music ticked, if the last re-barred measure is not full, the rest of it MUST be filled with rests.
- **FR-010**: With Preserve music ticked, a note or rest that crosses a new bar line MUST be split at the bar line. Split notes MUST be tied so that they sound the same; split rests MUST add up to the original duration.
- **FR-011**: With Preserve music ticked, markings attached to notes (dynamics, lyrics, annotations, chords, articulations, ornaments, grace notes, arpeggios, microtones) MUST stay with the notes they were on. For a note split by a bar line, the markings stay with the first part.
- **FR-012**: With Preserve music ticked, every voice in the selected measures MUST be preserved separately, in its own voice.
- **FR-013**: With Preserve music ticked in a score with several staves, every staff MUST be re-barred with its own music and every staff MUST end up with the same number of measures, so the staves stay aligned.
- **FR-014**: With Preserve music unticked, the time signature MUST be applied to the selected measures in place, keeping the music that fits in each measure and removing the rest, exactly as time signature changes behave before this feature. No measures MUST be added.
- **FR-015**: The Apply To choice (Selected Measures, Remaining Measures, Score) MUST decide which measures are changed, with both settings of Preserve music. The choice in effect when OK is clicked is the one used.
- **FR-016**: Measures before the selected set, and measures after it, MUST keep their own time signatures, music and markings. Measures after the set MUST be moved later by the number of measures added.
- **FR-017**: Slurs, ties, hairpins, text and other things that join music across measures in the selected set MUST stay attached to the same notes after the change, wherever those notes end up.
- **FR-018**: A change to the display options only (Use Symbol, Display Time Signature, alternate display string) MUST not move any music or add measures.
- **FR-019**: Where the new time signature has the same total time per measure as the old, the music MUST be unchanged, whether Preserve music is ticked or not.
- **FR-020**: Scores saved before this change MUST open and behave as before, and scores that have been changed with Preserve music MUST save and reload with the same music.

### Key Entities

- **Selected measures**: The set of measures that the time signature change applies to, found from the selection and the Apply To choice. This is the "original set" whose music is preserved.
- **Preserved music**: Everything in the selected measures, in every staff and voice: notes, rests, tuplets, ties, grace notes and the markings attached to notes.
- **Re-barred measures**: The measures of the new time signature that hold the preserved music. These are the original measures with the new signature, plus any measures added to hold the overflow.
- **Preserve music option**: A yes/no choice in the dialog, on by default, that selects between re-barring all of the music (adding measures if needed) and keeping only what fits in each measure.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With Preserve music ticked, changing the time signature never loses sounding time: the total duration of the music in the selected measures is the same before and after in 100% of tested cases (4/4 to 3/4, 3/4 to 4/4, 4/4 to 6/8, 4/4 to 5/8, 3/4 to 7/8, alternating meters such as 3/4+2/4, pickup measures).
- **SC-002**: In 100% of tested cases, the sequence of pitches and rhythms read from the re-barred measures, with tied notes joined, is the same as the sequence before the change, for every staff and voice.
- **SC-003**: For the example of two 4/4 measures changed to 3/4, the result is three 3/4 measures, and a user can get this result in a single open-and-confirm of the dialog (one OK click, one Undo to reverse).
- **SC-004**: While the dialog is open, the score, measure count and undo history are unchanged in 100% of the tested interactions, and after Cancel they are identical to before the dialog opened.
- **SC-005**: With Preserve music unticked, the result of every tested time signature change matches the result from before this feature, measure for measure.
- **SC-006**: One Undo after OK restores the score to exactly its content before the change in 100% of tested cases, including score-wide changes that added measures to several staves.
- **SC-007**: Clicking OK on a time signature change across a score of 100 measures completes, and the score is redrawn, in under 2 seconds.

## Assumptions

- The current time signature dialog applies the new time signature to the measure with that index in *every* staff of the score; this stays true, and so Preserve music re-bars and adds measures in every staff.
- Because the change is not committed until OK, the dialog does not preview the new meter in the score while it is open. Any preview inside the dialog itself is out of scope.
- The existing behavior (keep what fits, fill the rest with rests) is the behavior of the unticked box, and it is not changed.
- The Preserve music box is not remembered between uses of the dialog; it is ticked each time, as the request says "checked by default".
- Preserve music never removes measures. Where re-barring would leave fewer measures than the selected set, the extra measures stay, filled with rests. This is the safest choice for the user's music and matches "no less time represented".
- "Original set of selected measures" means the measures chosen by the Selected Measures, Remaining Measures or Score option at the time OK is clicked, for all staves.
- Measures added by Preserve music take their settings (key signature, clef, tempo, etc.) from the last measure of the re-barred set, which is the most natural continuation of the music.
- Multi-measure rests and measures that are part of one at the edit point are treated as ordinary measures for this feature.
- Scope is the Time Signature dialog and the time signature change it performs. Other ways that measures are created or changed (Insert Measures, Fill Measures, Paste) are not changed.
