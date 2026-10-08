import { SuiDialogParams } from './dialog';
/**
 * Vue-based replacement for SuiCustomTupletDialog (src/ui/dialogs/customTuplets.ts),
 * following the SuiTimeSignatureDialogVue creation-function pattern.
 * SuiCustomTupletAdapter is reused unchanged; only the presentation layer is new.
 * Unlike the six modifier-editing dialogs, there is no score modifier to edit live or
 * position against, and no Remove action — the score isn't touched until OK is clicked.
 */
export declare const SuiCustomTupletDialogVue: (parameters: SuiDialogParams) => void;
