---

description: "Task list for Dynamics Dialog Cleanup and Font Size"
---

# Tasks: Dynamics Dialog Cleanup and Font Size

**Input**: Design documents from `/specs/040-dynamics-dialog-cleanup/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/dynamics-dialog.md](contracts/dynamics-dialog.md), [quickstart.md](quickstart.md)

**Tests**: Included for the model (the font size rule, serialization, applying to notes) in `tests/dynamicsFontSize.ts`. The dialog itself cannot be loaded headless (it imports a `.vue` file), so it is checked by compilation, by compiling the component with Vue's SFC compiler, by searches that prove the legacy code is gone, and by [quickstart.md](quickstart.md).

**Organization**: The rewrite of the dialog function without the adapter is the base for every story, so it is in the Foundational phase. Each story then adds its piece: the Font Size field (US1), proof that existing behaviour is kept (US2), and removal of the legacy dialog (US3).

**Existing uncommitted work**: `src/ui/components/dialogs/dynamics.vue` has an uncommitted change by the user (the `updateNumberCb` prop type is `Promise<void>`). Edit on top of it; do not revert it.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on unfinished tasks)
- **[Story]**: Which user story the task belongs to (US1 to US3)

## Phase 1: Setup

- [X] T001 Create `tests/dynamicsFontSize.ts` with the `check()`/failure-count harness and the dynamic-ctor registration used in `tests/quickBeam.ts` (`noteModifierDynamicCtorInit`, `measureModifierDynamicCtorInit`, `staffModifierDynamicCtorInit`, `scoreModifierDynamicCtorInit`), plus a `buildScore(noteCount: number)` helper that makes a default score (`SmoScore.getDefaultScore(SmoScore.defaults, null)`) whose first measure has `noteCount` quarter notes (clone the first note with `SmoNote.cloneWithDuration(proto, 4096)`, `noteType = 'n'`) and a `pick(score, tick)` helper returning `SmoSelection.noteSelection(score, 0, 0, 0, tick)!`. Register `"test:dynamics-font-size": "ts-node -P tests/tsconfig.json tests/dynamicsFontSize.ts"` in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The size rule on the model, and the dialog function rewritten without the adapter. See [research.md](research.md) R1 to R3 and [data-model.md](data-model.md).

- [X] T002 In `src/smo/data/noteModifiers.ts` add to `SmoDynamicText`: `static readonly minFontSize: number = 1`, `static readonly maxFontSize: number = 99`, and `static isValidFontSize(value: number): boolean` that is true only for a whole number (`Number.isInteger`) from `minFontSize` to `maxFontSize` inclusive, and false for anything else including non-numbers (check `typeof value === 'number'` first). Add a doc comment. Do not change `defaults`, `persistArray` or `serialize`
- [X] T003 Rewrite `src/ui/dialogs/dynamicsVue.ts` so it does not import `./dynamics` and has no adapter object. Keep the same export (`SuiDynamicModifierDialogVue(parameters: SuiDialogParams)`), imports of `SuiDialogParams`, `InstallDialog`, `getModifierDialogPosition`, `dynamicsComp`, `replaceVueRoot`, `modalContainerId`, and add imports of `SmoDynamicText` (from `'../../smo/data/noteModifiers'`) and `SmoSelection` (from `'../../smo/xform/selections'`). Inside the function, in this order, copy the legacy behaviour from [research.md](research.md) R1: `const view = parameters.view; const modifier = parameters.modifier as SmoDynamicText;`, `view.groupUndo(true)`, then `view.undoTrackerMeasureSelections('Dynamics')`, then build `const selections: SmoSelection[] = []` from `view.tracker.modifierSelections` (push each `ms.selection` that is set) and, if there are none, use `view.tracker.selections`. Define local functions: `syncModifiers = () => { selections.forEach((sel) => { view.addDynamic(sel, modifier); }); }`; `updateNumberCb = async (param: 'yOffsetLine' | 'yOffsetPixels' | 'xOffset', value: number) => { modifier[param] = value; syncModifiers(); }`; `updateTextCb = (value: string) => { modifier.text = value; syncModifiers(); }`; `commitCb = async () => {}`; `cancelCb = async () => { await view.undo(); }`; `removeCb = async () => { await view.removeDynamic(modifier); }`. Build `appParams` from `modifier.yOffsetLine`, `modifier.yOffsetPixels`, `modifier.xOffset`, `modifier.text` (replacing every `adapter.` read), keeping `domId`, `label: 'Dynamics Properties'`, `initialPosition`, and the callbacks. Keep the `InstallDialog` call as it is. Replace the doc comment: say the dialog keeps its state in local variables and that the marking is already attached to the score by the menu handler in `src/ui/menus/text.ts`
- [X] T004 Run `npx tsc --noEmit -p tsconfig.json` to confirm the foundation compiles. (`dynamics.ts` still exists at this point and nothing imports it from `dynamicsVue.ts` any more.)

**Checkpoint**: The dialog works exactly as before, with no adapter. No size field yet.

---

## Phase 3: User Story 1 - Change the size of a dynamic marking (Priority: P1)

**Goal**: The Dynamics dialog has a Font Size field that redraws the marking live on every selected note, saves with the score, and rejects out-of-range values.

**Independent Test**: Run the M and S cases in `tests/dynamicsFontSize.ts`, then [quickstart.md](quickstart.md) section 3.

- [X] T005 [P] [US1] In `tests/dynamicsFontSize.ts` add the model cases from [contracts/dynamics-dialog.md](contracts/dynamics-dialog.md): M1 to M6 (default 30; `isValidFontSize` true for 1, 30, 99; false for 0, -5, 100, 1000, 12.5, `NaN`, `Infinity`, `-Infinity`, a string and `undefined` passed with a cast; the constants are 1 and 99) and S1 to S5 (a default-size marking serializes without `fontSize`; size 48 serializes with it; a score with one note at 48 and one at the default round trips through `JSON.stringify(score.serialize())` and `SmoScore.deserialize` with 48 and 30; a marking built from parameters with no `fontSize` has 30; setting 48 then back to 30 serializes without `fontSize`). Attach markings with `SmoOperation.addDynamic(pick(score, n), new SmoDynamicText({ ...SmoDynamicText.defaults, fontSize }))` and read them with `note.getModifiers('SmoDynamicText')`. Run `npm run test:dynamics-font-size`
- [X] T006 [P] [US1] In `src/ui/components/dialogs/dynamics.vue`: add `fontSize: number` to `Props`; widen the number callback's param type to `'yOffsetLine' | 'yOffsetPixels' | 'xOffset' | 'fontSize'` (keep the `Promise<void>` return type that is already there); and add a Font Size field after the X Offset row, in the same style: `<numberInputApp :domId="getId('font-size')" :initialValue="fontSize" :precision="0" label="Font Size" :minValue="SmoDynamicText.minFontSize" :maxValue="SmoDynamicText.maxFontSize" :changeCb="(value: number) => updateNumberCb('fontSize', value)" :inline="true" />` inside a `<div class="group"><div class="grow-row">`. `SmoDynamicText` is already imported in the component
- [X] T007 [US1] In `src/ui/dialogs/dynamicsVue.ts` add `'fontSize'` to the `param` union of `updateNumberCb`, and make the callback return early, changing nothing and not calling `syncModifiers`, when `param === 'fontSize'` and `!SmoDynamicText.isValidFontSize(value)`. Add `fontSize: modifier.fontSize` to `appParams`
- [X] T008 [US1] Compile the component and the project: run `npx tsc --noEmit -p tsconfig.json`, then the SFC check from [quickstart.md](quickstart.md) section 2 on `src/ui/components/dialogs/dynamics.vue` (expect `parse errors 0` and `ok`)

**Checkpoint**: User story 1 works end to end.

---

## Phase 4: User Story 2 - The dialog keeps working as it does today (Priority: P1)

**Goal**: Show that nothing the dialog did before was lost in the rewrite.

**Independent Test**: Run the A cases in `tests/dynamicsFontSize.ts`, review the function against the list in T010, and run [quickstart.md](quickstart.md) section 4.

- [X] T009 [P] [US2] In `tests/dynamicsFontSize.ts` add the A cases: A1 (three notes: add the same marking to each with `SmoOperation.addDynamic`, change `fontSize` to 40 and add it to each again; every note has exactly one `SmoDynamicText`, of size 40), A2 (`SmoOperation.removeDynamic` on each selected note leaves none), A3 (a marking on one note leaves the others unchanged). Run `npm run test:dynamics-font-size`
- [X] T010 [US2] Read `src/ui/dialogs/dynamicsVue.ts` side by side with the legacy `src/ui/dialogs/dynamics.ts` (still present) and confirm each legacy behaviour has an equivalent in the new function, fixing any gap: (1) `groupUndo(true)` before the snapshot; (2) `undoTrackerMeasureSelections('Dynamics')` once; (3) selections come from `modifierSelections` first, else `tracker.selections`; (4) `yOffsetLine`, `yOffsetPixels`, `xOffset` and `text` each set the field and apply to every selection; (5) Cancel is `view.undo()`; (6) Remove calls `view.removeDynamic(modifier)`; (7) the same props reach the component; (8) the `initialPosition` still comes from `getModifierDialogPosition(view, parameters.modifier)`. Record the result as a short comment-free note in the PR or commit message, not in the code

**Checkpoint**: Every existing behaviour is accounted for.

---

## Phase 5: User Story 3 - The old dialog is gone (Priority: P2)

**Goal**: The legacy dialog and its adapter are deleted and nothing refers to them.

**Independent Test**: Contract cases C1 to C8, and [quickstart.md](quickstart.md) section 2.

- [X] T011 [US3] Delete `src/ui/dialogs/dynamics.ts` (`git rm src/ui/dialogs/dynamics.ts`)
- [X] T012 [P] [US3] In `typedoc.ts` (repository root) remove `export * from './src/ui/dialogs/dynamics';`, and in `src/application/exports.ts` remove the `import { SuiDynamicModifierDialog } from '../ui/dialogs/dynamics';` line, the `export * from '../ui/dialogs/dynamics';` line, and `SuiDynamicModifierDialog,` from the exported-names list (it sits at the start of a line with `CheckboxDropdownComponent`; keep the rest of that line)
- [X] T013 [P] [US3] In `src/ui/i18n/language.ts` remove `'SuiDynamicModifierDialog',` from `allDialogs` (research R4). Do not edit the `language_*.json` or `.js` files
- [X] T014 [P] [US3] In `src/ui/dialogs/annotationVue.ts` reword the header comment so it no longer names `SuiDynamicDialogAdapter` or `src/ui/dialogs/dynamics.ts`: say the multi-selection propagation follows the pattern in `src/ui/dialogs/dynamicsVue.ts`
- [X] T015 [P] [US3] Update the declarations by hand (do not run `npm run types`; it rewrites many unrelated files): delete `types/src/ui/dialogs/dynamics.d.ts`; in `types/src/application/exports.d.ts` remove the `SuiDynamicModifierDialog` import, the `export * from '../ui/dialogs/dynamics';` line and the `SuiDynamicModifierDialog: typeof SuiDynamicModifierDialog;` member; in `types/typedoc.d.ts` remove `export * from './src/ui/dialogs/dynamics';`; in `types/src/smo/data/noteModifiers.d.ts` add the three new `SmoDynamicText` static members with their types (`static readonly minFontSize: number;`, `static readonly maxFontSize: number;`, `static isValidFontSize(value: number): boolean;`) with the doc comment from T002; check `types/src/ui/dialogs/dynamicsVue.d.ts` still matches the exported function
- [X] T016 [US3] Run the searches from [quickstart.md](quickstart.md) section 2 and the contract cases C1 to C4 and C8: `git ls-files src/ui/dialogs/dynamics.ts`, `git grep -n "SuiDynamicDialogAdapter\|dialogs/dynamics'" -- src tests types` (both print nothing), and `git grep -n "SuiDynamicModifierDialog\b" -- src types tests` (only the `ctor` strings in `src/ui/menus/text.ts` remain). Then run `npx tsc --noEmit -p tsconfig.json`

**Checkpoint**: All stories are done and the legacy code is gone.

---

## Phase 6: Polish and Cross-Cutting Concerns

- [X] T017 [P] Add a `changes.md` entry (follow the entries at the top of the file) describing: the Dynamics dialog has a **Font Size** field (1 to 99, default 30) that changes the size of the marking on all selected notes; scores saved before open unchanged; and, for people using Smoosic as a library, that the old `SuiDynamicModifierDialog` and `SuiDynamicDialogAdapter` classes are removed (use `SuiDynamicModifierDialogVue`; the factory still opens it for a `SmoDynamicText`)
- [X] T018 Run `npx tsc --noEmit -p tsconfig.json`, then `npm run test:dynamics-font-size`, `npm run test:score-archive`, `npm run test:paste-special`, `npm run test:voice-copy-paste`, `npm run test:quick-beam`, `npm run test:measure-fill`. All must pass
- [ ] T019 Walk through [quickstart.md](quickstart.md) sections 3 to 5 by hand in the running application and note any difference from the expected results

---

## Dependencies and Execution Order

- Phase 1 (T001) first. Phase 2 (T002 to T004) blocks every story; T002 and T003 touch different files and can run in either order, T004 after both.
- US1 (T005 to T008): T005 and T006 are independent files; T007 needs T002, T003 and T006; T008 after T007.
- US2 (T009, T010) needs only Phase 2 and can run alongside US1. T010 must run before T011 deletes the file it compares against.
- US3 (T011 to T016): T011 after T010. T012 to T015 touch different files and can run in parallel after T011; T016 after all of them.
- Polish (T017 to T019) after the stories; T017 can start any time.

### Parallel opportunities

- T002 and T003 (different files).
- T005 and T006 (different files).
- T009 alongside US1 work.
- T012, T013, T014, T015 (different files).
- T017 with anything.

## Implementation Strategy

**MVP**: Phase 1, Phase 2, then US1 (T001 to T008): the dialog has no adapter and has a working Font Size field. US2 adds the model tests and the side-by-side review that prove nothing was lost, which should be done before the legacy file is deleted. US3 is the deletion and cleanup. Polish adds the changelog, the full test run and the manual walkthrough.

Run `npm run test:dynamics-font-size` after each phase.
