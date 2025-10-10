import {SvgBox, Ticks} from "../../smo/data/common";
import {SuiTracker} from "./tracker";
import {SmoSelection} from "../../smo/xform/selections";
import {SvgPage} from "./svgPageMap";
import {SvgHelpers} from "./svgHelpers";
import {SmoMeasure} from "../../smo/data/measure";
import {SmoNote} from "../../smo/data/note";
import {SmoMusic} from "../../smo/data/music";
import {SmoOperation} from "../../smo/xform/operations";
import {SuiScoreViewOperations} from "./scoreViewOperations";
import {SuiScoreView} from "./scoreView";

export class NoteEntryCaret {
	static readonly CARET_WIDTH = 20;

	static readonly STAFF_LINE_HEIGHT = 10;
	static readonly STAFF_LINE_COUNT = 5;
	static readonly STAFF_HEIGHT = NoteEntryCaret.STAFF_LINE_HEIGHT * NoteEntryCaret.STAFF_LINE_COUNT;

	static readonly LEDGER_POSITIONS_ABOVE = 6;
	static readonly LEDGER_POSITIONS_BELOW = 6;

	static readonly CARET_HEIGHT = NoteEntryCaret.STAFF_HEIGHT +
		(NoteEntryCaret.LEDGER_POSITIONS_ABOVE * NoteEntryCaret.STAFF_LINE_HEIGHT) +
		(NoteEntryCaret.LEDGER_POSITIONS_BELOW * NoteEntryCaret.STAFF_LINE_HEIGHT);

	//TODO: check if this is needed
	static readonly DEFAULT_NOTE_DURATION: Ticks = { numerator: 4096, denominator: 1, remainder: 0 };
	static readonly DEFAULT_NOTE_MODE: 'note' | 'rest' = 'note';

	box: SvgBox;
	previewElementX: number = 0;
	tracker: SuiTracker;
	view: SuiScoreViewOperations;
	selection: SmoSelection | undefined;
	context: SvgPage | undefined;

	mode: 'note' | 'rest' = NoteEntryCaret.DEFAULT_NOTE_MODE;
	duration: Ticks = NoteEntryCaret.DEFAULT_NOTE_DURATION;
	previewElement: SVGRectElement | null = null;

	// Pitch preview
	pitchPreviewElement: SVGTextElement | null = null;
	currentStaffLine: number | null = null;
	occupiedStaffLines: number[] = [];

	constructor(view: SuiScoreViewOperations, tracker: SuiTracker) {
		this.box = SvgHelpers.boxPoints(0, 0, NoteEntryCaret.CARET_WIDTH, NoteEntryCaret.CARET_HEIGHT);
		this.tracker = tracker;
		this.view = view;
	}

	setSmoSelection(selection: SmoSelection): void {
		this.selection = selection;
		if (!this.selection?.note) return;

		this.adjustCoordinatesAndSetContext(this.selection.measure, this.selection.note);
		this.fillOccupiedStaffLines(this.selection.measure, this.selection.note);

	}

	fillOccupiedStaffLines(measure: SmoMeasure, note: SmoNote) {
		this.occupiedStaffLines = [];
		for (const pitch of note.pitches) {
			this.occupiedStaffLines.push(SmoMusic.pitchToStaffLine(measure.clef, pitch));
		}
	}

	adjustCoordinatesAndSetContext(measure: SmoMeasure, note: SmoNote): void {
		const staffY = measure.staffY;
		// Calculate top Y: staff Y minus ledger lines above
		const y = staffY - (NoteEntryCaret.LEDGER_POSITIONS_ABOVE * NoteEntryCaret.STAFF_LINE_HEIGHT);

		if (!note.vexNoteCoordinates) {
			console.warn("Note does not have coordinates");
			return;
		}

		this.box = SvgHelpers.boxPoints(
			note.vexNoteCoordinates.absoluteX - note.vexNoteCoordinates.leftDisplacedHeadPx,
			y,
			NoteEntryCaret.CARET_WIDTH,
			NoteEntryCaret.CARET_HEIGHT
		);

		this.previewElementX = note.vexNoteCoordinates.absoluteX;

		this.context = this.tracker.renderer.pageMap.getRenderer(this.box);
	}

	containsPoint(ev: any): boolean {
		const scrollState = this.tracker?.scroller.scrollState;
		const bb = SvgHelpers.boxPoints(ev.clientX + scrollState.x, ev.clientY + scrollState.y, 1, 1);
		const point = this.tracker.renderer.pageMap.clientToSvg(bb);

		return SvgHelpers.doesBox1ContainBox2(this.box, point);
	}

	calculateStaffLineFromY(mouseY: number): number {
		const scrollState = this.tracker?.scroller.scrollState;
		const bb = SvgHelpers.boxPoints(0, mouseY + scrollState.y, 1, 1);
		const mouseSvgPoint = this.tracker.renderer.pageMap.clientToSvg(bb);

		const relativeY = mouseSvgPoint.y - this.box.y;

		const firstLegderBellowStaffY = NoteEntryCaret.LEDGER_POSITIONS_ABOVE * NoteEntryCaret.STAFF_LINE_HEIGHT + NoteEntryCaret.STAFF_HEIGHT;

		// Calculate staff line position from Y coordinate
		const staffLine = Math.round((firstLegderBellowStaffY - relativeY) / (NoteEntryCaret.STAFF_LINE_HEIGHT / 2)) / 2;

		return staffLine;
	}

	calculateYFromStaffLine(staffLine: number): number {
		const firstLegderBellowStaffY = NoteEntryCaret.LEDGER_POSITIONS_ABOVE * NoteEntryCaret.STAFF_LINE_HEIGHT + NoteEntryCaret.STAFF_HEIGHT;
		const relativeY = firstLegderBellowStaffY - (staffLine * NoteEntryCaret.STAFF_LINE_HEIGHT);

		return relativeY + this.box.y;
	}

	// Method to render pitch preview
	renderPitchPreview(staffLine: number): void {
		this.unrenderPitchPreview();

		if (this.context !== undefined) {
			//check if staffLine has a pitch on it
			//in case it does, do not render pitch preview
			if (!this.occupiedStaffLines.includes(staffLine)) {
				const staffLineY = this.calculateYFromStaffLine(staffLine);
				const adjustedY = staffLineY - this.context.box.y;

				const preview = this.getPitchPreviewElement();
				preview.setAttribute('x', this.previewElementX.toString());
				preview.setAttribute('y', adjustedY.toString());

				// Add to the correct SVG context
				this.context.svg.appendChild(preview);
				this.pitchPreviewElement = preview;
			}
		}
	}

	unrenderPitchPreview(): void {
		if (this.pitchPreviewElement) {
			this.pitchPreviewElement.remove();
			this.pitchPreviewElement = null;
		}
	}

	getPitchPreviewElement(): SVGTextElement {
		// Create pitch preview element - use Unicode note head character
		const preview = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		preview.textContent = '\uE0A4'; // Unicode character U+E0A4
		preview.setAttribute('fill', '#6d6d9a');
		preview.setAttribute('stroke', '#6d6d9a');
		preview.setAttribute('opacity', '1');
		preview.setAttribute('font-family', 'Bravura, serif');
		preview.setAttribute('font-size', '42');

		preview.setAttribute('class', 'pitch-preview');
		preview.setAttribute('style', 'cursor: default; pointer-events: none;');

		return preview;
	}

	clearPitchPreview(): void {
		this.unrenderPitchPreview();
		this.currentStaffLine = null;
	}

	handleMouseMove(ev: any): void {
		const staffLine = this.calculateStaffLineFromY(ev.clientY);
		if (this.currentStaffLine !== staffLine) {
			this.currentStaffLine = staffLine;
			this.renderPitchPreview(staffLine);
		}
	}


	handleMouseUp(): void {
		// Handle note entry completion
	}

	handleMouseDown(): void {
		// Handle note entry initiation
	}

	handleMouseClick(ev: any): void {
		if (!this.selection) {
			return;
		}

		const staffLine = this.calculateStaffLineFromY(ev.clientY);
		const clef = this.selection.measure.clef;
		const pitch = SmoMusic.staffLineToPitch(clef, staffLine);
		this.view.setPitches([pitch]);
	}

	show(): void {
		this.render();
	}

	hide(): void {
		this.unrender();
		this.clearPitchPreview();
	}

	render(): void {

		this.unrender();

		if (this.context) {
			// Adjust coordinates for the page context
			const adjustedY = this.box.y - this.context.box.y;
			// Create the rectangle element
			const x = this.box.x;
			const y = adjustedY + (NoteEntryCaret.LEDGER_POSITIONS_ABOVE * NoteEntryCaret.STAFF_LINE_HEIGHT) - (NoteEntryCaret.STAFF_LINE_HEIGHT / 2);
			const width = 13;//px
			const height = NoteEntryCaret.STAFF_HEIGHT;

			const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
			rect.setAttribute('x', x.toString());
			rect.setAttribute('y', y.toString());
			rect.setAttribute('width', width.toString());
			rect.setAttribute('height', height.toString());
			rect.setAttribute('stroke', 'none');
			rect.setAttribute('fill', '#99d');
			rect.setAttribute('opacity', '0.5');
			rect.setAttribute('class', 'note-entry-caret');

			// Add to the correct SVG context - insert at beginning so it appears behind other elements
			this.context.svg.insertBefore(rect, this.context.svg.firstChild);
			this.previewElement = rect;
		}
	}

	unrender(): void {
		// Remove caret from display
		if (this.previewElement) {
			this.previewElement.remove();
			this.previewElement = null;
		}
		// Also clear pitch preview
		this.clearPitchPreview();
	}

}