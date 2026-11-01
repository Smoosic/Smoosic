# Contract: Paste Special API

Library surface (`PasteBuffer` and `SuiScoreViewOperations` are exported from `src/application/exports.ts`).

## Types (`src/smo/xform/copypaste.ts`)

```text
PasteAttributeKind = 'dynamics' | 'lyrics' | 'annotations' | 'chords' | 'articulations' | 'ornaments'
PasteAttributeMode = 'replace' | 'add'
PasteAttributeOptions { kinds: PasteAttributeKind[]; mode: PasteAttributeMode }
PasteAttributePair { copied: PasteNote; destination: SmoSelection }
```

`PasteBuffer.attributeKinds` is the list of all six kinds in dialog order, so the dialog and the tests share one list.

## `PasteBuffer`

| Member | Signature | Behavior |
|--------|-----------|----------|
| `hasNotes` | `() => boolean` | True when a normal copy is held. |
| `alignAttributeNotes` | `(selector: SmoSelector, notes: PasteNote[]) => PasteAttributePair[]` | The alignment of the spec (R1). Reads only; changes nothing. Returns `[]` when `notes` is empty or the score is not set. |
| `getAttributePasteExtent` | `(selector: SmoSelector) => { firstMeasure: number, lastMeasure: number } \| null` | Dry run over all copied staves (same staff stepping as an ordinary paste). |
| `pasteAttributes` | `(selector: SmoSelector, options: PasteAttributeOptions) => void` | Applies the ticked kinds as in the data model. Does nothing when `options.kinds` is empty. Never changes pitches, durations, note types or any unticked kind. |

Removed: `pasteChords`, `pasteChordNotes`.

## `SuiScoreViewOperations`

| Member | Signature | Behavior |
|--------|-----------|----------|
| `hasCopiedNotes` | `() => boolean` | `storePaste.hasNotes()`; drives the menu. |
| `pasteAttributes` | `(options: PasteAttributeOptions) => Promise<void>` | Computes the extent, groups undo over those measures, pastes in the store score at the equivalent of the tracker's first selection, re-renders. Returns without doing anything when nothing is copied, nothing is selected or the extent is `null`. |

Removed: `pasteChords`.

## UI

| Item | Behavior |
|------|----------|
| Edit menu | "Paste Special..." is shown when `hasCopiedNotes()` is true; "Paste Chords" is gone. |
| `SuiPasteSpecialDialog(parameters)` | Opens the dialog. Six toggles in the order dynamics, lyrics, annotations, chords, articulations, ornaments, all off; a "Replace existing" toggle, on. Confirm is disabled until a kind is on. Confirm calls `view.pasteAttributes`; cancel changes nothing. |

## Invariants (asserted by tests)

1. After `pasteAttributes`, every destination note's pitches, `tickCount`, `noteType`, ties, slurs and unticked kinds are identical to before.
2. With the same rhythm in both, copied note *i* and destination note *i* are paired.
3. For any inputs, the dry-run extent equals the min and max measure of the notes `pasteAttributes` actually edited.
4. Replace on a destination note whose aligned copied notes have no items of a ticked kind leaves it with none of that kind.
5. Add never removes an existing item except one with the same key (same dynamic slot, same verse and parser, same articulation or ornament).
6. A pasted marking is not the same object as, and shares no state with, the copied one.
