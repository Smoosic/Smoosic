# Phase 0 Research: Anchor Menus to Triggering Button

No `[NEEDS CLARIFICATION]` markers were left in the spec or Technical Context, so this phase documents the design decisions needed to turn the request into concrete edits, based on reading the current implementation.

## Decision 1: Where does the "triggering DOM element" id actually come from?

**Decision**: The real, on-screen DOM id of a button is computed at render time inside the Vue templates (`ribbonButtons.vue`, `menuButtons.vue`) as `${domId}-${buttonProps.id}`, via each component's local `getId()` helper — it is **not** simply `ButtonDefinition.id`. The templates must pass this computed id as a second argument on the `callback` invocation; `RibbonButtons` (in `ribbon.ts`) then receives it as the `elementId` parameter and resolves it with `document.getElementById`.

**Rationale**: `ButtonDefinition.id` is a logical/config id shared across ribbon layouts; the same `ButtonDefinition` can be mounted under different `domId` prefixes (top ribbon vs. left sidebar), so only the Vue layer, at render time, knows the final compound id actually present in the DOM. Confirmed by reading `ribbonButtons.vue:15` (`:id="getId(buttonProps.id)"`) and `menuButtons.vue:28` (same pattern via `sidebar.vue`'s nested `getId`).

**Alternatives considered**:
- *Add an `elementId` field directly to `ButtonDefinition`*: rejected — the field would have to be mutated at mount time to the compound id anyway (since it's not known when the static button-definition arrays are authored), which is no simpler than passing it through the callback call, and would leave a static-looking field with render-time-mutated content.
- *Recompute the id inside `ribbon.ts` from known prefixes*: rejected — `ribbon.ts` does not reliably know which `domId` prefix a given click came from (top ribbon vs. sidebar use different prefixing), so this would duplicate/guess Vue-layer logic.

## Decision 2: Signature change for `ButtonCallback`

**Decision**: `export type ButtonCallback = (button: ButtonDefinition, elementId?: string) => Promise<void>;` — a new optional second parameter, not a new field on `ButtonDefinition`.

**Rationale**: Matches how the callback is actually invoked from the templates (`buttonProps.callback(buttonProps)` today) — extending the call to `buttonProps.callback(buttonProps, getId(buttonProps.id))` is a minimal, backward-compatible change (existing callers that ignore the second argument keep working).

## Decision 3: Which function computes which corner, and where does that logic live

**Decision**: Two small helper computations inside `src/ui/buttons/ribbon.ts` (co-located with the two functions that need them, not extracted into a shared utility module, since nothing else needs them):
- `executeButton(buttonElement, buttonData)`: resolves `buttonElement` (already an existing, currently-unused parameter) to a DOM node and, when found, builds an `SvgPoint` from `{ x: rect.right, y: rect.top }` (top-right corner).
- `executeQuickButton(button, elementId?)`: resolves `elementId` (new parameter) to a DOM node and, when found, builds an `SvgPoint` from `{ x: rect.left, y: rect.bottom }` (bottom-left corner).

Both use `Element.getBoundingClientRect()`, which already returns viewport-relative coordinates matching the coordinate space `menuPosition` is consumed in (`manager.ts` sets `left`/`top` CSS pixel offsets on a fixed-position container — see `attach()`).

**Rationale**: `executeButton`'s first parameter, `buttonElement: string`, already exists in the signature today but is unused — this feature is what finally gives it a purpose. Keeping the corner-computation local to `ribbon.ts` avoids introducing a new shared module for two one-line rectangle reads, consistent with the project's preference against premature abstraction.

**Alternatives considered**: A shared `elementAnchor(id, corner)` utility in `htmlHelpers.ts` — rejected as unnecessary indirection for two call sites with different, fixed corners.

## Decision 4: `SuiMenuManager.createMenu` signature and fallback behavior

**Decision**: `async createMenu(action: string, notifier: CompleteNotifier, anchor?: SvgPoint)`. At the top of the method, replace the unconditional `this.menuPosition = { x: 250, y: 40, width: 1, height: 1 };` with: use `{ x: anchor.x, y: anchor.y, width: 1, height: 1 }` when `anchor` is supplied, otherwise keep the existing default. `width`/`height` on `menuPosition` (`SvgBox`) are dead weight already — only `.x`/`.y` are ever read (`attach()` only sets CSS `left`/`top`) — so they stay hardcoded to `1` regardless of anchor source.

**Rationale**: This is the single call site that resets `menuPosition` before every menu open (`manager.ts:239`), so it's the natural place to decide default-vs-anchored. Both existing callers (`ribbon.ts:163` and `ribbon.ts:192`) already flow through this one method.

## Decision 5: Fallback when the element can't be resolved

**Decision**: If `document.getElementById(id)` returns `null` (stale/missing id, or no id was supplied at all), pass `undefined` as the anchor to `createMenu`, which then leaves `menuPosition` at its existing default. No error is raised.

**Rationale**: Directly satisfies spec User Story 3 / FR-005 (graceful fallback, no regression for callers with no known trigger element, e.g. hotkey-driven menu opens in `handleKeyDown`).

## Decision 6: Viewport-edge containment

**Decision**: Out of scope — no new clamping/containment logic is added. If existing CSS/menu-rendering behavior already keeps the menu on-screen, that is unaffected; if it doesn't, that is a pre-existing condition, not a regression introduced here (menus already could be positioned by future/derived coordinates before this feature, just always the same fixed default in practice).

**Rationale**: Matches the spec's Assumptions section, keeps the change strictly to positioning input, not menu layout/rendering logic.
