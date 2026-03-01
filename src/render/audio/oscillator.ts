// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoAudioPitch } from '../../smo/data/music';
import { SmoMicrotone } from '../../smo/data/noteModifiers';
import { SmoMeasure } from '../../smo/data/measure';
import { SmoNote } from '../../smo/data/note';
import { SmoMusic,  } from '../../smo/data/music';
import { SmoSelection } from '../../smo/xform/selections';
import { SmoScore } from '../../smo/data/score';
import { SmoInstrument } from '../../smo/data/staffModifiers';
import { loadedSoundfonts } from './samples';
import { layoutDebug } from '../sui/layoutDebug';
import {
  getSoundfontKits,
  Soundfont,
  getSoundfontNames,
  Reverb
} from 'smplr';


/**
 * Create audio reverb node.
 * @category SuiAudio
 */
export class SuiReverb {
  static get defaults() {
    return { length: 0.2, decay: 2 };
  }
  static impulse: AudioBuffer | null;

  connect(destination: AudioNode) {
    this.output.connect(destination);
  }

  disconnect() {
    this.output.disconnect();
    this.input.disconnect();
  }

  // credit: https://github.com/nick-thompson
  _buildImpulse() {
    let n = 0;
    let i = 0;
    if (SuiReverb.impulse) {
      this.input.buffer = SuiReverb.impulse;
      return;
    }

    const rate = this._context.sampleRate;
    const length = rate * this.length;
    const decay = this.decay;
    const impulse = this._context.createBuffer(2, length, rate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);

    for (i = 0; i < length; i++) {
      n = this.reverse ? length - i : i;
      impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay) * this.damp;
      impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay) * this.damp;
    }
    SuiReverb.impulse = impulse;

    this.input.buffer = impulse;
  }
  output: ConvolverNode;
  input: ConvolverNode;
  length: number;
  decay: number;
  damp: number = 1.0;
  reverse: boolean = false;
  _context: AudioContext;
  constructor(context: AudioContext) {
    this.input = this.output = context.createConvolver();
    this.length = SuiReverb.defaults.length;
    this.decay = SuiReverb.defaults.decay;
    this._context = context;
    this._buildImpulse();
  }
}

/**
 * Audio custom osc node.  Not used much.
 */
export interface WaveTable {
  real: number[],
  imaginary: number[]
}

/**
 * Parameters to create an oscillator for a single note of music
 * @category SuiAudio
 */
export interface SuiOscillatorParams {
  duration: number,
  delayTime: number,
  frequency: number,
  detune?: number,
  attackEnv: number,
  decayEnv: number,
  sustainEnv: number,
  releaseEnv: number,
  sustainLevel: number,
  releaseLevel: number,
  waveform: OscillatorType,
  gain: number,
  wavetable?: WaveTable,
  useReverb: boolean,
  instrument: string
}

export const SynthWavetable: WaveTable = {
  real: [0,
    0.3, 0.3, 0, 0, 0,
    0.1, 0, 0, 0, 0,
    0.05, 0, 0, 0, 0,
    0.01, 0, 0, 0, 0,
    0.01, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    0, 0],
  imaginary: [0,
    0, 0.05, 0, 0, 0,
    0, 0.01, 0, 0, 0,
    0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    0, 0]
};
/**
 * Simple waveform synthesizer thing that plays notes.  Oscillator works in either
 * analog synthisizer or sampler mode.
 * @category SuiAudio
 */
export abstract class SuiOscillator {
  abstract play(): void;
  static get defaults(): SuiOscillatorParams {
    const wavetable: WaveTable = {
      real: [], imaginary: []
    };
    const obj = {
      duration: 1000,
      frequency: 440,
      attackEnv: 0.05,
      decayEnv: 0.4,
      sustainEnv: 0.8,
      releaseEnv: 0.25, 
      sustainLevel: 0.5,
      releaseLevel: 0.1,
      waveform: 'custom',
      gain: 0.2,
      wavetable,
      useReverb: false,
      instrument: 'piano'
    };
    return JSON.parse(JSON.stringify(obj));
  }
  static audio: AudioContext = new AudioContext();

  duration: number;
  constructor(params: SuiOscillatorParams) {
    this.duration = params.duration;
  }
  /**
   * Generate a tone from a note selected or added
   * @param measure 
   * @param note 
   * @param score 
   * @param instrument 
   * @param gain 
   * @returns 
   */
  static fromNote(measure: SmoMeasure, note: SmoNote, score: SmoScore, instrument: SmoInstrument, gain: number): SuiOscillator[] {
    let frequency = 0;
    let duration = 0;
    // Just make all the notes same length, since we are not in tempo
    duration = 0.25;
    const ar: SuiOscillator[] = [];
    gain = isNaN(gain) ? 0.2 : gain;
    if (note.noteType === 'r') {
      gain = 0.001;
    }
    note.pitches.forEach((pitch, pitchIx) => {
      const mtone: SmoMicrotone | undefined = note.getMicrotone(pitchIx);
      // Get the midi frequency and offset from the pitch.  true frequency is ignored here
      const { midinumber, detune, frequency } = SmoMusic.midiNumberAndDetuneFromPitch(pitch, 
        -1 * measure.transposeIndex, 
        mtone);
      const def = SuiOscillator.defaults;
      def.frequency = midinumber;
      def.detune = detune;
      def.duration = duration;
      def.gain = gain;
      def.instrument = instrument.instrument;
      const osc = new SuiOscillatorSoundfont(def);
      ar.push(osc);
    });

    return ar;
  }
  static playSelectionNow(selection: SmoSelection, score: SmoScore, gain: number) {
    // In the midst of re-rendering...
    if (!selection.note) {
      return;
    }
    if (selection.note.isRest() || selection.note.isSlash() || selection.note.isHidden()) {
      return;
    }
    const soundInfo = selection.staff.getStaffInstrument(selection.selector.measure);
    setTimeout(() => {
      const ar = SuiOscillatorSoundfont.fromNote(selection.measure, selection.note!, score, soundInfo, gain);
      ar.forEach((osc) => {
        osc.play();
      });
    }, 1);
  }
}
export class SuiOscillatorSoundfont extends SuiOscillator {
  instrument: string;
  samples: Soundfont;
  midinumber: number;
  offset: number = 0;
  velocity: number;
  delayTime: number = 0;
  detune: number = 0;
  static debug: boolean = false;
  constructor(params: SuiOscillatorParams) {
    super(params);
    this.delayTime = params.delayTime ?? 0;
    this.detune = params.detune ?? 0;
    this.instrument = params.instrument;
    this.samples = loadedSoundfonts[this.instrument];
    this.midinumber = params.frequency;

    if (params.gain !== 0) {
      let midiStr = '';
      let gain = params.gain;
      // hack: should have different logic for percussion sampler
      // Since we treat pitches in non-pitched percussion as if treble clef,
      // adjust to match the MIDI pitch.
      if (this.instrument === 'percussion') {
        if (SmoInstrument.defaultDrumMidiMap[this.midinumber]) {
          // Sampler library maps midi notes an octave below Smoosic
          this.midinumber = SmoInstrument.defaultDrumMidiMap[this.midinumber] - 12;
        }
        gain = gain * 0.5;
      }
      this.velocity = Math.round(127 * gain);
    } else {
      this.velocity = 0;
      this.midinumber = 0;
    }
  }
  play() {
    const note = this.midinumber;
    if (SuiOscillator.audio.state === 'suspended') {
      SuiOscillator.audio.resume();
    }
    if (this.velocity > 0 && this.samples) {
      if (SuiOscillatorSoundfont.debug) {
        console.log(`osc: mn/dur/del/time  ${note} /${this.duration}/ ${this.delayTime} / ${SuiOscillator.audio.currentTime} `);
      }
      const currentTime = SuiOscillator.audio.currentTime;
      this.samples.start({ note, time: currentTime + (this.delayTime), duration: this.duration, 
        velocity: this.velocity, detune: this.detune});
    }
  }
}


/**
 * An audio output primitive that uses frequency-adjusted sampled sounds
 * @category SuiAudio
 */
export class SuiSampler extends SuiOscillatorSoundfont {
  constructor(params: SuiOscillatorParams) {
    super(params);
  }  
}
