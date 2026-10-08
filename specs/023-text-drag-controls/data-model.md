# Data Model: Score Text Drag Controls

This feature adds no new persisted entities and no new fields to any serializable type. It adds transient (non-serialized) state to two existing in-memory classes, and two new pure methods to an existing model class.

## `SmoTextGroup` (existing — `src/smo/data/scoreText.ts`)

No new fields. Two new methods, both pure functions of the group's existing state plus a caller-supplied layout, with no DOM/render dependency:

| Method | Reads | Writes | Behavior |
|---|---|---|---|
| `centerOnPage(layout: ScaledPageLayout)` | `this.logicalBox.width`, `this.ul().x` | calls existing `this.offsetX(delta)` | Computes `centerX = layout.leftMargin + (layout.pageWidth - layout.leftMargin - layout.rightMargin) / 2`; target `x = centerX - width / 2`; offsets by `target - this.ul().x`. Vertical position untouched (FR-004). |
| `rightJustifyOnPage(layout: ScaledPageLayout)` | `this.logicalBox.width`, `this.ul().x` | calls existing `this.offsetX(delta)` | Target `x = (layout.pageWidth - layout.rightMargin) - width`; offsets by `target - this.ul().x`. Vertical position untouched (FR-005). |

Both mirror the existing `xJustify` branch of `SmoTextGroup.createLandmarkText` (same two formulas, same `ScaledPageLayout` shape), so "centered"/"right-justified" means the same thing here as it already does for landmark text (Title/Subtitle centered; Composer/Page right-justified against the margins).

**Precondition**: `this.logicalBox` is non-null (the group has been rendered at least once). Always true when these methods are reachable — `textDragger.vue` (the only caller) exists solely while editing an already-rendered `SmoTextGroup`.

## `SuiDragSession` (existing — `src/render/sui/textEdit.ts`)

Three new public fields, all default `false`, all transient (never serialized, never read outside this class and its direct caller):

| Field | Type | Default | Set by |
|---|---|---|---|
| `lockHorizontal` | `boolean` | `false` | `textDragger.vue`, derived from its `lockMode` local state (`true` when `lockMode === 'vertical'`, i.e. the "Move Vertical" control is selected and the horizontal axis is frozen) |
| `lockVertical` | `boolean` | `false` | `textDragger.vue`, derived from its `lockMode` local state (`true` when `lockMode === 'horizontal'`, i.e. the "Move Horizontal" control is selected and the vertical axis is frozen) |
| `snapEnabled` | `boolean` | `false` | `textDragger.vue`, mirrored from its "Snap" checkbox |

Note the field names describe *which axis is frozen*, not which movement direction the user-facing control names describe (research.md §1/§3 predate the UI's later "Move Horizontal"/"Move Vertical" relabeling — see `textDragger.vue` component state below); the fields' own runtime behavior in `mouseMove()` is unchanged.

One new private/internal field:

| Field | Type | Set by | Purpose |
|---|---|---|---|
| `dragOriginBox` | `SvgBox` | `startDrag()`, snapshot of the initial `svgMouseBox` | Reference value substituted for a locked axis in `mouseMove()`, so the locked axis stays exactly constant for the life of one drag (research.md §3) |

**State transitions**: All three booleans reset to `false` implicitly every time a new `SuiDragSession` is constructed (i.e., every time `textDragger.vue`'s `start()` runs) — satisfying FR-013 ("default to unselected/off each time the text dragger is opened") without any explicit reset code, since `textDragger.vue`'s `lockMode`/`snapEnabled` local state is freshly initialized on each mount (the component is only mounted while `mode === 'moving'` in `textBlock.vue`, and unmounted/remounted on each re-entry).

## `textDragger.vue` component state (existing component, new local state)

- `lockMode: Ref<'none' | 'horizontal' | 'vertical'>`, reset to `'none'` on mount — a single three-way value rather than two independent booleans, since "Move Horizontal" and "Move Vertical" are mutually exclusive (FR-003): selecting one sets `lockMode` to that value (clearing the other); selecting whichever is already active resets it to `'none'`. `setLockMode()` derives `session.lockHorizontal`/`session.lockVertical` from this single value.
- `snapEnabled: Ref<boolean>`, reset to `false` on mount (unchanged from the original design).

New prop:

- `pageLayout: ScaledPageLayout` — the current page's scaled layout (margins, page width), computed once by the parent (`textBlock.vue`) and passed down; consumed only by the new "Center"/"Right Justify" button handlers, which call `props.textGroup.centerOnPage(props.pageLayout)` / `.rightJustifyOnPage(props.pageLayout)`.

New emit:

- `(e: 'reposition'): void` — fired after a center/right-justify button commits a change directly to `props.textGroup`, so the parent can refresh its own cached position fields and trigger a rerender (the same responsibility `onDragStop`'s handling of the existing `'stop'` emit already has in `textBlock.vue`).

**Icon-only rendering (FR-014)**: "Move Horizontal", "Move Vertical", "Center", and "Right Justify" each render as a single icon (the app's existing `.mi` Material Symbols icon class) with no visible text, and carry their name as `aria-label` on the button element for assistive technology. "Move Vertical" uses the ligature text `import_export` (a vertical up/down double-arrow glyph) unrotated; "Move Horizontal" uses the same `import_export` glyph with an inline `transform: rotate(90deg)` style, since Material Symbols has no separate horizontal-arrows icon. "Center"/"Right Justify" use `format_align_center`/`format_align_right`. "Move Horizontal"/"Move Vertical" additionally expose `aria-pressed` (reflecting `lockMode`) since they are toggle buttons, not one-shot actions.

No new entities, no new relationships, no new validation rules beyond the existing `SvgBox`/`ScaledPageLayout` shapes already defined elsewhere in the codebase.
