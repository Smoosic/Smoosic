// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiOscillator, SuiSampler, SuiOscillatorSoundfont } from './oscillator';
import { SuiScoreView } from '../sui/scoreView';
import { SmoScore } from '../../smo/data/score';
import { SmoSelector, SmoSelection } from '../../smo/xform/selections';
import { SmoAudioPitch, SmoMusic } from '../../smo/data/music';
import { SuiAudioAnimationParams } from './musicCursor';
import { ScoreRoadMapBuilder } from '../../smo/xform/roadmap';
import { PopulateAudioData } from '../../smo/xform/updateAudio';
import { layoutDebug } from '../sui/layoutDebug';

/**
 * Create audio player for the score from the start point
 * @category SuiAudio
 */
export interface SuiAudioPlayerParams {
  startIndex: number,
  view: SuiScoreView,
  score: SmoScore,
  audioAnimation: SuiAudioAnimationParams
}
export interface midiFrequency {
  midinumber: number,
  detune: number
}
export interface OscAudioData {
  pitches: midiFrequency[],
  duration: number,
  durationPct: number,
  delay: number
}
/**
 * Parameters used to create just-in-time oscillators
 * @category SuiAudio
 */
export interface SoundParams {
  frequencies: OscAudioData[],
  overallDuration: number,
  volume: number,
  noteType: string,
  instrument: string,
  selector: SmoSelector
}
/**
 * A list of sound parameters for just-in-time oscillator creation
 * @category SuiAudio
 */
 export interface SoundParamMeasureLink {
  soundParams: Record<number, SoundParams[]>,
  endTicks: number,
  measureIndex: number,
  next: SoundParamMeasureLink | null
}
/**
 * A set of oscillators to be played at a certain time.
 * @category SuiAudio
 */
export interface CuedAudioContext {
  oscs: SuiOscillator[],
  playMeasureIndex: number,
  playTickIndex: number,
  waitTime: number,
  offsetPct: number,
  durationPct: number,
  selector: SmoSelector
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
export class CuedAudioContexts {
  soundHead: CuedAudioLink | null = null;
  soundTail: CuedAudioLink | null = null;
  paramLinkHead: SoundParamMeasureLink | null = null;
  paramLinkTail: SoundParamMeasureLink | null = null;
  soundListLength = 0;
  playWaitTimer = 0;  
  complete: boolean = false;
  addToTail(cuedSound: CuedAudioContext) {
    const tail = { sound: cuedSound, next: null };
    if (this.soundTail === null) {
      this.soundTail = tail;
      this.soundHead = tail;
    } else {
      this.soundTail.next = { sound: cuedSound, next: null };
      this.soundTail = this.soundTail.next;
    }
    this.soundListLength += cuedSound.oscs.length;
  }
  advanceHead(): CuedAudioContext | null {
    if (this.soundHead === null) {
      return null;
    }
    const cuedSound = this.soundHead.sound;
    this.soundHead = this.soundHead.next;
    this.soundListLength -= cuedSound.oscs.length;
    return cuedSound;
  }
  get soundCount() {
    return this.soundListLength;
  }
  reset() {
    this.soundHead = null;
    this.soundTail = null;
    this.paramLinkHead = null;
    this.paramLinkTail = null;
    this.soundListLength = 0;
    this.playWaitTimer = 0;
    this.complete = false;
  }
}
/**
 * Play the music, ja!
 * @category SuiAudio
 */
export class SuiAudioPlayer {
  static _playing: boolean = false;
  static instanceId: number = 0;
  static duplicatePitchThresh = 8;
  static voiceThresh = 32;
  static _playingInstance: SuiAudioPlayer | null = null;
  static set playing(val) {
    SuiAudioPlayer._playing = val;
  }
  static get audioBufferSize() {
    return 512;
  }
  static incrementInstanceId() {
    const id = SuiAudioPlayer.instanceId + 1;
    SuiAudioPlayer.instanceId = id;
    return id;
  }
  static get playing() {
    if (typeof (SuiAudioPlayer._playing) === 'undefined') {
      SuiAudioPlayer._playing = false;
    }
    return SuiAudioPlayer._playing;
  }

  static pausePlayer() {
    if (SuiAudioPlayer._playingInstance) {
      const a = SuiAudioPlayer._playingInstance;
      a.paused = true;
      a.audioAnimation.clearAudioAnimationHandler(0);
    }
    SuiAudioPlayer.playing = false;
  }

  instanceId: number;
  paused: boolean;
  view: SuiScoreView;
  score: SmoScore;
  cuedSounds: CuedAudioContexts;
  audioDefaults = SuiOscillator.defaults;
  // a running record of the volumes we have used from the volume array, if a note is played multiple times.
  volumeMap: Record<string, number> = {};
  audioAnimation: SuiAudioAnimationParams;
  debug: layoutDebug
  constructor(parameters: SuiAudioPlayerParams) {
    this.instanceId = SuiAudioPlayer.incrementInstanceId();
    this.paused = false;
    this.debug = parameters.view.debug;
    this.view = parameters.view;
    this.score = parameters.score;
    // Assume tempo is same for all measures
    this.cuedSounds = new CuedAudioContexts();
    this.audioAnimation = parameters.audioAnimation;
  }

  /**
   * Popuate the SoundData structures used to create the oscillators
   *  from the notes in this measure.
   * @param measureIndex 
   * @returns 
   */
  private getNoteSoundData(measureIndex: number) {
    const measureNotes: Record<number, SoundParams[]> = {};
    let measureTicks = this.score.staves[0].measures[measureIndex].getMaxTicksVoice();
    const freqDuplicates: Record<number, Record<number, number>> = {};
    const voiceCount: Record<number, number> = {};
    const smoTemp = this.score.staves[0].measures[measureIndex].getTempo();
    const sPerTick = 60.0 / (smoTemp.bpm * 4096); // milliseconds per SMO tick

    this.score.staves.forEach((staff, staffIx) => {
      const measure = staff.measures[measureIndex];
      measure.voices.forEach((voice, voiceIx) => {
        let curTick = 0;
        const instrument = staff.getStaffInstrument(measure.measureNumber.measureIndex);
        const xpose = -1 * measure.transposeIndex;
        voice.notes.forEach((smoNote, tickIx) => {
          let delay = 0;
          const noteId = smoNote.attrs.id;
          const selector: SmoSelector = SmoSelector.default;
          selector.measure = measureIndex;
          selector.staff = staffIx;
          selector.voice = voiceIx;
          selector.tick = tickIx;
          const soundData: SoundParams = {
            frequencies: [],
            overallDuration: smoNote.tickCount,
            volume: 0,
            noteType: smoNote.noteType,
            instrument: instrument.instrument,
            selector 
          }

          for (let x = 0; x < smoNote.audioData.playedNotes.length; ++x) {
            const playedNote = smoNote.audioData.playedNotes[x];
            const noteDuration = (playedNote.duration * sPerTick);
            smoNote.getMicrotones();
            const volume = smoNote.audioData.volume.length > x ? smoNote.audioData.volume[x] : 0;
            soundData.volume = Math.max(soundData.volume, volume);
            const oscData: OscAudioData = {
              pitches: [],
              duration: noteDuration,
              durationPct: playedNote.durationPct,
              delay
            };
            playedNote.pitches.forEach((pitch, pitchIx:number) => {
              const { midinumber, detune, frequency } = SmoMusic.midiNumberAndDetuneFromPitch(pitch, xpose, smoNote.getMicrotone(pitchIx));
              const midiFreq: midiFrequency = { midinumber, detune };
              const freqRound = Math.round(frequency);
              if (!freqDuplicates[curTick]) {
                freqDuplicates[curTick] = {};
                voiceCount[curTick] = 0;
              }
              const freqBeat = freqDuplicates[curTick];
              if (!freqBeat[freqRound]) {
                freqBeat[freqRound] = 0;
              }
              if (freqBeat[freqRound] < SuiAudioPlayer.duplicatePitchThresh && voiceCount[curTick] < SuiAudioPlayer.voiceThresh) {
                oscData.pitches.push(midiFreq);
                freqBeat[freqRound] += 1;
                voiceCount[curTick] += 1;
              }
            });
            soundData.frequencies.push(oscData);
            delay += noteDuration;
          }
          
          const pushTickArray = (curTick: number, soundData: SoundParams) => {
            if (typeof(measureNotes[curTick]) === 'undefined') {
              measureNotes[curTick] = [];
            }
            measureNotes[curTick].push(soundData);
          }
          pushTickArray(curTick, soundData);
          curTick += Math.round(smoNote.tickCount);
        });
      });
    });
    const keys = Object.keys(measureNotes).map((x) => parseInt(x, 10));
    if (keys.length) {
      measureTicks -= keys.reduce((a, b) => a > b ? a : b);
    }
    if (this.debug.mask & layoutDebug.values.oscillators) {
      console.log(`player:  ${measureIndex} ${JSON.stringify(measureNotes, null, ' ')}`);
    }
    return { endTicks: measureTicks, measureNotes };
  }
  /**
   * Create the audio resources to be played.
   * @param measureIndex 
   * @returns 
   */
  createCuedSound(measureIndex: number) {
    let i = 0;
    let j = 0;
    let measureBeat = 0;
    if (!SuiAudioPlayer.playing || this.cuedSounds.paramLinkHead === null) {
      return;
    }
    const { endTicks, measureNotes } = 
      { endTicks: this.cuedSounds.paramLinkHead.endTicks, measureNotes: this.cuedSounds.paramLinkHead.soundParams };
    this.cuedSounds.paramLinkHead = this.cuedSounds.paramLinkHead.next;
    const smoTemp = this.score.staves[0].measures[measureIndex].getTempo();
    const msPerTick = 60000 / (smoTemp.bpm * 4096 * (smoTemp.beatDuration / 4096)); // milliseconds per SMO tick
    const keys: number[] = [];
    Object.keys(measureNotes).forEach((key) => {
      keys.push(parseInt(key, 10));
    });    
    // There is a key for each note in the measure.  The value is the number of ticks before that note is played
    for (let j = 0; j < keys.length; ++j) {
        const beatTime = keys[j];
        const soundData = measureNotes[beatTime];
        let durationPct = 0;
        let offsetPct = 0;
        if (soundData.length === 0) {
          console.log('empty sound measure');
          continue;
        }

        const cuedSound: CuedAudioContext = { oscs: [], waitTime: 0, playMeasureIndex: measureIndex, playTickIndex: j,
           offsetPct, durationPct, selector: soundData[0].selector };
        // If there is complete silence here, put a silent beat
        this.cuedSounds.addToTail(cuedSound);
        // each note at this point in the music.
        soundData.forEach((sound) => {
          const adjDuration = Math.round(sound.overallDuration * msPerTick);
          let gain = adjDuration === 0 ? 0 : sound.volume;
          gain = Math.min(1.0, gain);
          // for each sound that plays as part of this note.  Usually one per pitch, but could be more for trills etc.
          for (i = 0; i < sound.frequencies.length && sound.noteType === 'n'; ++i) {
            const freq = sound.frequencies[i];
            const params = this.audioDefaults;
            params.duration = freq.duration;
            params.sustainEnv = freq.durationPct;
            params.instrument = sound.instrument;
            params.gain = gain;
            params.useReverb = this.score.audioSettings.reverbEnable;
            params.delayTime = freq.delay
            // oscillator in html 5 is a single pitch, create one per pitch in the chord
            for (var k = 0; k < freq.pitches.length; ++k) {
              const midiFreq = freq.pitches[k];
              params.frequency = midiFreq.midinumber
              params.detune = midiFreq.detune;
              cuedSound.oscs.push(new SuiSampler(params));
            }
          }
        });
        if (j + 1 < keys.length) {
          const diff = (keys[j + 1] - keys[j]);
          cuedSound.waitTime = diff * msPerTick;
          measureBeat += diff;
        } else {
          // If the next measure, calculate the frequencies for the next track.
          cuedSound.waitTime = endTicks * msPerTick;
        }
    }
  }
  private async delaySilence(delay: number) {
    let tick = 0;
    const inc = 10;
    let timeDelay = inc;
    const promise = new Promise<void>((resolve) => {
      const waiter = () => {
        if (!SuiAudioPlayer.playing) {
          resolve();
        }        
        setTimeout(() => {
          tick += inc;
          timeDelay = Math.max(0, Math.min(inc, delay - tick));
          if (tick < delay) {
            waiter();
          } else {
            resolve();
          }
        }, timeDelay);
      }
      waiter();
    });
    return promise;
  }
  /**
   * Get the next sound from the oscillator cue and play it.  Stop if either the 
   * player was stopped, or if we run out of sounds.
   */
  async playSounds() {
    this.cuedSounds.playWaitTimer = 0;
    let previousDuration = 0;
    let cuedSound = this.cuedSounds.advanceHead();
    let currentTick = 0;
    while (cuedSound) {
      if (cuedSound === null) {
        SuiAudioPlayer._playing = false;
        this.audioAnimation.clearAudioAnimationHandler(previousDuration);
        return;
      }
      if (SuiAudioPlayer._playing === false) {
        this.audioAnimation.clearAudioAnimationHandler(previousDuration);
        return;
      }
      currentTick += cuedSound.waitTime;
      if (cuedSound.oscs.length === 0) {
        this.cuedSounds.playWaitTimer = cuedSound.waitTime;
        // console.warn('empty oscs in playback');
      } else {
        previousDuration = cuedSound.oscs[0].duration;
      }
      if (cuedSound.oscs.length > 0) {
        SuiAudioPlayer._playChord(cuedSound.oscs);
      }
      this.audioAnimation.audioAnimationHandler(this.view, cuedSound.selector,
        cuedSound.offsetPct, cuedSound.durationPct);
      await this.delaySilence(cuedSound.waitTime);
      this.cuedSounds.playWaitTimer = cuedSound.waitTime; // still needed?
      cuedSound = this.cuedSounds.advanceHead();
    }
    if (SuiAudioPlayer.playing) {
      SuiAudioPlayer.stopPlayer();
    }
  }
  // Resolve promise when either the buffer is low enough that we need to add more things to it, or
  // there is no more audio to play
  async waitForDoneOrFull() {
    const promise = new Promise<void>((resolve) => {
      const timeout = () => {
        setTimeout(() => {
          if (this.cuedSounds.soundListLength < SuiAudioPlayer.audioBufferSize 
            || this.cuedSounds.complete || SuiAudioPlayer._playing === false) {
            resolve();
          } else {
            timeout();
          }
        }, 100);
      }
      timeout();
    });
    return promise;
  }
  /**
   * Create all the audio samples and start the player until done.
   * @param measureIndex 
   */
  async startPlayer(measureIndex: number) {
    this.cuedSounds.reset();
    this.cuedSounds.paramLinkHead = null;
    this.cuedSounds.paramLinkTail = null;
    // compute the repeats, and dynamics/articulations from notes
    const roadmap = new ScoreRoadMapBuilder(this.score);
    roadmap.populate(measureIndex);
    PopulateAudioData(this.score, roadmap);
    console.log(JSON.stringify(roadmap.jumpQueue, null, ' '));
    // Create a linked list of all the notes we want to play for the whole score
    for (let i = 0; i < roadmap.jumpQueue.length; ++i) {      
      const q = roadmap.jumpQueue[i];
      for (let j = q.startMeasure; j <= q.endMeasure; ++j) {
        const nextMeasure = j;
        const { endTicks, measureNotes } = this.getNoteSoundData(nextMeasure);
        const node = {
          soundParams: measureNotes,
          endTicks,
          measureIndex: nextMeasure,
          next: null
        };
        if (this.cuedSounds.paramLinkHead === null) {
          this.cuedSounds.paramLinkHead = node;
          this.cuedSounds.paramLinkTail = node;
        } else {
          this.cuedSounds.paramLinkTail!.next = node;
          this.cuedSounds.paramLinkTail = this.cuedSounds.paramLinkTail!.next;
        }
      }
    }
    // start the player in the future, after we have popualted some data
    setTimeout(() => {
      this.playSounds();
    }, 1000);
    // Populate the actual sounds, pausing if the buffer gets too full
    for (let i = 0; i < roadmap.jumpQueue.length && SuiAudioPlayer.playing; ++i) {      
      const q = roadmap.jumpQueue[i];
      for (let j = q.startMeasure; j <= q.endMeasure && SuiAudioPlayer.playing; ++j) {
        const nextMeasure = j;
        this.createCuedSound(nextMeasure);
        await this.waitForDoneOrFull();
      }
    }
  }

  static stopPlayer() {
    if (SuiAudioPlayer._playingInstance) {
      const a = SuiAudioPlayer._playingInstance;
      a.audioAnimation.clearAudioAnimationHandler(0);
      a.paused = false;
      a.cuedSounds.reset();
    }
    SuiAudioPlayer.playing = false;
  }

  static get playingInstance() {
    if (!SuiAudioPlayer._playingInstance) {
      return null;
    }
    return SuiAudioPlayer._playingInstance;
  }

  // the oscAr contains an oscillator for each pitch in the chord.
  // each inner oscillator is a promise, the combined promise is resolved when all
  // the beats have completed.
  static _playChord(oscAr: SuiOscillator[]) {
    // var par: Promise<void>[] = [];    
    for (let i = 0; i < oscAr.length; ++i) {
      oscAr[i].play();
    }
    // return Promise.all(par);
  }

  // Starts the player.
  async play() {
    let i = 0;
    if (SuiAudioPlayer.playing) {
      return;
    }
    SuiAudioPlayer._playingInstance = this;
    SuiAudioPlayer.playing = true;
    const startIndex = this.view.tracker.getFirstMeasureOfSelection()?.measureNumber.measureIndex ?? 0;
    await this.startPlayer(startIndex);
  }
}
