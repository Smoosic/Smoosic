# Implementation Plan: Vue-Based Key Signature and Tempo Dialogs

**Branch**: `005-vue-keysig-tempo-dialogs` | **Date**: 2026-08-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-vue-keysig-tempo-dialogs/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Reimplement the two legacy adapter-based dialogs Key Signature and Tempo (`src/ui/dialogs/keySignature.ts`, `src/ui/dialogs/tempo.ts`) as Vue components with `InstallDialog`-based creation functions, following the exact pattern already proven by `SuiTimeSignatureDialogVue`/`SuiTextBlockDialogVue` and, most recently, the seven dialogs converted in `004-vue-modifier-dialogs`. Each dialog's existing `SuiComponentAdapter` subclass (`SuiKeySignatureAdapter`, `SuiTempoAdapter`) is reused unchanged; only the rendering layer changes, mapping each `dialogElements` control type onto an existing modern Vue control (`numberInput.vue`, `select.vue`, `toggle.vue`, or a plain text `<input>`, per the user's explicit component choices). Every call site that constructs either legacy dialog class directly (`src/ui/buttons/ribbon.ts`, `src/ui/buttons/display.ts`, `src/ui/menus/manager.ts`, `src/application/keyCommands.ts`) is switched to call the new creation function instead. Unlike `004-vue-modifier-dialogs`, no shared foundational work is needed: neither legacy dialog opts into modifier-relative positioning (`MODIFIERPOS`) today — both use the framework's default fixed (`GLOBALPOS`) position — so the existing `getModifierDialogPosition` helper and `initialPosition` plumbing are simply not used here, and both new dialogs mount at the existing default position like `SuiCustomTupletDialogVue` does.

## Technical Context

**Language/Version**: TypeScript 5.9 (Vue 3.5 `<script setup lang="ts">` SFCs)

**Primary Dependencies**: Vue 3 (Composition API); existing local components `numberInput.vue`, `select.vue`, `toggle.vue`, `dialogContainer.vue`, `dialogButtons.vue`, `draggableComp.vue`; existing dialog infrastructure `InstallDialog`, `SuiDialogParams` (`src/ui/dialogs/dialog.ts`); the two existing adapter classes `SuiKeySignatureAdapter` (`src/ui/dialogs/keySignature.ts`) and `SuiTempoAdapter` (`src/ui/dialogs/tempo.ts`) and their base `SuiComponentAdapter` (`src/ui/dialogs/adapter.ts`)

**Storage**: N/A — no persistence changes; both adapters continue reading/writing the existing in-memory `SmoScore` via `SuiScoreViewOperations`

**Testing**: No automated UI test harness exists for these dialog components (`npm test` is a no-op in this repo); validation is manual, in-browser, per `quickstart.md`

**Target Platform**: Browser (Smoosic web score editor UI)

**Project Type**: Single front-end project (Vue components under `src/ui`, bundled via webpack)

**Performance Goals**: N/A — UI control substitution only, no algorithmic or rendering-performance implications beyond what each dialog's existing adapter already does

**Constraints**: Must reuse `SuiKeySignatureAdapter` and `SuiTempoAdapter` unchanged (spec Assumptions); must preserve Tempo's live per-field score update and Key Signature's apply-on-OK-only behavior; must preserve Tempo's mode-dependent Custom Text visibility; must preserve the current absence of a Remove control on both dialogs (neither overrides the framework's default hide-remove display option today); must derive the current measure from `parameters.view.tracker.selections` exactly as both legacy constructors do, not from `parameters.modifier` (several call sites — e.g. `ribbon.ts`'s generic `executeButtonModal` path for `SuiTempoDialog` — pass no `modifier` at all, since `SuiDialogParams.modifier` is optional and both legacy dialogs ignore it); must switch every call site (no dialog reachable from two code paths, legacy and new, at once)

**Scale/Scope**: 2 new dialog creation functions + 2 new `.vue` components (2 fields for Key Signature, 9 fields for Tempo — see `data-model.md`); 4 existing files with call sites to update (`src/ui/buttons/ribbon.ts` — 3 call sites, `src/ui/buttons/display.ts` — 2 call sites, `src/ui/menus/manager.ts` — 1 call site, `src/application/keyCommands.ts` — 1 call site); no shared infrastructure changes needed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is ratified but scoped to music representation, rendering performance, and logical layering (SMO serialization, transformation logic, SVG rendering, smo/UI separation) — none of its principles govern this dialog-UI presentation-layer migration. There are no applicable principles to check this feature against, so this gate is trivially satisfied — no violations to justify, no complexity table needed.

## Project Structure

### Documentation (this feature)

```text
specs/005-vue-keysig-tempo-dialogs/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

No `contracts/` directory is generated: this feature has no external API, CLI, or service surface — it only adds internal Vue dialog components and their creation functions, and edits four existing internal call-site files.

### Source Code (repository root)

```text
src/ui/dialogs/
├── adapter.ts                  # SuiComponentAdapter, SuiDialogAdapterBase, getModifierDialogPosition (unmodified; not used by this feature)
├── dialog.ts                   # InstallDialog, SuiDialogParams (unmodified)
├── keySignature.ts             # SuiKeySignatureAdapter unmodified; SuiKeySignatureDialog kept in place (dead code) per spec Assumptions
├── keySignatureVue.ts (new)    # new SuiKeySignatureDialogVue
├── tempo.ts                    # SuiTempoAdapter unmodified; SuiTempoDialog kept in place (dead code) per spec Assumptions
├── tempoVue.ts (new)           # new SuiTempoDialogVue
└── textBlockVue.ts, timeSignature.ts, voltaVue.ts, ...  # Existing precedent patterns being followed (unmodified)

src/ui/components/dialogs/
├── numberInput.vue, select.vue, toggle.vue, dialogContainer.vue, dialogButtons.vue  # Existing, unmodified — reused as-is
├── keySignature.vue (new)
└── tempo.vue (new)

src/ui/buttons/
├── ribbon.ts                   # Call-site updates: 'keySignature' button handler, 'ribbonTempo' button handler, executeButtonModal's SuiTempoDialog fallback branch
└── display.ts                  # Call-site updates: keySignature() method, ribbonTempo() method

src/ui/menus/
└── manager.ts                  # Call-site update: evKey's "k" slash-command hotkey branch

src/application/
└── keyCommands.ts              # Call-site update: tempoDialog() method
```

**Structure Decision**: Single existing front-end project — no new directories, packages, or build targets. Each of the two dialogs follows the file-pairing convention already established for the prior seven-dialog conversion (`004-vue-modifier-dialogs`): a new `*Vue.ts` creation-function file sits beside each existing dialog file, and a new `.vue` file is added under `src/ui/components/dialogs`. No composable or shared-component changes are needed — this feature only consumes existing, already-generalized shared surface (`InstallDialog`, `dialogContainer.vue`, `dialogButtons.vue`, `numberInput.vue`, `select.vue`, `toggle.vue`).

## Complexity Tracking

*No Constitution Check violations — table omitted.*

## Post-Design Constitution Check

Re-checked after Phase 1 (`data-model.md`, `quickstart.md`): still no ratified constitution principle governs this UI-presentation-layer migration. The design introduces no new shared component, composable, or architectural layer — it is a pure consumer of infrastructure that already shipped in `004-vue-modifier-dialogs` (`InstallDialog`, `dialogContainer.vue`/`dialogButtons.vue`, `numberInput.vue`/`select.vue`/`toggle.vue`). Gate remains trivially satisfied.
