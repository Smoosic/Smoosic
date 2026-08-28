import { SmoScoreModifierBase, ScaledPageLayout } from './scoreModifiers';
import { SmoAttrs, SmoModifierBase, ElementLike } from './common';
import { SmoSelector } from '../xform/selections';
import { FontInfo } from '../../common/vex';
/**
 * Parameters for a single text block.  Text blocks make up a text group.
 * @category SmoObject
 */
export interface SmoScoreTextParams {
    /**
     * x location of font
     */
    x: number;
    /**
     * location of font
     */
    y: number;
    /**
     * In currently supported text groups, width and height comes from the text bounding box
     * and so isn't required.
     */
    width: number;
    /**
     * In currently supported text groups, width and height comes from the text bounding box
     * and so isn't required.
     */
    height: number;
    /**
     * The text content
     */
    text: string;
    /**
     * Font of the text
     */
    fontInfo: FontInfo;
    /**
     * defaults to black
     */
    fill?: string;
    classes?: string;
}
/**
 * @category serialization
 */
export interface SmoScoreTextSer extends SmoScoreTextParams {
    /**
     * class name for deserialization
     */
    ctor: string;
}
/**
 * Identify some text in the score, not associated with any musical element, like page
 * decorations, titles etc.
 * Note: score text is always contained in a text group.  So this isn't directly accessed
 * by score, but we keep the collection in score for backwards-compatibility
 * @category SmoObject
 */
export declare class SmoScoreText extends SmoScoreModifierBase {
    static fontPointSize(size: string | number | undefined): number;
    /**
     * Convert a numeric or string weight into either 'bold' or 'normal'
     * @param fontWeight
     * @returns
     */
    static weightString(fontWeight: string | number | undefined): string;
    static familyString(fam: string | undefined): string;
    static get fontFamilies(): Record<string, string>;
    static get parameters(): string[];
    static get defaults(): SmoScoreTextParams;
    static deserialize(jsonObj: SmoScoreTextSer): SmoScoreText;
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    fontInfo: FontInfo;
    fill: string;
    classes: string;
    scaleX: number;
    scaleY: number;
    getText(): string;
    estimateWidth(): number;
    tryParseUnicode(): void;
    offsetX(offset: number): void;
    offsetY(offset: number): void;
    serialize(): SmoScoreTextSer;
    static get attributes(): string[];
    static get simpleAttributes(): string[];
    constructor(parameters: SmoScoreTextParams);
}
/**
 * Each text block has the text data itself and some data about how it's placed
 * @category SmoObject
 */
export interface SmoTextBlock {
    /**
     * The score text
     */
    text: SmoScoreText;
    /**
     * position relative to other blocks
     */
    position: number;
    /**
     * run-time flag
     */
    activeText: boolean;
}
/**
 * @category SmoObject
 */
export interface SmoTextBlockSer {
    /**
     * The score text
     */
    text: SmoScoreTextSer;
    /**
     * position relative to other blocks
     */
    position: number;
}
/**
 * Used to place text imported from other formats, e.g. music xml
 * @category SmoObject
 */
export interface SmoTextPlacement {
    fontFamily: string;
    fontSize: number;
    xPlacement: number;
    yOffset: number;
}
/**
 * Constructor parameters for a text group, a block of text in Smoosic
 * @param justification one of {@link SmoTextGroup.justifications}
 * @param relativePosition relative position to other text groups
 * @param pagination indicates if this text is paginated (goes on each page)
 * @param spacing distance between blocks
 * @param attachToSelector acts like 'note text' if attached to a note, otherwise
 *   the position is based on score position, or page position if paginated
 * @param selector if attached, the selector in question
 * @param textBlocks the actual textBlocks of text - a score text along with a placement parameter
 * @category SmoObject
 */
export interface SmoTextGroupParams {
    justification: number;
    relativePosition: number;
    pagination: number;
    purpose: number;
    spacing: number;
    musicXOffset: number;
    musicYOffset: number;
    attachToSelector: boolean;
    selector: SmoSelector;
    textBlocks: SmoTextBlock[];
}
/**
 * The serializable parts of a text group.
 * @category serialization
 */
export interface SmoTextGroupParamsSer {
    /**
     * class name for deserialization
     */
    ctor: string;
    /**
     * ID so we can identify which text this is in dialogs, UI
     */
    attrs: SmoAttrs;
    /**
     * justification within the block
     */
    justification?: number;
    /**
     * position (above, left, right etc)
     */
    relativePosition?: number;
    /**
     * pagination for headers, footers
     */
    pagination?: number;
    /**
     * spacing between blocks, future
     */
    spacing?: number;
    /**
     * true if the text is attached to a note.
     */
    attachToSelector?: boolean;
    /**
     * defined if the selector is attached to a note
     */
    selector?: SmoSelector;
    /**
     * the individual text blocks
     */
    textBlocks: SmoTextBlockSer[];
}
/**
 * Suggestion for text purpose, maybe used to find a match..maybe not used at all
 */
export type SmoTextGroupPurpose = 'NONE' | 'TITLE' | 'SUBTITLE' | 'COMPOSER' | 'COPYRIGHT';
/**
 * @category SmoObject
 */
export interface SmoTextGroupContainer {
    updateTextGroup: (textGroup: SmoTextGroup, toAdd: boolean) => void;
    addTextGroup: (textGroup: SmoTextGroup) => void;
    removeTextGroup: (textGroup: SmoTextGroup) => void;
}
/**
 * A grouping of text that can be used as a block for
 * justification, alignment etc.
 * @category SmoObject
 */
export declare class SmoTextGroup extends SmoScoreModifierBase {
    static get justifications(): {
        LEFT: number;
        RIGHT: number;
        CENTER: number;
    };
    static get paginations(): {
        EVERY: number;
        EVENT: number;
        ODD: number;
        ONCE: number;
        SUBSEQUENT: number;
    };
    static get relativePositions(): {
        ABOVE: number;
        BELOW: number;
        LEFT: number;
        RIGHT: number;
    };
    static get purposes(): Record<SmoTextGroupPurpose, number>;
    static get attributes(): string[];
    static get nonTextAttributes(): string[];
    static get simpleAttributes(): string[];
    static isTextGroup(modifier: SmoTextGroup | SmoModifierBase): modifier is SmoTextGroup;
    static get purposeToFont(): Record<number | string, SmoTextPlacement>;
    static createTextForLayout(purpose: number, text: string, layout: ScaledPageLayout): SmoTextGroup;
    static get defaults(): SmoTextGroupParams;
    justification: number;
    relativePosition: number;
    pagination: number;
    purpose: number;
    spacing: number;
    attachToSelector: boolean;
    selector?: SmoSelector;
    musicXOffset: number;
    musicYOffset: number;
    elements: ElementLike[];
    textBlocks: SmoTextBlock[];
    edited: boolean;
    skipRender: boolean;
    static deserialize(jObj: SmoTextGroupParamsSer): SmoTextGroup;
    static deserializePreserveId(jObj: any): SmoTextGroup;
    static getPagedTextGroups(tg: SmoTextGroup, pages: number, pageHeight: number): SmoTextGroup[];
    serialize(): SmoTextGroupParamsSer;
    constructor(params: SmoTextGroupParams);
    scaleText(scale: number): void;
    /**
     * Remove empty text blocks introduced when editing
     */
    trimEmptyBlocks(): void;
    tryParseUnicode(): void;
    estimateWidth(): number;
    isTextVisible(): boolean;
    setActiveBlock(scoreText: SmoScoreText | null): void;
    getActiveBlock(): SmoScoreText;
    setRelativePosition(position: number): void;
    firstBlock(): SmoScoreText;
    indexOf(scoreText: SmoScoreText): number;
    addScoreText(scoreText: SmoScoreText, position?: number): void;
    ul(): {
        x: number;
        y: number;
    };
    removeBlock(scoreText: SmoScoreText): void;
    offsetX(offset: number): void;
    offsetY(offset: number): void;
}
