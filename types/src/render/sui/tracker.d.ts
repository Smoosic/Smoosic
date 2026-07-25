import { SuiMapper, SuiRendererBase } from './mapper';
import { StrokeInfo } from './svgHelpers';
import { SmoSelection, SmoSelector, ModifierTab } from '../../smo/xform/selections';
import { SmoScore } from '../../smo/data/score';
import { SvgBox, KeyEvent, keyHandler } from '../../smo/data/common';
import { SuiScroller } from './scroller';
import { SmoMeasure } from '../../smo/data/measure';
import { TrackerDelegate } from "./NoteEntryMediator";
export interface TrackerKeyHandler {
    moveHome: keyHandler;
    moveEnd: keyHandler;
    moveSelectionRight: keyHandler;
    moveSelectionLeft: keyHandler;
    moveSelectionUp: keyHandler;
    moveSelectionDown: keyHandler;
    moveSelectionRightMeasure: keyHandler;
    moveSelectionLeftMeasure: keyHandler;
    advanceModifierSelection: keyHandler;
    growSelectionRight: keyHandler;
    growSelectionLeft: keyHandler;
    moveSelectionPitchUp: keyHandler;
    moveSelectionPitchDown: keyHandler;
}
/**
 * SuiTracker
 * A tracker maps the UI elements to the logical elements ,and allows the user to
 *  move through the score and make selections, for navigation and editing.
 * @category SuiRender
 */
export declare class SuiTracker extends SuiMapper implements TrackerKeyHandler {
    idleTimer: number;
    musicCursorGlyph: SVGSVGElement | null;
    deferPlayAdvance: boolean;
    delegate: TrackerDelegate | null;
    static get strokes(): Record<string, StrokeInfo>;
    constructor(renderer: SuiRendererBase, scroller: SuiScroller);
    get renderElement(): Element;
    get score(): SmoScore | null;
    getIdleTime(): number;
    playSelection(artifact: SmoSelection): void;
    deferNextAutoPlay(): void;
    getSelectedModifier(): ModifierTab | null;
    getSelectedModifiers(): ModifierTab[];
    static serializeEvent(evKey: KeyEvent | null): any;
    advanceModifierSelection(keyEv?: KeyEvent): void;
    static stringifyBox(box: SvgBox): string;
    _getOffsetSelection(offset: number): SmoSelector;
    getSelectedGraceNotes(): ModifierTab[];
    isGraceNoteSelected(): boolean;
    _growGraceNoteSelections(offset: number): void;
    get autoPlay(): boolean;
    growSelectionRight(): void;
    _growSelectionRight(skipPlay: boolean): number;
    moveHome(keyEvent?: KeyEvent): void;
    moveEnd(keyEvent?: KeyEvent): void;
    growSelectionRightMeasure(): void;
    growSelectionLeft(): number;
    moveSelectionRight(): void;
    moveSelectionLeft(): void;
    moveSelectionLeftMeasure(): void;
    moveSelectionRightMeasure(): void;
    _moveSelectionMeasure(offset: number): void;
    _moveStaffOffset(offset: number): void;
    /**
     * Set a specific pitch index (called by caret for mouse clicks)
     * This updates the visual pitch selection without modifying data
     */
    setPitchIndex(index: number): void;
    getPitchIndex(): number;
    clearPitchIndex(): void;
    _moveSelectionPitch(index: number): void;
    moveSelectionPitchUp(): void;
    moveSelectionPitchDown(): void;
    moveSelectionUp(): void;
    moveSelectionDown(): void;
    containsArtifact(): boolean;
    _replaceSelection(nselector: SmoSelector, skipPlay: boolean): void;
    getFirstMeasureOfSelection(): SmoMeasure | null;
    getSelectedMeasures(): SmoSelection[];
    _addSelection(selection: SmoSelection): void;
    _selectBetweenSelections(s1o: SmoSelection, s2o: SmoSelection): void;
    selectSuggestion(ev: KeyEvent, deferHighlightSelection?: boolean): void;
    _setModifierAsSuggestion(artifact: ModifierTab): void;
    _setArtifactAsSuggestion(artifact: SmoSelection): void;
    _highlightModifier(): void;
    _highlightActiveVoice(selection: SmoSelection): void;
    selectActiveVoice(): void;
    highlightSelection(): void;
    /**
     * Boxes are divided up into lines/systems already.  But we need
     * to put the correct box on the correct page.
     * @param boxes
     */
    drawSelectionRects(boxes: SvgBox[]): void;
    _drawRect(pBox: SvgBox | SvgBox[], strokeName: string): void;
}
