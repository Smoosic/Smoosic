# Feature Specification: Measure-Number Rehearsal Marks

**Feature Branch**: `026-rehearsal-mark-measure-number`

**Created**: 2026-10-04

**Status**: Draft

**Input**: User description: "add a 'measureNumber' option to SmoRehearsalMark.  If this is the value for the rehearsal mark, change the setSection call in the vxMeasure line 487 to set the measure number. (smoMeasure.measureNumber.displayMeasure)  ."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Label a rehearsal mark with its measure number (Priority: P1)

A conductor or arranger wants a rehearsal mark that shows the measure number of the measure it sits on (e.g., "17") instead of a letter or an independently counted number. Measure-number rehearsal marks are a common engraving convention: players can find any rehearsal point by looking at the bar number. The user chooses the new "Measure number" numbering style for a rehearsal mark and sees that measure's number displayed as the mark.

**Why this priority**: This is the whole feature. Without the mark displaying the measure's number, there is nothing to deliver.

**Independent Test**: Can be fully tested by adding a rehearsal mark to a measure, choosing the "Measure number" numbering style, and confirming the mark shown above the staff is the displayed measure number of that measure (not "A" or a sequence number).

**Acceptance Scenarios**:

1. **Given** a rehearsal mark on a measure whose displayed measure number is 17, **When** the user sets the mark's numbering style to "Measure number", **Then** the mark rendered above that measure reads "17".
2. **Given** a rehearsal mark using the "Measure number" style, **When** the score is rendered, **Then** the mark text comes from the measure's displayed number rather than from the mark's stored symbol.
3. **Given** a rehearsal mark using the "Measure number" style, **When** the user saves and reopens the score, **Then** the mark still uses the "Measure number" style and shows the correct number.
4. **Given** a rehearsal mark using the capitals, lower case, or numbers style, **When** the score is rendered, **Then** it displays exactly as it does today (the stored symbol).

---

### User Story 2 - Measure-number mark stays correct when measures are renumbered (Priority: P2)

A user inserts, deletes, or reorders measures, or changes the first displayed measure number of the score. A rehearsal mark using the measure-number style should always reflect the *current* displayed measure number of its measure, with no manual updating.

**Why this priority**: Important for correctness — a measure-number label that goes stale after an edit would be misleading in a printed part — but it follows naturally from User Story 1 if the label is derived from the measure rather than stored.

**Independent Test**: Can be tested by creating a measure-number rehearsal mark on measure 5, inserting a measure before it, and confirming the mark now reads 6.

**Acceptance Scenarios**:

1. **Given** a measure-number rehearsal mark on measure 5, **When** the user inserts a measure before it, **Then** the mark updates to read 6.
2. **Given** a score whose measures are numbered from a custom starting value or with a custom displayed number, **When** a measure-number rehearsal mark is rendered, **Then** it shows that measure's displayed number, not its internal position.

---

### User Story 3 - Choose the style in the rehearsal mark dialog (Priority: P3)

A user editing an existing rehearsal mark in its properties dialog can pick "Measure number" from the Numbering choices alongside Capitals, Lower case, and Numbers.

**Why this priority**: Makes the option discoverable through the existing interface; the underlying behavior (P1) is useful first, but users need a way to select it.

**Independent Test**: Can be tested by opening the properties dialog of an existing rehearsal mark, selecting "Measure number" in the Numbering control, and confirming the score updates to show the measure number.

**Acceptance Scenarios**:

1. **Given** the rehearsal mark properties dialog is open, **When** the user opens the Numbering choices, **Then** "Measure number" is listed with the existing options.
2. **Given** the user selects "Measure number", **When** the dialog applies the change, **Then** the mark on the score immediately shows the measure's number.
3. **Given** the user selects "Measure number" and then cancels the dialog, **Then** the mark reverts to its previous style and text.

---

### Edge Cases

- What happens to the mark's stored symbol when the style is "Measure number"? It is ignored for display but retained, so switching back to Capitals/Lower case/Numbers restores a sensible symbol.
- What happens to the auto-increment setting for a measure-number mark? Auto-increment has no meaning for it (the label is determined by the measure), so it does not alter the mark's text and measure-number marks do not take part in the letter/number resequencing of other rehearsal marks.
- What happens when other rehearsal marks in the score use a different style? They are unaffected; adding, removing, or resequencing letter/number marks does not change measure-number marks, and vice versa.
- What happens if the measure's displayed number is unavailable or hidden? The mark falls back to the measure's regular number, and if that is also unavailable, to the mark's stored symbol, so a mark is never rendered blank.
- What happens to scores saved before this feature existed? They open unchanged; no existing rehearsal mark changes appearance.
- What happens to a measure-number mark placed on a measure that is not the first row of a system? Rehearsal marks keep today's placement rules (shown only where they are shown now); this feature changes only the text.
- What happens when a score with a measure-number mark is exported to another format that renders rehearsal marks? The exported mark shows the same measure number as the on-screen score.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST offer a "measure number" numbering style for rehearsal marks in addition to the existing capitals, lower case, and numbers styles.
- **FR-002**: When a rehearsal mark uses the measure-number style, the system MUST display the measure's displayed measure number as the mark's text instead of the mark's stored symbol.
- **FR-003**: The displayed text MUST be derived from the measure at render time, so it updates automatically when measures are inserted, removed, or renumbered.
- **FR-004**: Rehearsal marks using the capitals, lower case, or numbers styles MUST render exactly as they do today.
- **FR-005**: The measure-number style MUST be saved with the score and restored when the score is reopened; scores created before this feature MUST open without any change in appearance.
- **FR-006**: The rehearsal mark properties dialog MUST list "Measure number" among the Numbering choices, and selecting it MUST update the mark on the score.
- **FR-007**: Measure-number rehearsal marks MUST NOT be altered by, nor alter, the automatic resequencing of letter- or number-style rehearsal marks.
- **FR-008**: Any other output that renders rehearsal marks from a score (such as exported notation) MUST show the same measure-number text as the on-screen display.
- **FR-009**: Existing rules for where a rehearsal mark appears (position and which measures display it) MUST remain unchanged.

### Key Entities

- **Rehearsal mark**: A label attached to a measure to mark a rehearsal point. Key attributes: its numbering style (capitals, lower case, numbers, and now measure number), its stored symbol, its position, and whether it auto-increments.
- **Measure number (displayed)**: The number shown for a measure in the score, which may differ from the measure's internal position (e.g., custom starting number or an adjusted display value). The source of text for a measure-number rehearsal mark.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can change an existing rehearsal mark to the measure-number style in under 30 seconds using the properties dialog, and the score displays the correct number immediately.
- **SC-002**: In 100% of tested scores, a measure-number rehearsal mark shows the same number that appears for its measure elsewhere in the score.
- **SC-003**: After inserting or deleting measures before a measure-number mark, the mark shows the correct updated number with no manual action by the user.
- **SC-004**: All scores containing only capitals, lower case, or numbers rehearsal marks render identically before and after this feature (zero visual differences in regression checks).
- **SC-005**: A score containing a measure-number rehearsal mark reopens after saving with the same style and text 100% of the time.

## Assumptions

- The new option is a fourth value of the rehearsal mark's existing numbering-style setting (the setting already offering capitals, lower case, and numbers), identified as "measureNumber".
- The text for a measure-number mark is the measure's *displayed* measure number, not its internal index.
- The substitution happens only at the point where the mark's text is handed to the renderer; the stored symbol is left untouched. (The requester identified the on-screen rendering call and the measure's displayed-number property; planning will confirm these.)
- Any other place that emits rehearsal mark text from a score gets the same substitution so exported output stays consistent.
- Auto-increment is irrelevant to measure-number marks; the dialog may leave the toggle visible but it has no effect on the displayed text.
- Position and visibility rules for rehearsal marks, including the current "first row in system" behavior, are out of scope for this feature.
- Builds on the rehearsal mark properties dialog delivered in feature 025.
