import { SmoLyric } from '../../smo/data/noteModifiers';
import { SmoNote } from '../../smo/data/note';
import { SmoScore } from '../../smo/data/score';
import { layoutDebug } from './layoutDebug';
import { ScaledPageLayout } from '../../smo/data/scoreModifiers';
import { SmoMeasure, ISmoBeamGroup } from '../../smo/data/measure';
import { TimeSignature, SmoTempoText } from '../../smo/data//measureModifiers';
import { SvgPageMap } from './svgPageMap';
import { TextFormatter } from '../../common/textformatter';
export interface SuiFormatterParameters {
    score: SmoScore;
    svg: SvgPageMap;
    renderedPages: Record<number, RenderedPage | null>;
    debug: layoutDebug;
}
/**
 * @category SuiRender
 */
export interface SuiTickContext {
    widths: number[];
    tickCounts: number[];
}
/**
 * Estimated x, y position of the measure
 * @category SuiRender
 */
export interface MeasureEstimate {
    measures: SmoMeasure[];
    x: number;
    y: number;
}
/**
 * @category SuiRender
 */
export interface LineRender {
    systems: Record<number, SmoMeasure[]>;
}
/**
 * Keep track of start/end measures on a page.  If the page
 * content doesn't change, and the measures don't change, we don't
 * need to re-render the content
 * @category SuiRender
 */
export interface RenderedPage {
    startMeasure: number;
    endMeasure: number;
}
/**
 * Utilities for estimating measure/system/page width and height
 * @category SuiRender
 */
export declare class SuiLayoutFormatter {
    score: SmoScore;
    systems: Record<number, LineRender>;
    columnMeasureMap: Record<number, SmoMeasure[]>;
    currentPage: number;
    svg: SvgPageMap;
    renderedPages: Record<number, RenderedPage | null>;
    lines: number[];
    debug: layoutDebug;
    measuresRenderedThisPage: number;
    constructor(params: SuiFormatterParameters);
    get horizontal(): boolean;
    /**
     * Once we know which line a measure is going on, make a map for it for easy
     * looking during rendering
     * @param measures
     * @param lineIndex
     * @param systemIndex
     */
    updateSystemMap(measures: SmoMeasure[], lineIndex: number, systemIndex: number): void;
    trimPages(startPageCount: number): boolean;
    /**
     * see if page breaks this boundary.  If it does, bump the current page and move the system down
     * to the new page
     * @param scoreLayout
     * @param currentLine
     * @param bottomMeasure
     * @returns
     */
    checkPageBreak(scoreLayout: ScaledPageLayout, currentLine: SmoMeasure[], bottomMeasure: SmoMeasure): ScaledPageLayout;
    measureToLeft(measure: SmoMeasure): SmoMeasure;
    measureAbove(measure: SmoMeasure): SmoMeasure;
    /**
     * Estimate the dimensions of a column when it's rendered.
     * @param scoreLayout
     * @param measureIx
     * @param systemIndex
     * @param lineIndex
     * @param x
     * @param y
     * @returns { MeasureEstimate } - the measures in the column and the x, y location
     */
    estimateColumn(scoreLayout: ScaledPageLayout, measureIx: number, systemIndex: number, lineIndex: number, x: number, y: number): MeasureEstimate;
    /**
     * return true if this is the last measure, taking into account multimeasure rest
     * @param measureIx
     * @returns
     */
    isLastVisibleMeasure(measureIx: number): boolean;
    /**
     * Calculate the geometry for the entire score, based on estimated measure width and height.
     * @returns
     */
    layout(): void;
    static estimateMusicWidth(smoMeasure: SmoMeasure, tickContexts: Record<number, SuiTickContext>): number;
    static estimateStartSymbolWidth(smoMeasure: SmoMeasure): number;
    static estimateEndSymbolWidth(smoMeasure: SmoMeasure): number;
    estimateMeasureWidth(measure: SmoMeasure, scoreLayout: ScaledPageLayout, tickContexts: Record<number, SuiTickContext>): void;
    static _beamGroupForNote(measure: SmoMeasure, note: SmoNote): ISmoBeamGroup | null;
    /**
     * Format a full system:
     * 1.  Lop the last measure off the end and move it to the first measure of the
     * next system, if it doesn't fit
     * 2. Justify the measures vertically
     * 3. Justify the columns horizontally
     * 4. Hide lines if they don't contain music
     * @param scoreLayout
     * @param measureEstimate
     * @param currentLine
     * @param columnCount
     * @param lastSystem
     */
    justifyY(scoreLayout: ScaledPageLayout, rowCount: number, currentLine: SmoMeasure[], lastSystem: boolean): void;
    /**
     * highest value is actually the one lowest on the page
     * @param measure
     * @param note
     * @returns
     */
    static _highestLowestHead(measure: SmoMeasure, note: SmoNote): {
        hi: number;
        lo: number;
    };
    static textFont(lyric: SmoLyric): TextFormatter;
    /**
     * Calculate the dimensions of symbols based on where in a system we are, like whether we need to show
     * the key signature, clef etc.
     * @param systemIndex
     * @param measure
     * @param clefLast
     * @param keySigLast
     * @param timeSigLast
     * @param tempoLast
     * @param score
     */
    calculateBeginningSymbols(systemIndex: number, measure: SmoMeasure, clefLast: string, keySigLast: string, timeSigLast: TimeSignature, tempoLast: SmoTempoText): void;
    /**
     * The baseline is the top line of the staff.  aboveBaseline is a negative number
     * that indicates how high above the baseline the measure goes.  belowBaseline
     * is a positive number that indicates how far below the baseline the measure goes.
     * the height of the measure is below-above.  Vex always renders a staff such that
     * the y coordinate passed in for the stave is on the baseline.
     *
     * Note to past self: this was a really useful comment.  Thank you.
     * **/
    estimateMeasureHeight(measure: SmoMeasure): {
        aboveBaseline: number;
        belowBaseline: number;
    };
}
