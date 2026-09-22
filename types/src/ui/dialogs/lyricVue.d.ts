import { SuiDialogParams } from './dialog';
/**
 * Vue-based replacement for SuiLyricDialog (src/ui/dialogs/lyric.ts),
 * following the SuiTextBlockDialogVue creation-function pattern.
 * SuiLyricDialog and its call sites are unchanged; nothing wires callers
 * over to this function yet (see specs/010-vue-lyric-dialog).
 */
export declare const SuiLyricDialogVue: (parameters: SuiDialogParams) => void;
