import { OutlineInfo } from './svgHelpers';
import { SmoTextGroup, SmoScoreText } from '../../smo/data/scoreText';
import { SuiScroller } from './scroller';
import { SmoAttrs, SvgBox, ElementLike } from '../../smo/data/common';
import { SvgPage, SvgPageMap } from './svgPageMap';
import { TextFormatter } from '../../common/textformatter';
/**
 * parameters to render text
 * @category SuiRender
 */
export interface SuiInlineTextParams {
    fontFamily: string;
    fontWeight: string;
    fontSize: number;
    fontStyle: string;
    startX: number;
    startY: number;
    scroller: SuiScroller;
    purpose: string;
    context: SvgPage;
    pageMap: SvgPageMap;
}
/**
 * metrics for a single line of text.  A textGroup can be composed
 * of multiple inline blocks.
 * @category SuiRender
 */
export interface SuiInlineBlock {
    symbolType: number;
    textType: number;
    highlighted: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
    metrics: any;
    glyph: any;
    glyphCode: string;
    text: string;
}
/**
 * @category SuiRender
 */
export interface SuiInlineArtifact {
    block: SuiInlineBlock;
    box: SvgBox;
    index: number;
}
/**
 * Inline text is a block of SVG text with the same font.  Each block can
 * contain either text or an svg (vex) glyph.  Each block in the text has its own
 * metrics so we can support inline svg text editors (cursor).
 * @category SuiRender
 */
export declare class SuiInlineText {
    static get textTypes(): {
        normal: number;
        superScript: number;
        subScript: number;
    };
    static get symbolTypes(): {
        GLYPH: number;
        TEXT: number;
        LINE: number;
    };
    static get textPurposes(): Record<string, string>;
    static textTypeFromChar(char: string): number;
    static textTypeToChar(textType: number): string;
    static get textTypeTransitions(): number[][];
    static getTextTypeResult(oldType: number, newType: number): number;
    static getTextTypeTransition(oldType: number, result: number): number;
    get spacing(): number;
    static get defaults(): SuiInlineTextParams;
    fontFamily: string;
    fontWeight: string;
    fontStyle: string;
    fontSize: number;
    width: number;
    height: number;
    purpose: string;
    attrs: SmoAttrs;
    textFont: TextFormatter;
    startX: number;
    startY: number;
    blocks: SuiInlineBlock[];
    updatedMetrics: boolean;
    context: SvgPage;
    pageMap: SvgPageMap;
    scroller: SuiScroller;
    artifacts: SuiInlineArtifact[];
    logicalBox: SvgBox;
    element: ElementLike;
    updateFontInfo(): TextFormatter;
    constructor(params: SuiInlineTextParams);
    static fromScoreText(scoreText: SmoScoreText, context: SvgPage, pageMap: SvgPageMap, scroller: SuiScroller): SuiInlineText;
    static get blockDefaults(): SuiInlineBlock;
    get pointsToPixels(): number;
    offsetStartX(offset: number): void;
    offsetStartY(offset: number): void;
    maxFontHeight(scale: number): number;
    _glyphOffset(block: SuiInlineBlock): number;
    /**
     * Based on the font metrics, compute the width of the strings and glyph that make up
     * this block
     */
    _calculateBlockIndex(): void;
    getLogicalBox(): SvgBox;
    renderCursorAt(position: number, textType: number): void;
    removeCursor(): void;
    unrender(): void;
    getIntersectingBlocks(box: SvgBox): SuiInlineArtifact[];
    _addBlockAt(position: number, block: SuiInlineBlock): void;
    removeBlockAt(position: number): void;
    addTextBlockAt(position: number, params: SuiInlineBlock): void;
    _getGlyphBlock(params: SuiInlineBlock): SuiInlineBlock;
    addGlyphBlockAt(position: number, params: SuiInlineBlock): void;
    isSuperscript(block: SuiInlineBlock): boolean;
    isSubcript(block: SuiInlineBlock): boolean;
    getHighlight(block: SuiInlineBlock): boolean;
    setHighlight(block: SuiInlineBlock, value: boolean): void;
    rescale(scale: number): void;
    render(): void;
    _drawBlock(block: SuiInlineBlock): void;
    getText(): string;
}
/**
 * @category SuiRender
 */
export interface SuiTextBlockBlock {
    text: SuiInlineText;
    position: number;
    activeText: boolean;
}
/**
 * @category SuiRender
 */
export interface SuiTextBlockParams {
    blocks: SuiTextBlockBlock[];
    scroller: SuiScroller;
    spacing: number;
    context: SvgPage;
    skipRender: boolean;
    justification: number;
    beingEdited?: boolean;
}
/**
 * Fixed, non-configurable opacity used to visually mark the one text group
 * currently open in the text edit dialog (SmoTextGroup.beingEdited), so it
 * remains legible but is clearly distinguishable from full-opacity text
 * elsewhere on the score.
 * @category SuiRender
 */
export declare const TEXT_GROUP_EDITING_OPACITY = 0.55;
/**
 * @category SuiRender
 */
export interface SuiTextBlockJusityCalc {
    blocks: SuiInlineText[];
    minx: number;
    maxx: number;
    width: number;
}
/**
 * SVG representation of SmoTextGroup
 * @category SuiRender
 */
export declare class SuiTextBlock {
    static get relativePosition(): {
        ABOVE: number;
        BELOW: number;
        LEFT: number;
        RIGHT: number;
    };
    inlineBlocks: SuiTextBlockBlock[];
    scroller: SuiScroller;
    spacing: number;
    context: SvgPage;
    skipRender: boolean;
    currentBlockIndex: number;
    justification: number;
    outlineRect: OutlineInfo | null;
    currentBlock: SuiTextBlockBlock | null;
    logicalBox: SvgBox;
    beingEdited: boolean;
    constructor(params: SuiTextBlockParams);
    render(): void;
    _outlineBox(context: any, box: SvgBox): void;
    offsetStartX(offset: number): void;
    offsetStartY(offset: number): void;
    get x(): number;
    get y(): number;
    static blockFromScoreText(scoreText: SmoScoreText, context: SvgPage, pageMap: SvgPageMap, position: number, scroller: SuiScroller): SuiTextBlockBlock;
    getLogicalBox(): SvgBox;
    _calculateBoundingClientRect(): SvgBox;
    static fromTextGroup(tg: SmoTextGroup, context: SvgPage, pageMap: SvgPageMap, scroller: SuiScroller): SuiTextBlock;
    unrender(): void;
    _justify(): void;
}
