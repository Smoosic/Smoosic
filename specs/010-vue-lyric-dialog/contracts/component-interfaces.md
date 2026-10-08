# Contracts: Component & Creation-Function Interfaces

This project is a client-side library with no network API. The "contracts" for this feature are the TypeScript interfaces at the boundaries between: (1) the dialog-installation call site and the creation function, and (2) the top-level Vue component and its child components. These mirror the shape already established by `SuiTextBlockDialogVue` / `textBlock.vue`.

## 1. Creation function: `SuiLyricDialogVue`

`src/ui/dialogs/lyricVue.ts`

```ts
export const SuiLyricDialogVue = (parameters: SuiDialogParams) => void
```

- **Input**: `SuiDialogParams` (`src/ui/dialogs/dialog.ts`) — same contract every dialog creation function receives (`view`, `eventSource`, `completeNotifier`, etc.). Unlike `SuiTextBlockDialogVue`, `parameters.modifier` is not used as the seed for a working copy — the working `SmoLyric` is instead derived per-note from `view.tracker.selections[0]` and subsequent navigation, matching `SuiLyricDialog`'s constructor (which takes no `modifier` either).
- **Behavior contract** (from FR-001, FR-009–FR-014):
  1. Captures the initially selected note's selector (deep copy) and loads its lyric for verse `0` (`loadNote`, see data-model.md).
  2. Initializes `mode` to `'editing'` unconditionally (FR-009).
  3. Wires `commitCb`/`cancelCb` → the identical `finish()` behavior (FR-014, research.md §8); no `removeCb` (research.md §7).
  4. Calls `InstallDialog({ root, app: lyricComp, appParams, dialogParams: parameters, commitCb, cancelCb })` (`InstallDialog` from `src/ui/dialogs/dialog.ts`).
- **Output**: void — side effect is mounting the dialog into the DOM at `replaceVueRoot(modalContainerId)`, same as `SuiTextBlockDialogVue`.
- **Explicitly unchanged**: `SuiLyricDialog` (`src/ui/dialogs/lyric.ts`) and all its call sites. This function is net-new and additive; nothing currently constructing `SuiLyricDialog` is modified to call it.

## 2. Top-level component: `lyric.vue`

`src/ui/components/dialogs/lyric.vue`

```ts
interface Props {
  domId: string;
  label: string;                              // 'Lyric Editor'
  view: SuiScoreViewOperations;
  initialSelector: SmoSelector;
  commitCb: () => Promise<void>;              // supplied by InstallDialog
  cancelCb: () => Promise<void>;              // supplied by InstallDialog
}
```

- **Visibility contract** (FR-007, FR-008 — enforced structurally via the single `mode` ref, see data-model.md `DialogMode`):
  - `mode === 'editing'`: renders `lyricEditor.vue` (bound to `lyricText`) plus next-note, previous-note, delete, and "done editing" controls. Verse, Y Adjustment, and Font are absent from the DOM.
  - `mode === 'dialog'`: renders Verse (`select.vue`), Y Adjustment (`numberInput.vue`), Font (`fontPicker.vue`, family/size), and an "edit lyrics" control. `lyricEditor.vue` and the next/previous/delete controls are absent from the DOM.
- **Internal state and operations**: `currentSelector`, `verse`, `currentLyric`, `lyricText`, `translateY`, `fontInfo`, `mode`, and the `loadNote`/`commitIfChanged`/`navigate`/`deleteCurrent`/`enterDialogMode`/`enterEditingMode` operations from data-model.md live here (or are passed in from `lyricVue.ts` as refs/callbacks — implementation detail left to the tasks phase, not part of this contract).

## 3. `lyricEditor.vue` — embeddable plain-text TipTap editor

`src/ui/components/dialogs/lyricEditor.vue`

```ts
interface Props {
  domId: string;
  text: string;              // initial plain text for this note's lyric
  fontInfo: FontInfo;        // lyric's own font (family/size/weight/style), rendered as the editor's display font
}
interface Expose {
  getText(): string;         // current plain-text content, for the parent to read on commit/navigate/delete
}
```

- Built on the same `@tiptap/vue-3` + `@tiptap/starter-kit` foundation as `textGroupEditor.vue`, but with every mark/formatting extension disabled (bold, italic, strike, code, links, headings, lists, blockquote, etc.) and no toolbar — a single plain-text paragraph, matching FR-006 ("no styling controls ... just plain text in the lyric font").
- Enter/hard-break is suppressed (no multi-paragraph documents) since `SmoLyric.text` is a single string with no line-break concept (research.md, `noteModifiers.ts`).
- Space and `-` are ordinary characters here (research.md §12) — no keyboard-driven note navigation is implemented inside the editor; navigation is exclusively through the parent's next/previous controls (FR-010).
- Re-initializes its document (`setContent`) whenever `props.text` changes (i.e., whenever the parent calls `loadNote` for a new selector/verse), analogous to `textGroupEditor.vue`'s `watch(() => props.textGroup, ...)`.
- Applies `props.fontInfo` as the panel's display font via the same "explicit CSS rule on the ProseMirror paragraph" technique `textGroupEditor.vue` already uses (`createStyleTag`), since plain CSS inheritance from an ancestor style did not reliably reach TipTap's generated `<p>` in that component.

## 4. Reused components — no contract changes

`select.vue`, `numberInput.vue`, and `fontPicker.vue` are consumed with their existing, unmodified prop contracts (see `specs/001-text-block-dialog-vue/contracts/component-interfaces.md` for `numberInput.vue`'s and `select.vue`'s established usage patterns). The only usage note specific to this feature: `numberInput.vue` for Y Adjustment must be given explicit `minValue`/`maxValue` (research.md §5) since its defaults would otherwise forbid the negative offsets the legacy control allowed.

## Compatibility note

None of these interfaces are consumed outside this feature yet (`SuiLyricDialogVue` has no call sites, matching the spec's explicit scope boundary). They are therefore free to be shaped for this dialog's needs without a deprecation path; the *existing* `SuiLyricDialog` public surface (`src/ui/dialogs/lyric.ts`) is unaffected and its contract is unchanged.
