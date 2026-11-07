# Implementation Plan: Fix the Create Part Dialog

**Branch**: `037-fix-new-part-dialog` (work is on `main`; no feature branch was created) | **Date**: 2026-11-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/037-fix-new-part-dialog/spec.md`

## Summary

Move the "where does the new part go, and what is it called" logic out of the dialog and into one tested model operation, `SmoOperation.addPart`, and make the dialog a thin form over it.

The operation turns the requested location (1 to N+1) into a staff index, moves it past a two-stave part if it would land inside one, inserts the new staff or staves with their part information (name, abbreviation, Preserve Text Groups on, and the two-stave before/after links), and shifts every reference that points at a staff below the insertion point (staff modifiers, system groups, instrument selectors). The view gets one method, `createPart`, that wraps the operation in a single undo step. The dialog gains the Name and Abbreviation fields, the "Create Part" title, and a Staff Location input that accepts 1 to N+1 and starts at N+1.

## Technical Context

**Language/Version**: TypeScript; Vue 3 single-file component for the dialog. Tests run with `ts-node`.

**Primary Dependencies**: None new. Reuses `SmoScore.addStaff`, `SmoSystemStaff`, `SmoPartInfo`, `SmoSystemGroup`, `numberInput.vue`, `InstallDialog`.

**Storage**: N/A. The new part serializes like any part: name, abbreviation, `preserveTextGroups`, `stavesBefore` and `stavesAfter` are existing part fields. `SmoPartInfo.defaults` is not changed.

**Testing**: Headless `ts-node` script `tests/createPart.ts` (npm script `test:create-part`), following `tests/voiceCopyPaste.ts`. The model operation and the small pure helpers are tested; the dialog and view method are checked by compilation and the manual steps in [quickstart.md](quickstart.md).

**Target Platform**: Browser application and library.

**Project Type**: Single project.

**Performance Goals**: No new work beyond one extra staff; the score re-renders once, as now.

**Constraints**: Inserting a staff above existing staves must not corrupt anything that refers to a staff by number. A two-stave part must never be split. Creating a part is one undo step.

**Scale/Scope**: One new model operation, one new score method for shifting staff references, one view method, one dialog change (TypeScript and Vue), one small helper module, one new test file.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|-----------|------------|
| #1 Serialization | Pass. No new persisted fields. A test serializes and reloads a score after creating a one- and a two-stave part, and checks names, abbreviations, the text-group setting and the before/after links survive. |
| #2 Editing and transformation logic regression tested | Pass. Placement at every position, the two-stave rule, reference shifting and the part values are headless tests. |
| #3 Rendering performance | Pass. No rendering change. The view still calls `viewAll` once. |
| #4 Logical dependencies | Pass. The placement and insertion logic is in `src/smo` with no UI imports. The dialog only collects values and calls the view. |

Re-check after Phase 1 design: still passes. No complexity violations.

## Project Structure

### Documentation (this feature)

```text
specs/037-fix-new-part-dialog/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── create-part-api.md   # Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/smo/data/score.ts                     # resolveNewPartIndex(); shiftStaffReferences(); addStaff() shifts references after an insertion
src/smo/data/systemStaff.ts               # shiftStaffReferences() for a staff's own modifiers, text brackets and instrument selectors
src/smo/xform/operations.ts               # NEW SmoOperation.addPart() and its AddPartParams type
src/render/sui/scoreViewOperations.ts     # createPart(): one undo step around addPart
src/ui/dialogs/createPartHelpers.ts       # NEW pure helpers: clampPartLocation, resolvePartName, instrumentChoices
src/ui/dialogs/instrument.ts              # SuiCreatePartVue: location, name, abbreviation, title, calls createPart
src/ui/components/dialogs/newPart.vue     # Name/Abbreviation fields, Staff Location N+1, shared instrument list
types/src/...                             # regenerated declarations for the files above only
tests/createPart.ts                       # NEW
package.json                              # test:create-part script
changes.md                                # changelog entry
```

**Structure Decision**: Single-project layout as it exists. The new operation sits with the other score operations in `operations.ts`, which is where the existing `addStaff` wrapper is, and which the tests can import without a DOM.

## Complexity Tracking

No constitution violations to justify.
