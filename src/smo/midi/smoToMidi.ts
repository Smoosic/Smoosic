// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Support for converting Smo object model to MIDI
 * @module /smo/midi/smoToMidi
 */
import { SmoMusic } from '../data/music';
import { SmoTimeSignature, SmoTempo } from '../data/measureModifiers';
import { ScoreRoadMapBuilder } from '../xform/roadmap';
import { SmoScore } from '../data/score';
import { PopulateAudioData } from '../xform/updateAudio';
import Writer from 'midi-writer-js';

/*  options: [{

              value: 1,
              label: 'Piano (bowed)'
            }, {
              value: 34,
              label: 'Bass (plucked)'
            }, {
              value: 27,
              label: 'Electric Guitar'
            }, {
              value: 'cello',
              label: 'Cello'
            }, {
              value: 'violin',
              label: 'Violin'
            }, {
              value: 'trumpet',
              label: 'Bb Trumpet'
            }, {
              value: 'horn',
              label: 'F Horn'
            }, {
              value: 'trombone',
              label: 'Trombone'
            }, {
              value: 'tuba',
              label: 'Tuba'
            }, {
              value: 'clarinet',
              label: 'Bb Clarinet'
            },  {
              value: 'altoSax',
              label: 'Eb Alto Sax'
            },  {
              value: 'tenorSax',
              label: 'Bb Tenor Sax'
            },  {
              value: 'bariSax',
              label: 'Eb Bari Sax'
            },  {
              value: 'pad',
              label: 'Synth Pad'
            }, {
              value: 'percussion',
              label: 'Percussion'
            }, {
              value: 'none',
              label: 'None'
            }]*/
/**
 * @category serialization
 */
export interface MidiTrackHash {
  track: any,
  lastMeasure: number,
  timeSignature?: SmoTimeSignature,
  tempo?: SmoTempo,
  keySignature?: string
}
function stavesToSkip(score: SmoScore): number[] {
  const skips: number[] = [];
  for (let i = 0; i < score.staves.length; ++i) {
    const staff = score.staves[i];
    if (staff.hasNonRestNotes() === false || staff.hasInstrument() === false) {
      skips.push(i);
    }
  }
  return skips;
}
/**
 * Convert a {@link SmoScore} object to MIDI
 * @category serialization
 */
export class SmoToMidi {
  /**
   * @param score 
   * @returns Midi byte array that can be sent to a file upload widget
   */
  static convert(score: SmoScore) {
    const beatTime = 128;  // midi ticks per beat
    const rm = new ScoreRoadMapBuilder(score);
    // Tracks map to voices * staves
    let trackIx = -1;
    const trackVoices: Record<string, number> = {};
    const skipStaff = stavesToSkip(score);
    // Create a roadmap of the entire score so we can get repeats, ties etc.
    rm.populate(0);
    let channel = 0;    
    const channelTrackMap : Record<number, number> = {};
    for (let i = 0; i < score.staves.length; ++i) {
      const staff = score.staves[i];
      const instrument = staff.getStaffInstrument(0);
    }
    
    // Update duration and dynamics information
    PopulateAudioData(score, rm);
    const trackHash: Record<number | string, MidiTrackHash> = {};
    // eslint-disable-next-line
    for (let i = 0; i < rm.jumpQueue.length; ++i) {
      const q = rm.jumpQueue[i];
      const instrumentId: Record<number, number> = {};
      for (let k = 0; k < score.staves.length; ++k) {
        if (skipStaff.indexOf(k) >= 0) {
          console.log(`Skipping staff ${k} for midi export`);
          continue;
        }
        const maxVoices = score.staves[k].maxVoiceCount;
         if (!instrumentId[k]) {
            instrumentId[k] = -1;
          }        
          for (let j = q.startMeasure; j <= q.endMeasure; ++j) {
            const instrument = score.staves[k].getStaffInstrument(j);
            let channel = (trackIx + 1);
            // MIDI channel 10 is reserved for percussion.  Also, there are only 16 channels
            if (instrument.instrument === 'percussion') {
              channel = 10;
            } else if (channel >= 10) {
              channel = (channel + 1) % 16;
            }
            const measure = score.staves[k].measures[j];
            for (let v = 0; v < maxVoices; ++v) {
              const trackKey = `${k}-${v}`;
              if (!trackVoices[trackKey]) {
                const trackCount = Object.keys(trackVoices).length + 1;
                trackVoices[trackKey] = trackCount;
              }
              trackIx = trackVoices[trackKey];
              if (typeof(trackHash[trackIx]) === 'undefined') {
                trackHash[trackIx] = {
                  track: new Writer.Track(),
                  lastMeasure: 0
                };
              }
              const track = trackHash[trackIx].track;
              const trackObj = trackHash[trackIx];
              // If there is no voice in this measure, pad the measure rest so the tracks are the same length
              if (measure.voices.length < v + 1) {
                  const duration = beatTime * (measure.tickmapForVoice(0).totalDuration / 4096);
                  const rest = new Writer.NoteOffEvent({
                    channel,
                    velocity: 0,
                    pitch: 'C4',
                    duration: 't' + duration
                  });
                  track.addEvent(rest);
                  continue;
                }
                const voice = measure.voices[v];
                const times = measure.timeSignature;
                const key = measure.keySignature;
                const tempo = measure.getTempo();
                if (instrumentId[k] !== instrument.midiInstrument && instrument.instrument !== 'none') {
                  // apparently midi channel is 0 based for program change but 1-based for notes
                  const mpg = new Writer.ProgramChangeEvent({ channel, instrument: instrument.midiInstrument, delta: 0 });
                  track.addEvent(mpg);
                }
                instrumentId[k] = instrument.midiInstrument;
                if (!trackObj.tempo) {
                  track.setTempo(tempo.bpm *  (tempo.beatDuration / 4096));
                  trackObj.tempo = tempo;
                } else {
                  if (tempo.bpm !== trackObj.tempo.bpm) {
                    track.setTempo(tempo.bpm * (tempo.beatDuration / 4096));
                    trackObj.tempo = tempo;
                  }
                }
                if (!trackObj.timeSignature) {
                  track.setTimeSignature(times.actualBeats, times.beatDuration);
                  trackObj.timeSignature = times;
                } else if (trackObj.timeSignature.actualBeats !== times.actualBeats ||
                  trackObj.timeSignature.beatDuration !== times.beatDuration) {
                    track.setTimeSignature(times.actualBeats, times.beatDuration);
                    trackObj.timeSignature = times;
                }
                if (!trackObj.keySignature || trackObj.keySignature !== measure.keySignature) {
                  const ks = -1 * SmoMusic.getFlatsInKeySignature(key) + SmoMusic.getSharpsInKeySignature(key);
                    track.setKeySignature(ks, 0);
                }
                for (let nix = 0; nix < voice.notes.length; ++nix) {
                  const note = voice.notes[nix];
                  for (let sndix = 0; sndix < note.audioData.playedNotes.length; ++sndix) {
                    const snd = note.audioData.playedNotes[sndix];
                    const duration = Math.round(beatTime * (snd.duration / 4096));
                    const silenceTime = duration - Math.round(duration * snd.durationPct);
                    const soundTime = duration - silenceTime;
                    // Note: we calculate detune, but MIDI note needs a midi number.  We could support it maybe
                    // with a cc value
                    const midiPitches = SmoMusic.smoPitchesToMidiStrings(snd.pitches, -1 * measure.transposeIndex);
                    let velocity = Math.min(127, Math.round(127 * note.audioData.volume[0]));
                    if (duration === 0) {
                      velocity = 0;
                    }
                    // const selector: SmoSelector = { staff: k, measure: j, voice: vix, tick: nix, pitches: [] };
                    if (note.isRest()) {
                      const rest = new Writer.NoteOffEvent({
                      channel,
                      velocity: 0,
                      pitch: 'C4',
                      duration: 't' + duration
                    });
                    track.addEvent(rest);
                  } else {
                    const midiNote = new Writer.NoteEvent({
                      channel,
                      pitch: midiPitches,
                      duration: 't' + soundTime,
                      velocity
                    });
                    track.addEvent(midiNote);
                    if (silenceTime >= 0) {
                      const rest = new Writer.NoteOffEvent({
                      channel,
                      pitch: 'C4',
                      velocity: 0,
                      duration: 't' + silenceTime
                      });
                      track.addEvent(rest);
                    }
                  }
                }                       
              }
            }
        }
      }
    }
    const tracks = Object.keys(trackHash).map((key) => trackHash[key].track);
    const writer = new Writer.Writer(tracks);
    return writer.buildFile();
  }
}
