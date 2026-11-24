/**
 * Headless checks for SmoSelection.timeRangeSelections, which the tracker uses to extend a selection
 * (shift-click, shift-arrow) across staves that have different numbers of notes.
 *
 * Run with: npm run test:time-range-select
 */
import { SmoScore } from '../src/smo/data/score';
import { SmoMeasure } from '../src/smo/data/measure';
import { SmoNote } from '../src/smo/data/note';
import { SmoSystemStaff } from '../src/smo/data/systemStaff';
import { SmoInstrument } from '../src/smo/data/staffModifiers';
import { SmoSelection, SmoSelector } from '../src/smo/xform/selections';
import { noteModifierDynamicCtorInit } from '../src/smo/data/noteModifiers';
import { measureModifierDynamicCtorInit } from '../src/smo/data/measureModifiers';
import { staffModifierDynamicCtorInit } from '../src/smo/data/staffModifiers';
import { scoreModifierDynamicCtorInit } from '../src/smo/data/scoreModifiers';

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

const WHOLE = 16384;
const setVoice = (measure: SmoMeasure, voice: number, lengths: number[]) => {
  while (measure.voices.length <= voice) {
    measure.populateVoice(measure.voices.length);
  }
  const template = measure.voices[voice].notes[0];
  measure.voices[voice].notes = lengths.map((ticks) => {
    const note = SmoNote.clone(template);
    note.ticks = { numerator: ticks, denominator: 1, remainder: 0 };
    note.noteType = 'n';
    return note;
  });
};
const QUARTERS = [4096, 4096, 4096, 4096];
const EIGHTHS = [2048, 2048, 2048, 2048, 2048, 2048, 2048, 2048];

/** Staff 0: quarters (4 notes) in every measure.  Staff 1: eighths (8 notes) in measures 0-1, a whole note in measure 2. */
const buildScore = (): SmoScore => {
  const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
  while (score.staves[0].measures.length < 4) {
    score.addMeasure(score.staves[0].measures.length - 1);
  }
  const instrument = SmoInstrument.defaults;
  instrument.startSelector.staff = instrument.endSelector.staff = 1;
  const staffParams = SmoSystemStaff.defaults;
  staffParams.staffId = 1;
  staffParams.measureInstrumentMap[0] = new SmoInstrument(instrument);
  score.addStaff(staffParams);
  score.staves[0].measures.forEach((m) => setVoice(m, 0, QUARTERS));
  score.staves[1].measures.forEach((m, ix) => setVoice(m, 0, ix < 2 ? EIGHTHS : ix === 2 ? [WHOLE] : QUARTERS));
  return score;
};
const sel = (staff: number, measure: number, tick: number, voice: number = 0): SmoSelector =>
  ({ staff, measure, voice, tick, pitches: [] });
const ticksOf = (selections: SmoSelection[]) => selections.map((s) => `${s.selector.measure}.${s.selector.tick}`).join(' ');

const score = buildScore();
check('builder: staves have different note counts',
  score.staves[0].measures[0].voices[0].notes.length === 4 && score.staves[1].measures[0].voices[0].notes.length === 8);

// T1: the range is the same staff, nothing changes
check('T1 same staff, quarter 1 to quarter 2',
  ticksOf(SmoSelection.timeRangeSelections(score, 0, sel(0, 0, 1), sel(0, 0, 2))) === '0.1 0.2');
// T2: the bug: the other staff has twice the notes.  Quarters 1-2 of staff 0 are eighths 2-5 of staff 1.
check('T2 other staff with more notes follows elapsed time',
  ticksOf(SmoSelection.timeRangeSelections(score, 1, sel(0, 0, 1), sel(0, 0, 2))) === '0.2 0.3 0.4 0.5',
  ticksOf(SmoSelection.timeRangeSelections(score, 1, sel(0, 0, 1), sel(0, 0, 2))));
// T3: and the other direction, from the denser staff to the sparser one
check('T3 other staff with fewer notes follows elapsed time',
  ticksOf(SmoSelection.timeRangeSelections(score, 0, sel(1, 0, 2), sel(1, 0, 5))) === '0.1 0.2',
  ticksOf(SmoSelection.timeRangeSelections(score, 0, sel(1, 0, 2), sel(1, 0, 5))));
// T4: the end points can be given in either order
check('T4 order of the selectors does not matter',
  ticksOf(SmoSelection.timeRangeSelections(score, 1, sel(0, 0, 2), sel(0, 0, 1))) === '0.2 0.3 0.4 0.5');
// T5: across measures
check('T5 across measures',
  ticksOf(SmoSelection.timeRangeSelections(score, 1, sel(0, 0, 3), sel(0, 1, 0))) === '0.6 0.7 1.0 1.1',
  ticksOf(SmoSelection.timeRangeSelections(score, 1, sel(0, 0, 3), sel(0, 1, 0))));
// T6: a long note in the other staff that covers the range is selected once
check('T6 a long note covering the range is selected',
  ticksOf(SmoSelection.timeRangeSelections(score, 1, sel(0, 2, 1), sel(0, 2, 2))) === '2.0',
  ticksOf(SmoSelection.timeRangeSelections(score, 1, sel(0, 2, 1), sel(0, 2, 2))));
// T7: a note that began before the range but is still sounding at its start is included
check('T7 a note sounding at the start is included',
  ticksOf(SmoSelection.timeRangeSelections(score, 0, sel(1, 0, 1), sel(1, 0, 2))) === '0.0 0.1',
  ticksOf(SmoSelection.timeRangeSelections(score, 0, sel(1, 0, 1), sel(1, 0, 2))));
// T8: the whole measure
check('T8 whole measure in the other staff',
  ticksOf(SmoSelection.timeRangeSelections(score, 1, sel(0, 1, 0), sel(0, 1, 3))) === '1.0 1.1 1.2 1.3 1.4 1.5 1.6 1.7');
// T9: bad input
check('T9 a selector that is not in the score gives nothing',
  SmoSelection.timeRangeSelections(score, 1, sel(0, 0, 9), sel(0, 0, 2)).length === 0 &&
  SmoSelection.timeRangeSelections(score, 7, sel(0, 0, 1), sel(0, 0, 2)).length === 0);

if (failures > 0) {
  console.log(`${failures} FAILED`);
  process.exit(1);
}
console.log('ALL PASS');
