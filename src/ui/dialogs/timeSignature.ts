// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoMeasure } from '../../smo/data/measure';
import { SmoTimeSignature } from '../../smo/data/measureModifiers';
import { SmoSelection } from '../../smo/xform/selections';
import { SuiDialogParams, InstallDialog } from './dialog';
import timeSignatureComp from '../components/dialogs/timeSignature.vue';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { replaceVueRoot, modalContainerId } from '../common';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { PromiseHelpers } from '../../common/promiseHelpers';
declare var $: any;
declare var $: any;
export const SuiTimeSignatureDialogVue = (parameters: SuiDialogParams) => {
  const rootId = replaceVueRoot(modalContainerId);
  const measure = parameters.view.tracker.selections[0].measure;
  const backup = new SmoTimeSignature(measure.timeSignature);
  let changed = false;
  const timeSignature = new SmoTimeSignature(measure.timeSignature);
  const updateTimeSignatureCb = async (mf: SmoTimeSignature):Promise<void> => {
    if (!SmoTimeSignature.equal(mf, backup)) {
      changed = true;
      await parameters.view.setTimeSignature(mf);
    }
  }
  let applies = 'Selected';
  const updateApplyTo = async (value: string) => {
      applies = value;
      if (value === 'Score') {
        parameters.view.tracker.selections = SmoSelection.selectionsToEnd(parameters.view.score, parameters.view.tracker.selections[0].selector.staff, 0);
      } else if (applies === 'Remaining') {
        parameters.view.tracker.selections = SmoSelection.selectionsToEnd(parameters.view.score, parameters.view.tracker.selections[0].selector.staff, parameters.view.tracker.selections[0].selector.measure);
      } else {
        parameters.view.tracker.selections = parameters.view.tracker.selections;
      }
  }
  const commitCb = async () => {
  }
  const cancelCb = async () => {
    if (!changed) {
      return;
    }
    await parameters.view.setTimeSignature(backup);
  }
  
  const appParams = { domId: rootId, timeSignature, label: "Staff Groups", 
    updateTimeSignatureCb, updateApplyTo };
  
  InstallDialog({
    root: rootId,
    app: timeSignatureComp,
    appParams,
    dialogParams: parameters,
    commitCb,
    cancelCb
  });
}
