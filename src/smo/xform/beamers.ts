// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoMusic } from '../data/music';
import { SmoNote } from '../data/note';
import { SmoAttrs, getId } from '../data/common';
import { SmoMeasure, ISmoBeamGroup } from '../data/measure';
import { TickMap } from './tickMap';
import { smoSerialize } from '../../common/serializationHelpers';
import {SmoTuplet, SmoTupletTree} from "../data/tuplet";

/**
 * @category SmoTransform
 */
export interface SmoBeamGroupParams {
  notes: SmoNote[],
  secondaryBeamBreaks: number[];
  voice: number
}

/**
 * Contain a group of {@link SmoNote} used for beaming.
 * @category SmoTransform
 */
export class SmoBeamGroup implements ISmoBeamGroup {
  notes: SmoNote[];
  secondaryBeamBreaks: number[];
  attrs: SmoAttrs;
  voice: number = 0;
  constructor(params: SmoBeamGroupParams) {
    let i = 0;
    this.voice = params.voice;
    this.notes = params.notes;
    this.secondaryBeamBreaks = params.secondaryBeamBreaks;
    smoSerialize.vexMerge(this, params);

    this.attrs = {
      id: getId().toString(),
      type: 'SmoBeamGroup'
    };
    for (i = 0; i < this.notes.length; ++i) {
      const note = this.notes[i];
      if (note.tickCount < 4096) {
        note.beam_group = this.attrs;
      }
    }
  }
}

/**
 * Apply the beam policy set up in node and measure to group the notes into beam groups
 * @category SmoTransform
 */
export class SmoBeamer {
  static applyBeams(measure: SmoMeasure) {
    let i = 0;
    let j = 0;
    for (i = 0; i < measure.voices.length; ++i) {
      const beamer = new SmoBeamer(measure, i);
      const tickmap = measure.tickmapForVoice(i);
      for (j = 0; j < tickmap.durationMap.length; ++j) {
        beamer.beamNote(tickmap, j, measure.voices[i].notes[j]);
      }
    }
  }
  measure: SmoMeasure;
  duration: number;
  measureDuration: number;
  meterNumbers: number[];
  beamBeats: number;
  skipNext: number;
  currentGroup: SmoNote[];
  secondaryBeamBreaks: number[];
  constructor(measure: SmoMeasure, voice: number) {
    this.measure = measure;
    this._removeVoiceBeam(measure, voice);
    this.duration = 0;
    this.measureDuration = 0;
    this.meterNumbers = [measure.timeSignature.actualBeats, measure.timeSignature.beatDuration];
    // beam on 1/4 notes in most meter, triple time dotted quarter
    this.beamBeats = 2 * 2048;
    if (this.meterNumbers[0] % 3 === 0) {
      this.beamBeats = 3 * 2048;
    }
    this.skipNext = 0;
    this.currentGroup = [];
    this.secondaryBeamBreaks = [];
  }

  get beamGroups() {
    return this.measure.beamGroups;
  }
  _removeVoiceBeam(measure: SmoMeasure, voice: number) {
    const beamGroups: ISmoBeamGroup[] = [];
    measure.beamGroups.forEach((gr: ISmoBeamGroup) => {
      if (gr.voice !== voice) {
        beamGroups.push(gr);
      }
    });
    measure.beamGroups = beamGroups;
  }

  _completeGroup(voice: number) {
    const nrCount: SmoNote[] = this.currentGroup.filter((nn: SmoNote) =>
      nn.isRest() === false
    );
    // don't beam groups of 1
    if (nrCount.length > 1) {
      this.measure.beamGroups.push(new SmoBeamGroup({
        notes: this.currentGroup,
        secondaryBeamBreaks: this.secondaryBeamBreaks,
        voice
      }));
    }
  }

  _advanceGroup() {
    this.currentGroup = [];
    this.secondaryBeamBreaks = [];
    this.duration = 0;
  }

  // ### _isRemainingTicksBeamable
  // look ahead, and see if we need to beam the tuplet now or if we
  // can combine current beam with future notes.
  _isRemainingTicksBeamable(tickmap: TickMap, index: number) {
    let acc = 0;
    let i = 0;
    if (this.duration >= this.beamBeats) {
      return false;
    }
    acc = this.duration;
    for (i = index + 1; i < tickmap.deltaMap.length; ++i) {
      acc += tickmap.deltaMap[i];
      if (acc === this.beamBeats) {
        return true;
      }
      if (acc > this.beamBeats) {
        return false;
      }
    }
    return false;
  }
  allEighth() {
    for (var i = 0; i < this.currentGroup.length; ++i) {
      const cg = this.currentGroup[i];
      if (cg.tickCount !== 2048) {
        return false;
      }
    }
    return true;
  }
  beamNote(tickmap: TickMap, index: number, note: SmoNote) {
    this.beamBeats = note.beamBeats;
    this.duration += tickmap.deltaMap[index];
    this.measureDuration += tickmap.deltaMap[index];
    if (note.noteType === '/') {
      this._completeGroup(tickmap.voice);
      this._advanceGroup();
      return;
    }

    if (this.currentGroup.length > 0) {
      const areTupletsBothNull = SmoTupletTree.areTupletsBothNull(tickmap.notes[index - 1], tickmap.notes[index]);
      const areNotesPartOfTheSameTuplet = SmoTupletTree.areNotesPartOfTheSameTuplet(tickmap.notes[index - 1], tickmap.notes[index]);

      if (!areTupletsBothNull && !areNotesPartOfTheSameTuplet) {
        this.secondaryBeamBreaks.push(this.currentGroup.length - 1);
      }
    }

    // beam tuplets
    if (note.isTuplet) {
      const tupletTree = SmoTupletTree.getTupletTreeForNoteIndex(this.measure.tupletTrees, tickmap.voice, index);
      if (!tupletTree) {
        return;
      }

      // is this beamable length-wise
      if (note.noteType === 'n' && note.stemTicks < 4096) {
        this.currentGroup.push(note);
      }
      // Ultimate note in tuplet
      if (tupletTree.endIndex == index && !this._isRemainingTicksBeamable(tickmap, index)) {
        this._completeGroup(tickmap.voice);
        this._advanceGroup();
      }
      return;
    }

    // don't beam > 1/4 note in 4/4 time.  Don't beam rests.
    if (note.stemTicks >= 4096 || (note.isRest() && this.currentGroup.length === 0)) {
      this._completeGroup(tickmap.voice);
      this._advanceGroup();
      return;
    }

    this.currentGroup.push(note);

    if (note.beamState === SmoNote.beamStates.end) {
      this._completeGroup(tickmap.voice);
      this._advanceGroup();
    }
    if (index == tickmap.notes.length - 1) {
      //Last note in the voice. We are closing the beam with whatever has been put there
      this._completeGroup(tickmap.voice);
      this._advanceGroup();
      return;
    }

    if (this.measure.timeSignature.actualBeats % 4 === 0 || 
      this.measure.timeSignature.actualBeats === 2) {
      if (this.duration < 8192 && this.allEighth()) {
        return;
      } else if (this.duration === 8192) {
        this._completeGroup(tickmap.voice);
        this._advanceGroup();
      }
    }
    // If we are aligned to a beat on the measure, and we are in common time
    if (this.currentGroup.length > 1 
      && this.measure.timeSignature.beatDuration === 4 
      && this.measureDuration % 4096 === 0 &&
         note.beamState !== SmoNote.beamStates.continue) {
        this._completeGroup(tickmap.voice);
        this._advanceGroup();
        return;
    }
    if (this.duration === this.beamBeats) {
      this._completeGroup(tickmap.voice);
      this._advanceGroup();
      return;
    }

    // If this does not align on a beat, don't beam it
    if (this.duration > this.beamBeats) {
      this._advanceGroup();
    }
  }
}
