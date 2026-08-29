---

description: "Task list for Vue-Based Key Signature and Tempo Dialogs"
---

# Tasks: Vue-Based Key Signature and Tempo Dialogs

**Input**: Design documents from `/specs/005-vue-keysig-tempo-dialogs/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md) (pattern/mapping decisions, R1-R7), [data-model.md](./data-model.md) (per-dialog field inventory), [quickstart.md](./quickstart.md) (manual validation)

**Tests**: Not requested — this repo has no automated UI test harness for these dialogs (`npm test` is a no-op); validation is manual via `quickstart.md`, run in the Polish phase.

**Organization**: Tasks are grouped by user story (from `spec.md`), one per legacy dialog, in priority order (P1-P2). Every dialog's field list, adapter, and control mapping is documented in `data-model.md` — consult it for any detail not repeated here.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1-US2 per `spec.md` (Key Signature, Tempo)
- File paths are relative to the repository root

## Path Conventions

Single front-end project. New creation functions live in `src/ui/dialogs/`, new components in `src/ui/components/dialogs/`, call-site edits in `src/ui/buttons/ribbon.ts`, `src/ui/buttons/display.ts`, `src/ui/menus/manager.ts`, and `src/application/keyCommands.ts`.

---

## Phase 1: Setup

**Purpose**: Confirm the shared pattern every task below relies on, before any new file is created.

- [X] T001 Read `src/ui/dialogs/textBracketVue.ts` and `src/ui/dialogs/pedalMarkingVue.ts` (creation-function pattern) together with `src/ui/components/dialogs/textBracket.vue`/`customTuplet.vue` (`.vue` component pattern), and re-read `research.md` R1-R5 and `data-model.md` in full. Confirm: (a) `InstallDialog`/`SuiDialogParams` contract (`src/ui/dialogs/dialog.ts`), (b) neither new dialog passes `initialPosition` or `removeCb` (R4, R5), (c) both new dialogs derive `measure` from `parameters.view.tracker.selections`, never from `parameters.modifier` (R2). No code changes in this task.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Not required for this feature.** Unlike `004-vue-modifier-dialogs` (which had to extend `draggableSession`/`dialogContainer.vue` with an `initialPosition` argument before any story could be built), this feature needs no new shared infrastructure: `InstallDialog`, `dialogContainer.vue`, `dialogButtons.vue`, `numberInput.vue`, `select.vue`, and `toggle.vue` are all already generalized enough to be consumed as-is (per `plan.md` and `research.md` R4/R5). Proceed directly to Phase 3.

---

## Phase 3: User Story 1 - Set the Key Signature using the modern dialog (Priority: P1) 🎯 MVP

**Goal**: Replace `SuiKeySignatureDialog` with a Vue dialog editing its two fields via the unchanged `SuiKeySignatureAdapter`.

**Independent Test**: Open the Key Signature dialog from the ribbon; pick a key and an "Apply to" scope; click OK; confirm the score updates only then, to the chosen scope. Cancel applies nothing.

### Implementation for User Story 1

- [X] T002 [US1] Create `src/ui/components/dialogs/keySignature.vue`: props `domId: string`, `label: string`, `smoKey: string`, `applyTo: string`, `updateFieldCb: (param: 'key' | 'applyTo', value: string) => void`, `commitCb: () => Promise<void>`, `cancelCb: () => Promise<void>` (no `removeCb` prop, no `initialPosition` prop — per `research.md` R4/R5). Render two `select.vue` rows inside `dialogContainer` (passing only `domId`, `label`, `commitCb`, `cancelCb` — no `removeCb`, no `initialPosition`):
  - "Key" dropdown (note: the legacy dialog's label for this field is literally `'Tempo Mode'`, a pre-existing copy-paste bug documented in `research.md` R7 — preserve it verbatim in this task; do not silently correct it): 14 options with `value`/`label` pairs copied verbatim from `SuiKeySignatureDialog.dialogElements` (`c`/'C Major', `f`/'F Major', `g`/'G Major', `bb`/'Bb Major', `d`/'D Major', `eb`/'Eb Major', `a`/'A Major', `ab`/'Ab Major', `e`/'E Major', `db`/'Db Major', `b`/'B Major', `f#`/'F# Major', `c#`/'C# Major', `gb`/'Gb Major'), bound to `smoKey` via `:initialValue="smoKey"` and `:changeCb="(value: string) => updateFieldCb('key', value)"`.
  - "Apply to:" dropdown: 3 options (`selections`/'Current Selections', `remaining`/'Future Measures', `all`/'Full Score'), bound to `applyTo` via `:initialValue="applyTo"` and `:changeCb="(value: string) => updateFieldCb('applyTo', value)"`.
  Use the prop name `smoKey` (not `key`) to avoid colliding with Vue's reserved `key` attribute.
- [X] T003 [US1] Create `src/ui/dialogs/keySignatureVue.ts` exporting `SuiKeySignatureDialogVue = (parameters: SuiDialogParams) => {...}` following the `SuiTextBracketDialogVue` pattern: call `replaceVueRoot(modalContainerId)`; derive `measure` via `SmoSelection.getMeasureList(parameters.view.tracker.selections).map((sel) => sel.measure)[0]` (per `research.md` R2 — do not use `parameters.modifier`); construct `const adapter = new SuiKeySignatureAdapter(parameters.view, measure)`; build `updateFieldCb = (param: 'key' | 'applyTo', value: string) => { adapter[param] = value; }`; define `commitCb = () => adapter.commit()`, `cancelCb = () => adapter.cancel()` (no `removeCb`); build `appParams = { domId: rootId, label: 'Key Signature', smoKey: adapter.key, applyTo: adapter.applyTo, updateFieldCb }` (no `initialPosition`); call `InstallDialog({ root: rootId, app: keySignatureComp, appParams, dialogParams: parameters, commitCb, cancelCb })` (no `removeCb`).
- [X] T004 [US1] Update all three Key Signature call sites to call `SuiKeySignatureDialogVue(parameters)` instead of `createAndDisplayDialog(SuiKeySignatureDialog, parameters)`, passing the same parameters object each site already builds (unused fields like `ctor`/`id` are harmless to keep):
  - `src/ui/buttons/ribbon.ts`: add `import { SuiKeySignatureDialogVue } from '../dialogs/keySignatureVue';`; in the `'keySignature'` button branch, replace the `createAndDisplayDialog(SuiKeySignatureDialog, {...})` call with `SuiKeySignatureDialogVue({...})` (same object literal). Keep the existing `SuiKeySignatureDialog` import (still used elsewhere in the file if present, or retained per `research.md` R6 even if not).
  - `src/ui/buttons/display.ts`: add the same import; in `keySignature()`, make the same substitution.
  - `src/ui/menus/manager.ts`: add the same import; in `evKey`'s `event.key === 'k'` branch, make the same substitution.

**Checkpoint**: User Story 1 fully functional and independently testable.

---

## Phase 4: User Story 2 - Edit the Tempo using the modern dialog (Priority: P2)

**Goal**: Replace `SuiTempoDialog` with a Vue dialog covering all 9 fields via the unchanged `SuiTempoAdapter`, preserving live per-field score updates, mode-dependent Custom Text visibility, and Cancel's full revert.

**Independent Test**: Open the Tempo dialog; change Tempo Mode and confirm Custom Text shows only in "Specify text and duration" mode; change each other field and confirm the score's tempo marking updates live; Cancel reverts everything; no Remove button is present.

### Implementation for User Story 2

- [X] T005 [US2] Create `src/ui/components/dialogs/tempo.vue`: props `domId: string`, `label: string`, `tempoMode: string`, `customText: string`, `bpm: number`, `beatDuration: number`, `tempoText: string`, `applyToAll: boolean`, `applyToSelection: boolean`, `display: boolean`, `yOffset: number`, `updateSelectCb: (param: 'tempoMode' | 'tempoText', value: string) => void`, `updateNumberCb: (param: 'bpm' | 'yOffset', value: number) => void`, `updateBeatDurationCb: (value: number) => void`, `updateTextCb: (value: string) => void`, `updateBooleanCb: (param: 'applyToAll' | 'applyToSelection' | 'display', value: boolean) => void`, `commitCb: () => Promise<void>`, `cancelCb: () => Promise<void>` (no `removeCb` prop, no `initialPosition` prop — per `research.md` R4/R5). Render inside `dialogContainer` (passing only `domId`, `label`, `commitCb`, `cancelCb`):
  - `select.vue` "Tempo Mode": options `duration`/'Duration (Beats/Minute)', `text`/'Tempo Text', `custom`/'Specify text and duration', bound to `tempoMode`, `:changeCb="(value: string) => updateSelectCb('tempoMode', value)"`.
  - Plain `<input type="text" class="form-control">` "Custom Text" bound to `customText` via `v-model`/`@change` calling `updateTextCb`, wrapped in `<div v-if="tempoMode === 'custom'">` (per `data-model.md` — visible only in custom mode, mirroring legacy `showHideCustom()`).
  - `numberInput.vue` "Notes/Minute" bound to `bpm` (`:precision="0"`), `:changeCb="(value: number) => updateNumberCb('bpm', value)"`.
  - `select.vue` "Unit for Beat": options `'4096'`/'Quarter Note', `'2048'`/'1/8 note', `'6144'`/'Dotted 1/4 note', `'8192'`/'1/2 note' (string values), bound via `:initialValue="String(beatDuration)"`, `:changeCb="(value: string) => updateBeatDurationCb(parseInt(value, 10))"` (per `research.md` R3 numeric/string cast at the boundary).
  - `select.vue` "Tempo Text": 16 options with value/label pairs copied verbatim from `SuiTempoDialog.dialogElements` (`SmoTempo.tempoTexts.larghissimo`/'Larghissimo' through `SmoTempo.tempoTexts.prestissimo`/'Prestissimo' — use the literal string values from `SmoTempo.tempoTexts`, not the enum references, since `SelectOption.value` is a plain string), bound to `tempoText`, `:changeCb="(value: string) => updateSelectCb('tempoText', value)"`.
  - `toggle.vue` "Apply to all future measures?" bound to `applyToAll`, `:changeCb="(value: boolean) => updateBooleanCb('applyToAll', value)"`.
  - `toggle.vue` "Apply to selection?" bound to `applyToSelection`, `:changeCb="(value: boolean) => updateBooleanCb('applyToSelection', value)"`.
  - `toggle.vue` "Display Tempo" bound to `display`, `:changeCb="(value: boolean) => updateBooleanCb('display', value)"`.
  - `numberInput.vue` "Y Offset" bound to `yOffset` (`:precision="0"`), `:changeCb="(value: number) => updateNumberCb('yOffset', value)"`.
- [X] T006 [US2] Create `src/ui/dialogs/tempoVue.ts` exporting `SuiTempoDialogVue = (parameters: SuiDialogParams) => {...}`: call `replaceVueRoot(modalContainerId)`; derive `measure` via `SmoSelection.getMeasureList(parameters.view.tracker.selections).map((sel) => sel.measure)[0]` (per `research.md` R2 — do not use `parameters.modifier`, which is absent at the `executeButtonModal` call site); construct `const adapter = new SuiTempoAdapter(parameters.view, measure)`; wire each callback to write straight through to the adapter (per `004-vue-modifier-dialogs` R3 pattern, reproduced here since `research.md` confirms every relevant adapter setter already performs the live `view.updateTempoScore` call): `updateSelectCb = (param, value) => { adapter[param] = value; }`, `updateNumberCb = (param, value) => { adapter[param] = value; }`, `updateBeatDurationCb = (value) => { adapter.beatDuration = value; }`, `updateTextCb = (value) => { adapter.customText = value; }`, `updateBooleanCb = (param, value) => { adapter[param] = value; }` (note `applyToSelection` has no adapter setter side effect — this is expected, per `data-model.md`); define `commitCb = () => adapter.commit()`, `cancelCb = () => adapter.cancel()` (no `removeCb`); build `appParams = { domId: rootId, label: 'Tempo Properties', tempoMode: adapter.tempoMode, customText: adapter.customText, bpm: adapter.bpm, beatDuration: adapter.beatDuration, tempoText: adapter.tempoText, applyToAll: adapter.applyToAll, applyToSelection: adapter.applyToSelection, display: adapter.display, yOffset: adapter.yOffset, updateSelectCb, updateNumberCb, updateBeatDurationCb, updateTextCb, updateBooleanCb }` (no `initialPosition`); call `InstallDialog({ root: rootId, app: tempoComp, appParams, dialogParams: parameters, commitCb, cancelCb })` (no `removeCb`).
- [X] T007 [US2] Update all four Tempo call sites to call `SuiTempoDialogVue(parameters)` instead of `createAndDisplayDialog(SuiTempoDialog, parameters)`, passing the same parameters object each site already builds:
  - `src/ui/buttons/ribbon.ts`: add `import { SuiTempoDialogVue } from '../dialogs/tempoVue';`; in the `'ribbonTempo'` button branch, replace `createAndDisplayDialog(SuiTempoDialog, {...})` with `SuiTempoDialogVue({...})`; in `executeButtonModal`'s `else` branch (the fallback for any modal-button `ctor` that isn't `'SuiLibraryDialog'`, i.e. `'SuiTempoDialog'` today), replace `createAndDisplayDialog(SuiTempoDialog, params)` with `SuiTempoDialogVue(params)`.
  - `src/ui/buttons/display.ts`: add the same import; in `ribbonTempo()`, make the same substitution.
  - `src/application/keyCommands.ts`: add the same import; in `tempoDialog()`, make the same substitution.

**Checkpoint**: User Stories 1 and 2 both independently functional.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across both dialogs, tying back to `spec.md` Success Criteria.

- [X] T008 [P] Run `grep -rn "createAndDisplayDialog(SuiKeySignatureDialog\|createAndDisplayDialog(SuiTempoDialog" src/ui src/application` and confirm no matches remain (SC-004). **Verified**: no matches. Also confirmed `npm run types` and `npm run build` both compile successfully with the new call sites (unused legacy imports of `createAndDisplayDialog`/`SuiKeySignatureDialog`/`SuiTempoDialog` were removed from `ribbon.ts`, `display.ts`, `manager.ts`, `keyCommands.ts` since, unlike `factory.ts` in `004-vue-modifier-dialogs`, nothing else in these four files still referenced the classes directly).
- [X] T009 [P] Confirm `SuiKeySignatureDialog`/`SuiTempoDialog` and their static `dialogElements` are still present in `src/ui/dialogs/keySignature.ts`/`tempo.ts`, and that `SuiTempoDialog` remains listed in `SmoTranslator.allDialogs` (`src/ui/i18n/language.ts`) and both classes remain exported from `src/application/exports.ts` (per `research.md` R6) — no accidental deletion while removing their construction call sites. **Verified**: both classes and `dialogElements` intact; `exports.ts` still exports `SuiTempoDialog`, `SuiKeySignatureDialog`, `SuiKeySignatureAdapter`.
- [ ] T010 Run the full manual validation pass in [quickstart.md](./quickstart.md) against both dialogs: field parity, live-update behavior for Tempo and apply-on-OK-only for Key Signature (SC-001), Cancel-reverts-everything for Tempo and applies-nothing for Key Signature (SC-002), neither dialog rendering a legacy custom-component base class or a Remove button (SC-003), and the regression-check greps from T008 (SC-004). **Not completed by the implementing agent**: `npm run types` and `npm run build` both pass cleanly (T008), but there is no browser available in this environment to click through the actual dialogs on the score canvas — the click-through-and-verify steps in `quickstart.md` still need to be run in a real browser.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Not required — skip directly to Phase 3.
- **User Stories (Phase 3-4)**: Both depend on Setup (Phase 1) completion only. US1 (Key Signature) and US2 (Tempo) touch entirely disjoint new files and disjoint call-site files, so they are fully independent of each other and could be built in either order or in parallel; priority order (P1 then P2) is used here for consistency with `spec.md`.
- **Polish (Phase 5)**: Depends on both user stories being complete.

### Within Each User Story

- The `.vue` component (first task) has no dependency on the creation function and can be built first.
- The creation function (second task) imports the `.vue` component, so it depends on the first task.
- The call-site update (third task) imports the creation function, so it depends on the second task.

### Parallel Opportunities

- T002 (Key Signature `.vue`) and T005 (Tempo `.vue`) could be drafted in parallel — different files, no shared dependency.
- T008 and T009 (Polish) can run in parallel — independent checks.
- US1 (T002-T004) and US2 (T005-T007) touch no shared files (each story's call-site edits land in different methods/branches of `ribbon.ts`/`display.ts`, and different files entirely for `manager.ts`/`keyCommands.ts`), so — unlike `004-vue-modifier-dialogs`, where six stories shared `factory.ts`'s `if/else if` chain — both stories here could be implemented concurrently without merge conflicts.

---

## Parallel Example: Both User Stories

```bash
Task: "Create Key Signature .vue component in src/ui/components/dialogs/keySignature.vue"
Task: "Create Tempo .vue component in src/ui/components/dialogs/tempo.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (T001).
2. Complete Phase 3 (T002-T004) — Key Signature fully converted.
3. **STOP and VALIDATE**: open the Key Signature dialog from each of its three entry points, confirm it matches `spec.md` User Story 1's acceptance scenarios.

### Incremental Delivery

1. Setup → shared pattern confirmed (no foundational plumbing needed for this feature).
2. Add US1 (Key Signature) → validate → this is the MVP.
3. Add US2 (Tempo) → validate, including mode-dependent Custom Text visibility and the four entry points.
4. Phase 5: full regression pass confirms all four Success Criteria.

### Practical Note

US1 and US2 do not share a call-site file the way six of `004-vue-modifier-dialogs`' seven stories shared `factory.ts`, so there is no need to serialize the two stories to avoid merge conflicts — they can be implemented and committed in either order, or concurrently.
