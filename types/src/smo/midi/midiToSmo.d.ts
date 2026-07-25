import { Clef, Pitch } from "../data/common";
import { SmoMeasure } from "../data/measure";
import { SmoTempo, SmoTimeSignature } from "../data/measureModifiers";
import { SmoNote } from "../data/note";
import { SmoScore } from "../data/score";
import { SmoTuplet } from "../data/tuplet";
export type MidiEventType = 'text' | 'copyrightNotice' | 'trackName' | 'instrumentName' | 'lyrics' | 'marker' | 'cuePoint' | 'channelPrefix' | 'portPrefix' | 'endOfTrack' | 'setTempo' | 'smpteOffset' | 'SmoTimeSignature' | 'keySignature' | 'sequencerSpecific' | 'unknownMeta' | 'noteOff' | 'noteOn' | 'noteAftertouch' | 'controller' | 'programChange' | 'channelAftertouch' | 'pitchBend';
/**
 * These are the midi events as defined by the parser.
 * @category serialization
 */
export interface MidiTrackEvent {
    deltaTime: number;
    meta?: boolean;
    numerator?: number;
    denominator?: number;
    microsecondsPerBeat?: number;
    scale?: number;
    key?: number;
    metronome?: number;
    thirtyseconds?: number;
    type: MidiEventType;
    channel?: number;
    noteNumber?: number;
    velocity?: number;
}
/**
 * @category serialization
 */
export interface RunningMetadata {
    keySignature: string;
    timeSignature: SmoTimeSignature;
    tempo: SmoTempo;
}
/**
 * @category serialization
 */
export interface MidiNoteOn {
    channel: number;
    note: number;
    smoIndex: number;
}
/**
 * @category serialization
 */
export interface MidiTupletInfo {
    numNotes: number;
    stemTicks: number;
    totalTicks: number;
    isLast: boolean;
}
/**
 * @category serialization
 */
export interface EventSmoData {
    pitches: Pitch[];
    durationTicks: number;
    tupletInfo: MidiTupletInfo | null;
    isRest: boolean;
    isTied: boolean;
    timeSignature: SmoTimeSignature;
    tempo: SmoTempo;
    keySignature: string;
    measure: number;
    tick: number;
}
export declare function getValueForTick<T>(arg: Record<number, T>, tick: number): T;
/**
 * Converts a JSON midi file to a {@link SmoScore}
 * @category serialization
 */
export declare class MidiToSmo {
    SmoTimeSignatureMap: Record<number, SmoTimeSignature>;
    tempoMap: Record<number, SmoTempo>;
    keySignatureMap: Record<number, string>;
    tieMap: Record<number, number[]>;
    timeDivision: number;
    trackIndex: number;
    eventIndex: number;
    maxMeasure: number;
    quantizeTicks: number;
    eot: boolean;
    midiOnNotes: Record<number, MidiNoteOn[]>;
    midi: any;
    static get quantizeTicksDefault(): number;
    /**
     * Since midi has very little metadata, we don't know the original clef.
     * so just use the one (treble or bass) that uses the fewest ledger lines
     * @internal
     * @param notes notes in measure
     * @returns
     */
    static guessClefForNotes(measure: SmoMeasure): Clef;
    /**
     * Create an object to convert MIDI to a {@link SmoScore}
     * @param midi the output of midi parser
     * @param quantizeDuration ticks to quantize (1024 == 16th note)
     */
    constructor(midi: any, quantizeDuration: number);
    /**
     * @internal
     * @param ticks
     * @returns
     */
    getTempo(ticks: number): SmoTempo;
    /**
     * @internal
     * @param ticks
     * @returns
     */
    getSmoTimeSignature(ticks: number): SmoTimeSignature;
    /**
     * @internal
     * @param ticks
     * @returns
     */
    getKeySignature(ticks: number): string;
    /**
     * Get metadata from the map for this point in the score
     * @param ticks current point in track
     * @returns
     */
    getMetadata(ticks: number): {
        tempo: SmoTempo;
        timeSignature: SmoTimeSignature;
        keySignature: string;
    };
    /**
     * We process 3 types of metadata at present:  time signature, tempo and keysignature.
     * @param trackEvent
     * @param ticks
     */
    handleMetadata(trackEvent: MidiTrackEvent, ticks: number): void;
    /**
     * Convert from Midi PPQ to Smoosic (and vex) ticks
     * @internal
     */
    getSmoTicks(midiTicks: number): number;
    /**
     * @internal
     */
    createNewEvent(metadata: RunningMetadata): EventSmoData;
    /**
     * @internal
     */
    static copyEvent(o: EventSmoData): EventSmoData;
    /**
     * @internal
     */
    addToTieMap(measureIndex: number): void;
    /**
     * Step 3 in the 3-step process.  Quantize the note durations and convert the midi
     * event into SmoNotes.
     * @param events
     * @returns
     */
    createNotesFromEvents(events: EventSmoData[]): SmoMeasure[];
    adjustTupletNotes(notes: SmoNote[], tuplet: SmoTuplet): void;
    /**
     * @param ticks
     * @returns the length in ticks of a triplet, if this looks like a triplet.  Otherwise 0
     */
    tripletType(ticks: number): number;
    /**
     * step 2 in the 3 step process.  Divide the music up into measures based on
     * tick duration.  If there are events overlapping measures, create extra events in the
     * new measure (hence the expand) and shorten the original event
     * @param events
     * @returns
     */
    expandMidiEvents(events: EventSmoData[]): EventSmoData[];
    /**
     * Store midi on events.  If the midi on or off matches an existing
     * stored event based on channel and note, return it so it can be processed
     * @param ev raw event
     * @param evIndex index of processed events
     * @returns
     */
    pushPopMidiEvent(ev: MidiTrackEvent, evIndex: number): MidiNoteOn | null;
    /**
     * Step 1 in the 3-step process.  Collapse midi events into
     * a single EventSmoData for each distinct tick that contains
     * the metadata state, a duration, and note information.
     * @param trackEvents
     * @returns
     */
    collapseMidiEvents(trackEvents: MidiTrackEvent[]): EventSmoData[];
    getTrackData(midi: any): any;
    /**
     * Convert the midi to a score as best we can.  The conversion is made via a 3-step
     * process.
     * 1. consolidate all the MIDI events into individual note on/off events with a duration
     * 2. adjust the durations so the fit in with Smoosic measure lengths.
     * 3. Create the {@link SmoNote} objects from the events.
     * @returns
     */
    convert(): SmoScore;
}
