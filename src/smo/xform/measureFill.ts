// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
/**
 * The rule for filling a measure with rests: which rests, for a given time signature and fill choice.
 * Pure logic, no score or UI dependencies.
 * @module /smo/xform/measureFill
 */
import { SmoMusic } from '../data/music';
import { SmoTimeSignature } from '../data/measureModifiers';

/**
 * How to fill a measure with rests.
 * - wholeRest: the largest rest that fits, then the largest that fits in what is left, and so on
 * - beats: a rest for each beat of the meter
 * - eighthRests: eighth rests
 * @category SmoTransform
 */
export type MeasureFillType = 'wholeRest' | 'beats' | 'eighthRests';
export const MeasureFillTypes: MeasureFillType[] = ['wholeRest', 'beats', 'eighthRests'];

const eighthTicks = 2048;
/** whole note, the unit that the beat length of a time signature is worked out from */
const wholeTicks = 16384;

let validDescending: number[] | null = null;
/** The durations that a rest can have, longest first */
const restDurationsDescending = (): number[] => {
  if (validDescending === null) {
    validDescending = Object.keys(SmoMusic.validDurations).map((key) => parseInt(key, 10))
      .sort((a, b) => b - a);
  }
  return validDescending;
}
/**
 * Fill `ticks` with the largest rest that fits, then the largest that fits in what is left, and so on.
 * Stops if what is left is shorter than any rest can be.
 */
const greedy = (ticks: number): number[] => {
  const rv: number[] = [];
  const durations = restDurationsDescending();
  let left = ticks;
  while (left > 0) {
    const next = durations.find((dd) => dd <= left);
    if (next === undefined) {
      break;
    }
    rv.push(next);
    left -= next;
  }
  return rv;
}
/**
 * The length of one beat for the Beats fill.  Meters with a lower number of 4 or less beat on the note
 * value of the lower number (quarter notes in x/4).  Meters with a lower number of 8 or more beat on groups
 * of two of the lower note value (quarter notes in x/8), or three in compound meters, where the top number is a
 * multiple of 3 (dotted quarter notes in 6/8).
 */
const beatTicks = (timeSignature: SmoTimeSignature): number => {
  const lower = timeSignature.beatDuration;
  if (lower <= 4) {
    return wholeTicks / lower;
  }
  const unit = wholeTicks / lower;
  return (timeSignature.actualBeats % 3 === 0 ? 3 : 2) * unit;
}
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
export const fillRestDurations = (timeSignature: SmoTimeSignature, fill: MeasureFillType,
  totalTicks?: number): number[] => {
  const total = totalTicks ?? SmoMusic.timeSignatureToTicks(timeSignature.actualBeats, timeSignature.beatDuration);
  if (total <= 0) {
    return [];
  }
  if (fill === 'wholeRest') {
    return greedy(total);
  }
  const unit = fill === 'beats' ? beatTicks(timeSignature) : eighthTicks;
  const count = Math.floor(total / unit);
  const rv: number[] = new Array(count).fill(unit);
  return rv.concat(greedy(total - count * unit));
}
