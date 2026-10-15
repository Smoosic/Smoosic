// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoScoreInfo } from '../../smo/data/scoreModifiers';

import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { DialogDefinition, SuiDialogParams, InstallDialog } from './dialog';
import { reactive, watch, ref } from 'vue';
import { replaceVueRoot, modalContainerId } from '../common';
import scoreInfoApp from '../components/dialogs/scoreInfo.vue';

declare var $: any;
export const SuiScoreIdentificationDialogVue = (parameters: SuiDialogParams) => {
  const scoreInfo = reactive(parameters.view.score.scoreInfo);
  const backup = JSON.parse(JSON.stringify(scoreInfo));
  const getScoreInfo = () => scoreInfo;
  const rootId = replaceVueRoot(modalContainerId);
  const appParams = {
    initialValue: scoreInfo,
    domId: rootId,
    label: 'Score Information',
    getScoreInfo
  };
  let changed = false;
  const commitCb = async() => {
    changed = true;
    await parameters.view.updateScoreInfo(scoreInfo);
  }
  const cancelCb = async() => {
    if (changed) {
      await parameters.view.updateScoreInfo(backup);
    }
  }
  InstallDialog({ root: rootId, app: scoreInfoApp, appParams, dialogParams: parameters, commitCb, cancelCb });
}
