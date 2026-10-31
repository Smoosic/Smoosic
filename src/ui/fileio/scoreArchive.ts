// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoScore } from '../../smo/data/score';

declare var JSZip: any;

/**
 * Bytes or text from a score file.
 * @category SuiFile
 */
export type SmoScoreFileData = ArrayBuffer | Uint8Array | string;

/**
 * Reads and writes score files.  A `.smz` (Smoosic zipped) file is a zip archive holding one
 * `score.json` entry, which is the complete score document.  Older `.json` files (the abbreviated
 * form, or the full 'validation' form) are plain text.  Files are recognized by their contents,
 * not their names, so a renamed file still loads.
 * @category SuiFile
 */
export class SmoScoreArchive {
  /** The name of the score document inside an archive */
  static readonly scoreEntryName: string = 'score.json';

  private static toBytes(data: ArrayBuffer | Uint8Array): Uint8Array {
    return data instanceof Uint8Array ? data : new Uint8Array(data);
  }

  /**
   * @param data file contents
   * @returns true if the data starts with the zip signature (a text string never does)
   */
  static isZip(data: SmoScoreFileData): boolean {
    if (typeof (data) === 'string') {
      return false;
    }
    const bytes = SmoScoreArchive.toBytes(data);
    return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  }

  /**
   * Save the whole score as an archive.  The score document is not abbreviated; compression
   * does a better job than the dictionary did.
   * @param score the score to save
   * @returns the bytes of a `.smz` file
   */
  static async pack(score: SmoScore): Promise<Uint8Array> {
    const json = score.serialize({ skipStaves: false, useDictionary: false, preserveStaffIds: false });
    const zip = new JSZip();
    zip.file(SmoScoreArchive.scoreEntryName, JSON.stringify(json),
      { compression: 'DEFLATE', compressionOptions: { level: 9 } });
    return await zip.generateAsync({ type: 'uint8array' });
  }

  private static stripBom(text: string): string {
    return text.length > 0 && text.charCodeAt(0) === 0xfeff ? text.substring(1) : text;
  }

  /**
   * Get the score document text from the contents of a score file.
   * @param data the contents of a `.smz` or `.json` file
   * @returns the JSON text of the score, which `SmoScore.deserialize` reads
   * @throws Error with a message that can be shown to the user
   */
  static async unpack(data: SmoScoreFileData): Promise<string> {
    if (typeof (data) === 'string') {
      return SmoScoreArchive.stripBom(data);
    }
    const bytes = SmoScoreArchive.toBytes(data);
    if (bytes.length === 0) {
      throw new Error('The file is empty.');
    }
    if (!SmoScoreArchive.isZip(bytes)) {
      return SmoScoreArchive.stripBom(new TextDecoder('utf-8').decode(bytes));
    }
    let zip: any;
    try {
      zip = await JSZip.loadAsync(bytes);
    } catch (e) {
      throw new Error('The file is a damaged archive and could not be read.');
    }
    const names: string[] = Object.keys(zip.files).filter((name) => !zip.files[name].dir);
    const entry = names.find((name) => name === SmoScoreArchive.scoreEntryName)
      ?? names.find((name) => name.toLowerCase().endsWith('.json'));
    if (!entry) {
      throw new Error('The archive does not contain a score.');
    }
    try {
      return SmoScoreArchive.stripBom(await zip.file(entry).async('string'));
    } catch (e) {
      throw new Error('The file is a damaged archive and could not be read.');
    }
  }

  /**
   * Read a score from the contents of a score file.
   * @param data the contents of a `.smz` or `.json` file
   * @throws Error with a message that can be shown to the user
   */
  static async load(data: SmoScoreFileData): Promise<SmoScore> {
    const text = await SmoScoreArchive.unpack(data);
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new Error('The file is not a Smoosic score.');
    }
    // The abbreviated form shortens the key names, so look for its dictionary as well as the staves.
    const isScore = json !== null && typeof (json) === 'object' &&
      (Array.isArray(json.staves) || (typeof (json.dictionary) === 'object' && json.dictionary !== null));
    if (!isScore) {
      throw new Error('The file is not a Smoosic score.');
    }
    try {
      return SmoScore.deserialize(text);
    } catch (e) {
      throw new Error('The score in the file could not be read.');
    }
  }
}
