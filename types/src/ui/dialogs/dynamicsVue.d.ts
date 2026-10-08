import { SuiDialogParams } from './dialog';
/**
 * Vue-based replacement for SuiDynamicModifierDialog (src/ui/dialogs/dynamics.ts),
 * following the SuiTimeSignatureDialogVue creation-function pattern.
 * SuiDynamicDialogAdapter is reused unchanged; only the presentation layer is new.
 * `parameters.modifier` is always an already score-attached SmoDynamicText by the time
 * this runs — the menu handler in src/ui/menus/text.ts creates and adds a default
 * marking to every selected note before opening the dialog when none exists yet.
 */
export declare const SuiDynamicModifierDialogVue: (parameters: SuiDialogParams) => void;
