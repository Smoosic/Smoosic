/**
 * Headless checks for converting note-attached text groups to annotations on score load.
 * See specs/019-attached-text-to-annotation/contracts/conversion-contract.md (cases C1-C18).
 *
 * Run with: npm run test:attached-text
 */
import { SmoScore, SmoScoreSerializeOptions } from '../src/smo/data/score';
import { SmoTextGroup, SmoScoreText } from '../src/smo/data/scoreText';
import { SmoLyric, noteModifierDynamicCtorInit } from '../src/smo/data/noteModifiers';
import { measureModifierDynamicCtorInit } from '../src/smo/data/measureModifiers';
import { staffModifierDynamicCtorInit } from '../src/smo/data/staffModifiers';
import { scoreModifierDynamicCtorInit } from '../src/smo/data/scoreModifiers';
import { FontInfo } from '../src/common/vex';

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

// Serialize the whole score without the token dictionary, so the JSON is easy to build on and inspect.
const plainSerialize: SmoScoreSerializeOptions = { skipStaves: false, useDictionary: false, preserveStaffIds: false };

interface TestSelector {
  staff: number, measure: number, voice: number, tick: number, pitches: number[]
}
interface TestBlock {
  text: string,
  fontInfo?: FontInfo
}
interface TestOffsets {
  musicXOffset: number,
  musicYOffset: number
}

const sel = (staff: number, measure: number, tick: number, voice: number = 0): TestSelector =>
  ({ staff, measure, voice, tick, pitches: [] });

/**
 * A plain (uncompressed) serialized score with 2 staves and 3 measures of 4 notes each.
 * Staff 1 is a copy of staff 0 so the notes exist on both.
 */
const makeBaseScore = (): any => {
  const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
  score.addMeasure(1);
  score.addMeasure(2);
  const ser: any = JSON.parse(JSON.stringify(score.serialize(plainSerialize)));
  const second = JSON.parse(JSON.stringify(ser.staves[0]));
  second.staffId = 1;
  ser.staves.push(second);
  return ser;
};

const makeGroup = (selector: TestSelector | null, blocks: TestBlock[], offsets?: TestOffsets): any => {
  const params = SmoTextGroup.defaults;
  params.textBlocks = blocks.map((block) => {
    const text = new SmoScoreText(SmoScoreText.defaults);
    text.text = block.text;
    if (block.fontInfo) {
      text.fontInfo = { ...block.fontInfo };
    }
    return { text, position: SmoTextGroup.relativePositions.RIGHT, activeText: false };
  });
  if (selector) {
    params.attachToSelector = true;
    params.selector = selector as any;
  }
  if (offsets) {
    params.musicXOffset = offsets.musicXOffset;
    params.musicYOffset = offsets.musicYOffset;
  }
  return JSON.parse(JSON.stringify(new SmoTextGroup(params).serialize()));
};
/** A group attached to a note. */
const attachedGroup = (selector: TestSelector, blocks: TestBlock[], offsets?: TestOffsets): any =>
  makeGroup(selector, blocks, offsets);
/** A free-floating group such as a title. */
const plainGroup = (text: string): any => makeGroup(null, [{ text }]);

const load = (obj: any): SmoScore => SmoScore.deserialize(JSON.stringify(obj));
const reload = (score: SmoScore): SmoScore =>
  SmoScore.deserialize(JSON.stringify(score.serialize(plainSerialize)));

const annotationsAt = (score: SmoScore, staff: number, measure: number, tick: number, voice: number = 0): SmoLyric[] =>
  score.staves[staff].measures[measure].voices[voice].notes[tick].getAnnotations();
const attachedCount = (score: SmoScore): number =>
  score.textGroups.filter((tg) => tg.attachToSelector).length;
const partAttachedCount = (score: SmoScore): number =>
  score.staves.reduce((acc, staff) => acc + staff.partInfo.textGroups.filter((tg) => tg.attachToSelector).length, 0);
const totalAnnotations = (score: SmoScore): number => {
  let rv = 0;
  score.staves.forEach((staff) => staff.measures.forEach((measure) => measure.voices.forEach((voice) =>
    voice.notes.forEach((note) => { rv += note.getAnnotations().length; }))));
  return rv;
};
const texts = (annotations: SmoLyric[]): string[] => annotations.map((aa) => aa.text);
const verses = (annotations: SmoLyric[]): number[] => annotations.map((aa) => aa.verse);
const sameJson = (a: any, b: any): boolean => JSON.stringify(a) === JSON.stringify(b);

// Sanity: the scaffold itself builds and round-trips before any conversion is involved.
const sanity = load(makeBaseScore());
check('scaffold: base score has 2 staves x 3 measures x 4 notes',
  sanity.staves.length === 2 && sanity.staves[0].measures.length === 3 &&
  sanity.staves[1].measures[2].voices[0].notes.length === 4);

/** A base score whose notes already carry the given annotations, as serialized JSON. */
const baseWithAnnotations = (seed: { staff: number, measure: number, tick: number, text: string, verse: number }[]): any => {
  const score = load(makeBaseScore());
  seed.forEach((ss) => {
    score.staves[ss.staff].measures[ss.measure].voices[0].notes[ss.tick].addAnnotation(new SmoLyric({
      ...SmoLyric.defaults, parser: SmoLyric.parsers.annotation, text: ss.text, verse: ss.verse
    }));
  });
  return JSON.parse(JSON.stringify(score.serialize(plainSerialize)));
};
/** A base score with the given text groups in the score's own list. */
const scoreWith = (groups: any[], base: any = makeBaseScore()): any => {
  base.textGroups = groups;
  return base;
};
/** Put text groups in the part info of one staff of a serialized score. */
const partWith = (obj: any, staff: number, groups: any[]): any => {
  obj.staves[staff].partInfo.textGroups = groups;
  return obj;
};

// --- User Story 1: score-level attached text (contract C1-C6, C10-C14, C16, C17) ---

// C1: a single block becomes one annotation on the target note
{
  const score = load(scoreWith([attachedGroup(sel(0, 1, 2), [{ text: 'Fine' }])]));
  const annotations = annotationsAt(score, 0, 1, 2);
  check('C1 one annotation, text preserved', annotations.length === 1 && annotations[0].text === 'Fine');
  check('C1 annotation uses verse 0 and the annotation parser',
    annotations[0]?.verse === 0 && annotations[0]?.parser === SmoLyric.parsers.annotation);
  check('C1 attached group removed from the score', attachedCount(score) === 0 && score.textGroups.length === 0);
  check('C1 no other note got an annotation', totalAnnotations(score) === 1);
}

// C2: one annotation per block, in block order
{
  const score = load(scoreWith([attachedGroup(sel(0, 0, 0), [{ text: 'a' }, { text: 'b' }, { text: 'c' }])]));
  const annotations = annotationsAt(score, 0, 0, 0);
  check('C2 three blocks give three annotations in order', sameJson(texts(annotations), ['a', 'b', 'c']),
    JSON.stringify(texts(annotations)));
  check('C2 verses are 0, 1, 2', sameJson(verses(annotations), [0, 1, 2]), JSON.stringify(verses(annotations)));
}

// C3: a whitespace-only block makes no annotation
{
  const score = load(scoreWith([attachedGroup(sel(0, 0, 1), [{ text: 'a' }, { text: '   ' }, { text: 'c' }])]));
  const annotations = annotationsAt(score, 0, 0, 1);
  check('C3 whitespace block skipped', sameJson(texts(annotations), ['a', 'c']), JSON.stringify(texts(annotations)));
  check('C3 remaining annotations take consecutive verses', sameJson(verses(annotations), [0, 1]),
    JSON.stringify(verses(annotations)));
}

// C4: measure out of range
{
  let score: SmoScore | null = null;
  let threw = false;
  try {
    score = load(scoreWith([attachedGroup(sel(0, 9, 0), [{ text: 'lost' }])]));
  } catch (ex) {
    threw = true;
  }
  check('C4 measure out of range does not throw', !threw);
  check('C4 no annotation created and group removed',
    score !== null && totalAnnotations(score) === 0 && score.textGroups.length === 0);
}

// C5: staff, voice and tick out of range
{
  let score: SmoScore | null = null;
  let threw = false;
  try {
    score = load(scoreWith([
      attachedGroup(sel(5, 0, 0), [{ text: 'bad staff' }]),
      attachedGroup(sel(0, 0, 0, 3), [{ text: 'bad voice' }]),
      attachedGroup(sel(0, 0, 9), [{ text: 'bad tick' }])
    ]));
  } catch (ex) {
    threw = true;
  }
  check('C5 staff/voice/tick out of range do not throw', !threw);
  check('C5 no annotation created and groups removed',
    score !== null && totalAnnotations(score) === 0 && score.textGroups.length === 0);
}

// C6: unattached text is left alone
{
  const score = load(scoreWith([plainGroup('My Title'), attachedGroup(sel(1, 2, 3), [{ text: 'Coda' }])]));
  check('C6 title kept, attached group gone', score.textGroups.length === 1 &&
    score.textGroups[0].textBlocks[0].text.text === 'My Title' && attachedCount(score) === 0);
  check('C6 annotation created on staff 1', sameJson(texts(annotationsAt(score, 1, 2, 3)), ['Coda']));
}

// C10: two groups pointing at the same note keep list order
{
  const score = load(scoreWith([
    attachedGroup(sel(0, 2, 0), [{ text: 'first' }]),
    attachedGroup(sel(0, 2, 0), [{ text: 'second' }])
  ]));
  const annotations = annotationsAt(score, 0, 2, 0);
  check('C10 both texts present, in list order', sameJson(texts(annotations), ['first', 'second']),
    JSON.stringify(texts(annotations)));
}

// C11: a note that already has four annotations gets no more
{
  const seed = [0, 1, 2, 3].map((vv) => ({ staff: 0, measure: 1, tick: 1, text: `s${vv}`, verse: vv }));
  const score = load(scoreWith([attachedGroup(sel(0, 1, 1), [{ text: 'extra' }])], baseWithAnnotations(seed)));
  const annotations = annotationsAt(score, 0, 1, 1);
  check('C11 full note unchanged', sameJson(texts(annotations), ['s0', 's1', 's2', 's3']),
    JSON.stringify(texts(annotations)));
  check('C11 group removed', attachedCount(score) === 0 && score.textGroups.length === 0);
}

// C12: new annotations use the next free verses
{
  const seed = [{ staff: 0, measure: 0, tick: 2, text: 'x', verse: 0 }, { staff: 0, measure: 0, tick: 2, text: 'y', verse: 1 }];
  const score = load(scoreWith([attachedGroup(sel(0, 0, 2), [{ text: 'p' }, { text: 'q' }])], baseWithAnnotations(seed)));
  const annotations = annotationsAt(score, 0, 0, 2);
  check('C12 existing annotations kept and new ones appended',
    sameJson(texts(annotations), ['x', 'y', 'p', 'q']), JSON.stringify(texts(annotations)));
  check('C12 verses are 0-3', sameJson(verses(annotations), [0, 1, 2, 3]), JSON.stringify(verses(annotations)));
}

// C12b: a block that would exceed four annotations is dropped, earlier ones kept
{
  const seed = [0, 1, 2].map((vv) => ({ staff: 0, measure: 0, tick: 3, text: `s${vv}`, verse: vv }));
  const score = load(scoreWith([attachedGroup(sel(0, 0, 3), [{ text: 'fits' }, { text: 'overflow' }])],
    baseWithAnnotations(seed)));
  check('C12b only the block that fits is converted',
    sameJson(texts(annotationsAt(score, 0, 0, 3)), ['s0', 's1', 's2', 'fits']),
    JSON.stringify(texts(annotationsAt(score, 0, 0, 3))));
}

// C17: block font is carried over
{
  const fontInfo: FontInfo = { family: 'Arial', size: 18, weight: 'bold', style: 'italic' };
  const score = load(scoreWith([attachedGroup(sel(0, 0, 0), [{ text: 'styled', fontInfo }])]));
  const font = annotationsAt(score, 0, 0, 0)[0]?.fontInfo;
  check('C17 font family, size, weight and style copied',
    !!font && font.family === 'Arial' && font.size === 18 && font.weight === 'bold' && font.style === 'italic',
    JSON.stringify(font));
}

// C13: a score without attached text is unaffected
{
  const score = load(scoreWith([plainGroup('Only a title')]));
  check('C13 unattached text kept', score.textGroups.length === 1 &&
    score.textGroups[0].textBlocks[0].text.text === 'Only a title');
  check('C13 no annotations appear', totalAnnotations(score) === 0);
  const plain = load(makeBaseScore());
  check('C13 staves serialize the same with and without the title',
    sameJson(score.serialize(plainSerialize).staves, plain.serialize(plainSerialize).staves));
}

// C14: converting is idempotent across save and reload
{
  const first = load(scoreWith([attachedGroup(sel(0, 1, 2), [{ text: 'Fine' }])]));
  const second = reload(first);
  check('C14 same annotation on the reloaded score', sameJson(texts(annotationsAt(second, 0, 1, 2)), ['Fine']));
  check('C14 no duplicates and no attached groups after reload',
    totalAnnotations(second) === totalAnnotations(first) && attachedCount(second) === 0 &&
    partAttachedCount(second) === 0);
  check('C14 the saved score contains no attached text groups',
    !JSON.stringify(first.serialize(plainSerialize)).includes('"attachToSelector":true'));
}

// C16: a score with no staves is left alone (SuiScoreView.setView deserializes such a copy)
{
  const obj: any = scoreWith([attachedGroup(sel(0, 0, 0), [{ text: 'keep me' }])]);
  obj.staves = [];
  let score: SmoScore | null = null;
  let threw = false;
  try {
    score = load(obj);
  } catch (ex) {
    threw = true;
  }
  check('C16 zero staves does not throw', !threw);
  check('C16 attached group is left in place', score !== null && attachedCount(score) === 1);
}

// --- User Story 2: attached text held in part info (contract C7-C9, C15) ---

// C7: a part's attached text lands on the note of the staff that owns the part info
{
  const score = load(partWith(makeBaseScore(), 1, [attachedGroup(sel(0, 2, 1), [{ text: 'Solo' }])]));
  check('C7 annotation added on the owning staff\'s note', sameJson(texts(annotationsAt(score, 1, 2, 1)), ['Solo']),
    JSON.stringify(texts(annotationsAt(score, 1, 2, 1))));
  check('C7 the part\'s recorded staff (0) did not redirect it to staff 0',
    annotationsAt(score, 0, 2, 1).length === 0 && totalAnnotations(score) === 1);
  check('C7 part list has no attached group', partAttachedCount(score) === 0 &&
    score.staves[1].partInfo.textGroups.length === 0);
}

// C7b: the staff number recorded on a part's copy is not used to choose the staff
{
  const score = load(partWith(makeBaseScore(), 0, [attachedGroup(sel(1, 0, 0), [{ text: 'owner wins' }])]));
  check('C7b annotation lands on the owning staff', sameJson(texts(annotationsAt(score, 0, 0, 0)), ['owner wins']) &&
    annotationsAt(score, 1, 0, 0).length === 0);
}

// C8: the same text held by the score and copied into the part becomes one annotation
{
  const obj = scoreWith([attachedGroup(sel(1, 2, 1), [{ text: 'Solo' }])]);
  partWith(obj, 1, [attachedGroup(sel(0, 2, 1), [{ text: 'Solo' }])]);
  const score = load(obj);
  check('C8 exactly one annotation for the shared text', annotationsAt(score, 1, 2, 1).length === 1 &&
    totalAnnotations(score) === 1, JSON.stringify(texts(annotationsAt(score, 1, 2, 1))));
  check('C8 neither list keeps an attached group', attachedCount(score) === 0 && partAttachedCount(score) === 0);
}

// C9: unattached part text stays, attached part text is converted
{
  const score = load(partWith(makeBaseScore(), 0,
    [plainGroup('Part Title'), attachedGroup(sel(0, 0, 0), [{ text: 'A' }])]));
  const partGroups = score.staves[0].partInfo.textGroups;
  check('C9 only the unattached part text remains', partGroups.length === 1 &&
    partGroups[0].textBlocks[0].text.text === 'Part Title' && !partGroups[0].attachToSelector);
  check('C9 attached part text became an annotation', sameJson(texts(annotationsAt(score, 0, 0, 0)), ['A']));
}

// C9b: every staff's part list is converted, not just the first
{
  const obj = makeBaseScore();
  partWith(obj, 0, [attachedGroup(sel(0, 0, 0), [{ text: 'one' }])]);
  partWith(obj, 1, [attachedGroup(sel(0, 1, 1), [{ text: 'two' }])]);
  const score = load(obj);
  check('C9b both staves\' part text converted', sameJson(texts(annotationsAt(score, 0, 0, 0)), ['one']) &&
    sameJson(texts(annotationsAt(score, 1, 1, 1)), ['two']) && partAttachedCount(score) === 0);
}

// C8b: a part's copy whose text differs from the score's (edited separately) still adds nothing:
// the note already has annotations, and only one set of annotations shows for the score and its parts
{
  const obj = scoreWith([attachedGroup(sel(1, 2, 1), [{ text: 'Solo' }])]);
  partWith(obj, 1, [attachedGroup(sel(0, 2, 1), [{ text: 'Solo (edited in the part)' }, { text: 'second line' }])]);
  const score = load(obj);
  check('C8b only the score\'s annotation exists', sameJson(texts(annotationsAt(score, 1, 2, 1)), ['Solo']) &&
    totalAnnotations(score) === 1, JSON.stringify(texts(annotationsAt(score, 1, 2, 1))));
  check('C8b the whole part group was discarded', partAttachedCount(score) === 0 &&
    score.staves[1].partInfo.textGroups.length === 0);
}

// C12c: part text pointing at a note that already has annotations is discarded, not appended
{
  const seed = [{ staff: 1, measure: 1, tick: 2, text: 'mine', verse: 0 }];
  const obj = baseWithAnnotations(seed);
  partWith(obj, 1, [attachedGroup(sel(0, 1, 2), [{ text: 'from the part' }])]);
  const score = load(obj);
  check('C12c existing annotation kept, part text discarded', sameJson(texts(annotationsAt(score, 1, 1, 2)), ['mine']) &&
    partAttachedCount(score) === 0, JSON.stringify(texts(annotationsAt(score, 1, 1, 2))));
}

// C15: a single-staff score reuses the part's text list as the score list, so both hold the text
{
  const obj = makeBaseScore();
  obj.staves = [obj.staves[0]];
  obj.textGroups = [];
  partWith(obj, 0, [attachedGroup(sel(0, 0, 2), [{ text: 'Only' }])]);
  const score = load(obj);
  check('C15 single-staff score gets exactly one annotation', sameJson(texts(annotationsAt(score, 0, 0, 2)), ['Only']) &&
    totalAnnotations(score) === 1, JSON.stringify(texts(annotationsAt(score, 0, 0, 2))));
  check('C15 no attached groups remain', attachedCount(score) === 0 && partAttachedCount(score) === 0);
}

// C14b: idempotent with part text present
{
  const obj = scoreWith([attachedGroup(sel(1, 2, 1), [{ text: 'Solo' }])]);
  partWith(obj, 1, [attachedGroup(sel(0, 2, 1), [{ text: 'Solo' }])]);
  const first = load(obj);
  const second = reload(first);
  check('C14b reload keeps one annotation and no attached text',
    totalAnnotations(second) === 1 && attachedCount(second) === 0 && partAttachedCount(second) === 0);
}

// --- Offsets (contract C18): the group's x/y offset is kept on each annotation ---

// C18: X is copied; Y is negated because annotation Y is up-positive and the group's Y is down-positive
{
  const score = load(scoreWith([attachedGroup(sel(0, 1, 0),
    [{ text: 'moved' }, { text: 'also moved' }], { musicXOffset: 25, musicYOffset: 40 })]));
  const annotations = annotationsAt(score, 0, 1, 0);
  check('C18 every block gets the group X offset', annotations.length === 2 &&
    annotations.every((aa) => aa.translateX === 25), JSON.stringify(annotations.map((aa) => aa.translateX)));
  check('C18 every block gets the group Y offset, direction preserved', annotations.length === 2 &&
    annotations.every((aa) => aa.translateY === -40), JSON.stringify(annotations.map((aa) => aa.translateY)));
  const negative = load(scoreWith([attachedGroup(sel(0, 1, 1), [{ text: 'up left' }],
    { musicXOffset: -12, musicYOffset: -30 })]));
  const nn = annotationsAt(negative, 0, 1, 1)[0];
  check('C18 negative offsets convert too', nn?.translateX === -12 && nn?.translateY === 30,
    JSON.stringify([nn?.translateX, nn?.translateY]));
  const plain = load(scoreWith([attachedGroup(sel(0, 1, 2), [{ text: 'no offset' }])]));
  const pp = annotationsAt(plain, 0, 1, 2)[0];
  check('C18 a group with no offset gives offsets of 0', pp?.translateX === 0 && pp?.translateY === 0 &&
    !Object.is(pp?.translateY, -0), JSON.stringify([pp?.translateX, pp?.translateY]));
  const again = reload(score);
  const rr = annotationsAt(again, 0, 1, 0);
  check('C18 offsets survive save and reload', rr.length === 2 && rr[0].translateX === 25 && rr[0].translateY === -40,
    JSON.stringify(rr.map((aa) => [aa.translateX, aa.translateY])));
}

// C18b: part text carries its offsets too when it is the one that creates the annotation
{
  const score = load(partWith(makeBaseScore(), 1, [attachedGroup(sel(0, 0, 3), [{ text: 'part only' }],
    { musicXOffset: 8, musicYOffset: 16 })]));
  const aa = annotationsAt(score, 1, 0, 3)[0];
  check('C18b part text offsets carried', aa?.translateX === 8 && aa?.translateY === -16,
    JSON.stringify([aa?.translateX, aa?.translateY]));
}

if (failures > 0) {
  console.log(`${failures} check(s) failed`);
  process.exitCode = 1;
} else {
  console.log('all checks passed');
}
