import { SuiOscillator } from './oscillator';
import { SuiScoreView } from '../sui/scoreView';
import { SmoScore } from '../../smo/data/score';
import { SmoSelector } from '../../smo/xform/selections';
import { SuiAudioAnimationParams } from './musicCursor';
import { layoutDebug } from '../sui/layoutDebug';
/**
 * Create audio player for the score from the start point
 * @category SuiAudio
 */
export interface SuiAudioPlayerParams {
    startIndex: number;
    view: SuiScoreView;
    score: SmoScore;
    audioAnimation: SuiAudioAnimationParams;
}
export interface midiFrequency {
    midinumber: number;
    detune: number;
}
export interface OscAudioData {
    pitches: midiFrequency[];
    duration: number;
    durationPct: number;
    delay: number;
}
/**
 * Parameters used to create just-in-time oscillators
 * @category SuiAudio
 */
export interface SoundParams {
    frequencies: OscAudioData[];
    overallDuration: number;
    volume: number;
    noteType: string;
    instrument: string;
    selector: SmoSelector;
}
/**
 * A list of sound parameters for just-in-time oscillator creation
 * @category SuiAudio
 */
export interface SoundParamMeasureLink {
    soundParams: Record<number, SoundParams[]>;
    endTicks: number;
    measureIndex: number;
    next: SoundParamMeasureLink | null;
}
/**
 * A set of oscillators to be played at a certain time.
 * @category SuiAudio
 */
export interface CuedAudioContext {
    oscs: SuiOscillator[];
    playMeasureIndex: number;
    playTickIndex: number;
    waitTime: number;
    offsetPct: number;
    durationPct: number;
    selector: SmoSelector;
}
/**
 * A list of oscillators.  We keep them in a list until played so we
 * can GC them if playing is cancelled
 * @category SuiAudio
 */
export interface CuedAudioLink {
    sound: CuedAudioContext;
    next: CuedAudioLink | null;
}
/**
 * Maintain a list of buffers ready to play, since this is a
 * system resource.
 * @category SuiAudio
 */
export declare class CuedAudioContexts {
    soundHead: CuedAudioLink | null;
    soundTail: CuedAudioLink | null;
    paramLinkHead: SoundParamMeasureLink | null;
    paramLinkTail: SoundParamMeasureLink | null;
    soundListLength: number;
    playWaitTimer: number;
    complete: boolean;
    addToTail(cuedSound: CuedAudioContext): void;
    advanceHead(): CuedAudioContext | null;
    get soundCount(): number;
    reset(): void;
}
/**
 * Play the music, ja!
 * @category SuiAudio
 */
export declare class SuiAudioPlayer {
    static _playing: boolean;
    static instanceId: number;
    static duplicatePitchThresh: number;
    static voiceThresh: number;
    static _playingInstance: SuiAudioPlayer | null;
    static set playing(val: boolean);
    static get audioBufferSize(): number;
    static incrementInstanceId(): number;
    static get playing(): boolean;
    static pausePlayer(): void;
    instanceId: number;
    paused: boolean;
    view: SuiScoreView;
    score: SmoScore;
    cuedSounds: CuedAudioContexts;
    audioDefaults: import("./oscillator").SuiOscillatorParams;
    volumeMap: Record<string, number>;
    audioAnimation: SuiAudioAnimationParams;
    debug: layoutDebug;
    constructor(parameters: SuiAudioPlayerParams);
    /**
     * Popuate the SoundData structures used to create the oscillators
     *  from the notes in this measure.
     * @param measureIndex
     * @returns
     */
    private getNoteSoundData;
    /**
     * Create the audio resources to be played.
     * @param measureIndex
     * @returns
     */
    createCuedSound(measureIndex: number): void;
    private delaySilence;
    /**
     * Get the next sound from the oscillator cue and play it.  Stop if either the
     * player was stopped, or if we run out of sounds.
     */
    playSounds(): Promise<void>;
    waitForDoneOrFull(): Promise<void>;
    /**
     * Create all the audio samples and start the player until done.
     * @param measureIndex
     */
    startPlayer(measureIndex: number): Promise<void>;
    static stopPlayer(): void;
    static get playingInstance(): SuiAudioPlayer | null;
    static _playChord(oscAr: SuiOscillator[]): void;
    play(): Promise<void>;
}
