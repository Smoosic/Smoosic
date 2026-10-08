# Research: Score Text Drag Controls

## 1. Where does direction-lock/snap logic belong?

**Decision**: Add `lockHorizontal`, `lockVertical`, `snapEnabled` (all default `false`) as public mutable fields directly on the existing `SuiDragSession` class (`src/render/sui/textEdit.ts`), consulted at the top of the existing `mouseMove()` (and a `dragOriginBox` snapshot captured in the existing `startDrag()`), rather than creating a new drag-session subclass or a separate "drag policy" object.

**Rationale**: `SuiDragSession.mouseMove()` is already the single choke point through which every live drag position update flows (`textDragger.vue`'s `onMouseMove` calls `session.mouseMove(ev)` on every window `mousemove`). Locking/snapping is naturally "adjust the proposed box before it's committed" — a few extra lines in the method that already computes that box, not a new abstraction. This is the same reasoning `020-annotation-drag-tool` used to justify reusing precedent patterns rather than inventing new ones.

**Alternatives considered**:
- *New `SuiDragSession` subclass per mode*: rejected — lock/snap are independent toggles that can combine (e.g., snap + lock-vertical together, per spec AC), not mutually exclusive modes; subclassing per combination would explode into 8 variants for no benefit over 3 booleans.
- *Push the math into `textDragger.vue` instead of `SuiDragSession`*: rejected — `textDragger.vue` only ever sees the raw `MouseEvent`, not the computed SVG-space box (that computation, `clientToSvg` + height offset, is `SuiDragSession`-internal); duplicating it in the Vue component would fork logic that must stay in sync with `startDrag`/`mouseMove`.

## 2. Snap grid size in model coordinates

**Decision**: `gridStep = 10 / this.pageMap.renderScale` (i.e., `10 / SmoGlobalLayout.svgScale`), applied as `Math.round(value / gridStep) * gridStep` to both the proposed `x` and `y` inside `mouseMove()`. `zoomScale` is deliberately **not** part of the divisor.

**Rationale**: Text positions on `SmoTextGroup` (and the `outlineBox`/`svgMouseBox` values `SuiDragSession` computes via `SvgPageMap.clientToSvg`) already live in a "logical" coordinate space that has `svgScale` baked out (`SvgPageMap.pageWidth = layout.pageWidth / layout.svgScale`; `clientToSvg` divides by `zoomScale * renderScale` to get there from raw client pixels). `svgScale` is a fixed per-score rendering-density setting (the "svg scale" the spec explicitly names), while `zoomScale` is the transient UI zoom level the user can freely change while viewing. Dividing only by `svgScale` means the grid is a **constant 10 px-equivalent spacing in model space** — it doesn't visually change size as the user zooms in/out, which is exactly what spec SC-003 ("grid-aligned... at any page zoom level") requires. Had `zoomScale` also been divided out, the model-space grid step would shrink/grow with the live zoom level, meaning the *same* dragged position could snap to a different logical coordinate depending on transient view state — an inconsistency the spec's wording ("adjusted for svg scale", not "svg scale and zoom") already steers away from.

**Alternatives considered**:
- *Snap in raw client-pixel space, then convert*: rejected — would require re-deriving the SVG-space box from a snapped client box every event (extra `svgToClient`/`clientToSvg` round-trip) for no benefit, since the model-space grid is already screen-pixel-equivalent via `svgScale` alone.
- *`gridStep = 10 / (renderScale * zoomScale)`*: rejected per SC-003 reasoning above — would make the grid float with zoom instead of staying fixed.

## 3. Order of operations: snap vs. lock

**Decision**: Inside `mouseMove()`, apply snap to the proposed `x`/`y` first, then overwrite the locked axis/axes with the value captured in `dragOriginBox` at `startDrag()` time (not with the previous frame's `outlineBox`).

**Rationale**: Snapping before locking means a locked drag still benefits from a consistent snapped *start* position (captured once), and the locked axis never drifts or re-rounds across frames — it's pinned to exactly one value for the whole drag, avoiding any chance of a 1-unit oscillation from repeated rounding of a near-boundary value. Using the `startDrag`-time snapshot (new `dragOriginBox` field) rather than reading back the previous `outlineBox` also decouples locking from whatever else mutates `outlineBox` (e.g., `checkBounds()` clamping), keeping the locked axis exact for the life of the drag.

**Alternatives considered**:
- *Lock before snap*: rejected — functionally near-identical (the locked axis is constant either way), but snapping a constant value on every frame is redundant work; locking last is simpler to reason about ("snap the candidate, then pin whichever axis is locked").
- *Re-use `this.outlineBox` as the lock reference instead of a new snapshot*: rejected — `outlineBox` is reassigned every `mouseMove` and clamped by `checkBounds()`, so it's a moving target; a dedicated immutable-for-the-drag snapshot is clearer and cheaper (one extra field vs. re-deriving intent from mutable state).

## 4. Alt-key "slow mode" throttling

**Decision**: Implement entirely inside `textDragger.vue`'s existing `onMouseMove` window handler — not inside `SuiDragSession`. Track `lastMoveTime` (via `performance.now()`) in the component's closure; while `session.dragging && ev.altKey`, drop the event unless ≥100ms have elapsed since the last processed event; on any non-Alt event, reset `lastMoveTime` to `0` so the next event is never throttled (Alt release resumes full speed immediately, satisfying FR-011).

**Rationale**: The spec explicitly names the function ("...if the user holds the 'alt' key down while dragging, drag in 'slow mode' so the onMouseMove only processes dragging events every 100ms") — `onMouseMove` is the literal handler already defined in `textDragger.vue`. `MouseEvent.altKey` is only available on the raw browser event, which `SuiDragSession.mouseMove(e: any)` also receives, but throttling at the outer handler means throttled-away events never even reach `SuiDragSession`, keeping the session itself simple (it always processes whatever it's given, exactly as today) and keeping all "when do we even call the session" policy in one place alongside the existing `mousedown`/`mouseup` wiring.

**Alternatives considered**:
- *Throttle inside `SuiDragSession.mouseMove`*: rejected — would require the session to track wall-clock time and `altKey` state itself, muddying a class whose job today is pure geometry; also harder to unit-reason-about since `mouseMove` would sometimes silently no-op for timing reasons unrelated to `dragging`.
- *`setTimeout`/`requestAnimationFrame`-based throttling*: rejected — adds async scheduling complexity (and potential stale-closure bugs across rapid Alt press/release) for no benefit over a synchronous timestamp gate, since mouse events already arrive at a bounded rate and we only need to *drop*, never *delay/replay*, excess ones.

## 5. Center / right-justify: where the math lives and what it needs

**Decision**: Add `SmoTextGroup.centerOnPage(layout: ScaledPageLayout)` and `SmoTextGroup.rightJustifyOnPage(layout: ScaledPageLayout)` to `src/smo/data/scoreText.ts`. Both read `this.logicalBox.width` (already populated by the existing render pass — same field `SuiDragSession.endDrag()` already reads via `this.textGroup.logicalBox`) and `this.ul().x` (existing helper), compute a target `x` using the same two formulas `createLandmarkText`'s `xJustify` branch already uses (`center`: `leftMargin + printableWidth/2 - width/2`; `right`: `pageWidth - rightMargin - width`), and call the existing `this.offsetX(targetX - this.ul().x)`. The caller (`textDragger.vue`) obtains `layout: ScaledPageLayout` via a new prop computed once in `textBlock.vue` (`props.view.score.layoutManager!.getScaledPageLayout(pageIndex)`, `pageIndex` from `props.view.renderer.pageMap.getRendererFromModifier(props.modifier.value).pageNumber` — the same accessor `SuiDragSession`'s constructor already uses).

**Rationale**: `createLandmarkText` (added by an earlier text-annotation feature) already solved "where does centered/right-justified text sit relative to a page's margins" using exactly this `ScaledPageLayout` shape and exactly this pair of formulas — reusing it keeps a single source of truth for "what does centered/right-justified mean on this page" instead of a second, potentially-divergent implementation. Reading `this.logicalBox.width` (rather than re-measuring via a temporary `SuiTextBlock`, as `SuiDragSession`'s constructor does) keeps these two methods pure/DOM-free (Constitution Principle #4) and cheap (Principle #3 — no render pass triggered just to place the text), at the cost of requiring the group to have been rendered at least once — already guaranteed here, since `textDragger.vue` only exists while a previously-rendered `SmoTextGroup` is being edited.

**Alternatives considered**:
- *Route center/right-justify through `SuiDragSession`/`SuiTextBlock` (i.e., treat them like a synthetic drag)*: rejected after tracing `SuiDragSession`'s constructor — `SuiTextBlock.fromTextGroup` builds a temporary clone but does **not** unrender the original until `startDrag()` runs; calling a session-based placement method before the user ever presses the mouse button would render a second, duplicate copy of the text on top of the still-visible original. Committing directly to the model (like the existing `onXChange`/`onYChange` position fields already do) sidesteps this entirely and matches spec FR-009 ("must not require an active drag session").
- *Compute width by re-rendering a temporary `SuiTextBlock` each click (mirroring `SuiDragSession`'s constructor)*: rejected — unnecessary work and a second measurement code path, when `logicalBox` is already fresh (the dialog only reaches its idle/moving controls after at least one render).
