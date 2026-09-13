# Phase 1 Data Model: Lyric Editor Live Preview and Position Cursor

This feature introduces no new persisted data. It reuses the existing entities from `010-vue-lyric-dialog`/`011-lyric-editor-auto-advance` (`SmoLyric`, note selection/selector, `currentLyric`, `commitIfChanged`, `navigate`) and adds only transient, dialog-scoped visual state.

## Existing Entities (reused, not modified)

See `specs/010-vue-lyric-dialog/data-model.md` and `specs/011-lyric-editor-auto-advance/data-model.md`. This feature adds no new fields to `SmoLyric`, `SmoNote`, or any existing ref. It reads two already-populated fields that prior features didn't need: `SmoLyric.logicalBox` and `SmoNote.logicalBox` (both set by the renderer once a note/lyric has been rendered at least once).

## New Transient View State (component-scoped, not persisted)

Owned by `lyric.vue`.

| Name | Type | Purpose |
|---|---|---|
| `markerElement` | `SVGLineElement \| null` (plain variable, not a `Ref` — it is DOM state, not something a template binds to) | The currently-drawn position marker, if any; tracked so it can be `.remove()`d before redrawing or when editing stops |

## New Transient Signal (component-boundary, not persisted)

### `preview` emit

Emitted by `lyricEditor.vue` (new, alongside the existing `advance` emit from `011`), debounced 400ms after the last document change (mirrors `009-text-editor-live-preview`'s `PREVIEW_DEBOUNCE_MS`).

```ts
interface Emits {
  advance: [mode: 'commit' | 'skip'];  // unchanged, from 011
  preview: [];                          // NEW
}
```

Consumed by `lyric.vue`'s new `onEditorPreview()` handler.

## Operations (behavior, not new entities)

New or extended functions in `lyric.vue`. See `research.md` §3-4 for the underlying position logic and lifecycle hooks.

| Operation | Effect |
|---|---|
| `computeMarkerPosition()` | Returns `{ x, y, height }` for the current `currentLyric`/note: if `currentLyric.value.logicalBox` is set, `{ x: box.x + box.width, y: box.y, height: box.height }`; else `{ x: note.logicalBox.x, y: note.logicalBox.y + note.logicalBox.height + SmoScoreText.fontPointSize(currentLyric.value.fontInfo.size), height: SmoScoreText.fontPointSize(...) }` |
| `updateMarker()` | Removes any existing `markerElement`; if edit mode is active, resolves a render context via `view.renderer.pageMap.getRenderer(...)` at the computed position and draws a new marker via the new `SvgHelpers.renderLyricPositionMarker(...)`, storing the result in `markerElement` |
| `removeMarker()` | Removes `markerElement` (if any) and clears the reference; called on mode change to `'dialog'`, on `finish()`, and on component unmount |
| `onEditorPreview()` | `await commitIfChanged(); updateMarker();` — reuses `010`'s existing write, then repositions the marker to reflect any newly-rendered text |

`updateMarker()` is additionally called at the end of `loadNote()` (dialog open and after every `navigate()`/`deleteCurrent()`/`onEditorAdvance('skip')` call), per research.md §4.

## New Shared Helper (additive, no existing signature changed)

`src/render/sui/svgHelpers.ts`

```ts
static renderLyricPositionMarker(svg: SVGSVGElement, x: number, y: number, height: number): SVGLineElement
```

Draws a single thin, muted-color vertical `<line>` (`x1=x2=x`, `y1=y`, `y2=y+height`) into `svg` and returns the created element. `SvgHelpers.renderCursor` (the existing, differently-shaped legacy cursor glyph) is unchanged.

## State Transition Summary

```
Dialog opens / navigate() / deleteCurrent() / onEditorAdvance('skip')
  └─ loadNote(...) → updateMarker()   (immediate, not debounced)

lyricEditor.vue: TipTap onUpdate fires (any keystroke, including '-' auto-insertion)
  └─ schedulePreview() debounces 400ms
       └─ pushPreview() → emit('preview')
            └─ lyric.vue: onEditorPreview() → commitIfChanged() → updateMarker()

mode → 'dialog' (enterDialogMode) or dialog closes (finish) or component unmounts
  └─ removeMarker()
```
