# Phase 0 Research: Text Editor Live Preview and Active-Font Sync

All items below were resolved by reading the existing implementation rather than by external research — this feature extends code that already exists (`specs/002-text-group-block-editor`). There were no open technology choices; the questions were entirely "how does the current mechanism behave, and can it be reused."

## 1. Is the editor-font-matches-active-block behavior (User Story 1) already implemented?

- **Decision**: Treat it as an existing behavior to preserve and cover with acceptance scenarios, not new code to write from scratch.
- **Rationale**: `src/ui/components/dialogs/textGroupEditor.vue` already computes `activeFontStyle` from `props.textGroup.getActiveBlock().fontInfo` (`computeFontStyle()`), applies it via `:style="activeFontStyle"` on the tiptap `<EditorContent>`, and refreshes it on `activateBlock()` (block switch) and via the exposed `refreshActiveFont()` method, which `textBlock.vue`'s `onFontChange()` already calls when the font picker changes the active block's font. This satisfies FR-001/FR-002 and User Story 1's acceptance scenarios as-is.
- **Alternatives considered**: Re-implement font sync from scratch. Rejected — it would duplicate working code and risk regressing the existing behavior; the task list should instead include a verification/acceptance-test task, not a rewrite.

## 2. How can in-progress edits be pushed to the score without ending the edit session (User Story 2)?

- **Decision**: Reuse `SuiScoreViewOperations.updateTextGroup(modifier.value)` (already called once, at `exitEditing()`/`handleCommit()` in `textBlock.vue`), but also call it periodically **while `mode.value === 'editing'`**, driven by a debounce timer on tiptap's `editor.on('update', ...)` event inside `textGroupEditor.vue`. The content to push is produced the same way `syncEditorIfActive()` already does today (`htmlToTextGroup(editor.value.getJSON(), props.textGroup)`), just invoked more often and without transitioning `mode` out of `'editing'`.
- **Rationale**: `updateTextGroup()` already (a) snapshots the previous state into `storeUndo.addBuffer(..., UndoBuffer.bufferSubtypes.UPDATE)` and (b) triggers `this.renderer.rerenderTextGroups()`, which is exactly "apply content to the score and redraw" — no new score-mutation or render-trigger API is needed.
- **Alternatives considered**:
  - A separate "preview-only" render path that doesn't touch `updateTextGroup()`/undo. Rejected — it would duplicate the existing render pipeline and risk the preview and the "real" committed content drifting apart.
  - Firing the update on every keystroke with no debounce. Rejected on performance grounds — see item 3.

## 3. Does calling `updateTextGroup()` repeatedly break the single-undo-step guarantee (FR-005/FR-006)?

- **Decision**: No change needed to the undo system — the existing `groupUndo(true)`/`groupUndo(false)` + `UndoBuffer.grouping` mechanism already coalesces any number of `addBuffer()` calls made between them into one `UndoSet`, and `undo()` (in `src/smo/xform/undo.ts`) applies every buffered entry in that set in reverse order in a single `view.undo()` call. Traced concretely: for an existing text group, the *first* periodic `updateTextGroup()` call captures the true pre-edit state (since `storeScore.textGroups` hasn't changed yet); each subsequent call captures the immediately-prior in-progress state. Undoing the whole grouped set (as `cancelCb()` already does via one `view.undo()`) replays all entries newest-to-oldest, and because each replay fully overwrites the text group, the last entry applied (the oldest capture, i.e. the true original) wins — restoring exactly the pre-edit score, matching FR-006/SC-004.
- **Rationale**: `textBlockVue.ts` already wraps the whole dialog session in `view.groupUndo(true)` (on open) / `view.groupUndo(false)` (in every exit path — commit, cancel, remove), so periodic calls to `updateTextGroup()` automatically land inside the existing group with no new code required in the undo layer.
- **Alternatives considered**: Introduce a separate "provisional" state outside the undo buffer entirely (e.g., a shadow copy rendered without touching `storeUndo`). Rejected — more code, and it would diverge from the pattern every other multi-step dialog in this codebase already relies on (`pitch.ts`, `dynamics.ts`, `noteHead.ts`, etc. all use the same `groupUndo` bracketing).

## 4. How should the periodic update be paced to avoid a rendering-performance regression?

- **Decision**: Debounce on a pause in typing (fire once, a few hundred milliseconds after the last keystroke; re-arm on every new keystroke), not a fixed-interval poll and not a per-keystroke call.
- **Rationale**: `SuiScoreRender.rerenderTextGroups()` — invoked transitively by `updateTextGroup()` — calls `unrenderTextGroups()` then `renderTextGroups()`, which **unrenders and re-renders every text group in the score**, not just the one being edited (see `src/render/sui/scoreRender.ts`). Per Constitution Principle #3 (SVG rendering performance / avoiding repainting penalties), invoking this on every keystroke would scale badly on scores with many text groups. A short debounce keeps the preview feeling "live" (within the ~1s target in SC-002) while bounding how often the full text-group re-render pass runs.
- **Alternatives considered**: Throttling with a fixed minimum interval instead of debouncing. Rejected as unnecessary extra complexity — a trailing-edge debounce alone satisfies "update shortly after the user pauses" (spec's own phrasing) without needing a separate interval timer, and matches the simplest implementation.

## 5. Where should the "being edited" state live so reduced opacity survives repeated re-renders?

- **Decision**: A new boolean field on `SmoTextGroup` (e.g. alongside the existing `edited`/`skipRender` fields), read by the rendering layer (`scoreRender.ts` and/or `textRender.ts`) every time that text group's SVG is (re)drawn, rather than something the dialog/UI layer applies to DOM nodes after the fact.
- **Rationale**: `renderTextGroup()` calls `gg.elements.forEach(RemoveElementLike)` and rebuilds fresh SVG elements on **every** call (including every periodic preview update), so any opacity styling applied directly to a DOM node from the dialog code would be destroyed on the very next re-render. The flag must therefore travel with the model object itself — exactly the precedent already set by `skipRender: boolean` (`// don't render if it is being edited`) on the same class, which is consulted by the renderer, not the UI. `SuiInlineText.render()` already builds a `<g>` element (via `openGroup()`) per text block and assigns CSS classes (`vf-<id>`, `<id>`, `suiInlineText`, purpose) — adding one more conditional class (or a direct `style.opacity`) at that point is a natural, minimal extension.
- **Alternatives considered**: Toggling a CSS class on the rendered elements from `textBlockVue.ts`/`textBlock.vue` after each `updateTextGroup()` call. Rejected — timing-fragile (would need to run after every internal re-render, including ones triggered by other code paths) and violates Constitution Principle #4 (rendering concerns belong in the render layer, not the dialog layer).
- **Serialization safety**: Following the same pattern as `edited`/`skipRender`, this field must be excluded from `SmoTextGroup.defaults` and `SmoTextGroup.nonTextAttributes` so `serialize()`/`deserialize()` never read or write it — it is pure session/runtime state, never persisted, so legacy scores are unaffected (Constitution Principle #1).

## 6. What opacity value counts as "slightly" reduced (FR-008/FR-009)?

- **Decision**: A single fixed constant in the reasonable "dimmed but still legible" range (e.g. roughly 0.5–0.6 opacity), defined once near the other rendering constants (e.g. alongside `SuiTextStrokes` in `src/render/sui/svgHelpers.ts`), not user-configurable.
- **Rationale**: The spec explicitly treats this as a fixed, non-configurable visual affordance (see spec Assumptions), so no settings/preferences plumbing is needed. Picking one constant keeps the change small and testable via a single quickstart visual check.
- **Alternatives considered**: Deriving opacity from the existing `text-highlight` stroke style used for the active-block outline (`_outlineBox` in `textRender.ts`). Rejected — that stroke is a *different* affordance (outlining the active block inside the group) and is unrelated to whole-group opacity; conflating them would make the two features harder to reason about independently.

## Outcome

No `[NEEDS CLARIFICATION]` items remain. All decisions above are grounded in the current codebase (`src/ui/dialogs/textBlockVue.ts`, `src/ui/components/dialogs/textBlock.vue` and `textGroupEditor.vue`, `src/smo/data/scoreText.ts`, `src/render/sui/scoreRender.ts`, `src/render/sui/textRender.ts`, `src/render/sui/scoreViewOperations.ts`, `src/smo/xform/undo.ts`). Ready for Phase 1 design.
