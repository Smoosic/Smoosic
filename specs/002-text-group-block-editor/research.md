# Phase 0 Research: Block-Aligned Text Group Editor

All items below were resolved by reading the existing implementation (`textGroupEditor.vue`, `textGroupHtml.ts`, `textBlock.vue`, `src/smo/data/scoreText.ts`, `src/render/sui/textRender.ts`) rather than external sources — no items in the Technical Context were left as `NEEDS CLARIFICATION`, and the spec's own Assumptions section already resolved the business-level ambiguities. This document records the technical decisions the plan depends on.

## 1. How to keep non-active blocks visible but non-editable inside TipTap

**Decision**: Author a small custom TipTap Node extension (`textBlockAtomNode.ts`) marked `atom: true`, `selectable: true`, `draggable: false`, with a `parseHTML`/`renderHTML` pair that renders the block's raw text inside a styled inline element (`<span>` for LEFT/RIGHT-flow, or the node itself sits inside its own `<p>` for ABOVE/BELOW-flow) carrying `contenteditable="false"` and the block's font-family/size/weight/style baked into an inline `style` attribute. The node's attrs hold the source block's id, text, and font/weight/style so `textGroupHtml.ts` can round-trip it back into an unchanged `SmoScoreText` without needing to re-parse styles out of the DOM.

**Rationale**: TipTap/ProseMirror atom nodes are the standard mechanism for "this content lives in the document but the user can't type into it" (used for things like TipTap's own `mention` or `image` nodes). Combining `atom: true` with `contenteditable="false"` in `renderHTML` prevents the cursor from ever entering the node's interior, satisfies FR-003 (non-editable, non-splittable), and keeps the non-active blocks physically present in the same document/layout flow as the active block so relative-position arrangement (FR-005) applies uniformly to both.

**Alternatives considered**:
- *Render non-active blocks as separate DOM outside the TipTap document (plain HTML siblings)* — rejected: would require re-implementing paragraph/inline layout (line-breaking, spacing) twice — once in TipTap for the active block, once in hand-written HTML for the rest — to keep FR-005's arrangement consistent, doubling the layout logic for no benefit.
- *Use ProseMirror decorations to visually gray out normal editable paragraphs instead of atom nodes* — rejected: decorations don't block editing on their own; would need an additional `editable()`-per-node guard or `filterTransaction`, which is more code and more failure surface than an atom node that is structurally non-editable.

## 2. How the active block gets its font without a toolbar

**Decision**: Drop `@tiptap/extension-text-style` (`TextStyle`/`FontFamily`/`FontSize`) and the bold/italic toggle marks from the editor's extension list entirely — the active block's single paragraph is plain, unmarked text. The active block's font-family/size/weight/style is instead applied as a CSS style directly on the paragraph DOM node (via `renderHTML`/a class binding keyed off the current active block's `fontInfo`, refreshed whenever the active block changes), the same way the read-only atom nodes get their style, just on an editable node instead of an atom one.

**Rationale**: This directly satisfies FR-001 (no manual formatting controls) and FR-004 (font auto-applies, no per-run marks possible) — because the marks that would let a user bold half a block no longer exist in the schema, it is structurally impossible to produce mixed formatting within one block, matching the data model's one-font-per-`SmoScoreText` invariant exactly rather than just hiding the buttons that would create it.

**Alternatives considered**:
- *Keep the marks/extensions installed but hide the toolbar buttons* — rejected: users could still trigger marks via browser-native shortcuts (Ctrl+B, Ctrl+I) or paste, silently reintroducing the exact per-run inconsistency the feature removes; also `paragraphFontInfo()` in the current `textGroupHtml.ts` only reads the *first* run's marks today, so any such divergence would already be silently discarded/wrong.
- *Apply font via a ProseMirror plugin that force-normalizes marks on every transaction* — rejected: significantly more code than simply not registering the mark extensions, for the same end state.

## 3. Mapping `relativePosition` to document layout

**Decision**: Reuse the existing renderer's own semantics (`SuiTextBlock` in `src/render/sui/textRender.ts`, lines ~785-811): `ABOVE`/`BELOW` move the running position onto a new vertical line, `LEFT`/`RIGHT` continue on the current line. The editor's TipTap document mirrors this at a coarser grain (since `SmoTextGroup.setRelativePosition` already forces one `relativePosition` value onto every block in the group — confirmed in `scoreText.ts`): when the group's `relativePosition` is `ABOVE` or `BELOW`, the document is one `<p>` per block, in `textBlocks` array order (matching spec Acceptance Scenario 1 under User Story 2); when it is `LEFT` or `RIGHT`, the document is a single `<p>` containing all blocks' content/atoms inline, in `textBlocks` array order (matching Acceptance Scenario 2, which specifies "existing order" rather than the renderer's actual mirrored left-growth for `LEFT`).

**Rationale**: Grounding the new/paragraph-vs-inline split in the renderer's own use of the same field avoids inventing new semantics for `relativePosition`, and keeps the editor's preview intuitively consistent with what the score will actually show. Exact pixel-level geometry (e.g. `LEFT` growing backwards from a shared anchor) is a rendering-engine concern, not something the spec asks the editing surface to replicate — the spec's own acceptance criteria only requires order-preserving same-line joining.

**Alternatives considered**:
- *Replicate exact renderer geometry (including `LEFT`'s reverse growth) in the editor* — rejected: the spec explicitly only requires "existing order" for same-line arrangement (spec Acceptance Scenario 2), and pixel-perfect geometry inside a plain-text editing surface (not an SVG canvas) isn't meaningful — TipTap has no notion of "grow right-to-left from an anchor point."

## 4. Block-management controls: where they live and how they map to existing `SmoTextGroup` methods

**Decision**: Add a new control-strip row inside `textGroupEditor.vue` itself (per spec: "add some controls to the non-editable part of the control"), built from plain Bootstrap-style icon buttons matching the existing `icon-pencil`/`icon-move` convention in `textBlock.vue` (`icon-plus` for add, `icon-cancel-circle` for remove, `icon-arrow-left`/`icon-arrow-right` for prev/next, all present in `src/styles/fonts.css`) plus one `select.vue` instance for the relative-position dropdown (reusing the same `SelectOption[]`-driven component already used for "Insert Special" and "Page Behavior" in `textBlock.vue`). Each control maps directly onto an existing `SmoTextGroup` method: add → `addScoreText()` (called with the current `relativePosition`, not the method's `LEFT` default) + `setActiveBlock()`; remove → `removeBlock()` + `setActiveBlock()` on a neighbor; prev/next → `indexOf()` + `setActiveBlock()` on the adjacent array entry; relative-position change → `setRelativePosition()` (which already updates both the group field and every block's own `position` in one call).

**Rationale**: `SmoTextGroup` already exposes exactly the primitives this feature needs (confirmed by reading `scoreText.ts`) — no data-model changes are required, only a UI layer that drives these existing methods and keeps a local "which block is active" concept in the editor's own reactive state (mirrored onto the model via `setActiveBlock`, the same mechanism `textBlock.vue` already uses today).

**Alternatives considered**:
- *Put the control strip in `textBlock.vue` (the parent dialog) instead of inside `textGroupEditor.vue`* — rejected: the spec frames these as part of "the [text editor] control" (i.e. the editor component's own chrome), and keeping them co-located with the editor keeps `textGroupEditor.vue` a self-contained, independently testable unit per feature 001's existing embeddable-component convention.

## 5. Keeping `textBlock.vue`'s font picker in sync with a navigable active block

**Decision**: `textGroupEditor.vue` exposes (via `defineExpose`, alongside the existing `getTextGroup`/`insertAtCursor`) a reactive way for the parent to observe the current active block's `fontInfo` — a Vue `emit('active-block-changed', fontInfo)` fired whenever add/remove/prev/next changes which block is active. `textBlock.vue` listens for it while `mode === 'editing'` and assigns the result into its existing `fontInfo` ref, which `fontPickerComp` already resyncs from via its pre-existing `watch(() => props.font, ...)` (see `fontPicker.vue`, which already carries a comment anticipating exactly this: "Resync from the parent when the underlying font changes externally... the active text block changes after a rich-text edit session").

**Rationale**: `fontPicker.vue` already has the resync plumbing in place and unused until now, confirming this is the intended integration point rather than a new mechanism; this satisfies FR-013 with a minimal, additive change to `textBlock.vue` and no change to `fontPicker.vue` at all.

**Alternatives considered**:
- *Poll `props.modifier.value.getActiveBlock()` on an interval or on every render* — rejected: unnecessary complexity and potential staleness/flicker versus an explicit change event fired exactly when the active block actually changes.

## 6. Zero-block groups

**Decision**: In `textGroupHtml.ts`'s group→document conversion, if `textGroup.textBlocks` is empty, synthesize a single empty active block (same defaults `SmoScoreText.defaults` already used elsewhere) before building the document, exactly as `SuiTextBlock`'s renderer already does today (`src/render/sui/textRender.ts` lines ~630-636 construct a default block when `params.blocks.length < 1`).

**Rationale**: Matches an existing, already-established convention in the codebase for the identical situation, satisfying the spec's edge case ("editor MUST behave as if one empty block exists") with no new invented behavior.

**Alternatives considered**: None seriously considered — this is a direct precedent match.

## Summary

No unresolved unknowns remain. All decisions above are grounded in code already present in the repository (renderer semantics, existing `SmoTextGroup` API surface, existing `fontPicker.vue` resync plumbing, existing icon set), which keeps this feature a pure UI-layer rewrite of `textGroupEditor.vue`/`textGroupHtml.ts` plus one small new TipTap extension file, with no changes to `src/smo/data/scoreText.ts`.
