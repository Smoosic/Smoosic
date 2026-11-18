# Implementation Plan: Delete Special for Note Attachments

**Branch**: `041-delete-special` (work is on `main`; no feature branch was created) | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/041-delete-special/spec.md`

## Summary

Add **Delete Special...** to the Edit menu. It opens a dialog with nine unticked checkboxes (dynamics, lyrics, annotations, chords, articulations, ornaments, grace notes, arpeggios, microtones). On confirm, the ticked kinds are removed from every selected note, as one undo step. Nothing else about the notes changes.

The work is in three small layers, the same layers Paste Special uses:

1. **Model** (`src/smo/xform/operations.ts`): a kind type, the list of kinds, and two static functions on `SmoOperation`: one that counts the markings of the chosen kinds on some selections, and one that removes them. No UI imports, so it can be tested headless.
2. **View** (`scoreViewOperations.ts`): `deleteNoteAttributes(kinds)` does nothing if no kind is chosen or the selected notes have none of them; otherwise it runs the removal through `modifyCurrentSelections`, which takes the undo snapshot, edits the displayed score and the backing score, redraws the changed measures, and is one undo step.
3. **UI**: a small Vue dialog (`deleteSpecial.vue`) and creation function (`deleteSpecial.ts`) modelled on Paste Special, and a menu entry next to Paste Special.

No file format change: nothing new is stored. The result of a delete is an ordinary note with fewer attachments.

## Technical Context

**Language/Version**: TypeScript; Vue 3 single-file component for the dialog. Tests run with `ts-node`.

**Primary Dependencies**: None new. Reuses `InstallDialog`, `dialogContainer.vue`, `toggle.vue`, `SuiScoreViewOperations.modifyCurrentSelections`, `SmoLyric.parsers`.

**Storage**: No change. Removed markings are simply absent from the next save.

**Testing**: Headless `ts-node` script `tests/deleteSpecial.ts` (npm script `test:delete-special`): each kind, mixed kinds, lyrics/annotations/chords independence, notes without the kinds, selections across measures, staves and voices, rests, the count function, and a serialize and reload of the result. The view's undo wiring is `modifyCurrentSelections`, already shared with other edits; it is checked by `tsc` and the manual steps in [quickstart.md](quickstart.md), since `scoreViewOperations` needs the DOM. A `.vue` file cannot be loaded by `ts-node`, so the component is checked by compiling it with `@vue/compiler-sfc`. The constitution says rendering and UI need not be tested.

**Target Platform**: Browser application and library.

**Project Type**: Single project.

**Performance Goals**: One pass over the selected notes; one redraw of the changed measures. A 16-measure selection is the same cost as any other edit of that size.

**Constraints**: Only the nine kinds are removable, and each means exactly its name (spec FR-005 to FR-011). The smo layer must not import UI code.

**Scale/Scope**: Two static functions and a type in `operations.ts`, one view method, one dialog function, one Vue component, one menu option, a few export lines, one test file.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|-----------|------------|
| #1 Serialization | Pass. No new persisted field. A test serializes and reloads a score after a delete and checks the removed markings are gone and the rest is identical. Scores saved before this feature need no handling. |
| #2 Editing and transformation logic regression tested | Pass. `SmoOperation.deleteNoteAttributes` and `countNoteAttributes` are headless-tested for every kind and for the cases in the spec. |
| #3 Rendering performance | Pass. The edit goes through `modifyCurrentSelections`, which redraws only the changed measures once. |
| #4 Logical dependencies | Pass. The removal logic is in `src/smo/xform` with no UI imports. The dialog and menu are in `src/ui`. |

Re-check after Phase 1 design: still passes. No complexity violations.

## Project Structure

### Documentation (this feature)

```text
specs/041-delete-special/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── delete-special-api.md   # Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/smo/xform/operations.ts                      # DeleteAttributeKind, SmoOperation.deleteAttributeKinds, countNoteAttributes(), deleteNoteAttributes()
src/render/sui/scoreViewOperations.ts            # deleteNoteAttributes(kinds)
src/ui/dialogs/deleteSpecial.ts                  # NEW: SuiDeleteSpecialDialog
src/ui/components/dialogs/deleteSpecial.vue      # NEW: nine toggles, confirm enabled once one is on
src/ui/menus/edit.ts                             # "Delete Special..." option after Paste Special
src/application/exports.ts                       # import, export * and list entry for the dialog
typedoc.ts                                       # export of the new dialog module
types/src/smo/xform/operations.d.ts              # hand-edited declarations
types/src/render/sui/scoreViewOperations.d.ts    # hand-edited declaration
types/src/ui/dialogs/deleteSpecial.d.ts          # NEW declaration
types/src/application/exports.d.ts               # the same three references
types/typedoc.d.ts                               # the new export
tests/deleteSpecial.ts                           # NEW
package.json                                     # test:delete-special script
changes.md                                       # changelog entry
```

**Structure Decision**: Single-project layout as it exists. The removal logic sits with the other selection operations in `SmoOperation`; the dialog copies the shape of `SuiPasteSpecialDialog`, which the Edit menu already uses.

## Complexity Tracking

No constitution violations to justify.
