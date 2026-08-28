// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
import { SuiDialogParams, InstallDialog } from './dialog';
import { SuiDynamicDialogAdapter } from './dynamics';
import { getModifierDialogPosition } from './adapter';
import dynamicsComp from '../components/dialogs/dynamics.vue';
import { replaceVueRoot, modalContainerId } from '../common';

/**
 * Vue-based replacement for SuiDynamicModifierDialog (src/ui/dialogs/dynamics.ts),
 * following the SuiTimeSignatureDialogVue creation-function pattern.
 * SuiDynamicDialogAdapter is reused unchanged; only the presentation layer is new.
 * `parameters.modifier` is always an already score-attached SmoDynamicText by the time
 * this runs — the menu handler in src/ui/menus/text.ts creates and adds a default
 * marking to every selected note before opening the dialog when none exists yet.
 */
export const SuiDynamicModifierDialogVue = (parameters: SuiDialogParams) => {
  const rootId = replaceVueRoot(modalContainerId);
  const view = parameters.view;
  view.groupUndo(true);
  const adapter = new SuiDynamicDialogAdapter(view, parameters.modifier);

  const updateNumberCb = (param: 'yOffsetLine' | 'yOffsetPixels' | 'xOffset', value: number) => {
    adapter[param] = value;
  };
  const updateTextCb = (value: string) => {
    adapter.text = value;
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
    label: 'Dynamics Properties',
    initialPosition: getModifierDialogPosition(view, parameters.modifier),
    yOffsetLine: adapter.yOffsetLine,
    yOffsetPixels: adapter.yOffsetPixels,
    xOffset: adapter.xOffset,
    text: adapter.text,
    updateNumberCb,
    updateTextCb
  };

  InstallDialog({
    root: rootId,
    app: dynamicsComp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb,
    removeCb
  });
};
