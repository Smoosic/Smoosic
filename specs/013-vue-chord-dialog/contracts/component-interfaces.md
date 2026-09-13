# Contracts: Component, Creation-Function, and Chord-Text Interfaces

This project is a client-side library with no network API. The "contracts" for this feature are the TypeScript interfaces at the boundaries between: (1) the dialog-installation call site and the creation function, (2) the top-level Vue component and its child components, and (3) the new pure chord-text encode/decode module and its caller. These mirror the shape already established by `SuiLyricDialogVue` / `lyric.vue` (`010-vue-lyric-dialog`).

## 1. Creation function: `SuiChordChangeDialogVue`

`src/ui/dialogs/chordChangeVue.ts`

```ts
export const SuiChordChangeDialogVue = (parameters: SuiDialogParams) => void
```

- **Input**: `SuiDialogParams` (`src/ui/dialogs/dialog.ts`) — same contract every dialog creation function receives. Like `SuiLyricDialogVue`, the working `SmoLyric` (chord symbol) is derived per-note from `view.tracker.selections[0]` and subsequent navigation, not from `parameters.modifier`, matching `SuiChordChangeDialog`'s constructor (no `modifier` param either).
- **Behavior contract** (from FR-001, FR-014–FR-024):
  1. Captures the initially selected note's selector (deep copy) and loads its chord symbol for ordinality `0` (`loadNote`, see data-model.md).
  2. Initializes `mode` to `'editing'` unconditionally (FR-016).
  3. Wires `commitCb`/`cancelCb` → the identical `finish()` behavior (FR-023, research.md §8); no `removeCb` (research.md §8).
  4. Calls `InstallDialog({ root, app: chordComp, appParams, dialogParams: parameters, commitCb, cancelCb })` (`InstallDialog` from `src/ui/dialogs/dialog.ts`).
- **Output**: void — side effect is mounting the dialog into the DOM at `replaceVueRoot(modalContainerId)`, same as `SuiLyricDialogVue`.
- **Explicitly unchanged**: `SuiChordChangeDialog` (`src/ui/dialogs/chordChange.ts`) and all its call sites. This function is net-new and additive; nothing currently constructing `SuiChordChangeDialog` is modified to call it.

## 2. Top-level component: `chord.vue`

`src/ui/components/dialogs/chord.vue`

```ts
interface Props {
  domId: string;
  label: string;                              // 'Edit Chord Symbol'
  view: SuiScoreViewOperations;
  initialSelector: SmoSelector;
  commitCb: () => Promise<void>;              // supplied by InstallDialog
  cancelCb: () => Promise<void>;              // supplied by InstallDialog
}
```

- **Visibility contract** (FR-014 — enforced structurally via the single `mode` ref, see data-model.md `DialogMode`):
  - `mode === 'editing'`: renders `chordEditor.vue` (bound to the chord's segments) plus the Symbols dropdown, Text Position dropdown, next-note, previous-note, delete, and "done editing" controls. Ordinality, Y Adjustment, Font, and Adjust Note Width are absent from the DOM.
  - `mode === 'dialog'`: renders Ordinality (`select.vue`), Y Adjustment (`numberInput.vue`), Font (`fontPicker.vue`, family/size), Adjust Note Width (`toggle.vue`), and an "edit chord symbols" control. `chordEditor.vue`, the Symbols/Text Position dropdowns, and the next/previous/delete controls are absent from the DOM.
- **Internal state and operations**: `currentSelector`, `ordinality`, `currentChord`, `currentTextType`, `translateY`, `fontInfo`, `adjustWidth`, `mode`, and the `loadNote`/`commitIfChanged`/`navigate`/`deleteCurrent`/`insertGlyph`/`enterDialogMode`/`enterEditingMode` operations from data-model.md live here (or are passed in from `chordChangeVue.ts` as refs/callbacks — implementation detail left to the tasks phase, not part of this contract).

## 3. `chordEditor.vue` — embeddable TipTap editor for one chord symbol

`src/ui/components/dialogs/chordEditor.vue`

```ts
interface Props {
  domId: string;
  text: string;              // initial raw chord-text (SmoLyric.text token format) for this note's chord symbol
  fontInfo: FontInfo;        // chord symbol's own font (family/size), rendered as the editor's display font
  textType: number;          // currentTextType from the parent — the type to apply to the *next* inserted content
}
interface Expose {
  getText(): string;         // current content re-encoded to the raw chord-text format (via encodeChordText), for the parent to read on commit/navigate/delete/preview
  insertGlyph(glyphKey: string): void;   // inserts one chordGlyph node at the current cursor position, marked per props.textType — used by the parent's Symbols-dropdown handler
}
```

Emits: `advance: [mode: 'commit' | 'skip']` is **not** part of this contract — unlike `lyricEditor.vue` (`011-lyric-editor-auto-advance`), this feature does not request hyphen/space auto-advance for chord symbols (out of scope; see spec Assumptions). `preview: []` **is** emitted, debounced (~400ms after the last edit), matching `lyricEditor.vue`'s existing `preview` emit (`012-lyric-live-preview-cursor`). `textTypeChange: [type: number]` **is** emitted (added post-implementation, research.md §10) whenever the `^`/`%` keyboard shortcuts toggle the typing text-position; the parent (`chord.vue`) listens for it and updates the same `currentTextType` ref the Text Position dropdown writes to, so both input methods stay consistent.

- Built on `@tiptap/vue-3` + `@tiptap/starter-kit`, with every formatting extension disabled except a locally-defined atomic `chordGlyph` Node (research.md §4) and the stock `@tiptap/extension-superscript`/`@tiptap/extension-subscript` marks (research.md §5) — no toolbar, no bold/italic/link/list/etc.
- Enter/hard-break is suppressed (single-line content), matching `lyricEditor.vue`.
- A keyboard-shortcut extension recognizes `b`, `#`, `+`, `-`, `(`, `)`, `/` (membership test against `ChordSymbolGlyphs`, `src/common/vex.ts`) and calls the equivalent of `insertGlyph(char)` instead of inserting the literal character (research.md §3); every other character is inserted as ordinary text, marked with the currently-active `Superscript`/`Subscript` mark per `props.textType` (research.md §5). The same extension additionally recognizes `^` (toggle toward Subscript) and `%` (toggle toward Superscript) — a locally-defined mapping, deliberately the reverse of the persisted format's own `^`/`%` convention (research.md §10) — computing the new type via `SuiInlineText.getTextTypeResult` and emitting `textTypeChange` with the result, rather than inserting the character.
- Converts `props.text` ⇄ its TipTap document via `decodeChordText`/`encodeChordText` (`chordText.ts`, §4 below) plus its own `ChordSegment ⇄ ProseMirror node` mapping (research.md §6); re-initializes its document whenever `props.text` changes (i.e., whenever the parent calls `loadNote` for a new selector/ordinality), analogous to `lyricEditor.vue`'s `watch(() => props.text, ...)`.

## 4. Chord-text encode/decode: `chordText.ts`

`src/ui/components/dialogs/chordText.ts` — pure functions, no Vue/ProseMirror/DOM dependency (research.md §6).

```ts
type TextType = 0 | 1 | 2; // SuiInlineText.textTypes.{normal, superScript, subScript}

type ChordSegment =
  | { kind: 'text', text: string, textType: TextType }
  | { kind: 'glyph', glyphKey: string, textType: TextType };

export function decodeChordText(raw: string): ChordSegment[];
export function encodeChordText(segments: ChordSegment[]): string;
```

- **`decodeChordText`**: tokenizes `raw` via `SmoLyric._tokenizeChordString` (reused verbatim); tracks a running `textType` updated via `SuiInlineText.getTextTypeResult`/`SuiTextEditor.textTypeFromChar` on `^`/`%` tokens; emits one `ChordSegment` per literal-text run or `@glyphKey@` run, stamped with the `textType` active at that point.
- **`encodeChordText`**: walks `segments`, tracking `previousType` starting at `normal`; emits a toggle character (`SuiTextEditor.textTypeToChar(SuiInlineText.getTextTypeTransition(previousType, segment.textType))`) whenever a segment's `textType` differs from `previousType`, then the segment's literal text or `'@' + glyphKey + '@'`.
- **Round-trip contract**: for any `raw` string producible by the legacy `SuiChordEditor.getText()`, `encodeChordText(decodeChordText(raw)) === raw`, and for any `SmoLyric` with that `text`, `getVexChordBlocks(lyric)` (`src/render/vex/smoAdapter.ts`) renders identically whether `raw` came from this module or the legacy editor — this is the byte-for-byte-parity constraint from `plan.md`'s Technical Context.
- **Explicitly unchanged**: `SmoLyric._tokenizeChordString`/`_chordGlyphFromCode`, `getChordSymbolGlyphFromCode`/`ChordSymbolGlyphs`, `SuiInlineText.*`, `SuiTextEditor.textTypeToChar`/`textTypeFromChar`, `getVexChordBlocks` — all read-only dependencies, none modified by this feature.
