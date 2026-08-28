# Implementation Plan: Vue-Based Modifier Property Dialogs

**Branch**: `004-vue-modifier-dialogs` | **Date**: 2026-08-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-vue-modifier-dialogs/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Reimplement seven legacy adapter-based dialogs (Volta, Text Bracket, Slur, Pedal Marking, Hairpin, Dynamics, Custom Tuplet — `src/ui/dialogs/{volta,textBracket,slur,pedalMarking,hairpin,dynamics,customTuplets}.ts`) as Vue components with `InstallDialog`-based creation functions, following the pattern already proven by `SuiTimeSignatureDialogVue` and `SuiTextBlockDialogVue`. Each dialog's existing `SuiComponentAdapter` subclass is reused unchanged; only the rendering layer changes, mapping each `dialogElements` control type onto an existing modern Vue control (`numberInput.vue`, `select.vue`, `toggle.vue`, or a plain text `<input>`). Every call site that constructs one of the seven legacy dialog classes (`src/ui/dialogs/factory.ts`, `src/ui/menus/text.ts`, `src/ui/menus/tuplets.ts`) is switched to call the new creation function instead. One small shared gap is closed along the way: today every Vue dialog opens at a fixed default position, whereas six of these seven legacy dialogs open positioned at the clicked modifier (`MODIFIERPOS`) — `research.md` R4 adds an optional initial-position argument to the existing `draggableSession` composable to close that gap.

## Technical Context

**Language/Version**: TypeScript 5.9 (Vue 3.5 `<script setup lang="ts">` SFCs)

**Primary Dependencies**: Vue 3 (Composition API); existing local components `numberInput.vue`, `select.vue`, `toggle.vue`, `dialogContainer.vue`, `dialogButtons.vue`, `draggableComp.vue`; existing composables `draggableSession` (`src/ui/composable/draggable.ts`); existing dialog infrastructure `InstallDialog`, `SuiDialogParams` (`src/ui/dialogs/dialog.ts`); the seven existing adapter classes in `src/ui/dialogs/{volta,textBracket,slur,pedalMarking,hairpin,dynamics,customTuplets}.ts` and their base `SuiComponentAdapter` (`src/ui/dialogs/adapter.ts`)

**Storage**: N/A — no persistence changes; every adapter continues reading/writing the existing in-memory `SmoScore` via `SuiScoreViewOperations`

**Testing**: No automated UI test harness exists for these dialog components (`npm test` is a no-op in this repo); validation is manual, in-browser, per `quickstart.md`

**Target Platform**: Browser (Smoosic web score editor UI)

**Project Type**: Single front-end project (Vue components under `src/ui`, bundled via webpack)

**Performance Goals**: N/A — UI control substitution only, no algorithmic or rendering-performance implications beyond what each dialog's existing adapter already does

**Constraints**: Must reuse each of the seven adapter classes unchanged (spec Assumptions); must preserve live per-field score updates for the six modifier-editing dialogs and one-shot-on-OK behavior for Custom Tuplet; must preserve Slur's OK/Cancel/Remove-disable-during-reset-all behavior; must switch every call site (no dialog reachable from two code paths, legacy and new, at once); must not remove the legacy dialog classes' static `dialogElements`, since `initDialogTranslationElements`/`DialogTranslations` (i18n) still reads them (`research.md` R5)

**Scale/Scope**: 7 new dialog creation functions + 7 new `.vue` components, ~4-6 fields each (see `data-model.md`); 3 existing files with call sites to update (`src/ui/dialogs/factory.ts`, `src/ui/menus/text.ts`, `src/ui/menus/tuplets.ts`); 1 small shared composable enhancement (`draggableSession` initial position, `research.md` R4)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unpopulated template (all principle sections contain placeholder text, no version has been ratified). There are no ratified project principles to check this feature against, so this gate is trivially satisfied — no violations to justify, no complexity table needed.

## Project Structure

### Documentation (this feature)

```text
specs/004-vue-modifier-dialogs/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

No `contracts/` directory is generated: this feature has no external API, CLI, or service surface — it only adds internal Vue dialog components and their creation functions, and edits three existing internal call sites.

### Source Code (repository root)

```text
src/ui/dialogs/
├── adapter.ts                  # SuiComponentAdapter, SuiDialogAdapterBase (unmodified; reused by legacy dialogs, referenced by new adapters as-is)
├── dialog.ts                   # InstallDialog, SuiDialogParams (unmodified)
├── factory.ts                  # Call-site updates: 5 of the 6 modifier dialogs constructed here (Hairpin, Pedal Marking, Slur, Dynamics, Volta) + Text Bracket
├── volta.ts / voltaVue.ts (new)             # SuiVoltaAdapter unmodified; new SuiVoltaAttributeDialogVue
├── textBracket.ts / textBracketVue.ts (new) # SuiTextBracketAdapter unmodified; new SuiTextBracketDialogVue
├── slur.ts / slurVue.ts (new)               # SuiSlurAdapter unmodified; new SuiSlurAttributesDialogVue
├── pedalMarking.ts / pedalMarkingVue.ts (new) # SuiPedalMarkingAdapter unmodified; new SuiPedalMarkingDialogVue
├── hairpin.ts / hairpinVue.ts (new)         # SuiHairpinAdapter unmodified; new SuiHairpinAttributesDialogVue
├── dynamics.ts / dynamicsVue.ts (new)       # SuiDynamicDialogAdapter unmodified; new SuiDynamicModifierDialogVue
├── customTuplets.ts / customTupletsVue.ts (new) # SuiCustomTupletAdapter unmodified; new SuiCustomTupletDialogVue
└── textBlockVue.ts, timeSignature.ts        # Existing precedent patterns being followed (unmodified)

src/ui/components/dialogs/
├── numberInput.vue, select.vue, toggle.vue, dialogContainer.vue, dialogButtons.vue, draggableComp.vue  # Existing, unmodified — reused as-is
├── volta.vue (new)
├── textBracket.vue (new)
├── slur.vue (new)
├── pedalMarking.vue (new)
├── hairpin.vue (new)
├── dynamics.vue (new)
└── customTuplet.vue (new)

src/ui/composable/
└── draggable.ts                # draggableSession gains an optional initial-position argument (research.md R4)

src/ui/menus/
├── text.ts                     # Call-site update: Dynamics menu handler
└── tuplets.ts                  # Call-site update: Custom Tuplet menu handler
```

**Structure Decision**: Single existing front-end project — no new directories, packages, or build targets. Each of the seven dialogs follows the file-pairing convention already established for the Text Block conversion (`textBlock.ts` + `textBlockVue.ts` + `components/dialogs/textBlock.vue`): a new `*Vue.ts` creation-function file sits beside each existing dialog file, and a new `.vue` file is added under `src/ui/components/dialogs`. The one cross-cutting change is a small, backward-compatible addition to the existing `draggableSession` composable (an optional parameter, defaulting to today's fixed position when omitted) so it does not disturb the dialogs that already call it without that argument.

## Complexity Tracking

*No Constitution Check violations — table omitted.*

## Post-Design Constitution Check

Re-checked after Phase 1 (`data-model.md`, `quickstart.md`): still no ratified constitution principles exist to check against. The design's one new piece of shared surface — `draggableSession`'s optional initial-position argument — is additive and backward-compatible (existing callers passing no third argument keep today's fixed-position behavior), so it introduces no new architectural layer, dependency, or breaking change. Gate remains trivially satisfied.
