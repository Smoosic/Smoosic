// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiMapper, SuiRendererBase } from './mapper';
import { SvgHelpers, StrokeInfo, OutlineInfo } from './svgHelpers';
import { SmoSelection, SmoSelector, ModifierTab } from '../../smo/xform/selections';
import { smoSerialize } from '../../common/serializationHelpers';
import { SuiOscillator } from '../audio/oscillator';
import { SmoScore } from '../../smo/data/score';
import { SvgBox, KeyEvent, defaultKeyEvent, keyHandler, Ticks, Pitch, PitchLetter } from '../../smo/data/common';
import { SmoMusic } from '../../smo/data/music';
import { SuiScroller } from './scroller';
import { PasteBuffer } from '../../smo/xform/copypaste';
import { SmoNote } from '../../smo/data/note';
import { SmoMeasure } from '../../smo/data/measure';
import { layoutDebug } from './layoutDebug';
import { SvgPage } from './svgPageMap';
import {SmoOperation} from "../../smo/xform/operations";
import {NoteEntryCaret} from "./NoteEntryCaret";
import {SmoGraceNote} from "../../smo/data/noteModifiers";
import {TrackerDelegate} from "./NoteEntryMediator";
declare var $: any;



export interface TrackerKeyHandler {
  moveHome : keyHandler, 
  moveEnd : keyHandler, 
  moveSelectionRight : keyHandler,
  moveSelectionLeft : keyHandler, 
  moveSelectionUp : keyHandler,
  moveSelectionDown : keyHandler,
  moveSelectionRightMeasure : keyHandler,
  moveSelectionLeftMeasure : keyHandler,
  advanceModifierSelection : keyHandler,
  growSelectionRight : keyHandler,
  growSelectionLeft : keyHandler, 
  moveSelectionPitchUp : keyHandler,
  moveSelectionPitchDown: keyHandler
}
/**
 * SuiTracker
 * A tracker maps the UI elements to the logical elements ,and allows the user to
 *  move through the score and make selections, for navigation and editing.
 * @category SuiRender
 */
export class SuiTracker extends SuiMapper implements TrackerKeyHandler {
  idleTimer: number = Date.now();
  musicCursorGlyph: SVGSVGElement | null = null;
  deferPlayAdvance: boolean = false;
  delegate: TrackerDelegate | null = null;
  static get strokes(): Record<string, StrokeInfo> {
    return {
      suggestion: {
        strokeName: 'suggestion',
        stroke: '#fc9',
        strokeWidth: 3,
        strokeDasharray: '4,1',
        fill: 'none',
        opacity: 1.0
      },
      selection: {
        strokeName: 'selection',
        stroke: '#99d',
        strokeWidth: 3,
        strokeDasharray: 2,
        fill: 'none',
        opacity: 1.0
      },
      staffModifier: {
        strokeName: 'staffModifier',
        stroke: '#933',
        strokeWidth: 3,
        fill: 'none',
        strokeDasharray: 0,
        opacity: 1.0
      }, pitchSelection: {
        strokeName: 'pitchSelection',
        stroke: '#933',
        strokeWidth: 3,
        fill: 'none',
        strokeDasharray: 0,
        opacity: 1.0
      }
    };
  }
  constructor(renderer: SuiRendererBase, scroller: SuiScroller) {
    super(renderer, scroller);
  }
  // ### renderElement
  // the element the score is rendered on
  get renderElement(): Element {
    return this.renderer.renderElement;
  }

  get score(): SmoScore | null {
    return this.renderer.score;
  }

  getIdleTime(): number {
    return this.idleTimer;
  }
  playSelection(artifact: SmoSelection) {
    if (!this.deferPlayAdvance && this.score) {
      SuiOscillator.playSelectionNow(artifact, this.score, 1);
    } else {
      this.deferPlayAdvance = false;
    }
  }
  deferNextAutoPlay() {
    if (this.score) {
      // don't play on advance if we've just added a note and played it because they overlap
      if (this.score.preferences.autoAdvance && this.score.preferences.autoPlay) {
        this.deferPlayAdvance = true;
      }
    }
  }

  getSelectedModifier() {
    if (this.modifierSelections.length) {
      return this.modifierSelections[0];
    }
    return null;
  }

  getSelectedModifiers() {
    return this.modifierSelections;
  }

  static serializeEvent(evKey: KeyEvent | null): any {
    if (!evKey) {
      return [];
    }
    const rv = {};
    smoSerialize.serializedMerge(['type', 'shiftKey', 'ctrlKey', 'altKey', 'key', 'keyCode'], evKey, rv);
    return rv;
  }

  advanceModifierSelection(keyEv?: KeyEvent) {
    if (!keyEv) {
      return;
    }
    this.idleTimer = Date.now();
    const offset = keyEv.key === 'ArrowLeft' ? -1 : 1;
    this.modifierIndex = this.modifierIndex + offset;
    this.modifierIndex = (this.modifierIndex === -2 && this.localModifiers.length) ?
      this.localModifiers.length - 1 : this.modifierIndex;
    if (this.modifierIndex >= this.localModifiers.length || this.modifierIndex < 0) {
      this.modifierIndex = -1;
      this.modifierSelections = [];
      $('.vf-staffModifier').remove();
      return;
    }
    const local: ModifierTab = this.localModifiers[this.modifierIndex];
    const box: SvgBox = SvgHelpers.smoBox(local.box) as SvgBox;
    this.modifierSelections = [{ index: 0, box, modifier: local.modifier, selection: local.selection }];
    this._highlightModifier();
  }

  static stringifyBox(box: SvgBox): string {
    return '{x:' + box.x + ',y:' + box.y + ',width:' + box.width + ',height:' + box.height + '}';
  }

  // ### _getOffsetSelection
  // Get the selector that is the offset of the first existing selection
  _getOffsetSelection(offset: number): SmoSelector {
    if (!this.score) {
      return SmoSelector.default;
    }
    let testSelection = this.getExtremeSelection(Math.sign(offset));
    const scopyTick = JSON.parse(JSON.stringify(testSelection.selector));
    const scopyMeasure = JSON.parse(JSON.stringify(testSelection.selector));
    scopyTick.tick += offset;
    scopyMeasure.measure += offset;
    const targetMeasure = SmoSelection.measureSelection(this.score, testSelection.selector.staff,
      scopyMeasure.measure);
    if (targetMeasure && targetMeasure.measure && targetMeasure.measure.voices.length <= scopyMeasure.voice) {
      scopyMeasure.voice = 0;
    }
    if (targetMeasure && targetMeasure.measure) {
      scopyMeasure.tick = (offset < 0) ? targetMeasure.measure.voices[scopyMeasure.voice].notes.length - 1 : 0;
    }

    if (testSelection.measure.voices.length > scopyTick.voice &&
      testSelection.measure.voices[scopyTick.voice].notes.length > scopyTick.tick && scopyTick.tick >= 0) {
      if (testSelection.selector.voice !== testSelection.measure.getActiveVoice()) {
        scopyTick.voice = testSelection.measure.getActiveVoice();
        testSelection = this._getClosestTick(scopyTick);
        return testSelection.selector;
      }
      return scopyTick;
    } else if (targetMeasure &&
      scopyMeasure.measure < testSelection.staff.measures.length && scopyMeasure.measure >= 0) {
      return scopyMeasure;
    }
    return testSelection.selector;
  }

  getSelectedGraceNotes(): ModifierTab[] {
    if (!this.modifierSelections.length) {
      return [];
    }
    const ff = this.modifierSelections.filter((mm) =>
      mm.modifier?.attrs?.type === 'SmoGraceNote'
    );
    return ff;
  }

  isGraceNoteSelected(): boolean {
    if (this.modifierSelections.length) {
      const ff = this.modifierSelections.findIndex((mm) => mm.modifier.attrs.type === 'SmoGraceNote');
      return ff >= 0;
    }
    return false;
  }

  _growGraceNoteSelections(offset: number) {
    this.idleTimer = Date.now();
    const far = this.modifierSelections.filter((mm) => mm.modifier.attrs.type === 'SmoGraceNote');
    if (!far.length) {
      return;
    }
    const ix = (offset < 0) ? 0 : far.length - 1;
    const sel: ModifierTab = far[ix] as ModifierTab;
    const left = this.localModifiers.filter((mt) =>
      mt.modifier?.attrs?.type === 'SmoGraceNote' && sel.selection && mt.selection &&
      SmoSelector.sameNote(mt.selection.selector, sel.selection.selector)
    );
    if (ix + offset < 0 || ix + offset >= left.length) {
      return;
    }
    const leftSel = left[ix + offset];
    if (!leftSel) {
      console.warn('bad selector in _growGraceNoteSelections');
    }
    leftSel.box = leftSel.box ?? SvgBox.default;
    this.modifierSelections.push(leftSel);
    this._highlightModifier();
  }
  get autoPlay(): boolean {
    return this.renderer.score ? this.renderer.score.preferences.autoPlay : false;
  }

  growSelectionRight() {
    this._growSelectionRight(false);
  }
  _growSelectionRight(skipPlay: boolean): number {
    this.idleTimer = Date.now();
    if (this.isGraceNoteSelected()) {
      this._growGraceNoteSelections(1);
      return 0;
    }
    const nselect = this._getOffsetSelection(1);
    // already selected
    const artifact = this._getClosestTick(nselect);
    if (!artifact) {
      return 0;
    }
    if (this.selections.find((sel) => SmoSelector.sameNote(sel.selector, artifact.selector))) {
      return 0;
    }
    if (!this.mapping && this.autoPlay && skipPlay === false && this.score) {
      this.playSelection(artifact);
    }
    this.selections.push(artifact);
    this.deferHighlight();
    this._createLocalModifiersList();
    return (artifact.note as SmoNote).tickCount;
  }
  moveHome(keyEvent?: KeyEvent) {
    const evKey = keyEvent ?? defaultKeyEvent();
    this.idleTimer = Date.now();
    const ls = this.selections[0].staff;
    if (evKey.ctrlKey) {
      const mm = ls.measures[0];
      const homeSel = this._getClosestTick({ staff: ls.staffId,
        measure: 0, voice: mm.getActiveVoice(), tick: 0, pitches: [] });
      if (evKey.shiftKey) {
        this._selectBetweenSelections(this.selections[0], homeSel);
      } else {
        this.selections = [homeSel];
        this.deferHighlight();
        this._createLocalModifiersList();
        if (homeSel.measure.svg.logicalBox) {
          this.scroller.scrollVisibleBox(homeSel.measure.svg.logicalBox);
        }
      }
    } else {
      const system = this.selections[0].measure.svg.lineIndex;
      const lm = ls.measures.find((mm) =>
        mm.svg.lineIndex === system && mm.measureNumber.systemIndex === 0);
      const mm = lm as SmoMeasure;
      const homeSel = this._getClosestTick({ staff: ls.staffId,
        measure: mm.measureNumber.measureIndex, voice: mm.getActiveVoice(),
        tick: 0, pitches: [] });
      if (evKey.shiftKey) {
        this._selectBetweenSelections(this.selections[0], homeSel);
      } else if (homeSel?.measure?.svg?.logicalBox) {
        this.selections = [homeSel];
        this.scroller.scrollVisibleBox(homeSel.measure.svg.logicalBox);
        this.deferHighlight();
        this._createLocalModifiersList();
      }
    }
  }
  moveEnd(keyEvent?: KeyEvent) {
    this.idleTimer = Date.now();
    const ls = this.selections[0].staff;
    const evKey = keyEvent ?? defaultKeyEvent();
    if (evKey.ctrlKey) {
      const lm = ls.measures[ls.measures.length - 1];
      const voiceIx = lm.getActiveVoice();
      const voice = lm.voices[voiceIx];
      const endSel = this._getClosestTick({ staff: ls.staffId,
        measure: ls.measures.length - 1, voice: voiceIx, tick: voice.notes.length - 1, pitches: [] });
      if (evKey.shiftKey) {
        this._selectBetweenSelections(this.selections[0], endSel);
      } else {
        this.selections = [endSel];
        this.deferHighlight();
        this._createLocalModifiersList();
        if (endSel.measure.svg.logicalBox) {
          this.scroller.scrollVisibleBox(endSel.measure.svg.logicalBox);
        }
      }
    } else {
      const system = this.selections[0].measure.svg.lineIndex;
      // find the largest measure index on this staff in this system
      const measures = ls.measures.filter((mm) =>
        mm.svg.lineIndex === system);
      const lm = measures.reduce((a, b) =>
        b.measureNumber.measureIndex > a.measureNumber.measureIndex ? b : a);
      const ticks = lm.voices[lm.getActiveVoice()].notes.length;
      const endSel = this._getClosestTick({ staff: ls.staffId,
        measure: lm.measureNumber.measureIndex, voice: lm.getActiveVoice(), tick: ticks - 1, pitches: [] });
      if (evKey.shiftKey) {
        this._selectBetweenSelections(this.selections[0], endSel);
      } else {
        this.selections = [endSel];
        this.deferHighlight();
        this._createLocalModifiersList();
        if (endSel.measure.svg.logicalBox) {
          this.scroller.scrollVisibleBox(endSel.measure.svg.logicalBox);
        }
      }
    }
  }
  growSelectionRightMeasure() {
    let toSelect = 0;
    const rightmost = this.getExtremeSelection(1);
    const ticksLeft = rightmost.measure.voices[rightmost.measure.activeVoice]
      .notes.length - rightmost.selector.tick;
    if (ticksLeft === 0) {
      if (rightmost.selector.measure < rightmost.staff.measures.length) {
        const mix = rightmost.selector.measure + 1;
        rightmost.staff.measures[mix].setActiveVoice(rightmost.selector.voice);
        toSelect = rightmost.staff.measures[mix]
          .voices[rightmost.staff.measures[mix].activeVoice].notes.length;
      }
    } else {
      toSelect = ticksLeft;
    }
    while (toSelect > 0) {
      this._growSelectionRight(true);
      toSelect -= 1;
    }
  }

  growSelectionLeft(): number {
    if (this.isGraceNoteSelected()) {
      this._growGraceNoteSelections(-1);
      return 0;
    }
    this.idleTimer = Date.now();
    const nselect = this._getOffsetSelection(-1);
    // already selected
    const artifact = this._getClosestTick(nselect);
    if (!artifact) {
      return 0;
    }
    if (this.selections.find((sel) => SmoSelector.sameNote(sel.selector, artifact.selector))) {
      return 0;
    }
    artifact.measure.setActiveVoice(nselect.voice);
    this.selections.push(artifact);
    if (this.autoPlay && this.score) {
      this.playSelection(artifact);
    }
    this.deferHighlight();
    this._createLocalModifiersList();
    return (artifact.note as SmoNote).tickCount;
  }

  // if we are being moved right programmatically, avoid playing the selected note.
  moveSelectionRight() {
    if (this.selections.length === 0 || this.score === null) {
      return;
    }
    const skipPlay = !this.score.preferences.autoPlay;
    // const original = JSON.parse(JSON.stringify(this.getExtremeSelection(-1).selector));
    const nselect = this._getOffsetSelection(1);
    // skip any measures that are not displayed due to rest or repetition
    const mselect = SmoSelection.measureSelection(this.score, nselect.staff, nselect.measure);    
    if (mselect?.measure.svg.multimeasureLength) {
      nselect.measure += mselect?.measure.svg.multimeasureLength;
    }
    if (mselect) {
      mselect.measure.setActiveVoice(nselect.voice);
    }
    this._replaceSelection(nselect, skipPlay);
  }

  moveSelectionLeft() {
    if (this.selections.length === 0 || this.score === null) {
      return;
    }
    const nselect = this._getOffsetSelection(-1);
    // Skip multimeasure rests in parts
    const mselect = SmoSelection.measureSelection(this.score, nselect.staff, nselect.measure);
    while (nselect.measure > 0 && mselect && (mselect.measure.svg.hideMultimeasure || mselect.measure.svg.multimeasureLength > 0)) {
      nselect.measure -= 1;
    }
    if (mselect) {
      mselect.measure.setActiveVoice(nselect.voice);
    }    
    this._replaceSelection(nselect, false);
  }
  moveSelectionLeftMeasure() {
    this._moveSelectionMeasure(-1);
  }
  moveSelectionRightMeasure() {
    this._moveSelectionMeasure(1);
  }
  _moveSelectionMeasure(offset: number) {
    const selection = this.getExtremeSelection(Math.sign(offset));
    this.idleTimer = Date.now();
    const selector = JSON.parse(JSON.stringify(selection.selector));
    selector.measure += offset;
    selector.tick = 0;
    const selObj = this._getClosestTick(selector);
    if (selObj) {
      this.selections = [selObj];
    }
    this.deferHighlight();
    this._createLocalModifiersList();
  }

  _moveStaffOffset(offset: number) {
    if (this.selections.length === 0 || this.score === null) {
      return;
    }
    this.idleTimer = Date.now();
    const nselector = JSON.parse(JSON.stringify(this.selections[0].selector));
    nselector.staff = this.score.incrementActiveStaff(offset);

    this.selections = [this._getClosestTick(nselector)];
    this.deferHighlight();
    this._createLocalModifiersList();
  }


  /**
   * Set a specific pitch index (called by caret for mouse clicks)
   * This updates the visual pitch selection without modifying data
   */
  setPitchIndex(index: number): void {
    if (!this.selections.length) {
      return;
    }

    const note = this.selections[0].note as SmoNote;
    if (!note || index < 0 || index >= note.pitches.length) {
      return;
    }

    // Update the selected pitch index
    this.pitchIndex = index;
    this.selections[0].selector.pitches = [index];

    // Notify via callback
    this.delegate?.onPitchIndexChanged(index);
  }

  getPitchIndex(): number {
    return this.pitchIndex;
  }

  clearPitchIndex(): void {
    this.pitchIndex = -1;
    if (this.selections.length) {
      this.selections[0].selector.pitches = [];
    }
    // Notify via callback
    this.delegate?.onPitchIndexChanged(-1);
  }

  // Suggest a specific pitch in a chord, so we can transpose just the one note vs. the whole chord.
  _moveSelectionPitch(index: number) {
    this.idleTimer = Date.now();
    if (!this.selections.length) {
      return;
    }
    const sel = this.selections[0];
    const note = sel.note as SmoNote;
    if (note.pitches.length < 2) {
      this.pitchIndex = -1;
      // Emit event for pitch index reset
      this.delegate?.onPitchIndexChanged(-1);
      return;
    }
    this.pitchIndex = (this.pitchIndex + index) % note.pitches.length;
    sel.selector.pitches = [];
    sel.selector.pitches.push(this.pitchIndex);

    // Notify via callback
    this.delegate?.onPitchIndexChanged(this.pitchIndex);
  }
  moveSelectionPitchUp() {
    this._moveSelectionPitch(1);
  }
  moveSelectionPitchDown() {
    if (!this.selections.length) {
      return;
    }
    this._moveSelectionPitch((this.selections[0].note as SmoNote).pitches.length - 1);
  }

  moveSelectionUp() {
    this._moveStaffOffset(-1);
  }
  moveSelectionDown() {
    this._moveStaffOffset(1);
  }

  containsArtifact(): boolean {
    return this.selections.length > 0;
  }

  _replaceSelection(nselector: SmoSelector, skipPlay: boolean) {
    if (this.score === null) {
      return;
    }
    var artifact = SmoSelection.noteSelection(this.score, nselector.staff, nselector.measure, nselector.voice, nselector.tick);
    if (!artifact) {
      artifact = SmoSelection.noteSelection(this.score, nselector.staff, nselector.measure, 0, nselector.tick);
    }
    if (!artifact) {
      artifact = SmoSelection.noteSelection(this.score, nselector.staff, nselector.measure, 0, 0);
    }
    if (!artifact) {
      // disappeared - default to start
      artifact = SmoSelection.noteSelection(this.score, 0, 0, 0, 0);
    }
    if (!skipPlay && this.autoPlay && artifact) {
      this.playSelection(artifact);

    }
    if (!artifact) {
      return;
    }
    artifact.measure.setActiveVoice(nselector.voice);

    // clear modifier selections
    this.clearModifierSelections();
    this.score.setActiveStaff(nselector.staff);
    const mapKey = Object.keys(this.measureNoteMap).find((k) =>
      artifact && SmoSelector.sameNote(this.measureNoteMap[k].selector, artifact.selector)
    );
    if (!mapKey) {
      return;
    }
    const mapped = this.measureNoteMap[mapKey];
    // If this is a new selection, remove pitch-specific and replace with note-specific
    if (!nselector.pitches || nselector.pitches.length === 0) {
      this.pitchIndex = -1;
    }

    this.selections = [mapped];
    this.deferHighlight();
    this._createLocalModifiersList();
  }

  getFirstMeasureOfSelection() {
    if (this.selections.length) {
      return this.selections[0].measure;
    }
    return null;
  }
  // ## measureIterator
  // Description: iterate over the any measures that are part of the selection
  getSelectedMeasures(): SmoSelection[] {
    const set: number[] = [];
    const rv: SmoSelection[] = [];
    if (!this.score) {
      return [];
    }
    this.selections.forEach((sel) => {
      const measure = SmoSelection.measureSelection(this.score!, sel.selector.staff, sel.selector.measure);
      if (measure) {
        const ix = measure.selector.measure;
        if (set.indexOf(ix) === -1) {
          set.push(ix);
          rv.push(measure);
        }
      }
    });
    return rv;
  }

  _addSelection(selection: SmoSelection) {
    const ar: SmoSelection[] = this.selections.filter((sel) =>
      SmoSelector.neq(sel.selector, selection.selector)
    );
    if (this.autoPlay && this.score) {
      this.playSelection(selection);
    }
    ar.push(selection);
    this.selections = ar;
  }

  _selectBetweenSelections(s1o: SmoSelection, s2o: SmoSelection) {
    const score = this.renderer.score ?? null;
    if (!score) {
      return;
    }
    const staffMin = Math.min(s1o.selector.staff, s2o.selector.staff);
    const staffMax = Math.max(s1o.selector.staff, s2o.selector.staff);
    this.selections = [];
    for (let i = staffMin; i <= staffMax; ++i) {
      const s1 = JSON.parse(JSON.stringify(s1o.selector));
      s1.staff = i;
      const s2 = JSON.parse(JSON.stringify(s2o.selector));
      s2.staff = i;
      const s1s = SmoSelection.selectionFromSelector(this.score!, s1);
      const s2s = SmoSelection.selectionFromSelector(this.score!, s2);
      if (s1s && s2s) {
        const min = SmoSelector.gt(s1s.selector, s2s.selector) ? s2s : s1s;
        const max = SmoSelector.lt(min.selector, s2s.selector) ? s2s : s1s;
        const selections = SmoSelection.innerSelections(score, min.selector, max.selector);
        // Get the actual selections from our map, since the client bounding boxes are already computed
        selections.forEach((sel) => {
          const key = SmoSelector.getNoteKey(sel.selector);
          sel.measure.setActiveVoice(sel.selector.voice);
          // Skip measures that are not rendered because they are part of a multi-rest
          if (this.measureNoteMap && this.measureNoteMap[key]) {
            this.selections.push(this.measureNoteMap[key]);
          }
        });

        if (this.selections.length === 0) {
          this.selections = [min];
        }        
      }
    }
    this._createLocalModifiersList();
    this.highlightQueue.selectionCount = this.selections.length;
    this.deferHighlight();
  }
  selectSuggestion(ev: KeyEvent, deferHighlightSelection: boolean = true) {
    if (!this.suggestion || !this.suggestion.measure || this.score === null) {
      return;
    }
    this.idleTimer = Date.now();

    if (this.modifierSuggestion) {
      this.modifierIndex = -1;
      this.modifierSelections = [this.modifierSuggestion];
      this.modifierSuggestion = null;
      this.createLocalModifiersFromModifierTabs(this.modifierSelections);
      // If we selected due to a mouse click, move the selection to the
      // selected modifier
      this._highlightModifier();
      return;
    } else if (ev.type === 'click') {
      this.clearModifierSelections(); // if we click on a non-modifier, clear the
      // modifier selections
    }

    if (ev.shiftKey) {
      const sel1 = this.getExtremeSelection(-1);
      //if (sel1.selector.staff === this.suggestion.selector.staff) {
      this._selectBetweenSelections(sel1, this.suggestion);
      return;
      //}
    }

    if (ev.ctrlKey) {
      this._addSelection(this.suggestion);
      this._createLocalModifiersList();
      if (deferHighlightSelection) {
        this.deferHighlight();
      }
      return;
    }
    if (this.autoPlay) {
      this.playSelection(this.suggestion);
    }

    const preselected = this.selections[0] ?
      SmoSelector.sameNote(this.suggestion.selector, this.selections[0].selector) && this.selections.length === 1 : false;

    if (this.selections.length === 0) {
      this.selections.push(this.suggestion);
    }
    const note = this.selections[0].note as SmoNote;
    if (preselected && note.pitches.length > 1) {
      this.pitchIndex =  (this.pitchIndex + 1) % note.pitches.length;
      this.selections[0].selector.pitches = [this.pitchIndex];
    } else {
      const selection = SmoSelection.noteFromSelector(this.score, this.suggestion.selector);
      if (selection) {
        selection.box = JSON.parse(JSON.stringify(this.suggestion.box));
        selection.scrollBox = JSON.parse(JSON.stringify(this.suggestion.scrollBox));
        this.selections = [selection];
        // There is a single selection, make sure the active voice is set to it.
        selection.measure.setActiveVoice(selection.selector.voice);
        this.selectActiveVoice();
      }
    }
    if (preselected && this.modifierSelections.length) {
      const mods  = this.modifierSelections.filter((mm) => mm.selection && SmoSelector.sameNote(mm.selection.selector, this.selections[0].selector));
      if (mods.length) {
        const modToAdd = mods[0];
        if (!modToAdd) {
          console.warn('bad modifier selection in selectSuggestion 2');
        }
        this.modifierSelections[0] = modToAdd;
        this.modifierIndex = mods[0].index;
        this._highlightModifier();
        return;
      }
    }
    this.score.setActiveStaff(this.selections[0].selector.staff);
    if (deferHighlightSelection) {
      this.deferHighlight();
    }
    this._createLocalModifiersList();
  }
  _setModifierAsSuggestion(artifact: ModifierTab): void {
    if (!artifact.box) {
      return;
    }
    this.modifierSuggestion = artifact;
    if (artifact.modifier instanceof SmoGraceNote) {
      return;
    }
    this._drawRect(artifact.box, 'suggestion');
  }

  _setArtifactAsSuggestion(artifact: SmoSelection) {
    let sameSel: SmoSelection | null = null;
    let i = 0;
    for (i = 0; i < this.selections.length; ++i) {
      const ss = this.selections[i];
      if (ss && SmoSelector.sameNote(ss.selector, artifact.selector)) {
        sameSel = ss;
        break;
      }
    }
    if (!artifact.box) {
      return;
    }

    this.modifierSuggestion = null;

    this.suggestion = artifact;
    // console.log(artifact.box);
    // artifact.box.height = 60;
    if (this.suggestion.note) {
      return;
    }
    this._drawRect(artifact.box, 'suggestion');
    // if (sameSel) {
      //todo; provide argument to the caret so it knows we are operation on a selected element
    // }
    // const caret = this.getNoteEntryCaret();
    // caret.setSelection(this.suggestion);
    // caret.render();
  }

  _highlightModifier() {
    let box: SvgBox | null = null;
    if (!this.modifierSelections.length) {
      return;
    }
    this.removeModifierSelectionBox();
    this.modifierSelections.forEach((artifact) => {
      if (artifact.modifier instanceof SmoGraceNote) {
        return;
      }
      if (box === null) {
        box = artifact.modifier.logicalBox ?? null;
      } else {
        box = SvgHelpers.unionRect(box, SvgHelpers.smoBox(artifact.modifier.logicalBox));
      }
    });
    if (box === null) {
      return;
    }
    this._drawRect(box, 'staffModifier');
  }

  _highlightActiveVoice(selection: SmoSelection) {
    let i = 0;
    const selector = selection.selector;
    for (i = 1; i <= 4; ++i) {
      const cl = 'v' + i.toString() + '-active';
      $('body').removeClass(cl);
    }
    const c2 = 'v' + (selector.voice + 1).toString() + '-active';
    $('body').addClass(c2);
  }
  // The user has just switched voices, select the active voice
  selectActiveVoice() {
    const selection = this.selections[0];
    const selector = JSON.parse(JSON.stringify(selection.selector));
    selector.voice = selection.measure.activeVoice;
    this.selections = [this._getClosestTick(selector)];
    this.deferHighlight();
  }

  highlightSelection() {
    let i = 0;
    let prevSel: SmoSelection | null = null;
    let curBox: SvgBox = SvgBox.default;
    this.idleTimer = Date.now();
    // If there is a race condition with a change, avoid referencing null note
    if (!this.selections[0].note) {
      return;
    }
    const note = this.selections[0].note as SmoNote;
    // Reset pitch index if not in a valid pitch selection scenario
    if (this.pitchIndex < 0 || this.selections.length !== 1 || this.pitchIndex >= note.pitches.length) {
      this.pitchIndex = -1;
    }

    // Single selection - just update voice UI and notify
    if (this.selections.length === 1 && note.logicalBox) {
      this._highlightActiveVoice(this.selections[0]);
      // Clear any existing multi-selection rectangles
      this.drawSelectionRects([]);
      // Get selected grace note if any
      let graceNote: SmoGraceNote | null = null;
      if (this.modifierSelections.length > 0 && this.modifierSelections[0].modifier instanceof SmoGraceNote) {
        graceNote = this.modifierSelections[0].modifier;
      }
      this.delegate?.onSingleNoteHighlighted(this.selections[0], graceNote);
      return;
    }
    const sorted = this.selections.sort((a, b) => SmoSelector.gt(a.selector, b.selector) ? 1 : -1);
    prevSel = sorted[0];
    // rendered yet?
    if (!prevSel || !prevSel.box) {
      return;
    }
    curBox = SvgHelpers.smoBox(prevSel.box);
    const boxes: SvgBox[] = [];
    for (i = 1; i < sorted.length; ++i) {
      const sel = sorted[i];
      if (!sel.box || !prevSel.box) {
        continue;
      }
      // const ydiff = Math.abs(prevSel.box.y - sel.box.y);
      if (sel.selector.staff === prevSel.selector.staff && sel.measure.svg.lineIndex === prevSel.measure.svg.lineIndex) {
        curBox = SvgHelpers.unionRect(curBox, sel.box);
      } else if (curBox) {
        boxes.push(curBox);
        curBox = SvgHelpers.smoBox(sel.box);
      }
      this._highlightActiveVoice(sel);
      prevSel = sel;
    }
    boxes.push(curBox);
    if (this.modifierSelections.length) {
      boxes.push(this.modifierSelections[0].box);
    }
    this._drawRect(boxes, 'selection');
  }
  /**
   * Boxes are divided up into lines/systems already.  But we need
   * to put the correct box on the correct page.
   * @param boxes 
   */
  drawSelectionRects(boxes: SvgBox[]) {
    const keys = Object.keys(this.selectionRects);
    // erase any old selections
    keys.forEach((key) => {
      const oon = this.selectionRects[parseInt(key)];
      oon.forEach((outline) => {
        if (outline.element) {
          outline.element.remove();
          outline.element = undefined;
  
        }
      })
    });
    this.selectionRects = {};
    // Create an OutlineInfo for each page
    const pages: number[] = [];
    const stroke: StrokeInfo = (SuiTracker.strokes as any)['selection'];
    boxes.forEach((box) => {
      let testBox: SvgBox = SvgHelpers.smoBox(box);
      let context = this.renderer.pageMap.getRenderer(testBox);
      testBox.y -= context.box.y;
      if (!this.selectionRects[context.pageNumber]) {
        this.selectionRects[context.pageNumber] = [];
        pages.push(context.pageNumber);
      }
      this.selectionRects[context.pageNumber].push({
        context: context, box: testBox, classes: '',
        stroke, scroll: this.scroller.scrollState,
        timeOff: 0
      });
    });
    pages.forEach((pageNo) => {
      const outlineInfos = this.selectionRects[pageNo];
      outlineInfos.forEach((info) => {
        SvgHelpers.outlineRect(info);
      });
    });
  }
  _drawRect(pBox: SvgBox | SvgBox[], strokeName: string) {    
    const stroke: StrokeInfo = (SuiTracker.strokes as any)[strokeName];
    const boxes = Array.isArray(pBox) ? pBox : [pBox];
    if (strokeName === 'selection') {
      this.drawSelectionRects(boxes);
      return;
    }
    boxes.forEach((box) => {
      let testBox: SvgBox = SvgHelpers.smoBox(box);
      let context = this.renderer.pageMap.getRenderer(testBox);
      const timeOff = strokeName === 'suggestion' ? 1000 : 0;    
      if (context) {
        testBox.y -= context.box.y;
        if (!this.outlines[strokeName]) {
          this.outlines[strokeName] = {
            context: context, box: testBox, classes: '',
            stroke, scroll: this.scroller.scrollState,
            timeOff
          };
        }
        this.outlines[strokeName].box = testBox;
        this.outlines[strokeName].context = context;
        SvgHelpers.outlineRect(this.outlines[strokeName]);
      }
    });
  }



}
