import { SmoBarline, SmoMeasureModifierBase, SmoRepeatSymbol, SmoTempoText, SmoMeasureFormat, SmoVolta, SmoRehearsalMarkParams, SmoTempoTextParams, TimeSignature, TimeSignatureParametersSer, SmoTempoTextParamsSer } from './measureModifiers';
import { SmoNote, NoteType, SmoNoteParamsSer } from './note';
import { SmoTuplet, SmoTupletTreeParamsSer, SmoTupletTree } from './tuplet';
import { TickMap } from '../xform/tickMap';
import { MeasureNumber, SvgBox, SmoAttrs, Pitch, Clef, TickAccidental, AccidentalArray } from './common';
import { FontInfo } from '../../common/vex';
/**
 * Voice is just a container for {@link SmoNote}
 * @category SmoObject
 */
export interface SmoVoice {
    notes: SmoNote[];
}
/**
 * @category SmoObject
 */
export interface SmoVoiceSer {
    notes: SmoNoteParamsSer[];
}
/**
 * TickMappable breaks up a circular dependency on modifiers
 * like @SmoDuration
 * @category SmoObject
 */
export interface TickMappable {
    voices: SmoVoice[];
    keySignature: string;
}
/**
 * @category SmoObject
 */
export interface MeasureTick {
    voiceIndex: number;
    tickIndex: number;
}
/**
 * Break up a circlar dependency with {@link SmoBeamGroup}
 * @category SmoObject
 */
export interface ISmoBeamGroup {
    notes: SmoNote[];
    secondaryBeamBreaks: number[];
    voice: number;
    attrs: SmoAttrs;
}
/**
 * geometry information about the current measure for rendering and
 * score layout.
 * @internal
 */
export interface MeasureSvg {
    staffWidth: number;
    unjustifiedWidth: number;
    adjX: number;
    maxColumnStartX: number;
    staffX: number;
    staffY: number;
    logicalBox: SvgBox;
    yTop: number;
    adjRight: number;
    history: string[];
    lineIndex: number;
    pageIndex: number;
    rowInSystem: number;
    forceClef: boolean;
    forceKeySignature: boolean;
    forceTimeSignature: boolean;
    forceTempo: boolean;
    hideEmptyMeasure: boolean;
    hideMultimeasure: boolean;
    multimeasureLength: number;
    multimeasureEndBarline: number;
    element: SVGSVGElement | null;
    tabStaveBox?: SvgBox;
    tabElement?: SVGSVGElement;
}
/**
 * Interface for a  {@link TickMap} for each voice
 * for formatting
 * @category SmoObject
 */
export interface MeasureTickmaps {
    tickmaps: TickMap[];
    accidentalMap: Record<string | number, Record<string, TickAccidental>>;
    accidentalArray: AccidentalArray[];
}
/**
 * Column-mapped modifiers, managed by the {@link SmoScore}
 * @category SmoObject
 */
export interface ColumnMappedParams {
    timeSignature: any;
    keySignature: string;
    tempo: any;
}
export type SmoMeasureNumberParam = 'transposeIndex' | 'activeVoice' | 'lines' | 'repeatCount';
export declare const SmoMeasureNumberParams: SmoMeasureNumberParam[];
export type SmoMeasureStringParam = 'keySignature';
export declare const SmoMeasureStringParams: SmoMeasureStringParam[];
/**
 * constructor parameters for a {@link SmoMeasure}.  Usually you will call
 * {@link SmoMeasure.defaults}, and modify the parameters you need to change.
 *
 * @param timeSignature
 * @param keySignature
 * @param tuplets
 * @param transposeIndex calculated from {@link SmoPartInfo} for non-concert-key instruments
 * @param lines number of lines in the stave
 * @param staffY Y coordinate (UL corner) of the measure stave
 * @param measureNumber combination configured/calculated measure number
 * @param clef
 * @param voices
 * @param activeVoice the active voice in the editor
 * @param tempo
 * @param format measure format, is managed by the score
 * @param modifiers All measure modifiers that5 aren't format, timeSignature or tempo
 * @category SmoObject
 */
export interface SmoMeasureParams {
    timeSignature: TimeSignature;
    keySignature: string;
    tupletTrees: SmoTupletTree[];
    transposeIndex: number;
    lines: number;
    measureNumber: MeasureNumber;
    clef: Clef;
    voices: SmoVoice[];
    activeVoice: number;
    tempo: SmoTempoText;
    format: SmoMeasureFormat | null;
    modifiers: SmoMeasureModifierBase[];
    repeatSymbol: boolean;
    repeatCount: number;
}
/**
 * The serializeable bits of SmoMeasure.  Some parameters are
 * mapped by the stave if the don't change every measure, e.g.
 * time signature.
 * @category serialization
 */
export interface SmoMeasureParamsSer {
    /**
     * constructor
     */
    ctor: string;
    /**
     * a list of tuplets (serialized)
     */
    tupletTrees: SmoTupletTreeParamsSer[];
    /**
     * transpose the notes up/down.  TODO: this should not be serialized
     * as its part of the instrument parameters
     */
    transposeIndex: number;
    /**
     * lines in the staff (e.g. percussion)
     */
    lines: number;
    /**
     * measure number, absolute and relative/remapped
     */
    measureNumber: MeasureNumber;
    /**
     * start clef
     */
    clef: Clef;
    /**
     * voices contain notes
     */
    voices: SmoVoiceSer[];
    /**
     * all other modifiers (barlines, etc)
     */
    modifiers: SmoMeasureModifierBase[];
    /**
     * key signature
     */
    keySignature?: string;
    /**
    * time signature serialization
    */
    timeSignature?: TimeSignatureParametersSer;
    /**
     * tempo at this point
     */
    tempo: SmoTempoTextParamsSer;
}
/**
 * Data for a measure of music.  Many rules of musical engraving are
 * enforced at a measure level: the duration of notes, accidentals, etc.
 *
 * Measures contain {@link SmoNote}, {@link SmoTuplet}, and {@link SmoBeamGroup}
 * Measures are contained in {@link SmoSystemStaff}
 * @category SmoObject
 */
export declare class SmoMeasure implements SmoMeasureParams, TickMappable {
    static get timeSignatureDefault(): TimeSignature;
    static defaultDupleDuration: number;
    static defaultTripleDuration: number;
    static readonly _defaults: SmoMeasureParams;
    /**
     * Default constructor parameters.  Defaults are always copied so the
     * caller can modify them to create a new measure.
     * @returns constructor params for a new measure
     */
    static get defaults(): SmoMeasureParams;
    static convertLegacyTimeSignature(ts: string): TimeSignature;
    timeSignature: TimeSignature;
    /**
     * Overrides display of actual time signature, in the case of
     * pick-up notes where the actual and displayed durations are different
     */
    keySignature: string;
    canceledKeySignature: string;
    tupletTrees: SmoTupletTree[];
    repeatSymbol: boolean;
    repeatCount: number;
    ctor: string;
    /**
     * Adjust for non-concert pitch intstruments
     */
    transposeIndex: number;
    modifiers: SmoMeasureModifierBase[];
    /**
     * Row, column, and custom numbering information about this measure.
     */
    measureNumber: MeasureNumber;
    clef: Clef;
    voices: SmoVoice[];
    /**
     * the active voice in the editor, if there are multiple voices
     *  */
    activeVoice: number;
    tempo: SmoTempoText;
    beamGroups: ISmoBeamGroup[];
    lines: number;
    /**
     * Runtime information about rendering
     */
    svg: MeasureSvg;
    /**
     * Measure-specific formatting parameters.
     */
    format: SmoMeasureFormat;
    /**
     * Information for identifying this object
     */
    id: string;
    /**
     * Fill in components.  We assume the modifiers are already constructed,
     * e.g. by deserialize or the calling function.
     * @param params
     */
    constructor(params: SmoMeasureParams);
    static get defaultAttributes(): string[];
    static get formattingOptions(): string[];
    static get columnMappedAttributes(): string[];
    static get serializableAttributes(): any;
    /**
    // Return true if the time signatures are the same, for display purposes (e.g. if a time sig change
    // is required)
    */
    static timeSigEqual(o1: TimeSignature, o2: TimeSignature): boolean;
    /**
     * If there is a clef change mid-measure, update the actual clefs of the notes
     * so they display correctly.
     */
    updateClefChangeNotes(): void;
    /**
     * @internal
     * @returns column mapped parameters, serialized.  caller will
     * decide if the parameters need to be persisted
     */
    serializeColumnMapped(): ColumnMappedParams;
    getColumnMapped(): ColumnMappedParams;
    /**
     * Convert this measure object to a JSON object, recursively serializing all the notes,
     * note modifiers, etc.
     */
    serialize(): SmoMeasureParamsSer;
    /**
     * Due to a bug, some tuplets have incorrect ticks.  Fix it when we are deserializing the measure
     * @param voices
     * @param tupletTree
     */
    static fixTupletLengths(voices: SmoVoice[], tupletTree: SmoTupletTree): void;
    /**
     * restore a serialized measure object.  Usually called as part of deserializing a score,
     * but can also be used to restore a measure due to an undo operation.  Recursively
     * deserialize all the notes and modifiers to construct a new measure.
     * @param jsonObj the serialized SmoMeasure
     * @returns
     */
    static deserialize(jsonObj: SmoMeasureParamsSer): SmoMeasure;
    static clone(measure: SmoMeasure): SmoMeasure;
    static cloneForPasteOrUndo(measure: SmoMeasure): SmoMeasure;
    hasNonRestNotes(): boolean;
    /**
     * When creating a new measure, the 'default' settings can vary depending on
     * what comes before/after the measure.  This determines the default pitch
     * for a clef (appears on 3rd line)
     */
    static get defaultPitchForClef(): Record<Clef, Pitch>;
    static _emptyMeasureNoteType: NoteType;
    static set emptyMeasureNoteType(tt: NoteType);
    static get emptyMeasureNoteType(): NoteType;
    static timeSignatureNotes(timeSignature: TimeSignature, clef: Clef): SmoNote[];
    /**
     * Get a measure full of default notes for a given timeSignature/clef.
     * returns 8th notes for triple-time meters, etc.
     * @param params
     * @returns
     */
    static getDefaultNotes(params: SmoMeasureParams): SmoNote[];
    /**
     * When creating a new measure, the 'default' settings can vary depending on
     * what comes before/after the measure.  This determines the defaults from the
     * parameters that are passed in, which could be another measure in the score.
     * This version returns params with no notes, for callers that want to use their own notes.
     * If you want the default notes, see {@link getDefaultMeasureWithNotes}
     *
     * @param params
     * @returns
     */
    static getDefaultMeasure(params: SmoMeasureParams): SmoMeasure;
    /**
     * When creating a new measure, the 'default' settings can vary depending on
     * what comes before/after the measure.  This determines the defaults from the
     * parameters that are passed in, which could be another measure in the score.
     *
     * @param params
     * @returns
     */
    static getDefaultMeasureWithNotes(params: SmoMeasureParams): SmoMeasure;
    /**
     * used by xml export
     * @internal
     * @param val
     */
    getForceSystemBreak(): boolean;
    setDefaultBarlines(): void;
    get containsSound(): boolean;
    /**
     * The rendered width of the measure, or estimate of same
     */
    get staffWidth(): number;
    /**
     * set the rendered width of the measure, or estimate of same
     */
    setWidth(width: number, description: string): void;
    /**
     * Get rendered or estimated start x
     */
    get staffX(): number;
    /**
     * Set rendered or estimated start x
     */
    setX(x: number, description: string): void;
    /**
     * A time signature has possibly changed.  add/remove notes to
     * match the new length
     */
    alignNotesWithTimeSignature(): true | undefined;
    get measureNumberDbg(): string;
    /**
     * Get rendered or estimated start y
     */
    get staffY(): number;
    /**
     * Set rendered or estimated start y
     */
    setY(y: number, description: string): void;
    /**
     * Return actual or estimated highest point in score
     */
    get yTop(): number;
    /**
     * return the lowest y (highest value) in this measure svg
     *
     * @readonly
     */
    get lowestY(): number;
    get rightmostX(): number;
    /**
     * adjust the y for the render boxes to account for the page and margins
     */
    adjustY(yOffset: number): void;
    /**
     * WHen setting an instrument, offset the pitches to match the instrument key
     * @param offset
     * @param newClef
     */
    transposeToOffset(offset: number, targetKey: string, newClef?: Clef): void;
    /**
     * Return actual or estimated highest point in score
     */
    setYTop(y: number, description: string): void;
    /**
     * Return actual or estimated bounding box
     */
    setBox(box: SvgBox, description: string): void;
    /**
     * @returns the DOM identifier for this measure when rendered
     */
    getClassId(): string;
    /**
     *
     * @param id
     * @returns
     */
    getRenderedNote(id: string): {
        smoNote: SmoNote;
        voice: number;
        tick: number;
    } | null;
    getNotes(): SmoNote[];
    getActiveVoice(): number;
    setActiveVoice(vix: number): void;
    getSwapVoicePairs(): number[][];
    swapVoices(voice1: number, voice2: number): void;
    tickmapForVoice(voiceIx: number): TickMap;
    createMeasureTickmaps(): MeasureTickmaps;
    static createRestNoteWithDuration(duration: number, clef: Clef): SmoNote;
    /**
     * Count the number of ticks in each voice and return max
     * @returns
     */
    getMaxTicksVoice(): number;
    /**
     * For pasting, paste into the target measure if the voice exists, else paste into
     * voice 0
     * @param voiceIndex
     * @returns
     */
    getTicksFromThisOrAnyVoice(voiceIndex: number): number;
    /**
     * Count the number of ticks in a specific voice
     * @param voiceIndex
     * @returns
     */
    getTicksFromVoice(voiceIndex: number): number;
    /**
     * Count all the ticks up to the provided tickIndex
     * @param voiceIndex
     * @param tickIndex
     */
    getNotePositionInTicks(voiceIndex: number, tickIndex: number): number;
    /**
     * Count all the ticks up to the provided tickIndex
     * @param voiceIndex
     * @param tickIndex
     */
    getTickCountForNote(voiceIndex: number, note: SmoNote): number;
    getClosestIndexFromTickCount(voiceIndex: number, tickCount: number): number;
    isPickup(): boolean;
    clearBeamGroups(): void;
    setLyricFont(fontInfo: FontInfo): void;
    setLyricAdjustWidth(adjustNoteWidth: boolean): void;
    setChordAdjustWidth(adjustNoteWidth: boolean): void;
    setChordFont(fontInfo: FontInfo): void;
    tupletNotes(smoTuplet: SmoTuplet): SmoNote[];
    getStemDirectionForTuplet(smoTuplet: SmoTuplet): number;
    getNoteById(id: string): SmoNote | null;
    setClef(clef: Clef): void;
    /**
     * Get the clef that this measure ends with.
     * @returns
     */
    getLastClef(): Clef;
    isRest(): boolean;
    populateVoice(index: number): void;
    private _removeSingletonModifier;
    addRehearsalMark(parameters: SmoRehearsalMarkParams): void;
    removeRehearsalMark(): void;
    getRehearsalMark(): SmoMeasureModifierBase | undefined;
    getModifiersByType(type: string): SmoMeasureModifierBase[];
    setTempo(params: SmoTempoTextParams): void;
    /**
     * Set measure tempo to the default {@link SmoTempoText}
     */
    resetTempo(): void;
    getTempo(): SmoTempoText;
    /**
     * Measure text is deprecated, and may not be supported in the future.
     * Better to use SmoTextGroup and attach to the measure.
     * @param mod
     * @returns
     */
    addMeasureText(mod: SmoMeasureModifierBase): void;
    getMeasureText(): SmoMeasureModifierBase[];
    removeMeasureText(id: string): void;
    setRepeatSymbol(rs: SmoRepeatSymbol): void;
    getRepeatSymbol(): SmoRepeatSymbol | null;
    get isToDc(): boolean;
    get isToDs(): boolean;
    get isSegno(): boolean;
    get isCoda(): boolean;
    get isToCoda(): boolean;
    get isFine(): boolean;
    clearRepeatSymbols(): void;
    setBarline(barline: SmoBarline): void;
    private _getBarline;
    getEndBarline(): SmoBarline;
    getStartBarline(): SmoBarline;
    addNthEnding(ending: SmoVolta): void;
    removeNthEnding(ending: SmoVolta): void;
    getNthEndings(): SmoVolta[];
    setKeySignature(sig: string): void;
    setMeasureNumber(num: MeasureNumber): void;
    getBeamGroupForNote(note: SmoNote): ISmoBeamGroup | null;
}
