import { SvgBox, Ticks, Transposable } from "../../smo/data/common";
import { SuiTracker } from "./tracker";
import { SmoSelection } from "../../smo/xform/selections";
import { SvgPage } from "./svgPageMap";
import { SmoNote } from "../../smo/data/note";
import { SuiScoreViewOperations } from "./scoreViewOperations";
import { SmoGraceNote } from "../../smo/data/noteModifiers";
import { CaretDelegate } from "./NoteEntryMediator";
type PitchHighlightType = 'selection' | 'drag-init';
export declare class NoteEntryCaret {
    static readonly STAFF_LINE_HEIGHT = 10;
    static readonly STAFF_LINE_COUNT = 5;
    static readonly STAFF_HEIGHT: number;
    static readonly LEDGER_POSITIONS_ABOVE = 6;
    static readonly LEDGER_POSITIONS_BELOW = 6;
    static readonly CARET_HEIGHT: number;
    static readonly PITCH_SELECTION_COLOR = "#933";
    static readonly PITCH_DRAG_ORIGINAL_COLOR = "#aaaaaa7f";
    static readonly VOICE_1_NOTEHEAD_COLOR = "#000000";
    static readonly VOICE_2_NOTEHEAD_COLOR = "#115511";
    static readonly VOICE_3_NOTEHEAD_COLOR = "#555511";
    static readonly VOICE_4_NOTEHEAD_COLOR = "#883344";
    static readonly VOICE_1_PREVIEW_NOTEHEAD_COLOR = "#808080";
    static readonly VOICE_2_PREVIEW_NOTEHEAD_COLOR = "#88aa88";
    static readonly VOICE_3_PREVIEW_NOTEHEAD_COLOR = "#aaaa88";
    static readonly VOICE_4_PREVIEW_NOTEHEAD_COLOR = "#c499a2";
    static readonly VOICE_1_CURSOR_RECTANGLE_COLOR = "#99aadd";
    static readonly VOICE_2_CURSOR_RECTANGLE_COLOR = "#99dd99";
    static readonly VOICE_3_CURSOR_RECTANGLE_COLOR = "#dddd99";
    static readonly VOICE_4_CURSOR_RECTANGLE_COLOR = "#dd99aa";
    static readonly DEFAULT_NOTE_DURATION: Ticks;
    static readonly DEFAULT_NOTE_MODE: 'note' | 'rest';
    caretBoundaryBox: SvgBox;
    tracker: SuiTracker;
    view: SuiScoreViewOperations;
    selection: SmoSelection | null;
    pageDimensions: SvgBox;
    note: SmoNote | null;
    graceNote: SmoGraceNote | null;
    activeNote: Transposable | null;
    voice: number;
    vexNoteAbsoluteX: number;
    vexNoteLeftDisplacedHeadPx: number;
    vexNoteRightDisplacedHeadPx: number;
    vexNoteHeadWidth: number;
    vexNoteXShift: number;
    context: SvgPage | undefined;
    mode: 'note' | 'rest';
    duration: Ticks;
    cursorRectangleElement: SVGRectElement | null;
    pitchPreviewElement: SVGTextElement | null;
    pitchPreviewLedgerElements: SVGLineElement[];
    pitchSelectionElementId: string | null;
    pitchDragInitElementId: string | null;
    currentStaffLine: number | null;
    occupiedStaffLines: number[];
    staffLineOnMouseUp: number | null;
    staffLineOnMouseDown: number | null;
    delegate: CaretDelegate | null;
    constructor(view: SuiScoreViewOperations, tracker: SuiTracker);
    setSelection(selection: SmoSelection, graceNote?: SmoGraceNote | null): void;
    handleMouseDown(ev: any): void;
    handleMouseMove(ev: any): void;
    handleMouseUp(ev: any): void;
    handleMouseClick(ev: any): void;
    private _calculateDisplacedHeadPosition;
    private _unsetPreviousSelection;
    render(): void;
    private _calculateCaretBoundaryBoxCoordinates;
    private _fillOccupiedStaffLines;
    private _addOccupiedStaffLine;
    private _removeOccupiedStaffLine;
    private _getPitchesFromOccupiedStaffLines;
    private _renderCursorRectangleElement;
    private _getCursorRectangleElement;
    containsPoint(ev: any): boolean;
    private _renderPitchPreview;
    private _unrenderPitchPreview;
    renderPitchHighlight(pitchIndex: number, highlightType?: PitchHighlightType): void;
    private _highlightNoteHead;
    /**
     * Unrenders both pitch selection and drag-init highlights
     */
    private _unrenderPitchHighlight;
    /**
     * Unrenders only the pitch selection highlight (persistent red highlight)
     */
    private _unrenderPitchSelectionHighlight;
    /**
     * Unrenders only the drag-init highlight (temporary highlight during drag)
     */
    private _unrenderPitchDragInitHighlight;
    private _getPitchPreviewElement;
    private _getVoiceNoteheadColor;
    private _getVoicePreviewColor;
    private _getVoiceCursorRectangleColor;
    private _getLedgerLinePositions;
    private _createLedgerLineElement;
    private _calculateStaffLineFromY;
    private _calculateYFromStaffLine;
    private _unrender;
    resetInteraction(): void;
    private _getActiveVexNote;
    private static _hasMultipleNoteHeadsOnSameLine;
    private _findPitchIndexForStaffLineAndMouseX;
}
export {};
