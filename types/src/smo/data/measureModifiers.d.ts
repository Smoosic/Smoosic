import { SmoAttrs, MeasureNumber, SmoObjectParams, SvgBox, SmoModifierBase, ElementLike } from './common';
import { SmoSelector } from '../xform/selections';
import { FontInfo } from '../../common/vex';
/**
 * Measure modifiers are attached to the measure itself.  Each instance has a
 * `serialize()` method and a `ctor` attribute for deserialization.
 * @category SmoObject
 */
export declare abstract class SmoMeasureModifierBase implements SmoModifierBase {
    attrs: SmoAttrs;
    ctor: string;
    logicalBox: SvgBox | null;
    constructor(ctor: string);
    static deserialize(jsonObj: SmoObjectParams): any;
    abstract serialize(): any;
}
export type SmoMeasureFormatNumberAttributes = 'customStretch' | 'proportionality' | 'padLeft' | 'measureIndex';
export declare const SmoMeasureFormatNumberKeys: SmoMeasureFormatNumberAttributes[];
export type SmoMeasueFormatBooleanAttributes = 'autoJustify' | 'systemBreak' | 'skipMeasureCount' | 'pageBreak' | 'padAllInSystem' | 'restBreak' | 'forceRest';
export declare const SmoMeasureFormatBooleanKeys: SmoMeasueFormatBooleanAttributes[];
/**
 * Constructor parameter for measure formatting object
 * @category SmoObject
 */
export interface SmoMeasureFormatParams {
    /**
     * additional pixels to a measure (plus or minus)
     */
    customStretch: number | null;
    /**
     * softmax factor, controls how tightly rhythms are formatted
     */
    proportionality: number | null;
    /**
     * break justification for this column
     */
    autoJustify: boolean | null;
    /**
     * create a new system before this measure
     */
    systemBreak: boolean | null;
    /**
     * create a new system before this page
     */
    pageBreak: boolean | null;
    /**
     * force a break in multi-measure rest
     */
    restBreak: boolean | null;
    /**
     * treat this measure like a whole rest
     */
    forceRest: boolean | null;
    /**
     * if score is grouping measures per system, skip this measure in the count
     * (used for short measures, or pickups)
     */
    skipMeasureCount: boolean | null;
    /**
     * pad left, e.g. for the first stave in a system
     */
    padLeft: number | null;
    /**
     * if padding left, pad all the measures in the column
     */
    padAllInSystem: boolean | null;
    /**
     * When serialized, the measure index of the original measure.
     * In the score it is not used because the measure index is in the
     * measure itself. Note: this is NOT the display measure, even though
     * the UI might set measure formatting and numbering together.
     */
    measureIndex: number | null;
}
/**
 * Serialization for measure formatting customization, like system break
 * @category serialization
 */
export interface SmoMeasureFormatParamsSer extends SmoMeasureFormatParams {
    /**
     * class name for deserialization
     */
    ctor: string;
}
/**
 * ISmoMeasureFormatMgr is the DI interface to the
 * format manager.  Measure formats are often the same to multiple measures
 * so we don't serialize each one - instead we map them with this interface
 * @category SmoObject
 */
export interface ISmoMeasureFormatMgr {
    format: SmoMeasureFormatParams;
    measureNumber: MeasureNumber;
}
/**
 * Measure format holds parameters about the automatic formatting of the measure itself, such as the witch and
 * how the durations are proportioned.  Note that measure formatting is also controlled by the justification
 * between voices and staves.  For instance, 2 measures in different staves will have to have the same width
 * @category SmoObject
 */
export declare class SmoMeasureFormat extends SmoMeasureModifierBase implements SmoMeasureFormatParams {
    static get attributes(): string[];
    static get formatAttributes(): string[];
    static get defaultProportionality(): number;
    static get legacyProportionality(): number;
    static fromLegacyMeasure(measure: any): SmoMeasureFormat;
    static get defaults(): SmoMeasureFormatParams;
    customStretch: number;
    proportionality: number;
    systemBreak: boolean;
    pageBreak: boolean;
    restBreak: boolean;
    skipMeasureCount: boolean;
    forceRest: boolean;
    padLeft: number;
    padAllInSystem: boolean;
    autoJustify: boolean;
    measureIndex: number;
    eq(o: SmoMeasureFormatParams): boolean;
    get isDefault(): boolean;
    constructor(parameters: SmoMeasureFormatParams);
    serialize(): SmoMeasureFormatParamsSer;
}
/**
 * Used to create a {@link SmoBarline}
 * @category SmoObject
 */
export interface SmoBarlineParams {
    position: number | null;
    barline: number | null;
}
/**
 * @category serialization
 */
export interface SmoBarlineParamsSer extends SmoBarlineParams {
    ctor: string;
    position: number | null;
    barline: number | null;
}
/**
 * Barline is just that, there is a start and end in each measure, which defaults to 'single'.
 * @category SmoObject
 */
export declare class SmoBarline extends SmoMeasureModifierBase {
    static readonly positions: Record<string, number>;
    static readonly barlines: Record<string, number>;
    static get _barlineToString(): string[];
    static barlineString(inst: SmoBarline): string;
    static get defaults(): SmoBarlineParams;
    static get attributes(): string[];
    serialize(): SmoBarlineParamsSer;
    constructor(parameters: SmoBarlineParams | null);
    barline: number;
    position: number;
}
/**
 * Constructor for SmoRepeatSymbol
 * @category SmoObject
 */
export interface SmoRepeatSymbolParams {
    /**
     * The symbol enumeration
     */
    symbol: number;
    /**
     * x offset for DC, sign etc.
     */
    xOffset: number;
    /**
     * y offset for DC, sign etc.
     */
    yOffset: number;
    /**
     * position, above or below
     */
    position: number;
}
/**
 * @category serialization
 */
export interface SmoRepeatSymbolParamsSer extends SmoRepeatSymbolParams {
    /**
     * constructor
     */
    ctor: string;
}
/**
 * Repeat symbols like DC, Fine etc.  Note: voltas are their own thing,
 * and repeats are types of barlines.
 * @category SmoObject
 */
export declare class SmoRepeatSymbol extends SmoMeasureModifierBase {
    static readonly symbols: Record<string, number>;
    static readonly _repeatSymbolStrings: Record<number, string>;
    static repeatSymbolString(symbol: SmoRepeatSymbol): string;
    static readonly positions: Record<string, number>;
    static get defaults(): SmoRepeatSymbolParams;
    static get attributes(): string[];
    symbol: number;
    xOffset: number;
    yOffset: number;
    position: number;
    serialize(): SmoRepeatSymbolParamsSer;
    constructor(parameters: SmoRepeatSymbolParams);
}
/**
 * Constructor parameters for {@link SmoVolta} (2nd ending)
 * @category SmoObject
 */
export interface SmoVoltaParams {
    /**
     * start bar of ending
     */
    startBar: number;
    /**
     * end bar (how long it stretches)
     */
    endBar: number;
    /**
     * xoffset for start, for collisions
     */
    xOffsetStart: number;
    /**
     * xoffset for end, for collisions
     */
    xOffsetEnd: number;
    /**
     * yOffset, for collisions
     */
    yOffset: number;
    /**
     * 2nd ending, 3rd etc.
     */
    number: number;
}
/**
 * serializable bits of volta/endings
 * @category serialization
 */
export interface SmoVoltaParamsSer extends SmoVoltaParams {
    /**
     * constructor
     */
    ctor: string;
}
/**
 * Voltas (2nd endings) behave more like staff modifiers, but they are associated with the measure
 * since each measure has it's own rules for displaying part of the volta.
 * @category SmoObject
 */
export declare class SmoVolta extends SmoMeasureModifierBase {
    startBar: number;
    endBar: number;
    xOffsetStart: number;
    xOffsetEnd: number;
    yOffset: number;
    number: number;
    endingId: string | null;
    startSelector: SmoSelector | null;
    endSelector: SmoSelector | null;
    elements: ElementLike[];
    constructor(parameters: SmoVoltaParams);
    get id(): string;
    get type(): string;
    static get attributes(): string[];
    static get editableAttributes(): string[];
    serialize(): SmoVoltaParamsSer;
    static get defaults(): SmoVoltaParams;
}
/**
 * Constructor parameters for {@link SmoMeasureText}
 * @category SmoObject
 */
export interface SmoMeasureTextParams {
    position: number;
    fontInfo: FontInfo;
    text: string;
    adjustX: number;
    adjustY: number;
    justification: number;
}
/**
 * Serialized fields of SmoMeasureTextParams
 * @category serialization
 */
export interface SmoMeasureTextParamsSer extends SmoMeasureTextParams {
    /**
     * constructor
     */
    ctor: string;
}
/**
 * Measure text is just that.  Now that score text can be associated with musical elements, this
 * class has falled into disrepair.  It may be used for part notations in the score later.
 * @category SmoObject
 */
export declare class SmoMeasureText extends SmoMeasureModifierBase {
    static readonly positions: Record<string, number>;
    static readonly justifications: Record<string, number>;
    static readonly _positionToString: string[];
    static get attributes(): string[];
    static readonly defaults: SmoMeasureTextParams;
    justification: number;
    position: number;
    text: string;
    adjustX: number;
    adjustY: number;
    fontInfo: FontInfo;
    serialize(): SmoMeasureTextParamsSer;
    constructor(parameters: SmoMeasureTextParams | null);
}
/**
 * Used to construct {@link SmoRehearsalMark}
 * @internal
 * */
export interface SmoRehearsalMarkParams {
    /**
     * cardinal position
     */
    position: number;
    /**
     * Symbol. by default, letters that auto-increment
     */
    symbol: string;
    /**
     * future, define how increment works
     */
    cardinality: string;
    /**
     * disable to make your own symbols for each new one.
     */
    increment: boolean;
}
/**
 * Serialized fields for rehearsal mark
 * @category serialization
 */
export interface SmoRehearsalMarkParamsSer extends SmoRehearsalMarkParams {
    /**
     * constructor
     */
    ctor: string;
}
/**
 * Rehearsal marks are some type of auto-incrementing markers on a measure index.
 * @category SmoObject
 */
export declare class SmoRehearsalMark extends SmoMeasureModifierBase {
    static readonly cardinalities: Record<string, string>;
    static readonly positions: Record<string, number>;
    static get _positionToString(): string[];
    static get defaults(): SmoRehearsalMarkParams;
    static get attributes(): string[];
    position: number;
    cardinality: string;
    symbol: string;
    increment: boolean;
    getIncrement(): string;
    getInitial(): "a" | "A" | "1";
    serialize(): SmoRehearsalMarkParamsSer;
    constructor(parameters: SmoRehearsalMarkParams);
}
export type SmoTempoNumberAttribute = 'bpm' | 'beatDuration' | 'yOffset';
export type SmoTempoStringAttribute = 'tempoMode' | 'tempoText' | 'customText';
export type SmoTempoBooleanAttribute = 'display';
export type SmoTempoMode = 'duration' | 'text' | 'custom';
/**
 * constructor parameters for {@link SmoTempoText}
 * @category SmoObject
 */
export interface SmoTempoTextParams {
    /**
     * text (e.g. Allegro) or bpm
     */
    tempoMode: string;
    /**
     * playback bpm
     */
    bpm: number;
    /**
     * note type for a metronome beat
     */
    beatDuration: number;
    /**
     * if text mode, the text
     */
    tempoText: string;
    /**
     * move the text to keep it from colliding with other things
     */
    yOffset: number;
    /**
     * indicate if we are displaying, false if only affects playback
     */
    display: boolean;
    /**
     * text taht is not a standards notation
     */
    customText: string;
}
/**
 * serialized tempo parameters
 * @category serialization
 */
export interface SmoTempoTextParamsSer extends SmoTempoTextParams {
    ctor: string;
}
/**
 * @internal
 */
export interface VexTempoTextParams {
    duration?: string;
    dots?: number;
    bpm?: number;
    name?: string;
}
/**
 * Information about both playback tempo and how the tempo is notated.
 * @category SmoObject
 */
export declare class SmoTempoText extends SmoMeasureModifierBase implements SmoTempoTextParams {
    static get tempoModes(): Record<string, SmoTempoMode>;
    static get tempoTexts(): Record<string, string>;
    /**
     * create defaults for tempo initialization
     */
    static get defaults(): SmoTempoTextParams;
    static get attributes(): string[];
    tempoMode: SmoTempoMode;
    bpm: number;
    beatDuration: number;
    tempoText: string;
    yOffset: number;
    display: boolean;
    customText: string;
    _toVexTextTempo(): VexTempoTextParams;
    /**
     * Return equality wrt the tempo marking, e.g. 2 allegro in textMode will be equal but
     * an allegro and duration 120bpm will not.
     * @param t1
     * @param t2
     * @returns
     */
    static eq(t1: SmoTempoText, t2: SmoTempoText): boolean;
    static get bpmFromText(): Record<string, number>;
    _toVexDurationTempo(): VexTempoTextParams;
    toVexTempo(): VexTempoTextParams;
    serialize(): SmoTempoTextParamsSer;
    constructor(parameters: SmoTempoTextParams | null);
}
/**
 * Constructor parameters for a time signature
 * @category SmoObject
 */
export interface TimeSignatureParameters {
    /**
     * numerator
     */
    actualBeats: number;
    /**
     * denominator, always power of 2
     */
    beatDuration: number;
    /**
     * indicates cut time/common time
     */
    useSymbol: boolean;
    /**
     * display, else just affects measure lengths.
     */
    display: boolean;
    /**
     * for pickups, display the non-pickup value
     */
    displayString: string;
}
/**
 * serialized time signature
 * @category serialization
 */
export interface TimeSignatureParametersSer extends TimeSignatureParameters {
    /**
     * constructor
     */
    ctor: string;
}
/**
 * Time signatures contain duration information for a measure, and information
 * about the display of the time signature.
 * @category SmoObject
 */
export declare class TimeSignature extends SmoMeasureModifierBase {
    static get defaults(): TimeSignatureParameters;
    static equal(ts1: TimeSignature, ts2: TimeSignature): boolean;
    static createFromPartial(value: Partial<TimeSignatureParameters>): TimeSignature;
    actualBeats: number;
    beatDuration: number;
    useSymbol: boolean;
    display: boolean;
    displayString: string;
    get timeSignature(): string;
    static get parameters(): string[];
    static get boolParameters(): never[];
    set timeSignature(value: string);
    serialize(): TimeSignatureParametersSer;
    constructor(params: TimeSignatureParameters);
}
export declare const measureModifierDynamicCtorInit: () => void;
