// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
import { SuiDialogParams, InstallDialog } from './dialog';
import { SuiVoltaAdapter, SmoVoltaNumberParam } from './volta';
import { getModifierDialogPosition } from './adapter';
import voltaComp from '../components/dialogs/volta.vue';
import { replaceVueRoot, modalContainerId } from '../common';

/**
 * Vue-based replacement for SuiVoltaAttributeDialog (src/ui/dialogs/volta.ts),
 * following the SuiTimeSignatureDialogVue creation-function pattern.
 * SuiVoltaAdapter is reused unchanged; only the presentation layer is new.
 */
export const SuiVoltaAttributeDialogVue = (parameters: SuiDialogParams) => {
  const rootId = replaceVueRoot(modalContainerId);
  const adapter = new SuiVoltaAdapter(parameters.view, parameters.modifier);

  const updateFieldCb = (param: SmoVoltaNumberParam, value: number) => {
    adapter[param] = value;
  };
  const commitCb = async () => {
    await adapter.commit();
  };
  const cancelCb = async () => {
    await adapter.cancel();
  };
  const removeCb = async () => {
    await adapter.remove();
  };

  const appParams = {
    domId: rootId,
    label: 'Volta Properties',
    initialPosition: getModifierDialogPosition(parameters.view, parameters.modifier),
    number: adapter.number,
    xOffsetStart: adapter.xOffsetStart,
    xOffsetEnd: adapter.xOffsetEnd,
    yOffset: adapter.yOffset,
    updateFieldCb
  };

  InstallDialog({
    root: rootId,
    app: voltaComp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb,
    removeCb
  });
};
