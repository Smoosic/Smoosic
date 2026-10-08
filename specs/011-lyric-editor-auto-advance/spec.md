# Feature Specification: Lyric Editor Auto-Advance

**Feature Branch**: `011-lyric-editor-auto-advance`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "enhance lyric editor to auto-advance. There is some logic in src/render/sui/textEdit.ts for advancing the selection. If the user selects a '-', add the character to the lyric and advance to the next note as if the user clicked the arrow key. If the user enters a space, and there is text in the lyric, go to the next note. If there is no text in the lyric yet, go to the next note but don't create an empty lyric."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enter a hyphenated, multi-syllable lyric with the keyboard alone (Priority: P1)

As a score editor user typing a lyric that spans several notes (a melisma), I can type a hyphen to both mark the syllable break and move on to the next note in one keystroke, instead of typing the hyphen and then separately clicking the next-note control.

**Why this priority**: Hyphenated lyric entry across a run of notes is the single most common and highest-volume lyric-entry workflow; removing an extra click per syllable is the core value of this feature.

**Independent Test**: Open the Lyric Editor on a note, type a syllable followed by a hyphen, and confirm the hyphen is added to that note's lyric and the editor immediately moves to the next note, ready for the next syllable.

**Acceptance Scenarios**:

1. **Given** the lyric editor is open on a note and the user has typed part of a syllable, **When** the user types `-`, **Then** the hyphen is appended to that note's lyric text and the editor advances to the next note, exactly as if the next-note control had been activated.
2. **Given** the lyric editor is open on the last note in the score, **When** the user types `-`, **Then** the hyphen is still appended to that note's lyric, but the editor remains on the same note since there is no next note to advance to.

---

### User Story 2 - Move to the next note with the space bar (Priority: P2)

As a score editor user entering separate, non-hyphenated syllables or whole words under a run of notes, I can press the space bar to move to the next note without inserting a stray space character into the lyric, and without leaving behind an empty lyric on a note I skip without typing anything.

**Why this priority**: This is the second most common lyric-entry pattern (one word/syllable per note) and prevents accidental empty lyrics from cluttering the score when notes are skipped.

**Independent Test**: Open the Lyric Editor, type a word, press space, and confirm the editor moved to the next note without a trailing space in the previous note's lyric. Separately, open the Lyric Editor on a note, press space without typing anything, and confirm the editor moves to the next note with no lyric created on the note left behind.

**Acceptance Scenarios**:

1. **Given** the lyric editor is open on a note and the user has typed non-empty text, **When** the user presses the space bar, **Then** the editor advances to the next note without a space character being added to the text.
2. **Given** the lyric editor is open on a note with no text typed yet, **When** the user presses the space bar, **Then** the editor advances to the next note, and no lyric is created or saved for the note that was left.
3. **Given** the lyric editor is open on the last note in the score, **When** the user presses the space bar, **Then** the editor remains on the same note (no next note to advance to), matching the existing next-note control's boundary behavior.

---

### Edge Cases

- Typing a hyphen or space on the last note in the score does not advance (no next note exists), matching the existing next-note control's behavior at that boundary (User Story 1, Scenario 2; User Story 2, Scenario 3).
- A note's lyric that had text typed and then fully deleted (back to empty) before space is pressed is treated the same as a note that never had text typed — no empty lyric is created or saved for it.
- Typing several hyphens or spaces in quick succession advances one note per keystroke, the same as clicking the next-note control repeatedly; it is not a special multi-note jump.
- Every other character the user types continues to be inserted into the lyric text exactly as before; only a lone hyphen or space triggers this auto-advance behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: While the lyric text editor is active, typing a hyphen (`-`) character MUST append the hyphen to the current note's lyric text and then advance to the next note, with the same effect as activating the existing next-note control.
- **FR-002**: While the lyric text editor is active and the current note's lyric text is non-empty, typing a space character MUST advance to the next note without inserting a space character into the lyric text.
- **FR-003**: While the lyric text editor is active and the current note's lyric text is empty, typing a space character MUST advance to the next note without inserting a space character, and MUST NOT create or persist a lyric for the note being left.
- **FR-004**: When there is no next note to advance to (the current note is the last note in the score), typing a hyphen or space MUST leave the editor on the current note with no error, matching the existing next-note control's boundary behavior; a typed hyphen is still appended to the text in this case.
- **FR-005**: This auto-advance behavior MUST apply only within the lyric text editor; it MUST NOT change how hyphen or space characters behave in any other text-entry control.
- **FR-006**: All characters other than a lone hyphen or space MUST continue to be inserted into the lyric text exactly as before, with no unintended navigation.

### Key Entities

- **Lyric**: The text line attached to a specific note for the active verse, as introduced in the Vue-based Lyric Editor dialog — this feature changes when navigation is triggered while typing into it, not its stored shape.
- **Current Note Selection**: The note the lyric editor is positioned on; advances when the auto-advance conditions above are met.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can enter a fully hyphenated, multi-syllable lyric across a run of consecutive notes using the hyphen key alone, without using the mouse or the dedicated next-note control.
- **SC-002**: A user can enter a sequence of separate, single-syllable lyrics across a run of notes using the space bar alone, without using the mouse or the dedicated next-note control.
- **SC-003**: Skipping notes with the space bar while leaving no typed text never results in an empty lyric being added to the score for a skipped note.
- **SC-004**: Typing any character other than a lone hyphen or space continues to insert that character exactly as before, with no unintended navigation, 100% of the time.

## Assumptions

- "As if the user clicked the arrow key" refers to the existing forward (next-note) navigation control in the Vue-based Lyric Editor dialog (`010-vue-lyric-dialog`). This feature adds forward auto-advance triggers only (hyphen, space); it does not add a keyboard shortcut for backward navigation, since none was requested.
- The hyphen character is always inserted into the lyric text before advancing (a trailing hyphen marks a continued/hyphenated syllable, consistent with existing hyphenated-lyric conventions); the space character is never inserted — it only triggers navigation.
- "Don't create an empty lyric" means that if a note is left without any non-empty text having been entered for it during the current editing pass, no lyric is added to or saved on that note as a side effect of navigating away from it via the space bar.
- This feature modifies only the current Vue-based plain-text lyric editor's typing behavior (introduced in `010-vue-lyric-dialog`); it does not reintroduce the legacy inline-SVG lyric typing surface that dialog replaced.
- No project constitution has been ratified beyond the existing high-level principles already noted in prior specs; this feature stays entirely within the UI dialog layer.
