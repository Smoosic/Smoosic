/**
 * Headless checks for re-barring music into a new time signature (Preserve music): the transform
 * (SmoOperation.rebarMeasures / rebarMeasures), the helpers the view uses to decide what to do
 * (timeSignatureChanges, timeSignatureKeepsLength, timeSignatureRange) and the old keep-what-fits
 * behavior.  Cases are listed in specs/042-preserve-music-time-signature/contracts/rebar-api.md.
 *
 * Run with: npm run test:rebar-measures
 */
import { SmoScore } from '../src/smo/data/score';
import { SmoMeasure } from '../src/smo/data/measure';
import { SmoNote } from '../src/smo/data/note';
import { SmoSystemStaff } from '../src/smo/data/systemStaff';
import { SmoTimeSignature, SmoBarline } from '../src/smo/data/measureModifiers';
import { SmoSlur, SmoTie, SmoStaffHairpin, SmoInstrument } from '../src/smo/data/staffModifiers';
import { SmoLyric, SmoDynamicText, SmoArticulation, noteModifierDynamicCtorInit } from '../src/smo/data/noteModifiers';
import { measureModifierDynamicCtorInit } from '../src/smo/data/measureModifiers';
import { staffModifierDynamicCtorInit } from '../src/smo/data/staffModifiers';
import { scoreModifierDynamicCtorInit } from '../src/smo/data/scoreModifiers';
import { SmoSelector, SmoSelection } from '../src/smo/xform/selections';
import { SmoOperation } from '../src/smo/xform/operations';
import { PasteBuffer } from '../src/smo/xform/copypaste';
import { timeSignatureRange } from '../src/smo/xform/rebar';

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

const Q = 4096;
const H = 8192;
const W = 16384;
const E = 2048;
const LETTERS = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];

const ts = (...parts: [number, number][]): SmoTimeSignature => {
  const params = SmoTimeSignature.defaults;
  params.times = parts.map(([actualBeats, beatDuration]) => ({ actualBeats, beatDuration }));
  return new SmoTimeSignature(params);
};
const sel = (staff: number, measure: number, tick: number, voice: number = 0): SmoSelector =>
  ({ staff, measure, voice, tick, pitches: [] });

type NoteSpec = [number, number | 'r'];
/** Replace a voice with notes of the given lengths.  A number names a pitch (0 is c4, 1 is d4...); 'r' is a rest. */
const setVoice = (measure: SmoMeasure, voice: number, specs: NoteSpec[]) => {
  while (measure.voices.length <= voice) {
    measure.populateVoice(measure.voices.length);
  }
  const template = measure.voices[0].notes[0];
  measure.voices[voice].notes = specs.map(([ticks, id]) => {
    const note = SmoNote.cloneWithDuration(template, ticks);
    note.textModifiers = [];
    if (id === 'r') {
      note.noteType = 'r';
    } else {
      note.noteType = 'n';
      note.pitches = [{ letter: LETTERS[id % 7] as any, accidental: 'n', octave: 4 + Math.floor(id / 7) }];
    }
    return note;
  });
  measure.tupletTrees = measure.tupletTrees.filter((tree) => tree.voice !== voice);
};
/** Notes of the given length with pitches 0, 1, 2... starting at `first` */
const run = (ticks: number, count: number, first: number = 0): NoteSpec[] =>
  Array.from({ length: count }, (_, i) => [ticks, first + i] as NoteSpec);

/** A score with the given meters, one measure each, and the given number of staves.  Measures are filled with rests. */
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
      measure.timeSignature = ts(meters[ix]);
      setVoice(measure, 0, [[SmoMusicTicks(meters[ix]), 'r']]);
    });
  });
  return score;
};
const SmoMusicTicks = ([beats, duration]: [number, number]) => 2048 * (8 / duration) * beats;
/** A score of 4/4 measures, the first staff holding `notes` split into measures of four quarters */
const quarterScore = (quarters: number, staves: number = 1): SmoScore => {
  const measures = Math.ceil(quarters / 4);
  const score = buildScore(Array.from({ length: measures }, () => [4, 4] as [number, number]), staves);
  score.staves.forEach((staff) => {
    staff.measures.forEach((measure, m) => {
      setVoice(measure, 0, run(Q, 4, m * 4));
    });
  });
  return score;
};

const tag = (note: SmoNote) => note.noteType === 'r' ? 'r' : `${note.pitches[0].letter}${note.pitches[0].octave}`;
const key = (staff: number, measure: number, voice: number, tick: number) => SmoSelector.getNoteKey(sel(staff, measure, tick, voice));
const tieKeys = (score: SmoScore, staff: number): string[] =>
  score.staves[staff].modifiers.filter((mod) => mod.ctor === 'SmoTie').map((mod) =>
    `${SmoSelector.getNoteKey(mod.startSelector)}>${SmoSelector.getNoteKey(mod.endSelector)}`);
/** The notes of a voice in order, with notes joined by ties written as one: "c4:8192 d4:4096 r:4096" */
const joined = (score: SmoScore, staff: number, voice: number, first: number, last: number): string => {
  const ties = tieKeys(score, staff);
  const out: { tag: string, ticks: number }[] = [];
  let previous: string | null = null;
  for (let m = first; m <= last; ++m) {
    const measure = score.staves[staff].measures[m];
    if (voice >= measure.voices.length) {
      continue;
    }
    measure.voices[voice].notes.forEach((note, t) => {
      const here = key(staff, m, voice, t);
      if (previous !== null && ties.indexOf(`${previous}>${here}`) >= 0) {
        out[out.length - 1].ticks += note.tickCount;
      } else {
        out.push({ tag: tag(note), ticks: note.tickCount });
      }
      previous = here;
    });
  }
  return out.map((item) => `${item.tag}:${item.ticks}`).join(' ');
};
const expected = (specs: NoteSpec[]): string =>
  specs.map(([ticks, id]) => `${id === 'r' ? 'r' : LETTERS[id % 7] + (4 + Math.floor(id / 7))}:${ticks}`).join(' ');
/** The number of notes in each measure of a voice, e.g. "3,3,3" */
const counts = (score: SmoScore, staff: number, voice: number, first: number, last: number): string => {
  const rv: number[] = [];
  for (let m = first; m <= last; ++m) {
    rv.push(score.staves[staff].measures[m].voices[voice]?.notes.length ?? 0);
  }
  return rv.join(',');
};
const measureTicks = (measure: SmoMeasure, voice: number = 0): number =>
  measure.voices[voice].notes.reduce((total, note) => total + note.tickCount, 0);
const allFull = (score: SmoScore, first: number, last: number): boolean =>
  score.staves.every((staff) => {
    for (let m = first; m <= last; ++m) {
      const measure = staff.measures[m];
      const length = SmoMusicTicks([measure.timeSignature.actualBeats, measure.timeSignature.beatDuration]);
      if (measure.voices.some((voice, v) => Math.abs(measureTicks(measure, v) - length) > 0.5)) {
        return false;
      }
    }
    return true;
  });

// --- B1: the spec's example ---
{
  const score = quarterScore(8);
  const result = SmoOperation.rebarMeasures(score, 0, 1, ts([3, 4]));
  check('B1 two 4/4 measures become three 3/4 measures', score.staves[0].measures.length === 3 && result.added === 1
    && result.measureCount === 3, `${score.staves[0].measures.length} ${JSON.stringify(result)}`);
  check('B1 every measure has the 3/4 signature', score.staves[0].measures.every((m) => m.timeSignature.actualBeats === 3 && m.timeSignature.beatDuration === 4));
  check('B1 the notes are in the same order, with a quarter rest to fill', joined(score, 0, 0, 0, 2) === expected([...run(Q, 8), [Q, 'r']]), joined(score, 0, 0, 0, 2));
  check('B1 three notes, three notes, two notes and a rest', counts(score, 0, 0, 0, 2) === '3,3,3', counts(score, 0, 0, 0, 2));
  check('B1 every measure is full', allFull(score, 0, 2));
  check('B1 no ties were needed', tieKeys(score, 0).length === 0);
  check('B1 measures are numbered in order', score.staves[0].measures.every((m, i) => m.measureNumber.measureIndex === i));
}
// --- B2: a larger meter ---
{
  const score = buildScore([[3, 4], [3, 4], [3, 4]]);
  score.staves[0].measures.forEach((measure, m) => setVoice(measure, 0, run(Q, 3, m * 3)));
  const result = SmoOperation.rebarMeasures(score, 0, 2, ts([4, 4]));
  check('B2 3/4 to 4/4: nine quarters need three measures, none added', result.added === 0 && score.staves[0].measures.length === 3);
  check('B2 notes in order, then rests for the last measure', joined(score, 0, 0, 0, 2) === expected([...run(Q, 9), [12288, 'r']]), joined(score, 0, 0, 0, 2));
  check('B2 every measure is full', allFull(score, 0, 2));
}
// --- B3: 6/8 and 5/8 ---
{
  const six = quarterScore(8);
  const r6 = SmoOperation.rebarMeasures(six, 0, 1, ts([6, 8]));
  check('B3 4/4 to 6/8: three measures', r6.added === 1 && six.staves[0].measures.length === 3);
  check('B3 4/4 to 6/8: notes in order, rest of a quarter at the end', joined(six, 0, 0, 0, 2) === expected([...run(Q, 8), [Q, 'r']]), joined(six, 0, 0, 0, 2));
  const five = quarterScore(8);
  const r5 = SmoOperation.rebarMeasures(five, 0, 1, ts([5, 8]));
  check('B3 4/4 to 5/8: four measures, two added', r5.added === 2 && five.staves[0].measures.length === 4, JSON.stringify(r5));
  // four measures of 10240 hold 40960 ticks; the eight quarters are 32768, so 8192 of rest ends the music
  check('B3 4/4 to 5/8: notes in order, tied pieces joined', joined(five, 0, 0, 0, 3) === expected([...run(Q, 8), [H, 'r']]), joined(five, 0, 0, 0, 3));
  // the third quarter starts at 8192 and the eighth starts at 28672: each crosses a bar line (10240 and 30720)
  check('B3 4/4 to 5/8: notes that cross a bar line are tied', tieKeys(five, 0).length === 2, String(tieKeys(five, 0).length));
  check('B3 4/4 to 5/8: every measure is full', allFull(five, 0, 3));
}
// --- B4, B5, B6: notes and rests that cross bar lines ---
{
  const score = buildScore([[4, 4]]);
  setVoice(score.staves[0].measures[0], 0, [[Q, 0], [Q, 1], [H, 2]]);
  SmoOperation.rebarMeasures(score, 0, 0, ts([3, 4]));
  check('B4 a half note on beat 3 of 3/4 is split in two tied notes', joined(score, 0, 0, 0, 1) === expected([[Q, 0], [Q, 1], [H, 2], [H, 'r']]), joined(score, 0, 0, 0, 1));
  check('B4 the two pieces are tied', tieKeys(score, 0).length === 1);
  check('B4 the split note is a quarter and a quarter', score.staves[0].measures[0].voices[0].notes[2].tickCount === Q && score.staves[0].measures[1].voices[0].notes[0].tickCount === Q);
}
{
  const score = buildScore([[4, 4]]);
  setVoice(score.staves[0].measures[0], 0, [[W, 0]]);
  const result = SmoOperation.rebarMeasures(score, 0, 0, ts([1, 4]));
  check('B5 a whole note crossing three bar lines: four measures', result.added === 3 && score.staves[0].measures.length === 4);
  check('B5 four quarter pieces, joined by three ties', tieKeys(score, 0).length === 3 && joined(score, 0, 0, 0, 3) === expected([[W, 0]]), joined(score, 0, 0, 0, 3));
}
{
  const score = buildScore([[4, 4]]);
  setVoice(score.staves[0].measures[0], 0, [[H, 0], [H, 'r']]);
  SmoOperation.rebarMeasures(score, 0, 0, ts([3, 4]));
  check('B6 a rest that crosses a bar line is split in rests, with no ties', tieKeys(score, 0).length === 0
    && joined(score, 0, 0, 0, 1) === expected([[H, 0], [Q, 'r'], [Q, 'r'], [H, 'r']]), joined(score, 0, 0, 0, 1));
}
// --- B7, B8, B9: tuplets ---
const tripletOn = (score: SmoScore, m: number, tick: number, voice: number = 0) => {
  SmoOperation.makeTuplet(SmoSelection.noteSelection(score, 0, m, voice, tick)!,
    { numNotes: 3, notesOccupied: 2, bracketed: true, ratioed: false } as any);
};
{
  const score = buildScore([[4, 4]]);
  setVoice(score.staves[0].measures[0], 0, [[Q, 0], [Q, 1], [Q, 2], [Q, 3]]);
  tripletOn(score, 0, 3);
  SmoOperation.rebarMeasures(score, 0, 0, ts([6, 4]));
  const measure = score.staves[0].measures[0];
  check('B7 a triplet that fits is kept whole, with the right indices', measure.tupletTrees.length === 1
    && measure.tupletTrees[0].startIndex === 3 && measure.tupletTrees[0].endIndex === 5, JSON.stringify(measure.tupletTrees.map((t) => [t.startIndex, t.endIndex])));
  check('B7 its notes are still tuplet notes', [3, 4, 5].every((i) => measure.voices[0].notes[i].isTuplet));
  check('B7 no ties', tieKeys(score, 0).length === 0);
}
{
  const score = buildScore([[4, 4], [4, 4]]);
  setVoice(score.staves[0].measures[0], 0, [[Q, 0], [Q, 1], [Q, 2], [Q, 3]]);
  tripletOn(score, 0, 2);
  SmoOperation.rebarMeasures(score, 0, 1, ts([5, 8]));
  // 5/8 is 10240 ticks: two quarters use 8192, so the triplet (4096) starts the next measure
  const m0 = score.staves[0].measures[0];
  const m1 = score.staves[0].measures[1];
  check('B8 a triplet that would cross the bar line starts the next measure', m1.tupletTrees.length === 1 && m1.tupletTrees[0].startIndex === 0
    && m1.voices[0].notes[0].isTuplet && m0.tupletTrees.length === 0, JSON.stringify(m1.tupletTrees.map((t) => [t.startIndex, t.endIndex])));
  check('B8 the rest of the first measure is a rest', m0.voices[0].notes[m0.voices[0].notes.length - 1].noteType === 'r'
    && m0.voices[0].notes.length === 3);
  const pitches = score.staves[0].measures.map((m) => m.voices[0].notes.filter((n) => n.noteType !== 'r').map(tag).join('')).join('');
  check('B8 all the notes are kept, in order', pitches === 'c4d4e4e4e4f4', pitches);
}
{
  const score = buildScore([[4, 4]]);
  setVoice(score.staves[0].measures[0], 0, [[Q, 0], [Q, 1], [Q, 2], [Q, 3]]);
  tripletOn(score, 0, 1);
  SmoOperation.rebarMeasures(score, 0, 0, ts([1, 8]));
  const trees = score.staves[0].measures.reduce((total, m) => total + m.tupletTrees.length, 0);
  const pitches = Array.from({ length: score.staves[0].measures.length }, (_, m) =>
    score.staves[0].measures[m].voices[0].notes.filter((n) => n.noteType !== 'r').map(tag).join(' ')).join(' ').split(' ');
  check('B9 a tuplet longer than a measure is written out as plain notes, none lost', trees === 0
    && pitches.filter((p) => p === 'd4').length >= 3 && pitches.indexOf('c4') >= 0 && pitches.indexOf('e4') >= 0 && pitches.indexOf('f4') >= 0, pitches.join(' '));
}
// --- B10: voices ---
{
  const score = buildScore([[4, 4]]);
  setVoice(score.staves[0].measures[0], 0, run(Q, 4));
  setVoice(score.staves[0].measures[0], 1, [[W, 10]]);
  const result = SmoOperation.rebarMeasures(score, 0, 0, ts([3, 4]));
  check('B10 two voices: two measures, both with two voices', result.measureCount === 2
    && score.staves[0].measures.every((m) => m.voices.length === 2));
  check('B10 voice 0 keeps its notes', joined(score, 0, 0, 0, 1) === expected([...run(Q, 4), [H, 'r']]), joined(score, 0, 0, 0, 1));
  check('B10 voice 1 keeps its note, tied across the bar, then a rest', joined(score, 0, 1, 0, 1) === expected([[W, 10], [H, 'r']]), joined(score, 0, 1, 0, 1));
}
{
  // a voice that is only in one measure of a range is not added to the others
  const score = buildScore([[4, 4], [4, 4]]);
  setVoice(score.staves[0].measures[0], 0, run(Q, 4));
  setVoice(score.staves[0].measures[1], 0, run(Q, 4, 4));
  setVoice(score.staves[0].measures[0], 1, [[W, 10]]);
  SmoOperation.rebarMeasures(score, 0, 1, ts([4, 4]));
  check('B10 a voice that was only in the first measure is not added to the second', score.staves[0].measures[0].voices.length === 2
    && score.staves[0].measures[1].voices.length === 1, score.staves[0].measures.map((m) => m.voices.length).join());
}
// --- B11: staves ---
{
  const score = quarterScore(8, 2);
  score.staves[1].measures.forEach((measure, m) => setVoice(measure, 0, run(E, 8, m * 8)));
  const result = SmoOperation.rebarMeasures(score, 0, 1, ts([3, 4]));
  check('B11 both staves are re-barred and have the same number of measures', score.staves[0].measures.length === 3
    && score.staves[1].measures.length === 3 && result.added === 1);
  check('B11 each keeps its own music', joined(score, 0, 0, 0, 2) === expected([...run(Q, 8), [Q, 'r']])
    // three measures of 12288 hold 36864 ticks; sixteen eighths are 32768, so a quarter rest ends the music
    && joined(score, 1, 0, 0, 2) === expected([...run(E, 16), [Q, 'r']]), joined(score, 1, 0, 0, 2));
  check('B11 both staves are full', allFull(score, 0, 2));
}
// --- B12: markings stay on the note, the first piece if it is split ---
{
  const score = buildScore([[4, 4]]);
  setVoice(score.staves[0].measures[0], 0, [[Q, 0], [Q, 1], [H, 2]]);
  const split = score.staves[0].measures[0].voices[0].notes[2];
  split.addLyric(new SmoLyric({ ...SmoLyric.defaults, text: 'la', verse: 0, parser: SmoLyric.parsers.lyric } as any));
  split.addDynamic(new SmoDynamicText({ ...SmoDynamicText.defaults, text: 'mf' } as any));
  split.setArticulation(new SmoArticulation({ ...SmoArticulation.defaults, articulation: 'accent' } as any), true);
  const first = score.staves[0].measures[0].voices[0].notes[0];
  first.addLyric(new SmoLyric({ ...SmoLyric.defaults, text: 'so', verse: 0, parser: SmoLyric.parsers.lyric } as any));
  SmoOperation.rebarMeasures(score, 0, 0, ts([3, 4]));
  const m0 = score.staves[0].measures[0].voices[0].notes;
  const m1 = score.staves[0].measures[1].voices[0].notes;
  check('B12 a note that was not split keeps its lyric', m0[0].getTrueLyrics().length === 1);
  check('B12 the first piece of a split note keeps its markings', m0[2].getTrueLyrics().length === 1
    && m0[2].getModifiers('SmoDynamicText').length === 1 && m0[2].articulations.length === 1);
  check('B12 the second piece has the pitch and no markings', m1[0].noteType === 'n' && tag(m1[0]) === 'e4' && m1[0].textModifiers.length === 0
    && m1[0].articulations.length === 0);
}
// --- B13: staff modifiers follow their notes ---
{
  const score = quarterScore(8);
  const staff = score.staves[0];
  const slur = new SmoSlur(SmoSlur.defaults);
  slur.startSelector = sel(0, 0, 3);
  slur.endSelector = sel(0, 1, 1);
  slur.associatedStaff = 0;
  staff.addStaffModifier(slur);
  const hairpin = new SmoStaffHairpin(SmoStaffHairpin.defaults);
  hairpin.startSelector = sel(0, 0, 0);
  hairpin.endSelector = sel(0, 1, 3);
  hairpin.associatedStaff = 0;
  staff.addStaffModifier(hairpin);
  const tie = new SmoTie(SmoTie.defaults);
  tie.startSelector = sel(0, 0, 3);
  tie.endSelector = sel(0, 1, 0);
  tie.lines = SmoTie.createLines(staff.measures[0].voices[0].notes[3], staff.measures[1].voices[0].notes[0]);
  staff.addStaffModifier(tie);
  SmoOperation.rebarMeasures(score, 0, 1, ts([3, 4]));
  // quarter n is note n % 3 of measure floor(n / 3)
  const at = (n: number) => sel(0, Math.floor(n / 3), n % 3);
  const find = (id: string) => staff.modifiers.find((mod) => mod.attrs.id === id)!;
  check('B13 a slur starts and ends on the same notes (quarters 3 and 5)', SmoSelector.eq(find(slur.attrs.id).startSelector, at(3))
    && SmoSelector.eq(find(slur.attrs.id).endSelector, at(5)), JSON.stringify([find(slur.attrs.id).startSelector, find(slur.attrs.id).endSelector]));
  check('B13 a hairpin starts and ends on the same notes (quarters 0 and 7)', SmoSelector.eq(find(hairpin.attrs.id).startSelector, at(0))
    && SmoSelector.eq(find(hairpin.attrs.id).endSelector, at(7)));
  check('B13 a tie starts and ends on the same notes (quarters 3 and 4)', SmoSelector.eq(find(tie.attrs.id).startSelector, at(3))
    && SmoSelector.eq(find(tie.attrs.id).endSelector, at(4)));
}
{
  // a modifier on a note that is split: starts on the first piece, ends on the last; a tie starts on the last piece
  const score = buildScore([[4, 4]]);
  const staff = score.staves[0];
  setVoice(staff.measures[0], 0, [[H, 0], [H, 1]]);
  const slur = new SmoSlur(SmoSlur.defaults);
  slur.startSelector = sel(0, 0, 0);
  slur.endSelector = sel(0, 0, 1);
  slur.associatedStaff = 0;
  staff.addStaffModifier(slur);
  SmoOperation.rebarMeasures(score, 0, 0, ts([3, 4]));
  // c4 half note fits (8192 of 12288); d4 half is split (4096 | 4096)
  const mod = staff.modifiers.find((m) => m.attrs.id === slur.attrs.id)!;
  check('B13 a slur to a split note ends on its last piece', SmoSelector.eq(mod.startSelector, sel(0, 0, 0)) && SmoSelector.eq(mod.endSelector, sel(0, 1, 0)),
    JSON.stringify([mod.startSelector, mod.endSelector]));
}
// --- B14: alternating meters ---
{
  const score = quarterScore(8);
  const result = SmoOperation.rebarMeasures(score, 0, 1, ts([3, 4], [2, 4]));
  const lengths = score.staves[0].measures.map((m) => measureTicks(m));
  check('B14 3/4+2/4 alternates 3/4, 2/4, 3/4...', lengths.slice(0, 3).join() === `${3 * Q},${2 * Q},${3 * Q}`, lengths.join());
  check('B14 all the music fits, in order', joined(score, 0, 0, 0, result.measureCount - 1).startsWith(expected(run(Q, 8))), joined(score, 0, 0, 0, result.measureCount - 1));
  check('B14 the measures have the alternating parts', score.staves[0].measures[0].timeSignature.index === 0 && score.staves[0].measures[1].timeSignature.index === 1);
}
// --- B15: ranges ---
{
  const score = buildScore(Array.from({ length: 6 }, () => [4, 4] as [number, number]));
  score.staves[0].measures.forEach((measure, m) => setVoice(measure, 0, run(Q, 4, m * 4)));
  const slur = new SmoSlur(SmoSlur.defaults);
  slur.startSelector = sel(0, 4, 0);
  slur.endSelector = sel(0, 5, 3);
  slur.associatedStaff = 0;
  score.staves[0].addStaffModifier(slur);
  const result = SmoOperation.rebarMeasures(score, 2, 3, ts([3, 4]));
  const measures = score.staves[0].measures;
  check('B15 measures 3 and 4 become three measures; six measures become seven', result.added === 1 && measures.length === 7);
  check('B15 measures before the range are unchanged', measures.slice(0, 2).every((m) => m.timeSignature.actualBeats === 4)
    && joined(score, 0, 0, 0, 1) === expected(run(Q, 8)));
  check('B15 measures after the range are unchanged, now later', measures.slice(5).every((m) => m.timeSignature.actualBeats === 4)
    && joined(score, 0, 0, 5, 6) === expected(run(Q, 8, 16)));
  const mod = score.staves[0].modifiers.find((m) => m.attrs.id === slur.attrs.id)!;
  check('B15 a modifier after the range moves later', mod.startSelector.measure === 5 && mod.endSelector.measure === 6,
    JSON.stringify([mod.startSelector, mod.endSelector]));
  check('B15 the range was re-barred', joined(score, 0, 0, 2, 4) === expected([...run(Q, 8, 8), [Q, 'r']]), joined(score, 0, 0, 2, 4));
  check('B15 measure numbers are in order', measures.every((m, i) => m.measureNumber.measureIndex === i));
}
{
  const whole = buildScore([[4, 4], [4, 4]]);
  whole.staves[0].measures.forEach((measure, m) => setVoice(measure, 0, run(Q, 4, m * 4)));
  const r = SmoOperation.rebarMeasures(whole, 0, 1, ts([2, 4]));
  check('B15 4/4 to 2/4 over the whole score: the same measures, no loss, and no measure removed', r.added === 2 && whole.staves[0].measures.length === 4
    && joined(whole, 0, 0, 0, 3) === expected(run(Q, 8)));
}
// --- B16: added measures copy the last measure's settings ---
{
  const score = quarterScore(8);
  score.staves[0].measures[1].keySignature = 'd';
  score.staves[0].measures[0].keySignature = 'd';
  SmoOperation.rebarMeasures(score, 0, 1, ts([3, 4]));
  check('B16 the added measure has the key signature of the last measure', score.staves[0].measures[2].keySignature === 'd');
}
{
  const score = quarterScore(8);
  score.staves[0].measures[1].setBarline(new SmoBarline({ position: SmoBarline.positions.end, barline: SmoBarline.barlines.endBar }));
  SmoOperation.rebarMeasures(score, 0, 1, ts([3, 4]));
  check('B16 the end barline goes with the end of the range', score.staves[0].measures[2].getEndBarline().barline === SmoBarline.barlines.endBar
    && score.staves[0].measures[1].getEndBarline().barline === SmoBarline.barlines.singleBar);
}
// --- B17, B18: the checks the view uses ---
{
  const score = quarterScore(8);
  check('B17 4/4 to 2/2 keeps the length', SmoOperation.timeSignatureKeepsLength(score, 0, 1, ts([2, 2])));
  check('B17 4/4 to 3/4 does not', !SmoOperation.timeSignatureKeepsLength(score, 0, 1, ts([3, 4])));
  check('B17 4/4 to 3/4+2/4 does not', !SmoOperation.timeSignatureKeepsLength(score, 0, 1, ts([3, 4], [2, 4])));
  check('B17 4/4 to 2/2 changes the signature', SmoOperation.timeSignatureChanges(score, 0, 1, ts([2, 2])));
  check('B18 the same signature changes nothing', !SmoOperation.timeSignatureChanges(score, 0, 1, ts([4, 4])));
  const shown = ts([4, 4]);
  shown.display = !score.staves[0].measures[0].timeSignature.display;
  check('B18 a different display option is a change that keeps the length', SmoOperation.timeSignatureChanges(score, 0, 1, shown)
    && SmoOperation.timeSignatureKeepsLength(score, 0, 1, shown));
  const one = quarterScore(8);
  one.staves[0].measures[1].timeSignature = ts([3, 4]);
  check('B18 one measure that differs is a change', SmoOperation.timeSignatureChanges(one, 0, 1, ts([4, 4])));
}
// --- B19: no measure is removed ---
{
  const score = buildScore([[3, 4], [3, 4], [3, 4]]);
  score.staves[0].measures.forEach((measure, m) => setVoice(measure, 0, run(Q, 3, m * 3)));
  const result = SmoOperation.rebarMeasures(score, 0, 2, ts([6, 4]));
  check('B19 3 measures of 3/4 to 6/4: 9 quarters need 2 measures, 3 stay, none added', result.added === 0 && score.staves[0].measures.length === 3);
  check('B19 the extra measure is rests and the music is in order', joined(score, 0, 0, 0, 2).startsWith(expected(run(Q, 9))) && allFull(score, 0, 2),
    joined(score, 0, 0, 0, 2));
  check('B19 the unneeded measure is a rest', score.staves[0].measures[2].voices[0].notes.every((n) => n.noteType === 'r'));
}
// --- B20: serialization ---
{
  const score = quarterScore(8);
  SmoOperation.rebarMeasures(score, 0, 1, ts([5, 8]));
  const reloaded = SmoScore.deserialize(JSON.stringify(score.serialize()));
  check('B20 a re-barred score reloads with the same measures and music', reloaded.staves[0].measures.length === score.staves[0].measures.length
    && joined(reloaded, 0, 0, 0, 3) === joined(score, 0, 0, 0, 3), joined(reloaded, 0, 0, 0, 3));
  check('B20 the ties are still there', tieKeys(reloaded, 0).length === tieKeys(score, 0).length);
}
// --- B21: bad input ---
{
  const score = quarterScore(8);
  const before = JSON.stringify(score.serialize());
  const a = SmoOperation.rebarMeasures(score, 0, 9, ts([3, 4]));
  const b = SmoOperation.rebarMeasures(score, 1, 0, ts([3, 4]));
  const c = SmoOperation.rebarMeasures(score, -1, 1, ts([3, 4]));
  check('B21 a range that is not in the score does nothing', a.added === 0 && b.added === 0 && c.added === 0 && JSON.stringify(score.serialize()) === before);
}
// --- B22: the old behavior ---
{
  const score = quarterScore(8);
  const selections = [0, 1].map((m) => SmoSelection.measureSelection(score, 0, m)!);
  SmoOperation.setTimeSignature(score, selections, ts([3, 4]));
  check('B22 keep-what-fits: still two measures of three quarters', score.staves[0].measures.length === 2
    && counts(score, 0, 0, 0, 1) === '3,3' && joined(score, 0, 0, 0, 1) === expected([...run(Q, 3), ...run(Q, 3, 4)]), joined(score, 0, 0, 0, 1));
}
// --- B23: the copy buffer is not used ---
{
  const score = quarterScore(8);
  const buffer = new PasteBuffer();
  buffer.setSelections(score, [SmoSelection.noteSelection(score, 0, 0, 0, 1)!, SmoSelection.noteSelection(score, 0, 0, 0, 2)!]);
  const before = JSON.stringify(Object.keys(buffer.notes).map((k) => buffer.notes[parseInt(k, 10)].map((n) => tag(n.note))));
  SmoOperation.rebarMeasures(score, 0, 1, ts([3, 4]));
  check('B23 the paste buffer is the same after a re-bar', JSON.stringify(Object.keys(buffer.notes).map((k) => buffer.notes[parseInt(k, 10)].map((n) => tag(n.note)))) === before && buffer.hasNotes());
}
// --- the range for each Apply To choice ---
{
  const r = (applyTo: any, selected: number[], count: number) => JSON.stringify(timeSignatureRange(applyTo, selected, count));
  check('R1 Selected: lowest to highest selected measure', r('Selected', [3, 2, 4], 8) === '{"firstMeasure":2,"lastMeasure":4}', r('Selected', [3, 2, 4], 8));
  check('R2 Remaining: lowest selected measure to the end', r('Remaining', [3, 2], 8) === '{"firstMeasure":2,"lastMeasure":7}');
  check('R3 Score: the whole score, whatever is selected', r('Score', [3], 8) === '{"firstMeasure":0,"lastMeasure":7}' && r('Score', [], 8) === '{"firstMeasure":0,"lastMeasure":7}');
  check('R4 no selection is no range, except for the score', r('Selected', [], 8) === 'null' && r('Remaining', [], 8) === 'null');
  check('R5 no measures is no range', r('Score', [0], 0) === 'null');
  check('R6 a selected measure past the end is clipped', r('Selected', [2, 12], 8) === '{"firstMeasure":2,"lastMeasure":7}');
}

if (failures > 0) {
  console.log(`${failures} FAILED`);
  process.exit(1);
}
console.log('ALL PASS');
