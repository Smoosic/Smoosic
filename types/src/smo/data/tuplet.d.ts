import { SmoNote, TupletInfo } from './note';
import { SmoAttrs } from './common';
import { SmoMeasure, SmoVoice } from './measure';
/**
 * @category SmoObject
 */
export interface SmoTupletTreeParams {
    tuplet: SmoTuplet;
}
/**
 * @category serialization
 */
export interface SmoTupletTreeParamsSer {
    /**
     * constructor
     */
    ctor: string;
    /**
     * root tuplet
     */
    tuplet: SmoTupletParamsSer;
}
/**
 * @category SmoObject
 */
export declare class SmoTupletTree {
    /**
     * root tuplet
     */
    tuplet: SmoTuplet;
    constructor(params: SmoTupletTreeParams);
    static syncTupletIds(tupletTrees: SmoTupletTree[], voices: SmoVoice[]): void;
    static adjustTupletIndexes(tupletTrees: SmoTupletTree[], voice: number, startTick: number, diff: number): void;
    /**
     * When pasting a tuplet into am measure, adjust the tuplet indices for tuplets that come after.
     * @param tupletTrees
     * @param voice
     * @param measure
     */
    static adjustMeasureTupletIndices(tupletTrees: SmoTupletTree[], voice: number, measure: SmoMeasure): void;
    static getTupletForNoteIndex(tupletTrees: SmoTupletTree[], voiceIx: number, noteIx: number): SmoTuplet | null;
    static getTupletTreeForNoteIndex(tupletTrees: SmoTupletTree[], voiceIx: number, noteIx: number): SmoTupletTree | null;
    static getTupletHierarchyForNoteIndex(tupletTrees: SmoTupletTree[], voiceIx: number, noteIx: number): SmoTuplet[];
    static removeTupletForNoteIndex(measure: SmoMeasure, voiceIx: number, noteIx: number): void;
    /**
     * Determines whether two notes are part of the same tuplet.
     * @param noteOne
     * @param noteTwo
     */
    static areNotesPartOfTheSameTuplet(noteOne: SmoNote, noteTwo: SmoNote): boolean;
    static areTupletsBothNull(noteOne: SmoNote, noteTwo: SmoNote): boolean;
    serialize(): SmoTupletTreeParamsSer;
    static deserialize(jsonObj: SmoTupletTreeParamsSer): SmoTupletTree;
    static clone(tupletTree: SmoTupletTree): SmoTupletTree;
    get startIndex(): number;
    get endIndex(): number;
    get voice(): number;
    get totalTicks(): number;
}
/**
 * Parameters for tuplet construction
 * @param notes - runtime instance of tuplet has an actual instance of
 * notes.  The note instances are created by the deserilization of the
 * measure.  We serialize the note parameters so we can identify the correct notes
 * when deserializing.
 * @category SmoObject
 */
export interface SmoTupletParams {
    numNotes: number;
    notesOccupied: number;
    stemTicks: number;
    totalTicks: number;
    ratioed: boolean;
    bracketed: boolean;
    voice: number;
    startIndex: number;
    endIndex: number;
}
/**
 * serializabl bits of SmoTuplet
 * @category serialization
 */
export interface SmoTupletParamsSer {
    /**
     * constructor
     */
    ctor: string;
    /**
     * attributes for ID
     */
    attrs: SmoAttrs;
    /**
     * numNotes in the tuplet (not necessarily same as notes array size)
     */
    numNotes: number;
    /**
     *
     */
    notesOccupied: number;
    /**
     * used to decide how to beam, 2048 for 1/4 triplet for instance
     */
    stemTicks: number;
    /**
     * total ticks to squeeze numNotes
     */
    totalTicks: number;
    /**
     * whether to use the :
     */
    ratioed: boolean;
    /**
     * whether to show the brackets
     */
    bracketed: boolean;
    /**
     * which voice the tuplet applies to
     */
    voice: number;
    startIndex: number;
    endIndex: number;
    parentTuplet: TupletInfo | null;
    childrenTuplets: SmoTupletParamsSer[];
}
/**
 * A tuplet is a container for notes within a measure
 * @category SmoObject
 */
export declare class SmoTuplet {
    static get defaults(): SmoTupletParams;
    attrs: SmoAttrs;
    numNotes: number;
    notesOccupied: number;
    stemTicks: number;
    totalTicks: number;
    bracketed: boolean;
    voice: number;
    ratioed: boolean;
    parentTuplet: TupletInfo | null;
    childrenTuplets: SmoTuplet[];
    startIndex: number;
    endIndex: number;
    get clonedParams(): {};
    static get parameterArray(): string[];
    serialize(): SmoTupletParamsSer;
    static deserialize(jsonObj: SmoTupletParamsSer): SmoTuplet;
    static calculateStemTicks(totalTicks: number, numNotes: number): number;
    constructor(params: SmoTupletParams);
    static get longestTuplet(): number;
    get num_notes(): number;
    get notes_occupied(): number;
    get tickCount(): number;
}
