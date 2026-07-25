import { XmlDurationAlteration, XmlLyricData, XmlSlurType, XmlTieType, XmlTupletType } from './xmlHelpers';
import { SmoScore } from '../data/score';
import { SmoFormattingManager, SmoSystemGroup } from '../data/scoreModifiers';
import { SmoSystemStaff } from '../data/systemStaff';
import { SmoInstrument, SmoInstrumentParams, SmoSlurParams } from '../data/staffModifiers';
import { SmoTempo } from '../data/measureModifiers';
import { SmoPartInfo } from '../data/partInfo';
import { SmoMeasure } from '../data/measure';
import { SmoNote } from '../data/note';
import { SmoGraceNote } from '../data/noteModifiers';
import { SmoTuplet, SmoTupletTree } from '../data/tuplet';
import { SmoSelector } from '../xform/selections';
/**
 * @category serialization
 */
export interface XmlClefInfo {
    clef: string;
    staffId: number;
}
/**
 * @category serialization
 */
export interface XmlVoiceInfo {
    notes: SmoNote[];
    ticksUsed: number;
}
/**
 * @category serialization
 */
export interface XmlStaffInfo {
    clefInfo: XmlClefInfo;
    measure: SmoMeasure | null;
    voices: Record<string | number, XmlVoiceInfo>;
}
/**
 * @category serialization
 */
export interface XmlBeamGroupInfo {
    ticks: number;
    notes: number;
}
/**
 * @category serialization
 */
export interface XmlSystemInfo {
    startSelector: SmoSelector;
    endSelector: SmoSelector;
    leftConnector: number;
}
/**
 * @category serialization
 */
export interface XmlStaffGroupInfo {
    start: number;
    length: number;
}
/**
 * Wedge is a hairpin/cresc.
 */
export interface XmlWedgeInfo {
    type: string;
}
/**
 * @category serialization
 */
export interface XmlWedgeState {
    type: string;
    start: number;
}
/**
 * @category serialization
 */
export interface XmlHairpinInfo {
    type: string;
    start: number;
    end: number;
}
/**
 * @category serialization
 */
export interface XmlDynamicInfo {
    dynamic: string;
    offset: number;
}
/**
 * @category serialization
 */
export interface XmlCompletedTies {
    startSelector: SmoSelector;
    endSelector: SmoSelector;
    fromPitch: number;
    toPitch: number;
}
/**
 * @category serialization
 */
export interface XmlCompletedTuplet {
    tuplet: SmoTuplet;
    staffId: number;
    voiceId: number;
}
/**
 * @category serialization
 */
export declare class XmlTupletStateTreeNode {
    tupletState: XmlTupletState;
    children: XmlTupletStateTreeNode[];
    constructor(tupletState: XmlTupletState);
}
/**
 * @category serialization
 */
export interface XmlCompletedTupletState {
    tupletState: XmlTupletState;
    staffId: number;
    voiceId: number;
}
/**
 * @category serialization
 */
export interface XmlTupletState {
    start: SmoSelector | null;
    end: SmoSelector | null;
    data: XmlTupletData | null;
}
/**
 * @category serialization
 */
export interface XmlTupletData {
    numNotes: number;
    notesOccupied: number;
    stemTicks: number;
}
/**
 * @category serialization
 */
export interface XmlEnding {
    start: number;
    end: number;
    number: number;
}
/**
 * @category serialization
 */
export interface XmlPartGroup {
    partNum: number;
    group: SmoSystemGroup;
    parts: number[];
}
/**
 * Keep state of musical objects while parsing music xml
 * @category serialization
 * */
export declare class XmlState {
    static get defaults(): {
        divisions: number;
        tempo: SmoTempo;
        timeSignature: string;
        keySignature: string;
        clefInfo: never[];
        staffGroups: never[];
        smoStaves: never[];
    };
    clefInfo: XmlClefInfo[];
    systems: XmlSystemInfo[];
    staffGroups: XmlStaffGroupInfo[];
    smoStaves: SmoSystemStaff[];
    slurs: Record<number, XmlSlurType | null>;
    wedges: XmlWedgeState;
    hairpins: XmlHairpinInfo[];
    instrument: SmoInstrumentParams;
    instrumentMap: Record<number, SmoInstrument>;
    globalCursor: number;
    staffVoiceHash: Record<string | number, number[]>;
    endingMap: Record<number, XmlEnding[]>;
    startRepeatMap: Record<number, number>;
    endRepeatMap: Record<number, number>;
    startBarline: number;
    endBarline: number;
    measureIndex: number;
    completedSlurs: SmoSlurParams[];
    completedTies: XmlTieType[];
    verseMap: Record<number | string, number>;
    measureNumber: number;
    formattingManager: SmoFormattingManager;
    completedTupletStates: XmlCompletedTupletState[];
    tupletStatesInProgress: Record<number, XmlTupletState>;
    tickCursor: number;
    tempo: SmoTempo;
    staffArray: XmlStaffInfo[];
    staffIndex: number;
    graceNotes: SmoGraceNote[];
    currentDuration: number;
    beamGroups: Record<number, XmlBeamGroupInfo | null>;
    dynamics: XmlDynamicInfo[];
    previousNote: SmoNote;
    completedTuplets: XmlCompletedTuplet[];
    newTitle: boolean;
    divisions: number;
    keySignature: string;
    timeSignature: string;
    voiceIndex: number;
    pixelsPerTenth: number;
    musicFontSize: number;
    partId: string;
    rehearsalMark: string;
    rehearsalMarks: Record<number, string>;
    parts: Record<string, SmoPartInfo>;
    openPartGroup: XmlPartGroup | null;
    initializeForPart(): void;
    initializeForMeasure(measureElement: Element): void;
    initializeStaff(staffIndex: number, voiceIndex: number): void;
    updateStaffGroups(): void;
    addLyric(note: SmoNote, lyricData: XmlLyricData): void;
    /**
     * process a wedge aka hairpin dynamic
     * @param wedgeInfo
     */
    processWedge(wedgeInfo: XmlWedgeInfo): void;
    backtrackHairpins(smoStaff: SmoSystemStaff, staffId: number): void;
    updateDynamics(): void;
    backtrackBeamGroup(voice: XmlVoiceInfo, beamGroup: XmlBeamGroupInfo): void;
    updateBeamState(beamState: number, alteration: XmlDurationAlteration, voice: XmlVoiceInfo, voiceIndex: number): void;
    updateTieStates(tieInfos: XmlTieType[]): void;
    updateEndings(barlineNode: Element): void;
    /**
     * While parsing a measure,
     * on a slur element, either complete a started
     * slur or start a new one.
     * @param slurInfos
     */
    updateSlurStates(slurInfos: XmlSlurType[]): void;
    assignRehearsalMarks(): void;
    /**
     * After reading in a measure, update any completed slurs and make them
     * into SmoSlur and add them to the SmoSystemGroup objects.
     * staffIndexOffset is the offset from the xml staffId and the score staff Id
     * (i.e. the staves that have already been parsed in other parts)
     */
    completeSlurs(): void;
    /**
     * Go through saved start ties, try to find the endpoint of the tie.  Ties in music xml
     * are a little ambiguous, we assume we are tying to the same pitch
     * @param score
     */
    completeTies(score: SmoScore): void;
    updateTupletStates(tupletInfos: XmlTupletType[], voice: XmlVoiceInfo, staffIndex: number, voiceIndex: number): void;
    addTupletsToMeasure(smoMeasure: SmoMeasure, staffId: number, voiceId: number): void;
    private findAndRemoveCompletedTupletStatesByStaffAndVoice;
    private buildXmlTupletStateTrees;
    private sortTupletStates;
    /**
     * Create SmoTuplets out of completedTupletStates
     */
    buildSmoTupletTreesFromXmlTupletStateTrees(xmlTupletStateTrees: XmlTupletStateTreeNode[], notes: SmoNote[]): SmoTupletTree[];
    getSystems(): SmoSystemGroup[];
}
