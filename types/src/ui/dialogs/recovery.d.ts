import { SuiDialogParams } from './dialog';
/**
 * Recovery.  Lists the autosaved snapshots of the score, newest first, and loads the one the user
 * picks.  The snapshots are kept, so another can be tried.  If the open score has unsaved changes,
 * the user is asked about them after this dialog closes.
 * @category SuiDialog
 */
export declare const SuiRecoveryDialog: (parameters: SuiDialogParams) => Promise<void>;
