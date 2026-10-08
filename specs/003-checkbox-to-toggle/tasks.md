---

description: "Task list for Dialog Checkbox-to-Toggle Migration"
---

# Tasks: Dialog Checkbox-to-Toggle Migration

**Input**: Design documents from `/specs/003-checkbox-to-toggle/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [data-model.md](./data-model.md) (per-instance inventory), [research.md](./research.md) (layout-shape decisions), [quickstart.md](./quickstart.md) (manual validation)

**Tests**: Not requested — this repo has no automated UI test harness for these dialogs (`npm test` is a no-op); validation is manual via `quickstart.md`, run in the Polish phase.

**Organization**: Tasks are grouped by user story (from `spec.md`). Every checkbox instance's layout shape (Case 1/2/3) is documented in `data-model.md` — consult it for any detail not repeated here.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, or US3 per `spec.md`
- File paths are relative to the repository root

## Path Conventions

Single front-end project. All work is inside `src/ui/components/dialogs/`.

---

## Phase 1: Setup

**Purpose**: Confirm the shared control's contract before any file is touched.

- [X] T001 Read `src/ui/components/dialogs/toggle.vue` and its reference consumer `src/ui/components/dialogs/measureFormat.vue` to confirm the props every migration task below relies on: `domId: string`, `label: string`, `initialValue: boolean`, `disabled?: boolean`, `changeCb: (value: boolean) => void`. No code changes in this task — `toggle.vue` is not modified by this feature.

---

## Phase 2: Foundational

**Purpose**: Blocking prerequisites shared by all user stories.

None required. `toggle.vue` already exists, is already proven in `measureFormat.vue`, and is not modified by this feature — there is no shared component, schema, or infrastructure to stand up before per-file migration work can start. Proceed directly to Phase 3 once Phase 1 is done.

---

## Phase 3: User Story 1 - Consistent toggle control replaces checkboxes in dialogs (Priority: P1) 🎯 MVP

**Goal**: Every `<input type="checkbox">` in the 11 target dialogs is replaced by `toggle.vue`, preserving the exact bound value, change behavior, and disabled/visibility conditions the checkbox had.

**Independent Test**: Open each of the 11 dialogs; confirm every former checkbox now renders as a toggle switch reflecting the setting's current value, and confirm activating it flips the same underlying setting the checkbox used to (verify the effect persists after closing/reopening the dialog). This does not require label text to have moved yet (that's US2) or column widths to have changed (that's US3).

### Implementation for User Story 1

- [X] T002 [P] [US1] In `src/ui/components/dialogs/addMeasures.vue`, replace the `append-checkbox` `<input type="checkbox">` (bound via `v-model="append"`, no disabled condition) with `<toggle>`, using `:initialValue="append"` and a `changeCb` that sets `append`. Import `toggle` from `./toggle.vue`. Leave the adjacent `col-6` label div ("Append to Selection") and the toggle's own `col-2` column untouched for now (Case 1 — label/width handled in US2/US3).
- [X] T003 [P] [US1] In `src/ui/components/dialogs/fontPicker.vue`, replace both checkboxes with `<toggle>`: `font-weight` (`v-model="isBold"`, label "Bold") and `font-style` (`v-model="isItalic"`, label "Italic"). Both are Case 2 (checkbox + label share one `col-3` div) — set `:label="'Bold'"` / `:label="'Italic'"` directly on each toggle now and delete the now-redundant `<label class="form-check-label">` element in each `col-3` div; column widths (`col-3`) stay unchanged. This single task fully completes US1+US2+US3 scope for this file (no further tasks needed for it).
- [X] T004 [P] [US1] In `src/ui/components/dialogs/guitarTab.vue`, replace the `toggleStems` checkbox (`v-model="showStems"`, `@change="toggleStemsCb"`) with `<toggle>`, `:label="'Show Stems'"`, and a `changeCb` that updates `showStems` then calls `toggleStemsCb`. Case 2 (checkbox + label share the `col-4` div) — delete the sibling `<label class="form-check-label">` in that div; column width (`col-4`) stays unchanged. Fully completes this file (no further tasks needed).
- [X] T005 [P] [US1] In `src/ui/components/dialogs/instrumentProperties.vue`, replace the `usePercussionSymbols` checkbox (`v-model="usePercussionSymbols"`) with `<toggle>`, `:label="'Use Percussion Symbols'"`. Case 2 (checkbox + label share the `col-12` div) — delete the sibling label element; column width (`col-12`) stays unchanged; preserve the row's existing `:class="{ hide: !showPercussionSymbols }"` conditional. Fully completes this file.
- [X] T006 [P] [US1] In `src/ui/components/dialogs/newPart.vue`, replace both checkboxes with `<toggle>`: `usePercussionSymbols` (same pattern/row-hide condition as `instrumentProperties.vue`, `col-12`, label "Use Percussion Symbols") and `addStave` (`v-model="addStave"`, `@change="addStaveCb"`, `col-4`, label "2-Stave part" — `changeCb` must update `addStave` then call `addStaveCb`). Both are Case 2 — delete each sibling label element; column widths (`col-12`, `col-4`) stay unchanged. Fully completes this file.
- [X] T007 [P] [US1] In `src/ui/components/dialogs/partInfo.vue`, replace all 3 checkboxes with `<toggle>`, preserving behavior: `preserveText` (`v-model="partInfo.preserveTextGroups"`, `changeCb` must also call `writeBooleanValue('preserveTextGroups', value)`), `expandMultimeasureRests` (`v-model="partInfo.expandMultimeasureRests"`, `changeCb` must also call `writeBooleanValue('expandMultimeasureRests', value)`), `includeNext` (`v-model="includeNext"`, no extra handler). All 3 are Case 1 (`col-1` + `col-5` label pairs) — leave the 3 label divs and column widths untouched for now (handled in US2/US3).
- [X] T008 [P] [US1] In `src/ui/components/dialogs/scorePreferences.vue`, replace all 7 checkboxes with `<toggle>`, each `v-model="preferences.<prop>"` plus a `changeCb` that updates the property then calls `updateBool('<prop>')`: `autoAdvance`, `autoPlay`, `showPiano`, `transposingScore` (id `transposeScore`), `hideEmptyLines`, `showPartNames` (id `partNames`), `horizontalDisplay`. All 7 are Case 1 (`col-1` + `col-5` label pairs, two pairs per row except the last). Leave the 7 label divs and column widths untouched for now (handled in US2/US3).
- [X] T009 [P] [US1] In `src/ui/components/dialogs/staffGroups.vue`, replace all 3 per-row checkboxes (`addToGroup`/`createGroup`/`endsGroup`, all bound via `v-model="choice.inGroup"` with distinct `@change` handlers `choice.addCb` / `choice.createCb` / `choice.removeCb`) with `<toggle>`. Case 3 (no adjacent label div — meaning comes from column headers above the grid): use an empty `label` (or a short accessible label derived from the header, e.g. `'Group'`/`'Start'`/`'End'`, at implementer's discretion) and preserve the existing `<span :class="{ hide: !choice.addToGroup }">` (etc.) visibility wrapper around each toggle. Column widths (`col-2` each) stay unchanged. Fully completes this file.
- [X] T010 [P] [US1] In `src/ui/components/dialogs/textBlock.vue`, replace the `attach-to-selector` checkbox (currently `:checked="attachToSelector"` + `@change="onAttachToggle(($event.target as HTMLInputElement).checked)"`) with `<toggle>`, `:initialValue="attachToSelector"`, `changeCb="onAttachToggle"`. Case 1, but using the custom `checkbox-input-column-div` / `checkbox-input-label-div` classes (each fixed at 25% width in `src/styles/dialogs.css`) instead of Bootstrap `col-N` — leave the label div and both fixed-width classes untouched for now (handled in US2/US3, which will need a merged ~50%-width class since there's no `col-N` to bump).
- [X] T011 [P] [US1] In `src/ui/components/dialogs/timeSignature.vue`, replace all 3 checkboxes with `<toggle>`: `use-symbol` (`v-model="useSymbol"`, `:disabled="!supportsSymbol"`), `display-ts` (`v-model="display"`), `display-compound` (`v-model="isCompound"`). All 3 use the `checkbox-input-column-div` / `checkbox-input-label-div` pair (Case 1, same fixed-width classes as `textBlock.vue`). Leave label divs and widths untouched for now (handled in US2/US3). Preserve the `:disabled` binding on the `use-symbol` toggle.
- [X] T012 [P] [US1] In `src/ui/components/dialogs/viewStaves.vue`, replace both checkboxes: `horizontalDisplay` (`v-model="preferences.horizontalDisplay"`, Case 1, `col-7` + `col-5` label pair — leave label div/width untouched for now) and the per-stave `group-checkbox` inside the `v-for="(stave, ix) in viewMap"` loop (`v-model="viewMap[ix].show"`, `@change="toggleStave(ix)"`, Case 3 — its `col-6` neighbor is the stave name, a data column, not a label div, so leave it as-is with an empty toggle `label`; `changeCb` must update `viewMap[ix].show` then call `toggleStave(ix)`). Only the `horizontalDisplay` instance in this file needs further work in US2/US3.

**Checkpoint**: All 26 checkbox instances across the 11 dialogs now render as toggles with identical bound behavior. `fontPicker.vue`, `guitarTab.vue`, `instrumentProperties.vue`, `newPart.vue`, and `staffGroups.vue` are fully done. The remaining 6 files (`addMeasures.vue`, `partInfo.vue`, `scorePreferences.vue`, `textBlock.vue`, `timeSignature.vue`, `viewStaves.vue`) still have their original separate label divs and column widths for their Case-1 instances — User Story 1 is independently testable and shippable as-is.

---

## Phase 4: User Story 2 - Adjacent label text moves onto the toggle itself (Priority: P2)

**Goal**: For every Case-1 checkbox (separate label column), move its label div's text onto the toggle's `label` prop and delete the now-redundant label div.

**Independent Test**: In each of the 6 files below, confirm the label text that used to sit in its own column now appears as the toggle's own label, and confirm the separate label div no longer exists in the markup.

### Implementation for User Story 2

- [X] T013 [P] [US2] In `src/ui/components/dialogs/addMeasures.vue` (depends on T002), set the toggle's `:label="'Append to Selection'"` and delete the sibling `col-6` label div.
- [X] T014 [P] [US2] In `src/ui/components/dialogs/partInfo.vue` (depends on T007), set each toggle's label (`'Preserve Text Groups'`, `'Expand Multimeasure Rests'`, `'Include Next Stave'`) and delete all 3 sibling `col-5` label divs.
- [X] T015 [P] [US2] In `src/ui/components/dialogs/scorePreferences.vue` (depends on T008), set each of the 7 toggles' labels (`'Auto-advance on pitch change'`, `'Auto-play sounds for pitch change'`, `'Show piano widget'`, `'Transposing score'`, `'Hide empty staves'`, `'Show part names in Score'`, `'Horizontal Display'`) and delete all 7 sibling `col-5` label divs.
- [X] T016 [P] [US2] In `src/ui/components/dialogs/textBlock.vue` (depends on T010), set the toggle's `:label="'Attach to Selection'"` and delete the sibling `checkbox-input-label-div`.
- [X] T017 [P] [US2] In `src/ui/components/dialogs/timeSignature.vue` (depends on T011), set each of the 3 toggles' labels (`'Use Symbol'`, `'Display Time Signature'`, `'Compound Time Signature'`) and delete all 3 sibling `checkbox-input-label-div` elements.
- [X] T018 [P] [US2] In `src/ui/components/dialogs/viewStaves.vue` (depends on T012), set the `horizontalDisplay` toggle's `:label="'Horizontal Display'"` and delete its sibling `col-5` label div. (The per-stave `group-checkbox` toggle is Case 3 and out of scope for this story — already complete from US1.)

**Checkpoint**: All label text that used to live in a separate column is now on the toggle itself; no orphaned label divs remain anywhere in the 11 dialogs. Column widths are still pre-migration at this point (the freed space from deleted label divs is temporarily unused) — that's US3.

---

## Phase 5: Layout width preserved after removing the label column (Priority: P3)

**Goal**: For every row touched in US2, widen the toggle's column to the combined width of the original checkbox column and the now-removed label column, so total row width and alignment are unchanged.

**Independent Test**: In each of the 6 files below, confirm the toggle's column now spans the combined width the two original columns occupied, and that the row's overall width/alignment still lines up with sibling rows in the same dialog.

### Implementation for User Story 3

- [X] T019 [P] [US3] In `src/ui/components/dialogs/addMeasures.vue` (depends on T013), change the toggle's wrapping column from `col col-2 pe-0 me-n2` to `col col-8` (keep `pe-0`/`me-n2` only if still needed for alignment after visual check).
- [X] T020 [P] [US3] In `src/ui/components/dialogs/partInfo.vue` (depends on T014), change all 3 toggles' wrapping columns from `col col-1` to `col col-6`.
- [X] T021 [P] [US3] In `src/ui/components/dialogs/scorePreferences.vue` (depends on T015), change all 7 toggles' wrapping columns from `col col-1` to `col col-6`.
- [X] T022 [P] [US3] In `src/ui/components/dialogs/textBlock.vue` (depends on T016), replace the toggle's `checkbox-input-column-div` wrapper with a merged ~50%-width class (add a new modifier class alongside `checkbox-input-column-div`/`checkbox-input-label-div` in `src/styles/dialogs.css`, e.g. `.checkbox-input-toggle-div { width: 50%; }`, since these use fixed-percentage flex classes rather than the `col-N` grid).
- [X] T023 [P] [US3] In `src/ui/components/dialogs/timeSignature.vue` (depends on T017), apply the same merged ~50%-width class introduced in T022 to all 3 toggles' wrapping divs (reuse the class added in `src/styles/dialogs.css`; do not duplicate it).
- [X] T024 [P] [US3] In `src/ui/components/dialogs/viewStaves.vue` (depends on T018), change the `horizontalDisplay` toggle's wrapping column from `col col-7` to `col col-12`.

**Checkpoint**: All 11 dialogs are fully migrated — every checkbox is a toggle, every relocatable label is on the toggle, and every merged column spans its combined pre-migration width. All three user stories are complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across all 11 dialogs, tying back to `spec.md` Success Criteria.

- [X] T025 [P] Run `grep -rn "type=\"checkbox\"" src/ui/components/dialogs` and confirm the only match is inside `toggle.vue` itself (SC-001).
- [X] T026 Run the full manual validation pass in [quickstart.md](./quickstart.md) against all 11 dialogs: toggle behavior/value parity (SC-002), label placement with no orphaned label elements (SC-003), and unchanged row width/alignment (SC-004).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Empty — no blocking work.
- **User Story 1 (Phase 3)**: Depends on Phase 1. All 11 tasks (T002–T012) are independent of each other — full `[P]` parallelism across files.
- **User Story 2 (Phase 4)**: Each task depends only on its own file's Phase 3 task (T013→T002, T014→T007, T015→T008, T016→T010, T017→T011, T018→T012). Tasks are parallel across files.
- **User Story 3 (Phase 5)**: Each task depends only on its own file's Phase 4 task (T019→T013, T020→T014, T021→T015, T022→T016, T023→T017, T024→T018). Tasks are parallel across files, except T023 should follow T022 if both are done by the same person (both touch the new shared CSS class added in T022 — different files, but the same new class name, so confirm T022 lands first to avoid defining it twice).
- **Polish (Phase 6)**: Depends on all of Phase 3–5 being complete.

### Parallel Execution Example (User Story 1)

```bash
# All 11 files are independent — launch together:
Task: "Replace checkbox with toggle in src/ui/components/dialogs/addMeasures.vue"
Task: "Replace checkboxes with toggles in src/ui/components/dialogs/fontPicker.vue"
Task: "Replace checkbox with toggle in src/ui/components/dialogs/guitarTab.vue"
Task: "Replace checkbox with toggle in src/ui/components/dialogs/instrumentProperties.vue"
Task: "Replace checkboxes with toggles in src/ui/components/dialogs/newPart.vue"
Task: "Replace checkboxes with toggles in src/ui/components/dialogs/partInfo.vue"
Task: "Replace checkboxes with toggles in src/ui/components/dialogs/scorePreferences.vue"
Task: "Replace checkboxes with toggles in src/ui/components/dialogs/staffGroups.vue"
Task: "Replace checkbox with toggle in src/ui/components/dialogs/textBlock.vue"
Task: "Replace checkboxes with toggles in src/ui/components/dialogs/timeSignature.vue"
Task: "Replace checkboxes with toggles in src/ui/components/dialogs/viewStaves.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (T001).
2. Complete Phase 3 (T002–T012) — every dialog now uses toggles; 5 of 11 files (`fontPicker`, `guitarTab`, `instrumentProperties`, `newPart`, `staffGroups`) are already fully done at this point since their labels have no separate column to relocate.
3. **STOP and VALIDATE**: spot-check a few dialogs against `quickstart.md` — toggles should work identically to the old checkboxes, even though the 6 Case-1 files still show a redundant separate label div next to an unlabeled toggle.

### Incremental Delivery

1. Phase 1 → Phase 3 (US1): all checkboxes become toggles (MVP, functionally complete, cosmetically rough on 6 files).
2. Phase 4 (US2): those 6 files' labels move onto their toggles; no more orphaned label markup, but rows are narrower than before (dead space where the label column was).
3. Phase 5 (US3): those same 6 files' toggle columns widen to fill the freed space — rows match their original width exactly.
4. Phase 6: full regression pass confirms all four Success Criteria.

### Practical Note

In practice, a single-checkbox file's US1/US2/US3 work (e.g. `addMeasures.vue`) is a handful of adjacent lines — it is reasonable to implement a file's T0xx/T0yy/T0zz trio back-to-back in one sitting rather than literally shipping the intermediate "toggle with no label" or "toggle with dead space" states. The phase split above exists so each story remains independently *testable*, per `spec.md`; it does not require separate commits or PRs per phase.
