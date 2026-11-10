/**
 * Headless checks for the Quick Beam and Stem Direction menu choices: autobeaming selected notes, and
 * setting the stem direction of selected notes to up, down or auto.
 *
 * Run with: npm run test:quick-beam
 */
import { SmoScore } from '../src/smo/data/score';
import { SmoNote } from '../src/smo/data/note';
import { SmoTimeSignature } from '../src/smo/data/measureModifiers';
import { SmoBeamer } from '../src/smo/xform/beamers';
import { SmoOperation } from '../src/smo/xform/operations';
import { SmoSelection } from '../src/smo/xform/selections';
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

const E = 2048;
/** A score whose first measure has the given meter and n eighth notes */
const scoreWith = (actualBeats: number, beatDuration: number, count: number): SmoScore => {
  const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
  const measure = score.staves[0].measures[0];
  const tsParams = SmoTimeSignature.defaults;
  tsParams.times = [{ actualBeats, beatDuration }];
  measure.timeSignature = new SmoTimeSignature(tsParams);
  const proto = measure.voices[0].notes[0];
  measure.voices[0].notes = new Array(count).fill(E).map((tt) => {
    const note = SmoNote.cloneWithDuration(proto, tt);
    note.noteType = 'n';
    return note;
  });
  return score;
};
const select = (score: SmoScore, from: number, to: number): SmoSelection[] => {
  const rv: SmoSelection[] = [];
  for (let i = from; i <= to; ++i) {
    rv.push(SmoSelection.noteSelection(score, 0, 0, 0, i)!);
  }
  return rv;
};
const notesOf = (score: SmoScore) => score.staves[0].measures[0].voices[0].notes;
const sizes = (score: SmoScore) => {
  const measure = score.staves[0].measures[0];
  SmoBeamer.applyBeams(measure);
  return measure.beamGroups.map((bg) => bg.notes.length).join(',');
};
const { auto, continue: cont, end } = SmoNote.beamStates;

// --- autobeam ---
{
  const score = scoreWith(4, 4, 8);
  const notes = notesOf(score);
  notes[1].beamState = end;
  notes[2].beamState = cont;
  notes[3].beamBeats = 2048;
  notes[3].endBeam = true;
  SmoOperation.autoBeamSelections(score, select(score, 1, 3));
  check('Q1 selected notes go back to the auto beam state', notes.slice(1, 4).every((nn) => nn.beamState === auto));
  check('Q2 selected notes get the default beam length for the meter',
    notes.slice(1, 4).every((nn) => nn.beamBeats === score.preferences.defaultDupleDuration));
  check('Q3 the end-beam flag is cleared', (notes[3].endBeam as boolean) === false);
}
{
  const score = scoreWith(6, 8, 6);
  const notes = notesOf(score);
  SmoOperation.autoBeamSelections(score, select(score, 0, 5));
  check('Q4 a triple meter gets the triple default', notes.every((nn) => nn.beamBeats === score.preferences.defaultTripleDuration));
}
{
  const score = scoreWith(4, 4, 8);
  const notes = notesOf(score);
  notes[1].beamState = end;
  notes[5].beamState = end;
  SmoOperation.autoBeamSelections(score, select(score, 0, 3));
  check('Q5 notes outside the selection are not changed', notes[5].beamState === end && notes[1].beamState === auto);
}
{
  // Autobeaming a hand-beamed 5/8 measure with a grouping brings the grouping back
  const score = scoreWith(5, 8, 5);
  score.staves[0].measures[0].setBeamGroups([3, 2]);
  SmoOperation.beamSelections(score, select(score, 2, 4));
  const handBeamed = sizes(score);
  SmoOperation.autoBeamSelections(score, select(score, 0, 4));
  check('Q6 hand beam, then autobeam, in a measure grouped 3 + 2', handBeamed === '2,3' && sizes(score) === '3,2',
    `${handBeamed} then ${sizes(score)}`);
}

// --- stem direction ---
{
  const score = scoreWith(4, 4, 8);
  const notes = notesOf(score);
  const { up, down, auto: autoFlag } = SmoNote.flagStates;
  SmoOperation.setStemDirection(select(score, 0, 2), up);
  check('D1 up sets every selected note', notes.slice(0, 3).every((nn) => nn.flagState === up) && notes[3].flagState === autoFlag);
  SmoOperation.setStemDirection(select(score, 1, 3), down);
  check('D2 down sets every selected note', notes.slice(1, 4).every((nn) => nn.flagState === down) && notes[0].flagState === up);
  SmoOperation.setStemDirection(select(score, 0, 3), autoFlag);
  check('D3 auto sets every selected note', notes.slice(0, 4).every((nn) => nn.flagState === autoFlag));
  // Mixed selection: setting is explicit, so it does not depend on the first note, unlike the toggle
  notes[0].flagState = up;
  notes[1].flagState = down;
  SmoOperation.setStemDirection(select(score, 0, 1), up);
  check('D4 a mixed selection all becomes the chosen direction', notes[0].flagState === up && notes[1].flagState === up);
}

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('all checks passed');
}
