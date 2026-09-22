import { VxMeasure } from './vxMeasure';
import { SmoSelection } from '../../smo/xform/selections';
import { SmoLyric } from '../../smo/data/noteModifiers';
import { StaffModifierBase } from '../../smo/data/staffModifiers';
import { SmoScore } from '../../smo/data/score';
import { SmoMeasure } from '../../smo/data/measure';
import { SvgBox } from '../../smo/data/common';
import { SmoNote } from '../../smo/data/note';
import { SmoSystemStaff } from '../../smo/data/systemStaff';
import { SmoVolta } from '../../smo/data/measureModifiers';
import { SvgPage } from '../sui/svgPageMap';
import { SuiScroller } from '../sui/scroller';
import { Voice, Note } from '../../common/vex';
/**
 * @category SuiRender
 */
export interface VoltaInfo {
    smoMeasure: SmoMeasure;
    ending: SmoVolta;
}
/**
 * @category SuiRender
 */
export interface SuiSystemGroup {
    firstMeasure: VxMeasure;
    voices: Voice[];
}
/**
 * Create a system of staves and draw music on it.  This calls the Vex measure
 * rendering methods, and also draws all the score and system level stuff like slurs,
 * text, aligns the lyrics.
 * @category SuiRender
 * */
export declare class VxSystem {
    context: SvgPage;
    leftConnector: any[];
    score: SmoScore;
    vxMeasures: VxMeasure[];
    smoMeasures: SmoMeasure[];
    lineIndex: number;
    maxStaffIndex: number;
    maxSystemIndex: number;
    minMeasureIndex: number;
    maxMeasureIndex: number;
    width: number;
    staves: SmoSystemStaff[];
    box: SvgBox;
    currentY: number;
    topY: number;
    clefWidth: number;
    ys: number[];
    measures: VxMeasure[];
    modifiers: any[];
    constructor(context: SvgPage, topY: number, lineIndex: number, score: SmoScore);
    getVxMeasure(smoMeasure: SmoMeasure): VxMeasure | null;
    getVxNote(smoNote: SmoNote): Note | null;
    _updateChordOffsets(note: SmoNote): void;
    _updateAnnotationOffsets(note: SmoNote): void;
    _lowestYLowestVerse(lyrics: SmoLyric[], vxMeasures: VxMeasure[]): void;
    updateLyricOffsets(): void;
    renderModifier(scroller: SuiScroller, modifier: StaffModifierBase, vxStart: Note | null, vxEnd: Note | null, smoStart: SmoSelection, smoEnd: SmoSelection): void;
    renderEndings(scroller: SuiScroller): void;
    getMeasureByIndex(measureIndex: number, staffId: number): SmoMeasure | null;
    renderMeasure(smoMeasure: SmoMeasure, printing: boolean, firstInColumn: boolean): void;
}
