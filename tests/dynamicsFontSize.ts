/**
 * Headless checks for the font size of dynamic markings: the allowed range, the default, serialization,
 * loading scores saved before the size could be set, and applying a marking to selected notes.  Cases are
 * listed in specs/040-dynamics-dialog-cleanup/contracts/dynamics-dialog.md.
 *
 * Run with: npm run test:dynamics-font-size
 */
import { SmoScore } from '../src/smo/data/score';
import { SmoNote } from '../src/smo/data/note';
import { SmoDynamicText, noteModifierDynamicCtorInit } from '../src/smo/data/noteModifiers';
import { measureModifierDynamicCtorInit } from '../src/smo/data/measureModifiers';
import { staffModifierDynamicCtorInit } from '../src/smo/data/staffModifiers';
import { scoreModifierDynamicCtorInit } from '../src/smo/data/scoreModifiers';
import { SmoSelection } from '../src/smo/xform/selections';
import { SmoOperation } from '../src/smo/xform/operations';

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

/** A default score whose first measure has the given number of quarter notes (which can be fewer than four) */
const buildScore = (noteCount: number): SmoScore => {
  const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
  const measure = score.staves[0].measures[0];
  const proto = measure.voices[0].notes[0];
  const notes: SmoNote[] = [];
  for (let i = 0; i < noteCount; ++i) {
    const note = SmoNote.cloneWithDuration(proto, 4096);
    note.noteType = 'n';
    notes.push(note);
  }
  measure.voices[0].notes = notes;
  return score;
};
const pick = (score: SmoScore, tick: number): SmoSelection => SmoSelection.noteSelection(score, 0, 0, 0, tick)!;
const marking = (fontSize?: number, text?: string): SmoDynamicText => {
  const params = SmoDynamicText.defaults;
  if (fontSize !== undefined) {
    params.fontSize = fontSize;
  }
  if (text !== undefined) {
    params.text = text;
  }
  return new SmoDynamicText(params);
};
const markingsOn = (score: SmoScore, tick: number): SmoDynamicText[] =>
  score.staves[0].measures[0].voices[0].notes[tick].getModifiers('SmoDynamicText') as SmoDynamicText[];
const save = (score: SmoScore): SmoScore => SmoScore.deserialize(JSON.stringify(score.serialize()));
const valid = (value: any): boolean => SmoDynamicText.isValidFontSize(value);

// --- the range ---
check('M1 a new marking has the default size, 30', marking().fontSize === 30);
check('M2 1, 30 and 99 are valid sizes', valid(1) && valid(30) && valid(99));
check('M3 0, -5, 100 and 1000 are not valid sizes', !valid(0) && !valid(-5) && !valid(100) && !valid(1000));
check('M4 fractions, NaN and infinities are not valid sizes',
  !valid(12.5) && !valid(NaN) && !valid(Infinity) && !valid(-Infinity));
check('M5 text and undefined are not valid sizes', !valid('30') && !valid(undefined) && !valid(null));
check('M6 the limits are 1 and 99', SmoDynamicText.minFontSize === 1 && SmoDynamicText.maxFontSize === 99);

// --- serialization ---
check('S1 a marking with the default size is saved without a size', !('fontSize' in (marking().serialize() as any)));
check('S2 a marking with a size of 48 is saved with it', (marking(48).serialize() as any).fontSize === 48);
{
  const score = buildScore(2);
  SmoOperation.addDynamic(pick(score, 0), marking(48));
  SmoOperation.addDynamic(pick(score, 1), marking());
  const back = save(score);
  check('S3 sizes survive a save and load, and a default size stays the default',
    markingsOn(back, 0).length === 1 && markingsOn(back, 0)[0].fontSize === 48
    && markingsOn(back, 1).length === 1 && markingsOn(back, 1)[0].fontSize === 30);
}
{
  // What an older version saved: no size at all
  const params: any = SmoDynamicText.defaults;
  delete params.fontSize;
  check('S4 a marking saved without a size loads with 30', new SmoDynamicText(params).fontSize === 30);
}
{
  // The abbreviated form lists every field name in its dictionary, so look at the full form
  const fullForm = { skipStaves: false, useDictionary: false, preserveStaffIds: false };
  const score = buildScore(1);
  const mark = marking(48);
  SmoOperation.addDynamic(pick(score, 0), mark);
  const withSize = JSON.stringify(score.serialize(fullForm));
  mark.fontSize = 30;
  SmoOperation.addDynamic(pick(score, 0), mark);
  const withoutSize = JSON.stringify(score.serialize(fullForm));
  const back = save(score);
  check('S5 a size is saved, and a size set back to the default is not',
    withSize.indexOf('"fontSize":48') >= 0 && withoutSize.indexOf('"fontSize"') < 0 && markingsOn(back, 0)[0].fontSize === 30,
    `with: ${withSize.indexOf('"fontSize":48')}, without: ${withoutSize.indexOf('"fontSize"')}`);
}

// --- applying one marking to the selected notes ---
{
  const score = buildScore(3);
  const mark = marking(30, 'mf');
  const selections = [0, 1, 2].map((tick) => pick(score, tick));
  selections.forEach((sel) => SmoOperation.addDynamic(sel, mark));
  mark.fontSize = 40;
  selections.forEach((sel) => SmoOperation.addDynamic(sel, mark));
  check('A1 changing the size and applying again leaves one marking of the new size on each note',
    [0, 1, 2].every((tick) => markingsOn(score, tick).length === 1 && markingsOn(score, tick)[0].fontSize === 40));
  selections.forEach((sel) => SmoOperation.removeDynamic(sel, mark));
  check('A2 removing the marking from each selected note leaves none',
    [0, 1, 2].every((tick) => markingsOn(score, tick).length === 0));
}
{
  const score = buildScore(2);
  SmoOperation.addDynamic(pick(score, 0), marking(48, 'ff'));
  check('A3 a marking on one note leaves the other note alone', markingsOn(score, 0).length === 1 && markingsOn(score, 1).length === 0);
}

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('all checks passed');
}
