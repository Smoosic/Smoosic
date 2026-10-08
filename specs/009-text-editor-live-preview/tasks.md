---

description: "Task list template for feature implementation"
---

# Tasks: Text Editor Live Preview and Active-Font Sync

**Input**: Design documents from `/specs/009-text-editor-live-preview/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/ui-contract.md](./contracts/ui-contract.md), [quickstart.md](./quickstart.md)

**Tests**: Not requested in the spec, and this repository has no automated test harness (`npm test` is a no-op — see `plan.md` Technical Context). Verification is manual/browser-based via `quickstart.md`, folded into each story below.

**Organization**: Tasks are grouped by user story (US1/US2/US3, matching `spec.md`'s priorities: US1=P1, US2=P1, US3=P2).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single existing project — all paths are under `src/` at the repository root (no `tests/` directory exists or is introduced by this feature; see Prerequisites above).

---

## Phase 1: Setup

**Purpose**: Confirm a clean baseline before making any change.

- [X] T001 Build the project as-is (`npm run build`) and open `build/html/smoosic.html` with an existing score containing at least two text groups with different fonts, to have a known-good baseline to compare against once changes land.

---

## Phase 2: Foundational

**Purpose**: Blocking prerequisites shared by all user stories.

**None required.** Per `research.md` and `plan.md`, User Story 1 needs no code change (verification only), and User Stories 2 and 3 touch disjoint sets of files (US2: `textGroupEditor.vue` only; US3: `scoreText.ts`, `textRender.ts`, `textBlockVue.ts`). There is no shared infrastructure to build before starting story work — proceed directly to Phase 3.

---

## Phase 3: User Story 1 - Editor opens with the active block's font (Priority: P1)

**Goal**: Confirm the text editor's displayed font already matches the active text block's font when the dialog opens, when the font changes, and when the active block changes — per `research.md` §1, this behavior already exists in `textGroupEditor.vue`.

**Independent Test**: Open the text dialog on a text block with a non-default font; per `quickstart.md` Scenario 1, check the editor's initial font, a font-picker change, and switching the active block.

- [X] T002 [US1] Verify `computeFontStyle()`/`activeFontStyle`/`refreshActiveFont()` in `src/ui/components/dialogs/textGroupEditor.vue` satisfy `quickstart.md` Scenario 1 (font matches on open, on font-picker change via `textBlock.vue`'s `onFontChange()`, and on active-block switch via `activateBlock()`/`goPrevious()`/`goNext()`). If any acceptance scenario in `spec.md` User Story 1 fails, fix the font-sync wiring in that same file so it passes; otherwise no code change is needed for this story.

**Checkpoint**: User Story 1's acceptance scenarios all pass (already true today, or fixed by T002).

---

## Phase 4: User Story 2 - Score reflects in-progress edits (Priority: P1)

**Goal**: While the user types, periodically push the in-progress content to the score so it renders in context, without ending the edit session or creating extra undo steps.

**Independent Test**: Open the text dialog for an existing text group, type without clicking Done/OK, and confirm (per `quickstart.md` Scenario 2) the score updates shortly after each pause, Cancel fully reverts it, and OK commits the last-previewed content.

### Implementation for User Story 2

- [X] T003 [US2] In `src/ui/components/dialogs/textGroupEditor.vue`, add a debounce timer (module-level `let`/`ref`, cleared and reset on every tiptap `update` event — wire via the `onUpdate` option passed to `useEditor(...)` or `editor.value.on('update', ...)` after creation) that, a few hundred milliseconds after the last keystroke, applies the same fields `textBlock.vue`'s `syncEditorIfActive()` already copies (`textBlocks`, `justification`, `relativePosition`) from `htmlToTextGroup(editor.value.getJSON(), props.textGroup)` onto `props.textGroup`, then calls `await props.rerender()`. This satisfies `contracts/ui-contract.md` §3 and FR-003/FR-004; it relies on `SuiScoreViewOperations.updateTextGroup()` (already reused, unchanged) and the existing `groupUndo(true)`/`groupUndo(false)` bracket in `src/ui/dialogs/textBlockVue.ts` to keep this a single undo step (FR-005) — no changes needed in `textBlockVue.ts` or `scoreViewOperations.ts` for this task.
- [X] T004 [US2] In the same file (`src/ui/components/dialogs/textGroupEditor.vue`), guard the debounce timer so it cannot fire after the component is about to unmount or the editor instance is gone (e.g. clear the timer in `onBeforeUnmount`, and no-op if `editor.value` is falsy when the timer fires) so a stray preview update can't run against a torn-down editor when the user exits editing quickly.
- [X] T005 [US2] Manually verify `quickstart.md` Scenario 2 end-to-end: typing + pausing updates the score within about a second (SC-002), Cancel reverts the score exactly to its pre-edit state in one step (SC-004) via the existing `cancelCb`/`view.undo()` in `src/ui/dialogs/textBlockVue.ts`, and OK commits the last-previewed content (SC-005). Fix T003/T004 if any part fails.
  - Verified live in the browser: live preview confirmed working.

**Checkpoint**: User Stories 1 and 2 both work independently; the score visibly follows in-progress typing and cancel/commit behave correctly.

---

## Phase 5: User Story 3 - Visual indicator for the text group being edited (Priority: P2)

**Goal**: Render the text group currently open for editing at a reduced, non-persisted opacity, distinct from all other text, reverting to full opacity on commit or cancel.

**Independent Test**: With two or more text groups on a score, open the dialog for one; per `quickstart.md` Scenario 3, confirm only that group dims, it stays dimmed through in-dialog actions, and it returns to full opacity on OK or Cancel (including for a brand-new group).

### Implementation for User Story 3

- [X] T006 [P] [US3] In `src/smo/data/scoreText.ts`, add `beingEdited: boolean = false;` to `SmoTextGroup`, declared next to the existing `edited`/`skipRender` fields. Do **not** add it to `SmoTextGroup.defaults` or `SmoTextGroup.nonTextAttributes`, so `serialize()`/`deserialize()`/`deserializePreserveId()` never read or write it (per `data-model.md` and Constitution Principle #1).
- [X] T007 [US3] In `src/render/sui/textRender.ts`, add a fixed opacity constant (e.g. a module-level `const TEXT_GROUP_EDITING_OPACITY = 0.55;`) and a `beingEdited: boolean` field on `SuiTextBlockParams`/`SuiTextBlock`, set from `tg.beingEdited` inside `SuiTextBlock.fromTextGroup()`. In `SuiTextBlock.render()`, after each `block.text.render()` call, set `block.text.element`'s opacity (e.g. `(block.text.element as SVGGElement).style.opacity = this.beingEdited ? String(TEXT_GROUP_EDITING_OPACITY) : ''`) so every inline block belonging to this text group is dimmed while `beingEdited` is true and at full/default opacity otherwise (depends on T006 for `tg.beingEdited` to exist).
- [X] T008 [US3] In `src/ui/dialogs/textBlockVue.ts` (`SuiTextBlockDialogVue`), set `workingGroup.beingEdited = true` immediately after `workingGroup` is created/deserialized in both the new-group and existing-group branches (before the first render/`groupUndo(true)`), and set it back to `false` at the start of `commitCb`, `cancelCb`, and `removeCb` (before their `finish()`/rerender calls), matching the lifecycle table in `contracts/ui-contract.md` §2 (depends on T006).
- [X] T009 [US3] Manually verify `quickstart.md` Scenario 3: only the group being edited dims (others stay at full opacity); switching the active block or moving the group mid-edit does not clear the dimming; OK and Cancel both restore full opacity; a brand-new (not-yet-committed) group is dimmed the same way. Fix T007/T008 if any part fails.
  - Found and fixed a real bug during verification: `SmoTextGroup.getPagedTextGroups()` (`src/smo/data/scoreText.ts`) builds fresh per-page clones for any text group whose pagination isn't "Once" (e.g. a running header/footer), copying only `nonTextAttributes` — which doesn't include `beingEdited`. Every rendered clone therefore silently defaulted back to `false` and never dimmed. Fixed by explicitly propagating `ngroup.beingEdited = tg.beingEdited;` onto each per-page clone. Confirmed via targeted debug logging that this was exactly the code path hit, then confirmed the fix live in the browser.
  - Also found and fixed a related, pre-existing gap surfaced by User Story 1's verification (T002): the active block's font was not actually reaching the rendered `<p>` text via CSS inheritance from the `:style`-bound ancestor div (root-caused live via DevTools to `.text-group-editor-content .ProseMirror p` not picking up the inherited value). Fixed by applying the font explicitly through that exact selector, via a reactively-updated `<style>` tag (`editorStyleTag`, `src/ui/components/dialogs/textGroupEditor.vue`) rather than relying on inheritance.

**Checkpoint**: All three user stories work independently and together — font sync, live preview, and the editing indicator.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T010 Run the complete `quickstart.md` (all three scenarios plus the Edge Cases and out-of-scope notes) once more end-to-end, with all of T002–T009 in place together, to confirm nothing in one story regressed another (e.g., opacity from US3 doesn't interfere with the live text from US2).
  - Verified live in the browser: font sync, live preview, and the dimming indicator all confirmed working together after the two fixes above.
- [X] T011 Serialization spot-check for Constitution Principle #1: with a text group edited under this feature, save the score (or inspect `SmoTextGroup.serialize()` output directly) and confirm `beingEdited` does not appear anywhere in the saved JSON, and that loading an older/legacy score (with no knowledge of this field) still deserializes correctly.
  - Verified with a standalone ts-node script: `SmoTextGroup.serialize()` on a group with `beingEdited = true` produces JSON with no `beingEdited` key, and `SmoTextGroup.deserialize()` on that JSON comes back with `beingEdited === false` (the class default) — confirmed not serialized and safe for legacy scores.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: None — intentionally empty (see note above).
- **User Story 1 (Phase 3)**: No dependencies; can start immediately after Setup.
- **User Story 2 (Phase 4)**: No dependencies on US1/US3 at the code level; independently testable.
- **User Story 3 (Phase 5)**: No dependencies on US1/US2 at the code level; independently testable. (Spec-level note: US3 is most *meaningful* once US2's live preview exists, but nothing in US3's implementation requires US2's code.)
- **Polish (Phase 6)**: Depends on whichever of US1–US3 have been completed; T010/T011 assume all three are done.

### Within Each User Story

- US1: single verification/fix task (T002); no internal ordering beyond that.
- US2: T003 → T004 (unmount guard extends the debounce added in T003) → T005 (verification, depends on T003/T004).
- US3: T006 (model field) → T007 and T008 both depend on T006 → T009 (verification, depends on T007/T008).

### File-overlap note (affects true parallelism, not story independence)

- T002 (US1, if a fix is needed) and T003/T004 (US2) both touch `src/ui/components/dialogs/textGroupEditor.vue`. They remain independently *testable* stories, but if worked by two people at once, coordinate on that one file to avoid merge conflicts.
- T006 (`scoreText.ts`) is genuinely parallelizable against everything in US1/US2 (different file, no shared state) — hence marked `[P]`. T007/T008 are not marked `[P]` against each other only because T007 (`textRender.ts`) and T008 (`textBlockVue.ts`) both *depend on* T006 being done first (they read/set the new field), not because they touch the same file — once T006 lands, T007 and T008 can in fact proceed in parallel (different files).

### Parallel Opportunities

- T006 [US3] can start in parallel with all of Phase 3 (US1) and Phase 4 (US2) work.
- Once T006 is done, T007 and T008 can proceed in parallel (different files: `textRender.ts` vs `textBlockVue.ts`).

---

## Parallel Example: Kicking off US2 and US3 together

```bash
# One person starts the live-preview work:
Task: "Add debounced preview trigger in src/ui/components/dialogs/textGroupEditor.vue" (T003)

# Another person starts the opacity model field at the same time (different file, no conflict):
Task: "Add beingEdited field to SmoTextGroup in src/smo/data/scoreText.ts" (T006)
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Complete Phase 1 (Setup).
2. Skip Phase 2 (empty).
3. Complete Phase 3 (US1) — confirms/fixes existing font-sync behavior.
4. Complete Phase 4 (US2) — the core new value: live in-context preview while typing.
5. **STOP and VALIDATE**: run `quickstart.md` Scenarios 1 and 2. This alone is a shippable, valuable increment even before the opacity indicator exists.

### Incremental Delivery

1. Setup → Phase 3 (US1) → validate → optional checkpoint.
2. Phase 4 (US2) → validate → this is the MVP described above.
3. Phase 5 (US3) → validate → adds the "which group is being edited" clarity on top.
4. Phase 6 (Polish) → final combined validation and the serialization safety check.

---

## Notes

- No `[P]` marker appears on most tasks because most of them are single, sequential steps within one small file each; `[P]` is used only where genuine cross-story, cross-file parallelism exists (T006 vs. Phases 3–4).
- "Tests" here mean the manual `quickstart.md` scenarios, run as explicit tasks (T002, T005, T009, T010) rather than automated test files, because this repository has no test harness wired up (see `plan.md`).
- Commit after each task or logical group, per repository convention.
