# Phase 0 Research: Vue-Based Text Properties Dialog

All unknowns below were resolved by reading the existing codebase (no external research was needed — this is an internal migration reusing established in-repo patterns). No `NEEDS CLARIFICATION` markers remain in the Technical Context.

## 1. Creation-function pattern

- **Decision**: `SuiTextBlockDialogVue` is a plain exported function `(parameters: SuiDialogParams) => void`, mirroring `SuiTimeSignatureDialogVue` in `src/ui/dialogs/timeSignature.ts`. It: calls `replaceVueRoot(modalContainerId)`, builds/derives the working `SmoTextGroup` (reusing the new-vs-existing-modifier branching logic currently in `SuiTextBlockDialog`'s constructor), wraps it in a `ref`, defines `commitCb`/`cancelCb` closures that call `view.updateTextGroup` / `view.undo()` as appropriate, and calls `InstallDialog({ root, app: textBlockComp, appParams, dialogParams: parameters, commitCb, cancelCb, removeCb })`.
- **Rationale**: This is the pattern explicitly named in the spec (FR-001) and already proven for a comparably stateful dialog (time signature editing has similar "derive from selection, mutate a working copy, commit/cancel against the score" shape).
- **Alternatives considered**: Building a class-based adapter via `SuiDialogAdapterBase` (`src/ui/dialogs/adapter.ts`) — rejected because that pattern targets the legacy `SuiComponentBase`-based dialog-element rendering (`_constructDialog` in `dialog.ts`), which is exactly the legacy machinery this feature replaces for this dialog.

## 2. Mapping `dialogElements` to Vue controls

- **Decision**: Each entry in `SuiTextBlockDialog.dialogElements.elements` (`src/ui/dialogs/textBlock.ts`) maps to a Vue control as specified by the feature description and confirmed against existing component props:

  | `smoName` | Legacy control | New Vue control |
  |---|---|---|
  | `textEditor` | `SuiTextInPlace` | `TextGroupEditor` (refactored `textGroupEditor.vue`, embedded) |
  | `insertCode` | `SuiDropdownComponent` | `select.vue` |
  | `textDragger` | `SuiDragText` | new `textDragger.vue` shell over the existing `SuiDragSession` |
  | `x` / `y` | `SuiRockerComponent` | `numberInput.vue` (×2) |
  | `font` | `SuiFontComponent` | `fontPicker.vue` |
  | `textBlock` (block list) | `SuiTextBlockComponent` | *dropped* — see Assumption in spec; superseded by `TextGroupEditor`'s single rich-text document |
  | `pagination` | `SuiDropdownComponent` | `select.vue` |
  | `attachToSelector` | `SuiToggleComponent` | plain checkbox (styled like `fontPicker.vue`'s bold/italic checkboxes) |

- **Rationale**: Directly requested by the feature description; every substitute component already exists and is proven in other dialogs (`timeSignature.vue`, `fontPicker.vue` itself uses `select.vue` and `numberInput.vue`).
- **Alternatives considered**: Building a new dedicated toggle component for `attachToSelector` — rejected per spec Assumptions (no dedicated Vue toggle exists yet; a checkbox is consistent with current Vue dialog conventions and avoids scope creep).

## 3. Embedding `TextGroupEditor` (requires refactor)

- **Finding**: `textGroupEditor.vue` currently exists as a **standalone dialog** — it renders its own `dialogContainer` (title bar, OK/Cancel via `dialogButtons.vue`) and owns `commitCb`/`cancelCb` props that call `props.onSave(result)` / `props.onCancel?.()`. It is not yet referenced from any `.ts` creation function (`grep` for `textGroupEditor`/`TextGroupEditor` across `src/` only finds the doc-comment in `textGroupHtml.ts`) — it is inert, unwired code from prior work.
- **Decision**: Refactor `textGroupEditor.vue` into an **embeddable** component for this feature: drop its own `dialogContainer`/OK/Cancel wrapper and `onSave`/`onCancel` props, and instead expose (a) its toolbar + `EditorContent` as the template, and (b) a way for the parent (`textBlock.vue`) to pull the current document out on commit and push a fresh document in when a text-edit session starts/stops. Concretely: keep the TipTap `useEditor`/extensions/`textGroupToHtml`/`htmlToTextGroup` logic, but replace the `onSave`/`onCancel` props with `defineExpose` of a `getTextGroup(): SmoTextGroup` method (or an equivalent `modelValue`/`update:modelValue` v-model on `SmoTextGroup`), and let `textBlock.vue` own the single dialog-level `dialogContainer` + OK/Cancel/Remove.
- **Rationale**: FR-002 requires **one** dialog matching `dialogElements`, not a nested dialog-within-a-dialog; FR-009 requires the outer dialog to hide/disable all other controls while text editing is active, which only the outer component can orchestrate. Since `textGroupEditor.vue` has no callers yet, this refactor is a pure design correction with no external breakage.
- **Alternatives considered**: Leave `textGroupEditor.vue`'s dialog chrome in place and mount it as a "dialog inside the dialog" only while editing is active — rejected: doubles OK/Cancel affordances (violates SC-002's "consistent with the rest of the application's modern dialogs") and doesn't cleanly support FR-014's auto-start-editing-on-open behavior, where editing must be the *initial* state of one unified dialog, not a second modal launched from the first.

## 4. Move/drag-text control

- **Finding**: `SuiDragText` (`src/ui/dialogs/components/dragText.ts`) wraps `SuiDragSession` (`src/render/sui/textEdit.ts`), which does direct SVG/mouse manipulation (`startDrag`/`mouseMove`/`endDrag`/`unrender`) outside of Vue's reactivity, driven by mouse handlers bound at the dialog level (`this.eventSource.bindMouseMoveHandler`, etc., currently in `SuiTextBlockDialog.display()`).
- **Decision**: Keep `SuiDragSession` unmodified. Build a small `textDragger.vue` shell that: on mount/activation constructs a `SuiDragSession` the same way `SuiDragText.startEditSession` does (`textGroup`, `context: view.renderer.pageMap`, `scroller`, `debug`), exposes `mouseDown`/`mouseMove`/`mouseUp` methods for the dialog's mouse handlers to call while `running`, and emits a `stopped` event (with the updated X/Y) when the user clicks "Done Dragging Text". The dialog-level mouse-event binding (currently `SuiTextBlockDialog.mouseMove/mouseDown/mouseUp`) moves into the new creation function (`textBlockVue.ts`), which owns the `eventSource.bindMouse*Handler` calls exactly as the legacy dialog did, and delegates to the `textDragger.vue` instance via a template ref.
- **Rationale**: Matches the spec Assumption verbatim ("reused largely as-is; only its dialog-control shell moves to a Vue component... interaction directly manipulates the SVG canvas outside typical Vue-managed DOM").
- **Alternatives considered**: Rewriting drag as reactive Vue state bound to SVG element positions — rejected per spec Assumptions and because it would touch `render/sui/textEdit.ts` rendering internals, out of scope for a dialog-layer migration.

## 5. Mode state machine (idle / editing / moving)

- **Decision**: Represent dialog mode as a single reactive `Ref<'idle' | 'editing' | 'moving'>` in `textBlock.vue` (or the creation function, passed down), replacing the legacy `show-always` / `show-when-editing` / `hide-when-editing` / `show-when-moving` / `hide-when-moving` CSS classes on `dialogElements` entries. Each control section in the template is gated with `v-if`/`v-show` against this single ref (e.g. text editor + insert-special visible only when `mode !== 'moving'`; text editor active/enabled only... per FR-009, editing hides/disables *everything else*, including insert-special, while `mode === 'editing'`; move control alone visible when `mode === 'moving'`).
- **Rationale**: A single source of truth for mode is simpler than five independent boolean/CSS-class combinations and directly encodes FR-008/FR-009/FR-010 (mutual exclusion is structural — the ref can only hold one value at a time).
- **Alternatives considered**: Independent `isEditing`/`isMoving` booleans — rejected as strictly more state than needed and reintroduces the possibility of both being true simultaneously, which FR-010 explicitly forbids.

## 6. Auto-start-editing behavior (FR-014)

- **Finding**: Legacy `display()` checks `if (!this.modifier.edited) { ...; this.textEditorCtrl.startEditSession(); }` — `SmoTextGroup.edited` (`src/smo/data/scoreText.ts`) is the per-session flag ("indicates not edited this session").
- **Decision**: In the new creation function, after constructing/loading the working `SmoTextGroup`, check `modifier.edited` the same way and initialize the mode ref to `'editing'` (instead of `'idle'`) when false, setting `modifier.edited = true` immediately after, matching legacy timing/semantics exactly.
- **Rationale**: Directly satisfies FR-014 and the spec's edge case ("opening it again later in the same session does not re-trigger auto-edit") using the existing flag with no new state needed.

## 7. Commit/cancel/remove semantics and undo grouping

- **Finding**: Legacy behavior: `view.groupUndo(true)` is opened when the dialog is constructed (both for new-text and existing-text paths); OK calls `view.updateTextGroup(modifier)`; Cancel removes any rendered elements and calls `view.undo()`; Remove calls `view.removeTextGroup(modifier)`; all three then call `_complete()` which closes the undo group (`view.groupUndo(false)`) and unbinds mouse handlers.
- **Decision**: Preserve this sequencing exactly in `textBlockVue.ts`: open the undo group at creation time (before `InstallDialog`), and implement `commitCb`/`cancelCb`/`removeCb` passed into `InstallDialog` to perform the same `updateTextGroup`/`undo`/`removeTextGroup` calls, closing the undo group in each path (relying on `InstallDialog`'s own `commitCb`/`cancelCb`/`removeCb` wrapping, which already calls `trapper.close()` and hides the modal — see `src/ui/dialogs/dialog.ts`).
- **Rationale**: Directly required by FR-011/FR-012/FR-013 and spec Edge Cases (cancel-after-drag reverts both content and position "since both are tracked by the same undo group").
- **Alternatives considered**: None — this is a direct behavioral carry-over, not a design choice.

## 8. Attach-to-selection / pagination coupling (FR requirement, Edge Case)

- **Finding**: Legacy `changed()`: toggling `attachToSelectorCtrl` on calls `_activateAttachToSelector()` and forces `paginationCtrl` to `ONCE`; toggling `paginationCtrl` calls `_resetAttachToSelector()` and forces the toggle off. This is a two-way exclusivity, not just one-way.
- **Decision**: Reimplement as two `watch()`es in `textBlock.vue` (or computed setters) on the pagination `ref` and the attach-to-selection `ref`, each resetting the other exactly as the legacy pair of `_activateAttachToSelector`/`_resetAttachToSelector` methods did (these helper methods on `SuiTextBlockDialog` are pure `modifier` mutations and can be lifted into the new creation function unchanged).
- **Rationale**: Matches spec Acceptance Scenario (User Story 4, #2) and Edge Case verbatim.
