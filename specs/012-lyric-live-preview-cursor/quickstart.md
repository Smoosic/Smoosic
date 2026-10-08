# Quickstart: Validating Lyric Editor Live Preview and Position Cursor

This project has no wired automated test runner (`npm test` is a no-op). Validation is manual, against the dev/demo score app, following the acceptance scenarios in [spec.md](./spec.md). This builds directly on `010-vue-lyric-dialog` and `011-lyric-editor-auto-advance` — the Lyric Editor is already wired into the real "Lyrics" menu option (`src/ui/menus/text.ts`), so no temporary call-site wiring is needed this time.

## Prerequisites

- Node deps installed (`npm install`, if not already).
- Branch `012-lyric-live-preview-cursor` checked out.
- A score with at least a few consecutive notes on one staff, some with existing lyrics and some without.

## Build & Run

```sh
npm run build
npm run server
```

Then open the served app in a browser, load or create a score meeting the prerequisite above, select a note, and open the Lyric Editor (Notes menu → Lyrics).

## Validation Scenarios

Each maps to an Acceptance Scenario in [spec.md](./spec.md).

### 1. Position marker on a note with no lyric yet (User Story 1, P1)

1. Select a note with no lyric for the active verse and open the Lyric Editor.
2. **Expect**: edit mode opens automatically (per `010`) and a subtle thin vertical line appears on the score near that note's position — not overlapping any notation (FR-001, FR-002).

### 2. Position marker on a note with existing text (User Story 1, P1)

1. Select a note that already has lyric text for the active verse and open the Lyric Editor.
2. **Expect**: the marker appears at the end of that existing text's rendered position, not covering the text itself (FR-003).

### 3. Marker follows navigation (User Story 1, P1)

1. With the Lyric Editor open, use the next-note arrow (or type `-`/Space per `011`) to move across a few notes, some with and some without existing lyrics.
2. **Expect**: the marker moves to each newly active note every time, positioned per the same near-note/end-of-text rule (FR-004).
3. Switch to the dialog's other mode ("Done Editing Lyrics").
4. **Expect**: the marker disappears from the score (FR-005).
5. Click "Edit Lyrics" to resume editing.
6. **Expect**: the marker reappears at the current note's position.
7. Click OK (or Cancel) to close the dialog entirely.
8. **Expect**: the marker is gone from the score.

### 4. Live text preview while typing (User Story 2, P2)

1. Open the Lyric Editor on a note, type a few characters, then pause (do not press Enter/navigate).
2. **Expect**: shortly after pausing (well under a second), the score updates near that note to show the typed text so far (FR-006, SC-002).
3. Keep typing more characters without long pauses.
4. **Expect**: the score does not update on every keystroke — only after brief pauses — and typing itself feels unaffected (no lag, no lost keystrokes, no cursor jump inside the text box) (FR-007, FR-008).
5. Select all the typed text and delete it, then pause.
6. **Expect**: the previewed text on the score clears/reverts to match (empty) after the next update.

### 5. Persistence timing is unchanged (FR-009)

1. Type a lyric, let the preview show it on the score, then click Cancel (without navigating away first).
2. **Expect**: the result matches `010-vue-lyric-dialog` quickstart.md §5 — the previewed text is exactly what ends up persisted, since the preview write and the "real" commit are the same operation; there is no separate draft state to discard.

### 6. Marker does not interfere with dialog-mode controls

1. Switch to the dialog's other mode and confirm the Verse, Y Adjustment, and Font controls work exactly as in `010-vue-lyric-dialog` quickstart.md §4, with no marker visible while in that mode.

## Regression check against `010`/`011`

Re-run `specs/010-vue-lyric-dialog/quickstart.md` §1-§5 and `specs/011-lyric-editor-auto-advance/quickstart.md` §1-§5 in full and confirm every scenario still passes unchanged — this feature should be purely additive (a marker plus a more frequent version of the same score write), with no behavioral change to navigation, deletion, mode toggling, or the auto-advance triggers.
