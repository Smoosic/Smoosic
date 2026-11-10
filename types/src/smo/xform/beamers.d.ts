import { SmoNote } from '../data/note';
import { SmoAttrs } from '../data/common';
import { SmoMeasure, ISmoBeamGroup } from '../data/measure';
import { TickMap } from './tickMap';
/**
 * @category SmoTransform
 */
export interface SmoBeamGroupParams {
    notes: SmoNote[];
    secondaryBeamBreaks: number[];
    voice: number;
}
/**
 * Contain a group of {@link SmoNote} used for beaming.
 * @category SmoTransform
 */
export declare class SmoBeamGroup implements ISmoBeamGroup {
    notes: SmoNote[];
    secondaryBeamBreaks: number[];
    attrs: SmoAttrs;
    voice: number;
    constructor(params: SmoBeamGroupParams);
}
/**
 * Apply the beam policy set up in node and measure to group the notes into beam groups
 * @category SmoTransform
 */
export declare class SmoBeamer {
    /**
     * The tick positions, from the start of the measure, at which a beam group must end, for a
     * measure that has a beam grouping.  The grouping is repeated from its first number until the
     * measure is full, and the last position is clamped to the end of the measure.
     * @returns the positions, or an empty list if the measure has no grouping (use the default)
     */
    static groupBoundaries(measure: SmoMeasure): number[];
    static applyBeams(measure: SmoMeasure): void;
    measure: SmoMeasure;
    duration: number;
    measureDuration: number;
    meterNumbers: number[];
    beamBeats: number;
    skipNext: number;
    currentGroup: SmoNote[];
    secondaryBeamBreaks: number[];
    /** where the beam groups end, if the measure has its own beam grouping, otherwise empty */
    boundaries: number[];
    boundaryIndex: number;
    constructor(measure: SmoMeasure, voice: number);
    get beamGroups(): ISmoBeamGroup[];
    _removeVoiceBeam(measure: SmoMeasure, voice: number): void;
    _completeGroup(voice: number): void;
    _advanceGroup(): void;
    _isRemainingTicksBeamable(tickmap: TickMap, index: number): boolean;
    /**
     * True if the current group can keep growing until it fills half a measure of duple time.
     * Every note must be stemmable (shorter than a quarter).  The group is either all
     * eighths, or contains a dotted note, so that dotted-eighth/sixteenth and
     * double-dotted-eighth/sixteenth figures beam together across the beat.
     */
    canBeamHalfMeasure(): boolean;
    /**
     * Beam a note in a measure that has its own beam grouping.  A group ends at the first note
     * that reaches a group boundary, instead of when the note beam length is used up.  A note marked
     * 'continue' does not end the group.  Hand-placed 'end' states still end it.
     */
    _beamNoteInGroups(tickmap: TickMap, index: number, note: SmoNote): void;
    beamNote(tickmap: TickMap, index: number, note: SmoNote): void;
}
