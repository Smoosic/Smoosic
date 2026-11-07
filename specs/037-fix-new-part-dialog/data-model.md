# Data Model: Fix the Create Part Dialog

No stored fields are added. The entities below are existing ones or short-lived request values.

## Create Part Request (`AddPartParams`)

What the dialog collects and the operation consumes.

| Field | Type | Notes |
|-------|------|-------|
| `location` | integer, 1..N+1 | One-based position the new part is to take, N = number of staves in the stored score. Held to the range. |
| `instrument` | `SmoInstrument` | Sound, clef, staff lines, transposition for the first staff |
| `twoStaves` | boolean | Add a second staff (opposite clef) to the part |
| `name` | string | As typed; blank means "use the instrument's name" |
| `instrumentLabel` | string | Display name of the chosen instrument, used when `name` is blank |
| `abbreviation` | string | As typed; blank means none |

**Validation**: `location` is rounded and held to 1..N+1. `name` and `abbreviation` are trimmed.

## Part (existing `SmoPartInfo`, one per staff)

The values written for a new part:

| Field | One-staff part | First staff of a two-stave part | Second staff of a two-stave part |
|-------|----------------|---------------------------------|----------------------------------|
| `partName` | resolved name | resolved name | resolved name |
| `partAbbreviation` | typed or empty | typed or empty | typed or empty |
| `preserveTextGroups` | `true` | `true` | `true` |
| `stavesBefore` | 0 | 0 | 1 |
| `stavesAfter` | 0 | 1 | 0 |

Everything else comes from `SmoPartInfo.defaults`, which is unchanged (`preserveTextGroups: false`).

## Placement

```text
index = clamp(round(location), 1, N + 1) - 1          # 0..N, N means append
if index < N and staves[index].partInfo.stavesBefore > 0:
    index = index + staves[index].partInfo.stavesAfter + 1    # past the end of the part
```

| Staves before | Location | Result index | Why |
|---------------|----------|--------------|-----|
| A, B, C | 1 | 0 | first |
| A, B, C | 4 | 3 | after the last |
| A, B, C | 9 | 3 | held to N + 1 |
| A, P1+P2 (P2 has stavesBefore 1), C | 3 (index 2 = P2) | 3 | inside part P, moved after it |
| A, P1+P2, C | 2 (index 1 = P1) | 1 | before the part, not inside it |
| A, P1+P2 | 4 | 3 | after the last staff, nothing to split |

## References shifted by an insertion at index `p`

Each staff number `>= p` becomes one higher in:

- every staff's modifiers and text brackets: `startSelector.staff`, `endSelector.staff`, `associatedStaff`
- every system group: `startSelector.staff`, `endSelector.staff`
- every staff's instrument map entries: `startSelector.staff`, `endSelector.staff`
- every score text group that has a selector

For `p = N` (append) nothing is shifted.

## State transitions

```text
score with N staves --addPart(location)--> score with N+1 or N+2 staves
  new staff/staves at the resolved index; later staves renumbered; references shifted
  one undo step: score state before addPart
```
