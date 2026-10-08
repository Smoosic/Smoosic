---

description: "Task list for converting note-attached text groups to annotations"
---

# Tasks: Convert Note-Attached Text Groups to Annotations

**Input**: Design documents from `/specs/019-attached-text-to-annotation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/conversion-contract.md, quickstart.md

**Tests**: Included. plan.md commits to a headless `ts-node` assertion script (Constitution Principle #1: legacy-score deserialization) covering contract cases C1-C18. The dialog change is verified manually (quickstart.md §4).

**Organization**: Tasks are grouped by user story. US1 (score text) and US2 (part text) share one helper built in Phase 2; US3 (dialog) touches a different file and is independent.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

Single project: `src/`, `tests/` at repository root. Files touched: `src/smo/data/score.ts`, `src/ui/components/dialogs/textBlock.vue`, `tests/attachedTextMigration.ts` (new), `package.json`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: A way to run the conversion tests headlessly

- [X] T001 Add a `"test:attached-text"` script to `package.json` that runs `ts-node -P tests/tsconfig.json tests/attachedTextMigration.ts`. *(Deviation: instead of passing the CommonJS module override on the command line, which needs awkward JSON quoting in `npm run` on Windows, a small `tests/tsconfig.json` extends the root config with `module: commonjs` and `ts-node.transpileOnly`. Type-checking of the test file is done with `npx tsc --noEmit -p tests/tsconfig.json`.)* Leave the existing `"test": "exit 0"` entry alone.
- [X] T002 Create `tests/attachedTextMigration.ts` with the scaffolding only (it also has to call the four `*DynamicCtorInit()` functions, otherwise `addStaff`/`deserialize` throw, and serialize with `useDictionary: false`): import `SmoScore`, `SmoTextGroup`, `SmoScoreText`, `SmoLyric` from `../src/smo/data/*`; a tiny `check(name, condition)` runner that prints `PASS`/`FAIL <name>` and sets `process.exitCode = 1` on any failure; and builders: (a) `makeBaseScore()` returning a serialized score object with 2 staves and at least 3 measures per staff (create with `SmoScore.getEmptyScore(SmoScore.defaults)` and the score API, then `JSON.parse(JSON.stringify(score.serialize()))`), (b) `attachedGroup(selector, blocks[{text, fontInfo?}])` returning the serialized form of a `SmoTextGroup` with `attachToSelector: true` and the given `selector` (`{staff, measure, voice, tick, pitches: []}`), (c) `plainGroup(text)` for an unattached title-style group, (d) `load(obj)` that runs `SmoScore.deserialize(JSON.stringify(obj))`. No cases yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared conversion helper both stories call. It is not wired into `deserialize` yet, so nothing user-visible changes until US1/US2.

**CRITICAL**: US1 and US2 both depend on this task.

- [X] T003 In `src/smo/data/score.ts`, add `SmoLyric` to the import from `./noteModifiers` (line 10) and add a static method on `SmoScore`, `static attachedTextToAnnotations(staves: SmoSystemStaff[], textGroups: SmoTextGroup[], ownerStaffIndex?: number): SmoTextGroup[]`, returning the groups that remain. Follow data-model.md "Conversion rules" exactly:
  1. If `staves.length === 0`, return `textGroups` unchanged (research.md §5, the `skipStaves` path).
  2. Iterate `textGroups` in order. A group with `attachToSelector` falsy, or no `selector`, is kept in the returned list untouched.
  3. For an attached group, resolve the note as `staves[staffIdx].measures[selector.measure].voices[selector.voice].notes[selector.tick]` where `staffIdx = ownerStaffIndex ?? selector.staff`; tolerate any missing level (no note, no throw).
  4. If a note is found, for each block in `textBlocks` in order: skip if `block.text.text.trim()` is empty; skip if `note.getAnnotations()` already has an annotation whose `text` equals the block text (research.md §4); stop for this note when it already has 4 annotations; otherwise pick the lowest unused `verse` (0-3) among `note.getAnnotations()` and call `note.addAnnotation(new SmoLyric({ ...SmoLyric.defaults, parser: SmoLyric.parsers.annotation, text, verse, fontInfo: { ...block.text.fontInfo } }))`.
  5. Whether or not the note was found, the attached group is not included in the returned list.
  Add a doc comment stating the two call shapes (score list: no owner index; part list: owner staff index) and pointing at `specs/019-attached-text-to-annotation`.

**Checkpoint**: Helper compiles (`npx tsc --noEmit -p tsconfig.json` shows no new errors in `score.ts`); no behavior change yet.

---

## Phase 3: User Story 1 - Existing scores keep their note-attached text as annotations (Priority: P1) MVP

**Goal**: Opening a legacy score turns score-level attached text into annotations and removes the attached groups.

**Independent Test**: `npm run test:attached-text` passes the score-list cases; opening a legacy score in the app shows the text as annotations (quickstart.md §3 steps 1-4, 6).

### Tests for User Story 1

> Write these first and confirm they FAIL before T006.

- [X] T004 [US1] In `tests/attachedTextMigration.ts`, add cases for contract C1 (single block becomes annotation "Fine", verse 0, annotation parser, group gone), C2 (3 blocks give verses 0/1/2 in order), C3 (whitespace block skipped), C4 (measure out of range: no annotation, group removed, no throw), C5 (staff/voice/tick out of range: same), C6 (unattached title kept with same content, attached group gone), C10 (two attached groups, same note, different text: both present in list order), C11 (note already has 4 annotations: no addition, group removed), C12 (note already has verses 0 and 1, group of 2 blocks lands on verses 2 and 3), C17 (block font family/size/weight/style copied). For C11/C12 seed the existing annotations by putting `SmoLyric` annotations (`SmoLyric.parsers.annotation`, verses 0-3) into the base score's note `textModifiers` (serialized via `note.serialize()` of the score built in `makeBaseScore`).
- [X] T005 [US1] In `tests/attachedTextMigration.ts`, add cases for contract C13 (a score with no attached groups: deserialize then serialize yields the same `textGroups` and the same per-note `textModifiers` as the input), C14 (deserialize, serialize, deserialize again: same annotation count on every note, no attached group in `score.textGroups`), and C16 (JSON with `staves: []` plus an attached group: `score.textGroups` still has the group, no throw).

### Implementation for User Story 1

- [X] T006 [US1] In `SmoScore.deserialize` in `src/smo/data/score.ts`, immediately after the `textGroups` loop that ends near line 744, replace the direct use of the loop result with `const remaining = SmoScore.attachedTextToAnnotations(staves, textGroups);` and assign `score.textGroups = remaining` (line ~775) instead of the raw list. Keep `isEmptyTextBlock` filtering as is. Do not change `fixTextGroupSinglePart`.
- [X] T007 [US1] Run `npm run test:attached-text`. Fix any failures in T003/T006 until every US1 case (C1-C6, C10-C14, C16, C17) prints PASS. Do not weaken a case to make it pass; if the contract is wrong, fix `contracts/conversion-contract.md` and say why in the commit.

**Checkpoint**: Legacy scores with score-level attached text open with annotations and no attached groups. MVP complete.

---

## Phase 4: User Story 2 - Part-level attached text is converted the same way (Priority: P2)

**Goal**: Attached text stored in each staff's part info is converted too, without doubling annotations that the score list already produced.

**Independent Test**: The part-list cases pass; opening a legacy score whose part preserved text shows exactly one annotation on the note (quickstart.md §3 step 5).

### Tests for User Story 2

> Write these first and confirm they FAIL before T009.

- [X] T008 [US2] In `tests/attachedTextMigration.ts`, add cases for contract C7 (attached group only in `staves[1].partInfo.textGroups` with recorded staff 0, target measure/voice/tick on staff 1: annotation lands on staff 1's note; that part list has no attached group), C8 (same text attached in `score.textGroups` with staff 1 and as a copy in staff 1's part list: exactly 1 annotation on the note), C9 (part list with one attached and one unattached group: only the attached one converted/removed, the unattached one kept), and C15 (single-staff score whose score list is a copy of its part list, per `SmoScore.fixTextGroupSinglePart`: exactly 1 annotation). Build part-list JSON by writing into `obj.staves[i].partInfo.textGroups` (create `partInfo` via `SmoPartInfo.defaults` serialize form if the base score's staff lacks one).

### Implementation for User Story 2

- [X] T009 [US2] In `SmoScore.deserialize` in `src/smo/data/score.ts`, after the score-list call from T006 and before `new SmoScore(params)`, add: `staves.forEach((staff, ix) => { staff.partInfo.textGroups = SmoScore.attachedTextToAnnotations(staves, staff.partInfo.textGroups, ix); });`. It must run after the score-list call so the identical-text check (research.md §4) sees the score's annotations first.
- [X] T010 [US2] Run `npm run test:attached-text`. Every case (C1-C17) must print PASS and the process must exit 0.

**Checkpoint**: No attached text groups remain in the score list or any part list after load; part copies do not duplicate annotations.

---

## Phase 5: User Story 3 - The text block dialog no longer offers "Attach to Selection" (Priority: P3)

**Goal**: Users can't create new note-attached text groups from the dialog.

**Independent Test**: Open the text block dialog in non-editing view; there is no "Attach to Selection" toggle and every other control still works (quickstart.md §4).

### Implementation for User Story 3

- [X] T011 [P] [US3] In `src/ui/components/dialogs/textBlock.vue`, remove the "Attach to Selection" feature: delete the `import toggle from './toggle.vue'` line; delete the `attachToSelector` ref (line ~39) and its assignment inside `refreshFromModel`; delete `resetAttachToSelectorModel`, `activateAttachToSelectorModel` and `onAttachToggle`; in `onPaginationSelect` drop the `if (attachToSelector.value) { ... }` reset so it only sets `pagination.value`, `props.modifier.value.pagination` and awaits `rerender()`; delete the `<div class="row mb-2 ms-2 align-items-center"> ... <toggle :domId="getId('attach-to-selector')" .../> ... </div>` block in the template; retitle the section comment `// --- Page behavior & attach-to-selection (User Story 4) ---` to `// --- Page behavior ---` and fix the now-stale comment above `onPaginationSelect` about the two controls being mutually exclusive. Leave the `SmoTextGroup` model fields and every other file alone.
- [X] T012 [US3] Confirm `textBlock.vue` no longer mentions attaching: run `git grep -n -i "attachToSelector\|attach-to-selector\|Attach to Selection\|toggle" -- src/ui/components/dialogs/textBlock.vue` and expect no output; also check no import in the file became unused (`SmoTextGroup` is still used for `paginations`).

**Checkpoint**: The dialog builds and shows no attach control; all three stories are done.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T013 Run `npm run build` and confirm it completes with no TypeScript or vue-loader errors.
- [X] T014 Run `git grep -n "attachToSelector = true\|attachToSelector: true" -- src` and confirm nothing under `src/ui` or `src/render` can still set a text group as attached (only the legacy deserialization/model definitions and `score.ts`/`scoreText.ts` model code should mention the property). Report anything unexpected rather than deleting it.
- [X] T016 Carry the text group's offset onto each annotation: in `SmoScore.attachedTextToAnnotations` (`src/smo/data/score.ts`) set `translateX` to `musicXOffset` and `translateY` to the negated `musicYOffset` (directions differ, research.md §2), with cases C18/C18b in `tests/attachedTextMigration.ts` written first and seen to fail. *(Added after the original task list, from a request to keep the offsets.)*
- [X] T017 Move the duplicate check to the group level (requested change, replaces the per-block identical-text skip in T003 step 4): in `SmoScore.attachedTextToAnnotations` (`src/smo/data/score.ts`), when `ownerStaffIndex` is a number (a part's list) and the note already has any annotation, return without converting the group; keep only the empty-text and four-annotation checks per block. Cases C8b and C12c added to `tests/attachedTextMigration.ts` first and seen to fail. Research.md §4, data-model.md, spec FR-010a and the contract are updated to match.
- [ ] T015 Run the manual checks in `specs/019-attached-text-to-annotation/quickstart.md` §3-§5 against a legacy score (or state that they could not be run in this environment; do not claim they passed).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none. T002 depends on T001 only for the run command, not for its content.
- **Foundational (Phase 2)**: T003 depends on nothing in Phase 1 but must finish before T006 and T009.
- **US1 (Phase 3)** and **US2 (Phase 4)**: both depend on Phase 2. US2's T009 edits the same `deserialize` function as T006, so do US2 after US1's T006 (and its identical-text check relies on the score-list call running first).
- **US3 (Phase 5)**: independent of every other phase (different file).
- **Polish (Phase 6)**: after all desired stories.

### Within Each Story

- Tests before wiring (T004/T005 before T006; T008 before T009), and see them fail first.
- All test tasks edit `tests/attachedTextMigration.ts`, so they are sequential with each other; T006 and T009 both edit `score.ts`, so they are sequential too.

### Parallel Opportunities

- T011 (US3, `textBlock.vue`) can run at the same time as any of T003-T010.
- T001 and T003 touch different files and can run together.

---

## Parallel Example

```bash
# Different files, no shared dependencies:
Task: "T003 Add SmoScore.attachedTextToAnnotations in src/smo/data/score.ts"
Task: "T011 Remove Attach to Selection from src/ui/components/dialogs/textBlock.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001-T002 (test scaffold), T003 (helper).
2. T004-T007 (US1): tests, wire the score list, all US1 cases pass.
3. **Stop and validate**: open a legacy score with score-level attached text; annotations appear, no attached groups remain.

### Incremental Delivery

1. Setup + Foundational: helper exists, nothing user-visible.
2. US1: score-level text migrates (MVP).
3. US2: part-level text migrates without duplicates.
4. US3: dialog no longer creates attached text.
5. Polish: build, sweep for stragglers, manual walk-through.

Ordering note: ship US3 no earlier than US1/US2, otherwise the dialog stops producing attached text while existing attached text still isn't converted.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks.
- Don't remove `attachToSelector`/`selector` from `SmoTextGroup`, the serialization dictionary in `src/common/serializationHelpers.js`, or the i18n tables; legacy scores need them (research.md §7).
- Don't touch the attached-text branches in `scoreRender.ts`, `scoreView.ts`, `score.ts` (`addMeasure`/`deleteMeasure`/`updateTextGroup`) or `scoreText.ts`; that cleanup is a follow-up.
- Commit after each task or logical group.
