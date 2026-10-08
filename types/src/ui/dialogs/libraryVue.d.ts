import { SuiDialogParams } from './dialog';
import { SmoUiConfiguration } from '../configuration';
/**
 * Vue-based replacement for SuiLibraryDialog (src/ui/dialogs/library.ts),
 * following the SuiLyricDialogVue creation-function pattern. Unlike every
 * other converted dialog, this one must await the top-level library fetch
 * before the dialog is installed at all -- nothing is mounted into the DOM
 * until it resolves -- matching SuiLibraryDialog.createAndDisplay's existing
 * `await adapter.initialize()` step (see specs/015-vue-library-dialog).
 * config is a separate argument (not read from parameters.config) to mirror
 * the legacy createAndDisplay(parameters, config) call shape exactly.
 * SuiLibraryDialog/SuiLibraryAdapter/SuiTreeComponent and their call sites
 * are unchanged; nothing wires callers over to this function yet.
 */
export declare const SuiLibraryDialogVue: (parameters: SuiDialogParams, config: SmoUiConfiguration) => Promise<void>;
