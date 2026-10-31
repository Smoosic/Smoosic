/**
 * @category SuiFile
 */
export declare class SuiFileInput {
    compressed: boolean;
    binary: boolean;
    value: any;
    event: any;
    /**
     * @param evt the change event of a file input
     * @param scoresAsBytes if true, read '.json' as well as '.smz' as bytes, so a score file can be
     * recognized by its contents rather than its name.  By default, only '.smz' (which is a zip, and
     * can't be read as text) is read as bytes.
     */
    constructor(evt: any, scoresAsBytes?: boolean);
    _handleZip(): Promise<void>;
    loadAsync(): Promise<void>;
}
