# Data Model: Measure Fill Submenu

No new persisted data. A filled measure is an ordinary measure whose only voice holds rest notes.

## MeasureFillType (new, not persisted)

`'wholeRest' | 'beats' | 'eighthRests'`: the three menu choices.

## fillRestDurations (new pure function, `src/smo/xform/measureFill.ts`)

```text
fillRestDurations(timeSignature: SmoTimeSignature, fill: MeasureFillType, totalTicks?: number): number[]
```

Returns the duration, in ticks, of each rest in order. `totalTicks` defaults to the length of a full measure of the time signature. The result always adds up to `totalTicks` (it is empty only when `totalTicks` is 0).

Steps, with `T = totalTicks` (rules and reasons in [research.md](research.md) R1 to R3):

```text
largest(left):       the largest value in SmoMusic.validDurations that is <= left
greedy(left):        repeat largest(left), subtracting, until left is 0
wholeRest:           greedy(T)
beats:               B beats of length B, floor(T / B) times, then greedy(T mod B)
eighthRests:         2048, floor(T / 2048) times, then greedy(T mod 2048)

beat length B:
  lower number 1, 2, 4:   16384, 8192, 4096
  lower number 8 or more: unit = 16384 / lower
                          compound (top number is a multiple of 3): 3 * unit
                          otherwise:                                  2 * unit
```

Expected results (ticks; 2048 is an eighth, 4096 a quarter, 6144 a dotted quarter, 8192 a half, 12288 a dotted half, 16384 a whole):

| Meter | Whole Rest | Beats | Eighth Rests |
|-------|-----------|-------|--------------|
| 4/4 | 16384 | 4096 x 4 | 2048 x 8 |
| 2/4 | 8192 | 4096 x 2 | 2048 x 4 |
| 3/4 | 12288 | 4096 x 3 | 2048 x 6 |
| 6/8 | 12288 | 6144 x 2 | 2048 x 6 |
| 9/8 | 16384, 2048 | 6144 x 3 | 2048 x 9 |
| 12/8 | 24576 | 6144 x 4 | 2048 x 12 |
| 5/8 | 8192, 2048 | 4096 x 2, 2048 | 2048 x 5 |
| 7/8 | 14336 | 4096 x 3, 2048 | 2048 x 7 |
| 3/8 | 6144 | 6144 | 2048 x 3 |
| 4/8 | 8192 | 4096 x 2 | 2048 x 4 |
| 2/2 | 16384 | 8192 x 2 | 2048 x 8 |
| 6/16 | 6144 | 3072 x 2 | 2048 x 3 |
| 5/16 | 4096, 1024 | 2048 x 2, 1024 | 2048 x 2, 1024 |

## SmoMeasure (changed)

| Member | Behaviour |
|--------|-----------|
| `fillWithRests(durations: number[], beamBeats: number)` | Replaces `voices` with one voice of rest notes of the given durations (clef pitch, key signature of the measure, `beamBeats` as given), empties `tupletTrees` and `beamGroups`, sets `activeVoice` to 0. Does not change `modifiers`, `timeSignature`, `clef`, `keySignature`, `tempo` or `format`. |

## SmoOperation.fillMeasures (new)

```text
fillMeasures(score: SmoScore, selections: SmoSelection[], fill: MeasureFillType): void
```

For each distinct (staff, measure) in `selections`:

1. `target` = ticks voice 0 holds if the measure is a pickup, otherwise the full-measure ticks.
2. `durations = fillRestDurations(measure.timeSignature, fill, target)`.
3. Remove from that staff every staff modifier whose `startSelector` or `endSelector` is in this measure.
4. Remove every text group attached to a note whose selector is in this staff and measure, from `score.textGroups` and from the staff's part information.
5. `measure.fillWithRests(durations, beamBeats)` with `beamBeats` the score's triple default if the meter's top number is a multiple of 3, otherwise the duple default (as `clearAllBeamGroups` decides).

Idempotent: applying the same fill twice leaves the same measure.

## SuiScoreViewOperations.fillMeasures (new)

```text
fillMeasures(fill: MeasureFillType): Promise<void>
```

One whole-score undo step, applies the operation to the displayed score and the stored score, redraws the changed measures.
