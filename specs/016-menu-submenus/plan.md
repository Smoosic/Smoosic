# Implementation Plan: Sidebar Menu Submenus

**Branch**: `016-menu-submenus` | **Date**: 2026-09-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/016-menu-submenus/spec.md`

## Summary

Add a submenu capability to the sidebar menu framework (`src/ui/menus/menu.ts` + `src/ui/components/menus/menu.vue`) so a `SuiConfiguredMenuOption` can declare a nested list of choices instead of (or in addition to) a handler. Selecting such an option swaps the currently displayed menu items for the submenu's items in place, reusing the same mounted menu component, keyboard capture, and screen position — no new dialog, no teardown/re-attach of the menu manager. Use this to replace the Notes menu's "Arpeggio" entry: it becomes a submenu of the eight arpeggio styles, each of which calls `view.addRemoveArpeggio(style)` directly when chosen. The existing `SuiArpeggioDialog` (`src/ui/dialogs/arpeggio.ts`) and its Vue dropdown (`src/ui/components/dialogs/arpeggio.vue`) are removed since nothing else references them.

## Technical Context

**Language/Version**: TypeScript (compiled via the project's existing `build/build.js`), Vue 3 `<script setup>` components

**Primary Dependencies**: Existing Smoosic UI menu framework (`src/ui/menus/menu.ts`, `src/ui/menus/manager.ts`, `src/ui/components/menus/menu.vue`); no new external dependencies

**Storage**: N/A (in-memory UI state only; arpeggio style is persisted through the existing `SmoArpeggio` note modifier / score serialization, unchanged by this feature)

**Testing**: No automated UI test harness exists in this repo (`package.json` test script is a no-op); per the project constitution, UI rendering regression is a lower priority and not required to be tested here. Validation is manual, via the `quickstart.md` scenarios below. Any change touching `src/smo` would need regression coverage, but this feature does not modify `src/smo`.

**Target Platform**: Browser (existing Smoosic web application), same as all other sidebar menus

**Project Type**: Single project — front-end UI module within the existing Smoosic application/library

**Performance Goals**: No new performance requirement; the submenu swap must feel instantaneous (no dialog mount/network/animation delay), which is inherent to the in-place list-swap approach

**Constraints**: Must reuse the existing `SuiConfiguredMenu` / `SuiMenuManager` presentation (position, keyboard nav, dismiss) per FR-002; must not require per-choice custom Vue components per FR-003; must not break existing menus that don't use submenus (backward compatible, additive change to the option shape)

**Scale/Scope**: One new optional field on `SuiConfiguredMenuOption`, one rendering branch in `menu.vue`, one new submenu options array (8 entries) for arpeggio, removal of the arpeggio dialog + its Vue component and factory/export references

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle #1 (Serialization)**: Not applicable — this feature changes only how an existing, already-serializable setting (`SmoArpeggio`) is *selected* in the UI. No new fields, no score/measure/note schema changes. **PASS**.
- **Principle #2 (Music editing/transformation logic)**: Not applicable — no new pitch/duration/selection/accidental/clef logic; `addRemoveArpeggio` is reused unchanged. **PASS**.
- **Principle #3 (Rendering performance)**: Not applicable to score SVG rendering — this touches only the sidebar menu overlay, not `scoreRender.ts`/`renderState.ts`/Vex rendering. **PASS**.
- **Principle #4 (Logical dependencies)**: The submenu mechanism lives entirely in `src/ui/menus` and `src/ui/components/menus`, with no new dependency from `src/smo` or `src/render` back into UI. **PASS**.

No violations. Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/016-menu-submenus/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/ui/menus/
├── menu.ts               # MODIFIED: add optional subMenu field + related types to SuiConfiguredMenuOption
└── note.ts                # MODIFIED: arpeggioMenuOption becomes a submenu-bearing option; 8 style choices added

src/ui/components/menus/
└── menu.vue                # MODIFIED: render/select a submenu in place instead of handler+complete

src/ui/dialogs/
└── arpeggio.ts              # REMOVED: SuiArpeggioDialog no longer used

src/ui/components/dialogs/
└── arpeggio.vue              # REMOVED: dropdown dialog no longer used

src/ui/dialogs/factory.ts     # MODIFIED: drop SuiArpeggioDialog registration
src/application/exports.ts    # MODIFIED: drop SuiArpeggioDialog export
```

**Structure Decision**: Single project (existing Smoosic front-end module). All changes are localized to `src/ui/menus`, `src/ui/components/menus`, and the removal of the now-unused arpeggio dialog under `src/ui/dialogs` / `src/ui/components/dialogs`, with two small reference cleanups in `src/ui/dialogs/factory.ts` and `src/application/exports.ts`. No backend, no new top-level directories.

## Complexity Tracking

*No violations — table omitted.*
