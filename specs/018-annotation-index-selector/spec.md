# Feature Specification: Multiple Annotations Per Note

**Feature Branch**: `018-annotation-index-selector`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "for the annotation feature we just added, use the 'verse' attribute in a similar to lyrics and chords.  In the post-edit dialog box, add a '+' button if there are fewer than 4 annotations already attached to the note.  If the user clicks on it, they can add another annotation.  If there are multiple annotations already on this note, add a dropdown to let them select one of the other indices.  Like with lyric, if you remove an annotation, remove that specific index from the set of annotations for the note, so if you remove verse 2 of 3, verse 3 becomes verse 2.   The UI will still call it 'index' even though it is using the verse parameter."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Attach a second, third, or fourth annotation to a note (Priority: P1)

As a score editor user who has already added one annotation to a note (or selection), I want to add another independent annotation to the same note without disturbing the first one, so I can layer multiple separate pieces of text (e.g. a performance note and a separate editorial remark) on the same note.

**Why this priority**: This is the core capability the whole feature exists to deliver — everything else (switching between them, removing one) only matters once more than one annotation can exist on a note.

**Independent Test**: Add an annotation to a note, reopen its dialog once text-editing ends, click the "+" control, type new text for the second annotation, end editing, and confirm both annotations now render on the score independently, each with its own text.

**Acceptance Scenarios**:

1. **Given** a note with one existing annotation, **When** the user reopens the Annotation dialog and reaches the non-editing view, **Then** a "+" control is visible.
2. **Given** the "+" control is visible, **When** the user activates it, **Then** a new, empty annotation is created at the next available index and a text-editing session opens for it, leaving the note's existing annotation(s) unchanged.
3. **Given** the user has just created a second annotation via "+", **When** they finish typing and end the editing session, **Then** the score shows both annotations on the note, each independently positioned per its own settings.
4. **Given** a note already has 4 annotations attached, **When** the user opens its non-editing dialog view, **Then** the "+" control is not shown (or is disabled).

---

### User Story 2 - Switch between a note's existing annotations (Priority: P2)

As a score editor user working with a note that has more than one annotation, I want a way to pick which one I'm currently viewing/editing in the dialog, so I can review or adjust each one without them being confused with each other.

**Why this priority**: Useful once User Story 1 allows more than one annotation to exist, but the ability to create multiple annotations is the more fundamental capability.

**Independent Test**: On a note with two or more annotations, open the Annotation dialog's non-editing view, confirm an index selector is shown, choose a different index, and confirm the dialog now displays that annotation's own text/font/offset/justify settings instead of the previous one's.

**Acceptance Scenarios**:

1. **Given** a note has two or more annotations, **When** the user reaches the dialog's non-editing view, **Then** a selector listing each annotation's index is shown.
2. **Given** the index selector is shown, **When** the user picks a different index, **Then** the dialog updates to show that specific annotation's text, font, offset, and vertical-justify settings, without altering any other annotation.
3. **Given** a note has zero or exactly one annotation, **When** the user reaches the dialog's non-editing view, **Then** no index selector is shown, since there is nothing to choose between.

---

### User Story 3 - Remove one annotation and keep the remaining ones' indices contiguous (Priority: P3)

As a score editor user, when I remove one of several annotations from a note, I want the remaining annotations to close the gap automatically (so what was index 3 becomes index 2 if I remove index 2), matching how removing a lyric verse already behaves, so indices never end up with confusing gaps.

**Why this priority**: Only relevant once multiple annotations can exist (User Story 1) and be distinguished (User Story 2); it's a data-hygiene refinement on top of those.

**Independent Test**: On a note with three annotations, remove the one at the middle index, and confirm exactly two annotations remain, with the one that was previously the highest index now occupying the removed index's place, and no gap in numbering.

**Acceptance Scenarios**:

1. **Given** a note with three annotations, **When** the user removes the annotation at the second index, **Then** the annotation that was at the third index now becomes the second index, and only two annotations remain.
2. **Given** the renumbering in Scenario 1 has just happened, **When** the user views the index selector again, **Then** it lists exactly the remaining indices with no gap.
3. **Given** a note with exactly one annotation, **When** the user removes it, **Then** the note has no annotations left and no index selector is shown.

---

### Edge Cases

- What happens when a note with multiple annotations is part of a multi-note selection (from the base Annotation feature) whose other selected notes have a different number of existing annotations? The "+" control's availability and the index selector's contents are driven by the first selected note's current annotations, consistent with how the base Annotation feature already seeds a multi-note session from the first selected note.
- What happens when "+" is used on a multi-note selection? The new annotation is added, at the same new index, to every note in the original selection — consistent with how the base Annotation feature already applies one shared annotation identically across a selection.
- What happens when removing an index on a multi-note selection? The same index is removed and the remaining indices renumbered on every note in the original selection, keeping them consistent with each other.
- What happens to a score saved with multiple annotations on a note when reloaded? All of that note's annotations reload with their original text, font, offset, vertical-justify, and relative index order intact.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow up to 4 independent annotations to be attached to a single note, each distinguished by a numbered index — the same limit already used for multiple lyric verses on a note.
- **FR-002**: The Annotation dialog's non-editing (post-edit) view MUST show a "+" control whenever the current note(s) have fewer than 4 annotations attached.
- **FR-003**: Activating "+" MUST create a new, empty annotation at the next available index and open a text-editing session for it, leaving every existing annotation on the note unchanged.
- **FR-004**: The "+" control MUST be hidden or disabled once a note already has 4 annotations attached.
- **FR-005**: Whenever a note has two or more annotations, the dialog's non-editing view MUST show a selector listing each annotation's index, letting the user choose which one is currently displayed.
- **FR-006**: Selecting a different index MUST load that specific annotation's own text, font, offset, and vertical-justify settings into the dialog, without changing any other annotation on the note.
- **FR-007**: When a note has zero or exactly one annotation, the index selector MUST NOT be shown.
- **FR-008**: Removing an annotation MUST remove only the one at the selected index; every remaining annotation at a higher index on the same note MUST be renumbered down by one so indices stay contiguous with no gaps (e.g., removing index 2 of 3 makes former index 3 become index 2).
- **FR-009**: After a removal that renumbers remaining annotations, the dialog's index selector and displayed content MUST immediately reflect the updated indices.
- **FR-010**: For a multi-note selection (as established by the base Annotation feature), adding a new annotation via "+" MUST apply it, at the same index, to every note in the original selection.
- **FR-011**: For a multi-note selection, removing an annotation at a given index MUST remove and renumber that index consistently across every note in the original selection.
- **FR-012**: A score saved with multiple annotations on one or more notes MUST reload with every annotation's text, font, offset, vertical-justify, and index order intact.

### Key Entities

- **Annotation Index**: The number (1 through 4, shown in the UI as "index") that distinguishes one of a note's several independent annotations from another. Reuses the same underlying multi-slot numbering mechanism already used to distinguish multiple lyric verses or chord lines on the same note.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can attach a second, third, and fourth independent annotation to the same note, each separately editable, without needing to remove any existing one first.
- **SC-002**: After removing one annotation from a note with multiple, 100% of the remaining annotations have contiguous indices starting at 1, with no gaps.
- **SC-003**: 100% of notes that already have 4 annotations show no way to add a 5th.
- **SC-004**: A user can pick any of a note's existing annotations from the index selector and see that exact annotation's own text and settings, distinct from every other annotation on the same note, every time.
- **SC-005**: A score with notes carrying multiple annotations reloads with 100% of those annotations' text, settings, and index order preserved.

## Assumptions

- This feature revises the prior Annotation feature's assumption of "exactly one annotation per note" — a note may now carry up to 4 independent annotations, matching the existing 4-verse limit already used for lyrics.
- The "index" shown in the UI is 1-based (labeled "1" through "4"), matching how the existing multi-verse lyric selector already labels its choices, even though the underlying numbering it reuses may be zero-based internally.
- A newly added annotation (via "+") starts with empty text and default font/offset/vertical-justify settings, the same starting point the very first annotation on a note gets today.
- Switching the index selector only changes which annotation is currently displayed in the dialog; it does not itself save or discard anything, since the selector only appears in the dialog's non-editing view (no in-progress text edit exists at that point).
- For a multi-note selection, "+", the index selector, and removal all continue to operate on one shared session applied identically across every originally-selected note, seeded from the first selected note's current annotations — consistent with how the base Annotation feature already handles multi-note selections.
