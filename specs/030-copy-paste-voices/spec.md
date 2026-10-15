# Feature Specification: Copy and Paste Voices

**Feature Branch**: `030-copy-paste-voices`

**Created**: 2026-10-15

**Status**: Draft

**Input**: User description: "Currently the edit/copy menu option calls copypaste.ts setSelections. This only copies notes in the current voice. Create a 'Copy Voices' submenu of Edit menu. It allows you to copy any single voice or all the voices (up to 4). Copying voices happens on measure boundaries, so if any partial measure is selected, the selection is extended to that whole measure. When pasting, add a voices submenu (Paste Voice). You can copy into an empty voice (voice 2 of there is only 1 voice), or an existing voice. Paste Voice menu option 'All' will paste all copied voices into the destination. Pastes always align on measure boundaries, if a voice doesn't exist on a paste target measure, it is first created for that measure."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Copy a whole passage with all its voices (Priority: P1)

A composer has written a passage with two or more voices in the same staff (for example, a melody with a bass line in voice 2). They select part of the passage, open the Edit menu, choose Copy Voices, then All, and later choose Paste Voice, then All at another place in the score. The whole passage, with every voice, appears there, starting at the beginning of the chosen measure.

**Why this priority**: Today a copy takes only the notes of one voice, so multi-voice music cannot be moved or repeated without copying and pasting each voice by hand and recreating the other voices first. This is the main reason for the feature.

**Independent Test**: Make a 4-measure passage with 2 voices. Select a few notes inside measures 1 to 4, choose Edit > Copy Voices > All. Click a note in measure 9 and choose Edit > Paste Voice > All. Measures 9 to 12 should now contain both voices, identical to measures 1 to 4.

**Acceptance Scenarios**:

1. **Given** a selection covering part of one measure and part of the next, in a staff with two voices, **When** the user chooses Copy Voices > All, **Then** both whole measures are copied, with all their voices, even though only part of each was selected.
2. **Given** copied voices and a destination measure that has only voice 1, **When** the user chooses Paste Voice > All, **Then** the missing voices are created on each destination measure, and every copied voice is pasted into the voice of the same number.
3. **Given** copied voices and a destination in which some measures already have more voices than others, **When** the user pastes with All, **Then** every pasted measure ends up with the copied voices, and any voices not copied are left as they were.
4. **Given** a paste that has been done, **When** the user chooses Undo once, **Then** the whole paste is undone together, including any voices that were created.

---

### User Story 2 - Copy one voice and put it in a chosen voice (Priority: P1)

A composer wants only one line from a passage, such as voice 2, and wants to place it into a different voice, possibly a new one. They choose Copy Voices and pick the voice to copy. At the destination they open Paste Voice and pick which voice to paste into: an existing voice (replacing what it holds in those measures) or the next empty voice.

**Why this priority**: This is the other half of the request, and it allows moving a line between voices, for example copying a melody from voice 1 into a new voice 2 to harmonize it.

**Independent Test**: In a staff with a single voice, select a measure, choose Edit > Copy Voices > Voice 1, then click a different measure and choose Edit > Paste Voice > Voice 2. The measure now has a second voice containing the copied notes, and voice 1 is unchanged.

**Acceptance Scenarios**:

1. **Given** a staff with voices 1 and 2, **When** the user opens Copy Voices, **Then** the menu offers Voice 1, Voice 2 and All; and Voice 3 and 4 only when the selection contains them.
2. **Given** copied music from a single voice, **When** the user opens Paste Voice, **Then** the menu offers each existing voice at the destination and a New Voice choice (a new voice 2 when only voice 1 exists), but no New Voice choice when the destination already has four voices, and never a fifth voice. **Given** copied music from all voices, **Then** the menu offers only All.
3. **Given** a single copied voice, **When** the user pastes it into an existing voice, **Then** the contents of that voice on the destination measures are replaced by the copied notes, and other voices on those measures are unchanged.
4. **Given** a single copied voice, **When** the user pastes it into the next empty voice, **Then** that voice is created on every destination measure it is pasted into, filled with the copied notes.
5. **Given** a paste of a single voice, **When** the copy source was voice 2 but the destination is voice 1, **Then** the notes go to voice 1 (the voice chosen at paste time, not the voice it was copied from).

---

### User Story 3 - Whole measures only, and sensible menu choices (Priority: P2)

Copying and pasting voices always works on whole measures. The user can select any notes (even one note); the copy covers the entire measure(s) they touch. The menus show only choices that make sense for the current selection and clipboard, so the user can't end up with a half-measure voice or an impossible paste.

**Why this priority**: It keeps voices aligned and removes the need to think about where inside a measure a voice starts. It matters, but the feature is usable without the menu refinements.

**Independent Test**: Select a single note in the middle of a measure and choose Copy Voices > Voice 1. Paste Voice > Voice 1 on another measure: the whole measure's content appears, not just the one note. Open Paste Voice before anything has been copied: it offers nothing.

**Acceptance Scenarios**:

1. **Given** a selection that starts or ends in the middle of a measure, **When** the user copies voices, **Then** the copy begins at the start of the first selected measure and ends at the end of the last selected measure.
2. **Given** a paste destination that is a note in the middle of a measure, **When** the user pastes voices, **Then** the paste starts at the beginning of that measure.
3. **Given** nothing has been copied with Copy Voices, **When** the user opens Paste Voice, **Then** no paste choices are offered (or they are shown as unavailable).
4. **Given** the existing Copy and Paste choices, **When** the user uses them, **Then** they behave exactly as before, copying and pasting the notes of the current voice from the exact notes selected.

---

### Edge Cases

- What happens when the pasted measures would run past the last measure of the score? The paste is limited to the measures that exist; the extra copied measures are ignored.
- What happens when a copied voice has no content on some of the copied measures, because that voice only exists on part of the passage? Those measures are copied as empty (rests), so a voice pasted over existing music in those measures replaces it with rests.
- What happens when the destination measure has a different time signature from the source measure? The paste follows the same rules the existing paste uses when music doesn't fit a measure (the overflow continues into the following measure).
- What happens when the destination staff or measure doesn't exist, for example when nothing is selected? Paste Voice does nothing and offers no choices.
- What happens when the selection spans several staves? Each staff's selected measures are copied, and a paste places them on the same number of staves starting at the destination staff, as the existing copy and paste does.
- What happens when a copied voice contains tuplets, ties, lyrics, chords, or markings that apply to notes (slurs, dynamics)? Because whole measures are copied, whole tuplets are always included, and the music keeps whatever the existing copy and paste preserves.
- What happens when the user already has four voices on the destination measure and pastes All with four copied voices? All four destination voices are replaced; no fifth voice is created.
- What happens when a paste is made into a different clef or transposing instrument? Pitches are adjusted the same way as the existing paste.
- What happens when the user pastes the same copy more than once, or at several places? Each paste works the same; the copy remains available until the next copy.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Edit menu MUST contain a Copy Voices submenu and a Paste Voice submenu, in addition to the existing Copy and Paste choices, which MUST be unchanged.
- **FR-002**: The Copy Voices submenu MUST offer one choice per voice present in the selected measures (up to four), and an All choice when more than one voice is present.
- **FR-003**: Copy Voices MUST copy whole measures: from the start of the first selected measure to the end of the last selected measure, regardless of how much of those measures was selected.
- **FR-004**: Copy Voices > a single voice MUST copy only that voice's music; Copy Voices > All MUST copy every voice (up to four) present in the selected measures.
- **FR-005**: A copied voice that does not exist on some of the selected measures MUST be treated as empty on those measures.
- **FR-006**: The Paste Voice submenu MUST be available only when music has been copied with Copy Voices. When a single voice was copied, it MUST offer one choice for each voice already present at the destination (to replace it) and, unless the destination already has four voices, a New Voice choice that pastes into a new voice after the existing ones (voice 2 when only voice 1 exists). When all voices were copied (more than one), it MUST offer only the All choice. It MUST NOT offer a voice beyond the next empty voice or beyond voice 4.
- **FR-007**: Paste Voice MUST start at the beginning of the measure that contains the destination selection, never in the middle of a measure.
- **FR-008**: Pasting a single copied voice into a chosen voice MUST replace that voice's content on the destination measures with the copied content, and MUST leave the other voices on those measures unchanged.
- **FR-009**: Paste Voice > All MUST paste each copied voice into the voice of the same number at the destination, and MUST leave any destination voices that were not copied unchanged.
- **FR-010**: If the voice being pasted into does not exist on a destination measure, the system MUST create it for that measure first, and then paste the content into it.
- **FR-011**: A paste that would extend past the last measure of the score MUST be limited to the measures that exist, with no error.
- **FR-012**: Copied music MUST keep what the existing copy and paste preserves (pitches adjusted for transposition and clef, tuplets, lyrics and chords, and markings attached to the notes). Lines that span notes (slurs, hairpins and similar) MUST be carried when a voice is pasted into the voice number it was copied from, including with All; when a voice is pasted into a different voice number they are not carried.
- **FR-013**: A voice paste MUST be a single undoable action: one Undo restores all the affected measures, including removing any voices the paste created.
- **FR-014**: After a paste, the displayed score MUST show the new music, with beams, voices and measure layout updated, without requiring any other action by the user.
- **FR-015**: The copy made by Copy Voices MUST remain available for repeated pastes until the next copy.

### Key Entities

- **Voice**: One of up to four independent lines of notes within the same staff, in each measure, numbered 1 to 4.
- **Voice copy**: A copy of one or more complete voices over a run of whole measures, held until the next copy; for each voice it records the music of each measure.
- **Paste target**: The staff and measure where the user has selected a note; a voice paste always begins at the start of that measure.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can duplicate a multi-voice passage to another place in the score with one copy choice and one paste choice (two menu selections plus the selection and destination click), and every pasted voice matches the source note for note in 100% of cases.
- **SC-002**: After a paste from a copy that included partial measures, the pasted passage always covers whole measures: the first pasted note is on the first beat of a measure in 100% of cases.
- **SC-003**: Pasting into a measure that lacks the chosen voice always produces that voice with the copied music, without the user adding the voice first, in 100% of cases.
- **SC-004**: One Undo returns every affected measure to its state before the paste, including removing any voices the paste added, in 100% of cases.
- **SC-005**: The existing Copy and Paste choices produce exactly the same results as before this feature, verified on the same sample passages.
- **SC-006**: In a manual pass, users never see a Paste Voice choice that would produce more than four voices or skip a voice number.

## Assumptions

- Up to four voices per measure is the existing limit, and is not changed here.
- Copy Voices lists voices that exist in the selected measures; Voice 3 and 4 appear only if they exist there.
- All, in Paste Voice, is the only choice when the copy holds more than one voice (each voice goes to the voice of the same number); with a single copied voice only the per-voice choices appear. Putting one voice of a multi-voice copy into a chosen voice is done by copying just that voice.
- A voice pasted into an existing voice replaces that voice's music for the pasted measures; it does not merge with it.
- Where the source and destination measures differ in length, the existing paste's behavior for music that doesn't fit is reused rather than redefined here.
- Copying across several staves and pasting into the same number of staves from the destination works as the existing copy and paste does; per-staff selection of voices is the same voice choice applied to every copied staff.
- Keyboard shortcuts for Copy and Paste stay as they are; the new submenus are reached through the Edit menu. Adding shortcuts is out of scope.
- The existing menu structure that lets a menu choice open a submenu beside it is available and used for the two new submenus.
- Voice-level copy and paste does not change the saved score format.
