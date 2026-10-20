# Contract: Select Voice

Headless cases S1 to S14 are verified by `tests/selectVoice.ts` (`npm run test:select-voice`) against in-memory scores. Manual cases M1 to M10 are in [quickstart.md](../quickstart.md). Spec references: [spec.md](../spec.md).

## Test score used by S-cases

Two staves, 6 measures each, 4/4. Staff 0: voice 0 on every measure as four quarter notes; voice 1 on measures 0 to 2 (measure 0: a single whole note; measure 1: two half notes; measure 2: four quarter notes); voice 2 on measure 2 only. Staff 1: voice 0 on every measure; voice 1 on measure 1 only. Measure 3 of staff 0 has voice 0 as four quarter rests. Helpers build selections from tick ranges (as the tracker would hold them).

## Headless cases

| ID | Case | Expected | Spec |
|----|------|----------|------|
| S1 | `voiceChoices` with a selection in one single-voice measure (staff 0, measure 4) | `[]` | FR-003, US2.1 |
| S2 | `voiceChoices` with no selection | `[]` | FR-003, US2.5 |
| S3 | Selection in staff 0 measure 0 (voices 0, 1) | `[0, 1]` | FR-002, US2.2 |
| S4 | Selection in measures 0 to 2 of staff 0 (voice 2 only in measure 2) | `[0, 1, 2]` | FR-002 |
| S5 | `voiceChoices` with a selection spanning measures 3 and 4 of staff 0 (both single-voice) | `[]` | FR-003 |
| S6 | One note selected in measure 0 (the third quarter of voice 0); `getVoiceSelectors` voice 1 | one selector: the whole note of measure 0 voice 1 | FR-004, FR-005, US1.2 |
| S7 | Measure 1 selected; voice 1 (two half notes) | two selectors ticks 0 and 1, even though voice 0 has four notes | FR-005, US1.3 |
| S8 | Measures 0 to 2 selected; voice 1 | 1 + 2 + 4 = 7 selectors, in measure then tick order, all voice 1 | FR-004, US1.1 |
| S9 | Measures 0 to 2 selected; voice 2 | only the four notes of measure 2 | FR-007, US2.3 |
| S10 | Measures 0 to 1 selected; voice 2 (no notes anywhere in them) | `[]` | FR-008, US2.4 |
| S11 | Selection on staff 0 and staff 1, measure 1; voice 1 | staff 0 two notes and staff 1 its voice 1 notes; neither staff gets the other's | FR-004, US1.4 |
| S12 | Selection on staff 0 and staff 1, measure 0; voice 1 | staff 0's whole note only; staff 1 (no voice 1 in measure 0) contributes nothing and gets no voice | FR-007 |
| S13 | Measure 3 selected (voice 0 all rests); voice 0 | four selectors for the rests | edge case, rests |
| S14 | `getVoiceSelectors` leaves the score unchanged: serialize before and after; voice counts per measure unchanged | identical | FR-007, FR-009, SC-004 |
| S15 | voice 4 and voice -1 | `[]` | robustness |
| S16 | selectors contain no `pitches` entries (whole notes) and the voice field equals the requested voice | true | FR-006 |

## Manual cases

| ID | Case | Expected | Spec |
|----|------|----------|------|
| M1 | Select a single-voice measure, open Edit | no Select Voice entry | FR-003 |
| M2 | Select a two-voice measure, open Edit > Select Voice | Voice 1 and Voice 2 | FR-002 |
| M3 | Select one note, Select Voice > Voice 2 | all voice 2 notes of that measure are highlighted, none of voice 1 | US1.2 |
| M4 | Select measures 1 to 4, Select Voice > Voice 2, then change pitch with the arrow keys | only voice 2 changes | SC-002, US1.5 |
| M5 | Choose a voice with no notes in the selected measures (if offered by another selected measure) | selection unchanged | FR-008 |
| M6 | Select Voice several times alternating voices, then Undo | Undo applies to the last edit, not the selections | FR-009, US3.2 |
| M7 | Two staves selected | the chosen voice is selected on both | US1.4 |
| M8 | Part view | works on displayed measures | edge case |
| M9 | After Select Voice, use arrow keys | navigation continues from the selection | edge case |
| M10 | Voices menu still behaves as before | unchanged | FR-011 |
