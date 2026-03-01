/**
 * Classes to support the state machine associated with background music rendering.
 * @module renderState
 */
import { SmoMeasure } from '../../smo/data/measure';
import { UndoBuffer } from '../../smo/xform/undo';
import { SmoSelection } from '../../smo/xform/selections';
import { SmoScore } from '../../smo/data/score';
import { SmoTextGroup } from '../../smo/data/scoreText';
import { SuiMapper, SuiRendererBase } from './mapper';
import { SuiScoreRender, ScoreRenderParams } from './scoreRender';
import { layoutDebug } from './layoutDebug';
import { SuiNavigation } from './configuration';
export declare var scoreChangeEvent: string;
/**
 * Manage the state of the score rendering.  The score can be rendered either completely,
 * or partially for editing.  This class works with the RenderDemon to decide when to
 * render the score after it has been modified, and keeps track of what the current
 * render state is (dirty, etc.)
 * @category SuiRender
 * */
export declare class SuiRenderState implements SuiRendererBase {
    static debugMask: number;
    dirty: boolean;
    replaceQ: SmoSelection[];
    stateRepCount: 0;
    viewportChanged: boolean;
    _resetViewport: boolean;
    measureMapper: SuiMapper | null;
    passState: number;
    _score: SmoScore | null;
    _backupZoomScale: number;
    renderer: SuiScoreRender;
    idleRedrawTime: number;
    idleLayoutTimer: number;
    demonPollTime: number;
    handlingRedraw: boolean;
    suspendRendering: boolean;
    undoBuffer: UndoBuffer;
    navigation: SuiNavigation;
    undoStatus: number;
    debug: layoutDebug;
    constructor(config: ScoreRenderParams);
    get elementId(): any;
    get pageMap(): import("./svgPageMap").SvgPageMap;
    setMeasureMapper(mapper: SuiMapper): void;
    set stepMode(value: boolean);
    static get passStates(): Record<string, number>;
    get renderElement(): Element;
    notifyFontChange(): void;
    addToReplaceQueue(selection: SmoSelection | SmoSelection[]): void;
    addColumnToReplaceQueue(mm: number): void;
    setDirty(): void;
    setRefresh(): void;
    rerenderAll(): void;
    clearLine(measure: SmoMeasure): void;
    get renderStateClean(): boolean;
    get renderStateRendered(): boolean;
    /**
     * Do a quick re-render of a measure that has changed, defer the whole score.
     * @returns
     */
    replaceMeasures(): Promise<void>;
    preserveScroll(): Promise<void>;
    _renderStatePromise(condition: () => boolean): Promise<void>;
    renderPromise(): Promise<void>;
    updatePromise(): Promise<void>;
    handleRedrawTimer(): Promise<void>;
    pollRedraw(): void;
    startDemon(): void;
    renderTextGroup(gg: SmoTextGroup): void;
    /**
     * Set the SVG viewport
     * @param reset whether to re-render the entire SVG DOM
     * @returns
     */
    setViewport(): void;
    renderForPrintPromise(): Promise<any>;
    restoreLayoutAfterPrint(): void;
    setPassState(st: number, location: string): void;
    get score(): SmoScore | null;
    dbgDrawDot(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise: boolean): void;
    set score(score: SmoScore | null);
    unrenderColumn(measure: SmoMeasure): void;
    forceRender(): void;
    unrenderMeasure(measure: SmoMeasure): void;
    rerenderTextGroups(): Promise<void>;
    unrenderTextGroups(): Promise<void>;
    render(): Promise<any>;
}
