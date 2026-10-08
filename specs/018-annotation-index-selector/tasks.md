---

description: "Task list template for feature implementation"
---

# Tasks: Multiple Annotations Per Note

**Input**: Design documents from `/specs/018-annotation-index-selector/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/component-interfaces.md](./contracts/component-interfaces.md), [quickstart.md](./quickstart.md)

**Tests**: This project has no wired automated test runner (`npm test` is a no-op placeholder) and the feature spec does not request TDD. No automated test tasks are generated; each story ends with a manual validation task against `quickstart.md`.

**Organization**: Tasks are grouped by user story (from spec.md, priorities P1-P3) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US3)
- Every task includes an exact file path

## Path Conventions

Single front-end project. This feature touches exactly two existing files from `017-text-annotations`: `src/ui/dialogs/annotationVue.ts` and `src/ui/components/dialogs/annotation.vue`. No other file changes — `src/ui/menus/text.ts`, `src/render/sui/scoreViewOperations.ts`, `src/render/vex/vxNote.ts`, `src/render/vex/vxSystem.ts`, and `src/smo/data/noteModifiers.ts`/`note.ts` are already sufficient (research.md §1, §4).

**Note on execution (as implemented)**: `annotation.vue` was rewritten in full rather than edited task-by-task, since the whole component is small; every task's described behavior was implemented, but numbering reflects the design decomposition, not literal edit order.

---

## Phase 1: Setup

No setup tasks — this feature adds no new files, dependencies, or build configuration.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Rework `annotationVue.ts`/`annotation.vue` from a single-annotation working copy to a list-aware one, with no user-visible behavior change yet (a note with exactly one annotation must continue to work exactly as it did after `017`). Every user story in this feature builds on this list-aware state.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 In `src/ui/dialogs/annotationVue.ts`, replace the single `const annotation = parameters.modifier as SmoLyric;` with: `const firstNote = selections[0]?.note; const annotations: SmoLyric[] = firstNote ? (firstNote.getAnnotations() as SmoLyric[]) : [parameters.modifier as SmoLyric];` and `const initialIndex = Math.max(0, annotations.findIndex((a) => a.verse === (parameters.modifier as SmoLyric).verse));` — per [contracts/component-interfaces.md](./contracts/component-interfaces.md) §1
- [X] T002 In `src/ui/dialogs/annotationVue.ts`, update `startInEditingMode` to `annotations[initialIndex].getText().length === 0` and replace the `annotation` field in `appParams` with `annotations`/`initialIndex` (depends on T001)
- [X] T003 In `src/ui/components/dialogs/annotation.vue`, replace the `annotation: SmoLyric` prop with `annotations: SmoLyric[]` and add `initialIndex: number` to the `Props` interface — per [data-model.md](./data-model.md) "New Props Shape"
- [X] T004 In `src/ui/components/dialogs/annotation.vue`, add `annotationList: Ref<SmoLyric[]>` (initialized from `props.annotations`) and `currentIndex: Ref<number>` (initialized from `props.initialIndex`), plus `const currentAnnotation = computed(() => annotationList.value[currentIndex.value]);` (depends on T003)
- [X] T005 In `src/ui/components/dialogs/annotation.vue`, add `const loadCurrent = () => { ... }` that (re)populates `originalText`, `annotationText`, `translateX`, `translateY`, `verticalJustify`, `fontInfo` from `currentAnnotation.value`, replacing the old one-time top-level field initialization that read from `props.annotation`; call it once at setup in place of that old initialization (depends on T004)
- [X] T006 In `src/ui/components/dialogs/annotation.vue`, add `const loadAnnotationList = () => { const note = props.selections[0]?.note; annotationList.value = note ? (note.getAnnotations() as SmoLyric[]) : []; };` per [research.md](./research.md) §5 (depends on T004) — not yet called anywhere except at setup (T007)
- [X] T007 In `src/ui/components/dialogs/annotation.vue`, replace every remaining reference to `props.annotation` with `currentAnnotation.value` in `syncModifiers`, `commitIfChanged`'s non-empty branch, `onXChange`, `onYChange`, `onJustifyChange`, and `onFontChange` (depends on T004-T006)
- [ ] T008 Manually validate against [quickstart.md](./quickstart.md) prerequisite behavior — **not run**: no browser/UI automation tool was available in this session. `npx tsc --noEmit` and `npm run build` both pass cleanly. Recommend running this manually before shipping.

**Checkpoint**: The dialog is list-aware internally but exposes no new controls yet; single-annotation behavior is unchanged from `017`.

---

## Phase 3: User Story 1 - Attach a second, third, or fourth annotation to a note (Priority: P1) 🎯 MVP

**Goal**: A "+" control in the dialog's non-editing view, visible below 4 annotations, that creates a new empty annotation and opens a text-editing session for it.

**Independent Test**: On a note with one annotation, reopen its dialog, click "+", type text for the new annotation, end editing, and confirm the score shows both annotations independently; repeat until 4 exist and confirm "+" then disappears.

### Implementation for User Story 1

- [X] T009 [US1] In `src/ui/components/dialogs/annotation.vue`, add `const canAddMore = computed(() => annotationList.value.length < 4);` — per [data-model.md](./data-model.md)
- [X] T010 [US1] In `src/ui/components/dialogs/annotation.vue`, implement `addAnnotation()`: guard on `canAddMore.value`; build `const fresh = new SmoLyric({ ...SmoLyric.defaults, parser: SmoLyric.parsers.annotation, text: '' }); fresh.verse = annotationList.value.length;`; loop `props.selections` calling `await props.view.addOrUpdateAnnotation(sel.selector, fresh)` for each `sel.note`; call `loadAnnotationList()` (T006), set `currentIndex.value` to `fresh`'s position in the reloaded list, call `loadCurrent()` (T005), set `mode.value = 'editing'` — per [data-model.md](./data-model.md) Operations
- [X] T011 [US1] In `src/ui/components/dialogs/annotation.vue`'s `mode === 'dialog'` template section, add a "+" button (`v-if="canAddMore"`) wired to `addAnnotation` (T010)
- [ ] T012 [US1] Manually validate against [quickstart.md](./quickstart.md) §1 — **not run**, same reason as T008

**Checkpoint**: User Story 1 is fully functional and independently testable — this is the MVP.

---

## Phase 4: User Story 2 - Switch between a note's existing annotations (Priority: P2)

**Goal**: An index dropdown in the dialog's non-editing view, visible at 2+ annotations, that lets the user pick which one is currently shown.

**Independent Test**: On a note with two or more annotations, confirm the dropdown is shown, pick a different index, and confirm the dialog updates to that annotation's own settings.

### Implementation for User Story 2

- [X] T013 [P] [US2] In `src/ui/components/dialogs/annotation.vue`, add `const showIndexSelector = computed(() => annotationList.value.length >= 2);` and `const indexOptions = computed(() => annotationList.value.map((a, i) => ({ value: i.toString(), label: (i + 1).toString() })));` — per [data-model.md](./data-model.md)
- [X] T014 [US2] In `src/ui/components/dialogs/annotation.vue`, implement `const onIndexChange = (value: string) => { currentIndex.value = parseInt(value, 10); loadCurrent(); };` (depends on T005, T013)
- [X] T015 [US2] In `src/ui/components/dialogs/annotation.vue`'s `mode === 'dialog'` template section, add an index `selectComp` (`v-if="showIndexSelector"`, `:key="annotationList.length"` per [research.md](./research.md) §7 so it remounts when the count changes) bound to `indexOptions`/`currentIndex`/`onIndexChange` (depends on T013, T014)
- [ ] T016 [US2] Manually validate against [quickstart.md](./quickstart.md) §2 — **not run**, same reason as T008

**Checkpoint**: User Stories 1 and 2 are both independently functional.

---

## Phase 5: User Story 3 - Remove one annotation and keep the remaining ones' indices contiguous (Priority: P3)

**Goal**: Removing an annotation (via the existing "Delete Annotation" button, or by leaving text empty at "Done Editing") shifts every higher-indexed annotation on the same note(s) down by one, closing the gap.

**Independent Test**: On a note with three annotations, remove the middle one, and confirm exactly two remain with contiguous indices (the former third becomes the second).

### Implementation for User Story 3

- [X] T017 [US3] In `src/ui/components/dialogs/annotation.vue`, implement `removeAndRenumber(verseIndex: number)`: for each `sel` of `props.selections` with `sel.note` — find and `await props.view.removeAnnotation(sel.selector, toRemove)` the annotation at `verseIndex` (if present), then for every remaining annotation with `verse > verseIndex` (ascending order, per [research.md](./research.md) §6) decrement `.verse` and `await props.view.addOrUpdateAnnotation(sel.selector, a)`; then call `loadAnnotationList()` (T006), set `currentIndex.value = Math.max(0, Math.min(verseIndex, annotationList.value.length - 1))`, call `loadCurrent()` if `annotationList.value.length > 0`, and set `mode.value = 'dialog'` — per [data-model.md](./data-model.md) Operations
- [X] T018 [US3] In `src/ui/components/dialogs/annotation.vue`, replace `deleteCurrent`'s body with `await removeAndRenumber(currentAnnotation.value.verse);` (depends on T017)
- [X] T019 [US3] In `src/ui/components/dialogs/annotation.vue`, replace `commitIfChanged`'s empty-text branch (the per-selection `removeAnnotation` loop) with `await removeAndRenumber(currentAnnotation.value.verse); return;` so emptying an annotation's text renumbers exactly like the explicit delete button (depends on T017)
- [ ] T020 [US3] Manually validate against [quickstart.md](./quickstart.md) §3 — **not run**, same reason as T008

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T021 [P] Manually validate against [quickstart.md](./quickstart.md) §4 (multi-note selection) — **not run**, same reason as T008
- [ ] T022 [P] Manually validate against [quickstart.md](./quickstart.md) §5 (save/reload round-trip) — **not run**, same reason as T008
- [X] T023 Run `npm run build` and confirm no new TypeScript errors were introduced — **done**: `npx tsc --noEmit` is clean and `npm run build` (webpack) completes successfully with no new errors/warnings.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: BLOCKS all user stories — the list-aware state (`annotationList`/`currentIndex`/`currentAnnotation`) everything else is built on
- **User Stories (Phase 3-5)**: All depend on Foundational
  - US1 (P1) has no dependency on US2/US3
  - US2 (P2) is independent of US1 in principle, but only becomes observable once US1 can create a second annotation to switch to
  - US3 (P3) is independent of US1/US2 in principle, but only becomes observable once a note has 2+ annotations to remove one from
- **Polish (Phase 6)**: Depends on all three user stories being complete

### Parallel Opportunities

- T013 (US2) can be drafted in parallel with T009-T010 (US1) — different computed properties, same file, low collision risk if merged carefully
- T021-T022 (Polish) can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (CRITICAL)
2. Complete Phase 3: User Story 1
3. **STOP and VALIDATE**: Confirm a note can carry up to 4 independently-editable annotations via "+" alone (even without a dropdown, the most-recently-added one is always shown after creation)
4. Deploy/demo if ready

### Incremental Delivery

1. Foundational → list-aware state, no visible change
2. Add User Story 1 → "+" control → Test independently (MVP!)
3. Add User Story 2 → index dropdown → Test independently
4. Add User Story 3 → remove-and-renumber → Test independently
5. Polish → multi-selection and save/reload validation

## Outstanding Work

All code tasks (T001-T007, T009-T011, T013-T015, T017-T019, T023) are complete; `npx tsc --noEmit` and `npm run build` both pass cleanly. The five manual browser-validation tasks (T008, T012, T016, T020, T021, T022) have **not** been run in this session — no browser/UI automation tool was available. Before considering this feature shippable, run the dev server (`npm run server`) and manually walk through [quickstart.md](./quickstart.md) end to end, ideally alongside `017-text-annotations`'s own quickstart to confirm no regression to the single-annotation case.
