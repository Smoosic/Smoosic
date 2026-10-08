# Data Model: Vue-Rendered Menu Component

This feature has no persistence/schema changes. The "entities" below are the component's prop contract and the manager-side state that changes shape, so the migration can be checked field-by-field.

## `menu.vue` props (unchanged from the existing draft)

| Prop | Type | Used for |
|---|---|---|
| `domId` | `string` | Carried through from the mount-target id (`replaceVueRoot`'s return value), for parity with this codebase's other components that take a `domId` for building child element ids; not required by any behavior this feature adds. |
| `menuParams` | `SuiMenuParams` | Supplies `eventSource` (R4's keydown subscription target) and the rest of the menu's construction parameters; not otherwise read by the template. |
| `menuStructure` | `SuiConfiguredMenu` | The already-`preAttach()`-ed menu instance. Source of `label`, `menuOptions` (filtered per R3 to build the visible list), and the target of `selectItem`'s `complete()` call. |

## `menu.vue` internal state (new, replacing manager-side equivalents)

| State | Replaces (today, in `manager.ts`) | Notes |
|---|---|---|
| Filtered visible items: `menuStructure.menuOptions.filter((x) => x.display(menuStructure))` | `SuiConfiguredMenu.preAttach()`'s `menuItems` (still computed there too, for consistency, but no longer read by the component — see research.md R3) | Recomputed once at the top of `<script setup>`; each entry carries both `menuChoice` (for rendering) and `handler` (for `selectItem`). |
| Per-item assigned hotkey char, written onto `item.menuChoice.hotkey` | `attach()`'s `vkey` loop | Same character-assignment algorithm, same shared-option-object mutation pattern as today (research.md R4). |
| Local `ref<number>` focus index | `SuiMenuBase.focusIndex` / `SuiMenuManager._advanceSelection` | Used only for Up/Down-arrow visual focus cycling within the mounted instance. |
| `handler` reference returned by `eventSource.bindKeydownHandler(...)` in `onMounted` | `SuiMenuManager.keydownHandler` (a *different*, still-manager-owned handler — this is an additional, independent one; see research.md R4/R7) | Stored in a local variable closed over by `onUnmounted`, so it can be passed to `eventSource.unbindKeydownHandler(...)`. |

## `SuiMenuManager` (`src/ui/menus/manager.ts`) state changes

| Field/Method | Change |
|---|---|
| `menuApp: App \| null` | **New.** Holds the currently-mounted Vue `App` instance so `unattach()`/`attach()` can call `.unmount()` (research.md R7). |
| `hotkeyBindings: Record<string, string>` | **Removed.** Hotkey-to-value dispatch is now internal to the mounted `menu.vue` instance (research.md R4/R5). |
| `optionElements` (getter) | **Removed.** No longer needed; nothing outside the component queries menu-item DOM. |
| `_advanceSelection(inc: number)` | **Removed.** Replaced by the component's own local focus-index ref (research.md R4). |
| `attach()` | Rewritten per research.md R1/R2: mounts `menu.vue` via `replaceVueRoot` + `createApp(...).mount(...)` instead of building `<ul>/<li>/<a>` markup with `buildDom`; keeps setting `z-index`/position on `this.menuContainer`. |
| `unattach()` | Gains `this.menuApp?.unmount(); this.menuApp = null;` alongside its existing DOM-clear/state-reset (research.md R7). |
| `displayMenu()` | Drops the `this.menu!.menuItems.forEach(...)` loop that built `hotkeyBindings` (that state no longer exists at this level); still calls `preAttach()` then `attach()`, unchanged. |
| `evKey()` | The `if (this.menu) { ... }` block's body (arrow-key/hotkey dispatch) is removed, leaving just the guard (`return;`); Escape/Tab/Enter/Qwerty handling above it and the "no menu open" hotkey-to-open branch below it are unchanged (research.md R5). |
| `bindEvents()` | Drops the `.dropdown-item` click-delegation block; keeps the one-time global `eventSource.bindKeydownHandler(evkey)` subscription guarded by `this.bound` (research.md R6). |

No changes to `SuiMenuManagerParams`, `createMenu`, `captureMenuEvents`, `dismiss`, `closeModalPromise`, `menuKeyBindingDefaults`, or any `SuiConfiguredMenu`/`SuiConfiguredMenuOption`/individual menu definition (research.md R8).
