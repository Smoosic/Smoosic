/**
 * Headless checks for copying and pasting voices (PasteBuffer.setVoiceSelections, pasteVoice,
 * pasteAllVoices, and the menu choice functions).  Cases V1-V20 are listed in
 * specs/030-copy-paste-voices/contracts/voice-copy-paste-contract.md.
 *
 * Run with: npm run test:voice-copy-paste
 */
import { SmoScore } from '../src/smo/data/score';
import { SmoMeasure } from '../src/smo/data/measure';
import { SmoNote } from '../src/smo/data/note';
import { SmoSelection, SmoSelector } from '../src/smo/xform/selections';
import { SmoOperation } from '../src/smo/xform/operations';
import { PasteBuffer } from '../src/smo/xform/copypaste';
import { SmoSlur } from '../src/smo/data/staffModifiers';
import { noteModifierDynamicCtorInit } from '../src/smo/data/noteModifiers';
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

const LETTERS = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
/** Give a quarter-note slot a pitch that encodes where it is, so a pasted note can be traced */
const encodePitch = (note: SmoNote, measure: number, voice: number, tick: number) => {
  note.noteType = 'n';
  note.pitches = [{ letter: LETTERS[(measure + tick + voice * 2) % 7] as any, accidental: 'n', octave: 3 + voice }];
};
const fillVoice = (measure: SmoMeasure, voice: number, measureIx: number) => {
  while (measure.voices.length <= voice) {
    measure.populateVoice(measure.voices.length);
  }
  measure.voices[voice].notes.forEach((note, tick) => encodePitch(note, measureIx, voice, tick));
};

/** Voice `v` of measure `m` as a list of 'pitch:ticks' strings, or null if the voice doesn't exist */
const voiceNotes = (score: SmoScore, m: number, v: number, staff: number = 0): string[] | null => {
  const measure = score.staves[staff].measures[m];
  if (!measure || measure.voices.length <= v) {
    return null;
  }
  return measure.voices[v].notes.map((note) => {
    const p = note.pitches[0];
    return `${note.noteType === 'r' ? 'r' : p.letter + p.octave}:${note.tickCount}`;
  });
};
const same = (a: string[] | null, b: string[] | null) => JSON.stringify(a) === JSON.stringify(b);
const voiceCount = (score: SmoScore, m: number, staff: number = 0) => score.staves[staff].measures[m].voices.length;
const tupletVoices = (score: SmoScore, m: number, staff: number = 0): number[] =>
  score.staves[staff].measures[m].tupletTrees.map((tree) => tree.voice);

/**
 * Single staff, 12 measures (indexes 0-11) of 4/4.  Voice 0 on every measure; voice 1 on
 * measures 0-3; voice 2 on measure 1 only; a triplet in voice 0 of measure 5 and in voice 1 of
 * measure 6 (voice 1 also exists there); measure 9 has one voice.
 */
const buildScore = (): SmoScore => {
  const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
  while (score.staves[0].measures.length < 12) {
    score.addMeasure(score.staves[0].measures.length - 1);
  }
  score.staves[0].measures.forEach((measure, m) => {
    fillVoice(measure, 0, m);
    if (m < 4 || m === 6) {
      fillVoice(measure, 1, m);
    }
    if (m === 1) {
      fillVoice(measure, 2, m);
    }
  });
  // triplets: quarter notes 0-2 of voice 0 in measure 5, and of voice 1 in measure 6
  const trip = (m: number, v: number) => {
    const sel = SmoSelection.noteSelection(score, 0, m, v, 0)!;
    SmoOperation.makeTuplet(sel, { numNotes: 3, notesOccupied: 2, bracketed: true, ratioed: false } as any);
  };
  trip(5, 0);
  trip(6, 1);
  return score;
};
/** Note selections covering ticks first-last of voice v in measure m, for copy */
const selectNotes = (score: SmoScore, m: number, first: number, last: number, v: number = 0): SmoSelection[] => {
  const rv: SmoSelection[] = [];
  for (let t = first; t <= last; ++t) {
    const sel = SmoSelection.noteSelection(score, 0, m, v, t);
    if (sel) {
      rv.push(sel);
    }
  }
  return rv;
};
const dest = (measure: number, staff: number = 0): SmoSelector => ({ staff, measure, voice: 0, tick: 0, pitches: [] });

// --- V1-V4: menu choice functions ---
check('V1 copy choices, no voices', JSON.stringify(PasteBuffer.copyVoiceChoices(0)) === '[]');
check('V1 copy choices, one voice', JSON.stringify(PasteBuffer.copyVoiceChoices(1)) === '[0]');
check('V1 copy choices, two voices', JSON.stringify(PasteBuffer.copyVoiceChoices(2)) === '[0,1,"all"]');
check('V1 copy choices, three voices', JSON.stringify(PasteBuffer.copyVoiceChoices(3)) === '[0,1,2,"all"]');
check('V2 paste choices with no voice copy', JSON.stringify(PasteBuffer.pasteVoiceChoices([], 2)) === '[]');
check('V3 one destination voice: replace it, or add a new voice', JSON.stringify(PasteBuffer.pasteVoiceChoices([1], 1)) === '[0,"new"]');
check('V3 two destination voices', JSON.stringify(PasteBuffer.pasteVoiceChoices([0], 2)) === '[0,1,"new"]');
check('V3 three destination voices', JSON.stringify(PasteBuffer.pasteVoiceChoices([0], 3)) === '[0,1,2,"new"]');
check('V3 four destination voices: existing voices only, no new voice', JSON.stringify(PasteBuffer.pasteVoiceChoices([0], 4)) === '[0,1,2,3]');
check('V3 no destination offers nothing', JSON.stringify(PasteBuffer.pasteVoiceChoices([0], 0)) === '[]');
check('V4 paste choices, several copied voices', JSON.stringify(PasteBuffer.pasteVoiceChoices([0, 1], 1)) === '["all"]');

// --- V5: copy extends to whole measures ---
{
  const score = buildScore();
  const buffer = new PasteBuffer();
  // from the 3rd note of measure 1 to the 2nd note of measure 2
  const sels = selectNotes(score, 1, 2, 3).concat(selectNotes(score, 2, 0, 1));
  const ok = buffer.setVoiceSelections(score, sels, 0);
  const vc = buffer.voiceCopy!;
  check('V5 voice copy succeeds', ok && !!vc);
  check('V5 covers measures 1 to 2', vc.firstMeasure === 1 && vc.measureCount === 2, `first=${vc.firstMeasure} count=${vc.measureCount}`);
  check('V5 copies all 8 notes of the two whole measures', vc.notes[0][0].length === 8, `n=${vc.notes[0][0].length}`);
  check('V5 one voice copied', JSON.stringify(vc.voices) === '[0]');
  check('V5 tick count is two measures', buffer.getVoiceCopyTickCount() === 2 * 16384, `${buffer.getVoiceCopyTickCount()}`);

  // --- V6, V7: paste into the same voice number elsewhere; other voices unchanged ---
  const before7 = voiceNotes(score, 7, 1);
  buffer.pasteVoice(dest(7), 0);
  check('V6 measure 7 voice 0 equals measure 1 voice 0', same(voiceNotes(score, 7, 0), voiceNotes(score, 1, 0)));
  check('V6 measure 8 voice 0 equals measure 2 voice 0', same(voiceNotes(score, 8, 0), voiceNotes(score, 2, 0)));
  check('V7 other voices of the destination unchanged', same(voiceNotes(score, 7, 1), before7) && voiceCount(score, 7) === 1);
  check('V6 the copy is still there after a paste', buffer.hasVoiceCopy());
  buffer.pasteVoice(dest(10), 0);
  check('V6 a second paste from the same copy works', same(voiceNotes(score, 10, 0), voiceNotes(score, 1, 0)) &&
    same(voiceNotes(score, 11, 0), voiceNotes(score, 2, 0)));
}

// --- V8: paste into an existing different voice ---
{
  const score = buildScore();
  const buffer = new PasteBuffer();
  buffer.setVoiceSelections(score, selectNotes(score, 0, 0, 0), 0);
  const v0Before = voiceNotes(score, 3, 0);
  buffer.pasteVoice(dest(3), 1);
  check('V8 voice 1 of measure 3 replaced by the copied voice 0', same(voiceNotes(score, 3, 1), voiceNotes(score, 0, 0)));
  check('V8 voice 0 of measure 3 unchanged', same(voiceNotes(score, 3, 0), v0Before));
}

// --- V9: paste into the next empty voice ---
{
  const score = buildScore();
  const buffer = new PasteBuffer();
  buffer.setVoiceSelections(score, selectNotes(score, 0, 0, 0), 0);
  const v0Before = voiceNotes(score, 9, 0);
  check('V9 measure 9 starts with one voice', voiceCount(score, 9) === 1);
  buffer.pasteVoice(dest(9), 1);
  check('V9 measure 9 now has two voices', voiceCount(score, 9) === 2, `n=${voiceCount(score, 9)}`);
  check('V9 the new voice holds the copied notes', same(voiceNotes(score, 9, 1), voiceNotes(score, 0, 0)));
  check('V9 voice 0 unchanged', same(voiceNotes(score, 9, 0), v0Before));
}

// --- V10: copy voice 1, paste into voice 0 ---
{
  const score = buildScore();
  const buffer = new PasteBuffer();
  buffer.setVoiceSelections(score, selectNotes(score, 0, 0, 0, 1), 1);
  check('V10 voice 1 copied', JSON.stringify(buffer.copiedVoiceNumbers()) === '[1]');
  buffer.pasteVoice(dest(10), 0);
  check('V10 measure 10 voice 0 equals measure 0 voice 1', same(voiceNotes(score, 10, 0), voiceNotes(score, 0, 1)));
  check('V10 measure 10 gets no second voice', voiceCount(score, 10) === 1);
}

// --- V11: copy All, paste All into a one-voice destination ---
{
  const score = buildScore();
  const buffer = new PasteBuffer();
  const ok = buffer.setVoiceSelections(score, selectNotes(score, 1, 1, 2).concat(selectNotes(score, 2, 0, 0)), 'all');
  check('V11 copy all succeeds', ok);
  check('V11 voices 0 and 1 and 2 copied (measure 1 has three)', JSON.stringify(buffer.copiedVoiceNumbers()) === '[0,1,2]',
    JSON.stringify(buffer.copiedVoiceNumbers()));
  buffer.pasteAllVoices(dest(7));
  check('V11 measure 7 has three voices', voiceCount(score, 7) === 3, `n=${voiceCount(score, 7)}`);
  [0, 1, 2].forEach((v) => {
    check(`V11 measure 7 voice ${v} equals measure 1 voice ${v}`, same(voiceNotes(score, 7, v), voiceNotes(score, 1, v)));
  });
  check('V11 measure 8 voice 0 equals measure 2 voice 0', same(voiceNotes(score, 8, 0), voiceNotes(score, 2, 0)));
  check('V11 measure 8 voice 1 equals measure 2 voice 1', same(voiceNotes(score, 8, 1), voiceNotes(score, 2, 1)));
  // measure 2 has no voice 2: the copy holds rests there, pasted as rests
  const rests = voiceNotes(score, 8, 2);
  check('V11 a copied voice missing from a measure is pasted as rests', rests !== null && rests.every((n) => n.startsWith('r:')),
    JSON.stringify(rests));
}

// --- V12: paste All onto a destination that already has voices ---
{
  const score = buildScore();
  const buffer = new PasteBuffer();
  buffer.setVoiceSelections(score, selectNotes(score, 0, 0, 0), 'all');
  buffer.pasteAllVoices(dest(2));
  check('V12 measure 2 voice 0 replaced', same(voiceNotes(score, 2, 0), voiceNotes(score, 0, 0)));
  check('V12 measure 2 voice 1 replaced', same(voiceNotes(score, 2, 1), voiceNotes(score, 0, 1)));
  check('V12 measure 2 has two voices, no extra voice', voiceCount(score, 2) === 2, `n=${voiceCount(score, 2)}`);
  check('V12 measure 3 (destination for the second copied measure? only one copied) is unchanged',
    same(voiceNotes(score, 3, 1), voiceNotes(buildScore(), 3, 1)));
}

// --- V13: uncopied destination voices are unchanged ---
{
  const score = buildScore();
  const buffer = new PasteBuffer();
  // copy All from measure 6 (two voices: 0 and 1); the destination (measure 1) has a third voice
  buffer.setVoiceSelections(score, selectNotes(score, 6, 0, 0), 'all');
  check('V13 two voices copied', JSON.stringify(buffer.copiedVoiceNumbers()) === '[0,1]');
  const v2Before = voiceNotes(score, 1, 2);
  buffer.pasteAllVoices(dest(1));
  check('V13 voice 2 of the destination, which was not copied, is unchanged', same(voiceNotes(score, 1, 2), v2Before));
}

// --- V14: a paste past the end of the score is limited ---
{
  const score = buildScore();
  const buffer = new PasteBuffer();
  buffer.setVoiceSelections(score, selectNotes(score, 0, 0, 0).concat(selectNotes(score, 3, 0, 0)), 0);
  check('V14 copies four measures', buffer.voiceCopy!.measureCount === 4);
  let threw = false;
  try {
    buffer.pasteVoice(dest(10), 0);
  } catch (e) {
    threw = true;
  }
  check('V14 pasting past the end does not throw', !threw);
  check('V14 score still has 12 measures', score.staves[0].measures.length === 12);
  check('V14 measure 10 holds the first copied measure', same(voiceNotes(score, 10, 0), voiceNotes(score, 0, 0)));
  check('V14 measure 11 holds the second copied measure', same(voiceNotes(score, 11, 0), voiceNotes(score, 1, 0)));
}

// --- V15: a voice missing on part of the copy is copied as rests ---
{
  const score = buildScore();
  const buffer = new PasteBuffer();
  // voice 1 exists on measures 2, 3 and 6, not 4 or 5
  buffer.setVoiceSelections(score, selectNotes(score, 2, 0, 0, 0).concat(selectNotes(score, 4, 0, 0, 0)), 1);
  check('V15 voice 1 copied over three measures', buffer.voiceCopy!.measureCount === 3);
  buffer.pasteVoice(dest(8), 1);
  check('V15 measure 8 voice 1 equals measure 2 voice 1', same(voiceNotes(score, 8, 1), voiceNotes(score, 2, 1)));
  check('V15 measure 9 voice 1 equals measure 3 voice 1', same(voiceNotes(score, 9, 1), voiceNotes(score, 3, 1)));
  const rests = voiceNotes(score, 10, 1);
  check('V15 measure 10 voice 1 is rests (the source had no voice 1 in measure 4)', rests !== null && rests.every((n) => n.startsWith('r:')),
    JSON.stringify(rests));
}

// --- V16: tuplets are kept, and registered for the destination voice ---
{
  const score = buildScore();
  const buffer = new PasteBuffer();
  check('V16 the source has a tuplet in voice 0 of measure 5', tupletVoices(score, 5).join() === '0');
  buffer.setVoiceSelections(score, selectNotes(score, 5, 0, 0), 0);
  buffer.pasteVoice(dest(8), 0);
  check('V16 pasted measure has the same notes, including the tuplet', same(voiceNotes(score, 8, 0), voiceNotes(score, 5, 0)));
  check('V16 the tuplet is registered for voice 0', tupletVoices(score, 8).join() === '0', tupletVoices(score, 8).join());
  buffer.pasteVoice(dest(9), 1);
  check('V16 pasted into voice 1, the tuplet belongs to voice 1', tupletVoices(score, 9).join() === '1', tupletVoices(score, 9).join());
  check('V16 the tuplet notes are tuplets in the new voice', score.staves[0].measures[9].voices[1].notes[0].isTuplet === true);
}

// --- V17: another voice's tuplet survives a multi-measure paste ---
{
  const score = buildScore();
  const buffer = new PasteBuffer();
  // copy voice 0 of measures 0-2, paste over measures 5-7; voice 1 of measure 6 has a triplet
  buffer.setVoiceSelections(score, selectNotes(score, 0, 0, 0).concat(selectNotes(score, 2, 0, 0)), 0);
  check('V17 voice 1 of measure 6 has a tuplet before', tupletVoices(score, 6).indexOf(1) >= 0);
  buffer.pasteVoice(dest(5), 0);
  check('V17 voice 1 tuplet of the middle measure survives', tupletVoices(score, 6).indexOf(1) >= 0, tupletVoices(score, 6).join());
  check('V17 voice 1 notes of the middle measure are still a tuplet', score.staves[0].measures[6].voices[1].notes[0].isTuplet === true);
  check('V17 voice 0 of measure 5 was replaced (its tuplet is gone)', tupletVoices(score, 5).indexOf(0) < 0, tupletVoices(score, 5).join());
}

// --- V18: no stale tuplet trees in the replaced voice ---
{
  const score = buildScore();
  const buffer = new PasteBuffer();
  // copy 3 measures of plain voice 0 (measures 0-2), paste over measures 3-5; measure 5 voice 0 has a triplet
  buffer.setVoiceSelections(score, selectNotes(score, 0, 0, 0).concat(selectNotes(score, 2, 0, 0)), 0);
  buffer.pasteVoice(dest(3), 0);
  check('V18 the triplet in the last pasted measure is gone', tupletVoices(score, 5).indexOf(0) < 0, tupletVoices(score, 5).join());
  check('V18 the pasted notes are plain', score.staves[0].measures[5].voices[0].notes.every((n) => !n.isTuplet));
}

// --- V19: slurs are carried when the voice number is kept ---
{
  const slurFor = (score: SmoScore) => {
    const a = SmoSelection.noteSelection(score, 0, 0, 0, 0)!;
    const b = SmoSelection.noteSelection(score, 0, 0, 0, 2)!;
    const slur = SmoOperation.createSlur(score, a, b);
    a.staff.addStaffModifier(slur);
    return slur;
  };
  const slursAt = (score: SmoScore, m: number) =>
    score.staves[0].getModifiers().filter((mod: any) => mod.ctor === 'SmoSlur' && mod.startSelector.measure === m);
  // same voice number: carried
  {
    const score = buildScore();
    slurFor(score);
    const buffer = new PasteBuffer();
    buffer.setVoiceSelections(score, selectNotes(score, 0, 0, 0), 0);
    buffer.pasteVoice(dest(7), 0);
    check('V19 a slur is carried when pasted into the same voice number', slursAt(score, 7).length === 1, `n=${slursAt(score, 7).length}`);
  }
  // different voice number: not carried
  {
    const score = buildScore();
    slurFor(score);
    const buffer = new PasteBuffer();
    buffer.setVoiceSelections(score, selectNotes(score, 0, 0, 0), 0);
    buffer.pasteVoice(dest(8), 1);
    check('V19 a slur is not carried into a different voice number', slursAt(score, 8).length === 0, `n=${slursAt(score, 8).length}`);
    check('V19 the notes are still pasted', same(voiceNotes(score, 8, 1), voiceNotes(score, 0, 0)));
  }
}

// --- V20: the existing copy and paste are unchanged ---
{
  const score = buildScore();
  const buffer = new PasteBuffer();
  buffer.setVoiceSelections(score, selectNotes(score, 0, 0, 0), 0);
  check('V20 a voice copy exists before a normal copy', buffer.hasVoiceCopy());
  buffer.setSelections(score, selectNotes(score, 1, 0, 3, 0));
  check('V20 a normal copy clears the voice copy', !buffer.hasVoiceCopy());
  buffer.pasteSelections({ staff: 0, measure: 8, voice: 0, tick: 0, pitches: [] });
  check('V20 plain paste of one voice into measure 8', same(voiceNotes(score, 8, 0), voiceNotes(score, 1, 0)));
  check('V20 plain paste leaves measure 8 with one voice', voiceCount(score, 8) === 1);
  // a partial-measure copy and paste still works note by note
  const score2 = buildScore();
  const buffer2 = new PasteBuffer();
  buffer2.setSelections(score2, selectNotes(score2, 0, 1, 2, 0));
  buffer2.pasteSelections({ staff: 0, measure: 8, voice: 0, tick: 0, pitches: [] });
  const src = voiceNotes(score2, 0, 0)!;
  const got = voiceNotes(score2, 8, 0)!;
  check('V20 partial plain paste puts the 2 notes first', got[0] === src[1] && got[1] === src[2], JSON.stringify(got));
  check('V20 partial plain paste keeps the rest of the measure', got.length === 4 && got[2] === voiceNotes(buildScore(), 8, 0)![2]);
  // an unrelated voice's tuplet in middle measures is kept by a plain multi-measure paste
  const score3 = buildScore();
  const buffer3 = new PasteBuffer();
  buffer3.setSelections(score3, selectNotes(score3, 0, 0, 3, 0).concat(selectNotes(score3, 1, 0, 3, 0), selectNotes(score3, 2, 0, 3, 0)));
  buffer3.pasteSelections({ staff: 0, measure: 5, voice: 0, tick: 0, pitches: [] });
  check('V20 plain multi-measure paste works', same(voiceNotes(score3, 6, 0), voiceNotes(score3, 1, 0)));
}

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('all checks passed');
}
