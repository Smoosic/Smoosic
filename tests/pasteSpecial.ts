/**
 * Headless checks for Paste Special (PasteBuffer.pasteAttributes and the alignment it uses).  Cases are
 * listed in specs/035-paste-special/quickstart.md.
 *
 * Run with: npm run test:paste-special
 */
import { SmoScore } from '../src/smo/data/score';
import { SmoMeasure } from '../src/smo/data/measure';
import { SmoNote } from '../src/smo/data/note';
import { SmoSystemStaff } from '../src/smo/data/systemStaff';
import { SmoInstrument } from '../src/smo/data/staffModifiers';
import { SmoSelection, SmoSelector } from '../src/smo/xform/selections';
import { PasteBuffer, PasteAttributeKind, PasteAttributeMode } from '../src/smo/xform/copypaste';
import { SmoLyric, SmoDynamicText, SmoArticulation, SmoOrnament,
  noteModifierDynamicCtorInit } from '../src/smo/data/noteModifiers';
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
const EIGHTH = 2048;
const WHOLE = 16384;
const KINDS = PasteBuffer.attributeKinds;
const DYNAMICS = ['pp', 'p', 'mp', 'mf', 'f', 'ff', 'sfz'];
const CHORDS = ['C', 'F', 'G', 'Am', 'Dm', 'Em', 'Bm'];
const ARTICULATIONS = ['accent', 'staccato', 'marcato', 'tenuto', 'upStroke', 'downStroke', 'pizzicato'];
const ORNAMENTS = ['mordent', 'turn', 'tr', 'upprall', 'doit', 'scoop', 'flip'];

/** The markings of a note as comparable text, by kind */
type Markings = Record<PasteAttributeKind, string[]>;
const markings = (note: SmoNote): Markings => ({
  dynamics: note.getModifiers('SmoDynamicText').map((d) => (d as SmoDynamicText).text),
  lyrics: note.getTrueLyrics().map((l) => `${l.verse}:${l.getText()}`),
  annotations: note.getAnnotations().map((l) => `${l.verse}:${l.getText()}`),
  chords: note.getChords().map((l) => l.getText()),
  articulations: note.getArticulations().map((a) => a.articulation),
  ornaments: note.getOrnaments().map((o) => o.ornament)
});
const sorted = (list: string[]) => [...list].sort();
const same = (a: string[], b: string[]) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));

/** Give a note a full set of markings, all different for different `n`.  `prefix` tells the staves apart. */
const decorate = (note: SmoNote, n: number, prefix: string, skipSome: boolean = false) => {
  note.textModifiers = [];
  note.articulations = [];
  note.ornaments = [];
  note.addLyric(new SmoLyric({ ...SmoLyric.defaults, text: `${prefix}ly${n}`, verse: 0, parser: SmoLyric.parsers.lyric } as any));
  note.addAnnotation(new SmoLyric({ ...SmoLyric.defaults, text: `${prefix}an${n}`, verse: 0, parser: SmoLyric.parsers.annotation } as any));
  note.addLyric(new SmoLyric({ ...SmoLyric.defaults, text: CHORDS[n % CHORDS.length], verse: 0, parser: SmoLyric.parsers.chord } as any));
  note.addDynamic(new SmoDynamicText({ ...SmoDynamicText.defaults, text: DYNAMICS[n % DYNAMICS.length] } as any));
  if (!skipSome) {
    note.setArticulation(new SmoArticulation({ ...SmoArticulation.defaults, articulation: ARTICULATIONS[n % ARTICULATIONS.length] } as any), true);
    note.setOrnament(new SmoOrnament({ ...SmoOrnament.defaults, ornament: ORNAMENTS[n % ORNAMENTS.length] } as any), true);
  }
};

/** Replace the notes of the first voice of a measure with notes of the given durations (they must add up to the measure) */
const setRhythm = (measure: SmoMeasure, durations: number[], letter: string, octave: number) => {
  const proto = measure.voices[0].notes[0];
  measure.voices[0].notes = durations.map((d) => {
    const note = SmoNote.cloneWithDuration(proto, { numerator: d, denominator: 1, remainder: 0 });
    note.noteType = 'n';
    note.pitches = [{ letter: letter as any, accidental: 'n', octave }];
    return note;
  });
};

/**
 * `staves` staves of 4 measures of 4 quarter notes.  Staff 0 notes are c4 with markings tagged 'S'; every
 * other staff has g3 notes with its own markings tagged 'D1', 'D2'...  Every 3rd note of staff 0 has no
 * articulation or ornament.
 */
const buildScore = (staves: number = 2): SmoScore => {
  const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
  while (score.staves[0].measures.length < 4) {
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
      setRhythm(measure, [QUARTER, QUARTER, QUARTER, QUARTER], s === 0 ? 'c' : 'g', s === 0 ? 4 : 3);
      measure.voices[0].notes.forEach((note, t) => {
        const n = m * 4 + t;
        // the other staves use different markings from staff 0, so a paste is always visible
        decorate(note, s === 0 ? n : n + 3, s === 0 ? 'S' : `D${s}`, s === 0 && n % 3 === 2);
      });
    });
  });
  return score;
};

const noteAt = (score: SmoScore, staff: number, measure: number, tick: number): SmoNote =>
  score.staves[staff].measures[measure].voices[0].notes[tick];
const markingsAt = (score: SmoScore, staff: number, measure: number, tick: number): Markings =>
  markings(noteAt(score, staff, measure, tick));
/** Pitches, durations and note types of every note, as text */
const structure = (score: SmoScore): string => JSON.stringify(score.staves.map((staff) => staff.measures.map((measure) =>
  measure.voices.map((voice) => voice.notes.map((note) =>
    [note.noteType, JSON.stringify(note.pitches), note.tickCount, note.stemTicks])))));
/** Every note's markings, keyed by position, for before and after comparisons */
const allMarkings = (score: SmoScore): Record<string, Markings> => {
  const rv: Record<string, Markings> = {};
  score.staves.forEach((staff, s) => staff.measures.forEach((measure, m) =>
    measure.voices[0].notes.forEach((note, t) => {
      rv[`${s}-${m}-${t}`] = markings(note);
    })));
  return rv;
};
const copyNotes = (score: SmoScore, staff: number, measure: number, firstTick: number, lastMeasure: number, lastTick: number): PasteBuffer => {
  const buffer = new PasteBuffer();
  const selections: SmoSelection[] = [];
  for (let m = measure; m <= lastMeasure; ++m) {
    const notes = score.staves[staff].measures[m].voices[0].notes;
    const from = m === measure ? firstTick : 0;
    const to = m === lastMeasure ? lastTick : notes.length - 1;
    for (let t = from; t <= to; ++t) {
      selections.push(SmoSelection.noteSelection(score, staff, m, 0, t)!);
    }
  }
  buffer.setSelections(score, selections);
  return buffer;
};
const dest = (staff: number, measure: number, tick: number = 0): SmoSelector =>
  ({ staff, measure, voice: 0, tick, pitches: [] });
/** Which notes of a staff had any of their markings change, as 'measure-tick' text */
const changedNotes = (before: Record<string, Markings>, score: SmoScore, staff: number): string[] => {
  const after = allMarkings(score);
  return Object.keys(after).filter((key) => key.startsWith(`${staff}-`) &&
    JSON.stringify(before[key]) !== JSON.stringify(after[key])).map((key) => key.substring(2));
};

// ---- Foundation: hasNotes, alignment, extent ----
{
  const score = buildScore();
  const empty = new PasteBuffer();
  check('hasNotes is false before a copy', empty.hasNotes() === false);
  empty.setScore(score);
  check('alignment of no notes is empty', empty.alignAttributeNotes(dest(1, 0), []).length === 0);
  check('extent is null with nothing copied', empty.getAttributePasteExtent(dest(1, 0)) === null);

  const buffer = copyNotes(score, 0, 0, 0, 1, 3);
  check('hasNotes is true after a copy', buffer.hasNotes() === true);
  check('hasNotes is false after clearSelections', (() => { const b = copyNotes(score, 0, 0, 0, 0, 3); b.clearSelections(); return !b.hasNotes(); })());
  const before = structure(score);
  const beforeMarkings = JSON.stringify(allMarkings(score));
  const pairs = buffer.alignAttributeNotes(dest(1, 0), buffer.notes[0]);
  check('same rhythm: 8 copied notes pair with 8 destination notes', pairs.length === 8);
  check('same rhythm: note i pairs with note i', pairs.every((pair, i) =>
    pair.destination.selector.measure === Math.floor(i / 4) && pair.destination.selector.tick === i % 4 &&
    pair.destination.selector.staff === 1));
  check('alignment changes nothing', structure(score) === before && JSON.stringify(allMarkings(score)) === beforeMarkings);
  const extent = buffer.getAttributePasteExtent(dest(1, 0));
  check('extent is the measures of the pairs', extent !== null && extent.firstMeasure === 0 && extent.lastMeasure === 1);
  check('extent changes nothing', structure(score) === before && JSON.stringify(allMarkings(score)) === beforeMarkings);
}

// ---- US1: each kind alone, all kinds, nothing else changes ----
{
  const run = (kinds: PasteAttributeKind[], mode: PasteAttributeMode) => {
    const score = buildScore();
    const buffer = copyNotes(score, 0, 0, 0, 1, 3);
    const before = allMarkings(score);
    const shape = structure(score);
    buffer.pasteAttributes(dest(1, 0), { kinds, mode });
    return { score, before, shape };
  };
  KINDS.forEach((kind) => {
    const { score, before, shape } = run([kind], 'replace');
    let ticked = true;
    let others = true;
    for (let i = 0; i < 8; ++i) {
      const m = Math.floor(i / 4);
      const t = i % 4;
      const got = markingsAt(score, 1, m, t);
      const source = markingsAt(score, 0, m, t);
      const was = before[`1-${m}-${t}`];
      // the ticked kind is what the copied note had, the others are untouched
      if (!same(got[kind], source[kind])) {
        ticked = false;
      }
      KINDS.filter((k) => k !== kind).forEach((k) => {
        if (!same(got[k], was[k])) {
          others = false;
        }
      });
    }
    check(`${kind} alone: the destination gets the copied ${kind}`, ticked);
    check(`${kind} alone: the other kinds are untouched`, others);
    check(`${kind} alone: notes after the paste are untouched`, JSON.stringify(markingsAt(score, 1, 2, 0)) === JSON.stringify(before['1-2-0']));
    check(`${kind} alone: pitches and durations are unchanged`, structure(score) === shape);
  });
  {
    const { score, shape } = run([...KINDS], 'replace');
    let all = true;
    for (let i = 0; i < 8; ++i) {
      const got = markingsAt(score, 1, Math.floor(i / 4), i % 4);
      const source = markingsAt(score, 0, Math.floor(i / 4), i % 4);
      KINDS.forEach((k) => {
        if (!same(got[k], source[k])) {
          all = false;
        }
      });
    }
    check('all six kinds: the destination matches the source', all);
    check('all six kinds: pitches and durations are unchanged', structure(score) === shape);
  }
  {
    const score = buildScore();
    const buffer = copyNotes(score, 0, 0, 0, 1, 3);
    const before = JSON.stringify(allMarkings(score));
    buffer.pasteAttributes(dest(1, 0), { kinds: [], mode: 'replace' });
    check('no kinds ticked: nothing changes', JSON.stringify(allMarkings(score)) === before);
  }
  {
    // the pasted markings are independent copies
    const score = buildScore();
    const buffer = copyNotes(score, 0, 0, 0, 0, 3);
    buffer.pasteAttributes(dest(1, 0), { kinds: [...KINDS], mode: 'replace' });
    const pasted = noteAt(score, 1, 0, 0);
    const original = noteAt(score, 0, 0, 0);
    const pastedLyric = pasted.getTrueLyrics()[0];
    const originalLyric = original.getTrueLyrics()[0];
    check('a pasted lyric is not the copied object', pastedLyric !== originalLyric && pastedLyric.attrs.id !== originalLyric.attrs.id);
    pastedLyric.text = 'changed';
    pasted.getModifiers('SmoDynamicText').forEach((d) => { (d as SmoDynamicText).text = 'changed'; });
    pasted.articulations.forEach((a) => { a.articulation = 'changed'; });
    pasted.ornaments.forEach((o) => { o.ornament = 'changed'; });
    check('editing pasted markings leaves the source score alone', markings(original).lyrics[0] === '0:Sly0' &&
      markings(original).dynamics[0] === 'pp' && markings(original).articulations[0] === 'accent');
    const copiedAgain = buffer.notes[0][0].note;
    check('editing pasted markings leaves the copy buffer alone', markings(copiedAgain).lyrics[0] === '0:Sly0');
    // paste a second time from the same copy
    buffer.pasteAttributes(dest(1, 2), { kinds: [...KINDS], mode: 'replace' });
    check('the copy can be pasted again', markingsAt(score, 1, 2, 0).lyrics[0] === '0:Sly0' &&
      markingsAt(score, 1, 2, 3).lyrics[0] === '0:Sly3');
  }
  {
    // serialization
    const score = buildScore();
    const buffer = copyNotes(score, 0, 0, 0, 1, 3);
    buffer.pasteAttributes(dest(1, 0), { kinds: [...KINDS], mode: 'replace' });
    const reloaded = SmoScore.deserialize(JSON.stringify(score.serialize({ skipStaves: false, useDictionary: false, preserveStaffIds: false })));
    let equal = true;
    for (let i = 0; i < 8; ++i) {
      if (JSON.stringify(markingsAt(reloaded, 1, Math.floor(i / 4), i % 4)) !== JSON.stringify(markingsAt(score, 1, Math.floor(i / 4), i % 4))) {
        equal = false;
      }
    }
    check('pasted markings survive serialize and deserialize', equal);
  }
}

// ---- US2: replace or add ----
{
  const score = buildScore();
  const buffer = copyNotes(score, 0, 0, 0, 0, 3);
  // source note 2 (n % 3 === 2) has no articulations or ornaments
  check('setup: source note 2 has no articulation', markingsAt(score, 0, 0, 2).articulations.length === 0);
  const before = allMarkings(score);
  buffer.pasteAttributes(dest(1, 0), { kinds: ['articulations'], mode: 'replace' });
  check('replace: a destination note whose copied note has none ends with none', markingsAt(score, 1, 0, 2).articulations.length === 0);
  check('replace: others get the copied articulation', markingsAt(score, 1, 0, 0).articulations[0] === 'accent' &&
    markingsAt(score, 1, 0, 1).articulations[0] === 'staccato');
  check('replace: ornaments were not ticked, so they are untouched', JSON.stringify(markingsAt(score, 1, 0, 2).ornaments) ===
    JSON.stringify(before['1-0-2'].ornaments));
  check('replace: only aligned notes are cleared', JSON.stringify(markingsAt(score, 1, 1, 0)) === JSON.stringify(before['1-1-0']));
}
{
  const score = buildScore();
  const buffer = copyNotes(score, 0, 0, 0, 0, 3);
  const before = allMarkings(score);
  buffer.pasteAttributes(dest(1, 0), { kinds: ['articulations', 'ornaments', 'annotations', 'chords'], mode: 'add' });
  const got = markingsAt(score, 1, 0, 0);
  const own = before['1-0-0'];
  const src = markingsAt(score, 0, 0, 0);
  check('add: articulations are the destination\'s and the copied ones', same(got.articulations, [...own.articulations, ...src.articulations]));
  check('add: ornaments are the destination\'s and the copied ones', same(got.ornaments, [...own.ornaments, ...src.ornaments]));
  check('add: annotation and chord of the same verse are superseded, never doubled', got.annotations.length === 1 && got.chords.length === 1 &&
    got.annotations[0] === src.annotations[0] && got.chords[0] === src.chords[0]);
  check('add: a note whose copied note has none keeps its own', same(markingsAt(score, 1, 0, 2).articulations, before['1-0-2'].articulations));
  check('add: unticked kinds untouched', JSON.stringify(got.lyrics) === JSON.stringify(own.lyrics) && JSON.stringify(got.dynamics) === JSON.stringify(own.dynamics));
}
{
  // a dynamic over a dynamic, and verses
  const score = buildScore();
  const buffer = copyNotes(score, 0, 0, 0, 0, 0);
  const target = noteAt(score, 1, 0, 0);
  target.addLyric(new SmoLyric({ ...SmoLyric.defaults, text: 'verse two', verse: 1, parser: SmoLyric.parsers.lyric } as any));
  buffer.pasteAttributes(dest(1, 0), { kinds: ['dynamics', 'lyrics'], mode: 'add' });
  const got = markings(target);
  check('add: a dynamic over a dynamic leaves exactly one, the pasted', got.dynamics.length === 1 && got.dynamics[0] === 'pp');
  check('add: a lyric of the same verse is replaced and another verse kept', same(got.lyrics, ['0:Sly0', '1:verse two']), got.lyrics.join('|'));
}
{
  // replace with several kinds replaces only the ticked ones
  const score = buildScore();
  const buffer = copyNotes(score, 0, 0, 0, 0, 3);
  const before = allMarkings(score);
  buffer.pasteAttributes(dest(1, 0), { kinds: ['dynamics', 'chords'], mode: 'replace' });
  const got = markingsAt(score, 1, 0, 1);
  check('replace with two kinds: both replaced', same(got.dynamics, markingsAt(score, 0, 0, 1).dynamics) && same(got.chords, markingsAt(score, 0, 0, 1).chords));
  check('replace with two kinds: the other four untouched', same(got.lyrics, before['1-0-1'].lyrics) && same(got.annotations, before['1-0-1'].annotations) &&
    same(got.articulations, before['1-0-1'].articulations) && same(got.ornaments, before['1-0-1'].ornaments));
}

// ---- US3: alignment by elapsed time ----
{
  // 4 quarters onto 8 eighths: copied notes go to eighths 1, 3, 5, 7
  const score = buildScore();
  setRhythm(score.staves[1].measures[0], new Array(8).fill(EIGHTH), 'g', 3);
  score.staves[1].measures[0].voices[0].notes.forEach((note, t) => decorate(note, 40 + t, 'D1'));
  const buffer = copyNotes(score, 0, 0, 0, 0, 3);
  const before = allMarkings(score);
  buffer.pasteAttributes(dest(1, 0), { kinds: ['lyrics'], mode: 'replace' });
  const lyrics = score.staves[1].measures[0].voices[0].notes.map((n) => markings(n).lyrics[0]);
  check('4 quarters onto 8 eighths: copied lyrics land on eighths 1, 3, 5, 7',
    lyrics[0] === '0:Sly0' && lyrics[2] === '0:Sly1' && lyrics[4] === '0:Sly2' && lyrics[6] === '0:Sly3', lyrics.join(' '));
  check('4 quarters onto 8 eighths: eighths 2, 4, 6, 8 keep their own lyrics, even in replace mode',
    [1, 3, 5, 7].every((i) => lyrics[i] === before[`1-0-${i}`].lyrics[0]));
  check('4 quarters onto 8 eighths: the extent is measure 0', (() => {
    const e = buffer.getAttributePasteExtent(dest(1, 0));
    return e !== null && e.firstMeasure === 0 && e.lastMeasure === 0;
  })());
}
{
  // 2 quarters onto whole notes in two measures: the second copied note reaches the next measure
  const score = buildScore();
  setRhythm(score.staves[1].measures[0], [WHOLE], 'g', 3);
  setRhythm(score.staves[1].measures[1], [WHOLE], 'g', 3);
  decorate(noteAt(score, 1, 0, 0), 50, 'D1');
  decorate(noteAt(score, 1, 1, 0), 51, 'D1');
  const buffer = copyNotes(score, 0, 0, 0, 0, 1);
  const pairs = buffer.alignAttributeNotes(dest(1, 0), buffer.notes[0]);
  check('2 quarters onto 2 wholes: the second note goes to the next measure', pairs.length === 2 &&
    pairs[0].destination.selector.measure === 0 && pairs[1].destination.selector.measure === 1);
  const e = buffer.getAttributePasteExtent(dest(1, 0));
  check('2 quarters onto 2 wholes: the extent includes the second measure (longer than the copied time)', e !== null && e.lastMeasure === 1);
  const before = allMarkings(score);
  buffer.pasteAttributes(dest(1, 0), { kinds: ['lyrics', 'dynamics'], mode: 'replace' });
  check('2 quarters onto 2 wholes: markings arrive in order', markingsAt(score, 1, 0, 0).lyrics[0] === '0:Sly0' &&
    markingsAt(score, 1, 1, 0).lyrics[0] === '0:Sly1');
  const changed = changedNotes(before, score, 1);
  check('2 quarters onto 2 wholes: the extent is exactly the measures edited', changed.length === 2 &&
    Math.min(...changed.map((c) => parseInt(c, 10))) === e!.firstMeasure && Math.max(...changed.map((c) => parseInt(c, 10))) === e!.lastMeasure, changed.join(','));
}
{
  // 4 quarters onto [half, quarter, quarter]: the 2nd and 3rd copied notes both go to the first quarter
  const score = buildScore();
  setRhythm(score.staves[1].measures[0], [2 * QUARTER, QUARTER, QUARTER], 'g', 3);
  score.staves[1].measures[0].voices[0].notes.forEach((note, t) => decorate(note, 60 + t, 'D1'));
  const buffer = copyNotes(score, 0, 0, 0, 0, 3);
  const pairs = buffer.alignAttributeNotes(dest(1, 0), buffer.notes[0]);
  check('4 quarters onto half, quarter, quarter: pairing is 0, 1, 1, 2',
    JSON.stringify(pairs.map((p) => p.destination.selector.tick)) === '[0,1,1,2]', JSON.stringify(pairs.map((p) => p.destination.selector.tick)));
  buffer.pasteAttributes(dest(1, 0), { kinds: ['articulations', 'dynamics', 'lyrics'], mode: 'replace' });
  const second = markingsAt(score, 1, 0, 1);
  check('a destination note aligned to two copied notes gets both articulations', same(second.articulations, ['staccato']
    .concat(markingsAt(score, 0, 0, 2).articulations)));
  check('a single-valued kind keeps the last copied note\'s (dynamic and lyric)',
    second.dynamics.length === 1 && second.dynamics[0] === markingsAt(score, 0, 0, 2).dynamics[0] &&
    second.lyrics.length === 1 && second.lyrics[0] === '0:Sly2');
  check('the note after gets the last copied note', markingsAt(score, 1, 0, 2).lyrics[0] === '0:Sly3');
}
{
  // the copy runs past the end of the destination part
  const score = buildScore();
  const buffer = copyNotes(score, 0, 0, 0, 0, 3);
  const before = allMarkings(score);
  const shape = structure(score);
  buffer.pasteAttributes(dest(1, 3, 2), { kinds: [...KINDS], mode: 'replace' });
  const changed = changedNotes(before, score, 1);
  check('copy longer than the destination: stops at the end of the part, no error', changed.join(',') === '3-2,3-3', changed.join(','));
  check('copy longer than the destination: no notes added', structure(score) === shape);
  const e = buffer.getAttributePasteExtent(dest(1, 3, 2));
  check('copy longer than the destination: extent is the last measure', e !== null && e.firstMeasure === 3 && e.lastMeasure === 3);
}
{
  // rests
  const score = buildScore();
  const rests = score.staves[1].measures[0].voices[0].notes;
  rests[1].noteType = 'r';
  rests[2].noteType = 'r';
  const buffer = copyNotes(score, 0, 0, 0, 0, 3);
  // a copied rest counts too
  buffer.pasteAttributes(dest(1, 0), { kinds: ['lyrics'], mode: 'replace' });
  check('rests in the destination are aligned like notes and stay rests', rests[1].noteType === 'r' && rests[2].noteType === 'r' &&
    markings(rests[1]).lyrics[0] === '0:Sly1' && markings(rests[2]).lyrics[0] === '0:Sly2');
  const score2 = buildScore();
  noteAt(score2, 0, 0, 1).noteType = 'r';
  const buffer2 = copyNotes(score2, 0, 0, 0, 0, 3);
  buffer2.pasteAttributes(dest(1, 0), { kinds: ['dynamics'], mode: 'replace' });
  check('a copied rest is aligned by its length like a note', buffer2.notes[0].length === 4 &&
    markingsAt(score2, 1, 0, 2).dynamics[0] === markingsAt(score2, 0, 0, 2).dynamics[0]);
}
{
  // a copy of two measures keeps lining up across the barline
  const score = buildScore();
  const buffer = copyNotes(score, 0, 0, 0, 1, 3);
  const before = allMarkings(score);
  buffer.pasteAttributes(dest(1, 2), { kinds: ['lyrics'], mode: 'replace' });
  check('two measures onto two measures', markingsAt(score, 1, 2, 0).lyrics[0] === '0:Sly0' && markingsAt(score, 1, 3, 3).lyrics[0] === '0:Sly7');
  const e = buffer.getAttributePasteExtent(dest(1, 2));
  const changed = changedNotes(before, score, 1);
  check('two measures: the extent is exactly the measures edited', e !== null && e.firstMeasure === 2 && e.lastMeasure === 3 &&
    changed.length === 8 && changed.every((c) => c.startsWith('2-') || c.startsWith('3-')));
  // starting in the middle of a measure
  const score2 = buildScore();
  const buffer2 = copyNotes(score2, 0, 0, 0, 1, 3);
  buffer2.pasteAttributes(dest(1, 1, 2), { kinds: ['lyrics'], mode: 'replace' });
  check('starting mid-measure: the first copied note goes to the note under the cursor', markingsAt(score2, 1, 1, 2).lyrics[0] === '0:Sly0' &&
    markingsAt(score2, 1, 2, 1).lyrics[0] === '0:Sly3');
}
{
  // two staves, three-staff score
  const score = buildScore(3);
  const buffer = new PasteBuffer();
  const sels: SmoSelection[] = [];
  [0, 1].forEach((staff) => {
    for (let t = 0; t < 4; ++t) {
      sels.push(SmoSelection.noteSelection(score, staff, 0, 0, t)!);
    }
  });
  buffer.setSelections(score, sels);
  const before = allMarkings(score);
  buffer.pasteAttributes(dest(1, 1), { kinds: ['lyrics'], mode: 'replace' });
  check('two staves: the first staff goes to the cursor staff', markingsAt(score, 1, 1, 0).lyrics[0] === '0:Sly0');
  check('two staves: the second staff goes to the staff below', markingsAt(score, 2, 1, 0).lyrics[0] === before['1-0-0'].lyrics[0]);
  check('two staves: the staff above is untouched', JSON.stringify(allMarkings(score)['0-1-0']) === JSON.stringify(before['0-1-0']));
  // no staff below the cursor staff: only the first is pasted
  const score2 = buildScore(3);
  const buffer2 = new PasteBuffer();
  const sels2: SmoSelection[] = [];
  [0, 1].forEach((staff) => {
    for (let t = 0; t < 4; ++t) {
      sels2.push(SmoSelection.noteSelection(score2, staff, 0, 0, t)!);
    }
  });
  buffer2.setSelections(score2, sels2);
  buffer2.pasteAttributes(dest(2, 1), { kinds: ['lyrics'], mode: 'replace' });
  check('two staves with no staff below: the first staff is pasted and nothing fails', markingsAt(score2, 2, 1, 0).lyrics[0] === '0:Sly0');
}

// ---- US4: chords follow the destination's transposition; the rest is as it is ----
{
  const sourceChords = (score: SmoScore) => [0, 1, 2, 3].map((t) => markingsAt(score, 0, 0, t).chords[0]);
  // a concert-pitch part in another key: chord names are not changed
  const concert = buildScore();
  concert.staves[1].measures.forEach((measure) => measure.setKeySignature('d'));
  copyNotes(concert, 0, 0, 0, 0, 3).pasteAttributes(dest(1, 0), { kinds: ['chords'], mode: 'replace' });
  check('chords onto a concert-pitch part in another key are not changed', JSON.stringify([0, 1, 2, 3].map((t) => markingsAt(concert, 1, 0, t).chords[0])) ===
    JSON.stringify(sourceChords(concert)));
  // a transposing part: chords are spelled for it (written a whole step higher)
  const transposing = buildScore();
  transposing.staves[1].measures.forEach((measure) => {
    measure.transposeIndex = 2;
    measure.setKeySignature('d');
  });
  const buffer = copyNotes(transposing, 0, 0, 0, 0, 3);
  buffer.pasteAttributes(dest(1, 0), { kinds: ['chords'], mode: 'replace' });
  const expected = [0, 1, 2, 3].map((t) => SmoLyric.transposeChordToKey(
    noteAt(transposing, 0, 0, t).getChords()[0], 2, 'c', 'd').getText());
  const got = [0, 1, 2, 3].map((t) => markingsAt(transposing, 1, 0, t).chords[0]);
  check('chords onto a transposing part are spelled for it (C F G Am to D G A Bm)', JSON.stringify(got) === JSON.stringify(expected) &&
    JSON.stringify(got) === JSON.stringify(['D', 'G', 'A', 'Bm']), got.join(' '));
  check('the copied chords are not changed by pasting', JSON.stringify(sourceChords(transposing)) === JSON.stringify(['C', 'F', 'G', 'Am']));

  // everything else is copied as is, with all its settings
  const other = buildScore();
  other.staves[1].measures.forEach((measure) => {
    measure.transposeIndex = 2;
    measure.setKeySignature('d');
  });
  noteAt(other, 0, 0, 0).getModifiers('SmoDynamicText').forEach((d) => {
    (d as SmoDynamicText).xOffset = -7;
    (d as SmoDynamicText).yOffsetPixels = 5;
  });
  noteAt(other, 0, 0, 0).getTrueLyrics()[0].translateX = 9;
  const buf = copyNotes(other, 0, 0, 0, 0, 3);
  const ownChords = markings(noteAt(other, 1, 0, 0)).chords;
  buf.pasteAttributes(dest(1, 0), { kinds: ['dynamics', 'lyrics', 'annotations', 'articulations', 'ornaments'], mode: 'replace' });
  const text = (mods: any[]) => JSON.stringify(mods.map((m) => m.serialize()));
  const a = noteAt(other, 0, 0, 0);
  const b = noteAt(other, 1, 0, 0);
  check('dynamics keep their offsets on a transposing part', text(b.getModifiers('SmoDynamicText')) === text(a.getModifiers('SmoDynamicText')) &&
    (b.getModifiers('SmoDynamicText')[0] as SmoDynamicText).xOffset === -7);
  check('lyrics and annotations keep their settings on a transposing part', text(b.getTrueLyrics()) === text(a.getTrueLyrics()) &&
    text(b.getAnnotations()) === text(a.getAnnotations()) && b.getTrueLyrics()[0].translateX === 9);
  check('articulations and ornaments are identical on a transposing part', text(b.getArticulations()) === text(a.getArticulations()) &&
    text(b.getOrnaments()) === text(a.getOrnaments()));
  check('chords were not ticked, so the destination keeps its own', ownChords.length === 1 && same(markings(b).chords, ownChords) &&
    !same(markings(b).chords, markings(a).chords));
}
{
  // two pastes of different kinds: the second leaves the first alone
  const score = buildScore();
  const buffer = copyNotes(score, 0, 0, 0, 0, 3);
  buffer.pasteAttributes(dest(1, 0), { kinds: ['lyrics'], mode: 'replace' });
  buffer.pasteAttributes(dest(1, 0), { kinds: ['dynamics'], mode: 'replace' });
  check('a second paste of another kind leaves the first alone', markingsAt(score, 1, 0, 1).lyrics[0] === '0:Sly1' &&
    markingsAt(score, 1, 0, 1).dynamics[0] === 'p');
}

// ---- removeAllAnnotations only removes annotations ----
{
  const note = buildScore().staves[0].measures[0].voices[0].notes[0];
  const before = markings(note);
  note.removeAllAnnotations();
  const after = markings(note);
  check('removeAllAnnotations removes the annotation', before.annotations.length === 1 && after.annotations.length === 0);
  check('removeAllAnnotations keeps lyrics, chords and dynamics', same(after.lyrics, before.lyrics) && same(after.chords, before.chords) &&
    same(after.dynamics, before.dynamics));
}

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('all checks passed');
}
