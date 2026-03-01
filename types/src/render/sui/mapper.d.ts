import { SmoSelector, SmoSelection, ModifierTab } from '../../smo/xform/selections';
import { OutlineInfo } from './svgHelpers';
import { layoutDebug } from './layoutDebug';
import { SuiScroller } from './scroller';
import { SmoSystemStaff } from '../../smo/data/systemStaff';
import { SmoMeasure } from '../../smo/data/measure';
import { SmoNoteModifierBase } from '../../smo/data/noteModifiers';
import { SvgBox, SvgPoint } from '../../smo/data/common';
import { SmoGlobalLayout } from '../../smo/data/scoreModifiers';
import { SmoScore } from '../../smo/data/score';
import { SvgPageMap } from './svgPageMap';
/**
 * Decide if this layout is horizontal or vertical
 * @param layout
 * @returns
 */
export declare function isHorizontalLayout(layout?: SmoGlobalLayout): boolean;
/**
 * Provide the layout and some convenience functions for horizontal vs. vertical layout
 */
export interface layoutProvider {
    getLayout(): SmoGlobalLayout | undefined;
    isLayoutHorizontal(): boolean;
    getFlowDimensionExtent(box: SvgBox): number;
    getFlowDimensionPosition(box: SvgBox | SvgPoint): number;
}
/**
 * DI information about renderer, so we can notify renderer and it can contain
 * a tracker object
 * @param pageMap {@link SvgPageMap}: SvgPageMap - container of SVG elements and vex renderers
 * @param score {@link SmoScore}
 * @param dirty lets the caller know the display needs update
 * @param passState state machine in rendering part/all of the score
 * @param renderPromise awaits on render all
 * @param addToReplaceQueue adds a measure to the quick update queue
 * @param renderElement a little redundant with svg
 * @category SuiRender
 */
export interface SuiRendererBase {
    pageMap: SvgPageMap;
    score: SmoScore | null;
    dirty: boolean;
    passState: number;
    renderPromise(): Promise<any>;
    addToReplaceQueue(mm: SmoSelection[]): void;
    renderElement: Element;
    debug: layoutDebug;
}
/**
 * used to perform highlights in the backgroundd
 * @category SuiRender
 */
export interface HighlightQueue {
    selectionCount: number;
    deferred: boolean;
}
/**
 * Map the notes in the svg so they can respond to events and interact
 * with the mouse/keyboard
 * @category SuiRender
 */
export declare abstract class SuiMapper {
    renderer: SuiRendererBase;
    scroller: SuiScroller;
    measureNoteMap: Record<string | number, SmoSelection>;
    modifierSelections: ModifierTab[];
    selections: SmoSelection[];
    localModifiers: ModifierTab[];
    modifierIndex: number;
    modifierSuggestion: ModifierTab | null;
    pitchIndex: number;
    deferHighlightMode: boolean;
    suggestion: SmoSelection | null;
    highlightQueue: HighlightQueue;
    mouseHintBox: OutlineInfo | null;
    selectionRects: Record<number, OutlineInfo[]>;
    outlines: Record<string, OutlineInfo>;
    mapping: boolean;
    debug: layoutDebug;
    constructor(renderer: SuiRendererBase, scroller: SuiScroller);
    abstract highlightSelection(): void;
    abstract _growSelectionRight(hold?: boolean): number;
    abstract _setModifierAsSuggestion(sel: ModifierTab): void;
    abstract _setArtifactAsSuggestion(sel: SmoSelection): void;
    abstract getIdleTime(): number;
    updateHighlight(): void;
    deferHighlight(): void;
    _createLocalModifiersList(): void;
    /**
     * When a modifier is selected graphically, update the selection list
     * and create a local modifier list
     * @param modifierTabs
     */
    createLocalModifiersFromModifierTabs(modifierTabs: ModifierTab[]): void;
    removeModifierSelectionBox(): void;
    clearModifierSelections(): void;
    loadScore(): void;
    clearMeasureMap(measure: SmoMeasure): void;
    _copySelectionsByMeasure(staffIndex: number, measureIndex: number): {
        ticks: number;
        selectors: SmoSelector[];
    };
    deleteMeasure(selection: SmoSelection): void;
    _updateNoteModifier(selection: SmoSelection, modMap: Record<string, boolean>, modifier: SmoNoteModifierBase, ix: number): number;
    _updateModifiers(): void;
    _getClosestTick(selector: SmoSelector): SmoSelection;
    _setModifierBoxes(measure: SmoMeasure): void;
    /**
     * returns true of the selections are adjacent
     * @param s1 a selections
     * @param s2 another election
     * @returns
     */
    isAdjacentSelection(s1: SmoSelection, s2: SmoSelection): boolean;
    areSelectionsAdjacent(): boolean;
    /**
     * This is the logic that stores the screen location of music after it's rendered
     */
    mapMeasure(staff: SmoSystemStaff, measure: SmoMeasure, printing: boolean): void;
    _getTicksFromSelections(): number;
    _copySelections(): SmoSelector[];
    getExtremeSelection(sign: number): SmoSelection;
    _selectClosest(selector: SmoSelector): void;
    updateMap(): void;
    createMousePositionBox(logicalBox: SvgBox): void;
    eraseMousePositionBox(): void;
    /**
     * Find any musical elements at the supplied screen coordinates and set them as the selection
     * @param bb
     * @returns
     */
    intersectingArtifact(bb: SvgBox): void;
    _getRectangleChain(selection: SmoSelection): number[];
    _updateMeasureNoteMap(artifact: SmoSelection, printing: boolean): void;
}
