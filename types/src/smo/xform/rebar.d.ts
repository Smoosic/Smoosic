import { SmoScore } from '../data/score';
import { SmoTimeSignature } from '../data/measureModifiers';
/**
 * What {@link rebarMeasures} did
 * @category SmoTransform
 */
export interface RebarResult {
    /** the first re-barred measure */
    firstMeasure: number;
    /** how many measures are now in the range: the ones it had, plus those that were added */
    measureCount: number;
    /** how many measures were added after the old last measure of the range */
    added: number;
}
/**
 * Which measures a time signature change applies to: only the selected ones, from the first selected one to the
 * end of the score, or the whole score.
 * @category SmoTransform
 */
export type TimeSignatureApplyTo = 'Selected' | 'Remaining' | 'Score';
/**
 * The range of measures a time signature change applies to.
 * @param applyTo which measures
 * @param selectedMeasures the measure index of each selected note or measure, in any staff, in any order
 * @param measureCount the number of measures in the score
 * @returns the first and last measure, or null if there is no selection (and the choice is not the whole score) or no measures
 */
export declare const timeSignatureRange: (applyTo: TimeSignatureApplyTo, selectedMeasures: number[], measureCount: number) => {
    firstMeasure: number;
    lastMeasure: number;
} | null;
/**
 * The length in ticks of the measure k places after the first of a range that gets a time signature.  A time
 * signature with several parts (3/4+2/4) alternates its parts from measure to measure.
 * @param timeSignature the new time signature
 * @param k how many measures after the first re-barred measure
 * @param startIndex which part the first re-barred measure has
 */
export declare const rebarMeasureTicks: (timeSignature: SmoTimeSignature, k: number, startIndex: number) => number;
/**
 * Re-bar the music of a range of measures into a new time signature, in every staff.  The notes keep their order
 * and their lengths.  Where the new measures are not long enough, measures are added after the range (in every
 * staff) so that all of the music fits; measures are never removed.  A note that crosses a new bar line is split and
 * tied.  A tuplet is kept whole, starting the next measure if it does not fit.  Things attached to a note stay with
 * it; if the note is split they stay with the first part.  Slurs, ties, hairpins and other things between notes
 * follow their notes.  Hand-placed beaming in the range is reset to automatic.
 * @param score the score to change
 * @param firstMeasure the first measure of the range
 * @param lastMeasure the last measure of the range
 * @param timeSignature the new time signature
 * @returns what was done.  Nothing is changed, and `added` is 0, if the range is not in the score.
 */
export declare const rebarMeasures: (score: SmoScore, firstMeasure: number, lastMeasure: number, timeSignature: SmoTimeSignature) => RebarResult;
