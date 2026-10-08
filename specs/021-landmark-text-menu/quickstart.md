# Quickstart: Validating the Landmark Text Menu

This project has no wired automated test runner (`npm test` is a no-op). Validation is manual, against the dev/demo score app, following the acceptance scenarios in [spec.md](./spec.md).

## Prerequisites

- Node deps installed (`npm install`, if not already).
- Branch checked out with this feature's changes.
- A score with Title, Subtitle, Composer, and Copyright filled in (Score menu's score-info dialog) and at least 2 pages, to exercise every "source defined" branch. A part-extraction view (any instrument, ≤2 staves so it counts as exposed) to exercise the Part landmark.

## Build & Run

```sh
npm run build
npm run server
```

Then open the served app in a browser and load or create a score meeting the prerequisites above.

## Validation Scenarios

Each maps to a User Story / Acceptance Scenario in [spec.md](./spec.md).

### 1. Create Title and Subtitle (User Story 1, P1)

1. Open Text menu > Landmark Text.
2. **Expect**: "Title" and "Subtitle" are offered (score info has both set).
3. Choose "Title".
4. **Expect**: a text block showing the score's title appears, horizontally centered at the top of the first page, at 24px, and its property dialog opens immediately in the non-editing (idle) view — no free-text editing session, no "Page Behavior" control visible (FR-007, FR-012, FR-013, FR-014, FR-017).
5. Close the dialog. Open Text menu > Landmark Text > "Subtitle".
6. **Expect**: a text block showing the subtitle appears, centered, positioned below the Title's row, at 18px (FR-008).

### 2. Composer, Copyright, Date, Page number (User Story 1)

1. Open Text menu > Landmark Text > "Composer".
2. **Expect**: the composer's name appears in the upper right corner (FR-011).
3. Open Text menu > Landmark Text > "Copyright".
4. **Expect**: the copyright text appears centered at the bottom of the page (FR-009).
5. Open Text menu > Landmark Text > "Date".
6. **Expect**: today's date appears centered at the bottom of the page (FR-009).
7. Open Text menu > Landmark Text > "Page Number".
8. **Expect**: a text block reading "Page 1 of N" (N = the score's current page count) appears in the upper right corner (FR-010). Add or remove a page from the score layout and re-check the rendered page-number text on each page updates accordingly.

### 3. Source-not-defined items are hidden (Edge Case)

1. Clear the score's Composer field (score-info dialog) and reopen Text menu > Landmark Text.
2. **Expect**: "Composer" is no longer offered, unless a Composer landmark already exists from step 2 above (in which case it stays visible per the next scenario) — test on a fresh score with Composer blank and no prior Composer landmark to confirm it's hidden (FR-002, SC-005).

### 4. An existing landmark's menu entry survives its source being cleared (Edge Case)

1. With a Composer landmark already created (scenario 2), clear the score's Composer field.
2. Reopen Text menu > Landmark Text.
3. **Expect**: "Composer" is still offered.
4. Choose it.
5. **Expect**: the existing Composer landmark's dialog opens (not a new, blank one) — no duplicate text block is created (FR-006, SC-004).

### 5. Reopening an existing landmark never duplicates it (User Story 3)

1. Choose "Title" from Landmark Text a second time (Title landmark already exists from scenario 1).
2. **Expect**: the same Title landmark's dialog opens; after closing, the score still has exactly one Title text block (FR-006, SC-004).

### 6. Part landmark only appears for an exposed part (User Story 2)

1. While viewing the full, multi-instrument score, open Text menu > Landmark Text.
2. **Expect**: "Part" is not offered (FR-003, SC-003).
3. Switch to a single-instrument part-extraction view.
4. Open Text menu > Landmark Text.
5. **Expect**: "Part" is offered.
6. Choose it.
7. **Expect**: a text block showing that part's name appears in the upper right corner (FR-011).
8. Switch back to the full score view and reopen Landmark Text.
9. **Expect**: "Part" is not offered again (FR-003).

### 7. No free-text editing or pagination control for any landmark (User Story 4)

1. Open any landmark's dialog (e.g. Title, from scenario 1).
2. **Expect**: there is no "Edit Text" button and no "Page Behavior" control, and the dialog opens directly in its property/idle view — never the free-text editing session (FR-013, FR-014).
3. Change the font size and click "Move", drag it to a new position, and release.
4. **Expect**: the font-size change and the new position are both reflected on the rendered score (FR-015, FR-016).

### 7b. A pre-existing (non-menu-created) landmark also skips the text editor (Edge Case)

1. Import a MusicXML file whose score has a title, subtitle, and/or composer set (or use a score created before this feature, if one with a MusicXML-imported title is available) — this produces a Title/Subtitle/Composer text group via the pre-existing import path, which now carries a real `purpose` but was never touched by this feature's own creation code.
2. Open Text menu > Landmark Text > "Title" (or Subtitle/Composer, whichever is present).
3. **Expect**: the dialog opens directly in its property/idle view (no "Edit Text" button, no free-text editing session) on the very first open — not just on subsequent opens — confirming the gating is driven by `purpose` itself and not by a flag only set when a landmark is created through the menu.

### 8. Ordinary Score Text is unaffected (Regression)

1. Open Text menu > "Score Text" (the pre-existing, non-landmark entry) and create a blank text block.
2. **Expect**: it opens directly in the free-text editing session as before, and once text is entered and "Done Editing Text" is clicked, both "Edit Text" and "Page Behavior" are visible in its property view exactly as before this feature (regression check for the `purpose === NONE` gating added in `textBlock.vue`).

### 9. Top/bottom landmarks never render inside the music margins (FR-018/SC-007)

1. Create a Title landmark on a score whose first page has music rendered close to the top margin (a normal score with at least one measure in the first system).
2. **Expect**: the Title text renders above/outside the top margin line, near the true top edge of the page — it does not overlap or sit inside the same vertical band the first music system occupies. Its visual top starts no lower than roughly half the top margin's height (FR-019).
3. Create a Copyright and/or Date landmark on a score with music rendered close to the bottom margin.
4. **Expect**: the Copyright/Date text renders below/outside the bottom margin line, near the true bottom edge of the page — no overlap with the last music system.
5. On a fresh score with no landmarks yet, create Composer first.
6. **Expect**: Composer renders in the upper right corner, starting no lower than roughly half the top margin's height (same base rule as Title, FR-019) — not overlapping the first music system.

### 10. Landmarks sharing a column stack instead of overlapping (FR-020)

1. Create a Title landmark, then create a Subtitle landmark.
2. **Expect**: Subtitle renders directly below Title (flush against Title's bottom edge), not at Title's own starting position, and not overlapping it.
3. On a score with no upper-right landmarks yet, create Composer, then Page Number, then Part, in that order.
4. **Expect**: each renders directly below the previous one (Page Number below Composer, Part below Page Number) — no two of the three overlap.
5. On a fresh score, create Page Number first (before Composer exists), then create Composer.
6. **Expect**: Page Number uses the FR-019 base position (nothing was above it yet). Composer, created afterward, finds Page Number already in its column and stacks immediately below it — the two do **not** overlap, regardless of this out-of-order creation sequence (FR-020, fixed after initial user feedback — order no longer matters).

### 11. Upper-right landmarks are right-justified against the right margin (FR-021)

1. Create a Composer landmark with a long name (e.g. a composer name that's clearly wider than a few characters).
2. **Expect**: the text's right edge aligns with the right margin line — not centered partway across the page, and not overlapping past the right margin.
3. Create a Page Number landmark (e.g. "Page 1 of 3") and a Part landmark with a long instrument name.
4. **Expect**: both also have their right edge flush against the right margin — shorter text (like "Page 1 of 3") and longer text (a long instrument name) both align on their *right* edge, so their left edges differ but their right edges match. In particular, Composer's and Page Number's right edges must be **identical** (same ending X) — if Page Number's right edge falls noticeably short of Composer's, the width-estimation fix (measuring from a representative substituted string rather than the literal `'Page ### of @@@'` template) has regressed.
