// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
import { ref, Ref } from 'vue';
import { SuiDialogParams, InstallDialog } from './dialog';
import { SuiSlurAdapter, SlurNumber } from './slur';
import { getModifierDialogPosition } from './adapter';
import slurComp from '../components/dialogs/slur.vue';
import { replaceVueRoot, modalContainerId } from '../common';

/**
 * Vue-based replacement for SuiSlurAttributesDialog (src/ui/dialogs/slur.ts),
 * following the SuiTimeSignatureDialogVue creation-function pattern.
 * SuiSlurAdapter is reused unchanged; only the presentation layer is new.
 */
export const SuiSlurAttributesDialogVue = (parameters: SuiDialogParams) => {
  const rootId = replaceVueRoot(modalContainerId);
  const adapter = new SuiSlurAdapter(parameters.view, parameters.modifier);

  const enable: Ref<boolean> = ref(true);
  const pollUpdating = () => {
    setTimeout(() => {
      if (adapter.updating) {
        enable.value = false;
        pollUpdating();
      } else {
        enable.value = true;
      }
    }, 200);
  };

  const updateNumberCb = (param: SlurNumber, value: number) => {
    adapter[param] = value;
  };
  const updateSelectCb = (param: SlurNumber, value: number) => {
    adapter[param] = value;
  };
  const triggerDefaultsCb = () => {
    adapter.resetDefaults = true;
  };
  const triggerResetAllCb = () => {
    adapter.resetAll = true;
    pollUpdating();
  };
  const commitCb = async () => {
    await adapter.commit();
  };
  const cancelCb = async () => {
    if (adapter.updating) {
      return;
    }
    await adapter.cancel();
  };
  const removeCb = async () => {
    if (adapter.updating) {
      return;
    }
    await adapter.remove();
  };

  const appParams = {
    domId: rootId,
    label: 'Slur Properties',
    initialPosition: getModifierDialogPosition(parameters.view, parameters.modifier),
    spacing: adapter.spacing,
    thickness: adapter.thickness,
    xOffset: adapter.xOffset,
    yOffset: adapter.yOffset,
    cp1x: adapter.cp1x,
    cp1y: adapter.cp1y,
    cp2x: adapter.cp2x,
    cp2y: adapter.cp2y,
    position: adapter.position,
    position_end: adapter.position_end,
    orientation: adapter.orientation,
    enable,
    updateNumberCb,
    updateSelectCb,
    triggerDefaultsCb,
    triggerResetAllCb
  };

  InstallDialog({
    root: rootId,
    app: slurComp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb,
    removeCb
  });
};
