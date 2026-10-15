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
 * Voices copied with {@link PasteBuffer.setVoiceSelections}.  Whole measures of one voice,
 * or of all the voices, on one or more consecutive staves.
 * @category SmoTransform
 */
export interface VoiceCopy {
  /** the voice numbers (0-3) that were copied, ascending.  More than one means 'all' */
  voices: number[],
  firstStaff: number,
  staffCount: number,
  firstMeasure: number,
  measureCount: number,
  /** for each voice and staff, every note of every copied measure, in order */
  notes: Record<number, Record<number, PasteNote[]>>,
  /** staff modifiers that start on the copied notes, used when the voice number is kept */
  modifiers: Record<number, StaffModifierBase[]>
}
/** the most voices a measure can have */
const MAX_VOICES = 4;

/** Set the voice of a tuplet and its nested tuplets, for a tuplet pasted into a different voice */
const setTupletVoice = (tuplet: SmoTupletTree['tuplet'], voice: number) => {
  tuplet.voice = voice;
  tuplet.childrenTuplets.forEach((child) => setTupletVoice(child, voice));
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
  /** voices copied by setVoiceSelections, or null.  Separate from the notes copied by setSelections */
  voiceCopy: VoiceCopy | null = null;
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
  /**
   * Which choices the Copy Voices menu offers.
   * @param voicesInSelection the most voices any selected measure has
   * @returns each voice number to offer, then 'all' if there is more than one voice
   */
  static copyVoiceChoices(voicesInSelection: number): Array<number | 'all'> {
    const count = Math.min(Math.max(voicesInSelection, 0), MAX_VOICES);
    const rv: Array<number | 'all'> = [];
    for (let i = 0; i < count; ++i) {
      rv.push(i);
    }
    if (count > 1) {
      rv.push('all');
    }
    return rv;
  }
  /**
   * Which choices the Paste Voice menu offers.
   * @param copiedVoices the voices in the current voice copy, empty if there is none
   * @param destVoiceCount how many voices the destination has (the most in any destination measure)
   * @returns for one copied voice, each existing destination voice (to replace it) and 'new', a new
   * voice after the existing ones, unless the destination already has the maximum number of voices;
   * for several copied voices, only 'all'; nothing if there is no voice copy or no destination
   */
  static pasteVoiceChoices(copiedVoices: number[], destVoiceCount: number): Array<number | 'all' | 'new'> {
    if (copiedVoices.length < 1) {
      return [];
    }
    if (copiedVoices.length > 1) {
      return ['all'];
    }
    const count = Math.min(destVoiceCount, MAX_VOICES);
    if (count < 1) {
      return [];
    }
    const rv: Array<number | 'all' | 'new'> = [];
    for (let i = 0; i < count; ++i) {
      rv.push(i);
    }
    if (count < MAX_VOICES) {
      rv.push('new');
    }
    return rv;
  }
  hasVoiceCopy(): boolean {
    return this.voiceCopy !== null && this.voiceCopy.voices.length > 0;
  }
  clearVoiceCopy() {
    this.voiceCopy = null;
  }
  copiedVoiceNumbers(): number[] {
    return this.voiceCopy ? this.voiceCopy.voices.slice() : [];
  }
  /**
   * The length of one copied voice in ticks, for working out how many measures a paste covers.
   */
  getVoiceCopyTickCount(): number {
    if (!this.voiceCopy || this.voiceCopy.voices.length < 1) {
      return 0;
    }
    const byStaff = this.voiceCopy.notes[this.voiceCopy.voices[0]];
    let rv = 0;
    Object.keys(byStaff).forEach((staffStr) => {
      let ticks = 0;
      byStaff[parseInt(staffStr, 10)].forEach((pn) => {
        ticks += pn.note.tickCount;
      });
      rv = Math.max(rv, ticks);
    });
    return rv;
  }
  /**
   * Copy whole measures of one voice, or all the voices.  If the selection starts or ends in the
   * middle of a measure, it is extended to the start of the first measure and the end of the last.
   * The selection is treated as a rectangle: from the first to the last selected staff and measure.
   * A voice that is missing from a copied measure is copied as that measure's default rests.
   * @param score the score to copy from
   * @param selections the selected notes or measures
   * @param voice the voice to copy (0-3), or 'all'
   * @returns false if nothing was copied
   */
  setVoiceSelections(score: SmoScore, selections: SmoSelection[], voice: number | 'all'): boolean {
    this.voiceCopy = null;
    this.score = score;
    if (selections.length < 1) {
      return false;
    }
    let firstStaff = selections[0].selector.staff;
    let lastStaff = firstStaff;
    let firstMeasure = selections[0].selector.measure;
    let lastMeasure = firstMeasure;
    selections.forEach((sel) => {
      firstStaff = Math.min(firstStaff, sel.selector.staff);
      lastStaff = Math.max(lastStaff, sel.selector.staff);
      firstMeasure = Math.min(firstMeasure, sel.selector.measure);
      lastMeasure = Math.max(lastMeasure, sel.selector.measure);
    });
    lastStaff = Math.min(lastStaff, score.staves.length - 1);
    // Which voices exist in the copied measures
    let voiceCount = 0;
    for (let s = firstStaff; s <= lastStaff; ++s) {
      for (let m = firstMeasure; m <= lastMeasure; ++m) {
        const measure = score.staves[s].measures[m];
        if (measure) {
          voiceCount = Math.max(voiceCount, measure.voices.length);
        }
      }
    }
    voiceCount = Math.min(voiceCount, MAX_VOICES);
    const voices: number[] = [];
    if (voice === 'all') {
      for (let v = 0; v < voiceCount; ++v) {
        voices.push(v);
      }
    } else if (voice >= 0 && voice < voiceCount) {
      voices.push(voice);
    }
    if (voices.length < 1) {
      return false;
    }
    const voiceCopy: VoiceCopy = {
      voices,
      firstStaff,
      staffCount: lastStaff - firstStaff + 1,
      firstMeasure,
      measureCount: lastMeasure - firstMeasure + 1,
      notes: {},
      modifiers: {}
    };
    voices.forEach((v) => {
      // Gather every note in the voice, measure by measure.  _populateSelectArray does the
      // work of making concert-pitch copies, and fills this.notes and this.modifiers.
      const noteSelections: SmoSelection[] = [];
      const restNotes: PasteNote[] = [];
      for (let s = firstStaff; s <= lastStaff; ++s) {
        for (let m = firstMeasure; m <= lastMeasure; ++m) {
          const measure = score.staves[s].measures[m];
          if (!measure) {
            continue;
          }
          if (v < measure.voices.length) {
            for (let t = 0; t < measure.voices[v].notes.length; ++t) {
              const sel = SmoSelection.noteSelection(score, s, m, v, t);
              if (sel) {
                noteSelections.push(sel);
              }
            }
          } else {
            // This voice doesn't exist in this measure: copy the measure's rests instead.
            const key = measure.keySignature.toLocaleLowerCase();
            SmoMeasure.getDefaultNotes(measure).forEach((note, t) => {
              restNotes.push({
                note,
                selector: { staff: s, measure: m, voice: v, tick: t, pitches: [] },
                originalKey: key,
                tupletStart: null
              });
            });
          }
        }
      }
      this.notes = {};
      this.modifiers = [];
      if (noteSelections.length > 0) {
        this._populateSelectArray(noteSelections);
      }
      const byStaff: Record<number, PasteNote[]> = this.notes;
      restNotes.forEach((rest) => {
        if (!byStaff[rest.selector.staff]) {
          byStaff[rest.selector.staff] = [];
        }
        byStaff[rest.selector.staff].push(rest);
      });
      Object.keys(byStaff).forEach((staffStr) => {
        const staff = parseInt(staffStr, 10);
        byStaff[staff].sort((a, b) => SmoSelector.gt(a.selector, b.selector) ? 1 : -1);
      });
      voiceCopy.notes[v] = byStaff;
      voiceCopy.modifiers[v] = this.modifiers;
    });
    this.notes = {};
    this.modifiers = [];
    this.voiceCopy = voiceCopy;
    return true;
  }
  /**
   * Paste a single copied voice into a voice of the destination measures, starting at the
   * beginning of the destination measure.  The destination voice may be any existing voice,
   * or the next empty one, which is created in each measure it is pasted into.
   * @param destination staff and measure to paste at (the voice and tick are ignored)
   * @param voice the destination voice (0-3)
   * @returns the measures that were replaced
   */
  pasteVoice(destination: SmoSelector, voice: number): SmoSelection[] {
    if (!this.score || !this.voiceCopy || this.voiceCopy.voices.length !== 1) {
      return [];
    }
    if (voice < 0 || voice >= MAX_VOICES) {
      return [];
    }
    return this._pasteCopiedVoice(destination, this.voiceCopy.voices[0], voice);
  }
  /**
   * Paste all the copied voices, each into the voice of the same number, starting at the
   * beginning of the destination measure.  Voices the destination doesn't have are created.
   * @param destination staff and measure to paste at (the voice and tick are ignored)
   * @returns the measures that were replaced
   */
  pasteAllVoices(destination: SmoSelector): SmoSelection[] {
    if (!this.score || !this.voiceCopy) {
      return [];
    }
    let rv: SmoSelection[] = [];
    // ascending, so each voice can be created after the one before it
    this.voiceCopy.voices.forEach((v) => {
      rv = rv.concat(this._pasteCopiedVoice(destination, v, v));
    });
    return rv;
  }
  /**
   * Paste voice `srcVoice` of the voice copy into voice `destVoice`, on each copied staff.
   */
  private _pasteCopiedVoice(destination: SmoSelector, srcVoice: number, destVoice: number): SmoSelection[] {
    const copy = this.voiceCopy!;
    let rv: SmoSelection[] = [];
    // Slurs and the like are located by voice, so they are only carried if the voice is unchanged.
    this.modifiers = [];
    if (srcVoice === destVoice) {
      copy.modifiers[srcVoice].forEach((mod) => {
        this.modifiers.push(StaffModifierBase.deserialize(mod.serialize()));
      });
    }
    for (let k = 0; k < copy.staffCount; ++k) {
      const destStaff = destination.staff + k;
      const srcNotes = copy.notes[srcVoice][copy.firstStaff + k];
      if (destStaff >= this.score!.staves.length) {
        break;
      }
      if (!srcNotes || srcNotes.length < 1) {
        continue;
      }
      // pasteNoteSelections changes the notes it is given, so give it copies
      const notes: PasteNote[] = srcNotes.map((pn) => {
        const note = SmoNote.deserialize(pn.note.serialize());
        const selector: SmoSelector = JSON.parse(JSON.stringify(pn.selector));
        selector.voice = destVoice;
        let tupletStart: SmoTupletTree | null = null;
        if (pn.tupletStart) {
          tupletStart = SmoTupletTree.deserialize(pn.tupletStart.serialize());
          setTupletVoice(tupletStart.tuplet, destVoice);
        }
        return { note, selector, originalKey: pn.originalKey, tupletStart };
      });
      this.pasteNoteSelections({ staff: destStaff, measure: destination.measure, voice: destVoice, tick: 0, pitches: [] }, notes);
      rv = rv.concat(this.replacementMeasures);
    }
    return rv;
  }
  setSelections(score: SmoScore, selections: SmoSelection[]) {
    // A normal copy replaces whatever was copied before, including voices
    this.voiceCopy = null;
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
    this.voiceCopy = null;
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
    // Go through all the notes we are pasting into this measure.
    for (let i: number = 0; i < notes.length; i++) {
      const selection: PasteNote = notes[i];
      // Pasting the first note of a tuplet, make sure it will fit in the measure
      if (selection.tupletStart) {
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
      // If the pasted note would exceed the length of the measure, close out the existing measure
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
          // The destination voice may not exist in this measure yet (the first measure was
          // aligned above); create it so later steps can look it up.
          this._alignVoices(clonedMeasure, selector.voice);
          this.measures.push(clonedMeasure);
          // firstMeasureTickmap = measureSelection.measure.tickmapForVoice(selector.voice);
        }
      } else if (measureSelection != null) {
        // the note fits in the measure, keep track of the note duration.
        currentDuration += selection.note.tickCount;
      }
    }
    // Get the last full measure after we've added all the pastes
    const lastMeasure = this.measures[this.measures.length - 1];

    //adjust the beginning of the paste
    //adjust this.destination if beginning of the paste is in the middle of a tuplet
    //set destination to have a tick index of the first note in the tuplet
    this.destination = selector;
    const firstTupletTree = SmoTupletTree.getTupletForNoteIndex(firstMeasure.tupletTrees, selector.voice, selector.tick);
    if (firstTupletTree) {
      this.destination.tick = firstTupletTree.startIndex;//use this as a new selector.tick
    }

    // If we are pasting tuplets, remove any tuplets that occupy the same beat first and convert them into a non-tuplet.
    // We don't support pasting into tuplets.
    if (this.measures.length > 1) {
      this._removeOverlappingTuplets(firstMeasure, 
        selector.tick, firstMeasure.voices[selector.voice].notes.length - 1, selector.voice);
      this._removeOverlappingTuplets(lastMeasure, 
        0, lastMeasure.getClosestIndexFromTickCount(selector.voice, currentDuration), selector.voice);
    } else {
      this._removeOverlappingTuplets(firstMeasure, 
        selector.tick, lastMeasure.getClosestIndexFromTickCount(selector.voice, currentDuration), selector.voice);
    }

    // if there are more than 2 measures remove tuplets from all but first and last measure.
    // Only the tuplets of the voice being pasted into are removed; the trees of other voices
    // are kept, since those voices are not being replaced.
    if (this.measures.length > 2) {
      for (let i = 1; i < this.measures.length - 1; i++) {
        this.measures[i].tupletTrees = this.measures[i].tupletTrees.filter(
          (tree) => tree.voice !== this.destination.voice);
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
          // Adjust indices in the tuplet for where it's pasted
          SmoTupletTree.adjustTupletIndexes([tupletTree], selection.selector.voice,-1, diff);
          // Adjust indices for tuplets in the rest of the measure.
          SmoTupletTree.adjustMeasureTupletIndices([tupletTree], selection.selector.voice, measure);
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
