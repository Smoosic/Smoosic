# Implementation Plan: Copy and Paste Voices

**Branch**: `030-copy-paste-voices` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/030-copy-paste-voices/spec.md`

## Summary

`PasteBuffer` (`src/smo/xform/copypaste.ts`) gains a second, separate kind of clipboard content: a **voice copy**. `setVoiceSelections` takes the selected notes, widens them to whole measures on each selected staff, and records the notes of each requested voice (one voice, or all) as ordinary `PasteNote` lists, filling measures that lack a copied voice with default rests so every voice stays aligned. `pasteVoice` and `pasteAllVoices` then place those lists at tick 0 of the destination measure by calling the existing `pasteNoteSelections` machinery once per voice and staff. That machinery already creates a missing voice measure by measure, replaces the destination voice's notes, and splits music that overruns a measure into the next one, so voice creation, replacement and the end-of-score limit are inherited rather than reimplemented. Two flaws in that machinery would damage other voices and are fixed narrowly: it forces the destination voice up to the copied voice's number, and it clears the tuplets of every voice in middle measures. The view (`scoreViewOperations.ts`) adds `copyVoices`, `pasteVoices` and the choice helpers, with one grouped undo over the affected columns. `edit.ts` adds two submenu options whose choices are computed by pure functions. The existing Copy and Paste paths are untouched.

## Technical Context

**Language/Version**: TypeScript (built by `build/build.js`).

**Primary Dependencies**: None new. Existing `PasteBuffer`, `SmoSelection`, `SmoMeasure`, `SmoNote`, `SmoTupletTree`, the menu `subMenu` support (`menu.vue` filters submenu items with `display`), and the view's undo helpers (`_undoColumn`, `storeUndo.grouping`).

**Storage**: None. The voice copy is in-memory clipboard state like the existing paste buffer; the saved score format does not change.

**Testing**: A headless `ts-node` script `tests/voiceCopyPaste.ts` (`npm run test:voice-copy-paste`) that drives the real `PasteBuffer` against a real `SmoScore` built in memory (verified: `copypaste.ts` loads headless). It covers copy extent, paste into new, existing and different voices, "All", end-of-score limiting, missing voices, tuplets, the preserved-voice cases and the pure menu-choice functions. Undo, the menus and redraw are verified manually (quickstart.md).

**Target Platform**: Browser application; tests run under Node.

**Project Type**: Single project (library + application).

**Performance Goals**: No regression. A voice paste does the same per-measure work as an existing paste, once per pasted voice and staff, in a user-initiated action.

**Constraints**: Existing Copy and Paste behavior unchanged; at most 4 voices; paste always at tick 0 of a measure; no change to the score format; the smo layer keeps no UI or rendering dependency (it already imports `SvgHelpers` for measure boxes, unchanged).

**Scale/Scope**: One class extended, one view area, one menu file, one test, one small package script.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle #1 (Serialization)**: PASS. The voice copy is not serialized, and pasted measures are produced through the existing measure serialization round trip, so they carry only fields the format already has.
- **Principle #2 (Music editing logic regression testing)**: PASS, and this is the main deliverable of the test: transformations of notes and voices get a headless regression script with a contract case list, as for specs 019, 022, 023, 027 and 028.
- **Principle #3 (Rendering performance)**: PASS. Follows the existing paste pattern: undo columns, unrender the affected columns, replace measures, re-render those measures once. No DOM measurement is added.
- **Principle #4 (Logical dependencies)**: PASS. The copy and paste logic and the menu-choice rules are in `src/smo` (pure, no UI). The view orchestrates; `edit.ts` only maps choices to view calls.
- **Async (core principles)**: `copyVoices` and `pasteVoices` are `async` and await the render update, like `paste`.

No violations; Complexity Tracking is not needed. Re-check after Phase 1: unchanged, still PASS.

## Project Structure

### Documentation (this feature)

```text
specs/030-copy-paste-voices/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── voice-copy-paste-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md                # created later by /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── smo/xform/copypaste.ts            # PasteBuffer: VoiceCopy state; setVoiceSelections, pasteVoice, pasteAllVoices;
│                                     #   static copyVoiceChoices / pasteVoiceChoices; targeted tuplet fixes in
│                                     #   _populateMeasureArray (middle measures keep other voices' tuplets)
├── render/sui/scoreViewOperations.ts # copyVoices(voice), pasteVoices(voice), voice-choice helpers, grouped undo
└── ui/menus/edit.ts                  # "Copy Voices" and "Paste Voice" options with subMenu choices

tests/
└── voiceCopyPaste.ts                 # NEW headless regression script

package.json                          # add "test:voice-copy-paste"
```

**Structure Decision**: Extend `PasteBuffer` rather than add a parallel class, because the paste step reuses its private measure/voice machinery. Keep voice-copy state in clearly named separate fields so the existing `notes` / `setSelections` / `pasteSelections` path is not touched.

## Complexity Tracking

*No Constitution Check violations; table not needed.*
