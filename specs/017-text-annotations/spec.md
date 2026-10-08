# Feature Specification: Note Text Annotations

**Feature Branch**: `017-text-annotations`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "create a new text feature that can be applied to notes.  The data representation will use the SmoLyric (used for lyrics and chords) and the parser field in SmoLyric will be set to 1 (annotation).  It can be created from the text menu, and will apply to selected notes.  Once the editing in the text editor is complete, the dialog changes to non-editing mode where the user can set the font and also any x/y offset in pixels, just like with other editing dialogs.  There is also a select control for the vertical justify which you can default to 'AnnotationVerticalJustify.TOP' (1), it can be changed to BOTTOM(3).  We don't need to specify a horizontal justification because the offset can be changed.  Text annotations are rendered in src/render/vex/vxNote.ts, just like chord and lyric.  In vxSystem.ts, updateLyricOffsets should be enhanced to also translate the annotation SVG element, just like with do with chords and lyrics.  Basically, exactly like lyric except 1) we don't go from note to note, 2) you can specify font and offset on each individual annotation, it applies to selections only.  Like lyrics and chords, clicking on the annotation should bring up the dialog for the annotation."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a free-text annotation to selected notes (Priority: P1)

As a score editor user, I select one or more notes, choose "Annotation" from the Text menu, and get an editing session where I can type free text. When I finish editing, that text is attached to the selected note(s) and shows up on the rendered score above (or below) the note.

**Why this priority**: This is the core capability the whole feature exists to deliver — without it there is nothing to configure appearance for and nothing to click on.

**Independent Test**: Select a note with no existing annotation, choose "Annotation" from the Text menu, type some text, end the editing session, and confirm the text renders on the score near that note.

**Acceptance Scenarios**:

1. **Given** a single note with no existing annotation is selected, **When** the user chooses "Annotation" from the Text menu, **Then** an editing session opens with an empty text editor.
2. **Given** the annotation editing session is open and the user types text, **When** the user ends the editing session, **Then** the typed text is saved as an annotation on the selected note and appears on the rendered score.
3. **Given** multiple notes are selected, **When** the user chooses "Annotation" from the Text menu and types text, **Then** ending the editing session attaches that same annotation text to every note that was selected.
4. **Given** a note that already has an annotation is selected, **When** the user chooses "Annotation" from the Text menu, **Then** the editing session opens pre-loaded with that annotation's existing text rather than empty.
5. **Given** the annotation editing session is open, **When** the user clears all text and ends the editing session, **Then** the annotation is removed from the selected note(s).

---

### User Story 2 - Adjust an annotation's font, position, and vertical justification (Priority: P2)

As a score editor user, once I've finished typing an annotation's text, I want the dialog to switch to a non-editing mode where I can pick the font, nudge the annotation's horizontal and vertical pixel position, and choose whether it's justified above (top) or below (bottom) the note, so I can fine-tune how it looks without retyping the text.

**Why this priority**: Getting the text on the page (User Story 1) delivers the core value; adjusting its appearance is a secondary refinement that most annotations can go without, at least initially (using the system defaults).

**Independent Test**: Create an annotation, end the text-editing session, confirm the dialog switches to a non-editing view with font, X/Y offset, and vertical-justify controls, change each one, close the dialog, and confirm the rendered annotation reflects the new font, position, and justification.

**Acceptance Scenarios**:

1. **Given** the user has just finished an annotation's text-editing session, **When** editing ends, **Then** the dialog switches to a non-editing mode showing font, X offset, Y offset, and vertical-justify controls for that annotation.
2. **Given** the non-editing mode is open, **When** the user picks a different font, **Then** only that annotation's rendered text uses the new font; other annotations, lyrics, and chords are unaffected.
3. **Given** the non-editing mode is open, **When** the user changes the X and/or Y pixel offset, **Then** the annotation's rendered position on the score shifts by that amount, independent of any lyric or chord offsets on the same note.
4. **Given** the non-editing mode is open, **When** the user has not changed the vertical-justify control, **Then** it shows "Top" as the default selection and the annotation renders above the note.
5. **Given** the non-editing mode is open, **When** the user changes the vertical-justify control to "Bottom", **Then** the annotation renders below the note instead of above it.
6. **Given** an annotation was applied to multiple selected notes at once (User Story 1, Scenario 3), **When** the user adjusts font, offset, or vertical justify in the non-editing dialog, **Then** the change applies identically to the annotation on every one of those notes.

---

### User Story 3 - Reopen an existing annotation's dialog (Priority: P3)

As a score editor user, after an annotation already exists on a note, I want to select that note again and reopen the Annotation dialog from the Text menu so I can review or change its text, font, position, or justification later, without having to remember or re-create it from scratch.

**Why this priority**: Round-trip editing is important for a usable feature, but it depends on annotations already being creatable and configurable (User Stories 1-2); it's the natural follow-up rather than a launch blocker.

**Independent Test**: Create an annotation on a note and close the dialog, select that note again, reopen "Annotation" from the Text menu, confirm the dialog opens directly in non-editing mode showing the saved text's current font/offset/justify settings, and confirm choosing to edit the text again returns to the text-editing session pre-loaded with the existing text.

**Acceptance Scenarios**:

1. **Given** a note with an existing annotation is selected, **When** the user chooses "Annotation" from the Text menu, **Then** the dialog opens directly in non-editing mode showing that annotation's current font, offset, and vertical-justify settings (skipping the empty text-editing step).
2. **Given** the non-editing mode is showing an existing annotation, **When** the user chooses to edit the text again, **Then** the text-editing session reopens pre-loaded with the current annotation text.

---

### Edge Cases

- What happens when no note is selected and the user chooses "Annotation" from the Text menu? The menu option is unavailable (or takes no action) since there is nothing to attach the annotation to.
- What happens when a selection mixes notes that already have annotations with notes that don't? The dialog seeds its starting text/settings from the first selected note (using its existing annotation if present, otherwise empty/default settings), and ending the session applies that same result to every selected note, overwriting any prior annotation on the others.
- What happens if the user ends the text-editing session without changing anything on a note that already had an annotation? The existing annotation is left as-is.
- What happens when an annotation and a lyric or chord both exist on the same note? Each renders and repositions independently, using its own font and X/Y offset; moving one does not move the others.
- What happens when a score containing no annotations (including scores saved before this feature existed) is loaded? It loads and renders exactly as before, with no errors and no annotations present.
- What happens when an annotation's text is very long or contains line breaks? It is preserved and rendered the same way the existing lyric/chord text already handles long or multi-line text.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Text menu MUST offer an "Annotation" action that is available whenever one or more notes are selected.
- **FR-002**: Choosing the "Annotation" action MUST open a text-editing session for the annotation on the selected note(s), pre-loaded with the existing annotation text if the (first) selected note already has one, or empty otherwise.
- **FR-003**: Ending the text-editing session MUST save the entered text as the annotation on every note that was selected when the action was invoked; if the entered text is empty, any existing annotation on those notes MUST be removed instead.
- **FR-004**: After the text-editing session ends (and an annotation remains), the dialog MUST switch to a non-editing mode offering: a font selector, a horizontal (X) pixel offset control, a vertical (Y) pixel offset control, and a vertical-justify selector.
- **FR-005**: The vertical-justify selector MUST offer "Top" and "Bottom" choices, defaulting to "Top" for a newly created annotation.
- **FR-006**: Changes made in the non-editing mode (font, X offset, Y offset, vertical justify) MUST apply to the annotation(s) that were created or loaded in that dialog session, without affecting lyrics, chords, or other annotations elsewhere in the score.
- **FR-007**: Reopening the "Annotation" action on a note that already has an annotation MUST open directly in non-editing mode showing that annotation's current settings, with an option to return to text-editing to change the text.
- **FR-008**: The rendered score MUST display each note's annotation (when present) positioned using that annotation's own font, X/Y offset, and vertical-justify setting, independently of any lyric or chord on the same note.
- **FR-009**: Dragging or otherwise repositioning a note/measure that shifts lyrics and chords on the score MUST likewise shift any annotation present, keeping it visually attached to its note.
- **FR-010**: A score saved with one or more annotations MUST reload with those annotations' text, font, offset, and vertical-justify settings intact.
- **FR-011**: A score saved before this feature existed (with no annotation data) MUST load and render without errors or unintended annotations, exactly as it did before.
- **FR-012**: Selecting a note and using the existing note-selection mechanism, followed by the "Annotation" Text menu action, is the supported way to open an annotation's dialog; no separate direct-click handler on the rendered annotation text is required.

### Key Entities

- **Text Annotation**: Free-form text attached to a note, independent of lyrics and chords though stored using the same underlying representation. Attributes: text content, font, horizontal (X) pixel offset, vertical (Y) pixel offset, vertical-justify setting (Top or Bottom, default Top). Exactly one annotation may exist per note.
- **Note Selection**: The set of one or more notes selected at the moment the "Annotation" Text menu action is invoked; determines which notes an annotation-editing session is created for or applied to.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can add a text annotation to a note and see it rendered on the score in under 15 seconds from choosing the Text menu action.
- **SC-002**: 100% of annotations created, styled (font/offset/justify), saved, and reloaded retain their exact text and appearance settings.
- **SC-003**: Adjusting an annotation's font, offset, or vertical justify never changes the appearance or position of any lyric, chord, or other annotation on the same or any other note.
- **SC-004**: Scores created before this feature existed continue to load and render with 0 errors and 0 unexpected annotations.
- **SC-005**: When an annotation is applied to a multi-note selection, 100% of the selected notes end up with identical annotation text, font, offset, and justify settings.

## Assumptions

- Exactly one annotation can exist per note (unlike lyrics, which support multiple numbered verses); a new "Annotation" action always edits that single annotation rather than adding another alongside it.
- When multiple notes are selected, there is a single shared editing session (no per-note next/previous navigation, unlike the lyric editor); the resulting text, font, offset, and vertical-justify settings are applied identically to every selected note. If the selection mixes notes with and without an existing annotation, the session starts from the first selected note's current annotation (or empty/default if it has none).
- Font and X/Y-offset changes made in the annotation dialog affect only the annotation instance(s) being edited in that session, not a score-wide default (unlike the existing lyric dialog's font picker, which changes the font for all lyrics in the score).
- The vertical-justify control exposes only "Top" and "Bottom"; no horizontal-justify control is needed since horizontal position is already adjustable via the X pixel offset.
- Opening an annotation's dialog is done by selecting its note (via the existing note-selection mechanism used throughout the score editor) and then choosing "Annotation" from the Text menu — the same pattern lyrics and chords already use today. No new click-to-open handler on the rendered annotation glyph itself is in scope for this feature.
- An annotation renders above or below its note per the vertical-justify setting, similarly to how chords and lyrics already render relative to notes, using each annotation's own font and offset rather than any score-wide styling.
