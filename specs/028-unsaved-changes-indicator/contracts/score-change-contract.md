# Contract: Score Change Tracking and Save Prompt

Implemented across `src/smo/xform/undo.ts`, `src/render/sui/scoreChangeState.ts`, `scoreView.ts`, `scoreViewOperations.ts` and the dialogs in `src/ui`. Headless cases (S1 to S14) are verified by `tests/scoreChangeState.ts` (`npm run test:score-change-state`); UI cases (U1 to U12) are verified manually per [quickstart.md](../quickstart.md). Spec references: [spec.md](../spec.md).

## Headless test cases

| ID | Case | Expected | Spec |
|----|------|----------|------|
| S1 | `UndoBuffer` with no `onAddBuffer` set: `addBuffer` as before | no error, buffer grows | compatibility |
| S2 | `onAddBuffer` set, one `addBuffer` | callback called once | FR-002 |
| S3 | `onAddBuffer` set, several `addBuffer` calls (including while `grouping` is true) | callback called for every call | FR-002 |
| S4 | `reset()` after setting `onAddBuffer`, then `addBuffer` | callback still called (reset does not drop the hook) | FR-002 |
| S5 | `isFullSaveFormat('.json')` | true | FR-004 |
| S6 | `isFullSaveFormat` for `.xml`, `.mid`, `.midi`, `.js` | false | FR-004 |
| S7 | `isFullSaveFormat` for unknown, empty and upper-case (`'.JSON'`) input | false for unknown and empty; true for `.JSON` (case-insensitive) | FR-004 |
| S8 | `formatScoreTitle('My Song', false)` | `'My Song'` | FR-005, FR-006 |
| S9 | `formatScoreTitle('My Song', true)` | `'My Song*'` | FR-006 |
| S10 | `formatScoreTitle('', false)` and `formatScoreTitle('   ', false)` | `'Untitled'` | FR-008 |
| S11 | `formatScoreTitle('', true)` | `'Untitled*'` (no bare asterisk) | FR-008 |
| S12 | `nextStepAfterSave('saved')` | `'load'` | FR-011 |
| S13 | `nextStepAfterSave('exported')` | `'prompt'` | FR-011, scenario 5a |
| S14 | `nextStepAfterSave('cancelled')` | `'abort'` | FR-011, scenario 5 |

## Manual UI cases

| ID | Case | Expected | Spec |
|----|------|----------|------|
| U1 | App starts, header | `Smoosic <name>`, no asterisk | US1.1, US3.2 |
| U2 | Add a note | asterisk appears | US1.2, SC-001 |
| U3 | Edit text (add, modify, remove a text group) | asterisk appears (these bypass the usual undo helpers) | FR-002 |
| U4 | Select, scroll, zoom | no asterisk | FR-003 |
| U5 | Press undo | asterisk appears or stays | edge case |
| U6 | Save dialog, Smoosic format, Save | asterisk clears | US1.3, FR-004 |
| U7 | Save dialog, MusicXML or MIDI, Save | asterisk stays | US1.4a, FR-004 |
| U8 | Quick Save | asterisk clears | FR-004 |
| U9 | Rename in the score-information dialog | header shows the new name | US1.5 |
| U10 | Changed score, File > New / Open / Import / Library, then Don't save | prompt appears first; new score loads, no asterisk | US2.1/2.3, US3.1 |
| U11 | Same, then Cancel | nothing loads; asterisk and content unchanged | US2.4 |
| U12 | Same, then Save and complete a Smoosic-format save | new score loads | US2.2 |
| U13 | Same, then Save and export MusicXML | prompt appears again; new score not loaded | US2.5a |
| U14 | Same, then Save and cancel the Save dialog | new score not loaded; asterisk stays | US2.5 |
| U15 | Unchanged score, then Open | no prompt; loads immediately | US2.6, FR-014 |
| U16 | Open dialog cancelled before choosing a file | no prompt | US2.7 |
| U17 | Open an unreadable file | error handling as before; current score and asterisk unchanged | FR-015 |
