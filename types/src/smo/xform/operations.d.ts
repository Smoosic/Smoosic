import { Pitch } from '../data/common';
import { SmoNote } from '../data/note';
import { SmoScore } from '../data/score';
import { SmoSystemStaff, SmoSystemStaffParams } from '../data/systemStaff';
import { SmoGraceNote, SmoDynamicText, SmoTabNote } from '../data/noteModifiers';
import { SmoRehearsalMark, SmoMeasureText, SmoVolta, SmoMeasureFormat, SmoTempo, SmoBarline, SmoTimeSignature, SmoRepeatSymbol } from '../data/measureModifiers';
import { SmoStaffHairpin, SmoSlur, SmoTie, StaffModifierBase, SmoInstrument, SmoSlurParams, SmoStaffTextBracket, SmoTabStave } from '../data/staffModifiers';
import { SmoSystemGroup } from '../data/scoreModifiers';
import { SmoTextGroup } from '../data/scoreText';
import { SmoSelection, SmoSelector, ModifierTab } from './selections';
import { MeasureFillType } from './measureFill';
/**
 * supported operations for  {@link SmoOperation.batchSelectionOperation} to change a note's duration
 */
export type BatchSelectionOperation = 'dotDuration' | 'undotDuration' | 'doubleDuration' | 'halveDuration' | 'doubleGraceNoteDuration' | 'halveGraceNoteDuration';
export interface MakeTupletOperation {
    numNotes: number;
    notesOccupied: number;
    ratioed: boolean;
    bracketed: boolean;
}
export type createStaffModifierType<T> = (fromSelection: SmoSelection, toSelection: SmoSelection) => T;
/**
 * SmoOperation is a collection of static methods that operate on/change/transform the music.  Most methods
 * take the score, a selection or selection array, and the parameters of the operation.
 * @category SmoTransform
 */
/**
 * What is needed to create a part: where it goes, its instrument, and what it is called.
 * @category SmoOperation
 */
export interface AddPartParams {
    /** where the new part goes, counting from 1; N + 1 is after the last of N staves */
    location: number;
    /** the sound, clef, staff lines and transposition of the (first) staff */
    instrument: SmoInstrument;
    /** add a second staff to the part, with the opposite clef */
    twoStaves: boolean;
    /** the name as typed.  If it is blank, instrumentLabel is the name */
    name: string;
    /** the display name of the instrument, e.g. 'Bb Trumpet' */
    instrumentLabel: string;
    /** the abbreviation as typed; blank for none */
    abbreviation: string;
}
export declare class SmoOperation {
    static setMeasureFormat(score: SmoScore, selection: SmoSelection, value: SmoMeasureFormat): void;
    static addKeySignature(score: SmoScore, selection: SmoSelection, keySignature: string): void;
    static addConnectorDown(score: SmoScore, selections: SmoSelection[], parameters: SmoSystemGroup): void;
    static setActiveVoice(score: SmoScore, voiceIx: number): void;
    /**
     * The staves that make up the part containing the given staff.  A multi-staff part is
     * kept together.
     * @returns the index of the first staff of the part, and the number of staves in it
     */
    static getPartBlock(score: SmoScore, staffIndex: number): {
        start: number;
        length: number;
    };
    /**
     * Swap the part starting at `start` with the part just before it, keeping the staves
     * of each part together and in order.
     */
    private static swapPartWithPrevious;
    /**
     * Move a part up or down one.  A part with 2 staves moves as a unit, so a single-staff part
     * that it passes moves by 2.  If last down, move to first.  If first up, move to last
     * @param score
     * @param selection
     * @param index direction to move, -1 for up and 1 for down
     */
    static moveStaffUpDown(score: SmoScore, selection: SmoSelection, index: number): void;
    static depopulateVoice(selection: SmoSelection, voiceIx: number): void;
    static populateVoice(selection: SmoSelection, voiceIx: number): void;
    static swapVoice(selections: SmoSelection[], voice1: number, voice2: number): void;
    static setTabStave(score: SmoScore, tabStave: SmoTabStave): void;
    static removeTabStave(score: SmoScore, tabStaves: SmoTabStave[]): void;
    static setTimeSignature(score: SmoScore, selections: SmoSelection[], timeSignature: SmoTimeSignature): void;
    static batchSelectionOperation(score: SmoScore, selections: SmoSelection[], operation: BatchSelectionOperation): void;
    static doubleDuration(selection: SmoSelection): boolean;
    static halveDuration(selection: SmoSelection): boolean;
    static makeTuplet(selection: SmoSelection, params: MakeTupletOperation): void;
    static addStaffModifier(selection: SmoSelection, modifier: StaffModifierBase): void;
    static toggleRest(selection: SmoSelection): void;
    static toggleSlash(selection: SmoSelection): void;
    static makeRest(selection: SmoSelection): void;
    static makeNote(selection: SmoSelection): void;
    static setNoteHead(selections: SmoSelection[], noteHead: string): void;
    static addGraceNote(selection: SmoSelection, g: SmoGraceNote, offset: number): void;
    static removeGraceNote(selection: SmoSelection, offset: number): void;
    static doubleGraceNoteDuration(selection: SmoSelection, modifiers: SmoGraceNote[]): void;
    static halveGraceNoteDuration(selection: SmoSelection, modifiers: SmoGraceNote[]): void;
    static toggleGraceNoteCourtesy(selection: any, modifiers: SmoGraceNote[]): void;
    static toggleGraceNoteEnharmonic(selection: SmoSelection, modifiers: SmoGraceNote[]): void;
    static transposeGraceNotes(selection: SmoSelection, modifiers: SmoGraceNote[], offset: number): void;
    static slashGraceNotes(selections: ModifierTab[] | ModifierTab): void;
    static unmakeTuplet(selection: SmoSelection): void;
    static dotDuration(selection: SmoSelection): void;
    static undotDuration(selection: SmoSelection): void;
    /**
     * Transpose the whole score by a number of half steps.  The destination key of each measure is
     * computed from its current key, and each pitch is spelled so that its distance from the new key
     * matches its distance from the old key (e.g. e natural in Eb becomes g# in G).
     * @param score
     * @param offset half steps, may be negative
     */
    static transposeScore(score: SmoScore, offset: number): void;
    static updateTabNote(selections: SmoSelection[], tabNote: SmoTabNote): void;
    static removeTabNote(selections: SmoSelection[]): void;
    static transpose(selection: SmoSelection, offset: number): boolean;
    static setPitch(selection: SmoSelection, pitches: Pitch[]): void;
    static toggleCourtesyAccidental(selection: SmoSelection): void;
    static courtesyAccidental(pitchSelection: SmoSelection, toBe: boolean): void;
    static toggleEnharmonic(pitchSelection: SmoSelection): void;
    static addDynamic(selection: SmoSelection, dynamic: SmoDynamicText): void;
    static removeDynamic(selection: SmoSelection, dynamic: SmoDynamicText): void;
    static unbeamSelections(noteSelection: SmoSelection): void;
    static beamSelections(score: SmoScore, selections: SmoSelection[]): void;
    /**
     * Set the beam grouping of the measures in the selections, or clear it with an empty list.
     * Only the staves and measures in the selections change.
     * @param score the score the selections belong to
     * @param selections the notes or measures to change; every measure they touch is changed
     * @param groups the longest beam group for each group in turn, whole numbers from 1 to 4
     */
    static setBeamGroups(score: SmoScore, selections: SmoSelection[], groups: number[]): void;
    /**
     * Set the beam grouping of every measure in every staff of the score, or clear it with
     * an empty list.
     */
    static setAllBeamGroups(score: SmoScore, groups: number[]): void;
    /**
     * Fill the measures in the selections with rests, removing all the notes and voices in them.  See
     * {@link fillRestDurations} for which rests.  Everything attached to the removed notes goes with them:
     * staff modifiers that start or end in the measure (slurs, ties, hairpins) and text attached to its notes.
     * Only the staves and measures in the selections change.
     * @param score the score the selections belong to
     * @param selections the notes or measures; every measure they touch is filled
     * @param fill which rests
     */
    static fillMeasures(score: SmoScore, selections: SmoSelection[], fill: MeasureFillType): void;
    static clearAllBeamGroups(score: SmoScore): void;
    static clearBeamGroups(score: SmoScore, selections: SmoSelection[]): void;
    /**
     * Put the selected notes back to automatic beaming: no hand-placed beam break or join, and the
     * beam length for the meter from the score preferences.  In a measure with its own beam grouping,
     * that grouping applies.
     */
    static autoBeamSelections(score: SmoScore, selections: SmoSelection[]): void;
    /**
     * Set the stem direction of the selected notes
     * @param flagState one of {@link SmoNote.flagStates}: auto, up or down
     */
    static setStemDirection(selections: SmoSelection[], flagState: number): void;
    static toggleBeamDirection(selections: SmoSelection[]): void;
    static addEnding(score: SmoScore, parameters: SmoVolta): void;
    static removeEnding(score: SmoScore, ending: SmoVolta): void;
    static addTextGroup(score: SmoScore, textGroup: SmoTextGroup): void;
    static removeTextGroup(score: SmoScore, textGroup: SmoTextGroup): void;
    static addMeasureText(score: SmoScore, selection: SmoSelection, measureText: SmoMeasureText): void;
    static removeMeasureText(score: SmoScore, selection: SmoSelection, mt: SmoMeasureText): void;
    static removeRehearsalMark(score: SmoScore, selection: SmoSelection): void;
    static addRehearsalMark(score: SmoScore, selection: SmoSelection, rehearsalMark: SmoRehearsalMark): void;
    static addTempo(score: SmoScore, selection: SmoSelection, tempo: SmoTempo): void;
    static setMeasureBarline(score: SmoScore, selection: SmoSelection, barline: SmoBarline): void;
    static setRepeatSymbol(score: SmoScore, selection: SmoSelection, sym: SmoRepeatSymbol): void;
    static interval(selection: SmoSelection, interval: number): boolean;
    static addOrReplaceBracket(modifier: SmoStaffTextBracket, fromSelection: SmoSelection, toSelection: SmoSelection): void;
    static createTextBracket(fromSelection: SmoSelection, toSelection: SmoSelection, text: string): SmoStaffTextBracket;
    static createTextBracketGeneric(fromSelection: SmoSelection, toSelection: SmoSelection): SmoStaffTextBracket;
    static createRitardBracket(fromSelection: SmoSelection, toSelection: SmoSelection): SmoStaffTextBracket;
    static createAccelerandoBracket(fromSelection: SmoSelection, toSelection: SmoSelection): SmoStaffTextBracket;
    static createCrescendoBracket(fromSelection: SmoSelection, toSelection: SmoSelection): SmoStaffTextBracket;
    static createDimenuendoBracket(fromSelection: SmoSelection, toSelection: SmoSelection): SmoStaffTextBracket;
    static createCrescendo(fromSelection: SmoSelection, toSelection: SmoSelection): SmoStaffHairpin;
    static createDecrescendo(fromSelection: SmoSelection, toSelection: SmoSelection): SmoStaffHairpin;
    static createTie(fromSelection: SmoSelection, toSelection: SmoSelection): SmoTie;
    static getSlurDefaultParameters(selections: SmoSelection[]): void;
    /**
     * Heuristically determine how a slur should be formatted based on the notes.  Determine control points,
     * offset, and alignment
     *
     * ## Note: Vexflow slurs consider `top` to mean the furthest point from the note head, which could be the top
     * or the bottom of the note.  It also considers yoffset to be negative if inverted is set.  Head means close to the
     * note head.
     * @param score
     * @param fromSelection
     * @param toSelection
     * @returns
     */
    static getDefaultSlurDirection(score: SmoScore, fromSelector: SmoSelector, toSelector: SmoSelector): SmoSlurParams;
    static createSlur(score: SmoScore, fromSelection: SmoSelection, toSelection: SmoSelection): SmoSlur;
    static addStaff(score: SmoScore, parameters: SmoSystemStaffParams): SmoSystemStaff;
    /**
     * Create a part with one or two staves.  The part goes at the requested location, but never
     * inside an existing part with more than one staff.  Staves below it move down, and anything
     * that refers to them moves too.  The new part keeps its text groups (preserveTextGroups), which
     * is not the default for a part.
     * @param score the full score
     * @param params where to put the part and what it is called
     * @returns the index of the first new staff
     */
    static addPart(score: SmoScore, params: AddPartParams): number;
    static removeStaff(score: SmoScore, index: number): void;
    static transposeChords(smoNote: SmoNote, offset: number, key: string): void;
    /**
     * Compute new map based on current instrument selections, adjusting existing instruments as required
     * @param instrument
     * @param selections
     */
    static changeInstrument(instrument: SmoInstrument, score: SmoScore, selections: SmoSelection[]): void;
    /**
     * Group runs of empty measures into multimeasure rests, for parts that show them.  A landmark splits a run:
     * a start landmark (rehearsal mark, key, time or tempo change, Segno, Coda, instrument change, repeat
     * or double barline at the start of the measure) ends the rest before its measure and that measure
     * starts the next rest; an end landmark (D.S., D.C., To Coda, Fine, repeat or double barline at the end of
     * the measure) ends the rest after its measure.  Measures under a volta ending are never grouped.
     * The result is recorded in each measure's svg record: the first measure of a rest has its length, end
     * barline and end symbol, the others are hidden; every other measure is reset.
     * @param score the score being displayed
     */
    static computeMultipartRest(score: SmoScore): void;
}
