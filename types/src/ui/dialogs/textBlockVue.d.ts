import { SuiDialogParams } from './dialog';
/**
 * Vue-based replacement for SuiTextBlockDialog (src/ui/dialogs/textBlock.ts),
 * following the SuiTimeSignatureDialogVue creation-function pattern.
 * SuiTextBlockDialog and its call sites are unchanged; nothing wires callers
 * over to this function yet (see specs/001-text-block-dialog-vue).
 */
export declare const SuiTextBlockDialogVue: (parameters: SuiDialogParams) => void;
