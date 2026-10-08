# Phase 1 Data Model: Block-Aligned Text Group Editor

This feature introduces no new persisted fields and no changes to `SmoTextGroup`/`SmoScoreText` serialization. It consumes the existing score-text model as-is and adds one small transient (non-persisted) shape used only inside the TipTap document while the editor is open.

## Existing entities (unchanged, consumed as-is)

### `SmoTextGroup` (`src/smo/data/scoreText.ts`)

| Field | Type | Relevant behavior for this feature |
|---|---|---|
| `textBlocks` | `SmoTextBlock[]` | Ordered list of blocks; array order is the order the editor renders/navigates blocks in |
| `relativePosition` | `number` (`SmoTextGroup.relativePositions`: `ABOVE`\|`BELOW`\|`LEFT`\|`RIGHT`) | Single group-wide layout setting; drives whether the editor lays blocks out one-per-line or joined on one line (FR-005, FR-009) |
| `justification` | `number` | Out of scope for this feature (spec Assumptions) — read/preserved, never written by the new editor |

**Relevant methods** (all pre-existing, no changes needed):

- `getActiveBlock(): SmoScoreText` — falls back to `textBlocks[0]` if none flagged active
- `setActiveBlock(scoreText: SmoScoreText | null): void` — flips exactly one block's `activeText` to `true`
- `setRelativePosition(position: number): void` — sets the group field **and** every block's own `position` in one call (this is why "a single relativePosition for all blocks" holds in practice even though `position` is nominally per-block)
- `addScoreText(scoreText: SmoScoreText, position?: number): void` — appends a block
- `removeBlock(scoreText: SmoScoreText): void` — removes by id
- `indexOf(scoreText: SmoScoreText): number` — used to compute prev/next neighbor
- `firstBlock(): SmoScoreText`

### `SmoTextBlock` (interface, `src/smo/data/scoreText.ts`)

| Field | Type | Relevant behavior for this feature |
|---|---|---|
| `text` | `SmoScoreText` | The block's content + font |
| `position` | `number` | Kept in sync with group `relativePosition` via `setRelativePosition`; not edited independently by this feature |
| `activeText` | `boolean` | Exactly one `true` at a time while editing (FR-002); run-time only, not serialized (see `SmoTextBlockSer`, which omits it) |

### `SmoScoreText` (`src/smo/data/scoreText.ts`)

| Field | Type | Relevant behavior for this feature |
|---|---|---|
| `text` | `string` | Plain text content (may contain the existing `^`/`%` superscript/subscript toggle-character markup — unaffected by this feature, still round-tripped by `textGroupHtml.ts`) |
| `fontInfo` | `FontInfo` (`family`, `size`, `weight`, `style`) | The block's single font/weight/style; drives the active block's editable-text styling (FR-004) and the read-only rendering of every non-active block (FR-003) |

**Invariant this feature relies on and must not break**: one `fontInfo` per `SmoScoreText`, applied to its entire `text` — there is no sub-run formatting field anywhere in this model, so the editor cannot legitimately produce mixed formatting within one block.

## New transient shape: atom node attributes

Not persisted — exists only as TipTap/ProseMirror node attrs while `textGroupEditor.vue` is mounted, produced and consumed entirely within `textGroupHtml.ts` and `textBlockAtomNode.ts`.

| Attr | Type | Purpose |
|---|---|---|
| `blockId` | `string` | The source `SmoScoreText.attrs.id`, used to write the (unchanged) text back onto the correct block on conversion back to `SmoTextGroup` |
| `text` | `string` | Raw block text (already markup-processed the same way the active block's text is, so rendering is visually consistent) |
| `fontFamily` | `string` | From `block.text.fontInfo.family` |
| `fontSize` | `number` | From `block.text.fontInfo.size` |
| `fontWeight` | `string` | From `block.text.fontInfo.weight` (`'bold'` \| `'normal'`) |
| `fontStyle` | `string` | From `block.text.fontInfo.style` (`'italic'` \| `'normal'`) |

**Validation rule**: every non-active `SmoTextBlock` in `textGroup.textBlocks` MUST have exactly one corresponding atom node in the generated document, in the same array order, and no other representation (FR-003).

## Editor-local reactive state (`textGroupEditor.vue`, not persisted, not exported)

| State | Type | Purpose |
|---|---|---|
| active block id | `string` (derived from `props.textGroup.getActiveBlock().attrs.id`, kept in a local `ref` while the component owns navigation) | Determines which block's paragraph is real editable content vs. an atom node on every document rebuild |
| block count / index | derived from `props.textGroup.textBlocks.length` and `props.textGroup.indexOf(activeBlock)` | Drives the previous/next control's disabled state (FR-011) and the remove control's disabled state when only one block remains (FR-008) |

## State transitions

```
[one block active] --add(+)--> [new empty block appended, becomes active; previous active block becomes read-only]
[one block active] --remove(X), count > 1--> [active block deleted; neighbor (next, or previous if it was last) becomes active]
[one block active] --remove(X), count == 1--> [disabled; no-op]
[block i active] --prev(◄), i > 0--> [block i-1 active]
[block i active] --prev(◄), i == 0--> [disabled; no-op]
[block i active] --next(►), i < count-1--> [block i+1 active]
[block i active] --next(►), i == count-1--> [disabled; no-op]
[any state] --relativePosition dropdown change--> [group.relativePosition updated; document re-laid-out; active block unchanged]
```
