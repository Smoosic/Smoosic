// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoScorePreferences } from '../../smo/data/scoreModifiers';
import { SuiDialogParams, InstallDialog } from './dialog';
import { replaceVueRoot, modalContainerId } from '../common';
import { reactive, watch, ref } from 'vue';
import scorePreferencesApp from '../components/dialogs/scorePreferences.vue';

declare var $: any;

export const SuiScorePreferencesDialogVue = (parameters: SuiDialogParams) => {
  const preferences = reactive(new SmoScorePreferences(parameters.view.score.preferences));
  const backup = new SmoScorePreferences(preferences);
  
  const getPreferences = () => preferences;
  const rootId = replaceVueRoot(modalContainerId);
  const appParams = {
    initialValue: preferences,
    domId: rootId,
    getPreferences
  };
  watch(preferences, async (newVal, oldVal) => {
    await parameters.view.updateScorePreferences(newVal);    
  });

  const cancelCb = async () => {
    // Autosaves dropped because the count was lowered while the dialog was open are not brought back.
    const p1 = JSON.stringify(preferences);
    const p2 = JSON.stringify(backup);
    if (p1 !== p2) {
      await parameters.view.updateScorePreferences(backup);
    }
  }
  const commitCb = async () => {
    if (backup.transposingScore !== preferences.transposingScore ||
      backup.hideEmptyLines !== preferences.hideEmptyLines) {
      await parameters.view.refreshViewport();
    }
  }
  InstallDialog({ root: rootId, app: scorePreferencesApp, appParams, dialogParams: parameters, commitCb, cancelCb });
}
