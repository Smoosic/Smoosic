# Contract: Spelling API (`SmoMusic`, `SmoOperation`)

Internal library contract; `SmoMusic` is part of the exported library surface (see `types/`), so names below are public. All keys are lowercase VexFlow strings as stored on `SmoMeasure.keySignature`.

## Added (SmoMusic)

| Method | Signature | Behavior |
|--------|-----------|----------|
| `keyFifths` | `(keySignature: string) => number` | Sharps (+) / flats (-) of the major key, -7..+7. Throws or returns 0 for an unknown key (match `getSharpsInKeySignature` behavior: unknown returns 0). |
| `pitchFifths` | `(pitch: Pitch) => number` | Line-of-fifths position. |
| `fifthsToPitch` | `(f: number, octave: number) => Pitch` | Inverse of `pitchFifths`; octave is taken as given. |
| `distanceFromKey` | `(pitch: Pitch, keySignature: string) => number` | Signed distance; 0 in key, positive sharp side, negative flat side. |
| `keyForOffset` | `(keySignature: string, offset: number) => string` | Destination key for a half-step offset; fewest accidentals, tie to flats; offset 0 returns the input key. |

## Changed (SmoMusic)

| Method | New behavior | Unchanged |
|--------|--------------|-----------|
| `getScaleTonesForKey(key)` | Computed from `keyFifths`. | Return shape `{ [letter]: 'f#' / 'bb' / 'cn' }`. |
| `getEnharmonicInKey(pitch, key)` | Smallest distance spelling, ties to flat. | Signature; octave adjusted so sounding pitch is identical; mutates `pitch.octave = 1` default when undefined, as today. |
| `transposePitchForKey(pitch, originalKey, destinationKey, offset)` | Position shift `s` (research R4). | Signature; returns a new `Pitch`. |

## Removed

`enharmonicRoles`, `findRoleOfPitch`, `findPitchForRole`, interface `KeySignatureRole`. No in-repo callers outside `music.ts`.

## Changed (SmoOperation)

`transposeScore(score, offset)`: for each measure, `kd = keyForOffset(measure.keySignature, offset)`; notes (including grace notes) are transposed with `transposePitchForKey(pitch, ks, kd, offset)`; then `measure.keySignature = kd`. Zero offset is a no-op.

## Invariants (asserted by tests)

1. `smoPitchToInt(result) === smoPitchToInt(input) + offset` for every transposition.
2. `abs(distanceFromKey(result, kd)) === abs(distanceFromKey(input, ks))` and the sign is equal, for all non-extreme cases.
3. `transpose(n)` then `transpose(-n)` restores letter, accidental, octave and key (non-extreme cases).
4. Tie between sharp and flat spelling resolves to flat.
