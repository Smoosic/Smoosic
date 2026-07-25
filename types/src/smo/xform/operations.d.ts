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
export declare class SmoOperation {
    static setMeasureFormat(score: SmoScore, selection: SmoSelection, value: SmoMeasureFormat): void;
    static addKeySignature(score: SmoScore, selection: SmoSelection, keySignature: string): void;
    static addConnectorDown(score: SmoScore, selections: SmoSelection[], parameters: SmoSystemGroup): void;
    static setActiveVoice(score: SmoScore, voiceIx: number): void;
    /**
     * Move a single stave up or down one.  If last down, move to first.
     * If first up, move to last
     * @param score
     * @param selection
     * @param index
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
    static clearAllBeamGroups(score: SmoScore): void;
    static clearBeamGroups(score: SmoScore, selections: SmoSelection[]): void;
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
    static removeStaff(score: SmoScore, index: number): void;
    static transposeChords(smoNote: SmoNote, offset: number, key: string): void;
    /**
     * Compute new map based on current instrument selections, adjusting existing instruments as required
     * @param instrument
     * @param selections
     */
    static changeInstrument(instrument: SmoInstrument, score: SmoScore, selections: SmoSelection[]): void;
    static computeMultipartRest(score: SmoScore): void;
}
