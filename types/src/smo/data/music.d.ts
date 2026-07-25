/**
 * shared music theory and audio frequency routines, helper functions etc.
 * @module /smo/data/music
 */
import { SmoNote } from './note';
import { Pitch, PitchKey, Clef, PitchLetter, AccidentalArray, AccidentalDisplay } from './common';
import { SmoMicrotone } from './noteModifiers';
/**
 * Used for xml clef conversion
 * @category SmoObject
 */
export interface ClefSign {
    sign: string;
    line?: number;
    octave?: number;
}
/**
 * calculate the pitch frequency, just temperment a=440, etc.
 * @category SmoTransform
 */
export declare class SmoAudioPitch {
    static _computeFrequencies(): Record<string, number>;
    static frequencies: Record<string, number> | null;
    static frequencyKeys: string[] | null;
    static get pitchFrequencyKeys(): string[];
    static get pitchFrequencyMap(): Record<string, number>;
    static frequencyToVexPitch(freq: number): string;
    static _rawPitchToFrequency(smoPitch: Pitch, offset: number): number;
    /**
     *
     * @param smoPitch - pitch from the SMO object
     * @param offset - transpose 1/2 steps, 0 means no transpose
     * @param tone - optional transpose microtone
     * @returns
     */
    static smoPitchToFrequency(smoPitch: Pitch, offset: number, tone: SmoMicrotone | null): number;
}
/**
 * interface for valid non-tuplet duration value (all the
 * base note lengths + dots)
 * @category SmoTransform
 */
export interface SimpleDuration {
    index: number;
    ticks: number;
    baseTicks: number;
    dots: number;
}
/**
 * description of a scale entry, from vex theory routines
 * @category SmoTransform
 */
export interface VexNoteValue {
    root_index: number;
    int_val: number;
}
/**
 * Describe the music theory role of an accidental vs. the key signature.
 * Used to determine default enharmonic spelling.
 * @category SmoTransform
 */
export interface KeySignatureRole {
    letter: PitchLetter;
    accidental: string;
    role: string;
}
/**
 * Helper functions that build on the VX music theory routines, and other
 * utilities I wish were in VF.Music but aren't
 * ## Note on pitch and duration format
 * We use some VEX music theory routines and frequently need to convert
 * formats from SMO format.  We also use the same 'ticks' abstraction for
 * durations.
 *
 * `Smo` uses pitch JSON:
 * ```javascript
 *     {note:'c',accidental:'#',octave:4}
 * ```
 *
 * `Vex` usually uses a canonical string:
 *
 *     `'c#/4'`
 *
 * Depending on the operation, the octave might be omitted
 *
 * `Smo` uses a JSON for duration always:
 * ```javascript
 *     {numerator:4096,denominator:1,remainder:0}
 * ```
 * `Vex` uses a letter duration (`'4'` or `'q'`for 1/4 note) and `'d'` for dot.
 *
 * I try to indicate whether I am using vex or smo notation in the function name.
 * Duration methods start around line 1100
 * @category SmoTransform
 */
export declare class SmoMusic {
    /**
     *Normalized gain from dynamics
     */
    static get dynamicVolumeMap(): Record<string, number>;
    /**
     * Ported from vex, used to convert pitches to numerical values
     * */
    static get noteValues(): Record<string, VexNoteValue>;
    static accidentalDisplay(pitch: Pitch, keySignature: string, duration: number, accArray: AccidentalArray[]): AccidentalDisplay | null;
    /**
     * return Vex canonical note enharmonic - e.g. Bb to A#
     * */
    static vexToCannonical(vexKey: string): string;
    /**
    * A note array (sans octave) in key-signature order
    */
    static get circleOfFifths(): PitchKey[];
    /**
     * Return the number of lines above first ledger line below the staff.
     * e.g. middle c in treble clef returns 0.  Top line f in treble returns 5.
     * @param clef
     * @param pitch
     * @returns number where 0 is the first ledger line below
     */
    static pitchToStaffLine(clef: string, smoPitch: Pitch): number;
    static staffLineToPitch(clef: string, line: number): Pitch;
    /**
     * return above if the first pitch is above line 3, else below
     * @param note
     * @returns
     */
    static positionFromStaffLine(note: SmoNote): "above" | "below";
    /**
     * gives the index into circle-of-fifths array for a pitch, considering enharmonics.
     * */
    static circleOfFifthsIndex(smoPitch: Pitch): number;
    /**
     * Get pitch to the right in circle of fifths
     * */
    static addSharp(smoPitch: Pitch): Pitch;
    /**
     * Get pitch to the left in circle of fifths
     */
    static addFlat(smoPitch: Pitch): Pitch;
    /**
     * Add @param {number} - sharps
     */
    static addSharps(smoPitch: Pitch, distance: number): Pitch;
    /**
     * Add *distance* sharps/flats to given key
     */
    static addFlats(smoPitch: Pitch, distance: number): Pitch;
    /**
     * Convert array of smo pitches to vex keys, with adjustment for transpose and notehead
     * @param pitchAr
     * @param keyOffset
     * @param noteHead
     * @returns {string[]} - array of vex keyx
     */
    static smoPitchesToVexKeys(pitchAr: Pitch[], keyOffset: number, noteHead: string | null): string[];
    static get scaleIntervals(): Record<string, number[]>;
    /**
     * return true if the pitches match, except for octave.
     * `{ letter: 'a', accidental: '#'}, { letter: 'a', accidental: '#'}` returns true
     * `{ letter: 'a', accidental: '#'}, { letter: 'b', accidental: 'b'}` returns false
     * */
    static smoScalePitchMatch(p1: Pitch, p2: Pitch): boolean;
    /**
     * Return the number of ledger lines, or 0 if none.  positive if
     * below the staff, negative if above
     * @param clef
     * @param pitch
     * @returns number where 0 is the top staff line
     */
    static pitchToLedgerLine(clef: Clef, pitch: Pitch): number;
    /**
     * return flag state (up === 1 or down === 2) based on pitch and clef if auto
     * */
    static flagStateFromNote(clef: Clef, note: SmoNote): number;
    /**
     * an array of clefs and the xml information they map to
     */
    static clefSigns: Record<string, ClefSign>;
    /**
   * an array of clefs and the xml information they map to
   */
    static clefLedgerShift: Record<string, number>;
    static scaleTones: string[];
    static getScaleTonesForKey(keySignature: string): Record<string, string>;
    /**
     * The purpose of this table is to keep consistent enharmonic spelling when transposing
     * instruments in different keys.  It is not theoritically complete, e.g.
     * there is no reason to distinguish between #5 used as a leading tone for vi- or
     * as an augmented chord, the spelling is the same.  It does not show a preference
     * for notes that don't have an obvious purpose in the key, e.g. it does not try to compute the
     * equivalent to 'e#' in the key of 'c'.  The computation of the 'intended key area' is
     * beyond the scope of a music program to interpret.
     */
    static get enharmonicRoles(): Record<string, KeySignatureRole[]>;
    /**
     * Find the harmonic role for the given pitch
     * @param smoPitch
     * @param keySignature
     * @returns
     */
    static findRoleOfPitch(smoPitch: Pitch, keySignature: string): string;
    /**
     * Given a harmonic role, find the pitch that matches it.  If there is no one, just
     * return the raw transposition
     * @param role
     * @param keySignature
     * @param transposedPitch
     * @returns
     */
    static findPitchForRole(role: string, keySignature: string, transposedPitch: Pitch): Pitch;
    static rawTranspose(pitch: Pitch, offset: number): Pitch;
    static transposePitchForKey(pitch: Pitch, originalKey: string, destinationKey: string, offset: number): Pitch;
    /**
     * convert from SMO to VEX format so we can use the VexFlow tables and methods
     * example:
     *   `{letter,octave,accidental}` object to vexKey string `'f#'`
     * */
    static _pitchToVexKey(smoPitch: Pitch): string;
    /**
     * convert smo pitch to easy score (vex) format.  Mostly used
     * for debugging and generating Vex test cases
     * @param smoPitch
     * @returns - a string that can be converted to a VEX routine, with some difficulty
     */
    static pitchToEasyScore(smoPitch: Pitch): string;
    /**
     * convert a pitch to a format expected by the MIDI writer
     * @param smoPitch pitch to convert
     * @returns pitch in MIDI string format.
     */
    static smoPitchToMidiString(smoPitch: Pitch, offset: number): string;
    static smoPitchesToMidiStrings(smoPitches: Pitch[], offset: number): string[];
    /**
     * filled in from the midi routines borrowed from
     * // https://github.com/grimmdude/MidiWriterJS
     * @param midiPitch pitch from MIDIwrite
     * @returns SMO pitch
     */
    static midiPitchToSmoPitch(midiPitch: string): Pitch;
    static midiPitchToMidiNumber(midiPitch: string): number;
    static midiNumberAndDetuneFromPitch(pitch: Pitch, xpose: number, microtone?: SmoMicrotone): {
        midinumber: number;
        detune: number;
        frequency: number;
    };
    static midiNumberToMidiPitch(midiNumber: number): string;
    static pitchToVexKey(smoPitch: Pitch, head?: string | null): string;
    /**
     *  Turns vex pitch string into smo pitch, e.g.
     * `cn/4 => {'c','n',4}`
     * @param vexPitch
     * @returns SmoPitch
     * */
    static vexToSmoPitch(vexPitch: string): Pitch;
    /**
     * Convert to smo pitch, without octave
     * ``['f#'] => [{letter:'f',accidental:'#'}]``
     * */
    static vexToSmoKey(vexPitch: string): PitchKey;
    static smoPitchesToVex(pitchAr: Pitch[]): string[];
    /**
     * @param vexKey - pitch in vex format
     * @returns pitch in vex format, sans octave
     */
    static stripVexOctave(vexKey: string): string;
    /**
     * compare pitches for frequency match
     */
    static pitchArraysMatch(ar1: Pitch[], ar2: Pitch[]): boolean;
    /**
     * convert pitches to integer pitch representations
     * by calling smoPitchToInt
     * @param pitches Smo pitches
     * @returns
     */
    static smoPitchesToIntArray(pitches: Pitch[]): number[];
    /**
     * convert a pitch to an integer value, used for transpositions, intervals, etc.
     * @param pitch
     * @returns
     */
    static smoPitchToInt(pitch: Pitch): number;
    /**
     * Convert a number to a SMO pitch
     * @param intValue - number of 1/2 steps from `c0`
     * @returns
     */
    static smoIntToPitch(intValue: number): Pitch;
    static pitchKeyToPitch(pk: PitchKey): Pitch;
    /**
     * Consider instrument transpose when setting key -
     * e.g. Eb for Bb instruments is F. Note:  return value is not
     * a valid VEX key signature.  Use vexKeySignatureTranspose for that.
     */
    static vexKeySigWithOffset(vexKey: string, offset: number): string;
    static _enharmonics: Record<string, string[]> | null;
    /**
     * return a map of enharmonics for choosing or cycling.  notes are in vexKey form.
     */
    static get enharmonics(): Record<string, string[]>;
    /**
     * Get enharmonic equivalent of given notes for cycle/choose
     * @param vexKey
     * @returns
     */
    static getEnharmonics(vexKey: string): string[];
    /**
     * return the next note from the cycle in `getEnharmonics`
     */
    static getEnharmonic(vexKey: string): string;
    /**
     * Return a pitch a diatonic step away from SmoPitch in vexKey
     * @param smoPitch
     * @param vexKey
     * @param direction
     * @returns
     */
    static closestTonic(smoPitch: Pitch, vexKey: string, direction: number): Pitch;
    static toValidKeySignature(vexKey: string): string;
    /**
     * When transposing, get the enharmonic that most closely fits the key
     * `getEnharmonicInKey` returns an alternate to the given pitch, or the same pitch.
     * `getKeyFriendlyEnharmonic` return a pitch for a given key, given the letter name only
     * @param smoPitch
     * @param keySignature
     * @returns
     */
    static getEnharmonicInKey(smoPitch: Pitch, keySignature: string): Pitch;
    /**
     * fix the enharmonic to match the key, if possible
     * @example
     * `getKeyFriendlyEnharmonic('b','eb');  => returns 'bb'
     * return vex string
     * `getEnharmonicInKey` returns an alternate to the given pitch, or the same pitch.
     * `getKeyFriendlyEnharmonic` return a pitch for a given key, given the letter name only
     */
    static getKeyFriendlyEnharmonic(letter: string, keySignature: string): string;
    /**
    // given a letter pitch (a,b,c etc.), and a key signature, return the actual note
    // that you get without accidentals
    //   `SmoMusic.getKeySignatureKey('F','G'); // returns f#`
     * @param letter
     * @param keySignature
     * @returns
     */
    static getKeySignatureKey(letter: PitchLetter, keySignature: string): string;
    static getAccidentalForKeySignature(smoPitch: Pitch, keySignature: string): string;
    static isPitchInKeySignature(smoPitch: Pitch, keySignature: string): boolean;
    static getIntervalInKey(pitch: Pitch, keySignature: string, interval: number): Pitch;
    static getLetterNotePitch(prevPitch: Pitch, letter: PitchLetter, key: string): Pitch;
    /**
     * return the key signature, transposed a number of 1/2 steps in Vex key format
     * @param key start key
     * @param transposeIndex number of 1/2 steps
     * @returns {string} - vex key
     */
    static vexKeySignatureTranspose(key: string, transposeIndex: number): string;
    static get frequencyMap(): Record<string, number>;
    static get letterPitchIndex(): Record<PitchLetter, number>;
    /**
     * Indicate if a change from letter note 'one' to 'two' needs us to adjust the
     * octave due to the `SmoMusic.letterPitchIndex` (b0 is higher than c0)
     * */
    static letterChangedOctave(one: PitchLetter, two: PitchLetter): number;
    /**
     * Transpose a `Pitch` `offset` 1/2 steps
     * @param pitch
     * @param offset
     * @returns
     */
    static getKeyOffset(pitch: Pitch, offset: number): Pitch;
    static get keySignatureLength(): Record<string, number>;
    static getSharpsInKeySignature(key: string): number;
    static getFlatsInKeySignature(key: string): number;
    static midiKeyToVexKey(midiKey: number): string;
    static highestDuration: number;
    static lowestDuration: number;
    static durationsDescending: number[];
    static durationsAscending: number[];
    static ticksFromSmoDuration(duration: SimpleDuration): number;
    static _validDurations: Record<number, SimpleDuration> | null;
    static _validDurationKeys: number[];
    static get validDurations(): Record<number, SimpleDuration>;
    /**
     * Get the closest valid duration for this number of ticks, but not going over
     * @param ticks
     * @returns
     */
    static closestSmoDurationFromTicks(ticks: number): SimpleDuration | null;
    static closestSimpleDurationFromTicks(ticks: number): number;
    static _ticksToDuration: Record<string, string>;
    static get ticksToDuration(): Record<string, string>;
    static timeSignatureToTicks(num: number, den: number): number;
    static smoTicksToVexDots(ticks: number): number;
    static midiTicksForQuantizeTo(ticks: number): number[];
    static get midiTicksForQuantizeMap(): Record<number, number[]>;
    static midiTicksForQuantize(ticks: number): number[];
    static binarySearch(target: number, ix: number, partition: number, input: number[]): {
        cost: number;
        result: number;
        newIx: number;
        oldIx: number;
        partition: number;
        input: number[];
    } | {
        cost: number;
        result: number;
        newIx: number;
        partition: number;
        input: number[];
        oldIx?: undefined;
    };
    static midiTickSearch(target: number, quantize: number): {
        cost: number;
        result: number;
    };
    static closestVexDuration(ticks: number): string;
    static closestBeamDuration(ticks: number): SimpleDuration;
    static closestDurationTickLtEq(ticks: number): number;
    /**
     * Return array of valid note-lengths from an odd number of ticks,
     * so we can come as close as possible to representing the ticks with notes
     * @param ticks
     * @returns
     */
    static splitIntoValidDurations(ticks: number): number[];
    static vexStemType(ticks: number): string;
    static getNextDottedLevel(ticks: number): number;
    static getPreviousDottedLevel(ticks: number): number;
    /**
     * break the duration up into an array of durations, to split a long
     * note up between bars when pasting.
     * @param duration
     * @returns
     */
    static gcdMap(duration: number): number[];
    static notesFromLetters(startPitch: Pitch, clef: Clef, keySignature: string, duration: number, letters: string): SmoNote[];
}
