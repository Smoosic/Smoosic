# Contract: Voice Copy and Paste

Headless cases V1 to V20 are verified by `tests/voiceCopyPaste.ts` (`npm run test:voice-copy-paste`), which builds real scores in memory and drives the real `PasteBuffer`. Manual cases M1 to M10 are in [quickstart.md](../quickstart.md). Spec references: [spec.md](../spec.md).

## Test score used by V-cases

A single-staff score of 12 measures in 4/4. Measure notes are four quarter notes whose pitches encode their position (so a pasted note can be traced to its source). Voice 1 is on every measure; voice 2 exists on measures 1 to 4 only, as four quarter notes of different pitches; voice 3 on measure 2 only. Measure 6 contains a triplet in voice 1. Measure 10 has one voice only. Helper functions read back "voice v of measure m as a list of `pitch:ticks`".

## Headless cases

| ID | Case | Expected | Spec |
|----|------|----------|------|
| V1 | `copyVoiceChoices(0 / 1 / 2 / 3)` | `[]`, `[0]`, `[0,1,'all']`, `[0,1,2,'all']` | FR-002 |
| V2 | `pasteVoiceChoices([], n)` | `[]` | FR-006 |
| V3 | `pasteVoiceChoices([1], 1)`, `([0], 2)`, `([0], 3)`, `([0], 4)`, `([0], 0)` | `[0,'new']`, `[0,1,'new']`, `[0,1,2,'new']`, `[0,1,2,3]` (no new voice at four), `[]` | FR-006, US2.2 |
| V4 | `pasteVoiceChoices([0,1], 1)` | `['all']` | FR-006 |
| V5 | Copy voice 1 with a selection of the 3rd to 4th note of measure 2 through the 2nd note of measure 3 | copy covers measures 2 to 3 whole; `measureCount` 2; 8 notes | FR-003, US3.1 |
| V6 | Paste that copy, voice 1, into measure 8 voice 1 | measures 8, 9 voice 1 equal measures 2, 3 voice 1, note for note | US2, SC-001 |
| V7 | Paste of V6 leaves voice 2 and 3 of measures 8 to 9 as they were | unchanged | FR-008 |
| V8 | Copy voice 1 of measure 1, paste into voice 2 (existing) of measure 3 | measure 3 voice 2 equals measure 1 voice 1; measure 3 voice 1 unchanged | FR-008, US2.3 |
| V9 | Copy voice 1 of measure 1, paste into voice 2 of measure 10 (no voice 2) | measure 10 now has voice 2 equal to the copied notes; voice 1 unchanged | FR-010, US2.4, SC-003 |
| V10 | Copy voice 2 (measure 1), paste into voice 1 of measure 11 | measure 11 voice 1 equals measure 1 voice 2 (voice number changed) | US2.5 |
| V11 | Copy All of measures 1 to 2 (voices 1, 2, 3 present), paste All at measure 8 (only voice 1) | measures 8 and 9 have voices 1, 2 and 3 equal to the source; measure 9's voice 3 is rests where the source had none | US1.2, FR-009, FR-010, SC-003 |
| V12 | As V11 but destination measure 9 already has voices 1 and 2 | all three voices replaced to match the source; no extra voice | US1.3 |
| V13 | Copy All, paste All onto a measure with a 4th voice not copied | the uncopied voice is unchanged | FR-009 |
| V14 | Copy voice 1 of measures 1 to 4, paste at measure 11 (only 2 measures remain) | measures 11 and 12 receive the first two copied measures; no error | FR-011 |
| V15 | Copy voice 2 across measures 3 to 5 (voice 2 exists only on 3 and 4) | the measure 5 portion is a measure of rests | FR-005 |
| V16 | Copy voice 1 including measure 6 (triplet), paste at measure 9 voice 1 | pasted measure has the triplet intact, registered for voice 1 | FR-012 |
| V17 | Triplet in voice 2 of measure 7 survives a three-measure voice-1 paste over measures 6 to 8 | measure 7's voice-2 tuplet tree is still present | research §3 |
| V18 | Paste into a destination voice that has a tuplet in the second-to-last pasted measure | no stale tuplet tree remains for the replaced notes | research §3 |
| V19 | Copy All, paste All, voices keep their numbers and slurs placed within a voice are carried; copy voice 1, paste into voice 2: a slur is not carried | as stated | FR-012 |
| V20 | Existing Copy and Paste (`setSelections`, `pasteSelections`) on the same score | same result as before this change for single-voice, multi-voice-selected and multi-measure cases | FR-001, SC-005 |

## Manual cases

| ID | Case | Expected | Spec |
|----|------|----------|------|
| M1 | Edit menu shows Copy, Paste, Paste Chords, Undo and the two new entries | present | FR-001 |
| M2 | Copy Voices submenu on a one-voice selection | Voice 1 only | FR-002 |
| M3 | Paste Voice before any Copy Voices | entry not shown | FR-006 |
| M4 | Copy Voices > All, Paste Voice > All | passage appears with all voices | SC-001 |
| M5 | Paste Voice > New Voice at a one-voice destination, and at a destination with four voices | the first adds voice 2 with the copied notes, drawn correctly; the second does not offer New Voice | SC-003, FR-006 |
| M6 | One Undo after M4 and after M5 | all measures restored; created voices gone | FR-013, SC-004 |
| M7 | Part view: copy and paste voices | works on the displayed measures | research §9 |
| M8 | Paste twice at different places | both pastes work | FR-015 |
| M9 | Existing Copy/Paste still work | unchanged | SC-005 |
| M10 | Paste near the end of the score | pastes what fits, no error | FR-011 |
