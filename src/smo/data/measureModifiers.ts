// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * @module /smo/data/measureModifiers
 * **/
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoMusic } from './music';
import { SmoAttrs, MeasureNumber, SmoObjectParams, SvgBox, SmoModifierBase, getId, 
  SmoDynamicCtor, ElementLike } from './common';
import { SmoSelector } from '../xform/selections';
import { FontInfo } from '../../common/vex';

/**
 * Measure modifiers are attached to the measure itself.  Each instance has a
 * `serialize()` method and a `ctor` attribute for deserialization.
 * @category SmoObject
 */
export abstract class SmoMeasureModifierBase implements SmoModifierBase {
  attrs: SmoAttrs;
  ctor: string;
  logicalBox: SvgBox | null = null;
  constructor(ctor: string) {
    this.ctor = ctor;
    this.attrs = {
      id: getId().toString(),
      type: ctor
    };
  }
  static deserialize(jsonObj: SmoObjectParams) {
    const rv = SmoDynamicCtor[jsonObj.ctor](jsonObj);
    return rv;
  }
  abstract serialize(): any;
}

export type SmoMeasureFormatNumberAttributes = 'customStretch' | 'proportionality' | 'padLeft' | 'measureIndex';
export const SmoMeasureFormatNumberKeys: SmoMeasureFormatNumberAttributes[] =
  ['customStretch', 'proportionality', 'padLeft', 'measureIndex'];
export type SmoMeasueFormatBooleanAttributes = 'autoJustify' | 'systemBreak' | 'skipMeasureCount' | 'pageBreak' | 'padAllInSystem' | 'restBreak' | 'forceRest';
export const SmoMeasureFormatBooleanKeys: SmoMeasueFormatBooleanAttributes[] = ['autoJustify','skipMeasureCount', 'systemBreak', 'pageBreak', 'padAllInSystem', 'restBreak', 'forceRest'];
/**
 * Constructor parameter for measure formatting object
 * @category SmoObject
 */
export interface SmoMeasureFormatParams {
  /**
   * additional pixels to a measure (plus or minus)
   */
  customStretch: number | null,
  /**
   * softmax factor, controls how tightly rhythms are formatted
   */
  proportionality: number | null,
  /**
   * break justification for this column
   */
  autoJustify: boolean | null,
  /**
   * create a new system before this measure
   */
  systemBreak: boolean | null,
  /**
   * create a new system before this page
   */
  pageBreak: boolean | null,
  /**
   * force a break in multi-measure rest
   */
  restBreak: boolean | null,
  /**
   * treat this measure like a whole rest
   */
  forceRest: boolean | null,
  /**
   * if score is grouping measures per system, skip this measure in the count
   * (used for short measures, or pickups)
   */
  skipMeasureCount: boolean | null,
  /**
   * pad left, e.g. for the first stave in a system
   */
  padLeft: number | null,
  /**
   * if padding left, pad all the measures in the column
   */
  padAllInSystem: boolean | null,
  /**
   * renumber measures
   */
  measureIndex: number | null,
}
/**
 * Serialization for measure formatting customization, like system break
 * @category serialization
 */
export interface SmoMeasureFormatParamsSer extends  SmoMeasureFormatParams{
  /**
   * class name for deserialization
   */
  ctor: string
 }
 function isSmoMeasureParamsSer(params: Partial<SmoMeasureFormatParamsSer>):params is SmoMeasureFormatParamsSer {
  return typeof(params.ctor) === 'string';
 }
/**
 * ISmoMeasureFormatMgr is the DI interface to the
 * format manager.  Measure formats are often the same to multiple measures
 * so we don't serialize each one - instead we map them with this interface
 * @category SmoObject
 */
export interface ISmoMeasureFormatMgr {
  format: SmoMeasureFormatParams,
  measureNumber: MeasureNumber
}
/**
 * Measure format holds parameters about the automatic formatting of the measure itself, such as the witch and
 * how the durations are proportioned.  Note that measure formatting is also controlled by the justification
 * between voices and staves.  For instance, 2 measures in different staves will have to have the same width
 * @category SmoObject
 */
export class SmoMeasureFormat extends SmoMeasureModifierBase implements SmoMeasureFormatParams {
  static get attributes() {
    return ['customStretch', 'proportionality', 'autoJustify', 'systemBreak', 'pageBreak', 
    'padLeft', 'measureIndex', 'padAllInSystem', 'skipMeasureCount', 'restBreak', 'forceRest'];
  }
  static get formatAttributes() {
    return ['customStretch', 'skipMeasureCount', 'proportionality', 'autoJustify', 'systemBreak', 'pageBreak', 'padLeft'];
  }
  static get defaultProportionality() {
    return 0;
  }
  static get legacyProportionality() {
    return 0;
  }
  static fromLegacyMeasure(measure: any) {
    const o: any = {};
    SmoMeasureFormat.formatAttributes.forEach((attr: string | number) => {
      if (typeof (measure[attr]) !== 'undefined') {
        o[attr] = measure[attr];
      } else {
        const rhs = (SmoMeasureFormat.defaults as any)[attr];
        o[attr] = rhs;
      }
      o.measureIndex = measure.measureNumber.measureIndex;
    });
    return new SmoMeasureFormat(o);
  }
  static get defaults(): SmoMeasureFormatParams {
    return JSON.parse(JSON.stringify({
      customStretch: 0,
      proportionality: SmoMeasureFormat.defaultProportionality,
      systemBreak: false,
      pageBreak: false,
      restBreak: false,
      forceRest: false,
      padLeft: 0,
      padAllInSystem: true,
      skipMeasureCount: false,
      autoJustify: true,
      measureIndex: 0,
    }));
  }
  customStretch: number = SmoMeasureFormat.defaultProportionality;
  proportionality: number = 0;
  systemBreak: boolean = false;
  pageBreak: boolean = false;
  restBreak: boolean = false;
  skipMeasureCount: boolean = false;
  forceRest: boolean = false;
  padLeft: number = 0;
  padAllInSystem: boolean = true;
  autoJustify: boolean = true;
  measureIndex: number = 0;
  eq(o: SmoMeasureFormatParams) {
    let rv = true;
    SmoMeasureFormatBooleanKeys.forEach((attr) => {
      if (o[attr] !== this[attr]) {
        rv = false;
      }
    });
    SmoMeasureFormatNumberKeys.forEach((attr) => {
      if (o[attr] !== this[attr] && attr !== 'measureIndex') {
        rv = false;
      }
    });
    return rv;
  }
  get isDefault() {
    return this.eq(SmoMeasureFormat.defaults);
  }
  constructor(parameters: SmoMeasureFormatParams) {
    super('SmoMeasureFormat');
    const def = SmoMeasureFormat.defaults;
    SmoMeasureFormatNumberKeys.forEach((param) => {
      this[param] = parameters[param] ? parameters[param] : (def as any)[param];
    });
    SmoMeasureFormatBooleanKeys.forEach((param) => {
      this[param] = parameters[param] ? parameters[param] : (def as any)[param];
    });
  }
  formatMeasure(mm: ISmoMeasureFormatMgr) {
    mm.format = new SmoMeasureFormat(this);
    mm.format.measureIndex = mm.measureNumber.measureIndex;
  }
  serialize(): SmoMeasureFormatParamsSer {
    const params: Partial<SmoMeasureFormatParamsSer> = { ctor: 'SmoMeasureFormat' };
    smoSerialize.serializedMergeNonDefault(SmoMeasureFormat.defaults, SmoMeasureFormat.attributes, this, params);
    if (!isSmoMeasureParamsSer(params)) {
      throw('bad type SmoMeasureFormatParamsSer');
    }
    return params;
  }
}

/**
 * Used to create a {@link SmoBarline}
 * @category SmoObject
 */
export interface SmoBarlineParams {
  position: number | null,
  barline: number | null
}
/**
 * @category serialization
 */
export interface SmoBarlineParamsSer extends SmoBarlineParams {
  ctor: string,
  position: number | null,
  barline: number | null
}
/**
 * Barline is just that, there is a start and end in each measure, which defaults to 'single'.
 * @category SmoObject
 */
export class SmoBarline extends SmoMeasureModifierBase {
  static readonly positions: Record<string, number> = {
    start: 0,
    end: 1
  };

  static readonly barlines: Record<string, number> = {
    singleBar: 0,
    doubleBar: 1,
    endBar: 2,
    startRepeat: 3,
    endRepeat: 4,
    noBar: 5
  }

  static get _barlineToString() {
    return ['singleBar', 'doubleBar', 'endBar', 'startRepeat', 'endRepeat', 'noBar'];
  }
  static barlineString(inst: SmoBarline) {
    return SmoBarline._barlineToString[inst.barline];
  }

  static get defaults(): SmoBarlineParams {
    return JSON.parse(JSON.stringify({
      position: SmoBarline.positions.end,
      barline: SmoBarline.barlines.singleBar
    }));
  }

  static get attributes() {
    return ['position', 'barline'];
  }
  serialize(): SmoBarlineParamsSer {
    const params: any = {};
    smoSerialize.serializedMergeNonDefault(SmoBarline.defaults, SmoBarline.attributes, this, params);
    params.ctor = 'SmoBarline';
    return params;
  }
  constructor(parameters: SmoBarlineParams | null) {
    super('SmoBarline');
    let ops = parameters as any;
    if (typeof (parameters) === 'undefined' || parameters === null) {
      ops = {};
    }
    smoSerialize.serializedMerge(SmoBarline.attributes, SmoBarline.defaults, this);
    smoSerialize.serializedMerge(SmoBarline.attributes, ops, this);
  }
  barline: number = SmoBarline.barlines.singleBar;
  position: number = SmoBarline.positions.start;
}

/**
 * Constructor for SmoRepeatSymbol
 * @category SmoObject
 */
export interface SmoRepeatSymbolParams {
  /**
   * The symbol enumeration
   */
  symbol: number,
  /**
   * x offset for DC, sign etc.
   */
  xOffset: number,
  /**
   * y offset for DC, sign etc.
   */
  yOffset: number,
  /**
   * position, above or below
   */
  position: number
}

/**
 * @category serialization
 */
export interface SmoRepeatSymbolParamsSer extends SmoRepeatSymbolParams {
  /**
   * constructor
   */
  ctor: string
}
function isSmoRepeatSymbolParamsSer(params: Partial<SmoRepeatSymbolParamsSer>):params is SmoRepeatSymbolParamsSer {
  return typeof(params.ctor) === 'string' && params.ctor === 'SmoRepeatSymbol';
 }
/**
 * Repeat symbols like DC, Fine etc.  Note: voltas are their own thing,
 * and repeats are types of barlines.
 * @category SmoObject
 */
export class SmoRepeatSymbol extends SmoMeasureModifierBase {
  static readonly symbols: Record<string, number> = {
    None: 0,
    Coda: 1,
    Segno: 2,
    ToCoda: 10,
    DcAlCoda: 4,
    DcAlFine: 5,
    DsAlCoda: 7,
    DsAlFine: 8,
    Fine: 9
  }
  static readonly _repeatSymbolStrings: Record<number, string> = {
    0: 'None', 1: 'Coda', 2: 'Segno', 10: 'ToCoda', 4: 'DcAlCoda', 5: 'DcAlFine',
    7: 'DsAlCoda', 8: 'DsAlFine', 9: 'Fine'
  };
  static repeatSymbolString(symbol: SmoRepeatSymbol): string {
    return SmoRepeatSymbol._repeatSymbolStrings[symbol.symbol];
  }
  static readonly positions: Record<string, number> = {
    start: 0,
    end: 1
  }
  static get defaults(): SmoRepeatSymbolParams {
    return JSON.parse(JSON.stringify({
      symbol: SmoRepeatSymbol.symbols.Coda,
      xOffset: 0,
      yOffset: 30,
      position: SmoRepeatSymbol.positions.end
    }));
  }
  static get attributes() {
    return ['symbol', 'xOffset', 'yOffset', 'position'];
  }
  symbol: number = SmoRepeatSymbol.symbols.Coda;
  xOffset: number = 0;
  yOffset: number = 30;
  position: number = SmoRepeatSymbol.positions.end;

  serialize(): SmoRepeatSymbolParamsSer {
    const params: Partial<SmoRepeatSymbolParamsSer> = {};
    smoSerialize.serializedMergeNonDefault(SmoRepeatSymbol.defaults, SmoRepeatSymbol.attributes, this, params);
    params.ctor = 'SmoRepeatSymbol';
    if (!isSmoRepeatSymbolParamsSer(params)) {
      throw 'bad type SmoRepeatSymbolParamsSer';
    }
    return params;
  }
  constructor(parameters: SmoRepeatSymbolParams) {
    super('SmoRepeatSymbol');
    if (typeof(parameters.symbol) !== 'number') {
      parameters.symbol = SmoRepeatSymbol.symbols.Coda;
    }
    smoSerialize.serializedMerge(SmoRepeatSymbol.attributes, SmoRepeatSymbol.defaults, this);
    smoSerialize.serializedMerge(SmoRepeatSymbol.attributes, parameters, this);
  }
}

/**
 * Constructor parameters for {@link SmoVolta} (2nd ending)
 * @category SmoObject
 */
export interface SmoVoltaParams {
  /**
   * start bar of ending
   */
  startBar: number,
  /**
   * end bar (how long it stretches)
   */
  endBar: number,
  /**
   * xoffset for start, for collisions
   */
  xOffsetStart: number,
  /**
   * xoffset for end, for collisions
   */
  xOffsetEnd: number,
  /**
   * yOffset, for collisions
   */
  yOffset: number,
  /**
   * 2nd ending, 3rd etc.
   */
  number: number
}
/**
 * serializable bits of volta/endings
 * @category serialization
 */
export interface SmoVoltaParamsSer extends SmoVoltaParams {
  /**
   * constructor
   */
  ctor: string;
}
/**
 * Voltas (2nd endings) behave more like staff modifiers, but they are associated with the measure
 * since each measure has it's own rules for displaying part of the volta.
 * @category SmoObject
 */
export class SmoVolta extends SmoMeasureModifierBase {
  startBar: number = 1;
  endBar: number = 1;
  xOffsetStart: number = 0;
  xOffsetEnd: number = 0;
  yOffset: number = 20;
  number: number = 1;
  endingId: string | null = null;
  startSelector: SmoSelector | null = null;
  endSelector: SmoSelector | null = null;
  elements: ElementLike[] = [];
  constructor(parameters: SmoVoltaParams) {
    super('SmoVolta');
    smoSerialize.serializedMerge(SmoVolta.attributes, SmoVolta.defaults, this);
    smoSerialize.serializedMerge(SmoVolta.attributes, parameters, this);
  }
  get id() {
    return this.attrs.id;
  }
  get type() {
    return this.attrs.type;
  }
  static get attributes() {
    return ['startBar', 'endBar', 'endingId', 'startSelector', 'endSelector', 'xOffsetStart', 'xOffsetEnd', 'yOffset', 'number'];
  }
  static get editableAttributes() {
    return ['xOffsetStart', 'xOffsetEnd', 'yOffset', 'number'];
  }

  serialize(): SmoVoltaParamsSer {
    const params: any = {};
    smoSerialize.serializedMergeNonDefault(SmoVolta.defaults, SmoVolta.attributes, this, params);
    params.ctor = 'SmoVolta';
    return params;
  }
  static get defaults(): SmoVoltaParams {
    return JSON.parse(JSON.stringify({
      startBar: 1,
      endBar: 1,
      xOffsetStart: 0,
      xOffsetEnd: 0,
      yOffset: 20,
      number: 1
    }));
  }
}

/**
 * Constructor parameters for {@link SmoMeasureText}
 * @category SmoObject
 */
export interface SmoMeasureTextParams {
  position: number,
  fontInfo: FontInfo,
  text: string,
  adjustX: number,
  adjustY: number,
  justification: number
}
/**
 * Serialized fields of SmoMeasureTextParams
 * @category serialization
 */
export interface SmoMeasureTextParamsSer extends SmoMeasureTextParams {
  /**
   * constructor
   */
  ctor: string
}
/**
 * Measure text is just that.  Now that score text can be associated with musical elements, this
 * class has falled into disrepair.  It may be used for part notations in the score later.
 * @category SmoObject
 */
export class SmoMeasureText extends SmoMeasureModifierBase {
  static readonly positions: Record<string, number> = {
    above: 0, below: 1, left: 2, right: 3, none: 4
  }

  static readonly justifications: Record<string, number> = {
    left: 0, right: 1, center: 2
  }

  static readonly _positionToString: string[] = ['above', 'below', 'left', 'right']

  static get attributes() {
    return ['position', 'fontInfo', 'text', 'adjustX', 'adjustY', 'justification'];
  }

  static readonly defaults: SmoMeasureTextParams = {
    position: SmoMeasureText.positions.above,
    fontInfo: {
      size: 9,
      family: 'times',
      style: 'normal',
      weight: 'normal'
    },
    text: 'Smo',
    adjustX: 0,
    adjustY: 0,
    justification: SmoMeasureText.justifications.center
  }
  justification: number = SmoMeasureText.justifications.center;
  position: number = SmoMeasureText.positions.above;
  text: string = '';
  adjustX: number = 0;
  adjustY: number = 0;
  fontInfo: FontInfo = {
    size: 9,
    family: 'times',
    style: 'normal',
    weight: 'normal'
  };
  serialize(): SmoMeasureTextParamsSer {
    var params: Partial<SmoMeasureTextParamsSer> = {};
    smoSerialize.serializedMergeNonDefault(SmoMeasureText.defaults, SmoMeasureText.attributes, this, params);
    params.ctor = 'SmoMeasureText';
    return params as SmoMeasureTextParamsSer;  // trivial class, no 'is'
  }
  constructor(parameters: SmoMeasureTextParams | null) {
    super('SmoMeasureText');
    let pobj = parameters as any;
    if (pobj === null) {
      pobj = SmoMeasureText.defaults;
    }
    smoSerialize.serializedMerge(SmoMeasureText.attributes, SmoMeasureText.defaults, this);
    smoSerialize.serializedMerge(SmoMeasureText.attributes, pobj, this);

    // right-justify left text and left-justify right text by default
    if (!pobj.justification) {
      // eslint-disable-next-line
      this.justification = (this.position === SmoMeasureText.positions.left) ? SmoMeasureText.justifications.right :
        (this.position === SmoMeasureText.positions.right ? SmoMeasureText.justifications.left : this.justification);
    }
  }
}

/**
 * Used to construct {@link SmoRehearsalMark}
 * @internal
 * */
export interface SmoRehearsalMarkParams {
  /**
   * cardinal position
   */
  position: number,
  /**
   * Symbol. by default, letters that auto-increment
   */
  symbol: string,
  /**
   * future, define how increment works
   */
  cardinality: string,
  /**
   * disable to make your own symbols for each new one.
   */
  increment: boolean
}

/**
 * Serialized fields for rehearsal mark
 * @category serialization
 */
export interface SmoRehearsalMarkParamsSer extends SmoRehearsalMarkParams {
  /**
   * constructor
   */
  ctor: string;
}
/**
 * Rehearsal marks are some type of auto-incrementing markers on a measure index.
 * @category SmoObject
 */
export class SmoRehearsalMark extends SmoMeasureModifierBase {
  static readonly cardinalities: Record<string, string> = {
    capitals: 'capitals', lowerCase: 'lowerCase', numbers: 'numbers'
  }
  static readonly positions: Record<string, number> = {
    above: 0, below: 1, left: 2, right: 3
  }

  static get _positionToString(): string[] {
    return ['above', 'below', 'left', 'right'];
  }

  // TODO: positions don't work.
  static get defaults(): SmoRehearsalMarkParams {
    return JSON.parse(JSON.stringify({
      position: SmoRehearsalMark.positions.above,
      cardinality: SmoRehearsalMark.cardinalities.capitals,
      symbol: 'A',
      increment: true
    }));
  }
  static get attributes() {
    return ['cardinality', 'symbol', 'position', 'increment'];
  }
  position: number = SmoRehearsalMark.positions.above;
  cardinality: string = SmoRehearsalMark.cardinalities.capitals;
  symbol: string = 'A';
  increment: boolean = true;

  getIncrement() {
    if (this.cardinality !== 'number') {
      const code = this.symbol.charCodeAt(0) + 1;
      const symbol = String.fromCharCode(code);
      return symbol;
    } else {
      return (parseInt(this.symbol, 10) + 1).toString();
    }
  }
  getInitial() {
    // eslint-disable-next-line
    return this.cardinality === SmoRehearsalMark.cardinalities.capitals ? 'A' :
      (this.cardinality === SmoRehearsalMark.cardinalities.lowerCase ? 'a' : '1');
  }
  serialize(): SmoRehearsalMarkParamsSer {
    var params: Partial<SmoRehearsalMarkParamsSer> = {};
    smoSerialize.serializedMergeNonDefault(SmoRehearsalMark.defaults, SmoRehearsalMark.attributes, this, params);
    params.ctor = 'SmoRehearsalMark';
    return params as SmoRehearsalMarkParamsSer;
  }
  constructor(parameters: SmoRehearsalMarkParams) {
    super('SmoRehearsalMark');
    let pobj = parameters;
    if (typeof (pobj) === 'undefined' || pobj === null) {
      pobj = SmoRehearsalMark.defaults;
    }
    smoSerialize.serializedMerge(SmoRehearsalMark.attributes, SmoRehearsalMark.defaults, this);
    smoSerialize.serializedMerge(SmoRehearsalMark.attributes, pobj, this);
    if (!pobj.symbol) {
      this.symbol = this.getInitial();
    }
  }
}

export type SmoTempoNumberAttribute = 'bpm' | 'beatDuration' | 'yOffset';
export type SmoTempoStringAttribute = 'tempoMode' | 'tempoText' | 'customText';
export type SmoTempoBooleanAttribute = 'display';

export type SmoTempoMode = 'duration' | 'text' | 'custom';
/**
 * constructor parameters for {@link SmoTempoText}
 * @category SmoObject
 */
export interface SmoTempoTextParams {
  /**
   * text (e.g. Allegro) or bpm
   */
  tempoMode: string,
  /**
   * playback bpm
   */
  bpm: number,
  /**
   * note type for a metronome beat
   */
  beatDuration: number,
  /**
   * if text mode, the text
   */
  tempoText: string,
  /**
   * move the text to keep it from colliding with other things
   */
  yOffset: number,
  /**
   * indicate if we are displaying, false if only affects playback
   */
  display: boolean,
  /**
   * text taht is not a standards notation
   */
  customText: string
}
/**
 * serialized tempo parameters
 * @category serialization
 */
export interface SmoTempoTextParamsSer extends SmoTempoTextParams {
  ctor: string;
}
/**
 * @internal
 */
export interface VexTempoTextParams {
  duration?: string, dots?: number, bpm?: number, name?: string 
}

/**
 * Information about both playback tempo and how the tempo is notated.
 * @category SmoObject
 */
export class SmoTempoText extends SmoMeasureModifierBase implements SmoTempoTextParams {
  static get tempoModes(): Record<string, SmoTempoMode> {
    return {
      durationMode: 'duration',
      textMode: 'text',
      customMode: 'custom'
    };
  }
  static get tempoTexts(): Record<string, string> {
    return {
      larghissimo: 'Larghissimo',
      grave: 'Grave',
      lento: 'Lento',
      largo: 'Largo',
      larghetto: 'Larghetto',
      adagio: 'Adagio',
      adagietto: 'Adagietto',
      andante_moderato: 'Andante moderato',
      andante: 'Andante',
      andantino: 'Andantino',
      moderator: 'Moderato',
      allegretto: 'Allegretto',
      allegro: 'Allegro',
      vivace: 'Vivace',
      presto: 'Presto',
      prestissimo: 'Prestissimo'
    };
  }

  /**
   * create defaults for tempo initialization
   */
  static get defaults(): SmoTempoTextParams {
    return JSON.parse(JSON.stringify({
      tempoMode: SmoTempoText.tempoModes.durationMode,
      bpm: 120,
      beatDuration: 4096,
      tempoText: SmoTempoText.tempoTexts.allegro,
      yOffset: 0,
      display: false,
      customText: ''
    }));
  }
  static get attributes() {
    return ['tempoMode', 'bpm', 'display', 'beatDuration', 'tempoText', 'yOffset', 'customText'];
  }
  tempoMode: SmoTempoMode = SmoTempoText.tempoModes.durationMode
  bpm: number = 120;
  beatDuration: number = 4096;
  tempoText: string = 'Allegro';
  yOffset: number = 0;
  display: boolean = false;
  customText: string = '';

  _toVexTextTempo(): VexTempoTextParams {
    return { name: this.tempoText };
  }

  /**
   * Return equality wrt the tempo marking, e.g. 2 allegro in textMode will be equal but
   * an allegro and duration 120bpm will not.
   * @param t1 
   * @param t2 
   * @returns 
   */
  static eq(t1: SmoTempoText, t2: SmoTempoText) {
    if (t1.tempoMode !== t2.tempoMode) {
      return false;
    }
    if (t1.tempoMode === SmoTempoText.tempoModes.durationMode) {
      return t1.bpm === t2.bpm && t1.beatDuration === t2.beatDuration;
    }
    if (t1.tempoMode === SmoTempoText.tempoModes.textMode) {
      return t1.tempoText === t2.tempoText;
    } else {
      return t1.bpm === t2.bpm && t1.beatDuration === t2.beatDuration &&
        t1.tempoText === t2.tempoText;
    }
  }

  static get bpmFromText(): Record<string, number> {
    const rv: any = {};
    rv[SmoTempoText.tempoTexts.larghissimo] = 24;
    rv[SmoTempoText.tempoTexts.grave] = 40;
    rv[SmoTempoText.tempoTexts.lento] = 45;
    rv[SmoTempoText.tempoTexts.largo] = 40;
    rv[SmoTempoText.tempoTexts.larghetto] = 60;
    rv[SmoTempoText.tempoTexts.adagio] = 72;
    rv[SmoTempoText.tempoTexts.adagietto] = 72;
    rv[SmoTempoText.tempoTexts.andante_moderato] = 72;
    rv[SmoTempoText.tempoTexts.andante] = 84;
    rv[SmoTempoText.tempoTexts.andantino] = 92;
    rv[SmoTempoText.tempoTexts.moderator] = 96;
    rv[SmoTempoText.tempoTexts.allegretto] = 96;
    rv[SmoTempoText.tempoTexts.allegro] = 120;
    rv[SmoTempoText.tempoTexts.vivace] = 144;
    rv[SmoTempoText.tempoTexts.presto] = 168;
    rv[SmoTempoText.tempoTexts.prestissimo] = 240;

    return rv as Record<string, number>;
  }

  _toVexDurationTempo(): VexTempoTextParams {
    var vd = SmoMusic.ticksToDuration[this.beatDuration];
    var dots = (vd.match(/d/g) || []).length;
    vd = vd.replace(/d/g, '');
    const rv: any = { duration: vd, dots, bpm: this.bpm };
    if (this.customText.length) {
      rv.name = this.customText;
    }
    return rv;
  }
  toVexTempo(): VexTempoTextParams {
    if (this.tempoMode === SmoTempoText.tempoModes.durationMode ||
      this.tempoMode === SmoTempoText.tempoModes.customMode) {
      return this._toVexDurationTempo();
    }
    return this._toVexTextTempo();
  }
  serialize(): SmoTempoTextParamsSer {
    var params: Partial<SmoTempoTextParamsSer> = {};
    smoSerialize.serializedMergeNonDefault(SmoTempoText.defaults, SmoTempoText.attributes, this, params);
    params.ctor = 'SmoTempoText';
    return params as SmoTempoTextParamsSer;
  }
  constructor(parameters: SmoTempoTextParams | null) {
    super('SmoTempoText');
    let pobj: any = parameters;
    if (typeof (pobj) === 'undefined' || pobj === null) {
      pobj = {};
    }
    smoSerialize.serializedMerge(SmoTempoText.attributes, SmoTempoText.defaults, this);
    smoSerialize.serializedMerge(SmoTempoText.attributes, pobj, this);
  }
}

/**
 * Constructor parameters for a time signature
 * @category SmoObject
 */
export interface TimeSignatureParameters  {
  /**
   * numerator
   */
  actualBeats: number,
  /**
   * denominator, always power of 2
   */
  beatDuration: number,
  /**
   * indicates cut time/common time
   */
  useSymbol: boolean,
  /**
   * display, else just affects measure lengths.
   */
  display: boolean,
  /**
   * for pickups, display the non-pickup value
   */
  displayString: string
}

/**
 * serialized time signature
 * @category serialization
 */
export interface TimeSignatureParametersSer extends TimeSignatureParameters {
  /**
   * constructor
   */
  ctor: string;
}
/**
 * Time signatures contain duration information for a measure, and information
 * about the display of the time signature.
 * @category SmoObject
 */
export class TimeSignature extends SmoMeasureModifierBase {
  static get defaults(): TimeSignatureParameters {
    return {
      actualBeats: 4,
      beatDuration: 4,
      useSymbol: false,
      display: true,
      displayString: ''
    };
  }
  static equal(ts1: TimeSignature, ts2: TimeSignature): boolean {
    return (ts1.actualBeats === ts2.actualBeats && ts1.beatDuration === ts2.beatDuration);
  }
  static createFromPartial(value: Partial<TimeSignatureParameters>) {
    const params = TimeSignature.defaults;
    smoSerialize.serializedMerge(TimeSignature.parameters, value, params);
    return new TimeSignature(params);
  }
  // timeSignature: string = '4/4';
  actualBeats: number = 4;
  beatDuration: number = 4;
  useSymbol: boolean = false;
  display: boolean = true;
  displayString: string = '';
  get timeSignature() {
    return this.actualBeats.toString() + '/' + this.beatDuration.toString();
  }
  static get parameters() {
    return ['actualBeats', 'beatDuration', 'useSymbol', 'display', 'displayString'];
  }
  static get boolParameters() {
    return [];
  }
  set timeSignature(value: string) {
    const ar = value.split('/');
    this.actualBeats = parseInt(ar[0], 10);
    this.beatDuration = parseInt(ar[1], 10);
  }
  serialize(): TimeSignatureParametersSer {
    const rv: Partial<TimeSignatureParametersSer> = {};
    smoSerialize.serializedMergeNonDefault(TimeSignature.defaults, TimeSignature.parameters, this, rv);
    rv.ctor = 'TimeSignature';
    return rv as TimeSignatureParametersSer;
  }
  constructor(params: TimeSignatureParameters) {
    super('TimeSignature');
    this.actualBeats = params.actualBeats;
    this.beatDuration = params.beatDuration;
    this.useSymbol = params.useSymbol;
    this.display = params.display;
    this.displayString = params.displayString;
  }
}
export const measureModifierDynamicCtorInit = () => {
  SmoDynamicCtor['SmoMeasureFormat'] = (params: SmoMeasureFormatParams) => new SmoMeasureFormat(params);
  SmoDynamicCtor['SmoBarline'] = (params: SmoBarlineParams) => new SmoBarline(params);
  SmoDynamicCtor['SmoRepeatSymbol'] = (params: SmoRepeatSymbolParams) => new SmoRepeatSymbol(params);
  SmoDynamicCtor['SmoVolta'] = (params: SmoVoltaParams) => new SmoVolta(params);
  SmoDynamicCtor['SmoMeasureText'] = (params: SmoMeasureTextParams) => new SmoMeasureText(params);
  SmoDynamicCtor['SmoRehearsalMark'] = (params: SmoRehearsalMarkParams) => new SmoRehearsalMark(params);
  SmoDynamicCtor['SmoTempoText'] = (params: SmoTempoTextParams) => new SmoTempoText(params);
  SmoDynamicCtor['TimeSignature'] = (params: TimeSignatureParameters) => new TimeSignature(params);
}
