import { SuiDialogParams } from './dialog';
/**
 * Vue-based dialog for the dynamic marking (p, mf, ff...) of the selected notes, following the
 * SuiTimeSignatureDialogVue creation-function pattern.  The dialog's state is kept in local variables and
 * each edit is applied to the score as it is made, so there is no separate adapter object.
 * `parameters.modifier` is always an already score-attached SmoDynamicText by the time
 * this runs — the menu handler in src/ui/menus/text.ts creates and adds a default
 * marking to every selected note before opening the dialog when none exists yet.
 */
export declare const SuiDynamicModifierDialogVue: (parameters: SuiDialogParams) => void;
