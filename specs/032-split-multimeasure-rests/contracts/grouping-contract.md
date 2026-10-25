# Contract: Multimeasure Rest Grouping

Headless cases G1 to G24 are verified by `tests/multimeasureRest.ts` (`npm run test:multimeasure-rest`). Manual cases M1 to M10 are in [quickstart.md](../quickstart.md). Spec references: [spec.md](../spec.md).

## Test scores used by G-cases

A one-staff score of 12 measures in 4/4 containing only rests (so a run of 12), exposed as a part with `expandMultimeasureRests` false. Each case adds the landmarks named, calls `SmoOperation.computeMultipartRest`, and reads the blocks as a list of `start:length` for measures that have `multimeasureLength > 0`, plus the list of measures with `hideMultimeasure`. Measure numbers below are 1-based as in the spec, 0-based in the test.

## Headless cases

| ID | Case | Expected | Spec |
|----|------|----------|------|
| G1 | No landmarks | one block `1:12`; measures 2 to 12 hidden | FR-001, SC-004 |
| G2 | Rehearsal mark on measure 6 | blocks `1:5`, `6:7`; measure 6 not hidden, no lone bar | US1.1, FR-003, FR-006 |
| G3 | Rehearsal mark on measure 1 | one block `1:12` | US1.2 |
| G4 | Rehearsal mark on measure 12, nothing after | blocks `1:11`; measure 12 is an ordinary bar (no length, not hidden) | US1.3, FR-007 |
| G5 | Rehearsal marks on 4 and 8 | blocks `1:3`, `4:4`, `8:5` | US1.4 |
| G6 | Key signature change at measure 5 | blocks `1:4`, `5:8` | US2.1 |
| G7 | Time signature change at measure 5 | blocks `1:4`, `5:8` | US2.2 |
| G8 | Tempo change (displayed) at measure 5 | blocks `1:4`, `5:8` | US2.3, clarification |
| G9 | Tempo change with `display` false | one block `1:12` | research §2 |
| G10 | Key change and rehearsal mark both on measure 5 | blocks `1:4`, `5:8`, one split only | US2.4 |
| G11 | Segno on measure 5 | blocks `1:4`, `5:8` | US3.2 |
| G12 | Coda on measure 9 | blocks `1:8`, `9:4` | US3.2 |
| G13 | D.S. al Coda on measure 4 | blocks `1:4` (measure 4 included, last of block), `5:8`; the end symbol is recorded on measure 1 | US3.1, FR-005 |
| G14 | To Coda on measure 6 | blocks `1:6`, `7:6`; end symbol recorded on measure 1 | US3.1 |
| G15 | D.C. al Fine on measure 1 | measure 1 alone (ordinary bar with the symbol), then block `2:11` | edge case |
| G16 | End-repeat barline on the end of measure 4 | blocks `1:4`, `5:8`; `multimeasureEndBarline` of measure 1 is the repeat barline | US3.3 |
| G17 | Start-repeat barline on the start of measure 5 | blocks `1:4`, `5:8` | US3.4 |
| G18 | Double bar as the end barline of measure 4, and separately as the start barline of measure 5 | blocks `1:4`, `5:8` in both cases | US3.3, US3.4 |
| G19 | Instrument change at measure 7 | blocks `1:6`, `7:6` | FR-004 |
| G20 | Rehearsal mark and D.S. both on measure 5 | blocks `1:4`, `5:1` (ordinary bar with both), `6:7` | edge case, FR-007 |
| G21 | `expandMultimeasureRests` true with landmarks | no block anywhere | FR-010 |
| G22 | A volta ending over measures 5 to 6 | measures 5 and 6 are ordinary bars; blocks before and after | FR-010 |
| G23 | Two staves, rehearsal mark on measure 6 of the second staff only | both staves have blocks `1:5`, `6:7` | FR-008 |
| G24 | Regrouping after removing the rehearsal mark | back to one block `1:12`; no stale length, hidden flag or end symbol on any measure | FR-011, SC-005 |

Counts: the lengths of the blocks plus the ordinary bars add up to 12 in every case (FR-009), checked inside each case.

## Manual cases

| ID | Case | Expected | Spec |
|----|------|----------|------|
| M1 | Part view, 10 empty measures, rehearsal mark on measure 6 | two multimeasure rests, the mark over the second, no bar between | US1.1 |
| M2 | Key change at measure 5 | new key signature at the start of the second rest | US2.1 |
| M3 | Time signature change at measure 5 | new time signature at the start of the second rest | US2.2 |
| M4 | Tempo change at measure 5 | tempo marking over the second rest | US2.3 |
| M5 | D.S. al Coda on measure 4, Coda on measure 9 | the D.S. over the first rest, the Coda sign at the start of the last rest after the barline | US3 |
| M6 | End repeat bar after measure 4 | repeat barline at the end of the first rest, once | US3.3, FR-007a |
| M7 | Add then remove a rehearsal mark | rests regroup on the next full layout; no stale bar | FR-011 |
| M8 | Two-staff part | same grouping on both staves | FR-008 |
| M9 | "Expand multimeasure rests" on | every measure shown | FR-010 |
| M10 | Print preview | same grouping | edge case |
