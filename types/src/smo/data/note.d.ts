import { SmoNoteModifierBase, SmoArticulation, SmoLyric, SmoGraceNote, SmoMicrotone, SmoOrnament, SmoDynamicText, SmoArpeggio, SmoArticulationParametersSer, GraceNoteParamsSer, SmoOrnamentParamsSer, SmoMicrotoneParamsSer, SmoClefChangeParamsSer, SmoClefChange, SmoLyricParamsSer, SmoDynamicTextSer, SmoTabNote, SmoTabNoteParamsSer, SmoTabNoteParams } from './noteModifiers';
import { Ticks, Pitch, SmoAttrs, Transposable, SvgBox } from './common';
import { FontInfo } from '../../common/vex';
import { Note } from "vexflow_smoosic";
export interface PlayedNote {
    pitches: Pitch[];
    duration: number;
    durationPct: number;
}
export interface SmoAudioData {
    volume: number[];
    playedNotes: PlayedNote[];
}
/**
 * @category SmoObject
 */
export interface TupletInfo {
    id: string;
}
export type NoteType = 'n' | 'r' | '/';
export type NoteStringParam = 'noteHead' | 'clef';
export declare const NoteStringParams: NoteStringParam[];
export type NoteNumberParam = 'beamBeats' | 'flagState' | 'beamState';
export declare const NoteNumberParams: NoteNumberParam[];
export type NoteBooleanParam = 'hidden' | 'isCue';
export declare const NoteBooleanParams: NoteBooleanParam[];
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
 * @param beamState the beaming configuration
 * @param flagState up down auto
 * @param ticks duration
 * @param stemTicks visible duration (todo update this comment)
 * @param pitches SmoPitch array
 * @param isCue tiny notes
 * @category SmoObject
 */
export interface SmoNoteParams {
    /** note, rest, slash */
    noteType: NoteType;
    /**
     * custom note head, defaults to black or open (based on duration)
     */
    noteHead: string;
    /**
     * clef of this note, determines leger lines and sound
     */
    clef: string;
    /**
     * lyrics, annotations
     */
    textModifiers: SmoNoteModifierBase[];
    /**
     * articulations attached to the note
     */
    articulations: SmoArticulation[];
    /**
     * grace notes before the note
     */
    graceNotes: SmoGraceNote[];
    /**
     * ornaments attached to the note
     */
    ornaments: SmoOrnament[];
    /**
     * microtones attached to the note
     */
    tones: SmoMicrotone[];
    /**
     * arpeggio on the note
     */
    arpeggio?: SmoArpeggio;
    /**
     * if this note is part of a tuplet
     */
    tupletId: string | null;
    tabNote?: SmoTabNote;
    /**
     * fill, for the pretty
     */
    fillStyle: string | null;
    /**
     * indicates 'hidden' note.  Useful for padding beginning/end of partial measures
     */
    hidden: boolean;
    /**
     * how many notes to beam before creating a new beam group
     */
    beamBeats: number;
    /**
     * auto-beam, force end or secondary
     */
    beamState: number;
    /**
     * up, down, auto
     */
    flagState: number;
    /**
     * note duration
     */
    ticks: Ticks;
    /**
     * visible duration
     */
    stemTicks: number;
    /**
     * pitch for leger lines and sounds
     */
    pitches: Pitch[];
    /**
     * draw cue sized
     */
    isCue: boolean;
    /**
     * indicates this note goes with a clef change
     */
    clefNote: SmoClefChangeParamsSer;
}
export type SmoNoteTextModifierSer = SmoLyricParamsSer | SmoDynamicTextSer;
/**
 * The serializable bits of a Note.  Notes will always
 * have a type, and if a sounded note, can contain pitches.  It will always
 * contains ticks.
 * @category serialization
 */
export interface SmoNoteParamsSer {
    /** constructor */
    ctor: string;
    /** attributes for identity */
    attrs: SmoAttrs;
    /** note, rest, slash */
    noteType: NoteType;
    /**
      * custom note head, defaults to black or open (based on duration)
      */
    noteHead: string;
    /**
      * clef of this note, determines leger lines and sound
      */
    clef: string;
    /**
      * lyrics, annotations
      */
    textModifiers: SmoNoteTextModifierSer[];
    /**
      * articulations attached to the note
      */
    articulations: SmoArticulationParametersSer;
    /**
      * grace notes before the note
      */
    graceNotes: GraceNoteParamsSer[];
    /**
      * ornaments attached to the note
      */
    ornaments: SmoOrnamentParamsSer[];
    /**
      * microtones attached to the note
      */
    tones: SmoMicrotoneParamsSer[];
    /**
      * arpeggio on the note
      */
    arpeggio?: SmoArticulationParametersSer;
    /**
      * if this note is part of a tuplet
      */
    tupletId?: string;
    /**
     * If a custom tab note is here, keep track of it
     */
    tabNote?: SmoTabNoteParamsSer;
    /**
      * does this note end the secondary beam group
      */
    endSecondaryBeam: boolean;
    /**
      * fill, for the pretty
      */
    fillStyle: string | null;
    /**
      * indicates 'hidden' note.  Useful for padding beginning/end of partial measures
      */
    hidden: boolean;
    /**
      * how many notes to beam before creating a new beam group
      */
    beamBeats: number;
    /**
     * auto, end, secondary, continue
     */
    beamState: number;
    /**
      * up, down, auto
      */
    flagState: number;
    /**
      * note duration
      */
    ticks: Ticks;
    /**
     * visible duration (todo: update this comment)
     */
    stemTicks: number;
    /**
      * pitch for leger lines and sounds
      */
    pitches: Pitch[];
    /**
      * draw cue sized
      */
    isCue: boolean;
    /**
      * indicates this note goes with a clef change
      */
    clefNote?: SmoClefChangeParamsSer;
}
export declare function isSmoNote(transposable: Transposable): transposable is SmoNote;
/**
 * SmoNote contains the pitch and duration of a note or chord.
 * It can also contain arrays of modifiers like lyrics, articulations etc.
 * Also information about the beaming, flag etc.
 * @category SmoObject
 * */
export declare class SmoNote implements Transposable {
    constructor(params: SmoNoteParams);
    static get flagStates(): {
        auto: number;
        up: number;
        down: number;
    };
    static get beamStates(): {
        auto: number;
        continue: number;
        end: number;
        secondary: number;
    };
    static get beamStateMax(): number;
    static get defaultAudioData(): {
        volume: never[];
    };
    attrs: SmoAttrs;
    flagState: number;
    beamState: number;
    textModifiers: SmoNoteModifierBase[];
    articulations: SmoArticulation[];
    ornaments: SmoOrnament[];
    pitches: Pitch[];
    noteHead: string;
    arpeggio?: SmoArpeggio;
    tabNote?: SmoTabNote;
    clef: string;
    clefNote: SmoClefChange | null;
    graceNotes: SmoGraceNote[];
    noteType: NoteType;
    fillStyle: string;
    hidden: boolean;
    tupletId: string | null;
    tones: SmoMicrotone[];
    endBeam: boolean;
    endSecondaryBeam: boolean;
    ticks: Ticks;
    stemTicks: number;
    beamBeats: number;
    beam_group: SmoAttrs | null;
    renderId: string | null;
    keySignature: string;
    logicalBox: SvgBox | null;
    vexNote: Note | null;
    audioData: SmoAudioData;
    isCue: boolean;
    hasTabNote: boolean;
    accidentalsRendered: string[];
    /**
     * used in serialization
     * @internal
     */
    static get parameterArray(): string[];
    /**
     * Default constructor parameters.  We always return a copy so the caller can modify it
     */
    static get defaults(): SmoNoteParams;
    /**
     * Up, down auto (tri-state)
     */
    toggleFlagState(): void;
    get dots(): number;
    private _addModifier;
    setArticulation(articulation: SmoArticulation, set: boolean): void;
    clearArticulations(): void;
    getArticulations(): SmoArticulation[];
    getArticulation(stringCode: string): SmoArticulation | undefined;
    getOrnament(stringCode: string): SmoOrnament | undefined;
    hasMordent(): boolean;
    hasTurn(): boolean;
    /**
     * Add a new dynamic to thisnote
     * @param dynamic
     */
    addDynamic(dynamic: SmoDynamicText): void;
    /**
     * Remove the dynamic from this note.
     * @param dynamic
     */
    removeDynamic(dynamic: SmoDynamicText): void;
    /**
     * Get all note modifiers of a type, either a lyric or a dynamic
     * @param type ctor
     * @returns
     */
    getModifiers(type: string): SmoNoteModifierBase[];
    setArpeggio(arp: SmoArpeggio): void;
    /**
     *
     * @returns the longest lyric, used for formatting
     */
    longestLyric(): SmoLyric | null;
    /** Add a lyric to this note, replacing another in the same verse */
    addLyric(lyric: SmoLyric): void;
    /**
     * @returns array of lyrics that are lyrics
     */
    getTrueLyrics(): SmoLyric[];
    /**
     *
     * @returns array of SmoLyric whose parsers are chord
     */
    getChords(): SmoLyric[];
    /**
     *
     * @param lyric lyric to remove, find the best match if there are multiples
     */
    removeLyric(lyric: SmoLyric): void;
    /**
     *
     * @param verse
     * @param parser
     * @returns
     */
    getLyricForVerse(verse: number, parser: number): SmoNoteModifierBase[];
    /**
     *
     * @param fontInfo
     */
    setLyricFont(fontInfo: FontInfo): void;
    /**
     * @param adjustNoteWidth if true, vex will consider the lyric width when formatting the measure
     */
    setLyricAdjustWidth(adjustNoteWidth: boolean): void;
    setChordAdjustWidth(adjustNoteWidth: boolean): void;
    setChordFont(fontInfo: FontInfo): void;
    getOrnaments(): SmoOrnament[];
    getJazzOrnaments(): SmoOrnament[];
    getTextOrnaments(): SmoOrnament[];
    /**
     * Toggle the ornament up/down/off
     * @param ornament
     */
    toggleOrnament(ornament: SmoOrnament): void;
    setOrnament(ornament: SmoOrnament, set: boolean): void;
    setTabNote(params: SmoTabNoteParams): void;
    clearTabNote(): void;
    /**
     * Toggle the ornament up/down/off
     * @param articulation
     */
    toggleArticulation(articulation: SmoArticulation): void;
    /**
     * Sort pitches in pitch order, Vex likes to receive pitches in order
     * @param note
     */
    static sortPitches(note: Transposable): void;
    setNoteHead(notehead: string): void;
    toggleNoteHead(noteHead: string): void;
    /**
     *
     * @param graceNote
     * @param offset the index from the first grace note
     */
    addGraceNote(graceNote: SmoGraceNote, offset: number): void;
    removeGraceNote(offset: number): void;
    getGraceNotes(): SmoGraceNote[];
    /**
     * Add another pitch to this note at `offset` 1/2 steps
     * @param note
     * @param offset
     */
    static addPitchOffset(note: Transposable, offset: number): void;
    /**
     * Add another pitch to this note at `offset` 1/2 steps
     * @param offset
     * @returns
     */
    addPitchOffset(offset: number): void;
    toggleRest(): void;
    toggleSlash(): void;
    makeSlash(): void;
    makeRest(): void;
    isRest(): boolean;
    isSlash(): boolean;
    isHidden(): boolean;
    makeNote(): void;
    /**
     * set note opacity on/off
     * @param val
     */
    makeHidden(val: boolean): void;
    /**
     * Return true if this note is part of a tuplet
     */
    get isTuplet(): boolean;
    /**
     * we only support a single microtone, not sure if vex supports multiple
     * @param tone
     */
    addMicrotone(tone: SmoMicrotone): void;
    removeMicrotone(): void;
    getMicrotone(toneIndex: number): SmoMicrotone | undefined;
    getMicrotones(): SmoMicrotone[];
    /**
     * cycle through the list of enharmonics for this note.
     * @param pitch
     * @returns
     */
    static toggleEnharmonic(pitch: Pitch): Pitch;
    /**
     * transpose a note or grace note to a key-friendly enharmonic
     * @param pitchArray
     * @param offset
     * @param originalKey - keySignature from original note
     * @param destinationKey - keySignature we are transposing into
     * @returns
     */
    transpose(pitchArray: number[], offset: number, originalKey: string, destinationKey: string): Transposable;
    /**
     * used to add chord and pitch by piano widget
     * @param pitch
     */
    toggleAddPitch(pitch: Pitch): void;
    /**
     * @param note note to transpose
     * @param pitchArray an array of indices (not pitches) that indicate which pitches get altered if a chord
     * @param offset in 1/2 step
     * @param originalKey original key for enharmonic-friendly key
     * @param destinationKey destination key signature
     * @returns
     */
    static transpose(note: Transposable, pitchArray: number[], offset: number, originalKey: string, destinationKey: string): Transposable;
    get tickCount(): number;
    /**
     * Copy the note, give it unique id
     * @param note
     * @returns
     */
    static clone(note: SmoNote): SmoNote;
    /**
     * @param note
     * @param ticks
     * @returns A note identical to `note` but with different duration
     */
    static cloneWithDuration(note: SmoNote, ticks: Ticks | number, stemTicks?: number | null): SmoNote;
    static serializeModifier(modifiers: SmoNoteModifierBase[]): object[];
    private _serializeModifiers;
    /**
     * @returns a JSON object that can be used to create this note
     */
    serialize(): SmoNoteParamsSer;
    /**
     * restore note modifiers and create a SmoNote object
     * @param jsonObj
     * @returns
     */
    static deserialize(jsonObj: any): SmoNote;
}
