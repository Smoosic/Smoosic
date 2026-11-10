# Contract: Measure Fill

This lists the behaviour that `tests/measureFill.ts` checks, and the interfaces the menu depends on. Case ids are used in the test names.

## `fillRestDurations(timeSignature, fill, totalTicks?)`

Every row of the table in [data-model.md](../data-model.md) is a case (ids D1 to D39, three fills for each of the 13 meters). In addition:

| Id | Case | Expected |
|----|------|----------|
| D40 | every result adds up to the target length | for all meters and fills in the table, `sum(durations) === totalTicks` |
| D41 | every result uses only valid durations | each value is a key of `SmoMusic.validDurations` |
| D42 | pickup length: 4/4 with `totalTicks` 4096, Whole Rest | `[4096]` |
| D43 | pickup length: 4/4 with `totalTicks` 4096, Beats | `[4096]` |
| D44 | pickup length: 4/4 with `totalTicks` 6144, Eighth Rests | `[2048, 2048, 2048]` |
| D45 | pickup length: 6/8 with `totalTicks` 2048, Beats | `[2048]` (shorter than a beat, filled greedily) |
| D46 | zero length | `[]` |

## `SmoMeasure.fillWithRests`

- F1: after filling a measure that had two voices of notes, `voices.length === 1` and every note has `noteType === 'r'`.
- F2: the rests' tick counts equal the durations given, in order, and add up to the measure length.
- F3: `tupletTrees` and `beamGroups` are empty, and `activeVoice` is 0.
- F4: the time signature, clef, key signature, tempo, format and `modifiers` (barline, rehearsal mark, beam grouping) are the same as before.
- F5: every rest has the measure's key signature and clef.

## `SmoOperation.fillMeasures`

| Id | Case | Expected |
|----|------|----------|
| O1 | select measures 2 and 3 of staff 1 in a two-staff, four-measure score, Beats | measures 2 and 3 of staff 1 are rests; every other measure of both staves has the same notes as before |
| O2 | measures in 4/4 and 6/8 selected together, Beats | four quarter rests and two dotted quarter rests |
| O3 | a measure with a tuplet, Whole Rest | no tuplet remains, one whole rest |
| O4 | a measure with notes carrying lyrics, dynamics and articulations | none of these remain (the notes are rests) |
| O5 | a slur starting in a filled measure and ending in a later measure | the slur is removed |
| O6 | a slur ending in a filled measure | the slur is removed |
| O7 | a hairpin starting before and ending after the filled measure | the hairpin is kept |
| O8 | a slur in a different staff over the same measures | kept |
| O9 | a text group attached to a note in a filled measure | removed from `score.textGroups` |
| O10 | a text group attached to a note in another measure | kept |
| O11 | a pickup measure (one quarter note in 4/4), Whole Rest | one quarter rest, the measure is still a pickup |
| O12 | the same fill applied twice | the measure is identical after the second application |
| O13 | a measure that is already one whole rest, Whole Rest | unchanged durations |
| O14 | a measure with its own beam grouping `[3, 2]` in 5/8, Eighth Rests | the grouping is still `[3, 2]` |
| O15 | rests get `beamBeats` equal to the score's triple default in 6/8 and duple default in 4/4 | as stated |

## Serialization

- S1: a score with filled measures (one per fill type, and a pickup) serializes and deserializes with the same rest durations, and the preserved measure settings.
- S2: a score with no filled measures serializes to the same text as before the feature.

## View and menu

`SuiScoreViewOperations.fillMeasures(fill: MeasureFillType): Promise<void>` applies the operation to the displayed and the stored score as one undo step, redraws, and waits for the render. Undo restores every voice, every removed staff modifier and every removed text group.

- The Measure menu has a "Fill Measures" entry that opens a submenu with "Whole Rest", "Beats" and "Eighth Rests". The entry and its choices are shown only when measures are selected.
