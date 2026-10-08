# Phase 1 Data Model: Text Editor Live Preview and Active-Font Sync

This feature adds **one new runtime-only field** to an existing entity and introduces **no new persisted entities**. All other entities listed are existing model/render types being read, not changed.

## Entities

### SmoTextGroup (existing — `src/smo/data/scoreText.ts`)

A positioned group of one or more text blocks rendered on the score; can be attached to a musical selection or pinned to a fixed page position.

**New field**:

| Field | Type | Default | Serialized? | Notes |
|---|---|---|---|---|
| `beingEdited` | `boolean` | `false` | **No** | Session-only render hint. Set to `true` for the duration the group is open in the text dialog; reset to `false` on commit or cancel. Follows the exact pattern of the existing `edited` and `skipRender` fields on this same class: declared as a class field, **omitted from `SmoTextGroup.defaults` and `SmoTextGroup.nonTextAttributes`**, so `serialize()`/`deserialize()` never touch it. |

**Existing fields relevant to this feature** (unchanged, for reference):

| Field | Type | Relevance |
|---|---|---|
| `textBlocks` | `SmoTextBlock[]` | The blocks whose content gets replaced by the periodic preview update. |
| `elements` | `ElementLike[]` | The live SVG nodes for this group; rebuilt on every render pass — this is *why* opacity must be driven by a model field rather than applied to these nodes directly. |
| `attrs.id` | `string` | Used to find the corresponding `storeScore`/`score` text group in `updateTextGroup()` and to match rendered `<g>` elements. |

**State transitions** (`beingEdited`):

```text
[not open] --dialog opens (new or existing group)--> beingEdited = true
beingEdited = true --user commits (OK)--> beingEdited = false
beingEdited = true --user cancels--> beingEdited = false
```

Only one `SmoTextGroup` can be `beingEdited === true` at a time, because only one modal text dialog can be open at a time (existing modal constraint, unchanged by this feature).

### SmoScoreText (existing — `src/smo/data/scoreText.ts`)

An individual text run within a group, carrying `fontInfo` (`family`, `size`, `weight`, `style`) and `text` content. No new fields. Referenced here because:
- `SmoTextGroup.getActiveBlock()` returns the currently-active `SmoScoreText`, whose `fontInfo` already drives `textGroupEditor.vue`'s `computeFontStyle()` (User Story 1 — pre-existing behavior).
- The periodic preview (User Story 2) replaces `text` (and, if the user is mid-edit across multiple blocks, potentially `fontInfo` of newly-added blocks) via the existing `htmlToTextGroup()` round-trip, unchanged by this feature.

### Text Editing Dialog / Editor (existing UI composition — no new component)

Not a data entity, but documented here for traceability from the spec's "Key Entities" section to concrete code:
- `SuiTextBlockDialogVue` (`src/ui/dialogs/textBlockVue.ts`) — owns dialog lifecycle (open, commit, cancel, remove) and the `groupUndo` bracket.
- `textBlock.vue` — hosts the editor and font/position controls; owns `mode` (`'idle' | 'editing' | 'moving'`).
- `textGroupEditor.vue` — the tiptap-based rich text surface; owns `activeFontStyle` (existing) and will own the new debounce timer driving the periodic preview.

## Derived/computed values (no storage)

| Value | Derived from | Where |
|---|---|---|
| Editor's displayed font (`activeFontStyle`) | `textGroup.getActiveBlock().fontInfo` | `textGroupEditor.vue` (existing `computeFontStyle()`) |
| Rendered opacity for a text group's SVG elements | `textGroup.beingEdited` | `scoreRender.ts` / `textRender.ts` (new: a fixed opacity constant applied when `true`, full opacity otherwise) |

## Validation rules

- `beingEdited` must be `false` for every `SmoTextGroup` on the score except, at most, the one currently open in the dialog (enforced structurally: `textBlockVue.ts` is the only writer, and only one dialog instance can be open at a time).
- `beingEdited` must always be reset to `false` on every dialog-exit path (commit, cancel, and remove), so a thrown error or unusual exit does not leave a text group permanently dimmed. This mirrors how `groupUndo(false)` is already called from every exit path today.
