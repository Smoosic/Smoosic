// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoGlobalLayout } from '../../smo/data/scoreModifiers';
import { SuiDialogParams, InstallDialog } from './dialog';
import { replaceVueRoot, modalContainerId } from '../common';
import { reactive, ref, watch } from 'vue';
import  scoreLayoutApp from '../components/dialogs/scoreLayout.vue';

declare var $: any;
export const SuiGlobalLayoutDialogVue = (parameters: SuiDialogParams) => {
  const rootId = replaceVueRoot(modalContainerId);
  const currentValue = reactive(parameters.view.score.layoutManager!.globalLayout);
  const getLayout = () => currentValue;
  const backup = JSON.parse(JSON.stringify(currentValue));
  // `currentValue` is a reactive wrapper around the score's live layout object, so by the
  // time this watcher fires, the mutation has already happened. `previousValue` is the only
  // reliable record of what the layout was before that mutation.
  let previousValue = JSON.parse(JSON.stringify(currentValue));
  let changed = false;
  watch(currentValue, async (newValue) => {
    const oldValue = previousValue;
    await parameters.view.setGlobalLayout(newValue, oldValue);
    previousValue = JSON.parse(JSON.stringify(newValue));
    changed = true;
  });
  const cancelCb = async () => {
    if (changed) {
      await parameters.view.setGlobalLayout(backup, previousValue);
    }
  }
  const commitCb = async () => {};
  const appParams = {
    domId: rootId,
    label: 'Score Layout',
    getLayout,
    commitCb,
    cancelCb
  };
  InstallDialog({ root: rootId, app: scoreLayoutApp, appParams, dialogParams: parameters, commitCb, cancelCb });
}
