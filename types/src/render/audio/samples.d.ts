import { SmoOscillatorInfo } from '../../smo/data/staffModifiers';
import { Soundfont } from 'smplr';
export declare const instrumentSampleMap: Record<string, string>;
export declare const loadedSoundfonts: Record<string, Soundfont>;
/**
 * A set of parameters from the instrument interface used to create audio from samples.
 * @category SuiAudio
 */
export interface SampleChooserParams {
    family?: string;
    instrument: string;
    frequency: number;
    duration: number;
    gain: number;
    articulation?: string;
}
/**
 * A function prototype that chooses from among samples to return the correct one for that note
 */
export type SampleChooser = (params: SampleChooserParams, samples: SmoOscillatorInfo[]) => AudioSample | null;
/**
 * A specific audio sample that can be converted into an audio node
 * @category SuiAudio
 */
export interface AudioSample {
    sample: AudioBuffer;
    frequency: number;
    patch: string;
    gain: number;
}
/**
 * Interface for a chooser function and a set of samples
 * @category SuiAudio
 */
export interface InstrumentSampleChooser {
    instrument: string;
    sampleChooser: SampleChooser;
    samples: SmoOscillatorInfo[];
}
/**
 * Logic to create audio nodes out of HTML5 media elements
 * @category SuiAudio
 */
export declare class SuiSampleMedia {
    static sampleFiles: SmoOscillatorInfo[];
    static sampleBufferMap: Record<string, AudioBuffer>;
    static sampleOscMap: Record<string, SmoOscillatorInfo[]>;
    static instrumentChooser: Record<string, InstrumentSampleChooser>;
    static receivedBuffer: boolean;
    static getFamilyForInstrument(instKey: string): string;
    /**
    * Load samples so we can play the music
    * @returns - promise, resolved when loaded
    */
    static samplePromise(audio: AudioContext, setProgress: (percent: number) => void): Promise<any>;
}
