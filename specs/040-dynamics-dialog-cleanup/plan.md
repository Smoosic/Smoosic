# Implementation Plan: Dynamics Dialog Cleanup and Font Size

**Branch**: `040-dynamics-dialog-cleanup` (work is on `main`; no feature branch was created) | **Date**: 2026-11-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/040-dynamics-dialog-cleanup/spec.md`

## Summary

Rewrite `SuiDynamicModifierDialogVue` in `src/ui/dialogs/dynamicsVue.ts` so it holds its own state in local variables and does its work in local functions, with no `SuiDynamicDialogAdapter`. Add a **Font Size** number field to the Vue component. Then delete `src/ui/dialogs/dynamics.ts` (the legacy dialog and its adapter) and everything that referred to it.

The model already has the font size: `SmoDynamicText.fontSize` (default 30) is saved, loaded and used by the renderer. The only model addition is the allowed range, as static members on `SmoDynamicText`, so the rule can be tested without the UI and shared with the dialog.

The legacy behaviour is copied rather than redesigned: one grouped undo session, an undo snapshot of the selected measures when the dialog opens, edits applied through `view.addDynamic` for every selected note, Cancel is one `view.undo()`, Remove is `view.removeDynamic`.

## Technical Context

**Language/Version**: TypeScript; Vue 3 single-file component for the dialog. Tests run with `ts-node`.

**Primary Dependencies**: None new. Reuses `InstallDialog`, `getModifierDialogPosition`, `numberInput.vue`, `selectComp`, `SuiScoreViewOperations.addDynamic/removeDynamic/undo/undoTrackerMeasureSelections/groupUndo`.

**Storage**: No change to the file format. `fontSize` is already one of `SmoDynamicText`'s persisted fields and is written only when it differs from the default (30). Old scores have no `fontSize` and load with 30, exactly as now.

**Testing**: Headless `ts-node` script `tests/dynamicsFontSize.ts` (npm script `test:dynamics-font-size`) for the model: the range rule, default, serialization round trip, old-score load, and applying a size through `SmoOperation.addDynamic`. A `.vue` file cannot be loaded by `ts-node`, so the dialog's wiring is checked by compilation (`tsc`), compiling the component with Vue's SFC compiler, a search that proves the legacy code is gone, and the manual steps in [quickstart.md](quickstart.md). The constitution says rendering and UI need not be tested.

**Target Platform**: Browser application and library.

**Project Type**: Single project.

**Performance Goals**: No change. Each edit calls `view.addDynamic` once per selected note; the renderer's replace queue merges those by staff and measure, so each measure is redrawn once per pass.

**Constraints**: Every existing control and behaviour of the dialog keeps working (spec FR-005). The dialog's registered name `SuiDynamicModifierDialog` is kept for the factory and the language list. The smo layer must not import UI code.

**Scale/Scope**: One dialog function rewritten, one Vue component edited, two small static members added to `SmoDynamicText`, one file deleted, a few references removed, one test file.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|-----------|------------|
| #1 Serialization | Pass. No new persisted field. A test saves and loads a score with a non-default size, and loads a note written without a size (a legacy score) and checks it gets 30. A default size is still not written. |
| #2 Editing and transformation logic regression tested | Pass. The range rule and the apply-to-selected-notes behaviour of `SmoOperation.addDynamic` with a size are headless tests. |
| #3 Rendering performance | Pass. No rendering change; the renderer already draws dynamics at `fontSize`. The replace queue still merges redraws per measure. |
| #4 Logical dependencies | Pass. The range rule is in `src/smo` with no UI imports. The dialog stays in `src/ui`. |

Re-check after Phase 1 design: still passes. No complexity violations.

## Project Structure

### Documentation (this feature)

```text
specs/040-dynamics-dialog-cleanup/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── dynamics-dialog.md   # Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/smo/data/noteModifiers.ts                    # SmoDynamicText: minFontSize, maxFontSize, isValidFontSize()
src/ui/dialogs/dynamicsVue.ts                    # REWRITTEN: local state and functions, no adapter, fontSize
src/ui/components/dialogs/dynamics.vue           # Font Size number field; updateNumberCb takes 'fontSize'
src/ui/dialogs/dynamics.ts                       # DELETED (SuiDynamicDialogAdapter and SuiDynamicModifierDialog)
src/application/exports.ts                       # remove the dynamics.ts import, the export *, and the list entry
typedoc.ts                                       # remove the export of dynamics
src/ui/i18n/language.ts                          # remove 'SuiDynamicModifierDialog' from allDialogs
src/ui/dialogs/annotationVue.ts                  # reword the comment that points at dynamics.ts
types/src/ui/dialogs/dynamics.d.ts               # DELETED
types/src/application/exports.d.ts               # remove the same three references
types/typedoc.d.ts                               # remove the export of dynamics
types/src/smo/data/noteModifiers.d.ts            # the new static members
tests/dynamicsFontSize.ts                        # NEW
package.json                                     # test:dynamics-font-size script
changes.md                                       # changelog entry
```

**Structure Decision**: Single-project layout as it exists. The dialog function keeps the creation-function shape of the other Vue dialogs, and the new rule sits on the model class next to the field it constrains.

## Complexity Tracking

No constitution violations to justify.
