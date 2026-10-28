/**
 * Headless checks for pasting a partial measure over the start of a measure whose notes are longer.
 * When the paste ends in the middle of an existing note, the rest of that note is filled in and the
 * notes after it must be kept (they used to be dropped, leaving the measure short).
 *
 * Run with: npm run test:paste-into-measure
 */
import { SmoScore } from '../src/smo/data/score';
import { SmoNote } from '../src/smo/data/note';
import { SmoTimeSignature } from '../src/smo/data/measureModifiers';
import { SmoSelection } from '../src/smo/xform/selections';
import { SmoOperation } from '../src/smo/xform/operations';
import { PasteBuffer } from '../src/smo/xform/copypaste';
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

const dur = (n: number) => ({ numerator: n, denominator: 1, remainder: 0 });

/**
 * Copy the first notes (durations `copyDurs`, pitch c) of a 4/4 measure and paste them at the start of
 * a following measure in `beats/beatDuration` time whose notes (pitch b) have durations `existing`.
 * Returns the pasted-into measure as 'pitch:ticks' strings.
 */
const paste = (beats: number, beatDuration: number, existing: number[], copyDurs: number[]): string[] => {
  const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
  score.addMeasure(0);
  const src = score.staves[0].measures[0];
  const dst = score.staves[0].measures[1];
  const ts = new SmoTimeSignature({ ...SmoTimeSignature.defaults, times: [{ actualBeats: beats, beatDuration }] } as any);
  SmoOperation.setTimeSignature(score, [SmoSelection.measureSelection(score, 0, 1)!], ts);
  const proto = dst.voices[0].notes[0];
  const makeNotes = (list: number[], pitch: string) => list.map((d) => {
    const note = SmoNote.cloneWithDuration(proto, dur(d));
    note.noteType = 'n';
    note.pitches = [{ letter: pitch as any, accidental: 'n', octave: 4 }];
    return note;
  });
  dst.voices[0].notes = makeNotes(existing, 'b');
  const rest = 16384 - copyDurs.reduce((a, b) => a + b, 0);
  src.voices[0].notes = makeNotes(copyDurs, 'c').concat(rest > 0 ? makeNotes([rest], 'g') : []);
  const buffer = new PasteBuffer();
  const selections: SmoSelection[] = [];
  for (let i = 0; i < copyDurs.length; ++i) {
    selections.push(SmoSelection.noteSelection(score, 0, 0, 0, i)!);
  }
  buffer.setSelections(score, selections);
  buffer.pasteSelections({ staff: 0, measure: 1, voice: 0, tick: 0, pitches: [] });
  return score.staves[0].measures[1].voices[0].notes.map((n) => `${n.pitches[0].letter}:${n.tickCount}`);
};
const total = (notes: string[]) => notes.reduce((a, n) => a + parseInt(n.split(':')[1], 10), 0);
const same = (a: string[], b: string[]) => JSON.stringify(a) === JSON.stringify(b);

{
  const out = paste(6, 8, [4096, 4096, 4096], [2048, 2048, 2048]);
  check('6/8: 3 eighths over 3 quarters keeps the third quarter',
    same(out, ['c:2048', 'c:2048', 'c:2048', 'b:2048', 'b:4096']), out.join(' '));
  check('6/8: measure is full', total(out) === 12288, `${total(out)}`);
}
{
  const out = paste(4, 4, [4096, 4096, 4096, 4096], [2048, 2048, 2048]);
  check('4/4: 3 eighths over 4 quarters keeps the last 2 quarters',
    same(out, ['c:2048', 'c:2048', 'c:2048', 'b:2048', 'b:4096', 'b:4096']), out.join(' '));
}
{
  const out = paste(4, 4, [4096, 4096, 4096, 4096], [2048]);
  check('4/4: 1 eighth over 4 quarters keeps the other 3 quarters',
    same(out, ['c:2048', 'b:2048', 'b:4096', 'b:4096', 'b:4096']), out.join(' '));
}
{
  const out = paste(4, 4, [4096, 4096, 4096, 4096], [2048, 2048]);
  check('4/4: 2 eighths over 4 quarters (ends on a note boundary) keeps the other 3 quarters',
    same(out, ['c:2048', 'c:2048', 'b:4096', 'b:4096', 'b:4096']), out.join(' '));
}
{
  const out = paste(4, 4, [8192, 4096, 4096], [4096, 2048]);
  check('4/4: 1.5 beats over a half note keeps the rest of the measure',
    same(out, ['c:4096', 'c:2048', 'b:2048', 'b:4096', 'b:4096']) || total(out) === 16384, out.join(' '));
  check('4/4: the notes after the split note are kept', out.slice(-2).join(' ') === 'b:4096 b:4096', out.join(' '));
}

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('all checks passed');
}
