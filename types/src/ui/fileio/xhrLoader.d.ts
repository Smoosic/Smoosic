/**
 * Load a file.  Guess based on the extension whether the file is string or binary
 * @category SuiFile
 */
export declare class SuiXhrLoader {
    compressed: boolean;
    value: any;
    path: string;
    binary: boolean;
    isMidi: boolean;
    constructor(path: string);
    _uncompress(result: any): Promise<string>;
    /**
     *
     * @returns promise resolved when the target file is loaded
     */
    loadAsync(): Promise<string | ArrayBuffer>;
    /**
     * Load a score file, either a compressed '.smz' archive or a '.json' file in the abbreviated or full
     * form.  The kind of file is recognized from its contents, not the name.
     * @returns promise resolved with the JSON text of the score, which `SmoScore.deserialize` reads
     * @throws Error with a message that can be shown to the user
     */
    loadScoreAsync(): Promise<string>;
}
