import { XmlState } from './xmlState';
import { SmoLayoutManager } from '../data/scoreModifiers';
import { SmoTempo } from '../data/measureModifiers';
import { SmoScore } from '../data/score';
/**
 * A class that takes a music XML file and outputs a {@link SmoScore}
 * @category serialization
 */
export declare class XmlToSmo {
    static get mmPerPixel(): number;
    /**
     * Vex renders everything as if the font size were 39
     */
    static get vexFontSize(): number;
    static get customProportionDefault(): number;
    static get pageLayoutMap(): {
        xml: string;
        smo: string;
    }[];
    static get pageMarginMap(): {
        xml: string;
        smo: string;
    }[];
    static get scoreInfoFields(): string[];
    /**
     * Convert music XML file from parsed xml to a {@link SmoScore}
     * @param xmlDoc
     * @returns
     */
    static convert(xmlDoc: Document): SmoScore;
    /**
     * when building the slurs, we don't always know which direction the beams will go or what other
     * voices there will be.
     * @param score
     */
    static setSlurDefaults(score: SmoScore): void;
    /**
     * After parsing the XML, resolve the voltas we've saved
     * @param score
     * @param state
     */
    static setVoltas(score: SmoScore, state: XmlState): void;
    static partList(partList: Element, score: SmoScore, state: XmlState): void;
    /**
     * page-layout element occurs in a couple of places
     * @param defaultsElement
     * @param layoutDefaults
     * @param xmlState
     */
    static pageSizeFromLayout(defaultsElement: Element, layoutDefaults: SmoLayoutManager, xmlState: XmlState): void;
    /**
     * /score-partwise/defaults
     * @param defaultsElement
     * @param score
     * @param layoutDefaults
     */
    static defaults(defaultsElement: Element, score: SmoScore, layoutDefaults: SmoLayoutManager, xmlState: XmlState): void;
    /**
     * /score-partwise/part
     * @param partElement
     * @param xmlState
     */
    static part(partElement: Element, xmlState: XmlState): void;
    /**
     * /score-partwise/measure/direction/sound:tempo
     * @param element
     * @returns
     */
    static tempo(element: Element): {
        staffId: number;
        tempo: SmoTempo;
    }[];
    /**
     * /score-partwise/measure/direction/dynamics
     * @param element
     * @returns
     */
    static dynamics(directionElement: Element, xmlState: XmlState): void;
    static attributes(measureElement: Element, xmlState: XmlState): void;
    static wedge(directionElement: Element, xmlState: XmlState): void;
    static direction(directionElement: Element, xmlState: XmlState): void;
    static note(noteElement: Element, xmlState: XmlState): void;
    static print(printElement: Element, xmlState: XmlState): void;
    /**
     * /score-partwise/part/measure
     * A measure in music xml might represent several measures in SMO at the same
     * column in the score
     * @param measureElement
     * @param xmlState
     */
    static measure(measureElement: Element, xmlState: XmlState): void;
}
