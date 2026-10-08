# UI Contract: Text Editor Live Preview and Active-Font Sync

Smoosic is a client-side application/library with no external API for this feature; the relevant "interface" is the boundary between the text dialog's Vue components and the score/render layer. This document fixes that boundary so implementation tasks have an unambiguous contract to build to and verify against.

## 1. `SmoTextGroup.beingEdited` (data → render contract)

**Owner**: `src/smo/data/scoreText.ts`
**Consumers**: `src/render/sui/scoreRender.ts`, `src/render/sui/textRender.ts`

- **Contract**: When `SmoTextGroup.beingEdited === true` at the time `renderTextGroup()` (or the `SuiInlineText`/`SuiTextBlock` render path it calls) draws that group's SVG elements, every element pushed into `gg.elements` for that group MUST be rendered at the feature's fixed reduced-opacity constant. When `false` (the default), elements MUST be rendered at normal, full opacity — i.e., there is no other consumer of this flag and no other code path is allowed to introduce a third opacity state for text groups.
- **Not part of this contract**: persistence. `beingEdited` MUST NOT appear in `SmoTextGroup.serialize()` output or be read in `SmoTextGroup.deserialize()`/`deserializePreserveId()`.

## 2. Dialog lifecycle → `beingEdited` (UI → data contract)

**Owner**: `src/ui/dialogs/textBlockVue.ts` (`SuiTextBlockDialogVue`)

| Dialog event | Required effect on the group's `beingEdited` |
|---|---|
| Dialog opens for a new group (`isNew === true`) | `true`, before the first render of that group |
| Dialog opens for an existing group | `true`, before `view.groupUndo(true)` triggers any re-render |
| `commitCb` runs (OK) | `false`, before the final `finish()`/render so the committed group renders at full opacity |
| `cancelCb` runs (Cancel) | `false`, before `finish()`, regardless of whether `edited` was `true` |
| `removeCb` runs (Delete) | `false` (moot once removed, but must not leak `true` onto any surviving copy, e.g. the undo-buffer snapshot) |

This table is exhaustive: there is no dialog exit path that is allowed to leave `beingEdited === true`.

## 3. Periodic preview trigger (editor → view-operations contract)

**Owner**: `src/ui/components/dialogs/textGroupEditor.vue`
**Downstream**: `SuiScoreViewOperations.updateTextGroup()` (`src/render/sui/scoreViewOperations.ts`) — **unchanged**, reused as-is.

- **Contract**: While `mode === 'editing'`, on every tiptap `update` event, the editor MUST (a) debounce — collapsing bursts of events into one call no more often than the feature's fixed debounce interval — and then (b) call the same content-extraction path `syncEditorIfActive()` already uses today (`htmlToTextGroup(editor.getJSON(), textGroup)`) followed by `props.view.updateTextGroup(...)`, WITHOUT changing `mode` away from `'editing'` and WITHOUT calling `view.groupUndo()` again (the session-level bracket from `textBlockVue.ts` already covers this call).
- **Contract**: This periodic call MUST NOT be made when `mode !== 'editing'` (e.g., while moving or idle), matching the existing guard already used by `syncEditorIfActive()`.
- **Out of scope for this contract**: the exact debounce duration is an implementation constant (see `research.md` §4), not a caller-visible parameter.

## 4. Font sync (pre-existing — verification contract only)

**Owner**: `src/ui/components/dialogs/textGroupEditor.vue`

- **Contract (already implemented, must not regress)**: `computeFontStyle()` MUST reflect `textGroup.getActiveBlock().fontInfo` (`family`, `size`, `weight`, `style`) at the moment the editor is first shown, and `refreshActiveFont()` MUST be invoked (already wired) whenever the active block changes (`activateBlock()`) or the font picker changes the active block's font (`textBlock.vue`'s `onFontChange()`). No interface change is required; this is listed here so Phase 2 tasks include a verification/acceptance task rather than assuming silently that it still holds.

## Non-contract note

No network/API/CLI contract applies to this feature; nothing here is consumed outside this application's own Vue components and render layer, so no `contracts/*.yaml`/OpenAPI-style artifacts are produced.
