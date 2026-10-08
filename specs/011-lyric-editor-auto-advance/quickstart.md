# Quickstart: Validating Lyric Editor Auto-Advance

This project has no wired automated test runner (`npm test` is a no-op). Validation is manual, against the dev/demo score app, following the acceptance scenarios in [spec.md](./spec.md). This builds directly on the Vue-based Lyric Editor dialog from `010-vue-lyric-dialog` — see that feature's `quickstart.md` Prerequisites for how to temporarily wire `SuiLyricDialogVue` into a call site for manual testing.

## Prerequisites

- Node deps installed (`npm install`, if not already).
- Branch `011-lyric-editor-auto-advance` checked out.
- `SuiLyricDialogVue` (`src/ui/dialogs/lyricVue.ts`) temporarily wired into `src/ui/menus/text.ts`'s `lyricsDialogMenuOption` (same approach as `010-vue-lyric-dialog/quickstart.md`). **Do not commit this swap.**
- A score with at least four or five consecutive notes on one staff.

## Build & Run

```sh
npm run build
npm run server
```

Then open the served app in a browser, load or create a score meeting the prerequisite above, and open the Lyric Editor on the first of the consecutive notes.

## Validation Scenarios

Each maps to an Acceptance Scenario in [spec.md](./spec.md).

### 1. Hyphen auto-advance (User Story 1, P1)

1. With the plain-text editor open on the first note, type a partial syllable (e.g. `Al`), then type `-`.
2. **Expect**: the note's lyric becomes `Al-`, and the editor immediately advances to the next note (same as clicking the next-note arrow), ready for the next syllable — no manual click needed (FR-001).
3. Repeat for two or three more notes (e.g. `le`-`lu`-`ia`), confirming each hyphen both commits and advances.
4. Navigate (via the previous-note arrow) back through the notes and confirm each one shows the expected hyphenated text.
5. Move the editor to the last note in the score, type a syllable, then type `-`.
6. **Expect**: the hyphen is still appended to that note's text, but the editor stays on the same note (no next note to advance to) — no error (FR-004, spec Edge Case).

### 2. Space auto-advance with text (User Story 2, P2, Scenario 1)

1. Open the Lyric Editor on a note, type a whole word (e.g. `Amazing`), then press Space.
2. **Expect**: the editor advances to the next note, and the previous note's lyric is exactly `Amazing` — no trailing space (FR-002).
3. Type another word on this note, press Space, and repeat across a few notes, confirming no note ends up with a trailing space.

### 3. Space auto-advance with no text (User Story 2, P2, Scenario 2)

1. Open the Lyric Editor on a note that has no lyric yet. Without typing anything, press Space.
2. **Expect**: the editor advances to the next note, and no lyric was created on the note left behind (re-select that note and open the dialog again, or use the previous-note arrow, to confirm it is still empty) (FR-003, SC-003).
3. Repeat on a note that previously had text which you then fully delete (select-all, delete) before pressing Space.
4. **Expect**: same result — no lyric persisted for that note, matching the "cleared back to empty" edge case in [spec.md](./spec.md).
5. Move to the last note in the score with no text typed, and press Space.
6. **Expect**: the editor stays on the same note (no next note), no error (FR-004).

### 4. Normal typing is unaffected (Edge Case / FR-006)

1. Open the Lyric Editor and type a sentence containing letters, punctuation other than `-`, and digits (e.g. `Glo,ry 2`).
2. **Expect**: every character other than a lone `-` or Space is inserted literally, with no unintended navigation; only the standalone `-`/Space keystrokes trigger auto-advance (typing `-` as part of a longer non-hyphen-advance intent still advances per FR-001 — this is expected, matching the "type a hyphen" trigger being unconditional on the character itself, not on surrounding context).

### 5. Regression: existing controls unchanged (FR-005)

1. Confirm the next-note/previous-note arrow controls, the delete (cross) control, and the mode-toggle ("Done Editing Lyrics" / "Edit Lyrics") controls from `010-vue-lyric-dialog` still behave exactly as before — clicking them (rather than typing `-`/Space) is unaffected by this feature.
2. Confirm Verse, Y Adjustment, and Font controls (dialog mode) are unaffected.

## Regression check against `010-vue-lyric-dialog`

Since this feature only adds two new keyboard shortcuts to `lyricEditor.vue` and one new emit handler to `lyric.vue`, the fastest regression check is to re-run `specs/010-vue-lyric-dialog/quickstart.md` §1-§5 in full (mouse-driven only, no `-`/Space auto-advance) and confirm every scenario still passes unchanged.
