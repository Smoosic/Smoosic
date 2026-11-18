import { SuiDialogParams } from './dialog';
/**
 * Vue-based dialog for note text annotations (SmoLyric, parser 'annotation').
 * Structurally modeled on SuiLyricDialogVue (src/ui/dialogs/lyricVue.ts), minus
 * note-to-note navigation, plus multi-selection propagation modeled on
 * the way SuiDynamicModifierDialogVue does it (src/ui/dialogs/dynamicsVue.ts).
 * See specs/017-text-annotations.
 */
export declare const SuiAnnotationDialogVue: (parameters: SuiDialogParams) => void;
