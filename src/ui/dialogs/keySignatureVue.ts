// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
import { SuiDialogParams, InstallDialog } from './dialog';
import { SuiKeySignatureAdapter } from './keySignature';
import { SmoSelection } from '../../smo/xform/selections';
import keySignatureComp from '../components/dialogs/keySignature.vue';
import { replaceVueRoot, modalContainerId } from '../common';

/**
 * Vue-based replacement for SuiKeySignatureDialog (src/ui/dialogs/keySignature.ts),
 * following the SuiTextBracketDialogVue creation-function pattern.
 * SuiKeySignatureAdapter is reused unchanged; only the presentation layer is new.
 */
export const SuiKeySignatureDialogVue = (parameters: SuiDialogParams) => {
  const rootId = replaceVueRoot(modalContainerId);
  const measures = SmoSelection.getMeasureList(parameters.view.tracker.selections)
    .map((sel) => sel.measure);
  const measure = measures[0];
  const adapter = new SuiKeySignatureAdapter(parameters.view, measure);

  const updateFieldCb = (param: 'key' | 'applyTo', value: string) => {
    adapter[param] = value;
  };
  const commitCb = async () => {
    await adapter.commit();
  };
  const cancelCb = async () => {
    await adapter.cancel();
  };

  const appParams = {
    domId: rootId,
    label: 'Key Signature',
    smoKey: adapter.key,
    applyTo: adapter.applyTo,
    updateFieldCb
  };

  InstallDialog({
    root: rootId,
    app: keySignatureComp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb
  });
};
