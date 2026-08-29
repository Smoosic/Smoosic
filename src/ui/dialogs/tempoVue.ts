// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2026.
import { SuiDialogParams, InstallDialog } from './dialog';
import { SuiTempoAdapter } from './tempo';
import { SmoSelection } from '../../smo/xform/selections';
import tempoComp from '../components/dialogs/tempo.vue';
import { replaceVueRoot, modalContainerId } from '../common';

/**
 * Vue-based replacement for SuiTempoDialog (src/ui/dialogs/tempo.ts),
 * following the SuiTextBracketDialogVue creation-function pattern.
 * SuiTempoAdapter is reused unchanged; only the presentation layer is new.
 * The measure is derived from the current selection, exactly as the legacy
 * SuiTempoDialog constructor does -- parameters.modifier is not used (it is
 * absent at one existing call site, ribbon.ts's executeButtonModal).
 */
export const SuiTempoDialogVue = (parameters: SuiDialogParams) => {
  const rootId = replaceVueRoot(modalContainerId);
  const measures = SmoSelection.getMeasureList(parameters.view.tracker.selections)
    .map((sel) => sel.measure);
  const measure = measures[0];
  const adapter = new SuiTempoAdapter(parameters.view, measure);

  const updateSelectCb = (param: 'tempoMode' | 'tempoText', value: string) => {
    adapter[param] = value;
  };
  const updateNumberCb = (param: 'bpm' | 'yOffset', value: number) => {
    adapter[param] = value;
  };
  const updateBeatDurationCb = (value: number) => {
    adapter.beatDuration = value;
  };
  const updateTextCb = (value: string) => {
    adapter.customText = value;
  };
  const updateBooleanCb = (param: 'applyToAll' | 'applyToSelection' | 'display', value: boolean) => {
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
    label: 'Tempo Properties',
    tempoMode: adapter.tempoMode,
    customText: adapter.customText,
    bpm: adapter.bpm,
    beatDuration: adapter.beatDuration,
    tempoText: adapter.tempoText,
    applyToAll: adapter.applyToAll,
    applyToSelection: adapter.applyToSelection,
    display: adapter.display,
    yOffset: adapter.yOffset,
    updateSelectCb,
    updateNumberCb,
    updateBeatDurationCb,
    updateTextCb,
    updateBooleanCb
  };

  InstallDialog({
    root: rootId,
    app: tempoComp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb
  });
};
