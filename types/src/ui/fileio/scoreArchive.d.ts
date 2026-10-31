import { SmoScore } from '../../smo/data/score';
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
export declare class SmoScoreArchive {
    /** The name of the score document inside an archive */
    static readonly scoreEntryName: string;
    private static toBytes;
    /**
     * @param data file contents
     * @returns true if the data starts with the zip signature (a text string never does)
     */
    static isZip(data: SmoScoreFileData): boolean;
    /**
     * Save the whole score as an archive.  The score document is not abbreviated; compression
     * does a better job than the dictionary did.
     * @param score the score to save
     * @returns the bytes of a `.smz` file
     */
    static pack(score: SmoScore): Promise<Uint8Array>;
    private static stripBom;
    /**
     * Get the score document text from the contents of a score file.
     * @param data the contents of a `.smz` or `.json` file
     * @returns the JSON text of the score, which `SmoScore.deserialize` reads
     * @throws Error with a message that can be shown to the user
     */
    static unpack(data: SmoScoreFileData): Promise<string>;
    /**
     * Read a score from the contents of a score file.
     * @param data the contents of a `.smz` or `.json` file
     * @throws Error with a message that can be shown to the user
     */
    static load(data: SmoScoreFileData): Promise<SmoScore>;
}
