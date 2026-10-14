// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
import { reactive } from 'vue';
import { SuiDialogParams, InstallDialog } from './dialog';
import { SmoLibrary } from '../fileio/library';
import { SmoUiConfiguration } from '../configuration';
import libraryComp from '../components/dialogs/library.vue';
import { replaceVueRoot, modalContainerId } from '../common';
import { confirmReplaceScore } from './fileDialogs';

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
export const SuiLibraryDialogVue = async (
  parameters: SuiDialogParams,
  config: SmoUiConfiguration
): Promise<void> => {
  const rootId = replaceVueRoot(modalContainerId);
  const topLib: SmoLibrary = reactive(new SmoLibrary({ url: config.libraryUrl }));
  await topLib.load();

  // The chosen score is loaded after the library dialog has closed, once the user has been
  // asked about any unsaved changes in the open score.
  let selectedUrl: string | null = null;
  const selectedCb = (url: string) => {
    selectedUrl = url;
  };
  const commitCb = async () => {};
  const cancelCb = async () => {};
  const afterCloseCb = async () => {
    if (selectedUrl && await confirmReplaceScore(parameters)) {
      await parameters.view.loadRemoteScore(selectedUrl);
    }
  };

  const appParams = {
    domId: rootId,
    label: 'Music Library',
    view: parameters.view,
    topLib,
    selectedCb
  };

  InstallDialog({
    root: rootId,
    app: libraryComp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb,
    afterCloseCb
  });
};
