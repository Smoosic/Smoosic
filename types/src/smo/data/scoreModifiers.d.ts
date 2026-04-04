import { SmoMeasureFormat, SmoMeasureFormatParamsSer } from './measureModifiers';
import { SmoAttrs, SmoModifierBase, SvgBox } from './common';
import { SmoMeasure } from './measure';
import { SmoSelector } from '../xform/selections';
/**
 * Base class for all {@link SmoScore} modifiers.
 * It is used to de/serialize the objects.
 * @category SmoObject
 */
export declare abstract class SmoScoreModifierBase implements SmoModifierBase {
    /**
     * constructor
     *
     * @type {string}
     * @memberof SmoScoreModifierBase
     */
    ctor: string;
    /**
     * When rendered, keep track of the box
     *
     * @type {(SvgBox | null)}
     * @memberof SmoScoreModifierBase
     */
    logicalBox: SvgBox | null;
    /**
     * attributes for identification
     *
     * @type {SmoAttrs}
     * @memberof SmoScoreModifierBase
     */
    attrs: SmoAttrs;
    constructor(ctor: string);
    abstract serialize(): any;
    static deserialize(jsonObj: any): any;
}
/**
 * For global/default font settings.
 * @category SmoObject
 * @param name to distinguish: chord, lyric etc.
 * @param family font family
 * @param size in points
 * @param custom used to distinguish a specific text is not the default
 */
export interface FontPurpose {
    /**
     * name of the purpose
     * { ENGRAVING: 1, SCORE: 2, CHORDS: 3, LYRICS: 4 }
     */
    name: string;
    /**
     * purpose enumeration
     */
    purpose: number;
    /**
     * font family
     */
    family: string;
    /**
     * default font size
     */
    size: number;
    /**
     * a flag that can be used to indicate if this is the global default, or a customization.
     * For lyrics for instance, most lyrics would use the custom font, this would be true if
     * it was overridden
     */
    custom: boolean;
}
export type SmoScoreInfoKey = 'name' | 'title' | 'subTitle' | 'composer' | 'copyright';
export declare const SmoScoreInfoKeys: string[];
/**
 * Information about the score itself, like composer etc.
 * @category SmoObject
 */
export interface SmoScoreInfo {
    /**
     * deprecated, now defaults to title
     */
    name: string;
    /**
     * name of score
     */
    title: string;
    /**
     * subtitle/opus
     */
    subTitle: string;
    /**
     * who wrote it
     */
    composer: string;
    /**
     * copyright information
     */
    copyright: string;
    /**
     * for version tracking
     */
    version: number;
}
export type SmoScorePreferenceBool = 'autoPlay' | 'autoAdvance' | 'showPiano' | 'hideEmptyLines' | 'transposingScore' | 'autoScrollPlayback' | 'showPartNames';
export type SmoScorePreferenceNumber = 'defaultDupleDuration' | 'defaultTripleDuration';
export declare const SmoScorePreferenceBools: SmoScorePreferenceBool[];
export declare const SmoScorePreferenceNumbers: SmoScorePreferenceNumber[];
/**
 * Global score/program behavior preferences, see below for parameters
 * @category SmoObject
 */
export interface SmoScorePreferencesParams {
    autoPlay: boolean;
    autoAdvance: boolean;
    autoScrollPlayback: boolean;
    defaultDupleDuration: number;
    defaultTripleDuration: number;
    showPiano: boolean;
    hideEmptyLines: boolean;
    transposingScore: boolean;
    showPartNames: boolean;
    horizontalDisplay?: boolean;
}
/**
 * Some default SMO behavior
 * @param autoPlay play a new note or chord
 * @param autoAdvance Sibelius-like behavior of advancing cursor when a letter note is placed
 * @param defaultDupleDuration in ticks, even metered measures
 * @param defaultTripleDuration in ticks, 6/8 etc.
 * @param showPiano show the piano widget in the score
 * @param hideEmptyLines Hide empty lines in full score
 * @param transposingScore Whether to show the score parts in concert key
 * @category SmoObject
 */
export declare class SmoScorePreferences {
    autoPlay: boolean;
    autoAdvance: boolean;
    defaultDupleDuration: number;
    defaultTripleDuration: number;
    showPiano: boolean;
    hideEmptyLines: boolean;
    autoScrollPlayback: boolean;
    transposingScore: boolean;
    showPartNames: boolean;
    horizontalDisplay: boolean;
    static get defaults(): SmoScorePreferencesParams;
    constructor(params: SmoScorePreferencesParams);
    serialize(): SmoScorePreferencesParams;
}
/**
 * non-musical information about the score
 * @category serialization
 */
export interface ScoreMetadataSer {
    fonts: FontPurpose[];
    preferences: SmoScorePreferencesParams;
    renumberingMap: Record<string, string>;
    scoreInfo: SmoScoreInfo;
}
/**
 * Map of measure formatting to measure IDs.  We only save non-default formats
 * @category SmoObject
 * @param measureFormats
 * @param partIndex
 */
export interface SmoFormattingManagerParams {
    /**
     * map of index to {@link SmoMeasureFormat} objects
     */
    measureFormats?: SmoMeasureFormat[];
    /**
     * the associated part, or -1 for the score
     */
    partIndex?: number;
}
/**
 * A score can have different views - one for the score itself and one for each
 * part, and each part can have its own formatting and text.
 * *Note*: I may move this to part info module.
 * @param measureFormats map of index to {@link SmoMeasureFormat} objects
 * @param partIndex the associated part, or -1 for the score
 * @category SmoObject
 */
export declare class SmoFormattingManager extends SmoScoreModifierBase {
    measureFormats: Record<number, SmoMeasureFormat>;
    partIndex: number;
    static get forScore(): number;
    static get defaults(): SmoFormattingManagerParams;
    constructor(params: SmoFormattingManagerParams);
    /**
     * Update the measure format for the measure at the given index
     * @param format
     */
    updateMeasureFormat(format: SmoMeasureFormat, measureIndex: number): void;
    /**
     * Update the measure format based on the format of a given measure
     * @param measure
     */
    updateFormat(measure: SmoMeasure): void;
    serialize(): SmoMeasureFormatParamsSer[];
}
export type SmoAudioPlayerType = 'sampler' | 'synthesizer';
/**
 * Constructor parameters for audio player
 * @category SmoObject
 */
export interface SmoAudioPlayerParameters {
    playerType?: SmoAudioPlayerType;
    waveform?: OscillatorType;
    reverbEnable?: boolean;
    reverbDelay?: number;
    reverbDecay?: number;
}
/**
 * web audio API defines this
 * @param otype
 * @returns
 */
export declare function IsOscillatorType(otype: OscillatorType | string): otype is OscillatorType;
/**
 * Audio playback parameters.  Just fun stuff.
 * @category SmoObject
 */
export declare class SmoAudioPlayerSettings extends SmoScoreModifierBase {
    static get defaults(): SmoAudioPlayerParameters;
    static get attributes(): string[];
    playerType: SmoAudioPlayerType;
    waveform: OscillatorType;
    reverbEnable: boolean;
    reverbDelay: number;
    reverbDecay: number;
    constructor(params: SmoAudioPlayerParameters);
    serialize(): any;
}
export type ScaledPageAttributes = 'leftMargin' | 'rightMargin' | 'topMargin' | 'bottomMargin' | 'interGap' | 'intraGap';
/**
 * Constructor parameters for {@link SmoPageLayout}, part of {@link SmoLayoutManager}
 * @category SmoObject
 */
export interface SmoPageLayoutParams {
    leftMargin: number;
    rightMargin: number;
    topMargin: number;
    bottomMargin: number;
    interGap: number;
    intraGap: number;
}
/**
 * Define margins and other layout information associated with a specific page, and may
 * be different on different pages.
 * @category SmoObject
 */
export declare class SmoPageLayout extends SmoScoreModifierBase {
    static get defaults(): SmoPageLayoutParams;
    static get attributes(): ScaledPageAttributes[];
    leftMargin: number;
    rightMargin: number;
    topMargin: number;
    bottomMargin: number;
    interGap: number;
    intraGap: number;
    constructor(params: SmoPageLayoutParams);
    serialize(): any;
}
export type displayMode = 'vertical' | 'horizontal';
export type ScaledGlobalAttributes = 'pageWidth' | 'pageHeight';
export type GlobalLayoutAttributes = 'pageWidth' | 'pageHeight' | 'noteSpacing' | 'svgScale' | 'zoomScale' | 'proportionality' | 'maxMeasureSystem' | 'displayMode';
export type GlobalLayoutNumberAttributes = 'pageWidth' | 'pageHeight' | 'noteSpacing' | 'svgScale' | 'zoomScale' | 'proportionality' | 'maxMeasureSystem';
export declare const GlobalLayoutAttributesArray: GlobalLayoutAttributes[];
export declare const GlobalLayoutNumberAttributesArray: GlobalLayoutNumberAttributes[];
/**
 * Global layout are parameters that determine the layout of the whole score, because they affect the containing svg element
 * @category SmoObject
 */
export interface SmoGlobalLayout {
    svgScale: number;
    zoomScale: number;
    noteSpacing: number;
    pageWidth: number;
    pageHeight: number;
    proportionality: number;
    maxMeasureSystem: number;
    displayMode: displayMode;
}
export declare function isSmoGlobalLayout(params: Partial<SmoGlobalLayout>): params is SmoGlobalLayout;
/**
 * Used to create {@link SmoLayoutManagerParams}
 * @category SmoObject
 */
export interface ScaledPageLayout {
    svgScale: number;
    zoomScale: number;
    noteSpacing: number;
    pageWidth: number;
    pageHeight: number;
    leftMargin: number;
    rightMargin: number;
    topMargin: number;
    bottomMargin: number;
    interGap: number;
    intraGap: number;
    pages: number;
    maxMeasureSystem: number;
}
/**
 * Constructor parameters for {@link SmoLayoutManager}
 * @category SmoObject
 */
export interface SmoLayoutManagerParams {
    /**
     * global svg settings for zoom, page width/height
     */
    globalLayout: SmoGlobalLayout;
    /**
     * page margins for each page
     */
    pageLayouts: SmoPageLayout[];
}
/**
 * @category serialization
 */
export interface SmoLayoutManagerParamsSer {
    /**
     * constructor
     */
    ctor: string;
    /**
     * global svg settings for zoom, page width/height
     */
    globalLayout: SmoGlobalLayout;
    /**
     * page margins for each page
     */
    pageLayouts: SmoPageLayoutParams[];
}
/**
 * Storage and utilities for layout information in the score.  Each
 * manager has one set of page height/width, since svg element
 * must have single length/width and viewbox.
 * Each page can have different margins.
 * @category SmoObject
 */
export declare class SmoLayoutManager extends SmoScoreModifierBase {
    static get defaultLayout(): SmoGlobalLayout;
    static get defaults(): SmoLayoutManagerParams;
    static get attributes(): GlobalLayoutAttributes[];
    static get scaledPageAttributes(): ScaledPageAttributes[];
    static get scaledGlobalAttributes(): ScaledGlobalAttributes[];
    static areLayoutsEqual(g1: SmoGlobalLayout, g2: SmoGlobalLayout): boolean;
    static isZoomChange(g1: SmoGlobalLayout, g2: SmoGlobalLayout): boolean;
    /**
     * Adjust zoom width so the score takes up the whole score area
     */
    zoomToWidth(screenWidth: number): void;
    static getScaledPageLayout(globalLayout: SmoGlobalLayout, pageLayout: SmoPageLayout, pages: number): ScaledPageLayout;
    globalLayout: SmoGlobalLayout;
    pageLayouts: SmoPageLayout[];
    constructor(params: SmoLayoutManagerParams);
    trimPages(pageCount: number): void;
    getZoomScale(): number;
    serialize(): SmoLayoutManagerParamsSer;
    updateGlobalLayout(params: SmoGlobalLayout): void;
    addToPageLayouts(pageNum: number): void;
    getGlobalLayout(): SmoGlobalLayout;
    getScaledPageLayout(pageIndex: number): ScaledPageLayout;
    getPageLayout(pageIndex: number): SmoPageLayout;
    getPageLayouts(): SmoPageLayout[];
    updatePage(pageLayout: SmoPageLayout, pageIndex: number): void;
}
/**
 * constructor parameters for system groups (groupings of staves in the score)
 * @param leftConnector
 * @param rightConnector
 * @param mapType
 * @param text
 * @param shortText
 * @param justify
 * @param startSelector not used
 * @param endSelector not used
 * @category SmoObject
 */
export interface SmoSystemGroupParams {
    /**
     * bracket etc.
     */
    leftConnector: number;
    /**
     * bracket etc.
     */
    rightConnector: number;
    /**
     * future, score groups can be different for different parts of the score
     */
    mapType: number;
    /**
     * whether to justify the notes in the group
     */
    justify: boolean;
    /**
     * if mapped to a range, start
     */
    startSelector: SmoSelector;
    /**
     * if mapped to a range, end
     */
    endSelector: SmoSelector;
}
/**
 * @category serialization
 */
export interface SmoSystemGroupParamsSer extends SmoSystemGroupParams {
    /**
     * constructor
     */
    ctor: string;
}
/**
 * System group is the grouping of staves into a system.
 * @category SmoObject
 *  */
export declare class SmoSystemGroup extends SmoScoreModifierBase {
    static get connectorTypes(): Record<string, number>;
    static get connectorTypeNames(): Record<number, string>;
    static get mapTypes(): Record<string, number>;
    static get attributes(): string[];
    static get defaults(): SmoSystemGroupParams;
    static isSystemGroup(modifier: SmoSystemGroup | SmoModifierBase): modifier is SmoSystemGroup;
    leftConnector: number;
    rightConnector: number;
    mapType: number;
    text: string;
    shortText: string;
    justify: boolean;
    startSelector: SmoSelector;
    endSelector: SmoSelector;
    attrs: SmoAttrs;
    constructor(params: SmoSystemGroupParams);
    stavesOverlap(group: SmoSystemGroup): boolean;
    measuresOverlap(group: SmoSystemGroup): boolean;
    overlaps(group: SmoSystemGroup): boolean;
    serialize(): SmoSystemGroupParamsSer;
}
export declare const scoreModifierDynamicCtorInit: () => void;
