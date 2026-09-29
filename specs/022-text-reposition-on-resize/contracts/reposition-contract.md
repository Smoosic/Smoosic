# Contract: Text Repositioning on Global Layout Change

The externally observable interface of this feature is `SuiScoreView.setGlobalLayout(layout, previousLayout)` plus the pure `src/smo` helper it delegates to (`repositionTextGroups(oldLayout, newLayout, textGroups)`, or equivalent name chosen during implementation). Field-level detail is in [data-model.md](../data-model.md); this file states the behavior each case must have and is the source for `tests/globalLayoutTextReposition.ts`.

## Contract

Input: an `oldLayout: SmoGlobalLayout`, a `newLayout: SmoGlobalLayout`, and a list of `SmoTextGroup`.
Output: the same `SmoTextGroup` list, each group's `musicXOffset`/`musicYOffset` and every block's `text.x`/`text.y` updated so that:

- if `svgScale` changed, positions are rescaled by `oldLayout.svgScale / newLayout.svgScale`;
- if `pageWidth` changed, X-axis values are rescaled by `newLayout.pageWidth / oldLayout.pageWidth`;
- if `pageHeight` changed, Y-axis values are rescaled by `newLayout.pageHeight / oldLayout.pageHeight`;
- any dimension that did not change leaves its axis untouched (no drift from a spurious ×1).

`setGlobalLayout` additionally must:

- compute its ratios from the `oldLayout`/`newLayout` parameters only, never by re-reading `this.score.layoutManager`'s current (possibly already-mutated) state;
- apply the repositioning to both `this.score`'s and `this.storeScore`'s text-group lists, using the part-level lists on both sides when the changed layout is a part's;
- leave everything untouched when `oldLayout` and `newLayout` are equal on all three of `svgScale`/`pageWidth`/`pageHeight`.

### Cases

| # | Input | Expected result |
|---|---|---|
| R1 | `oldLayout.svgScale = 0.55`, `newLayout.svgScale = 0.6`, page dims unchanged, one text block at `x=100, y=200` | Block moves to `x = 100 * 0.55/0.6`, `y = 200 * 0.55/0.6`; pageWidth/pageHeight ratios not applied |
| R2 | `oldLayout.pageWidth = 800`, `newLayout.pageWidth = 1000`, everything else unchanged, block at `x=80` (10% of old width) | New `x = 100` (still 10% of new width, i.e. `80 * 1000/800`); `y` untouched |
| R3 | `oldLayout.pageHeight = 1000`, `newLayout.pageHeight = 1200`, block at `y=500` (50% of old height) | New `y = 600` (`500 * 1200/1000`, still 50%); `x` untouched |
| R4 | `oldLayout` identical to `newLayout` in `svgScale`/`pageWidth`/`pageHeight` (only e.g. `noteSpacing` differs) | No text group values change at all |
| R5 | Both `svgScale` and `pageWidth`/`pageHeight` change in the same call | Both adjustments applied; final position equals applying the scale ratio and the per-axis page ratio in either order (commutative) |
| R6 | Text block sitting exactly at `x = 0` (left edge) or `x = oldLayout.pageWidth` (right edge), `pageWidth` changes | Stays exactly at `x = 0`, or exactly at `x = newLayout.pageWidth` (no rounding drift) |
| R7 | Group with `musicXOffset`/`musicYOffset` set (not just block `x`/`y`) | Offsets are rescaled identically to block `x`/`y` under the same rules |
| R8 | `setGlobalLayout(layout, previousLayout)` called on a score with no part exposed | Both `this.score.textGroups` and `this.storeScore.textGroups` end up repositioned identically |
| R9 | `setGlobalLayout` called for a part-level layout change (a staff's `partInfo.layoutManager`) | Only that staff's `partInfo.textGroups` (on both `this.score` and the matching staff of `this.storeScore`) are repositioned; the score-level `textGroups` list (and other parts') is untouched |
| R10 | Two sequential changes in one dialog session: change A (svgScale 0.55→0.6) applied, then change B (svgScale 0.6→0.5) applied, each call receiving the immediately-preceding layout as `oldLayout` | Text ends at the same position as a single direct change from 0.55→0.5 would produce (no over/under-correction from re-using the original dialog-open snapshot for change B) |
| R11 | Dialog cancel: apply one or more changes, then restore the pre-dialog `backup` layout via the same `setGlobalLayout(backup, lastAppliedLayout)` path | Text positions return to exactly their pre-dialog values |
