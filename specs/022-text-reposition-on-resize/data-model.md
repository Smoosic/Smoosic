# Phase 1 Data Model: Reposition Text on Layout Resize

No new persisted entities or fields are introduced. This feature only recalculates existing numeric fields on existing entities. This document lists the entities touched, the fields read or mutated, and the exact transformation rules that must hold.

## Entities touched

### `SmoGlobalLayout` (`src/smo/data/scoreModifiers.ts`)

Existing interface, unchanged shape:

| Field | Type | Role in this feature |
|---|---|---|
| `svgScale` | number | Compared old vs. new to derive the scale ratio. |
| `pageWidth` | number | Compared old vs. new to derive the X-axis page ratio. |
| `pageHeight` | number | Compared old vs. new to derive the Y-axis page ratio. |
| `zoomScale`, `noteSpacing`, `proportionality`, `maxMeasureSystem`, `displayMode` | — | Not read by the repositioning logic; unaffected. |

An `SmoLayoutManager` (score-level or `staff.partInfo.layoutManager`) owns exactly one `SmoGlobalLayout`.

### `SmoTextGroup` (`src/smo/data/scoreText.ts`)

Existing fields whose numeric values are recalculated, not restructured:

| Field | Type | Role in this feature |
|---|---|---|
| `musicXOffset` | number | Rescaled by the svg-scale ratio (existing behavior via `scaleText`); rescaled by the pageWidth ratio (new). |
| `musicYOffset` | number | Rescaled by the svg-scale ratio (existing behavior via `scaleText`); rescaled by the pageHeight ratio (new). |
| `textBlocks[].text.x` | number | Same as `musicXOffset`. |
| `textBlocks[].text.y` | number | Same as `musicYOffset`. |

A text group belongs either to `SmoScore.textGroups` (score-level) or to `staff.partInfo.textGroups` (part-level, one list per staff's `SmoPartInfo`).

### `SuiScoreView` / `scoreViewOperations` in-memory relationship (not persisted)

- `this.score`: the currently rendered view; may be the whole score or (when a part is exposed) a deep copy whose `layoutManager`/`textGroups` have been swapped, by `_mapPartFormatting()`, to reference that part's `partInfo.layoutManager`/`partInfo.textGroups`.
- `this.storeScore`: the full, ground-truth score that is actually serialized/saved and undone; always keeps its own separate `SmoLayoutManager`/`textGroups` (and, per staff, its own `partInfo.layoutManager`/`partInfo.textGroups`), which are distinct object instances from the corresponding ones on `this.score`.

Any global-layout change must be applied to **both** sides so they stay consistent — this is the existing pattern already used by `setPageLayout`/`setPageLayouts` for page margins, and is being extended to `setGlobalLayout`.

## Transformation rules

Given `oldLayout: SmoGlobalLayout` (the layout immediately before this change) and `newLayout: SmoGlobalLayout` (the layout being applied), for a given list of `SmoTextGroup` (either a score's `textGroups` or one staff's `partInfo.textGroups`):

1. **Scale-ratio step** (existing behavior, being fixed — not redesigned):
   - If `oldLayout.svgScale !== newLayout.svgScale`:
     `scaleRatio = oldLayout.svgScale / newLayout.svgScale`
     For every text group: `tg.scaleText(scaleRatio)` (existing method — multiplies `musicXOffset`, `musicYOffset`, and every block's `text.x`/`text.y` by `scaleRatio`).
   - If unchanged, this step is a no-op (`scaleRatio` would be `1`; skip entirely rather than multiply by 1, so no floating-point drift is introduced on unrelated commits).

2. **Page-dimension step** (new):
   - If `oldLayout.pageWidth !== newLayout.pageWidth`:
     `widthRatio = newLayout.pageWidth / oldLayout.pageWidth`
     For every text group: multiply `musicXOffset` and every block's `text.x` by `widthRatio`.
   - If `oldLayout.pageHeight !== newLayout.pageHeight`:
     `heightRatio = newLayout.pageHeight / oldLayout.pageHeight`
     For every text group: multiply `musicYOffset` and every block's `text.y` by `heightRatio`.
   - If a dimension is unchanged, its axis is skipped entirely (no multiply-by-1).

3. **Application scope**: steps 1–2 run once per affected `SmoLayoutManager`'s text-group list. For a score-level change: `this.score.textGroups` and `this.storeScore.textGroups`. For a part-level change (a part's own `layoutManager` changed): that staff's `partInfo.textGroups` on both `this.score` and the corresponding staff on `this.storeScore`.

4. **No-op guard**: if `oldLayout` and `newLayout` are equal on `svgScale`, `pageWidth`, and `pageHeight`, no text group is touched and no undo-relevant mutation occurs (satisfies spec FR-005/FR-006).

## Validation rules

- Ratios are always computed as `new / old` (page dimensions) or `old / new` (svg scale, preserving the existing sign/direction convention of `scaleText`) — never inverted, to avoid silently flipping the direction of the correction.
- Division by a zero `oldLayout` dimension cannot occur in practice: `SmoLayoutManager.defaultLayout` and the dialog's `numberInputApp` both keep `pageWidth`/`pageHeight`/`svgScale` at positive values (the dialog enforces `minValue` on scale inputs; page width/height are populated from the fixed `predefinedDimensions` table or a prior valid layout). No additional guard is added beyond what the dialog already enforces.

## State transitions

None — this feature does not add a state machine. It is a pure recalculation triggered by two events: (a) the Global Layout dialog commits a change (`watch` callback in `globalLayout.ts`), and (b) cancel, which restores the pre-dialog `backup` layout and — as a consequence of routing through the same `setGlobalLayout(layout, previousLayout)` path — correctly un-repositions text back to its original values.
