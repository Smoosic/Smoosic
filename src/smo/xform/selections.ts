// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
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
import { smoSerialize } from '../../common/serializationHelpers';
/**
 * Modifier tab is a modifier and its bounding box, that can be tabbed to with the keyboard
 * @category SmoTransform
 */
 export interface ModifierTab {
  modifier: SmoModifier,
  selection: SmoSelection | null,
  box: SvgBox,
  index: number
}

/**
 * There are 2 parts to a selection: the actual musical bits that are selected, and the
 * indices that define what was selected.  This is the latter.  The actual object does not
 * have any methods so there is no constructor.
 * @category SmoTransform
 * */
export class SmoSelector {
  static get default(): SmoSelector {
    return {
      staff: 0,
      measure: 0,
      voice: 0,
      tick: -1,
      pitches: []
    };
  }
  staff: number = 0;
  measure: number = 0;
  voice: number = 0;
  tick: number = -1;
  pitches: number[] = [];

  static measureSelector(staff: number, measure: number): SmoSelector {
    return { staff, measure, voice: 0, tick: 0, pitches: [] };
  }
  static fromMeasure(measure: SmoMeasure) {
    return SmoSelector.measureSelector(measure.measureNumber.staffId, measure.measureNumber.localIndex);
  }
  // TODO:  tick in selector s/b tickIndex
  static sameNote(sel1: SmoSelector, sel2: SmoSelector): boolean {
    return (sel1.staff === sel2.staff && sel1.measure === sel2.measure && sel1.voice === sel2.voice
      && sel1.tick === sel2.tick);
  }
  static sameMeasure(sel1: SmoSelector, sel2: SmoSelector): boolean {
    return (sel1.staff === sel2.staff && sel1.measure === sel2.measure);
  }

  static sameStaff(sel1: SmoSelector, sel2: SmoSelector): boolean {
    return sel1.staff === sel2.staff;
  }
  /**
   * Return gt, not considering the voice (e.g. gt in time)
   * @param sel1 
   * @param sel2 
   */
  static gtInTime(sel1: SmoSelector, sel2: SmoSelector): boolean {
    return (sel1.measure > sel2.measure) ||
    (sel1.measure === sel2.measure && sel1.tick > sel2.tick);
  }

  
  /**
   * return true if sel1 > sel2
   */
  static gt(sel1: SmoSelector, sel2: SmoSelector): boolean {
    // Note: voice is not considered b/c it's more of a vertical component
    // Note further: sometimes we need to consider voice
    return (sel1.staff > sel2.staff) ||
      (sel1.staff === sel2.staff && sel1.measure > sel2.measure) ||
      (sel1.staff === sel2.staff && sel1.measure === sel2.measure && sel1.voice > sel2.voice) ||
      (sel1.staff === sel2.staff && sel1.measure === sel2.measure && sel1.voice === sel2.voice && sel1.tick > sel2.tick);
  }

  static eq(sel1: SmoSelector, sel2: SmoSelector): boolean {
    return (sel1.staff === sel2.staff && sel1.voice === sel2.voice && sel1.measure === sel2.measure && sel1.tick === sel2.tick);
  }
  static neq(sel1: SmoSelector, sel2: SmoSelector): boolean {
    return !(SmoSelector.eq(sel1, sel2));
  }

  /**
   * return true if sel1 < sel2
   */
  static lt(sel1: SmoSelector, sel2: SmoSelector): boolean {
    return SmoSelector.gt(sel2, sel1);
  }

  /**
   * return true if sel1 >= sel2
   */
  static gteq(sel1: SmoSelector, sel2: SmoSelector): boolean {
    return SmoSelector.gt(sel1, sel2) || SmoSelector.eq(sel1, sel2);
  }
  /**
   * return true if sel1 <= sel2
   */
  static lteq(sel1: SmoSelector, sel2: SmoSelector): boolean {
    return SmoSelector.lt(sel1, sel2) || SmoSelector.eq(sel1, sel2);
  }
  // Return 2 selectors in score order, rv[0] is first in time.
  static order(a: SmoSelector, b: SmoSelector): SmoSelector[] {
    if (SmoSelector.gtInTime(a, b)) {
      return [b, a];
    }
    return [a, b];
  }

  // ### getNoteKey
  // Get a key useful for a hash map of notes.
  static getNoteKey(selector: SmoSelector) {
    return '' + selector.staff + '-' + selector.measure + '-' + selector.voice + '-' + selector.tick;
  }

  static getMeasureKey(selector: SmoSelector) {
    return '' + selector.staff + '-' + selector.measure;
  }

  // return true if testSel is contained in the selStart to selEnd range.
  static contains(testSel: SmoSelector, selStart: SmoSelector, selEnd: SmoSelector) {
    const geStart =
      selStart.measure < testSel.measure ||
      (selStart.measure === testSel.measure && selStart.tick <= testSel.tick);
    const leEnd =
      selEnd.measure > testSel.measure ||
      (selEnd.measure === testSel.measure && testSel.tick <= selEnd.tick);

    return geStart && leEnd;
  }
  static overlaps(start1: SmoSelector, end1: SmoSelector, start2: SmoSelector, end2: SmoSelector) {
    if (SmoSelector.contains(start1, start2, end2)) {
      return true;
    }
    if (SmoSelector.contains(end1, start2, end2)) {
      return true;
    }
    if (SmoSelector.contains(start2, start1, end1)) {
      return true;
    }
    if (SmoSelector.contains(end2, start1, end1)) {
      return true;
    }
    return false;
  }

  // create a hashmap key for a single note, used to organize modifiers
  static selectorNoteKey(selector: SmoSelector) {
    return 'staff-' + selector.staff + '-measure-' + selector.measure + '-voice-' + selector.voice + '-tick-' + selector.tick;
  }
}
/**
 * The fields in a selection.  We have the 5 musical cardinal directions of staff, measure, note, pitches, 
 * and a selector.  The pitches are indices
 * @category SmoTransform
 *  */
export interface SmoSelectionParams {
  selector: SmoSelector,
  _staff: SmoSystemStaff,
  _measure: SmoMeasure,
  _note?: SmoNote,
  _pitches?: number[],
  type?: string,
  box?: SvgBox
}

/**
 * A selection is a {@link SmoSelector} and a set of references to musical elements, like measure etc.
 * The staff and measure are always a part of the selection, and possible a voice and note,
 * and one or more pitches.  Selections can also be made from the UI by clicking on an element
 * or navigating to an element with the keyboard.
 * @category SmoTransform
 * */
export class SmoSelection {
  selector: SmoSelector = {
    staff: 0,
    measure: 0,
    voice: 0,
    tick: -1,
    pitches: []
  };
  _staff: SmoSystemStaff;
  _measure: SmoMeasure;
  _note: SmoNote | null;
  _pitches: number[] = [];
  box: SvgBox | null = null;
  scrollBox: SvgPoint | null = null;
  // ### measureSelection
  // A selection that does not contain a specific note
  static measureSelection(score: SmoScore, staffIndex: number, measureIndex: number): SmoSelection | null {
    staffIndex = staffIndex !== null ? staffIndex : score.activeStaff;
    const selector = {
      staff: staffIndex,
      measure: measureIndex,
      voice: 0,
      tick: 0,
      pitches: []
    };
    if (score.staves.length <= staffIndex) {
      return null;
    }
    const staff = score.staves[staffIndex];
    if (staff.measures.length <= measureIndex) {
      return null;
    }
    const measure = staff.measures[measureIndex];

    return new SmoSelection({
      selector,
      _staff: staff,
      _measure: measure,
      type: 'measure'
    });
  }

  static measuresInColumn(score: SmoScore, staffIndex: number): SmoSelection[] {
    let i = 0;
    const rv: SmoSelection[] = [];
    for (i = 0; i < score.staves.length; ++i) {
      const sel = SmoSelection.measureSelection(score, i, staffIndex);
      if (sel) {
        rv.push(sel);
      }
    }
    return rv;
  }

  // ### noteSelection
  // a selection that specifies a note in the score
  static noteSelection(score: SmoScore, staffIndex: number, measureIndex: number, voiceIndex: number, tickIndex: number): SmoSelection | null {
    staffIndex = staffIndex != null ? staffIndex : score.activeStaff;
    measureIndex = typeof (measureIndex) !== 'undefined' ? measureIndex : 0;
    voiceIndex = typeof (voiceIndex) !== 'undefined' ? voiceIndex : 0;
    const staff = score.staves[staffIndex];
    if (!staff) {
      return null;
    }
    const measure = staff.measures[measureIndex];
    if (!measure) {
      return null;
    }
    if (measure.voices.length <= voiceIndex) {
      return null;
    }
    if (measure.voices[voiceIndex].notes.length <= tickIndex) {
      return null;
    }
    const note = measure.voices[voiceIndex].notes[tickIndex];
    const selector: SmoSelector = {
      staff: staffIndex,
      measure: measureIndex,
      voice: voiceIndex,
      tick: tickIndex,
      pitches: []
    };
    return new SmoSelection({
      selector,
      _staff: staff,
      _measure: measure,
      _note: note,
      _pitches: [],
      type: 'note'
    });
  }

  // ### noteFromSelector
  // return a selection based on the passed-in selector
  static noteFromSelector(score: SmoScore, selector: SmoSelector): SmoSelection| null {
    return SmoSelection.noteSelection(score,
      selector.staff, selector.measure, selector.voice, selector.tick);
  }

  // ### selectionsToEnd
  // Select all the measures from startMeasure to the end of the score in the given staff.
  static selectionsToEnd(score: SmoScore, staff: number, startMeasure: number): SmoSelection[] {
    let i = 0;
    const rv: SmoSelection[] = [];
    for (i = startMeasure; i < score.staves[staff].measures.length; ++i) {
      const selection = SmoSelection.measureSelection(score, staff, i);
      if (selection) {
        rv.push(selection);
      }
    }
    return rv;
  }

  // ### renderedNoteSelection
  // return the appropriate type of selection from the selector, based on the selector.
  static selectionFromSelector(score: SmoScore, selector: SmoSelector): SmoSelection | null {
    if (typeof (selector.pitches) !== 'undefined' && selector.pitches.length) {
      return SmoSelection.pitchSelection(score,
        selector.staff, selector.measure, selector.voice, selector.tick, selector.pitches);
    }
    if (typeof (selector.tick) === 'number') {
      return SmoSelection.noteFromSelector(score, selector);
    }
    return SmoSelection.measureSelection(score, selector.staff, selector.measure);
  }

  static pitchSelection(score: SmoScore, staffIndex: number, measureIndex: number, voiceIndex: number, tickIndex: number, pitches: number[]) {
    staffIndex = staffIndex !== null ? staffIndex : score.activeStaff;
    measureIndex = typeof (measureIndex) !== 'undefined' ? measureIndex : 0;
    voiceIndex = typeof (voiceIndex) !== 'undefined' ? voiceIndex : 0;
    const staff = score.staves[staffIndex];
    const measure = staff.measures[measureIndex];
    const note = measure.voices[voiceIndex].notes[tickIndex];
    pitches = typeof (pitches) !== 'undefined' ? pitches : [];
    const pa: number[] = [];
    pitches.forEach((ix) => {
      pa.push(JSON.parse(JSON.stringify(note.pitches[ix])));
    });
    const selector = {
      staff: staffIndex,
      measure: measureIndex,
      voice: voiceIndex,
      tick: tickIndex,
      pitches
    };
    return new SmoSelection({
      selector,
      _staff: staff,
      _measure: measure,
      _note: note,
      _pitches: pa,
      type: 'pitches'
    });
  }
  /**
   * Return the selection that is tickCount ticks after the current selection.
   * @param score 
   * @param selection 
   * @param tickCount 
   * @returns 
   */
  static advanceTicks(score: SmoScore, selection: SmoSelection, tickCount: number): SmoSelection | null {
    let rv: SmoSelection | null = null;
    if (!selection.note) {
      return rv;
    }
    const staff = selection.staff;
    rv = SmoSelection.noteFromSelector(score, selection.selector);
    while (rv !== null && rv.note !== null && tickCount > 0) {
      const prevSelector = JSON.parse(JSON.stringify(rv.selector));
      const measureTicks = rv.measure.getMaxTicksVoice();
      const tickIx = rv.selector.tick;
      const voiceId = rv.measure.voices.length > rv.selector.voice ? rv.selector.voice : 0;
      // If the destination is more than a measure away, increment measure
      if (tickIx === 0 && tickCount >= measureTicks) {
        tickCount -= measureTicks;
        if (staff.measures.length > rv.selector.measure + 1) {
          rv.selector.measure += 1;
          rv.selector.tick = 0;
          rv = SmoSelection.selectionFromSelector(score, rv.selector);
        }
      } else if (selection.measure.voices[voiceId].notes.length > tickIx + 1) {
        // else count the tick and advance to next tick
        tickCount -= rv.note.tickCount;
        rv.selector.tick += 1;
        rv = SmoSelection.selectionFromSelector(score, rv.selector);
      } else if (staff.measures.length > rv.selector.measure + 1) {
        // else advance to next measure and start counting ticks there
        tickCount -= rv.note.tickCount;
        rv.selector.measure += 1;
        rv.selector.tick = 0;
        rv = SmoSelection.selectionFromSelector(score, rv.selector);
      }
      if (rv !== null && SmoSelector.eq(prevSelector, rv.selector)) {
        // No progress, start and end the same
        break;
      }
    }
    return rv;
  }
  /**
   * Count the number of tick indices between selector 1 and selector 2;
   * @param score 
   * @param sel1 
   * @param sel2 
   * @returns 
   */
  static countTicks(score: SmoScore, sel1: SmoSelector, sel2: SmoSelector): number {
    if (SmoSelector.eq(sel1, sel2)) {
      return 0;
    }
    const backwards = SmoSelector.gt(sel1, sel2);
    let ticks = 0;
    const startSelection = SmoSelection.selectionFromSelector(score, sel1);
    let endSelection = SmoSelection.selectionFromSelector(score, sel2);
    while (endSelection !== null && startSelection !== null) {
      if (SmoSelector.eq(startSelection.selector, endSelection.selector)) {
        break;
      }
      if (backwards) {
        endSelection = SmoSelection.nextNoteSelectionFromSelector(score, endSelection.selector);
        ticks -= 1;
      } else {
        endSelection = SmoSelection.lastNoteSelectionFromSelector(score, endSelection.selector);
        ticks += 1;
      }
    }
    return ticks;
  }

  // ## nextNoteSelection
  // ## Description:
  // Return the next note in this measure, or the first note of the next measure, if it exists.
  static nextNoteSelection(score: SmoScore, staffIndex: number, measureIndex: number, voiceIndex: number, tickIndex: number): SmoSelection | null {
    const nextTick = tickIndex + 1;
    const nextMeasure = measureIndex + 1;
    const staff = score.staves[staffIndex];
    const measure = staff.measures[measureIndex];
    if (measure.voices[voiceIndex].notes.length > nextTick) {
      return SmoSelection.noteSelection(score, staffIndex, measureIndex, voiceIndex, nextTick);
    }
    if (staff.measures.length > nextMeasure) {
      return SmoSelection.noteSelection(score, staffIndex, nextMeasure, voiceIndex, 0);
    }
    return null;
  }
  /**
   * 
   * @param score 
   * @param selector 
   * @returns 
   */
  static innerSelections(score: SmoScore, startSelector: SmoSelector, endSelector: SmoSelector) {
    const sels = SmoSelector.order(startSelector, endSelector);
    let start = JSON.parse(JSON.stringify(sels[0]));
    const rv: SmoSelection[] = [];
    let cur = SmoSelection.selectionFromSelector(score, start);
    if (cur) {
      rv.push(cur);
    }
    while (cur && SmoSelector.lt(start, sels[1])) {
      cur = SmoSelection.nextNoteSelection(score, start.staff, start.measure, start.voice, start.tick);
      if (cur) {
        start = JSON.parse(JSON.stringify(cur.selector));
        rv.push(cur);
      }
    }
    return rv;
  }
  static nextNoteSelectionFromSelector(score: SmoScore, selector: SmoSelector): SmoSelection | null {
    return SmoSelection.nextNoteSelection(score, selector.staff, selector.measure, selector.voice, selector.tick);
  }
  static lastNoteSelectionFromSelector(score: SmoScore, selector: SmoSelector): SmoSelection | null {
    return SmoSelection.lastNoteSelection(score, selector.staff, selector.measure, selector.voice, selector.tick);
  }

  static lastNoteSelection(score: SmoScore, staffIndex: number, measureIndex: number, voiceIndex: number, tickIndex: number): SmoSelection | null {
    const lastTick = tickIndex - 1;
    const lastMeasure = measureIndex - 1;
    const staff = score.staves[staffIndex];
    let measure = staff.measures[measureIndex];
    if (tickIndex > 0) {
      return SmoSelection.noteSelection(score, staffIndex, measureIndex, voiceIndex, lastTick);
    }
    if (lastMeasure >= 0) {
      measure = staff.measures[lastMeasure];
      if (voiceIndex >= measure.voices.length) {
        return null;
      }
      const noteIndex = measure.voices[voiceIndex].notes.length - 1;
      return SmoSelection.noteSelection(score, staffIndex, lastMeasure, voiceIndex, noteIndex);
    }
    if (measureIndex === 0 && voiceIndex === 0 && tickIndex === 0) {
      return null;
    }
    return SmoSelection.noteSelection(score, staffIndex, 0, 0, 0);
  }
  static lastNoteSelectionNonRest(score: SmoScore, staffIndex: number, measureIndex: number, voiceIndex: number, tickIndex: number): SmoSelection | null {
    let rv = SmoSelection.lastNoteSelection(score, staffIndex, measureIndex, voiceIndex, tickIndex);
    let best = rv;
    while (best !== null && best.note !== null) {
      if (!best.note.isRest()) {
        rv = best;
        break;
      }
      const selector = best.selector;
      best = SmoSelection.lastNoteSelection(score, selector.staff, selector.measure, selector.voice, selector.tick);
    }
    return rv;
  }
  static nextNoteSelectionNonRest(score: SmoScore, staffIndex: number, measureIndex: number, voiceIndex: number, tickIndex: number): SmoSelection | null {
    let rv = SmoSelection.nextNoteSelection(score, staffIndex, measureIndex, voiceIndex, tickIndex);
    let best = rv;
    while (best !== null && best.note !== null) {
      if (!best.note.isRest()) {
        rv = best;
        break;
      }
      const selector = best.selector;
      best = SmoSelection.nextNoteSelection(score, selector.staff, selector.measure, selector.voice, selector.tick);
    }
    return rv;
  }
  // ### getMeasureList
  // Gets the list of measures in an array from the selections
  static getMeasureList(selections: SmoSelection[]): SmoSelection[] {
    let i = 0;
    let cur = {};
    const rv: SmoSelection[] = [];
    if (!selections.length) {
      return rv;
    }
    cur = selections[0].selector.measure;
    for (i = 0; i < selections.length; ++i) {
      const sel: SmoSelection = selections[i];
      if (i === 0 || (sel.selector.measure !== cur)) {
        const _staff: SmoSystemStaff = sel._staff;
        const _measure: SmoMeasure = sel._measure;
        rv.push(
          new SmoSelection({
            selector: {
              staff: sel.selector.staff,
              measure: sel.selector.measure,
              voice: 0,
              tick: 0,
              pitches: []
            },
            _staff,
            _measure
          }));
      }
      cur = sel.selector.measure;
    }
    return rv;
  }
  static getMeasuresBetween(score: SmoScore, fromSelector: SmoSelector, toSelector: SmoSelector): SmoSelection[] {
    let i = 0;
    const rv: SmoSelection[] = [];
    if (fromSelector.staff !== toSelector.staff) {
      return rv;
    }
    for (i = fromSelector.measure; i <= toSelector.measure; ++i) {
      const sel = SmoSelection.measureSelection(score, fromSelector.staff, i);
      if (sel) {
        rv.push(sel);
      }
    }
    return rv;
  }
  // ### selectionsSameMeasure
  // Return true if the selections are all in the same measure.  Used to determine what
  // type of undo we need.
  static selectionsSameMeasure(selections: SmoSelection[]) {
    let i = 0;
    if (selections.length < 2) {
      return true;
    }
    const sel1 = selections[0].selector;
    for (i = 1; i < selections.length; ++i) {
      if (!SmoSelector.sameMeasure(sel1, selections[i].selector)) {
        return false;
      }
    }
    return true;
  }

  static selectionsSameStaff(selections: SmoSelection[]) {
    let i = 0;
    if (selections.length < 2) {
      return true;
    }
    const sel1 = selections[0].selector;
    for (i = 1; i < selections.length; ++i) {
      if (!SmoSelector.sameStaff(sel1, selections[i].selector)) {
        return false;
      }
    }
    return true;
  }

  constructor(params: SmoSelectionParams) {
    this.selector = {
      staff: 0,
      measure: 0,
      voice: 0,
      tick: 0,
      pitches: []
    };
    this._staff = params._staff;
    this._measure = params._measure;
    this._note = null;
    this._pitches = [];
    smoSerialize.vexMerge(this, params);
  }

  get staff() {
    return this._staff;
  }
  get measure() {
    return this._measure;
  }

  get note() {
    return this._note;
  }
  get pitches() {
    return this.selector.pitches;
  }
}
