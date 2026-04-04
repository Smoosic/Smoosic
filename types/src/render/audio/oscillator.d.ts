import { SmoMeasure } from '../../smo/data/measure';
import { SmoNote } from '../../smo/data/note';
import { SmoSelection } from '../../smo/xform/selections';
import { SmoScore } from '../../smo/data/score';
import { SmoInstrument } from '../../smo/data/staffModifiers';
import { Soundfont } from 'smplr';
/**
 * Create audio reverb node.
 * @category SuiAudio
 */
export declare class SuiReverb {
    static get defaults(): {
        length: number;
        decay: number;
    };
    static impulse: AudioBuffer | null;
    connect(destination: AudioNode): void;
    disconnect(): void;
    _buildImpulse(): void;
    output: ConvolverNode;
    input: ConvolverNode;
    length: number;
    decay: number;
    damp: number;
    reverse: boolean;
    _context: AudioContext;
    constructor(context: AudioContext);
}
/**
 * Audio custom osc node.  Not used much.
 */
export interface WaveTable {
    real: number[];
    imaginary: number[];
}
/**
 * Parameters to create an oscillator for a single note of music
 * @category SuiAudio
 */
export interface SuiOscillatorParams {
    duration: number;
    delayTime: number;
    frequency: number;
    detune?: number;
    attackEnv: number;
    decayEnv: number;
    sustainEnv: number;
    releaseEnv: number;
    sustainLevel: number;
    releaseLevel: number;
    waveform: OscillatorType;
    gain: number;
    wavetable?: WaveTable;
    useReverb: boolean;
    instrument: string;
}
export declare const SynthWavetable: WaveTable;
/**
 * Simple waveform synthesizer thing that plays notes.  Oscillator works in either
 * analog synthisizer or sampler mode.
 * @category SuiAudio
 */
export declare abstract class SuiOscillator {
    abstract play(): void;
    static get defaults(): SuiOscillatorParams;
    static audio: AudioContext;
    duration: number;
    constructor(params: SuiOscillatorParams);
    /**
     * Generate a tone from a note selected or added
     * @param measure
     * @param note
     * @param score
     * @param instrument
     * @param gain
     * @returns
     */
    static fromNote(measure: SmoMeasure, note: SmoNote, score: SmoScore, instrument: SmoInstrument, gain: number): SuiOscillator[];
    static playSelectionNow(selection: SmoSelection, score: SmoScore, gain: number): void;
}
export declare class SuiOscillatorSoundfont extends SuiOscillator {
    instrument: string;
    samples: Soundfont;
    midinumber: number;
    offset: number;
    velocity: number;
    delayTime: number;
    detune: number;
    static debug: boolean;
    constructor(params: SuiOscillatorParams);
    play(): void;
}
/**
 * An audio output primitive that uses frequency-adjusted sampled sounds
 * @category SuiAudio
 */
export declare class SuiSampler extends SuiOscillatorSoundfont {
    constructor(params: SuiOscillatorParams);
}
