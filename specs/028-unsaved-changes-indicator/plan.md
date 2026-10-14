# Implementation Plan: Unsaved Changes Indicator and Save Prompt

**Branch**: `028-unsaved-changes-indicator` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/028-unsaved-changes-indicator/spec.md`

## Summary

The score view gains two pieces of session state, `scoreChanged` and `scoreName` (both Vue refs, like the existing `selectedPart`), that the sidebar header renders as `Smoosic <name>*`. The changed flag is set from a single choke point: `UndoBuffer.addBuffer` gets an optional `onAddBuffer` callback that `SuiScoreView` wires to `markScoreChanged()`. This catches all ten places that record undo (seven in `scoreView.ts`, three in `scoreViewOperations.ts` that bypass the `_undo*` helpers). `SuiScoreView.undo()` also marks the score changed. The flag is cleared at the end of `changeScore` (every new, opened, imported or library load) and by a new `SuiScoreViewOperations.recordSave(extension)` that clears it only for the full Smoosic format (`.json`), plus `quickSave()`. The Save dialog calls `recordSave` on commit and reports its outcome (`saved`, `exported`, `cancelled`) to a new "unsaved changes" prompt. That prompt gates New, Open, Import and Music Library loads: Save (looping back to the prompt after a lossy export), Don't save, or Cancel. Because the Open and Library dialogs are themselves modal, the prompt runs from a new `afterCloseCb` that `InstallDialog` calls once the host dialog has closed.

## Technical Context

**Language/Version**: TypeScript (built by `build/build.js`); Vue 3 `<script setup>` for components.

**Primary Dependencies**: Existing only: Vue 3 (`ref`), `UndoBuffer` (`src/smo/xform/undo.ts`), `SuiScoreView` / `SuiScoreViewOperations`, `InstallDialog` (`src/ui/dialogs/dialog.ts`), `SuiFileSaveDialog` / `SuiFileUploadDialog` (`fileDialogs.ts`), `libraryVue.ts` / `library.vue`, `sidebar.vue`, `file.ts` menu.

**Storage**: None added. The change state is memory-only and is not serialized into the score; `quickSave` still writes the same local-storage JSON.

**Testing**: Headless `ts-node` script `tests/scoreChangeState.ts` (`npm run test:score-change-state`) for the pure logic: the `UndoBuffer` callback, the lossless-format policy, the title formatter, and the prompt-loop decision function. UI behavior (header, prompt, dialog sequencing) is verified manually per `quickstart.md`; rendering UI regression is lower priority per the constitution.

**Target Platform**: Browser application; headless tests under Node.

**Project Type**: Single project (library + application); existing `src/` and `tests/` layout.

**Performance Goals**: No regression. The `addBuffer` callback sets one boolean ref; the header re-renders one text node. No DOM measurement or per-render work is added.

**Constraints**: `src/smo` stays UI-free (the `onAddBuffer` callback is a plain function field). Not persisted in score JSON. Must work in part view (the flag follows the one `storeScore`). The prompt must not appear while another modal's DOM is still mounted.

**Scale/Scope**: About 8 touched files and 2 new files (a Vue prompt component and a small pure helper module), plus one test.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle #1 (Serialization)**: PASS. Nothing is added to `SmoScore` or any serialized shape; the changed flag and name display are runtime state. Existing and legacy scores load unchanged.
- **Principle #2 (Non-UI logic regression testing)**: PASS. The decision logic (which formats count as a full save, when to prompt, what happens after a lossy export) and the undo-recording hook are pure and covered by a headless script with a contract case list, matching specs 019, 022, 023 and 027.
- **Principle #3 (Rendering performance)**: PASS. The only per-edit cost is one boolean assignment inside `addBuffer`; no render path, DOM measurement or repaint logic changes.
- **Principle #4 (Logical dependencies)**: PASS. `UndoBuffer` (smo layer) gains only a plain callback and knows nothing about views or Vue. State lives in the view (the render layer already holds Vue refs, e.g. `selectedPart`). Prompt and dialog code live in `src/ui`. The render layer does not import UI code.

No violations; Complexity Tracking is not needed. Re-check after Phase 1: unchanged, still PASS.

## Project Structure

### Documentation (this feature)

```text
specs/028-unsaved-changes-indicator/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── score-change-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md              # created later by /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── smo/xform/
│   └── undo.ts                       # UndoBuffer: optional onAddBuffer callback, fired by addBuffer
├── render/sui/
│   ├── scoreChangeState.ts           # NEW, no imports: isFullSaveFormat(ext), formatScoreTitle(name, changed),
│   │                                 #      nextStepAfterSave(outcome, fullySaved)
│   ├── scoreView.ts                  # scoreName/scoreChanged refs; markScoreChanged/markScoreSaved/refreshScoreName;
│   │                                 #   wire storeUndo.onAddBuffer; undo() marks changed; changeScore() clears + refreshes
│   └── scoreViewOperations.ts        # recordSave(extension); quickSave() clears; updateScoreInfo() refreshes name
├── ui/
│   ├── dialogs/
│   │   ├── dialog.ts                 # DialogInstallParams.afterCloseCb, run after a commit has closed the dialog
│   │   ├── fileDialogs.ts            # Upload: convert in commit, replace in afterCloseCb after prompt;
│   │   │                             #   Save: recordSave on commit, report outcome via onClosed
│   │   ├── libraryVue.ts             # afterCloseCb: prompt then loadRemoteScore
│   │   └── unsavedChanges.ts         # NEW: confirmReplaceScore(parameters): Promise<boolean>
│   ├── components/
│   │   ├── buttons/sidebar.vue       # shows "Smoosic <name>*"
│   │   └── dialogs/
│   │       ├── library.vue           # report selected url instead of loading directly
│   │       └── unsavedChanges.vue    # NEW: Save / Don't save / Cancel
│   ├── buttons/ribbon.ts             # pass scoreName/scoreChanged refs to the sidebar app
│   └── menus/file.ts                 # New: prompt before changeScore

tests/
└── scoreChangeState.ts               # NEW headless regression script

package.json                          # add "test:score-change-state" script
```

**Structure Decision**: Keep to the existing layering (smo / render / ui). A single pure module, `scoreChangeState.ts`, holds the policy so tests do not need DOM, Vue or VexFlow imports.

## Complexity Tracking

*No Constitution Check violations; table not needed.*
