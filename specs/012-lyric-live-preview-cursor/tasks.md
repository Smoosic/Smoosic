---

description: "Task list template for feature implementation"
---

# Tasks: Lyric Editor Live Preview and Position Cursor

**Input**: Design documents from `/specs/012-lyric-live-preview-cursor/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/component-interfaces.md](./contracts/component-interfaces.md), [quickstart.md](./quickstart.md)

**Tests**: This project has no wired automated test runner (`npm test` is a no-op placeholder) and the feature spec does not request TDD. No automated test tasks are generated; each story instead ends with a manual validation task against `quickstart.md`.

**Organization**: Tasks are grouped by user story (from spec.md, priorities P1–P2) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Every task includes an exact file path

## Path Conventions

Single front-end project — two files under `src/ui/components/dialogs/` and one additive method in `src/render/sui/svgHelpers.ts`, per plan.md's Project Structure. No new files.

---

## Phase 1: Setup

**Purpose**: Add the shared, no-behavior-yet scaffolding both user stories build on: the new drawing primitive and the new emit's type declaration.

- [X] T001 [P] Add a new additive static method `SvgHelpers.renderLyricPositionMarker(svg: SVGSVGElement, x: number, y: number, height: number): SVGLineElement` to `src/render/sui/svgHelpers.ts`, drawing one thin, muted-color vertical `<line>` (`x1=x2=x`, `y1=y`, `y2=y+height`) and returning it. Do not modify `renderCursor`, `eraseOutline`, or any other existing method, per [contracts/component-interfaces.md](./contracts/component-interfaces.md) §3
- [X] T002 [P] In `src/ui/components/dialogs/lyricEditor.vue`, add `preview: []` to the existing `defineEmits<{...}>()` type (alongside the existing `advance` emit from `011`) — declaration only, no emit call yet, per [contracts/component-interfaces.md](./contracts/component-interfaces.md) §1

**Checkpoint**: New files/types type-check; nothing draws or emits yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement the marker's compute/draw/remove primitives in `lyric.vue` — used by both user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 In `src/ui/components/dialogs/lyric.vue`, add a module-scoped `let markerElement: SVGLineElement | null = null;` and implement `computeMarkerPosition()`: if `currentLyric.value.logicalBox` is set, return `{ x: box.x + box.width, y: box.y, height: box.height }`; else return `{ x: note.logicalBox.x, y: note.logicalBox.y + note.logicalBox.height + SmoScoreText.fontPointSize(currentLyric.value.fontInfo.size), height: SmoScoreText.fontPointSize(currentLyric.value.fontInfo.size) }` (resolve `note` via `SmoSelection.noteFromSelector(score, currentSelector.value)`), per [research.md](./research.md) §3 and [data-model.md](./data-model.md) Operations
- [X] T004 In `src/ui/components/dialogs/lyric.vue`, implement `updateMarker()` (remove any existing `markerElement`; if `mode.value === 'editing'`, resolve `const context = view.renderer.pageMap.getRenderer(computeMarkerPosition())`, and if non-null, draw via `SvgHelpers.renderLyricPositionMarker(context.svg, x - context.box.x, y - context.box.y, height)`, storing the result in `markerElement`) and `removeMarker()` (remove `markerElement` if set, clear the reference), per [research.md](./research.md) §1/§4

**Checkpoint**: `updateMarker()`/`removeMarker()` work correctly when called directly — ready for the stories to wire them into the dialog's existing lifecycle points.

---

## Phase 3: User Story 1 - See which note is currently being edited (Priority: P1) 🎯 MVP

**Goal**: The marker appears near the current note (or at the end of its existing text), moves with navigation, and disappears when editing stops.

**Independent Test**: Open the Lyric Editor on a note with no lyric yet — confirm the marker appears near it; open it on a note with existing text — confirm the marker appears at the end of that text; navigate between notes — confirm the marker follows; switch modes or close the dialog — confirm the marker disappears.

### Implementation for User Story 1

- [X] T005 [US1] In `src/ui/components/dialogs/lyric.vue`, call `updateMarker()` at the end of `loadNote()`, so the marker appears/moves on dialog open and after every `navigate()`/`deleteCurrent()`/`onEditorAdvance('skip')` call (all of which already call `loadNote()`), per [data-model.md](./data-model.md) State Transition Summary
- [X] T006 [US1] In `src/ui/components/dialogs/lyric.vue`, call `removeMarker()` in `enterDialogMode()` (after the mode switch) and in `finish()` (both the OK and Cancel paths already route through it), plus add `onBeforeUnmount(() => removeMarker())` as a safety net, per [research.md](./research.md) §4
- [ ] T007 [US1] Manually validate against [quickstart.md](./quickstart.md) §1-§3 (marker near a note with no lyric; marker at the end of existing text; marker follows next/previous/hyphen/space navigation; marker disappears on mode switch and on dialog close, then reappears on resuming editing)

**Checkpoint**: User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - See the in-progress lyric text on the score while typing (Priority: P2)

**Goal**: Typing in the plain-text editor periodically (debounced) writes the in-progress text to the score, reusing the existing commit path, and repositions the marker to match.

**Independent Test**: Type a few characters, pause, and confirm the score updates near the current note shortly after — not on every keystroke — with no interruption to typing.

### Implementation for User Story 2

- [X] T008 [US2] In `src/ui/components/dialogs/lyricEditor.vue`, add `schedulePreview`/`pushPreview` (400ms debounce, mirroring `textGroupEditor.vue`'s `PREVIEW_DEBOUNCE_MS` pattern from `009-text-editor-live-preview`) and wire `onUpdate: schedulePreview` into the existing `useEditor({...})` call; `pushPreview()` calls `emit('preview')` with no payload, per [research.md](./research.md) §5
- [X] T009 [US2] In `src/ui/components/dialogs/lyric.vue`, implement `onEditorPreview()`: `await commitIfChanged(); updateMarker();` (reusing `010`'s existing `commitIfChanged()` unchanged) and wire `@preview="onEditorPreview"` onto the existing `<lyricEditorComp>` usage, alongside the existing `@advance="onEditorAdvance"`, per [contracts/component-interfaces.md](./contracts/component-interfaces.md) §2
- [ ] T010 [US2] Manually validate against [quickstart.md](./quickstart.md) §4 (preview appears on the score shortly after pausing; continuous typing does not update on every keystroke and is never interrupted; clearing all text clears the preview on the next update)

**Checkpoint**: User Stories 1 and 2 are both independently functional.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Confirm persistence timing is unchanged, no regressions to `010`/`011`, and the modified/new code is clean.

- [ ] T011 [P] Manually validate [quickstart.md](./quickstart.md) §5 (Cancel after a preview update matches what was previewed — no separate draft state, FR-009) and §6 (no marker visible while the dialog is in its Verse/Y Adjustment/Font mode)
- [ ] T012 [P] Re-run `specs/010-vue-lyric-dialog/quickstart.md` §1-§5 and `specs/011-lyric-editor-auto-advance/quickstart.md` §1-§5 in full as a regression pass
- [X] T013 Run `npm run build` (the Lyric Editor is already wired into the real "Lyrics" menu option per `010`/`011`, so no temporary call-site wiring is needed this time) and fix any TypeScript errors
- [X] T014 [P] Audit that `SvgHelpers.renderCursor`, `eraseOutline`, and `outlineRect` signatures/behavior are unchanged (T001 was purely additive) and that no legacy `SuiLyricSession`/`SuiLyricEditor`/`SuiInlineText` import was reintroduced anywhere in `lyric.vue`/`lyricEditor.vue`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (needs T001's `SvgHelpers` method) — BLOCKS both user stories
- **User Stories (Phase 3-4)**: Both depend on Foundational phase completion
  - User Story 2 additionally depends on User Story 1's `loadNote()`/`updateMarker()` wiring being in place, since `onEditorPreview()` calls `updateMarker()` — listed in priority order (P1 → P2) accordingly
- **Polish (Phase 5)**: Depends on both user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependency on US2
- **User Story 2 (P2)**: Can start after Foundational (Phase 2), but its `onEditorPreview()` (T009) calls `updateMarker()`, so functionally it should follow User Story 1's wiring (T005/T006)

### Within Each User Story

- `lyric.vue` wiring before the manual validation task
- Story complete before moving to the next priority (recommended sequencing, since both share `lyric.vue`)

### Parallel Opportunities

- T001, T002 (Setup) touch different files and can run in parallel
- T011, T012, T014 (Polish) are independent verification passes and can run in parallel

---

## Parallel Example: Setup

```bash
Task: "Add SvgHelpers.renderLyricPositionMarker to svgHelpers.ts"
Task: "Add preview emit type to lyricEditor.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks both stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run quickstart.md §1-§3 independently
5. This alone delivers FR-001 through FR-005 (the position marker) — the higher-priority of the two behaviors, and the one the feature description frames as solving the more acute "which note am I on" problem

### Incremental Delivery

1. Setup + Foundational → marker draw/remove primitives ready
2. Add User Story 1 → validate independently (marker appears/moves/disappears correctly)
3. Add User Story 2 → validate independently (in-progress text preview works, doesn't regress US1's marker or `011`'s auto-advance)
4. Phase 5: Polish — confirm no regression to `010`/`011`, run full quickstart.md

### Notes

- No new files are created by this feature; two files from `010`/`011` are extended, plus one additive method on the existing `SvgHelpers` utility.
- `SuiLyricDialog` (legacy) and `SuiLyricSession`/`SuiLyricEditor`/`SuiInlineText` are never touched or reintroduced — per [research.md](./research.md), the marker is a new, much simpler primitive, not a revived editable-cursor system.
- Per [research.md](./research.md) §5, the periodic preview reuses `commitIfChanged()` verbatim — no separate draft/undo state is introduced by any task above.

## Implementation Notes (as executed)

- **T004 deviation**: the render context is resolved via `props.view.tracker.renderer.pageMap.getRenderer(...)`, not `view.renderer.pageMap...` as sketched in the task text — `SuiScoreViewOperations` exposes the renderer through `.tracker.renderer`, matching the exact pattern `textBlockVue.ts` already uses (`tracker.renderer.pageMap.svgToClient(...)`) and `NoteEntryCaret` uses (`this.tracker.renderer.pageMap.getRenderer(...)`). Code is authoritative over the task text here.
- **Verification performed**: `npm run build` (T013) compiled cleanly with no temporary call-site wiring needed — `SuiLyricDialogVue` has been wired into the real `lyricsDialogMenuOption` (`src/ui/menus/text.ts`) since a commit made between `011` and `012`, so `ts-loader` already reaches and type-checks `lyric.vue`/`lyricEditor.vue`/`svgHelpers.ts` from the normal build entry point.
- **T014 audit performed by inspection**: `svgHelpers.ts` diff is purely additive (one new static method after `renderCursor`; `renderCursor`, `eraseOutline`, `outlineRect` untouched). `lyric.vue`/`lyricEditor.vue` import no `SuiLyricSession`/`SuiLyricEditor`/`SuiInlineText` symbols (grepped for all three — no matches beyond comments referencing them by name for traceability).
- **Not performed**: T007, T010, T011, T012 all require driving the dialog in a live browser (observing the marker on the actual SVG score, typing and watching the debounced preview render). No browser/UI-automation tool was available in this session, so these remain unchecked. A human (or a future session with browser access) should run through [quickstart.md](./quickstart.md) before treating this feature as verified end-to-end.
