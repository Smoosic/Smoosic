/**
 * Headless checks for how SmoOperation.computeMultipartRest groups empty measures into multimeasure
 * rests around landmarks.  Cases G1-G24 are listed in
 * specs/032-split-multimeasure-rests/contracts/grouping-contract.md.  Drawing is checked by hand.
 *
 * Run with: npm run test:multimeasure-rest
 */
import { SmoScore } from '../src/smo/data/score';
import { SmoSystemStaff } from '../src/smo/data/systemStaff';
import { SmoInstrument } from '../src/smo/data/staffModifiers';
import { SmoOperation } from '../src/smo/xform/operations';
import { SmoBarline, SmoRehearsalMark, SmoRepeatSymbol, SmoTempo, SmoTimeSignature,
  SmoVolta } from '../src/smo/data/measureModifiers';
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

const COUNT = 12;
/** A part of 12 empty 4/4 measures, with multimeasure rests turned on.  Measures are 1-based in the helpers. */
const buildScore = (staffCount: number = 1): SmoScore => {
  const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
  while (score.staves[0].measures.length < COUNT) {
    score.addMeasure(score.staves[0].measures.length - 1);
  }
  for (let s = 1; s < staffCount; ++s) {
    const instrument = SmoInstrument.defaults;
    instrument.startSelector.staff = instrument.endSelector.staff = s;
    const params = SmoSystemStaff.defaults;
    params.staffId = s;
    params.measureInstrumentMap[0] = new SmoInstrument(instrument);
    score.addStaff(params);
  }
  score.staves[0].partInfo.expandMultimeasureRests = false;
  return score;
};
const measureAt = (score: SmoScore, m: number, staff: number = 0) => score.staves[staff].measures[m - 1];

// --- landmark helpers ---
const addRehearsal = (score: SmoScore, m: number, staff: number = 0) =>
  measureAt(score, m, staff).addRehearsalMark(SmoRehearsalMark.defaults);
const setSymbol = (score: SmoScore, m: number, name: string) => {
  const params = SmoRepeatSymbol.defaults;
  params.symbol = SmoRepeatSymbol.symbols[name];
  score.staves.forEach((staff) => staff.measures[m - 1].setRepeatSymbol(new SmoRepeatSymbol(params)));
};
const setBarline = (score: SmoScore, m: number, position: 'start' | 'end', barline: string) => {
  const params = SmoBarline.defaults;
  params.position = SmoBarline.positions[position];
  params.barline = SmoBarline.barlines[barline];
  score.staves.forEach((staff) => staff.measures[m - 1].setBarline(new SmoBarline(params)));
};
/** A change carries forward, so apply it from measure m to the end */
const setKey = (score: SmoScore, m: number, key: string) =>
  score.staves.forEach((staff) => staff.measures.forEach((mm, ix) => { if (ix >= m - 1) { mm.keySignature = key; } }));
const setTime = (score: SmoScore, m: number, beats: number, duration: number) =>
  score.staves.forEach((staff) => staff.measures.forEach((mm, ix) => {
    if (ix >= m - 1) {
      mm.timeSignature = new SmoTimeSignature({ ...SmoTimeSignature.defaults, times: [{ actualBeats: beats, beatDuration: duration }] });
    }
  }));
const setTempo = (score: SmoScore, m: number, display: boolean) =>
  score.staves.forEach((staff) => staff.measures.forEach((mm, ix) => {
    if (ix >= m - 1) {
      mm.tempo = new SmoTempo({ ...SmoTempo.defaults, bpm: 90, display });
    }
  }));
const setInstrument = (score: SmoScore, m: number) => {
  const instrument = SmoInstrument.defaults;
  instrument.startSelector.measure = m - 1;
  score.staves[0].measureInstrumentMap[m - 1] = new SmoInstrument(instrument);
};

// --- readers ---
/** Blocks of two or more measures, as 'start:length' (1-based) */
const blocks = (score: SmoScore, staff: number = 0): string[] => {
  const rv: string[] = [];
  score.staves[staff].measures.forEach((mm, ix) => {
    if (mm.svg.multimeasureLength > 0) {
      rv.push(`${ix + 1}:${mm.svg.multimeasureLength}`);
    }
  });
  return rv;
};
const hidden = (score: SmoScore, staff: number = 0): number[] => {
  const rv: number[] = [];
  score.staves[staff].measures.forEach((mm, ix) => { if (mm.svg.hideMultimeasure) { rv.push(ix + 1); } });
  return rv;
};
/** every measure is in a block or an ordinary bar, and the lengths add up */
const accounted = (score: SmoScore): boolean => {
  let total = 0;
  score.staves[0].measures.forEach((mm) => {
    if (mm.svg.multimeasureLength > 0) {
      total += mm.svg.multimeasureLength;
    } else if (!mm.svg.hideMultimeasure) {
      total += 1;
    }
  });
  return total === COUNT;
};
const ordinary = (score: SmoScore, m: number) =>
  measureAt(score, m).svg.multimeasureLength === 0 && !measureAt(score, m).svg.hideMultimeasure;
const run = (score: SmoScore) => SmoOperation.computeMultipartRest(score);
const same = (a: string[], b: string[]) => JSON.stringify(a) === JSON.stringify(b);
const range = (from: number, to: number): number[] => {
  const rv: number[] = [];
  for (let i = from; i <= to; ++i) { rv.push(i); }
  return rv;
};

// --- G1: no landmarks ---
{
  const score = buildScore();
  run(score);
  check('G1 one block of 12', same(blocks(score), ['1:12']), JSON.stringify(blocks(score)));
  check('G1 measures 2 to 12 are hidden', JSON.stringify(hidden(score)) === JSON.stringify(range(2, 12)));
  check('G1 every measure accounted for', accounted(score));
}
// --- G2: rehearsal mark in the middle ---
{
  const score = buildScore();
  addRehearsal(score, 6);
  run(score);
  check('G2 two blocks, 5 and 7', same(blocks(score), ['1:5', '6:7']), JSON.stringify(blocks(score)));
  check('G2 no lone bar: measure 6 starts a block and is not hidden', !hidden(score).includes(6) && measureAt(score, 6).svg.multimeasureLength === 7);
  check('G2 hidden are 2-5 and 7-12', JSON.stringify(hidden(score)) === JSON.stringify(range(2, 5).concat(range(7, 12))));
  check('G2 every measure accounted for', accounted(score));
}
// --- G3: rehearsal mark on the first measure ---
{
  const score = buildScore();
  addRehearsal(score, 1);
  run(score);
  check('G3 one block of 12', same(blocks(score), ['1:12']), JSON.stringify(blocks(score)));
}
// --- G4: rehearsal mark on the last measure ---
{
  const score = buildScore();
  addRehearsal(score, 12);
  run(score);
  check('G4 block of 11, last measure an ordinary bar', same(blocks(score), ['1:11']) && ordinary(score, 12), JSON.stringify(blocks(score)));
  check('G4 every measure accounted for', accounted(score));
}
// --- G5: two marks ---
{
  const score = buildScore();
  addRehearsal(score, 4);
  addRehearsal(score, 8);
  run(score);
  check('G5 blocks 3, 4, 5', same(blocks(score), ['1:3', '4:4', '8:5']), JSON.stringify(blocks(score)));
  check('G5 every measure accounted for', accounted(score));
}
// --- G6-G10: key, time, tempo ---
{
  const score = buildScore();
  setKey(score, 5, 'D');
  run(score);
  check('G6 key change at 5', same(blocks(score), ['1:4', '5:8']), JSON.stringify(blocks(score)));
}
{
  const score = buildScore();
  setTime(score, 5, 3, 4);
  run(score);
  check('G7 time signature change at 5', same(blocks(score), ['1:4', '5:8']), JSON.stringify(blocks(score)));
}
{
  const score = buildScore();
  setTempo(score, 5, true);
  run(score);
  check('G8 displayed tempo change at 5', same(blocks(score), ['1:4', '5:8']), JSON.stringify(blocks(score)));
}
{
  const score = buildScore();
  setTempo(score, 5, false);
  run(score);
  check('G9 tempo change that is not displayed does not split', same(blocks(score), ['1:12']), JSON.stringify(blocks(score)));
}
{
  const score = buildScore();
  setKey(score, 5, 'D');
  addRehearsal(score, 5);
  run(score);
  check('G10 key change and rehearsal mark together split once', same(blocks(score), ['1:4', '5:8']), JSON.stringify(blocks(score)));
}
// --- G11-G12: Segno and Coda start the next block ---
{
  const score = buildScore();
  setSymbol(score, 5, 'Segno');
  run(score);
  check('G11 Segno at 5', same(blocks(score), ['1:4', '5:8']), JSON.stringify(blocks(score)));
  check('G11 a start symbol is not recorded as an end symbol', measureAt(score, 1).svg.multimeasureEndSymbol === null);
}
{
  const score = buildScore();
  setSymbol(score, 9, 'Coda');
  run(score);
  check('G12 Coda at 9', same(blocks(score), ['1:8', '9:4']), JSON.stringify(blocks(score)));
}
// --- G13-G15: end symbols close the block and are recorded on it ---
{
  const score = buildScore();
  setSymbol(score, 4, 'DsAlCoda');
  run(score);
  check('G13 D.S. al Coda on 4 ends the first block', same(blocks(score), ['1:4', '5:8']), JSON.stringify(blocks(score)));
  const sym = measureAt(score, 1).svg.multimeasureEndSymbol;
  check('G13 the symbol is recorded on the first measure of the block', !!sym && sym.symbol === SmoRepeatSymbol.symbols.DsAlCoda);
  check('G13 the next block has no end symbol', measureAt(score, 5).svg.multimeasureEndSymbol === null);
  check('G13 every measure accounted for', accounted(score));
}
{
  const score = buildScore();
  setSymbol(score, 6, 'ToCoda');
  run(score);
  check('G14 To Coda on 6', same(blocks(score), ['1:6', '7:6']), JSON.stringify(blocks(score)));
  const sym = measureAt(score, 1).svg.multimeasureEndSymbol;
  check('G14 the symbol is recorded on the first measure', !!sym && sym.symbol === SmoRepeatSymbol.symbols.ToCoda);
}
{
  const score = buildScore();
  setSymbol(score, 1, 'DcAlFine');
  run(score);
  check('G15 D.C. al Fine on the first measure: it is an ordinary bar, the rest follows', ordinary(score, 1) && same(blocks(score), ['2:11']), JSON.stringify(blocks(score)));
  check('G15 the lone bar keeps its own symbol (none recorded)', measureAt(score, 1).svg.multimeasureEndSymbol === null);
}
// --- G16-G18: barlines ---
{
  const score = buildScore();
  setBarline(score, 4, 'end', 'endRepeat');
  run(score);
  check('G16 end repeat after measure 4', same(blocks(score), ['1:4', '5:8']), JSON.stringify(blocks(score)));
  check('G16 the first block ends with the repeat barline', measureAt(score, 1).svg.multimeasureEndBarline === SmoBarline.barlines.endRepeat);
  check('G16 the second block ends with a plain barline', measureAt(score, 5).svg.multimeasureEndBarline === SmoBarline.barlines.singleBar);
}
{
  const score = buildScore();
  setBarline(score, 5, 'start', 'startRepeat');
  run(score);
  check('G17 start repeat on measure 5', same(blocks(score), ['1:4', '5:8']), JSON.stringify(blocks(score)));
}
{
  const a = buildScore();
  setBarline(a, 4, 'end', 'doubleBar');
  run(a);
  const b = buildScore();
  setBarline(b, 5, 'start', 'doubleBar');
  run(b);
  check('G18 double bar as the end of 4', same(blocks(a), ['1:4', '5:8']), JSON.stringify(blocks(a)));
  check('G18 double bar as the start of 5', same(blocks(b), ['1:4', '5:8']), JSON.stringify(blocks(b)));
}
// --- G19: instrument change ---
{
  const score = buildScore();
  setInstrument(score, 7);
  run(score);
  check('G19 instrument change at 7', same(blocks(score), ['1:6', '7:6']), JSON.stringify(blocks(score)));
}
// --- G20: a measure with both kinds of landmark is a block of its own ---
{
  const score = buildScore();
  addRehearsal(score, 5);
  setSymbol(score, 5, 'DsAlFine');
  run(score);
  check('G20 rehearsal mark and D.S. on 5: blocks 1-4 and 6-12', same(blocks(score), ['1:4', '6:7']), JSON.stringify(blocks(score)));
  check('G20 measure 5 is an ordinary bar', ordinary(score, 5));
  check('G20 every measure accounted for', accounted(score));
}
// --- G21: expanded rests ---
{
  const score = buildScore();
  score.staves[0].partInfo.expandMultimeasureRests = true;
  addRehearsal(score, 6);
  setSymbol(score, 4, 'DsAlCoda');
  run(score);
  check('G21 no blocks and nothing hidden when rests are expanded', blocks(score).length === 0 && hidden(score).length === 0);
}
// --- G22: a volta ending is never grouped ---
{
  const score = buildScore();
  const volta = new SmoVolta({ ...SmoVolta.defaults,
    startSelector: { staff: 0, measure: 4, voice: 0, tick: 0, pitches: [] },
    endSelector: { staff: 0, measure: 5, voice: 0, tick: 0, pitches: [] } } as any);
  measureAt(score, 5).addNthEnding(volta);
  run(score);
  check('G22 measures 5 and 6 under the ending are ordinary bars', ordinary(score, 5) && ordinary(score, 6), JSON.stringify(blocks(score)));
  check('G22 the rests before and after still group', same(blocks(score), ['1:4', '7:6']), JSON.stringify(blocks(score)));
  check('G22 every measure accounted for', accounted(score));
}
// --- G23: two staves, a mark on only one ---
{
  const score = buildScore(2);
  addRehearsal(score, 6, 1);
  run(score);
  // measure 1 of a part with more than one staff is never the start of a block (unchanged behavior)
  check('G23 staff 0 blocks', same(blocks(score, 0), ['2:4', '6:7']), JSON.stringify(blocks(score, 0)));
  check('G23 staff 1 has the same blocks', same(blocks(score, 1), blocks(score, 0)), JSON.stringify(blocks(score, 1)));
  check('G23 and the same hidden measures', JSON.stringify(hidden(score, 1)) === JSON.stringify(hidden(score, 0)));
}
// --- G24: regrouping leaves nothing stale ---
{
  const score = buildScore();
  addRehearsal(score, 6);
  setSymbol(score, 4, 'DsAlCoda');
  run(score);
  measureAt(score, 6).removeRehearsalMark();
  setSymbol(score, 4, 'None');
  run(score);
  check('G24 back to one block of 12', same(blocks(score), ['1:12']), JSON.stringify(blocks(score)));
  check('G24 measures 2 to 12 hidden, none else', JSON.stringify(hidden(score)) === JSON.stringify(range(2, 12)));
  const lengths = score.staves[0].measures.map((mm) => mm.svg.multimeasureLength).join();
  check('G24 no stale length on other measures', lengths === '12,0,0,0,0,0,0,0,0,0,0,0', lengths);
  check('G24 no stale end symbol', score.staves[0].measures.every((mm) => mm.svg.multimeasureEndSymbol === null));
  check('G24 every measure accounted for', accounted(score));
}

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('all checks passed');
}
