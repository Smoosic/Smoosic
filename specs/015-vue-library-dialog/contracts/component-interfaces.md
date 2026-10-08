# Contracts: Creation Function and Component Interfaces

This project is a client-side library with no network API. The "contracts" for this feature are the TypeScript interfaces at the boundaries between: (1) the dialog-installation call site and the creation function, (2) the top-level Vue component and its child components, and (3) the new recursive tree component and itself. These mirror the shape already established by `SuiLyricDialogVue` / `lyric.vue` (`010-vue-lyric-dialog`), adapted for this dialog's async-before-mount requirement (research.md §1) and its single-control, no-edit-mode shape (research.md §2).

## 1. Creation function: `SuiLibraryDialogVue`

`src/ui/dialogs/libraryVue.ts`

```ts
export const SuiLibraryDialogVue = async (
  parameters: SuiDialogParams,
  config: SmoUiConfiguration
): Promise<void>
```

- **Input**: `SuiDialogParams` (`src/ui/dialogs/dialog.ts`) — same contract every dialog creation function receives — plus `config: SmoUiConfiguration` as a distinct second argument, mirroring the legacy `SuiLibraryDialog.createAndDisplay(parameters, config)` call shape exactly (research.md §9), rather than relying on the optional `parameters.config`.
- **Behavior contract** (from FR-001, FR-005):
  1. Constructs `const topLib = reactive(new SmoLibrary({ url: config.libraryUrl }))` and `await topLib.load()` — **before** installing the dialog, so nothing is mounted into the DOM until the top-level library data is ready (research.md §1).
  2. Calls `InstallDialog({ root, app: libraryComp, appParams: { domId: rootId, label: 'Music Library', view: parameters.view, topLib, commitCb, cancelCb }, dialogParams: parameters, commitCb, cancelCb })` (`InstallDialog` from `src/ui/dialogs/dialog.ts`), where `commitCb`/`cancelCb` are the dialog-level `confirmLoad`/`cancel` operations from data-model.md, wrapped for the parent's own bookkeeping (mirroring `SuiLyricDialogVue`'s `commitCb`/`cancelCb` pattern).
- **Output**: `Promise<void>` — resolves once the dialog has been mounted (not once the user closes it); the `await` boundary exists solely to satisfy step 1 above. Side effect is mounting the dialog into the DOM at `replaceVueRoot(modalContainerId)`, same as `SuiLyricDialogVue`.
- **Explicitly unchanged**: `SuiLibraryDialog`/`SuiLibraryAdapter` (`src/ui/dialogs/library.ts`) and all their call sites. This function is net-new and additive; nothing currently constructing `SuiLibraryDialog` is modified to call it (research.md §8).

## 2. Top-level component: `library.vue`

`src/ui/components/dialogs/library.vue`

```ts
interface Props {
  domId: string;
  label: string;                              // 'Music Library'
  view: SuiScoreViewOperations;
  topLib: SmoLibrary;                         // already-loaded, reactive root (see data-model.md)
  commitCb: () => Promise<void>;              // supplied by InstallDialog
  cancelCb: () => Promise<void>;              // supplied by InstallDialog
}
```

- **Rendering contract** (FR-002, FR-004, research.md §2, §7):
  - Renders `dialogContainer.vue` with `:enable="canLoad"` (research.md §6), wrapping a single `<ul class="tree tree-root">` containing one `<treeNode>` per entry in `props.topLib.children`.
  - No mode split exists (unlike the lyric/chord dialogs) — every control that exists is visible at all times.
- **Internal state and operations**: `selectedUrl`, `expanded`, `selectedNode`, `canLoad`, and the `selectNode`/`loadChildrenIfNeeded`/`toggleExpand`/`confirmLoad`/`cancel` operations from data-model.md live here. `selectNode`/`toggleExpand` are passed down to the root-level `treeNode.vue` instances (and, from there, to every nested level) as the `selectCb`/`toggleCb` props described below. `confirmLoad`/`cancel` are what `props.commitCb`/`props.cancelCb` (received from `InstallDialog`, see contract 1) ultimately invoke.

## 3. Recursive tree-entry component: `treeNode.vue`

`src/ui/components/dialogs/treeNode.vue` — the codebase's first self-referencing Vue component (research.md §3).

```ts
interface Props {
  node: SmoLibrary;                            // this entry
  selectedUrl: string;                          // current selection, for highlighting this node if it matches
  expanded: Record<string, boolean>;            // shared expansion-state map, keyed by url (data-model.md)
  selectCb: (node: SmoLibrary) => void;         // invoked when this node's label is activated
  toggleCb: (node: SmoLibrary) => void;         // invoked when this node's own expand/collapse control is activated
}
```

- **Rendering contract** (FR-004, FR-008, FR-010, FR-011, research.md §7):
  - Renders one `<li class="tree-branch" :class="{ selected: node.url === selectedUrl, collapsed: !isExpanded }">`.
  - Shows a `<button class="expander">` — classed `expanded icon-minus` when `isExpanded` is true, `collapsed icon-plus` when false — **only if** `node.format === 'library' && node.children.length > 0` (matching the legacy component's own condition, research.md §7); clicking it calls `props.toggleCb(props.node)` and does **not** call `selectCb`. A Song entry (or an as-yet-unloaded/empty Folder) renders no expand/collapse control at all (spec Edge Cases).
  - Renders an `<a class="tree-link">{{ node.metadata.name }}</a>`; clicking it calls `props.selectCb(props.node)`.
  - Renders a `<span class="file-type">` classed `icon-book` when `node.format === 'library'`, else `icon-file-music`.
  - When `isExpanded` is true and `node.children.length > 0`, renders a nested `<ul>` containing one `<treeNode>` per entry in `props.node.children`, **forwarding the same `selectedUrl`, `expanded`, `selectCb`, `toggleCb` props unchanged** (research.md §5 — no re-emitting, no re-wrapping).
- **No internal selection/expansion state**: `treeNode.vue` is purely presentational with respect to tree-wide state — it reads `props.selectedUrl`/`props.expanded` to decide how to render itself and calls the two callback props on user interaction; it owns no `ref`/`reactive` state of its own beyond purely local, non-tree-affecting UI concerns (none are needed for this feature).

## Contract Summary Table

| Boundary | Direction | Shape |
|---|---|---|
| `ribbon.ts` (future caller, out of scope) → `SuiLibraryDialogVue` | call | `(parameters: SuiDialogParams, config: SmoUiConfiguration) => Promise<void>` |
| `SuiLibraryDialogVue` → `InstallDialog` | call | `DialogInstallParams` (`src/ui/dialogs/dialog.ts`, unchanged) |
| `libraryVue.ts` → `library.vue` | props | `{ domId, label, view, topLib, commitCb, cancelCb }` |
| `library.vue` → `treeNode.vue` (any level) | props | `{ node, selectedUrl, expanded, selectCb, toggleCb }` |
| `treeNode.vue` → `library.vue` | callback invocation | `selectCb(node)`, `toggleCb(node)` — plain function calls, not Vue emits (research.md §5) |
| `treeNode.vue` → `treeNode.vue` (child level) | props | Same shape as `library.vue` → `treeNode.vue`, forwarded unchanged |
