# Research: Vue-Rendered Menu Component

## R1: Mounting mechanism for `attach()`

**Decision**: `SuiMenuManager.attach()` calls `replaceVueRoot(this.menuContainer)` (the existing helper in `src/ui/common.ts`, which accepts an `HTMLElement`, empties it, appends a fresh child `<div id="...">`, and returns that new id) to get a mount-target id, then `createApp(menuComponent, { domId, menuParams, menuStructure: this.menu }).mount('#' + newId)`, keeping the returned `App` instance on `this.menuApp: App | null` so it can be unmounted later (R5). This is the same two-step "clear and remount" pattern already used for the ribbon (`src/ui/buttons/ribbon.ts`) and every Vue dialog (`src/ui/dialogs/dialog.ts`'s `InstallDialog`, and each `*Vue.ts` creation function).

**Rationale**: Reuses an established, already-proven mounting convention instead of inventing a new one — directly satisfies FR-001 and the spec's Assumption that mounting "follows the codebase's existing convention."

**Alternatives considered**: Calling `createApp(...).mount(this.menuContainer)` directly (mounting onto the container itself, without `replaceVueRoot`'s empty-and-nest step) was considered, since it's one line shorter. Rejected — every other call site in this codebase mounts onto a *fresh child* id via `replaceVueRoot`, not directly onto a possibly-already-mounted-into container; skipping that step risks Vue trying to hydrate/patch into a container it doesn't recognize as its own root on a second open (`this.menuContainer` is a single, reused, long-lived element for the whole app session, per `createTopDomContainer('.menuContainer')` in the constructor), which is exactly the kind of remount hazard `replaceVueRoot` exists to avoid.

## R2: Menu positioning stays in `attach()`, not the component

**Decision**: `attach()` keeps setting `z-index` and the `left`/`top` position (from `this.menuPosition`) via jQuery directly on `this.menuContainer` (the outer container), the same two calls it makes today — just retargeted from the `<ul>` it used to build to the container that now hosts the mounted component. `menu.vue` itself takes no position-related prop and applies no inline position styling.

**Rationale**: Positioning is orthogonal to "menu events" (spec's Assumptions scope event-handling relocation to click/hotkey/arrow-key/cleanup); `this.menuContainer` is already the positioned element in the current code path (`z-index` is already set on it today, only `left`/`top` were on the inner `<ul>`), so moving `left`/`top` up one level to the same container keeps a single, simple positioning story with no new prop plumbing.

**Alternatives considered**: Passing `menuPosition` as a prop and binding `:style` on the component's root `.mdrop` element was considered, for tighter component encapsulation. Rejected as unnecessary scope — it would require a new prop and a new binding for no behavior change, when leaving positioning where it already effectively lives (the container) is simpler and the spec doesn't ask for the component to own positioning.

## R3: Replacing the `display` filter and adding close-on-select (fixing the draft in place)

**Decision**: In `menu.vue`, replace the existing `menuStructure.menuOptions.filter((x) => x.display)` with `menuStructure.menuOptions.filter((x) => x.display(menuStructure))` — actually invoking each option's `display` predicate against the mounted `menuStructure`, exactly mirroring what `SuiConfiguredMenu.preAttach()` already does to populate `menuStructure.menuItems` (so the component's own filtered list and `menuStructure.menuItems` always agree). The per-item click handler becomes an explicit method, e.g.:

```ts
const selectItem = async (option: SuiConfiguredMenuOption) => {
  await option.handler(props.menuStructure);
  props.menuStructure.complete();
};
```
bound as `@click.prevent="selectItem(item)"`, replacing the draft's `@click.prevent="item.handler(menuStructure)"`, which today runs the handler but never closes the menu.

**Rationale**: Directly fixes the two gaps called out in the spec's Edge Cases/FR-002/FR-003. Calling `props.menuStructure.complete()` (inherited from `SuiMenuBase.complete()`) reuses the exact existing dismissal path — `complete()` triggers `body`'s `menuDismiss` event, which is what `SuiMenuManager.captureMenuEvents`'s promise already listens for to run `unattach()` — so no new manager-to-component signaling channel is needed; the component reuses the same "I'm done" signal `SuiConfiguredMenu.selection()` already sends today.

**Alternatives considered**: Having the component call `menuStructure.selection(ev)` (the existing method) instead of calling `option.handler`/`complete()` directly was considered, to reuse more existing code. Rejected — `selection()` is written around a raw DOM event with a `data-value` attribute (`$(ev.currentTarget).attr('data-value')`) so it can look up the matching option by string value; the component already has the actual `SuiConfiguredMenuOption` object in hand from the `v-for`, so re-deriving it from a synthetic string value would be strictly more code for no benefit.

## R4: Hotkey assignment and keyboard handling move into the component

**Decision**: `menu.vue` computes each visible item's hotkey character itself, in `onMounted` (or a `computed`), reproducing today's `attach()` loop exactly — `vkey = (index < 10) ? String.fromCharCode(48 + index) : String.fromCharCode(87 + index)`, assigned onto `item.menuChoice.hotkey` for the currently-visible, filtered list (same shared-singleton-option-object mutation the current code already does; not changed by this migration). In `onMounted`, the component calls `props.menuParams.eventSource.bindKeydownHandler(handler)` where `handler` implements exactly what `SuiMenuManager._advanceSelection`/`evKey`'s hotkey lookup do today: `ArrowUp`/`ArrowDown` move a local `ref<number>` focus index (wrapping) among the visible items and re-focus the corresponding rendered element; any other key matching a visible item's assigned hotkey calls the same `selectItem` (R3) for that item.

**Rationale**: Directly satisfies FR-004. `SuiMenuParams` (already passed in as the `menuParams` prop) carries the same `eventSource: BrowserEventSource` instance `SuiMenuManager` itself uses, so the component can bind/unbind against it exactly the way `InstallDialog` already does for its own Escape handler (`src/ui/dialogs/dialog.ts`) — a directly precedented pattern for "a mounted Vue piece owns its own keydown subscription," not a new mechanism.

**Alternatives considered**: Keeping hotkey/arrow dispatch in `SuiMenuManager.evKey` and having it reach into the component (e.g., via a template ref or exposed method) was considered, to avoid a second `eventSource` subscription existing at the same time as the manager's own. Rejected — it would keep `SuiMenuManager` coupled to per-item DOM/hotkey details it no longer renders, which is exactly what FR-004 asks to stop; `BrowserEventSource.bindKeydownHandler` already supports multiple independent handlers cleanly (`keydownHandlers` is an array; every handler runs on every keydown — confirmed in `src/ui/eventSource.ts`), so a second, independent subscription is a supported, unsurprising pattern, not a hack.

## R5: `SuiMenuManager.evKey` keeps Escape and the "no menu open" hotkey-to-open dispatch; loses only the now-relocated per-item logic

**Decision**: `evKey()` keeps: `Qwerty.handleKeyEvent(event)`, the `Tab`/`Enter` passthrough, `event.preventDefault()`, and the unconditional `if (event.code === 'Escape') { this.dismiss(); }` — all unchanged, since Escape dismissal already runs regardless of whether a menu is open and needs no per-menu DOM. It also keeps the `if (this.menu) { return; }` guard (so a hotkey that would otherwise open a *new* menu can't fire while one is already open), but with its body's contents removed (`_advanceSelection`, `optionElements`, and the `hotkeyBindings`-driven `$('a[data-value=...]').click()`/`this.menu.keydown()` fallback all deleted, along with the `hotkeyBindings` field, `optionElements` getter, and `_advanceSelection` method entirely) since that logic now lives in the component (R4). The "no menu is open yet, check `this.menuBind` for a hotkey that opens one" branch below the guard is unchanged.

**Rationale**: Preserves FR-006 (Escape/hotkey-to-open/keyboard-takeover behavior outside a single menu's lifecycle stays in the manager) while fully relocating the per-item logic FR-004 asks to move, without leaving dead/unreachable code behind (the old per-item branch would never match anything once the component renders different DOM/classes than `manager.ts`'s old `buildDom` output used).

**Alternatives considered**: Leaving the old per-item branch's code in place "just in case." Rejected — once `menu.vue` renders its own markup (classes `mdrop`/`mitem`, no `data-value` attributes, no `.dropdown-item`/`.menuOption` classes), that old code can never match anything again; keeping it would be silent dead code, not a safety net, and would contradict "move...to the menu component" by leaving a non-functional duplicate behind.

## R6: `SuiMenuManager.bindEvents()` drops its per-item click wiring; keeps the one-time global keydown binding

**Decision**: `bindEvents()` keeps its `if (!this.bound) { ...bindKeydownHandler(evkey)...; this.bound = true; }` block (the one-time, session-lifetime global keydown subscription) unchanged, but removes the `$(this.menuContainer).find('a.dropdown-item').off('click').on('click', ...)` block entirely — that per-item click delegation is superseded by each rendered item's own `@click.prevent="selectItem(item)"` binding in `menu.vue` (R3). `bindEvents()` is still called from both `captureMenuEvents` (before any menu is displayed, to establish the global keydown subscription) and, harmlessly, from `attach()` at the end (now a no-op on the removed part, but the `if (!this.bound)` guard makes repeat calls safe either way, unchanged from today).

**Rationale**: The click-delegation block operated on `.dropdown-item` elements that `buildDom` created; since `menu.vue` doesn't render that class or a `data-value` attribute, that code — like the equivalent piece of R5 — would become permanently dead once the component renders, so it is removed rather than left behind.

**Alternatives considered**: None — this follows directly from R1/R3 once the component owns its own click handling.

## R7: Explicit `unmount()` so the component's own keydown subscription doesn't leak

**Decision**: `SuiMenuManager` keeps a `menuApp: App | null` field. `attach()` calls `this.menuApp?.unmount()` before creating and mounting a new app (defensive, in case a previous instance is somehow still mounted), and `unattach()` calls `this.menuApp?.unmount(); this.menuApp = null;` alongside its existing `$(this.menuContainer).html('')`/state reset. This makes Vue actually run `menu.vue`'s `onUnmounted` hook, which calls `props.menuParams.eventSource.unbindKeydownHandler(handler)` (the same `handler` reference bound in R4's `onMounted`) — releasing the component's keydown subscription every time a menu closes.

**Rationale**: Directly required by FR-005/User Story 3/SC-004 (no accumulating duplicate handlers across repeated open/close cycles). This is a deliberate, minimal addition on top of the codebase's existing dialog convention: `InstallDialog` (`src/ui/dialogs/dialog.ts`) never calls `.unmount()` on the `App` it creates, and its own Escape `bindKeydownHandler` call is never matched by an `unbindKeydownHandler` — an existing, accepted leak for modal dialogs, which open comparatively rarely in a session. Menus are opened far more often (every hotkey press, ribbon click, and part-selection event), so the same leak here would accumulate fast enough to be user-visible (spec's Edge Cases/User Story 3 explicitly call this out), justifying the small extra step dialogs don't bother with.

**Alternatives considered**: Matching the dialog precedent exactly (never unmount, accept the leak) was considered, for consistency with the rest of the codebase. Rejected — it would directly fail the spec's own FR-005/SC-004, which exist specifically because relocating event binding into a per-mount component makes this leak newly visible/testable in a way it wasn't when a single long-lived manager instance owned one shared subscription for the whole session.

## R8: No changes needed to `SuiConfiguredMenu`/`SuiMenuBase`/individual menu files

**Decision**: `SuiMenuBase.focusIndex` is left in place, unused after this migration (the component keeps its own local focus-index `ref` instead, per R4) rather than removed. No menu definition file (language.ts, staffModifier.ts, score.ts, partSelection.ts, note.ts, beams.ts, measure.ts, voices.ts, etc.) changes.

**Rationale**: Matches spec FR-007 and Assumptions directly. `focusIndex` becoming dead state on `SuiMenuBase` is a pre-existing-shape field, not new dead code introduced by this feature; removing it would be an unrelated cleanup outside this feature's scope (and would touch `menu.ts`, which the spec explicitly says doesn't need to change).

**Alternatives considered**: Removing `SuiMenuBase.focusIndex` as drive-by cleanup. Rejected as out of scope — the spec calls for behavior parity via a rendering/event-wiring change, not a `SuiMenuBase` cleanup pass.
