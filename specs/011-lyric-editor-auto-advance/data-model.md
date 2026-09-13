# Phase 1 Data Model: Lyric Editor Auto-Advance

This feature introduces no new persisted data and no new entities beyond those already documented in `specs/010-vue-lyric-dialog/data-model.md` (`SmoLyric`, note selection/selector). It adds one new transient, component-boundary signal.

## Existing Entities (reused, not modified)

See `specs/010-vue-lyric-dialog/data-model.md` for the full description of `SmoLyric` and the note-selection/selector concepts this feature continues to use unchanged: `currentSelector`, `verse`, `currentLyric`, `originalText`, `lyricText`, and the `loadNote`/`commitIfChanged`/`navigate` operations in `lyric.vue`.

## New Transient Signal (component-boundary, not persisted)

### `AdvanceMode`

```ts
type AdvanceMode = 'commit' | 'skip';
```

Emitted by `lyricEditor.vue` (new `advance` event) when the user types `-` or Space, consumed by `lyric.vue`.

| Value | When emitted | Parent (`lyric.vue`) response |
|---|---|---|
| `'commit'` | `-` typed (hyphen already inserted into the document); or Space typed while the editor's current text is non-empty | Reuses the existing `navigate('next')` unchanged — commits the current note's text (`commitIfChanged()`), then advances (no-op at the last note) |
| `'skip'` | Space typed while the editor's current text is empty (or whitespace-only) | Advances to the next note *without* calling `commitIfChanged()`/`addOrUpdateLyric` — no-op at the last note, using the same `SmoSelection.nextNoteSelectionFromSelector` null-check `navigate()` already uses |

No new fields are added to `SmoLyric`, `currentLyric`, or any other existing ref from `010-vue-lyric-dialog`.

## Operation: `emitAdvance` (in `lyricEditor.vue`'s keyboard-shortcut extension)

| Trigger | Action inside the extension | Emit |
|---|---|---|
| `-` key | `this.editor.commands.insertContent('-')` | `advance('commit')` |
| `Space` key, text non-empty | *(no document mutation)* | `advance('commit')` |
| `Space` key, text empty/whitespace-only | *(no document mutation)* | `advance('skip')` |

Both cases `return true` from the shortcut handler, suppressing ProseMirror's default character insertion for Space and preventing a duplicate `-` insertion (since the extension inserts it itself).

## State Transition Summary

```
lyricEditor.vue: user types '-'
  └─ insert '-' into document → emit('advance', 'commit')
       └─ lyric.vue: navigate('next')   (unchanged from 010: commit current note, move, no-op at boundary)

lyricEditor.vue: user types Space, current text non-empty
  └─ emit('advance', 'commit')
       └─ lyric.vue: navigate('next')   (unchanged from 010)

lyricEditor.vue: user types Space, current text empty
  └─ emit('advance', 'skip')
       └─ lyric.vue: resolve next note → if found, move without writing anything;
                      if not found (last note), no-op
```
