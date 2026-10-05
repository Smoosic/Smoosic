---

description: "Task list for measure-number rehearsal marks"
---

# Tasks: Measure-Number Rehearsal Marks

**Input**: Design documents from `/specs/026-rehearsal-mark-measure-number/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/rehearsal-mark-text.md](contracts/rehearsal-mark-text.md), [quickstart.md](quickstart.md)

**Tests**: Included. The constitution (Principles #1 and #2) requires serialization and non-UI logic tests for new music features. Rendering is deliberately not tested.

**Organization**: Grouped by user story. Paths are repository-root relative.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story the task belongs to

## Phase 1: Setup

**Purpose**: Test harness for the feature

- [X] T001 Add npm script `"test:rehearsal-measure-number": "ts-node -P tests/tsconfig.json tests/rehearsalMarkMeasureNumber.ts"` to package.json, and create tests/rehearsalMarkMeasureNumber.ts as a skeleton copying the header pattern of tests/textDragPlacement.ts (dynamic-ctor init calls for note/measure/staff/score modifiers, `check()` helper, failure counter, `process.exit(1)` when failures > 0)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The data value and the shared text derivation that every story uses

**⚠️ CRITICAL**: No user story work can begin until T002–T003 are complete

- [X] T002 In src/smo/data/measureModifiers.ts add `measureNumber: 'measureNumber'` to `SmoRehearsalMark.cardinalities` (line ~612). Leave `defaults`, `attributes`, and `serialize` unchanged (data-model.md)
- [X] T003 In src/smo/data/measure.ts add `getRehearsalMarkText(): string | undefined` next to `getRehearsalMark()` (line ~1525), per the table in data-model.md: no mark → `undefined`; cardinality not `measureNumber` → `mark.symbol`; `measureNumber` → `String(this.measureNumber.displayMeasure + 1)` (displayMeasure is 0-indexed, research.md §2); if `displayMeasure` is not finite fall back to `this.measureNumber.measureIndex + 1`, then to `mark.symbol`. Add a doc comment explaining the `+ 1`
- [X] T004 [P] In tools/smoosic-schema.json add `"measureNumber"` to `SmoRehearsalMarkCardinalityEnum` (line ~777) and change the `SmoRehearsalMark.cardinality` property (line ~797, currently `"type": "number", "default": 0`) to reference that enum with default `"capitals"`, so a `measureNumber` score validates (research.md §8)

**Checkpoint**: Model value and derivation exist; user stories can proceed

---

## Phase 3: User Story 1 - Label a rehearsal mark with its measure number (Priority: P1) 🎯 MVP

**Goal**: A mark with the measure-number style displays its measure's displayed number everywhere rehearsal mark text is produced; other styles are unchanged.

**Independent Test**: Run `npm run test:rehearsal-measure-number`; then manually follow quickstart.md §3 steps 1–2 and 6–7.

### Tests for User Story 1

- [X] T005 [US1] In tests/rehearsalMarkMeasureNumber.ts add text-derivation checks using `SmoMeasure.getDefaultMeasure(SmoMeasure.defaults)` with `measureNumber.displayMeasure` set to 16: `measureNumber` style → `'17'`; capitals with symbol `'C'` → `'C'`; numbers with symbol `'3'` → `'3'`; measure without a mark → `undefined`; `measureNumber` with `displayMeasure` NaN and `measureIndex` 4 → `'5'`; stored `symbol` unchanged after the call (FR-002, FR-004)
- [X] T006 [US1] In tests/rehearsalMarkMeasureNumber.ts add serialization checks (Principle #1): construct `new SmoRehearsalMark({ ...SmoRehearsalMark.defaults, cardinality: 'measureNumber' })`, `serialize()` includes `cardinality: 'measureNumber'`, re-construct from that JSON and confirm cardinality survives; a legacy serialized mark (`{ ctor: 'SmoRehearsalMark', symbol: 'B' }`) still loads as capitals with symbol `'B'` (FR-005)
- [X] T007 [US1] In tests/rehearsalMarkMeasureNumber.ts add resequencing checks using `SmoSystemStaff` (build one via a default score from `SmoScore.getDefaultScore`, adding measures as needed): after adding a `measureNumber` mark at measure 2 and capitals marks at measures 1 and 4, the measure-4 capitals mark symbol is `'B'` and the measure-2 mark's stored symbol is unchanged; removing the capitals mark at measure 1 leaves the `measureNumber` mark's symbol and text unchanged (FR-007). These fail until T008

### Implementation for User Story 1

- [X] T008 [US1] In src/smo/data/systemStaff.ts `addRehearsalMark` (line ~816) treat `measureNumber` marks like non-incrementing marks: change the early return condition to `!mark.increment || mark.cardinality === SmoRehearsalMark.cardinalities.measureNumber`. In `removeRehearsalMark` (line ~859) skip marks whose cardinality is `measureNumber` in the renumbering branch (`mark && mark.increment && mark.cardinality !== SmoRehearsalMark.cardinalities.measureNumber`). Also confirm the later-measure loop in `addRehearsalMark` never rewrites a `measureNumber` mark's symbol (it matches on equal cardinality, so a letter-style `mark` cannot match one; keep it that way)
- [X] T009 [P] [US1] In src/render/vex/vxMeasure.ts lines 485–489 replace the `rm.symbol` argument of `this.stave.setSection(...)` with the text from `this.smoMeasure.getRehearsalMarkText()` (keep the `rm` existence guard; use the helper's result only when defined). This is the call named in the original request
- [X] T010 [P] [US1] In src/render/vex/toVex.ts line ~139 use `smoMeasure.getRehearsalMarkText()` in place of `rm.symbol` inside the generated `setSection('…', 0)` string (contracts/rehearsal-mark-text.md §1)
- [X] T011 [P] [US1] In src/render/vex/vxSystem.ts `renderRehearsalMarks()` (lines ~612–614) measure `smoMeasure.getRehearsalMarkText()` instead of `rm.symbol` for both `getYForStringInPx` and `getWidthForTextInPx`, so the hit-test box fits multi-digit numbers (research.md §7)
- [X] T012 [P] [US1] In src/smo/mxml/smoToXml.ts line ~652 pass `measure.getRehearsalMarkText()` as the `mark` attribute value instead of `xmark.symbol` (fall back to `xmark.symbol` if undefined to satisfy the type) (FR-008)
- [X] T013 [US1] Run `npm run test:rehearsal-measure-number` and `npm run build`; T005–T007 must PASS and the build must type-check

**Checkpoint**: MVP complete. A measure-number mark can be created programmatically and renders/exports with the measure's number

---

## Phase 4: User Story 2 - Stays correct when measures are renumbered (Priority: P2)

**Goal**: The displayed text tracks the measure's current displayed number after inserts, deletes, and renumbering.

**Independent Test**: quickstart.md §3 step 4 (insert a measure before the mark; it reads one higher) plus the renumbering test below.

### Tests for User Story 2

- [X] T014 [US2] In tests/rehearsalMarkMeasureNumber.ts add renumbering checks: on a staff with a `measureNumber` mark at measure index 4, set `staff.renumberingMap[2] = 10` (see `numberMeasures()` in src/smo/data/systemStaff.ts line ~988) and call `staff.numberMeasures()`; `getRehearsalMarkText()` for that measure must equal the new `displayMeasure + 1`, not `measureIndex + 1`. Then insert a measure before it using the staff's existing add-measure method and confirm the text increments (FR-003)

### Implementation for User Story 2

- [X] T015 [US2] Verify render freshness (research.md §5): in the running app, perform quickstart.md §3 step 4. If the mark on the shifted measure still shows the old number, find where renumbering marks measures for re-render (see `_renderChangedMeasures` in src/render/sui/scoreViewOperations.ts and the measure-number drawing at src/render/sui/scoreRender.ts line ~656) and mark measures that carry a `measureNumber` rehearsal mark as changed when their `displayMeasure` changes. If it already updates, record "no change needed" in research.md §5 and make no code change

**Checkpoint**: Stories 1 and 2 both work

---

## Phase 5: User Story 3 - Choose the style in the rehearsal mark dialog (Priority: P3)

**Goal**: Users can pick "Measure number" in the existing dialog.

**Independent Test**: quickstart.md §3 steps 2–3.

### Implementation for User Story 3

- [X] T016 [US3] In src/ui/components/dialogs/rehearsalMark.vue add `{ value: 'measureNumber', label: 'Measure number' }` to `cardinalityOptions` (line ~24). No adapter change is needed: src/ui/dialogs/rehearsalMark.ts already applies `cardinality` immediately and restores the serialized backup on cancel (research.md §9)
- [ ] T017 [US3] Manually run quickstart.md §3 steps 2–3: selecting Measure number updates the score immediately and cancel restores the prior style and text — PENDING: needs a manual run in the browser app (not run in this session)

**Checkpoint**: All user stories functional

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T018 Run the full quickstart.md (automated §1–2, manual §3) and confirm a score with only letter/number marks renders identically to `main` (SC-004) — PARTIAL: automated §1–2 passed (test + build); manual §3 pending
- [ ] T019 [P] Add a short note to changes.md describing the new `measureNumber` rehearsal mark style (follow the existing entry format in that file) — SKIPPED: changes.md holds dated public release notes and features 017–025 added none; add one if wanted

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)**: none
- **Foundational (T002–T004)**: after T001; T003 depends on T002 for the constant if used, T004 is independent of both. Blocks all stories
- **US1 (T005–T013)**: after Foundational. T005–T007 before T008–T012; T013 last
- **US2 (T014–T015)**: after US1 (needs the helper wired into rendering to verify freshness)
- **US3 (T016–T017)**: after Foundational; the dialog option is only meaningful to a user once US1 rendering exists, so run it after US1
- **Polish (T018–T019)**: after all stories

### Parallel Opportunities

- T004 can run alongside T002–T003
- T009, T010, T011, T012 touch different files and can run in parallel after T003
- T019 can run in parallel with T018

### Parallel Example: User Story 1

```text
# After T003 and T008:
Task: "T009 vxMeasure.ts setSection uses getRehearsalMarkText()"
Task: "T010 toVex.ts setSection uses getRehearsalMarkText()"
Task: "T011 vxSystem.ts hit-test box measures displayed text"
Task: "T012 smoToXml.ts exports displayed text"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001 → T002–T004 → T005–T007 (failing tests) → T008–T012 → T013
2. Stop and validate with `npm run test:rehearsal-measure-number` and `npm run build`
3. Demo: programmatically or via a hand-edited score JSON with `cardinality: "measureNumber"`

### Incremental Delivery

1. Add US2 (renumbering verification/fix) — correctness hardening
2. Add US3 (dialog option) — discoverability for end users
3. Polish

## Notes

- Deliberate deviation from the request's literal wording: the text is `displayMeasure + 1` because `displayMeasure` is 0-indexed (research.md §2).
- Do not alter `getIncrement()`; its existing `'number'` vs `'numbers'` quirk is out of scope (research.md §6).
- Commit after each task or logical group.
