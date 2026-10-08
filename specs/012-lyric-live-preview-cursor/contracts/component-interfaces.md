# Contracts: Component & Helper Interface Changes

This project is a client-side library with no network API. The "contracts" for this feature are the small additions to the existing `lyricEditor.vue` ↔ `lyric.vue` boundary (established by `010-vue-lyric-dialog`, extended by `011-lyric-editor-auto-advance`) and one new additive method on the shared `SvgHelpers` utility.

## 1. `lyricEditor.vue` — updated contract

`src/ui/components/dialogs/lyricEditor.vue`

```ts
interface Props {
  domId: string;
  text: string;
  fontInfo: FontInfo;
}
interface Emits {
  advance: [mode: 'commit' | 'skip'];   // unchanged, from 011
  preview: [];                           // NEW
}
interface Expose {
  getText(): string;                     // unchanged
}
```

- **New behavior**: the `useEditor({...})` call gains `onUpdate: schedulePreview`, where `schedulePreview`/`pushPreview` implement the same 400ms-debounce-then-emit pattern `textGroupEditor.vue` already uses (`009-text-editor-live-preview`). `pushPreview()` emits `preview` with no payload — the parent already has a ref to pull `getText()` from when it handles the event.
- No change to `Props` or the existing `getText()` expose.

## 2. `lyric.vue` — updated contract

`src/ui/components/dialogs/lyric.vue`

- Adds `@preview="onEditorPreview"` to the existing `<lyricEditorComp>` usage, alongside the existing `@advance="onEditorAdvance"` from `011`.
- `onEditorPreview()`: `await commitIfChanged(); updateMarker();` — no new props, no new emits from `lyric.vue` itself (it has none today).
- Adds internal marker lifecycle (not part of any external contract — `lyric.vue` has no consumers of its own besides `lyricVue.ts`, which is unaffected): `computeMarkerPosition()`, `updateMarker()`, `removeMarker()`, called from `loadNote()`, `onEditorPreview()`, `enterDialogMode()`, `finish()`, and on unmount. See `data-model.md` for the full call graph.

## 3. `SvgHelpers` — new additive method

`src/render/sui/svgHelpers.ts`

```ts
static renderLyricPositionMarker(svg: SVGSVGElement, x: number, y: number, height: number): SVGLineElement
```

- Draws one thin, muted-color vertical `<line>` element into `svg`, returns it.
- **Purely additive**: no existing `SvgHelpers` method's signature or behavior changes (`renderCursor`, `eraseOutline`, `outlineRect`, etc. are all untouched). Any other file in the codebase that already calls `SvgHelpers.*` is unaffected.

## Compatibility note

None of these interfaces are consumed outside this feature's own components (`lyricEditor.vue`/`lyric.vue` still have no call sites for `SuiLyricDialogVue` beyond the one real menu wiring already in place from `010`/`011`). The new `SvgHelpers` method is free-standing and additive, so it carries no compatibility risk for any existing caller.
