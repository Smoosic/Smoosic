# Quickstart: Score Text Drag Controls

Manual + headless validation for the direction-lock, center/right-justify, snap, and Alt slow-mode controls added to the text-drag toolbar (`textDragger.vue`). See [contracts/component-interfaces.md](./contracts/component-interfaces.md) and [data-model.md](./data-model.md) for the exact shapes involved.

## Prerequisites

- `npm install` (once)
- `npm run build` — builds the app bundle
- `npm run server` — serves the built app; open it in a browser
- A score with at least one text block (e.g., a Title) — add one via the score's text menu if needed, or open an existing `.smo`/demo score from [SmoScores](https://github.com/Smoosic/SmoScores)

## Headless check: `centerOnPage` / `rightJustifyOnPage` math (Principle #1/#2 coverage)

```sh
npm run test:text-drag-placement
```

Expected: all `PASS` lines, `0` failures — covers:
- Centering a narrow/wide text block against varying `leftMargin`/`rightMargin` combinations lands its horizontal midpoint exactly on the page's printable-area midpoint.
- Right-justifying lands the block's right edge exactly on `pageWidth - rightMargin`.
- Neither method changes the group's `y` position.
- Both methods are idempotent (calling twice in a row produces the same result as calling once).

## Manual check 1: Direction lock (User Story 1)

1. Open the score's text dialog for an existing text block, click the move/drag button to enter "moving" mode.
2. Click the "Move Horizontal" icon button (`import_export`, rotated 90°). Drag the text diagonally across the page.
3. **Expect**: the text's vertical position does not change; only horizontal position follows the mouse. The button shows a pressed/active state.
4. Click "Move Vertical" (`import_export`, unrotated) instead. Drag diagonally again.
5. **Expect**: only vertical position follows the mouse; "Move Horizontal" is now shown unselected and "Move Vertical" shown selected (the two are mutually exclusive).
6. Click "Move Vertical" again (the one currently active).
7. **Expect**: it becomes unselected; neither control is active.
8. Drag diagonally.
9. **Expect**: both axes follow the mouse, matching pre-existing behavior.
10. Hover/inspect each button: confirm no visible text label is shown, and each exposes its name ("Move Horizontal"/"Move Vertical") via `aria-label` (e.g. via a screen reader or the browser's accessibility inspector).

## Manual check 2: Center / Right Justify (User Story 2)

1. While in "moving" mode (drag toolbar visible), without necessarily pressing the mouse button, click the "Center" icon button (`format_align_center`).
2. **Expect**: the text's horizontal position jumps to the page's horizontal center; vertical position unchanged. The button shows no visible text, only the icon.
3. Click "Right Justify" (`format_align_right`).
4. **Expect**: the text's right edge aligns to the page's right margin; vertical position unchanged.
5. Repeat step 1-2 while a mouse-drag is actively in progress (press and hold the mouse button on the text, move it, then — without releasing — click a placement button is not a normal browser interaction; instead verify the simpler case: click a placement button, then start a fresh drag) to confirm no duplicate/ghost text is left behind from the click.
6. Confirm each button exposes its name ("Center"/"Right Justify") via `aria-label` for assistive technology.

## Manual check 3: Snap to grid (User Story 3)

1. Check "Snap". Drag the text to an arbitrary position and release.
2. **Expect**: the final rendered position's x and y are both visually aligned to a 10px grid (compare against a second drag ending nearby — both should land on the same grid lines).
3. Change the page/note-size zoom (score layout dialog's zoom or svg-scale controls) and repeat.
4. **Expect**: the grid remains visually consistent (10px-equivalent spacing) relative to the page at the new svg scale — not visually finer/coarser purely from a browser-zoom change, per research.md §2.
5. Uncheck "Snap" and drag again.
6. **Expect**: exact pixel positioning, no snapping — matching current (pre-feature) behavior.

## Manual check 4: Alt slow mode (User Story 3)

1. Start dragging the text (mouse button held down, no modifier).
2. **Expect**: text follows the mouse smoothly on every move event, as today.
3. Continue the drag while holding Alt.
4. **Expect**: text position updates noticeably less often (roughly 10 times/second or fewer) while Alt is held — perceivable as coarser, "stepped" catch-up motion rather than continuous tracking.
5. Release Alt while still dragging.
6. **Expect**: text immediately resumes smooth, every-event tracking.
7. Release the mouse button to end the drag.
8. **Expect**: the drag ends normally at the last processed position; no error, no stuck state.

## Manual check 5: No regression when all controls are off

1. With "Move Horizontal"/"Move Vertical" both unselected and "Snap" unchecked, perform an ordinary drag exactly as before this feature existed.
2. **Expect**: pixel-for-pixel identical behavior to the pre-feature drag tool (spec SC-005).
