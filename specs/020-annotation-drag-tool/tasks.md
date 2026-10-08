---

description: "Task list template for feature implementation"
---

# Tasks: Annotation Drag Tool

**Input**: Design documents from `/specs/020-annotation-drag-tool/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/component-interfaces.md, quickstart.md

**Tests**: Not requested — this repo has no automated test runner wired up (`npm test` is a no-op placeholder, per plan.md's Technical Context). Verification tasks below are manual, against `quickstart.md`.

**Organization**: Tasks are grouped by user story (spec.md) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single front-end project (per plan.md's Structure Decision) — all paths are under `src/`, no `backend/`/`frontend/` split.

---

## Phase 1: Setup

**Purpose**: Confirm a clean baseline before making changes

- [X] T001 Run `npm run build` to confirm the repo builds cleanly on the current branch before this feature's changes, so any later build failure can be attributed to this feature

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The drag-session class and its Vue wrapper are shared infrastructure every user story depends on — no user story is independently testable until this phase is complete.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Add the `SuiAnnotationDragSessionParams` interface and the `SuiAnnotationDragSession` class skeleton (fields: `annotation: SmoLyric`, `pageMap: SvgPageMap`, `page: SvgPage`, `scroller: SuiScroller`, `debug: layoutDebug`, `dragging: boolean`, `originBox: SvgBox`, `outlineRect: OutlineInfo | null`; constructor resolves `page` via `pageMap.getRendererFromModifier(annotation)`, matching `SuiDragSession`'s constructor shape) in `src/render/sui/textEdit.ts`, alongside the existing `SuiDragSession` class (contracts/component-interfaces.md §1)
- [X] T003 Implement `SuiAnnotationDragSession.startDrag(e: MouseEvent)`: convert `e`'s client coordinates via the page's `clientToSvg`/`scroller` (same conversion `SuiDragSession.startDrag` performs), hit-test the point against `annotation.logicalBox` via `SvgHelpers.doesBox1ContainBox2`, and only if contained set `dragging = true`, capture `originBox`, and draw the initial outline via `SvgHelpers.outlineRect` using `SuiTextStrokes['text-drag']` in `src/render/sui/textEdit.ts` (depends on T002)
- [X] T004 Implement `SuiAnnotationDragSession.mouseMove(e: MouseEvent)`: no-op if not dragging; otherwise compute the delta from `originBox`, clamp it so the shifted box stays within `page.box` (mirroring `SuiDragSession.checkBounds`), write `transform="translate(<x> <y>)"` directly onto the annotation's existing rendered DOM element (`page.svg.getElementById('vf-' + annotation.attrs.id)`) using the same sign convention as `VxSystem._updateAnnotationOffsets` (`translate(translateX, -translateY)`), and update the outline in `src/render/sui/textEdit.ts` (depends on T003)
- [X] T005 Implement `SuiAnnotationDragSession.endDrag()` (no-op if not dragging; otherwise compute the final clamped delta, set `annotation.translateX`/`annotation.translateY` to the resulting values, erase the outline, set `dragging = false` — does not call any score-operation method) and `unrender()` (erase any outstanding outline; call `endDrag()` first if still dragging) in `src/render/sui/textEdit.ts` (depends on T004)
- [X] T006 Create `annotationDragger.vue` (props: `domId`, `altLabel`, `annotation: SmoLyric`, `pageMap: SvgPageMap`, `scroller: SuiScroller`, `debug: layoutDebug`; emits `stop`; exposes `start()`/`stop()`), modeled 1:1 on `textDragger.vue`'s window `mousedown`/`mousemove`/`mouseup` binding and button template, wired to `SuiAnnotationDragSession` in `src/ui/components/dialogs/annotationDragger.vue` (depends on T005)

**Checkpoint**: `SuiAnnotationDragSession` and `annotationDragger.vue` compile and are ready to be wired into the dialog. No user-visible behavior yet.

---

## Phase 3: User Story 1 - Reposition an annotation by dragging it on the score (Priority: P1) 🎯 MVP

**Goal**: A user can activate a "Move" tool in the annotation dialog, drag the annotation on the score to a new position, and see both the annotation and the dialog's X/Y offset fields reflect the change.

**Independent Test**: Open the annotation dialog for a note with an existing annotation, activate the move tool, drag the annotation to a new on-screen location, release, and confirm the annotation renders at the new location and the X/Y offset fields reflect the change.

### Implementation for User Story 1

- [X] T007 [US1] Extend `annotation.vue`'s `DialogMode` type from `'editing' | 'dialog'` to `'editing' | 'dialog' | 'moving'`, and add a `draggerRef = ref<InstanceType<typeof annotationDraggerComp> | null>(null)` in `src/ui/components/dialogs/annotation.vue`
- [X] T008 [US1] Add a "Move" button to the `'dialog'`-mode template, next to "Edit Text"/"Add Annotation", visible only when `currentAnnotation.value` is defined (FR-009), that sets `mode.value = 'moving'` in `src/ui/components/dialogs/annotation.vue` (depends on T007)
- [X] T009 [US1] Add a `<div v-if="mode === 'moving'">` branch rendering `annotationDraggerComp` (`ref="draggerRef"`, `:domId="getId('dragger')"`, `altLabel="Done Dragging Annotation"`, `:annotation="currentAnnotation"`, `:pageMap="view.renderer.pageMap"`, `:scroller="view.tracker.scroller"`, `:debug="view.debug"`, `@stop="onDragStop"`), and wrap the index selector, edit/add/delete buttons, X/Y offset, vertical-justify, and font controls in the existing `'dialog'`-mode branch so they render only when `mode !== 'moving'` (Edge Case: move tool must be exited before switching annotations) in `src/ui/components/dialogs/annotation.vue` (depends on T008, T006)
- [X] T010 [US1] Implement `onDragStop` (`mode.value = 'dialog'`; `loadCurrent()` to refresh `translateX`/`translateY` refs from the model; `await syncModifiers()` to commit) and a `watch(mode, async (m) => { if (m === 'moving') { await nextTick(); draggerRef.value?.start(); } })`, mirroring `textBlock.vue`'s existing `onDragStop`/`watch(mode, ...)` in `src/ui/components/dialogs/annotation.vue` (depends on T009)
- [ ] T011 [US1] Manually validate Quickstart Scenarios 1 and 2 (drag repositions the annotation and updates the offset fields; pressing outside the annotation does not start a drag) per `specs/020-annotation-drag-tool/quickstart.md`

**Checkpoint**: User Story 1 is fully functional and independently testable — this is the MVP.

---

## Phase 4: User Story 2 - Offset fields and drag stay in sync (Priority: P2)

**Goal**: The move tool's drag origin reflects any offset already set via the numeric X/Y fields, and a completed drag is reflected back in those fields — confirming the two editing paths (numeric and drag) never disagree.

**Independent Test**: Set an annotation's offset via the numeric X/Y fields, activate the move tool, and confirm the drag origin reflects the current offset; then drag to a new position, exit the move tool, and confirm the numeric fields show the resulting offset.

### Implementation for User Story 2

- [ ] T012 [US2] Manually validate Quickstart Scenario 3 (set X/Y offset numerically first, confirm the move tool's drag origin reflects it — not a reset position — then drag and confirm the numeric fields update to match) per `specs/020-annotation-drag-tool/quickstart.md`
- [ ] T013 [US2] If Scenario 3 surfaces a stale-value issue (e.g. `translateX`/`translateY` refs not refreshed before a drag starts), fix by ensuring `loadCurrent()` runs whenever `mode` transitions to `'moving'` in `src/ui/components/dialogs/annotation.vue` (depends on T012; expected to be a no-op given `annotation.logicalBox`, read at drag start, already reflects any previously-committed numeric offset per research.md §1)

**Checkpoint**: User Stories 1 and 2 both work independently; numeric and drag editing paths are confirmed consistent.

---

## Phase 5: User Story 3 - Dragging an annotation on a multi-note selection (Priority: P3)

**Goal**: Completing a drag on an annotation shared by multiple selected notes updates the offset for every one of those notes, matching the dialog's existing multi-selection behavior for its other fields.

**Independent Test**: Select multiple notes that share an annotation, open the annotation dialog, drag the annotation to a new position, exit the move tool, and confirm the new offset is applied consistently to the annotation on every selected note.

### Implementation for User Story 3

- [ ] T014 [US3] Manually validate Quickstart Scenario 4 (drag an annotation shared by a multi-note selection, then reopen the dialog from a different one of the originally selected notes to confirm the offset applied to all of them) per `specs/020-annotation-drag-tool/quickstart.md` — expected to pass without new code, since `onDragStop`'s `syncModifiers()` (T010) already loops every entry in `props.selections`, exactly as `onXChange`/`onYChange` already do (research.md §5)

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify the remaining spec Edge Cases and confirm the build is clean end-to-end

- [ ] T015 [P] Manually validate Quickstart Scenario 5 (dragging near a page edge is clamped so the annotation cannot be moved fully off the page, FR-007) per `specs/020-annotation-drag-tool/quickstart.md`
- [ ] T016 [P] Manually validate Quickstart Scenario 6 (on a note with 2+ annotations, the index selector and other controls stay hidden while the move tool is active) per `specs/020-annotation-drag-tool/quickstart.md`
- [X] T017 Run `npm run build` (and `npm run types`, the stricter declaration build) to confirm no TypeScript errors across `src/render/sui/textEdit.ts`, `src/ui/components/dialogs/annotationDragger.vue`, and `src/ui/components/dialogs/annotation.vue` — both passed. `npm run server` was smoke-tested to confirm it starts without throwing; a full in-browser regression check of existing lyric/chord/annotation rendering was not performed in this environment (no browser available) — see T011/T012/T014-T016

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (T002→T003→T004→T005→T006 is a strict same-file/depends-on chain; no parallelism within this phase)
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion; its validation step (T012) also depends on User Story 1's `onDragStop`/`loadCurrent` wiring (T010) existing
- **User Story 3 (Phase 5)**: Depends on Foundational completion; its validation step (T014) also depends on T010 (same `syncModifiers()` call path)
- **Polish (Phase 6)**: Depends on Phases 3-5 being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on other stories — this is the MVP
- **User Story 2 (P2)**: Verification-only; depends on US1's implementation tasks (T007-T010) already existing, since it exercises the same dialog wiring rather than adding new code paths
- **User Story 3 (P3)**: Verification-only; same relationship to US1 as US2

### Within Each User Story

- User Story 1's tasks (T007-T010) are a strict sequential chain — all four edit the same file (`annotation.vue`) and build on each other
- User Stories 2 and 3 add no new implementation by default (their `syncModifiers()`/`loadCurrent()` reuse is already in place after US1); their tasks are manual validation, with a contingency fix task (T013) only if validation surfaces an issue

### Parallel Opportunities

- None within Phase 2 or Phase 3 (each task edits the same file as the task before it, or directly depends on it)
- T015 and T016 (Phase 6) can run in parallel — independent manual validation scenarios
- T012 and T014 (Phases 4 and 5) could run in parallel with each other once T010 is complete, since they validate independent scenarios against the same already-built feature

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (`SuiAnnotationDragSession` + `annotationDragger.vue`)
3. Complete Phase 3: User Story 1 (dialog wiring)
4. **STOP and VALIDATE**: Run Quickstart Scenarios 1-2
5. This is a fully usable "Move" tool — User Stories 2 and 3 mainly confirm it behaves correctly in scenarios the underlying design already accounts for

### Incremental Delivery

1. Setup + Foundational → drag mechanics exist but are unwired
2. Add User Story 1 → drag tool usable end-to-end on a single-note annotation (MVP)
3. Add User Story 2 → confirms numeric/drag consistency (validation only)
4. Add User Story 3 → confirms multi-note-selection correctness (validation only)
5. Polish → edge cases (page clamping, mode exclusivity) and a final clean build

## Notes

- **Manual validation status**: T011, T012, T014, T015, T016 (all the "Manually validate Quickstart Scenario N" tasks) require driving an actual browser and were **not** performed — this implementation environment has no browser-driving tool available. All implementation tasks (T001-T010, T017) are complete and the project builds cleanly (`npm run build` and the stricter `npm run types`). The drag mechanics reuse already-exercised helpers (`SvgHelpers.doesBox1ContainBox2`/`outlineRect`, `SvgPageMap.clientToSvg`/`getRendererFromModifier`) from the working `SuiDragSession` precedent, and the commit path reuses the dialog's existing `syncModifiers()`, already exercised by the X/Y number fields — but the actual drag gesture, page-edge clamping, and mode-exclusivity behavior should be manually verified in a browser per `specs/020-annotation-drag-tool/quickstart.md` before considering this feature fully done.
- [P] tasks = different files or independent validation scenarios, no dependencies
- [Story] label maps task to specific user story for traceability
- This feature has no automated tests wired up in this repo; "tests" here are the manual Quickstart scenarios cited by task
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
