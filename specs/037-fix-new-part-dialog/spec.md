# Feature Specification: Fix the Create Part Dialog

**Feature Branch**: `037-fix-new-part-dialog`

**Created**: 2026-11-06

**Status**: Draft

**Input**: User description: "Fix some issues when creating new parts or editing part properties.  1) It should be possible to add a part after/before any system in the score.  There is a 'staff location' parameter in the create part dialog, but it doesn't let you do that.  location 1 should be first, you should be able to set the value to score.staves.length + 1.  The largest value would put it after the last staff.    2) You should be able to set a name and abbreviation in the create part dialog, and the name should be 'create part'.    The default (placeholder) name is name of the selected instrument.  3) The default value for 'Preserve Text Groups' should be true.  Don't change the default in SmoPartInfo.defaults, but set it to that value in the Create Part dialog.  4) Don't insert the new part in an existing 2-stave part, put the new staff either before or after the 2-stave part (even if the staff index indicates otherwise)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Put the new part anywhere in the score (Priority: P1)

A composer has a score with several staves and wants to add a new part in a particular place: at the very top, between two existing staves, or at the very bottom. In the Create Part dialog, **Staff Location** is the position the new part will have in the score. Location 1 puts it first. Each higher number puts it one place lower, and the largest allowed value, one more than the number of staves now in the score, puts it after the last staff. Today the largest value cannot be reached, the starting value is not a sensible position, and it is not possible to put the new part first or last as expected.

**Why this priority**: Without this the dialog cannot do the most basic thing it offers: choose where the part goes. A part added in the wrong place has to be moved by hand, one step at a time.

**Independent Test**: In a score with 3 staves, create a part at location 1, and confirm it is the first staff. Undo, create one at location 2 and confirm it sits between the old first and second staves. Undo, create one at location 4 (the largest allowed) and confirm it is the last staff.

**Acceptance Scenarios**:

1. **Given** a score with N staves, **When** the user opens the Create Part dialog, **Then** Staff Location accepts whole numbers from 1 to N + 1, and no others.
2. **Given** the dialog is open, **When** the user opens it without changing Staff Location, **Then** the starting value is N + 1, so the new part goes after the last staff, which is what most users expect.
3. **Given** Staff Location is set to a number K from 1 to N + 1, **When** the user confirms, **Then** the new part is staff number K in the score, and the staves that were at K or beyond move down by one.
4. **Given** a score with 1 staff, **When** the user opens the dialog, **Then** Staff Location accepts 1 (before the staff) or 2 (after it).
5. **Given** the user types a number outside 1 to N + 1, **Then** it is held to the nearest allowed value.
6. **Given** the new part is added, **Then** its music, text and part settings do not disturb those of the staves around it, and the score can still be undone to its earlier state in one step.

---

### User Story 2 - Never split an existing two-stave part (Priority: P1)

Some parts take two staves (for example a piano part with treble and bass). If the user chooses a Staff Location that falls between the two staves of such a part, putting the new part there would break the part in two. Instead, the new part is placed just before the whole two-stave part or just after it, so the existing part stays intact.

**Why this priority**: Splitting a two-stave part corrupts it (the two staves are meant to be shown and printed together), and the user has no easy way to see or repair it afterward. This is a data-safety rule for story 1.

**Independent Test**: In a score where staves 2 and 3 are a two-stave piano part, create a part with Staff Location 3 (which points between those two staves). Confirm the piano part is still two adjacent staves and the new part is either directly before or directly after them, never between them.

**Acceptance Scenarios**:

1. **Given** a two-stave part on staves 2 and 3, **When** the user sets Staff Location to 3 (between its staves) and confirms, **Then** the new part is placed after the two-stave part (as staff 4), and the part's two staves stay together.
2. **Given** a two-stave part, **When** the location chosen is at its first staff or at the staff right after its second, **Then** the new part is placed exactly there, since that does not split it.
3. **Given** the new part is itself a two-stave part, **When** it is placed, **Then** both of its staves are adjacent and it too is not placed inside another two-stave part.
4. **Given** the new part has been placed to avoid a split, **Then** nothing else about the dialog changes, and the user is not shown an error.
5. **Given** several two-stave parts in the score, **Then** the rule applies to whichever one the chosen location falls inside.

---

### User Story 3 - Name the part when creating it (Priority: P2)

A composer creating a part wants to name it right away rather than finding the Part Properties dialog afterward. The Create Part dialog has a **Name** field and an **Abbreviation** field. The dialog's title is "Create Part" (today it is "Instrument Properties", which is confusing, since that is a different dialog). The Name field shows the name of the instrument currently chosen in the dialog as placeholder text; if the user leaves it empty, the part gets that instrument name. If the user changes the instrument, the placeholder follows.

**Why this priority**: It saves a step on every new part and gives parts sensible names by default, but the part can still be named later, so it is not as important as placing it correctly.

**Independent Test**: Open Create Part, choose Cello without typing a name, and confirm the Name field shows "Cello" as placeholder and the new part is named "Cello". Repeat typing "Cello I" as name and "Vc. I" as abbreviation, and confirm the part has exactly those.

**Acceptance Scenarios**:

1. **Given** the dialog is open, **Then** its title is "Create Part" and it has a Name and an Abbreviation field.
2. **Given** the Name field is empty, **Then** it shows the chosen instrument's name as placeholder text, and changes it when the instrument changes.
3. **Given** the user leaves Name empty and confirms, **Then** the new part's name is the chosen instrument's name.
4. **Given** the user types a Name and an Abbreviation and confirms, **Then** the new part has those values.
5. **Given** the user leaves Abbreviation empty, **Then** the new part has no abbreviation.
6. **Given** a 2-stave part is created, **Then** the name and abbreviation apply to the part as a whole, and the second staff does not get a separate name.
7. **Given** the user cancels, **Then** the score is unchanged.

---

### User Story 4 - Keep the text of new parts by default (Priority: P3)

When a part is created through the dialog, the option that decides whether text groups (titles, composer, other text boxes) of the part are kept is switched on, so a new part starts with the text that belongs to it. The user can still switch the option off later in the Part Properties dialog. The default used everywhere else is not changed.

**Why this priority**: A small default that avoids a later fix in the Part Properties dialog. It does not affect how the part is placed or named.

**Independent Test**: Create a part through the dialog, open Part Properties for it, and confirm Preserve Text Groups is on. Create a part some other way (for example by adding a staff through any other path, or by loading an old score) and confirm its setting is unchanged from before.

**Acceptance Scenarios**:

1. **Given** a part is created with the Create Part dialog, **Then** its Preserve Text Groups setting is on.
2. **Given** a score is loaded from a file, or a part is created by any means other than the Create Part dialog, **Then** the setting has the value it has always had (off by default, or whatever the file says).
3. **Given** a part was created with the setting on, **When** the user opens Part Properties, **Then** they can switch it off and the change is kept.

---

### Edge Cases

- A score with no staves cannot open this dialog; the existing behavior for that case is unchanged.
- The score is shown as a single part, not as a full score: the new part is still placed according to its position among all staves in the score, not only the displayed ones, and the view switches to the full score as it does today so the user can see it.
- The chosen location is the same as that of an existing part's first staff: the new part goes before that part.
- A two-stave part sits at the end of the score and the user picks N + 1: the new part goes after it (this does not split anything).
- The user picks a location inside a two-stave part, and the new part is also a two-stave part: it is placed before or after the existing part, as in story 2.
- The name or abbreviation contains only spaces: it is treated as empty.
- The instrument is changed after the user has typed a Name: the typed name is kept; only the placeholder changes.
- Very long names: no limit is added by this change.
- Undo after creating a part: the whole creation (the new staff or staves, name, and setting) is removed in one step.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Create Part dialog MUST accept a Staff Location that is a whole number from 1 to the number of staves in the score plus one, and hold other values to the nearest allowed value.
- **FR-002**: Staff Location 1 MUST put the new part first, each higher number one place lower, and the largest value after the last staff.
- **FR-003**: The dialog MUST open with Staff Location set to the largest allowed value (after the last staff).
- **FR-004**: When confirmed, the new part MUST become the staff at the chosen position, and the staves at or after that position MUST move down, keeping their order and content.
- **FR-005**: If the chosen position falls between the two staves of an existing two-stave part, the new part MUST be placed after that part (directly following its second staff) instead, and the existing part MUST stay together.
- **FR-006**: A new two-stave part MUST have its two staves adjacent.
- **FR-007**: The dialog title MUST be "Create Part".
- **FR-008**: The dialog MUST have a Name field and an Abbreviation field.
- **FR-009**: The Name field MUST show the chosen instrument's name as placeholder text, updated when the instrument changes.
- **FR-010**: If Name is empty (or only spaces) when confirmed, the part's name MUST be the chosen instrument's name; otherwise it MUST be the typed name.
- **FR-011**: The part's abbreviation MUST be the typed abbreviation, or empty if none was typed.
- **FR-012**: A part created with the dialog MUST have Preserve Text Groups on.
- **FR-013**: The default setting for Preserve Text Groups for parts created any other way, and for loaded scores, MUST NOT change.
- **FR-014**: Creating a part MUST be one undoable step that restores the previous score.
- **FR-015**: Canceling the dialog MUST leave the score unchanged.

### Key Entities

- **Part**: A named group of one or two staves in the score, with a name, an abbreviation and settings such as whether its text groups are kept. A two-stave part must stay together.
- **Staff Location**: The position, counted from 1, that the new part will have among the staves of the score, from first to after the last. It is a request that may be adjusted so as not to split a two-stave part.
- **Create Part Request**: What the dialog collects: the instrument and clef, staff lines, transposition, whether to use two staves, the location, the name and the abbreviation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a score with N staves, a user can place a new part at every one of the N + 1 possible positions using only the dialog, with no later move needed, and the result is at the chosen position every time.
- **SC-002**: Across all positions chosen in scores containing two-stave parts, no two-stave part is ever split by a new part (0 splits).
- **SC-003**: A user can create a named, abbreviated part in one dialog without opening Part Properties afterward.
- **SC-004**: A part created with an empty Name field always has a non-empty name.
- **SC-005**: 100% of parts created with the dialog have Preserve Text Groups on, and parts created any other way keep their previous setting.
- **SC-006**: Undoing a part creation restores the score to exactly its state before, in one step.

## Assumptions

- "Staff Location" counts staves of the whole score (including any staves not currently displayed), from 1, and the new part takes that place, so the staff that was there moves down. This matches the request ("location 1 should be first", the largest value "after the last staff").
- The "selected instrument" in the request is the instrument chosen in the Create Part dialog, and the placeholder follows the choice. The name of an instrument is the label shown for it in the dialog's instrument list (for example "Cello", "Bb Trumpet").
- When the chosen position is inside a two-stave part, "before or after" is resolved by placing the new part after the part. The request did not say which, and either keeps the part together.
- A two-stave part is recognized from the part information already kept with its staves.
- The Abbreviation has no placeholder, and an empty abbreviation is allowed.
- The Create Part dialog does not get a new Preserve Text Groups toggle; the new part is simply created with it on, and the existing Part Properties dialog is where it can be changed.
- The title of the dialog is the only existing text changed. The Part Properties dialog and the menu text ("Create New Part/Stave") are unchanged.
- Parts are created at the full length of the score, as today.
