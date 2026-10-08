# Feature Specification: Vue-Based Chord Change Dialog

**Feature Branch**: `013-vue-chord-dialog`

**Created**: 2026-09-13

**Status**: Draft

**Input**: User description: "update the legacy chord dialog in src/ui/dialogs/chordChange.ts to use a vue dialog, similar to how we did for the lyric dialog in specs 10-12. With chord changes, the text editor behaves a little differently. We mix characters from the music font with characters from the text font, in a way that may not be fully compatible with tip-tap. It's OK if the chord changes don't look exactly the same in the editor, as long as we update the actual chord change in the music periodically. In the editing dialog, there are a couple of extra dropdowns - one for symbols and one for superscript/subscript. The symbols dropdown supports Bravura font characters for 'csymDiminished', 'csymHalfDiminished','csymDiagonalArrangementSlash','csymMajorSeventh'. Entering the characters 'b' or '#' in the editor inserts the accidentalSharp or accidentalFlat, characters '+' and '-' add 'csymAugmented' and 'csymMinor', parenthesis use 'csymParensLeftTall' and 'csymParensRightTall', and '/' inserts 'csymDiagonalArrangementSlash'"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enter or edit a chord symbol as text with music-glyph shortcuts (Priority: P1)

As a score editor user, when I open the Chord Symbol dialog on a selected note, an edit mode opens automatically with a text-editing surface pre-loaded with that note's current chord symbol (or empty, if none), so I can type or correct the chord symbol directly, with common notation shortcuts (flat, sharp, augmented, minor, tall parentheses, slash) available as I type.

**Why this priority**: Entering and editing chord symbol text is the dialog's core purpose; every other capability exists to support this workflow.

**Independent Test**: Select a note, open the Chord Symbol dialog, confirm edit mode opens automatically with the note's existing chord symbol (if any), type a chord name including one of `b`, `#`, `+`, `-`, `(`, `)`, `/`, end the editing session, and confirm the note's rendered chord symbol on the score shows the corresponding music-font glyph (accidental flat/sharp, augmented, minor, tall left/right parenthesis, diagonal slash) in place of the typed character.

**Acceptance Scenarios**:

1. **Given** a note with an existing chord symbol selected, **When** the user opens the Chord Symbol dialog, **Then** edit mode starts automatically with the text editor showing that chord symbol's current text.
2. **Given** the text editor is open and the user types a letter/number chord name (e.g. "C", "7"), **When** the user ends the editing session, **Then** the note's chord symbol text is updated to match what was typed.
3. **Given** the text editor is open, **When** the user types `b` or `#`, **Then** the corresponding accidental (flat or sharp) music glyph is used for that chord symbol once the score is next updated, in place of the literal letter/character.
4. **Given** the text editor is open, **When** the user types `+`, `-`, `(`, `)`, or `/`, **Then** the corresponding music glyph (augmented, minor, tall left parenthesis, tall right parenthesis, or diagonal arrangement slash) is used for that chord symbol once the score is next updated, in place of the literal character.
5. **Given** a note with no chord symbol yet, **When** the user opens the dialog, **Then** the editor opens empty and ready for input.

---

### User Story 2 - See the chord symbol update on the score as you type (Priority: P2)

As a score editor user, while I'm typing a chord symbol - including the shortcut characters that become music glyphs - I want the score itself to periodically reflect what I've entered so far, so I can confirm the chord looks right in place without having to finish editing first. The dialog's own text box does not need to render the music-font glyphs pixel-perfectly while I type; what matters is that the note's actual chord symbol on the score is kept in sync.

**Why this priority**: This gives the user confidence that shortcut characters are being interpreted correctly, but the ability to enter and eventually commit text (User Story 1) is the more fundamental capability.

**Independent Test**: Open the Chord Symbol dialog on a note, type a chord name containing at least one shortcut character (e.g. "Cbm7"), pause without navigating away or finishing editing, and confirm the note's chord symbol as rendered on the score updates to the current in-progress text (with shortcut characters shown as their music glyphs), appearing shortly after typing pauses rather than on every keystroke.

**Acceptance Scenarios**:

1. **Given** the text editor is open and the user is typing, **When** the user pauses briefly, **Then** the score updates the current note's chord symbol to show the in-progress text, rendering any shortcut characters typed so far as their corresponding music glyphs.
2. **Given** the user is typing continuously, **When** several keystrokes occur in quick succession, **Then** the score update happens periodically rather than after every single keystroke, and typing in the dialog's own editor is never interrupted or slowed by it.
3. **Given** the user deletes previously-typed text back to empty, **When** the preview next updates, **Then** the chord symbol shown on the score is cleared to match.

---

### User Story 3 - Insert a symbol or toggle superscript/subscript from a dropdown (Priority: P3)

As a score editor user editing a chord symbol, I can pick a symbol (diminished, half-diminished, diagonal slash, or major seventh) from a dedicated dropdown to insert it at my current position, and I can pick superscript, subscript, or normal from a second dropdown - or type the `^`/`%` keyboard shortcuts - to control how subsequently-typed characters are positioned, so I can build chord symbols that combine ordinary text with these music-font glyphs and vertical text positioning without always reaching for the dropdown.

**Why this priority**: These are secondary, occasionally-needed entry aids on top of the core typing workflow (User Story 1); most chord symbols can be typed using ordinary characters and the `b`/`#`/`+`/`-`/`(`/`)`/`/` shortcuts alone.

**Independent Test**: Open the Chord Symbol dialog, select each of the four symbol options from the Symbols dropdown one at a time and confirm each is inserted into the chord symbol at the current position; separately, select Superscript (or Subscript) from the text-position dropdown, type additional characters, and confirm those characters render smaller and raised (or lowered) relative to the surrounding text once the score updates, while text typed before the change is unaffected; separately, type `^` and `%` directly in the editor and confirm each toggles the typing text-position the same way the dropdown does, without inserting the `^`/`%` character itself.

**Acceptance Scenarios**:

1. **Given** the text editor is open, **When** the user selects "Dim", "Half dim", "Slash", or "Maj7" from the Symbols dropdown, **Then** the corresponding music glyph (`csymDiminished`, `csymHalfDiminished`, `csymDiagonalArrangementSlash`, or `csymMajorSeventh`) is inserted into the chord symbol at the editor's current position.
2. **Given** the text editor is open, **When** the user selects "Superscript" or "Subscript" from the text-position dropdown, **Then** characters subsequently typed are marked to render in that raised/lowered, smaller style once the score updates; previously-typed characters are unaffected.
3. **Given** text is currently marked superscript or subscript, **When** the user selects "Normal" from the text-position dropdown, **Then** subsequently-typed characters return to normal positioning.
4. **Given** the text editor is open and the typing text-position is currently Normal, **When** the user types `^`, **Then** the typing text-position becomes Subscript (and the `^` character is not inserted as text); **When** the user then types `^` again, **Then** it returns to Normal.
5. **Given** the text editor is open and the typing text-position is currently Normal, **When** the user types `%`, **Then** the typing text-position becomes Superscript (and the `%` character is not inserted as text); **When** the user then types `%` again, **Then** it returns to Normal.
6. **Given** the typing text-position is currently Superscript, **When** the user types `^`, **Then** it switches directly to Subscript (not to Normal); **Given** the typing text-position is currently Subscript, **When** the user types `%`, **Then** it switches directly to Superscript.

---

### User Story 4 - Move between notes and delete a chord symbol while editing (Priority: P4)

As a score editor user, while the text editor is open, I can use next/previous controls to move to the adjacent note in the score (saving the current chord symbol as I go), and a delete control to remove the current note's chord symbol entirely, so I can enter or clear chord symbols across a passage without closing and reopening the dialog for each note.

**Why this priority**: Multi-note navigation and deletion are useful workflow accelerators, matching the existing lyric editor's equivalent controls, but they are secondary to entering a single chord symbol's text and shortcuts (User Stories 1-3).

**Independent Test**: Open the Chord Symbol dialog on a note, type a chord symbol, click the "next note" arrow, confirm the current note's chord symbol was saved and the editor now shows the next note's chord symbol (or empty); click the delete control and confirm the current note's chord symbol is removed and the editor advances to the next note; repeat navigation with the "previous note" arrow and confirm navigating past the first or last note in the score has no effect.

**Acceptance Scenarios**:

1. **Given** the text editor is open on a note with typed text, **When** the user activates the "next note" arrow, **Then** the typed text is saved to the current note's chord symbol, the editor advances to the next note, and shows that note's existing chord symbol text (or empty).
2. **Given** the text editor is open, **When** the user activates the "previous note" arrow, **Then** the same save-then-move behavior occurs in the opposite direction.
3. **Given** the text editor is open on a note with chord symbol text, **When** the user clicks the delete control, **Then** that note's chord symbol is removed from the score and the editor advances to the next note.
4. **Given** the currently selected note is the first (or last) note in the score, **When** the user activates the "previous" (or "next") arrow, **Then** the editor stays on the current note and no error occurs.

---

### User Story 5 - Finish editing and adjust ordinality, position, font, and note width (Priority: P5)

As a score editor user, once I've finished typing a chord symbol, I can mark editing complete to switch to a dialog mode that shows the ordinality (chord line) selector, vertical (Y) position adjustment, font, and a note-width-adjustment toggle, so I can fine-tune how the chord line as a whole is presented.

**Why this priority**: These are line-level presentation settings, useful but secondary to the text-entry workflow that occupies most of a chord-editing session.

**Independent Test**: Open the Chord Symbol dialog, finish typing a chord symbol, mark editing complete, confirm the ordinality/Y-position/font/adjust-width controls appear (and the editor, symbol dropdown, text-position dropdown, navigation, and delete controls disappear), change each control, and confirm the underlying chord symbol or score setting updates accordingly. Confirm clicking back into edit mode restores the text editor and hides those controls again.

**Acceptance Scenarios**:

1. **Given** the text editor is open (edit mode), **When** the user clicks the "editing complete" control, **Then** the current note's text is saved, edit mode ends, and dialog mode appears showing Ordinality, Y Adjustment, Font, and Adjust Note Width controls populated from the current note's chord symbol and score settings.
2. **Given** dialog mode is showing, **When** the user changes the Ordinality selection, the Y Adjustment value, or the Font, **Then** the corresponding property of the current note's chord symbol is updated.
3. **Given** dialog mode is showing, **When** the user toggles Adjust Note Width, **Then** the score-wide chord-symbol note-width-adjustment setting is updated.
4. **Given** dialog mode is showing, **When** the user clicks the control to resume editing, **Then** the text editor reopens (edit mode) on the current note and the Ordinality/Y Adjustment/Font/Adjust Note Width controls are hidden again.

---

### Edge Cases

- Navigating (next/previous), deleting, inserting a symbol, or changing text position while not currently in edit mode has no effect, since those controls only exist within the editor and are not shown in dialog mode.
- Ordinality, Y Adjustment, Font, and Adjust Note Width cannot be changed while edit mode is active; they only become available once editing is marked complete, matching current behavior where these controls are hidden while the text editor is open.
- A character typed that is not one of the recognized shortcuts (`b`, `#`, `+`, `-`, `(`, `)`, `/`) or a recognized text-position toggle (`^`, `%`) is inserted as ordinary text, exactly as before.
- The `^`/`%` keyboard shortcuts and the Text Position dropdown are two ways of changing the same underlying typing text-position state; using one after the other picks up from whatever state the last change (by either means) left behind - e.g. selecting Superscript from the dropdown and then typing `^` switches directly to Subscript, per the same three-way toggle rule.
- Closing the dialog via OK or Cancel behaves identically: any active editing session is ended (saving the note currently being edited) and the dialog closes; chord symbol changes and deletions made while navigating between notes are already applied to the score as they happen, so there is no separate whole-session discard.
- Pressing Escape while the dialog is open ends any active edit session and closes the dialog, matching current behavior.
- Reopening the dialog on a different note always restarts edit mode automatically for that note, regardless of whether a prior session in this dialog had been marked complete.
- Holding down a key or typing very quickly does not cause visible flicker, lag, or a growing backlog of score updates - updates are periodic/throttled, not one-per-keystroke.
- The dialog's own text-editing surface is not required to visually render the music-font glyphs (accidentals, augmented/minor marks, tall parentheses, diagonal slash) exactly as they will appear on the score; showing a plain-text placeholder for these while editing is acceptable, as long as the note's actual chord symbol on the score reflects the correct glyphs once updated.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dialog MUST be implemented as a Vue component with a creation function following the established pattern used for other migrated dialogs (e.g., the Vue-based Lyric Editor, `010-vue-lyric-dialog`), replacing `SuiChordChangeDialog` (`src/ui/dialogs/chordChange.ts`) without modifying the legacy class or its call sites.
- **FR-002**: The dialog's control set MUST match the elements enumerated in `SuiChordChangeDialog.dialogElements`: Ordinality, Y Adjustment, the chord text editor, Symbols, Text Position, Font, and Adjust Note Width.
- **FR-003**: The Ordinality control MUST be implemented using the existing dropdown pattern, offering the three chord-line options defined today (labeled "1", "2", "3").
- **FR-004**: The Y Adjustment control MUST be implemented using the existing numeric-input component in place of the legacy rocker component, editing the chord symbol's vertical offset as an integer.
- **FR-005**: The chord text editing surface MUST be a new text-editing component built on the same underlying rich-text editing library used by the existing lyric and text-group editors.
- **FR-006**: While the chord text editor is active, typing `b` or `#` MUST cause the corresponding accidental (flat or sharp) music glyph to be used for the chord symbol once the score is next updated, in place of inserting the literal typed character as plain text.
- **FR-007**: While the chord text editor is active, typing `+`, `-`, `(`, or `)` MUST cause the corresponding music glyph (augmented, minor, tall left parenthesis, or tall right parenthesis) to be used for the chord symbol once the score is next updated, in place of inserting the literal typed character as plain text.
- **FR-008**: While the chord text editor is active, typing `/` MUST cause the diagonal-arrangement-slash music glyph to be used for the chord symbol once the score is next updated, in place of inserting the literal typed character as plain text.
- **FR-009**: Every other typed character MUST continue to be inserted into the chord symbol text exactly as before, with no unintended substitution or navigation. (`^` and `%` are not "other" characters - see FR-025/FR-026.)
- **FR-010**: The Symbols dropdown MUST offer exactly four options - "Dim" (`csymDiminished`), "Half dim" (`csymHalfDiminished`), "Slash" (`csymDiagonalArrangementSlash`), and "Maj7" (`csymMajorSeventh`) - and selecting one MUST insert the corresponding music glyph into the chord symbol at the editor's current position; this control MUST be available only in edit mode.
- **FR-011**: The Text Position dropdown MUST offer Superscript, Subscript, and Normal; selecting one MUST cause characters subsequently typed to be marked with that vertical text position once the score is next updated, without altering the position of characters already typed; this control MUST be available only in edit mode.
- **FR-012**: The Font control MUST edit the chord symbol's font family and size, following the same font-control pattern already used by other migrated dialogs, and MUST be available only in dialog mode (hidden while editing).
- **FR-013**: The Adjust Note Width control MUST be a toggle editing the score's chord-symbol note-width-adjustment setting, matching the legacy toggle's behavior, and MUST be available only in dialog mode (hidden while editing).
- **FR-014**: The dialog MUST have exactly two mutually exclusive modes: edit mode (the text editor, with Symbols, Text Position, next/previous-note, and delete controls) and dialog mode (Ordinality, Y Adjustment, Font, and Adjust Note Width controls, editor and its associated controls hidden).
- **FR-015**: A single toggle control MUST switch between modes: while in edit mode, activating it ends the editing session and switches to dialog mode; while in dialog mode, activating it starts an editing session and switches to edit mode - matching the legacy pencil/checkmark icon toggle behavior.
- **FR-016**: Opening the dialog MUST automatically enter edit mode and start an editing session for the currently selected note's chord symbol, regardless of whether a prior session had already completed editing.
- **FR-017**: The next/previous-note controls (available only in edit mode) MUST reuse the existing note-navigation behavior: saving the currently edited note's text, then moving the selection to the next or previous note in the score and loading that note's existing chord symbol (text, ordinality, font) into the editor and dialog state. Navigating past the first or last note in the score MUST leave the current note selected with no error.
- **FR-018**: The delete control (available only in edit mode) MUST remove the current note's chord symbol and then advance to the next note, reusing the existing chord-symbol-removal logic.
- **FR-019**: Switching from edit mode to dialog mode MUST commit the currently edited note's text to the score and populate the Ordinality, Y Adjustment, Font, and Adjust Note Width controls from the current note's chord symbol and score settings.
- **FR-020**: Changing Ordinality, Y Adjustment, or Font while in dialog mode MUST update the corresponding property (chord-line assignment, vertical offset, font family/size) of the current note's chord symbol; changing Adjust Note Width MUST update the score-wide setting.
- **FR-021**: While the user is typing in the text editor, the system MUST periodically update the score's rendering of the current note's chord symbol to reflect the in-progress text (including shortcut-character and dropdown-inserted glyphs), so it is visible in place before editing is finished. This update MUST be throttled/debounced rather than triggered on every keystroke, and MUST NOT interrupt or interfere with continued typing in the editor.
- **FR-022**: The chord text editor's own visual rendering is NOT required to display the music-font glyphs (accidentals, augmented/minor marks, tall parentheses, diagonal slash, superscript/subscript) exactly as they appear on the score; a plain-text representation within the editor is acceptable, provided the periodic score update (FR-021) and the final committed chord symbol (FR-006 through FR-011) reflect the correct glyphs and text positioning.
- **FR-023**: Both OK and Cancel MUST end any active editing session (saving the note currently being edited) and close the dialog; chord symbol changes and deletions made while navigating between notes remain applied, matching current behavior.
- **FR-024**: The dialog MUST be dismissible via the Escape key, which ends any active editing session before closing, matching current behavior.
- **FR-025**: While the chord text editor is active, typing `^` MUST toggle the typing text-position between Subscript and its current state, without inserting the `^` character as literal text: from Normal it becomes Subscript; from Subscript it returns to Normal; from Superscript it switches directly to Subscript. This is an alternate, keyboard-driven way to reach the same states the Text Position dropdown (FR-011) controls, not a separate state.
- **FR-026**: While the chord text editor is active, typing `%` MUST toggle the typing text-position between Superscript and its current state, without inserting the `%` character as literal text: from Normal it becomes Superscript; from Superscript it returns to Normal; from Subscript it switches directly to Superscript. This is an alternate, keyboard-driven way to reach the same states the Text Position dropdown (FR-011) controls, not a separate state.

### Key Entities

- **Chord Symbol**: The chord text line attached to a specific note - its content (including music-font glyph segments and superscript/subscript-marked runs), ordinality (chord line), vertical offset, and font (family, size).
- **Current Note Selection**: The note the dialog is currently positioned on; changes as the user navigates with the next/previous controls, driving which chord symbol is loaded into the editor and dialog controls.
- **Note-Width Adjustment Setting**: A score-wide setting indicating whether note spacing is widened to accommodate chord symbol text; edited only from dialog mode.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can open the Chord Symbol dialog on any note, enter or edit its chord text - including any combination of the `b`, `#`, `+`, `-`, `(`, `)`, `/` shortcuts and the Symbols/Text Position dropdowns - and save it with no user-visible functional regression in the resulting score rendering compared to the current dialog.
- **SC-002**: A user can enter chord symbols across an entire consecutive run of notes using only the next/previous controls, without closing and reopening the dialog.
- **SC-003**: While edit mode is active, none of the Ordinality, Y Adjustment, Font, or Adjust Note Width controls are visible or interactive, and while dialog mode is active, none of the text editor, Symbols, Text Position, next/previous, or delete controls are visible or interactive.
- **SC-004**: A user typing a chord symbol sees the note's actual chord symbol update on the score, with shortcut characters and dropdown insertions rendered as the correct music glyphs, within about half a second of pausing.
- **SC-005**: Typing continuously for several seconds produces no visible flicker, lag, or interruption in either the dialog's editor or the score update.
- **SC-006**: A user can complete a full open-edit-toggle-adjust-save cycle without encountering any control built on the dialog's legacy custom-component base classes.

## Assumptions

- This is an internal architectural migration (legacy custom dialog components to Vue), not a change to end-user-visible chord-symbol capabilities. `SuiChordChangeDialog` and its call sites remain unchanged until the new dialog is verified; wiring callers over to it is a separate, later change and out of scope here.
- The rich-text editing library used for the chord editor cannot be assumed to natively mix the music font's glyph characters with the surrounding text font inline; per the feature description, the dialog's own editing surface may show a simplified plain-text stand-in for glyph and superscript/subscript segments while editing, as long as the note's actual chord symbol on the score is kept correct and current through the same periodic/debounced update mechanism already established for the Lyric Editor's live preview (`012-lyric-live-preview-cursor`).
- The click-to-position-cursor mouse handling present in the legacy dialog (positioning the text cursor by clicking within the rendered SVG chord symbol) is superseded by the new editor's own native text-cursor handling, matching how the Lyric Editor migration (`010-vue-lyric-dialog`) superseded the equivalent legacy lyric mouse handling.
- The Font control is restricted to family and size, matching the legacy dialog's font behavior, which always applies a fixed 'normal' weight.
- The Ordinality dropdown offers exactly three fixed options (labeled 1 through 3), matching the legacy dialog's configured options.
- No project constitution has been ratified yet, so no additional project-specific principles apply beyond the existing Vue dialog conventions already established in the codebase (e.g., `src/ui/dialogs/*.ts` creation functions paired with `src/ui/components/dialogs/*.vue` components).
