# Implementation Plan: Anchor Menus to Triggering Button

**Branch**: `008-anchor-menu-to-button` | **Date**: 2026-09-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-anchor-menu-to-button/spec.md`

## Summary

Menus opened from ribbon/sidebar buttons currently always appear at a fixed default screen position (`{x: 250, y: 40}`), regardless of which button opened them. This feature threads the id of the DOM element that was actually clicked through the existing button-callback and menu-creation call paths, computes an anchor point from that element's bounding rectangle (top-right corner for buttons routed through `RibbonButtons.executeButton`, bottom-left corner for buttons routed through `RibbonButtons.executeQuickButton`), and passes that point into `SuiMenuManager.createMenu` so it can override the default `menuPosition` when available. When no element can be resolved, the existing default position is used unchanged.

## Technical Context

**Language/Version**: TypeScript (compiled via the project's existing `tsc`/webpack build), Vue 3 `<script setup>` SFCs

**Primary Dependencies**: Vue 3 (button rendering), jQuery (`$`, existing DOM manipulation in `manager.ts`), native browser DOM APIs (`getElementById`, `getBoundingClientRect`)

**Storage**: N/A — no persisted state; `menuPosition` is transient in-memory UI state on `SuiMenuManager`

**Testing**: Manual verification only. Per the project constitution, rendering/UI-only changes are not required to have automated regression tests (automated testing is prioritized for `src/smo` music-data serialization/transformation logic, which this feature does not touch); see [quickstart.md](./quickstart.md) for the manual verification steps.

**Target Platform**: Web browser (the Smoosic SVG music-notation application)

**Project Type**: Single project — browser application/library (existing `src/` layout, no separate frontend/backend split)

**Performance Goals**: No new performance requirement; the added work per menu-open is a single synchronous `getBoundingClientRect()` call, negligible relative to score rendering.

**Constraints**: Must not touch score/SVG rendering paths (`scoreRender.ts`, `renderState.ts`, Vex rendering) — this feature is scoped entirely to the button-ribbon and menu-chrome UI, which is separate DOM from the rendered score, so it does not interact with the constitution's "measure before render" repaint-avoidance rules.

**Scale/Scope**: 3 source files with behavior changes (`src/ui/buttons/button.ts`, `src/ui/buttons/ribbon.ts`, `src/ui/menus/manager.ts`) plus 2 Vue templates that need to pass the clicked element's real DOM id (`src/ui/components/buttons/ribbonButtons.vue`, `src/ui/components/buttons/menuButtons.vue`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle #1 (Serialization)**: N/A. No SMO/score data model is touched; `ButtonDefinition` and `SuiMenuManager` are UI-only classes with no serialized representation.
- **Principle #2 (Music editing/transformation logic)**: N/A. No pitch, duration, selection, accidental, or clef logic is touched.
- **Principle #3 (Rendering performance)**: PASS. The only DOM measurement added (`getBoundingClientRect()` on a button element) happens in response to a user click on chrome UI, not during score render, and does not run before or interleave with score-render measurement/painting. No change to `scoreRender.ts`, `renderState.ts`, or Vex rendering.
- **Principle #4 (Logical dependencies)**: PASS. All changes stay within `src/ui` (buttons/menus). No new dependency is introduced from `src/smo` or the renderer into UI code, or vice versa.

No violations. Complexity Tracking section is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/008-anchor-menu-to-button/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── checklists/
    └── requirements.md  # Spec quality checklist (/speckit-specify command)
```

No `contracts/` directory: this feature has no external API, CLI, or data-interchange surface — it is purely internal UI wiring between existing in-process TypeScript/Vue components.

### Source Code (repository root)

**Structure Decision**: Single project (existing Smoosic layout). All changes live under the existing `src/ui` tree; no new top-level directories are introduced.

```text
src/
├── ui/
│   ├── buttons/
│   │   ├── button.ts        # ButtonCallback type gains an optional elementId parameter
│   │   └── ribbon.ts        # executeButton / executeQuickButton compute an anchor SvgPoint
│   │                        #   and pass it to menus.createMenu(); callback wrappers forward elementId
│   ├── menus/
│   │   └── manager.ts       # SuiMenuManager.createMenu() accepts optional SvgPoint anchor,
│   │                        #   uses it to set menuPosition when present
│   └── components/
│       └── buttons/
│           ├── ribbonButtons.vue   # passes the actual rendered element id to buttonProps.callback
│           └── menuButtons.vue     # passes the actual rendered element id to buttonProps.callback
```

## Complexity Tracking

*No Constitution Check violations — this section is not applicable.*
