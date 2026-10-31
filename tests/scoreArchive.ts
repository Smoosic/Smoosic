/**
 * Headless checks for score files: SmoScoreArchive (.smz), reading legacy abbreviated and validation
 * .json, failure cases, the serialize option fix and the save-format rule.  See specs/034-smz-compressed-scores/.
 *
 * Run with: npm run test:score-archive
 */
import * as fs from 'fs';
import { SmoScore } from '../src/smo/data/score';
import { SmoLyric, noteModifierDynamicCtorInit } from '../src/smo/data/noteModifiers';
import { measureModifierDynamicCtorInit } from '../src/smo/data/measureModifiers';
import { staffModifierDynamicCtorInit } from '../src/smo/data/staffModifiers';
import { scoreModifierDynamicCtorInit } from '../src/smo/data/scoreModifiers';
import { SmoScoreArchive } from '../src/ui/fileio/scoreArchive';
import { isFullSaveFormat } from '../src/render/sui/scoreChangeState';

// The smo layer registers its deserialization factories at app start; do the same here
// without pulling in any UI.
noteModifierDynamicCtorInit();
measureModifierDynamicCtorInit();
staffModifierDynamicCtorInit();
scoreModifierDynamicCtorInit();
// In the application JSZip is a global from a script tag.
(global as any).JSZip = require('../src/common/jszip.js');
const JSZip = (global as any).JSZip;

let failures = 0;
const check = (name: string, condition: boolean, detail?: string) => {
  if (condition) {
    console.log(`PASS ${name}`);
  } else {
    failures += 1;
    console.log(`FAIL ${name}${detail ? ' -- ' + detail : ''}`);
  }
};
const fullOptions = { skipStaves: false, useDictionary: false, preserveStaffIds: false };
/** A copy of the bytes as a standalone ArrayBuffer, which is what a file reader gives */
const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
/** The complete score document as text, exactly as it is written to a file */
const rawText = (score: SmoScore) => JSON.stringify(score.serialize(fullOptions));
/**
 * Ids like 'smo1234' (tuplets, for example) come from a counter that moves on every load, so two loads of
 * the same file never match exactly.  Number the ids in order of appearance so documents can be compared.
 */
const canonicalIds = (text: string) => {
  const seen: Record<string, string> = {};
  return text.replace(/smo\d+/g, (id) => {
    if (!seen[id]) {
      seen[id] = 'id' + Object.keys(seen).length;
    }
    return seen[id];
  });
};
/** The complete score document with ids canonicalized; two scores with the same text are the same score */
const fullText = (score: SmoScore) => canonicalIds(rawText(score));
/**
 * What the existing plain-json path makes of a score: save the full document and read it back.  A score
 * is normalized by its first save and load (for example an unset instrument selector of -1 becomes 0), so a
 * file must give the same result as this, which is stable from then on.
 */
const viaPlainJson = (score: SmoScore) => fullText(SmoScore.deserialize(rawText(score)));
const failsWith = async (data: any, pattern: RegExp): Promise<boolean> => {
  try {
    await SmoScoreArchive.load(data);
  } catch (e: any) {
    return pattern.test(e.message);
  }
  return false;
};

const unicodeTitle = 'Café — Ünïcode 日本語 ♯♭';
/** A score with enough content to compress and some text that is not plain ASCII */
const buildScore = (): SmoScore => {
  const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
  while (score.staves[0].measures.length < 24) {
    score.addMeasure(score.staves[0].measures.length - 1);
  }
  score.staves[0].measures.forEach((measure, m) => {
    measure.voices[0].notes.forEach((note, tick) => {
      note.noteType = 'n';
      note.pitches = [{ letter: ['c', 'd', 'e', 'f', 'g', 'a', 'b'][(m + tick) % 7] as any, accidental: 'n', octave: 4 }];
    });
  });
  score.scoreInfo.name = unicodeTitle;
  const lyric = new SmoLyric({ ...SmoLyric.defaults, text: 'Glöria — 愛', verse: 0 } as any);
  score.staves[0].measures[0].voices[0].notes[0].addLyric(lyric);
  return score;
};

const main = async () => {
  const score = buildScore();
  const reference = viaPlainJson(score);

  // ---- Foundation: serialize option, zip detection, archive layout ----
  {
    const noDictionary = score.serialize({ skipStaves: true, useDictionary: false, preserveStaffIds: false });
    check('serialize honors useDictionary:false even when skipStaves is true', !('dictionary' in noDictionary));
    check('serialize with no options still abbreviates', 'dictionary' in score.serialize());
    check('serialize with useDictionary:false is the full form', !('dictionary' in score.serialize(fullOptions)));

    const bytes = await SmoScoreArchive.pack(score);
    check('pack returns bytes', bytes instanceof Uint8Array && bytes.length > 0);
    check('pack output starts with the zip signature', bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 3 && bytes[3] === 4);
    check('isZip is true for the archive as bytes and as an ArrayBuffer',
      SmoScoreArchive.isZip(bytes) && SmoScoreArchive.isZip(toArrayBuffer(bytes)));
    check('isZip is false for text and for plain bytes', !SmoScoreArchive.isZip('PK\u0003\u0004') &&
      !SmoScoreArchive.isZip(new TextEncoder().encode('{"a":1}')) && !SmoScoreArchive.isZip(new Uint8Array(0)));
    const zip = await JSZip.loadAsync(bytes);
    const names = Object.keys(zip.files);
    check('archive has exactly one entry, score.json', names.length === 1 && names[0] === 'score.json', names.join(','));
    const inner = await zip.file('score.json').async('string');
    check('archive entry is the full document, not abbreviated', inner === rawText(score) && inner.indexOf('"dictionary"') < 0);
  }

  // ---- US1: save as .smz ----
  {
    const bytes = await SmoScoreArchive.pack(score);
    const loaded = await SmoScoreArchive.load(bytes);
    check('round trip: load(pack(score)) is the same score as the plain json path gives', fullText(loaded) === reference);
    check('round trip keeps non-Latin text in the title', loaded.scoreInfo.name === unicodeTitle, loaded.scoreInfo.name);
    check('round trip keeps non-Latin text in a lyric',
      loaded.staves[0].measures[0].voices[0].notes[0].getTrueLyrics()[0]?.text === 'Glöria — 愛');
    const again = await SmoScoreArchive.pack(loaded);
    check('saving a loaded score again gives the same document', fullText(await SmoScoreArchive.load(again)) === reference);
    check('a second save does not change the document inside', canonicalIds(await (await JSZip.loadAsync(again)).file('score.json').async('string')) === reference);

    const libraryPath = 'release/library/pennylane2 (6).json';
    const libraryText = fs.readFileSync(libraryPath, 'utf-8');
    const library = SmoScore.deserialize(libraryText);
    const packed = await SmoScoreArchive.pack(library);
    const abbreviatedSize = JSON.stringify(library.serialize()).length;
    const fullSize = rawText(library).length;
    console.log(`  sizes for ${libraryPath}: abbreviated text ${abbreviatedSize}, full text ${fullSize}, .smz ${packed.length}`);
    check('.smz is smaller than the abbreviated text file', packed.length < abbreviatedSize);
    check('.smz is at least 50% smaller than the full (validation) text', packed.length <= fullSize / 2);
  }
  check('isFullSaveFormat accepts .smz', isFullSaveFormat('.smz') && isFullSaveFormat(' .SMZ ') && isFullSaveFormat('.json'));
  check('isFullSaveFormat still rejects the lossy formats',
    !isFullSaveFormat('.xml') && !isFullSaveFormat('.mid') && !isFullSaveFormat('.js') && !isFullSaveFormat(''));

  // ---- US2: open .smz or either kind of .json ----
  {
    const libraryText = fs.readFileSync('release/library/pennylane2 (6).json', 'utf-8');
    check('the legacy sample really is the abbreviated form', JSON.parse(libraryText).dictionary !== undefined);
    const legacy = await SmoScoreArchive.load(libraryText);
    const direct = SmoScore.deserialize(libraryText);
    check('legacy abbreviated json loads to the same score as before', fullText(legacy) === fullText(direct));
    const viaArchive = await SmoScoreArchive.load(await SmoScoreArchive.pack(legacy));
    check('legacy score survives conversion to .smz', fullText(viaArchive) === viaPlainJson(direct));

    const legacyBytes = new TextEncoder().encode(libraryText);
    check('legacy json passed as bytes loads', fullText(await SmoScoreArchive.load(legacyBytes)) === fullText(direct));
    const archive = await SmoScoreArchive.pack(score);
    const asArrayBuffer = toArrayBuffer(archive);
    check('archive as ArrayBuffer loads', fullText(await SmoScoreArchive.load(asArrayBuffer)) === reference);
    // The name of the file is never an input: a zip is a zip whatever it was called, and text is text.
    check('a zip is recognized by its contents (not its name)', SmoScoreArchive.isZip(archive));
    check('text is recognized by its contents (not its name)', !SmoScoreArchive.isZip(legacyBytes));

    const bom = '﻿' + rawText(score);
    check('text with a byte-order mark loads', fullText(await SmoScoreArchive.load(bom)) === reference);
    const bomBytes = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode(rawText(score))]);
    check('bytes with a byte-order mark load', fullText(await SmoScoreArchive.load(bomBytes)) === reference);

    // an archive made by another tool: different entry name, extra entries, folders
    const other = new JSZip();
    other.file('notes.txt', 'hello');
    other.folder('stuff');
    other.file('stuff/my score.json', rawText(score));
    const otherBytes = await other.generateAsync({ type: 'uint8array' });
    check('an archive with a differently named json entry loads', fullText(await SmoScoreArchive.load(otherBytes)) === reference);
    const preferred = new JSZip();
    preferred.file('other.json', '{"not":"a score"}');
    preferred.file('score.json', rawText(score));
    check('score.json is preferred when an archive has several json entries',
      fullText(await SmoScoreArchive.load(await preferred.generateAsync({ type: 'uint8array' }))) === reference);
  }

  // ---- US3: validation format ----
  {
    const validation = rawText(score);
    check('validation text has no dictionary and is not a zip',
      validation.indexOf('"dictionary"') < 0 && !SmoScoreArchive.isZip(new TextEncoder().encode(validation)));
    const fromValidation = await SmoScoreArchive.load(validation);
    const fromArchive = await SmoScoreArchive.load(await SmoScoreArchive.pack(score));
    check('the validation file and the .smz open to the same score', fullText(fromValidation) === fullText(fromArchive));
    const zip = await JSZip.loadAsync(await SmoScoreArchive.pack(score));
    check('the validation text is exactly the document inside the .smz', (await zip.file('score.json').async('string')) === validation);
  }

  // ---- US4: failures ----
  {
    const archive = await SmoScoreArchive.pack(score);
    const truncated = archive.slice(0, Math.floor(archive.length / 2));
    check('a truncated archive is refused as damaged', await failsWith(truncated, /damaged/));
    const noScore = new JSZip();
    noScore.file('readme.txt', 'nothing here');
    check('a zip with no score is refused', await failsWith(await noScore.generateAsync({ type: 'uint8array' }), /does not contain a score/));
    check('json that is not a score is refused', await failsWith('{"hello":1}', /not a Smoosic score/));
    check('text that is not json is refused', await failsWith('this is not a score', /not a Smoosic score/));
    check('an empty file is refused', await failsWith(new Uint8Array(0), /empty/));
    const notJsonInZip = new JSZip();
    notJsonInZip.file('score.json', 'garbage');
    check('an archive whose score.json is garbage is refused', await failsWith(await notJsonInZip.generateAsync({ type: 'uint8array' }), /not a Smoosic score/));
    // loading never changes a score the caller holds
    const before = fullText(score);
    await failsWith(truncated, /./);
    check('a failed load leaves other scores untouched', fullText(score) === before);
  }

  if (failures > 0) {
    console.log(`${failures} check(s) failed`);
    process.exitCode = 1;
  } else {
    console.log('all checks passed');
  }
};
main();
