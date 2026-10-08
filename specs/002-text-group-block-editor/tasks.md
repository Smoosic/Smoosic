---

description: "Task list template for feature implementation"
---

# Tasks: Block-Aligned Text Group Editor

**Input**: Design documents from `/specs/002-text-group-block-editor/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: This project has no wired automated test runner (`npm test` is a no-op placeholder) and the feature spec does not request TDD. No automated test tasks are generated; each story instead ends with a manual validation task against `quickstart.md`.

**Organization**: Tasks are grouped by user story (from spec.md, priorities P1/P1/P2) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Every task includes an exact file path

## Path Conventions

Single front-end project — all paths are under `src/ui/components/dialogs/`, per plan.md's Project Structure. No `backend/`/`frontend/` split, no new top-level directories.

---

## Phase 1: Setup

**Purpose**: Scaffold the one genuinely new file so later phases only fill in logic.

- [x] T001 Create stub `src/ui/components/dialogs/textBlockAtomNode.ts` with a TipTap `Node.create({ name: 'textBlockAtom', ... })` skeleton declaring `atom: true`, `selectable: true`, `draggable: false`, `group: 'inline'`, `inline: true`, and `addAttributes()` for `blockId`, `text`, `fontFamily`, `fontSize`, `fontWeight`, `fontStyle`, with empty `renderHTML`/`parseHTML` bodies — per [contracts/textBlockAtomNode.contract.md](./contracts/textBlockAtomNode.contract.md)

**Checkpoint**: New file exists and type-checks with no rendering logic yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Replace the per-run-formatting document model with the new active-block/atom-node architecture that every user story builds on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Implement `renderHTML`/`parseHTML` in `src/ui/components/dialogs/textBlockAtomNode.ts`: `renderHTML` emits a `<span data-block-id data-text data-font-family data-font-size data-font-weight data-font-style contenteditable="false" style="...">` whose inner HTML runs the existing `^`/`%` → `<sup>`/`<sub>` conversion (port `markupToInlineHtml`/`escapeHtmlChar` from the current `textGroupHtml.ts`) against the `text` attr; `parseHTML` matches `span[data-block-id]` and reads all six attrs back from the `data-*` attributes — per [contracts/textBlockAtomNode.contract.md](./contracts/textBlockAtomNode.contract.md) "renderHTML guarantee"/"parseHTML guarantee"
- [x] T003 In `src/ui/components/dialogs/textGroupEditor.vue`, replace the `extensions` array: remove `TextAlign`, `Superscript`, `Subscript`, `TextStyle`, `FontFamily`, `FontSize` and their imports; keep the existing `StarterKit.configure({...})` options unchanged; register the new `TextBlockAtomNode` from T002 — per [research.md](./research.md) §2 and [contracts/textGroupEditor.contract.md](./contracts/textGroupEditor.contract.md) "Behavioral guarantees" #2
- [x] T004 In `src/ui/components/dialogs/textGroupEditor.vue`, delete the formatting toolbar `<template>` block (bold/italic/superscript/subscript/align buttons, font-family/font-size selects) and its backing script (`currentFontFamily`, `currentFontSize`, `toggleBold`, `toggleItalic`, `toggleSuperscript`, `toggleSubscript`, `setAlign`, `setFontFamily`, `setFontSize`, `fontFamilies`, `fontSizes`) — per FR-001
- [x] T005 In `src/ui/components/dialogs/textGroupEditor.vue`, add a local `activeBlockId: Ref<string>`, initialized from `props.textGroup.getActiveBlock().attrs.id` and re-derived whenever the `textGroup` prop itself changes (different group loaded) — per [data-model.md](./data-model.md) "Editor-local reactive state"
- [x] T006 Rewrite `textGroupToHtml` in `src/ui/components/dialogs/textGroupHtml.ts` to `textGroupToHtml(textGroup: SmoTextGroup, activeBlockId: string): JSONContent`: synthesize one default empty active block when `textGroup.textBlocks` is empty (per [research.md](./research.md) §6); for each block in array order, emit a plain `{ type: 'text', text: block.text.text }` run when `block.text.attrs.id === activeBlockId`, otherwise a `textBlockAtom` node populated from that block's `text`/`fontInfo`; wrap into one `<p>` per block when `textGroup.relativePosition` is `ABOVE`/`BELOW`, or into a single shared `<p>` when it is `LEFT`/`RIGHT`; set each paragraph's `textAlign` attr from `textGroup.justification` (preserved, never edited by this function) — per [contracts/textGroupHtml.contract.md](./contracts/textGroupHtml.contract.md) and [research.md](./research.md) §3
- [x] T007 Rewrite `htmlToTextGroup` in `src/ui/components/dialogs/textGroupHtml.ts` (signature unchanged: `(editorJson: JSONContent, original: SmoTextGroup): SmoTextGroup`): clone `original` via `SmoTextGroup.deserializePreserveId`; concatenate every plain-text node's `text` across the document into the cloned active block's new `text`, leaving its `fontInfo` untouched; for every `textBlockAtom` node, copy its attrs verbatim onto the matching cloned block (matched by `blockId`); assemble `textBlocks` in document order; leave `relativePosition`/`justification` unchanged from `original` — per [contracts/textGroupHtml.contract.md](./contracts/textGroupHtml.contract.md); delete the now-unused `fontInfoToRunStyle`, `paragraphFontInfo`, `marksForRun`, `RunMarks`, `justificationToTextAlign`, and the writer direction of `textAlignToJustification`
- [x] T008 In `src/ui/components/dialogs/textGroupEditor.vue`, rewire the initial `useEditor({ content: ... })` call and the `watch(() => props.textGroup, ...)` handler to call `textGroupToHtml(props.textGroup, activeBlockId.value)` from T006 via `editor.value?.commands.setContent(...)`

**Checkpoint**: Editor mounts on both single- and multi-block groups with no formatting toolbar, no console/type errors, and round-trips through `getTextGroup()`/`htmlToTextGroup` without crashing. Active-block font styling, atom read-only polish, and block-management controls are not yet implemented — ready for stories to add them.

---

## Phase 3: User Story 1 - Edit one text block at a time with its own font applied automatically (Priority: P1) 🎯 MVP

**Goal**: The active block's paragraph visually renders in its own font/weight/style automatically, with zero manual formatting controls.

**Independent Test**: Open the editor for a single-block group, confirm no toolbar is present, type text and see it take the block's existing font, then change that font via the dialog's external font picker and see the editor update immediately.

### Implementation for User Story 1

- [x] T009 [US1] In `src/ui/components/dialogs/textGroupEditor.vue`'s template, bind the active block's paragraph element to an inline `style` computed from `props.textGroup.getActiveBlock().fontInfo` (`font-family`, `font-size`, `font-weight`, `font-style`) so typed/edited text renders in that font/weight/style with no marks involved — per FR-004 and [research.md](./research.md) §2
- [x] T010 [US1] Add a `watch` in `textGroupEditor.vue` that re-applies the T009 style whenever the active block's `fontInfo` changes externally (e.g. via the dialog's font picker), without rebuilding the whole TipTap document — per spec Acceptance Scenario 3 under User Story 1
- [ ] T011 [US1] Manually validate against [quickstart.md](./quickstart.md) Scenario 1 (no toolbar; typed text matches the active block's font; external font-picker change reflects immediately)

**Checkpoint**: User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - See other blocks in the group as read-only context while editing (Priority: P1)

**Goal**: Non-active blocks render alongside the active one, arranged per `relativePosition`, and structurally reject edits.

**Independent Test**: Open the editor for a 3-block group with the second block active; confirm the first and third are visible but inert (no cursor entry, no content change on click/type), and that their arrangement (own line vs. joined line) matches `relativePosition`.

### Implementation for User Story 2

- [x] T012 [P] [US2] Verify/harden `src/ui/components/dialogs/textBlockAtomNode.ts`'s `renderHTML` so its element structurally rejects focus/typing (`contenteditable="false"` together with `atom: true` in the node spec) — confirms FR-003 under manual click/type testing
- [x] T013 [P] [US2] In `src/ui/components/dialogs/textGroupEditor.vue`, add/adjust CSS so `ABOVE`/`BELOW` layout (one `<p>` per block, from T006) reads as visually distinct lines and `LEFT`/`RIGHT` layout (blocks joined in one shared `<p>`) reads as one visual line with reasonable inter-block spacing — per FR-005
- [ ] T014 [US2] Manually validate against [quickstart.md](./quickstart.md) Scenario 2 (3-block group; `ABOVE`/`BELOW` shows 3 lines in order; clicking/typing into non-active blocks has no effect; setting `relativePosition` to `RIGHT` — directly on the model if the dropdown from User Story 3 isn't built yet — joins them onto one line in order)

**Checkpoint**: User Stories 1 and 2 are both independently functional.

---

## Phase 5: User Story 3 - Manage which blocks exist and which one is active (Priority: P2)

**Goal**: Add/remove/navigate controls and a relative-position dropdown, all living in the editor's own non-editable control strip, plus keeping the dialog's external font picker in sync with the active block as it changes.

**Independent Test**: Add a block (becomes active), navigate prev/next across all blocks (boundary controls disable correctly), remove the active block (disabled at 1 remaining), and change the relative-position dropdown (layout updates for all blocks).

### Implementation for User Story 3

- [x] T015 [P] [US3] Add the relative-position dropdown to `textGroupEditor.vue`'s control strip using `select.vue`, with `SelectOption[]` built from `SmoTextGroup.relativePositions` (ABOVE/BELOW/LEFT/RIGHT); on change, call `props.textGroup.setRelativePosition(...)` — per FR-009
- [x] T016 [P] [US3] Add the add-block (+) control to `textGroupEditor.vue` (icon class `icon-plus`); on click, call `props.textGroup.addScoreText(new SmoScoreText({ ...SmoScoreText.defaults, fontInfo: { ...currently active block's fontInfo } }), props.textGroup.relativePosition)`, then `props.textGroup.setActiveBlock(...)` on the new block and update local `activeBlockId` — per FR-006, FR-012
- [x] T017 [P] [US3] Add the remove-block (X) control to `textGroupEditor.vue` (icon class `icon-cancel-circle`), rendered `disabled` when `props.textGroup.textBlocks.length === 1`; on click, compute the neighbor to activate (the next block, or the previous one if the active block was last) via `indexOf`, call `props.textGroup.removeBlock(...)`, then `setActiveBlock(...)` on the neighbor and update local `activeBlockId` — per FR-007, FR-008
- [x] T018 [P] [US3] Add previous (◄) / next (►) controls to `textGroupEditor.vue` (icon classes `icon-arrow-left`/`icon-arrow-right`), each rendered `disabled` at its boundary (`indexOf(activeBlock) === 0` / `=== textBlocks.length - 1`); on click, call `setActiveBlock(...)` on the adjacent block and update local `activeBlockId` — per FR-010, FR-011
- [x] T019 [US3] After every control added in T015-T018, rebuild the TipTap document via T008's `setContent(textGroupToHtml(props.textGroup, activeBlockId.value))` so the change is reflected immediately (depends on T015-T018)
- [x] T020 [US3] Add `defineEmits<{ 'active-block-changed': [font: FontInfo] }>()` to `textGroupEditor.vue` and fire it from T016-T018's handlers with the newly active block's `fontInfo` — per [contracts/textGroupEditor.contract.md](./contracts/textGroupEditor.contract.md) "Emits" (depends on T016-T018)
- [x] T021 [US3] In `src/ui/components/dialogs/textBlock.vue`, listen for `@active-block-changed` on the embedded `textGroupEditorComp` while `mode === 'editing'` and assign the payload into the existing `fontInfo` ref, which `fontPickerComp` already resyncs from via its pre-existing `watch(() => props.font, ...)` — per [research.md](./research.md) §5 (depends on T020)
- [ ] T022 [US3] Manually validate against [quickstart.md](./quickstart.md) Scenario 3 (add creates+activates a new block with inherited font; remove disabled at 1 block; prev/next disabled at boundaries and step correctly; `textBlock.vue`'s font picker updates on every active-block change) and Scenario 4 (relative-position dropdown relayout, in-progress edits preserved)

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cover the remaining spec edge cases and confirm the feature builds cleanly.

- [ ] T023 [P] Manually validate [quickstart.md](./quickstart.md) Scenario 5 (brand-new/zero-block text item opens with exactly one empty, active, editable block)
- [ ] T024 [P] Manually validate the [quickstart.md](./quickstart.md) "Regression check" (OK/commit and Cancel still behave exactly as feature 001 established)
- [x] T025 Run `npm run build` and fix any TypeScript errors introduced by the new/changed files
- [x] T026 [P] Audit `src/ui/components/dialogs/textGroupEditor.vue` and `textGroupHtml.ts` to confirm no residual imports of `@tiptap/extension-text-align`, `@tiptap/extension-superscript`, `@tiptap/extension-subscript`, or `@tiptap/extension-text-style` remain — confirms FR-001/SC-005

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - Structurally independent of each other in principle, but listed in priority order (P1 → P1 → P2) since all three share `textGroupEditor.vue`/`textGroupHtml.ts` and editing them concurrently risks merge conflicts
- **Polish (Phase 6)**: Depends on all three user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependency on US2/US3
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) — no dependency on US1/US3, but shares files with both
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) — no dependency on US1/US2's specific changes, but its manual validation (T022) is easiest to run once US1/US2 are also in place

### Within Each User Story

- Story-specific rendering/behavior tasks before the manual validation task
- Story complete before moving to the next priority (recommended sequencing, since US1-US3 share `textGroupEditor.vue`/`textGroupHtml.ts`/`textBlock.vue`)

### Parallel Opportunities

- T002 depends on T001 (same file); Foundational tasks T002-T008 are otherwise a mostly-sequential chain through the same two files, so no [P] labels there
- T012, T013 (US2) touch different files (`textBlockAtomNode.ts` vs. `textGroupEditor.vue`) and can run in parallel
- T015, T016, T017, T018 (US3) are independent controls added to the same file; treat as parallel-safe only if coordinated by a single editor of `textGroupEditor.vue`, otherwise do sequentially
- T023, T024, T026 (Polish) are independent verification passes and can run in parallel

---

## Parallel Example: User Story 3

```bash
Task: "Add relative-position dropdown to textGroupEditor.vue"
Task: "Add add-block (+) control to textGroupEditor.vue"
Task: "Add remove-block (X) control to textGroupEditor.vue"
Task: "Add previous/next controls to textGroupEditor.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run quickstart.md Scenario 1 independently
5. This alone delivers FR-001, FR-002, FR-004 — the core correctness fix (no more mismatched per-run formatting)

### Incremental Delivery

1. Setup + Foundational → new document architecture in place, no toolbar, nothing crashes
2. Add User Story 1 → validate independently (active block's font auto-applies)
3. Add User Story 2 → validate independently (siblings render read-only, arranged per relativePosition)
4. Add User Story 3 → validate independently (add/remove/navigate/relative-position controls, font picker sync)
5. Phase 6: Polish — zero-block edge case, OK/Cancel regression check, `npm run build`, dead-import audit

### Notes

- No task introduces a new npm dependency; `@tiptap/vue-3`, `@tiptap/pm`, `@tiptap/starter-kit` are already present. `@tiptap/extension-text-align`, `@tiptap/extension-superscript`, `@tiptap/extension-subscript`, and `@tiptap/extension-text-style` remain installed (other code may reference them) but are no longer imported by this feature's files after T026.
- `src/smo/data/scoreText.ts` is never modified by any task above — every control maps onto an already-existing `SmoTextGroup` method (per [research.md](./research.md) §4).

## Implementation Notes (as executed)

**Design deviations from the task text, decided during implementation for correctness/simplicity — code is authoritative over these task descriptions:**

- **No `<style>` block.** T013's CSS was planned as a scoped `<style>` block in `textGroupEditor.vue`, matching a normal Vue SFC. Discovered during `npm run build` that no `.vue` component in this repo has a `<style>` block, because `css-loader` isn't wired into the webpack config — adding one would have required a new dependency. Fixed by injecting the same CSS via TipTap's own `createStyleTag()` utility (`@tiptap/core`) at module load instead, scoped with an explicit `.text-group-editor-content` class selector.
- **`bold`/`italic` explicitly disabled in `StarterKit.configure(...)` (T003).** The task text didn't call this out, but `StarterKit` enables `Bold`/`Italic` marks by default, each with a native keyboard shortcut (Ctrl+B/Ctrl+I). Removing only the toolbar buttons (T004) would have left those marks reachable via keyboard shortcut, silently reintroducing per-run formatting and contradicting FR-001/research.md §2's "structurally impossible" guarantee. Added `bold: false, italic: false` to the same `StarterKit.configure(...)` call.
- **Zero-block guard added to `textGroupEditor.vue` (not in original task list).** `SmoTextGroup.getActiveBlock()` throws (`this.textBlocks[0].text` on an empty array) if no block is flagged active and none exist. `textGroupToHtml` (T006) already synthesized a default block for *display*, but several call sites in `textGroupEditor.vue` (`activeBlockId` init, `computeFontStyle`, etc.) call `getActiveBlock()` directly against the live `props.textGroup`, which would still crash on a truly empty group. Added `ensureActiveBlock()`, called on mount and inside the `watch(() => props.textGroup, ...)` handler, which pushes one default block onto the live model before anything reads it. In the actual wired-up app this path is currently unreachable — `src/ui/dialogs/textBlockVue.ts` always constructs its working `SmoTextGroup` with one block already present, for both new and existing text items — but the guard keeps the component correct per the spec's own zero-block edge case regardless of caller.
- **`editor.commands.focus()` added after every active-block change (not in original task list).** `setContent` (used to rebuild the document on add/remove/navigate/relative-position change) resets ProseMirror's selection, so without this the newly active block was structurally editable but not actually focused — the user would need an extra click. Exact caret placement inside the new active block isn't guaranteed (a generic `.focus()`, not a computed `setTextSelection`), but it's a safe, low-risk improvement toward FR-006's "immediately editable."
- **`textBlock.vue`'s font picker is now visible during `mode === 'editing'`, not just idle mode (part of T021, not spelled out in the task text).** The original template only rendered `fontPickerComp` in the idle-mode branch. Since FR-013 requires font-editing controls to stay in sync with active-block navigation, and navigation only happens *during* editing, the font picker had to become reachable while editing too — otherwise "keep it in sync" would apply to a hidden control. Hoisted `<fontPickerComp>` out of the idle-only branch to render whenever `mode !== 'moving'`; Page Behavior/Attach-to-Selection stay idle-only (unaffected, out of scope). `onFontChange` also now calls `editorRef.value?.refreshActiveFont()` while editing, so a font-picker change is reflected in the editor immediately in both directions.
- **`textBlock.vue`'s `syncEditorIfActive()` no longer force-resets the active block to `textBlocks[0]`.** The old implementation always did `setActiveBlock(textBlocks[0].text)` after pulling from the editor, because the old `htmlToTextGroup` never set `activeText` on any block. The new `htmlToTextGroup` (T007) correctly carries the real active block's flag through, so the forced reset was deleted (it would have silently discarded whatever block the user had navigated to before clicking "Done Editing Text"/OK) and `relativePosition` sync was added instead (defensive, since the dropdown already mutates the live model in place).
- **Verification performed**: `npm run build` (T025) — ran clean (TypeScript + webpack) after every substantive change, including after the deviations above. `SuiTextBlockDialogVue` is permanently wired into `src/ui/menus/text.ts` already (unlike at feature 001's time), so this build genuinely type-checks all touched files via the real entry point, not a temporary wiring.
- **Not performed**: T011, T014, T022, T023, T024 all require driving the dialog in a live browser (typing, clicking add/remove/prev/next, watching layout/focus behavior). No browser or browser-automation tool (`chromium-cli`, `playwright`, `puppeteer`) was available in this session, and installing one wasn't authorized. In its place, a manual code-review pass was done after the initial implementation and caught two real bugs (the `bold`/`italic` mark leak and the zero-block crash, both listed above) plus the `syncEditorIfActive()` regression, all fixed before this note was written. A human (or a future session with browser access) should still run through [quickstart.md](./quickstart.md) — code review can't observe actual TipTap cursor/focus/DOM behavior — before treating this feature as verified end-to-end.
