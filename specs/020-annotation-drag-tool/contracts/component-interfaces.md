# Contracts: Drag-Session and Component Interfaces

This project is a client-side library with no network API. The "contracts" for this feature are the TypeScript interfaces at the two internal boundaries it adds: the new drag-session class and the new/modified Vue components. Both mirror the shapes already established by the text-block drag tool (`SuiDragSession` / `textDragger.vue`, `001-text-block-dialog-vue`).

## 1. Drag session: `SuiAnnotationDragSession`

`src/render/sui/textEdit.ts`, added alongside `SuiDragSession`

```ts
export interface SuiAnnotationDragSessionParams {
  context: SvgPageMap;
  scroller: SuiScroller;
  annotation: SmoLyric;
  debug: layoutDebug;
}

export class SuiAnnotationDragSession {
  dragging: boolean;
  constructor(params: SuiAnnotationDragSessionParams);
  startDrag(e: MouseEvent): void;
  mouseMove(e: MouseEvent): void;
  endDrag(): void;
  unrender(): void;
}
```

- **Precondition**: `params.annotation.logicalBox` is non-null (the annotation has been rendered at least once — FR-009; the dialog only offers the "Move" button once this holds).
- **`startDrag(e)`** (FR-002, FR-004): converts `e`'s client coordinates via `context.clientToSvg`/`scroller`, same as `SuiDragSession.startDrag`. If the resulting point is not contained by `annotation.logicalBox` (`SvgHelpers.doesBox1ContainBox2`), returns without starting a drag. Otherwise sets `dragging = true`, captures the origin box, and draws the initial outline (research.md §3-4).
- **`mouseMove(e)`** (FR-002, FR-007): no-ops if `!dragging`. Otherwise computes the delta from the origin point, clamps it so the shifted box stays within the resolved page's `box`, writes `transform="translate(<x> <y>)"` directly onto the annotation's existing rendered DOM element (`'vf-' + annotation.attrs.id`) using the same sign convention as `_updateAnnotationOffsets`, and updates the outline. Does not mutate `annotation.translateX`/`translateY` and does not call any score-operation method (research.md §2, §5).
- **`endDrag()`** (FR-003): no-ops if `!dragging`. Otherwise computes the final clamped delta, sets `annotation.translateX`/`annotation.translateY` to the resulting values, erases the outline, and sets `dragging = false`. Still does not call any score-operation method — the caller (the dialog) is responsible for committing (research.md §5).
- **`unrender()`**: erases any outstanding outline; if `dragging`, calls `endDrag()` first. Matches `SuiDragSession.unrender`'s contract, called by the wrapper component's `stop()`.

## 2. Component: `annotationDragger.vue`

`src/ui/components/dialogs/annotationDragger.vue`, modeled 1:1 on `textDragger.vue`

```ts
interface Props {
  domId: string;
  altLabel: string;                 // 'Done Dragging Annotation'
  annotation: SmoLyric;
  pageMap: SvgPageMap;
  scroller: SuiScroller;
  debug: layoutDebug;
}
interface Emits {
  (e: 'stop'): void;
}
interface Expose {
  start(): void;
  stop(): void;
}
```

- **Contract**: identical shape to `textDragger.vue` — `start()` constructs a `SuiAnnotationDragSession` from the props and binds raw `window` `mousedown`/`mousemove`/`mouseup` handlers (scoped to the lifetime of the drag, same rationale as `textDragger.vue`'s existing comment: the drag renders directly onto the SVG canvas outside Vue's reactivity). `stop()` ends any in-progress drag, calls the session's `unrender()`, unbinds the window handlers, and emits `stop`. Renders a single button (same visual pattern as `textDragger.vue`'s template) that calls `stop()`.
- **Difference from `textDragger.vue`**: takes `annotation: SmoLyric` instead of `textGroup: SmoTextGroup`; no `unrender()`-driven glyph rebuild is needed on `stop()`, since the annotation's own persisted glyph was never removed from the DOM during the drag (only its `transform` attribute was touched live) — the next full render pass (triggered by the dialog's post-`stop()` `syncModifiers()` call) naturally reconciles it.

## 3. Modified component: `annotation.vue`

`src/ui/components/dialogs/annotation.vue`

```ts
type DialogMode = 'editing' | 'dialog' | 'moving';   // was 'editing' | 'dialog'
```

- **New control** (`'dialog'`-mode template, alongside "Edit Text"/"Add Annotation"/index selector): a "Move" button, rendered only when `currentAnnotation.value` is defined (FR-009), that sets `mode.value = 'moving'`.
- **New branch**: `<div v-if="mode === 'moving'">` renders `annotationDraggerComp` (`ref="draggerRef"`) with `:annotation="currentAnnotation"`, `:pageMap="view.renderer.pageMap"`, `:scroller="view.tracker.scroller"`, `:debug="view.debug"`, `@stop="onDragStop"` — the same prop sourcing `textBlock.vue` already uses for its own `pageMap`/`scroller`/`debug`. All other `'dialog'`-mode controls (index selector, X/Y offset, vertical-justify, font, edit/add/delete buttons) are hidden while `mode === 'moving'`, matching `textBlock.vue`'s existing `v-if`/`v-else` structure (Edge Case: must exit the move tool before switching annotations).
- **New handler**:
  ```ts
  const onDragStop = async () => {
    mode.value = 'dialog';
    loadCurrent();       // refresh translateX/translateY refs from the model (data-model.md)
    await syncModifiers(); // commit to every selected note (research.md §5, FR-008)
  };
  ```
- **New `watch`**: `watch(mode, async (m) => { if (m === 'moving') { await nextTick(); draggerRef.value?.start(); } })`, mirroring `textBlock.vue:93-98`.
