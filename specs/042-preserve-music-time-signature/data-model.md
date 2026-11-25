# Data Model: Preserve Music When Changing Time Signature

Nothing is added to the saved score. These are the in-memory shapes the transform and the dialog use.

## Dialog choices (not saved)

| Field | Type | Initial | Meaning |
|-------|------|---------|---------|
| `timeSignature` | `SmoTimeSignature` | copy of the first selected measure's | The signature to apply, including `times` (compound), `display`, `displayString` and `useSymbol`. Editing it changes only this copy. |
| `applyTo` | `'Selected' \| 'Remaining' \| 'Score'` | `'Selected'` | Which measures change. Read when OK is clicked. |
| `preserveMusic` | `boolean` | `true` | Re-bar the music (true) or keep what fits (false). |

## `TimeSignatureApplyTo` and `SetTimeSignatureOptions` (`src/render/sui/scoreViewOperations.ts`)

```text
TimeSignatureApplyTo = 'Selected' | 'Remaining' | 'Score'
SetTimeSignatureOptions { applyTo?: TimeSignatureApplyTo, preserveMusic?: boolean }
```

With no options, `setTimeSignature` applies to the tracker's selections and keeps what fits, as before.

## The chosen range

`firstMeasure`..`lastMeasure` (indices, inclusive), the same in every staff, found from the tracker's selections and `applyTo`:

| `applyTo` | firstMeasure | lastMeasure |
|-----------|--------------|-------------|
| Selected | lowest selected measure | highest selected measure |
| Remaining | lowest selected measure | last measure of the score |
| Score | 0 | last measure of the score |

## Layout unit

What the layout places, one at a time, for one voice of one staff:

| Field | Meaning |
|-------|---------|
| `notes` | The source notes of the unit: one note or rest, or all the notes of one tuplet tree. |
| `ticks` | Total length of the unit. |
| `tuplet` | The source `SmoTupletTree` for a tuplet unit, otherwise none. |
| `sources` | The old selector of each source note (staff, measure, voice, tick). |

## Placement map

For each source note, where it ended up. Built during the layout and used to fix the staff modifiers.

| Field | Meaning |
|-------|---------|
| key | The old selector of the note (`SmoSelector.getNoteKey`). |
| `firstPiece` | New selector of the first (or only) piece of the note. |
| `lastPiece` | New selector of the last piece. The same as `firstPiece` if the note was not split. |

## `RebarResult` (`src/smo/xform/rebar.ts`)

| Field | Meaning |
|-------|---------|
| `firstMeasure` | First re-barred measure. |
| `measureCount` | Number of measures now in the range (existing plus added). |
| `added` | How many measures were added after the old last measure. 0 if none were needed. |

## Rules for the numbers

- Measure length for the k-th measure of the range (k from 0): `SmoMusic.timeSignatureToTicks(actualBeats, beatDuration)` of the part at position `(startIndex + k) mod times.length`. `startIndex` is the `index` of the measure before the range if its time signature equals the new one (and that measure has more than one part), else 0.
- `needed` (measures needed) for a voice: the number of measures that its layout fills. Overall `needed` is the maximum over all staves and voices.
- Final range size: `max(existing, needed)`. `added = size - existing`.
- Total sounding time of a voice (ticks of all its units) is the same before and after, except for the rests that fill the end of the last measure.

## Invariants

1. For every staff and voice, the sequence of pitched notes, read with tied pieces joined, is the same before and after (spec SC-002).
2. Every staff has the same number of measures before and after the transform, plus `added`.
3. Measures outside the range keep their notes, signatures and settings; only their index and the modifier selectors that point at them move.
4. A measure is never removed.
