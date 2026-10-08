# Quickstart: Verify Menus Anchor to Their Triggering Button

This feature has no automated test suite to run (see [plan.md](./plan.md) Technical Context — UI-only changes are validated manually per the project constitution). Use this guide to manually validate the feature end-to-end after implementation.

## Prerequisites

- Node dependencies installed (`npm install`, if not already done).
- The app buildable/runnable via the project's existing dev workflow (e.g. `npm run build` then serving `build/index.js`, or whatever local dev flow this repo currently uses — see `package.json` scripts `server`/`build`).

## Scenario 1 — Standard menu button anchors top-right (`executeButton` path)

1. Launch the app in a browser and open a score.
2. Click a sidebar/menu-producing button whose action is `menu` or `collapseChildMenu` (routed through `RibbonButtons.executeButton`, e.g. a button rendered via the left-sidebar `menuButtons.vue` component).
3. **Expected**: the menu appears anchored at the top-right corner of the button that was clicked, not at the old fixed default location (`{x: 250, y: 40}` in screen pixels).
4. Close the menu, click a *different* menu-producing button in a different screen location, and confirm the menu now opens near that button instead — i.e. the position tracks the clicked button, not a fixed screen coordinate.

## Scenario 2 — Quick button anchors bottom-left (`executeQuickButton` path)

1. Click a top-ribbon quick-action button that results in a menu (e.g. the "select part" button, which calls `menus.createMenu('SuiPartSelectionMenu', ...)` from `executeQuickButton`).
2. **Expected**: the resulting menu appears anchored at the bottom-left corner of that button.

## Scenario 3 — Fallback when no element is available

1. Trigger a menu via a path with no associated on-screen element — e.g. an Alt+hotkey binding handled by `RibbonButtons.handleKeyDown` whose target button is not currently rendered/visible, or any other path that does not resolve to a live DOM id.
2. **Expected**: the menu still opens successfully, at the previous fixed default position, with no error in the browser console.

## Scenario 4 — Regression check

1. Exercise a few different existing menu-opening buttons (top ribbon and sidebar) in sequence.
2. **Expected**: every menu still opens, displays the correct menu content for that button (this feature does not change menu contents), and can be dismissed normally. Only the *position* differs from before.

## Sign-off

Feature is considered validated when Scenarios 1–4 all match their expected outcomes in a real browser session.
