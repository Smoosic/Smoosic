/**
 * Headless checks for key-distance enharmonic spelling: SmoMusic.keyFifths, pitchFifths, fifthsToPitch,
 * distanceFromKey, getEnharmonicInKey, getScaleTonesForKey, keyForOffset, transposePitchForKey and
 * SmoOperation.transposeScore.  See specs/033-key-distance-transposition/.
 *
 * Run with: npm run test:key-distance-transposition
 */
import { SmoScore } from '../src/smo/data/score';
import { SmoNote } from '../src/smo/data/note';
import { SmoMusic } from '../src/smo/data/music';
import { Pitch, PitchLetter } from '../src/smo/data/common';
import { SmoOperation } from '../src/smo/xform/operations';
import { SmoGraceNote, SmoLyric, noteModifierDynamicCtorInit } from '../src/smo/data/noteModifiers';
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

const p = (letter: string, accidental: string, octave: number): Pitch =>
  ({ letter: letter as PitchLetter, accidental, octave });
const name = (pitch: Pitch) => `${pitch.letter}${pitch.accidental === 'n' ? '' : pitch.accidental}${pitch.octave}`;
const spelled = (pitch: Pitch) => name(pitch).replace(/[0-9]+$/, '');

const KEYS = ['c', 'g', 'd', 'a', 'e', 'b', 'f#', 'c#', 'f', 'bb', 'eb', 'ab', 'db', 'gb', 'cb'];
const FLAT_FIFTHS: Record<string, number> = {
  c: 0, g: 1, d: 2, a: 3, e: 4, b: 5, 'f#': 6, 'c#': 7, f: -1, bb: -2, eb: -3, ab: -4, db: -5, gb: -6, cb: -7
};

// ---- Foundational: key index, line-of-fifths positions, distance ----
{
  KEYS.forEach((key) => {
    check(`keyFifths ${key}`, SmoMusic.keyFifths(key) === FLAT_FIFTHS[key], `${SmoMusic.keyFifths(key)}`);
  });
  check('keyFifths is case insensitive', SmoMusic.keyFifths('Bb') === -2 && SmoMusic.keyFifths('F#') === 6);
  check('keyFifths unknown key is C', SmoMusic.keyFifths('') === 0 && SmoMusic.keyFifths('x') === 0);
  check('keySignatureLength has Gb', SmoMusic.keySignatureLength['Gb'] === 6 && SmoMusic.getFlatsInKeySignature('gb') === 6);

  let roundTrip = true;
  for (let f = SmoMusic.minFifths; f <= SmoMusic.maxFifths; ++f) {
    const pitch = SmoMusic.fifthsToPitch(f, 4);
    if (SmoMusic.pitchFifths(pitch) !== f) {
      roundTrip = false;
      console.log(`  position ${f} -> ${name(pitch)} -> ${SmoMusic.pitchFifths(pitch)}`);
    }
  }
  check('pitchFifths/fifthsToPitch round trip over the whole range', roundTrip);
  check('fifthsToPitch examples', spelled(SmoMusic.fifthsToPitch(10, 4)) === 'a#' && spelled(SmoMusic.fifthsToPitch(-2, 4)) === 'bb'
    && spelled(SmoMusic.fifthsToPitch(-1, 4)) === 'f' && spelled(SmoMusic.fifthsToPitch(19, 4)) === 'b##'
    && spelled(SmoMusic.fifthsToPitch(-15, 4)) === 'fbb');

  check('distance A# in C is 5 sharps', SmoMusic.distanceFromKey(p('a', '#', 4), 'c') === 5);
  check('distance Bb in C is 1 flat', SmoMusic.distanceFromKey(p('b', 'b', 4), 'c') === -1);
  check('distance C# in C is 2 sharps', SmoMusic.distanceFromKey(p('c', '#', 4), 'c') === 2);
  check('distance E natural in Eb is 2 sharps', SmoMusic.distanceFromKey(p('e', 'n', 4), 'eb') === 2);
  check('distance G# in G is 2 sharps', SmoMusic.distanceFromKey(p('g', '#', 4), 'g') === 2);
  check('distance of in-key notes is 0', SmoMusic.distanceFromKey(p('f', '#', 4), 'g') === 0 &&
    SmoMusic.distanceFromKey(p('b', 'b', 4), 'f') === 0 && SmoMusic.distanceFromKey(p('c', 'n', 4), 'c') === 0 &&
    SmoMusic.distanceFromKey(p('b', 'b', 4), 'cb') === 0);
  check('natural pitch with empty accidental counts as natural', SmoMusic.distanceFromKey(p('c', '', 4), 'c') === 0);

  check('sounding value cb4 is b3', SmoMusic.soundingValue(p('c', 'b', 4)) === SmoMusic.soundingValue(p('b', 'n', 3)));
  check('sounding value b#3 is c4', SmoMusic.soundingValue(p('b', '#', 3)) === SmoMusic.soundingValue(p('c', 'n', 4)));
  check('sounding value b##3 is c#4', SmoMusic.soundingValue(p('b', '##', 3)) === SmoMusic.soundingValue(p('c', '#', 4)));
}

// ---- getScaleTonesForKey: same answers as the old table, for every key the table had ----
{
  const sameTones = (a: Record<string, string>, b: Record<string, string>) =>
    Object.keys(b).length === 7 && Object.keys(b).every((letter) => a[letter] === b[letter]);
  const oldTable: Record<string, Record<string, string>> = {
    c: { c: 'cn', d: 'dn', e: 'en', f: 'fn', g: 'gn', a: 'an', b: 'bn' },
    g: { g: 'gn', a: 'an', b: 'bn', c: 'cn', d: 'dn', e: 'en', f: 'f#' },
    d: { d: 'dn', e: 'en', f: 'f#', g: 'gn', a: 'an', b: 'bn', c: 'c#' },
    a: { a: 'an', b: 'bn', c: 'c#', d: 'dn', e: 'en', f: 'f#', g: 'g#' },
    e: { e: 'en', f: 'f#', g: 'g#', a: 'an', b: 'bn', c: 'c#', d: 'd#' },
    b: { b: 'bn', c: 'c#', d: 'd#', e: 'en', f: 'f#', g: 'g#', a: 'a#' },
    'f#': { f: 'f#', g: 'g#', a: 'a#', b: 'bn', c: 'c#', d: 'd#', e: 'e#' },
    'c#': { c: 'c#', d: 'd#', e: 'e#', f: 'f#', g: 'g#', a: 'a#', b: 'b#' },
    f: { f: 'fn', g: 'gn', a: 'an', b: 'bb', c: 'cn', d: 'dn', e: 'en' },
    bb: { b: 'bb', c: 'cn', d: 'dn', e: 'eb', f: 'fn', g: 'gn', a: 'an' },
    eb: { e: 'eb', f: 'fn', g: 'gn', a: 'ab', b: 'bb', c: 'cn', d: 'dn' },
    ab: { a: 'ab', b: 'bb', c: 'cn', d: 'db', e: 'eb', f: 'fn', g: 'gn' },
    db: { d: 'db', e: 'eb', f: 'fn', g: 'gb', a: 'ab', b: 'bb', c: 'cn' },
    gb: { g: 'gb', a: 'ab', b: 'bb', c: 'cb', d: 'db', e: 'eb', f: 'fn' }
  };
  Object.keys(oldTable).forEach((key) => {
    check(`getScaleTonesForKey ${key} matches the old table`,
      sameTones(SmoMusic.getScaleTonesForKey(key), oldTable[key]), JSON.stringify(SmoMusic.getScaleTonesForKey(key)));
  });
  const cb = SmoMusic.getScaleTonesForKey('cb');
  check('getScaleTonesForKey cb (not in the old table) has 7 flats', Object.values(cb).every((v) => v.length === 2 && v[1] === 'b'));
  check('getScaleTonesForKey accepts uppercase', sameTones(SmoMusic.getScaleTonesForKey('Eb'), oldTable.eb));
}

// ---- Cross-key transposition keeps the distance from the key ----
{
  const t = (pitch: Pitch, from: string, to: string, offset: number) =>
    SmoMusic.transposePitchForKey(pitch, from, to, offset);

  check('c# in C -> D is d#', name(t(p('c', '#', 4), 'c', 'd', 2)) === 'd#4', name(t(p('c', '#', 4), 'c', 'd', 2)));
  check('a# in C -> D is b#', name(t(p('a', '#', 4), 'c', 'd', 2)) === 'b#4', name(t(p('a', '#', 4), 'c', 'd', 2)));
  check('e natural in Eb -> G (+4) is g#', name(t(p('e', 'n', 4), 'eb', 'g', 4)) === 'g#4', name(t(p('e', 'n', 4), 'eb', 'g', 4)));
    check('f in C -> G (+7) octave', name(t(p('f', 'n', 4), 'c', 'g', 7)) === 'c5', name(t(p('f', 'n', 4), 'c', 'g', 7)));
  check('Bb in C -> D keeps flat direction (c natural)', name(t(p('b', 'b', 3), 'c', 'd', 2)) === 'c4',
    name(t(p('b', 'b', 3), 'c', 'd', 2)));
  check('cb4 in Gb -> G (+1) is c4 and sounds a half step higher', name(t(p('c', 'b', 4), 'gb', 'g', 1)) === 'c4',
    name(t(p('c', 'b', 4), 'gb', 'g', 1)));
  check('b#3 in C -> D (+2) sounds a whole step above c4',
    SmoMusic.soundingValue(t(p('b', '#', 3), 'c', 'd', 2)) === SmoMusic.soundingValue(p('c', 'n', 4)) + 2);
  check('same key, offset 0 keeps spelling', name(t(p('d', '#', 4), 'c', 'c', 0)) === 'd#4' &&
    name(t(p('e', 'b', 4), 'g', 'g', 0)) === 'eb4' && name(t(p('b', '#', 3), 'f', 'f', 0)) === 'b#3');
  check('same key, octave transposition keeps spelling', name(t(p('c', '#', 4), 'c', 'c', 12)) === 'c#5' &&
    name(t(p('a', 'b', 4), 'c', 'c', -12)) === 'ab3');
  // A transposing instrument: the keys differ by the offset
  check('d# in D down a major second to C is c# (still 2 sharps from the key)',
    name(t(p('d', '#', 5), 'd', 'c', -2)) === 'c#5', name(t(p('d', '#', 5), 'd', 'c', -2)));
  check('c# in D (a key tone) down a major second to C is b natural',
    name(t(p('c', '#', 5), 'd', 'c', -2)) === 'b4', name(t(p('c', '#', 5), 'd', 'c', -2)));
  // keys and offset disagree: the sounding pitch still wins
  const mismatch = t(p('c', 'n', 4), 'c', 'd', 3);
  check('mismatched key and offset still sounds the offset',
    SmoMusic.soundingValue(mismatch) === SmoMusic.soundingValue(p('c', 'n', 4)) + 3, name(mismatch));
  // extreme: needs more than a double accidental, so falls back to the default spelling in the destination key
  const extreme = t(p('b', '##', 4), 'c#', 'g', 7);
  check('triple accidental is respelled to a double or less',
    Math.abs(SmoMusic.accidentalCount(extreme.accidental)) <= 2 &&
    SmoMusic.soundingValue(extreme) === SmoMusic.soundingValue(p('b', '##', 4)) + 7, name(extreme));

  // all keys, all consistent offsets, every letter/accidental
  let invariantFailures = 0;
  let cases = 0;
  const letters: PitchLetter[] = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
  KEYS.forEach((from) => {
    KEYS.forEach((to) => {
      const shift = FLAT_FIFTHS[to] - FLAT_FIFTHS[from];
      [((7 * shift) % 12 + 12) % 12, ((7 * shift) % 12 + 12) % 12 - 12].forEach((offset) => {
        letters.forEach((letter) => {
          ['b', 'n', '#'].forEach((accidental) => {
            const input = p(letter, accidental, 4);
            const position = SmoMusic.pitchFifths(input) + shift;
            if (position < SmoMusic.minFifths || position > SmoMusic.maxFifths) {
              return;
            }
            cases += 1;
            const result = t(input, from, to, offset);
            const ok = SmoMusic.soundingValue(result) === SmoMusic.soundingValue(input) + offset &&
              SmoMusic.distanceFromKey(result, to) === SmoMusic.distanceFromKey(input, from) &&
              name(t(result, to, from, -offset)) === name(input);
            if (!ok) {
              invariantFailures += 1;
              if (invariantFailures < 6) {
                console.log(`  ${name(input)} ${from}->${to} (${offset}) = ${name(result)}`);
              }
            }
          });
        });
      });
    });
  });
  check(`sounding pitch, distance and round trip hold for ${cases} key/offset/pitch combinations`, invariantFailures === 0,
    `${invariantFailures} failures`);

  // in-key notes land on the destination scale
  let scaleFailures = 0;
  KEYS.forEach((from) => {
    KEYS.forEach((to) => {
      const shift = FLAT_FIFTHS[to] - FLAT_FIFTHS[from];
      const offset = ((7 * shift) % 12 + 12) % 12;
      const fromScale = SmoMusic.getScaleTonesForKey(from);
      const toTones = Object.values(SmoMusic.getScaleTonesForKey(to));
      Object.values(fromScale).forEach((tone) => {
        const input = p(tone[0], tone[1], 4);
        const result = t(input, from, to, offset);
        if (SmoMusic.distanceFromKey(result, to) !== 0 || toTones.indexOf(spelled(result).length === 1 ? spelled(result) + 'n' : spelled(result)) < 0) {
          scaleFailures += 1;
        }
      });
    });
  });
  check('every note in the source key is a note of the destination key', scaleFailures === 0, `${scaleFailures} failures`);
}

// ---- Default spelling outside the key ----
{
  const spell = (value: number, key: string) => spelled(SmoMusic.spellSoundingValue(value, key));
  // 4 * 12 + n: c4 is 48
  check('half step below b in C is bb, not a#', spell(58, 'c') === 'bb', spell(58, 'c'));
  check('eb rather than d# in C', spell(51, 'c') === 'eb', spell(51, 'c'));
  check('sharp and flat equally far goes to flat (ab in C)', spell(56, 'c') === 'ab', spell(56, 'c'));
  check('c# in C (2 sharps vs 4 flats)', spell(49, 'c') === 'c#', spell(49, 'c'));
  check('f# in C (1 sharp vs 5 flats)', spell(54, 'c') === 'f#', spell(54, 'c'));
  check('f# is the key tone in G', spell(54, 'g') === 'f#', spell(54, 'g'));
  check('bb is the key tone in F', spell(58, 'f') === 'bb', spell(58, 'f'));
  check('a# is the key tone in B', spell(58, 'b') === 'a#', spell(58, 'b'));
  check('db is the key tone in Ab', spell(49, 'ab') === 'db', spell(49, 'ab'));
  check('in-key natural is natural', spell(48, 'c') === 'c' || spell(48, 'c') === 'cn');

  // every pitch class in every key keeps its sounding value and never has more than a double accidental
  let bad = 0;
  KEYS.forEach((key) => {
    for (let value = 36; value < 48; ++value) {
      const pitch = SmoMusic.spellSoundingValue(value, key);
      if (SmoMusic.soundingValue(pitch) !== value || Math.abs(SmoMusic.accidentalCount(pitch.accidental)) > 2) {
        bad += 1;
      }
    }
  });
  check('default spelling keeps the sounding value and uses at most a double accidental', bad === 0, `${bad} failures`);

  const viaEnharmonic = SmoMusic.getEnharmonicInKey(p('a', '#', 4), 'c');
  check('getEnharmonicInKey a#4 in C is bb4', name(viaEnharmonic) === 'bb4', name(viaEnharmonic));
  const boundary = SmoMusic.getEnharmonicInKey(p('b', '#', 3), 'c');
  check('getEnharmonicInKey b#3 in C is c4 (octave moves)', name(boundary) === 'c4', name(boundary));
  const boundary2 = SmoMusic.getEnharmonicInKey(p('c', 'b', 4), 'c');
  check('getEnharmonicInKey cb4 in C is b3 (octave moves)', name(boundary2) === 'b3', name(boundary2));
  const noOctave = SmoMusic.getEnharmonicInKey({ letter: 'a', accidental: '#' } as any, 'c');
  check('getEnharmonicInKey with no octave defaults to octave 1', noOctave.octave === 1 && spelled(noOctave) === 'bb', name(noOctave));
}

// ---- Destination key for an offset ----
{
  check('keyForOffset zero keeps the key (c#)', SmoMusic.keyForOffset('c#', 0) === 'c#');
  check('keyForOffset zero keeps the key (Cb)', SmoMusic.keyForOffset('Cb', 0) === 'Cb');
  check('keyForOffset eb + 4 is g', SmoMusic.keyForOffset('eb', 4) === 'g');
  check('keyForOffset c + 2 is d', SmoMusic.keyForOffset('c', 2) === 'd');
  check('keyForOffset c + 6 is gb (tie goes to flats)', SmoMusic.keyForOffset('c', 6) === 'gb');
  check('keyForOffset c - 6 is gb (tie goes to flats)', SmoMusic.keyForOffset('c', -6) === 'gb');
  check('keyForOffset c + 1 is db, not c#', SmoMusic.keyForOffset('c', 1) === 'db');
  check('keyForOffset c + 11 is b', SmoMusic.keyForOffset('c', 11) === 'b');
  check('keyForOffset c + 8 is ab, not g#', SmoMusic.keyForOffset('c', 8) === 'ab');
  check('keyForOffset keeps upper case style', SmoMusic.keyForOffset('Eb', 4) === 'G' && SmoMusic.keyForOffset('C', 1) === 'Db');
  check('keyForOffset octave is the same key', SmoMusic.keyForOffset('f#', 12) === 'f#' || SmoMusic.keyForOffset('f#', 12) === 'gb');
  let inRange = true;
  KEYS.forEach((key) => {
    for (let offset = -24; offset <= 24; ++offset) {
      const dest = SmoMusic.keyFifths(SmoMusic.keyForOffset(key, offset));
      // the sounding tonic must move by exactly offset (mod 12)
      const tonicShift = (((7 * dest - 7 * FLAT_FIFTHS[key]) % 12) + 12) % 12;
      if (offset !== 0 && (Math.abs(dest) > 6 || tonicShift !== ((offset % 12) + 12) % 12)) {
        inRange = false;
      }
    }
  });
  check('keyForOffset always has at most 6 accidentals and the right tonic', inRange);
}

// ---- Chord symbols ----
{
  const chord = (text: string) => {
    const lyric = new SmoLyric({ ...SmoLyric.defaults, text, parser: SmoLyric.parsers.chord } as any);
    return lyric;
  };
  const out = SmoLyric.transposeChordToKey(chord('C#'), 2, 'c', 'd');
  check('chord symbol C# in C -> D is D#', out.text === 'D#', out.text);
  const out2 = SmoLyric.transposeChordToKey(chord('A#'), 2, 'c', 'd');
  check('chord symbol A# in C -> D is B#', out2.text === 'B#', out2.text);
  const out3 = SmoLyric.transposeChordToKey(chord('Em7'), 4, 'eb', 'g');
  check('chord symbol E in Eb -> G (+4) is G#m7', out3.text === 'G#m7', out3.text);
}

// ---- Whole-score transposition ----
{
  const buildScore = (key: string) => {
    const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
    while (score.staves[0].measures.length < 2) {
      score.addMeasure(score.staves[0].measures.length - 1);
    }
    score.staves[0].measures.forEach((measure) => {
      measure.setKeySignature(key);
    });
    return score;
  };
  const setPitches = (score: SmoScore, measure: number, pitches: Pitch[]) => {
    const notes = score.staves[0].measures[measure].voices[0].notes;
    pitches.forEach((pitch, ix) => {
      notes[ix].noteType = 'n';
      notes[ix].pitches = [JSON.parse(JSON.stringify(pitch))];
    });
  };
  const snapshot = (score: SmoScore) => score.staves[0].measures.map((measure) =>
    measure.keySignature + ':' + measure.voices[0].notes.slice(0, 4).map((n) => name(n.pitches[0])).join(','));

  const score = buildScore('eb');
  const grace = new SmoGraceNote(SmoGraceNote.defaults);
  grace.pitches = [p('e', 'n', 4)];
  setPitches(score, 0, [p('e', 'n', 4), p('e', 'b', 4), p('b', 'b', 3), p('d', 'n', 4)]);
  setPitches(score, 1, [p('g', 'n', 4), p('a', 'b', 4), p('c', 'n', 5), p('f', '#', 4)]);
  score.staves[0].measures[0].voices[0].notes[0].addGraceNote(grace, 0);
  const original = snapshot(score);

  SmoOperation.transposeScore(score, 0);
  check('transposeScore with no offset changes nothing', JSON.stringify(snapshot(score)) === JSON.stringify(original));

  SmoOperation.transposeScore(score, 4);
  const up = snapshot(score);
  check('transposeScore +4 changes Eb measures to G', score.staves[0].measures.every((m) => m.keySignature === 'g'), JSON.stringify(up));
  check('transposeScore +4 turns e natural into g#', name(score.staves[0].measures[0].voices[0].notes[0].pitches[0]) === 'g#4',
    up[0]);
  check('transposeScore +4 maps eb to g, bb to d (key tones)', up[0].startsWith('g:g#4,g4,d4,'), up[0]);
  check('transposeScore +4 also transposes the notes\' key signature',
    score.staves[0].measures[0].voices[0].notes.every((n) => n.keySignature === 'g'));
  check('transposeScore +4 transposes grace notes', name(score.staves[0].measures[0].voices[0].notes[0].getGraceNotes()[0].pitches[0]) === 'g#4',
    name(score.staves[0].measures[0].voices[0].notes[0].getGraceNotes()[0].pitches[0]));

  SmoOperation.transposeScore(score, -4);
  check('transposeScore -4 restores key, spelling and octave', JSON.stringify(snapshot(score)) === JSON.stringify(original),
    JSON.stringify(snapshot(score)));
  check('transposeScore -4 restores the grace note', name(score.staves[0].measures[0].voices[0].notes[0].getGraceNotes()[0].pitches[0]) === 'e4');

  // step by step, as the dialog does, then cancel
  for (let i = 0; i < 7; ++i) {
    SmoOperation.transposeScore(score, 1);
  }
  const sevenUp = snapshot(score);
  SmoOperation.transposeScore(score, -7);
  check('transposeScore +1 seven times then -7 restores the score', JSON.stringify(snapshot(score)) === JSON.stringify(original),
    sevenUp[0] + ' / ' + JSON.stringify(snapshot(score)));
  const whole = buildScore('eb');
  setPitches(whole, 0, [p('e', 'n', 4), p('e', 'b', 4), p('b', 'b', 3), p('d', 'n', 4)]);
  SmoOperation.transposeScore(whole, 7);
  check('transposeScore +7 in one step equals +1 seven times', whole.staves[0].measures[0].keySignature === 'bb' &&
    JSON.stringify(snapshot(whole)[0]) === JSON.stringify(sevenUp[0]), snapshot(whole)[0] + ' vs ' + sevenUp[0]);

  const down = buildScore('c');
  setPitches(down, 0, [p('c', '#', 4), p('a', '#', 3), p('e', 'b', 4), p('g', 'n', 3)]);
  SmoOperation.transposeScore(down, 2);
  check('transposeScore C -> D: c# is d#, a# is b#', snapshot(down)[0] === 'd:d#4,b#3,f4,a3', snapshot(down)[0]);
}

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('all checks passed');
}
