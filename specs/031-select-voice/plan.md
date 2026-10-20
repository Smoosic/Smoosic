# Implementation Plan: Select Voice

**Branch**: `031-select-voice` | **Date**: 2026-10-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/031-select-voice/spec.md`

## Summary

Two pure static functions on `SmoSelection` (`src/smo/xform/selections.ts`) hold all the decision logic: `voiceChoices(score, selections)` returns the voices to offer (empty unless some selected measure has more than one voice), and `getVoiceSelectors(score, selections, voice)` returns the selector of every note of the chosen voice in every measure that currently has a selection, on every selected staff. The tracker (`SuiTracker`, in `src/render/sui/tracker.ts`) gets `selectVoice(voice)`: it maps those selectors to the already-rendered selections in `measureNoteMap` (looked up by `SmoSelector.getNoteKey`, which carries the boxes the highlighter needs), and replaces `selections` with them only if at least one was found; otherwise it changes nothing. It sets the chosen voice active on the affected measures as `selectSuggestion` does, refreshes the local modifier list and highlights. The view (`SuiScoreViewOperations`) exposes a thin `selectVoice` and `getSelectVoiceChoices`, and `edit.ts` adds a Select Voice option with four voice choices whose `display` rules come from the pure function. No score data, undo or serialization is touched.

## Technical Context

**Language/Version**: TypeScript (built by `build/build.js`).

**Primary Dependencies**: None new. `SmoSelection`/`SmoSelector`, `SuiTracker` (`measureNoteMap`, `deferHighlight`, `_createLocalModifiersList`), the menu `subMenu` support already used by the Copy Voices and arpeggio menus.

**Storage**: None. The selection is runtime state in the tracker.

**Testing**: A headless script `tests/selectVoice.ts` (`npm run test:select-voice`) running the pure functions against in-memory scores: choices, the whole-measure rule, uneven voices, multiple staves, missing voices, rests, no-op cases. The tracker mapping, highlighting and the menu are verified manually (quickstart.md); they need the renderer.

**Target Platform**: Browser application; tests run under Node.

**Project Type**: Single project (library + application).

**Performance Goals**: A selection of a few hundred notes is built with one dictionary lookup per note and one highlight pass, the same as any range selection. No DOM measurement is added.

**Constraints**: No change to the score, no undo entry (FR-009); the existing Voices menu is untouched (FR-011); no voice is ever created; the selection must carry rendered boxes or the highlighter skips it.

**Scale/Scope**: Two pure functions, one tracker method, two small view methods, one menu option, one test.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle #1 (Serialization)**: PASS. Nothing is added to the score. (Setting a measure's active voice, which `selectSuggestion` already does on every note selection, is an existing serialized measure parameter and is not new state.)
- **Principle #2 (Music editing logic regression testing)**: PASS. Selection construction (which notes belong to which voice in which measures) is pure and covered by a headless script with a contract case list, as for specs 019 to 030.
- **Principle #3 (Rendering performance)**: PASS. One selection replacement and one deferred highlight, the same path as any multi-note selection. No DOM measurement added.
- **Principle #4 (Logical dependencies)**: PASS. The pure functions are in `src/smo`. The tracker only maps selectors to rendered artifacts. `edit.ts` only maps choices to view calls.

No violations; Complexity Tracking is not needed. Re-check after Phase 1: unchanged, still PASS.

## Project Structure

### Documentation (this feature)

```text
specs/031-select-voice/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── select-voice-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md               # created later by /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── smo/xform/selections.ts            # SmoSelection.voiceChoices(), SmoSelection.getVoiceSelectors()
├── render/sui/
│   ├── tracker.ts                     # SuiTracker.selectVoice(voice): boolean
│   └── scoreViewOperations.ts         # selectVoice(voice), getSelectVoiceChoices()
└── ui/menus/edit.ts                   # "Select Voice" option with Voice 1-4 subMenu

tests/
└── selectVoice.ts                     # NEW headless regression script

package.json                           # add "test:select-voice"
```

**Structure Decision**: Put the logic where selections already live (`SmoSelection`), and keep the tracker method a thin mapping step so the part that needs a renderer is as small as possible.

## Complexity Tracking

*No Constitution Check violations; table not needed.*
