// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoInstrument, SmoInstrumentNumParamType, SmoInstrumentParams } from '../../smo/data/staffModifiers';
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';

import { SuiDialogParams, InstallDialog } from './dialog';
import { SuiSampleMedia } from '../../render/audio/samples';
import { replaceVueRoot, modalContainerId } from '../common';
import { reactive, watch, ref } from 'vue';
import instrumentPropertiesApp from '../components/dialogs/instrumentProperties.vue';
import newPartApp from '../components/dialogs/newPart.vue';
import { clampPartLocation, instrumentLabelFor } from './createPartHelpers';

export const SuiInstrumentDialogVue = (parameters: SuiDialogParams) => {
  const selection = parameters.view.tracker.selections[0];
  const instrument = reactive(new SmoInstrument(parameters.view.score.getStaffInstrument(selection.selector)));
  let applies = 'Selected';
  const setApplyTo = (value: string)  => {
    applies = value;
    if (value === 'Score') {
      parameters.view.tracker.selections = SmoSelection.selectionsToEnd(parameters.view.score, parameters.view.tracker.selections[0].selector.staff, 0);
    } else if (applies === 'Remaining') {
      parameters.view.tracker.selections = SmoSelection.selectionsToEnd(parameters.view.score, parameters.view.tracker.selections[0].selector.staff, parameters.view.tracker.selections[0].selector.measure);
    } else {
      parameters.view.tracker.selections = parameters.view.tracker.selections;
    }
  }
  setApplyTo(applies);
  const commitCb = async () => {
    // hack: the family name for musicxml purposes is here.
    instrument.family = SuiSampleMedia.getFamilyForInstrument(instrument.instrument);
    await parameters.view.changeInstrument(instrument, parameters.view.tracker.selections);
  }
  const cancelCb = async () => {    
  }
  watch(instrument, async (newVal) => {
    console.log('Instrument changed');
  });
  const getInstrument = () => instrument;
  const appParams = {
    domId: replaceVueRoot(modalContainerId),
    label: 'Instrument Properties',
    applyToInitial: applies,
    getInstrument,
    updateApplyToCb: setApplyTo,
  }
  const rootId = replaceVueRoot(modalContainerId);
  InstallDialog({
      app: instrumentPropertiesApp,
      appParams,
      root: rootId,
      dialogParams: parameters,
      commitCb, 
      cancelCb
    });
}


/**
 * Create Part.  Asks for the new part's instrument, name, abbreviation and where it goes in the score,
 * and creates it in one undo step.  The place is counted from 1; one more than the number of staves
 * is after the last staff.  A part with two staves is never split by the new part.
 * @category SuiDialog
 */
export const SuiCreatePartVue = (parameters: SuiDialogParams) => {
  const selection = parameters.view.tracker.selections[0];
  const instrument = new SmoInstrument(parameters.view.score.getStaffInstrument(selection.selector));
  const staffCount = parameters.view.storeScore.staves.length;
  let addStave = false;
  let partName = '';
  let partAbbreviation = '';
  // counting from 1, starting after the last staff
  let staffLocation = staffCount + 1;
  const addStaveCb = () => {
    addStave = !addStave;
  }
  const setStaffId = (location: number) => {
    staffLocation = clampPartLocation(location, staffCount);
  }
  const setName = (value: string) => {
    partName = value;
  }
  const setAbbreviation = (value: string) => {
    partAbbreviation = value;
  }
  const commitCb = async () => {
    await parameters.view.createPart({
      location: staffLocation,
      instrument,
      twoStaves: addStave,
      name: partName,
      instrumentLabel: instrumentLabelFor(instrument.instrument),
      abbreviation: partAbbreviation
    });
  }
  const cancelCb = async () => {
  }

  const getInstrument = () => instrument;
  const appParams = {
    domId: replaceVueRoot(modalContainerId),
    label: 'Create Part',
    staffLength: staffCount,
    getInstrument,
    addStaveCb,
    setStaffId,
    setName,
    setAbbreviation
  }
  const rootId = replaceVueRoot(modalContainerId);
  InstallDialog({
      app: newPartApp,
      appParams,
      root: rootId,
      dialogParams: parameters,
      commitCb,
      cancelCb
    });
}
