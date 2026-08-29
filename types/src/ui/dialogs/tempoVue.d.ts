import { SuiDialogParams } from './dialog';
/**
 * Vue-based replacement for SuiTempoDialog (src/ui/dialogs/tempo.ts),
 * following the SuiTextBracketDialogVue creation-function pattern.
 * SuiTempoAdapter is reused unchanged; only the presentation layer is new.
 * The measure is derived from the current selection, exactly as the legacy
 * SuiTempoDialog constructor does -- parameters.modifier is not used (it is
 * absent at one existing call site, ribbon.ts's executeButtonModal).
 */
export declare const SuiTempoDialogVue: (parameters: SuiDialogParams) => void;
