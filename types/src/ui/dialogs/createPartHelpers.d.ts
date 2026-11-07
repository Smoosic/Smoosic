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
export declare const instrumentChoices: SelectOption[];
/**
 * @param value the instrument's value in the list
 * @returns the instrument's display name, or the value itself if it is not in the list
 */
export declare const instrumentLabelFor: (value: string) => string;
/**
 * Hold the Staff Location to the places a new part can go.
 * @param value what the user entered
 * @param staffCount the number of staves in the score now
 * @returns a whole number from 1 to one more than the number of staves; the last of those if the value is not a number
 */
export declare const clampPartLocation: (value: unknown, staffCount: number) => number;
/**
 * @param typed the name the user typed, possibly empty
 * @param instrumentLabel the display name of the chosen instrument
 * @returns the typed name without surrounding spaces, or the instrument's name if there is none
 */
export declare const resolvePartName: (typed: string, instrumentLabel: string) => string;
