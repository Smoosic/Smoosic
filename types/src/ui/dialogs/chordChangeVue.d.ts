import { SuiDialogParams } from './dialog';
/**
 * Vue-based replacement for SuiChordChangeDialog (src/ui/dialogs/chordChange.ts),
 * following the SuiLyricDialogVue creation-function pattern (010-vue-lyric-dialog).
 * SuiChordChangeDialog and its call sites are unchanged; nothing wires callers
 * over to this function yet (see specs/013-vue-chord-dialog).
 */
export declare const SuiChordChangeDialogVue: (parameters: SuiDialogParams) => void;
