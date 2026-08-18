# Contract: `textBlockAtomNode.ts` (new TipTap Node extension)

A small, local TipTap `Node` extension representing one non-active `SmoScoreText` block inside the editor's document. Used only by `textGroupEditor.vue`/`textGroupHtml.ts`.

## Node spec

| Property | Value | Rationale |
|---|---|---|
| `name` | `'textBlockAtom'` | |
| `group` | `'inline'` (so it can sit inside a shared paragraph for LEFT/RIGHT layout) or the block wraps it in its own `<p>` for ABOVE/BELOW layout — the node itself is always inline; ABOVE/BELOW arrangement comes from which paragraph it's placed in, not from the node's own grouping | Keeps one node definition usable in both layout modes (`research.md` §3) |
| `atom` | `true` | Structurally prevents ProseMirror from ever placing a cursor inside its content (FR-003) |
| `selectable` | `true` | Allows the user to select/delete the *whole* block as a unit if desired, but not edit its interior — consistent with "atom" behavior elsewhere in TipTap (e.g. images) |
| `draggable` | `false` | Reordering blocks is done via the add/remove/prev/next controls, not drag-and-drop (out of scope) |

## Attrs

`blockId: string`, `text: string`, `fontFamily: string`, `fontSize: number`, `fontWeight: string`, `fontStyle: string` — see `data-model.md`'s "atom node attributes" table for the source of each.

## `renderHTML` guarantee

Produces an element with:
- `contenteditable="false"` (belt-and-suspenders alongside `atom: true`)
- inline `style` built from `fontFamily`/`fontSize`/`fontWeight`/`fontStyle` attrs, so the read-only block visually matches its real `SmoScoreText.fontInfo` with no dependency on any CSS class list the surrounding page happens to define
- text content equal to the `text` attr, rendered the same way the active block's text is rendered (same `^`/`%` toggle-character-to-`<sup>`/`<sub>` handling), so a block looks identical whether it happens to be the active one or not

## `parseHTML` guarantee

Round-trips its own `renderHTML` output back into the same attrs (needed for TipTap's internal document handling, e.g. undo/redo within a single active-block edit); `textGroupHtml.ts` does not rely on parsing this node from arbitrary/pasted HTML — atom nodes are only ever produced by `textGroupToHtml`, never typed or pasted by the user.

## Non-goals

- No NodeView/Vue component is required for this node — it's presentational and inert, so a plain `renderHTML` spec is sufficient (no interactivity happens inside it).
- Not registered as part of any paste-handling allowlist — the editor's active-block paragraph does not accept pasted `textBlockAtom` nodes; pasted content is treated as plain text, consistent with removing rich formatting.
