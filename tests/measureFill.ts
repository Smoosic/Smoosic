/**
 * Headless checks for filling measures with rests: the rule for which rests (fillRestDurations), the measure
 * method, the operation and its cleanup, and serialization.  Cases are listed in
 * specs/039-measure-fill-submenu/contracts/measure-fill-api.md.
 *
 * Run with: npm run test:measure-fill
 */
import { SmoScore } from '../src/smo/data/score';
import { SmoMeasure } from '../src/smo/data/measure';
import { SmoNote } from '../src/smo/data/note';
import { SmoSystemStaff } from '../src/smo/data/systemStaff';
import { SmoMusic } from '../src/smo/data/music';
import { SmoTimeSignature, SmoBarline, SmoRehearsalMark } from '../src/smo/data/measureModifiers';
import { SmoSlur, SmoStaffHairpin, SmoInstrument } from '../src/smo/data/staffModifiers';
import { SmoLyric, SmoDynamicText, noteModifierDynamicCtorInit } from '../src/smo/data/noteModifiers';
import { SmoTextGroup, SmoScoreText } from '../src/smo/data/scoreText';
import { measureModifierDynamicCtorInit } from '../src/smo/data/measureModifiers';
import { staffModifierDynamicCtorInit } from '../src/smo/data/staffModifiers';
import { scoreModifierDynamicCtorInit } from '../src/smo/data/scoreModifiers';
import { SmoSelector, SmoSelection } from '../src/smo/xform/selections';
import { SmoOperation } from '../src/smo/xform/operations';
import { fillRestDurations, MeasureFillType, MeasureFillTypes } from '../src/smo/xform/measureFill';

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

const ts = (actualBeats: number, beatDuration: number): SmoTimeSignature => {
  const params = SmoTimeSignature.defaults;
  params.times = [{ actualBeats, beatDuration }];
  return new SmoTimeSignature(params);
};
/** n copies of a value */
const x = (n: number, value: number): number[] => new Array(n).fill(value);
const list = (values: number[]): string => values.join(',');
/** A voice of notes (not rests) of the given length each, adding up to the measure */
const fillNotes = (measure: SmoMeasure, noteTicks: number): SmoNote[] => {
  const total = SmoMusic.timeSignatureToTicks(measure.timeSignature.actualBeats, measure.timeSignature.beatDuration);
  const proto = measure.voices[0].notes[0];
  return x(total / noteTicks, noteTicks).map((tt) => {
    const note = SmoNote.cloneWithDuration(proto, tt);
    note.noteType = 'n';
    return note;
  });
};
/**
 * A score with one measure for each meter, each full of sixteenth notes.  More than one staff gives each
 * staff the same measures.
 */
const buildScore = (meters: [number, number][], staves: number = 1): SmoScore => {
  const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
  while (score.staves[0].measures.length < meters.length) {
    score.addMeasure(score.staves[0].measures.length - 1);
  }
  for (let s = 1; s < staves; ++s) {
    const params = SmoSystemStaff.defaults;
    params.staffId = s;
    params.measureInstrumentMap[0] = new SmoInstrument(SmoInstrument.defaults);
    score.addStaff(params);
  }
  score.staves.forEach((staff) => {
    staff.measures.forEach((measure, ix) => {
      measure.timeSignature = ts(meters[ix][0], meters[ix][1]);
      measure.voices[0].notes = fillNotes(measure, 1024);
    });
  });
  return score;
};
const pick = (score: SmoScore, staff: number, measure: number): SmoSelection =>
  SmoSelection.measureSelection(score, staff, measure)!;
const measureOf = (score: SmoScore, staff: number, measure: number): SmoMeasure => score.staves[staff].measures[measure];
/** The durations of the notes in voice 0 */
const durationsOf = (measure: SmoMeasure): number[] => measure.voices[0].notes.map((nn) => nn.tickCount);
const allRests = (measure: SmoMeasure): boolean => measure.voices.every((vv) => vv.notes.every((nn) => nn.noteType === 'r'));
const sum = (values: number[]): number => values.reduce((acc, vv) => acc + vv, 0);
const selector = (staff: number, measure: number): SmoSelector => {
  const rv = SmoSelector.default;
  rv.staff = staff;
  rv.measure = measure;
  return rv;
};

// --- the rule: every row of the table in data-model.md (D1 to D39) ---
const rows: { beats: number, den: number, whole: number[], beat: number[], eighth: number[] }[] = [
  { beats: 4, den: 4, whole: [16384], beat: x(4, 4096), eighth: x(8, 2048) },
  { beats: 2, den: 4, whole: [8192], beat: x(2, 4096), eighth: x(4, 2048) },
  { beats: 3, den: 4, whole: [12288], beat: x(3, 4096), eighth: x(6, 2048) },
  { beats: 6, den: 8, whole: [12288], beat: x(2, 6144), eighth: x(6, 2048) },
  { beats: 9, den: 8, whole: [16384, 2048], beat: x(3, 6144), eighth: x(9, 2048) },
  { beats: 12, den: 8, whole: [24576], beat: x(4, 6144), eighth: x(12, 2048) },
  { beats: 5, den: 8, whole: [8192, 2048], beat: [4096, 4096, 2048], eighth: x(5, 2048) },
  { beats: 7, den: 8, whole: [14336], beat: [4096, 4096, 4096, 2048], eighth: x(7, 2048) },
  { beats: 3, den: 8, whole: [6144], beat: [6144], eighth: x(3, 2048) },
  { beats: 4, den: 8, whole: [8192], beat: x(2, 4096), eighth: x(4, 2048) },
  { beats: 2, den: 2, whole: [16384], beat: x(2, 8192), eighth: x(8, 2048) },
  { beats: 6, den: 16, whole: [6144], beat: x(2, 3072), eighth: x(3, 2048) },
  { beats: 5, den: 16, whole: [4096, 1024], beat: [2048, 2048, 1024], eighth: [2048, 2048, 1024] }
];
const fillNames: [MeasureFillType, string][] = [['wholeRest', 'Whole Rest'], ['beats', 'Beats'], ['eighthRests', 'Eighth Rests']];
rows.forEach((row) => {
  const expected: Record<MeasureFillType, number[]> = { wholeRest: row.whole, beats: row.beat, eighthRests: row.eighth };
  fillNames.forEach(([fill, label]) => {
    const got = fillRestDurations(ts(row.beats, row.den), fill, undefined);
    const total = SmoMusic.timeSignatureToTicks(row.beats, row.den);
    check(`D ${row.beats}/${row.den} ${label}`, list(got) === list(expected[fill]), `${list(got)} vs ${list(expected[fill])}`);
    check(`D40 ${row.beats}/${row.den} ${label} adds up to the measure`, sum(got) === total, `${sum(got)} vs ${total}`);
    check(`D41 ${row.beats}/${row.den} ${label} uses only valid durations`,
      got.every((dd) => SmoMusic.validDurations[dd] !== undefined));
  });
});
check('D42 pickup 4/4 Whole Rest', list(fillRestDurations(ts(4, 4), 'wholeRest', 4096)) === '4096');
check('D43 pickup 4/4 Beats', list(fillRestDurations(ts(4, 4), 'beats', 4096)) === '4096');
check('D44 pickup 4/4 Eighth Rests', list(fillRestDurations(ts(4, 4), 'eighthRests', 6144)) === '2048,2048,2048');
check('D45 pickup 6/8 Beats shorter than a beat', list(fillRestDurations(ts(6, 8), 'beats', 2048)) === '2048');
check('D46 zero length', fillRestDurations(ts(4, 4), 'wholeRest', 0).length === 0);
check('D47 there are three fill types', MeasureFillTypes.length === 3);

// --- SmoMeasure.fillWithRests ---
{
  const score = buildScore([[4, 4]]);
  const measure = measureOf(score, 0, 0);
  measure.addRehearsalMark(SmoRehearsalMark.defaults);
  measure.setBeamGroups([2, 2]);
  measure.setBarline(new SmoBarline({ position: SmoBarline.positions.end, barline: SmoBarline.barlines.doubleBar }));
  measure.voices.push({ notes: fillNotes(measure, 2048) });
  measure.tupletTrees = [];
  const before = { ts: measure.timeSignature.timeSignature, clef: measure.clef, key: measure.keySignature,
    modifiers: measure.modifiers.length, groups: list(measure.getBeamGroups()) };
  measure.fillWithRests([8192, 8192], 4096);
  check('F1 one voice of rests', measure.voices.length === 1 && allRests(measure));
  check('F2 the rests are the durations given', list(durationsOf(measure)) === '8192,8192');
  check('F3 tuplets and beam groups are empty and the active voice is 0',
    measure.tupletTrees.length === 0 && measure.beamGroups.length === 0 && measure.activeVoice === 0);
  check('F4 the measure settings are kept', measure.timeSignature.timeSignature === before.ts && measure.clef === before.clef
    && measure.keySignature === before.key && measure.modifiers.length === before.modifiers
    && list(measure.getBeamGroups()) === before.groups);
  check('F5 the rests have the measure clef and key', measure.voices[0].notes.every((nn) =>
    nn.clef === measure.clef && nn.keySignature === measure.keySignature));
}

// --- SmoOperation.fillMeasures ---
{
  // O1: scope: measures 1 and 2 of staff 1 only
  const score = buildScore([[4, 4], [4, 4], [4, 4], [4, 4]], 2);
  SmoOperation.fillMeasures(score, [pick(score, 1, 1), pick(score, 1, 2)], 'beats');
  const changed = [1, 2].every((m) => allRests(measureOf(score, 1, m)) && list(durationsOf(measureOf(score, 1, m))) === list(x(4, 4096)));
  const others = [[0, 0], [0, 1], [0, 2], [0, 3], [1, 0], [1, 3]].every(([s, m]) =>
    durationsOf(measureOf(score, s, m)).length === 16 && !allRests(measureOf(score, s, m)));
  check('O1 only the selected measures of the selected staff change', changed && others);
}
{
  // O2: several meters in one selection
  const score = buildScore([[4, 4], [6, 8], [5, 8]]);
  SmoOperation.fillMeasures(score, [pick(score, 0, 0), pick(score, 0, 1), pick(score, 0, 2)], 'beats');
  check('O2 each measure is filled by its own meter',
    list(durationsOf(measureOf(score, 0, 0))) === list(x(4, 4096)) && list(durationsOf(measureOf(score, 0, 1))) === list(x(2, 6144))
    && list(durationsOf(measureOf(score, 0, 2))) === '4096,4096,2048');
}
{
  // O3: a tuplet
  const score = buildScore([[4, 4]]);
  const measure = measureOf(score, 0, 0);
  measure.voices[0].notes = fillNotes(measure, 4096);
  SmoOperation.makeTuplet(SmoSelection.noteSelection(score, 0, 0, 0, 0)!,
    { numNotes: 3, notesOccupied: 2, bracketed: true, ratioed: false });
  const hadTuplet = measure.tupletTrees.length > 0;
  SmoOperation.fillMeasures(score, [pick(score, 0, 0)], 'wholeRest');
  check('O3 a tuplet is removed', hadTuplet && measure.tupletTrees.length === 0 && list(durationsOf(measure)) === '16384');
}
{
  // O4: lyrics and dynamics go with the notes
  const score = buildScore([[4, 4]]);
  const measure = measureOf(score, 0, 0);
  measure.voices[0].notes[0].addLyric(new SmoLyric(SmoLyric.defaults));
  measure.voices[0].notes[1].addDynamic(new SmoDynamicText(SmoDynamicText.defaults));
  SmoOperation.fillMeasures(score, [pick(score, 0, 0)], 'wholeRest');
  const note = measure.voices[0].notes[0];
  check('O4 attachments on the notes are gone', measure.voices[0].notes.length === 1
    && note.getTrueLyrics().length === 0 && note.getModifiers('SmoDynamicText').length === 0);
}
{
  // O5 to O8: staff modifiers
  const score = buildScore([[4, 4], [4, 4], [4, 4], [4, 4]], 2);
  const addSlur = (staff: number, from: number, to: number) => {
    const slur = new SmoSlur(SmoSlur.defaults);
    slur.startSelector = selector(staff, from);
    slur.endSelector = selector(staff, to);
    slur.associatedStaff = staff;
    score.staves[staff].addStaffModifier(slur);
    return slur;
  };
  const startsIn = addSlur(0, 1, 3);
  const endsIn = addSlur(0, 0, 1);
  const hairpin = new SmoStaffHairpin(SmoStaffHairpin.defaults);
  hairpin.startSelector = selector(0, 0);
  hairpin.endSelector = selector(0, 3);
  hairpin.associatedStaff = 0;
  score.staves[0].addStaffModifier(hairpin);
  const otherStaff = addSlur(1, 1, 2);
  SmoOperation.fillMeasures(score, [pick(score, 0, 1)], 'wholeRest');
  const left = score.staves[0].modifiers.map((mm) => mm.attrs.id);
  check('O5 a modifier that starts in the measure is removed', left.indexOf(startsIn.attrs.id) < 0);
  check('O6 a modifier that ends in the measure is removed', left.indexOf(endsIn.attrs.id) < 0);
  check('O7 a modifier that passes over the measure is kept', left.indexOf(hairpin.attrs.id) >= 0);
  check('O8 a modifier in another staff is kept', score.staves[1].modifiers.map((mm) => mm.attrs.id).indexOf(otherStaff.attrs.id) >= 0);
}
{
  // O9 and O10: text attached to notes
  const score = buildScore([[4, 4], [4, 4]]);
  const attached = (measure: number) => {
    const params = SmoTextGroup.defaults;
    params.textBlocks = [{ text: new SmoScoreText(SmoScoreText.defaults), position: SmoTextGroup.relativePositions.RIGHT, activeText: false }];
    params.attachToSelector = true;
    params.selector = selector(0, measure);
    const group = new SmoTextGroup(params);
    score.addTextGroup(group);
    return group;
  };
  const inFilled = attached(0);
  const elsewhere = attached(1);
  SmoOperation.fillMeasures(score, [pick(score, 0, 0)], 'wholeRest');
  const ids = score.textGroups.map((tg) => tg.attrs.id);
  check('O9 text attached to a note in a filled measure is removed', ids.indexOf(inFilled.attrs.id) < 0);
  check('O10 text attached to another measure is kept', ids.indexOf(elsewhere.attrs.id) >= 0);
}
{
  // O11: a pickup keeps its length
  const score = buildScore([[4, 4]]);
  const measure = measureOf(score, 0, 0);
  measure.voices[0].notes = fillNotes(measure, 4096).slice(0, 1);
  const wasPickup = measure.isPickup();
  SmoOperation.fillMeasures(score, [pick(score, 0, 0)], 'wholeRest');
  check('O11 a pickup measure is filled to the length it had', wasPickup && list(durationsOf(measure)) === '4096' && measure.isPickup());
}
{
  // O12 and O13: the same fill twice, and a measure that is already a whole rest
  const score = buildScore([[4, 4], [4, 4]]);
  SmoOperation.fillMeasures(score, [pick(score, 0, 0)], 'eighthRests');
  const once = list(durationsOf(measureOf(score, 0, 0)));
  SmoOperation.fillMeasures(score, [pick(score, 0, 0)], 'eighthRests');
  check('O12 the same fill twice gives the same measure', list(durationsOf(measureOf(score, 0, 0))) === once && once === list(x(8, 2048)));
  SmoOperation.fillMeasures(score, [pick(score, 0, 1)], 'wholeRest');
  SmoOperation.fillMeasures(score, [pick(score, 0, 1)], 'wholeRest');
  check('O13 Whole Rest on a whole rest', list(durationsOf(measureOf(score, 0, 1))) === '16384');
}
{
  // O14 and O15: beam grouping is kept, and the rests get the beam length for the meter
  const score = buildScore([[5, 8], [6, 8], [4, 4]]);
  measureOf(score, 0, 0).setBeamGroups([3, 2]);
  SmoOperation.fillMeasures(score, [pick(score, 0, 0), pick(score, 0, 1), pick(score, 0, 2)], 'eighthRests');
  check('O14 the beam grouping is kept', list(measureOf(score, 0, 0).getBeamGroups()) === '3,2');
  check('O15 rests get the beam length for the meter',
    measureOf(score, 0, 1).voices[0].notes.every((nn) => nn.beamBeats === score.preferences.defaultTripleDuration)
    && measureOf(score, 0, 2).voices[0].notes.every((nn) => nn.beamBeats === score.preferences.defaultDupleDuration));
}

// --- serialization ---
{
  const score = buildScore([[4, 4], [6, 8], [5, 8], [3, 4]]);
  const pickup = measureOf(score, 0, 3);
  pickup.voices[0].notes = fillNotes(pickup, 4096).slice(0, 1);
  SmoOperation.fillMeasures(score, [pick(score, 0, 0)], 'wholeRest');
  SmoOperation.fillMeasures(score, [pick(score, 0, 1)], 'beats');
  SmoOperation.fillMeasures(score, [pick(score, 0, 2)], 'eighthRests');
  SmoOperation.fillMeasures(score, [pick(score, 0, 3)], 'wholeRest');
  const back = SmoScore.deserialize(JSON.stringify(score.serialize()));
  const same = [0, 1, 2, 3].every((m) => list(durationsOf(measureOf(back, 0, m))) === list(durationsOf(measureOf(score, 0, m)))
    && allRests(measureOf(back, 0, m)));
  check('S1 filled measures survive a save and load', same);
  const untouched = buildScore([[4, 4], [6, 8]]);
  const text = JSON.stringify(untouched.serialize());
  const again = JSON.stringify(SmoScore.deserialize(text).serialize());
  check('S2 a score with no filled measure has the same content after a save and load',
    JSON.stringify(SmoScore.deserialize(again).serialize()) === again);
}

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('all checks passed');
}
