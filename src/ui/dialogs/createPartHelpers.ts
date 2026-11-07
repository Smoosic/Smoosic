// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
/**
 * Small pieces of the Create Part dialog that need no Vue or DOM, so they can be tested.
 * @module /ui/dialogs/createPartHelpers
 */
import type { SelectOption } from '../common';

/**
 * The instruments that can be chosen for a new part.  The label is also the part's name if the
 * user does not type one.
 * @category SuiDialog
 */
export const instrumentChoices: SelectOption[] = [
  { value: 'piano', label: 'Grand Piano' },
  { value: 'electricPiano', label: 'Electric Piano' },
  { value: 'accordion', label: 'Accordion' },
  { value: 'bass', label: 'Bass (bowed)' },
  { value: 'jazzBass', label: 'Bass (plucked)' },
  { value: 'eGuitar', label: 'Electric Guitar' },
  { value: 'cello', label: 'Cello' },
  { value: 'violin', label: 'Violin' },
  { value: 'trumpet', label: 'Bb Trumpet' },
  { value: 'horn', label: 'F Horn' },
  { value: 'trombone', label: 'Trombone' },
  { value: 'tuba', label: 'Tuba' },
  { value: 'clarinet', label: 'Bb Clarinet' },
  { value: 'flute', label: 'Flute' },
  { value: 'altoSax', label: 'Eb Alto Sax' },
  { value: 'tenorSax', label: 'Bb Tenor Sax' },
  { value: 'bariSax', label: 'Eb Bari Sax' },
  { value: 'pad', label: 'Synth Pad' },
  { value: 'percussion', label: 'Percussion' },
  { value: 'none', label: 'None' }
];

/**
 * @param value the instrument's value in the list
 * @returns the instrument's display name, or the value itself if it is not in the list
 */
export const instrumentLabelFor = (value: string): string => {
  const choice = instrumentChoices.find((cc) => cc.value === value);
  return choice ? choice.label : value;
}

/**
 * Hold the Staff Location to the places a new part can go.
 * @param value what the user entered
 * @param staffCount the number of staves in the score now
 * @returns a whole number from 1 to one more than the number of staves; the last of those if the value is not a number
 */
export const clampPartLocation = (value: unknown, staffCount: number): number => {
  const last = staffCount + 1;
  if (typeof (value) !== 'number' || !Number.isFinite(value)) {
    return last;
  }
  return Math.min(Math.max(Math.round(value), 1), last);
}

/**
 * @param typed the name the user typed, possibly empty
 * @param instrumentLabel the display name of the chosen instrument
 * @returns the typed name without surrounding spaces, or the instrument's name if there is none
 */
export const resolvePartName = (typed: string, instrumentLabel: string): string => {
  const name = (typed ?? '').trim();
  return name.length > 0 ? name : instrumentLabel;
}
