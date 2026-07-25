import { Pitch } from '../data/common';
import { SmoNote } from '../data/note';
import { SmoMeasure, SmoVoice } from '../data/measure';
import { SmoSystemStaff } from '../data/systemStaff';
import { SmoScore } from '../data/score';
import { SmoTimeSignature } from '../data/measureModifiers';
import { SmoSelector } from '../xform/selections';
import { SmoTempo } from '../data/measureModifiers';
/**
 * @category serialization
 */
export interface SlurXml {
    startSelector: SmoSelector;
    endSelector: SmoSelector;
    number: number;
}
/**
 * Keep state of the xml document as we are generating it
 * @category serialization
 */
export interface SmoState {
    divisions: number;
    measureNumber: number;
    measureIndex: number;
    transposeOffset: number;
    tickCount: number;
    voiceIndex: number;
    keySignature: string;
    voiceTickIndex: number;
    voice?: SmoVoice;
    partStaves: SmoSystemStaff[];
    staffPartIx: number;
    slurs: SlurXml[];
    ties: SlurXml[];
    tieds: SlurXml[];
    lyricState: Record<number, string>;
    measureTicks: number;
    note?: SmoNote;
    beamState: number;
    beamTicks: number;
    timeSignature?: SmoTimeSignature;
    tempo?: SmoTempo;
    currentTupletLevel: number;
}
/**
 * Convert {@link SmoScore} object into a music XML serialization
 *
 * usage: `xdoc: XmlDocument = SmoToXml.convert(score)`
 * @category serialization
 */
export declare class SmoToXml {
    static get beamStates(): Record<string, number>;
    static get defaultState(): SmoState;
    /**
     * see usage
     * @param score
     * @returns
     */
    static convert(score: SmoScore): XMLDocument;
    /**
     * /score-partwise/part/measure
     * @param measureElement
     * @param smoState
     * @returns
     */
    static measure(measureElement: Element, smoState: SmoState): void;
    /**
     * /score-partwise/part/measure/barline
     * @param measureElement
     * @param smoState
     * @param start
     */
    static barline(measureElement: Element, smoState: SmoState, start: boolean): void;
    /**
     * /score-partwise/part/measure/note/tie
     * @param notationsElement
     * @param smoState
     */
    static tied(notationsElement: Element, smoState: SmoState): void;
    /**
     * /score-partwise/part/measure/note/tie
     * @param noteElement
     * @param smoState
     */
    static tie(noteElement: Element, smoState: SmoState): void;
    /**
   * /score-partwise/part/measure/note/notations/slur
   * @param notationsElement
   * @param smoState
   */
    static slur(notationsElement: Element, smoState: SmoState): void;
    /**
     * /score-partwise/measure/note/time-modification
     * /score-partwise/measure/note/tuplet
     */
    static tupletTime(noteElement: Element, note: SmoNote, measure: SmoMeasure, smoState: SmoState): void;
    static tupletNotation(notationsElement: Element, note: SmoNote, measure: SmoMeasure, smoState: SmoState): void;
    /**
     * /score-partwise/measure/note/pitch
     * @param pitch
     * @param noteElement
     */
    static pitch(pitch: Pitch, noteElement: Element): void;
    /**
     * /score-partwise/measure/beam
     * @param noteElement
     * @param smoState
     * @returns
     */
    static beamNote(noteElement: Element, smoState: SmoState): void;
    /**
     * /score-partwise/measure/direction/direction-type
     * @param measureElement
     * @param smoState
     * @param beforeNote
     */
    static direction(measureElement: Element, smoState: SmoState, beforeNote: boolean): void;
    /**
     * /score-partwise/measure/note/lyric
     * @param noteElement
     * @param smoState
     */
    static lyric(noteElement: Element, smoState: SmoState): void;
    /**
     * /score-partwise/measure/note
     * @param measureElement
     * @param smoState
     */
    static note(measureElement: Element, measure: SmoMeasure, note: SmoNote, smoState: SmoState): void;
    /**
     * /score-partwise/measure/attributes/key
     * @param attributesElement
     * @param smoState
     * @returns
     */
    static key(attributesElement: Element, measure: SmoMeasure, smoState: SmoState): void;
    /**
     * /score-partwise/part/measure/attributes/time
     * @param attributesElement
     * @param smoState
     * @returns
     */
    static time(attributesElement: Element, smoState: SmoState): void;
    /**
     * /score-partwise/part/measure/attributes/clef
     * @param attributesElement
     * @param smoState
     * @returns
     */
    static clef(attributesElement: Element, smoState: SmoState): void;
    /**
     * /score-partwise/part/measure/attributes
     * @param measureElement
     * @param smoState
     */
    static attributes(measureElement: Element, measure: SmoMeasure, smoState: SmoState): void;
    static staves(attributesElement: Element, smoState: SmoState): void;
    /**
     * /score-partwise/part/measure/attributes/transpose
     * @param attributesElement
     * @param smoState
     * @returns
     */
    static transpose(attributesElement: Element, smoState: SmoState): void;
}
