/**
 * Classes to support a {@link SmoSystemStaff}, which is a container for measures and
 * staff modifiers.
 * @module /smo/data/systemStaff
 * **/
import { SmoObjectParams, SmoAttrs, Pitch, ElementLike } from './common';
import { SmoMeasure, SmoMeasureParamsSer } from './measure';
import { SmoRehearsalMarkParams, SmoTempoParams, SmoVolta } from './measureModifiers';
import { SmoInstrumentParams, StaffModifierBase, SmoInstrument, SmoInstrumentMeasure, SmoTie, SmoStaffTextBracket, SmoStaffTextBracketParamsSer, StaffModifierBaseSer, SmoTabStave, SmoStaffHairpin } from './staffModifiers';
import { SmoPartInfo, SmoPartInfoParamsSer } from './partInfo';
import { SmoSelector } from '../xform/selections';
import { FontInfo } from '../../common/vex';
/**
 * indicate that we need to serialize the key signature, etc.
 * maps beause we are going to be deserializing again in a different score
 * @category SmoObject
 */
export interface SmoStaffSerializationOptions {
    skipMaps: boolean;
    preserveIds: boolean;
    transposeInstruments: boolean;
}
/**
 * Constructor parameters for {@link SmoSystemStaff}.
 * Usually you will call
 * {@link SmoSystemStaff.defaults}, and modify the parameters you need to change,
 * or get the defaults from an existing staff
 * @param renumberingMap For alternate number, pickups, etc.
 * @param keySignatureMap map of keys to measures
 * @param measureInstrumentMap map of instruments to staves
 * @param measures array of {@link SmoMeasure}
 * @param modifiers slurs and such
 * @param partInfo
 * @category SmoObject
 */
export interface SmoSystemStaffParams {
    staffId: number;
    /**
     *   For alternate number, pickups, etc.
     * */
    renumberingMap: Record<number, number>;
    /**
     * map of keys to measures
     */
    keySignatureMap: Record<number, string>;
    measureInstrumentMap: Record<number, SmoInstrumentParams>;
    /**
     * array of {@link SmoMeasure})
     */
    measures: SmoMeasure[];
    /**
     * modifiers slurs and such
     * */
    modifiers: StaffModifierBase[];
    /**
     * information about the part
     */
    partInfo?: SmoPartInfo;
    /**
     * text lines
     */
    textBrackets?: SmoStaffTextBracket[];
    /**
     *guitar tablature
     */
    tabStaves: SmoTabStave[];
}
/**
 * Serialized components of a stave
 * @category serialization
 */
export interface SmoSystemStaffParamsSer {
    /**
     * class name
     */
    ctor: string;
    /**
     * index of the staff
     */
    staffId: number;
    /**
     * map of measure numbers vs. indices of measures
     */
    renumberingMap?: Record<number, number>;
    /**
     * locations of key signature changes
     */
    keySignatureMap?: Record<number, string>;
    /**
     * map of measures to instruments (clef, transpose, sounds)
     */
    measureInstrumentMap: Record<number, SmoInstrumentParams>;
    /**
     * measure container
     */
    measures: SmoMeasureParamsSer[];
    /**
     * array of modifiers like slurs
     */
    modifiers: StaffModifierBaseSer[];
    /**
     * Associated part information for this stave
     */
    partInfo: SmoPartInfoParamsSer;
    /**
     * text brackets are another kind of modifier
     */
    textBrackets: SmoStaffTextBracketParamsSer[];
    /**
     * guitar tablature
     */
    tabStaves: SmoTabStave[];
}
/**
 * A staff is a line of music that can span multiple measures.
 * A system is a line of music for each staff in the score.  So a staff
 * spans multiple systems.
 * A staff modifier connects 2 points in the staff.
 * @category SmoObject
 * */
export declare class SmoSystemStaff implements SmoObjectParams {
    /**
     * Gets the instrument assigned to a given measure
     * @param measureInstrumentMap
     * @param measureIndex
     * @returns
     */
    static getStaffInstrument(measureInstrumentMap: Record<number, SmoInstrument>, measureIndex: number): SmoInstrument;
    static getStaffInstrumentArray(measureInstrumentMap: Record<number, SmoInstrumentParams>): SmoInstrumentMeasure[];
    staffId: number;
    renumberingMap: Record<number, number>;
    keySignatureMap: Record<number, string>;
    partInfo: SmoPartInfo;
    measureInstrumentMap: Record<number, SmoInstrument>;
    measures: SmoMeasure[];
    modifiers: StaffModifierBase[];
    textBrackets: SmoStaffTextBracket[];
    bracketMap: Record<number, ElementLike[]>;
    tabStaves: SmoTabStave[];
    attrs: SmoAttrs;
    ctor: string;
    _mappedStaffId: number;
    static get defaults(): SmoSystemStaffParams;
    setMappedStaffId(value: number): void;
    getMappedStaffId(): number;
    constructor(params: SmoSystemStaffParams);
    /**
     * records need to be serialized separately from other elements in parameters
     *
     * @static
     * @type {string[]}
     * @memberof SmoSystemStaff
     */
    static serializableElements: string[];
    static recordElements: string[];
    static get defaultParameters(): string[];
    get renderableModifiers(): StaffModifierBase[];
    serialize(options: SmoStaffSerializationOptions): SmoSystemStaffParamsSer;
    static deserialize(jsonObj: SmoSystemStaffParamsSer, transposeInstruments: boolean): SmoSystemStaff;
    /**
     * We have created a score with staff mappings.  Update the selectors in staff modifiers so that
     * 'from' in the staff slot is 'to'
     */
    mapStaffFromTo(from: number, to: number): void;
    updateMeasureFormatsForPart(): void;
    /**
     * Get the active instrument at the given measure
     * @param measureIndex
     * @returns
     */
    getStaffInstrument(measureIndex: number): SmoInstrument;
    getInstrumentList(): SmoInstrument[];
    consolidateInstruments(): void;
    updateInstrumentOffsets(): void;
    isRest(index: number): boolean;
    /**
     * for the purposes of breaking up multimeasure rests, isRepeat is true if
     * the next bar has a start repeat, or the current bar has an end repeat.
     * @param index
     * @returns
     */
    isRepeat(index: number): boolean;
    isRepeatSymbol(index: number): boolean;
    isRehearsal(index: number): boolean;
    hasNonRestNotes(): boolean;
    hasInstrument(): boolean;
    findSimlarOverlap(modifier: StaffModifierBase): StaffModifierBase[];
    removeTabStaves(delList: SmoTabStave[]): void;
    updateTabStave(ts: SmoTabStave): void;
    get maxVoiceCount(): number;
    /**
     * Get all the pitches that start ties to the next measure, so that their
     * accidentals may be preserved
     * @param selector
     * @returns
     */
    getTiedPitchesForNextMeasure(measureIndex: number): Pitch[];
    getTabStaveForMeasure(selector: SmoSelector): SmoTabStave | undefined;
    getTabStavesForMeasureRow(measures: SmoMeasure[]): SmoTabStave[];
    addStaffModifier(modifier: StaffModifierBase): void;
    removeStaffModifier(modifier: StaffModifierBase): void;
    getVoltaMap(startIndex: number, endIndex: number): SmoVolta[];
    getVoltasForMeasure(ix: number): SmoVolta[];
    getModifiersAt(selector: SmoSelector): StaffModifierBase[];
    getModifier(modData: any): StaffModifierBase | undefined;
    setLyricFont(fontInfo: FontInfo): void;
    setLyricAdjustWidth(adjustNoteWidth: boolean): void;
    setChordFont(fontInfo: FontInfo): void;
    setChordAdjustWidth(adjustNoteWidth: boolean): void;
    addTextBracket(bracketParams: SmoStaffTextBracket): void;
    removeTextBracket(bracketParams: SmoStaffTextBracket): void;
    getTextBracketsStartingAt(selector: SmoSelector): SmoStaffTextBracket[];
    getSlursStartingAt(selector: SmoSelector): StaffModifierBase[];
    getSlursEndingAt(selector: SmoSelector): StaffModifierBase[];
    getTiesStartingAt(selector: SmoSelector): SmoTie[];
    getTiesEndingAt(selector: SmoSelector): StaffModifierBase[];
    getHairpinsStartingAt(selector: SmoSelector): SmoStaffHairpin[];
    getPedalMarkingsContaining(selector: SmoSelector): StaffModifierBase[];
    getModifiers(): StaffModifierBase[];
    applyBeams(): void;
    addRehearsalMark(index: number, parameters: SmoRehearsalMarkParams): void;
    removeTempo(index: number): void;
    addTempo(tempo: SmoTempoParams, index: number): void;
    removeRehearsalMark(index: number): void;
    /**
     * Sync the staff modifier indices between the full score and the score view, which may
     * have fewer staves
     * @param measureIndex
     * @param ostaff
     */
    syncStaffModifiers(measureIndex: number, ostaff: SmoSystemStaff): void;
    deleteMeasure(index: number): void;
    addKeySignature(measureIndex: number, key: string): void;
    _updateKeySignatures(): void;
    numberMeasures(): void;
    addDefaultMeasure(index: number, params: SmoMeasure): void;
    addMeasure(index: number, measure: SmoMeasure): void;
}
