# Contract: Beam Groups

This lists the behaviour that `tests/beamGroups.ts` checks, and the interfaces the dialog depends on. Case ids are used in the test names.

## Model

### `SmoBeamPreferences`

- `new SmoBeamPreferences({ groups: [3, 2] })` keeps the list; `serialize()` returns `{ ctor: 'SmoBeamPreferences', groups: [3, 2] }`.
- Values outside 1 to 4, or not whole numbers, are rejected (`isValidGroups` is false; the constructor throws).

### `SmoMeasure`

- `getBeamGroups()` on a measure with no modifier returns `[]`.
- `setBeamGroups([3, 2])` then `getBeamGroups()` returns `[3, 2]`; a second `setBeamGroups([2, 3])` leaves exactly one modifier.
- `setBeamGroups([])` removes the modifier; the serialized measure has no `SmoBeamPreferences` entry.
- `setBeamGroups` resets every note in the measure to `beamState` auto.

### `SmoBeamer.groupBoundaries(measure)`

| Id | Meter | Grouping | Expected boundaries (units of the measure's unit) |
|----|-------|----------|----------------------|
| B1 | 5/8 | `[3, 2]` | 3, 5 |
| B2 | 5/8 | `[2, 3]` | 2, 5 |
| B3 | 12/8 | `[3]` | 3, 6, 9, 12 |
| B4 | 8/8 | `[3, 3, 2]` | 3, 6, 8 |
| B5 | 10/8 | `[3, 2]` | 3, 5, 8, 10 |
| B6 | 7/8 | `[3, 2]` | 3, 5, 7 |
| B7 | 6/16 | `[3]` | 3, 6 (1024-tick units) |
| B8 | 4/4 | `[]` | no boundaries |
| B9 | 3/4 | `[2, 1]` | 2, 3, 5, 6 |

### Beaming (`SmoBeamer.applyBeams`)

Sizes are the number of notes in each beam group, in order.

| Id | Measure | Grouping | Expected beam groups |
|----|---------|----------|----------------------|
| M1 | 5/8, five eighths | `[3, 2]` | 3, 2 |
| M2 | 5/8, five eighths | `[2, 3]` | 2, 3 |
| M3 | 5/8, five eighths | none | same as before this feature |
| M4 | 12/8, twelve eighths | `[3]` | 3, 3, 3, 3 |
| M5 | 8/8, eight eighths | `[3, 3, 2]` | 3, 3, 2 |
| M6 | 10/8, ten eighths | `[3, 2]` | 3, 2, 3, 2 |
| M7 | 6/16, six sixteenths | `[3]` | 3, 3 |
| M8 | 5/8: quarter, eighth, eighth, eighth | `[3, 2]` | 2 (the lone first eighth is not beamed) |
| M9 | 4/4: dotted eighth, sixteenth, dotted eighth, sixteenth, quarter, quarter | `[4]` | 4 (the two dotted figures beam together across the beat) |
| M10 | 5/8, five eighths, `end` set on the second note by hand | `[3, 2]` | 2, 2 (the hand `end` closes the first group, the third note is alone before the boundary, the last two beam) |
| M11 | 5/8, five eighths, hand beam over notes 2 to 4 as `beamSelections` leaves it: note 1 `end`, notes 2 and 3 `continue`, note 4 `end` | `[3, 2]` | 3 (the hand beam is not split at the boundary; notes 1 and 5 are alone) |
| M15 | 5/8, five eighths, hand beam over the last three notes | `[3, 2]` | 2, 3 |
| M16 | 5/8, five eighths, hand beam over the first three notes | `[2, 3]` | 3, 2 |
| M12 | a tuplet in a measure with a grouping | any | the tuplet is beamed as before |

### Operations

- `SmoOperation.setBeamGroups(score, selections, [3, 2])` sets the grouping on exactly the measures of the selections and no others. Other staves are unchanged.
- `SmoOperation.setBeamGroups(score, selections, [])` clears the grouping on those measures.
- `SmoOperation.setAllBeamGroups(score, groups)` sets or clears it on every measure of every staff.
- `SmoOperation.beamSelections` on a grouped measure marks every note of the span except the last `continue` (the last is `end`); on an ungrouped measure the result is identical to today.

### Serialization

- S1: a score with groupings on measures 2 and 4 serializes, deserializes, and reports the same groupings.
- S2: a score JSON with no `SmoBeamPreferences` entries loads, every measure reports `[]`, and the beam groups equal those produced by the previous version.
- S3: the same score through the `.smz` compression round trip keeps the groupings.

## View

`SuiScoreViewOperations.setBeamGroups(groups: number[], scope: 'selections' | 'all'): Promise<void>` applies the operation to the displayed score and the stored score as one undo step and waits for the render. Undo restores the previous groupings and beam states.

## UI

- The Beams menu has a "Beam Groups" entry that opens the dialog.
- The dialog has one number field (1 to 4) per group, initialized from the first selected measure, an **Add group** (+) button, a remove button on each group, a Clear button, an Apply To choice ("Selected measures", "Whole score"), and OK/Cancel. Values outside 1 to 4 cannot be entered. No groups means the default for the meter.
