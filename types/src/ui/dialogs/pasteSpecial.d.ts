import { SuiDialogParams } from './dialog';
/**
 * Paste Special.  Choose which kinds of marking attached to the copied notes (dynamics, lyrics, annotations,
 * chords, articulations, ornaments) to paste onto the notes at the selection, and whether they replace
 * the markings already there or are added to them.  The notes themselves are not changed.
 * @category SuiDialog
 */
export declare const SuiPasteSpecialDialog: (parameters: SuiDialogParams) => Promise<void>;
