# Contract: `textGroupHtml.ts`

Pure conversion functions between `SmoTextGroup` and the TipTap document, used only by `textGroupEditor.vue`. Both function names are retained from feature 001 (though `htmlToTextGroup`'s input type will need updating since the source is no longer a plain HTML string) so the change is a body/signature rewrite, not a rename — callers all live inside `textGroupEditor.vue`, which is rewritten together with this file.

## `textGroupToHtml(textGroup: SmoTextGroup, activeBlockId: string): JSONContent`

Renamed input handling from feature 001: now takes the id of the block to render as editable (the caller — `textGroupEditor.vue` — owns which block is active) rather than relying solely on `activeText` flags baked into the group, so re-renders after add/remove/navigate can specify the new active block explicitly without a separate mutation step first.

**Guarantees**:
- If `textGroup.textBlocks` is empty, behaves as if given a single default empty block (see `research.md` §6) and that synthesized block is the active/editable one.
- Output document contains exactly one editable paragraph run (the active block) and one atom node per remaining block, in `textBlocks` array order.
- Document shape (`<p>`-per-block vs. single-`<p>`-inline) is derived solely from `textGroup.relativePosition`, per `research.md` §3.
- Every non-active block's atom node attrs (`blockId`, `text`, `fontFamily`, `fontSize`, `fontWeight`, `fontStyle`) exactly mirror that block's current `SmoScoreText` state — no lossy transformation.

## `htmlToTextGroup(editorJson: JSONContent, original: SmoTextGroup): SmoTextGroup`

**Unchanged signature** from feature 001.

**Guarantees**:
- Returns a new `SmoTextGroup` via `SmoTextGroup.deserializePreserveId`, same as today (preserves `attrs.id`).
- The active block's `SmoScoreText.text` is taken from the editable paragraph's plain text content (with the existing `^`/`%` superscript/subscript toggle-character round-trip preserved — see `markupToInlineHtml`/`paragraphToMarkupText` in the current implementation, reused conceptually); its `fontInfo` is **not** derived from the document (there are no font marks to read) — it is carried over unchanged from `original`'s active block, since font changes flow through `fontPicker.vue`/`onFontChange` in `textBlock.vue`, not through the TipTap document.
- Every non-active block's `SmoScoreText` (text and `fontInfo`) is copied verbatim from its atom node's attrs — since those attrs were themselves sourced unchanged from `original`, this is a no-op round-trip, not a re-derivation.
- `textGroup.relativePosition` is carried over unchanged (this function never changes it — that happens via the dropdown calling `SmoTextGroup.setRelativePosition` directly on the model, not through document conversion).
- `justification` is carried over unchanged from `original` (out of scope per spec Assumptions).

## Removed from feature 001's version of this file

- `fontInfoToRunStyle`, `paragraphFontInfo`, `marksForRun`, `RunMarks`, `justificationToTextAlign`/`textAlignToJustification` (justification is no longer written by this file) — all tied to the per-run mark model being removed. `markupToInlineHtml`/`paragraphToMarkupText`-equivalent logic for the `^`/`%` toggle-character convention is retained, since that convention is unrelated to the removed formatting toolbar and must keep working for compatibility with `src/render/sui/textEdit.ts`.
