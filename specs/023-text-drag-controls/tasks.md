---

description: "Task list template for feature implementation"
---

# Tasks: Score Text Drag Controls

**Input**: Design documents from `/specs/023-text-drag-controls/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/component-interfaces.md, quickstart.md

**Tests**: One automated headless test script is included (User Story 2's `centerOnPage`/`rightJustifyOnPage` math), per plan.md's Testing section — this repo's established convention (`tests/globalLayoutTextReposition.ts`, `020-annotation-drag-tool` precedent) is to headlessly test pure `smo/data` transformations and verify render/UI behavior (User Stories 1 and 3, all direction-lock/snap/Alt-throttle logic) manually via `quickstart.md`, since no UI test runner is wired up (`npm test` is a no-op placeholder).

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

**Note**: No separate Foundational phase is needed — `SuiDragSession`, `textDragger.vue`, and `SmoTextGroup` all already exist; each user story below adds an independent increment to them (new fields/methods/branches) rather than depending on new shared infrastructure that must be built first (contrast `020-annotation-drag-tool`, which had to build a whole new drag-session class before any story was testable).

---

## Phase 2: User Story 1 - Lock drag direction (Priority: P1) 🎯 MVP

**Goal**: A user can check "Lock Horizontal" or "Lock Vertical" in the text-drag toolbar so a drag only moves the text along the other axis.

**Independent Test**: Enter "moving" mode for a text block, check "Lock Horizontal", drag diagonally, and confirm only the vertical position changes; repeat with "Lock Vertical" checked and confirm only the horizontal position changes.

### Implementation for User Story 1

- [X] T002 [US1] Add `lockHorizontal: boolean = false`, `lockVertical: boolean = false`, and `dragOriginBox: SvgBox` fields to the `SuiDragSession` class in `src/render/sui/textEdit.ts` (contracts/component-interfaces.md §1)
- [X] T003 [US1] In `SuiDragSession.startDrag()`, immediately after `this.outlineBox = svgMouseBox` is assigned, snapshot that box into `this.dragOriginBox` (a plain copy, e.g. `{ ...svgMouseBox }`) in `src/render/sui/textEdit.ts` (depends on T002)
- [X] T004 [US1] In `SuiDragSession.mouseMove()`, after computing `svgMouseBox` (post `svgMouseBox.y -= this.outlineBox.height`) and before it is assigned to `this.outlineBox`, overwrite `svgMouseBox.x` with `this.dragOriginBox.x` when `this.lockHorizontal` is true, and `svgMouseBox.y` with `this.dragOriginBox.y` when `this.lockVertical` is true, in `src/render/sui/textEdit.ts` (depends on T003; research.md §1, §3)
- [X] T005 [US1] In `textDragger.vue`, add `lockHorizontal`/`lockVertical` local `ref<boolean>(false)` variables and two checkboxes ("Lock Horizontal", "Lock Vertical") to the template (below the existing "Done Dragging" button row), each wired to an `@change` handler that sets `session!.lockHorizontal`/`session!.lockVertical` from the ref's current value whenever `session` is non-null, in `src/ui/components/dialogs/textDragger.vue` (depends on T004; contracts/component-interfaces.md §3)
- [ ] T006 [US1] Manually validate quickstart.md "Manual check 1: Direction lock" (lock-horizontal confines the drag to the vertical axis and vice versa; both boxes unchecked matches pre-existing unrestricted drag behavior) per `specs/023-text-drag-controls/quickstart.md` (depends on T005)

**Checkpoint**: User Story 1 is fully functional and independently testable — this is the MVP.

---

## Phase 3: User Story 2 - One-click horizontal placement (Priority: P2)

**Goal**: A user can click "Center" or "Right Justify" in the text-drag toolbar to instantly align a text block's horizontal position, without manually dragging.

**Independent Test**: With a text block selected in the text dragger, click "Center" and confirm its horizontal position is centered on the page (vertical unchanged); click "Right Justify" and confirm it aligns to the page's right margin (vertical unchanged).

### Implementation for User Story 2

- [X] T007 [P] [US2] Add `SmoTextGroup.centerOnPage(layout: ScaledPageLayout)` and `SmoTextGroup.rightJustifyOnPage(layout: ScaledPageLayout)` methods to `src/smo/data/scoreText.ts`, reusing the `xJustify` margin/width math already used by `createLandmarkText` (center: `leftMargin + (pageWidth-leftMargin-rightMargin)/2 - width/2`; right: `pageWidth - rightMargin - width`), reading `this.logicalBox.width` and `this.ul().x`, and committing via the existing `this.offsetX(delta)` — vertical position untouched (data-model.md, research.md §5)
- [X] T008 [P] [US2] Create `tests/textDragPlacement.ts`, a headless test script modeled on `tests/globalLayoutTextReposition.ts` (same `check()`/`near()` helpers, same dynamic-ctor-init preamble), covering: centering lands the horizontal midpoint on the printable-area midpoint across varying margins/widths; right-justify lands the right edge on `pageWidth - rightMargin`; neither method changes `y`; both methods are idempotent when called twice — and add a `"test:text-drag-placement": "ts-node -P tests/tsconfig.json tests/textDragPlacement.ts"` script to `package.json` (depends on T007)
- [X] T009 [US2] In `textDragger.vue`, add a `pageLayout: ScaledPageLayout` prop and a `(e: 'reposition'): void` emit to the `Props`/`Emits` interfaces, and add "Center"/"Right Justify" buttons to the template whose `@click.prevent` handlers call `props.textGroup.centerOnPage(props.pageLayout)` / `props.textGroup.rightJustifyOnPage(props.pageLayout)` and then `emit('reposition')` — independent of `session`/`session.dragging` state, in `src/ui/components/dialogs/textDragger.vue` (depends on T007; contracts/component-interfaces.md §3)
- [X] T010 [US2] In `textBlock.vue`, compute `pageLayout` as `props.view.score.layoutManager!.getScaledPageLayout(pageIndex)` where `pageIndex = props.view.renderer.pageMap.getRendererFromModifier(props.modifier.value).pageNumber`, pass it to `textDraggerComp` as `:pageLayout="pageLayout"`, and add an `onReposition` handler (`refreshFromModel(); await rerender();`, mirroring the existing `onDragStop` body minus the mode transition) wired via `@reposition="onReposition"` in `src/ui/components/dialogs/textBlock.vue` (depends on T009; contracts/component-interfaces.md §4)
- [X] T011 [US2] Run `npm run test:text-drag-placement` and confirm all checks report `PASS` with `0` failures (depends on T008)
- [ ] T012 [US2] Manually validate quickstart.md "Manual check 2: Center / Right Justify" (including the no-duplicate-text check when clicking a placement button before any mouse-drag has started) per `specs/023-text-drag-controls/quickstart.md` (depends on T010)

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 4: User Story 3 - Snap to grid and slow-drag precision mode (Priority: P3)

**Goal**: A user can enable "Snap" so a dragged text block's final position lands on a 10px-equivalent grid regardless of zoom, and can hold Alt while dragging to throttle position updates to at most once per 100ms for finer control.

**Independent Test**: Enable "Snap", drag a text block to an arbitrary position, release, and confirm the final x/y are grid-aligned; separately, hold Alt while dragging and confirm position updates are noticeably throttled compared to an unmodified drag.

### Implementation for User Story 3

- [X] T013 [US3] Add a `snapEnabled: boolean = false` field to the `SuiDragSession` class in `src/render/sui/textEdit.ts` (contracts/component-interfaces.md §1)
- [X] T014 [US3] In `SuiDragSession.mouseMove()`, when `this.snapEnabled` is true, round the proposed `svgMouseBox.x`/`.y` to the nearest multiple of `10 / this.pageMap.renderScale` — applied *before* any lock overwrite from User Story 1 (T004), so a locked axis stays pinned exactly to `dragOriginBox` rather than being re-rounded — in `src/render/sui/textEdit.ts` (depends on T013; research.md §2-3 — if T004 has not yet landed, this is simply the only branch in that part of `mouseMove()` for now, and the lock branch is inserted after it later per the documented order)
- [X] T015 [US3] In `textDragger.vue`, add a `snapEnabled` local `ref<boolean>(false)` and a "Snap" checkbox to the template, wired to an `@change` handler that sets `session!.snapEnabled` from the ref's current value whenever `session` is non-null, in `src/ui/components/dialogs/textDragger.vue` (depends on T014)
- [X] T016 [US3] In `textDragger.vue`'s `onMouseMove`, add a closure-scoped `lastMoveTime` variable (initialized `0`); when `session && session.dragging`, if `ev.altKey` is true skip calling `session.mouseMove(ev)` unless `performance.now() - lastMoveTime >= 100` (updating `lastMoveTime` only when the event is processed), and on any event where `ev.altKey` is false reset `lastMoveTime = 0` before processing normally, so releasing Alt resumes full-speed updates on the very next event, in `src/ui/components/dialogs/textDragger.vue` (depends on T015; research.md §4)
- [ ] T017 [US3] Manually validate quickstart.md "Manual check 3: Snap to grid" and "Manual check 4: Alt slow mode" per `specs/023-text-drag-controls/quickstart.md` (depends on T016)

**Checkpoint**: All three user stories are independently functional.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verify the remaining spec Edge Cases, confirm no regression, and confirm a clean build

- [ ] T018 [P] Manually validate quickstart.md "Manual check 5: No regression when all controls are off" (spec SC-005 — behavior identical to the pre-feature drag tool) per `specs/023-text-drag-controls/quickstart.md`
- [ ] T019 [P] Manually validate the spec's remaining Edge Cases: both lock checkboxes checked simultaneously freezes movement on both axes without error; clicking a placement button while an axis lock is checked still repositions horizontally; a snapped drag near a page edge still respects the existing `checkBounds()` clamping (text cannot be pushed off the page) per `specs/023-text-drag-controls/spec.md`
- [X] T020 Run `npm run build` and `npm run types` to confirm no TypeScript errors across `src/smo/data/scoreText.ts`, `src/render/sui/textEdit.ts`, `src/ui/components/dialogs/textDragger.vue`, and `src/ui/components/dialogs/textBlock.vue`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **User Story 1 (Phase 2)**: Depends on Setup completion — no dependency on other stories; this is the MVP
- **User Story 2 (Phase 3)**: Depends on Setup completion — no dependency on User Story 1 (different `SuiDragSession` fields/methods and a separate part of `textDragger.vue`'s template)
- **User Story 3 (Phase 4)**: Depends on Setup completion — functionally independent of User Stories 1 and 2 (spec acceptance criteria for snap/Alt don't require lock or placement buttons to exist), though T014 edits the same `mouseMove()` method T004 (US1) does — see note on T014 for ordering if built out of sequence
- **Polish (Phase 5)**: Depends on Phases 2-4 being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on other stories — MVP
- **User Story 2 (P2)**: No dependency on other stories — touches `src/smo/data/scoreText.ts` (new methods) and a separate part of `textDragger.vue`'s template/props from US1/US3
- **User Story 3 (P3)**: No functional dependency on other stories; shares `SuiDragSession.mouseMove()` and `textDragger.vue`'s `onMouseMove`/checkbox row with US1 — if implemented before US1, T014's snap branch is simply the only branch present until US1's lock branch is added afterward (research.md §3 documents the required relative order: snap before lock)

### Within Each User Story

- User Story 1: T002 → T003 → T004 → T005 → T006, a strict same-file/depends-on chain
- User Story 2: T007 and T008 can run in parallel ([P] — T008 depends on T007's method signatures existing, but is a separate new file); T009 depends on T007; T010 depends on T009; T011 depends on T008; T012 depends on T010
- User Story 3: T013 → T014 → T015 → T016 → T017, a strict same-file/depends-on chain

### Parallel Opportunities

- T007 and T008 (Phase 3) touch different files (`scoreText.ts` vs. a new `tests/textDragPlacement.ts`) and can be worked on together once T007's method signatures are settled
- T018 and T019 (Phase 5) are independent manual validation passes and can run in parallel
- Once Setup is complete, User Stories 1, 2, and 3 could be assigned to different developers in parallel — the only file-level overlap is `textDragger.vue` (all three add distinct template rows/handlers to it) and `SuiDragSession.mouseMove()` (US1 and US3 add distinct branches to it, in the documented order)

---

## Parallel Example: User Story 2

```bash
# Once T007 (centerOnPage/rightJustifyOnPage) is drafted, its test script can be written alongside it:
Task: "Add SmoTextGroup.centerOnPage/rightJustifyOnPage in src/smo/data/scoreText.ts"
Task: "Create tests/textDragPlacement.ts headless test script"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: User Story 1 (direction lock)
3. **STOP and VALIDATE**: Run quickstart.md "Manual check 1"
4. This alone is a usable precision-dragging improvement — User Stories 2 and 3 add independent, additive controls to the same toolbar

### Incremental Delivery

1. Setup → clean baseline confirmed
2. Add User Story 1 → direction-lock checkboxes usable end-to-end (MVP)
3. Add User Story 2 → center/right-justify buttons usable end-to-end, with an automated regression test for their math
4. Add User Story 3 → snap checkbox and Alt slow-mode usable end-to-end
5. Polish → remaining edge cases, full-controls-off regression check, and a final clean build

### Parallel Team Strategy

With multiple developers, once Setup is complete:

- Developer A: User Story 1 (`SuiDragSession` lock fields/logic + checkboxes)
- Developer B: User Story 2 (`SmoTextGroup` placement methods + test + buttons + `textBlock.vue` prop)
- Developer C: User Story 3 (`SuiDragSession` snap field/logic + checkbox + Alt-throttle)

Coordinate merges into `textDragger.vue` and `SuiDragSession.mouseMove()` since all three stories touch them, but each adds an independent, clearly-scoped branch/row.

## Amendment: UI refinement after initial implementation

After T001-T020 above were completed, direct follow-up feedback (not a new `/speckit.*` pass) requested UI polish to the controls built in T005/T009/T015, applied directly to the same files:

- **Icons instead of text labels**: "Center"/"Right Justify" (T009) and the direction-lock controls (T005) now render as icon-only buttons using the app's existing Material Symbols `.mi` icon class (`format_align_center`, `format_align_right` for placement; both Move controls use `import_export`, with "Move Horizontal" rotated 90° via an inline style since Material Symbols has no distinct horizontal-arrows glyph), with their former text label exposed as `aria-label` instead (spec FR-014).
- **Direction-lock relabeling and interaction model**: "Lock Horizontal"/"Lock Vertical" (independent checkboxes, could both be checked) were replaced with "Move Horizontal"/"Move Vertical" (a mutually-exclusive toggle-button pair backed by a single `lockMode: 'none' | 'horizontal' | 'vertical'` ref in `textDragger.vue` — selecting one clears the other; selecting the active one clears back to `'none'`). The names now describe which movement remains possible rather than which axis is frozen, per spec FR-001-003 (updated) — the underlying `SuiDragSession.lockHorizontal`/`lockVertical` fields (T002-T004) and their `mouseMove()` behavior are unchanged.
- `specs/023-text-drag-controls/spec.md`, `data-model.md`, `contracts/component-interfaces.md`, and `quickstart.md` were updated to match. `npm run build` and `npm run types` both pass; `npm run test:text-drag-placement` is unaffected (still 7/7) since it only covers `centerOnPage`/`rightJustifyOnPage`, not the button/icon presentation.
- Manual validation of this refinement (T006, T012) still requires a browser, per the note below.

## Notes

- **Manual validation status**: T006, T012, T017, T018, T019 (all the "Manually validate..." tasks) require driving an actual browser and were **not** performed — this implementation environment has no browser-driving tool available. All implementation tasks (T001-T005, T007-T011, T013-T016, T020) are complete; `npm run build` and the stricter `npm run types` both pass with no TypeScript errors, and the automated `npm run test:text-drag-placement` headless suite passes (7/7 checks). The drag-lock/snap math reuses the already-exercised `SuiDragSession` coordinate pipeline, and the placement math reuses `createLandmarkText`'s already-shipped margin formulas — but the actual mouse-drag feel (lock, snap grid, Alt slow-mode throttle, page-edge clamping interaction) should be manually verified in a browser per `specs/023-text-drag-controls/quickstart.md` before considering this feature fully done.
- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- This feature adds one automated test (`tests/textDragPlacement.ts`, User Story 2's pure placement math); all other verification is manual via `quickstart.md`, matching this repo's established test boundary (constitution: smo/data transformation logic is regression-tested, render/UI drag behavior is verified manually)
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
