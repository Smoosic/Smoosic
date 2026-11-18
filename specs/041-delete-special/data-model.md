# Data Model: Delete Special for Note Attachments

No new stored data. These are the in-memory types and the exact rule for each kind.

## `DeleteAttributeKind` (`src/smo/xform/operations.ts`)

```text
'dynamics' | 'lyrics' | 'annotations' | 'chords' | 'articulations'
  | 'ornaments' | 'graceNotes' | 'arpeggios' | 'microtones'
```

`SmoOperation.deleteAttributeKinds: DeleteAttributeKind[]` lists all nine, in this order. The dialog and the tests use it, so there is one list.

## What each kind removes from a `SmoNote`

| Kind | Count (how many markings) | Clear |
|------|---------------------------|-------|
| `dynamics` | `textModifiers` of type `SmoDynamicText` | remove them from `textModifiers` |
| `lyrics` | `textModifiers` of type `SmoLyric` with parser `lyric` | remove them (every verse) |
| `annotations` | `SmoLyric` with parser `annotation` | remove them |
| `chords` | `SmoLyric` with parser `chord` | remove them |
| `articulations` | `articulations.length` | `articulations = []` |
| `ornaments` | `ornaments.length` | `ornaments = []` |
| `graceNotes` | `graceNotes.length` | `graceNotes = []` |
| `arpeggios` | 1 if `arpeggio` is set, else 0 | `arpeggio = undefined` |
| `microtones` | `tones.length` | `tones = []` |

Everything else in `textModifiers` (other kinds, and other parsers) is kept in its original order. The note's `pitches`, `tickCount`, `noteType`, ties, beam and voice fields are never read or written.

## Rules

1. **Isolation**: clearing one kind changes none of the other eight. In particular the three `SmoLyric` kinds are separated by `parser` only.
2. **Idempotence**: a second delete with the same kinds counts 0 and changes nothing.
3. **Scope**: only the notes of the selections passed in are read or changed. A selection without a note (`selection.note` is null) is skipped.
4. **Empty kinds**: an empty list counts 0 and removes nothing.
5. **Unknown kinds** in the list (a library caller passing a bad string) are ignored; the known ones in the same list still apply.

## State transitions

`note with markings` --delete(kinds)--> `same note without markings of those kinds`. The score is then the same as one that was built without them; saving and reloading gives that note.
