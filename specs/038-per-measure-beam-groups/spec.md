# Feature Specification: Per-Measure Beam Groups

**Feature Branch**: `038-per-measure-beam-groups`

**Created**: 2026-11-08

**Status**: Draft

**Input**: User description: "Make default beaming lengths configurable per-measure and to support compound meter. SmoBeamPreferences will be derived from SmoMeasureModifierBase. SmoScorePreferences currently has defaultDoubleDuration which is supposed to decide beaming lengths for eighth notes in even meter or triple meter. We should have beaming groups that can be specified per-measure. It is an array of integers between 1 and 4. By default the array is empty so we use the default duration for the meter. The numbers specify the longest beam groups of 1/8 notes, or 16th notes if the time denominator is 16. If there are 2 numbers in the array, the second number is used for the second beam group. This supports compound meter or non-standard grouping, for instance, 3 + 2 beams for 5/8 time. The dialog should allow the user to specify measures, selection, or score."

## Clarifications

### Session 2026-11-08

- Q: When a measure has more beam groups than numbers in its grouping, what happens to the extra groups? → A: The grouping repeats from its first number.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Beam an irregular meter as 3 + 2 (Priority: P1)

A composer writes a measure of 5/8. Today the notes beam according to the score-wide duple or triple default, which gives the wrong grouping for 5/8. The composer opens the beam groups dialog, chooses the selected measure, and enters the grouping "3, 2". The eighth notes in that measure now beam as three, then two. A 2 + 3 grouping can be entered the same way for measures that are felt that way.

**Why this priority**: This is the case the existing defaults cannot handle at all, and it is the reason for the feature. Everything else builds on a measure being able to carry its own grouping.

**Independent Test**: Enter ten eighth notes across two 5/8 measures, set the grouping "3, 2" on the first measure only, and confirm the first beams 3 + 2 while the second keeps the standard grouping for the meter.

**Acceptance Scenarios**:

1. **Given** a 5/8 measure of five eighth notes with no grouping set, **When** the user sets the grouping to "3, 2" for that measure, **Then** the first three notes beam together and the last two beam together.
2. **Given** a 5/8 measure with grouping "3, 2", **When** the user sets it to "2, 3", **Then** the beams change to two then three.
3. **Given** a 5/8 measure with grouping "3, 2" and a neighbouring 5/8 measure with none, **When** the score is displayed, **Then** only the first measure uses the custom grouping.

---

### User Story 2 - Compound meter beams by dotted beats (Priority: P1)

A user writing in 9/8, 12/8 or 6/8 wants beams that follow the beat: groups of three eighth notes. They select the measures and enter the grouping "3". Every beam group in those measures is three eighths long, however many beats the measure has. A grouping such as "3, 3, 2" is also accepted for measures with an irregular pulse, such as 8/8.

**Why this priority**: Compound meter is named in the request. It also exercises the rule for measures that have more beam groups than numbers in the grouping.

**Independent Test**: Enter a 12/8 measure of twelve eighth notes, set the grouping to "3", and confirm there are four beams of three. Then set "3, 3, 2" on an 8/8 measure and confirm the groups are 3 + 3 + 2.

**Acceptance Scenarios**:

1. **Given** a 12/8 measure of twelve eighth notes, **When** the user sets the grouping to "3", **Then** the notes beam in four groups of three.
2. **Given** an 8/8 measure of eight eighth notes, **When** the user sets the grouping to "3, 3, 2", **Then** the notes beam as 3 + 3 + 2.
3. **Given** a 6/16 measure of six sixteenth notes, **When** the user sets the grouping to "3", **Then** the notes beam in two groups of three sixteenths.
4. **Given** a 10/8 measure of ten eighth notes, **When** the user sets the grouping to "3, 2", **Then** the notes beam as 3 + 2 + 3 + 2.

---

### User Story 3 - Apply a grouping to the selection or the whole score (Priority: P2)

The user wants to set the grouping once and apply it to many measures. The beam groups dialog lets the user choose the scope: the measures covered by the current selection, or the whole score. The user can also clear the grouping on the same scope to return to the standard grouping for the meter.

**Why this priority**: Without this the user must repeat the dialog for every measure. Per-measure editing (Story 1) is still useful on its own, so this ranks below it.

**Independent Test**: Select measures 3 to 6 of a 6/8 piece, apply the grouping "3", and confirm measures 3 to 6 change while the others do not. Apply it to the whole score and confirm all measures change. Clear it on the whole score and confirm every measure reverts.

**Acceptance Scenarios**:

1. **Given** measures 3 to 6 are selected, **When** the user applies the grouping "3" to the selected measures, **Then** measures 3 to 6 use it and no other measure changes.
2. **Given** a grouping is set on several measures, **When** the user clears the grouping for the score, **Then** every measure returns to the standard grouping for its meter.
3. **Given** a multi-staff score, **When** the user applies a grouping to the selected measures, **Then** it applies to the same measures in the staves covered by the selection and no other staves change.

---

### User Story 4 - Existing scores and the score-wide default are unchanged (Priority: P2)

A user opens a score saved before this feature. Every measure beams exactly as it did, and the existing score-wide default beam length setting still works for any measure that has no grouping of its own. Saving and reopening a score keeps any groupings that were set.

**Why this priority**: This protects existing work and is required for the feature to ship safely, but it adds no new capability.

**Independent Test**: Open a score saved before the feature, confirm the beams are identical. Set groupings on some measures, save, reopen, and confirm they are kept.

**Acceptance Scenarios**:

1. **Given** a score saved before this feature, **When** it is opened, **Then** all beams are unchanged and no measure has a grouping.
2. **Given** a measure with no grouping, **When** the score-wide default beam length is changed, **Then** that measure follows the new default.
3. **Given** a measure with a grouping, **When** the score-wide default beam length is changed, **Then** that measure keeps its own grouping.
4. **Given** a score with groupings set on some measures, **When** it is saved and reopened, **Then** the groupings are preserved.

---

### Edge Cases

- A grouping that adds up to more notes than the measure holds: the last group is cut at the end of the measure.
- A grouping that adds up to fewer notes than the measure holds: the grouping starts over from its first number for the rest of the measure. For example, "3" in 12/8 gives four groups of three, and "3, 2" in 10/8 gives 3 + 2 + 3 + 2. If the measure ends partway through a repeat, the final group is shorter (for example "3, 2" in 7/8 gives 3 + 2 + 2).
- A note that cannot sit inside a beam, such as a quarter note, or a rest at the start of a group, still ends the group; the grouping only decides how far beams may extend.
- Notes longer than an eighth, including dotted-eighth and sixteenth figures, count by their duration in the grouping unit (eighths, or sixteenths when the meter's lower number is 16). A group is closed once its total length reaches the number.
- Beam breaks or beam joins that the user placed by hand on individual notes take precedence over the measure's grouping.
- Values outside 1 to 4, non-numbers or empty entries are rejected in the dialog with a clear message, and the measure is left unchanged.
- A tuplet is beamed as a unit as it is today; a measure grouping does not split a tuplet.
- A time signature change partway through a selection: each measure uses the unit for its own time signature.
- A pickup (partial) measure: the grouping applies from the start of the measure.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each measure MUST be able to hold a beam grouping: an ordered list of whole numbers, each between 1 and 4.
- **FR-002**: By default a measure's grouping MUST be empty. A measure with an empty grouping MUST beam using the score-wide default beam length for its meter type, exactly as it does today.
- **FR-003**: Each number in the grouping MUST give the maximum length of one beam group, counted in eighth notes, or in sixteenth notes when the measure's time signature has 16 as its lower number.
- **FR-004**: The first number MUST govern the first beam group in the measure, the second number the second beam group, and so on.
- **FR-005**: When a measure has more beam groups than numbers in its grouping, the grouping MUST repeat from its first number until the end of the measure.
- **FR-006**: A grouping MUST be able to express compound meters (such as 6/8, 9/8 and 12/8) and irregular grouping (such as 3 + 2 and 2 + 3 in 5/8, or 3 + 3 + 2 in 8/8).
- **FR-007**: A measure's grouping MUST be applied whenever the measure is beamed, including after the user edits notes, changes durations, or changes the time signature.
- **FR-008**: Beam groups that were placed by hand on individual notes MUST NOT be overridden by the measure grouping.
- **FR-009**: The user MUST be able to open a beam groups dialog and enter a grouping.
- **FR-010**: The dialog MUST let the user choose where the grouping is applied: the measures covered by the current selection, or the whole score.
- **FR-011**: The dialog MUST let the user clear the grouping for the chosen scope, returning those measures to the standard grouping for their meter.
- **FR-012**: The dialog MUST reject numbers outside 1 to 4 and entries that are not whole numbers, and MUST tell the user why.
- **FR-013**: When the dialog opens on a measure that already has a grouping, it MUST show that grouping.
- **FR-014**: Changing a grouping MUST update the displayed score without requiring any other action from the user.
- **FR-015**: A change to a grouping MUST be undoable as a single step.
- **FR-016**: A measure's grouping MUST be saved with the score and restored when the score is opened.
- **FR-017**: Scores saved before this feature MUST open with every measure ungrouped and beamed as before.
- **FR-018**: The grouping MUST be carried with the measure when the measure is copied, in the same way as other measure-level formatting.

### Key Entities *(include if feature involves data)*

- **Beam grouping (per measure)**: An ordered list of whole numbers from 1 to 4 attached to a measure. Empty means "use the default for the meter". It is a measure setting like other per-measure settings, and is saved with the measure.
- **Score-wide default beam length**: The existing preference that sets beam length for duple and triple meters. It remains the fallback for any measure with no grouping.
- **Measure**: Gains an optional beam grouping. Its time signature determines whether the numbers count eighth or sixteenth notes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can change a measure from the standard grouping to 3 + 2 in 5/8 in under 30 seconds, with a single visit to the dialog.
- **SC-002**: A user can apply one grouping to every measure of a score in a single dialog action.
- **SC-003**: For a test set covering 5/8, 6/8, 9/8, 12/8, 8/8 and 6/16 time, the beams produced match the entered grouping in 100% of cases.
- **SC-004**: 100% of scores saved before this feature open with identical beams to the previous version.
- **SC-005**: 100% of groupings set in a score survive saving and reopening the score.
- **SC-006**: Invalid entries (outside 1 to 4, non-numeric) are rejected 100% of the time, and the measure is left unchanged.

## Assumptions

- The request refers to the score-wide default beam length setting as "defaultDoubleDuration"; in the application this is the duple-meter default beam length. It remains unchanged and is the fallback when a measure has no grouping.
- The request lists "measures, selection, or score" as scopes. Because the grouping belongs to measures, "measures" and "selection" are treated as the same thing: the measures covered by the current selection. Together with "whole score" this matches the "Apply To" convention of existing dialogs. A "remaining measures" scope is offered by some other dialogs but was not requested, so it is out of scope here.
- A grouping applies to all voices of the measure, and only to the staves covered by the selection when the scope is the selection.
- A measure whose lower time number is 4 or 2 counts the grouping in eighth notes.
- A group may be shorter than its number when it is cut off by a note that cannot be beamed, by a rest, or by the end of the measure.
- Showing the grouping in the dialog is sufficient; no new on-staff marking of the grouping is required.
- Changing the beaming of tuplets is out of scope.
- Localization of the new dialog follows the existing practice for dialogs.
