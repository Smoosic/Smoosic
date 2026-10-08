# Phase 1 Data Model: Vue-Based Chord Change Dialog

This feature does not introduce new persisted data. It reuses the existing score data model (`SmoLyric` with parser `chord` / `SmoNote`, `src/smo/data/noteModifiers.ts`) unchanged, and adds only transient, dialog-scoped Vue reactive state plus one new *transient, in-memory-only* intermediate representation used while editing (`ChordSegment[]`, never persisted).

## Existing Entities (reused, not modified)

### Chord Symbol (`SmoLyric`, parser `SmoLyric.parsers.chord`)

The chord text line attached to a specific note.

| Field | Type | Notes |
|---|---|---|
| `text` | `string` | Raw stored text in the token format described below; `getText()`/`setText()` are the read/write accessors used by the editor |
| `verse` | `number` | Which chord "ordinality"/line (0-indexed; dialog exposes lines 1–3 as values `0`–`2`) this chord symbol belongs to |
| `parser` | `number` | `SmoLyric.parsers.chord` — distinguishes chord symbols from lyrics on the same note (`getLyricForVerse(verse, parser)`) |
| `translateY` | `number` | Vertical pixel offset; bound to the Y Adjustment control, no inherent min/max (same as `010` research.md §5) |
| `fontInfo` | `FontInfo` (`family`, `size`, `weight`, `style`) | Per-chord-symbol font as stored on the note; the dialog's Font control seeds its initial display from this but commits changes to the score-wide font instead (research.md §7) |
| `adjustNoteWidthChord` | `boolean` | Per-chord-symbol note-width-adjustment flag as stored; the dialog's Adjust Note Width control seeds its initial display from this but commits changes to the score-wide setting instead (research.md §7) |
| `deleted` | `boolean` | Set to `true` by `view.removeLyric()`; guards against re-adding a just-deleted chord symbol |

**The `text` token format** (parsed by `SmoLyric._tokenizeChordString`, consumed at real render time by `getVexChordBlocks` in `src/render/vex/smoAdapter.ts` — see research.md §2, unchanged by this feature):

| Token | Meaning |
|---|---|
| Run of `[A-Za-z0-9]+` | Literal chord-name text, rendered at the currently-active text type |
| `^` | Toggle superscript on/off for subsequent tokens (state machine: `SuiInlineText.getTextTypeResult`) |
| `%` | Toggle subscript on/off for subsequent tokens (same state machine) |
| `@<glyphKey>@` | A single music glyph, resolved at render time via `SmoLyric._chordGlyphFromCode(glyphKey)` → `getChordSymbolGlyphFromCode` (`src/common/vex.ts`) |

Relevant methods/functions reused unchanged: `getText()`, `setText(text)`, `SmoNote.getLyricForVerse(verse, parser)`, `SmoNote.addLyric`/`removeLyric` (invoked indirectly via `SuiScoreViewOperations`), `SmoLyric._tokenizeChordString`, `getChordSymbolGlyphFromCode`, `ChordSymbolGlyphs` (`src/common/vex.ts`), `SuiInlineText.textTypes`/`getTextTypeResult`/`getTextTypeTransition` (`src/render/sui/textRender.ts`), `SuiTextEditor.textTypeToChar`/`textTypeFromChar` (`src/render/sui/textEdit.ts`).

### Note Selection / Selector (`SmoSelection` / `SmoSelector`, `src/smo/xform/selections.ts`)

Identical to the lyric dialog's usage (`010-vue-lyric-dialog/data-model.md`) — no fields added.

| Concept | Type | Notes |
|---|---|---|
| `selector` | `SmoSelector` | `{ staff, measure, voice, tick }` — identifies the current note; deep-copied on dialog open and reassigned as the user navigates |
| `SmoSelection.noteFromSelector(score, selector)` | function | Resolves a selector to the live `SmoSelection`/`SmoNote` |
| `SmoSelection.nextNoteSelectionFromSelector(score, selector)` | function → `SmoSelection \| null` | Next note in score order; `null` at the last note |
| `SmoSelection.lastNoteSelectionFromSelector(score, selector)` | function → `SmoSelection \| null` | Previous note in score order; `null` at the first note |

## New Transient Types (in-memory only, never persisted)

### `ChordSegment` (`src/ui/components/dialogs/chordText.ts`)

The neutral intermediate form between the raw `SmoLyric.text` token string and the TipTap document (research.md §6).

```ts
type TextType = 0 | 1 | 2; // SuiInlineText.textTypes.{normal, superScript, subScript}

type ChordSegment =
  | { kind: 'text', text: string, textType: TextType }
  | { kind: 'glyph', glyphKey: string, textType: TextType };
```

- Produced from a raw string by `decodeChordText(raw: string): ChordSegment[]`.
- Converted back to a raw string by `encodeChordText(segments: ChordSegment[]): string`.
- `chordEditor.vue` is the only place that additionally maps `ChordSegment[] ⇄ TipTap JSON document` (a `text` segment ↔ a text node carrying the `Superscript`/`Subscript` mark per its `textType`; a `glyph` segment ↔ one atomic `chordGlyph` node, `{ glyphKey }` attribute, similarly marked).

### `DialogMode`

```ts
type DialogMode = 'editing' | 'dialog';
```

- Identical role to `010-vue-lyric-dialog`'s `DialogMode` (research.md §8, data-model.md): single source of truth for control visibility. Initialized to `'editing'` unconditionally on every dialog open (FR-016). Transitions: `editing → dialog` (user activates "done editing", committing the current note) · `dialog → editing` (user activates "edit chord symbols", resuming on the current note/ordinality). No other transitions exist (FR-014).

## Working copy references (dialog-scoped Vue state)

Owned by `chordChangeVue.ts`/`chord.vue`, discarded when the dialog closes.

| Name | Type | Purpose |
|---|---|---|
| `currentSelector` | `Ref<SmoSelector>` | The note the dialog is currently positioned on; reassigned by `navigate()` |
| `ordinality` | `Ref<number>` | Which chord line is being edited (`0`–`2`); bound to the Ordinality `select.vue`, editable only in `dialog` mode |
| `currentChord` | `Ref<SmoLyric>` | The working copy for `currentSelector`/`ordinality` — either the note's existing chord symbol for that line (parser `chord`), or a freshly constructed default seeded from the score's `'chords'` font entry (mirrors legacy `SuiChordSession._setLyricForNote()`) |
| `originalText` | closure-scoped `string` | The raw `text` `currentChord` held when it was loaded, used to decide whether a commit is a no-op |
| `chordSegments` | `Ref<ChordSegment[]>` (or equivalently, the TipTap document derived from it) | The editor's current content, initialized from `decodeChordText(currentChord.value.getText())` on load |
| `currentTextType` | `Ref<TextType>` | Set by the Text Position dropdown; determines the type applied to whatever is inserted next (plain typing or a glyph) — editable only in `editing` mode |
| `translateY` | `Ref<number>` | Mirrors `currentChord.value.translateY`; bound to `numberInput.vue`, editable only in `dialog` mode |
| `fontInfo` | `Ref<FontInfo>` | Seeded from `currentChord.value.fontInfo` on load; bound to `fontPicker.vue`'s family/size fields, editable only in `dialog` mode; changes commit via `view.setChordFont(...)` (score-wide), not to `currentChord` (research.md §7) |
| `adjustWidth` | `Ref<boolean>` | Seeded from `currentChord.value.adjustNoteWidthChord` on load; bound to `toggle.vue`, editable only in `dialog` mode; changes commit via `view.score.setChordAdjustWidth(...)` (score-wide, research.md §7) |
| `mode` | `Ref<DialogMode>` | See above |

## Operations (behavior, not new entities)

| Operation | Effect |
|---|---|
| `loadNote(selector, ordinality)` | Resolves the note, fetches/creates its chord symbol for `ordinality` (parser `chord`), and populates `currentChord`, `originalText`, `chordSegments` (via `decodeChordText`), `translateY`, `fontInfo`, `adjustWidth` |
| `commitIfChanged()` | Reads the editor's current content, converts to `ChordSegment[]` then `encodeChordText(...)`; if the resulting string differs from `originalText` and `currentChord` is not deleted, calls `currentChord.setText(text)` then `view.addOrUpdateLyric(currentSelector.value, currentChord.value)` |
| `navigate(direction: 'next' \| 'previous')` | `commitIfChanged()` → resolve the next/previous selection via the matching `SmoSelection` static → if found, update `currentSelector` and `loadNote(...)`; if not found, no-op |
| `deleteCurrent()` | `view.removeLyric(currentSelector.value, currentChord.value)` → advance via the next-note path *without* an intervening `commitIfChanged()` (the chord symbol is already deleted) |
| `insertGlyph(glyphKey)` | Inserts a `chordGlyph` node (attrs `{ glyphKey }`, marked per `currentTextType`) at the editor's current cursor position — used by both the recognized-shortcut-character path (§3) and the Symbols dropdown (§1) |
| `onTextPositionChange(type)` | `currentTextType.value = type` — affects only content inserted after this point (FR-011); invoked either by the Text Position dropdown or by `chordEditor.vue`'s `textTypeChange` emit (the `^`/`%` keyboard shortcuts, FR-025/FR-026, research.md §10) |
| `enterDialogMode()` | `commitIfChanged()` → `mode.value = 'dialog'` |
| `enterEditingMode()` | `mode.value = 'editing'` (state for `currentSelector`/`ordinality` is already current; no reload needed) |
| `onOrdinalityChange(v)` | `ordinality.value = v` → `loadNote(currentSelector.value, v)` (reloads display state for the *current* note under the new ordinality; does not write to the score until editing resumes and content is entered/committed) |
| `onYChange(v)` | `translateY.value = v` → `currentChord.value.translateY = v` → `view.addOrUpdateLyric(currentSelector.value, currentChord.value)` |
| `onFontChange(font)` | `fontInfo.value = { ...font, weight: 'normal' }` → `view.setChordFont({ family: font.family, size: font.size, weight: 'normal' })` |
| `onAdjustWidthChange(v)` | `adjustWidth.value = v` → `view.score.setChordAdjustWidth(v)` |
| `finish()` (shared by OK/Cancel) | If `mode.value === 'editing'`: `commitIfChanged()`. No undo-group open/close, matching `010` research.md §8 |
| `onEditorPreview()` (debounced, research.md §9) | `commitIfChanged()` — the same write navigation/finish use, also triggered ~400ms after typing pauses |

## State Transition Summary

```
Dialog opens
  └─ loadNote(initialSelector, ordinality=0); mode = 'editing' (always)

mode = 'editing'
  ├─ next/previous control ─────────▶ navigate(direction)          (mode unchanged)
  ├─ delete control ─────────────────▶ deleteCurrent()               (mode unchanged)
  ├─ typed shortcut char ────────────▶ insertGlyph(char)             (mode unchanged)
  ├─ Symbols dropdown selection ─────▶ insertGlyph(resolvedKey)      (mode unchanged)
  ├─ Text Position dropdown change ──▶ onTextPositionChange(type)    (mode unchanged)
  ├─ typing pause (~400ms) ──────────▶ onEditorPreview()             (mode unchanged)
  └─ "done editing" control ─────────▶ enterDialogMode()             (mode = 'dialog')

mode = 'dialog'
  ├─ Ordinality changed ─────────────▶ onOrdinalityChange(v)         (mode unchanged)
  ├─ Y Adjustment changed ───────────▶ onYChange(v)                  (mode unchanged)
  ├─ Font changed ───────────────────▶ onFontChange(font)            (mode unchanged)
  ├─ Adjust Note Width changed ──────▶ onAdjustWidthChange(v)        (mode unchanged)
  └─ "edit chord symbols" control ───▶ enterEditingMode()            (mode = 'editing')

Any mode
  └─ OK or Cancel ───────────────────▶ finish(); close dialog         (identical for both — research.md §8)
```
