// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoSelection, SmoSelector } from './selections';
import { SmoNote } from '../data/note';
import { SmoMeasure, SmoVoice } from '../data/measure';
import { StaffModifierBase } from '../data/staffModifiers';
import { SmoLyric } from '../data/noteModifiers';
import {SmoTuplet, SmoTupletTree, SmoTupletTreeParams} from '../data/tuplet';
import { SmoMusic } from '../data/music';
import { SvgHelpers } from '../../render/sui/svgHelpers';
import { SmoScore } from '../data/score';
import { TickMap } from './tickMap';
import { SmoSystemStaff } from '../data/systemStaff';
import { getId, Clef, Pitch } from '../data/common';
import {SmoUnmakeTupletActor} from "./tickDuration";
import { SmoTempo, SmoTimeSignature } from '../data/measureModifiers';

/**
 * Used to calculate the offset and transposition of a note to be pasted
 * @category SmoTransform
 */
export interface PasteNote {
  note: SmoNote,
  selector: SmoSelector,
  originalKey: string,
  tupletStart: SmoTupletTree | null
}

/**
 * Used when pasting staff modifiers like slurs to calculate the
 * offset
 * @category SmoTransform
 */
export interface ModifierPlacement {
  modifier: StaffModifierBase,
  ticksToStart: number
}
/**
 * PasteBuffer holds copied music, and handles the action of pasting the music to
 * a different point in the score.  It does this by serializing the measure(s) from the source
 * and then creating handling the overlap with existing music when deserializaing it.
 * @category SmoTransform
 */
export class PasteBuffer {
  notes: Record<number, PasteNote[]>;
  staffIndex: number;
  noteIndex: number;
  measures: SmoMeasure[];
  measureIndex: number;
  remainder: number;
  replacementMeasures: SmoSelection[];
  score: SmoScore | null = null;
  modifiers: StaffModifierBase[] = [];
  modifiersToPlace: ModifierPlacement[] = [];
  destination: SmoSelector = SmoSelector.default;
  staffSelectors: SmoSelector[] = [];
  constructor() {
    this.notes = {};
    this.noteIndex = 0;
    this.staffIndex = 0;
    this.measures = [];
    this.measureIndex = -1;
    this.remainder = 0;
    this.replacementMeasures = [];
  }

  setScore(score: SmoScore) {
    this.score = score;
  }
  getCopyBufferTickCount() {
    let maxRv = 0;
    const staves = Object.keys(this.notes);
    staves.forEach((staffStr: string) => {
      const staff: number = parseInt(staffStr);
      const notes = this.notes[staff];
      let rv = 0;
      notes.forEach((note) => {
        rv += note.note.tickCount;
      });
      maxRv = Math.max(rv, maxRv);
    });
    return maxRv;
  }
  setSelections(score: SmoScore, selections: SmoSelection[]) {
    this.notes = [];
    this.noteIndex = 0;
    this.score = score;
    if (selections.length < 1) {
      return;
    }
    // this.tupletNoteMap = [];
    const first = selections[0];
    const last = selections[selections.length - 1];
    if (!first.note || !last.note) {
      return;
    }
    const startTupletTree: SmoTupletTree | null = SmoTupletTree.getTupletTreeForNoteIndex(first.measure.tupletTrees, first.selector.voice, first.selector.tick);
    if (startTupletTree) {
      if (startTupletTree.startIndex !== first.selector.tick) {
        return; // can't copy from the middle of a tuplet
      }
    }
    const endTupletTree: SmoTupletTree | null = SmoTupletTree.getTupletTreeForNoteIndex(last.measure.tupletTrees, last.selector.voice, last.selector.tick);
    if (endTupletTree) {
      if (endTupletTree.endIndex !== last.selector.tick) {
        return; // can't copy part of a tuplet.
      }
    }
    this._populateSelectArray(selections);
  }
  // ### _populateSelectArray
  // copy the selected notes into the paste buffer with their original locations.
  _populateSelectArray(selections: SmoSelection[]) {
    let selector: SmoSelector = SmoSelector.default;
    this.modifiers = [];
    let maxSelector = selections[0].selector;
    let minSelector = selections[0].selector;
    selections.forEach((selection) => {
      selector = JSON.parse(JSON.stringify(selection.selector));
      const staff = selector.staff;
      if (SmoSelector.gt(selector, maxSelector)) {
        maxSelector = selector;
      }
      if (SmoSelector.lt(selector, minSelector)) {
        minSelector = selector;
      }
      const mod: StaffModifierBase[] = selection.staff.getModifiersAt(selector);
      if (mod.length) {
        mod.forEach((modifier: StaffModifierBase) => {
          const cp: StaffModifierBase = StaffModifierBase.deserialize(modifier.serialize());
          cp.attrs.id = getId().toString();
          this.modifiers.push(cp);
        });
      }

      if (selection.note) {
        // We store copy in concert pitch.  The originalKey is the original key of the copy.
        // the destKey is the originalKey in concert pitch.
        const originalKey = selection.measure.keySignature;
        const keyOffset = -1 * selection.measure.transposeIndex;
        const destKey = SmoMusic.vexKeySignatureTranspose(originalKey, keyOffset).toLocaleLowerCase();
        const note = SmoNote.transpose(SmoNote.clone(selection.note),[], keyOffset, selection.measure.keySignature, destKey) as SmoNote;
        const chords: SmoLyric[] = note.getChords();
        chords.forEach((chord) => {
          note.removeLyric(chord);
        });
        chords.forEach((chord) => {
          const nchord = SmoLyric.transposeChordToKey(chord, keyOffset, selection.measure.keySignature, destKey);
          note.addLyric(nchord);
        });
        const pasteNote: PasteNote = {
          selector,
          note,
          originalKey: destKey,
          tupletStart: null
        };
        if (selection.note.isTuplet) {
          const tupletTree: SmoTupletTree | null = SmoTupletTree.getTupletTreeForNoteIndex(selection.measure.tupletTrees, selection.selector.voice, selection.selector.tick);
          //const index = tuplet.getIndexOfNote(selection.note);
          if (tupletTree && tupletTree.startIndex === selection.selector.tick) {
            pasteNote.tupletStart = SmoTupletTree.clone(tupletTree);
          }
        }
        if (!this.notes[staff]) {
          this.notes[staff] = [];
        }
        this.notes[staff].push(pasteNote);
      }
    });
    const staves = Object.keys(this.notes);
    staves.forEach((staffStr) => {
      const staff = parseInt(staffStr);
      const notes = this.notes[staff];
      notes.sort((a, b) =>
        SmoSelector.gt(a.selector, b.selector) ? 1 : -1
      );
    });
  }

  clearSelections() {
    this.notes = {};
  }

  _findModifier(selector: SmoSelector) {
    const rv = this.modifiers.filter((mod) => SmoSelector.eq(selector, mod.startSelector));
    return (rv && rv.length) ? rv[0] : null;
  }
  _findPlacedModifier(selector: SmoSelector) {
    const rv = this.modifiers.filter((mod) => SmoSelector.eq(selector, mod.endSelector));
    return (typeof(rv) !== 'undefined' && rv.length) ? rv[0] : null;
  }

  _alignVoices(measure: SmoMeasure, voiceIndex: number) {
    while (measure.voices.length <= voiceIndex) {
      measure.populateVoice(measure.voices.length);
    }
  }

  // Before pasting, populate an array of existing measures from the paste destination
  // so we know how to place the notes.
  _populateMeasureArray(selector: SmoSelector, notes: PasteNote[]) {
    let measureSelection = SmoSelection.measureSelection(this.score!, selector.staff, selector.measure);
    if (!measureSelection) {
      return;
    }
    const measure = measureSelection.measure;
    this._alignVoices(measure, selector.voice);
    this.measures = [];
    this.staffSelectors = [];
    const clonedMeasure = SmoMeasure.cloneForPasteOrUndo(measureSelection.measure);
    clonedMeasure.svg = measureSelection.measure.svg;
    // Ordinarily, the key/tempo/time is mapped to the stave, but since we are pasting measure-by
    // measure here, we want to preserve it.
    clonedMeasure.keySignature = measureSelection.measure.keySignature;
    clonedMeasure.timeSignature = new SmoTimeSignature(measureSelection.measure.timeSignature);
    clonedMeasure.tempo = new SmoTempo(measureSelection.measure.tempo);
    this.measures.push(clonedMeasure);

    const firstMeasure = this.measures[0];
    const tickmapForFirstMeasure = firstMeasure.tickmapForVoice(selector.voice);

    let currentDuration = tickmapForFirstMeasure.durationMap[selector.tick];
    const measureTotalDuration = tickmapForFirstMeasure.totalDuration;
    
    for (let i: number = 0; i < notes.length; i++) {
      const selection: PasteNote = notes[i];
      if (selection.tupletStart) {
        // const tupletTree: SmoTupletTree | null = SmoTupletTree.getTupletTreeForNoteIndex(this.tupletNoteMap, selection.selector.voice, selection.selector.tick);
        if (currentDuration + selection.tupletStart.totalTicks > measureTotalDuration && 
          currentDuration + selection.note.tickCount < measureTotalDuration &&
          measureSelection !== null) {
          //if tuplet does not fit in a measure as a whole we cannot paste it, it is ether the whole thing or nothing
          //reset everything that has been changed so far and return
          if (measureSelection === null) {
            this.measures = [];
            this.staffSelectors = [];
            return;
          }
        }
      }
      if (currentDuration + selection.note.tickCount > measureTotalDuration && measureSelection !== null) {
        // If this note will overlap the measure boundary, the note will be split in 2 with the
        // remainder going to the next measure.  If they line up exactly, the remainder is 0.
        const remainder = (currentDuration + selection.note.tickCount) - measureTotalDuration;
        currentDuration = remainder;

        measureSelection = SmoSelection.measureSelection(this.score as SmoScore, 
          measureSelection.selector.staff,measureSelection.selector.measure + 1);

        // If the paste buffer overlaps the end of the score, we can't paste (TODO:  add a measure in this case)
        if (measureSelection != null) {
          const clonedMeasure = SmoMeasure.cloneForPasteOrUndo(measureSelection.measure);
          clonedMeasure.svg = measureSelection.measure.svg;
          this.measures.push(clonedMeasure);
          // firstMeasureTickmap = measureSelection.measure.tickmapForVoice(selector.voice);
        }
      } else if (measureSelection != null) {
        currentDuration += selection.note.tickCount;
      }
    }
    const lastMeasure = this.measures[this.measures.length - 1];

    //adjust the beginning of the paste
    //adjust this.destination if beginning of the paste is in the middle of a tuplet
    //set destination to have a tick index of the first note in the tuplet
    this.destination = selector;
    const firstTupletTree = SmoTupletTree.getTupletForNoteIndex(firstMeasure.tupletTrees, selector.voice, selector.tick);
    if (firstTupletTree) {
      this.destination.tick = firstTupletTree.startIndex;//use this as a new selector.tick
    }

    if (this.measures.length > 1) {
      this._removeOverlappingTuplets(firstMeasure, 
        selector.tick, firstMeasure.voices[selector.voice].notes.length - 1, selector.voice);
      this._removeOverlappingTuplets(lastMeasure, 
        0, lastMeasure.getClosestIndexFromTickCount(selector.voice, currentDuration), selector.voice);
    } else {
      this._removeOverlappingTuplets(firstMeasure, 
        selector.tick, lastMeasure.getClosestIndexFromTickCount(selector.voice, currentDuration), selector.voice);
    }

    //if there are more than 2 measures remove tuplets from all but first and last measure.
    if (this.measures.length > 2) {
      for(let i = 1; i < this.measures.length - 2; i++) {
        this.measures[i].tupletTrees = [];
      }
    }
  }

  // ### _populatePre
  // When we paste, we replace entire measures.  Populate the first measure up until the start of pasting.
  _populatePre(voiceIndex: number, measure: SmoMeasure, startTick: number, tickmap: TickMap) {
    const voice: SmoVoice = {
      notes: []
    };

    for (let i = 0; i < startTick; i++) {
      const note = measure.voices[voiceIndex].notes[i];
      voice.notes.push(SmoNote.clone(note));
    }

    return voice;
  }

  /**
   *
   * @param voiceIndex
   */
  // ### _populateVoice
  // ### Description:
  // Create a new voice for a new measure in the paste destination
  _populateVoice(notes: PasteNote[]): SmoVoice[] {
    // this._populateMeasureArray();
    const measures = this.measures;
    let measure = measures[0];
    let tickmap = measure.tickmapForVoice(this.destination.voice);
    let voice = this._populatePre(this.destination.voice, measure, this.destination.tick, tickmap);
    let startSelector = JSON.parse(JSON.stringify(this.destination));
    this.measureIndex = 0;
    const measureVoices: SmoVoice[] = [];
    measureVoices.push(voice);
    while (this.measureIndex < measures.length) {
      measure = measures[this.measureIndex];
      while (measure.voices.length <= this.destination.voice) {
        const nvoice = { notes : SmoMeasure.getDefaultNotes(measure) };
        measure.voices.push(nvoice);
      }
      tickmap = measure.tickmapForVoice(this.destination.voice);
      this._populateNew(voice, measure, tickmap, startSelector, notes);
      if (this.noteIndex < notes.length && this.measureIndex < measures.length) {
        voice = {
          notes: []
        };
        measureVoices.push(voice);
        startSelector = {
          staff: startSelector.staff,
          measure: startSelector.measure,
          voice: this.destination.voice,
          tick: 0
        };
        this.measureIndex += 1;
        startSelector.measure += 1;
      } else {
        break;
      }
    }
    this._populatePost(voice, this.destination.voice, measure, tickmap);
    return measureVoices;
  }

  static _countTicks(voice: SmoVoice): number {
    let voiceTicks = 0;
    voice.notes.forEach((note) => {
      voiceTicks += note.tickCount;
    });
    return voiceTicks;
  }

  /**
   * If the source contains a staff modifier that ends on the source selection, copy the modifier
   * @param srcSelector 
   * @param destSelector 
   * @param staff 
   * @returns 
   */
  _populateModifier(srcSelector: SmoSelector, destSelector: SmoSelector, staff: SmoSystemStaff) {
    const mod = this._findPlacedModifier(srcSelector);
    if (mod && this.score) {
      // Don't copy modifiers that cross staff boundaries outside the source staff b/c it's not clear what
      // the dest staff should be
      if (mod.startSelector.staff !== mod.endSelector.staff && srcSelector.staff !== destSelector.staff) {
        return;
      }
      const repl = StaffModifierBase.deserialize(mod.serialize());
      repl.endSelector = JSON.parse(JSON.stringify(destSelector));
      const tickOffset = SmoSelection.countTickIndices(this.score, mod.startSelector, mod.endSelector);
      this.modifiersToPlace.push({
        modifier: repl,
        ticksToStart: tickOffset
      });
    }
  }

  /**
   *
   * @param measure
   * @param startIndex
   * @param endIndex
   * @param voiceIndex
   * @private
   */
  private _removeOverlappingTuplets(measure: SmoMeasure, startIndex: number, endIndex: number, voiceIndex: number): void {
    const tupletsToDelete: SmoTupletTree[] = [];
    for (let i = 0; i < measure.tupletTrees.length; ++i) {
      const tupletTree = measure.tupletTrees[i];
      if (startIndex >= tupletTree.startIndex && startIndex <= tupletTree.endIndex) {
        tupletsToDelete.push(tupletTree);
        break;
      }
      if (endIndex >= tupletTree.startIndex && endIndex <= tupletTree.endIndex) {
        tupletsToDelete.push(tupletTree);
        break;
      }
    }

    //todo: check if we need to remove tuplets in descending order
    for (let i: number = 0; i < tupletsToDelete.length; i++) {
      const tupletTree: SmoTupletTree = tupletsToDelete[i];
      SmoUnmakeTupletActor.apply({
        startIndex: tupletTree.startIndex,
        endIndex: tupletTree.endIndex,
        measure: measure,
        voice: voiceIndex
      });
    }
  }
  /**
   * Start copying the paste buffer into the destination by copying the notes and working out
   * the measure overlap
   * 
   * @param voice 
   * @param measure 
   * @param tickmap 
   * @param startSelector 
   * @returns 
   */
  _populateNew(voice: SmoVoice, measure: SmoMeasure, tickmap: TickMap, startSelector: SmoSelector, notes: PasteNote[]) {
    let currentDuration = tickmap.durationMap[startSelector.tick];
    let i = 0;
    let j = 0;
    const totalDuration = tickmap.totalDuration;
    while (currentDuration < totalDuration && this.noteIndex < notes.length) {
      if (!this.score) {
        return;
      }
      const selection: PasteNote = notes[this.noteIndex];
      const note: SmoNote = selection.note;
      if (note.noteType === 'n') {
        const pitchAr: number[] = [];
        note.pitches.forEach((pitch, ix) => {
          pitchAr.push(ix);
        });
        SmoNote.transpose(note, pitchAr, measure.transposeIndex, selection.originalKey, measure.keySignature);
      } else {
        const npitches: Pitch[] = [];
        note.pitches.forEach((pp) => {
          const npitch = SmoMeasure.defaultPitchForClef[measure.clef as Clef];
          npitches.push(npitch);
          note.pitches = npitches;
        });
      }
      this._populateModifier(selection.selector, startSelector, this.score.staves[selection.selector.staff]);

      if (currentDuration + note.tickCount <= totalDuration && this.remainder === 0) {
        // The whole note fits in the measure, paste it.
        //If this note is a tuplet, and specifically if it is the beginning of a tuplet, we need to handle it
        //NOTE: tuplets never cross measure boundary, we made sure this is handled here: @see this._populateMeasureArray()
        if (selection.tupletStart) {
          const tupletTree: SmoTupletTree = SmoTupletTree.clone(selection.tupletStart);
          const startIndex: number = voice.notes.length;
          const diff: number = startIndex - tupletTree.startIndex;
          SmoTupletTree.adjustTupletIndexes([tupletTree], selection.selector.voice,-1, diff);
          measure.tupletTrees.push(tupletTree);
        }

        const nnote: SmoNote = SmoNote.clone(note);
        nnote.clef = measure.clef;
        voice.notes.push(nnote);
        currentDuration += note.tickCount;
        this.noteIndex += 1;
        startSelector.tick += 1;
      } else if (this.remainder > 0) {
        // This is a note that spilled over the last measure
        const nnote = SmoNote.cloneWithDuration(note, {
          numerator: this.remainder,
          denominator: 1,
          remainder: 0
        });
        nnote.clef = measure.clef;
        voice.notes.push(nnote);
        currentDuration += this.remainder;
        this.remainder = 0;
      } else {
        // The note won't fit, so we split it in 2 and paste the remainder in the next measure.
        // TODO:  tie the last note to this one.
        const partial = totalDuration - currentDuration;
        const dar = SmoMusic.gcdMap(partial);
        for (j = 0; j < dar.length; ++j) {
          const ddd = dar[j];
          const vnote = SmoNote.cloneWithDuration(note, {
            numerator: ddd,
            denominator: 1,
            remainder: 0
          });
          voice.notes.push(vnote);
        }
        currentDuration += partial;

        // Set the remaining length of the current note, this will be added to the
        // next measure with the previous note's pitches
        this.remainder = note.tickCount - partial;
      }
    }
  }

  // ### _populatePost
  // When we paste, we replace entire measures.  Populate the last measure from the end of paste to the
  // end of the measure with notes in the existing measure.
  _populatePost(voice: SmoVoice, voiceIndex: number, measure: SmoMeasure, tickmap: TickMap) {
    let endOfPasteDuration = PasteBuffer._countTicks(voice);
    let existingIndex = measure.getClosestIndexFromTickCount(voiceIndex, endOfPasteDuration);
    if (existingIndex > tickmap.durationMap.length - 1) {
      return;
    }
    let existingDuration = tickmap.durationMap[existingIndex];
    let endOfExistingDuration = existingDuration + tickmap.deltaMap[existingIndex];

    let startIndexToAdjustRemainingTuplets = voice.notes.length;
    let diffToAdjustRemainingTuplets: number = startIndexToAdjustRemainingTuplets - existingIndex - 1;


    if (Math.round(endOfPasteDuration) < Math.round(endOfExistingDuration)) {
      //pasted notes ended somewhere in the middle of an existing note
      //we need to remove the existing note and fill in the difference between the end of our pasted note and beginning of the next one
      const note = measure.voices[voiceIndex].notes[existingIndex];
      const lmap = SmoMusic.gcdMap(endOfExistingDuration - endOfPasteDuration);
      lmap.forEach((stemTick) => {
        const nnote = SmoNote.cloneWithDuration(note, stemTick);
        voice.notes.push(nnote);
      });
      diffToAdjustRemainingTuplets += lmap.length;
      existingIndex++;
    }
    SmoTupletTree.adjustTupletIndexes(
      measure.tupletTrees, voiceIndex, startIndexToAdjustRemainingTuplets, diffToAdjustRemainingTuplets);

    for (let i = existingIndex + 1; i < measure.voices[voiceIndex].notes.length; i++) {
      voice.notes.push(SmoNote.clone(measure.voices[voiceIndex].notes[i]));
    }
  }

  _pasteVoiceSer(serializedMeasure: any, vobj: any, voiceIx: number) {
    const voices: any[] = [];
    let ix = 0;
    serializedMeasure.voices.forEach((vc: any) => {
      if (ix !== voiceIx) {
        voices.push(vc);
      } else {
        voices.push(vobj);
      }
      ix += 1;
    });
    // If we are pasting into a measure that doesn't contain this voice, add the voice
    if (serializedMeasure.voices.length <= voiceIx) {
      voices.push(vobj);
    }
    serializedMeasure.voices = voices;
  }
  pasteChordNotes(selector: SmoSelector, notes: PasteNote[]): PasteNote[] {
    if (notes.length < 1) {
      return [];
    }
    if (!this.score) {
      return [];
    }
    let srcTick = 0;
    let destTick = 0;
    let srcIndex = 0;
    let selection = SmoSelection.noteSelection(this.score!, selector.staff, selector.measure, selector.voice, selector.tick);   
    while (selection && selection.note && srcIndex < notes.length) {
      const srcNote = notes[srcIndex].note;
      const chords = srcNote.getChords();
      if (selection && selection.note) {
        const destNote = selection.note;
        if (chords.length) {
          chords.forEach((chord) => {
            destNote.removeLyric(chord);
          });
          chords.forEach((chord) => {
            if (selection) {
            const nchord = SmoLyric.transposeChordToKey(
              chord, selection.measure.transposeIndex,notes[srcIndex].originalKey, selection.measure.keySignature);
              destNote.addLyric(nchord);
            }
          });
        }
        srcTick += srcNote.tickCount;
        while (selection && selection.note && destTick < srcTick) {
          destTick += selection.note.tickCount;
          if (selection && selection.note) {
            const curSelector = selection.selector;
            selection = SmoSelection.nextNoteSelection(this.score, 
              curSelector.staff, curSelector.measure, curSelector.voice, curSelector.tick);
          }
        }
        srcIndex += 1;
      }
    }
    return notes;
  }
  pasteIntoScore(score: SmoScore, selector: SmoSelector, func:(selector: SmoSelector, notes: PasteNote[]) => PasteNote[]) {
    let lowest: SmoSelector = SmoSelector.default;
    const enforceRect = true;
    let  pasted = 0;
    let startMeasure = 0;
    let startTick = 0;
    let startStaff = 0;
    for (let j = 0; j < score?.staves.length; ++j ) {
      if (!this.notes[j]) {
        continue;
      }
      const notes = this.notes[j];
      if (pasted === 0) {
        lowest.measure = selector.measure;
        lowest.tick = selector.tick;
        lowest.staff = selector.staff;
        startMeasure = notes[0].selector.measure;
        startTick = notes[0].selector.tick;
        startStaff = notes[0].selector.staff;
      } else {
        if (enforceRect) {
          if (notes[0].selector.measure !== startMeasure || notes[0].selector.tick !== startTick) {
            // can only paste rectangles.  Maybe warn?
            return;
          }
          if (notes[0].selector.staff !== startStaff + 1) {
            // can only paste rectangles, not clear where next selection goes
            return;
          }
        }
        if (score.staves.length <= lowest.staff + 1) {
          // nowhere to paste this.
          return; 
        }
        lowest.staff += 1;
        startStaff += 1;
      }
      pasted += 1;
      // Replace with fresh copy of the pasted notes
      this.notes[j] = func(lowest, notes);
    }
  }
  pasteChords(selector: SmoSelector) {
    if (!this.score) {
      return;
    }
    const func = (selector: SmoSelector, notes: PasteNote[]) => {
      return this.pasteChordNotes(selector, notes);
    }
    this.pasteIntoScore(this.score, selector, func);
  }
  pasteSelections(selector: SmoSelector) {
    if (!this.score) {
      return;
    }
    const func = (selector: SmoSelector, notes: PasteNote[]) => {
      return this.pasteNoteSelections(selector, notes);
    }
    this.pasteIntoScore(this.score, selector, func);
  }
  pasteNoteSelections(selector: SmoSelector, notes: PasteNote[]): PasteNote[] {
    let i = 0;
    if (notes.length < 1) {
      return notes;
    }
    if (!this.score) {
      return notes;
    }
    const maxCutVoice = notes.map((n) => n.selector.voice).reduce((a, b) => a > b ? a : b);
    const minCutVoice = notes.map((n) => n.selector.voice).reduce((a, b) => a > b ? a : b);
    const backupNotes: PasteNote[] = [];
    notes.forEach((bb) => {
      const note = (SmoNote.deserialize(bb.note.serialize()));
      const selector = JSON.parse(JSON.stringify(bb.selector));
      let tupletStart = bb.tupletStart;
      if (tupletStart) {
        tupletStart = SmoTupletTree.deserialize(bb.tupletStart!.serialize());
      }
      backupNotes.push({ note, selector, originalKey: bb.originalKey, tupletStart });
    });
    if (minCutVoice === maxCutVoice && minCutVoice > selector.voice) {
      selector.voice = minCutVoice;
    }
    this.modifiersToPlace = [];
    this.noteIndex = 0;
    this.measureIndex = -1;
    this.remainder = 0;
    this._populateMeasureArray(selector, notes);
    if (this.measures.length === 0) {
      return notes;
    }

    const voices = this._populateVoice(notes);
    const measureSel = JSON.parse(JSON.stringify(this.destination));
    const selectors: SmoSelector[] = [];
    for (i = 0; i < this.measures.length && i < voices.length; ++i) {
      const measure: SmoMeasure = this.measures[i];
      const nvoice: SmoVoice = voices[i];
      const ser: any = measure.serialize();
      ser.transposeIndex = measure.transposeIndex; // default values are undefined, make sure the transpose is valid
      ser.keySignature = SmoMusic.vexKeySigWithOffset(measure.keySignature, -1 * measure.transposeIndex);
      ser.timeSignature = measure.timeSignature.serialize();
      ser.tempo = measure.tempo.serialize();
      const vobj: any = {
        notes: []
      };
      nvoice.notes.forEach((note: SmoNote) => {
        vobj.notes.push(note.serialize());
      });

      // TODO: figure out how to do this with multiple voices
      this._pasteVoiceSer(ser, vobj, this.destination.voice);
      const nmeasure = SmoMeasure.deserialize(ser);
      // If this is the non-display buffer, don't try to reset the display rectangles.
      // Q: Is this even required since we are going to re-render?
      // A: yes, because until we do, the replaced measure needs the formatting info
      if (measure.svg.logicalBox && measure.svg.logicalBox.width > 0) {
        nmeasure.setBox(SvgHelpers.smoBox(measure.svg.logicalBox), 'copypaste');
        nmeasure.setX(measure.svg.logicalBox.x, 'copyPaste');
        nmeasure.setWidth(measure.svg.logicalBox.width, 'copypaste');
        nmeasure.setY(measure.svg.logicalBox.y, 'copypaste');
        nmeasure.svg.element = measure.svg.element;
        nmeasure.svg.tabElement = measure.svg.tabElement;
      }
      ['forceClef', 'forceKeySignature', 'forceTimeSignature', 'forceTempo'].forEach((flag) => {
        (nmeasure as any)[flag] = (measure.svg as any)[flag];
      });
      this.score.replaceMeasure(measureSel, nmeasure);
      measureSel.measure += 1;
      selectors.push(
        { staff: selector.staff, measure: nmeasure.measureNumber.measureIndex, voice: 0, tick: 0, pitches: [] }
      );
    }
    this.replacementMeasures = [];
    selectors.forEach((selector: SmoSelector) => {
      const nsel: SmoSelection | null = SmoSelection.measureSelection(this.score as SmoScore, selector.staff, selector.measure);
      if (nsel) {
        this.replacementMeasures.push(nsel);
      }
    });
    this.modifiersToPlace.forEach((mod) => {
      let selection = SmoSelection.selectionFromSelector(this.score!, mod.modifier.endSelector);
      while (selection && mod.ticksToStart !== 0) {
        if (mod.ticksToStart < 0) {
          selection = SmoSelection.nextNoteSelectionFromSelector(this.score!, selection.selector);
        } else {
          selection = SmoSelection.lastNoteSelectionFromSelector(this.score!, selection.selector);
        }
        mod.ticksToStart -= 1 * Math.sign(mod.ticksToStart);
      }
      if (selection) {
        mod.modifier.startSelector = JSON.parse(JSON.stringify(selection.selector));
        selection.staff.addStaffModifier(mod.modifier);
      }
    });
    return(backupNotes);
  }
}
