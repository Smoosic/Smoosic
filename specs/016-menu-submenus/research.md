# Phase 0 Research: Sidebar Menu Submenus

No `NEEDS CLARIFICATION` markers remain in the Technical Context — the existing codebase fully determines the approach. This document records the decisions made while reading the current menu/dialog implementation.

## Decision 1: Where the submenu swap happens

**Decision**: Implement the submenu as an in-place item-list swap inside the already-mounted `menu.vue` component / `SuiConfiguredMenu` instance, rather than routing through `SuiMenuManager.createMenu` again.

**Rationale**: `menu.vue`'s `selectItem` (`src/ui/components/menus/menu.vue:27-30`) always calls `props.menuStructure.complete()` right after a choice's handler runs, which triggers the `menuDismiss` body event that `SuiMenuManager` listens for to unattach and resolve `closeMenuPromise` (`src/ui/menus/manager.ts:198-220`). If a submenu were opened by calling back out to `SuiMenuManager.createMenu`, the parent menu's `complete()` would fire immediately afterward and tear down what was just shown. Swapping the rendered item list in place avoids fighting that lifecycle entirely, and keeps the existing position/keyboard-capture/dismiss logic (`SuiMenuManager.attach`/`captureMenuEvents`) untouched and working for submenus for free.

**Alternatives considered**:
- *Give `SuiMenuBase` a back-reference/callback into `SuiMenuManager` so handlers can push/pop menus at the manager level.* Rejected: requires threading a new dependency through every menu constructor and duplicates position/keyboard logic that already exists in the mounted component; more surface area for the same result.
- *Open the submenu as a second `SuiMenuManager.createMenu` call stacked on top.* Rejected: `createMenu`/`captureMenuEvents` assumes one active menu session (`this.menu`, `this.closeMenuPromise`) and dismissing the first would cascade into dismissing the second; would need session-stacking logic not required by the feature.

## Decision 2: Shape of the submenu declaration on a menu choice

**Decision**: Add an optional `subMenu?: SuiConfiguredMenuOption[]` (working name) to `SuiConfiguredMenuOption` (`src/ui/menus/menu.ts:137-141`). When present, selecting that option displays `subMenu` as the new item list (reusing the parent's `label`/context unless a distinct label is needed) instead of invoking `handler`. When absent, behavior is exactly what it is today.

**Rationale**: `SuiConfiguredMenuOption` is already the reusable unit every menu (Notes, Measure, Part, Beam, etc.) is built from (`src/ui/menus/*.ts`), and it is a plain data shape, not a class — so this is an additive, backward-compatible field. It satisfies FR-003 (reusable by any menu choice) without inventing a parallel menu type.

**Alternatives considered**:
- *A separate `SuiConfiguredMenu` subclass per submenu, registered with `SuiMenuManager` like a top-level menu.* Rejected: reintroduces the manager round-trip problem from Decision 1, and requires a `ctor` string + registration in `manager.ts` for every submenu, which is exactly the one-off, per-choice wiring FR-003 says to avoid.
- *Encode the submenu as a nested `MenuChoiceDefinition[]` instead of `SuiConfiguredMenuOption[]`.* Rejected: `MenuChoiceDefinition` carries only display data (icon/text/value), not `handler`/`display`; the submenu's leaf items still need handlers (to call `addRemoveArpeggio`), so they need to be full `SuiConfiguredMenuOption`s.

## Decision 3: Arpeggio submenu leaf behavior (no live preview / no backup-restore)

**Decision**: Each of the 8 arpeggio style leaf options calls `menu.view.addRemoveArpeggio(style)` directly and then closes the whole menu session (existing `complete()` behavior), exactly like every other direct-action menu choice (e.g. `toggleCueMenuOption`, `src/ui/menus/note.ts:29-38`). No backup/restore state is needed.

**Rationale**: The current `SuiArpeggioDialog` (`src/ui/dialogs/arpeggio.ts`) applies the style live as the dropdown changes (`arpCb`, line 25) *and* keeps a `backup` to restore on cancel (`cancelCb`, line 22), because a `<select>` dropdown fires a change event before the user has "committed." A menu has no such intermediate state: nothing is applied until an item is clicked, so there is nothing to restore if the user dismisses without choosing — this directly delivers FR-007 with less code than the dialog needed.

**Alternatives considered**:
- *Keep a backup/restore mechanism in the submenu for parity with the dialog's internals.* Rejected: unnecessary — the dialog's backup existed to undo a live-preview side effect that a plain menu selection never causes.

## Decision 4: Removing `SuiArpeggioDialog`

**Decision**: Delete `src/ui/dialogs/arpeggio.ts` and `src/ui/components/dialogs/arpeggio.vue`, and remove their two remaining references: the (already-commented-out) registration line in `src/ui/dialogs/factory.ts:138`, and the live `import`/export in `src/application/exports.ts:60,369`.

**Rationale**: A repo-wide search shows `SuiArpeggioDialog`/`arpeggio.vue` are referenced only from `src/ui/dialogs/factory.ts`, `src/application/exports.ts`, `src/ui/menus/note.ts`, and the dialog's own files — all four are either being changed by this feature or are the dialog itself. FR-006 requires the dropdown dialog no longer be reachable from "Arpeggio"; since nothing else uses it, deleting it (rather than leaving dead code) matches the codebase's convention of not keeping unused UI modules around and avoids an orphaned entry in `exports.ts`'s public surface.

**Alternatives considered**:
- *Leave the dialog files in place but unreferenced from the menu.* Rejected: `exports.ts` is the application's public export surface (used per the constitution's Principle #4 library/application dual-use note); leaving a dead, unreachable dialog exported there is misleading to anyone using Smoosic as a library.
