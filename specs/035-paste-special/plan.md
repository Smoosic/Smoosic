# Implementation Plan: Paste Special for Note Attachments

**Branch**: `035-paste-special` (work is on `main`; no feature branch was created) | **Date**: 2026-10-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/035-paste-special/spec.md`

## Summary

Generalize the Edit menu's **Paste Chords** into **Paste Special**. A small dialog offers six toggles (dynamics, lyrics, annotations, chords, articulations, ornaments) and a Replace/Add choice. The copy buffer gains one operation that applies the chosen kinds to the destination without touching pitches or durations.

The alignment of copied notes to destination notes is lifted unchanged from the existing `pasteChordNotes` (by elapsed time, see [research.md](research.md) R1) into a routine that returns the pairs. That routine is used twice: once as a dry run to find which measures a paste touches (for undo and refresh), and once to apply the markings. Replace is "clear the ticked kinds on each aligned destination note, then add"; Add is the same without the clear. Chords go through the existing key transposition; everything else is copied as is.

## Technical Context

**Language/Version**: TypeScript; Vue 3 single-file components for the dialog. Tests run with `ts-node`.

**Primary Dependencies**: None new. Reuses `PasteBuffer`, `SmoSelection`, `SmoNote` modifier methods, `SmoLyric.transposeChordToKey`, the `dialogContainer.vue` and `toggle.vue` components, and the `InstallDialog` helper.

**Storage**: N/A. Pasted markings serialize exactly as markings created in any other way.

**Testing**: Headless `ts-node` script `tests/pasteSpecial.ts` (npm script `test:paste-special`), following `tests/voiceCopyPaste.ts` and `tests/pasteIntoMeasure.ts`. The dialog and menu are checked by compilation and the manual steps in [quickstart.md](quickstart.md).

**Target Platform**: Browser application and library.

**Project Type**: Single project.

**Performance Goals**: A 16-measure paste completes with no delay beyond an ordinary paste. Only the affected measures are re-rendered.

**Constraints**: Pitches, durations, rests, ties, slurs, beams, tuplets and unticked kinds must be byte-for-byte unchanged by a paste. Logic stays in `src/smo`, free of UI dependencies.

**Scale/Scope**: One new method group on `PasteBuffer`, one view method replacing `pasteChords`, one dialog (TypeScript plus Vue), one menu entry change, one new test file.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|-----------|------------|
| #1 Serialization | Pass. No new persisted fields. Pasted markings are ordinary modifiers; a test round-trips a score through serialization after a paste. |
| #2 Editing and transformation logic regression tested | Pass. All six kinds, both modes, mismatched rhythms, end-of-part and multi-staff cases are headless tests. |
| #3 Rendering performance | Pass. The measure range is computed before the paste so only those columns are unrendered and replaced, as for an ordinary paste. |
| #4 Logical dependencies | Pass. The paste logic is in `src/smo/xform/copypaste.ts` and imports no UI. The dialog lives in `src/ui` and calls the view. |

Re-check after Phase 1 design: still passes. No complexity violations.

## Project Structure

### Documentation (this feature)

```text
specs/035-paste-special/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── paste-special-api.md   # Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/smo/xform/copypaste.ts                 # alignment routine, attribute paste, extent; remove pasteChords/pasteChordNotes
src/smo/data/note.ts                       # fix removeAllAnnotations (removes every lyric and chord today)
src/render/sui/scoreViewOperations.ts      # pasteAttributes() replaces pasteChords(); hasCopiedNotes()
src/ui/dialogs/pasteSpecial.ts             # NEW: SuiPasteSpecialDialog
src/ui/components/dialogs/pasteSpecial.vue # NEW: six toggles + replace/add toggle
src/ui/menus/edit.ts                       # Paste Special replaces Paste Chords
src/application/exports.ts                 # export the dialog
types/src/...                              # regenerated declarations for the files above only
tests/pasteSpecial.ts                      # NEW
package.json                               # test:paste-special script
changes.md                                 # changelog entry
```

**Structure Decision**: Single-project layout as it exists. The new behavior belongs in `PasteBuffer` because it already owns the copied notes and the alignment code; a separate class would have to duplicate both.

## Complexity Tracking

No constitution violations to justify.
