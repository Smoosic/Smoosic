import { SvgDimensions } from './common';
import { SmoMeasure, SmoMeasureParams, ColumnMappedParams } from './measure';
import { SmoNoteModifierBase } from './noteModifiers';
import { SmoTempo, SmoMeasureModifierBase, SmoTimeSignature, SmoMeasureFormatParamsSer } from './measureModifiers';
import { StaffModifierBase, SmoInstrument } from './staffModifiers';
import { SmoSystemGroup, SmoSystemGroupParamsSer, SmoScoreModifierBase, SmoFormattingManager, SmoAudioPlayerSettings, SmoAudioPlayerParameters, SmoLayoutManagerParamsSer, SmoLayoutManager, FontPurpose, SmoScoreInfo, ScoreMetadataSer, SmoScorePreferences } from './scoreModifiers';
import { SmoTextGroup, SmoTextGroupParamsSer } from './scoreText';
import { SmoSystemStaff, SmoSystemStaffParams, SmoSystemStaffParamsSer } from './systemStaff';
import { SmoSelector, SmoSelection } from '../xform/selections';
import { FontInfo } from '../../common/vex';
/**
 * List of engraving fonts available in Smoosic
 */
export type engravingFontType = 'Bravura' | 'Gonville' | 'Petaluma' | 'Leland';
/**
 * Arrary of engraving fonts available in Smoosic
 */
export declare const engravingFontTypes: engravingFontType[];
export declare function isEngravingFont(et: engravingFontType | string): et is engravingFontType;
/**
 * Constructor parameters.  Usually you will call
 * {@link SmoScore.defaults}, and modify the parameters you need to change.
 * A new score with the defaults will create a single, empty measure.
 * @category SmoObject
 */
export interface SmoScoreParams {
    /**
     * global font defaults for this score
     */
    fonts: FontPurpose[];
    /**
     * identifying information about the score
     */
    scoreInfo: SmoScoreInfo;
    /**
     * customized editor behavior
     */
    preferences: SmoScorePreferences;
    /**
     * contained {@link SmoSystemStaffParams} objects
     */
    staves: SmoSystemStaffParams[];
    activeStaff?: number;
    /**
     * score text, not part of specific music
     */
    textGroups: SmoTextGroup[];
    /**
     * System groups for formatting/justification
     */
    systemGroups: SmoSystemGroup[];
    /**
     * future: global audio settings
     */
    audioSettings: SmoAudioPlayerParameters;
    /**
     * layout manager, for svg and div geometry, page sizes, header sizes etc.
     */
    layoutManager?: SmoLayoutManager;
    /**
     * measure-specific formatting
     */
    formattingManager?: SmoFormattingManager;
}
/**
 * Serialization structure for the entire score.  Score is deserialized from this
 * @category serialization
 */
export interface SmoScoreParamsSer {
    /**
     * some information about the score, mostly non-musical
     */
    metadata: ScoreMetadataSer;
    /**
     * contained {@link SmoSystemStaffParams} objects
     */
    staves: SmoSystemStaffParamsSer[];
    /**
     * score text, not part of specific music
     */
    textGroups: SmoTextGroupParamsSer[];
    /**
     * System groups for formatting/justification
     */
    systemGroups: SmoSystemGroupParamsSer[];
    /**
     * future: global audio settings
     */
    audioSettings: SmoAudioPlayerParameters;
    /**
     * layout manager, for svg and div geometry, page sizes, header sizes etc.
     */
    layoutManager?: SmoLayoutManagerParamsSer;
    /**
     * map of measure formats to measure
     */
    measureFormats: SmoMeasureFormatParamsSer[];
    /**
     * tempo, key and other column-mapped parameters
     */
    columnAttributeMap: ColumnParamsMapType;
    /**
     * dictionary compression for serialization
     */
    dictionary: Record<string, string>;
}
/**
 * @category SmoObject
 */
export interface SmoScoreSerializeOptions {
    skipStaves: boolean;
    useDictionary: boolean;
    preserveStaffIds: boolean;
}
export declare function isEmptyTextBlock(params: Partial<SmoTextGroupParamsSer>): params is SmoTextGroupParamsSer;
/**
 * @category SmoObject
 */
export interface ColumnParamsMapType {
    keySignature: Record<number, string>;
    tempo: Record<number, SmoTempo>;
    timeSignature: Record<number, SmoTimeSignature>;
    renumberingMap: Record<number, number>;
}
export declare function isSmoScoreParemsSer(params: Partial<SmoScoreParamsSer>): params is SmoScoreParamsSer;
/**
 * Union of modifier types Smo modifier types
 */
export type SmoModifier = SmoNoteModifierBase | SmoMeasureModifierBase | StaffModifierBase | SmoScoreModifierBase;
/**
 * Score is a container of staves, and metadata about the score.  Serializing the score serializes the
 * child object.  It is the highest-level object in Smoosic.
 * @category SmoObject
 */
export declare class SmoScore {
    /**
     * Default fonts in this score, for each type of text (lyrics, etc)
     *
     * @type {FontPurpose[]}
     * @memberof SmoScore
     */
    fonts: FontPurpose[];
    /**
     * General info about the score, used for export and library
     *
     * @type {SmoScoreInfo}
     * @memberof SmoScore
     */
    scoreInfo: SmoScoreInfo;
    /**
     * Default behavior for this score.  Indicates some global behavior like whether to advance the cursor.
     *
     * @type {SmoScorePreferences}
     * @memberof SmoScore
     */
    preferences: SmoScorePreferences;
    /**
     * The staves that make up the music of the score
     *
     * @type {SmoSystemStaff[]}
     * @memberof SmoScore
     */
    staves: SmoSystemStaff[];
    /**
     * The active staff, used for some types of selections.  Not serialized.
     *
     * @type {number}
     * @memberof SmoScore
     */
    activeStaff: number;
    /**
     * Text associated with the score, but not a specific musical element (e.g. lyrics are contains by notes)
     *
     * @type {SmoTextGroup[]}
     * @memberof SmoScore
     */
    textGroups: SmoTextGroup[];
    /**
     * A logical grouping of staves for justification
     *
     * @type {SmoSystemGroup[]}
     * @memberof SmoScore
     */
    systemGroups: SmoSystemGroup[];
    /**
     * some audio player defaults
     *
     * @type {SmoAudioPlayerSettings}
     * @memberof SmoScore
     */
    audioSettings: SmoAudioPlayerSettings;
    /**
     * Preserve a map of measures to their actual measure numbers
     *
     * @type {Record<number, number>}
     * @memberof SmoScore
     */
    renumberingMap: Record<number, number>;
    /**
     * page and rendering layout of the score, including the ppi and scaling of the pages.
     *
     * @type {SmoLayoutManager}
     * @memberof SmoScore
     */
    layoutManager?: SmoLayoutManager;
    /**
     * per-measure formatting customizations.
     *
     * @type {SmoFormattingManager}
     * @memberof SmoScore
     */
    formattingManager?: SmoFormattingManager;
    constructor(params: SmoScoreParams);
    static get engravingFonts(): Record<string, string>;
    static get fontPurposes(): Record<string, number>;
    static get scoreInfoDefaults(): SmoScoreInfo;
    static get scoreMetadataDefaults(): ScoreMetadataSer;
    static get defaults(): SmoScoreParams;
    static get pageSizes(): string[];
    static get pageDimensions(): Record<string, SvgDimensions>;
    static pageSizeFromDimensions(width: number, height: number): string | null;
    static get preferences(): string[];
    /**
     * serialize the keySignature, tempo and time signature, which are mapped
     * to a column at a measure index
     * @returns
     */
    serializeColumnMapped(func: (measure: SmoMeasure) => ColumnMappedParams): {
        keySignature: Record<number, string>;
        tempo: Record<number, SmoTempo>;
        timeSignature: Record<number, SmoTimeSignature>;
        renumberingMap: Record<number, number>;
    };
    static fixLegacyColumnMappedCtor(scoreObj: any): void;
    /**
     * Column-mapped attributes stay the same in each measure until
     * changed, like key-signatures.  We don't store each measure value to
     * make the files smaller
     * @param scoreObj - the json blob that contains the score data
     * @returns
     */
    static deserializeColumnMapped(scoreObj: any): void;
    /**
     * Serialize the entire score.
     * @returns JSON object
     */
    serialize(options?: SmoScoreSerializeOptions): SmoScoreParamsSer;
    updateScorePreferences(pref: SmoScorePreferences): void;
    get engravingFont(): engravingFontType;
    set engravingFont(value: engravingFontType);
    static upConvertGlobalLayout(jsonObj: any): void;
    /**
     * Convert legacy score layout to layoutManager object parameters
     * @param jsonObj
     */
    static upConvertLayout(jsonObj: any): void;
    /**
     * Hack: for the case of a score containing only a single part, use the text from the
     * part.
     * @param jsonObj
     * @returns
     */
    static fixTextGroupSinglePart(jsonObj: any): void;
    /**
     * Deserialize an entire score
     * @param jsonString
     * @returns SmoScore
     */
    static deserialize(jsonString: string): SmoScore;
    /**
    * Convert measure formatting from legacy scores, that had the formatting
    * per measure, to the new way that has a separate formatting object.
    * **/
    static measureFormatFromLegacyScore(score: SmoScore, jsonObj: any): SmoFormattingManager | null;
    /**
     * Return a default score with all default setting and one measure of notes
     * @param scoreDefaults
     * @param measureDefaults
     * @returns
     */
    static getDefaultScore(scoreDefaults: SmoScoreParams, measureDefaults: SmoMeasureParams | null): SmoScore;
    /**
     * Return an 'empty' score, with one measure of rests
     * @param scoreDefaults
     * @returns
     */
    static getEmptyScore(scoreDefaults: SmoScoreParams): SmoScore;
    /**
     * We have deleted a measure, update the renumber index to
     * shuffle back.
     * @param indexToDelete
     */
    updateRenumberForAddDelete(indexToDelete: number, toAdd: boolean): void;
    updateRenumberingMap(measureIndex: number, localIndex: number): void;
    /**
     * Iteratively number the staves, like when adding a measure
     */
    numberStaves(): void;
    get measureCount(): number;
    /**
     * determine if the measure at this index could be a multi-measure rest
     * @param measureIndex - the measure index we are considering to add
     * @param start - the measure index would be the start of the rest
     * @returns
     */
    isMultimeasureRest(measureIndex: number, start: boolean, forceRest: boolean): boolean;
    /**
     * Restore measure formats stored when a score is serialized
     */
    updateMeasureFormats(): void;
    /**
     * Add a measure to the score with the supplied parameters at the supplied index.
     * The defaults per staff may be different depending on the clef, key of the staff.
    */
    addDefaultMeasureWithNotes(measureIndex: number, parameters: SmoMeasureParams): void;
    getLocalMeasureIndex(measureIndex: number): number;
    /**
     * delete the measure at the supplied index in all the staves
    */
    deleteMeasure(measureIndex: number): void;
    /**
     * coordinate the ids of the display score with the stored score
     * @param other
     */
    synchronizeTextGroups(other: SmoTextGroup[]): void;
    /**
     * get a measure 'compatible' with the measure at the given index, in terms
     * of key, time signature etc.
     * @param measureIndex
     * @param staffIndex
     * @returns
     */
    getPrototypeMeasure(measureIndex: number, staffIndex: number): SmoMeasure;
    /**
     * Give a measure prototype, create a new measure and add it to each staff, with the
     * correct settings for current time signature/clef.
     * @param measureIndex
     */
    addMeasure(measureIndex: number): void;
    /**
     * Replace the measure at the given location.  Probably due to an undo operation or paste.
     * @param selector
     * @param measure
     */
    replaceMeasure(selector: SmoSelector, measure: SmoMeasure): void;
    getSystemGroupForStaff(selection: SmoSelection): SmoSystemGroup | undefined;
    getSystemGroupForStaffId(staffId: number): SmoSystemGroup | undefined;
    getStavesForGroup(group: SmoSystemGroup): SmoSystemStaff[];
    addOrReplaceSystemGroup(newGroup: SmoSystemGroup): void;
    removeSystemGroup(group: SmoSystemGroup): void;
    clearSystemGroups(): void;
    isPartExposed(): boolean;
    /**
     * Probably due to an undo operation, replace the staff at the given index.
     * @param index
     * @param staff
     */
    replaceStaff(index: number, staff: SmoSystemStaff): void;
    /**
     *
     * @param measureIndex
     * @param key
     */
    addKeySignature(measureIndex: number, key: string): void;
    /**
     * If the part is a transposing part, remove the transposition from the notes/staff.  This logic
     * assumes the measures previously had transposeIndex set up by the instrument map.
     */
    setTransposing(): void;
    /**
     * If the score is switching from transposing to non-transposing, update the index
     * and pitches.  This logic assumes we are changing from transposing to non-transposing.
     */
    setNonTransposing(): void;
    setNoteInstrumentProperties(): void;
    addStaff(parameters: SmoSystemStaffParams): SmoSystemStaff;
    updateCompoundTimeSignature(): void;
    /**
     * delete any system groups that apply to deleted staves
     */
    updateSystemGroups(): void;
    removeStaff(index: number): void;
    getStaffInstrument(selector: SmoSelector): SmoInstrument;
    swapStaves(index1: number, index2: number): void;
    updateTextGroup(textGroup: SmoTextGroup, toAdd: boolean): void;
    addTextGroup(textGroup: SmoTextGroup): void;
    getTextGroups(): SmoTextGroup[];
    scaleTextGroups(scale: number): void;
    removeTextGroup(textGroup: SmoTextGroup): void;
    setLyricAdjustWidth(adjustNoteWidth: boolean): void;
    setChordAdjustWidth(adjustNoteWidth: boolean): void;
    setLyricFont(fontInfo: FontInfo): void;
    setChordFont(fontInfo: FontInfo): void;
    get measures(): SmoMeasure[];
    incrementActiveStaff(offset: number): number;
    setActiveStaff(index: number): void;
}
