/**
 * definitions shared by all SMO types
 * @module /smo/data/common
 */
export declare const SmoNamespace: {
    value: string;
};
export type dynamicCtor = (params: any) => any;
export declare const SmoDynamicCtor: Record<string, dynamicCtor>;
/**
 * Same as attrs object in Vex objects.
 * @category SmoObject
 * @param id - unique identifier, can be used in DOM elements
 * @param type - a little bit redundate with `ctor` in `SmoObjectParams`
 */
export interface SmoAttrs {
    id: string;
    type: string;
}
/**
 * @internal
 */
export interface SmoXmlSerializable {
    serializeXml: (namespace: string, parentElement: Element, tag: string) => Element;
    ctor: string;
}
export declare function createXmlAttributes(element: Element, obj: any): void;
export declare function createXmlAttribute(element: Element, name: string, value: any): void;
export declare const getId: () => string;
/**
 * All note, measure, staff, and score objects have
 * a serialize method and are deserializable with constructor `ctor`
 * @category SmoObject
 */
export interface SmoObjectParams {
    ctor: string;
    attrs?: SmoAttrs;
}
/**
 * Note duration.  The same abstraction used by vex, except here denominator is
 * always 1.  remainder is used to reconstruct non-tuplets from tuplets.
 * @category SmoObject
 * @param numerator - duration, 4096 is 1/4 note
 * @param denominator - always 1 for SMO objects
 * @param remainder - used for tuplets whose duration doesn't divide evenly
 */
export interface Ticks {
    numerator: number;
    denominator: number;
    remainder: number;
}
export type ElementLike = SVGSVGElement | SVGGElement | SVGGraphicsElement | null;
export declare const RemoveElementLike: (e: ElementLike) => void;
/**
 * constraint for SmoPitch.letter value, in lower case
 */
export type PitchLetter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';
export declare function IsPitchLetter(letter: PitchLetter | string): letter is PitchLetter;
/**
 * PitchKey is a SmoPitch, without the octave
 * @category SmoObject
 * @param letter - letter note
 * @param accidental - an accidental or microtone
 */
export interface PitchKey {
    letter: PitchLetter;
    accidental: string;
}
/**
 * Represents a single pitch in Smo object model.
 * @category SmoObject
 * @param letter - letter note
 * @param accidental - an accidental or microtone
 * @param octave - standard octave
 * @param cautionary? - can be used for courtesy accidental
 */
export interface Pitch {
    letter: PitchLetter;
    accidental: string;
    octave: number;
    cautionary?: boolean;
    forced?: boolean;
    role?: string;
}
/**
 * A tuple indicating measure location in the score.  All values are 0-indexed
 * @category SmoObject
 * @param measureIndex - the actual offset from the first measure.  It MUST MATCH staff.measures[i]
 * @param displayMeasure - the index as shown to the user, considers renumbering, but is 0-indexed
 * @param sytemIndex - which bar (column) of a system this measure is
 * @param staffId - which staff (row) of a system this measure is
 */
export interface MeasureNumber {
    measureIndex: number;
    displayMeasure: number;
    systemIndex: number;
    staffId: number;
}
/**
 * musical artifacts can contain temporary svg information for
 * mapping the UI.
 * @internal
 */
export declare class SvgPoint {
    x: number;
    y: number;
    static get default(): {
        x: number;
        y: number;
    };
    constructor();
}
/**
 * musical artifacts can contain temporary svg information for
 * mapping the UI.
 * @internal
 */
export declare class SvgBox {
    x: number;
    y: number;
    width: number;
    height: number;
    static get default(): SvgBox;
    constructor();
}
/**
 * kind of a pointless class...
 * @internal
 */
export interface SvgDimensions {
    width: number;
    height: number;
}
/**
 * A `Transposable` is an abstraction of a note.
 * Can be passed into methods that transform pitches for both
 * grace notes and normal notes.
 * @category SmoObject
 * @param pitches - SMO pitch type
 * @param noteType - same convention as VexFlow, 'n' for note, 'r' for rest
 * @param renderId - ID for the containing SVG group, used to map UI elements
 * @param renderedBox - bounding box in client coordinates
 * @param logicalBox - bounding box in SVG coordinates
 */
export interface Transposable {
    pitches: Pitch[];
    noteType: string;
    renderId: string | null;
    logicalBox: SvgBox | null;
}
/**
 * All note, measure etc. modifiers have these attributes.  The SVG info
 * is for the tracker to track the artifacts in the UI (mouse events, etc)
 * @category SmoObject
 * @param ctor - constructor name for deserialize
 * @param logicalBox - bounding box in SVG coordinates
 * @param attr - unique ID, simlar to vex object attrs field
 */
export interface SmoModifierBase {
    ctor: string;
    logicalBox: SvgBox | null;
    attrs: SmoAttrs;
    serialize: () => any;
}
/**
 * Renderable is just a thing that has a bounding box
 * @internal
 */
export interface Renderable {
    logicalBox: SvgBox | null | undefined;
}
/**
 * Restriction from string to supported clefs
 */
export type Clef = 'treble' | 'bass' | 'tenor' | 'alto' | 'soprano' | 'percussion' | 'mezzo-soprano' | 'baritone-c' | 'baritone-f' | 'subbass' | 'french';
export declare var Clefs: Clef[];
export declare function IsClef(clef: Clef | string): clef is Clef;
/**
 * Most event handling in SMO is an 'any' from jquery, but
 * key events are sometimes narrowed to the common browser key event
 * @internal
 */
export interface KeyEvent {
    type: string;
    shiftKey: boolean;
    ctrlKey: boolean;
    altKey: boolean;
    key: string;
    keyCode: number | string;
    code: string;
    event: string | null;
}
export declare function defaultKeyEvent(): KeyEvent;
export declare function keyEventMatch(ev1: KeyEvent, ev2: KeyEvent): boolean;
export type keyHandler = (key?: KeyEvent) => void;
/**
 * @internal
 */
export interface TickAccidental {
    duration: number;
    pitch: Pitch;
}
/**
 * @internal
 * Used to create {@link MeasureTickmaps}
 */
export interface AccidentalArray {
    duration: string | number;
    pitches: Record<string, TickAccidental>;
}
/**
 * @internal
 */
export interface AccidentalDisplay {
    symbol: string;
    courtesy: boolean;
    forced: boolean;
}
export declare const reverseStaticMaps: Record<string, Record<string, string>>;
export declare function reverseStaticMap(name: string, o: Record<string, string>): Record<string, string>;
