// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
import { SuiDialogParams, InstallDialog } from './dialog';
import { replaceVueRoot, modalContainerId } from '../common';
import { confirmReplaceScore, showLoadError } from './fileDialogs';
import recoveryApp from '../components/dialogs/recovery.vue';

/**
 * Recovery.  Lists the autosaved snapshots of the score, newest first, and loads the one the user
 * picks.  The snapshots are kept, so another can be tried.  If the open score has unsaved changes,
 * the user is asked about them after this dialog closes.
 * @category SuiDialog
 */
export const SuiRecoveryDialog = async (parameters: SuiDialogParams) => {
  const entries = parameters.view.listSnapshots();
  let selectedId: number | null = null;
  const selectedCb = (id: number) => {
    selectedId = id;
  };
  const commitCb = async () => { };
  const cancelCb = async () => { };
  const afterCloseCb = async () => {
    if (selectedId === null || !(await confirmReplaceScore(parameters))) {
      return;
    }
    try {
      await parameters.view.recoverSnapshot(selectedId);
    } catch (e) {
      await showLoadError(parameters, e instanceof Error ? e.message : 'The autosave could not be read.');
    }
  };
  const rootId = replaceVueRoot(modalContainerId);
  const appParams = {
    domId: rootId,
    label: 'Recovery',
    entries,
    storageAvailable: parameters.view.autosaveStore !== null,
    selectedCb
  };
  InstallDialog({
    root: rootId,
    app: recoveryApp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb,
    afterCloseCb
  });
}
