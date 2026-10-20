# Feature Specification: Select Voice

**Feature Branch**: `031-select-voice`

**Created**: 2026-10-20

**Status**: Draft

**Input**: User description: "In the edit menu, create a 'Select Voice' submenu. It allows you to select a specific notes from a specific voice, based on the currently selected measures. If there is only a single voice in all selected measures, there would be no sub menu choices, and if the user selects a voice and there are no notes in the set of selected measures, the selection should not change. All notes in the measures that currently have a selection should be selected, since different voices can have different numbers of notes that might overlap in different ways. This allows us to do things like changing the pitch or duration of many notes, but only in a specific voice."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select every note of one voice in the chosen measures (Priority: P1)

A composer has a passage with two or more voices in the same staff, for example a melody in voice 1 and a bass line in voice 2. They select the measures they want to work on, open Edit > Select Voice and choose Voice 2. Every note in voice 2 of those measures is now selected, and the notes of the other voices are not. They can then change the pitch, duration or any other property of just those notes in one step.

**Why this priority**: This is the whole point of the feature. Today a selection in a multi-voice passage picks up the notes of whichever voice happens to be on top, so changing "all the notes in the bass line" means selecting them one at a time or accepting changes to the other voices as well.

**Independent Test**: Make four measures with two voices. Select the four measures, choose Edit > Select Voice > Voice 2, then transpose the selection up an octave. Only the voice 2 notes change; voice 1 stays as it was.

**Acceptance Scenarios**:

1. **Given** a selection that touches several measures that each have voices 1 and 2, **When** the user chooses Select Voice > Voice 2, **Then** every note of voice 2 in all of those measures is selected, and no note of any other voice is.
2. **Given** a selection of only part of a measure (for example, a single note), **When** the user chooses Select Voice > Voice 2, **Then** all the notes of voice 2 in that whole measure are selected, not only the ones that line up with the original selection.
3. **Given** voices that have different numbers of notes in a measure (for example, four quarter notes in voice 1 and one whole note in voice 2), **When** the user selects either voice, **Then** all of that voice's notes in the measure are selected, whatever their positions relative to the other voice.
4. **Given** a selection spanning more than one staff, **When** the user chooses Select Voice > Voice 1, **Then** the voice 1 notes of the selected measures in each of those staves are selected.
5. **Given** the new selection, **When** the user applies an edit that works on selected notes (change pitch, duration, accidental, articulation, and so on), **Then** the edit applies to the selected voice's notes only.

---

### User Story 2 - The menu only offers choices that make sense (Priority: P1)

The Select Voice choices depend on the selection. Only voices that actually exist in the selected measures are listed. If the selected measures all have only a single voice, there is nothing to choose between, so Select Voice offers no choices (it doesn't appear). If the user picks a voice that turns out to have no notes in the selected measures, nothing happens and the current selection is left exactly as it was.

**Why this priority**: Without this, the menu would offer actions that do nothing, or that quietly destroy the user's current selection. A small rule, but it decides whether the feature feels trustworthy.

**Independent Test**: Select a measure with one voice and open the Edit menu: no Select Voice entry (or an empty one). Select a measure with voices 1 and 2: choices are Voice 1 and Voice 2. Select measures 1 to 4 where only measure 4 has voice 3: Voice 3 is offered, and choosing it selects voice 3 of measure 4 only.

**Acceptance Scenarios**:

1. **Given** every selected measure has exactly one voice, **When** the user opens the Edit menu, **Then** Select Voice offers no choices.
2. **Given** the selected measures contain voices 1 and 2, **When** the user opens Select Voice, **Then** it lists Voice 1 and Voice 2 only.
3. **Given** voice 3 exists in only some of the selected measures, **When** the user opens Select Voice and chooses Voice 3, **Then** the voice 3 notes in the measures that have them are selected, and the measures without voice 3 contribute nothing.
4. **Given** the user chooses a voice that has no notes in any of the selected measures, **When** the choice is made, **Then** the selection does not change at all.
5. **Given** nothing is selected, **When** the user opens the Edit menu, **Then** Select Voice offers no choices.

---

### User Story 3 - Selecting a voice never changes the music (Priority: P2)

Select Voice only changes which notes are selected. It never adds, removes, moves or edits a note, never creates a voice, and does not add an entry to the undo history. This separates it from the existing Voices menu, which makes a voice the one the user is entering notes into and can create a new voice.

**Why this priority**: It keeps the action safe to use freely and keeps Undo meaning "undo my last edit", not "undo my last selection". It is lower priority only because it is a property of the feature rather than a step of the user's workflow.

**Independent Test**: Select two measures, choose Select Voice > Voice 2 several times and alternate with Voice 1. The score is unchanged, and Undo does not step through the selections.

**Acceptance Scenarios**:

1. **Given** any selection, **When** the user chooses a voice from Select Voice, **Then** no note, measure or voice in the score is added, removed or modified.
2. **Given** the user has just used Select Voice, **When** the user chooses Undo, **Then** the undo applies to the last edit made before it, not to the selection.
3. **Given** a measure that has no voice 2, **When** the user looks at the Select Voice choices, **Then** there is no choice that would create a voice 2.

---

### Edge Cases

- What happens when the selected measures contain different numbers of voices (one has two, another has four)? The choices are the voices that exist in at least one selected measure; a chosen voice selects its notes only in the measures that have it.
- What happens when the chosen voice contains only rests in the selected measures? Rests count as notes of the voice and are selected, since they are part of the voice and can be edited like any other.
- What happens when the selection is a range of measures that includes measures from several staves? Each staff's selected measures are handled the same way; the chosen voice is selected in each.
- What happens when the voice contains a tuplet or a note that crosses a beam? All notes of the voice in the measure are selected, including every note of a tuplet.
- What happens when the user selects a voice while a part is being displayed? Only the voices of the displayed measures are offered and selected.
- What happens right after the voice is selected and the user presses an arrow key? Navigation continues from the new selection, as after any selection.
- What happens when the user chooses a voice that is already the only one selected? The selection is rebuilt to be all of that voice's notes in the selected measures (which may select more notes than before) and otherwise remains the same.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Edit menu MUST contain a Select Voice submenu.
- **FR-002**: The Select Voice submenu MUST offer one choice for each voice (1 to 4) that exists in at least one measure that currently has a selected note, and no other choices.
- **FR-003**: When every measure that currently has a selected note has only a single voice, or when nothing is selected, Select Voice MUST offer no choices.
- **FR-004**: Choosing a voice MUST replace the current selection with all the notes (including rests) of that voice in all of the measures that currently have a selection, on every staff that has a selection.
- **FR-005**: The new selection MUST include every note of the chosen voice in each of those measures, regardless of which notes were selected before, and regardless of how the voice's notes line up with the other voices' notes.
- **FR-006**: The new selection MUST NOT include any note of a voice other than the chosen one.
- **FR-007**: A measure that does not have the chosen voice MUST contribute no notes and MUST NOT have the voice created.
- **FR-008**: If the chosen voice has no notes in any of the selected measures, the selection MUST NOT change.
- **FR-009**: Choosing a voice MUST NOT modify the score in any way and MUST NOT create an undo entry.
- **FR-010**: After a voice is selected, selection-based edits (pitch, duration, accidentals and so on) MUST affect only the notes of that voice, and the selection MUST be shown on screen as for any other selection.
- **FR-011**: The existing Voices menu MUST be unchanged.

### Key Entities

- **Voice**: One of up to four independent lines of notes within the same staff, in each measure, numbered 1 to 4.
- **Selected measures**: The measures that contain at least one currently selected note, on each staff that has a selection. The new selection is built from the whole of these measures.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After choosing Select Voice > Voice N, 100% of the notes of voice N in the selected measures are selected and 0% of the notes of other voices are.
- **SC-002**: A user can change the pitch of every note in one voice across a passage in two actions after selecting the measures (choose Select Voice > Voice N, then apply the pitch change), without touching the other voices.
- **SC-003**: Choosing a voice with no notes in the selected measures leaves the selection identical in 100% of cases.
- **SC-004**: Using Select Voice any number of times leaves the score and the undo history unchanged, verified by comparing the score before and after.
- **SC-005**: The Select Voice choices never include a voice that does not exist in any selected measure, and never appear when only a single voice is present.

## Assumptions

- "Currently selected measures" means the measures that contain at least one selected note, as the existing measure-level actions (such as swapping voices) define it; the whole of each such measure takes part.
- Rests are notes of a voice for this purpose, so a voice made of rests can be selected.
- Select Voice only selects; the existing Voices menu remains the way to make a voice the active one for entering notes and to create new voices. After a voice is selected, the application treats that voice as the one being worked on in the same way it does whenever the user selects notes of that voice by other means.
- The choices are labelled "Voice 1" to "Voice 4", matching the existing Voices menu.
- Existing keyboard shortcuts are unchanged and none is added here.
- The selection result is a normal selection, so highlighting, playback of the selection, and scrolling behave as for any other selection.
