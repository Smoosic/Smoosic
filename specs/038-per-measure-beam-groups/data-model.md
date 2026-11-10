# Data Model: Per-Measure Beam Groups

## SmoBeamPreferences (new measure modifier)

Derives from `SmoMeasureModifierBase`. At most one per measure (a singleton, like the rehearsal mark).

| Field | Type | Rules |
|-------|------|-------|
| `ctor` | string | `'SmoBeamPreferences'`, set by the base class |
| `groups` | number[] | Each entry a whole number from 1 to 4. Never empty while the modifier exists. |

Static helpers:

- `SmoBeamPreferences.maxGroup` = 4, `minGroup` = 1.
- `SmoBeamPreferences.isValidGroups(values)`: true when every entry is a whole number 1 to 4 (an empty list is valid and means "no grouping").
- `SmoBeamPreferences.unitTicks(timeSignature)`: 1024 when the lower number of the time signature is 16 or more, otherwise 2048.

Serialized form (in the measure's `modifiers` array):

```json
{ "ctor": "SmoBeamPreferences", "groups": [3, 2] }
```

An empty grouping is not serialized: the modifier is removed from the measure instead.

## SmoMeasure (changed)

| Member | Behaviour |
|--------|-----------|
| `getBeamGroups(): number[]` | The measure's grouping, or `[]` when it has none. Returns a copy. |
| `setBeamGroups(groups: number[])` | Replaces the singleton modifier. An empty list removes it. Throws on invalid values. Resets the measure's notes to `beamState` auto (see [research.md](research.md) R5). |

Not changed: `beamGroups` (the rendered beam groups), `SmoNote.beamBeats`, `SmoNote.beamState`, `SmoScorePreferences.defaultDupleDuration` and `defaultTripleDuration`.

## Boundary list (derived, not stored)

`SmoBeamer.groupBoundaries(measure): number[]` returns tick positions, in order, at which a beam group must end.

Given unit `u` (R3), grouping `g` (length `n`), and measure length `L` ticks (from the time signature):

```text
positions = []; pos = 0; i = 0
while pos < L:
  pos += g[i % n] * u
  positions.push(min(pos, L))
  i += 1
```

An empty grouping returns `[]`, which tells the beamer to use the existing logic.

Examples (eighth-note unit is 2048 ticks):

| Meter | Grouping | Boundaries in eighths |
|-------|----------|-----------------------|
| 5/8 | `[3, 2]` | 3, 5 |
| 12/8 | `[3]` | 3, 6, 9, 12 |
| 8/8 | `[3, 3, 2]` | 3, 6, 8 |
| 10/8 | `[3, 2]` | 3, 5, 8, 10 |
| 7/8 | `[3, 2]` | 3, 5, 7 |
| 6/16 | `[3]` | 3, 6 (in sixteenths, 1024 ticks each) |

## Beam decision rules (changed in SmoBeamer.beamNote, only when boundaries are non-empty)

For each non-tuplet note, with `start` the measure tick position where it begins and `end` the position where it ends:

1. Skip every boundary at or before `start`.
2. Add the note to the group (a note that cannot be beamed still closes the group, as now).
3. If `end` is at or past the next boundary, close the group, unless the note is marked `continue`. This is the meaning `continue` already has in the beamer: do not break the beam after this note at a beat. Then skip every boundary at or before `end`.
4. Skip the legacy checks (the 8192 half-measure rule, the beat-alignment rule and `beamBeats`). An `end` beam state and the last note of the voice still close the group.

Notes that are part of a tuplet follow the existing tuplet code. An `end` beam state still closes a group.

## Score-wide preferences (unchanged)

`SmoScorePreferences.defaultDupleDuration` / `defaultTripleDuration` remain the fallback for measures with no grouping.
