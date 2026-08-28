---

description: "Task list for Vue-Based Modifier Property Dialogs"
---

# Tasks: Vue-Based Modifier Property Dialogs

**Input**: Design documents from `/specs/004-vue-modifier-dialogs/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md) (pattern/mapping decisions), [data-model.md](./data-model.md) (per-dialog field inventory), [quickstart.md](./quickstart.md) (manual validation)

**Tests**: Not requested — this repo has no automated UI test harness for these dialogs (`npm test` is a no-op); validation is manual via `quickstart.md`, run in the Polish phase.

**Organization**: Tasks are grouped by user story (from `spec.md`), one per legacy dialog, in the same priority order (P1–P7). Every dialog's field list, adapter, and control mapping is documented in `data-model.md` — consult it for any detail not repeated here.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US7 per `spec.md` (Volta, Text Bracket, Slur, Pedal Marking, Hairpin, Dynamics, Custom Tuplet)
- File paths are relative to the repository root

## Path Conventions

Single front-end project. New creation functions live in `src/ui/dialogs/`, new components in `src/ui/components/dialogs/`, call-site edits in `src/ui/dialogs/factory.ts`, `src/ui/menus/text.ts`, and `src/ui/menus/tuplets.ts`.

---

## Phase 1: Setup

**Purpose**: Confirm the shared patterns and infrastructure every task below relies on, before any new file is created.

- [X] T001 Read `src/ui/dialogs/timeSignature.ts` (`SuiTimeSignatureDialogVue`) and `src/ui/dialogs/textBlockVue.ts` (`SuiTextBlockDialogVue`) as the creation-function pattern to follow, and `InstallDialog`/`SuiDialogParams` in `src/ui/dialogs/dialog.ts` to confirm the contract (`root`, `app`, `appParams`, `dialogParams`, `commitCb`, `cancelCb`, `removeCb?`). No code changes in this task.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Close the one shared gap identified in `research.md` R4 — today every Vue dialog opens at a fixed default position, but six of the seven legacy dialogs here open positioned at the clicked modifier (`MODIFIERPOS`). This must exist before any of US1–US6 can be independently tested against their "opens near the modifier" acceptance criterion.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] In `src/ui/composable/draggable.ts`, extend `draggableSession(domId: string, cssClass?: string)` to accept an optional third parameter `initialPosition?: { top: number, left: number }`; when provided, seed the `top`/`left` refs from it instead of the current hardcoded `100`/`100`. Existing callers that omit the third argument keep today's behavior unchanged.
- [X] T003 [P] In `src/ui/dialogs/adapter.ts`, add an exported helper `getModifierDialogPosition(view: SuiScoreViewOperations, modifier: any): { top: number, left: number } | undefined` that mirrors legacy `SuiDialogBase.positionFromModifier()`: if `modifier?.logicalBox` is set, return `view.renderer.pageMap.svgToClient(modifier.logicalBox)` mapped to `{ top: <box.y>, left: <box.x> }`; otherwise return `undefined` (so the caller omits the optional argument and falls back to the existing default).
- [X] T004 In `src/ui/components/dialogs/dialogContainer.vue`, add an optional `initialPosition?: { top: number, left: number }` prop and pass it through as the third argument to `draggableSession(getDomId(), undefined, initialPosition)`. Depends on T002.

**Checkpoint**: Shared modifier-relative positioning is available to every new dialog. Proceed to user stories.

---

## Phase 3: User Story 1 - Edit a Volta using the modern dialog (Priority: P1) 🎯 MVP

**Goal**: Replace `SuiVoltaAttributeDialog` with a Vue dialog editing the same four fields via the unchanged `SuiVoltaAdapter`.

**Independent Test**: Click a volta on the score; the dialog opens near it; changing number/X1/X2/Y updates the volta live; Cancel reverts; Remove deletes it.

### Implementation for User Story 1

- [X] T005 [US1] Create `src/ui/components/dialogs/volta.vue`: props `domId: string`, `label: string`, `initialPosition?: { top: number, left: number }`, `number: number`, `xOffsetStart: number`, `xOffsetEnd: number`, `yOffset: number`, `updateFieldCb: (param: 'number'|'xOffsetStart'|'xOffsetEnd'|'yOffset', value: number) => void`, `commitCb`, `cancelCb`, `removeCb`. Render four `numberInput.vue` rows (labels "number", "X1 Offset", "X2 Offset", "Y Offset", per `data-model.md`) inside `dialogContainer` (passing `initialPosition`, `commitCb`, `cancelCb`, `removeCb`).
- [X] T006 [US1] Create `src/ui/dialogs/voltaVue.ts` exporting `SuiVoltaAttributeDialogVue = (parameters: SuiDialogParams) => {...}` following the `SuiTimeSignatureDialogVue` pattern: call `replaceVueRoot(modalContainerId)`; construct `const adapter = new SuiVoltaAdapter(parameters.view, parameters.modifier)`; read the four initial values off the adapter's getters; build `updateFieldCb` that writes straight to `adapter[param] = value` (the adapter's own setter already updates the score, per `research.md` R3); compute `initialPosition` via `getModifierDialogPosition(parameters.view, parameters.modifier)` (T003); define `commitCb = () => adapter.commit()`, `cancelCb = () => adapter.cancel()`, `removeCb = () => adapter.remove()`; call `InstallDialog({ root, app: voltaComp, appParams, dialogParams: parameters, commitCb, cancelCb, removeCb })`. Note: the legacy `SuiVoltaAttributeDialog.createAndDisplay` static method's `logicalBox === null` guard is dead code today (`factory.ts` calls the generic `createAndDisplayDialog` helper, which never invokes that static method) — do not add an equivalent guard here, to avoid changing currently-shipping behavior.
- [X] T007 [US1] In `src/ui/dialogs/factory.ts`, add `import { SuiVoltaAttributeDialogVue } from './voltaVue';` and replace the `else if (ctor === 'SmoVolta') { return createAndDisplayDialog(SuiVoltaAttributeDialog, parameters); }` branch with a direct call `SuiVoltaAttributeDialogVue(parameters); return null;`, mirroring the existing `SmoTextGroup` branch immediately below it. Keep the existing `SuiVoltaAttributeDialog` import — `initDialogTranslationElements` still reads its static `dialogElements`.

**Checkpoint**: User Story 1 fully functional and independently testable.

---

## Phase 4: User Story 2 - Edit a Text Bracket using the modern dialog (Priority: P2)

**Goal**: Replace `SuiTextBracketDialog` with a Vue dialog editing line/position/text/subtext via the unchanged `SuiTextBracketAdapter`.

**Independent Test**: Click a text bracket on the score; change line, flip position Above/Below, edit text/subtext, confirm live updates; Cancel reverts; Remove deletes it.

### Implementation for User Story 2

- [X] T008 [US2] Create `src/ui/components/dialogs/textBracket.vue`: props `domId`, `label`, `initialPosition?`, `line: number`, `position: number`, `text: string`, `superscript: string`, `updateNumberCb: (param: 'line'|'position', value: number) => void`, `updateTextCb: (param: 'text'|'superscript', value: string) => void`, `commitCb`, `cancelCb`, `removeCb`. Render: `numberInput.vue` for "Line"; `select.vue` for "Position" with options `[{ value: '1', label: 'Above' }, { value: '-1', label: 'Below' }]` (values converted to/from number at the callback boundary, per the legacy `dialogElements` options); plain `<input type="text" class="form-control">` bound with `v-model`/`@change` for "Text" and "SubText" (per `research.md` R2 — no dedicated text-input component exists in this codebase).
- [X] T009 [US2] Create `src/ui/dialogs/textBracketVue.ts` exporting `SuiTextBracketDialogVue`, following the same shape as T006: construct `new SuiTextBracketAdapter(parameters.view, parameters.modifier)`, read initial `line`/`position`/`text`/`superscript`, wire `updateNumberCb`/`updateTextCb` to the adapter's setters (`updateValue`/`updateText` under the hood), compute `initialPosition` via `getModifierDialogPosition`, wire `commitCb`/`cancelCb`/`removeCb` to the adapter, call `InstallDialog`.
- [X] T010 [US2] In `src/ui/dialogs/factory.ts`, add `import { SuiTextBracketDialogVue } from './textBracketVue';` and replace the `else if (ctor === 'SmoStaffTextBracket') { return createAndDisplayDialog(SuiTextBracketDialog, parameters); }` branch with `SuiTextBracketDialogVue(parameters); return null;`. Keep the `SuiTextBracketDialog` import for `dialogElements`/i18n.

**Checkpoint**: User Stories 1 and 2 both independently functional.

---

## Phase 5: User Story 3 - Edit a Slur using the modern dialog, including reset-all (Priority: P3)

**Goal**: Replace `SuiSlurAttributesDialog` with a Vue dialog covering all 13 fields via the unchanged `SuiSlurAdapter`, preserving the OK/Cancel/Remove-disable-during-reset-all behavior.

**Independent Test**: Click a slur; adjust shape/offset/control-point fields and confirm live redraw; change start/end position and orientation dropdowns; trigger "Defaults" (resets this slur); with 2+ slurs in the score, trigger "Reset All Slurs" and confirm OK/Cancel/Remove are disabled until every slur is reset, then re-enabled; Cancel (when not mid-reset) reverts; Remove deletes it.

### Implementation for User Story 3

- [X] T011 [US3] Create `src/ui/components/dialogs/slur.vue`: props `domId`, `label`, `initialPosition?`, the 8 numeric fields (`spacing`, `thickness`, `xOffset`, `yOffset`, `cp1x`, `cp1y`, `cp2x`, `cp2y`), the 3 dropdown fields (`position` and `position_end` with options Auto/Head/Top, `orientation` with options Auto/Up/Down — option value/label lists copied verbatim from `SuiSlurAttributesDialog.dialogElements`), `updateNumberCb`, `updateSelectCb`, a `triggerDefaultsCb: () => void` and `triggerResetAllCb: () => void` (rendered as two `toggle.vue` rows labeled "Defaults" and "Reset All Slurs" whose `changeCb` ignores the boolean and just calls the trigger, since these are write-only actions on the adapter), an `enable: boolean` prop threaded to `dialogContainer`'s existing `:enable` prop (per `research.md` R6) so OK/Cancel/Remove disable together.
- [X] T012 [US3] Create `src/ui/dialogs/slurVue.ts` exporting `SuiSlurAttributesDialogVue`: construct `new SuiSlurAdapter(parameters.view, parameters.modifier)`; read the 11 initial field values; wire `updateNumberCb`/`updateSelectCb` to the adapter's setters; wire `triggerDefaultsCb` to `adapter.resetDefaults = true` and `triggerResetAllCb` to `adapter.resetAll = true`; add an `enable: Ref<boolean>` that starts `true`, and after `resetAll` is triggered, poll `adapter.updating` on a short interval (mirroring `SuiSlurAttributesDialog.modalPromise()`'s 200ms poll) setting `enable.value = false` while `adapter.updating === true` and back to `true` once it flips false; compute `initialPosition` via `getModifierDialogPosition`; `cancelCb` must skip the adapter's restore-from-backup while `adapter.updating` is true (matching legacy `SuiSlurAttributesDialog.disableClose()` intent — the button is disabled, but guard the callback body too); call `InstallDialog`.
- [X] T013 [US3] In `src/ui/dialogs/factory.ts`, add `import { SuiSlurAttributesDialogVue } from './slurVue';` and replace the `else if (ctor === 'SmoSlur') { return createAndDisplayDialog(SuiSlurAttributesDialog, parameters); }` branch with `SuiSlurAttributesDialogVue(parameters); return null;`. Keep the `SuiSlurAttributesDialog` import for `dialogElements`/i18n.

**Checkpoint**: User Stories 1–3 all independently functional, including Slur's reset-all blocking behavior (SC-005).

---

## Phase 6: User Story 4 - Edit a Pedal Marking using the modern dialog (Priority: P4)

**Goal**: Replace `SuiPedalMarkingDialog` with a Vue dialog covering its 5 fields via the unchanged `SuiPedalMarkingAdapter`, preserving the multi-measure redraw on every change.

**Independent Test**: Click a pedal marking; toggle bracket/start-mark/release-mark and confirm the rendered marking updates across its full measure range; edit depress/release text; Cancel reverts; Remove deletes it.

### Implementation for User Story 4

- [X] T014 [US4] Create `src/ui/components/dialogs/pedalMarking.vue`: props `domId`, `label`, `initialPosition?`, `bracket: boolean`, `startMark: boolean`, `releaseMark: boolean`, `depressText: string`, `releaseText: string`, `updateBooleanCb`, `updateTextCb`, `commitCb`, `cancelCb`, `removeCb`. Render three `toggle.vue` rows ("Bracket", "Start Mark", "ReleaseMark") and two plain text `<input>` rows ("Depress Text", "Release Text").
- [X] T015 [US4] Create `src/ui/dialogs/pedalMarkingVue.ts` exporting `SuiPedalMarkingDialogVue`: construct `new SuiPedalMarkingAdapter(parameters.view, parameters.modifier)` (its constructor already calls `view.groupUndo(true)`, unchanged); after each field write via `updateBooleanCb`/`updateTextCb`, replicate `SuiPedalMarkingDialog.changed()`'s redraw exactly: recompute `SmoSelection.getMeasuresBetween(parameters.view.score, adapter.pedalMarking.startSelector, adapter.pedalMarking.endSelector)`, call `parameters.view.undoStaffModifier('pedal marking', adapter.backup, UndoBuffer.bufferSubtypes.UPDATE)`, `await addOrReplacePedalMarking(parameters.view, adapter.pedalMarking)`, `parameters.view._renderChangedMeasures(redraw)`, `await parameters.view.updatePromise()`; compute `initialPosition` via `getModifierDialogPosition`; wire `commitCb`/`cancelCb`/`removeCb` to the adapter; call `InstallDialog`.
- [X] T016 [US4] In `src/ui/dialogs/factory.ts`, add `import { SuiPedalMarkingDialogVue } from './pedalMarkingVue';` and replace the `else if (ctor === 'SmoPedalMarking') { return createAndDisplayDialog(SuiPedalMarkingDialog, parameters); }` branch with `SuiPedalMarkingDialogVue(parameters); return null;`. Keep the `SuiPedalMarkingDialog` import for `dialogElements`/i18n.

**Checkpoint**: User Stories 1–4 all independently functional.

---

## Phase 7: User Story 5 - Edit a Hairpin using the modern dialog (Priority: P5)

**Goal**: Replace `SuiHairpinAttributesDialog` with a Vue dialog editing its 4 fields via the unchanged `SuiHairpinAdapter`.

**Independent Test**: Click a hairpin; change height/offsets and confirm live redraw; Cancel reverts; Remove deletes it.

### Implementation for User Story 5

- [X] T017 [US5] Create `src/ui/components/dialogs/hairpin.vue`: props `domId`, `label`, `initialPosition?`, `height: number`, `yOffset: number`, `xOffsetRight: number`, `xOffsetLeft: number`, `updateFieldCb`, `commitCb`, `cancelCb`, `removeCb`. Render four `numberInput.vue` rows (labels "Height", "Y Shift", "Right Shift", "Left Shift", per `data-model.md`).
- [X] T018 [US5] Create `src/ui/dialogs/hairpinVue.ts` exporting `SuiHairpinAttributesDialogVue`: construct `new SuiHairpinAdapter(parameters.view, parameters.modifier)`; wire `updateFieldCb` to the adapter's setters (`updateValue` under the hood); compute `initialPosition` via `getModifierDialogPosition`; wire `commitCb`/`cancelCb`/`removeCb` to the adapter; call `InstallDialog`.
- [X] T019 [US5] In `src/ui/dialogs/factory.ts`, add `import { SuiHairpinAttributesDialogVue } from './hairpinVue';` and replace the `if (ctor === 'SmoStaffHairpin') { return createAndDisplayDialog(SuiHairpinAttributesDialog, parameters); }` branch with `SuiHairpinAttributesDialogVue(parameters); return null;`. Keep the `SuiHairpinAttributesDialog` import for `dialogElements`/i18n.

**Checkpoint**: User Stories 1–5 all independently functional.

---

## Phase 8: User Story 6 - Edit a Dynamics marking using the modern dialog (Priority: P6)

**Goal**: Replace `SuiDynamicModifierDialog` with a Vue dialog editing its 4 fields via the unchanged `SuiDynamicDialogAdapter`, fanning changes out to every covered note selection.

**Independent Test**: Select one or more notes and open Dynamics Properties (existing or newly-created marking); change the dynamic-level dropdown/position/size and confirm every covered note updates; Cancel reverts all of them; Remove clears the marking from all of them.

### Implementation for User Story 6

- [X] T020 [US6] Create `src/ui/components/dialogs/dynamics.vue`: props `domId`, `label`, `initialPosition?`, `yOffsetLine: number`, `yOffsetPixels: number`, `xOffset: number`, `text: string`, `updateNumberCb`, `updateTextCb`, `commitCb`, `cancelCb`, `removeCb`. Render three `numberInput.vue` rows ("Y Line", "Y Offset Px", "X Offset") and one `select.vue` row ("Text") with the 7 dynamic-level options (P/PP/MP/MF/F/FF/SFZ, values/labels copied verbatim from `SuiDynamicModifierDialog.dialogElements`).
- [X] T021 [US6] Create `src/ui/dialogs/dynamicsVue.ts` exporting `SuiDynamicModifierDialogVue`: construct `new SuiDynamicDialogAdapter(parameters.view, parameters.modifier)` — `parameters.modifier` is always an already score-attached `SmoDynamicText` by the time this runs (the `text.ts` menu handler creates and adds a default marking to every selected note before opening the dialog when none exists, per `data-model.md`), so no "is this new" branch is needed (unlike `SuiTextBlockDialogVue`); wire `updateNumberCb`/`updateTextCb` to the adapter's setters (which already fan out via `syncModifiers()`); compute `initialPosition` via `getModifierDialogPosition(parameters.view, parameters.modifier)`; wire `commitCb`/`cancelCb` (`view.undo()`)/`removeCb` to the adapter; call `InstallDialog`.
- [X] T022 [US6] In `src/ui/dialogs/factory.ts`, add `import { SuiDynamicModifierDialogVue } from './dynamicsVue';` and replace the `else if (ctor === 'SmoDynamicText') { return createAndDisplayDialog(SuiDynamicModifierDialog, parameters); }` branch with `SuiDynamicModifierDialogVue(parameters); return null;`. Keep the `SuiDynamicModifierDialog` import for `dialogElements`/i18n.
- [X] T023 [US6] In `src/ui/menus/text.ts`, change the import from `import { SuiDynamicModifierDialog } from '../dialogs/dynamics';` to `import { SuiDynamicModifierDialogVue } from '../dialogs/dynamicsVue';` and replace the `createAndDisplayDialog(SuiDynamicModifierDialog, { ... })` call inside `dynamicsDialogMenuOption.handler` (~line 137) with `SuiDynamicModifierDialogVue({ ... })` using the same parameters object.

**Checkpoint**: User Stories 1–6 all independently functional.

---

## Phase 9: User Story 7 - Create a Custom Tuplet using the modern dialog (Priority: P7)

**Goal**: Replace `SuiCustomTupletDialog` with a Vue dialog editing its 4 fields via the unchanged `SuiCustomTupletAdapter`; one-shot, no Remove button, no live per-field score update.

**Independent Test**: Select a run of notes, open Custom Tuplet, set note count/notes-occupied/ratioed/bracketed, click OK, confirm the selection is grouped into a matching tuplet; Cancel applies nothing.

### Implementation for User Story 7

- [X] T024 [US7] Create `src/ui/components/dialogs/customTuplet.vue`: props `domId`, `label`, `numNotes: number`, `notesOccupied: number`, `ratioed: boolean`, `bracketed: boolean`, `updateFieldCb`, `commitCb`, `cancelCb` (no `removeCb` prop — this dialog has no Remove button, matching the legacy dialog's lack of a remove action). Render two `numberInput.vue` rows ("Num of notes", "Notes occupied", both `min=1`) and two `toggle.vue` rows ("Ratioed", "Bracketed"). No `initialPosition` — there is no modifier to position from, matching the legacy dialog's absence of a `MODIFIERPOS` display option; `dialogContainer` uses its existing default fixed position.
- [X] T025 [US7] Create `src/ui/dialogs/customTupletsVue.ts` exporting `SuiCustomTupletDialogVue`: construct `new SuiCustomTupletAdapter(parameters.view)` (no modifier argument); wire `updateFieldCb` to the adapter's setters (local-only until commit); `commitCb = () => adapter.commit()` (applies `view.makeTuplet(makeTuplet)`); `cancelCb = () => adapter.cancel()` (no-op); call `InstallDialog` with no `removeCb`.
- [X] T026 [US7] In `src/ui/menus/tuplets.ts`, change the import from `import { SuiCustomTupletDialog } from "../dialogs/customTuplets";` to `import { SuiCustomTupletDialogVue } from "../dialogs/customTupletsVue";` and replace the `createAndDisplayDialog(SuiCustomTupletDialog, { ... })` call (~line 67) with `SuiCustomTupletDialogVue({ ... })` using the same parameters object.

**Checkpoint**: All seven user stories independently functional.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across all seven dialogs, tying back to `spec.md` Success Criteria.

- [X] T027 [P] Run `grep -rn "createAndDisplayDialog(SuiVoltaAttributeDialog\|createAndDisplayDialog(SuiTextBracketDialog\|createAndDisplayDialog(SuiSlurAttributesDialog\|createAndDisplayDialog(SuiPedalMarkingDialog\|createAndDisplayDialog(SuiHairpinAttributesDialog\|createAndDisplayDialog(SuiDynamicModifierDialog\|createAndDisplayDialog(SuiCustomTupletDialog" src/ui` and confirm no matches remain (SC-004).
- [X] T028 [P] Confirm the seven legacy dialog classes and their static `dialogElements` are still present and still referenced by `initDialogTranslationElements`/`DialogTranslations` in `src/ui/dialogs/factory.ts` (per `research.md` R5) — no accidental deletion while removing their construction call sites.
- [ ] T029 Run the full manual validation pass in [quickstart.md](./quickstart.md) against all 7 dialogs: field parity and live-update behavior (SC-001), Cancel-reverts-everything for the six modifier-editing dialogs (SC-002), no dialog rendering a legacy custom-component base class (SC-003), and the Slur "Reset All Slurs" disable/re-enable check (SC-005). **Not completed by the implementing agent**: `npm run build`/`npm run types` both pass, and a headless-Chromium smoke test confirmed the app boots with zero console errors — but the SVG score canvas does not render at all in this sandboxed headless environment (confirmed via a stash-and-rebuild differential test: the identical blank canvas occurs on the pre-change baseline too, so it is a pre-existing environment limitation, not a regression from this feature). Since every one of these 7 dialogs is opened by clicking a modifier or note on that canvas, the actual click-through-and-verify steps in `quickstart.md` could not be executed here and still need to be run in a real browser.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. T002 and T003 are independent (`[P]`); T004 depends on T002. BLOCKS all user stories (US1–US6 need `initialPosition`/`getModifierDialogPosition`; US7 doesn't strictly need it but still waits for the phase per standard ordering).
- **User Stories (Phase 3–9)**: All depend on Foundational (Phase 2) completion. Each story's three tasks touch its own new files plus one shared file (`factory.ts`, or `menus/text.ts`/`menus/tuplets.ts` for US6/US7) — stories should be implemented in priority order (P1→P7) since several edit adjacent branches of the same `factory.ts` `if/else if` chain, but each story is independently testable once its own tasks land.
- **Polish (Phase 10)**: Depends on all seven user stories being complete.

### Within Each User Story

- The `.vue` component (first task) has no dependency on the creation function and can be built first.
- The creation function (second task) imports the `.vue` component, so it depends on the first task.
- The call-site update (third task) imports the creation function, so it depends on the second task.

### Parallel Opportunities

- T002 and T003 (Phase 2) can run in parallel — different files.
- The first task (`.vue` component) of each user story phase could be drafted in parallel across stories by different people, since each is a new, independent file — but the corresponding `factory.ts` (or `menus/*.ts`) edit in each story's third task touches a shared file and should be applied one story at a time to avoid merge conflicts.
- T027 and T028 (Polish) can run in parallel — independent checks.

---

## Parallel Example: Foundational Phase

```bash
Task: "Extend draggableSession with optional initial position in src/ui/composable/draggable.ts"
Task: "Add getModifierDialogPosition helper in src/ui/dialogs/adapter.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (T001).
2. Complete Phase 2 (T002–T004) — shared positioning plumbing ready.
3. Complete Phase 3 (T005–T007) — Volta fully converted.
4. **STOP and VALIDATE**: click a volta on the score, confirm it matches `spec.md` User Story 1's acceptance scenarios.

### Incremental Delivery

1. Setup + Foundational → shared plumbing ready.
2. Add US1 (Volta) → validate → this is the MVP.
3. Add US2 (Text Bracket) → validate.
4. Add US3 (Slur) → validate, including the reset-all disable/re-enable behavior.
5. Add US4 (Pedal Marking) → validate, including the multi-measure redraw.
6. Add US5 (Hairpin) → validate.
7. Add US6 (Dynamics) → validate, including the new-marking and multi-note-fan-out cases.
8. Add US7 (Custom Tuplet) → validate the one-shot, no-Remove behavior.
9. Phase 10: full regression pass confirms all five Success Criteria.

### Practical Note

Because six of the seven `factory.ts` branches sit in the same `if/else if` chain (`SuiModifierDialogFactory.createModifierDialog`), implement and commit each user story's three tasks as a unit before starting the next story, even though the `.vue` component and creation-function tasks are technically parallelizable across stories — this avoids repeated merge conflicts in `factory.ts`.
