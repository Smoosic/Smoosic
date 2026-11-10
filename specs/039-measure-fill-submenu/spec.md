# Feature Specification: Measure Fill Submenu

**Feature Branch**: `039-measure-fill-submenu`

**Created**: 2026-11-09

**Status**: Draft

**Input**: User description: "create a measure fill submenu. It has 3 options: whole rest, which fills the measure with the largest rest possible for that measure (which generally appears as a whole rest). For some odd-times like 5/8 it will not be possible with a single rest, we just get as close as we can. Second option is 'beats'. This will fill either 1/4 notes (even meter time, 3/4) or dotted 1/4 rests for triple time. Third option is eighth rests. This puts eighth rests until the measure won't fit any more. These are all destructive and clear out any notes/voices in the measures."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clear a measure to a whole rest (Priority: P1)

A user has a measure full of notes that they want to throw away and start again, or a measure that should simply be silent. They select the measure, open the Measure menu, choose the fill submenu, and choose **Whole Rest**. The measure is emptied and holds the largest rest that fits. In 4/4 that is a whole rest. In a meter such as 3/4 or 6/8 it is the single rest that fills the measure (a dotted half rest). In a meter such as 5/8, where no single rest is long enough, the largest rest that fits is used first and the rest of the measure is filled with the next largest, as close to one rest as can be had. Dotted and double-dotted rests count, so 7/8 is a single double-dotted half rest.

**Why this priority**: Resting a whole measure is the most common reason to clear it, and it has no equivalent today that works for every meter.

**Independent Test**: Select a measure of notes in 4/4 and choose Whole Rest. Confirm it now holds one whole rest and no notes. Repeat in 3/4, 6/8 and 5/8 and compare with the table below.

**Acceptance Scenarios**:

1. **Given** a 4/4 measure with notes, **When** the user chooses Whole Rest, **Then** the measure holds exactly one whole rest.
2. **Given** a 3/4 measure with notes, **When** the user chooses Whole Rest, **Then** the measure holds exactly one dotted half rest.
3. **Given** a 5/8 measure with notes, **When** the user chooses Whole Rest, **Then** the measure holds a half rest followed by an eighth rest, and is full.
4. **Given** a measure that already holds only a whole rest, **When** the user chooses Whole Rest, **Then** the measure is unchanged.

---

### User Story 2 - Fill a measure with beat rests (Priority: P1)

A user wants a measure of rests, one for each beat, so they can see where to write. They choose **Beats**. In an even meter such as 4/4 or 2/4, and in 3/4, the measure is filled with quarter rests. In a compound ("triple") meter such as 6/8, 9/8 or 12/8, it is filled with dotted quarter rests, one for each beat.

**Why this priority**: A measure of beat rests is the usual starting point for entering music, and the right beat is different for 4/4 and for 6/8.

**Independent Test**: Choose Beats on a measure in 4/4, 3/4, 6/8 and 12/8 and confirm four quarter rests, three quarter rests, two dotted quarter rests and four dotted quarter rests.

**Acceptance Scenarios**:

1. **Given** a 4/4 measure, **When** the user chooses Beats, **Then** the measure holds four quarter rests.
2. **Given** a 3/4 measure, **When** the user chooses Beats, **Then** the measure holds three quarter rests.
3. **Given** a 6/8 measure, **When** the user chooses Beats, **Then** the measure holds two dotted quarter rests.
4. **Given** a 12/8 measure, **When** the user chooses Beats, **Then** the measure holds four dotted quarter rests.
5. **Given** a 5/8 measure, **When** the user chooses Beats, **Then** the measure holds two quarter rests and an eighth rest, and is full.

---

### User Story 3 - Fill a measure with eighth rests (Priority: P2)

A user who is about to enter a measure of eighth notes chooses **Eighth Rests**. The measure is filled with eighth rests, one after the other, for as long as another eighth rest fits. A 4/4 measure holds eight eighth rests, and a 6/8 measure holds six.

**Why this priority**: It is useful for eighth-note passages, but it is a smaller group of users than the first two choices.

**Independent Test**: Choose Eighth Rests on measures in 4/4, 3/4, 6/8, 5/8 and 5/16 and confirm eight, six, six, five and two (plus one sixteenth rest) rests.

**Acceptance Scenarios**:

1. **Given** a 4/4 measure, **When** the user chooses Eighth Rests, **Then** the measure holds eight eighth rests.
2. **Given** a 5/8 measure, **When** the user chooses Eighth Rests, **Then** the measure holds five eighth rests.
3. **Given** a 5/16 measure, **When** the user chooses Eighth Rests, **Then** the measure holds two eighth rests followed by a sixteenth rest, so the measure is full.

---

### User Story 4 - Fill several measures at once, and undo it (Priority: P2)

A user selects a run of measures, in one or more staves, and chooses one of the fill options. Every selected measure is emptied and filled. Notes in every voice are removed, so each measure ends up with a single voice of rests. If the user did not mean to lose the music, one Undo restores every measure.

**Why this priority**: The choices are destructive, so being able to apply them to many measures at once is useful, and being able to undo them is necessary for safety.

**Independent Test**: Select measures 2 to 5 of a two-staff score and choose Beats. Confirm measures 2 to 5 of the selected staves are rests and nothing else changed. Choose Undo once and confirm the notes are back.

**Acceptance Scenarios**:

1. **Given** measures 2 to 5 of one staff are selected, **When** the user chooses any fill option, **Then** those measures are filled and no other measure or staff changes.
2. **Given** a measure with two voices of notes, **When** the user chooses any fill option, **Then** the measure holds one voice, containing only rests.
3. **Given** a fill has just been applied, **When** the user chooses Undo once, **Then** all the filled measures return to what they were, including every voice.
4. **Given** measures in 4/4 and 6/8 are selected together, **When** the user chooses Beats, **Then** each measure is filled according to its own meter.

---

### Edge Cases

- A measure with a time signature that changes partway through the selection is filled by its own time signature, not the first measure's.
- A pickup (partial) measure is filled to its own length where the time signature allows, otherwise by the same rules as a full measure. [see Assumptions]
- Notes with lyrics, chords, dynamics, articulations, ornaments, tuplets or other attachments are all removed with the notes.
- Slurs, ties, hairpins and other markings that run between notes are removed if either end is in a filled measure and that end is removed.
- The measure's own settings are kept: time signature, key signature, clef, tempo, barlines, endings, repeat symbols, rehearsal marks, measure text and formatting, and any beam grouping.
- Choosing a fill on a measure that is part of a multimeasure rest, or on a measure that is already all rests, still works and gives the same result as any other measure.
- A selection that contains no measures (nothing selected) leaves the choices unavailable, with no change to the score.
- Meters with an odd top number over 8 or 16 (5/8, 7/8, 5/16) cannot be filled with whole beats alone, so the last rest is the largest one that fits; the measure is always completely filled and never left short.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Measure menu MUST have a submenu for filling measures with rests, with three choices: **Whole Rest**, **Beats** and **Eighth Rests**.
- **FR-002**: The choices MUST apply to every measure covered by the current selection, in each selected staff.
- **FR-003**: Each choice MUST remove all notes from the measure, in every voice, and leave one voice that holds only rests and fills the measure.
- **FR-004**: **Whole Rest** MUST fill the measure with the largest rest that fits. If that does not fill the measure, it MUST add the largest rest that fits in what is left, and so on until the measure is full. Every rest value the application can show is available for this, including dotted and double-dotted rests.
- **FR-005**: **Whole Rest** MUST give a single rest in 4/4 (whole), 2/4 (half), 3/4 (dotted half), 6/8 (dotted half), 7/8 (double-dotted half) and 12/8 (dotted whole), a half rest and an eighth rest in 5/8, and a whole rest and an eighth rest in 9/8.
- **FR-006**: **Beats** MUST fill the measure with quarter rests in meters whose lower number is 4 (including 3/4), and with dotted quarter rests in compound meters whose lower number is 8 and whose top number is a multiple of 3 (3/8, 6/8, 9/8, 12/8). For other meters the beat is described in the Assumptions.
- **FR-007**: **Beats** in a meter that cannot be divided into whole beats (for example 5/8 or 7/8) MUST fill the measure with as many beat rests as fit, followed by the largest rest that fits in the remainder, so the measure is full.
- **FR-008**: **Eighth Rests** MUST fill the measure with eighth rests for as long as another eighth rest fits. If less than an eighth of the measure is left (for example 5/16), the largest rest that fits in the remainder MUST be added so that the measure is full.
- **FR-009**: Each measure MUST be filled according to its own time signature, including when several meters are selected together.
- **FR-010**: Attachments on the removed notes MUST be removed with them, and markings that run between notes MUST NOT be left pointing at removed notes.
- **FR-011**: The measure's own settings (time signature, key signature, clef, tempo, barlines, endings, repeat symbols, rehearsal marks, text, formatting and beam grouping) MUST be kept.
- **FR-012**: The filled measures MUST be redrawn without the user taking any other action.
- **FR-013**: A fill MUST be undoable as a single step that restores every filled measure, including all its voices.
- **FR-014**: The fill choices MUST NOT be offered when nothing is selected.
- **FR-015**: Scores saved with filled measures MUST save and reopen normally, and scores saved before this feature MUST be unaffected.

### Examples

| Time signature | Whole Rest | Beats | Eighth Rests |
|----------------|------------|-------|--------------|
| 4/4 | whole rest | 4 quarter rests | 8 eighth rests |
| 2/4 | half rest | 2 quarter rests | 4 eighth rests |
| 3/4 | dotted half rest | 3 quarter rests | 6 eighth rests |
| 6/8 | dotted half rest | 2 dotted quarter rests | 6 eighth rests |
| 9/8 | whole rest and eighth rest | 3 dotted quarter rests | 9 eighth rests |
| 12/8 | dotted whole rest | 4 dotted quarter rests | 12 eighth rests |
| 5/8 | half rest and eighth rest | 2 quarter rests and an eighth rest | 5 eighth rests |
| 7/8 | double-dotted half rest | 3 quarter rests and an eighth rest | 7 eighth rests |
| 5/16 | quarter rest and sixteenth rest | 2 eighth rests and a sixteenth rest | 2 eighth rests and a sixteenth rest |

### Key Entities *(include if feature involves data)*

- **Measure**: Is emptied and refilled with rests. Keeps its own settings (time signature, key, tempo, barlines, and so on).
- **Rest**: A silent note of a given duration. A filled measure holds only rests, in one voice, adding up to the full length of the measure.
- **Fill choice**: One of Whole Rest, Beats or Eighth Rests. It decides which rests are used and does not persist anywhere after it is applied.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can clear a measure to rests with three actions or fewer: select it, open the fill submenu, choose an option.
- **SC-002**: For the meters in the examples table, 100% of fills give exactly the rests listed, and the rests add up to the full length of the measure.
- **SC-003**: A fill applied to any number of selected measures can be reversed with a single Undo, restoring 100% of the notes in every voice.
- **SC-004**: After any fill, 0 notes remain in the filled measures, and 0 markings are left attached to removed notes.
- **SC-005**: Scores saved before this feature open with identical content, and a score containing filled measures reopens with the same rests.

## Assumptions

- The submenu lives in the Measure menu, alongside the other commands that change whole measures. It is named for filling a measure with rests (for example "Fill Measures").
- "Triple time" for the Beats choice means a compound meter whose lower number is 8 and whose top number is a multiple of 3 (6/8, 9/8, 12/8, and also 3/8). 3/4 is treated as an even meter for this purpose, as the request says, so it gets quarter rests.
- Other meters with a lower number of 8 (such as 2/8, 4/8, 5/8, 7/8) get quarter rests, with a final eighth rest when the number of eighths is odd. The same idea applies one level down for a lower number of 16: compound meters whose top number is a multiple of 3 (6/16, 9/16) get dotted eighth rests, and other meters get eighth rests with a final sixteenth rest when needed. For a lower number of 2 (such as 2/2 or 3/2) the beat is a half rest.
- "Largest rest" means the longest single rest the application can show, so a measure such as 9/8 gets a whole rest and an eighth rest, not a dotted half and a dotted quarter. This is the rule in the request applied as written; a different rule for compound meters can be added later if wanted.
- When a fill cannot be made of whole beats, the remainder is always filled with the largest rest that fits, so the measure is never left short. This differs slightly from "until the measure won't fit any more" in the request, which would leave a gap in a measure such as 5/16; a short measure would be treated as a pickup, which was not intended.
- The fill applies to the staves and measures in the current selection only, as other measure commands do.
- Pickup measures keep their own length: they are filled to the length they have now, using the same rules.
- "Whole Rest" is the name of the choice even where the result is not literally a whole rest (3/4 gives a dotted half rest), because the request describes it as the largest rest for the measure.
- Multimeasure rest settings, "force rest" measure formatting and other display options are not changed by this feature.
- Localization of the new menu text follows the existing practice for menus.
