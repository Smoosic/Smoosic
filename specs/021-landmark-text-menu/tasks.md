---

description: "Task list template for feature implementation"
---

# Tasks: Landmark Text Menu

**Input**: Design documents from `/specs/021-landmark-text-menu/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/component-interfaces.md, quickstart.md

**Tests**: Not requested — this repo has no automated test runner wired up (`npm test` is a no-op placeholder, per plan.md's Technical Context). Verification tasks below are manual, against `quickstart.md`.

**Organization**: Tasks are grouped by user story (spec.md) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Single front-end project (per plan.md's Structure Decision) — all paths are under `src/`, no `backend/`/`frontend/` split.

---

## Phase 1: Setup

**Purpose**: Confirm a clean baseline before making changes

- [X] T001 Run `npm run build` to confirm the repo builds cleanly on the current branch before this feature's changes, so any later build failure can be attributed to this feature

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Activate `SmoTextGroup.purpose` and add the landmark placement/creation data layer — every user story's menu handler depends on `SmoTextGroup.createLandmarkText` existing and actually persisting `purpose`.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 Add `'purpose'` to `SmoTextGroup.nonTextAttributes` (and therefore `SmoTextGroup.attributes`, which spreads from it) in `src/smo/data/scoreText.ts`, so the constructor copies `purpose` from params and `serialize()`/`deserialize()` persist/restore it (data-model.md, research.md §1) — this activates a field that is currently declared but silently dropped
- [X] T003 Add a new static getter `SmoTextGroup.landmarkPlacements: Record<number, SmoTextPlacement>` in `src/smo/data/scoreText.ts`, alongside the existing `purposeToFont`, with the seven entries from research.md §2 (TITLE: xPlacement 0.5/yOffset +4/fontSize 24; SUBTITLE: 0.5/+32/18; COMPOSER: 0.8/+10/12; COPYRIGHT: 0.5/-12/12; DATE: 0.5/-28/12; PAGE: 0.8/+24/12; PART: 0.8/+38/12) (depends on T002)
- [X] T004 Add a new static method `SmoTextGroup.createLandmarkText(purpose: number, text: string, layout: ScaledPageLayout): SmoTextGroup` in `src/smo/data/scoreText.ts`, reading `landmarkPlacements[purpose]` instead of `purposeToFont[purpose]`, and additionally setting `pagination: SmoTextGroup.paginations.EVERY` and `purpose` (the input) on the returned group before it's added to any score/part (contracts/component-interfaces.md §1, data-model.md) (depends on T003) — does **not** set `edited` (superseded by T013's fix, which gates the dialog's initial mode off `purpose` directly so it works for any purpose-tagged group, not only ones this method creates). Superseded by T020 for the horizontal centering arithmetic.

**Checkpoint**: `SmoTextGroup.createLandmarkText` compiles and returns a correctly-placed, correctly-tagged group. No menu/dialog wiring yet — no user-visible behavior.

---

## Phase 3: User Story 1 - Add a standard score landmark (Title, Subtitle, Composer, Copyright, Date, or Page number) (Priority: P1) 🎯 MVP

**Goal**: Choosing Title/Subtitle/Composer/Copyright/Date/Page number from a new "Landmark Text" submenu automatically creates the correctly positioned, sized, and worded text block and opens its dialog, with no typing required.

**Independent Test**: With a score that has a title and composer set, open the Text menu, choose "Landmark Text" > "Title", and confirm a centered title appears at the top of the first page in the correct default font size, without any text-entry step.

### Implementation for User Story 1

- [X] T005 [US1] Add `findLandmark(purpose: number, view: SuiScoreViewOperations): SmoTextGroup | undefined`, `sourceTextDefined(purpose: number, view: SuiScoreViewOperations): boolean`, and `resolveLandmarkText(purpose: number, view: SuiScoreViewOperations): string` helper functions in `src/ui/menus/text.ts`, covering all seven landmark purposes per research.md §5-§7 (`resolveLandmarkText`'s DATE branch reuses the `YYYY-MM-DD` formatting from `src/smo/mxml/smoToXml.ts:109-111`; PAGE branch returns the literal string `'Page ### of @@@'`) (depends on T004)
- [X] T006 [US1] Add a `landmarkOption(purpose: number, label: string, icon: string): SuiConfiguredMenuOption` factory function in `src/ui/menus/text.ts`, modeled on `note.ts`'s `arpeggioStyleOption`: `display` returns `sourceTextDefined(purpose, menu.view) || (purpose !== SmoTextGroup.purposes.PART && !!findLandmark(purpose, menu.view))`; `handler` looks up `findLandmark`, creates-and-adds via `SmoTextGroup.createLandmarkText` + `view.addTextGroup(...)` only if none exists, then always calls `SuiTextBlockDialogVue({ ..., modifier: group })` (contracts/component-interfaces.md §2) (depends on T005)
- [X] T007 [US1] Build `landmarkOptions: SuiConfiguredMenuOption[]` in `src/ui/menus/text.ts` covering Title, Subtitle, Composer, Copyright, Date, and Page Number (depends on T006) — implemented together with T010's Part entry in the same array literal, since splitting one seven-line array construction across two phases added no isolation benefit; T010 below reflects this
- [X] T008 [US1] Add a `landmarkTextMenuOption: SuiConfiguredMenuOption` parent (icon, `text: 'Landmark Text'`, `value: 'landmarkTextMenu'`, `subMenu: landmarkOptions`, `display: () => true`, no-op `handler`) to `src/ui/menus/text.ts`'s `SuiTextMenuOptions` array, modeled on `note.ts`'s `arpeggioMenuOption` (contracts/component-interfaces.md §2) (depends on T007)
- [ ] T009 [US1] Manually validate Quickstart Scenarios 1 and 2 (Title/Subtitle centered top-of-page at 24px/18px; Composer/Page Number upper right; Copyright/Date centered bottom; dialog opens immediately with no typing) per `specs/021-landmark-text-menu/quickstart.md`

**Checkpoint**: User Story 1 is fully functional and independently testable — this is the MVP (Part landmark not yet in the menu).

---

## Phase 4: User Story 2 - Add a part-specific landmark (Priority: P2)

**Goal**: A "Part" entry appears in the Landmark Text submenu only while viewing an exposed (single-instrument) part, and inserts that part's name automatically.

**Independent Test**: Open a view where a single instrument's part is exposed, open Text menu > Landmark Text, confirm "Part" is offered, choose it, and confirm the part's name appears automatically in the upper right corner of the page.

### Implementation for User Story 2

- [X] T010 [US2] Add the seventh `landmarkOption(SmoTextGroup.purposes.PART, 'Part', ...)` call to `landmarkOptions` in `src/ui/menus/text.ts` (the underlying `sourceTextDefined`/`resolveLandmarkText` PART branches already exist from T005) — done as part of T007's array literal (depends on T008)
- [ ] T011 [US2] Manually validate Quickstart Scenario 6 (Part hidden in full-score view, offered in an exposed-part view, creates the part's name in the upper right corner, hidden again on returning to full-score view) per `specs/021-landmark-text-menu/quickstart.md`

**Checkpoint**: User Stories 1 and 2 both work independently; all seven landmark purposes are reachable from the menu under their correct visibility rules.

---

## Phase 5: User Story 3 - Reopen an existing landmark instead of duplicating it (Priority: P2)

**Goal**: Choosing a landmark purpose that already exists opens its existing dialog rather than creating a second, duplicate text block — and its menu entry stays available even if the underlying score field is later cleared.

**Independent Test**: Create a Title landmark, close its dialog, choose "Title" from the Landmark Text submenu again, and confirm the existing Title's dialog opens instead of a second title being created.

### Implementation for User Story 3

- [ ] T012 [US3] Manually validate Quickstart Scenarios 4 and 5 (an existing landmark's menu entry survives its source field being cleared; reopening a purpose that already has a landmark opens the existing one with no duplicate created) per `specs/021-landmark-text-menu/quickstart.md` — expected to pass without new code, since `findLandmark`'s existence check (T006) and the `display` OR-with-existing logic (T006) already implement this

**Checkpoint**: All three of US1/US2/US3 are independently functional — every landmark purpose can be created, is correctly gated, and never duplicates.

---

## Phase 6: User Story 4 - Adjust a landmark's appearance without retyping its content (Priority: P3)

**Goal**: A landmark's dialog offers no free-text editing and no pagination-type control, while font, position (via the existing Move tool), and other appearance attributes remain fully editable.

**Independent Test**: Create a landmark item, open its dialog, confirm there is no free-text editing step and no control to change how it repeats across pages, change its font size, and confirm the change is reflected on the rendered score.

### Implementation for User Story 4

- [X] T013 [US4] Add `const isLandmark = props.modifier.value.purpose !== SmoTextGroup.purposes.NONE;` in `src/ui/components/dialogs/textBlock.vue`, computed before `mode`, and fold it into `mode`'s initial-value expression (`ref((props.modifier.value.edited || isLandmark) ? 'idle' : 'editing')`) so **any** purpose-tagged group — not only ones created via `createLandmarkText`, e.g. a pre-existing MusicXML-imported Title/Subtitle/Composer group — skips the free-text editing session on first open, not just when opened via the now-hidden "Edit Text" button (contracts/component-interfaces.md §3, research.md §8) (depends on T002)
- [X] T014 [US4] Wrap the existing "Edit Text" button (`textBlock.vue`'s idle-mode button row) in `v-if="!isLandmark"`, leaving the "Move" button unconditional, in `src/ui/components/dialogs/textBlock.vue` (depends on T013)
- [X] T015 [US4] Wrap the existing "Page Behavior" `selectComp` row in `v-if="!isLandmark"`, leaving the font picker above it unconditional, in `src/ui/components/dialogs/textBlock.vue` (depends on T013)
- [ ] T016 [US4] Manually validate Quickstart Scenarios 7 and 7b (no "Edit Text" button, no "Page Behavior" control, and no free-text editing session on first open for any landmark's dialog — including a Title/Subtitle/Composer group produced by the pre-existing MusicXML-import path, not only ones created via the Landmark Text menu; font-size change and Move-drag both still take effect) per `specs/021-landmark-text-menu/quickstart.md`

**Checkpoint**: All four user stories are independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verify the remaining spec Edge Cases and confirm the build is clean end-to-end

- [ ] T017 [P] Manually validate Quickstart Scenario 3 (Title/Subtitle/Composer/Copyright hidden from the submenu on a fresh score with those fields blank and no prior landmark of that purpose) per `specs/021-landmark-text-menu/quickstart.md`
- [ ] T018 [P] Manually validate Quickstart Scenario 8 (the pre-existing, non-landmark "Score Text" menu entry is unaffected — still opens directly into the free-text editing session, and its dialog still shows both "Edit Text" and "Page Behavior" once text is entered, confirming the `isLandmark`/`purpose !== NONE` gating from T013-T015 is correctly scoped to landmarks only) per `specs/021-landmark-text-menu/quickstart.md`
- [X] T019 Run `npm run build` (and `npx tsc --noEmit`, the stricter type-only check) to confirm no TypeScript errors across `src/smo/data/scoreText.ts`, `src/ui/menus/text.ts`, and `src/ui/components/dialogs/textBlock.vue` — both passed; `npm run server` was smoke-tested to confirm it starts without throwing
- [X] T020 Fix two placement bugs in `SmoTextGroup.createLandmarkText` found via user feedback after T004/T009 (`src/smo/data/scoreText.ts`, research.md §2): (1) horizontal center-x was computed as `pageWidth * xPlacement` (raw page width) instead of `leftMargin + (pageWidth - leftMargin - rightMargin) * xPlacement` (the printable area between the margins) — fixed to be margin-relative; (2) the `x -= width / 2` centering shift was computed into a local variable but never written back onto the `SmoScoreText`'s own `.x` field, so every landmark rendered left-aligned at the target point instead of centered on it — fixed by assigning `st.x = centerX - (st.estimateWidth() / 2)` explicitly after constructing `st`. Also adjusted `landmarkPlacements`' TITLE `yOffset` from 4 to 24 (1em, matching TITLE's own 24px fontSize, per explicit user request that Title start "1em below the top margin") and SUBTITLE `yOffset` from 32 to 52 (preserving the original 28px baseline-to-baseline gap below Title's new position, per FR-008)
- [ ] T021 [P] Manually validate the T020 fix: create a Title landmark and confirm it is visually centered between the left and right margins (not offset toward the right) and starts appreciably below the top margin line rather than immediately butting against it; create Subtitle/Date/Copyright landmarks and confirm each is also horizontally centered between the margins per `specs/021-landmark-text-menu/quickstart.md` Scenarios 1-2
- [X] T022 Fix vertical placement in `SmoTextGroup.createLandmarkText` per spec Clarifications session 2026-09-24 (FR-018/SC-007, research.md §2b): the `y` formula anchored top/bottom-anchored landmarks to `topMargin`/`bottomMargin` — the same vertical band the score's music systems render into — so a landmark could visually collide with the music. Changed `y = yOffset > 0 ? topMargin + yOffset : pageHeight + yOffset - bottomMargin` to `y = yOffset > 0 ? yOffset : pageHeight + yOffset` in `src/smo/data/scoreText.ts`, so top-anchored purposes measure from the true page top (`y = 0`) and bottom-anchored purposes measure from the true page bottom (`y = pageHeight`), never from the margins. `landmarkPlacements`' existing `yOffset` magnitudes are unchanged (already small, page-edge-appropriate buffers — TITLE's 24 already equals its own fontSize, satisfying FR-018's "one em" buffer exactly); only the reference point changed. `topMargin`/`bottomMargin` are no longer read anywhere in this method.
- [ ] T023 [P] Manually validate the T022 fix per Quickstart Scenario 9 (`specs/021-landmark-text-menu/quickstart.md`): on a score with music rendered close to the top/bottom margins, confirm Title/Subtitle/Composer/Page Number/Part render near the true top edge of the page (outside/above the top margin, not overlapping the first music system) and Copyright/Date render near the true bottom edge (outside/below the bottom margin, not overlapping the last music system)
- [X] T024 Refine the top-anchored base position from a flat buffer to margin-proportional, and add column stacking, per follow-up user feedback (FR-019/FR-020, research.md §2c): (1) added `SmoScoreText.estimateHeight()` in `src/smo/data/scoreText.ts`, mirroring `estimateWidth()` but returning `TextFormatter.getYForStringInPx(text).height`; (2) changed `SmoTextGroup.createLandmarkText`'s signature to accept a fourth, optional `above?: SmoTextGroup | null` parameter; (3) for top-anchored purposes, when `above?.logicalBox` is present, set the new landmark's visual top flush to `above.logicalBox.y + above.logicalBox.height`; otherwise set it to `Math.max(0, topMargin / 2 - height)` (replacing the flat `yOffset`-as-pixels-from-page-top rule from T022); bottom-anchored purposes (Copyright, Date) are unchanged; (4) since `st.y` behaves as a bottom/baseline-like coordinate (visual top = `y - height`), both branches set `st.y = <target top> + height`; (5) `landmarkPlacements`' top-anchored `yOffset` values (TITLE/SUBTITLE/COMPOSER/PAGE/PART) became sign-only placeholders (`1`), since their magnitude is no longer read; (6) added `LANDMARK_COLUMNS` (`[TITLE, SUBTITLE]`, `[COMPOSER, PAGE, PART]`) and `findAboveLandmark(purpose, view)` in `src/ui/menus/text.ts`, and wired its result into the `landmarkOption` handler's `createLandmarkText` call
- [ ] T025 [P] Manually validate the T024 refinement per Quickstart Scenarios 9 and 10 (`specs/021-landmark-text-menu/quickstart.md`): confirm Title/Composer's base position scales with the top margin (not a fixed small constant) and stays within the page edge; confirm Subtitle stacks flush below Title, and Page Number/Part stack flush below Composer/Page Number when created in column order
- [X] T026 Right-justify the upper-right landmark group (Composer, Page number, Part) against the right margin, per follow-up user feedback (FR-021, research.md §2d): (1) added a new `SmoLandmarkPlacement` interface in `src/smo/data/scoreText.ts` (`fontFamily`, `fontSize`, `xJustify: 'center' | 'right'`, `xPlacement?` required only for `'center'`, `yOffset`), distinct from the shared `SmoTextPlacement` still used unmodified by `purposeToFont`/`createTextForLayout`; (2) changed `landmarkPlacements`'s return type to `Record<number, SmoLandmarkPlacement>` and set `xJustify: 'center'` on Title/Subtitle/Copyright/Date (each keeping `xPlacement: 0.5`) and `xJustify: 'right'` (no `xPlacement`) on Composer/Page number/Part; (3) `createLandmarkText`'s horizontal calculation now branches on `xJustify`: `'center'` keeps the existing `centerX - width/2` formula, `'right'` computes `st.x = (pageWidth - rightMargin) - width` so the text's right edge lands exactly at the right margin instead of being centered near it
- [ ] T027 [P] Manually validate the T026 fix per Quickstart Scenario 11 (`specs/021-landmark-text-menu/quickstart.md`): create Composer/Page Number/Part landmarks with text of differing lengths and confirm all three have their right edge flush against the right margin (not centered around a point, and not overlapping past the margin)
- [X] T028 Fix Page number's right edge not matching Composer's/Part's, per follow-up user feedback (research.md §2e): the stored `text` for Page number is the literal `'Page ### of @@@'` marker template (18 chars), but `createLandmarkText` was estimating width from it directly — far wider than the actual per-page substituted text (e.g. "Page 1 of 3", 11 chars) — so its computed right edge fell short of the margin while Composer's (no markers) landed exactly on it. Added an optional 5th `measureText?: string` parameter to `createLandmarkText` (`src/smo/data/scoreText.ts`), used only to compute `width`/`height` (temporarily swapping `st.text`, then restoring the real `text` before continuing); added `resolveLandmarkMeasureText(purpose, view, resolvedText)` in `src/ui/menus/text.ts`, returning `` `Page 1 of ${pageCount}` `` for Page number and `resolvedText` unchanged for every other purpose; wired it into the `landmarkOption` handler's `createLandmarkText` call
- [X] T029 Fix column stacking being order-dependent, per follow-up user feedback (FR-020, research.md §2f): `findAboveLandmark` (`src/ui/menus/text.ts`) previously walked backward from a purpose's *fixed index* in `LANDMARK_COLUMNS`, so `COMPOSER` (always index 0) could never be told to stack below an already-existing Page number/Part, landing on the identical Y if Page number was created first. Rewrote it to check *every other* purpose in the column and stack below whichever already-existing one currently has the lowest (furthest-down) `logicalBox.y + logicalBox.height`, regardless of creation order
- [ ] T030 [P] Manually validate the T028/T029 fixes per Quickstart Scenarios 10 (step 5-6) and 11 (`specs/021-landmark-text-menu/quickstart.md`): confirm Composer's and Page Number's right edges are identical (not just visually close); confirm creating Page Number before Composer still results in the two stacking without overlap

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (T002→T003→T004 is a strict same-file/depends-on chain; no parallelism within this phase)
- **User Story 1 (Phase 3)**: Depends on Foundational completion (T002→T003→T004 chain, then T005→T006→T007→T008, also a strict same-file chain)
- **User Story 2 (Phase 4)**: Depends on User Story 1's `landmarkOptions`/`landmarkOption` existing (T006, T008) — it adds one array entry, not new infrastructure
- **User Story 3 (Phase 5)**: Verification-only; depends on User Story 1's `findLandmark`/`display` logic (T006) already existing
- **User Story 4 (Phase 6)**: Depends on Foundational's `purpose` activation (T002) but is otherwise independent of Phases 3-5 (different file, `textBlock.vue`) — could be implemented in parallel with Phases 3-5 by a different contributor
- **Polish (Phase 7)**: Depends on Phases 3-6 being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on other stories — this is the MVP
- **User Story 2 (P2)**: Adds one entry to a structure User Story 1 already built; not independently buildable before US1
- **User Story 3 (P2)**: Verification-only; depends on US1's handler/display logic already existing
- **User Story 4 (P3)**: Touches a different file (`textBlock.vue`) than US1-US3 (`text.ts`); depends only on Foundational (T002), so it is the one story that could be developed in parallel with US1-US3 rather than after them

### Within Each User Story

- User Story 1's tasks (T005-T008) are a strict sequential chain — all four edit the same file (`src/ui/menus/text.ts`) and build on each other
- User Story 2 (T010) is a one-line addition to the array built in T007/T008
- User Story 3 (T012) adds no new code — validation only
- User Story 4's tasks (T013-T015) are a strict sequential chain in `textBlock.vue`

### Parallel Opportunities

- None within Phase 2 or within Phase 3's implementation tasks (each depends on the one before it in the same file)
- Phase 6 (User Story 4, `textBlock.vue`) touches a different file than Phases 3-5 (`text.ts`) and only depends on Phase 2 (T002) — it can be implemented in parallel with Phases 3-5 by a different contributor
- T017 and T018 (Phase 7) can run in parallel — independent manual validation scenarios

---

## Parallel Example: User Story 1 vs. User Story 4

```bash
# Once Phase 2 (Foundational) is complete, these can proceed in parallel:
Task: "T005-T009 in src/ui/menus/text.ts (User Story 1)"
Task: "T013-T016 in src/ui/components/dialogs/textBlock.vue (User Story 4)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (`SmoTextGroup.purpose` activation + `landmarkPlacements` + `createLandmarkText`)
3. Complete Phase 3: User Story 1 (six standard landmarks reachable from the menu)
4. **STOP and VALIDATE**: Run Quickstart Scenarios 1-2
5. This already delivers the feature's core value; User Stories 2-4 round out part support, dedup guarantees, and dialog restrictions

### Incremental Delivery

1. Setup + Foundational → landmark creation/placement logic exists but is unwired
2. Add User Story 1 → six landmarks usable end-to-end from the menu (MVP)
3. Add User Story 2 → Part landmark reachable when a part is exposed
4. Add User Story 3 → confirms no-duplicate/survives-cleared-source behavior (validation only)
5. Add User Story 4 → landmark dialogs lose free-text editing and pagination controls, keep font/position controls
6. Polish → remaining edge cases and a final clean build

## Notes

- **Manual validation status**: T009, T011, T012, T016, T017, T018 (all the "Manually validate Quickstart Scenario N" tasks) require driving an actual browser and were **not** performed — this implementation environment has no browser-driving tool available. All implementation tasks (T001-T008, T010, T013-T015, T019) are complete and the project builds cleanly (`npm run build` and `npx tsc --noEmit`), and `npm run server` was smoke-tested to confirm it starts without throwing. The menu wiring and dialog gating reuse already-exercised infrastructure (`SuiConfiguredMenuOption.subMenu`/`menu.vue`'s recursive `display` filtering, `SuiTextBlockDialogVue`'s existing modifier-present branch, `SmoTextGroup.getPagedTextGroups`'s existing page-marker substitution) — but the actual menu visibility rules, automatic creation/placement, dedup-on-reopen behavior, and dialog gating should be manually verified in a browser per `specs/021-landmark-text-menu/quickstart.md` before considering this feature fully done.
- [P] tasks = different files or independent validation scenarios, no dependencies
- [Story] label maps task to specific user story for traceability
- This feature has no automated tests wired up in this repo; "tests" here are the manual Quickstart scenarios cited by task
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
