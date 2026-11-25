// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoTimeSignature } from '../../smo/data/measureModifiers';
import { TimeSignatureApplyTo } from '../../smo/xform/rebar';
import { SuiDialogParams, InstallDialog } from './dialog';
import timeSignatureComp from '../components/dialogs/timeSignature.vue';
import { replaceVueRoot, modalContainerId } from '../common';
import { ref } from 'vue';
declare var $: any;
/**
 * The Time Signature dialog.  Editing the fields, Apply To and Preserve music only collects choices: the score is
 * not touched until OK is clicked, and then everything is applied together as one undo step.  Cancel changes nothing.
 * @category SuiDialog
 */
export const SuiTimeSignatureDialogVue = (parameters: SuiDialogParams) => {
  const rootId = replaceVueRoot(modalContainerId);
  const measure = parameters.view.tracker.selections[0].measure;
  const timeSignature = ref(new SmoTimeSignature(measure.timeSignature));
  let applies: TimeSignatureApplyTo = 'Selected';
  let preserveMusic = true;
  const updateTimeSignatureCb = async (mf: SmoTimeSignature): Promise<void> => {
    timeSignature.value.times = mf.times;
    timeSignature.value.display = mf.display;
    timeSignature.value.displayString = mf.displayString;
    timeSignature.value.useSymbol = mf.useSymbol;
  }
  const updateApplyTo = async (value: string): Promise<void> => {
    applies = value as TimeSignatureApplyTo;
  }
  const updatePreserve = async (value: boolean): Promise<void> => {
    preserveMusic = value;
  }
  const commitCb = async () => {
    await parameters.view.setTimeSignature(new SmoTimeSignature(timeSignature.value), {
      applyTo: applies,
      preserveMusic
    });
  }
  const cancelCb = async () => {
  }

  const appParams = { domId: rootId, timeSignature, label: "Time Signature",
    updateTimeSignatureCb, updateApplyTo, updatePreserve };

  InstallDialog({
    root: rootId,
    app: timeSignatureComp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb
  });
}
