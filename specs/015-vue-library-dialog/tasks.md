---

description: "Task list for Vue-Based Music Library Dialog"
---

# Tasks: Vue-Based Music Library Dialog

**Input**: Design documents from `/specs/015-vue-library-dialog/`

**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required for user stories), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/component-interfaces.md](./contracts/component-interfaces.md), [quickstart.md](./quickstart.md)

**Tests**: No automated test runner is wired up in this repo (`npm test` is a no-op — see plan.md's Technical Context). No test tasks are included; validation is the manual `quickstart.md` pass in the Polish phase.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Every task includes its exact file path

## Path Conventions

Single front-end project (no frontend/backend split, plan.md's Structure Decision). All new files live under `src/ui/dialogs/` and `src/ui/components/dialogs/`.

---

## Phase 1: Setup

**Purpose**: Establish a clean baseline before touching any files.

- [X] T001 Run `npm run build` and `npm run server` to confirm the project builds and serves cleanly before starting (baseline for later regression comparisons, quickstart.md's Build & Run)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The recursive tree component, the top-level dialog component, and the creation function must all exist and be wired together (dialog opens, top-level library fetched and rendered) before any individual user story's behavior can be exercised.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Create the recursive tree-entry component `src/ui/components/dialogs/treeNode.vue`: define `Props { node: SmoLibrary, selectedUrl: string, expanded: Record<string, boolean>, selectCb: (node: SmoLibrary) => void, toggleCb: (node: SmoLibrary) => void }` (contracts/component-interfaces.md §3); render one `<li class="tree-branch">` containing a `<button class="expander">` (shown only when `node.format === 'library' && node.children.length > 0`, classed `expanded icon-minus`/`collapsed icon-plus` per `props.expanded[node.url]`, `@click` calls `props.toggleCb(props.node)`), an `<a class="tree-link">{{ node.metadata.name }}</a>` (`@click` calls `props.selectCb(props.node)`), and a `<span class="file-type">` classed `icon-book`/`icon-file-music` per `node.format`; when expanded and `node.children.length > 0`, render a nested `<ul>` with one `<treeNode>` per `props.node.children[i]`, forwarding `selectedUrl`/`expanded`/`selectCb`/`toggleCb` unchanged (research.md §3, §5, §7)
- [X] T003 [P] Create the top-level dialog component `src/ui/components/dialogs/library.vue`: define `Props { domId: string, label: string, view: SuiScoreViewOperations, topLib: SmoLibrary, commitCb: () => Promise<void>, cancelCb: () => Promise<void> }` (contracts §2); render `dialogContainer.vue` wrapping a `<ul class="tree tree-root">` with one `<treeNode>` per `props.topLib.children[i]`; declare (not yet wired to behavior) `selectedUrl: Ref<string>` initialized to `''` and `expanded: reactive(Record<string, boolean>)` initialized to `{}`, passed down as `treeNode.vue` props alongside placeholder `selectCb`/`toggleCb` no-op functions
- [X] T004 Create the creation function `src/ui/dialogs/libraryVue.ts`: `export const SuiLibraryDialogVue = async (parameters: SuiDialogParams, config: SmoUiConfiguration): Promise<void>` — construct `const topLib = reactive(new SmoLibrary({ url: config.libraryUrl }))`, `await topLib.load()`, then call `InstallDialog({ root, app: libraryComp, appParams: { domId: rootId, label: 'Music Library', view: parameters.view, topLib, commitCb, cancelCb }, dialogParams: parameters, commitCb, cancelCb })` per contracts §1 (mirrors `src/ui/dialogs/lyricVue.ts`'s structure); `commitCb`/`cancelCb` are placeholder no-ops for now (filled in by T008/T009) (depends on T003 for `library.vue`'s prop shape)

**Checkpoint**: Temporarily wiring `SuiLibraryDialogVue` per quickstart.md's Prerequisites now opens a dialog showing the full top-level tree (icons, structure, nested markup) with no interactive behavior yet — foundation ready for user story work.

---

## Phase 3: User Story 1 - Select and load a song from the library (Priority: P1) 🎯 MVP

**Goal**: A user can open the dialog, select any song entry, and load it into the score view.

**Independent Test**: Open the dialog, select a song (leaf) entry, confirm the Load control becomes enabled, activate it, and confirm the song loads into the score view and the dialog closes (spec.md User Story 1).

- [X] T005 [US1] In `library.vue`, add a `findNodeByUrl(node: SmoLibrary, url: string): SmoLibrary | null` helper (depth-first search over `node.children`), a `selectedNode = computed(() => findNodeByUrl(props.topLib, selectedUrl.value))`, and `canLoad = computed(() => selectedNode.value !== null && selectedNode.value.format !== 'library')`; bind `:enable="canLoad"` on `dialogContainer.vue` (data-model.md, research.md §6)
- [X] T006 [US1] In `library.vue`, implement `selectNode(node: SmoLibrary)` for the song-leaf case — `selectedUrl.value = node.url` — and pass it as the `selectCb` prop to the root-level `treeNode.vue` instances, replacing the placeholder from T003 (data-model.md; folder-specific fetch/auto-expand behavior is added in US2, T011)
- [X] T007 [US1] In `treeNode.vue`, bind the `<li>`'s `selected` class to `props.node.url === props.selectedUrl` (FR-009/FR-010, `tree.css`'s `li.selected > a` highlight)
- [X] T008 [US1] In `library.vue`, implement `confirmLoad()`: `if (canLoad.value) { await props.view.loadRemoteScore(selectedNode.value!.url!); }`; in `libraryVue.ts`, wire this as the `commitCb` passed into `InstallDialog` (FR-012, FR-013, contracts §1)
- [X] T009 [US1] In `library.vue`, implement `cancel()` as a no-op (matching `SuiLibraryAdapter.cancel()`); in `libraryVue.ts`, wire this as the `cancelCb` passed into `InstallDialog` (FR-014)

**Checkpoint**: With a library whose songs are reachable at the top level, a user can select and load a song end-to-end. This is the MVP.

---

## Phase 4: User Story 2 - Drill into a folder to find a song (Priority: P2)

**Goal**: Selecting a not-yet-loaded folder entry fetches its contents and auto-expands it, to any depth.

**Independent Test**: Select a folder entry that has not yet been opened, confirm its contents are fetched and appended under it, confirm it auto-expands, and confirm Load stays disabled since a folder (not a song) is selected (spec.md User Story 2).

- [X] T010 [US2] In `library.vue`, implement `loadChildrenIfNeeded(node: SmoLibrary): Promise<void>` — `if (node.format === 'library' && !node.loaded) { await node.load(); }` (no-op if already loaded) (FR-006, FR-007, data-model.md, research.md §4)
- [X] T011 [US2] In `library.vue`, extend `selectNode(node)` (from T006): after setting `selectedUrl`, when `node.format === 'library'`, `await loadChildrenIfNeeded(node)` then `expanded[node.url] = true` (FR-008)
- [X] T012 [US2] In `library.vue`, confirm `expanded` (declared in T003) is passed to every `treeNode.vue` instance and that newly-loaded nested entries (added to `node.children` by T010's `node.load()`) render correctly without additional wiring, since `topLib` is `reactive()` (research.md §4) — adjust `treeNode.vue`'s child-rendering condition from T002 only if a gap is found
- [X] T013 [US2] Verify `findNodeByUrl` (T005) correctly resolves entries nested inside a folder loaded after the dialog opened (i.e., selection/Load-gating works for songs reached only after one or more lazy loads) — add recursion into freshly-loaded `children` if not already covered by T005's implementation

**Checkpoint**: Users can drill into arbitrarily nested folders; each folder's contents are fetched at most once; Load remains correctly gated at every depth.

---

## Phase 5: User Story 3 - Expand or collapse a folder without changing the selection (Priority: P3)

**Goal**: A folder's own expand/collapse control shows/hides its already-known children independently of the current selection, with no fetch.

**Independent Test**: With a song selected (Load enabled), toggle an unrelated already-loaded folder's expand/collapse control repeatedly and confirm the selection and Load's enabled state never change (spec.md User Story 3).

- [X] T014 [US3] In `library.vue`, implement `toggleExpand(node: SmoLibrary)`: `expanded[node.url] = !expanded[node.url]` — independent of `selectedUrl`/`selectNode`, no fetch (FR-011)
- [X] T015 [US3] In `library.vue`, pass `toggleExpand` as the `toggleCb` prop to the root-level `treeNode.vue` instances, replacing the placeholder from T003; confirm each `treeNode.vue` forwards it unchanged to its own child instances (T002) rather than re-wrapping it (research.md §5)
- [X] T016 [US3] In `treeNode.vue`, confirm the expander button (T002) is rendered, and its click handler wired, only when `node.format === 'library' && node.children.length > 0` — so song entries and empty/not-yet-loaded folders show no expand/collapse control (spec.md Edge Cases, research.md §7)

**Checkpoint**: All three user stories are independently functional, matching every acceptance scenario and edge case in spec.md.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification against the legacy dialog and the spec's success criteria.

- [ ] T017 [P] Visually compare the new dialog against the legacy `SuiLibraryDialog` side by side (folder/song icons, selection highlight, expand/collapse affordance) to confirm `tree.css`/`fonts.css` classes reused in `treeNode.vue` (T002) produce the same appearance with no new CSS (research.md §7)
- [ ] T018 Execute all four validation scenarios in [quickstart.md](./quickstart.md) end-to-end against a demo library with at least two levels of nesting, including the empty-folder and ancestor-collapse edge cases (spec.md Edge Cases); revert the temporary call-site wiring afterward without committing it
- [ ] T019 [P] Perform the quickstart.md "Regression check against the legacy dialog": walk the same folder/song sequence through both `SuiLibraryDialog` and the temporarily-wired `SuiLibraryDialogVue`, confirming identical reachability and Load-gating at every step (SC-001)
- [X] T020 Run `npm run build` a final time to confirm no TypeScript or build errors were introduced by `treeNode.vue`, `library.vue`, or `libraryVue.ts`

**Note on T017-T019**: These require exercising the dialog in an actual browser (per quickstart.md's Prerequisites — temporarily wiring the call site, loading a real/demo library, and interacting with it visually). No browser-automation tool was available while executing this task list, so they remain unchecked; `npm run build` (T001, T020) is the only verification actually performed — the full build compiles cleanly (webpack + `ts-loader` with type-checking enabled) with no errors across all three new files. A human (or a session with browser access) should complete T017-T019 before considering this feature done.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (T004 depends on T003; T002/T003 can run in parallel)
- **User Stories (Phase 3-5)**: All depend on Foundational (Phase 2) completion
  - US1 (Phase 3) has no dependency on US2/US3
  - US2 (Phase 4) extends `selectNode` from US1 (T006) — sequential after Phase 3 in practice, though its own tasks touch the same file rather than a different one
  - US3 (Phase 5) extends the `toggleCb` wiring stubbed in Foundational (T003) — independent of US1/US2's `selectNode` logic, but shares `library.vue`/`treeNode.vue` so is easiest to implement after Phase 3-4 land
- **Polish (Phase 6)**: Depends on all three user stories being complete

### Within Each User Story

- US1: T005 (state) → T006 (selection logic) → T007 (visual highlight, parallel with T008/T009) → T008/T009 (commit/cancel wiring)
- US2: T010 (fetch helper) → T011 (wire into selectNode) → T012/T013 (verification, parallel)
- US3: T014 (toggle logic) → T015 (wire callback) → T016 (verify render condition)

### Parallel Opportunities

- T002 and T003 (Phase 2) touch different files and can run in parallel
- T017 and T019 (Phase 6) are independent verification passes and can run in parallel
- Within US2, T012 and T013 are both verification tasks against already-implemented behavior and can run in parallel

---

## Parallel Example: Foundational Phase

```bash
Task: "Create treeNode.vue in src/ui/components/dialogs/treeNode.vue"
Task: "Create library.vue in src/ui/components/dialogs/library.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (dialog opens, top-level tree renders)
3. Complete Phase 3: User Story 1 (select and load a top-level song)
4. **STOP and VALIDATE**: Run quickstart.md Scenario 1 against a library with at least one top-level song
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → dialog opens, tree renders, nothing is interactive yet
2. Add User Story 1 → select-and-load works for top-level songs (MVP)
3. Add User Story 2 → folder drill-down/lazy-load works to any depth
4. Add User Story 3 → expand/collapse works independently of selection
5. Polish → full quickstart.md pass + regression check against the legacy dialog

---

## Notes

- Only three new files are touched across every task: `src/ui/components/dialogs/treeNode.vue`, `src/ui/components/dialogs/library.vue`, `src/ui/dialogs/libraryVue.ts` (plan.md's Scale/Scope) — no existing file is modified.
- `SuiLibraryDialog`, `SuiLibraryAdapter`, `SuiTreeComponent`, and their call sites (`ribbon.ts`, `defaultRibbon.ts`, `tabletRibbon.ts`) are never touched by any task above; the temporary call-site swap in T001/T018 is for manual verification only and must not be committed (quickstart.md).
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently before continuing.
