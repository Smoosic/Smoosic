# Phase 1 Data Model: Vue-Based Text Properties Dialog

This feature does not introduce new persisted data. It reuses the existing score data model (`SmoTextGroup` / `SmoScoreText`, `src/smo/data/scoreText.ts`) unchanged and adds only transient, dialog-scoped Vue reactive state. This document describes both: the existing entities as consumed by the new dialog, and the new transient view-state shape.

## Existing Entities (reused, not modified)

### Text Group (`SmoTextGroup`)

The score text item being edited as a whole.

| Field | Type | Notes |
|---|---|---|
| `textBlocks` | `SmoTextBlock[]` | One or more `{ text: SmoScoreText, position, activeText }` entries; `TextGroupEditor` represents all of them as paragraphs in one rich-text document |
| `justification` | `number` (`SmoTextGroup.justifications.{LEFT,CENTER,RIGHT}`) | Read/written by `TextGroupEditor` via paragraph text-align |
| `pagination` | `number` (`SmoTextGroup.paginations.{ONCE,EVERY,ODD,SUBSEQUENT}`) | Bound to the Page Behavior dropdown; forced to `ONCE` when `attachToSelector` is enabled |
| `attachToSelector` | `boolean` | Bound to the Attach to Selection checkbox; mutually exclusive with pagination choice other than `ONCE` |
| `selector` | selection reference | Set from `view.tracker.selections[0].selector` when attach is activated; reset to default when deactivated |
| `musicXOffset` / `musicYOffset` | `number` | Set relative to the attached note/measure's box when attach is activated |
| `edited` | `boolean` | Session flag — drives FR-014 auto-start-editing; set `true` the first time the dialog is shown for this group in the session |
| `elements` | `ElementLike[]` | Rendered SVG elements for this group; cleared/rebuilt on cancel and on remove |
| `logicalBox` | `SvgBox \| null` | Used to compute current X/Y (`ul()`) and to position the dialog |

Relevant methods reused unchanged: `setActiveBlock`, `getActiveBlock`, `ul()`, `offsetX(offset)`, `offsetY(offset)`, `serialize()`, `SmoTextGroup.deserializePreserveId(...)`.

### Active Text Block (`SmoScoreText`, via `getActiveBlock()`)

The specific block within the text group currently being edited.

| Field | Type | Notes |
|---|---|---|
| `text` | `string` | Plain text content, with `^`/`%` toggle markers for superscript/subscript (see `textGroupHtml.ts`) |
| `fontInfo` | `FontInfo` (`family`, `size`, `weight`, `style`) | Bound to `fontPicker.vue`; one font per block, driven by the *active* paragraph in `TextGroupEditor` |
| `x` / `y` | `number` | Absolute position; `SmoTextGroup.ul()` derives the group's upper-left from its blocks |

No fields are added to either entity. `SuiTextBlockComponent`'s block-list-management concerns (add/remove/reorder blocks, independent per-block relative placement) are dropped per the spec Assumptions — `TextGroupEditor` derives the block list from paragraphs in its document on save (`htmlToTextGroup` in `textGroupHtml.ts`), so no separate "block list" state is needed in the new dialog.

## New Transient View State (dialog-scoped, not persisted)

Owned by the creation function (`textBlockVue.ts`) and/or `textBlock.vue`, discarded when the dialog closes.

### `DialogMode`

```ts
type DialogMode = 'idle' | 'editing' | 'moving';
```

- Single source of truth for control visibility (see [research.md](./research.md) §5).
- Initialized to `'editing'` if `modifier.edited === false` (FR-014), else `'idle'`.
- Transitions: `idle → editing` (user activates text edit) · `editing → idle` (user finishes editing) · `idle → moving` (user activates Move Text) · `moving → idle` (user stops dragging). `editing ↔ moving` direct transitions are not permitted (FR-010) — the UI only exposes moving-mode entry when not editing, and vice versa.

### Working copy references

| Name | Type | Purpose |
|---|---|---|
| `modifier` | `Ref<SmoTextGroup>` | The working copy being edited; same object instance the legacy dialog calls `this.modifier` |
| `activeScoreText` | derived from `modifier.getActiveBlock()` | Used for highlighting and font-control binding |
| `xPosition` / `yPosition` | `Ref<number>` | Mirrors `modifier.ul().x/.y`; written back via `modifier.offsetX/offsetY` on change, and refreshed after a drag completes |
| `fontInfo` | `Ref<FontInfo>` | Mirrors `activeScoreText.fontInfo`; passed to `fontPicker.vue` |
| `pagination` | `Ref<number>` | Mirrors `modifier.pagination`; passed to `select.vue` |
| `attachToSelector` | `Ref<boolean>` | Mirrors `modifier.attachToSelector`; plain checkbox |
| `insertCode` | transient, no persisted ref | `select.vue` selection immediately inserted into the active `TextGroupEditor` session and not retained |
| `edited` (dialog-level flag) | `boolean` (non-reactive, closure-scoped) | Mirrors legacy `SuiTextBlockDialog.edited` — tracks whether *anything* changed since open, used to decide whether Cancel needs to call `view.undo()` |
| `isNew` | `boolean` (closure-scoped) | Mirrors legacy `isNew` — whether this is a brand-new text group (affects undo buffer subtype) |

## State Transition Summary

```
Dialog opens
  └─ modifier.edited === false? ──yes──▶ mode = 'editing' (auto-start), modifier.edited = true
                                 └─no───▶ mode = 'idle'

mode = 'idle'
  ├─ user activates Move Text ─────────▶ mode = 'moving'   (all controls but stop-drag hidden)
  └─ user activates Edit Text ─────────▶ mode = 'editing'  (all other controls hidden/disabled)

mode = 'moving'
  └─ user clicks "Done Dragging Text" ─▶ mode = 'idle', xPosition/yPosition refreshed from modifier.ul()

mode = 'editing'
  └─ user clicks "Done Editing Text" ──▶ mode = 'idle', activeScoreText/fontInfo refreshed from modifier.getActiveBlock()

Any mode
  ├─ OK ─────▶ commit: view.updateTextGroup(modifier); close undo group; hide dialog
  ├─ Cancel ─▶ if edited: remove rendered elements, view.undo(); close undo group; hide dialog
  └─ Remove ─▶ unrender + view.removeTextGroup(modifier); close undo group; hide dialog
```
