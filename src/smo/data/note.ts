// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Classes to support {@link SmoNote}.  Notes have pitches and a duration, and other
 * modifiers that can affect display or playback.
 * @module /smo/data/note
 */
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoNoteModifierBase, SmoArticulation, SmoLyric, SmoGraceNote, SmoMicrotone, SmoOrnament, SmoDynamicText, 
  SmoArpeggio, SmoArticulationParametersSer, GraceNoteParamsSer, SmoOrnamentParamsSer, SmoMicrotoneParamsSer,
  SmoClefChangeParamsSer, SmoClefChange, SmoLyricParamsSer, SmoDynamicTextSer, SmoTabNote,
  SmoTabNoteParamsSer,
  SmoTabNoteParams,
  SmoFretPosition} from './noteModifiers';
import { SmoMusic } from './music';
import { Ticks, Pitch, SmoAttrs, Transposable, PitchLetter, SvgBox, getId } from './common';
import { FontInfo, vexCanonicalNotes } from '../../common/vex';
import { SmoTupletParamsSer } from './tuplet';
/**
 * @category SmoObject
 */
export interface TupletInfo {
  id: string;
}
// @internal
export type NoteType = 'n' | 'r' | '/';
// @internal
export type NoteStringParam = 'noteHead' | 'clef';
// @internal
export const NoteStringParams: NoteStringParam[] = ['noteHead', 'clef'];
// @internal
export type NoteNumberParam = 'beamBeats' | 'flagState';
// @internal
export const NoteNumberParams: NoteNumberParam[] = ['beamBeats', 'flagState'];
// @internal
export type NoteBooleanParam = 'hidden' | 'endBeam' | 'isCue';
// @internal
export const NoteBooleanParams: NoteBooleanParam[] = ['hidden', 'endBeam', 'isCue'];
/**
 * Constructor parameters for a note.  Usually you will call
 * {@link SmoNote.defaults}, and modify the parameters you need to change.
 * @param noteType
 * @param noteHead is non-empty, a Vex notehead code TODO make a record<>
 * @param clef determines how the pitch is placed on the staff
 * @param textModifiers are lyrics, chords, dynamics
 * @param articulations
 * @param graceNotes
 * @param ornaments
 * @param tones
 * @param tuplet tuplet info, if the note is part of a tuplet
 * @param endBeam true if this is the last note in a beam
 * @param fillStyle for special effects, for instance to highlight active voice
 * @param hidden indicates the note (usually a rest) is invisible (transparent)
 * @param beamBeats how many ticks to use before beaming a group
 * @param flagState up down auto
 * @param ticks duration
 * @param stemTicks visible duration (todo update this comment)
 * @param pitches SmoPitch array
 * @param isCue tiny notes
 * @category SmoObject
 */
export interface SmoNoteParams {
  /** note, rest, slash */
  noteType: NoteType,
  /**
   * custom note head, defaults to black or open (based on duration)
   */
  noteHead: string,
  /**
   * clef of this note, determines leger lines and sound
   */
  clef: string,
  /**
   * lyrics, annotations
   */
  textModifiers: SmoNoteModifierBase[],
  /**
   * articulations attached to the note
   */
  articulations: SmoArticulation[],
  /**
   * grace notes before the note
   */
  graceNotes: SmoGraceNote[],
  /**
   * ornaments attached to the note
   */
  ornaments: SmoOrnament[],
  /**
   * microtones attached to the note
   */
  tones: SmoMicrotone[],
  /**
   * arpeggio on the note
   */
  arpeggio?: SmoArpeggio,
  /**
   * if this note is part of a tuplet
   */
  tupletId: string | null,
  /*
  * If a custom tab note is assigned to this note
  */
  tabNote?: SmoTabNote,
  /**
   * does this note force the end of a beam group
   */
  endBeam: boolean,
  /**
   * fill, for the pretty
   */
  fillStyle: string | null,
  /**
   * indicates 'hidden' note.  Useful for padding beginning/end of partial measures
   */
  hidden: boolean,
  /**
   * how many notes to beam before creating a new beam group
   */
  beamBeats: number,
  /**
   * up, down, auto
   */
  flagState: number,
  /**
   * note duration
   */
  ticks: Ticks,
  /**
   * visible duration
   */
  stemTicks: number,
  /**
   * pitch for leger lines and sounds
   */
  pitches: Pitch[],
  /**
   * draw cue sized
   */
  isCue: boolean,
  /**
   * indicates this note goes with a clef change
   */
  clefNote: SmoClefChangeParamsSer
}

export type SmoNoteTextModifierSer = SmoLyricParamsSer | SmoDynamicTextSer;
/**
 * The serializable bits of a Note.  Notes will always 
 * have a type, and if a sounded note, can contain pitches.  It will always
 * contains ticks.
 * @category serialization
 */
export interface SmoNoteParamsSer  {
  /** constructor */
  ctor: string;
  /** attributes for identity */
  attrs: SmoAttrs;
  /** note, rest, slash */
  noteType: NoteType,
  /**
    * custom note head, defaults to black or open (based on duration)
    */
  noteHead: string,
  /**
    * clef of this note, determines leger lines and sound
    */
  clef: string,
  /**
    * lyrics, annotations
    */
  textModifiers: SmoNoteTextModifierSer[],
  /**
    * articulations attached to the note
    */
  articulations: SmoArticulationParametersSer,
  /**
    * grace notes before the note
    */
  graceNotes: GraceNoteParamsSer[],
  /**
    * ornaments attached to the note
    */
  ornaments: SmoOrnamentParamsSer[],
  /**
    * microtones attached to the note
    */
  tones: SmoMicrotoneParamsSer[],
  /**
    * arpeggio on the note
    */
  arpeggio?: SmoArticulationParametersSer,
  /**
    * if this note is part of a tuplet
    */
  tupletId?: string,
  /**
   * If a custom tab note is here, keep track of it
   */
  tabNote?: SmoTabNoteParamsSer,
  /**
    * does this note force the end of a beam group
    */
  endBeam: boolean,
  /**
    * fill, for the pretty
    */
  fillStyle: string | null,
  /**
    * indicates 'hidden' note.  Useful for padding beginning/end of partial measures
    */
  hidden: boolean,
  /**
    * how many notes to beam before creating a new beam group
    */
  beamBeats: number,
  /**
    * up, down, auto
    */
  flagState: number,
  /**
    * note duration
    */
  ticks: Ticks,
  /**
   * visible duration (todo: update this comment)
   */
  stemTicks: number,
  /**
    * pitch for leger lines and sounds
    */
  pitches: Pitch[],
  /**
    * draw cue sized
    */
  isCue: boolean,
  /**
    * indicates this note goes with a clef change
    */
  clefNote? : SmoClefChangeParamsSer
}
function isSmoNoteParamsSer(params: Partial<SmoNoteParamsSer>): params is SmoNoteParamsSer {
  if (params.ctor && params.ctor === 'SmoNote') {
   return true;
  }
  return false;
}
export function isSmoNote(transposable: Transposable): transposable is SmoNote {
  if (Array.isArray((transposable as any).graceNotes)) {
    return true;
  }
  return false;
}

/**
 * SmoNote contains the pitch and duration of a note or chord.
 * It can also contain arrays of modifiers like lyrics, articulations etc.
 * Also information about the beaming, flag etc.
 * @category SmoObject
 * */
export class SmoNote implements Transposable {
  constructor(params: SmoNoteParams) {
    const defs = SmoNote.defaults;
    NoteStringParams.forEach((param) => {
      this[param] = params[param] ? params[param] : defs[param];
    });
    this.tupletId = params.tupletId;
    this.noteType = params.noteType ? params.noteType : defs.noteType;
    NoteNumberParams.forEach((param) => {
      this[param] = params[param] ? params[param] : defs[param];
    });
    NoteBooleanParams.forEach((param) => {
      this[param] = params[param] ? params[param] : defs[param];
    });
    if (params.clefNote) {
      this.clefNote = new SmoClefChange(params.clefNote);
    }
    if (params.tabNote) {
      this.tabNote = new SmoTabNote(params.tabNote);
    }
    const pitches = params.pitches ? params.pitches : defs.pitches;
    const ticks = params.ticks ? params.ticks : defs.ticks;
    this.ticks = JSON.parse(JSON.stringify(ticks));
    this.stemTicks = params.stemTicks ? params.stemTicks : defs.stemTicks;
    this.pitches = JSON.parse(JSON.stringify(pitches));
    this.clef = params.clef ? params.clef : defs.clef;
    this.fillStyle = params.fillStyle ? params.fillStyle : '';
    // legacy tuplet, now we just need the tuplet id
    if ((params as any).tuplet) {
      this.tupletId = (params as any).tuplet.id;
    }

    this.attrs = {
      id: getId().toString(),
      type: 'SmoNote'
    }; // else inherit
  }
  static get flagStates() {
    return { auto: 0, up: 1, down: 2 };
  }
  // Note type and ID
  attrs: SmoAttrs;
  flagState: number = SmoNote.flagStates.auto;
  textModifiers: SmoNoteModifierBase[] = [];
  articulations: SmoArticulation[] = [];
  ornaments: SmoOrnament[] = [];
  pitches: Pitch[] = [];
  noteHead: string = '';
  arpeggio?: SmoArpeggio;
  tabNote?: SmoTabNote;
  clef: string = 'treble';
  clefNote: SmoClefChange | null = null;
  graceNotes: SmoGraceNote[] = [];
  noteType: NoteType = 'n';
  fillStyle: string = '';
  hidden: boolean = false;
  tupletId: string | null = null;
  tones: SmoMicrotone[] = [];
  endBeam: boolean = false;
  ticks: Ticks = { numerator: 4096, denominator: 1, remainder: 0 };
  stemTicks: number = 4096;
  beamBeats: number = 4096;
  beam_group: SmoAttrs | null = null;
  renderId: string | null = null;
  keySignature: string = 'c';
  logicalBox: SvgBox | null = null;
  isCue: boolean = false;
  hasTabNote: boolean = true;
  accidentalsRendered: string[] = [];// set by renderer if accidental is to display
  /**
   * used in serialization
   * @internal
   */
  static get parameterArray() {
    return ['ticks', 'pitches', 'noteType', 'tuplet', 'clef', 'isCue', 'stemTicks',
      'endBeam', 'beamBeats', 'flagState', 'noteHead', 'fillStyle', 'hidden', 'arpeggio', 'clefNote',
    'tupletId'];
  }
  /**
   * Default constructor parameters.  We always return a copy so the caller can modify it
   */
  static get defaults(): SmoNoteParams {
    return JSON.parse(JSON.stringify({
      noteType: 'n',
      noteHead: 'n',
      clef: 'treble',
      textModifiers: [],
      articulations: [],
      graceNotes: [],
      ornaments: [],
      tones: [],
      endBeam: false,
      fillStyle: '',
      hidden: false,
      beamBeats: 4096,
      isCue: false,
      flagState: SmoNote.flagStates.auto,
      ticks: {
        numerator: 4096,
        denominator: 1,
        remainder: 0
      },
      stemTicks: 4096,
      pitches: [{
        letter: 'b',
        octave: 4,
        accidental: 'n'
      }],
    }));
  }
  /**
   * Up, down auto (tri-state)
   */
  toggleFlagState() {
    this.flagState = (this.flagState + 1) % 3;
  }

  //todo: double check this
  get dots() {
    const vexDuration = SmoMusic.closestSmoDurationFromTicks(this.stemTicks);
    if (!vexDuration) {
      return 0;
    }
    return vexDuration.dots;
  }

  private _addModifier(dynamic: SmoDynamicText, toAdd: boolean) {
    var tms = [];
    this.textModifiers.forEach((tm) => {
      if (tm.attrs.type !== dynamic.attrs.type) {
        tms.push(tm);
      }
    });
    if (toAdd) {
      tms.push(dynamic);
    }
    this.textModifiers = tms;
  }

  setArticulation(articulation: SmoArticulation, set: boolean) {
    var tms = [];
    this.articulations.forEach((tm) => {
      if (tm.articulation !== articulation.articulation) {
        tms.push(tm);
      }
    });
    if (set) {
      tms.push(articulation);
    }
    this.articulations = tms;
  }
  clearArticulations() {
    this.articulations = [];
  }
  getArticulations() {
    return this.articulations;
  }
  getArticulation(stringCode: string) {
    return this.articulations.find((aa) => aa.articulation === stringCode);
  }
  getOrnament(stringCode: string) {
    return this.ornaments.find((aa) => aa.ornament === stringCode);
  }

  /**
   * Add a new dynamic to thisnote
   * @param dynamic
   */
  addDynamic(dynamic: SmoDynamicText) {
    this._addModifier(dynamic, true);
  }
  /**
   * Remove the dynamic from this note.
   * @param dynamic 
   */
  removeDynamic(dynamic: SmoDynamicText) {
    this._addModifier(dynamic, false);
  }
  /**
   * Get all note modifiers of a type, either a lyric or a dynamic
   * @param type ctor
   * @returns 
   */
  getModifiers(type: string) {
    var ms = this.textModifiers.filter((mod) =>
      mod.attrs.type === type
    );
    return ms;
  }
  setArpeggio(arp: SmoArpeggio) {
    this.arpeggio = arp;
  }
  /**
   * 
   * @returns the longest lyric, used for formatting
   */
  longestLyric(): SmoLyric | null {
    const tms: SmoNoteModifierBase[] = this.textModifiers.filter((mod: SmoNoteModifierBase) =>
      mod.attrs.type === 'SmoLyric' && (mod as SmoLyric).parser === SmoLyric.parsers.lyric
    );
    if (!tms.length) {
      return null;
    }
    return tms.reduce((m1, m2) =>
      (m1 as SmoLyric).getText().length > (m2 as SmoLyric).getText().length ? m1 : m2
    ) as SmoLyric;
  }
  /** Add a lyric to this note, replacing another in the same verse */
  addLyric(lyric: SmoLyric) {
    const tms = this.textModifiers.filter((mod: SmoNoteModifierBase) =>
      mod.attrs.type !== 'SmoLyric' || (mod as SmoLyric).parser !== lyric.parser ||
        (mod as SmoLyric).verse !== lyric.verse
    );
    tms.push(lyric);
    this.textModifiers = tms;
  }

  /**
   * @returns array of lyrics that are lyrics
   */
  getTrueLyrics(): SmoLyric[] {
    const ms = this.textModifiers.filter((mod) =>
      mod.attrs.type === 'SmoLyric' && (mod as SmoLyric).parser === SmoLyric.parsers.lyric);
    ms.sort((a, b) => (a as SmoLyric).verse - (b as SmoLyric).verse);
    return (ms as SmoLyric[]);
  }
  /**
   * 
   * @returns array of SmoLyric whose parsers are chord
   */
  getChords(): SmoLyric[] {
    const ms = this.textModifiers.filter((mod) =>
      mod.attrs.type === 'SmoLyric' && (mod as SmoLyric).parser === SmoLyric.parsers.chord
    );
    return ms as SmoLyric[];
  }
  /**
   * 
   * @param lyric lyric to remove, find the best match if there are multiples
   */
  removeLyric(lyric: SmoLyric) {
    const tms = this.textModifiers.filter((mod: SmoNoteModifierBase) =>
      mod.attrs.type !== 'SmoLyric' || (mod as SmoLyric).verse !== lyric.verse || (mod as SmoLyric).parser !== lyric.parser
    );
    this.textModifiers = tms;
  }
  /**
   * 
   * @param verse 
   * @param parser 
   * @returns 
   */
  getLyricForVerse(verse: number, parser: number) {
    return this.textModifiers.filter((mod) =>
      mod.attrs.type === 'SmoLyric' && (mod as SmoLyric).parser === parser && (mod as SmoLyric).verse === verse
    );
  }

  /**
   * 
   * @param fontInfo
   */
  setLyricFont(fontInfo: FontInfo) {
    const lyrics = this.getTrueLyrics();

    lyrics.forEach((lyric) => {
      lyric.fontInfo = JSON.parse(JSON.stringify(fontInfo));
    });
  }

  /**
   * @param adjustNoteWidth if true, vex will consider the lyric width when formatting the measure
   */
  setLyricAdjustWidth(adjustNoteWidth: boolean) {
    const lyrics = this.getTrueLyrics();
    lyrics.forEach((lyric) => {
      lyric.adjustNoteWidth = adjustNoteWidth;
    });
  }

  setChordAdjustWidth(adjustNoteWidth: boolean) {
    const chords = this.getChords();
    chords.forEach((chord) => {
      chord.adjustNoteWidth = adjustNoteWidth;
    });
  }

  setChordFont(fontInfo: FontInfo) {
    const chords = this.getChords();
    chords.forEach((chord) => {
      chord.fontInfo = JSON.parse(JSON.stringify(fontInfo));
    });
  }

  getOrnaments() {
    return this.ornaments.filter((oo) => oo.isJazz() === false
      && typeof(SmoOrnament.textNoteOrnaments[oo.ornament]) !== 'string');
  }

  getJazzOrnaments() {
    return this.ornaments.filter((oo) => oo.isJazz());
  }
  getTextOrnaments() {
    return this.ornaments.filter((oo) => typeof(SmoOrnament.textNoteOrnaments[oo.ornament]) === 'string');
  }

  /**
   * Toggle the ornament up/down/off
   * @param ornament
   */
  toggleOrnament(ornament: SmoOrnament) {
    const aix = this.ornaments.filter((a) =>
      a.attrs.type === 'SmoOrnament' && a.ornament === ornament.ornament
    );
    if (!aix.length) {
      this.ornaments.push(ornament);
    } else {
      this.ornaments = [];
    }
  }
  setOrnament(ornament: SmoOrnament, set: boolean) {
    const aix = this.ornaments.filter((a) =>
      a.ornament !== ornament.ornament
    );
    this.ornaments = aix;
    if (set) {
      this.ornaments.push(ornament);
    }
  }
  setTabNote(params: SmoTabNoteParams) {
    this.tabNote = new SmoTabNote(params);
    this.tabNote.isAssigned = true;
  }
  clearTabNote() {
    this.tabNote = undefined;
  }
  /**
   * Toggle the ornament up/down/off
   * @param articulation
   */
  toggleArticulation(articulation: SmoArticulation) {
    var aix = this.articulations.findIndex((a) =>
      a.articulation === articulation.articulation
    );
    if (aix >= 0) {
      const cur = this.articulations[aix];
      if (cur.position === SmoArticulation.positions.above) {
        cur.position = SmoArticulation.positions.below;
        return;
      } else {
        this.setArticulation(articulation, false);
        return;
      }
    }
    this.setArticulation(articulation, true);
  }
 
  /**
   * Sort pitches in pitch order, Vex likes to receive pitches in order
   * @param note 
   */
  static sortPitches(note: Transposable) {
    const canon = vexCanonicalNotes();
    const keyIndex = ((pitch: Pitch) =>
      canon.indexOf(pitch.letter) + pitch.octave * 12
    );
    note.pitches.sort((a, b) => keyIndex(a) - keyIndex(b));
  }
  setNoteHead(noteHead: string) {
    if (this.noteHead === noteHead) {
      this.noteHead = '';
    } else {
      this.noteHead = noteHead;
    }
  }
  /**
   * 
   * @param graceNote
   * @param offset the index from the first grace note
   */
  addGraceNote(graceNote: SmoGraceNote, offset: number) {
    if (typeof(offset) === 'undefined') {
      offset = 0;
    }
    graceNote.clef = this.clef;
    this.graceNotes.push(graceNote);
  }
  removeGraceNote(offset: number) {
    if (offset >= this.graceNotes.length) {
      return;
    }
    this.graceNotes.splice(offset, 1);
  }
  getGraceNotes() {
    return this.graceNotes;
  }
  /**
   * Add another pitch to this note at `offset` 1/2 steps
   * @param note
   * @param offset
   */
  static addPitchOffset(note: Transposable, offset: number): void {
    if (note.pitches.length === 0) {
      return;
    }
    note.noteType = 'n';
    const pitch = note.pitches[0];
    note.pitches.push(SmoMusic.getKeyOffset(pitch, offset));
    SmoNote.sortPitches(note);
  }
  /**
   * Add another pitch to this note at `offset` 1/2 steps
   * @param offset
   * @returns 
   */
  addPitchOffset(offset: number) {
    if (this.pitches.length === 0) {
      return;
    }
    this.noteType = 'n';
    const pitch = this.pitches[0];
    this.pitches.push(SmoMusic.getKeyOffset(pitch, offset));
    SmoNote.sortPitches(this);
  }
  toggleRest() {
    this.noteType = (this.noteType === 'r' ? 'n' : 'r');
  }
  toggleSlash() {
    this.noteType = (this.noteType === '/' ? 'n' : '/');
  }
  makeSlash() {
    this.noteType = '/';
  }
  makeRest() {
    this.noteType = 'r';
  }
  isRest() {
    return this.noteType === 'r';
  }
  isSlash() {
    return this.noteType === '/';
  }
  isHidden() {
    return this.hidden;
  }

  makeNote() {
    this.noteType = 'n';
    // clear fill style if we were hiding rests
    this.fillStyle = '';
    this.hidden = false;
  }
  /**
   * set note opacity on/off
   * @param val
   */
  makeHidden(val: boolean) {
    this.hidden = val;
    this.fillStyle = val ? '#aaaaaa7f' : '';
  }

  /**
   * Return true if this note is part of a tuplet
   */
  get isTuplet(): boolean {
    return typeof(this.tupletId) !== 'undefined' && this.tupletId !== null &&  this.tupletId.length > 0;
  }

  /**
   * we only support a single microtone, not sure if vex supports multiple
   * @param tone 
   */
  addMicrotone(tone: SmoMicrotone) {
    const ar = this.tones.filter((tn: SmoMicrotone) => tn.pitchIndex !== tone.pitchIndex);
    ar.push(tone);
    this.tones = ar;
  }
  removeMicrotone() {
    this.tones = [];
  }
  getMicrotone(toneIndex: number) {
    return this.tones.find((tn) => tn.pitchIndex === toneIndex);
  }

  getMicrotones() {
    return this.tones;
  }
  /**
   * cycle through the list of enharmonics for this note.
   * @param pitch
   * @returns 
   */
  static toggleEnharmonic(pitch: Pitch) {
    const lastLetter = pitch.letter;
    let vexPitch = SmoMusic.stripVexOctave(SmoMusic.pitchToVexKey(pitch));
    vexPitch = SmoMusic.getEnharmonic(vexPitch);

    pitch.letter = vexPitch[0] as PitchLetter;
    pitch.accidental = vexPitch.length > 1 ?
      vexPitch.substring(1, vexPitch.length) : 'n';
    pitch.octave += SmoMusic.letterChangedOctave(lastLetter, pitch.letter);
    return pitch;
  }
  /**
   * transpose a note or grace note to a key-friendly enharmonic
   * @param pitchArray
   * @param offset
   * @param originalKey - keySignature from original note
   * @param destinationKey - keySignature we are transposing into
   * @returns 
   */
  transpose(pitchArray: number[], offset: number, originalKey: string, destinationKey: string): Transposable {
    return SmoNote.transpose(this, pitchArray, offset, originalKey, destinationKey);
  }
  /**
   * used to add chord and pitch by piano widget
   * @param pitch
   */
  toggleAddPitch(pitch: Pitch) {
    const pitches: Pitch[] = [];
    let exists = false;
    this.pitches.forEach((o) => {
      if (o.letter !== pitch.letter ||
        o.octave !== pitch.octave ||
        o.accidental !== pitch.accidental) {
        pitches.push(o);
      } else {
        exists = true;
      }
    });
    this.pitches = pitches;
    if (!exists) {
      this.pitches.push(JSON.parse(JSON.stringify(pitch)));
      this.noteType = 'n';
    }
    SmoNote.sortPitches(this);
  }
  /**
   * @param note note to transpose
   * @param pitchArray an array of indices (not pitches) that indicate which pitches get altered if a chord
   * @param offset in 1/2 step
   * @param originalKey original key for enharmonic-friendly key
   * @param destinationKey destination key signature
   * @returns 
   */
  static transpose(note: Transposable, pitchArray: number[], offset: number, originalKey: string, destinationKey: string): Transposable {
    let index: number = 0;
    let j: number = 0;
    if (offset === 0 && originalKey === destinationKey) {
      return note;
    }
    // If no specific pitch, use all the pitches
    if (pitchArray.length === 0) {
      pitchArray = Array.from(note.pitches.keys());
    }
    for (j = 0; j < pitchArray.length; ++j) {
      index = pitchArray[j];
      if (index + 1 > note.pitches.length) {
        SmoNote.addPitchOffset(note, offset);
      } else {
        const original = JSON.parse(JSON.stringify(note.pitches[index]));
        const pitch = SmoMusic.transposePitchForKey(original, originalKey, destinationKey, offset);
        note.pitches[index] = pitch;
      }
    }
    // If the fret position can be adjusted on the current string, keep the tab note.  Else
    // delete the tab note, and auto-generate it to display default
    if (isSmoNote(note)) {
      const sn: SmoNote = note;
      if (sn.tabNote && sn.tabNote.positions.length > 0) {
        const frets: SmoFretPosition[] = [];
        sn.tabNote.positions.forEach((pos) => {
          if (pos.fret + offset > 0) {
            frets.push({ string: pos.string, fret: pos.fret + offset});
          }
        });
        if (frets.length) {
          sn.tabNote.positions = frets;
        } else {
          sn.tabNote = undefined;
        }
      }
    }
    SmoNote.sortPitches(note);
    return note;
  }
  get tickCount() {
    return this.ticks.numerator / this.ticks.denominator + this.ticks.remainder;
  }

  /**
   * Copy the note, give it unique id
   * @param note
   * @returns 
   */
  static clone(note: SmoNote) {
    var rv = SmoNote.deserialize(note.serialize());

    // make sure id is unique
    rv.attrs = {
      id: getId().toString(),
      type: 'SmoNote'
    };
    return rv;
  }

  /**
   * @param note
   * @param ticks
   * @returns A note identical to `note` but with different duration
   */
  static cloneWithDuration(note: SmoNote, ticks: Ticks | number, stemTicks: number | null = null) {
    if (typeof(ticks) === 'number') {
      ticks = { numerator: ticks, denominator: 1, remainder: 0 };
    }
    const rv = SmoNote.clone(note);
    rv.ticks = ticks;

    if (stemTicks === null) {
      rv.stemTicks = ticks.numerator + ticks.remainder;
    } else {
      rv.stemTicks = stemTicks;
    }

    return rv;
  }
  static serializeModifier(modifiers: SmoNoteModifierBase[]) : object[] {
    const rv: object[] = [];
    modifiers.forEach((modifier: SmoNoteModifierBase) => {
      rv.push(modifier.serialize());
    });
    return rv;
  }

  private _serializeModifiers(params: any) {
    params.textModifiers = SmoNote.serializeModifier(this.textModifiers);
    params.graceNotes = SmoNote.serializeModifier(this.graceNotes);
    params.articulations = SmoNote.serializeModifier(this.articulations);
    params.ornaments = SmoNote.serializeModifier(this.ornaments);
    params.tones = SmoNote.serializeModifier(this.tones);
    if (this.arpeggio) {
      params.arpeggio = this.arpeggio.serialize();
    }
  }
  /**
   * @returns a JSON object that can be used to create this note
   */
  serialize(): SmoNoteParamsSer {
    var params: Partial<SmoNoteParamsSer> = { ctor: 'SmoNote' };
    smoSerialize.serializedMergeNonDefault(SmoNote.defaults, SmoNote.parameterArray, this, params);
    if (this.tabNote) {
      params.tabNote = this.tabNote.serialize();
    }
    if (this.clefNote) {
      params.clefNote = this.clefNote.serialize();
    }
    if (params.ticks) {
      params.ticks = JSON.parse(JSON.stringify(params.ticks));
    }
    this._serializeModifiers(params);
    if (!isSmoNoteParamsSer(params)) {
      throw 'bad note ' + JSON.stringify(params);
    }
    return params;
  }
  /**
   * restore note modifiers and create a SmoNote object
   * @param jsonObj
   * @returns 
   */
  static deserialize(jsonObj: any) {
    //legacy note
    if (jsonObj.ticks && jsonObj.stemTicks === undefined) {
      if (jsonObj.tupletId || jsonObj.tuplet) {
        jsonObj['stemTicks'] = SmoMusic.closestBeamDuration(jsonObj.ticks.numerator / jsonObj.ticks.denominator + jsonObj.ticks.remainder)!.ticks;
      } else {
        jsonObj['stemTicks'] = SmoMusic.closestSmoDurationFromTicks(jsonObj.ticks.numerator / jsonObj.ticks.denominator + jsonObj.ticks.remainder)!.ticks;
      }
    }
    var note = new SmoNote(jsonObj);
    if (jsonObj.textModifiers) {
      jsonObj.textModifiers.forEach((mod: any) => {
        note.textModifiers.push(SmoNoteModifierBase.deserialize(mod));
      });
    }
    if (jsonObj.graceNotes) {
      jsonObj.graceNotes.forEach((mod: any) => {
        note.graceNotes.push(SmoNoteModifierBase.deserialize(mod));
      });
    }
    if (jsonObj.ornaments) {
      jsonObj.ornaments.forEach((mod: any) => {
        note.ornaments.push(SmoNoteModifierBase.deserialize(mod));
      });
    }
    if (jsonObj.articulations) {
      jsonObj.articulations.forEach((mod: any) => {
        note.articulations.push(SmoNoteModifierBase.deserialize(mod));
      });
    }
    if (jsonObj.tones) {
      jsonObj.tones.forEach((mod: any) => {
        note.tones.push(SmoNoteModifierBase.deserialize(mod));
      });
    }
    // Due to a bug, text modifiers were serialized into noteModifiers array
    if (jsonObj.noteModifiers) {
      jsonObj.noteModifiers.forEach((mod: any) => {
        note.textModifiers.push(SmoNoteModifierBase.deserialize(mod));
      });
    }
    if (jsonObj.arpeggio) {
      note.arpeggio = SmoNoteModifierBase.deserialize(jsonObj.arpeggio);
    }
    if (jsonObj.clefNote) {
      note.clefNote = SmoNoteModifierBase.deserialize(jsonObj.clefNote);
    }
    return note;
  }
}
