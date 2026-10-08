# Implementation Plan: Configured Menu Migration for Language, Part Selection, Score, and Staff Modifier Menus

**Branch**: `006-configured-menu-migration` | **Date**: 2026-09-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-configured-menu-migration/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Convert four `src/ui/menus/` classes — `SuiLanguageMenu` (language.ts), `SuiPartSelectionMenu` (partSelection.ts), `SuiScoreMenu` (score.ts), `SuiStaffModifierMenu` (staffModifier.ts) — from extending `SuiMenuBase` directly to extending `SuiConfiguredMenu`, following the pattern already established by `SuiNoteMenu` (note.ts) and `SuiBeamMenu` (beams.ts). Each menu's static `defaults: MenuDefinition` / `getDefinition()` pair is replaced by a module-level array of `SuiConfiguredMenuOption` objects (one per existing menu choice), passed to `SuiConfiguredMenu`'s constructor via `super(params, label, options)`. Every option's `handler` reproduces that choice's existing `selection()`/`exec*` logic exactly; `display` returns `true` unconditionally except where current behavior is already conditional — Score Settings' four view-state-dependent options (`research.md` R2) and Part Selection's fully dynamic, part-map-driven option list (`research.md` R3). No call sites change: `SuiMenuManager.createMenu` (`src/ui/menus/manager.ts`) already constructs each menu as `new Sui<Name>Menu(params)` regardless of base class.

## Technical Context

**Language/Version**: TypeScript 5.9

**Primary Dependencies**: None new — reuses the existing `SuiConfiguredMenu`/`SuiConfiguredMenuOption`/`SuiMenuHandler`/`SuiMenuShowOption` types and the `cancelOption` auto-append behavior already defined in `src/ui/menus/menu.ts`; reuses each menu's existing collaborators unchanged (`SmoTranslator.setLanguage`, `SuiScoreViewOperations` methods, `SmoPedalMarking`/`SmoSelector`, the six `execXxx` dialog-opening methods in score.ts)

**Storage**: N/A — no persistence changes; menus continue to read/write the existing in-memory `SmoScore` via `SuiScoreViewOperations`, exactly as today

**Testing**: No automated test harness covers these menu classes (`npm test` is a no-op in this repo — `"test": "exit 0"` in package.json); validation is manual, in-browser, per `quickstart.md`, plus a TypeScript build (`npm run build` / `npm run types`) to confirm no compile errors

**Target Platform**: Browser (Smoosic web score editor UI)

**Project Type**: Single front-end project (`src/ui`, bundled via webpack)

**Performance Goals**: N/A — no rendering-path or hot-loop code is touched; menus are opened on user-initiated hotkeys/ribbon clicks, not on any render-performance-sensitive path

**Constraints**: Must preserve every existing menu choice's label, icon, value, and resulting behavior exactly (spec SC-001); must preserve Score Settings' exact view-state-based visibility rules (spec FR-005, SC-002); must preserve Part Selection's exact dynamic-part-list behavior (spec FR-006, SC-003); must preserve the async/await structure of the Lines menu's Pedal Marking and Reset Slurs handlers, since `SuiConfiguredMenu.selection()` already does `await option.handler(this)` before calling `complete()` (constitution: "avoid race conditions by judicious use of async/await"); must not introduce a locally-defined `'cancel'` choice in any of the four menus (spec FR-007)

**Scale/Scope**: 4 existing files edited in place (language.ts: 3 options; staffModifier.ts: 12 options; score.ts: 9 options, 4 conditional; partSelection.ts: dynamic, rebuilt per open); 0 new files; 0 call-site changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Checked against `.specify/memory/constitution.md`'s four principles:

- **Principle #1 (Serialization)**: N/A — this feature touches no `src/smo` data model, adds no persisted field, and changes no score-file format.
- **Principle #2 (Music editing/transformation logic)**: N/A — no pitch, duration, selection, accidental, or clef calculation logic is added or changed; every handler's body is copied verbatim from its current `selection()`/`exec*` branch.
- **Principle #3 (Rendering performance)**: N/A — menus are UI overlays built from DOM strings on open (`SuiMenuManager.attach()`), not part of the SVG score-rendering path (`scoreRender.ts`/`renderState.ts`/`src/render/sui/vex`); this migration doesn't touch that path.
- **Principle #4 (Logical dependencies)**: Satisfied — the migration stays entirely within `src/ui/menus`; it introduces no new dependency from `src/smo` or `src/render` on UI code, or vice versa. `SuiConfiguredMenu` is itself already a `src/ui/menus` class.
- **General guidance ("avoid race conditions by judicious use of async/await")**: Directly relevant to staffModifier.ts's Pedal Marking and Reset Slurs choices, which contain multi-step awaited logic; `research.md` R4 addresses this explicitly.

No violations. Gate passes trivially — no complexity table needed.

## Project Structure

### Documentation (this feature)

```text
specs/006-configured-menu-migration/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

No `contracts/` directory is generated: this feature has no external API, CLI, or service surface — it only restructures four internal menu classes' construction, with no change to `SuiMenuParams`, `SuiMenuManager`, or any other consumer-facing interface.

### Source Code (repository root)

```text
src/ui/menus/
├── menu.ts              # SuiConfiguredMenu, SuiConfiguredMenuOption, cancelOption (unmodified; the base being migrated to)
├── note.ts               # SuiNoteMenu (unmodified; the reference pattern, per spec Input)
├── beams.ts               # SuiBeamMenu (unmodified; second existing precedent, used for R2's non-"always true" display precedent)
├── language.ts           # SuiLanguageMenu: SuiMenuBase → SuiConfiguredMenu; 3 options, all display: () => true
├── staffModifier.ts      # SuiStaffModifierMenu: SuiMenuBase → SuiConfiguredMenu; 12 options, all display: () => true
├── score.ts               # SuiScoreMenu: SuiMenuBase → SuiConfiguredMenu; 9 options, 4 with view-state-conditional display (research.md R2)
├── partSelection.ts      # SuiPartSelectionMenu: SuiMenuBase → SuiConfiguredMenu; options rebuilt dynamically in an overridden preAttach() (research.md R3)
└── manager.ts            # SuiMenuManager.createMenu (unmodified; already constructs each menu as `new Sui<Name>Menu(params)`)
```

**Structure Decision**: No new files, directories, or build targets. Each of the four target files is edited in place, replacing its `static defaults` / `getDefinition()` pair with a module-level `SuiConfiguredMenuOption[]` array and switching its `extends SuiMenuBase` to `extends SuiConfiguredMenu`, matching the shape already used by `note.ts` and `beams.ts` in the same directory.

## Complexity Tracking

*No Constitution Check violations — table omitted.*

## Post-Design Constitution Check

Re-checked after Phase 1 (`data-model.md`, `quickstart.md`): the design introduces no new shared surface at all — `SuiConfiguredMenu`, `SuiConfiguredMenuOption`, and the `cancelOption` auto-append are all pre-existing and unmodified. Part Selection's dynamic-rebuild approach (`research.md` R3) stays entirely within `SuiPartSelectionMenu.preAttach()`, an override already anticipated by `SuiMenuBase`'s `preAttach()` hook. All four gate principles remain N/A or satisfied as above; no violations introduced by the detailed design.
