# Implementation Plan: Dialog Checkbox-to-Toggle Migration

**Branch**: `003-checkbox-to-toggle` | **Date**: 2026-08-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-checkbox-to-toggle/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Replace every native `<input type="checkbox">` control in the Vue dialog components under `src/ui/components/dialogs` with the project's existing `toggle.vue` component, so all boolean dialog settings share one visual/behavioral control. Where a checkbox's Bootstrap grid column is immediately followed by a sibling column holding only that checkbox's label text, the label text moves into `toggle.vue`'s `label` prop, the now-redundant label column is deleted, and the toggle's column width class is widened to equal the sum of the two original columns' widths (Bootstrap's 12-unit `col-N` scale, e.g. `col-2` + `col-6` → `col-8`). `toggle.vue` and its `v-model`/`changeCb` wiring already exist and are proven in `measureFormat.vue`; this feature is a mechanical, per-component migration with no changes to `toggle.vue` itself or to the underlying data model.

## Technical Context

**Language/Version**: TypeScript 5.9 (Vue 3.5 `<script setup lang="ts">` SFCs)

**Primary Dependencies**: Vue 3 (Composition API), existing local components `toggle.vue`, `dialogContainer.vue`, `collapsableRow.vue`; Bootstrap grid CSS (`src/styles/bootstrap.css`) and project dialog styles (`src/styles/dialog2.css`, `src/styles/dialogs.css`)

**Storage**: N/A (no persistence changes; components continue binding to existing in-memory score/preferences objects via `v-model` / `changeCb`)

**Testing**: No automated UI test harness exists for these dialog components (`npm test` is a no-op in this repo); validation is manual, in-browser, per `quickstart.md`

**Target Platform**: Browser (Smoosic web score editor UI)

**Project Type**: Single front-end project (Vue components under `src/ui`, bundled via webpack)

**Performance Goals**: N/A — purely a markup/control substitution with no algorithmic or rendering-performance implications

**Constraints**: Must preserve every existing binding (`v-model`, `:checked`/`@change`, `:disabled`, conditional rendering) so no observable behavior other than the checkbox's visual replacement changes; must not modify `toggle.vue` itself; must not alter unrelated dialog rows

**Scale/Scope**: 11 components, 26 checkbox instances total (see `data-model.md` for the per-component/per-instance breakdown): `addMeasures.vue`, `fontPicker.vue`, `guitarTab.vue`, `instrumentProperties.vue`, `newPart.vue`, `partInfo.vue`, `scorePreferences.vue`, `staffGroups.vue`, `textBlock.vue`, `timeSignature.vue`, `viewStaves.vue`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unpopulated template (all principle sections contain placeholder text, no version has been ratified). There are no ratified project principles to check this feature against, so this gate is trivially satisfied — no violations to justify, no complexity table needed.

## Project Structure

### Documentation (this feature)

```text
specs/003-checkbox-to-toggle/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

No `contracts/` directory is generated: this feature has no external API, CLI, or service surface — it only edits internal Vue component templates. `data-model.md` here documents the affected UI component/control inventory (not a persistence data model, since none changes).

### Source Code (repository root)

```text
src/ui/components/dialogs/
├── toggle.vue                 # Existing control being adopted (unmodified by this feature)
├── measureFormat.vue          # Existing reference usage of toggle.vue (unmodified; pattern reference only)
├── addMeasures.vue            # Migration target (1 checkbox)
├── fontPicker.vue             # Migration target (2 checkboxes)
├── guitarTab.vue              # Migration target (1 checkbox)
├── instrumentProperties.vue   # Migration target (1 checkbox)
├── newPart.vue                # Migration target (2 checkboxes)
├── partInfo.vue                # Migration target (3 checkboxes)
├── scorePreferences.vue        # Migration target (7 checkboxes)
├── staffGroups.vue             # Migration target (3 checkboxes)
├── textBlock.vue               # Migration target (1 checkbox)
├── timeSignature.vue           # Migration target (3 checkboxes)
└── viewStaves.vue              # Migration target (2 checkboxes)

src/styles/
├── dialog2.css                 # Defines .tgl / .tgl-row / .toggles (toggle control styling; unmodified)
└── bootstrap.css                # Defines .row / .col-N grid (source of the widths being combined; unmodified)
```

**Structure Decision**: Single existing front-end project — no new directories, packages, or build targets. Every change is a template edit inside the 11 listed files in `src/ui/components/dialogs`; no new components are introduced (the migration consumes the already-existing `toggle.vue`).

## Complexity Tracking

*No Constitution Check violations — table omitted.*

## Post-Design Constitution Check

Re-checked after Phase 1 (`data-model.md`, `quickstart.md`): still no ratified constitution principles exist to check against, and the design introduces no new components, dependencies, or architectural layers (it consumes the existing `toggle.vue` as-is). Gate remains trivially satisfied.
