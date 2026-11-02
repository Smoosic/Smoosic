# Implementation Plan: Autosave Buffers and Crash Recovery

**Branch**: `036-autosave-recovery` (work is on `main`; no feature branch was created) | **Date**: 2026-11-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/036-autosave-recovery/spec.md`

## Summary

Keep a rolling set of compressed score snapshots in the browser's local storage, next to (not replacing) the existing Quick Save slot. A small scheduler is armed by the first change after a snapshot and, when the configured interval has passed, serializes the score and hands it to a store that appends it and trims the set to the configured size. A new **Recovery** command in the File menu opens a dialog listing the snapshots, newest first; the chosen one is loaded with the same unsaved-changes prompt and score-replacement path that Open and Library already use, and the loaded score is marked as changed. The interval (5 to 60 minutes) and count (1 to 20) are two new integers on `SmoScorePreferences`, edited in a new Autosave section of the Score Preferences dialog.

The storage and timing logic is pure TypeScript with injected storage and timer, so it is tested headless. The view, dialog and menu are thin wiring around it.

## Technical Context

**Language/Version**: TypeScript; Vue 3 single-file components for the dialog and the preferences section. Tests run with `ts-node`.

**Primary Dependencies**: None new. Reuses `SmoScoreArchive` (JSZip, already loaded by the app) to compress snapshots, `confirmReplaceScore`, `InstallDialog`, `numberInput.vue`, `dialogContainer.vue`, and the `scoreChanged` flag and `UndoBuffer.onAddBuffer` hook from the unsaved-changes feature.

**Storage**: Browser `localStorage`. One index key plus one key per snapshot. The Quick Save key (`_smoosicScore`) is untouched. Settings are stored in the score, in `SmoScorePreferences`, so they serialize with the score.

**Testing**: Headless `ts-node` script `tests/autosave.ts` (npm script `test:autosave`), following `tests/scoreChangeState.ts`. It covers preferences defaults/clamping/legacy load, the store (append, trim, quota fallback, unreadable entries, ordering) and the scheduler (arming, one snapshot per interval, no snapshot when unchanged, retiming). The dialogs and menu are checked by compilation and the manual steps in [quickstart.md](quickstart.md).

**Target Platform**: Browser application and library. The library mode (no `localStorage`, no `JSZip`) must not break: autosave is inert when storage is unavailable.

**Project Type**: Single project.

**Performance Goals**: No perceptible pause while editing. The score is serialized synchronously at the moment the timer fires (so the snapshot is a consistent state); compression and the storage write are asynchronous and happen off the editing path.

**Constraints**: Browser storage is roughly 5 MB per origin and is shared with Quick Save. Snapshots are therefore compressed, and the store drops the oldest snapshots when a write fails for lack of space, and never touches the Quick Save slot. No error is shown during editing if storage fails.

**Scale/Scope**: Up to 20 snapshots. Two new preference fields, one new pure module, one new dialog (TypeScript plus Vue), one menu entry, one preferences section, one test file.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|-----------|------------|
| #1 Serialization | Pass. The two new preference fields serialize with the score; a score without them loads with the defaults, and out-of-range values are clamped on load. Tests cover round-trip and legacy load. The JSON schema in `tools/smoosic-schema.json` gains the two properties. |
| #2 Editing and transformation logic regression tested | Pass. No musical transformation changes. The new logic (preferences clamping, snapshot set management, scheduling) is regression tested headless. |
| #3 Rendering performance | Pass. Nothing is measured or repainted. The snapshot never touches the DOM, and compression is asynchronous. |
| #4 Logical dependencies | Pass. The preference fields are in `src/smo`, with no UI dependency. The store and scheduler are in `src/render/sui` with injected storage and timer and no DOM dependency. Only the dialog, menu and view wiring touch the UI. |

Re-check after Phase 1 design: still passes. No complexity violations.

## Project Structure

### Documentation (this feature)

```text
specs/036-autosave-recovery/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── autosave-api.md  # Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/smo/data/scoreModifiers.ts             # autosaveInterval/autosaveCount on SmoScorePreferences; defaults, limits, clamping, legacy default
src/render/sui/autosave.ts                 # NEW: AutosaveStore (rolling set) and AutosaveScheduler (timing); pure, injected storage/timer
src/render/sui/scoreView.ts                # owns the scheduler; markScoreChanged arms it; changeScore resets it
src/render/sui/scoreViewOperations.ts      # updateScorePreferences retimes/trims; recoverSnapshot(); listSnapshots()
src/ui/dialogs/recovery.ts                 # NEW: SuiRecoveryDialog
src/ui/components/dialogs/recovery.vue     # NEW: snapshot list, select, empty and unreadable states
src/ui/components/dialogs/scorePreferences.vue  # Autosave section with two numberInput fields
src/ui/menus/file.ts                       # Recovery entry
src/ui/i18n/language.ts                    # register 'SuiRecoveryDialog'
src/application/exports.ts                 # export the dialog and the autosave module
tools/smoosic-schema.json                  # two new SmoScorePreferences properties
types/src/...                              # regenerated declarations for the files above only
tests/autosave.ts                          # NEW
package.json                               # test:autosave script
changes.md                                 # changelog entry
```

**Structure Decision**: Single-project layout as it exists. The pure module sits beside `scoreChangeState.ts`, which is the project's existing home for dependency-free view state logic that is tested without a DOM. The view owns one scheduler instance because the view already owns the "score changed" state that arms it.

## Complexity Tracking

No constitution violations to justify.
