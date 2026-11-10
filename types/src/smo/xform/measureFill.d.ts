import { SmoTimeSignature } from '../data/measureModifiers';
/**
 * How to fill a measure with rests.
 * - wholeRest: the largest rest that fits, then the largest that fits in what is left, and so on
 * - beats: a rest for each beat of the meter
 * - eighthRests: eighth rests
 * @category SmoTransform
 */
export type MeasureFillType = 'wholeRest' | 'beats' | 'eighthRests';
export declare const MeasureFillTypes: MeasureFillType[];
/**
 * The rests that fill a measure.  Always adds up to the length asked for, unless that is shorter than the
 * shortest rest.
 * @param timeSignature the measure's time signature; decides the beat for the 'beats' fill
 * @param fill which fill
 * @param totalTicks how long the measure is.  Defaults to a full measure of the time signature.  A pickup
 * measure is filled to the length it has.
 * @returns the duration in ticks of each rest, in order
 * @category SmoTransform
 */
export declare const fillRestDurations: (timeSignature: SmoTimeSignature, fill: MeasureFillType, totalTicks?: number) => number[];
