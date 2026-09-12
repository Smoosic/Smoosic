# Phase 1 Data Model: Vue-Based Lyric Dialog

This feature does not introduce new persisted data. It reuses the existing score data model (`SmoLyric` / `SmoNote`, `src/smo/data/noteModifiers.ts`) unchanged and adds only transient, dialog-scoped Vue reactive state. This document describes both: the existing entities as consumed by the new dialog, and the new transient view-state shape.

## Existing Entities (reused, not modified)

### Lyric (`SmoLyric`)

The text line attached to a specific note for a given verse.

| Field | Type | Notes |
|---|---|---|
| `text` | `string` | Raw stored text; may carry a trailing `-` marking hyphenation (`isHyphenated()`). `getText()`/`setText()` are the read/write accessors used by the editor |
| `verse` | `number` | Which verse (0-indexed; dialog exposes verses 1–4 as values `0`–`3`) this lyric belongs to |
| `translateY` | `number` | Vertical pixel offset; bound to the Y Adjustment control, no inherent min/max (see research.md §5) |
| `fontInfo` | `FontInfo` (`family`, `size`, `weight`, `style`) | Per-lyric font as stored on the note; the dialog's Font control seeds its initial display from this but commits changes to the score-wide font instead (see research.md §6) |
| `deleted` | `boolean` | Set to `true` by `view.removeLyric()`; guards against re-adding a just-deleted lyric |

Relevant methods reused unchanged: `getText()`, `setText(text)`, `SmoNote.getLyricForVerse(verse, parser)`, `SmoNote.removeLyric(lyric)`, `SmoNote.addLyric(lyric)` (the latter two invoked indirectly via `SuiScoreViewOperations`).

### Note Selection / Selector (`SmoSelection` / `SmoSelector`, `src/smo/xform/selections.ts`)

The note the dialog is currently positioned on.

| Concept | Type | Notes |
|---|---|---|
| `selector` | `SmoSelector` | `{ staff, measure, voice, tick }` — identifies the current note; deep-copied on dialog open and reassigned as the user navigates |
| `SmoSelection.noteFromSelector(score, selector)` | function | Resolves a selector to the live `SmoSelection`/`SmoNote` |
| `SmoSelection.nextNoteSelectionFromSelector(score, selector)` | function → `SmoSelection \| null` | Next note in score order; `null` at the last note |
| `SmoSelection.lastNoteSelectionFromSelector(score, selector)` | function → `SmoSelection \| null` | Previous note in score order; `null` at the first note |

No fields are added to either entity.

## New Transient View State (dialog-scoped, not persisted)

Owned by the creation function (`lyricVue.ts`) and/or `lyric.vue`, discarded when the dialog closes.

### `DialogMode`

```ts
type DialogMode = 'editing' | 'dialog';
```

- Single source of truth for control visibility (see research.md §10).
- Initialized to `'editing'` unconditionally on every dialog open (FR-009), regardless of any prior session state.
- Transitions: `editing → dialog` (user activates the "done editing" control, committing the current note) · `dialog → editing` (user activates the "edit lyrics" control, resuming on the current note/verse). No other transitions exist — the two modes are the entire state space (FR-007).

### Working copy references

| Name | Type | Purpose |
|---|---|---|
| `currentSelector` | `Ref<SmoSelector>` | The note the dialog is currently positioned on; reassigned by `navigate()` |
| `verse` | `Ref<number>` | Which verse is being edited (`0`–`3`); bound to the Verse `select.vue`, editable only in `dialog` mode |
| `currentLyric` | `Ref<SmoLyric>` | The working copy for `currentSelector`/`verse` — either the note's existing lyric for that verse, or a freshly constructed default (mirrors legacy `SuiLyricSession._setLyricForNote()`) |
| `originalText` | closure-scoped `string` | The text `currentLyric` held when it was loaded, used to decide whether a commit is a no-op (mirrors legacy `originalText`/`_updateLyricFromEditor`'s change check) |
| `lyricText` | `Ref<string>` | Bound to `lyricEditor.vue`'s TipTap document; read back on commit |
| `translateY` | `Ref<number>` | Mirrors `currentLyric.value.translateY`; bound to `numberInput.vue`, editable only in `dialog` mode |
| `fontInfo` | `Ref<FontInfo>` | Seeded from `currentLyric.value.fontInfo` on load; bound to `fontPicker.vue`'s family/size fields, editable only in `dialog` mode; changes commit via `view.setLyricFont(...)` (score-wide), not to `currentLyric` (research.md §6) |
| `mode` | `Ref<DialogMode>` | See above |

## Operations (behavior, not new entities)

These are functions in `lyricVue.ts`/`lyric.vue`, described here because they define how the state above evolves; see research.md §3–§4 for the legacy logic they port.

| Operation | Effect |
|---|---|
| `loadNote(selector, verse)` | Resolves the note, fetches/creates its lyric for `verse`, and populates `currentLyric`, `originalText`, `lyricText`, `translateY`, `fontInfo` |
| `commitIfChanged()` | If `lyricText.value !== originalText` and `currentLyric` is not deleted, calls `currentLyric.setText(lyricText.value)` then `view.addOrUpdateLyric(currentSelector.value, currentLyric.value)` |
| `navigate(direction: 'next' \| 'previous')` | `commitIfChanged()` → resolve the next/previous selection via the matching `SmoSelection` static → if found, update `currentSelector` and `loadNote(...)`; if not found, no-op |
| `deleteCurrent()` | `view.removeLyric(currentSelector.value, currentLyric.value)` → advance via the next-note path *without* an intervening `commitIfChanged()` (the lyric is already deleted) |
| `enterDialogMode()` | `commitIfChanged()` → `mode.value = 'dialog'` |
| `enterEditingMode()` | `mode.value = 'editing'` (state for `currentSelector`/`verse` is already current; no reload needed) |
| `onVerseChange(v)` | `verse.value = v` → `loadNote(currentSelector.value, v)` (reloads display state for the *current* note under the new verse; does not write to the score — see research.md item under §2) |
| `onYChange(v)` | `translateY.value = v` → `currentLyric.value.translateY = v` → `view.addOrUpdateLyric(currentSelector.value, currentLyric.value)` |
| `onFontChange(font)` | `fontInfo.value = { ...font, weight: 'normal' }` → `view.setLyricFont({ family: font.family, size: font.size, weight: 'normal' })` |
| `finish()` (shared by OK/Cancel) | If `mode.value === 'editing'`: `commitIfChanged()`. No undo-group open/close (research.md §8) |

## State Transition Summary

```
Dialog opens
  └─ loadNote(initialSelector, verse=0); mode = 'editing' (always)

mode = 'editing'
  ├─ next/previous control ─────▶ navigate(direction)         (mode unchanged)
  ├─ delete control ────────────▶ deleteCurrent()              (mode unchanged)
  └─ "done editing" control ────▶ enterDialogMode()            (mode = 'dialog')

mode = 'dialog'
  ├─ Verse changed ─────────────▶ onVerseChange(v)             (mode unchanged)
  ├─ Y Adjustment changed ──────▶ onYChange(v)                 (mode unchanged)
  ├─ Font changed ──────────────▶ onFontChange(font)           (mode unchanged)
  └─ "edit lyrics" control ─────▶ enterEditingMode()           (mode = 'editing')

Any mode
  └─ OK or Cancel ──────────────▶ finish(); close dialog        (identical for both — research.md §8)
```
