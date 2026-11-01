import { SmoSelection, SmoSelector } from './selections';
import { SmoNote } from '../data/note';
import { SmoMeasure, SmoVoice } from '../data/measure';
import { StaffModifierBase } from '../data/staffModifiers';
import { SmoTupletTree } from '../data/tuplet';
import { SmoScore } from '../data/score';
import { TickMap } from './tickMap';
import { SmoSystemStaff } from '../data/systemStaff';
/**
 * Used to calculate the offset and transposition of a note to be pasted
 * @category SmoTransform
 */
export interface PasteNote {
    note: SmoNote;
    selector: SmoSelector;
    originalKey: string;
    tupletStart: SmoTupletTree | null;
}
/**
 * The kinds of marking attached to notes that Paste Special can paste on their own
 * @category SmoTransform
 */
export type PasteAttributeKind = 'dynamics' | 'lyrics' | 'annotations' | 'chords' | 'articulations' | 'ornaments';
/**
 * Replace: the destination note loses its markings of the chosen kinds first.  Add: it keeps them.
 * @category SmoTransform
 */
export type PasteAttributeMode = 'replace' | 'add';
/**
 * What to paste with {@link PasteBuffer.pasteAttributes}
 * @category SmoTransform
 */
export interface PasteAttributeOptions {
    kinds: PasteAttributeKind[];
    mode: PasteAttributeMode;
}
/**
 * A copied note and the destination note its markings go to
 * @category SmoTransform
 */
export interface PasteAttributePair {
    copied: PasteNote;
    destination: SmoSelection;
}
/**
 * Used when pasting staff modifiers like slurs to calculate the
 * offset
 * @category SmoTransform
 */
export interface ModifierPlacement {
    modifier: StaffModifierBase;
    ticksToStart: number;
}
/**
 * Voices copied with {@link PasteBuffer.setVoiceSelections}.  Whole measures of one voice,
 * or of all the voices, on one or more consecutive staves.
 * @category SmoTransform
 */
export interface VoiceCopy {
    /** the voice numbers (0-3) that were copied, ascending.  More than one means 'all' */
    voices: number[];
    firstStaff: number;
    staffCount: number;
    firstMeasure: number;
    measureCount: number;
    /** for each voice and staff, every note of every copied measure, in order */
    notes: Record<number, Record<number, PasteNote[]>>;
    /** staff modifiers that start on the copied notes, used when the voice number is kept */
    modifiers: Record<number, StaffModifierBase[]>;
}
/**
 * PasteBuffer holds copied music, and handles the action of pasting the music to
 * a different point in the score.  It does this by serializing the measure(s) from the source
 * and then creating handling the overlap with existing music when deserializaing it.
 * @category SmoTransform
 */
export declare class PasteBuffer {
    notes: Record<number, PasteNote[]>;
    staffIndex: number;
    noteIndex: number;
    measures: SmoMeasure[];
    measureIndex: number;
    remainder: number;
    replacementMeasures: SmoSelection[];
    score: SmoScore | null;
    modifiers: StaffModifierBase[];
    modifiersToPlace: ModifierPlacement[];
    destination: SmoSelector;
    staffSelectors: SmoSelector[];
    /** voices copied by setVoiceSelections, or null.  Separate from the notes copied by setSelections */
    voiceCopy: VoiceCopy | null;
    /** The kinds of marking Paste Special offers, in the order the dialog shows them */
    static readonly attributeKinds: PasteAttributeKind[];
    constructor();
    setScore(score: SmoScore): void;
    /**
     * @returns true if notes have been copied with {@link setSelections}
     */
    hasNotes(): boolean;
    getCopyBufferTickCount(): number;
    /**
     * Which choices the Copy Voices menu offers.
     * @param voicesInSelection the most voices any selected measure has
     * @returns each voice number to offer, then 'all' if there is more than one voice
     */
    static copyVoiceChoices(voicesInSelection: number): Array<number | 'all'>;
    /**
     * Which choices the Paste Voice menu offers.
     * @param copiedVoices the voices in the current voice copy, empty if there is none
     * @param destVoiceCount how many voices the destination has (the most in any destination measure)
     * @returns for one copied voice, each existing destination voice (to replace it) and 'new', a new
     * voice after the existing ones, unless the destination already has the maximum number of voices;
     * for several copied voices, only 'all'; nothing if there is no voice copy or no destination
     */
    static pasteVoiceChoices(copiedVoices: number[], destVoiceCount: number): Array<number | 'all' | 'new'>;
    hasVoiceCopy(): boolean;
    clearVoiceCopy(): void;
    copiedVoiceNumbers(): number[];
    /**
     * The length of one copied voice in ticks, for working out how many measures a paste covers.
     */
    getVoiceCopyTickCount(): number;
    /**
     * Copy whole measures of one voice, or all the voices.  If the selection starts or ends in the
     * middle of a measure, it is extended to the start of the first measure and the end of the last.
     * The selection is treated as a rectangle: from the first to the last selected staff and measure.
     * A voice that is missing from a copied measure is copied as that measure's default rests.
     * @param score the score to copy from
     * @param selections the selected notes or measures
     * @param voice the voice to copy (0-3), or 'all'
     * @returns false if nothing was copied
     */
    setVoiceSelections(score: SmoScore, selections: SmoSelection[], voice: number | 'all'): boolean;
    /**
     * Paste a single copied voice into a voice of the destination measures, starting at the
     * beginning of the destination measure.  The destination voice may be any existing voice,
     * or the next empty one, which is created in each measure it is pasted into.
     * @param destination staff and measure to paste at (the voice and tick are ignored)
     * @param voice the destination voice (0-3)
     * @returns the measures that were replaced
     */
    pasteVoice(destination: SmoSelector, voice: number): SmoSelection[];
    /**
     * Paste all the copied voices, each into the voice of the same number, starting at the
     * beginning of the destination measure.  Voices the destination doesn't have are created.
     * @param destination staff and measure to paste at (the voice and tick are ignored)
     * @returns the measures that were replaced
     */
    pasteAllVoices(destination: SmoSelector): SmoSelection[];
    /**
     * Paste voice `srcVoice` of the voice copy into voice `destVoice`, on each copied staff.
     */
    private _pasteCopiedVoice;
    setSelections(score: SmoScore, selections: SmoSelection[]): void;
    _populateSelectArray(selections: SmoSelection[]): void;
    clearSelections(): void;
    _findModifier(selector: SmoSelector): StaffModifierBase | null;
    _findPlacedModifier(selector: SmoSelector): StaffModifierBase | null;
    _alignVoices(measure: SmoMeasure, voiceIndex: number): void;
    _populateMeasureArray(selector: SmoSelector, notes: PasteNote[]): void;
    _populatePre(voiceIndex: number, measure: SmoMeasure, startTick: number, tickmap: TickMap): SmoVoice;
    /**
     *
     * @param voiceIndex
     */
    _populateVoice(notes: PasteNote[]): SmoVoice[];
    static _countTicks(voice: SmoVoice): number;
    /**
     * If the source contains a staff modifier that ends on the source selection, copy the modifier
     * @param srcSelector
     * @param destSelector
     * @param staff
     * @returns
     */
    _populateModifier(srcSelector: SmoSelector, destSelector: SmoSelector, staff: SmoSystemStaff): void;
    /**
     *
     * @param measure
     * @param startIndex
     * @param endIndex
     * @param voiceIndex
     * @private
     */
    private _removeOverlappingTuplets;
    /**
     * Start copying the paste buffer into the destination by copying the notes and working out
     * the measure overlap
     *
     * @param voice
     * @param measure
     * @param tickmap
     * @param startSelector
     * @returns
     */
    _populateNew(voice: SmoVoice, measure: SmoMeasure, tickmap: TickMap, startSelector: SmoSelector, notes: PasteNote[]): void;
    _populatePost(voice: SmoVoice, voiceIndex: number, measure: SmoMeasure, tickmap: TickMap): void;
    _pasteVoiceSer(serializedMeasure: any, vobj: any, voiceIx: number): void;
    pasteIntoScore(score: SmoScore, selector: SmoSelector, func: (selector: SmoSelector, notes: PasteNote[]) => PasteNote[]): void;
    /**
     * Decide which destination note each copied note's markings go to, without changing anything.
     * The two parts are lined up by elapsed time, the way the former Paste Chords command did: a copied note starts
     * when the copied notes before it have finished, and goes to the first destination note, counting from
     * `selector`, that starts at or after that time.  If the parts have the same rhythm, that is one note to
     * one note.  If not, a long destination note can get the markings of several copied notes, and destination
     * notes in between get none.  Elapsed time is a total of note durations (`tickCount`); `selector.tick`
     * is the position of a note within its voice, and is never added to a duration.
     * @param selector where the first copied note goes
     * @param notes the copied notes of one staff, in order
     * @returns the pairs in copied-note order; there is none for a copied note after the destination part ends
     */
    alignAttributeNotes(selector: SmoSelector, notes: PasteNote[]): PasteAttributePair[];
    /**
     * The measures that {@link pasteAttributes} would change at `selector`, found without changing anything.
     * The copied duration is not enough to know this, since a copied note can go to a destination note that
     * starts later (see {@link alignAttributeNotes}).
     * @param selector where the first copied note goes
     * @returns the first and last measure, or null if nothing would be pasted
     */
    getAttributePasteExtent(selector: SmoSelector): {
        firstMeasure: number;
        lastMeasure: number;
    } | null;
    /**
     * Paste only the chosen kinds of marking (dynamics, lyrics, annotations, chords, articulations, ornaments)
     * onto the destination notes.  Pitches, durations and the kinds not chosen are not changed.  Chords are
     * spelled for the destination's key; the other kinds are copied as they are.  See {@link alignAttributeNotes}
     * for which destination note each copied note goes to.
     * @param selector where the first copied note goes
     * @param options which kinds to paste, and whether they replace the destination's markings of those kinds
     */
    pasteAttributes(selector: SmoSelector, options: PasteAttributeOptions): void;
    _pasteAttributeNotes(selector: SmoSelector, notes: PasteNote[], kinds: PasteAttributeKind[], mode: PasteAttributeMode): void;
    pasteSelections(selector: SmoSelector): void;
    pasteNoteSelections(selector: SmoSelector, notes: PasteNote[]): PasteNote[];
}
