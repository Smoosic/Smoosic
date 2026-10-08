# Contracts: Component & Creation-Function Interfaces

This project is a client-side library with no network API. The "contracts" for this feature are the TypeScript interfaces at the boundaries between: (1) the dialog-installation call site and the creation function, and (2) the top-level Vue component and its child components. These mirror the shape already established by `SuiTimeSignatureDialogVue` / `timeSignature.vue`.

## 1. Creation function: `SuiTextBlockDialogVue`

`src/ui/dialogs/textBlockVue.ts`

```ts
export const SuiTextBlockDialogVue = (parameters: SuiDialogParams) => void
```

- **Input**: `SuiDialogParams` (`src/ui/dialogs/dialog.ts`) — same contract every dialog creation function receives (`view`, `eventSource`, `completeNotifier`, optional `modifier`, etc.). `parameters.modifier`, if present, is an existing `SmoTextGroup`; if absent, a new one is created (mirrors `SuiTextBlockDialog`'s constructor branching).
- **Behavior contract** (from FR-001, FR-011–FR-014):
  1. Derives a working `SmoTextGroup` (new or `deserializePreserveId` of the passed one) and opens an undo group (`view.groupUndo(true)`) before installing the dialog.
  2. Computes initial `DialogMode` per [data-model.md](../data-model.md) (auto-edit on first-session open).
  3. Wires `commitCb` → `view.updateTextGroup(modifier)`; `cancelCb` → revert rendered elements + `view.undo()` when `edited`; `removeCb` → `view.removeTextGroup(modifier)`. All three close the undo group.
  4. Binds `eventSource.bindMouseMoveHandler` / `bindMouseDownHandler` / `bindMouseUpHandler` / `bindMouseClickHandler` at this level (not inside the Vue component) exactly as `SuiTextBlockDialog.display()` does today, delegating to the mounted `textDragger`/text-edit session via refs.
  5. Calls `InstallDialog({ root, app: textBlockComp, appParams, dialogParams: parameters, commitCb, cancelCb, removeCb })` (`InstallDialog` from `src/ui/dialogs/dialog.ts`).
- **Output**: void — side effect is mounting the dialog into the DOM at `replaceVueRoot(modalContainerId)`, same as `SuiTimeSignatureDialogVue`.
- **Explicitly unchanged**: `SuiTextBlockDialog` (`src/ui/dialogs/textBlock.ts`) and all its call sites. This function is net-new and additive; nothing currently constructing `SuiTextBlockDialog` is modified to call it.

## 2. Top-level component: `textBlock.vue`

`src/ui/components/dialogs/textBlock.vue`

```ts
interface Props {
  domId: string;
  label: string;                          // 'Text Properties'
  modifier: Ref<SmoTextGroup>;
  mode: Ref<DialogMode>;                  // 'idle' | 'editing' | 'moving'
  insertOptions: SelectOption[];          // '@@@' Pages / '###' Page Number
  paginationOptions: SelectOption[];      // Once / Every / Odd / Subsequent
  startEditSessionCb: () => void;         // enters 'editing' mode, wired to TextGroupEditor mount
  stopEditSessionCb: (result: SmoTextGroup) => void;   // exits 'editing' mode with edited content
  startMoveCb: () => void;                // enters 'moving' mode
  stopMoveCb: () => void;                 // exits 'moving' mode; dialog refreshes x/y from modifier.ul()
  updateXCb: (value: number) => void;
  updateYCb: (value: number) => void;
  updateFontCb: (font: FontInfo) => void;
  updatePaginationCb: (value: string) => void;
  updateAttachToSelectorCb: (value: boolean) => void;
  insertSpecialCb: (token: string) => void;   // forwarded into the active TextGroupEditor session
  commitCb: () => Promise<void>;          // supplied by InstallDialog
  cancelCb: () => Promise<void>;          // supplied by InstallDialog
  removeCb: () => Promise<void>;          // supplied by InstallDialog
}
```

- **Visibility contract** (FR-008, FR-009, FR-010 — enforced structurally via the single `mode` ref, see data-model.md §`DialogMode`):
  - `mode === 'moving'`: renders only the move-control's "stop dragging" affordance (`textDragger` in its running state) — insert-special, X/Y, font, pagination, attach-to-selection, and the text editor are all absent from the DOM (not merely visually hidden), and OK/Cancel/Remove remain available per current behavior.
  - `mode === 'editing'`: renders the `TextGroupEditor` (embedded) and its own insert-special affordance; every other control (move-text, X, Y, font, pagination, attach-to-selection) is hidden or `disabled`.
  - `mode === 'idle'`: renders everything except the text editor and the active move-drag affordance — Move Text (idle button), X, Y, font, pagination, attach-to-selection, Edit Text (idle button), Remove.

## 3. `TextGroupEditor` (refactored `textGroupEditor.vue`) — embeddable contract

`src/ui/components/dialogs/textGroupEditor.vue`

Current (pre-refactor) props — a standalone mini-dialog:

```ts
// BEFORE (standalone; to be replaced)
interface Props {
  domId: string; label: string; textGroup: SmoTextGroup;
  onSave: (textGroup: SmoTextGroup) => void; onCancel?: () => void;
}
```

New embeddable contract:

```ts
// AFTER (embeddable; owns no dialogContainer/OK/Cancel of its own)
interface Props {
  domId: string;
  textGroup: SmoTextGroup;      // initial content for this edit session
}
interface Expose {
  getTextGroup(): SmoTextGroup; // pulls current TipTap doc, converted via htmlToTextGroup
}
```

- Drops `dialogContainer`, its own OK/Cancel buttons, and the `onSave`/`onCancel` props.
- Keeps the toolbar (bold/italic/superscript/subscript/align/font-family/font-size) and `EditorContent`, and the existing `textGroupToHtml`/`htmlToTextGroup` conversion (`textGroupHtml.ts`, unmodified).
- Parent (`textBlock.vue`) calls `getTextGroup()` (via template `ref`) when the user clicks "Done Editing Text" (`stopEditSessionCb`) or when the outer dialog's OK is clicked while still in `editing` mode.
- Insert Special (FR requirement, spec Assumptions): parent forwards the selected token by calling an exposed `insertAtCursor(token: string)` method (or equivalent editor-chain command), added to `Expose` alongside `getTextGroup`.

## 4. `textDragger.vue` — new move-control shell

`src/ui/components/dialogs/textDragger.vue`

```ts
interface Props {
  domId: string;
  label: string;          // 'Move Text'
  altLabel: string;       // 'Done Dragging Text' (from staticText, matching legacy)
  running: boolean;       // true once activated
}
interface Emits {
  (e: 'start'): void;     // user clicked to begin dragging
  (e: 'stop'): void;      // user clicked to stop dragging
}
interface Expose {
  mouseDown(ev: any): void;
  mouseMove(ev: any): void;
  mouseUp(ev: any): void;
}
```

- Internally constructs/owns a `SuiDragSession` (`src/render/sui/textEdit.ts`) exactly as `SuiDragText.startEditSession`/`stopEditSession` do today — unchanged session class, new Vue-managed lifecycle around it.
- The parent creation function (`textBlockVue.ts`) forwards bound mouse events into this component's exposed methods only while `mode === 'moving'`, replacing `SuiTextBlockDialog.mouseMove/mouseDown/mouseUp`.

## Compatibility note

None of these interfaces are consumed outside this feature yet (`SuiTextBlockDialogVue` has no call sites, matching the spec's explicit scope boundary). They are therefore free to be shaped for this dialog's needs without a deprecation path; the *existing* `SuiTextBlockDialog` public surface (`src/ui/dialogs/textBlock.ts`) is unaffected and its contract is unchanged.
