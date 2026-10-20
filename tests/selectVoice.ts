/**
 * Headless checks for the Select Voice logic (SmoSelection.voiceChoices and
 * SmoSelection.getVoiceSelectors).  Cases S1-S16 are listed in
 * specs/031-select-voice/contracts/select-voice-contract.md.  The tracker mapping and the menu
 * need the renderer and are checked by hand.
 *
 * Run with: npm run test:select-voice
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

const WHOLE = 16384;
/** Replace a voice with notes of the given tick lengths, all pitched so they are real notes */
const setVoice = (measure: SmoMeasure, voice: number, lengths: number[], rests: boolean = false) => {
  while (measure.voices.length <= voice) {
    measure.populateVoice(measure.voices.length);
  }
  const template = measure.voices[voice].notes[0];
  measure.voices[voice].notes = lengths.map((ticks) => {
    const note = SmoNote.clone(template);
    note.ticks = { numerator: ticks, denominator: 1, remainder: 0 };
    note.noteType = rests ? 'r' : 'n';
    return note;
  });
};
const QUARTERS = [4096, 4096, 4096, 4096];

/**
 * Two staves of six 4/4 measures.  Staff 0: voice 0 is four quarters in each measure (rests in
 * measure 3); voice 1 on measures 0-2 as a whole note, two half notes, four quarters; voice 2 on
 * measure 2 only.  Staff 1: voice 0 everywhere, voice 1 on measure 1 only.
 */
const buildScore = (): SmoScore => {
  const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
  while (score.staves[0].measures.length < 6) {
    score.addMeasure(score.staves[0].measures.length - 1);
  }
  // the second staff copies the measures of the first
  const instrument = SmoInstrument.defaults;
  instrument.startSelector.staff = instrument.endSelector.staff = 1;
  const staffParams = SmoSystemStaff.defaults;
  staffParams.staffId = 1;
  staffParams.measureInstrumentMap[0] = new SmoInstrument(instrument);
  score.addStaff(staffParams);
  const s0 = score.staves[0].measures;
  const s1 = score.staves[1].measures;
  s0.forEach((m, ix) => setVoice(m, 0, QUARTERS, ix === 3));
  s1.forEach((m) => setVoice(m, 0, QUARTERS));
  setVoice(s0[0], 1, [WHOLE]);
  setVoice(s0[1], 1, [WHOLE / 2, WHOLE / 2]);
  setVoice(s0[2], 1, QUARTERS);
  setVoice(s0[2], 2, QUARTERS);
  setVoice(s1[1], 1, [WHOLE / 2, WHOLE / 2]);
  return score;
};
/** Selections for ticks first-last of a voice in a measure, as the tracker would hold them */
const sel = (score: SmoScore, staff: number, measure: number, voice: number, first: number, last: number = first): SmoSelection[] => {
  const rv: SmoSelection[] = [];
  for (let t = first; t <= last; ++t) {
    const s = SmoSelection.noteSelection(score, staff, measure, voice, t);
    if (s) {
      rv.push(s);
    }
  }
  return rv;
};
const keys = (selectors: SmoSelector[]) => selectors.map((s) => SmoSelector.getNoteKey(s));

const score = buildScore();
check('builder: score has 2 staves of 6 measures', score.staves.length === 2 && score.staves.every((s) => s.measures.length === 6));
check('builder: voice counts as designed', score.staves[0].measures.map((m) => m.voices.length).join() === '2,2,3,1,1,1' &&
  score.staves[1].measures.map((m) => m.voices.length).join() === '1,2,1,1,1,1', score.staves[0].measures.map((m) => m.voices.length).join());

// --- S1-S5: the choices ---
check('S1 a single-voice measure offers nothing', JSON.stringify(SmoSelection.voiceChoices(score, sel(score, 0, 4, 0, 0))) === '[]');
check('S2 no selection offers nothing', JSON.stringify(SmoSelection.voiceChoices(score, [])) === '[]');
check('S3 a two-voice measure offers voices 0 and 1', JSON.stringify(SmoSelection.voiceChoices(score, sel(score, 0, 0, 0, 0))) === '[0,1]');
check('S4 measures 0 to 2 offer voices 0, 1 and 2',
  JSON.stringify(SmoSelection.voiceChoices(score, sel(score, 0, 0, 0, 0).concat(sel(score, 0, 2, 0, 0)))) === '[0,1,2]');
check('S5 two single-voice measures offer nothing',
  JSON.stringify(SmoSelection.voiceChoices(score, sel(score, 0, 3, 0, 0).concat(sel(score, 0, 4, 0, 0)))) === '[]');

// --- S6: a single selected note selects the whole voice in the measure ---
{
  // the third quarter of voice 0 in measure 0; voice 1 there is one whole note
  const got = SmoSelection.getVoiceSelectors(score, sel(score, 0, 0, 0, 2), 1);
  check('S6 the whole note of voice 1 is selected from a single voice 0 note', JSON.stringify(keys(got)) === '["0-0-1-0"]', JSON.stringify(keys(got)));
}
// --- S7: uneven voices ---
{
  const got = SmoSelection.getVoiceSelectors(score, sel(score, 0, 1, 0, 0), 1);
  check('S7 two half notes selected even though voice 0 has four notes', JSON.stringify(keys(got)) === '["0-1-1-0","0-1-1-1"]', JSON.stringify(keys(got)));
}
// --- S8: several measures, in order ---
{
  const picked = sel(score, 0, 0, 0, 0).concat(sel(score, 0, 1, 0, 0), sel(score, 0, 2, 0, 0));
  const got = SmoSelection.getVoiceSelectors(score, picked, 1);
  check('S8 1 + 2 + 4 notes of voice 1', got.length === 7, `n=${got.length}`);
  check('S8 all are voice 1, in measure then tick order',
    got.every((s) => s.voice === 1) && JSON.stringify(keys(got)) ===
    '["0-0-1-0","0-1-1-0","0-1-1-1","0-2-1-0","0-2-1-1","0-2-1-2","0-2-1-3"]', JSON.stringify(keys(got)));
  // --- S9: a voice present in only some of the measures ---
  const v2 = SmoSelection.getVoiceSelectors(score, picked, 2);
  check('S9 voice 2 exists only in measure 2: four notes there, nothing from the others',
    JSON.stringify(keys(v2)) === '["0-2-2-0","0-2-2-1","0-2-2-2","0-2-2-3"]', JSON.stringify(keys(v2)));
}
// --- S10: no notes anywhere in the selected measures ---
{
  const picked = sel(score, 0, 0, 0, 0).concat(sel(score, 0, 1, 0, 0));
  check('S10 voice 2 has no notes in measures 0 and 1: nothing to select',
    SmoSelection.getVoiceSelectors(score, picked, 2).length === 0);
}
// --- S11: two staves, each gets its own voice ---
{
  const picked = sel(score, 0, 1, 0, 0).concat(sel(score, 1, 1, 0, 0));
  const got = SmoSelection.getVoiceSelectors(score, picked, 1);
  check('S11 both staves contribute their voice 1 notes in measure 1',
    JSON.stringify(keys(got)) === '["0-1-1-0","0-1-1-1","1-1-1-0","1-1-1-1"]', JSON.stringify(keys(got)));
}
// --- S12: a staff without the voice contributes nothing and gets no voice ---
{
  const picked = sel(score, 0, 0, 0, 0).concat(sel(score, 1, 0, 0, 0));
  const got = SmoSelection.getVoiceSelectors(score, picked, 1);
  check('S12 only staff 0 contributes (staff 1 measure 0 has one voice)', JSON.stringify(keys(got)) === '["0-0-1-0"]', JSON.stringify(keys(got)));
  check('S12 the voice was not created on staff 1', score.staves[1].measures[0].voices.length === 1);
}
// --- S13: rests are notes of the voice ---
{
  const got = SmoSelection.getVoiceSelectors(score, sel(score, 0, 3, 0, 0), 0);
  const allRests = got.every((s) => score.staves[0].measures[3].voices[0].notes[s.tick].noteType === 'r');
  check('S13 the four rests of measure 3 are selected', got.length === 4 && allRests, `n=${got.length}`);
}
// --- S14: nothing in the score changes ---
{
  const fresh = buildScore();
  const before = JSON.stringify(fresh.serialize({ skipStaves: false, useDictionary: false, preserveStaffIds: false }));
  const everything: SmoSelection[] = [];
  fresh.staves.forEach((staff, si) => staff.measures.forEach((_m, mi) => everything.push(...sel(fresh, si, mi, 0, 0))));
  SmoSelection.voiceChoices(fresh, everything);
  for (let v = -1; v <= 4; ++v) {
    SmoSelection.getVoiceSelectors(fresh, everything, v);
  }
  const after = JSON.stringify(fresh.serialize({ skipStaves: false, useDictionary: false, preserveStaffIds: false }));
  check('S14 the serialized score is unchanged', before === after);
  check('S14 the voice counts are unchanged', fresh.staves[0].measures.map((m) => m.voices.length).join() === '2,2,3,1,1,1' &&
    fresh.staves[1].measures.map((m) => m.voices.length).join() === '1,2,1,1,1,1');
}
// --- S15: out-of-range voices ---
check('S15 voice 4 selects nothing', SmoSelection.getVoiceSelectors(score, sel(score, 0, 0, 0, 0), 4).length === 0);
check('S15 voice -1 selects nothing', SmoSelection.getVoiceSelectors(score, sel(score, 0, 0, 0, 0), -1).length === 0);
check('S15 no selection selects nothing', SmoSelection.getVoiceSelectors(score, [], 0).length === 0);
// --- S16: selector shape ---
{
  const got = SmoSelection.getVoiceSelectors(score, sel(score, 0, 2, 0, 0), 2);
  check('S16 selectors name the requested voice and select whole notes', got.length === 4 &&
    got.every((s) => s.voice === 2 && Array.isArray(s.pitches) && s.pitches.length === 0));
}

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('all checks passed');
}
