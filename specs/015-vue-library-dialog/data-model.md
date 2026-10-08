# Phase 1 Data Model: Vue-Based Music Library Dialog

This feature introduces no new persisted data. It reuses the existing `SmoLibrary` model (`src/ui/fileio/library.ts`) unchanged, wrapped in Vue reactivity, plus dialog-scoped Vue state for selection and expansion that exists only while the dialog is open.

## Existing Entities (reused, not modified)

### Library Entry (`SmoLibrary`, `src/ui/fileio/library.ts`)

A node in the remote library tree — corresponds to the spec's **Library Entry** key entity.

| Field | Type | Notes |
|---|---|---|
| `url` | `string \| undefined` | The entry's own remote location; used as its identity/key in the tree UI (`selectedUrl`, `expanded` are keyed by this) |
| `format` | `string` | `'library'` = a Folder entry (may contain children, may need its own fetch); any other value (`'smoosic'`, `'mxml'`, `'midi'`, `'abc'`) = a Song leaf entry, matching the format check already used by `SuiTreeComponent` |
| `metadata` | `kvPair` (`Record<string,string>`) | `metadata.name` is the entry's display label |
| `children` | `SmoLibrary[]` | Populated eagerly for entries embedded directly in an already-fetched payload, or lazily via `load()` for a Folder entry not yet expanded |
| `loaded` | `boolean` | Whether this entry's own remote contents have been fetched; gates whether `load()` performs a fetch or is a no-op |
| `load(): Promise<void>` | method | Fetches this entry's own remote JSON (if `!loaded`) and populates `children`/`metadata`/`format` in place via `initialize()`; already-loaded entries resolve immediately with no fetch (unchanged) |

Reused unchanged: `SmoLibrary.formatTypes` (`['smoosic', 'library', 'mxml', 'midi', 'abc']`), `SmoLibrary.load()`, `SmoLibrary.initialize()`.

### Score View Operation (`SuiScoreViewOperations`, `src/render/sui/scoreViewOperations.ts`)

| Method | Notes |
|---|---|
| `loadRemoteScore(url: string): Promise<any>` | Loads the given song URL into the score view; reused unchanged (research.md §1, §9) |

### Application Configuration (`SmoUiConfiguration`, `src/ui/configuration.ts`)

| Field | Notes |
|---|---|
| `libraryUrl?: string` | The top-level library's remote URL, used to construct the root `SmoLibrary`; reused unchanged |

## New Transient Types (dialog-scoped Vue state, never persisted)

### Reactive Root Tree

```ts
const topLib: SmoLibrary = reactive(new SmoLibrary({ url: config.libraryUrl }));
```

- Constructed once in `SuiLibraryDialogVue` (`src/ui/dialogs/libraryVue.ts`), `await`ed via `topLib.load()` *before* the dialog is installed (research.md §1), then passed to `library.vue` as a prop. All of `topLib`'s nested `children` (and their own `children`, recursively) are transparently reactive via Vue's deep-proxy behavior (research.md §4) — no separate mirrored structure is created.

### Expansion State

```ts
const expanded: Record<string, boolean> = reactive({});
// keyed by SmoLibrary.url; absent or false = collapsed, true = expanded
```

- Corresponds to the spec's **Expansion State** key entity. Owned by `library.vue`. `isExpanded(node) => !!expanded[node.url]`. Set to `true` automatically whenever a Folder entry is selected (FR-008); toggled independently by each `treeNode.vue`'s own expand/collapse control (FR-011) without going through selection.

### Current Selection

```ts
const selectedUrl: Ref<string> = ref('');
const selectedNode = computed<SmoLibrary | null>(() => findNodeByUrl(topLib, selectedUrl.value));
const canLoad = computed<boolean>(() => selectedNode.value !== null && selectedNode.value.format !== 'library');
```

- Corresponds to the spec's **Current Selection** key entity. `findNodeByUrl(node, url)` is a small new pure helper (depth-first search over `node.children`) — the recursive-tree equivalent of the legacy `SuiLibraryAdapter.tree` hash lookup, re-derived on demand from the live reactive tree rather than maintained as a separate flat index.

## Operations (behavior, not new entities)

Owned by `library.vue` (or a small composable it uses), reading/writing the state above.

| Operation | Effect |
|---|---|
| `selectNode(node: SmoLibrary)` | `selectedUrl.value = node.url` → if `node.format === 'library'`: `await loadChildrenIfNeeded(node)`, then `expanded[node.url] = true` (auto-expand, FR-008); if it is a Song, nothing further (FR-009) |
| `loadChildrenIfNeeded(node: SmoLibrary)` | If `node.format === 'library' && !node.loaded`: `await node.load()` (mutates `node.children`/`node.loaded` in place — picked up reactively, FR-006); if already loaded, no-op (FR-007) |
| `toggleExpand(node: SmoLibrary)` | `expanded[node.url] = !expanded[node.url]` — independent of `selectedUrl`, no fetch (FR-011) |
| `confirmLoad()` (wired as `commitCb`) | If `canLoad.value`: `await view.loadRemoteScore(selectedNode.value!.url!)` (FR-012); if not, no-op (FR-013) — either way, `InstallDialog`'s wrapper closes the dialog afterward |
| `cancel()` (wired as `cancelCb`) | No-op, matching `SuiLibraryAdapter.cancel()` (FR-014) — `InstallDialog`'s wrapper closes the dialog |

## State Transition Summary

```
SuiLibraryDialogVue(parameters, config)
  └─ topLib = reactive(new SmoLibrary({ url: config.libraryUrl }))
  └─ await topLib.load()                          (research.md §1 — dialog not yet mounted)
  └─ InstallDialog({ app: library.vue, appParams: { topLib, view, commitCb, cancelCb }, ... })

Dialog open (single mode — no edit/dialog split, research.md §2)
  ├─ select a Folder entry ──────▶ selectNode(node) ─▶ loadChildrenIfNeeded(node) [fetch if needed] ─▶ expanded[node.url] = true
  │                                                                                    (canLoad becomes false)
  ├─ select a Song entry ────────▶ selectNode(node)                                    (canLoad becomes true)
  ├─ activate a folder's own
  │  expand/collapse control ────▶ toggleExpand(node)         (selectedUrl/canLoad unchanged)
  ├─ activate Load (OK) ─────────▶ confirmLoad(); close dialog
  └─ activate Cancel / Escape ───▶ cancel(); close dialog
```
