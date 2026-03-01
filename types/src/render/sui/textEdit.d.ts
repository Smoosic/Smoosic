import { SuiInlineText, SuiTextBlock } from './textRender';
import { SuiRenderState } from './renderState';
import { SuiScroller } from './scroller';
import { layoutDebug } from './layoutDebug';
import { OutlineInfo, StrokeInfo } from './svgHelpers';
import { SmoScoreText, SmoTextGroup } from '../../smo/data/scoreText';
import { SmoLyric } from '../../smo/data/noteModifiers';
import { SmoSelector } from '../../smo/xform/selections';
import { SvgBox, KeyEvent } from '../../smo/data/common';
import { SmoNote } from '../../smo/data/note';
import { SmoScore } from '../../smo/data/score';
import { SmoSelection } from '../../smo/xform/selections';
import { SvgPage } from './svgPageMap';
import { SuiScoreViewOperations } from './scoreViewOperations';
import { SvgPageMap } from './svgPageMap';
/**
 * Basic parameters to create a text editor
 * @category SuiRender
 * @param context Vex renderer context
 * @param scroller
 * @param x initial x position
 * @param y initial y position
 * @param text initial text
 */
export interface SuiTextEditorParams {
    pageMap: SvgPageMap;
    context: SvgPage;
    scroller: SuiScroller;
    x: number;
    y: number;
    text: string;
}
/**
 * @category SuiRender
 */
export interface SuiLyricEditorParams extends SuiTextEditorParams {
    lyric: SmoLyric;
}
/**
 * @category SuiRender
 */
export interface SuiTextSessionParams {
    scroller: SuiScroller;
    renderer: SuiRenderState;
    scoreText: SmoScoreText;
    text: string;
    x: number;
    y: number;
    textGroup: SmoTextGroup;
}
/**
 * @category SuiRender
 */
export interface SuiLyricSessionParams {
    score: SmoScore;
    renderer: SuiRenderState;
    scroller: SuiScroller;
    view: SuiScoreViewOperations;
    verse: number;
    selector: SmoSelector;
}
export type SuiTextStrokeName = 'text-suggestion' | 'text-selection' | 'text-highlight' | 'text-drag' | 'inactive-text';
/**
 * The heirarchy of text editing objects goes:
 *
 * `dialog -> component -> session -> editor`
 *
 * Editors and Sessions are defined in this module.
 * ### editor
 * handles low-level events and renders the preview using one
 * of the text layout objects.
 * ### session
 * creates and destroys editors, e.g. for lyrics that have a Different
 * editor instance for each note.
 *
 * ## SuiTextEditor
 * The base text editor handles the positioning and inserting
 * of text blocks into the text area.  The derived class shoud interpret key events.
 * A container class will manage the session for starting/stopping the editor
 * and retrieving the results into the target object.
 * @category SuiRender
 * */
export declare class SuiTextEditor {
    static get States(): Record<string, number>;
    static textTypeToChar(textType: number): string;
    static textTypeFromChar(char: string): number;
    svgText: SuiInlineText | null;
    context: SvgPage;
    debug: layoutDebug;
    outlineInfo: OutlineInfo | null;
    pageMap: SvgPageMap;
    x: number;
    y: number;
    text: string;
    textPos: number;
    selectionStart: number;
    selectionLength: number;
    empty: boolean;
    scroller: SuiScroller;
    suggestionIndex: number;
    cursorState: boolean;
    cursorRunning: boolean;
    textType: number;
    fontWeight: string;
    fontFamily: string;
    fontSize: number;
    state: number;
    suggestionRect: OutlineInfo | null;
    constructor(params: SuiTextEditorParams);
    static get strokes(): Record<SuiTextStrokeName, StrokeInfo>;
    _suggestionParameters(box: SvgBox, strokeName: SuiTextStrokeName): OutlineInfo;
    _expandSelectionToSuggestion(): void;
    _setSelectionToSugggestion(): void;
    rerender(): void;
    handleMouseEvent(ev: any): boolean;
    _serviceCursor(): void;
    _refreshCursor(): void;
    get _endCursorCondition(): boolean;
    _cursorPreResolve(): void;
    _cursorPoll(): void;
    startCursorPromise(): Promise<void>;
    stopCursor(): void;
    setTextPos(val: number): void;
    moveCursorRight(): void;
    moveCursorLeft(): void;
    _updateSelections(): void;
    _checkGrowSelectionLeft(): void;
    _checkGrowSelectionRight(): void;
    growSelectionLeft(): void;
    growSelectionRight(): void;
    _clearSelections(): void;
    deleteSelections(): void;
    parseBlocks(): void;
    evKey(evdata: KeyEvent): Promise<boolean>;
}
/**
 * @category SuiRender
 */
export declare class SuiTextBlockEditor extends SuiTextEditor {
    constructor(params: SuiTextEditorParams);
    _highlightEditor(): void;
    getText(): string;
    evKey(evdata: any): Promise<boolean>;
    stopEditor(): void;
}
export declare class SuiLyricEditor extends SuiTextEditor {
    static get States(): {
        RUNNING: number;
        STOPPING: number;
        STOPPED: number;
    };
    parseBlocks(): void;
    getText(): string;
    lyric: SmoLyric;
    state: number;
    constructor(params: SuiLyricEditorParams);
    stopEditor(): void;
}
/**
 * @category SuiRender
 */
export declare class SuiChordEditor extends SuiTextEditor {
    static get States(): {
        RUNNING: number;
        STOPPING: number;
        STOPPED: number;
    };
    static get SymbolModifiers(): {
        NONE: number;
        SUBSCRIPT: number;
        SUPERSCRIPT: number;
    };
    static toTextTypeChar(oldTextType: number, newTextType: number): string;
    static toTextTypeTransition(oldTextType: number, result: number): string;
    setTextType(textType: number): void;
    _updateSymbolModifiers(): void;
    _setSymbolModifier(char: string): boolean;
    parseBlocks(): void;
    getText(): string;
    _addGlyphAt(ix: number, code: string): void;
    unrender(): void;
    evKey(evdata: any): Promise<boolean>;
    lyric: SmoLyric;
    constructor(params: SuiLyricEditorParams);
    stopEditor(): void;
    _markStopped(): void;
}
export interface SuiDragSessionParams {
    context: SvgPageMap;
    scroller: SuiScroller;
    textGroup: SmoTextGroup;
    debug: layoutDebug;
}
/**
 * @category SuiRender
 */
export declare class SuiDragSession {
    pageMap: SvgPageMap;
    page: SvgPage;
    scroller: SuiScroller;
    outlineBox: SvgBox;
    textObject: SuiTextBlock;
    dragging: boolean;
    outlineRect: OutlineInfo | null;
    textGroup: SmoTextGroup;
    debug: layoutDebug;
    constructor(params: SuiDragSessionParams);
    _outlineBox(): void;
    unrender(): void;
    scrolledClientBox(x: number, y: number): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    checkBounds(): void;
    startDrag(e: any): void;
    mouseMove(e: any): void;
    endDrag(): void;
}
/**
 * session for editing plain text
 * @category SuiRender
 */
export declare class SuiTextSession {
    static get States(): {
        RUNNING: number;
        STOPPING: number;
        STOPPED: number;
        PENDING_EDITOR: number;
    };
    scroller: SuiScroller;
    scoreText: SmoScoreText;
    text: string;
    x: number;
    y: number;
    textGroup: SmoTextGroup;
    fontFamily: string;
    fontWeight: string;
    fontSize: number;
    state: number;
    editor: SuiTextBlockEditor | null;
    renderer: SuiRenderState;
    cursorPromise: Promise<any> | null;
    debug: layoutDebug;
    constructor(params: SuiTextSessionParams);
    get _isRefreshed(): boolean;
    get isStopped(): boolean;
    get isRunning(): boolean;
    _markStopped(): void;
    get _isRendered(): boolean;
    _removeScoreText(): void;
    startSession(): void;
    stopSession(): Promise<void>;
    evKey(evdata: KeyEvent): Promise<boolean>;
    handleMouseEvent(ev: any): void;
}
/**
 * Manage editor for lyrics, jupmping from note to note if asked
 * @category SuiRender
 */
export declare class SuiLyricSession {
    static get States(): {
        RUNNING: number;
        STOPPING: number;
        STOPPED: number;
        PENDING_EDITOR: number;
    };
    score: SmoScore;
    renderer: SuiRenderState;
    scroller: SuiScroller;
    view: SuiScoreViewOperations;
    parser: number;
    verse: number;
    selector: SmoSelector;
    selection: SmoSelection | null;
    note: SmoNote | null;
    originalText: string;
    lyric: SmoLyric | null;
    text: string;
    editor: SuiLyricEditor | null;
    state: number;
    cursorPromise: Promise<any> | null;
    debug: layoutDebug;
    constructor(params: SuiLyricSessionParams);
    _setLyricForNote(): void;
    get _endLyricCondition(): boolean;
    get _isRefreshed(): boolean;
    get _isRendered(): boolean;
    get _pendingEditor(): boolean;
    _hideLyric(): void;
    get isStopped(): boolean;
    get isRunning(): boolean;
    _markStopped(): void;
    _startSessionForNote(): void;
    startSession(): void;
    stopSession(): Promise<void>;
    _advanceSelection(isShift: boolean): Promise<void>;
    advanceSelection(isShift: boolean): Promise<void>;
    removeLyric(): Promise<void>;
    _updateLyricFromEditor(): Promise<void>;
    evKey(evdata: any): Promise<boolean>;
    get textType(): number;
    set textType(type: number);
    handleMouseEvent(ev: any): void;
}
/**
 * @category SuiRender
 */
export declare class SuiChordSession extends SuiLyricSession {
    editor: SuiLyricEditor | null;
    constructor(params: SuiLyricSessionParams);
    evKey(evdata: KeyEvent): Promise<boolean>;
    _setLyricForNote(): void;
    _startSessionForNote(): void;
}
