/**
 * Headless checks for the 'measureNumber' SmoRehearsalMark cardinality: the text derived by
 * SmoMeasure.getRehearsalMarkText(), serialization, and interaction with rehearsal mark
 * auto-increment in SmoSystemStaff.
 * See specs/026-rehearsal-mark-measure-number.
 *
 * Run with: npm run test:rehearsal-measure-number
 */
import { SmoScore } from '../src/smo/data/score';
import { SmoMeasure } from '../src/smo/data/measure';
import { SmoSystemStaff } from '../src/smo/data/systemStaff';
import { SmoSelection } from '../src/smo/xform/selections';
import { SmoOperation } from '../src/smo/xform/operations';
import { SmoRehearsalMark, SmoRehearsalMarkParams, measureModifierDynamicCtorInit } from '../src/smo/data/measureModifiers';
import { noteModifierDynamicCtorInit } from '../src/smo/data/noteModifiers';
import { staffModifierDynamicCtorInit } from '../src/smo/data/staffModifiers';
import { scoreModifierDynamicCtorInit } from '../src/smo/data/scoreModifiers';

// The smo layer registers its deserialization factories at app start; do the same here
// without pulling in any UI.
noteModifierDynamicCtorInit();
measureModifierDynamicCtorInit();
staffModifierDynamicCtorInit();
scoreModifierDynamicCtorInit();

let failures = 0;
const check = (name: string, condition: boolean, detail?: string) => {
  if (condition) {
    console.log(`PASS ${name}`);
  } else {
    failures += 1;
    console.log(`FAIL ${name}${detail ? ' -- ' + detail : ''}`);
  }
};

const markParams = (cardinality: string, symbol: string): SmoRehearsalMarkParams => {
  return { ...SmoRehearsalMark.defaults, cardinality, symbol };
};

/** A staff with the given number of measures, numbered. */
const makeStaff = (measureCount: number): SmoSystemStaff => {
  const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
  while (score.staves[0].measures.length < measureCount) {
    score.addMeasure(score.staves[0].measures.length);
  }
  const staff = score.staves[0];
  staff.numberMeasures();
  return staff;
};

const textAt = (staff: SmoSystemStaff, index: number) => staff.measures[index].getRehearsalMarkText();
const markAt = (staff: SmoSystemStaff, index: number) => staff.measures[index].getRehearsalMark() as SmoRehearsalMark;

// --- Text derivation (FR-002, FR-004) ---
{
  const measure = SmoMeasure.getDefaultMeasure(SmoMeasure.defaults);
  check('no mark -> undefined', measure.getRehearsalMarkText() === undefined);

  measure.measureNumber.displayMeasure = 16;
  measure.measureNumber.measureIndex = 16;
  measure.addRehearsalMark(markParams('measureNumber', 'A'));
  check('measureNumber text is displayMeasure + 1', measure.getRehearsalMarkText() === '17',
    `got ${measure.getRehearsalMarkText()}`);
  check('measureNumber leaves stored symbol alone', (measure.getRehearsalMark() as SmoRehearsalMark).symbol === 'A');

  measure.addRehearsalMark(markParams('capitals', 'C'));
  check('capitals text is the symbol', measure.getRehearsalMarkText() === 'C');
  measure.addRehearsalMark(markParams('numbers', '3'));
  check('numbers text is the symbol', measure.getRehearsalMarkText() === '3');
  measure.addRehearsalMark(markParams('lowerCase', 'b'));
  check('lowerCase text is the symbol', measure.getRehearsalMarkText() === 'b');

  const fallback = SmoMeasure.getDefaultMeasure(SmoMeasure.defaults);
  fallback.measureNumber.displayMeasure = NaN;
  fallback.measureNumber.measureIndex = 4;
  fallback.addRehearsalMark(markParams('measureNumber', 'A'));
  check('measureNumber falls back to measureIndex + 1', fallback.getRehearsalMarkText() === '5',
    `got ${fallback.getRehearsalMarkText()}`);
  fallback.measureNumber.measureIndex = NaN;
  check('measureNumber falls back to symbol last', fallback.getRehearsalMarkText() === 'A');
}

// --- Serialization (FR-005, constitution principle #1) ---
{
  const mark = new SmoRehearsalMark(markParams('measureNumber', 'A'));
  const ser = mark.serialize();
  check('measureNumber cardinality is serialized', ser.cardinality === 'measureNumber');
  const round = new SmoRehearsalMark(JSON.parse(JSON.stringify(ser)));
  check('measureNumber cardinality survives a round trip', round.cardinality === 'measureNumber');

  const legacy = new SmoRehearsalMark({ ctor: 'SmoRehearsalMark', symbol: 'B' } as any);
  check('legacy mark loads as capitals', legacy.cardinality === 'capitals' && legacy.symbol === 'B');
}

// --- Auto-increment interaction (FR-007) ---
{
  const staff = makeStaff(6);
  staff.addRehearsalMark(1, markParams('capitals', 'A'));
  staff.addRehearsalMark(3, markParams('measureNumber', 'A'));
  staff.addRehearsalMark(5, markParams('capitals', 'A'));
  check('letter marks still advance around a measureNumber mark',
    markAt(staff, 1).symbol === 'A' && markAt(staff, 5).symbol === 'B',
    `got ${markAt(staff, 1).symbol}, ${markAt(staff, 5).symbol}`);
  check('measureNumber mark text is its measure number', textAt(staff, 3) === '4', `got ${textAt(staff, 3)}`);
  check('measureNumber mark symbol not resequenced', markAt(staff, 3).symbol === 'A');

  staff.removeRehearsalMark(1);
  check('removing a letter mark leaves the measureNumber mark unchanged',
    markAt(staff, 3).symbol === 'A' && textAt(staff, 3) === '4');
  check('removing a letter mark re-letters later letter marks', markAt(staff, 5).symbol === 'A',
    `got ${markAt(staff, 5).symbol}`);

  // Removing a measureNumber mark must not push its symbol into the letter marks after it.
  const staff3 = makeStaff(6);
  staff3.addRehearsalMark(1, markParams('measureNumber', 'Q'));
  staff3.addRehearsalMark(2, markParams('capitals', 'A'));
  staff3.addRehearsalMark(4, markParams('capitals', 'A'));
  staff3.removeRehearsalMark(1);
  check('removing a measureNumber mark does not resequence letter marks',
    markAt(staff3, 2).symbol === 'A' && markAt(staff3, 4).symbol === 'B',
    `got ${markAt(staff3, 2).symbol}, ${markAt(staff3, 4).symbol}`);

  // Adding a second measureNumber mark must not rewrite the first one's symbol.
  const staff2 = makeStaff(6);
  staff2.addRehearsalMark(1, markParams('measureNumber', 'Q'));
  staff2.addRehearsalMark(4, markParams('measureNumber', 'Q'));
  check('adjacent measureNumber marks keep their symbols',
    markAt(staff2, 1).symbol === 'Q' && markAt(staff2, 4).symbol === 'Q');
  check('adjacent measureNumber marks show their own numbers', textAt(staff2, 1) === '2' && textAt(staff2, 4) === '5');
}

// --- Renumbering (FR-003) ---
{
  const staff = makeStaff(6);
  staff.addRehearsalMark(4, markParams('measureNumber', 'A'));
  check('baseline text before renumbering', textAt(staff, 4) === '5');
  staff.renumberingMap[2] = 10;
  staff.numberMeasures();
  check('text follows renumbering, not measureIndex', textAt(staff, 4) === '13', `got ${textAt(staff, 4)}`);

  const staff2 = makeStaff(6);
  staff2.addRehearsalMark(3, markParams('measureNumber', 'A'));
  const before = parseInt(textAt(staff2, 3) as string, 10);
  staff2.addMeasure(1, SmoMeasure.getDefaultMeasureWithNotes(SmoMeasure.defaults));
  staff2.numberMeasures();
  // the mark moved with its measure, which is now one later
  const moved = staff2.measures.findIndex((mm) => mm.getRehearsalMark());
  check('mark stays attached to its measure when a measure is inserted before it', moved === 4, `index ${moved}`);
  check('text increments when a measure is inserted before the mark',
    parseInt(textAt(staff2, moved) as string, 10) === before + 1, `got ${textAt(staff2, moved)}`);
}

// --- Repeated edits from the dialog: the score's copy must stay findable by the dialog's mark id ---
{
  const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
  while (score.staves[0].measures.length < 4) {
    score.addMeasure(score.staves[0].measures.length);
  }
  const selection = SmoSelection.measureSelection(score, 0, 2)!;
  const findById = (id: string) => score.staves[0].measures.find((mm) => mm.getRehearsalMark()?.attrs.id === id);

  // what SuiScoreViewOperations.updateRehearsalMark does: remove, then add a copy of the dialog's mark
  const apply = (mark: SmoRehearsalMark) => {
    SmoOperation.removeRehearsalMark(score, selection);
    SmoOperation.addRehearsalMark(score, selection, mark);
  };
  apply(new SmoRehearsalMark(markParams('capitals', 'A')));
  const dialogMark = score.staves[0].measures[2].getRehearsalMark() as SmoRehearsalMark;
  const backup = new SmoRehearsalMark(dialogMark.serialize());
  backup.attrs.id = dialogMark.attrs.id;

  dialogMark.increment = false;
  apply(dialogMark);
  check('mark is still found by id after the first edit', findById(dialogMark.attrs.id) !== undefined);
  dialogMark.symbol = 'Z';
  apply(dialogMark);
  check('second edit still finds the mark', findById(dialogMark.attrs.id) !== undefined);
  check('second edit is saved', (markAt(score.staves[0], 2)).symbol === 'Z' && markAt(score.staves[0], 2).increment === false);

  apply(backup);
  check('backup restores the original settings', markAt(score.staves[0], 2).symbol === 'A' && markAt(score.staves[0], 2).increment === true);
  check('backup is findable by the dialog id', findById(backup.attrs.id) !== undefined);
}

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exit(1);
}
console.log('All checks passed');
