# Contract: `textGroupEditor.vue`

Vue component contract (props / emits / exposed methods). This is the boundary `textBlock.vue` (feature 001) and any future embedder programs against — it must keep working for `textBlock.vue` without changes to that file beyond the one additive listener described in `research.md` §5.

## Props (unchanged from feature 001)

| Prop | Type | Notes |
|---|---|---|
| `domId` | `string` | Prefix for element ids, unchanged |
| `textGroup` | `SmoTextGroup` | Source of truth on open; component builds its initial document from it, same as today |

## Emits (new)

| Event | Payload | Fired when |
|---|---|---|
| `active-block-changed` | `FontInfo` (the newly active block's font) | Any control (add / remove / prev / next) changes which block is active. Not fired for the relative-position dropdown, since that never changes which block is active. |

## Exposed methods (`defineExpose`)

| Method | Signature | Change from feature 001 |
|---|---|---|
| `getTextGroup` | `(): SmoTextGroup` | **Unchanged signature.** Returns a `SmoTextGroup` reflecting current block text/fonts/order/relativePosition — same contract callers already rely on |
| `insertAtCursor` | `(token: string): void` | **Unchanged signature and behavior**, but now only meaningful (has an effect) when invoked while the active block's paragraph has focus, since non-active content is no longer editable |

## Behavioral guarantees

1. **Exactly one editable block at all times.** At any moment while the component is mounted, exactly one `SmoScoreText` block (by id) corresponds to editable TipTap content; all others are rendered via the read-only atom node (see `textBlockAtomNode.contract.md`).
2. **No formatting marks in the schema.** The TipTap `extensions` list contains no bold/italic/superscript/subscript/text-align/font-family/font-size extensions. `editor.getJSON()` therefore never contains those mark types, and `getTextGroup()` never needs to read them.
3. **`getTextGroup()` is total.** It must produce a valid `SmoTextGroup` (same `attrs.id`, one `SmoScoreText` per block that existed before including untouched non-active blocks) even if called mid-edit, matching today's behavior where `textBlock.vue` calls it on both commit and on `exitEditing`.
4. **Add/remove/navigate mutate `props.textGroup` in place** (via `setActiveBlock`/`addScoreText`/`removeBlock`/`setRelativePosition`, all pre-existing `SmoTextGroup` methods — see `research.md` §4), consistent with how `textBlock.vue` already treats `props.modifier.value` as a mutable model reference elsewhere in that file (e.g. `onFontChange`, `onXChange`).
5. **Remove is disabled, never destructive, at the boundary.** Invoking the remove affordance when `textGroup.textBlocks.length === 1` MUST be a no-op (control rendered `disabled`), never producing a zero-block group (FR-008).
6. **Prev/next are disabled, never wrap, at the boundaries.** At the first block, "previous" is disabled; at the last block, "next" is disabled (FR-011) — no wraparound.

## Non-goals / explicitly unchanged

- No new prop for "initial active block" — active block continues to be derived from the `textGroup`'s own `activeText`/`getActiveBlock()` state on mount, same as today.
- No change to how `textBlock.vue` decides *when* to mount/unmount this component (`mode === 'editing'`) — out of scope for this feature.
