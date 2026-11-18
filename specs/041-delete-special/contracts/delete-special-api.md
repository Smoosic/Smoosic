# Contract: Delete Special API

Library surface (`SmoOperation`, `SuiScoreViewOperations` and the dialog are exported from `src/application/exports.ts`).

## Types and constants (`src/smo/xform/operations.ts`)

```text
DeleteAttributeKind = 'dynamics' | 'lyrics' | 'annotations' | 'chords' | 'articulations'
                    | 'ornaments' | 'graceNotes' | 'arpeggios' | 'microtones'
SmoOperation.deleteAttributeKinds: DeleteAttributeKind[]   // all nine, in dialog order
```

## `SmoOperation`

| Member | Signature | Behavior |
|--------|-----------|----------|
| `countNoteAttributes` | `(selections: SmoSelection[], kinds: DeleteAttributeKind[]) => number` | Total number of markings of the listed kinds on the notes of the selections (see the data model for how each kind is counted). Reads only. Skips selections with no note and ignores unknown kinds. Returns 0 for no kinds. |
| `deleteNoteAttributes` | `(selections: SmoSelection[], kinds: DeleteAttributeKind[]) => void` | Removes every marking of the listed kinds from the notes of the selections. Never changes pitches, durations, note types, ties or any other kind. Does nothing for no kinds. |

## `SuiScoreViewOperations`

| Member | Signature | Behavior |
|--------|-----------|----------|
| `deleteNoteAttributes` | `(kinds: DeleteAttributeKind[]) => Promise<void>` | Uses the tracker's current selections. Returns without any change, undo step or redraw when `kinds` is empty or `countNoteAttributes` is 0. Otherwise runs `SmoOperation.deleteNoteAttributes` through `modifyCurrentSelections('delete special', ...)`: one undo step, applied to the displayed score and the backing score, with the changed measures redrawn. |

## UI

| Item | Behavior |
|------|----------|
| Edit menu | "Delete Special..." follows "Paste Special..." and is always shown. |
| `SuiDeleteSpecialDialog(parameters)` | Opens the dialog. Nine toggles in the order dynamics, lyrics, annotations, chords, articulations, ornaments, grace notes, arpeggios, microtones, all off. Confirm is disabled until one is on, and calls `view.deleteNoteAttributes` with the ticked kinds. Cancel changes nothing. |

Labels: Dynamics, Lyrics, Annotations, Chords, Articulations, Ornaments, Grace Notes, Arpeggios, Microtones.

## Invariants (asserted by tests)

1. After `deleteNoteAttributes`, every selected note's pitches, `tickCount`, `noteType`, ties and markings of unticked kinds are identical to before.
2. No marking of a ticked kind remains on any selected note; markings on notes outside the selections are unchanged.
3. Removing `lyrics`, `annotations` or `chords` never removes either of the other two.
4. `countNoteAttributes` after a delete, with the same kinds and selections, is 0; before it, it equals the number of markings the test put there.
5. A score serialized after a delete and loaded again has none of the removed markings and the same notes otherwise.
