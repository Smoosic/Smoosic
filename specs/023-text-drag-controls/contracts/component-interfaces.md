# Contracts: Drag-Session and Component Interfaces

This project is a client-side library with no network API. The "contracts" for this feature are the TypeScript interfaces at the internal boundaries it touches: the existing drag-session class (extended, not replaced) and the existing/modified Vue components.

## 1. Drag session: `SuiDragSession` (extended, not replaced)

`src/render/sui/textEdit.ts`

```ts
export class SuiDragSession {
  // ...existing fields unchanged...
  lockHorizontal: boolean;   // NEW, default false
  lockVertical: boolean;     // NEW, default false
  snapEnabled: boolean;      // NEW, default false
  dragOriginBox: SvgBox;     // NEW, internal snapshot set by startDrag()

  constructor(params: SuiDragSessionParams);  // unchanged signature
  startDrag(e: any): void;   // unchanged signature; now also snapshots dragOriginBox
  mouseMove(e: any): void;   // unchanged signature; now applies snap then lock before committing outlineBox
  endDrag(): void;           // unchanged
  unrender(): void;          // unchanged
}
```

- **Precondition**: none beyond the existing ones — `lockHorizontal`/`lockVertical`/`snapEnabled` may be set by the caller at any time before or during a drag; each `mouseMove()` call reads their current value, so toggling mid-drag takes effect on the very next mouse-move event.
- **`startDrag(e)`** (unchanged contract, FR-001-013 n/a here): in addition to its existing behavior, snapshots the just-computed `svgMouseBox` into `this.dragOriginBox` for use by a subsequent locked `mouseMove()`.
- **`mouseMove(e)`** (FR-001, FR-002, FR-003, FR-007, FR-008): unchanged early-return (`!dragging`) and unchanged coordinate derivation. Before assigning the result to `this.outlineBox`, applies, in order:
  1. If `snapEnabled`: round both `x` and `y` to the nearest multiple of `10 / this.pageMap.renderScale` (research.md §2).
  2. If `lockHorizontal`: overwrite `x` with `this.dragOriginBox.x`.
  3. If `lockVertical`: overwrite `y` with `this.dragOriginBox.y`.
  All three default `false`/no-op, so behavior is byte-for-byte identical to today when none are set (spec SC-005).
- **`endDrag()`** (unchanged): commits whatever `outlineBox` currently holds, same as today — no new logic needed, since lock/snap already shaped `outlineBox` during `mouseMove()`.

## 2. Model: `SmoTextGroup` (extended, not replaced)

`src/smo/data/scoreText.ts`

```ts
export class SmoTextGroup extends SmoScoreModifierBase {
  // ...existing members unchanged...
  centerOnPage(layout: ScaledPageLayout): void;       // NEW
  rightJustifyOnPage(layout: ScaledPageLayout): void; // NEW
}
```

- **Precondition**: `this.logicalBox` is non-null (data-model.md).
- **`centerOnPage(layout)`** (FR-004): horizontally centers the group between `layout.leftMargin` and `layout.pageWidth - layout.rightMargin`; leaves vertical position unchanged.
- **`rightJustifyOnPage(layout)`** (FR-005): aligns the group's right edge to `layout.pageWidth - layout.rightMargin`; leaves vertical position unchanged.
- Both are synchronous, single-call, no DOM/render access — safe to call whether or not a drag session currently exists (research.md §5).

## 3. Component: `textDragger.vue` (modified)

`src/ui/components/dialogs/textDragger.vue`

```ts
interface Props {
  domId: string;
  altLabel: string;
  textGroup: SmoTextGroup;
  pageMap: SvgPageMap;
  scroller: SuiScroller;
  debug: layoutDebug;
  pageLayout: ScaledPageLayout;   // NEW
}
interface Emits {
  (e: 'stop'): void;
  (e: 'reposition'): void;        // NEW
}
interface Expose {
  start(): void;
  stop(): void;                   // both unchanged
}
```

- **New toggle buttons** ("Move Horizontal", "Move Vertical", icon-only via the `.mi` Material Symbols class — both render the `import_export` ligature (a vertical double-arrow glyph); "Move Horizontal" additionally applies an inline `transform: rotate(90deg)` style, since Material Symbols has no distinct horizontal-arrows glyph — with `aria-label`/`aria-pressed`, FR-014): backed by a single local `ref<'none' | 'horizontal' | 'vertical'>('none')` (`lockMode`), not two independent booleans, since the pair is mutually exclusive (FR-003). `setLockMode(mode)` toggles `lockMode` (selecting the already-active mode clears it back to `'none'`) and, when `session` is non-null, derives `session.lockHorizontal = lockMode === 'vertical'` and `session.lockVertical = lockMode === 'horizontal'` — a no-op on `session` otherwise (buttons only render while the component is mounted, which only happens after `start()` is about to be/has been called by the parent).
- **New "Snap" checkbox**: local `ref<boolean>`, defaulting to `false`. On change, mirrors its value directly onto `session.snapEnabled` when `session` is non-null.
- **New buttons** ("Center", "Right Justify", icon-only via `.mi` — `format_align_center`/`format_align_right` — with `aria-label`, FR-014): `@click.prevent` handlers that call `props.textGroup.centerOnPage(props.pageLayout)` / `.rightJustifyOnPage(props.pageLayout)` directly, then `emit('reposition')`. Work regardless of `session.dragging` (FR-009, US2 AC3) since they bypass the drag session entirely (research.md §5) — including before the user has ever pressed the mouse button during this "moving" session.
- **Modified `onMouseMove`** (FR-009, FR-010, FR-011): unchanged early guard (`session && session.dragging`); when `ev.altKey` is true, drops the event unless ≥100ms have elapsed since the last processed event (tracked via a local, non-reactive `lastMoveTime` closure variable, reset to `0` on any non-Alt event so Alt release resumes full-speed processing on the very next event). When the event is processed, delegates to `session.mouseMove(ev)` exactly as today.
- **Unchanged**: `onMouseDown`, `onMouseUp`, `bindWindowHandlers`/`unbindWindowHandlers`, `start()`/`stop()` signatures (their bodies are unaffected — `lockMode`/`snapEnabled` simply default to matching `SuiDragSession`'s own new-field defaults, so no reset code is needed on `stop()`/re-`start()`).

## 4. Modified component: `textBlock.vue`

`src/ui/components/dialogs/textBlock.vue`

- **New computed/derived value**: `pageLayout`, computed once (e.g., alongside `refreshFromModel()`, or lazily when entering `'moving'` mode) as `props.view.score.layoutManager!.getScaledPageLayout(pageIndex)`, where `pageIndex = props.view.renderer.pageMap.getRendererFromModifier(props.modifier.value).pageNumber` — the same accessor pattern `SuiDragSession`'s own constructor already uses to resolve a `SmoTextGroup`'s page.
- **New prop passed to `textDraggerComp`**: `:pageLayout="pageLayout"`, alongside the existing `:textGroup`/`:pageMap`/`:scroller`/`:debug` props at the existing `v-if="mode === 'moving'"` call site.
- **New handler**: `@reposition="onReposition"`, where:
  ```ts
  const onReposition = async () => {
    refreshFromModel();
    await rerender();
  };
  ```
  identical body to the existing `onDragStop` (minus the `mode.value = 'idle'` transition, since a placement-button click does not exit "moving" mode — the user stays in the drag toolbar and may continue dragging or click "Done Dragging Text" separately).
