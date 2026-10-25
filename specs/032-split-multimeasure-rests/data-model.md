# Data Model: Split Multimeasure Rests at Landmarks

No serialized data changes (constitution Principle #1). The grouping result is runtime state on each measure's `svg` record.

## Measure grouping state (`measure.svg`)

| Field | Type | Meaning | Change |
|-------|------|---------|--------|
| `multimeasureLength` | number | On a block's first measure, the number of measures in the block (at least 2); 0 on every other measure | existing; now always reset |
| `hideMultimeasure` | boolean | True on every measure of a block except the first | existing |
| `multimeasureEndBarline` | number | The block's end barline, taken from the block's last measure | existing; now always reset |
| `multimeasureEndSymbol` | `SmoRepeatSymbol \| null` | The end-type repeat symbol (D.S., D.C., To Coda, Fine) of the block's last measure, to draw over the block's rest; null if none | **new**, runtime only |

All four are set for every staff, so the staves of a part always share the same grouping.

## Landmark classification (new helpers on `SmoScore`)

```ts
isMultimeasureBlocked(measureIndex): boolean
// a volta ending covers the measure on any staff, or (legacy) measureIndex is 0 on a multi-staff part

isMultimeasureStartLandmark(measureIndex): boolean
// any staff: rehearsal mark; repeat symbol Segno or Coda; instrument map entry at measureIndex > 0;
// start barline that is not singleBar/noBar.
// staff 0: key signature or time signature differs from the previous measure;
//          displayed tempo differs from the previous measure's tempo.

isMultimeasureEndLandmark(measureIndex): boolean
// any staff: repeat symbol ToCoda, DcAlCoda, DcAlFine, DsAlCoda, DsAlFine or Fine;
// end barline that is not singleBar/noBar.
```

All three are pure reads of the score; none changes it. `isMultimeasureRest` (existing, public) is left as it is.

## Grouping algorithm (`SmoOperation.computeMultipartRest`)

```text
if the part expands multimeasure rests: return (unchanged)
i = 0
while i < measureCount:
  if blocked(i) or not restMeasure(i): reset(i); i += 1; continue
  j = i + 1
  closed = endLandmark(i)
  while not closed and j < measureCount and restMeasure(j) and not blocked(j)
        and not restBreak(j) and not startLandmark(j):
      closed = endLandmark(j); j += 1
  if j - i >= 2: block [i, j)
  else: reset(i)
  i = j
for each block [key, end): on every staff
  measure[key]: length = end - key; endBarline = measure[end-1] end barline;
                endSymbol = end-type symbol of measure[end-1] or null; hide = false
  measures key+1 .. end-1: hide = true; length = 0; endBarline = single; endSymbol = null
reset(m) on every staff: length = 0; hide = false; endBarline = single; endSymbol = null
```

`restMeasure(m)` is the existing rule: every staff has only rests in the measure, or the measure's `format.forceRest` is set. `restBreak(m)` is the existing `format.restBreak` flag.

### Equivalence with today's behavior

For a score whose runs of rests contain no rehearsal mark, repeat symbol, instrument entry, tempo change or special barline, the new loop produces the same blocks as the old one: a key or time change still ends a block and starts the next; `restBreak` still ends a block; voltas and `forceRest` are unchanged.

## Drawing inputs (read-only)

| Reader | Uses |
|--------|------|
| `vxSystem.renderMeasure` | `hideMultimeasure` (skip), unchanged |
| `vxMeasure.createMeasureModifiers` | `multimeasureLength`, `multimeasureEndBarline`, and the new `multimeasureEndSymbol` |
| `formatter` | `hideMultimeasure`, unchanged; `layout()` now calls the grouping first for parts |
| `tracker` | `multimeasureLength`, `hideMultimeasure` for navigation, unchanged |
