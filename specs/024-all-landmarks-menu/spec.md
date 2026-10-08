# Feature Specification: Add All Landmarks Menu Option

**Feature Branch**: `024-all-landmarks-menu`

**Created**: 2026-10-03

**Status**: Draft

**Input**: User description: "add an 'All' submenu option in the landmark submenu.  Allow the user to add all the landmarks available at once.   If the landmarks exist, just skip those.  When all the text groups are created, just close the menu, don't open another dialog."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add every available landmark in one action (Priority: P1)

A user setting up a new score wants to quickly populate all the standard labels (Title, Subtitle, Composer, Copyright, Date, Page Number, Part, etc.) without having to open the landmark submenu and make a separate selection for each one.

**Why this priority**: This is the entire value of the feature — replacing several repetitive menu selections with a single action. It is the only user story needed to deliver the requested capability.

**Independent Test**: Can be fully tested by opening the landmark submenu on a score that has no landmarks yet, selecting "All", and confirming that every currently-available landmark is created and the menu closes with no further dialog appearing.

**Acceptance Scenarios**:

1. **Given** none of the available landmarks exist yet, **When** the user selects "All" from the landmark submenu, **Then** a landmark is created for every landmark type that is currently available, and the menu closes without opening any dialog.
2. **Given** some landmarks already exist and others are available but missing, **When** the user selects "All", **Then** only the missing, available landmarks are created; the existing ones are left exactly as they were (not duplicated, not reset, not reopened).
3. **Given** every available landmark already exists, **When** the user selects "All", **Then** nothing is created or changed, and the menu simply closes.
4. **Given** the user has just selected "All" and one or more landmarks were created, **When** the creation finishes, **Then** no landmark's editing dialog opens — the menu closes and the user is returned to the score view.

---

### Edge Cases

- What happens when a landmark type is not currently "available" (e.g., there's no part exposed for the Part landmark, or no composer text has been entered for the Composer landmark) and it also doesn't already exist? It is skipped by "All", exactly as it would be hidden/unselectable if the user opened the submenu and looked for it individually.
- What happens if the user selects "All" a second time after already using it once (with nothing else changed in between)? Every landmark it would have created already exists, so the second selection creates nothing and just closes the menu (same as Acceptance Scenario 3).
- What happens to the visual placement/stacking of landmarks created together via "All" (e.g., Title and Subtitle, which stack vertically; Composer, Page Number and Part, which share a column)? Each one is placed using the same stacking rule already used when a landmark is created individually, applied in a consistent order so the end result looks the same as if the user had created them one at a time in that order.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The landmark submenu MUST offer an "All" option alongside its existing per-landmark options.
- **FR-002**: Selecting "All" MUST create a landmark for every landmark type that is currently available and does not already exist.
- **FR-003**: Selecting "All" MUST NOT alter, duplicate, or recreate any landmark that already exists; already-existing landmarks are left completely untouched.
- **FR-004**: Selecting "All" MUST NOT open any landmark's editing dialog, whether or not any landmarks were created by the action.
- **FR-005**: After "All" finishes creating any missing landmarks (including the case where none needed to be created), the landmark submenu MUST close.
- **FR-006**: Each landmark created via "All" MUST be positioned the same way a landmark of that type would be positioned if the user had created it individually through its own submenu option.
- **FR-007**: The "All" option MUST remain available for selection every time the landmark submenu is opened, regardless of how many landmarks currently exist.

### Key Entities

- **Landmark**: A standard, named piece of score text (Title, Subtitle, Composer, Copyright, Date, Page Number, Part) that the landmark submenu can create one of; each type may or may not already exist on the current score, and may or may not currently be "available" to create.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can populate every available landmark in a single menu selection, instead of one selection per landmark.
- **SC-002**: 100% of landmarks that already existed before selecting "All" remain unchanged afterward (no duplicates, no unintended edits).
- **SC-003**: Selecting "All" never produces an error or duplicate landmark, regardless of how many landmarks already existed beforehand (including when all of them already existed).
- **SC-004**: In 100% of cases, selecting "All" ends with the menu closed and no editing dialog open.

## Assumptions

- "Available" landmarks are the same set that already determines whether each individual landmark option is shown/selectable in the submenu today (for example, Title/Subtitle/Composer/Copyright only count as available when their underlying score-info text is non-empty, unless a landmark of that type already exists; Part is only available when a part is exposed; Date and Page Number are always available).
- Landmarks created together via "All" are placed using the same relative-stacking convention already used for individually-created landmarks, applied in a consistent, repeatable order (e.g., Title, then Subtitle, then Composer, then Copyright, then Date, then Page Number, then Part), so the result looks the same regardless of which landmarks already existed beforehand.
- Creating several landmarks via one "All" selection is treated as a single step for undo purposes, consistent with how other bulk/multi-item operations in the app already behave.
- The "All" option is always shown, even when there is currently nothing left to add — in that case it simply closes the menu without creating anything, rather than being hidden or disabled.
