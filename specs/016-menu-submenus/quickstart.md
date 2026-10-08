# Quickstart: Validating Sidebar Menu Submenus

Manual validation guide — this repo has no automated UI test harness (see [plan.md](./plan.md) Technical Context), so the scenarios from [spec.md](./spec.md) are validated by running the app.

## Prerequisites

- Dependencies installed (`npm install`)
- Dev build running per the project's normal workflow (`npm run build` / whatever local server the repo's existing README/scripts describe), with a score loaded that has at least one note

## Scenario 1 — Open the Arpeggio submenu (User Story 1, Acceptance #1)

1. Select a note in the score.
2. Open the Notes menu from the sidebar.
3. Choose **Arpeggio**.

**Expected**: A submenu appears in place of the Notes menu, listing: Plain, Rasquedo Up, Rasquedo Down, Roll Up, Roll Down, Brush Up, Brush Down, None. No dialog box (no modal with a dropdown/Commit/Cancel buttons) appears — see [data-model.md](./data-model.md) for the exact label list.

## Scenario 2 — Apply a style (User Story 1, Acceptance #2 and #4)

1. From the open Arpeggio submenu, choose **Roll Up**.

**Expected**: The menu closes, the selected note now renders with a roll-up arpeggio mark, and keyboard/mouse control returns to the score editor.

2. Repeat: open Notes → Arpeggio again on the same note, choose **Brush Down** instead.

**Expected**: The note's arpeggio changes from roll-up to brush-down (the previous style is replaced, not stacked).

## Scenario 3 — Dismiss without choosing (User Story 1, Acceptance #3; FR-007)

1. Note has no arpeggio applied (or has one applied — try both).
2. Open Notes → Arpeggio.
3. Press Escape (or choose Cancel, if present in the submenu) without clicking a style.

**Expected**: The note's arpeggio is exactly what it was before step 2 — unchanged either way.

## Scenario 4 — Submenu mechanism is reusable (User Story 2)

This is validated by code inspection rather than a UI flow, per [contracts/submenu-option.md](./contracts/submenu-option.md):

1. Confirm `SuiConfiguredMenuOption` in `src/ui/menus/menu.ts` has the new `subMenu?: SuiConfiguredMenuOption[]` field.
2. Confirm `src/ui/components/menus/menu.vue`'s `selectItem` branches on `subMenu` generically (not on an arpeggio-specific check).
3. Confirm `arpeggioMenuOption` in `src/ui/menus/note.ts` is the only current consumer, but nothing in `menu.vue`/`menu.ts` special-cases arpeggio by name — i.e. another menu file could add its own `subMenu` option using the same field with no changes to the framework files.

**Expected**: SC-003 is satisfied — the mechanism is generic, not arpeggio-specific.

## Regression check

- Open at least one other Notes menu choice that has no submenu (e.g. **Head and Stem**) and confirm it still opens its dialog exactly as before — the additive `subMenu` field must not change existing non-submenu options' behavior.
- Confirm `SuiArpeggioDialog` / `src/ui/components/dialogs/arpeggio.vue` are gone and nothing still imports them (`grep -r SuiArpeggioDialog src` returns no results outside history).
