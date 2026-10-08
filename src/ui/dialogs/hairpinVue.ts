// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
import { SuiDialogParams, InstallDialog } from './dialog';
import { SuiHairpinAdapter, SmoHairpinNumberParams } from './hairpin';
import { getModifierDialogPosition } from './adapter';
import hairpinComp from '../components/dialogs/hairpin.vue';
import { replaceVueRoot, modalContainerId } from '../common';

/**
 * Vue-based replacement for SuiHairpinAttributesDialog (src/ui/dialogs/hairpin.ts),
 * following the SuiTimeSignatureDialogVue creation-function pattern.
 * SuiHairpinAdapter is reused unchanged; only the presentation layer is new.
 */
export const SuiHairpinAttributesDialogVue = (parameters: SuiDialogParams) => {
  const rootId = replaceVueRoot(modalContainerId);
  const adapter = new SuiHairpinAdapter(parameters.view, parameters.modifier);

  const updateFieldCb = (param: SmoHairpinNumberParams, value: number) => {
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
    label: 'Hairpin Properties',
    initialPosition: getModifierDialogPosition(parameters.view, parameters.modifier),
    height: adapter.height,
    yOffset: adapter.yOffset,
    xOffsetRight: adapter.xOffsetRight,
    xOffsetLeft: adapter.xOffsetLeft,
    updateFieldCb
  };

  InstallDialog({
    root: rootId,
    app: hairpinComp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb,
    removeCb
  });
};
