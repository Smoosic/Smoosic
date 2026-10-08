// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
import { SuiDialogParams, InstallDialog } from './dialog';
import { SuiRehearsalMarkAdapter } from './rehearsalMark';
import { getModifierDialogPosition } from './adapter';
import rehearsalMarkComp from '../components/dialogs/rehearsalMark.vue';
import { replaceVueRoot, modalContainerId } from '../common';

/**
 * Vue-based properties dialog for an existing SmoRehearsalMark. Opened by the modifier factory
 * when the rehearsal mark is selected (specs/025-rehearsal-mark-dialog). The adapter does the
 * live model/score updates; this function only wires the presentation layer.
 */
export const SuiRehearsalMarkDialogVue = (parameters: SuiDialogParams) => {
  const rootId = replaceVueRoot(modalContainerId);
  const view = parameters.view;
  const adapter = new SuiRehearsalMarkAdapter(view, parameters.modifier);

  const updateFieldCb = (param: 'symbol' | 'cardinality' | 'increment', value: string | boolean) => {
    if (param === 'increment') {
      adapter.increment = value as boolean;
    } else if (param === 'cardinality') {
      adapter.cardinality = value as string;
    } else {
      adapter.symbol = value as string;
    }
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
    label: 'Rehearsal Mark Properties',
    initialPosition: getModifierDialogPosition(view, parameters.modifier),
    symbol: adapter.symbol,
    cardinality: adapter.cardinality,
    increment: adapter.increment,
    updateFieldCb
  };

  InstallDialog({
    root: rootId,
    app: rehearsalMarkComp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb,
    removeCb
  });
};
