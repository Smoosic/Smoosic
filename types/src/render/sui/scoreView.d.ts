import { SmoScore } from '../../smo/data/score';
import { SmoGlobalLayout } from '../../smo/data/scoreModifiers';
import { SmoGraceNote } from '../../smo/data/noteModifiers';
import { SmoSystemStaff } from '../../smo/data/systemStaff';
import { SmoPartInfo } from '../../smo/data/partInfo';
import { StaffModifierBase } from '../../smo/data/staffModifiers';
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';
import { UndoBuffer } from '../../smo/xform/undo';
import { PasteBuffer } from '../../smo/xform/copypaste';
import { SuiScroller } from './scroller';
import { layoutProvider } from './mapper';
import { SuiTracker } from './tracker';
import { SmoRenderConfiguration } from './configuration';
import { SuiRenderState } from './renderState';
import { SuiAudioAnimationParams } from '../audio/musicCursor';
import { Ref } from 'vue';
import { SvgBox, SvgPoint } from '../../smo/data/common';
import { layoutDebug } from './layoutDebug';
/**
 * Indicates a stave is/is not displayed in the score
 * @category SuiRender
 */
export interface ViewMapEntry {
    show: boolean;
}
export type updateSelectionFunc = (score: SmoScore, selections: SmoSelection[]) => void;
export type updateSingleSelectionFunc = (score: SmoScore, selection: SmoSelection) => void;
export type updateStaffModifierFunc = (score: SmoScore, fromSelection: SmoSelection, toSelection: SmoSelection) => void;
/**
 * Base class for all operations on the rendered score.  The base class handles the following:
 * 1. Undo and recording actions for the operation
 * 2. Maintain/change which staves in the score are displayed (staff map)
 * 3. Mapping between the displayed score and the data representation
 * @category SuiRender
 */
export declare abstract class SuiScoreView implements layoutProvider {
    static Instance: SuiScoreView | null;
    score: SmoScore;
    storeScore: SmoScore;
    staffMap: number[];
    storeUndo: UndoBuffer;
    tracker: SuiTracker;
    renderer: SuiRenderState;
    scroller: SuiScroller;
    storePaste: PasteBuffer;
    selectedPart: Ref<string>;
    config: SmoRenderConfiguration;
    audioAnimation: SuiAudioAnimationParams;
    debug: layoutDebug;
    constructor(config: SmoRenderConfiguration, score: SmoScore, undoBuffer: UndoBuffer);
    getLayout(): SmoGlobalLayout | undefined;
    isLayoutHorizontal(): boolean;
    getFlowDimensionExtent(box: SvgBox): number;
    getFlowDimensionPosition(box: SvgBox | SvgPoint): number;
    get PartName(): Ref<string>;
    /**
     * Await on the full update of the score
     * @returns
     */
    renderPromise(): Promise<any>;
    /**
     * Await on the partial update of the score in the view
     * @returns
     */
    updatePromise(): Promise<any>;
    awaitRender(): Promise<any>;
    /**
     * await on the full update of the score, also resetting the viewport (to reflect layout changes)
     * @returns
     */
    refreshViewport(): Promise<any>;
    handleScrollEvent(scrollLeft: number, scrollTop: number): void;
    getPartMap(): {
        keys: number[];
        partMap: Record<number, SmoPartInfo>;
    };
    /**
     * Any method that modifies a set of selections can call this to update
     * the score view and the backing score.
     * @param actor
     * @param selections
     */
    modifyCurrentSelections(label: string, actor: updateSelectionFunc): Promise<void>;
    /**
     * Any method that modifies a set of selections can call this to update
     * the score view and the backing score.
     * @param actor
     * @param selections
     */
    modifySelection(label: string, selection: SmoSelection, actor: updateSelectionFunc): Promise<void>;
    /**
   * Any method that modifies a set of selections can call this to update
   * the score view and the backing score.
   * @param actor
   * @param selections
   */
    modifySelectionNoWait(label: string, selection: SmoSelection, actor: updateSingleSelectionFunc): Promise<void>;
    /**
     * Modifiy a set of columns, e.g. tempo, time, key.  This has different undo behavior, don't
     * pend on the result because there may be a combination of operations.
     * @param label
     * @param selections
     * @param actor
     */
    modifyColumnsSelectionsNoWait(label: string, selections: SmoSelection[], actor: updateSingleSelectionFunc): void;
    /**
     * This is used in some Smoosic demos and pens.
     * @param action any action, but most usefully a SuiScoreView method
     * @param repetition number of times to repeat, waiting on render promise between
     * if not specified, defaults to 1
     * @returns promise, resolved action has been completed and score is updated.
     */
    waitableAction(action: () => void, repetition?: number): Promise<unknown>;
    /**
     * The plural form of _getEquivalentSelection
     * @param selections
     * @returns
     */
    _getEquivalentSelections(selections: SmoSelection[]): SmoSelection[];
    getPasteMeasureList(): SmoSelection[];
    /**
     * A staff modifier has changed, create undo operations for the measures affected
     * @param label
     * @param staffModifier
     * @param subtype
     */
    undoStaffModifier(label: string, staffModifier: StaffModifierBase, subtype: number): void;
    /**
     * Return the index of the page that is in the center of the client screen.
     */
    getFocusedPage(): number;
    /**
     * Create a rectangle undo, like a multiple columns but not necessarily the whole
     * score.
     */
    _undoColumn(label: string, measureIndex: number): void;
    /**
     * Score preferences don't affect the display, but they do have an undo
     * @param label
     */
    _undoScorePreferences(label: string): void;
    undoColumnRange(label: string, measureSelections: SmoSelection[]): void;
    undoMeasureRange(label: string, measureSelections: SmoSelection[]): SmoSelection[];
    /**
     * Add to the undo buffer the current set of measures selected.
     * @param label
     * @returns
     */
    undoTrackerMeasureSelections(label: string): SmoSelection[];
    /**
     * operation that only affects the first selection.  Setup undo for the measure
     */
    _undoFirstMeasureSelection(label: string): SmoSelection;
    /**
     * Add the selection to the undo buffer
     * @param label
     * @param selection
     */
    _undoSelection(label: string, selection: SmoSelection): void;
    /**
     * Add multiple selections to the undo buffer as a group
     * @param label
     * @param selections
     */
    _undoSelections(label: string, selections: SmoSelection[]): void;
    /**
     * Update renderer for measures that have changed
    */
    _renderChangedMeasures(measureSelections: SmoSelection[]): void;
    /**
     * Update renderer for some columns
     * @param fromSelector
     * @param toSelector
     */
    _renderRectangle(fromSelector: SmoSelector, toSelector: SmoSelector): void;
    /**
     * Setup undo for operation that affects the whole score
     * @param label
     */
    _undoScore(label: string): void;
    /**
     * Get the selector from this.storeScore that maps to the displayed selector from this.score
     * @param selector
     * @returns
     */
    _getEquivalentSelector(selector: SmoSelector): any;
    /**
     * Get the equivalent staff id from this.storeScore that maps to the displayed selector from this.score
     * @param staffId
     * @returns
     */
    _getEquivalentStaff(staffId: number): number;
    /**
     * Get the equivalent selection from this.storeScore that maps to the displayed selection from this.score
     * @param selection
     * @returns
     */
    _getEquivalentSelection(selection: SmoSelection): SmoSelection | null;
    /**
     * Get the equivalent selection from this.storeScore that maps to the displayed selection from this.score
     * @param selection
     * @returns
     */
    _getEquivalentGraceNote(selection: SmoSelection, gn: SmoGraceNote): SmoGraceNote;
    /**
     * Get the rectangle of selections indicated by the parameters from the score
     * @param startSelector
     * @param endSelector
     * @param score
     * @returns
     */
    _getRectangleSelections(startSelector: SmoSelector, endSelector: SmoSelector): SmoSelection[];
    /**
     * set the grouping flag for undo operations
     * @param val
     */
    groupUndo(val: boolean): void;
    /**
     * Show all staves, 1:1 mapping of view score staff to stored score staff
     */
    get defaultStaffMap(): number[];
    /**
     * Bootstrapping function, creates the renderer and associated timers
     */
    startRenderingEngine(): void;
    /**
     * Gets the current mapping of displayed staves to score staves (this.storeScore)
     * @returns
     */
    getView(): ViewMapEntry[];
    /**
     * Update the staff ID when the view changes
     */
    setMappedStaffIds(): void;
    resetPartView(): void;
    /**
     * Exposes a part:  hides non-part staves, shows part staves.
     * Note this will reset the view.  After this operation, staff 0 will
     * be the selected part.
     * @param staff
     */
    exposePart(staff: SmoSystemStaff): void;
    /**
     * Indicates if the score is displaying in part-mode vs. score mode.
     * @returns
     */
    isPartExposed(): boolean;
    /**
     * Parts have different formatting options from the parent score, indluding layout.  Reset
     * them when exposing a part.
     */
    _mapPartFormatting(): void;
    /**
     * Update the list of staves in the score that are displayed.
    */
    setView(rows: ViewMapEntry[]): void;
    /**
     * view all the staffs in score mode.
     */
    viewAll(): void;
    /**
     * If the score is non-transposed, transpose the part so it is in the
     * correct key.
     */
    _setTransposing(): void;
    /**
     * Update the view after loading or restoring a completely new score
     * @param score
     * @returns
     */
    changeScore(score: SmoScore): Promise<any>;
    replaceMeasureView(measureRange: number[]): void;
    /**
     * for the view score, the renderer decides what to render
     * depending on what is undone.
     * @returns
     */
    undo(): Promise<void>;
}
