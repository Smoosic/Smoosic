# Feature Specification: Lyric Editor Live Preview and Position Cursor

**Feature Branch**: `012-lyric-live-preview-cursor`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "enhance the lyric dialog to show a preview of the text as the user is typing, and also to show a cursor near where the lyric is. When first creating a lyric, there is no visual indicator for which note we are editing, so we need a subtle cursor (vertical line) near where the lyric is, or the at the end of the existing lyric. When the user types, periodically show the current text in the text editor so the user can see what it looks like in-place."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See which note is currently being edited (Priority: P1)

As a score editor user opening the Lyric Editor, I want to see a subtle marker on the score itself showing exactly which note I'm currently editing a lyric for — especially when that note has no lyric yet — so I never lose track of my editing position on the page.

**Why this priority**: Without any indicator, a note with no existing lyric gives the user nothing to look at on the score while the dialog is open; this is the most basic orientation problem the feature solves, and it applies from the very first note edited in a session.

**Independent Test**: Select a note with no lyric yet and open the Lyric Editor. Verify a subtle marker appears on the score near that note. Select a note that already has lyric text and open the Lyric Editor; verify the marker appears at the end of that existing text instead. Navigate to another note while still editing and verify the marker moves with it.

**Acceptance Scenarios**:

1. **Given** a note with no existing lyric for the active verse is selected, **When** the Lyric Editor opens (edit mode), **Then** a subtle cursor-like marker appears on the score near that note's position.
2. **Given** a note that already has lyric text for the active verse, **When** the Lyric Editor opens (edit mode), **Then** the marker appears at the end of that existing text rather than covering it.
3. **Given** editing is in progress on one note, **When** the user navigates to a different note (via the next/previous controls or the hyphen/space auto-advance), **Then** the marker moves to the newly active note, positioned per the same rule (near the note if it has no text yet, or at the end of its existing text).
4. **Given** the marker is showing, **When** the user finishes editing (switches to the dialog's other mode) or closes the dialog, **Then** the marker is removed from the score.

---

### User Story 2 - See the in-progress lyric text on the score while typing (Priority: P2)

As a score editor user typing a lyric, I want the score itself to periodically show my in-progress text near the note, not just inside the dialog's text box, so I can judge how it actually looks in context — spacing, length, overlap with neighboring notes — before I move on.

**Why this priority**: This adds confidence and reduces back-and-forth guessing, but it builds on top of already knowing where you are (User Story 1) and typed text is already visible inside the dialog's own editor regardless, so this is a secondary, in-context confirmation rather than the primary need.

**Independent Test**: Open the Lyric Editor on a note, type several characters, and — without navigating away or finishing editing — observe that the score's rendering near that note updates to show the text typed so far, appearing shortly after typing pauses rather than on every keystroke.

**Acceptance Scenarios**:

1. **Given** the plain-text editor is open and the user is typing, **When** the user pauses briefly, **Then** the score updates near the current note to show the in-progress text.
2. **Given** the user is typing continuously, **When** several keystrokes occur in quick succession, **Then** the score preview updates periodically rather than after every single keystroke.
3. **Given** the in-progress preview is showing on the score, **When** the user keeps typing, **Then** typing in the dialog's editor is never interrupted, slowed, or loses its place because of the preview updating.
4. **Given** the user deletes previously-typed text back to empty, **When** the preview next updates, **Then** the previewed text on the score is cleared to match.

---

### Edge Cases

- Holding down a key or typing very quickly does not cause visible flicker, lag, or a growing backlog of preview updates on the score — updates are periodic/throttled, not one-per-keystroke (User Story 2, Scenario 2).
- A note with no lyric yet, left with no text typed before the user navigates away, shows no previewed text at any point (nothing was ever typed) and, per prior lyric-editor behavior, no lyric is persisted for it either — only the position marker was ever visible for that note.
- The position marker is visually distinct from, and must not be confused with, the application's existing note/measure selection highlighting.
- Switching verse in the dialog's other mode and then resuming editing repositions the marker (and any subsequent preview) according to the newly selected verse's existing text for the current note.
- The marker and the in-progress preview are shown only while the plain-text editor is active; neither appears while the dialog is showing its other (Verse/Y Adjustment/Font) controls.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: While the Lyric Editor's plain-text editor is active, the system MUST display a subtle, non-intrusive position marker on the score at the location associated with the note currently being edited.
- **FR-002**: If the current note has no existing lyric text for the active verse, the marker MUST appear near that note's position.
- **FR-003**: If the current note has existing lyric text for the active verse, the marker MUST appear at the end of that existing text rather than obscuring it.
- **FR-004**: The marker MUST move to reflect the newly active note whenever the user navigates to a different note while remaining in the plain-text editor.
- **FR-005**: The marker MUST be removed from the score when the plain-text editor is no longer active (the dialog switches to its other mode) or the dialog is closed.
- **FR-006**: While the user is typing in the plain-text editor, the system MUST periodically update the score's rendering of the current note's lyric to reflect the in-progress text, so it is visible in place before editing is finished.
- **FR-007**: The periodic score update from FR-006 MUST be throttled/debounced rather than triggered on every keystroke.
- **FR-008**: The periodic preview update MUST NOT interrupt or interfere with continued typing in the plain-text editor.
- **FR-009**: This feature MUST NOT change when lyric text is actually persisted (navigating, finishing editing, or closing the dialog, as already established) — the in-progress preview is visual only.

### Key Entities

- **Lyric**: The text line attached to a specific note for the active verse, as established in the Vue-based Lyric Editor dialog — this feature adds visual, in-progress feedback about it, without changing its stored shape or when it is saved.
- **Current Note Selection**: The note the lyric editor is positioned on; drives where the position marker and any in-progress preview appear.
- **Position Marker**: A new, purely visual, non-persisted indicator on the score showing where the current lyric is being edited — near the note if it has no text yet, or at the end of its existing text otherwise.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: While the plain-text editor is active, a user can identify which note is currently being edited at a glance, without having typed anything, every time.
- **SC-002**: A user typing a lyric sees their in-progress text rendered on the score, in place, within about half a second of pausing.
- **SC-003**: Typing continuously for several seconds produces no visible flicker, lag, or interruption in either the dialog's editor or the score preview.
- **SC-004**: After navigating between notes while editing, the marker (and, once text exists, the previewed text) is always positioned on the currently active note, never left behind on a note the user has moved away from.

## Assumptions

- "Subtle" means a small, low-visual-weight marker (e.g., a thin vertical line resembling a text caret) that does not obscure notation or existing lyric text — not a highlighted box or a bright/attention-grabbing color.
- "Periodically" means a short pause-triggered delay (on the order of a few hundred milliseconds) after typing activity, consistent with how the application already handles in-progress text preview elsewhere, rather than a fixed timer unrelated to typing.
- This feature is a visual/UX layer on top of the existing Vue-based Lyric Editor dialog and its auto-advance behavior; it does not alter the dialog's existing commit timing, navigation behavior, or persisted data.
- The marker and in-progress preview apply only while the plain-text editor itself is active; they are not shown while the dialog's Verse/Y Adjustment/Font controls are showing.
- No project constitution has been ratified beyond the existing high-level principles already noted in prior specs; this feature stays entirely within the UI/rendering layer already established for this dialog.
