// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * A note modifier is anything that is mapped to the note, but not part of the
 * pitch itself.  This includes grace notes, and note-text like lyrics.
 * @module /smo/data/noteModifiers
 */
import { SmoAttrs, Ticks, Pitch, getId, SmoObjectParams, Transposable, SvgBox, SmoModifierBase, 
  Clef, IsClef, SmoDynamicCtor, 
  IsPitchLetter, ElementLike} from './common';
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoMusic } from './music';
import { defaultNoteScale, FontInfo, getChordSymbolGlyphFromCode } from '../../common/vex';

/**
 * A note modifier is anything that is mapped to the note, but not part of the
 * pitch itself.  This includes grace notes, and note-text like lyrics.
 * All note modifiers have a serialize method and a 'ctor' parameter or deserialization
 * @category SmoObject
 */
export abstract class SmoNoteModifierBase implements SmoModifierBase {
  attrs: SmoAttrs;
  ctor: string;
  logicalBox: SvgBox | null = null;
  element: ElementLike = null;
  constructor(ctor: string) {
    this.attrs = {
      id: getId().toString(),
      type: ctor
    };
    this.ctor = ctor;
  }
  static deserialize(jsonObj: SmoObjectParams) {
    // Handle backwards-compatibility thing
    if (jsonObj.ctor === 'SmoMicrotone' && typeof ((jsonObj as any).pitch) === 'number') {
      (jsonObj as any).pitchIndex = (jsonObj as any).pitch;
    }
    if (jsonObj.ctor === 'SmoLyric') {
      if (typeof((jsonObj as any)._text) === 'string') {
        (jsonObj as any).text = (jsonObj as any)._text;
      }
    }
    if (typeof (SmoDynamicCtor[jsonObj.ctor]) === 'undefined') {
      console.log('ouch bad ctor for ' + jsonObj.ctor);
    }
    try {
      const rv = SmoDynamicCtor[jsonObj.ctor](jsonObj);
      return rv;
    } catch (exp) {
      console.error('no ctor for ' + jsonObj.ctor);
      throw(exp);
    }
  }
  abstract serialize(): any;
}


export function isClefChangeParamsSer(params: Partial<SmoClefChangeParamsSer>): params is SmoClefChangeParamsSer {
  if (typeof(params.clef) === 'string' && params.ctor === 'SmoClefChange') {
    return true;
  }
  return false;
}
/**
 * @category SmoObject
 */
export interface SmoClefChangeParams  {
  clef: string
}
/**
 * @category serialization
 */
export interface SmoClefChangeParamsSer extends SmoClefChangeParams {
  /**
   * constructor
   */
    ctor: string;
    /**
     * attributes for ID
     */
    attrs: SmoAttrs;
}

/**
 * @category SmoObject
 */
export class SmoClefChange extends SmoNoteModifierBase {
  clef: Clef;
  static get defaults() {
    const rv: SmoClefChangeParamsSer = JSON.parse(JSON.stringify({
      clef: 'treble',
      ctor: 'SmoClefChange',
      attrs: {
        id: getId(),
        type: 'SmoClefChange'
      }
    }));
    return rv;
  }
  constructor(clefParams: SmoClefChangeParams) {
    super('SmoClefChange');
    const clef = clefParams.clef;
    if (!IsClef(clef)) {
      this.clef = 'treble';
    } else {
      this.clef = clef as Clef;
    }
  }
  serialize(): SmoClefChangeParamsSer {
    const params: Partial<SmoClefChangeParamsSer> = { ctor: 'SmoClefChange' };
    params.clef = this.clef;
    if (!isClefChangeParamsSer(params)) {
      throw('corrupt clef change');
    }
    return params;
  }
}
/**
 * used to construct {@link SmoGraceNote}
 *   beam group.
 * @category SmoObject
 */
export interface GraceNoteParams extends SmoModifierBase {
  /**
   * up, down, or auto
   */
  flagState: number,
  /**
   * same as for {@link SmoNote}
   */
  noteType: string,
  /**
   * same as for {@link SmoNote}
   */
  beamBeats: number,
  /**
   * same as for {@link SmoNote}.  Indicates break in beam group
   */
  endBeam: boolean,
  /**
   * should be same as note?
   */
  clef: string,
  /**
   * there's probably a name for this...
   */
  slash: boolean,
  /**
   * only used for beaming
   */
  ticks: Ticks,
  /**
   * Pitch, same as for {@link SmoNote}
   */
  pitches: Pitch[],
}

/**
 * serialized grace note
 * @category serialization
 */
export interface GraceNoteParamsSer extends GraceNoteParams {
  /**
   * constructor
   */
  ctor: string;
  /**
   * attributes for ID
   */
  attrs: SmoAttrs;
}

function isGraceNoteParamsSer(params: Partial<GraceNoteParamsSer>): params is GraceNoteParamsSer {
  if (typeof(params.ctor) !== 'string' || params.ctor !== 'SmoGraceNote') {
    return false;
  }
  return true;
}
/**
 * A grace notes has many of the things an 'actual' note can have, but it doesn't take up
 * time against the time signature
 * @category SmoObject
 */
export class SmoGraceNote extends SmoNoteModifierBase implements Transposable {
  static get flagStates() {
    return { auto: 0, up: 1, down: 2 };
  }
  static get defaults(): GraceNoteParams {
    return JSON.parse(JSON.stringify({
      flagState: SmoGraceNote.flagStates.auto,
      noteType: 'n',
      beamBeats: 4096,
      endBeam: false,
      clef: 'treble',
      slash: false,
      ticks: {
        numerator: 4096,
        denominator: 1,
        remainder: 0
      },
      pitches: [{
        letter: 'b',
        octave: 4,
        accidental: ''
      }]
    }));
  }
  // TODO: Matches SmoNote - move to SmoMusic?
  static get parameterArray() {
    const rv: string[] = [];
    // eslint-disable-next-line
    for (const key in SmoGraceNote.defaults) {
      rv.push(key);
    }
    return rv;
  }
  ticks: Ticks = SmoGraceNote.defaults.ticks;
  pitches: Pitch[] = [];
  slash: boolean = false;
  clef: string = 'treble';
  noteType: string = 'n';
  renderId: string | null = null;
  hasTabNote: boolean = false;

  tickCount() {
    return this.ticks.numerator / this.ticks.denominator + this.ticks.remainder;
  }

  toVexGraceNote() {
    const p = SmoMusic.smoPitchesToVex(this.pitches);
    const rv = { duration: SmoMusic.closestVexDuration(this.tickCount()), keys: p, slash: this.slash };
    return rv;
  }

  serialize(): GraceNoteParamsSer {
    const params: Partial<GraceNoteParamsSer> = { ctor: 'SmoGraceNote' };
    smoSerialize.serializedMergeNonDefault(SmoGraceNote.defaults,
      SmoGraceNote.parameterArray, this, params);
    if (!isGraceNoteParamsSer(params)) {
      throw 'bad grace note ' + JSON.stringify(params);
    }
    return params;
  }
  constructor(parameters: Partial<GraceNoteParams>) {
    super('SmoGraceNote');
    smoSerialize.serializedMerge(SmoGraceNote.parameterArray, SmoGraceNote.defaults, this);
    smoSerialize.serializedMerge(SmoGraceNote.parameterArray, parameters, this);
  }
}
export type SmoArpeggioType = 'directionless' | 'rasquedo_up' | 'rasquedo_down' 
  | 'roll_up' | 'roll_down' | 'brush_up' | 'brush_down' | 'none';
export  const SmoArpeggioTypes = ['directionless', 'rasquedo_up', 'rasquedo_down',
  'roll_up', 'roll_down', 'brush_up', 'brush_down', 'none'];

  /**
   * @category SmoObject
   */
export interface SmoArpeggioParams {
   type: SmoArpeggioType
}
/**
 * @category serialization
 */
export interface SmoArpeggioParamsSer {
  ctor: string;
  /**
   * stringified arpeggion enumeration
   */
  type: string;
}
function isSmoArpeggionParamsSer(params: Partial<SmoArpeggioParamsSer>): params is SmoArpeggioParamsSer {
  if (typeof(params.ctor) !== 'string' || params.ctor !== 'SmoArpeggio') {
    return false;
  }
  return true;
}
export function isArpeggioType(tp: SmoArpeggioType | string): tp is SmoArpeggioType {
  return SmoArpeggioTypes.indexOf(tp) >= 0;
}
/**
 * A 'splatter' symbol next to a chord.
 * @category SmoObject
 */
export class SmoArpeggio extends SmoNoteModifierBase {
  static _types: Record<string, number> = {};
  static get types() {
    if (typeof(SmoArpeggio._types['directionless']) === 'undefined') {
      SmoArpeggio._types['directionless'] = 7;
      SmoArpeggio._types['rasquedo_up'] = 6;
      SmoArpeggio._types['rasquedo_down'] = 5;
      SmoArpeggio._types['roll_up'] = 4;
      SmoArpeggio._types['roll_down'] = 3;
      SmoArpeggio._types['brush_up'] = 2;
      SmoArpeggio._types['brush_down'] = 1;
      SmoArpeggio._types['none'] = 0;
    }
    return SmoArpeggio._types;
  }    
  typeCode: number;
  constructor(params: SmoArpeggioParams) {
    super('SmoArpeggio');
    this.typeCode = SmoArpeggio.types[params.type];
  }
  get typeString(): SmoArpeggioType {
    const str = SmoArpeggioTypes.find((x) => SmoArpeggio.types[x] === this.typeCode);
    const type = str ? str : 'none';
    return type as SmoArpeggioType;
  }
  serialize(): SmoArpeggioParamsSer {
    const rv: Partial<SmoArpeggioParamsSer> = { ctor: 'SmoArpeggio' }
    const str = SmoArpeggioTypes.find((x) => SmoArpeggio.types[x] === this.typeCode);
    rv.type = str ? str : 'none';
    if (!isSmoArpeggionParamsSer(rv)) {
      throw 'bad arpeggio ' + JSON.stringify(rv);
    }
    return rv;
  }
}
/**
 * Constructor parameters for {@link SmoMicrotone}
 * @category SmoObject
 */
export interface SmoMicrotoneParams extends SmoObjectParams {
  /**
   * indicates which modifier to alter the tone (e.g. 1/4 sharp)
   */
  tone: string,
  /**
   * the index of the pitch to alter
   */
  pitch: number
}
/**
 * serialized microtones.
 * @category serialization
 */
export interface SmoMicrotoneParamsSer extends SmoMicrotoneParams {
  ctor: string,
  attrs: SmoAttrs
}
function isSmoMicrotoneParamsSer(params: Partial<SmoMicrotoneParamsSer>): params is SmoMicrotoneParamsSer {
  if (typeof(params.ctor) !== 'string' || params.ctor !== 'SmoMicrotone') {
    return false;
  }
  return true;
}
/**
 * Microtones are treated similarly to ornaments.  There are not
 * rules for persisting throughout a measure, cancel etc.
 * @category SmoObject
*/
export class SmoMicrotone extends SmoNoteModifierBase {
  tone: string = 'flat75sz';
  pitchIndex: number = 0;

  // This is how VexFlow notates them
  static readonly smoToVex: Record<string, string> = {
    flat75sz: 'db',
    flat25sz: 'd',
    flat25ar: 'bs',
    flat125ar: 'afhf',
    sharp75: '++',
    sharp125: 'ashs',
    sharp25: '+',
    sori: 'o',
    koron: 'k'
  }

  // The audio frequency offsets
  static readonly pitchCoeff: Record<string, number> = {
    flat75sz: -1.5,
    flat25sz: -0.5,
    flat25ar: -0.5,
    flat125ar: -2.5,
    sharp75: 1.5,
    sharp125: 2.5,
    sharp25: 0.5,
    sori: 0.5,
    koron: -0.5
  }

  get toPitchCoeff(): number {
    return SmoMicrotone.pitchCoeff[this.tone];
  }

  get toVex(): string {
    return SmoMicrotone.smoToVex[this.tone];
  }
  static get defaults(): SmoMicrotoneParams  {
    return JSON.parse(JSON.stringify({
      ctor: 'SmoMicrotone',
      tone: 'flat25sz',
      pitch: 0
    }));
  }
  static get parameterArray() {
    const rv: string[] = [];
    // eslint-disable-next-line
    for (const key in SmoMicrotone.defaults) {
      rv.push(key);
    }
    return rv;
  }
  serialize(): SmoMicrotoneParamsSer {
    const params: Partial<SmoMicrotoneParamsSer> = { ctor: 'SmoMicrotone' };
    smoSerialize.serializedMergeNonDefault(SmoMicrotone.defaults,
      SmoMicrotone.parameterArray, this, params);
    if (!isSmoMicrotoneParamsSer(params)) {
      throw 'bad microtone ' + JSON.stringify(params);
    }
    return params;
  }
  constructor(parameters: SmoMicrotoneParams) {
    super(parameters.ctor);
    smoSerialize.serializedMerge(SmoMicrotone.parameterArray, SmoMicrotone.defaults, this);
    smoSerialize.serializedMerge(SmoMicrotone.parameterArray, parameters, this);
  }
}

/**
 * Constructor for {@link SmoOrnament}
 * @category SmoObject
 */
export interface SmoOrnamentParams {
  /**
   * postition, above or below
   */
  position?: string,
  /**
   * horizontal offset from note head
   */  
  offset?: string,
  /**
   * accidental above/below
   */
  accidentalAbove?: string,
  accidentalBelow?: string,
  /**
   * code for the ornament
   */
  ornament: string,
}
/**
 * serializable ornament
 * @category serialization
 */
export interface SmoOrnamentParamsSer extends SmoOrnamentParams {
  /**
   * constructor
   */
  ctor: string;
}
function isSmoOrnamentParamsSer(params: Partial<SmoOrnamentParamsSer>): params is SmoOrnamentParamsSer {
  if (typeof(params.ctor) !== 'string' || params.ctor !== 'SmoOrnament') {
    return false;
  }
  return true;
}
/**
 * Ornaments map to vex ornaments.  articulations vs. ornaments
 * is kind of arbitrary
 * @category SmoObject
 */
export class SmoOrnament extends SmoNoteModifierBase {  
  static readonly ornaments: Record<string, string> = {
    mordent: 'mordent',
    mordent_inverted: 'mordent_inverted',
    turn: 'turn',
    turn_inverted: 'turn_inverted',
    trill: 'tr',
    upprall: 'upprall',
    prallup: 'prallup',
    pralldown: 'pralldown',
    upmordent: 'upmordent',
    downmordent: 'downmordent',
    caesura: 'caesura',
    lineprall: 'lineprall',
    prallprall: 'prallprall',
    scoop: 'scoop',
    fall: 'fall',
    fallLong: 'fallLong',
    breath: 'breath',
    doit: 'doit',
    doitLong: 'doitLong',
    flip: 'flip',
    smear: 'smear',
    bend: 'bend',
    plungerClosed: 'plungerClosed',
    plungerOpen: 'plungerOpen'
  }

  static readonly xmlOrnaments: Record<string, string> = {
    mordent: 'mordent',
    mordent_inverted: 'inverted-mordent',
    turn: 'turn',
    turn_inverted: 'inverted-turn',
    upmordent: 'mordent',
    downmordent: 'mordent',
    lineprall: 'schleifer',
    prallprall: 'schleifer',
    prallup: 'schleifer',
    tr: 'trill-mark'
  }
  static readonly textNoteOrnaments: Record<string, string>  = {
    breath: 'breath',
    caesura: 'caesura_straight'
  }
  // jazz ornaments in vex are articulations in music xml
  static readonly xmlJazz: Record<string, string> = {
    doit: 'doit',
    scoop: 'scoop',
    dropLong: 'falloff',
    drop: 'plop'
  }
  static get jazzOrnaments(): string[] {
    return ['scoop', 'fallLong', 'doit', 'doitLong', 'flip', 'smear', 'scoop', 'plungerOpen', 'plungerClosed', 'bend'];
  }
  static get legacyJazz(): Record<string, string> {
    return {'SCOOP': SmoOrnament.ornaments.scoop ,
      'FALL_SHORT': SmoOrnament.ornaments.fall,
      'FALL_LONG': SmoOrnament.ornaments.fallLong,
      'DOIT': SmoOrnament.ornaments.doit,
      'LIFT': SmoOrnament.ornaments.lift,
      'FLIP': SmoOrnament.ornaments.flip,
      'SMEAR': SmoOrnament.ornaments.smear
    };
  }
  toVex() {
    return SmoOrnament.ornaments[this.ornament];
  }
  isJazz() {
    return SmoOrnament.jazzOrnaments.indexOf(this.ornament) >= 0;
  }
  position: string = SmoOrnament.positions.above;
  offset: string = 'on';
  ornament: string = SmoOrnament.ornaments.mordent;

  static get parameterArray() {
    const rv: string[] = [];
    // eslint-disable-next-line
    for (const key in SmoOrnament.defaults) {
      rv.push(key);
    }
    return rv;
  }

  static get positions() {
    return {
      above: 'above',
      below: 'below',
      auto: 'auto'
    };
  }
  static get offsets() {
    return {
      on: 'on',
      after: 'after'
    };
  }  
  static get defaults(): SmoOrnamentParams {
    return JSON.parse(JSON.stringify({
      ctor: 'SmoOrnament',
      ornament: SmoOrnament.ornaments.mordent,
      position: SmoOrnament.positions.auto,
      offset: SmoOrnament.offsets.on
    }));
  }
  serialize(): SmoOrnamentParamsSer {
    var params: Partial<SmoOrnamentParamsSer> = { ctor: 'SmoOrnament' };
    smoSerialize.serializedMergeNonDefault(SmoOrnament.defaults,
      SmoOrnament.parameterArray, this, params);
    if (!isSmoOrnamentParamsSer(params)) {
      throw 'bad ornament ' + JSON.stringify(params);
    }
    return params;
  }
  constructor(parameters: SmoOrnamentParams) {
    super('SmoOrnament');
    smoSerialize.serializedMerge(SmoOrnament.parameterArray, SmoOrnament.defaults, this);
    smoSerialize.serializedMerge(SmoOrnament.parameterArray, parameters, this);
    // handle some legacy changes
    if (typeof(SmoOrnament.legacyJazz[this.ornament]) === 'string') {
      this.ornament = SmoOrnament.legacyJazz[this.ornament];
    }
  }
}

/**
 * Constructor parameters for {@link SmoArticulation}
 * @category SmoObject
 */
export interface SmoArticulationParameters {
  /**
   * position, above or below
   */
  position?: string,
  /**
   * x offset
   */
  offset?: number,
  /**
   * articulation code
   */
  articulation: string
}
/**
 * @category serialization
 */
export interface SmoArticulationParametersSer extends SmoArticulationParameters {
  ctor: string;
}
function isSmoArticulationParametersSer(params: Partial<SmoArticulationParametersSer>): params is SmoArticulationParametersSer {
  if (typeof(params.ctor) !== 'string' || params.ctor !== 'SmoArticulation') {
    return false;
  }
  return true;
}
/**
 * Articulations map to notes, can be placed above/below
 * @category SmoObject
 */
export class SmoArticulation extends SmoNoteModifierBase {
  static get articulations(): Record<string, string> {
    return {
      accent: 'accent',
      staccato: 'staccato',
      marcato: 'marcato',
      tenuto: 'tenuto',
      upStroke: 'upStroke',
      downStroke: 'downStroke',
      pizzicato: 'pizzicato',
      bowUp: 'bowUp',
      bowDown: 'bowDown',
      fermata: 'fermata'
    };
  }
  static readonly xmlArticulations: Record<string, string> = {
    accent: 'accent',
    staccato: 'staccato',
    tenuto: 'tenuto',
    marcato: 'strong-accent'
  }
  static get positions() {
    return {
      above: 'above',
      below: 'below',
      auto: 'auto'
    };
  }
  static get articulationToVex(): Record<string, string> {
    return {
      accent: 'a>',
      staccato: 'a.',
      marcato: 'a^',
      tenuto: 'a-',
      upStroke: 'a|',
      downStroke: 'am',
      pizzicato: 'ao',
      fermata: 'a@a'
    };
  }

  static get vexToArticulation(): Record<string, string> {
    return {
      'a>': 'accent',
      'a.': 'staccato',
      'a^': 'marcato',
      'a-': 'tenuto',
      'a|': 'upStroke',
      'am': 'downStroke',
      'ao': 'pizzicato',
      'a@a': 'fermata'
    };
  }
  static get parameterArray(): string[] {
    const rv: string[] = [];
    // eslint-disable-next-line
    for (const key in SmoArticulation.defaults) {
      rv.push(key);
    }
    return rv;
  }

  static get positionToVex(): Record<string, number> {
    return {
      'above': 3,
      'below': 4
    };
  }
  static get defaults(): SmoArticulationParameters {
    return JSON.parse(JSON.stringify({
      ctor: 'SmoArticulation',
      position: SmoArticulation.positions.above,
      articulation: SmoArticulation.articulations.accent
    }));
  }
  position: string = SmoOrnament.positions.above;
  offset: number = 0;
  articulation: string = SmoArticulation.articulations.accent;
  adjX: number = 0;

  serialize(): SmoArticulationParametersSer {
    var params: Partial<SmoArticulationParametersSer> = { ctor: 'SmoArticulation'};
    smoSerialize.serializedMergeNonDefault(SmoArticulation.defaults,
      SmoArticulation.parameterArray, this, params);
    if (!isSmoArticulationParametersSer(params)) {
      throw 'bad articulation ' + JSON.stringify(params);
    }
    return params;
  }
  constructor(parameters: SmoArticulationParameters) {
    super('SmoArticulation');
    smoSerialize.serializedMerge(SmoArticulation.parameterArray, SmoArticulation.defaults, this);
    smoSerialize.serializedMerge(SmoArticulation.parameterArray, parameters, this);
    // this.selector = parameters.selector;
  }
}

/**
 * @internal
 */
export interface VexAnnotationParams {
  glyph?: string,
  symbolModifier?: number,
  text?: string
}

/**
 * The persist-y parts of {@link SmoLyricParams}. We don't persist the selector
 * since that can change based on the position of the parent note
 * @category serialization
 */
export interface SmoLyricParamsSer extends SmoObjectParams {
  /**
   * constructor
   */
  ctor: string,
  /**
   * attributes for ID
   */
  attrs: SmoAttrs,
  /**
   * the lyric font
   */
  fontInfo: FontInfo,
  /**
   * classes for styling
   */
  classes: string,
  /**
   * which verse the lyric goes with
   */
  verse: number,
  /**
   * lyrics are used for chord changes or annotations, parser is different for each
   */
  parser: number,
  /**
   * indicates we should format for the width of the lyric
   */
  adjustNoteWidthLyric: boolean,
  /**
   * indicates we should format for the width of the chord
   */
  adjustNoteWidthChord: boolean,
  /**
   * fill color for text
   */
  fill: string,
  /**
   * translate to align lyrics.  Possibly this should not be serialized
   */
  translateX: number,
  /**
   * translate to align lyrics.  Possibly this should not be serialized
   */
  translateY: number,
  /**
   * the actual text
   */
  text: string | null
}

function isSmoLyricPersist(params: Partial<SmoLyricParamsSer>): params is SmoLyricParamsSer {
  if (typeof(params.ctor) !== 'string' || params.ctor !== 'SmoLyric') {
    return false;
  }
  return true;
}
/**
 * Used to construct a {@link SmoLyric} for both chords and lyrics
 * @category SmoObject
 */
export interface SmoLyricParams {
  /**
   * the lyric font
   */
  fontInfo: FontInfo,
  /**
   * classes for styling
   */
  classes: string,
  /**
   * which verse the lyric goes with
   */
  verse: number,
  /**
   * lyrics are used for chord changes or annotations, parser is different for each
   */
  parser: number,
  /**
   * indicates we should format for the width of the lyric
   */
  adjustNoteWidthLyric: boolean,
  /**
   * indicates we should format for the width of the chord
   */
  adjustNoteWidthChord: boolean,
  /**
   * fill color for text
   */
  fill: string,
  /**
   * translate to align lyrics.  Possibly this should not be serialized
   */
  translateX: number,
  /**
   * translate to align lyrics.  Possibly this should not be serialized
   */
  translateY: number,
  /**
   * the actual text
   */
  text: string | null
}

/**
 * SmoLyric covers both chords and lyrics.  The parser tells you which
 * one you get.
 * @category SmoObject
 */
export class SmoLyric extends SmoNoteModifierBase {
  static readonly parsers: Record<string, number> = {
    lyric: 0, anaylysis: 1, chord: 2
  }
  static get defaults(): SmoLyricParams {
    return JSON.parse(JSON.stringify({
      ctor: 'SmoLyric',
      text: '\xa0',
      endChar: '',
      verse: 0,
      fontInfo: {
        size: 12,
        family: 'times',
        style: 'normal',
        weight: 'normal'
      },
      fill: 'black',
      classes: 'score-text',
      translateX: 0,
      translateY: 0,
      adjustNoteWidthLyric: true,
      adjustNoteWidthChord: false,
      parser: SmoLyric.parsers.lyric
    }));
  }
  static get symbolPosition() {
    return {
      SUPERSCRIPT: 1,
      SUBSCRIPT: 2,
      NORMAL: 3
    };
  }
  static get persistArray(): string[] {
    const rv: string[] = [];
    // eslint-disable-next-line
    for (const key in SmoLyric.defaults) {
      rv.push(key);
    }
    return rv;
  }
  static get parameterArray(): string[] {
    const rv = SmoLyric.persistArray;
    rv.push('selector', 'text');
    return rv;
  }

  ctor: string = 'SmoLyric';
  text: string = '';
  fontInfo: FontInfo = {
    size: 12,
    family: 'Merriweather',
    style: 'normal',
    weight: 'normal'
  };
  parser: number = SmoLyric.parsers.lyric;
  selector: string | null = null; // used by UI
  adjustNoteWidthLyric: boolean = true;
  adjustNoteWidthChord: boolean = false;
  verse: number = 0;
  skipRender: boolean = false;
  fill: string = '';
  translateX: number = 0;
  translateY: number = 0;
  classes: string = '';
  // used by the renderer to calculate offsets for aligning lyrics
  adjX: number = 0;
  adjY: number = 0;
  // used by the renderer to calculate the y offset for music that goes below the staff
  musicYOffset: number = 0;
  hyphenX: number = 0;
  deleted: boolean = false;

  serialize(): SmoLyricParamsSer {
    var params: Partial<SmoLyricParamsSer> = { ctor: 'SmoLyric' };
    smoSerialize.serializedMergeNonDefault(SmoLyric.defaults,
      SmoLyric.persistArray, this, params);
    if (!isSmoLyricPersist(params)) {
      throw 'bad lyric ' + JSON.stringify('params');
    }
    return params;
  }
  // For lyrics, we default to adjust note width on lyric size.  For chords, this is almost never what
  // you want, so it is off by default.
  get adjustNoteWidth() {
    return (this.parser === SmoLyric.parsers.lyric) ? this.adjustNoteWidthLyric : this.adjustNoteWidthChord;
  }
  set adjustNoteWidth(val) {
    if (this.parser === SmoLyric.parsers.lyric) {
      this.adjustNoteWidthLyric = val;
    } else {
      this.adjustNoteWidthChord = val;
    }
  }
  static transposeChordToKey(chord: SmoLyric, offset: number, srcKey: string, destKey: string): SmoLyric {
    if (chord.parser !== SmoLyric.parsers.chord || offset === 0) {
      return new SmoLyric(chord);
    }
    const nchord = new SmoLyric(chord);
    let srcIx = 0;
    const maxLen = chord.text.length - 1;
    let destString = '';
    while (srcIx < chord.text.length) {
      let symbolBlock = false;
      const nchar = chord.text[srcIx];
      let lk = srcIx < maxLen ? chord.text[srcIx + 1] : null;
      // make sure this chord start witha VEX pitch letter (A-G upper case)
      if (IsPitchLetter(nchar.toLowerCase()) && nchar == nchar.toUpperCase()) {
        if (lk === '@') {
          symbolBlock = true;
          srcIx += 1;
          lk = srcIx < maxLen ? chord.text[srcIx + 1] : null;
        }
        const pitch: Pitch = {letter: nchar.toLowerCase() as any, accidental: 'n', octave: 4 };
        if (lk !== null && (lk === 'b' || lk === '#')) {
          pitch.accidental = lk;
          srcIx += 1;
        }
        const npitch = SmoMusic.transposePitchForKey(pitch, srcKey, destKey, offset);
        destString += npitch.letter.toUpperCase();
        if (symbolBlock) {
          destString += '@';
        }
        if (npitch.accidental !== 'n') {
          destString += npitch.accidental;
        }
      } else {
        destString += nchar;
      }
      srcIx += 1;
    }
    nchord.text = destString;
    return nchord;
  }

  // ### getClassSelector
  // returns a selector used to find this text block within a note.
  getClassSelector(): string {
    var parser = (this.parser === SmoLyric.parsers.lyric ? 'lyric' : 'chord');
    return 'g.' + parser + '-' + this.verse;
  }

  setText(text: string) {
    // For chords, trim all whitespace
    if (this.parser !== SmoLyric.parsers.lyric) {
      if (text.trim().length) {
        text.replace(/\s/g, '');
      }
    }
    this.text = text;
  }

  isHyphenated() {
    const text = this.text.trim();
    return this.parser === SmoLyric.parsers.lyric &&
      text.length &&
      text[text.length - 1] === '-';
  }

  getText() {
    const text = this.text.trim();
    if (this.isHyphenated()) {
      return smoSerialize.tryParseUnicode(text.substr(0, text.length - 1)).trim();
    }
    return smoSerialize.tryParseUnicode(text);
  }

  isDash() {
    return this.getText().length === 0 && this.isHyphenated();
  }

  static _chordGlyphFromCode(code: string) {
    return getChordSymbolGlyphFromCode(code);
  }
  static _tokenizeChordString(str: string) {
    // var str = this._text;
    const reg = /^([A-Z|a-z|0-9|]+)/g;
    let mmm = str.match(reg);
    let tokeType: string = '';
    let toke: string = '';
    const tokens: string[] = [];
    while (str.length) {
      if (!mmm) {
        tokeType = str[0];
        tokens.push(tokeType);
        str = str.slice(1, str.length);
      } else {
        toke = mmm[0].substr(0, mmm[0].length);
        str = str.slice(toke.length, str.length);
        tokens.push(toke);
        tokeType = '';
        toke = '';
      }
      mmm = str.match(reg);
    }
    return tokens;
  }



  constructor(parameters: SmoLyricParams) {
    super('SmoLyric');
    smoSerialize.serializedMerge(SmoLyric.parameterArray, SmoLyric.defaults, this);
    smoSerialize.serializedMerge(SmoLyric.parameterArray, parameters, this);
    if (typeof(this.fontInfo.size) !== 'number') {
      this.fontInfo.size = SmoLyric.defaults.fontInfo.size;
    }
    // backwards-compatibility for lyric text
    if (parameters.text) {
      this.text = parameters.text;
    }

    // calculated adjustments for alignment purposes
    this.adjY = 0;
    this.adjX = 0;
    // this.verse = parseInt(this.verse, 10);

    if (!this.attrs) {
      this.attrs = {
        id: getId().toString(),
        type: 'SmoLyric'
      };
    }
  }
}
/**
 * Used to create a {@link SmoBarline}
 * @category SmoObject
 */

export interface SmoNoteBarParams {
  barline: number
}

export interface SmoNoteBarParamsSer extends SmoNoteBarParams {
  ctor: string,
  barline: number
}

export class SmoNoteBar extends SmoNoteModifierBase {
  barline: number = SmoNoteBar.defaults.barline;
  static get defaults(): SmoNoteBarParams {
    return { barline: SmoNoteBar.barlines.noBar }
  }
  static get parameterArray() {
    return ['barline'];
  }
  static readonly barlines: Record<string, number> = {
    singleBar: 0,
    doubleBar: 1,
    endBar: 2,
    startRepeat: 3,
    endRepeat: 4,
    noBar: 5
  }
  constructor(parameters: SmoNoteBarParams) {
    super('SmoNoteBar');
    smoSerialize.serializedMerge(SmoNoteBar.parameterArray, SmoNoteBar.defaults, this);
    smoSerialize.serializedMerge(SmoLyric.parameterArray, parameters, this);
  }
  serialize(): SmoNoteBarParamsSer {
    const parameters: Partial<SmoNoteBarParamsSer> = {};
    smoSerialize.serializedMergeNonDefault(SmoNoteBar.defaults,
      SmoNoteBar.parameterArray, this, parameters);
    parameters.ctor = 'SmoNoteBar';
    return parameters as SmoNoteBarParamsSer;
  }
}
/**
 * The persisted bits of {@link SmoDynamicTextParams}
 * @category serialization
 */
export interface SmoDynamicTextSer extends SmoObjectParams {
  ctor: string,
  xOffset: number,
  fontSize: number,
  yOffsetLine: number,
  yOffsetPixels: number,
  text: string
}
/**
 * Constructor parameters for {@link SmoDynamicText}
 * @category SmoObject
 */
export interface SmoDynamicTextParams extends SmoDynamicTextSer {
  ctor: string,
  xOffset: number,
  fontSize: number,
  yOffsetLine: number,
  yOffsetPixels: number,
  text: string
}

/**
 * Dynamic text tells you how loud not to play.
 * @category SmoObject
 */
export class SmoDynamicText extends SmoNoteModifierBase {
  static get dynamics(): Record<string, string> {
    // matches VF.modifier
    return {
      PP: 'pp',
      P: 'p',
      MP: 'mp',
      MF: 'mf',
      F: 'f',
      FF: 'ff',
      SFZ: 'sfz'
    };
  }
  static get defaults(): SmoDynamicTextParams {
    return JSON.parse(JSON.stringify({
      ctor: 'SmoDynamicText',
      xOffset: 0,
      fontSize: defaultNoteScale,
      yOffsetLine: 11,
      yOffsetPixels: 0,
      text: SmoDynamicText.dynamics.MP,
    }));
  }
  static get persistArray(): string[] {
    const rv: string[] = [];
    // eslint-disable-next-line
    for (const key in SmoDynamicText.defaults) {
      rv.push(key);
    }
    return rv;
  }
  static get parameterArray(): string[] {
    const rv = SmoDynamicText.persistArray;
    rv.push('selector');
    return rv;
  }
  text: string = '';
  yOffsetLine: number = 11;
  yOffsetPixels: number = 0;
  xOffset: number = 0;
  fontSize: number = defaultNoteScale;
  serialize(): object {
    var params = {};
    smoSerialize.serializedMergeNonDefault(SmoDynamicText.defaults,
      SmoDynamicText.persistArray, this, params);
    return params;
  }
  constructor(parameters: SmoDynamicTextParams) {
    super('SmoDynamicText');
    smoSerialize.vexMerge(this, SmoDynamicText.defaults);
    smoSerialize.filteredMerge(SmoDynamicText.parameterArray, parameters, this);

    if (!this.attrs) {
      this.attrs = {
        id: getId().toString(),
        type: 'SmoDynamicText'
      };
    }
  }
}

/**
 * @category SmoObject
 */
export interface SmoTabBend {
  bendType: number,
  release: boolean,
  text: string
}
/**
 * @category SmoObject
 */
export interface SmoFretPosition {
  string: number,
  fret: number
}
/**
 * @category SmoObject
 */
export interface SmoTabNoteParams {
  positions: SmoFretPosition[]
  noteId: string,
  flagState: number,
  flagThrough: boolean,
  noteHead: number,
  isAssigned: boolean
}

/**
 * @category serialization
 */
export interface SmoTabNoteParamsSer extends SmoTabNoteParams {
  ctor: string
}

function isSmoTabNoteParamsSer(params: Partial<SmoTabNoteParamsSer>): params is SmoTabNoteParamsSer {
  if (typeof(params.ctor) !== 'string' || params.ctor !== 'SmoTabNote') {
    return false;
  }
  return true;
}
/**
 * @category SmoObject
 */
export class SmoTabNote extends SmoNoteModifierBase {
  static get defaults(): SmoTabNoteParams  {
    return JSON.parse(JSON.stringify({
      positions: [],
      noteId: '',
      isAssigned: false,
      flagState: SmoTabNote.flagStates.None,
      flagThrough: false,
      noteHead: SmoTabNote.noteHeads.number
    }));
  }
  positions: SmoFretPosition[];
  noteId: string;
  isAssigned: boolean;
  noteHead: number;
  flagState: number;
  flagThrough: boolean;
  static get flagStates() {
    return { None: 0, Up: 1, Down: -1 };
  }
  static get noteHeads() {
    return { number: 0, x: 1 };
  }
  constructor(params: SmoTabNoteParams) {
    super('SmoTabNote');
    this.positions = params.positions
    this.noteId =  params.noteId;
    this.isAssigned = params.isAssigned;
    this.noteHead = params.noteHead;
    this.flagState = params.flagState;
    this.flagThrough = params.flagThrough;
  }
  serialize(): SmoTabNoteParamsSer {
    var params = { ctor: 'SmoTabNote' };
    smoSerialize.serializedMergeNonDefault(SmoTabNote.defaults,
      ['positions', 'noteId', 'isAssigned', 'noteHead', 'flagState', 'flagThrough'], this, params);
    if (!isSmoTabNoteParamsSer(params)) {
      throw 'bad params in SmoTabNote';
    }
    return params;
  }
}
export const noteModifierDynamicCtorInit = () => {
  SmoDynamicCtor['SmoArpeggio'] = (params: SmoArpeggioParams) => new SmoArpeggio(params);
  SmoDynamicCtor['SmoMicrotone'] = (params: SmoMicrotoneParams) => new SmoMicrotone(params);
  SmoDynamicCtor['SmoOrnament'] = (params: SmoOrnamentParams) => new SmoOrnament(params);
  SmoDynamicCtor['SmoGraceNote'] = (params: GraceNoteParams) => new SmoGraceNote(params);
  SmoDynamicCtor['SmoArticulation'] = (params: SmoArticulationParameters) => new SmoArticulation(params);
  SmoDynamicCtor['SmoLyric'] = (params: SmoLyricParams) => new SmoLyric(params);
  SmoDynamicCtor['SmoNoteBar'] = (params: SmoNoteBarParams) => new SmoNoteBar(params);
  SmoDynamicCtor['SmoDynamicText'] = (params: SmoDynamicTextParams) => new SmoDynamicText(params);
  SmoDynamicCtor['SmoTabNote'] = (params: SmoTabNoteParams) => new SmoTabNote(params);
  SmoDynamicCtor['SmoClefChange'] = (params: SmoClefChangeParams) => new SmoClefChange(params);
}
