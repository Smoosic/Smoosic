# Feature Specification: Text Editor Autofocus on Open

**Feature Branch**: `014-editor-autofocus`

**Created**: 2026-09-13

**Status**: Draft

**Input**: User description: "for the components that use tip-tap editor, chordEditor.vue, lyricEditor.vue and textGroupEditor.vue, the focus should be moved to the text editor when the dialog is opened."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start typing immediately when a dialog opens directly into editing (Priority: P1)

As a score editor user, when I open the Lyric Editor, Chord Symbol, or Score Text dialog and its text-entry editor is shown right away, I want my keyboard input to go straight into that editor, so I can start typing the lyric, chord symbol, or text block without first having to click into the editor myself.

**Why this priority**: This is the core, explicitly requested behavior and applies to the most common path through each of these three dialogs (the Lyric Editor and Chord Symbol dialogs always open directly into their text editor; the Score Text dialog opens directly into its text editor whenever the text block has not yet been edited).

**Independent Test**: Select a note with no lyric yet and open the Lyric Editor dialog; without clicking anywhere, type a character and confirm it appears in the editor. Repeat for the Chord Symbol dialog on a note with no chord symbol yet, and for the Score Text dialog when adding a brand-new text block.

**Acceptance Scenarios**:

1. **Given** no dialog is currently open, **When** the user opens the Lyric Editor dialog, **Then** keyboard focus is already in the lyric text editor, so typing a character immediately inserts it there with no prior click.
2. **Given** no dialog is currently open, **When** the user opens the Chord Symbol dialog, **Then** keyboard focus is already in the chord text editor, so typing a character (including one of the recognized shortcut characters) immediately takes effect with no prior click.
3. **Given** no dialog is currently open, **When** the user opens the Score Text dialog to add a new text block, **Then** keyboard focus is already in the text block editor, so typing a character immediately inserts it there with no prior click.

---

### User Story 2 - Focus returns to the editor when resuming editing later in the same dialog session (Priority: P2)

As a score editor user, after I've switched a dialog away from its text editor (for example, to adjust the Lyric Editor's Verse/Font controls, the Chord Symbol dialog's Ordinality/Font controls, or the Score Text dialog's position/font controls) and then switch back into editing, I want keyboard focus to land in the editor again automatically, so every time the editor becomes the active view I can start typing right away, not just the first time the dialog opened.

**Why this priority**: This extends the same underlying fix to every point in a dialog's lifetime where its editor (re)appears, not only the very first moment the dialog opens; it's a secondary but natural extension of User Story 1's fix, using the same mechanism.

**Independent Test**: Open the Lyric Editor, switch to its non-editing controls (mark editing complete), then switch back into editing; without clicking, type a character and confirm it lands in the editor. Repeat for the Chord Symbol dialog's equivalent mode toggle, and for the Score Text dialog's equivalent transitions (e.g., finishing a drag-move and returning to editing).

**Acceptance Scenarios**:

1. **Given** the Lyric Editor dialog is showing its non-editing (Verse/Font) controls, **When** the user switches back into editing, **Then** keyboard focus is already in the lyric text editor.
2. **Given** the Chord Symbol dialog is showing its non-editing (Ordinality/Font/Adjust Width) controls, **When** the user switches back into editing, **Then** keyboard focus is already in the chord text editor.
3. **Given** the Score Text dialog is not currently showing its text editor (its non-editing or moving controls are shown instead), **When** the user switches back into editing, **Then** keyboard focus is already in the text block editor.

---

### Edge Cases

- If the Score Text dialog opens on a text block that has already been edited before (so it opens into its non-editing view rather than directly into the editor), no editor is visible at open, so there is nothing to focus at that moment; focus moves to the editor only once the user switches into editing (User Story 2).
- Autofocusing the editor on open must not steal focus away if the user has already clicked somewhere else in the dialog before the editor finishes mounting; in practice, on-open autofocus happens as part of the dialog opening and completes before the user can interact, so this is not expected to occur in normal use.
- Moving focus into the editor on open must not select or highlight any existing text in the editor as a side effect; the text cursor lands in the editor (at the end of any existing content) without pre-selecting it.
- This behavior is about keyboard focus only; it does not change what mode a dialog opens into, which controls are visible, or any other existing behavior of these three dialogs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Whenever the Lyric Editor dialog's text editor becomes the visible, active control (including immediately when the dialog opens, since it always opens directly into editing), the system MUST move keyboard focus into that text editor automatically.
- **FR-002**: Whenever the Chord Symbol dialog's text editor becomes the visible, active control (including immediately when the dialog opens, since it always opens directly into editing), the system MUST move keyboard focus into that text editor automatically.
- **FR-003**: Whenever the Score Text dialog's text editor becomes the visible, active control (including immediately when the dialog opens, for a text block that has not yet been edited), the system MUST move keyboard focus into that text editor automatically.
- **FR-004**: Automatic focus MUST place the text cursor in the editor without selecting or highlighting any of its existing content.
- **FR-005**: This behavior MUST NOT change which mode any of the three dialogs opens into, which controls are visible in any mode, or any other existing functional behavior of these dialogs - it is limited to where keyboard focus lands when the already-existing editor becomes visible.

### Key Entities

- **Text Editor**: The rich-text editing surface within each of the three dialogs (Lyric Editor, Chord Symbol, Score Text) where the user types the lyric, chord symbol, or text block content.
- **Dialog Mode**: The active view within a dialog (e.g., editing vs. its other view(s)) that determines whether the text editor is currently visible; autofocus is triggered by the editor becoming visible under this state, not by the dialog opening per se.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can open the Lyric Editor, Chord Symbol, or Score Text dialog (in the case where it opens directly into editing) and begin typing immediately, with zero additional clicks needed to place focus in the editor, every time.
- **SC-002**: A user switching any of the three dialogs back into its editing view can begin typing immediately afterward, with zero additional clicks needed, every time.
- **SC-003**: No existing text in the editor is ever selected or altered as a result of this automatic focus change.

## Assumptions

- "When the dialog is opened" is read as "whenever the dialog's text editor becomes the visible, active view," since two of the three dialogs (Lyric Editor, Chord Symbol) always show their editor immediately on open, while the third (Score Text) only does so conditionally (a text block that hasn't been edited yet); treating the trigger as "editor becomes visible" gives a single, consistent rule that correctly covers the immediate-open case for all three and naturally extends to the same behavior every time the user returns to editing later in a dialog's session (User Story 2), rather than leaving that a special case with a different, inconsistent feel.
- This is a UI/UX-only change to keyboard focus handling; it does not add, remove, or reorder any dialog controls, and does not change what data is loaded, saved, or displayed.
- No project constitution has been ratified beyond the existing high-level principles already noted in prior specs; this feature stays entirely within the UI dialog layer already established for these three components.
