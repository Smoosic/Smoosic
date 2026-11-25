# Contract: Preserve Music API

Library surface. `SmoOperation`, `SuiScoreViewOperations` and the new smo module are exported from `src/application/exports.ts`.

## `src/smo/xform/rebar.ts` (new)

| Member | Signature | Behavior |
|--------|-----------|----------|
| `rebarMeasures` | `(score: SmoScore, firstMeasure: number, lastMeasure: number, timeSignature: SmoTimeSignature) => RebarResult` | Re-bars the music of measures `firstMeasure`..`lastMeasure` of **every** staff into measures of `timeSignature`, as described in [research.md](../research.md) R2 to R6. Adds measures after `lastMeasure`, in every staff, when needed. Sets `timeSignature` (a copy per measure) on every measure of the range and updates the compound-time indices. Remaps the staff modifiers. Returns the result. Does nothing and returns `added: 0` for an invalid range. |
| `RebarResult` | `{ firstMeasure: number, measureCount: number, added: number }` | See the data model. |

## `SmoOperation` (additions)

| Member | Signature | Behavior |
|--------|-----------|----------|
| `rebarMeasures` | same as above | Calls the function above. |
| `timeSignatureChanges` | `(score, firstMeasure, lastMeasure, timeSignature) => boolean` | True if any measure in the range, in any staff, has a time signature that is not equal (`equalIncludeAttributes`) to `timeSignature`. Reads only. |
| `timeSignatureKeepsLength` | `(score, firstMeasure, lastMeasure, timeSignature) => boolean` | True if every measure in the range has the same length in ticks as the new signature would give it. Reads only. |
| `setTimeSignature` | unchanged | Keeps what fits. |

## `SmoScore` (change)

| Member | Signature | Behavior |
|--------|-----------|----------|
| `addMeasure` | `(measureIndex: number, prototypeIndex?: number) => void` | New optional argument: the measure that the new measures copy their settings from. Without it, behavior is unchanged. |
| `getPrototypeMeasure` | `(measureIndex: number, staffIndex: number, prototypeIndex?: number)` | Same optional argument. |

## `SuiScoreViewOperations` (change)

| Member | Signature | Behavior |
|--------|-----------|----------|
| `setTimeSignature` | `(timeSignature: SmoTimeSignature, options?: SetTimeSignatureOptions) => Promise<void>` | Without options: as before (tracker selections, keep what fits). With options, finds the range from `applyTo`. Returns with no change, undo step or redraw if `timeSignatureChanges` is false. Uses the old path if `preserveMusic` is not true or `timeSignatureKeepsLength` is true; otherwise runs `rebarMeasures` on the displayed and the backing score. One undo step (`_undoScore`), one full redraw. |

## UI

| Item | Behavior |
|------|----------|
| Time Signature dialog | Editing any field, Apply To or Preserve music does not change the score. OK applies everything once, as one undo step. Cancel or dismiss changes nothing and records nothing. A **Preserve music** toggle, ticked each time the dialog opens. |

## Test cases (`tests/rebarMeasures.ts`)

| Id | Case | Expected |
|----|------|----------|
| B1 | 2 measures of 4/4, 8 quarters, to 3/4 (spec example) | 3 measures of 3/4; measures 1 and 2 hold 3 quarters; measure 3 holds 2 quarters and a quarter rest; the sequence of pitches is unchanged. |
| B2 | 3/4 to 4/4, 3 measures of 3 quarters | 3 measures remain; no loss; the last is padded with rests; no measure added when none is needed. |
| B3 | 4/4 to 6/8 and to 5/8 | Same pitches in order; measures added as needed. |
| B4 | Half note starting on beat 3 of 3/4 (crosses the new bar line) | Split in two tied notes; total length the same. |
| B5 | Dotted whole in 3/4 (crosses two bar lines) | Pieces from `gcdMap`, each tied to the next. |
| B6 | Rests that cross a bar line | Split into rests; no ties. |
| B7 | A quarter-note triplet that fits | Placed whole with correct indices. |
| B8 | A triplet that straddles the new bar line | Rest fills the bar; the tuplet starts the next measure; all notes kept. |
| B9 | A tuplet longer than the new measure | Plain notes, all kept, in order. |
| B10 | Two voices in the range | Each voice laid out on its own; voice 1 unchanged in order. |
| B11 | Two staves with different rhythms | Each re-barred; both have the same measure count. |
| B12 | Dynamics, lyrics, chords, articulations on notes, one of them split | Markings stay with the (first piece of the) same note. |
| B13 | A slur and a tie across the old bar line, and a hairpin | End selectors point at the same notes after the change; ties added for splits. |
| B14 | Alternating 3/4+2/4 | Measures alternate 3/4, 2/4, ...; all music fits. |
| B15 | Range in the middle, Remaining, Score | Measures before and after unchanged except their index; modifiers after the range shift by `added`. |
| B16 | Added measures | Copy the settings (key, clef, tempo) of the old last measure of the range. |
| B17 | Same-length meter (4/4 to 2/2) | `timeSignatureKeepsLength` is true; `timeSignatureChanges` is true. |
| B18 | `timeSignatureChanges` with an equal signature | False. |
| B19 | Fewer measures needed (3 measures of 3/4 to 6/4) | No measure removed; extra measures are rests. |
| B20 | Serialize (full form) and reload after a re-bar | Same music; measure count the same. |
| B21 | Invalid range | `added` is 0; score unchanged. |
| B22 | Old path regression: `SmoOperation.setTimeSignature` 4/4 to 3/4 | Keeps what fits; two measures; as before. |
| B23 | Copy buffer | `PasteBuffer` contents are unchanged by a re-bar. |
