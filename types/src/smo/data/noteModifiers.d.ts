/**
 * A note modifier is anything that is mapped to the note, but not part of the
 * pitch itself.  This includes grace notes, and note-text like lyrics.
 * @module /smo/data/noteModifiers
 */
import { SmoAttrs, Ticks, Pitch, SmoObjectParams, Transposable, SvgBox, SmoModifierBase, Clef, ElementLike } from './common';
import { FontInfo } from '../../common/vex';
import { GraceNote } from "vexflow_smoosic";
/**
 * A note modifier is anything that is mapped to the note, but not part of the
 * pitch itself.  This includes grace notes, and note-text like lyrics.
 * All note modifiers have a serialize method and a 'ctor' parameter or deserialization
 * @category SmoObject
 */
export declare abstract class SmoNoteModifierBase implements SmoModifierBase {
    attrs: SmoAttrs;
    ctor: string;
    logicalBox: SvgBox | null;
    element: ElementLike;
    constructor(ctor: string);
    static deserialize(jsonObj: SmoObjectParams): any;
    abstract serialize(): any;
}
export declare function isClefChangeParamsSer(params: Partial<SmoClefChangeParamsSer>): params is SmoClefChangeParamsSer;
/**
 * @category SmoObject
 */
export interface SmoClefChangeParams {
    clef: string;
}
/**
 * @category serialization
 */
export interface SmoClefChangeParamsSer extends SmoClefChangeParams {
    /**
     * constructor
     */
    ctor: string;
    /**
     * attributes for ID
     */
    attrs: SmoAttrs;
}
/**
 * @category SmoObject
 */
export declare class SmoClefChange extends SmoNoteModifierBase {
    clef: Clef;
    static get defaults(): SmoClefChangeParamsSer;
    constructor(clefParams: SmoClefChangeParams);
    serialize(): SmoClefChangeParamsSer;
}
/**
 * used to construct {@link SmoGraceNote}
 *   beam group.
 * @category SmoObject
 */
export interface GraceNoteParams extends SmoModifierBase {
    /**
     * up, down, or auto
     */
    flagState: number;
    /**
     * same as for {@link SmoNote}
     */
    noteType: string;
    /**
     * same as for {@link SmoNote}
     */
    beamBeats: number;
    /**
     * same as for {@link SmoNote}.  Indicates break in beam group
     */
    endBeam: boolean;
    /**
     * should be same as note?
     */
    clef: string;
    /**
     * there's probably a name for this...
     */
    slash: boolean;
    /**
     * only used for beaming
     */
    ticks: Ticks;
    /**
     * Pitch, same as for {@link SmoNote}
     */
    pitches: Pitch[];
}
/**
 * serialized grace note
 * @category serialization
 */
export interface GraceNoteParamsSer extends GraceNoteParams {
    /**
     * constructor
     */
    ctor: string;
    /**
     * attributes for ID
     */
    attrs: SmoAttrs;
}
/**
 * A grace notes has many of the things an 'actual' note can have, but it doesn't take up
 * time against the time signature
 * @category SmoObject
 */
export declare class SmoGraceNote extends SmoNoteModifierBase implements Transposable {
    static get flagStates(): {
        auto: number;
        up: number;
        down: number;
    };
    static get defaults(): GraceNoteParams;
    static get parameterArray(): string[];
    ticks: Ticks;
    pitches: Pitch[];
    slash: boolean;
    clef: string;
    noteType: string;
    renderId: string | null;
    vexGraceNote: GraceNote | null;
    hasTabNote: boolean;
    tickCount(): number;
    toVexGraceNote(): {
        duration: string;
        keys: string[];
        slash: boolean;
    };
    serialize(): GraceNoteParamsSer;
    constructor(parameters: Partial<GraceNoteParams>);
}
export type SmoArpeggioType = 'directionless' | 'rasquedo_up' | 'rasquedo_down' | 'roll_up' | 'roll_down' | 'brush_up' | 'brush_down' | 'none';
export declare const SmoArpeggioTypes: string[];
/**
 * @category SmoObject
 */
export interface SmoArpeggioParams {
    type: SmoArpeggioType;
}
/**
 * @category serialization
 */
export interface SmoArpeggioParamsSer {
    ctor: string;
    /**
     * stringified arpeggion enumeration
     */
    type: string;
}
export declare function isArpeggioType(tp: SmoArpeggioType | string): tp is SmoArpeggioType;
/**
 * A 'splatter' symbol next to a chord.
 * @category SmoObject
 */
export declare class SmoArpeggio extends SmoNoteModifierBase {
    static _types: Record<string, number>;
    static get types(): Record<string, number>;
    typeCode: number;
    constructor(params: SmoArpeggioParams);
    get typeString(): SmoArpeggioType;
    serialize(): SmoArpeggioParamsSer;
}
/**
 * Constructor parameters for {@link SmoMicrotone}
 * @category SmoObject
 */
export interface SmoMicrotoneParams extends SmoObjectParams {
    /**
     * indicates which modifier to alter the tone (e.g. 1/4 sharp)
     */
    tone: string;
    /**
     * the index of the pitch to alter
     */
    pitch: number;
}
/**
 * serialized microtones.
 * @category serialization
 */
export interface SmoMicrotoneParamsSer extends SmoMicrotoneParams {
    ctor: string;
    attrs: SmoAttrs;
}
/**
 * Microtones are treated similarly to ornaments.  There are not
 * rules for persisting throughout a measure, cancel etc.
 * @category SmoObject
*/
export declare class SmoMicrotone extends SmoNoteModifierBase {
    tone: string;
    pitchIndex: number;
    static readonly smoToVex: Record<string, string>;
    static readonly pitchCoeff: Record<string, number>;
    get toPitchCoeff(): number;
    get toVex(): string;
    static get defaults(): SmoMicrotoneParams;
    static get parameterArray(): string[];
    serialize(): SmoMicrotoneParamsSer;
    constructor(parameters: SmoMicrotoneParams);
}
/**
 * Constructor for {@link SmoOrnament}
 * @category SmoObject
 */
export interface SmoOrnamentParams {
    /**
     * postition, above or below
     */
    position?: string;
    /**
     * horizontal offset from note head
     */
    offset?: string;
    /**
     * accidental above/below
     */
    accidentalAbove?: string;
    accidentalBelow?: string;
    /**
     * code for the ornament
     */
    ornament: string;
}
/**
 * serializable ornament
 * @category serialization
 */
export interface SmoOrnamentParamsSer extends SmoOrnamentParams {
    /**
     * constructor
     */
    ctor: string;
}
/**
 * Ornaments map to vex ornaments.  articulations vs. ornaments
 * is kind of arbitrary
 * @category SmoObject
 */
export declare class SmoOrnament extends SmoNoteModifierBase {
    static readonly ornaments: Record<string, string>;
    static readonly xmlOrnaments: Record<string, string>;
    static get mordents(): string[];
    static get turns(): string[];
    static readonly textNoteOrnaments: Record<string, string>;
    static readonly xmlJazz: Record<string, string>;
    static get jazzOrnaments(): string[];
    static get legacyJazz(): Record<string, string>;
    toVex(): string;
    isJazz(): boolean;
    isMordent(): boolean;
    isTurn(): boolean;
    position: string;
    offset: string;
    ornament: string;
    static get parameterArray(): string[];
    static get positions(): {
        above: string;
        below: string;
        auto: string;
    };
    static get offsets(): {
        on: string;
        after: string;
    };
    static get defaults(): SmoOrnamentParams;
    serialize(): SmoOrnamentParamsSer;
    constructor(parameters: SmoOrnamentParams);
}
/**
 * Constructor parameters for {@link SmoArticulation}
 * @category SmoObject
 */
export interface SmoArticulationParameters {
    /**
     * position, above or below
     */
    position?: string;
    /**
     * x offset
     */
    offset?: number;
    /**
     * articulation code
     */
    articulation: string;
}
/**
 * @category serialization
 */
export interface SmoArticulationParametersSer extends SmoArticulationParameters {
    ctor: string;
}
/**
 * Articulations map to notes, can be placed above/below
 * @category SmoObject
 */
export declare class SmoArticulation extends SmoNoteModifierBase {
    static get articulations(): Record<string, string>;
    static readonly xmlArticulations: Record<string, string>;
    static get positions(): {
        above: string;
        below: string;
        auto: string;
    };
    static get articulationToVex(): Record<string, string>;
    static get vexToArticulation(): Record<string, string>;
    static get parameterArray(): string[];
    static get positionToVex(): Record<string, number>;
    static get defaults(): SmoArticulationParameters;
    position: string;
    offset: number;
    articulation: string;
    adjX: number;
    serialize(): SmoArticulationParametersSer;
    constructor(parameters: SmoArticulationParameters);
}
/**
 * @internal
 */
export interface VexAnnotationParams {
    glyph?: string;
    symbolModifier?: number;
    text?: string;
}
/**
 * The persist-y parts of {@link SmoLyricParams}. We don't persist the selector
 * since that can change based on the position of the parent note
 * @category serialization
 */
export interface SmoLyricParamsSer extends SmoObjectParams {
    /**
     * constructor
     */
    ctor: string;
    /**
     * attributes for ID
     */
    attrs: SmoAttrs;
    /**
     * the lyric font
     */
    fontInfo: FontInfo;
    /**
     * classes for styling
     */
    classes: string;
    /**
     * which verse the lyric goes with
     */
    verse: number;
    /**
     * lyrics are used for chord changes or annotations, parser is different for each
     */
    parser: number;
    /**
     * indicates we should format for the width of the lyric
     */
    adjustNoteWidthLyric: boolean;
    /**
     * indicates we should format for the width of the chord
     */
    adjustNoteWidthChord: boolean;
    /**
     * fill color for text
     */
    fill: string;
    /**
     * translate to align lyrics.  Possibly this should not be serialized
     */
    translateX: number;
    /**
     * translate to align lyrics.  Possibly this should not be serialized
     */
    translateY: number;
    /**
     * the actual text
     */
    text: string | null;
}
/**
 * Used to construct a {@link SmoLyric} for both chords and lyrics
 * @category SmoObject
 */
export interface SmoLyricParams {
    /**
     * the lyric font
     */
    fontInfo: FontInfo;
    /**
     * classes for styling
     */
    classes: string;
    /**
     * which verse the lyric goes with
     */
    verse: number;
    /**
     * lyrics are used for chord changes or annotations, parser is different for each
     */
    parser: number;
    /**
     * indicates we should format for the width of the lyric
     */
    adjustNoteWidthLyric: boolean;
    /**
     * indicates we should format for the width of the chord
     */
    adjustNoteWidthChord: boolean;
    /**
     * fill color for text
     */
    fill: string;
    /**
     * translate to align lyrics.  Possibly this should not be serialized
     */
    translateX: number;
    /**
     * translate to align lyrics.  Possibly this should not be serialized
     */
    translateY: number;
    /**
     * the actual text
     */
    text: string | null;
}
/**
 * SmoLyric covers both chords and lyrics.  The parser tells you which
 * one you get.
 * @category SmoObject
 */
export declare class SmoLyric extends SmoNoteModifierBase {
    static readonly parsers: Record<string, number>;
    static get defaults(): SmoLyricParams;
    static get symbolPosition(): {
        SUPERSCRIPT: number;
        SUBSCRIPT: number;
        NORMAL: number;
    };
    static get persistArray(): string[];
    static get parameterArray(): string[];
    ctor: string;
    text: string;
    fontInfo: FontInfo;
    parser: number;
    selector: string | null;
    adjustNoteWidthLyric: boolean;
    adjustNoteWidthChord: boolean;
    verse: number;
    skipRender: boolean;
    fill: string;
    translateX: number;
    translateY: number;
    classes: string;
    adjX: number;
    adjY: number;
    musicYOffset: number;
    hyphenX: number;
    deleted: boolean;
    serialize(): SmoLyricParamsSer;
    get adjustNoteWidth(): boolean;
    set adjustNoteWidth(val: boolean);
    static transposeChordToKey(chord: SmoLyric, offset: number, srcKey: string, destKey: string): SmoLyric;
    getClassSelector(): string;
    setText(text: string): void;
    isHyphenated(): boolean | 0;
    getText(): any;
    isDash(): boolean | 0;
    static _chordGlyphFromCode(code: string): string;
    static _tokenizeChordString(str: string): string[];
    constructor(parameters: SmoLyricParams);
}
/**
 * Used to create a {@link SmoBarline}
 * @category SmoObject
 */
export interface SmoNoteBarParams {
    barline: number;
}
export interface SmoNoteBarParamsSer extends SmoNoteBarParams {
    ctor: string;
    barline: number;
}
export declare class SmoNoteBar extends SmoNoteModifierBase {
    barline: number;
    static get defaults(): SmoNoteBarParams;
    static get parameterArray(): string[];
    static readonly barlines: Record<string, number>;
    constructor(parameters: SmoNoteBarParams);
    serialize(): SmoNoteBarParamsSer;
}
/**
 * The persisted bits of {@link SmoDynamicTextParams}
 * @category serialization
 */
export interface SmoDynamicTextSer extends SmoObjectParams {
    ctor: string;
    xOffset: number;
    fontSize: number;
    yOffsetLine: number;
    yOffsetPixels: number;
    text: string;
}
/**
 * Constructor parameters for {@link SmoDynamicText}
 * @category SmoObject
 */
export interface SmoDynamicTextParams extends SmoDynamicTextSer {
    ctor: string;
    xOffset: number;
    fontSize: number;
    yOffsetLine: number;
    yOffsetPixels: number;
    text: string;
}
/**
 * Dynamic text tells you how loud not to play.
 * @category SmoObject
 */
export declare class SmoDynamicText extends SmoNoteModifierBase {
    static get dynamics(): Record<string, string>;
    static get defaults(): SmoDynamicTextParams;
    static get persistArray(): string[];
    static get parameterArray(): string[];
    text: string;
    yOffsetLine: number;
    yOffsetPixels: number;
    xOffset: number;
    fontSize: number;
    serialize(): object;
    constructor(parameters: SmoDynamicTextParams);
}
/**
 * @category SmoObject
 */
export interface SmoTabBend {
    bendType: number;
    release: boolean;
    text: string;
}
/**
 * @category SmoObject
 */
export interface SmoFretPosition {
    string: number;
    fret: number;
}
/**
 * @category SmoObject
 */
export interface SmoTabNoteParams {
    positions: SmoFretPosition[];
    noteId: string;
    flagState: number;
    flagThrough: boolean;
    noteHead: number;
    isAssigned: boolean;
}
/**
 * @category serialization
 */
export interface SmoTabNoteParamsSer extends SmoTabNoteParams {
    ctor: string;
}
/**
 * @category SmoObject
 */
export declare class SmoTabNote extends SmoNoteModifierBase {
    static get defaults(): SmoTabNoteParams;
    positions: SmoFretPosition[];
    noteId: string;
    isAssigned: boolean;
    noteHead: number;
    flagState: number;
    flagThrough: boolean;
    static get flagStates(): {
        None: number;
        Up: number;
        Down: number;
    };
    static get noteHeads(): {
        number: number;
        x: number;
    };
    constructor(params: SmoTabNoteParams);
    serialize(): SmoTabNoteParamsSer;
}
export declare const noteModifierDynamicCtorInit: () => void;
