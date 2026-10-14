// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
import { SuiDialogParams, InstallDialog } from './dialog';
import { replaceVueRoot, modalContainerId } from '../common';
import unsavedChangesApp from '../components/dialogs/unsavedChanges.vue';
import { UnsavedChoice } from '../../render/sui/scoreChangeState';

/**
 * Ask the user whether to save, discard or keep the open score before another score replaces it.
 * Resolves after the dialog has closed, so the caller is free to open another dialog.
 * See `confirmReplaceScore` in fileDialogs.ts, which uses this and the Save dialog.
 * @param parameters dialog parameters, including the view
 * @returns the user's choice; closing the dialog with Escape or Cancel is 'cancel'
 */
export const askUnsavedChoice = (parameters: SuiDialogParams): Promise<UnsavedChoice> => {
  return new Promise<UnsavedChoice>((resolve) => {
    let choice: UnsavedChoice = 'cancel';
    const commitCb = async () => { };
    const cancelCb = async () => {
      resolve('cancel');
    };
    // A committed choice is reported after the dialog has unmounted.
    const afterCloseCb = async () => {
      resolve(choice);
    };
    const rootId = replaceVueRoot(modalContainerId);
    const appParams = {
      domId: rootId,
      headline: 'Unsaved changes',
      message: 'The current score has changes that are not saved.  Save it before continuing?',
      choose: (c: UnsavedChoice) => { choice = c; }
    };
    InstallDialog({
      root: rootId,
      app: unsavedChangesApp,
      appParams,
      dialogParams: parameters,
      commitCb,
      cancelCb,
      afterCloseCb
    });
  });
};
