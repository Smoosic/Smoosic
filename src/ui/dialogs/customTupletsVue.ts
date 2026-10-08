// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
import { SuiDialogParams, InstallDialog } from './dialog';
import { SuiCustomTupletAdapter } from './customTuplets';
import customTupletComp from '../components/dialogs/customTuplet.vue';
import { replaceVueRoot, modalContainerId } from '../common';

/**
 * Vue-based replacement for SuiCustomTupletDialog (src/ui/dialogs/customTuplets.ts),
 * following the SuiTimeSignatureDialogVue creation-function pattern.
 * SuiCustomTupletAdapter is reused unchanged; only the presentation layer is new.
 * Unlike the six modifier-editing dialogs, there is no score modifier to edit live or
 * position against, and no Remove action — the score isn't touched until OK is clicked.
 */
export const SuiCustomTupletDialogVue = (parameters: SuiDialogParams) => {
  const rootId = replaceVueRoot(modalContainerId);
  const adapter = new SuiCustomTupletAdapter(parameters.view);

  const updateFieldCb = (param: 'numNotes' | 'notesOccupied' | 'ratioed' | 'bracketed', value: number | boolean) => {
    (adapter as any)[param] = value;
  };
  const commitCb = async () => {
    await adapter.commit();
  };
  const cancelCb = async () => {
    await adapter.cancel();
  };

  const appParams = {
    domId: rootId,
    label: 'Custom Tuplet',
    numNotes: adapter.numNotes,
    notesOccupied: adapter.notesOccupied,
    ratioed: adapter.ratioed,
    bracketed: adapter.bracketed,
    updateFieldCb
  };

  InstallDialog({
    root: rootId,
    app: customTupletComp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb
  });
};
