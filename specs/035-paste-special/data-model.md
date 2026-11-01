# Data Model: Paste Special

No persisted data changes. These are the in-memory shapes the paste works with.

## Marking kind

A string union, `'dynamics' | 'lyrics' | 'annotations' | 'chords' | 'articulations' | 'ornaments'`. Where each is stored on a `SmoNote` and how it is added and cleared is in [research.md](research.md) R2.

## Paste options

| Field | Type | Meaning |
|-------|------|---------|
| `kinds` | list of marking kinds | The kinds to paste. Must not be empty. Duplicates are ignored. |
| `mode` | `'replace'` or `'add'` | Replace: each aligned destination note first loses its existing markings of the ticked kinds. Add: it keeps them. |

## Alignment pair

| Field | Type | Meaning |
|-------|------|---------|
| `copied` | `PasteNote` (existing) | A note from the copy, with the key it was copied from. |
| `destination` | `SmoSelection` | The destination note it is aligned to. |

Rules:
- Pairs come out in copied-note order. Each copied note has at most one pair; it has none once the destination part runs out.
- A destination note can appear in several pairs (a long destination note against short copied notes). It never appears out of order.
- Destination notes that appear in no pair are never read or changed.
- The first copied note is always paired with the note at the cursor.

## Paste extent

`{ firstMeasure, lastMeasure }`: the lowest and highest measure index of any alignment pair over all copied staves, or `null` when there are no pairs. The view undoes and re-renders exactly these measures.

## Elapsed time and note index

| Name in the code | What it is |
|------------------|------------|
| `copiedElapsed`, `destinationElapsed` | Running sums of `note.tickCount`: durations, from the start of the copy and of the cursor. |
| `noteIndex` (the selector's `tick`) | Which note within a voice. Never added to a duration. |

## Per-note application

For one destination note and the ordered list of copied notes aligned to it:

1. If `mode` is replace, clear each ticked kind on the destination note.
2. For each copied note in order, for each ticked kind, add a clone of each of the copied note's items of that kind (chords transposed to the destination's key first).

State transitions: none. The operation is a single synchronous edit of the score; undo is the existing grouped column undo.
