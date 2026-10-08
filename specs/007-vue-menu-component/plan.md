# Implementation Plan: Vue-Rendered Menu Component

**Branch**: `007-vue-menu-component` | **Date**: 2026-09-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-vue-menu-component/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Convert `SuiMenuManager.attach()` (`src/ui/menus/manager.ts`) from building menu markup with `buildDom` to mounting the already-started `menu.vue` component (`src/ui/components/menus/menu.vue`) via this codebase's existing `replaceVueRoot` + `createApp(...).mount(...)` convention. Two real gaps in the draft component are fixed in place: its `display` filter currently tests that the function exists rather than calling it (so conditional options always show), and its click handler runs an item's `handler` but never closes the menu. Item-level event handling — click dispatch, hotkey character assignment and dispatch, and Up/Down arrow focus cycling — moves from `SuiMenuManager` (which today builds and re-queries the menu's own DOM with jQuery after the fact) into `menu.vue`'s own `onMounted`/`onUnmounted` lifecycle, binding and unbinding its own keydown subscription against the same `eventSource` the manager already uses (the same pattern `InstallDialog` already uses for its Escape handler). `SuiMenuManager` keeps everything that operates beyond a single menu's own lifetime: Escape-to-dismiss, hotkey-to-*open*-a-menu dispatch, the keyboard-takeover handoff via `CompleteNotifier`, and the `closeMenuPromise` handshake used to sequence with dialogs. A small addition beyond the dialog precedent — explicitly unmounting the previous `App` instance before/when a menu closes — is required so the component's `onUnmounted` cleanup actually runs and its keydown subscription doesn't accumulate across repeated opens.

## Technical Context

**Language/Version**: TypeScript 5.9 (Vue 3.5 `<script setup lang="ts">` SFCs)

**Primary Dependencies**: Vue 3 (Composition API, `createApp`/`onMounted`/`onUnmounted`/`ref`); existing helpers `replaceVueRoot` (`src/ui/common.ts`) and `BrowserEventSource.bindKeydownHandler`/`unbindKeydownHandler` (`src/ui/eventSource.ts`); the existing `SuiConfiguredMenu`/`SuiConfiguredMenuOption`/`SuiMenuParams` types (`src/ui/menus/menu.ts`, unmodified — from features `#006`/prior)

**Storage**: N/A — no persistence changes; menus continue to read/write the existing in-memory `SmoScore` via each option's own `handler`, unchanged

**Testing**: No automated test harness covers menu rendering/events (`npm test` is a no-op in this repo); validation is manual, in-browser, per `quickstart.md`, plus a TypeScript build

**Target Platform**: Browser (Smoosic web score editor UI)

**Project Type**: Single front-end project (`src/ui`, bundled via webpack)

**Performance Goals**: N/A — menus are opened on user-initiated hotkeys/clicks, not on any render-performance-sensitive path; mounting/unmounting a small Vue component on menu open/close is not a hot loop

**Constraints**: Must preserve every menu's exact visible-option set per current view state (spec SC-001), exact click/hotkey selection-and-close behavior (SC-002), exact keyboard navigation behavior (SC-003), and must not accumulate duplicate event handlers across repeated open/close cycles (SC-004, the one place this plan deliberately does *more* than the codebase's existing dialog-mounting precedent, per research.md R7); must not change any `SuiConfiguredMenu`/`SuiConfiguredMenuOption`/individual menu definition file (SC-005, spec FR-007)

**Scale/Scope**: 2 files edited — `src/ui/menus/manager.ts` (attach/unattach/displayMenu/evKey/bindEvents, plus a new `menuApp` field) and `src/ui/components/menus/menu.vue` (completing the existing draft: fixed filter, close-on-select, hotkey assignment/dispatch, arrow-key focus cycling, mount/unmount-scoped keydown subscription); 0 new files, 0 changes to menu definitions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Checked against `.specify/memory/constitution.md`'s four principles:

- **Principle #1 (Serialization)**: N/A — no `src/smo` data model, persisted field, or score-file format is touched.
- **Principle #2 (Music editing/transformation logic)**: N/A — no pitch, duration, selection, accidental, or clef calculation logic is added or changed; every option's `handler` is unchanged (invoked the same way, just from a different call site).
- **Principle #3 (Rendering performance)**: N/A — menus are UI overlays outside the SVG score-rendering path (`scoreRender.ts`/`renderState.ts`/`src/render/sui/vex`); mounting a small Vue component on menu open is not part of that path and isn't a hot loop.
- **Principle #4 (Logical dependencies)**: Satisfied — the migration stays within `src/ui/menus` and `src/ui/components/menus`; it introduces no dependency from `src/smo` or `src/render` on UI code, or vice versa.
- **General guidance ("avoid race conditions by judicious use of async/await")**: Directly relevant — `menu.vue`'s `selectItem` must `await option.handler(...)` before calling `complete()` (research.md R3), preserving the same sequencing `SuiConfiguredMenu.selection()` already guarantees today.

No violations. Gate passes trivially — no complexity table needed.

## Project Structure

### Documentation (this feature)

```text
specs/007-vue-menu-component/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

No `contracts/` directory is generated: this feature has no external API, CLI, or service surface — it changes only how `SuiMenuManager` renders and wires up an already-constructed menu, with no change to `SuiMenuManagerParams` or any other consumer-facing interface.

### Source Code (repository root)

```text
src/ui/menus/
├── manager.ts             # SuiMenuManager: attach()/unattach()/displayMenu()/evKey()/bindEvents() rewritten per research.md R1-R7; new `menuApp` field
└── menu.ts                # SuiConfiguredMenu, SuiConfiguredMenuOption, SuiMenuParams (unmodified — research.md R8)

src/ui/components/menus/
└── menu.vue               # Existing draft, completed: fixed display filter + close-on-select (R3), hotkey assignment + onMounted/onUnmounted keydown subscription + arrow-key focus (R4)

src/ui/common.ts            # replaceVueRoot (unmodified, reused per R1)
src/ui/eventSource.ts       # BrowserEventSource.bindKeydownHandler/unbindKeydownHandler (unmodified, reused per R4/R7)
```

**Structure Decision**: No new files, directories, or build targets. `manager.ts` is edited in place; the existing `menu.vue` draft is completed in place, matching the file-pairing/mounting conventions already used by the ribbon and by every Vue dialog in this codebase.

## Complexity Tracking

*No Constitution Check violations — table omitted.*

## Post-Design Constitution Check

Re-checked after Phase 1 (`data-model.md`, `quickstart.md`): the design's one piece of new shared behavior — explicitly unmounting the menu's `App` instance on close (research.md R7) — is scoped entirely to `SuiMenuManager`/`menu.vue` and touches no other component's mounting convention; it doesn't change `replaceVueRoot`, `InstallDialog`, or any dialog's lifecycle. All four gate principles remain N/A or satisfied as above; no violations introduced by the detailed design.
