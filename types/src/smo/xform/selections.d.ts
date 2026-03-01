/**
 * Editing operations are performed on selections.  A selection can be different things, from a single pitch
 * to many notes.  These classes standardize some standard selection operations.
 * SmoSelector
 * @module /smo/xform/selections
 */
import { SmoScore, SmoModifier } from '../data/score';
import { SmoMeasure } from '../data/measure';
import { SmoNote } from '../data/note';
import { SmoSystemStaff } from '../data/systemStaff';
import { SvgBox, SvgPoint } from '../data/common';
/**
 * Modifier tab is a modifier and its bounding box, that can be tabbed to with the keyboard
 * @category SmoTransform
 */
export interface ModifierTab {
    modifier: SmoModifier;
    selection: SmoSelection | null;
    box: SvgBox;
    index: number;
}
/**
 * There are 2 parts to a selection: the actual musical bits that are selected, and the
 * indices that define what was selected.  This is the latter.  The actual object does not
 * have any methods so there is no constructor.
 * @category SmoTransform
 * */
export declare class SmoSelector {
    static get default(): SmoSelector;
    staff: number;
    measure: number;
    voice: number;
    tick: number;
    pitches: number[];
    static measureSelector(staff: number, measure: number): SmoSelector;
    static fromMeasure(measure: SmoMeasure): SmoSelector;
    static sameNote(sel1: SmoSelector, sel2: SmoSelector): boolean;
    static sameMeasure(sel1: SmoSelector, sel2: SmoSelector): boolean;
    static sameStaff(sel1: SmoSelector, sel2: SmoSelector): boolean;
    /**
     * Return gt, not considering the voice (e.g. gt in time)
     * @param sel1
     * @param sel2
     */
    static gtInTime(sel1: SmoSelector, sel2: SmoSelector): boolean;
    /**
     * return true if sel1 > sel2
     */
    static gt(sel1: SmoSelector, sel2: SmoSelector): boolean;
    static eq(sel1: SmoSelector, sel2: SmoSelector): boolean;
    static neq(sel1: SmoSelector, sel2: SmoSelector): boolean;
    /**
     * return true if sel1 < sel2
     */
    static lt(sel1: SmoSelector, sel2: SmoSelector): boolean;
    /**
     * return true if sel1 >= sel2
     */
    static gteq(sel1: SmoSelector, sel2: SmoSelector): boolean;
    /**
     * return true if sel1 <= sel2
     */
    static lteq(sel1: SmoSelector, sel2: SmoSelector): boolean;
    static order(a: SmoSelector, b: SmoSelector): SmoSelector[];
    static getNoteKey(selector: SmoSelector): string;
    static getMeasureKey(selector: SmoSelector): string;
    static contains(testSel: SmoSelector, selStart: SmoSelector, selEnd: SmoSelector): boolean;
    static overlaps(start1: SmoSelector, end1: SmoSelector, start2: SmoSelector, end2: SmoSelector): boolean;
    static selectorNoteKey(selector: SmoSelector): string;
}
/**
 * The fields in a selection.  We have the 5 musical cardinal directions of staff, measure, note, pitches,
 * and a selector.  The pitches are indices
 * @category SmoTransform
 *  */
export interface SmoSelectionParams {
    selector: SmoSelector;
    _staff: SmoSystemStaff;
    _measure: SmoMeasure;
    _note?: SmoNote;
    _pitches?: number[];
    type?: string;
    box?: SvgBox;
}
/**
 * A selection is a {@link SmoSelector} and a set of references to musical elements, like measure etc.
 * The staff and measure are always a part of the selection, and possible a voice and note,
 * and one or more pitches.  Selections can also be made from the UI by clicking on an element
 * or navigating to an element with the keyboard.
 * @category SmoTransform
 * */
export declare class SmoSelection {
    selector: SmoSelector;
    _staff: SmoSystemStaff;
    _measure: SmoMeasure;
    _note: SmoNote | null;
    _pitches: number[];
    box: SvgBox | null;
    scrollBox: SvgPoint | null;
    static measureSelection(score: SmoScore, staffIndex: number, measureIndex: number): SmoSelection | null;
    static measuresInColumn(score: SmoScore, staffIndex: number): SmoSelection[];
    static noteSelection(score: SmoScore, staffIndex: number, measureIndex: number, voiceIndex: number, tickIndex: number): SmoSelection | null;
    static noteFromSelector(score: SmoScore, selector: SmoSelector): SmoSelection | null;
    static selectionsToEnd(score: SmoScore, staff: number, startMeasure: number): SmoSelection[];
    static selectionFromSelector(score: SmoScore, selector: SmoSelector): SmoSelection | null;
    static pitchSelection(score: SmoScore, staffIndex: number, measureIndex: number, voiceIndex: number, tickIndex: number, pitches: number[]): SmoSelection;
    /**
     * Return the selection that is tickCount ticks after the current selection.
     * @param score
     * @param selection
     * @param tickCount
     * @returns
     */
    static advanceTicks(score: SmoScore, selection: SmoSelection, tickCount: number): SmoSelection | null;
    /**
     * Count the number of tick indices between selector 1 and selector 2;
     * @param score
     * @param sel1
     * @param sel2
     * @returns
     */
    static countTickIndices(score: SmoScore, sel1: SmoSelector, sel2: SmoSelector): number;
    /**
       * Count the number of tick indices between selector 1 and selector 2;
       * @param score
       * @param sel1
       * @param sel2
       * @returns
       */
    static countTicks(score: SmoScore, sel1: SmoSelector, sel2: SmoSelector): number;
    static nextNoteSelectionIncludeVoice(score: SmoScore, staffIndex: number, measureIndex: number, voiceIndex: number, tickIndex: number): SmoSelection | null;
    static nextNoteSelection(score: SmoScore, staffIndex: number, measureIndex: number, voiceIndex: number, tickIndex: number): SmoSelection | null;
    /**
     *
     * @param score
     * @param selector
     * @returns
     */
    static innerSelections(score: SmoScore, startSelector: SmoSelector, endSelector: SmoSelector): SmoSelection[];
    static nextNoteSelectionFromSelector(score: SmoScore, selector: SmoSelector): SmoSelection | null;
    static lastNoteSelectionFromSelector(score: SmoScore, selector: SmoSelector): SmoSelection | null;
    static lastNoteSelection(score: SmoScore, staffIndex: number, measureIndex: number, voiceIndex: number, tickIndex: number): SmoSelection | null;
    static lastNoteSelectionNonRest(score: SmoScore, staffIndex: number, measureIndex: number, voiceIndex: number, tickIndex: number): SmoSelection | null;
    static nextNoteSelectionNonRest(score: SmoScore, staffIndex: number, measureIndex: number, voiceIndex: number, tickIndex: number): SmoSelection | null;
    static getMeasureList(selections: SmoSelection[]): SmoSelection[];
    static getMeasuresBetween(score: SmoScore, fromSelector: SmoSelector, toSelector: SmoSelector): SmoSelection[];
    static selectionsSameMeasure(selections: SmoSelection[]): boolean;
    static selectionsSameStaff(selections: SmoSelection[]): boolean;
    constructor(params: SmoSelectionParams);
    get staff(): SmoSystemStaff;
    get measure(): SmoMeasure;
    get note(): SmoNote | null;
    get pitches(): number[];
}
