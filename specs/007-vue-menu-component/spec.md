# Feature Specification: Vue-Rendered Menu Component

**Feature Branch**: `007-vue-menu-component`

**Created**: 2026-09-02

**Status**: Draft

**Input**: User description: "change the logic for menu manager /src/ui/menus/manager.ts to create menus using a component vue in /src/ui/components/menu.vue.    Have the attach method create the vue component instead of using dom manipulation directly.  Move the other logic for managing menu events to the menu component, after mount."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Every menu still shows exactly the right choices and opens the same way (Priority: P1)

As a score editor user, when I open any menu (Language, Lines, Score Settings, Parts, Note, Beam, or any other), I see exactly the choices that are currently valid — no extra or missing items — and the menu is drawn on screen the same way it is today, even though it's now rendered by a Vue component instead of hand-built HTML strings.

**Why this priority**: This is the core of the request — `SuiMenuManager.attach()` (`src/ui/menus/manager.ts`) switches from `buildDom`-based DOM construction to mounting the existing `menu.vue` component (`src/ui/components/menus/menu.vue`). Nothing else matters if the rendered menu shows the wrong items or fails to appear.

**Independent Test**: Open each menu in the running app, including one with view-state-conditional options (Score Settings, in both full-score and part-exposed view) and one with a dynamically-built list (Parts, with and without a part exposed), and confirm the exact same set of choices appears as before this change.

**Acceptance Scenarios**:

1. **Given** any menu with only unconditional choices (e.g. Language), **When** it is opened, **Then** every one of its choices renders, labeled and ordered the same as today.
2. **Given** Score Settings is opened while a part is exposed, **When** the menu renders, **Then** Page Layout, Global Layout, and System Groups do not appear and View All does, matching the option's own `display` condition.
3. **Given** Score Settings is opened while viewing the full score, **When** the menu renders, **Then** Page Layout, Global Layout, and System Groups appear and View All does not.

---

### User Story 2 - Selecting a menu item and using the keyboard still work the same way (Priority: P2)

As a score editor user, after a menu is open, I can click a choice to perform it and close the menu, use the keyboard hotkey shown next to a choice to select it, use Up/Down arrows to move focus between choices, and press Escape to dismiss the menu without choosing anything — all exactly as I can today.

**Why this priority**: This is the "move the other logic for managing menu events to the menu component, after mount" half of the request. It depends on User Story 1 (the menu must render via the component before its own events can be wired to that render), and is what makes the migrated menu actually usable, not just visible.

**Independent Test**: With any menu open, click a non-Cancel choice and confirm it performs the same action as today and the menu closes; reopen it, press its hotkey key and confirm the same result; reopen it, press Down/Up arrows repeatedly and confirm focus cycles through only the visible choices and wraps around; reopen it and press Escape, confirming the menu closes with no choice performed.

**Acceptance Scenarios**:

1. **Given** a menu is open, **When** the user clicks a choice (including Cancel), **Then** that choice's action runs (no action, for Cancel) and the menu closes.
2. **Given** a menu is open, **When** the user presses the hotkey shown next to a visible choice, **Then** that choice is selected exactly as a click on it would be.
3. **Given** a menu is open, **When** the user presses Down (or Up) repeatedly, **Then** keyboard focus moves forward (or backward) through the currently visible choices only, wrapping from the last to the first (or first to last).
4. **Given** a menu is open, **When** the user presses Escape, **Then** the menu closes and no choice's action runs.

---

### User Story 3 - Opening and closing menus repeatedly never leaves stray behavior behind (Priority: P3)

As a score editor user, when I open a menu, close it, and open the same menu or a different one again — repeatedly, in any order — each menu behaves independently: a click or keypress only ever affects the menu that's currently open, never a leftover binding from a menu I already closed.

**Why this priority**: Lowest priority because it's a robustness property rather than a new visible capability, but it matters once event handling moves from the menu manager's single shared DOM-query-based wiring into per-mount component logic — without care, mounting a fresh component instance on every open could accumulate duplicate listeners instead of today's `off()`-before-`on()` guarantee.

**Independent Test**: Open a menu, close it via Escape, open a different menu, select a choice from it, then reopen the first menu and confirm a single click/keypress produces exactly one action, not several.

**Acceptance Scenarios**:

1. **Given** a menu was opened and closed at least once already, **When** it (or another menu) is opened again, **Then** exactly one instance of its click/keydown handling is active — a single click or keypress produces exactly one resulting action.
2. **Given** a menu is closed (by selection, Cancel, or Escape), **When** it closes, **Then** its event handling stops responding to further clicks or keypresses until it (or another menu) is opened again.

---

### Edge Cases

- The already-started `menu.vue` component's option filter currently tests the `display` function's *presence* rather than calling it, so every option renders regardless of its actual visibility condition; this must be corrected so only options whose `display(menuStructure)` currently evaluates to `true` are shown, matching the behavior already established for `SuiConfiguredMenu`-based menus.
- The already-started `menu.vue` component's click handler currently invokes an item's handler but does not close the menu afterward; closing must be added so behavior matches today's combined "run handler, then close" click behavior.
- `SuiMenuManager.createMenu`'s hotkey-based bindings (`SuiMenuManager.menuKeyBindingDefaults`, e.g. `l` for Lines, `p` for Parts) and the keyboard-takeover handoff to/from `CompleteNotifier` are outside a single menu's own render lifecycle and are not affected by this change — only what happens once a menu is already being displayed changes.
- `SuiPartSelectionMenu`'s per-open dynamic option rebuild (its overridden `preAttach()`, from feature `#006`) must continue to run before the component renders, so the Parts menu still reflects the score's current part map on every open.
- A menu with zero currently-visible options (theoretically possible if every option's `display` were false) should still render its Cancel option and label, matching `SuiConfiguredMenu`'s existing guarantee that a Cancel option is always present.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `SuiMenuManager.attach()` (`src/ui/menus/manager.ts`) MUST mount the `menu.vue` component (`src/ui/components/menus/menu.vue`) into `this.menuContainer` using the codebase's existing convention for mounting a component from non-Vue code (as already used elsewhere in `src/ui/buttons/ribbon.ts` and `src/ui/dialogs/dialog.ts`), instead of building the menu's markup directly with `buildDom`.
- **FR-002**: The mounted `menu.vue` instance MUST be given the currently-open `SuiConfiguredMenu` instance (plus whatever identifying/positioning parameters it needs) as props, and MUST render only the options whose `display` function currently evaluates to `true` against that instance — correcting the component's existing filter, which currently checks only that `display` is defined rather than invoking it.
- **FR-003**: Selecting a rendered menu item (by click or by keyboard, per FR-004) MUST both run that item's `handler` and close the menu afterward, for every item including Cancel, matching today's combined behavior.
- **FR-004**: The keyboard and click event handling that today lives in `SuiMenuManager` and acts on the manager-built DOM — item click dispatch, hotkey-to-item dispatch, Up/Down arrow focus cycling among visible items, and Escape-to-dismiss — MUST be moved into `menu.vue`, set up once the component has mounted, so it operates on the component's own rendered elements.
- **FR-005**: When a menu closes (selection, Cancel, or Escape), MUST release the event bindings `menu.vue` set up on mount, so that opening a menu again — the same one or a different one — never leaves more than one active set of handlers (spec Edge Cases, User Story 3).
- **FR-006**: `SuiMenuManager`'s behavior outside of a single menu's own render/interaction lifecycle — `createMenu`'s hotkey-triggered menu selection, `captureMenuEvents`/`unattach`'s keyboard takeover and handoff via `CompleteNotifier`, and the `closeMenuPromise` used to sequence with dialogs — MUST continue to work exactly as it does today.
- **FR-007**: No `SuiConfiguredMenu`, `SuiConfiguredMenuOption`, or individual menu definition (language.ts, staffModifier.ts, score.ts, partSelection.ts, note.ts, beams.ts, and the rest) needs to change for this feature — it changes only how `SuiMenuManager` renders and wires up a menu that's already been constructed, not what menus exist or how their options behave.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Opening any menu shows exactly the same set of visible choices as before this change, across every menu and every view-state combination tested (including Score Settings' four conditional options and Parts' dynamic list), with zero missing or extra items.
- **SC-002**: Selecting any menu item, by click or by hotkey, performs the same resulting action as before and closes the menu, in 100% of choices tested across all menus.
- **SC-003**: Keyboard-only interaction — hotkey selection, Up/Down navigation with wraparound, and Escape dismissal — behaves identically to today for every menu tested.
- **SC-004**: Opening, closing, and reopening menus repeatedly (including switching between two different menus) never results in a single click or keypress producing more than one action.
- **SC-005**: None of feature `#006`'s (Configured Menu Migration) success criteria regress as a result of this change.

## Assumptions

- The target component is the file that already exists at `src/ui/components/menus/menu.vue`; the user's stated path (`/src/ui/components/menu.vue`) is treated as shorthand for this existing component, and no second, differently-located menu component is created.
- The existing, already-started draft of `menu.vue` (props for the menu's identity/parameters/structure; a label plus a list of clickable items) is the starting point for this feature and is completed and corrected in place, not replaced with a new implementation.
- Mounting follows the codebase's existing convention for attaching a Vue component from TypeScript code outside the main app tree (already used for the ribbon and for dialogs), rather than introducing a new mounting mechanism.
- "Menu events" in scope for relocation to the component are the ones tied to a single menu's own render lifecycle — click dispatch, hotkey dispatch, arrow-key focus cycling, and cleanup on close. Menu-manager-level concerns that span beyond one menu's lifetime — deciding which menu to open, taking over the keyboard from the rest of the app, and the open/close promise handshake used to sequence with dialogs — stay in `SuiMenuManager`.
- This is an internal rendering/architecture change: no menu gains, loses, reorders, or relabels any choice, and no new keyboard shortcut is introduced, beyond the two correctness fixes already called out in Edge Cases (the `display` filter and close-on-select), which restore parity with today's manager-driven behavior rather than changing it.
