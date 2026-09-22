# Phase 1 Data Model: Annotation Drag Tool

This feature introduces no new persisted fields and no new persisted classes. It reuses `SmoLyric`'s existing `translateX`/`translateY`/`logicalBox` fields (all already present since `017-text-annotations` and, for `logicalBox`, since the original lyric/chord rendering machinery) and adds one new session-scoped (non-persisted) class plus transient Vue dialog state.

## Reused Entity: `SmoLyric` (`src/smo/data/noteModifiers.ts:868`) — unmodified

| Field | Type | Relevance to this feature |
|---|---|---|
| `translateX` | `number` | Read as the drag origin's X offset; written once, on drag completion, to the final dragged-to X offset |
| `translateY` | `number` | Same, for Y; sign convention matches the existing render transform (`translate(translateX, -translateY)`, `vxSystem.ts`) |
| `logicalBox` | `SvgBox \| null` (inherited from `SmoNoteModifierBase`) | The annotation's current on-screen bounding box, already populated by the existing render/map pipeline (research.md §1). Used as the drag tool's hit-test box and starting outline; `null` before the annotation has ever been rendered (guards FR-009 — the move tool is not offered until an annotation exists and has rendered) |
| `attrs.id` | `string` | Used to locate the annotation's rendered DOM element (`'vf-' + attrs.id`), same convention as the existing offset-transform update |

No change to `SmoLyricParams`/`SmoLyricParamsSer`/`defaults`/`persistArray` — nothing new is serialized.

## New Session-Scoped Class: `SuiAnnotationDragSession` (`src/render/sui/textEdit.ts`)

Not persisted; exists only for the duration of one drag interaction, modeled on `SuiDragSession` (same file).

| Member | Type | Purpose |
|---|---|---|
| `annotation` | `SmoLyric` | The single annotation instance being repositioned (shared by reference across every selected note, same object `annotation.vue`'s other field handlers already mutate) |
| `pageMap` | `SvgPageMap` | Resolves the containing page/coordinate space (`getRendererFromModifier(annotation)`) |
| `page` | `SvgPage` | The resolved page, providing `box` for bounds-clamping and `svg` for DOM element lookup |
| `scroller` | `SuiScroller` | Same role as in `SuiDragSession` — converts client coordinates accounting for current scroll position |
| `debug` | `layoutDebug` | Same optional drag-debug visualization hook `SuiDragSession` already supports |
| `dragging` | `boolean` | Whether a drag is currently in progress |
| `originBox` | `SvgBox` | The annotation's `logicalBox` captured at drag start, used as the hit-test box and the reference point for computing the drag delta |
| `outlineRect` | `OutlineInfo \| null` | The dashed drag-outline currently shown, if any (research.md §4) |

**Methods** (contract detail in [contracts/component-interfaces.md](./contracts/component-interfaces.md)):

- `startDrag(e: MouseEvent)`: hit-tests `e` against `originBox`; if inside, sets `dragging = true` and draws the initial outline.
- `mouseMove(e: MouseEvent)`: while dragging, computes the clamped delta from `originBox`, writes the live-preview `transform` attribute directly onto the annotation's DOM element, and updates the outline.
- `endDrag()`: while dragging, computes the final clamped delta, writes the resulting `translateX`/`translateY` onto `annotation`, clears the outline, and sets `dragging = false`. Does not call any score-operation/commit method itself (research.md §5).
- `unrender()`: clears any outstanding outline; if called mid-drag, calls `endDrag()` first — same contract as `SuiDragSession.unrender`/`textDragger.vue`'s `stop()`.

## Dialog-Scoped Transient State (Vue reactive refs, discarded on close) — additions to `annotation.vue`

| Name | Type | Purpose |
|---|---|---|
| `mode` | `Ref<'editing' \| 'dialog' \| 'moving'>` **(extended)** | Adds `'moving'` to the existing two-value type (`annotation.vue:28`); gates which controls are visible, exactly as `'editing' \| 'dialog'` already do |
| `draggerRef` | `Ref<InstanceType<typeof annotationDraggerComp> \| null>` **(new)** | Handle to the new `annotationDragger.vue` instance, used to call `start()`/`stop()`, mirroring `textBlock.vue`'s `draggerRef` |

No other new refs — `translateX`/`translateY` (already present, `annotation.vue:47-48`) are refreshed from the model via the existing `loadCurrent()` after a drag completes, exactly as they already are after a numeric-field change.

## State Transitions

`DialogMode` (extended): `'editing'` (initial for a brand-new annotation) → `'dialog'` (after "Done Editing") → `'moving'` (user activates "Move") → `'dialog'` (user activates "Done Dragging Annotation", which also runs `syncModifiers()` — research.md §5) → `'editing'` (user activates "Edit Text") → ... `'moving'` is reachable only from `'dialog'` and always returns to `'dialog'`; it is never entered from `'editing'` directly (matches `textBlock.vue`, where "Move" is likewise offered only in the non-editing view).
