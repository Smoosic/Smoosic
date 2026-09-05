# Quickstart: Validating the Vue-Rendered Menu Component

No automated UI test suite exists for menus (`npm test` is a no-op in this repo — see `plan.md` Technical Context), so validation is a TypeScript build plus manual, in-browser exercise.

## Prerequisites

- Node/npm installed, repo dependencies installed (`npm install`, if not already)
- Local build/serve pipeline available

## Setup

1. Type-check / build: `npm run build` (or `npm run types`) — must complete with no new TypeScript errors.
2. Serve it: `npm run server`
3. Open the score editor in a browser and load or create a score with at least two parts/staves (to exercise Score Settings' and Parts' conditional/dynamic options).

## Validation scenarios

### Rendering parity (User Story 1)

1. Open each menu (Language `/l`-equivalent hotkey or ribbon, Lines, Score Settings, Parts, Note, Beam, etc.) and confirm the same items appear, in the same order, as before this change.
2. With the full score in view, open Score Settings — confirm Page Layout, Global Layout, and System Groups appear and View All does not.
3. Expose a single part, open Score Settings again — confirm the reverse (those three hidden, View All shown).
4. Open Parts with no part exposed — confirm one item per part and no View All; expose a part and reopen — confirm View All now appears too.

### Selection and keyboard (User Story 2)

1. Click a non-Cancel choice in any menu — confirm its action runs and the menu closes.
2. Reopen the same menu, press the hotkey character shown next to a choice — confirm it performs the same action as clicking it.
3. Reopen, press Down repeatedly — confirm focus moves forward through only the visible choices and wraps from the last back to the first; press Up and confirm the reverse.
4. Reopen, press Escape — confirm the menu closes with no action performed.
5. Open Cancel by click and by clicking the Cancel item specifically — confirm the menu simply closes with no other effect.

### No leaked handlers (User Story 3)

1. Open a menu, press Escape to close it, open a different menu, select a choice from it (closing it), then reopen the first menu.
2. Press a single hotkey once — confirm exactly one action results (not two, not zero). If a stale handler had leaked from step 1's menu, this step would trigger two actions from one keypress.
3. Repeat open/close 5-10 times across different menus, then confirm step 2 still holds (one keypress → one action).

## Regression checks

- `grep -n "buildDom" src/ui/menus/manager.ts` should no longer show it used to build menu item markup (SC-001 mechanism check) — `buildDom` may still be imported/used elsewhere in the file only if something outside menu rendering still needs it; otherwise the import should be gone too.
- `grep -n "hotkeyBindings\|optionElements\|_advanceSelection" src/ui/menus/manager.ts` should return no matches — confirms research.md R5/R6 (relocated logic, not left as dead code).
- `grep -n "eventSource.bindKeydownHandler" src/ui/components/menus/menu.vue` should show exactly one call, paired with an `eventSource.unbindKeydownHandler` call reachable from `onUnmounted` — confirms research.md R4/R7.
- `npm run build` (or `npm run types`) exits with no new errors.

## Done when

- All rendering-parity checks above pass for every menu, including the conditional/dynamic ones (SC-001).
- All selection/keyboard checks above pass (SC-002, SC-003).
- The no-leaked-handlers check passes after repeated open/close cycles (SC-004).
- Regression greps come back clean and the build/typecheck is clean.
