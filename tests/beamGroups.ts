/**
 * Headless checks for per-measure beam groups: the SmoBeamPreferences modifier, the group boundaries,
 * the beams that come out, the operations that set a grouping, and serialization.  Cases are listed
 * in specs/038-per-measure-beam-groups/contracts/beam-groups-api.md.
 *
 * Run with: npm run test:beam-groups
 */
import { SmoScore } from '../src/smo/data/score';
import { SmoMeasure } from '../src/smo/data/measure';
import { SmoNote } from '../src/smo/data/note';
import { SmoTimeSignature, SmoBeamPreferences } from '../src/smo/data/measureModifiers';
import { SmoBeamer } from '../src/smo/xform/beamers';
import { SmoOperation } from '../src/smo/xform/operations';
import { SmoSelection } from '../src/smo/xform/selections';
import { SmoSystemStaff } from '../src/smo/data/systemStaff';
import { SmoInstrument } from '../src/smo/data/staffModifiers';
import { SmoScoreArchive } from '../src/ui/fileio/scoreArchive';
import { noteModifierDynamicCtorInit } from '../src/smo/data/noteModifiers';
import { measureModifierDynamicCtorInit } from '../src/smo/data/measureModifiers';
import { staffModifierDynamicCtorInit } from '../src/smo/data/staffModifiers';
import { scoreModifierDynamicCtorInit } from '../src/smo/data/scoreModifiers';

// In the application JSZip is a global from a script tag.
(global as any).JSZip = require('../src/common/jszip.js');

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

const E = 2048, S = 1024, Q = 4096, DE = 3072;
/** n values of an eighth note */
const eighths = (n: number): number[] => new Array(n).fill(E);
/**
 * A measure with the given time signature, filled with notes of the given tick counts.
 * The notes are notes, not rests, so they can beam.
 */
const buildMeasure = (actualBeats: number, beatDuration: number, ticks: number[]): SmoMeasure => {
  const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
  const measure = score.staves[0].measures[0];
  const tsParams = SmoTimeSignature.defaults;
  tsParams.times = [{ actualBeats, beatDuration }];
  measure.timeSignature = new SmoTimeSignature(tsParams);
  const proto = measure.voices[0].notes[0];
  measure.voices[0].notes = ticks.map((tt) => {
    const note = SmoNote.cloneWithDuration(proto, tt);
    note.noteType = 'n';
    return note;
  });
  return measure;
};
/** The number of notes in each beam group, in order */
const beamSizes = (measure: SmoMeasure): string => {
  SmoBeamer.applyBeams(measure);
  return measure.beamGroups.map((bg) => bg.notes.length).join(',');
};
/** The boundaries, in units (eighths, or sixteenths for x/16) */
const boundaries = (measure: SmoMeasure): string => {
  const unit = SmoBeamPreferences.unitTicks(measure.timeSignature);
  return SmoBeamer.groupBoundaries(measure).map((bb) => bb / unit).join(',');
};
/** Set a grouping on a new measure and return the beam sizes */
const grouped = (actualBeats: number, beatDuration: number, ticks: number[], groups: number[]): string => {
  const measure = buildMeasure(actualBeats, beatDuration, ticks);
  measure.setBeamGroups(groups);
  return beamSizes(measure);
};

// --- SmoBeamPreferences and the measure accessors ---
{
  const prefs = new SmoBeamPreferences({ groups: [3, 2] });
  const ser = prefs.serialize();
  check('P1 serialize', ser.ctor === 'SmoBeamPreferences' && JSON.stringify(ser.groups) === '[3,2]');
  check('P2 valid values', SmoBeamPreferences.isValidGroups([1, 4]) && SmoBeamPreferences.isValidGroups([]));
  check('P3 invalid values', !SmoBeamPreferences.isValidGroups([0]) && !SmoBeamPreferences.isValidGroups([5])
    && !SmoBeamPreferences.isValidGroups([1.5]) && !SmoBeamPreferences.isValidGroups([NaN]));
  let threw = false;
  try {
    new SmoBeamPreferences({ groups: [5] });
  } catch (e) {
    threw = true;
  }
  check('P4 the constructor rejects invalid values', threw);
  check('P5 unit ticks', SmoBeamPreferences.unitTicks(new SmoTimeSignature({ ...SmoTimeSignature.defaults,
    times: [{ actualBeats: 6, beatDuration: 16 }] })) === 1024
    && SmoBeamPreferences.unitTicks(new SmoTimeSignature({ ...SmoTimeSignature.defaults,
      times: [{ actualBeats: 6, beatDuration: 8 }] })) === 2048);
}

// --- boundaries ---
check('B1 5/8 [3,2]', boundaries(buildMeasure(5, 8, eighths(5))) === '' &&
  (() => { const m = buildMeasure(5, 8, eighths(5)); m.setBeamGroups([3, 2]); return boundaries(m); })() === '3,5');
const bnd = (beats: number, den: number, groups: number[]): string => {
  const m = buildMeasure(beats, den, [Q]);
  m.setBeamGroups(groups);
  return boundaries(m);
};
check('B2 5/8 [2,3]', bnd(5, 8, [2, 3]) === '2,5', bnd(5, 8, [2, 3]));
check('B3 12/8 [3]', bnd(12, 8, [3]) === '3,6,9,12', bnd(12, 8, [3]));
check('B4 8/8 [3,3,2]', bnd(8, 8, [3, 3, 2]) === '3,6,8', bnd(8, 8, [3, 3, 2]));
check('B5 10/8 [3,2]', bnd(10, 8, [3, 2]) === '3,5,8,10', bnd(10, 8, [3, 2]));
check('B6 7/8 [3,2]', bnd(7, 8, [3, 2]) === '3,5,7', bnd(7, 8, [3, 2]));
check('B7 6/16 [3]', bnd(6, 16, [3]) === '3,6', bnd(6, 16, [3]));
check('B8 4/4 no grouping', SmoBeamer.groupBoundaries(buildMeasure(4, 4, [Q, Q, Q, Q])).length === 0);
check('B9 3/4 [2,1]', bnd(3, 4, [2, 1]) === '2,3,5,6', bnd(3, 4, [2, 1]));

// --- measure accessors ---
{
  const measure = buildMeasure(5, 8, eighths(5));
  check('A1 no grouping by default', measure.getBeamGroups().length === 0);
  measure.setBeamGroups([3, 2]);
  check('A2 set', JSON.stringify(measure.getBeamGroups()) === '[3,2]');
  measure.setBeamGroups([2, 3]);
  const count = measure.modifiers.filter((mm) => mm.attrs.type === 'SmoBeamPreferences').length;
  check('A3 replaced, not duplicated', count === 1 && JSON.stringify(measure.getBeamGroups()) === '[2,3]');
  const copy = measure.getBeamGroups();
  copy.push(1);
  check('A4 get returns a copy', measure.getBeamGroups().length === 2);
  measure.setBeamGroups([]);
  check('A5 empty removes it', measure.getBeamGroups().length === 0
    && measure.modifiers.filter((mm) => mm.attrs.type === 'SmoBeamPreferences').length === 0);
  const rejected = [[5], [0], [1.5]].every((bad) => {
    try {
      measure.setBeamGroups(bad);
      return false;
    } catch (e) {
      return true;
    }
  });
  check('A6 invalid values rejected', rejected);
  measure.voices[0].notes[1].beamState = SmoNote.beamStates.end;
  measure.setBeamGroups([3, 2]);
  check('A7 notes reset to automatic', measure.voices[0].notes.every((nn) => nn.beamState === SmoNote.beamStates.auto));
}

// --- beaming ---
check('M1 5/8 [3,2]', grouped(5, 8, eighths(5), [3, 2]) === '3,2', grouped(5, 8, eighths(5), [3, 2]));
check('M2 5/8 [2,3]', grouped(5, 8, eighths(5), [2, 3]) === '2,3', grouped(5, 8, eighths(5), [2, 3]));
check('M4 12/8 [3]', grouped(12, 8, eighths(12), [3]) === '3,3,3,3', grouped(12, 8, eighths(12), [3]));
check('M5 8/8 [3,3,2]', grouped(8, 8, eighths(8), [3, 3, 2]) === '3,3,2', grouped(8, 8, eighths(8), [3, 3, 2]));
check('M6 10/8 [3,2]', grouped(10, 8, eighths(10), [3, 2]) === '3,2,3,2', grouped(10, 8, eighths(10), [3, 2]));
check('M7 6/16 [3]', grouped(6, 16, new Array(6).fill(S), [3]) === '3,3', grouped(6, 16, new Array(6).fill(S), [3]));
check('M8 5/8 quarter then three eighths [3,2]', grouped(5, 8, [Q, E, E, E], [3, 2]) === '2',
  grouped(5, 8, [Q, E, E, E], [3, 2]));
check('M9 4/4 dotted figures [4]', grouped(4, 4, [DE, S, DE, S, Q, Q], [4]) === '4',
  grouped(4, 4, [DE, S, DE, S, Q, Q], [4]));
{
  // 7/8 with the partial repeat: 3 + 2 + 2
  check('M13 7/8 [3,2] cut-off repeat', grouped(7, 8, eighths(7), [3, 2]) === '3,2,2', grouped(7, 8, eighths(7), [3, 2]));
  // [1] never beams: every note is its own group
  check('M14 5/8 [1] beams nothing', grouped(5, 8, eighths(5), [1]) === '', grouped(5, 8, eighths(5), [1]));
}
// A hand `end` state still closes a group, and a hand beam with `continue` is not split at a boundary
{
  const m = buildMeasure(5, 8, eighths(5));
  m.setBeamGroups([3, 2]);
  m.voices[0].notes[1].beamState = SmoNote.beamStates.end;
  check('M10 hand end state closes a group', beamSizes(m) === '2,2', beamSizes(m));
  const h = buildMeasure(5, 8, eighths(5));
  h.setBeamGroups([3, 2]);
  const notes = h.voices[0].notes;
  notes[0].beamState = SmoNote.beamStates.end;
  notes[2].beamState = SmoNote.beamStates.continue;
  notes[3].beamState = SmoNote.beamStates.end;
  check('M11 hand beam is not split at a boundary', beamSizes(h) === '3', beamSizes(h));
}

// --- hand beams and tuplets in a grouped measure ---
{
  /** a score whose first measure is the given meter, filled with notes of the given ticks */
  const scoreWith = (actualBeats: number, beatDuration: number, ticks: number[]): SmoScore => {
    const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
    const measure = score.staves[0].measures[0];
    const tsParams = SmoTimeSignature.defaults;
    tsParams.times = [{ actualBeats, beatDuration }];
    measure.timeSignature = new SmoTimeSignature(tsParams);
    const proto = measure.voices[0].notes[0];
    measure.voices[0].notes = ticks.map((tt) => {
      const note = SmoNote.cloneWithDuration(proto, tt);
      note.noteType = 'n';
      return note;
    });
    return score;
  };
  const handBeam = (score: SmoScore, from: number, to: number) => {
    const selections: SmoSelection[] = [];
    for (let i = from; i <= to; ++i) {
      selections.push(SmoSelection.noteSelection(score, 0, 0, 0, i)!);
    }
    SmoOperation.beamSelections(score, selections);
    return score.staves[0].measures[0].voices[0].notes.map((nn) => nn.beamState).join('');
  };
  const { auto, continue: cont, end } = SmoNote.beamStates;
  const grouped5 = scoreWith(5, 8, eighths(5));
  grouped5.staves[0].measures[0].setBeamGroups([3, 2]);
  check('O6 hand beam in a grouped measure marks every note but the last continue',
    handBeam(grouped5, 1, 3) === [end, cont, cont, end, auto].join(''), handBeam(grouped5, 1, 3));
  check('M11b the hand beam from beamSelections is not split at the boundary',
    beamSizes(grouped5.staves[0].measures[0]) === '3', beamSizes(grouped5.staves[0].measures[0]));
  // Re-beam a 3 + 2 measure as 2 + 3 by hand, the way a user would: select the last three notes
  const regroup = scoreWith(5, 8, eighths(5));
  regroup.staves[0].measures[0].setBeamGroups([3, 2]);
  handBeam(regroup, 2, 4);
  check('M15 the last three notes of a 3 + 2 measure beam as 2 + 3 by hand',
    beamSizes(regroup.staves[0].measures[0]) === '2,3', beamSizes(regroup.staves[0].measures[0]));
  // and the first two, in a measure grouped 2 + 3, beam as 3 + 2
  const regroup2 = scoreWith(5, 8, eighths(5));
  regroup2.staves[0].measures[0].setBeamGroups([2, 3]);
  handBeam(regroup2, 0, 2);
  check('M16 the first three notes of a 2 + 3 measure beam as 3 + 2 by hand',
    beamSizes(regroup2.staves[0].measures[0]) === '3,2', beamSizes(regroup2.staves[0].measures[0]));
  const plain5 = scoreWith(5, 8, eighths(5));
  check('O7 hand beam in an ungrouped measure is as before (no continue)',
    handBeam(plain5, 1, 3) === [end, auto, auto, end, auto].join(''), handBeam(plain5, 1, 3));
  // A tuplet is beamed by the tuplet code, whatever the measure grouping is
  const tupletSizes = (groups: number[]): string => {
    const score = scoreWith(4, 4, [Q, Q, Q, Q]);
    SmoOperation.makeTuplet(SmoSelection.noteSelection(score, 0, 0, 0, 0)!,
      { numNotes: 3, notesOccupied: 2, bracketed: true, ratioed: false });
    const measure = score.staves[0].measures[0];
    measure.voices[0].notes.forEach((nn) => { nn.noteType = 'n'; });
    measure.setBeamGroups(groups);
    return beamSizes(measure);
  };
  check('M12 a tuplet beams the same with or without a grouping', tupletSizes([]).length > 0 && tupletSizes([]) === tupletSizes([4]) && tupletSizes([]) === tupletSizes([1]),
    `${tupletSizes([])} ${tupletSizes([4])} ${tupletSizes([1])}`);
}

// --- measures with no grouping beam as they did before this feature (M3) ---
{
  const same = (beats: number, den: number, ticks: number[], expected: string) => {
    const measure = buildMeasure(beats, den, ticks);
    if (beats === 6 && den === 8) {
      // notes in a real 6/8 measure get a dotted quarter beam length (see SmoMeasure.timeSignatureNotes)
      measure.voices[0].notes.forEach((nn) => { nn.beamBeats = 6144; });
    }
    const before = beamSizes(measure);
    measure.setBeamGroups([3, 2]);
    measure.setBeamGroups([]);
    check(`M3 ${beats}/${den} ungrouped is unchanged by a set and clear`, beamSizes(measure) === before && before === expected,
      `${before} vs ${expected}`);
  };
  same(4, 4, eighths(8), '4,4');
  same(4, 4, new Array(8).fill(S), '4,4');
  same(3, 4, eighths(6), '2,2,2');
  same(6, 8, eighths(6), '3,3');
  same(4, 4, [DE, S, DE, S, Q, Q], '4');
}

// --- a score with two staves and four measures ---
const buildScore = (): SmoScore => {
  const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
  while (score.staves[0].measures.length < 4) {
    score.addMeasure(score.staves[0].measures.length - 1);
  }
  const params = SmoSystemStaff.defaults;
  params.staffId = 1;
  params.measureInstrumentMap[0] = new SmoInstrument(SmoInstrument.defaults);
  score.addStaff(params);
  return score;
};
const groupsOf = (score: SmoScore, staff: number): string =>
  score.staves[staff].measures.map((mm) => `[${mm.getBeamGroups().join(',')}]`).join('');

// --- operations ---
{
  const score = buildScore();
  const selections = [SmoSelection.measureSelection(score, 1, 1)!, SmoSelection.measureSelection(score, 1, 2)!];
  SmoOperation.setBeamGroups(score, selections, [3, 2]);
  check('O1 only the selected measures in the selected staff change',
    groupsOf(score, 1) === '[][3,2][3,2][]' && groupsOf(score, 0) === '[][][][]',
    `${groupsOf(score, 1)} ${groupsOf(score, 0)}`);
  SmoOperation.setBeamGroups(score, [selections[0]], []);
  check('O2 an empty list clears the selected measures', groupsOf(score, 1) === '[][][3,2][]', groupsOf(score, 1));
  SmoOperation.setAllBeamGroups(score, [3]);
  check('O3 set every measure of every staff', groupsOf(score, 0) === '[3][3][3][3]' && groupsOf(score, 1) === '[3][3][3][3]');
  SmoOperation.setAllBeamGroups(score, []);
  check('O4 clear every measure of every staff', groupsOf(score, 0) === '[][][][]' && groupsOf(score, 1) === '[][][][]');
  const text = JSON.stringify(score.serialize());
  check('O5 a cleared score has no beam preferences in its serialization', text.indexOf('SmoBeamPreferences') < 0
    && text.indexOf('beamPreferences') < 0);
}

// --- serialization ---
{
  const score = buildScore();
  score.staves[0].measures[1].setBeamGroups([3, 2]);
  score.staves[0].measures[3].setBeamGroups([2]);
  score.staves[1].measures[1].setBeamGroups([1, 4]);
  const back = SmoScore.deserialize(JSON.stringify(score.serialize()));
  check('S1 groupings survive a save and load; others stay empty', groupsOf(back, 0) === '[][3,2][][2]' && groupsOf(back, 1) === '[][1,4][][]',
    `${groupsOf(back, 0)} ${groupsOf(back, 1)}`);
  const full = SmoScore.deserialize(JSON.stringify(score.serialize({ skipStaves: false, useDictionary: false, preserveStaffIds: false })));
  check('S1b the full (unabbreviated) form keeps them too', groupsOf(full, 0) === '[][3,2][][2]');
  // A score written by a version without the feature: no beam preferences anywhere
  const legacy = buildScore();
  const legacyBack = SmoScore.deserialize(JSON.stringify(legacy.serialize()));
  check('S2 a score with no grouping loads with every measure ungrouped', groupsOf(legacyBack, 0) === '[][][][]' && groupsOf(legacyBack, 1) === '[][][][]');
  const measure = score.staves[0].measures[1];
  const copy = SmoMeasure.deserialize(JSON.parse(JSON.stringify(measure.serialize())));
  check('S4 a copied measure keeps its grouping', JSON.stringify(copy.getBeamGroups()) === '[3,2]');
  // The score-wide default still applies to ungrouped measures and does not touch grouped ones
  score.preferences.defaultDupleDuration = 2048;
  SmoOperation.clearAllBeamGroups(score);
  check('S5 the score default does not change a grouped measure', JSON.stringify(score.staves[0].measures[1].getBeamGroups()) === '[3,2]');
  check('S5b the score default applies to an ungrouped measure',
    score.staves[0].measures[0].voices[0].notes.every((nn) => nn.beamBeats === 2048));
}
const smzCheck = async () => {
  const score = buildScore();
  score.staves[0].measures[1].setBeamGroups([3, 2]);
  score.staves[1].measures[2].setBeamGroups([3]);
  const packed = await SmoScoreArchive.pack(score);
  const back = await SmoScoreArchive.load(packed);
  check('S3 groupings survive the .smz round trip', groupsOf(back, 0) === '[][3,2][][]' && groupsOf(back, 1) === '[][][3][]',
    `${groupsOf(back, 0)} ${groupsOf(back, 1)}`);
};

smzCheck().then(() => {
  if (failures > 0) {
    console.log(`${failures} check(s) failed`);
    process.exitCode = 1;
  } else {
    console.log('all checks passed');
  }
});
