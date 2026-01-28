import {Pitch, SvgBox, Ticks, Transposable} from "../../smo/data/common";
import {SuiTracker} from "./tracker";
import {SmoSelection} from "../../smo/xform/selections";
import {SvgPage} from "./svgPageMap";
import {SvgHelpers} from "./svgHelpers";
import {SmoMeasure} from "../../smo/data/measure";
import {SmoNote} from "../../smo/data/note";
import {SmoMusic} from "../../smo/data/music";
import {SuiScoreViewOperations} from "./scoreViewOperations";
import {SmoGraceNote} from "../../smo/data/noteModifiers";
import {Note} from "../../common/vex";
import {GraceNote, StaveNote} from "vexflow_smoosic";
import {CaretDelegate} from "./NoteEntryMediator";

declare var $: any;

type PitchHighlightType = 'selection' | 'drag-init';

export class NoteEntryCaret {

	static readonly STAFF_LINE_HEIGHT = 10;
	static readonly STAFF_LINE_COUNT = 5;
	static readonly STAFF_HEIGHT = NoteEntryCaret.STAFF_LINE_HEIGHT * NoteEntryCaret.STAFF_LINE_COUNT;

	static readonly LEDGER_POSITIONS_ABOVE = 6;
	static readonly LEDGER_POSITIONS_BELOW = 6;

	static readonly CARET_HEIGHT = NoteEntryCaret.STAFF_HEIGHT +
		(NoteEntryCaret.LEDGER_POSITIONS_ABOVE * NoteEntryCaret.STAFF_LINE_HEIGHT) +
		(NoteEntryCaret.LEDGER_POSITIONS_BELOW * NoteEntryCaret.STAFF_LINE_HEIGHT);

	// Highlight colors
	static readonly PITCH_SELECTION_COLOR = '#933';
	static readonly PITCH_DRAG_ORIGINAL_COLOR = '#aaaaaa7f'; // Light grey for the pitch being dragged

	static readonly VOICE_1_NOTEHEAD_COLOR = '#000000';
	static readonly VOICE_2_NOTEHEAD_COLOR = '#115511';
	static readonly VOICE_3_NOTEHEAD_COLOR = '#555511';
	static readonly VOICE_4_NOTEHEAD_COLOR = '#883344';

	static readonly VOICE_1_PREVIEW_NOTEHEAD_COLOR = '#808080';
	static readonly VOICE_2_PREVIEW_NOTEHEAD_COLOR = '#88aa88';
	static readonly VOICE_3_PREVIEW_NOTEHEAD_COLOR = '#aaaa88';
	static readonly VOICE_4_PREVIEW_NOTEHEAD_COLOR = '#c499a2';

	static readonly VOICE_1_CURSOR_RECTANGLE_COLOR = '#99aadd';
	static readonly VOICE_2_CURSOR_RECTANGLE_COLOR = '#99dd99';
	static readonly VOICE_3_CURSOR_RECTANGLE_COLOR = '#dddd99';
	static readonly VOICE_4_CURSOR_RECTANGLE_COLOR = '#dd99aa';

	//TODO: check if this is needed
	static readonly DEFAULT_NOTE_DURATION: Ticks = { numerator: 4096, denominator: 1, remainder: 0 };
	static readonly DEFAULT_NOTE_MODE: 'note' | 'rest' = 'note';

	caretBoundaryBox: SvgBox;

	tracker: SuiTracker;
	view: SuiScoreViewOperations;

	selection: SmoSelection | null = null;
	note: SmoNote | null = null;
	graceNote: SmoGraceNote | null = null;
	activeNote: Transposable | null = null;
	voice: number = 0;
	vexNoteAbsoluteX: number = 0;
	vexNoteLeftDisplacedHeadPx: number = 0;
	vexNoteRightDisplacedHeadPx: number = 0;
	vexNoteHeadWidth: number = 0;
	vexNoteXShift: number = 0;

	context: SvgPage | undefined;

	mode: 'note' | 'rest' = NoteEntryCaret.DEFAULT_NOTE_MODE;
	duration: Ticks = NoteEntryCaret.DEFAULT_NOTE_DURATION;

	cursorRectangleElement: SVGRectElement | null = null;

	// Pitch preview
	pitchPreviewElement: SVGTextElement | null = null;
	pitchPreviewLedgerElements: SVGLineElement[] = [];

	// Pitch selection highlight (persistent)
	pitchSelectionElementId: string | null = null;

	// Drag-init highlight (cleared on mouse leave)
	pitchDragInitElementId: string | null = null;

	currentStaffLine: number | null = null;
	occupiedStaffLines: number[] = [];

	staffLineOnMouseUp: number | null = null;
	staffLineOnMouseDown: number | null = null;

	delegate: CaretDelegate | null = null;

	constructor(view: SuiScoreViewOperations, tracker: SuiTracker) {
		this.caretBoundaryBox = SvgHelpers.boxPoints(0, 0, 0, 0);
		this.tracker = tracker;
		this.view = view;
	}

	public setSelection(selection: SmoSelection, graceNote: SmoGraceNote | null = null): void {
		this._unsetPreviousSelection();
		const targetVexNote = graceNote ? graceNote.vexGraceNote : selection.note?.vexNote;

		if (!targetVexNote) {
			console.warn(`${graceNote ? 'Grace note' : 'Note'} does not have coordinates`);
			return;
		}

		this.selection = selection;
		this.note = selection.note;
		this.graceNote = graceNote;
		this.activeNote = graceNote ?? selection.note;
		this.voice = selection.selector.voice;
		this.vexNoteAbsoluteX = targetVexNote.getAbsoluteX();
		this.vexNoteHeadWidth = targetVexNote.getMetrics().glyphWidth!;
		this.vexNoteXShift = targetVexNote.getXShift();
		this._calculateDisplacedHeadPosition();
	}

	public handleMouseDown(ev: any): void {
		this.staffLineOnMouseUp = null;
		if (!this.selection || this.currentStaffLine === null) {
			return;
		}
		this.staffLineOnMouseDown = this.currentStaffLine;
	}

	public handleMouseMove(ev: any): void {
		const staffLine = this._calculateStaffLineFromY(ev.clientY);
		if (this.currentStaffLine !== staffLine) {
			this.currentStaffLine = staffLine;
			this._renderPitchPreview(staffLine);
		}

		//drag initiated
		if (this.staffLineOnMouseDown !== null && this.staffLineOnMouseUp === null) {
			const pitchIndex = this._findPitchIndexForStaffLineAndMouseX(this.staffLineOnMouseDown, ev.clientX);
			if (pitchIndex !== -1) {
				// Update visual
				this.renderPitchHighlight(pitchIndex, 'drag-init');
			}
		}
	}

	public handleMouseUp(ev: any): void {
		this.staffLineOnMouseUp = this.currentStaffLine;

		if (this.staffLineOnMouseDown === null || this.staffLineOnMouseUp === null) return;

		if (this.staffLineOnMouseDown === this.staffLineOnMouseUp) return;

		if (this.occupiedStaffLines.includes(this.staffLineOnMouseDown) && !this.occupiedStaffLines.includes(this.staffLineOnMouseUp)) {
			//drag and drop detected - update staff lines
			this._removeOccupiedStaffLine(this.staffLineOnMouseDown);
			this._addOccupiedStaffLine(this.staffLineOnMouseUp);

			//calculate new pitches
			const newPitches = this._getPitchesFromOccupiedStaffLines();

			//notify via callback
			this.delegate?.onPitchesChanged(newPitches);
		}
	}

	public handleMouseClick(ev: any): void {
		if (!this.selection || this.currentStaffLine === null) {
			return;
		}

		// Click on existing pitch - select it
		if (this.occupiedStaffLines.includes(this.currentStaffLine) &&
			this.staffLineOnMouseDown === this.staffLineOnMouseUp) {
			const pitchIndex = this._findPitchIndexForStaffLineAndMouseX(this.currentStaffLine, ev.clientX);
			if (pitchIndex !== -1) {
				//notify via callback
				this.delegate?.onPitchClicked(pitchIndex);
			}
		}
		// Click on the staff line without pitch - add it
		else if (!this.occupiedStaffLines.includes(this.currentStaffLine) &&
			this.staffLineOnMouseDown === this.staffLineOnMouseUp) {
			this._addOccupiedStaffLine(this.currentStaffLine);
			const newPitches = this._getPitchesFromOccupiedStaffLines();
			//notify via callback
			this.delegate?.onPitchesChanged(newPitches);

			this._unrenderPitchHighlight();
		}
	}

	private _calculateDisplacedHeadPosition(): void {
		const vexNote = this._getActiveVexNote();
		if (!vexNote) {
			return;
		}

		const staveNote = vexNote as StaveNote;
		const noteHeads = staveNote.noteHeads;

		this.vexNoteLeftDisplacedHeadPx = staveNote.getMetrics().leftDisplacedHeadPx;
		this.vexNoteRightDisplacedHeadPx = staveNote.getMetrics().rightDisplacedHeadPx;

		const hasMultipleHeadsOnSameLine = NoteEntryCaret._hasMultipleNoteHeadsOnSameLine(noteHeads);

		// When there are two pitches on the same line, vexflow does not set values for notehead displacement.
		// In this case we calculate head displacement manually.
		if (hasMultipleHeadsOnSameLine && this.vexNoteLeftDisplacedHeadPx === 0 && this.vexNoteRightDisplacedHeadPx === 0) {
			if (staveNote.getStemDirection() === 1) {
				//stem up, add right displacement
				this.vexNoteRightDisplacedHeadPx = this.vexNoteHeadWidth;
			} else {
				//stem down, add left displacement
				this.vexNoteLeftDisplacedHeadPx = this.vexNoteHeadWidth;
			}
		}
	}

	private _unsetPreviousSelection(): void {
		this.selection = null;
		this.note = null;
		this.graceNote = null;
		this.activeNote = null;
		this.voice = 0;
		this.vexNoteAbsoluteX = 0;
		this.vexNoteLeftDisplacedHeadPx = 0;
		this.vexNoteRightDisplacedHeadPx = 0;
		this.vexNoteHeadWidth = 0;
		this.vexNoteXShift = 0;
		this.staffLineOnMouseUp = null;
		this.staffLineOnMouseDown = null;
		this._unrenderPitchHighlight();
	}

	public render(): void {
		this._unrender();
		if (!this.selection || !this.note || !this.activeNote) {
			return;
		}
		this._calculateCaretBoundaryBoxCoordinates(this.selection.measure, this.note!, this.graceNote);
		this._resolveContext();
		this._fillOccupiedStaffLines(this.selection.measure, this.activeNote);
		this._renderCursorRectangleElement();

		// Render pitch selection highlight if a pitch is selected
		if (this.selection.selector.pitches.length === 1) {
			const pitchIndex = this.selection.selector.pitches[0];
			this.renderPitchHighlight(pitchIndex);
		}
	}

	private _calculateCaretBoundaryBoxCoordinates(measure: SmoMeasure, note: SmoNote, graceNote: SmoGraceNote | null): void {
		const staffY = measure.staffY;
		// Calculate top Y: staff Y minus ledger lines above
		const y = staffY - (NoteEntryCaret.LEDGER_POSITIONS_ABOVE * NoteEntryCaret.STAFF_LINE_HEIGHT);

		this.caretBoundaryBox = SvgHelpers.boxPoints(
			this.vexNoteAbsoluteX - this.vexNoteLeftDisplacedHeadPx + this.vexNoteXShift,
			y,
			this.vexNoteHeadWidth + this.vexNoteLeftDisplacedHeadPx + this.vexNoteRightDisplacedHeadPx,
			NoteEntryCaret.CARET_HEIGHT
		);
	}

	private _resolveContext(): void {
		this.context = this.tracker.renderer.pageMap.getRenderer(this.caretBoundaryBox);
	}

	private _fillOccupiedStaffLines(measure: SmoMeasure, note: Transposable) {
		this.occupiedStaffLines = [];
		for (const pitch of note.pitches) {
			//todo: we are ignoring rests. For that to work we need to implement some sort of note type picker
			if (note.noteType === 'n') {
				this.occupiedStaffLines.push(SmoMusic.pitchToStaffLine(measure.clef, pitch));
			}
		}
	}

	private _addOccupiedStaffLine(staffLine: number): void {
		if (!this.occupiedStaffLines.includes(staffLine)) {
			this.occupiedStaffLines.push(staffLine);
		}
	}

	private _removeOccupiedStaffLine(staffLine: number): void {
		const index = this.occupiedStaffLines.indexOf(staffLine);
		if (index !== -1) {
			this.occupiedStaffLines.splice(index, 1);
		}
	}

	private _getPitchesFromOccupiedStaffLines(): Pitch[] {
		if (!this.selection) {
			return [];
		}

		const pitches: Pitch[] = [];
		const clef = this.selection.measure.clef;

		for (const staffLine of this.occupiedStaffLines) {
			pitches.push(SmoMusic.staffLineToPitch(clef, staffLine));
		}

		return pitches;
	}

	private _renderCursorRectangleElement(): void {
		if (this.context)	{
			// Adjust coordinates for the page context
			const adjustedY = this.caretBoundaryBox.y - this.context.box.y;
			// Create the cursor rectangle element
			const x = this.vexNoteAbsoluteX + this.vexNoteXShift;
			const y = adjustedY + (NoteEntryCaret.LEDGER_POSITIONS_ABOVE * NoteEntryCaret.STAFF_LINE_HEIGHT) - (NoteEntryCaret.STAFF_LINE_HEIGHT / 2);
			const width = this.vexNoteHeadWidth;
			const height = NoteEntryCaret.STAFF_HEIGHT;

			const cursorRectangleElement = this._getCursorRectangleElement(x, y, width, height);
			// Add to the correct SVG context - insert at beginning so it appears behind other elements
			this.context.svg.insertBefore(cursorRectangleElement, this.context.svg.firstChild);
			this.cursorRectangleElement = cursorRectangleElement;
		}
	}

	private _getCursorRectangleElement(x: number, y: number, width: number, height: number): SVGRectElement {
		const color = this._getVoiceCursorRectangleColor();

		const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		rect.setAttribute('x', x.toString());
		rect.setAttribute('y', y.toString());
		rect.setAttribute('width', width.toString());
		rect.setAttribute('height', height.toString());
		rect.setAttribute('stroke', 'none');
		rect.setAttribute('fill', color);
		rect.setAttribute('opacity', '0.5');
		rect.setAttribute('class', 'note-entry-caret');

		return rect;
	}

	public containsPoint(ev: any): boolean {
		const scrollState = this.tracker?.scroller.scrollState;
		const bb = SvgHelpers.boxPoints(ev.clientX + scrollState.x, ev.clientY + scrollState.y, 1, 1);
		const point = this.tracker.renderer.pageMap.clientToSvg(bb);

		return SvgHelpers.doesBox1ContainBox2(this.caretBoundaryBox, point);
	}

	private _renderPitchPreview(staffLine: number): void {
		this._unrenderPitchPreview();

		if (this.context !== undefined) {
			//check if staffLine has a pitch on it
			//in case it does, do not render pitch preview
			if (!this.occupiedStaffLines.includes(staffLine)) {
				const staffLineY = this._calculateYFromStaffLine(staffLine);
				const adjustedY = staffLineY - this.context.box.y;

				const x = this.vexNoteAbsoluteX + this.vexNoteXShift;
				// Determine color based on drag state: black during drag, blue otherwise
				const isDragging = this.staffLineOnMouseDown !== null && this.staffLineOnMouseUp === null;

				const color = isDragging
					? this._getVoiceNoteheadColor()
					: this._getVoicePreviewColor();

				// Render ledger lines if needed
				const ledgerPositions = this._getLedgerLinePositions(staffLine);
				for (const ledgerPos of ledgerPositions) {
					const ledgerLine = this._createLedgerLineElement(ledgerPos, color);
					this.context.svg.appendChild(ledgerLine);
					this.pitchPreviewLedgerElements.push(ledgerLine);
				}

				// Render notehead preview
				const preview = this._getPitchPreviewElement(color);
				preview.setAttribute('x', x.toString());
				preview.setAttribute('y', adjustedY.toString());

				// Add to the correct SVG context
				this.context.svg.appendChild(preview);
				this.pitchPreviewElement = preview;
			}
		}
	}

	private _unrenderPitchPreview(): void {
		if (this.pitchPreviewElement) {
			this.pitchPreviewElement.remove();
			this.pitchPreviewElement = null;
		}
		// Remove ledger lines
		for (const ledger of this.pitchPreviewLedgerElements) {
			ledger.remove();
		}
		this.pitchPreviewLedgerElements = [];
	}

	public renderPitchHighlight(pitchIndex: number, highlightType: PitchHighlightType = 'selection'): void {
		// Only clear the highlight of the type we're about to render
		if (highlightType === 'selection') {
			this._unrenderPitchSelectionHighlight();
		} else {
			this._unrenderPitchDragInitHighlight();
		}

		if (!this.context || !this.activeNote || !this.selection) {
			return;
		}

		if (pitchIndex < 0 || pitchIndex >= this.activeNote.pitches.length) {
			return;
		}

		const vexNote = this._getActiveVexNote();
		if (!vexNote) {
			return;
		}

		const staveNote = vexNote as StaveNote;
		const noteHeads = staveNote.noteHeads;

		// Directly access the notehead by pitch index
		// noteHeads array corresponds to pitches array
		const noteHead = noteHeads[pitchIndex];
		if (!noteHead) {
			return;
		}

		this._highlightNoteHead(noteHead, highlightType);
	}

	private _highlightNoteHead(noteHead: any, highlightType: PitchHighlightType): void {
		const attrs = noteHead.attrs;
		if (attrs?.id) {
			// VexFlow adds 'vf-' prefix to element IDs
			const elementId = `vf-${attrs.id}`;
			const element = document.getElementById(elementId);

			if (element) {
				// Find the first <path> element inside
				const pathElement = element.querySelector('path');
				if (!pathElement) {
					return;
				}

				// Apply highlight color based on type and store element ID
				if (highlightType === 'selection') {
					this.pitchSelectionElementId = elementId;
					// Pitch selection: red color
					pathElement.setAttribute('fill', NoteEntryCaret.PITCH_SELECTION_COLOR);
					pathElement.setAttribute('stroke', NoteEntryCaret.PITCH_SELECTION_COLOR);
				} else {
					this.pitchDragInitElementId = elementId;
					// Drag initiation: light grey color
					pathElement.setAttribute('fill', NoteEntryCaret.PITCH_DRAG_ORIGINAL_COLOR);
					pathElement.setAttribute('stroke', NoteEntryCaret.PITCH_DRAG_ORIGINAL_COLOR);
				}
			}
		}
	}

	/**
	 * Unrenders both pitch selection and drag-init highlights
	 */
	private _unrenderPitchHighlight(): void {
		this._unrenderPitchSelectionHighlight();
		this._unrenderPitchDragInitHighlight();
	}

	/**
	 * Unrenders only the pitch selection highlight (persistent red highlight)
	 */
	private _unrenderPitchSelectionHighlight(): void {
		if (this.pitchSelectionElementId) {
			const element = document.getElementById(this.pitchSelectionElementId);

			if (element) {
				const pathElement = element.querySelector('path');
				if (pathElement) {
					const color = this._getVoiceNoteheadColor();
					pathElement.setAttribute('fill', color);
					pathElement.setAttribute('stroke', color);
				}
			}

			// Clear reference
			this.pitchSelectionElementId = null;
		}
	}

	/**
	 * Unrenders only the drag-init highlight (temporary highlight during drag)
	 */
	private _unrenderPitchDragInitHighlight(): void {
		if (this.pitchDragInitElementId) {
			const element = document.getElementById(this.pitchDragInitElementId);

			if (element) {
				const pathElement = element.querySelector('path');
				if (pathElement) {
					const color = this._getVoiceNoteheadColor();
					pathElement.setAttribute('fill', color);
					pathElement.setAttribute('stroke', color);
				}
			}

			// Clear reference
			this.pitchDragInitElementId = null;
		}
	}

	private _getPitchPreviewElement(color: string): SVGTextElement {
		// Create pitch preview element - use Unicode note head character
		const preview = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		preview.textContent = '\uE0A4'; // Unicode character U+E0A4
		const fontSize = this.graceNote !== null ? 27 : 41;
		preview.setAttribute('fill', color);
		preview.setAttribute('stroke', color);
		preview.setAttribute('opacity', '1');
		preview.setAttribute('font-family', 'Bravura, serif');
		preview.setAttribute('font-size', fontSize.toString());
		preview.setAttribute('lengthAdjust', 'spacingAndGlyphs');

		preview.setAttribute('class', 'pitch-preview');

		return preview;
	}

	private _getVoiceNoteheadColor(): string {
		const colors = [
			NoteEntryCaret.VOICE_1_NOTEHEAD_COLOR,
			NoteEntryCaret.VOICE_2_NOTEHEAD_COLOR,
			NoteEntryCaret.VOICE_3_NOTEHEAD_COLOR,
			NoteEntryCaret.VOICE_4_NOTEHEAD_COLOR,
		];

		return colors[this.voice] ?? NoteEntryCaret.VOICE_1_NOTEHEAD_COLOR;
	}

	private _getVoicePreviewColor(): string {
		const colors = [
			NoteEntryCaret.VOICE_1_PREVIEW_NOTEHEAD_COLOR,
			NoteEntryCaret.VOICE_2_PREVIEW_NOTEHEAD_COLOR,
			NoteEntryCaret.VOICE_3_PREVIEW_NOTEHEAD_COLOR,
			NoteEntryCaret.VOICE_4_PREVIEW_NOTEHEAD_COLOR,
		];

		return colors[this.voice] ?? NoteEntryCaret.VOICE_1_PREVIEW_NOTEHEAD_COLOR;
	}

	private _getVoiceCursorRectangleColor(): string {
		const colors = [
			NoteEntryCaret.VOICE_1_CURSOR_RECTANGLE_COLOR,
			NoteEntryCaret.VOICE_2_CURSOR_RECTANGLE_COLOR,
			NoteEntryCaret.VOICE_3_CURSOR_RECTANGLE_COLOR,
			NoteEntryCaret.VOICE_4_CURSOR_RECTANGLE_COLOR,
		];

		return colors[this.voice] ?? NoteEntryCaret.VOICE_1_PREVIEW_NOTEHEAD_COLOR;
	}

	//todo: vexnote has maxLine and minLine and maybe we should use these properties instead of calculating
	private _getLedgerLinePositions(staffLine: number): number[] {
		const positions: number[] = [];

		if (staffLine >= 6) {
			// Find highest existing pitch above staff
			const occupiedAbove = this.occupiedStaffLines.filter(l => l >= 6);
			const highestOccupied = occupiedAbove.length > 0 ? Math.max(...occupiedAbove) : 5;

			// Only draw ledger lines beyond the highest existing pitch
			const startLine = Math.max(6, Math.floor(highestOccupied + 1));
			for (let line = startLine; line <= Math.floor(staffLine); line++) {
				positions.push(line);
			}
		} else if (staffLine <= 0) {
			// Find lowest existing pitch below staff
			const occupiedBelow = this.occupiedStaffLines.filter(l => l <= 0);
			const lowestOccupied = occupiedBelow.length > 0 ? Math.min(...occupiedBelow) : 1;

			// Only draw ledger lines beyond the lowest existing pitch
			const startLine = Math.min(0, Math.ceil(lowestOccupied - 1));
			for (let line = startLine; line >= Math.ceil(staffLine); line--) {
				positions.push(line);
			}
		}

		return positions;
	}

	private _createLedgerLineElement(staffLine: number, color: string): SVGLineElement {
		const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');

		const y = this._calculateYFromStaffLine(staffLine) - this.context!.box.y;
		// const x = this.vexNoteAbsoluteX + this.vexNoteXShift;

		const ledgerLineWidth = 15;
		const x1 = this.vexNoteAbsoluteX + this.vexNoteXShift - 3;
		const x2 = x1 + ledgerLineWidth + 3;

		line.setAttribute('x1', x1.toString());
		line.setAttribute('y1', y.toString());
		line.setAttribute('x2', x2.toString());
		line.setAttribute('y2', y.toString());
		line.setAttribute('stroke-width', '1.4');
		line.setAttribute('fill', 'none');
		line.setAttribute('stroke', color);
		line.setAttribute('class', 'pitch-preview-ledger');

		return line;
	}

	private _calculateStaffLineFromY(mouseY: number): number {
		const scrollState = this.tracker?.scroller.scrollState;
		const bb = SvgHelpers.boxPoints(0, mouseY + scrollState.y, 1, 1);
		const mouseSvgPoint = this.tracker.renderer.pageMap.clientToSvg(bb);

		const relativeY = mouseSvgPoint.y - this.caretBoundaryBox.y;

		const firstLegderBellowStaffY = NoteEntryCaret.LEDGER_POSITIONS_ABOVE * NoteEntryCaret.STAFF_LINE_HEIGHT + NoteEntryCaret.STAFF_HEIGHT;

		// Calculate staff line position from Y coordinate
		const staffLine = Math.round((firstLegderBellowStaffY - relativeY) / (NoteEntryCaret.STAFF_LINE_HEIGHT / 2)) / 2;

		return staffLine;
	}

	private _calculateYFromStaffLine(staffLine: number): number {
		const firstLegderBellowStaffY = NoteEntryCaret.LEDGER_POSITIONS_ABOVE * NoteEntryCaret.STAFF_LINE_HEIGHT + NoteEntryCaret.STAFF_HEIGHT;
		const relativeY = firstLegderBellowStaffY - (staffLine * NoteEntryCaret.STAFF_LINE_HEIGHT);

		return relativeY + this.caretBoundaryBox.y;
	}

	private _unrender(): void {
		// Restore pitch highlight colors before removing elements
		this._unrenderPitchHighlight();

		// Remove caret from display
		if (this.cursorRectangleElement) {
			this.cursorRectangleElement.remove();
			this.cursorRectangleElement = null;
		}
		// Also clear pitch preview
		this.resetInteraction();
	}

	public resetInteraction(): void {
		// Clear drag-init highlight when mouse leaves the caret boundary
		// but preserve pitch selection highlight (if any)
		this._unrenderPitchDragInitHighlight();
		this._unrenderPitchPreview();
		this.currentStaffLine = null;
		this.staffLineOnMouseDown = null;
		this.staffLineOnMouseUp = null;
	}

	private _getActiveVexNote(): Note | GraceNote | null {
		if (this.graceNote) {
			return this.graceNote.vexGraceNote;
		}
		return this.note?.vexNote ?? null;
	}

	private static _hasMultipleNoteHeadsOnSameLine(noteHeads: any[]): boolean {
		const staffLineCounts = new Map<number, number>();

		for (const noteHead of noteHeads) {
			const staffLine = noteHead.getLine();
			const count = (staffLineCounts.get(staffLine) || 0) + 1;

			// Found two noteheads on the same line
			if (count > 1) {
				return true;
			}

			staffLineCounts.set(staffLine, count);
		}

		return false;
	}

	private _findPitchIndexForStaffLineAndMouseX(staffLine: number, mouseX: number): number {
		if (!this.selection || !this.activeNote) {
			return -1;
		}

		const vexNote = this._getActiveVexNote();
		if (!vexNote) {
			return -1;
		}

		const staveNote = vexNote as StaveNote;
		const noteHeads = staveNote.noteHeads;

		// Find all noteheads on this staff line
		const matchingNoteHeads: { index: number; noteHead: any; x: number }[] = [];

		noteHeads.forEach((noteHead, index) => {
			if (noteHead.getLine() === staffLine) {
				// Get the X position of the notehead
				const noteHeadX = noteHead.getAbsoluteX();
				matchingNoteHeads.push({ index, noteHead, x: noteHeadX });
			}
		});

		if (matchingNoteHeads.length === 0) {
			return -1;
		}

		// If only one notehead on this staff line, return it
		if (matchingNoteHeads.length === 1) {
			return matchingNoteHeads[0].index;
		}

		// Multiple noteheads on same staff line - find which one contains the mouse X
		// Convert mouse clientX to SVG coordinates
		const scrollState = this.tracker?.scroller.scrollState;
		const bb = SvgHelpers.boxPoints(mouseX + scrollState.x, 0, 1, 1);
		const mouseSvgPoint = this.tracker.renderer.pageMap.clientToSvg(bb);
		const mouseSvgX = mouseSvgPoint.x;

		// Find the notehead that contains the mouse X position
		for (const match of matchingNoteHeads) {
			const noteHeadWidth = match.noteHead.getWidth();
			const noteHeadStartX = match.x;
			const noteHeadEndX = noteHeadStartX + noteHeadWidth;

			// Check if mouse X is within this notehead's bounds
			if (mouseSvgX >= noteHeadStartX && mouseSvgX <= noteHeadEndX) {
				return match.index;
			}
		}

		// If no notehead contains the mouse (clicked between noteheads), return -1
		return -1;
	}
}