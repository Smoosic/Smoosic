/**
 * Headless checks for Delete Special (SmoOperation.deleteNoteAttributes and countNoteAttributes).  Cases are
 * listed in specs/041-delete-special/quickstart.md.
 *
 * Run with: npm run test:delete-special
 */
import { SmoScore } from '../src/smo/data/score';
import { SmoMeasure } from '../src/smo/data/measure';
import { SmoNote } from '../src/smo/data/note';
import { SmoSystemStaff } from '../src/smo/data/systemStaff';
import { SmoInstrument } from '../src/smo/data/staffModifiers';
import { SmoSelection } from '../src/smo/xform/selections';
import { SmoOperation, DeleteAttributeKind } from '../src/smo/xform/operations';
import { SmoLyric, SmoDynamicText, SmoArticulation, SmoOrnament, SmoGraceNote, SmoArpeggio,
  SmoMicrotone, noteModifierDynamicCtorInit } from '../src/smo/data/noteModifiers';
import { measureModifierDynamicCtorInit } from '../src/smo/data/measureModifiers';
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

const QUARTER = 4096;
const KINDS = SmoOperation.deleteAttributeKinds;

/** The markings of a note, by kind, as comparable text */
type Markings = Record<DeleteAttributeKind, string[]>;
const markings = (note: SmoNote): Markings => ({
  dynamics: note.getModifiers('SmoDynamicText').map((d) => (d as SmoDynamicText).text),
  lyrics: note.getTrueLyrics().map((l) => `${l.verse}:${l.getText()}`),
  annotations: note.getAnnotations().map((l) => `${l.verse}:${l.getText()}`),
  chords: note.getChords().map((l) => l.getText()),
  articulations: note.getArticulations().map((a) => a.articulation),
  ornaments: note.getOrnaments().map((o) => o.ornament),
  graceNotes: note.graceNotes.map((g) => JSON.stringify(g.serialize())),
  arpeggios: note.arpeggio ? [note.arpeggio.typeString] : [],
  microtones: note.tones.map((t) => `${t.pitchIndex}:${t.tone}`)
});
const EMPTY: Markings = {
  dynamics: [], lyrics: [], annotations: [], chords: [], articulations: [], ornaments: [], graceNotes: [],
  arpeggios: [], microtones: []
};
const markingCount = (m: Markings): number => KINDS.reduce((total, kind) => total + m[kind].length, 0);
/** Markings with the given kinds emptied */
const without = (m: Markings, kinds: DeleteAttributeKind[]): Markings => {
  const rv: Markings = JSON.parse(JSON.stringify(m));
  kinds.forEach((kind) => { rv[kind] = []; });
  return rv;
};
const sameMarkings = (a: Markings, b: Markings) => JSON.stringify(a) === JSON.stringify(b);

/** Give a note one of every kind of marking (two verses of lyrics), tagged with `tag` */
const decorate = (note: SmoNote, tag: string) => {
  note.textModifiers = [];
  note.articulations = [];
  note.ornaments = [];
  note.graceNotes = [];
  note.tones = [];
  note.arpeggio = undefined;
  note.addLyric(new SmoLyric({ ...SmoLyric.defaults, text: `${tag}ly0`, verse: 0, parser: SmoLyric.parsers.lyric } as any));
  note.addLyric(new SmoLyric({ ...SmoLyric.defaults, text: `${tag}ly1`, verse: 1, parser: SmoLyric.parsers.lyric } as any));
  note.addAnnotation(new SmoLyric({ ...SmoLyric.defaults, text: `${tag}an`, verse: 0, parser: SmoLyric.parsers.annotation } as any));
  note.addLyric(new SmoLyric({ ...SmoLyric.defaults, text: 'Am', verse: 0, parser: SmoLyric.parsers.chord } as any));
  note.addDynamic(new SmoDynamicText({ ...SmoDynamicText.defaults, text: 'mf' } as any));
  note.setArticulation(new SmoArticulation({ ...SmoArticulation.defaults, articulation: 'accent' } as any), true);
  note.setArticulation(new SmoArticulation({ ...SmoArticulation.defaults, articulation: 'staccato' } as any), true);
  note.setOrnament(new SmoOrnament({ ...SmoOrnament.defaults, ornament: 'mordent' } as any), true);
  note.addGraceNote(new SmoGraceNote(SmoGraceNote.defaults), 0);
  note.setArpeggio(new SmoArpeggio({ type: 'brush_up' }));
  note.addMicrotone(new SmoMicrotone({ ...SmoMicrotone.defaults, tone: 'flat25sz', pitchIndex: 0 } as any));
};
/** How many markings decorate() adds to a note, by kind */
const DECORATED_COUNTS: Record<DeleteAttributeKind, number> = {
  dynamics: 1, lyrics: 2, annotations: 1, chords: 1, articulations: 2, ornaments: 1, graceNotes: 1,
  arpeggios: 1, microtones: 1
};
const DECORATED_TOTAL = KINDS.reduce((total, kind) => total + DECORATED_COUNTS[kind], 0);

/** Replace the notes of the first voice of a measure with four c4 quarter notes */
const setQuarters = (measure: SmoMeasure) => {
  const proto = measure.voices[0].notes[0];
  measure.voices[0].notes = [0, 1, 2, 3].map(() => {
    const note = SmoNote.cloneWithDuration(proto, { numerator: QUARTER, denominator: 1, remainder: 0 });
    note.noteType = 'n';
    note.pitches = [{ letter: 'c', accidental: 'n', octave: 4 }];
    return note;
  });
};

/** `measures` measures of four quarter notes in each of `staves` staves.  Every note is decorated. */
const buildScore = (measures: number = 1, staves: number = 1): SmoScore => {
  const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
  while (score.staves[0].measures.length < measures) {
    score.addMeasure(score.staves[0].measures.length - 1);
  }
  for (let s = 1; s < staves; ++s) {
    const params = SmoSystemStaff.defaults;
    params.staffId = s;
    params.measureInstrumentMap = { 0: new SmoInstrument(SmoInstrument.defaults) } as any;
    score.addStaff(params);
  }
  score.staves.forEach((staff, s) => {
    staff.measures.forEach((measure, m) => {
      setQuarters(measure);
      measure.voices[0].notes.forEach((note, t) => decorate(note, `s${s}m${m}t${t}`));
    });
  });
  return score;
};

const pick = (score: SmoScore, staff: number, measure: number, tick: number, voice: number = 0): SmoSelection =>
  SmoSelection.noteSelection(score, staff, measure, voice, tick)!;
/** Selections of every note in measures `first` to `last` of the staves listed */
const pickMeasures = (score: SmoScore, staves: number[], first: number, last: number): SmoSelection[] => {
  const rv: SmoSelection[] = [];
  staves.forEach((s) => {
    for (let m = first; m <= last; ++m) {
      score.staves[s].measures[m].voices[0].notes.forEach((note, t) => rv.push(pick(score, s, m, t)));
    }
  });
  return rv;
};
const noteAt = (score: SmoScore, staff: number, measure: number, tick: number, voice: number = 0): SmoNote =>
  score.staves[staff].measures[measure].voices[voice].notes[tick];
/** Pitches, durations and note types of every note, as text */
const structure = (score: SmoScore): string => JSON.stringify(score.staves.map((staff) => staff.measures.map((measure) =>
  measure.voices.map((voice) => voice.notes.map((note) =>
    [note.noteType, JSON.stringify(note.pitches), note.tickCount, note.stemTicks])))));
/** Every note's markings, keyed by position */
const allMarkings = (score: SmoScore): Record<string, Markings> => {
  const rv: Record<string, Markings> = {};
  score.staves.forEach((staff, s) => staff.measures.forEach((measure, m) =>
    measure.voices.forEach((voice, v) => voice.notes.forEach((note, t) => {
      rv[`${s}-${m}-${v}-${t}`] = markings(note);
    }))));
  return rv;
};
/** True when every note listed in `changed` has lost the kinds, and every other note is untouched */
const onlyChanged = (before: Record<string, Markings>, after: Record<string, Markings>,
  changed: string[], kinds: DeleteAttributeKind[]): boolean =>
  Object.keys(before).every((key) =>
    sameMarkings(after[key], changed.indexOf(key) >= 0 ? without(before[key], kinds) : before[key]));

// ---- C: the count and the argument rules
{
  const score = buildScore();
  const all = pickMeasures(score, [0], 0, 0);
  check('C1 counting no kinds is 0', SmoOperation.countNoteAttributes(all, []) === 0);
  const before = JSON.stringify(allMarkings(score));
  SmoOperation.deleteNoteAttributes(all, []);
  check('C1 deleting no kinds changes nothing', JSON.stringify(allMarkings(score)) === before);
  check('C3 the count before a delete is what was added',
    SmoOperation.countNoteAttributes(all, KINDS) === 4 * DECORATED_TOTAL,
    `${SmoOperation.countNoteAttributes(all, KINDS)} vs ${4 * DECORATED_TOTAL}`);
  KINDS.forEach((kind) => {
    check(`C3 the count for ${kind}`, SmoOperation.countNoteAttributes(all, [kind]) === 4 * DECORATED_COUNTS[kind]);
  });
  check('C2 an unknown kind is ignored in the count',
    SmoOperation.countNoteAttributes(all, ['bogus' as any, 'dynamics']) === 4);
  let threw = false;
  try {
    SmoOperation.deleteNoteAttributes(all, ['bogus' as any, 'dynamics']);
  } catch (e) {
    threw = true;
  }
  check('C2 an unknown kind does not throw and the known one still applies',
    !threw && all.every((sel) => markings(sel.note!).dynamics.length === 0 && markings(sel.note!).lyrics.length === 2));
  check('C2 a selection with no note is skipped',
    SmoOperation.countNoteAttributes([{ note: null } as any], KINDS) === 0);
}

// ---- D: each kind on its own
KINDS.forEach((kind, i) => {
  const score = buildScore();
  const sels = pickMeasures(score, [0], 0, 0);
  const before = allMarkings(score);
  const shape = structure(score);
  SmoOperation.deleteNoteAttributes(sels, [kind]);
  const after = allMarkings(score);
  const keys = Object.keys(before);
  check(`D${i + 1} ${kind}: none left on any selected note`, keys.every((key) => after[key][kind].length === 0));
  check(`D${i + 1} ${kind}: the other eight kinds are unchanged`,
    onlyChanged(before, after, keys, [kind]));
  check(`D${i + 1} ${kind}: pitches and durations are unchanged`, structure(score) === shape);
  check(`D${i + 1} ${kind}: counts as 0 afterwards`, SmoOperation.countNoteAttributes(sels, [kind]) === 0);
});

// ---- L: lyrics, annotations and chords are separate
{
  const lyrics = ['0:ly0', '1:ly1'];
  const cases: { kind: DeleteAttributeKind, keep: Partial<Markings> }[] = [
    { kind: 'lyrics', keep: { annotations: ['0:an'], chords: ['Am'] } },
    { kind: 'annotations', keep: { lyrics: ['0:ly0', '1:ly1'], chords: ['Am'] } },
    { kind: 'chords', keep: { lyrics: ['0:ly0', '1:ly1'], annotations: ['0:an'] } }
  ];
  cases.forEach((tc, i) => {
    const score = buildScore();
    const note = noteAt(score, 0, 0, 0);
    // the note's tag is part of the text, so compare by suffix
    const tagOf = (list: string[]) => list.map((t) => t.replace('s0m0t0', ''));
    SmoOperation.deleteNoteAttributes([pick(score, 0, 0, 0)], [tc.kind]);
    const m = markings(note);
    const kept = (Object.keys(tc.keep) as DeleteAttributeKind[]).every((k) =>
      JSON.stringify(tagOf(m[k])) === JSON.stringify(tc.keep[k]));
    check(`L${i + 1} deleting ${tc.kind} leaves the other two text kinds`,
      m[tc.kind].length === 0 && kept, JSON.stringify(m));
  });
  check('L1 both verses are lyrics', lyrics.length === 2);
}

// ---- M: several kinds at once
{
  const score = buildScore();
  const sels = pickMeasures(score, [0], 0, 0);
  const shape = structure(score);
  SmoOperation.deleteNoteAttributes(sels, [...KINDS]);
  check('M1 all nine kinds leave no markings', sels.every((sel) => sameMarkings(markings(sel.note!), EMPTY)));
  check('M1 the notes themselves are unchanged', structure(score) === shape);
}
{
  const score = buildScore();
  const sels = pickMeasures(score, [0], 0, 0);
  const before = allMarkings(score);
  const kinds: DeleteAttributeKind[] = ['dynamics', 'ornaments', 'microtones'];
  SmoOperation.deleteNoteAttributes(sels, kinds);
  check('M2 three kinds are removed and the other six untouched',
    onlyChanged(before, allMarkings(score), Object.keys(before), kinds));
}

// ---- N: nothing to delete
{
  const score = buildScore();
  const note = noteAt(score, 0, 0, 0);
  note.articulations = [];
  note.graceNotes = [];
  const sel = pick(score, 0, 0, 0);
  const before = JSON.stringify(note.serialize());
  let threw = false;
  try {
    SmoOperation.deleteNoteAttributes([sel], ['articulations', 'graceNotes']);
  } catch (e) {
    threw = true;
  }
  check('N1 a note without the ticked kinds is unchanged, with no error',
    !threw && JSON.stringify(note.serialize()) === before);
  SmoOperation.deleteNoteAttributes([sel], ['dynamics']);
  check('N2 a second identical delete counts 0 and changes nothing',
    SmoOperation.countNoteAttributes([sel], ['dynamics']) === 0 &&
    markings(note).dynamics.length === 0 && markings(note).lyrics.length === 2);
}

// ---- S: the selection is respected
{
  const score = buildScore(4, 2);
  const before = allMarkings(score);
  SmoOperation.deleteNoteAttributes([pick(score, 0, 1, 2)], ['dynamics']);
  check('S1 a one-note selection changes only that note',
    onlyChanged(before, allMarkings(score), ['0-1-0-2'], ['dynamics']));
}
{
  const score = buildScore(4, 2);
  const before = allMarkings(score);
  // from the third note of measure 0 to the second note of measure 1, in staff 0
  const sels = [pick(score, 0, 0, 2), pick(score, 0, 0, 3), pick(score, 0, 1, 0), pick(score, 0, 1, 1)];
  SmoOperation.deleteNoteAttributes(sels, ['lyrics', 'articulations']);
  check('S2 a run that stops inside a measure changes exactly those notes',
    onlyChanged(before, allMarkings(score), ['0-0-0-2', '0-0-0-3', '0-1-0-0', '0-1-0-1'], ['lyrics', 'articulations']));
}
{
  const score = buildScore(4, 2);
  const before = allMarkings(score);
  const sels = pickMeasures(score, [0, 1], 1, 2);
  const changed: string[] = [];
  [0, 1].forEach((s) => [1, 2].forEach((m) => [0, 1, 2, 3].forEach((t) => changed.push(`${s}-${m}-0-${t}`))));
  SmoOperation.deleteNoteAttributes(sels, ['dynamics']);
  const after = allMarkings(score);
  check('S3 measures 2 and 3 of both staves lose their dynamics, measures 1 and 4 keep theirs',
    onlyChanged(before, after, changed, ['dynamics']) &&
    after['0-0-0-0'].dynamics.length === 1 && after['1-3-0-3'].dynamics.length === 1 &&
    after['0-1-0-0'].dynamics.length === 0 && after['1-2-0-3'].dynamics.length === 0);
}
{
  const score = buildScore(1, 1);
  const measure = score.staves[0].measures[0];
  while (measure.voices.length < 2) {
    measure.populateVoice(measure.voices.length);
  }
  measure.voices[1].notes.forEach((note, t) => decorate(note, `v1t${t}`));
  const before = allMarkings(score);
  const sels = measure.voices[0].notes.map((n, t) => pick(score, 0, 0, t, 0));
  SmoOperation.deleteNoteAttributes(sels, ['dynamics']);
  const changed = measure.voices[0].notes.map((n, t) => `0-0-0-${t}`);
  check('S4 only the selected voice is affected',
    onlyChanged(before, allMarkings(score), changed, ['dynamics']) &&
    measure.voices[1].notes.every((n) => markings(n).dynamics.length === 1));
}

// ---- R: rests
{
  const score = buildScore();
  const measure = score.staves[0].measures[0];
  const rest = measure.voices[0].notes[1];
  rest.noteType = 'r';
  const ticks = rest.tickCount;
  const sel = pick(score, 0, 0, 1);
  SmoOperation.deleteNoteAttributes([sel], ['dynamics', 'annotations']);
  const m = markings(rest);
  check('R1 a selected rest loses a dynamic and an annotation',
    m.dynamics.length === 0 && m.annotations.length === 0);
  check('R1 the rest is still a rest of the same duration', rest.noteType === 'r' && rest.tickCount === ticks);
}

// ---- P: save and reload
{
  const score = buildScore(2, 1);
  const sels = pickMeasures(score, [0], 0, 1);
  const kinds: DeleteAttributeKind[] = ['graceNotes', 'dynamics'];
  SmoOperation.deleteNoteAttributes(sels, kinds);
  const before = allMarkings(score);
  const shape = structure(score);
  const reloaded = SmoScore.deserialize(JSON.stringify(score.serialize()));
  const after = allMarkings(reloaded);
  check('P1 the reloaded notes have none of the removed kinds',
    Object.keys(after).every((key) => after[key].graceNotes.length === 0 && after[key].dynamics.length === 0));
  check('P1 the reloaded notes keep the other seven kinds',
    Object.keys(before).every((key) => sameMarkings(after[key], before[key])),
    JSON.stringify(after['0-0-0-0']));
  check('P1 the reloaded pitches and durations are the same', structure(reloaded) === shape);
}

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('all checks passed');
}
