import { SvgBox, SvgPoint } from '../../smo/data/common';
import { SmoMeasure } from '../../smo/data/measure';
import { SmoScore } from '../../smo/data/score';
import { SmoTextGroup } from '../../smo/data/scoreText';
import { SmoSelection } from '../../smo/xform/selections';
import { SmoSystemStaff } from '../../smo/data/systemStaff';
import { StaffModifierBase } from '../../smo/data/staffModifiers';
import { SuiMapper } from './mapper';
import { VxSystem } from '../vex/vxSystem';
import { SuiLayoutFormatter, RenderedPage } from './formatter';
import { layoutDebug } from './layoutDebug';
import { SmoRenderConfiguration } from './configuration';
import { UndoBuffer } from '../../smo/xform/undo';
import { SvgPageMap, SvgPage } from './svgPageMap';
/**
 * a renderer creates the SVG render context for vexflow from the given element. Then it
 * renders the initial score.
 * @category SuiRender
 */
export interface ScoreRenderParams {
    elementId: any;
    score: SmoScore;
    config: SmoRenderConfiguration;
    undoBuffer: UndoBuffer;
    debug: layoutDebug;
}
/**
 * @category SuiRender
 */
export interface MapParameters {
    vxSystem: VxSystem;
    measuresToBox: SmoMeasure[];
    modifiersToBox: StaffModifierBase[];
    printing: boolean;
}
/**
 * This module renders the entire score.  It calculates the layout first based on the
 * computed dimensions.
  * @category SuiRender
**/
export declare class SuiScoreRender {
    constructor(params: ScoreRenderParams);
    debug: layoutDebug;
    elementId: any;
    startRenderTime: number;
    formatter: SuiLayoutFormatter | null;
    vexContainers: SvgPageMap;
    score: SmoScore | null;
    measureMapper: SuiMapper | null;
    measuresToMap: MapParameters[];
    viewportChanged: boolean;
    renderTime: number;
    backgroundRender: boolean;
    static debugMask: number;
    renderedPages: Record<number, RenderedPage | null>;
    _autoAdjustRenderTime: boolean;
    lyricsToOffset: Map<number, VxSystem>;
    renderingPage: number;
    get autoAdjustRenderTime(): boolean;
    set autoAdjustRenderTime(value: boolean);
    getRenderer(box: SvgBox | SvgPoint): SvgPage | null;
    renderTextGroup(gg: SmoTextGroup): void;
    unrenderAll(): void;
    unrenderStaff(staff: SmoSystemStaff): void;
    clearRenderedPage(pg: number): void;
    setViewport(): void;
    unrenderTextGroups(): Promise<void>;
    renderTextGroups(): Promise<void>;
    rerenderTextGroups(): Promise<void>;
    /**
     * for music we've just rendered, get the bounding boxes.  We defer this step so we don't force
     * a reflow, which can slow rendering.
     * @param vxSystem
     * @param measures
     * @param modifiers
     * @param printing
     */
    measureRenderedElements(vxSystem: VxSystem, measures: SmoMeasure[], modifiers: StaffModifierBase[], printing: boolean): void;
    _renderSystem(lineIx: number, printing: boolean): void;
    _renderNextSystemPromise(systemIx: number, keys: number[], printing: boolean): Promise<unknown>;
    _renderNextSystem(lineIx: number, keys: number[], printing: boolean): Promise<void>;
    unrenderMeasure(measure: SmoMeasure): void;
    renderModifiers(staff: SmoSystemStaff, system: VxSystem): StaffModifierBase[];
    drawPageLines(): void;
    replaceSelection(staffMap: Record<number | string, {
        system: VxSystem;
        staff: SmoSystemStaff;
    }>, change: SmoSelection): void;
    renderAllMeasures(lines: number[]): Promise<void>;
    numberMeasures(): void;
    /**
     * This calculates the position of all the elements in the score, then renders the score
     * @returns
     */
    layout(): Promise<void>;
}
